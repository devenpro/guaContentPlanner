  // ============================================================
  // AI SUGGEST SITEMAP PRIORITIES (P1 / P2 / P3)
  // ============================================================
  //
  // Sends the sitemap pages (url, title, GSC metrics if present, group) to
  // the LLM and asks it to assign P1/P2/P3 per page based on traffic /
  // revenue / link-worthiness signals. Not based on pillar/cluster
  // structure — priority is a strategic judgement.
  //
  // Preview modal: user sees proposed changes per-page + reason, can
  // Accept all / Reject all / deselect individual rows before applying.
  //
  // Batches pages into chunks of 40 so large sitemaps don't blow the
  // context window.

  var SUGGEST_PRIORITY_BATCH = 40;

  function suggestSitemapPriorities() {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var sm = (S.data && S.data.sitemap) || { pages: [] };
    var pages = (sm.pages || []).filter(function(p) { return p.status !== 'removed'; });
    if (!pages.length) { toast('Import sitemap pages first', 'warning'); return; }

    // Batch to keep individual prompts small
    var batches = [];
    for (var i = 0; i < pages.length; i += SUGGEST_PRIORITY_BATCH) {
      batches.push(pages.slice(i, i + SUGGEST_PRIORITY_BATCH));
    }

    var proposals = [];
    var completed = 0;
    var errored = 0;

    var buildPrompt = function(batchIndex) {
      var batch = batches[batchIndex];
      var prompt = 'Assign a priority tier (P1 / P2 / P3) to each page below.\n\n';
      prompt += 'Priority meaning:\n';
      prompt += '  P1 = HIGH — strategically important for traffic, revenue, or attracting inbound links. Worth investing internal-link equity and (later) off-page outreach.\n';
      prompt += '  P2 = MEDIUM — supporting content that helps topical depth but isn\'t a primary revenue / traffic driver.\n';
      prompt += '  P3 = STANDARD — evergreen or informational baseline; doesn\'t need special link-building attention.\n\n';
      prompt += 'Signals to use (in order of weight):\n';
      prompt += '  1. Traffic potential (GSC clicks / impressions / position / CTR if provided)\n';
      prompt += '  2. Commercial / revenue signal implied by URL + title (product / pricing / comparison pages skew higher)\n';
      prompt += '  3. Link-worthiness (definitive guides, original research, pillars skew higher)\n';
      prompt += '  4. Topical importance (reflected in the page\'s group name)\n\n';
      prompt += 'Do NOT assume every page is P1 — most should be P3. Only the top ~15-20% deserve P1.\n\n';
      prompt += '=== PAGES (batch ' + (batchIndex + 1) + '/' + batches.length + ') ===\n';
      for (var j = 0; j < batch.length; j++) {
        var p = batch[j];
        var line = 'id=' + p.id + ' | ' + (p.title || '(no title)') + ' | ' + p.url;
        if (p.clicks || p.impressions || p.position || p.ctr) {
          line += ' | clicks=' + (p.clicks || 0) + ' imp=' + (p.impressions || 0) + ' pos=' + (p.position || 0).toFixed(1) + ' ctr=' + (p.ctr || 0).toFixed(2) + '%';
        }
        var g = p.group_id && S.sitemapGroupMap ? S.sitemapGroupMap[p.group_id] : null;
        if (g) line += ' | group=' + g.name;
        prompt += line + '\n';
      }
      prompt += brandSnippet('seo');
      prompt += '\n\nRespond ONLY as JSON:\n';
      prompt += '{"pages":[{"id":"sp_xxx","priority":1,"reason":"1-sentence rationale"}]}';
      return prompt;
    };

    // Pull custom instructions saved by the preflight on batch 0 — append to
    // every subsequent batch so the user's steering applies across all calls.
    var savedInstructions = function() {
      var pa = ((S.meta.aiPreferences || {}).perAction || {})['ai-suggest-priorities'];
      var ins = pa && pa.instructions ? pa.instructions.trim() : '';
      return ins ? '\n\n--- Additional user instructions ---\n' + ins : '';
    };

    var handleBatchResult = function(text, batchIndex) {
      var parsed = parseJSON(text) || {};
      var arr = (parsed.pages || []).filter(function(x) {
        return x && x.id && (x.priority === 1 || x.priority === 2 || x.priority === 3);
      });
      proposals = proposals.concat(arr);
      completed++;
      runBatch(batchIndex + 1);
    };
    var handleBatchError = function(err, batchIndex) {
      errored++;
      console.warn('[WCP] suggest-priorities batch ' + (batchIndex + 1) + ' failed:', err);
      runBatch(batchIndex + 1);
    };

    var runBatch = function(batchIndex) {
      if (batchIndex >= batches.length) {
        if (proposals.length === 0) {
          toast('AI returned no usable proposals' + (errored ? ' (' + errored + ' batches errored)' : ''), 'error');
          return;
        }
        _openSuggestPriorityModal(proposals);
        return;
      }
      var prompt = buildPrompt(batchIndex);
      // Subsequent batches (>0) reuse provider/model + instructions from batch 0
      if (batchIndex > 0) {
        callAIWithRetry(prompt + savedInstructions(),
          function(text) { handleBatchResult(text, batchIndex); },
          function(err)  { handleBatchError(err, batchIndex); },
          'ai-suggest-priorities', BrandService.getSystemPrompt('seo'));
        return;
      }
      // Batch 0 — run through preflight (asks once, applies for all batches)
      _wcpAIPreflight.run({
        actionId: 'ai-suggest-priorities',
        title: 'Suggest sitemap priorities',
        description: 'AI will assign P1/P2/P3 to ' + pages.length + ' page' + (pages.length !== 1 ? 's' : '') + ' across ' + batches.length + ' batch' + (batches.length !== 1 ? 'es' : '') + '. You\'ll review proposed changes before applying.',
        basePrompt: prompt,
        systemPrompt: BrandService.getSystemPrompt('seo'),
        onResult: function(text) {
          if (batches.length > 1) toast('Batch 1/' + batches.length + ' done — running rest…', 'info');
          handleBatchResult(text, batchIndex);
        },
        onError: function(err) { handleBatchError(err, batchIndex); }
      });
    };

    runBatch(0);
  }

  // Preview modal — show proposals with a checkbox per row. Accept applies
  // checked changes; cancel discards all.
  function _openSuggestPriorityModal(proposals) {
    // Filter out proposals that match the current priority (nothing to change)
    var changes = [];
    for (var i = 0; i < proposals.length; i++) {
      var pg = S.sitemapPageMap[proposals[i].id];
      if (!pg) continue;
      var current = pg.priority;
      if (current === proposals[i].priority) continue;  // already set correctly
      changes.push({ page: pg, proposed: proposals[i].priority, reason: proposals[i].reason || '', current: current });
    }
    if (!changes.length) {
      toast('AI reviewed the sitemap — no priority changes suggested', 'info', 4000);
      return;
    }

    var PR = Constants.SITEMAP_PRIORITIES;
    var html = '<div class="wcp-priopose">';
    html += '<div class="wcp-priopose-hint">' + icon('circle-info') + ' Review the AI\'s proposed priorities. Uncheck any you disagree with, then click Apply.</div>';
    html += '<div class="wcp-priopose-head">';
    html += '<label><input type="checkbox" id="wcpPrioposeAll" checked> Select all (' + changes.length + ')</label>';
    html += '</div>';
    html += '<div class="wcp-priopose-list">';
    for (var j = 0; j < changes.length; j++) {
      var ch = changes[j];
      var curCfg = (ch.current === 1 || ch.current === 2 || ch.current === 3) ? PR[String(ch.current)] : null;
      var propCfg = PR[String(ch.proposed)];
      html += '<div class="wcp-priopose-row">';
      html += '<label class="wcp-priopose-check"><input type="checkbox" class="wcp-priopose-apply" data-page-id="' + esc(ch.page.id) + '" data-priority="' + ch.proposed + '" checked><span></span></label>';
      html += '<div class="wcp-priopose-main">';
      html += '<div class="wcp-priopose-title">' + esc(ch.page.title || ch.page.url) + '</div>';
      html += '<div class="wcp-priopose-url">' + esc(ch.page.url) + '</div>';
      if (ch.reason) html += '<div class="wcp-priopose-reason">' + icon('info-circle') + ' ' + esc(ch.reason) + '</div>';
      html += '</div>';
      html += '<div class="wcp-priopose-transition">';
      if (curCfg) {
        html += '<span class="wcp-sitemap-pri-pill" style="background:' + curCfg.color + '">' + curCfg.label + '</span>';
      } else {
        html += '<span class="wcp-priopose-unset">Unset</span>';
      }
      html += '<span class="wcp-priopose-arrow">→</span>';
      html += '<span class="wcp-sitemap-pri-pill" style="background:' + propCfg.color + '">' + propCfg.label + '</span>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div></div>';

    openModal('AI Priority Suggestions — ' + changes.length + ' proposed', html, {
      size: 'lg',
      saveLabel: 'Apply selected',
      onSave: function() {
        var applied = 0;
        $('.wcp-priopose-apply:checked').each(function() {
          var pid = $(this).data('page-id');
          var pri = parseInt($(this).data('priority'), 10);
          if (!pid || !(pri >= 1 && pri <= 3)) return;
          if (typeof window._wcpSetSitemapPagePriority === 'function') {
            window._wcpSetSitemapPagePriority(pid, pri);
            applied++;
          }
        });
        closeModal();
        if (applied) {
          toast('Applied ' + applied + ' priority change' + (applied !== 1 ? 's' : ''), 'success');
          if (S.currentView === 'sitemap' && window._wcpRender) window._wcpRender();
        }
      }
    });

    // "Select all" toggle
    $(document).off('change.wcp-priopose-all').on('change.wcp-priopose-all', '#wcpPrioposeAll', function() {
      $('.wcp-priopose-apply').prop('checked', this.checked);
    });
  }

  // Expose for the Part 1 event handler
  window._wcpSuggestSitemapPriorities = suggestSitemapPriorities;
