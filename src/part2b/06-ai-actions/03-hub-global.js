  // ============================================================
  // SECTION 8: AI ACTIONS — HUB, CLUSTER & GLOBAL
  // ============================================================


  // aiSuggestHubs — richer version that returns hub skeletons with suggested
  // clusters, target audience, intent mix, keywords, and strategic rationale.
  // The rendered cards allow either "Quick add" (creates hub + checked
  // clusters in one shot) or "Refine in Wizard" (pipes the suggestion into
  // the New Hub Wizard pre-filled at Step 2 for editing before commit).
  function aiSuggestHubs() {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var existing = (S.data.hubs || []).map(function(h) { return h.name; });
    var prompt = 'Suggest 4 to 6 new content hub topics for a website content strategy. Think like a topical-authority strategist: each hub should anchor 5-10 tightly related cluster pages.\n';
    if (existing.length) prompt += 'NEVER suggest these (they already exist): ' + existing.join(', ') + '\n';
    prompt += brandSnippet('research');
    prompt += '\n\nFor each hub return:\n';
    prompt += '  - name: short, publishable hub title (2-5 words)\n';
    prompt += '  - description: 2-3 sentence overview of what this hub covers\n';
    prompt += '  - pillar_keyword: the #1 keyword this hub ranks for\n';
    prompt += '  - target_audience: 1 sentence (who is this for?)\n';
    prompt += '  - search_intent_mix: object with approx. fractions summing to 1.0: {"informational":0.6,"commercial":0.3,"transactional":0.1}\n';
    prompt += '  - keywords: array of 3-5 seed topics / secondary keywords\n';
    prompt += '  - rationale: 1 sentence on why this hub fills a coverage gap\n';
    prompt += '  - suggested_clusters: array of 4-5 cluster ideas, each {"name":"...","description":"one sentence","keywords":["...","..."]}\n';
    prompt += '\nRespond ONLY as JSON: {"hubs":[{"name":"...","description":"...","pillar_keyword":"...","target_audience":"...","search_intent_mix":{"informational":0.6,"commercial":0.3,"transactional":0.1},"keywords":["..."],"rationale":"...","suggested_clusters":[{"name":"...","description":"...","keywords":["..."]}]}]}';
    _wcpAIPreflight.run({
      actionId: 'ai-suggest-hubs',
      title: 'Suggest content hubs',
      description: 'AI will propose 4-6 new hub topics with suggested clusters.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('research'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var hubs = (parsed.hubs || []).filter(function(h) { return h && h.name; });
        if (!hubs.length) { toast('No hub suggestions returned', 'warning'); return; }
        S._lastHubSuggestions = hubs;
        var html = '<div class="wcp-hub-suggestions">';
        html += '<div class="wcp-text-xs wcp-text-muted" style="margin-bottom:var(--wcp-space-2)">' + icon('circle-info') + ' ' + hubs.length + ' hub idea' + (hubs.length === 1 ? '' : 's') + ' — each has suggested clusters you can include or skip.</div>';
        for (var i = 0; i < hubs.length; i++) html += renderHubSuggestionCard(hubs[i], i);
        html += '</div>';
        openModal('Suggested Hubs', html, { size: 'lg', footer: false });
        logActivity('ai_action', '', '', 'AI suggested ' + hubs.length + ' hubs');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  // Shared hub-suggestion card renderer. Also used by the New Hub Wizard
  // Step 2 to render the AI-generated hub preview + editable cluster list.
  function renderHubSuggestionCard(h, idx) {
    var mix = h.search_intent_mix || {};
    var infoPct = Math.round(((mix.informational || 0) * 100));
    var commPct = Math.round(((mix.commercial    || 0) * 100));
    var transPct = Math.round(((mix.transactional || 0) * 100));
    // Normalise: if any is missing, fill from the rest; if all 0, show 100% info.
    var total = infoPct + commPct + transPct;
    if (total === 0) { infoPct = 100; total = 100; }

    var clusters = Array.isArray(h.suggested_clusters) ? h.suggested_clusters : [];
    var clusterCount = clusters.length;

    var html = '<div class="wcp-hs-card" data-hub-idx="' + idx + '">';

    // Header row
    html += '<div class="wcp-hs-header">';
    html += '<div class="wcp-hs-title-wrap">';
    html += '<div class="wcp-hs-title">' + esc(h.name || '') + '</div>';
    if (h.pillar_keyword) html += '<span class="wcp-badge" style="background:var(--wcp-hub)15;color:var(--wcp-hub)">' + icon('key') + ' ' + esc(h.pillar_keyword) + '</span>';
    if (h.target_audience) html += '<span class="wcp-badge" style="background:var(--wcp-accent)15;color:var(--wcp-accent)">' + icon('users') + ' ' + esc(truncate(h.target_audience, 40)) + '</span>';
    html += '</div></div>';

    // Description + rationale
    if (h.description) html += '<div class="wcp-hs-desc">' + esc(h.description) + '</div>';
    if (h.rationale)   html += '<div class="wcp-hs-rationale">' + icon('lightbulb') + ' ' + esc(h.rationale) + '</div>';

    // Intent mix bar
    if (total > 0) {
      html += '<div class="wcp-hs-intent-mix" title="Search intent mix">';
      html += '<div class="wcp-hs-bar">';
      if (infoPct)  html += '<div class="wcp-hs-bar-seg" style="width:' + infoPct + '%;background:var(--wcp-hub)" title="Informational ' + infoPct + '%"></div>';
      if (commPct)  html += '<div class="wcp-hs-bar-seg" style="width:' + commPct + '%;background:var(--wcp-accent)" title="Commercial ' + commPct + '%"></div>';
      if (transPct) html += '<div class="wcp-hs-bar-seg" style="width:' + transPct + '%;background:var(--wcp-success)" title="Transactional ' + transPct + '%"></div>';
      html += '</div>';
      html += '<div class="wcp-hs-bar-legend">';
      if (infoPct)  html += '<span><span class="wcp-hs-dot" style="background:var(--wcp-hub)"></span>Info ' + infoPct + '%</span>';
      if (commPct)  html += '<span><span class="wcp-hs-dot" style="background:var(--wcp-accent)"></span>Comm ' + commPct + '%</span>';
      if (transPct) html += '<span><span class="wcp-hs-dot" style="background:var(--wcp-success)"></span>Trans ' + transPct + '%</span>';
      html += '</div>';
      html += '</div>';
    }

    // Keyword chips
    if (h.keywords && h.keywords.length) {
      html += '<div class="wcp-hs-keywords">';
      for (var ki = 0; ki < Math.min(h.keywords.length, 6); ki++) {
        html += '<span class="wcp-badge" style="background:var(--wcp-cluster)15;color:var(--wcp-cluster)">' + icon('tag') + ' ' + esc(h.keywords[ki]) + '</span>';
      }
      html += '</div>';
    }

    // Cluster checklist (collapsible when >0)
    if (clusterCount > 0) {
      html += '<details class="wcp-hs-clusters" open>';
      html += '<summary>' + icon('sitemap') + ' Suggested clusters <span class="wcp-hs-count">' + clusterCount + '</span></summary>';
      html += '<div class="wcp-hs-cluster-list">';
      for (var ci = 0; ci < clusters.length; ci++) {
        var cluster = clusters[ci];
        var cluKw = Array.isArray(cluster.keywords) ? cluster.keywords.slice(0, 3).join(', ') : '';
        html += '<label class="wcp-hs-cluster-row">';
        html += '<input type="checkbox" class="wcp-hs-cluster-cb" data-hub-idx="' + idx + '" data-cluster-idx="' + ci + '" checked>';
        html += '<div class="wcp-hs-cluster-body">';
        html += '<div class="wcp-hs-cluster-name">' + esc(cluster.name || '') + '</div>';
        if (cluster.description) html += '<div class="wcp-hs-cluster-desc">' + esc(cluster.description) + '</div>';
        if (cluKw) html += '<div class="wcp-hs-cluster-kw">' + icon('key') + ' ' + esc(cluKw) + '</div>';
        html += '</div></label>';
      }
      html += '</div></details>';
    }

    // Footer: actions
    html += '<div class="wcp-hs-footer">';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-outline" data-action="hub-suggest-refine" data-hub-idx="' + idx + '">' + icon('wand-magic-sparkles') + ' Refine in Wizard</button>';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-primary" data-action="hub-suggest-quick-add" data-hub-idx="' + idx + '">' + icon('plus') + ' Quick add</button>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  // Export so the wizard can re-render its Step 2 preview with identical styling.
  window._wcpRenderHubSuggestionCard = renderHubSuggestionCard;

  // Fired by the New Hub Wizard at Step 2 transition. Takes the user's own
  // hub name + freeform brief and returns the same rich schema as
  // aiSuggestHubs (a single hub with suggested_clusters). onSuccess is
  // called with the parsed hub object; onError with the error message.
  function aiEnrichHubWithClusters(hubName, initialPrompt, onSuccess, onError) {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); if (onError) onError('no-providers'); return; }

    var existing = (S.data.hubs || []).map(function(h) { return h.name; }).filter(Boolean);
    var prompt = 'You are helping the user create a new content hub for their website.\n\n';
    prompt += 'Hub name (user chose this): ' + (hubName || '') + '\n';
    if (initialPrompt) prompt += 'User brief: ' + initialPrompt + '\n';
    if (existing.length) prompt += 'Existing hubs (for context — do NOT duplicate their scope): ' + existing.join(', ') + '\n';
    prompt += brandSnippet('research');
    prompt += '\n\nExpand the hub into full strategic details and propose 5-7 clusters that together cover the hub comprehensively. Each cluster should be a distinct sub-topic that can anchor 3-5 content pieces.\n';
    prompt += '\nReturn a single hub (not an array) with:\n';
    prompt += '  - name: the user-provided hub name (exactly as given)\n';
    prompt += '  - description: 2-3 sentence description\n';
    prompt += '  - pillar_keyword: the #1 SEO keyword for this hub\n';
    prompt += '  - target_audience: 1 sentence describing who this hub serves\n';
    prompt += '  - search_intent_mix: object with approximate fractions summing to 1.0: {"informational":0.6,"commercial":0.3,"transactional":0.1}\n';
    prompt += '  - keywords: array of 5-8 secondary keywords / topic pillars\n';
    prompt += '  - rationale: 1 sentence on why this hub matters strategically\n';
    prompt += '  - suggested_clusters: array of 5-7 cluster ideas, each {"name":"...","description":"one sentence","keywords":["...","..."]}\n';
    prompt += '\nRespond ONLY as JSON: {"hub":{"name":"...","description":"...","pillar_keyword":"...","target_audience":"...","search_intent_mix":{"informational":0.6,"commercial":0.3,"transactional":0.1},"keywords":["..."],"rationale":"...","suggested_clusters":[{"name":"...","description":"...","keywords":["..."]}]}}';

    callAIWithRetry(prompt, function(text) {
      var parsed = parseJSON(text);
      var h = parsed && parsed.hub;
      if (!h || !h.name) { if (onError) onError('no-hub-in-response'); else toast('AI did not return a valid hub', 'error'); return; }
      // Force the user-chosen name to win over any AI drift
      h.name = hubName || h.name;
      if (onSuccess) onSuccess(h);
    }, function(err) {
      if (onError) onError(err);
      else toast('AI Error: ' + err, 'error');
    }, 'ai-enrich-hub', BrandService.getSystemPrompt('research'));
  }

  window._wcpAiEnrichHubWithClusters = aiEnrichHubWithClusters;

  function aiEnrichCluster(clusterId) {
    var cl = S.clusterMap[clusterId]; if (!cl) return;
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var hub = S.hubMap[cl.hub_id];
    var prompt = 'Provide exactly 10 target keywords for this content cluster.\n\nCluster: ' + esc(cl.name) + '\n';
    if (hub) prompt += 'Hub: ' + hub.name + '\n';
    if (cl.keywords && cl.keywords.length) prompt += 'Current keywords (do NOT repeat): ' + cl.keywords.join(', ') + '\n';
    prompt += brandSnippet('seo');
    prompt += '\n\nReturn 10 keywords ranked by SEO value (high commercial intent first, long-tail informational last).\n\nRespond ONLY as JSON: {"keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8","kw9","kw10"]}';
    _wcpAIPreflight.run({
      actionId: 'ai-enrich-cluster',
      title: 'Enrich cluster keywords',
      description: 'AI will return 10 SEO-ranked keywords for "' + (cl.name || 'this cluster') + '".',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('seo'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        if (parsed.keywords && parsed.keywords.length) cl.keywords = parsed.keywords;
        cl.updated = new Date().toISOString();
        logActivity('cluster_updated', cl.id, cl.name, 'AI enriched cluster');
        snapshot('AI enrich cluster'); buildMaps(); syncToTextarea(); render();
        toast('Cluster enriched with ' + (parsed.keywords || []).length + ' keywords', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function aiSuggestTags() {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    // Step 1: Show options modal
    var optHtml = '<div class="wcp-editor-form">';
    optHtml += '<div class="wcp-form-group"><label>Number of Tags</label><select class="wcp-select" data-field="count">';
    [5, 10, 15].forEach(function(n) { optHtml += '<option value="' + n + '"' + (n === 10 ? ' selected' : '') + '>' + n + ' tags</option>'; });
    optHtml += '</select></div>';
    optHtml += '<div class="wcp-form-group"><label>Focus Area (optional)</label><input type="text" class="wcp-input" data-field="focus" placeholder="e.g. content lifecycle, difficulty levels, topic areas..."></div>';
    optHtml += '</div>';
    openModal('AI Tag Suggestions', optHtml, {
      saveLabel: icon('sparkles') + ' Generate',
      onSave: function() {
        var f = collectModalFields();
        var count = parseInt(f.count, 10) || 10;
        var focus = f.focus || '';
        closeModal();
        _runTagSuggestion(count, focus);
      }
    });
  }

  function _runTagSuggestion(count, focus) {
    var existing = (S.data.tags || []).map(function(t) { return t.name; }).join(', ');
    var contentTitles = (S.data.content || []).map(function(c) { return c.title; }).slice(0, 10).join('; ');
    var prompt = 'Suggest ' + count + ' organizational tags.\n\n';
    if (existing) prompt += 'Do NOT duplicate these existing tags: ' + existing + '\n';
    if (contentTitles) prompt += 'Sample content titles: ' + contentTitles + '\n';
    if (focus) prompt += 'Focus area: ' + focus + '\n';
    prompt += brandSnippet('research');
    prompt += '\n\nGroup tags by category. Each tag must be reusable across multiple content pieces.\n\nRespond ONLY as JSON: {"tags":[{"name":"Tag Name","group":"Category","description":"1 sentence"}]}';
    _wcpAIPreflight.run({
      actionId: 'ai-suggest-tags',
      title: 'Suggest tags',
      description: 'AI will generate ' + count + ' organizational tag' + (count !== 1 ? 's' : '') + (focus ? ' (focus: ' + focus + ')' : '') + '.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('content'),
      onResult: function(text) {
      var parsed = parseJSON(text);
      var suggestions = parsed.tags || [];
      if (!suggestions.length) { toast('No tag suggestions generated', 'warning'); return; }
      // Step 2: Show selection modal
      var selHtml = '<div class="wcp-editor-form">';
      selHtml += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Select the tags you want to create. Uncheck any you don\'t need.</p>';
      for (var i = 0; i < suggestions.length; i++) {
        var tg = suggestions[i];
        selHtml += '<label class="wcp-radio-item" style="cursor:pointer;display:flex;align-items:flex-start;gap:var(--wcp-space-2);padding:var(--wcp-space-2) var(--wcp-space-3);border:1px solid var(--wcp-border-light);border-radius:var(--wcp-radius-md);margin-bottom:var(--wcp-space-2)">';
        selHtml += '<input type="checkbox" class="wcp-tag-select" data-tag-idx="' + i + '" checked style="margin-top:3px;flex-shrink:0">';
        selHtml += '<div style="flex:1;min-width:0">';
        selHtml += '<div style="font-weight:600;font-size:var(--wcp-font-size-sm)">' + esc(tg.name || '') + '</div>';
        selHtml += '<div style="display:flex;gap:var(--wcp-space-1);margin-top:2px">' + badge(tg.group || 'General', 'var(--wcp-accent)') + '</div>';
        if (tg.description) selHtml += '<div class="wcp-text-sm wcp-text-muted" style="margin-top:2px">' + esc(tg.description) + '</div>';
        selHtml += '</div></label>';
      }
      selHtml += '</div>';
      openModal('Select Tags to Create (' + suggestions.length + ' suggested)', selHtml, {
        size: 'lg',
        saveLabel: icon('check') + ' Create Selected Tags',
        onSave: function() {
          var created = 0;
          S.data.tags = S.data.tags || [];
          $('.wcp-tag-select:checked').each(function() {
            var idx = parseInt($(this).data('tag-idx'), 10);
            var tg = suggestions[idx];
            if (!tg || !tg.name) return;
            // Check if tag already exists
            var exists = S.data.tags.some(function(t) { return t.name.toLowerCase() === tg.name.toLowerCase(); });
            if (exists) return;
            var colorIdx = (S.data.tags.length + created) % Constants.HUB_COLORS.length;
            S.data.tags.push({
              id: generateId('tag'),
              name: tg.name.trim(),
              color: Constants.HUB_COLORS[colorIdx].color,
              group: (tg.group || 'General').trim(),
              description: tg.description || '',
              created: new Date().toISOString()
            });
            created++;
          });
          if (created > 0) {
            logActivity('ai_action', '', '', 'AI created ' + created + ' tags');
            snapshot('AI create tags'); buildMaps(); closeModal(); syncToTextarea(); render();
            toast('Created ' + created + ' tags', 'success');
          } else {
            closeModal();
            toast('No new tags created (all already exist or none selected)', 'info');
          }
        }
      });
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function aiBuildTemplate() {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var types = (S.data.content_types || []).map(function(t) { return t.name; }).join(', ');
    var prompt = 'Create a content template with exactly 5 sections.\n';
    if (types) prompt += 'Available content types: ' + types + '\n';
    prompt += brandSnippet('content');
    prompt += '\n\nEach section needs: name (short), instructions (1-2 sentences telling the writer what to do).\nThe Template editor lets the user fill heading_level / section_type / est_words later — keep this output lean.\n\nRespond ONLY as JSON: {"name":"Template Name","content_type":"matching type from list above","description":"1 sentence","sections":[{"name":"Section Name","instructions":"writing instructions"}]}';
    _wcpAIPreflight.run({
      actionId: 'ai-build-template',
      title: 'Build content template',
      description: 'AI will draft a 5-section content template.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('content'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var tplName = parsed.name || 'AI Template';
        var tplDesc = parsed.description || '';
        var sections = (parsed.sections || []).map(function(s) {
          return { name: s.name || '', instructions: s.instructions || '', heading_level: 'H2', section_type: 'body', est_words: 200 };
        });
        if (!sections.length) { toast('AI returned no sections', 'warning'); return; }
        // Preview modal — let user edit name/description, deselect sections, then save.
        var html = '<div class="wcp-editor-form">';
        html += '<div class="wcp-form-group"><label>Template Name</label>';
        html += '<input type="text" class="wcp-input" data-field="tplName" value="' + esc(tplName) + '"></div>';
        html += '<div class="wcp-form-group"><label>Description</label>';
        html += '<input type="text" class="wcp-input" data-field="tplDesc" value="' + esc(tplDesc) + '"></div>';
        html += '<div class="wcp-form-group"><label>Sections (' + sections.length + ' suggested) <span class="wcp-form-hint">— uncheck any you don\'t want</span></label>';
        html += '<div style="display:flex;flex-direction:column;gap:var(--wcp-space-2);max-height:340px;overflow:auto;padding:var(--wcp-space-2);background:var(--wcp-gray-50);border-radius:var(--wcp-radius-md)">';
        for (var si = 0; si < sections.length; si++) {
          var s = sections[si];
          html += '<label style="display:flex;align-items:flex-start;gap:var(--wcp-space-2);padding:var(--wcp-space-2);background:var(--wcp-white);border:1px solid var(--wcp-border-light);border-radius:var(--wcp-radius-sm);cursor:pointer">';
          html += '<input type="checkbox" class="wcp-tpl-section-cb" data-idx="' + si + '" checked style="margin-top:3px;flex-shrink:0">';
          html += '<div style="flex:1;min-width:0">';
          html += '<div style="font-weight:600;font-size:var(--wcp-font-size-sm)">' + esc(s.name) + '</div>';
          if (s.instructions) html += '<div class="wcp-text-xs wcp-text-muted" style="margin-top:2px">' + esc(s.instructions) + '</div>';
          html += '</div></label>';
        }
        html += '</div></div>';
        html += '</div>';
        openModal('Preview Template — ' + esc(tplName), html, {
          size: 'lg',
          saveLabel: icon('check') + ' Create Template',
          onSave: function() {
            var f = collectModalFields();
            var finalName = (f.tplName || tplName).trim() || 'AI Template';
            var finalDesc = (f.tplDesc || tplDesc).trim();
            var finalSections = [];
            $('.wcp-tpl-section-cb:checked').each(function() {
              var idx = parseInt($(this).data('idx'), 10);
              if (sections[idx]) finalSections.push(sections[idx]);
            });
            if (!finalSections.length) { toast('Select at least one section', 'warning'); return; }
            var tpl = {
              id: generateId('tpl'), name: finalName,
              content_type_id: '', description: finalDesc, uses_count: 0,
              sections: finalSections
            };
            S.data.templates = S.data.templates || [];
            S.data.templates.push(tpl);
            logActivity('template_created', tpl.id, tpl.name, 'AI built template with ' + tpl.sections.length + ' sections');
            snapshot('AI template'); buildMaps(); syncToTextarea();
            closeModal();
            render();
            toast('Template "' + tpl.name + '" created with ' + tpl.sections.length + ' section' + (tpl.sections.length !== 1 ? 's' : ''), 'success');
          }
        });
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  // aiSuggestContent — per-cluster content idea generation.
  //
  // Fires from the "Suggest" button on each cluster card in the Hubs view.
  // Two-phase behaviour:
  //   1. If the cluster already has persisted suggestions, open the panel
  //      immediately so the user sees their prior list (adopted + unused).
  //   2. Otherwise, call the LLM, APPEND the result objects onto
  //      cluster.ai_suggestions (dedup by title), persist, open the panel.
  //
  // Suggestions are stored as full objects (not just titles) so the user can
  // return to the panel, delete individual rows, or adopt more without
  // regenerating. Each suggestion carries a stable `id` so the adopt /
  // delete handlers can target it.
  function aiSuggestContent(clusterId) {
    var cl = S.clusterMap[clusterId]; if (!cl) return;
    cl.ai_suggestions = Array.isArray(cl.ai_suggestions) ? cl.ai_suggestions : [];

    // Phase 1 — just show the panel if there's already something to review.
    if (cl.ai_suggestions.length > 0) {
      openClusterSuggestionsPanel(clusterId);
      return;
    }

    // Phase 2 — cold generation.
    _runClusterSuggestionGeneration(cl, { onComplete: function() { openClusterSuggestionsPanel(clusterId); } });
  }

  // Internal: fire the LLM call and append results to cluster.ai_suggestions.
  // Used both by cold generation (aiSuggestContent with empty list) and by
  // the "Generate more" button on the panel.
  function _runClusterSuggestionGeneration(cl, opts) {
    opts = opts || {};
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var hub = S.hubMap[cl.hub_id];

    // Dedup context: existing content titles in this cluster + titles of
    // suggestions we already have on record (regardless of used/unused).
    var existingContent = getClusterContent(cl.id).map(function(c) { return c.title; }).filter(Boolean);
    var priorTitles = (cl.ai_suggestions || []).map(function(s) { return s.title; }).filter(Boolean);
    // Back-compat with the legacy string-only stash that some clusters may
    // still carry from before the full-object shape existed.
    var legacy = (cl.ai_suggested_titles || []).slice(-20);
    var dedupList = existingContent.concat(priorTitles).concat(legacy);

    var prompt = 'Suggest 6 new content pieces for this cluster. Each must be distinct, specific, and fill a real gap.\n\n';
    prompt += 'Cluster: ' + (cl.name || '') + '\n';
    if (cl.keywords && cl.keywords.length) {
      var kwNames = cl.keywords.map(function(k) { return typeof k === 'string' ? k : (k.keyword || ''); }).filter(Boolean).join(', ');
      if (kwNames) prompt += 'Target keywords: ' + kwNames + '\n';
    }
    if (hub) {
      prompt += 'Hub: ' + hub.name;
      if (hub.pillar_keyword) prompt += ' (pillar keyword: ' + hub.pillar_keyword + ')';
      prompt += '\n';
    }
    if (dedupList.length) prompt += 'Already covered (do NOT duplicate or rephrase these): ' + dedupList.join('; ') + '\n';
    prompt += brandSnippet('research');
    prompt += '\n\nFor each suggestion return:\n';
    prompt += '  - title: specific, publishable headline (6-12 words)\n';
    prompt += '  - search_intent: one of informational / commercial / transactional / navigational\n';
    prompt += '  - content_type: one of Blog Post, Ultimate Guide, Landing Page, Case Study, Comparison, How-To\n';
    prompt += '  - keywords: array of 3-5 target keywords this piece should rank for\n';
    prompt += '  - rationale: 1 short sentence on why this fills a gap\n';
    prompt += '\nRespond ONLY as JSON: {"ideas":[{"title":"...","search_intent":"...","content_type":"...","keywords":["...","..."],"rationale":"..."}]}';

    _wcpAIPreflight.run({
      actionId: 'ai-suggest-content',
      title: 'Suggest content ideas',
      description: 'AI will propose 6 new content ideas for "' + (cl.name || 'this cluster') + '".',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('research'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var ideas = (parsed.ideas || []).filter(function(x) { return x && x.title; });
        if (!ideas.length) { toast('No ideas returned', 'warning'); return; }

        var knownLc = {};
        cl.ai_suggestions.forEach(function(s) { if (s && s.title) knownLc[s.title.toLowerCase()] = true; });
        (cl.ai_suggested_titles || []).forEach(function(t) { if (t) knownLc[(t + '').toLowerCase()] = true; });

        var now = new Date().toISOString();
        var added = 0;
        for (var i = 0; i < ideas.length; i++) {
          var idea = ideas[i];
          var key = (idea.title || '').toLowerCase();
          if (!key || knownLc[key]) continue;
          knownLc[key] = true;
          cl.ai_suggestions.push({
            id: generateId('sg'),
            title: idea.title,
            search_intent: idea.search_intent || '',
            content_type: idea.content_type || '',
            keywords: Array.isArray(idea.keywords) ? idea.keywords.slice() : [],
            rationale: idea.rationale || '',
            created: now,
            used_content_id: null
          });
          added++;
        }

        cl.ai_suggested_titles = (cl.ai_suggested_titles || []).concat(ideas.map(function(i) { return i.title; })).slice(-40);
        cl.updated = now;
        buildMaps(); syncToTextarea();

        logActivity('ai_action', cl.id, cl.name, 'AI suggested ' + added + ' content ideas (' + (ideas.length - added) + ' duplicates skipped)');
        toast('Added ' + added + ' idea' + (added === 1 ? '' : 's') + ' to "' + truncate(cl.name, 24) + '"', 'success');
        if (opts.onComplete) opts.onComplete();
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  // Render the Suggestions panel. Uses a modal shell but rebuilds the body
  // in place (no close-on-adopt) so the user can adopt multiple suggestions
  // back-to-back. Adoption marks a row as Used; the row stays visible with a
  // green "Used" chip linking to the new content.
  function openClusterSuggestionsPanel(clusterId) {
    var cl = S.clusterMap[clusterId]; if (!cl) return;
    cl.ai_suggestions = Array.isArray(cl.ai_suggestions) ? cl.ai_suggestions : [];
    openModal('Content Ideas — ' + esc(cl.name), renderClusterSuggestionsPanelBody(cl), {
      size: 'lg',
      footer: false,
      dataCluster: cl.id   // consumed by the re-render helper (see below)
    });
  }

  // Rebuild just the inner body — used after adopt / delete / generate-more
  // to refresh counts + rows without destroying the modal shell.
  function refreshClusterSuggestionsPanel(clusterId) {
    var cl = S.clusterMap[clusterId]; if (!cl) return;
    var $body = $('.wcp-modal .wcp-modal-body .wcp-cluster-suggestions');
    if (!$body.length) return;  // modal not open
    $body.replaceWith(renderClusterSuggestionsPanelBody(cl));
  }

  function renderClusterSuggestionsPanelBody(cl) {
    var all = cl.ai_suggestions || [];
    var unused = all.filter(function(s) { return !s.used_content_id; });
    var used   = all.filter(function(s) { return  s.used_content_id; });
    var html = '<div class="wcp-cluster-suggestions">';

    // Header strip with counts + actions
    html += '<div class="wcp-cs-header">';
    html += '<div class="wcp-cs-counts">';
    html += '<span class="wcp-badge" style="background:var(--wcp-gray-100);color:var(--wcp-text-secondary)">' + icon('sparkles') + ' ' + all.length + ' total</span>';
    html += '<span class="wcp-badge" style="background:var(--wcp-accent)15;color:var(--wcp-accent)">' + unused.length + ' unused</span>';
    if (used.length) html += '<span class="wcp-badge" style="background:var(--wcp-success)15;color:var(--wcp-success)">' + icon('check') + ' ' + used.length + ' used</span>';
    html += '</div>';
    html += '<div class="wcp-cs-actions">';
    html += '<button class="wcp-btn-ai wcp-btn-ai-sm" data-action="cluster-suggest-more" data-cluster="' + esc(cl.id) + '">' + icon('sparkles') + ' Generate more</button>';
    if (all.length) html += '<button class="wcp-btn wcp-btn-sm wcp-btn-outline" data-action="cluster-suggest-clear" data-cluster="' + esc(cl.id) + '" style="color:var(--wcp-error);border-color:var(--wcp-error)">' + icon('trash') + ' Clear all</button>';
    html += '</div>';
    html += '</div>';

    // Empty state
    if (!all.length) {
      html += '<div class="wcp-empty-state" style="padding:24px 12px">';
      html += '<div class="wcp-empty-state-icon">' + icon('sparkles') + '</div>';
      html += '<div class="wcp-empty-state-title">No suggestions yet</div>';
      html += '<div class="wcp-empty-state-text">Click <strong>Generate more</strong> to get 6 AI-generated content ideas for this cluster.</div>';
      html += '</div></div>';
      return html;
    }

    // Unused first
    if (unused.length) {
      for (var i = 0; i < unused.length; i++) html += renderSuggestionRow(unused[i], cl, false);
    }
    // Then used (dimmed, with green tick)
    if (used.length) {
      html += '<div class="wcp-cs-divider">Previously used (' + used.length + ')</div>';
      for (var j = 0; j < used.length; j++) html += renderSuggestionRow(used[j], cl, true);
    }

    html += '</div>';
    return html;
  }

  function renderSuggestionRow(s, cl, isUsed) {
    var intentClr = { 'informational': 'var(--wcp-hub)', 'commercial': 'var(--wcp-accent)', 'transactional': 'var(--wcp-success)', 'navigational': 'var(--wcp-warning)' }[s.search_intent] || 'var(--wcp-text-muted)';
    var kwJson = esc(JSON.stringify(s.keywords || []));
    var html = '<div class="wcp-cs-row' + (isUsed ? ' wcp-cs-row-used' : '') + '" data-sid="' + esc(s.id) + '">';
    html += '<div class="wcp-cs-body">';
    html += '<div class="wcp-cs-title">' + esc(s.title || '') + '</div>';
    if (s.rationale) html += '<div class="wcp-cs-rationale">' + esc(s.rationale) + '</div>';
    html += '<div class="wcp-cs-meta">';
    if (s.search_intent) html += '<span class="wcp-badge" style="background:' + intentClr + '20;color:' + intentClr + '">' + icon('compass') + ' ' + esc(s.search_intent) + '</span>';
    if (s.content_type)  html += '<span class="wcp-badge" style="background:var(--wcp-gray-100);color:var(--wcp-text-secondary)">' + esc(s.content_type) + '</span>';
    if (s.keywords && s.keywords.length) {
      for (var ki = 0; ki < Math.min(s.keywords.length, 4); ki++) {
        html += '<span class="wcp-badge" style="background:var(--wcp-cluster)15;color:var(--wcp-cluster)">' + icon('key') + ' ' + esc(s.keywords[ki]) + '</span>';
      }
    }
    html += '</div></div>';

    html += '<div class="wcp-cs-actions-col">';
    if (isUsed) {
      var usedContent = S.contentMap && S.contentMap[s.used_content_id];
      if (usedContent) {
        html += '<button class="wcp-btn wcp-btn-sm wcp-btn-success-solid" data-action="cluster-suggest-open-used" data-content="' + esc(s.used_content_id) + '" title="Open the content this idea became">' + icon('check') + ' Used &rarr;</button>';
      } else {
        html += '<span class="wcp-badge" style="background:var(--wcp-gray-100);color:var(--wcp-text-secondary)" title="The adopted content was deleted">' + icon('check') + ' Used (removed)</span>';
      }
    } else {
      html += '<button class="wcp-btn wcp-btn-sm wcp-btn-primary" data-action="adopt-suggestion" data-sid="' + esc(s.id) + '" data-title="' + esc(s.title || '') + '" data-hub="' + esc(cl.hub_id || '') + '" data-cluster="' + esc(cl.id) + '" data-intent="' + esc(s.search_intent || '') + '" data-type="' + esc(s.content_type || '') + '" data-keywords="' + kwJson + '">' + icon('plus') + ' Adopt</button>';
      html += '<button class="wcp-btn-delete-sm" data-action="cluster-suggest-delete" data-cluster="' + esc(cl.id) + '" data-sid="' + esc(s.id) + '" title="Delete this suggestion">' + icon('trash') + '</button>';
    }
    html += '</div></div>';
    return html;
  }

  // Exported for the wizard + events (see part2b/14-events.js).
  window._wcpOpenClusterSuggestionsPanel = openClusterSuggestionsPanel;
  window._wcpRefreshClusterSuggestionsPanel = refreshClusterSuggestionsPanel;
  window._wcpRunClusterSuggestionGeneration = _runClusterSuggestionGeneration;

  function aiPlanCalendar(hubId) {
    var hub = S.hubMap[hubId]; if (!hub) return;
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var content = getHubContent(hubId);
    var existingTitles = content.map(function(c) { return c.title; }).slice(0, 10).join('; ');
    var prompt = 'Plan an 8-item content calendar for this hub spread over 4 weeks (2 items/week).\n\n';
    prompt += 'Hub: ' + esc(hub.name) + '\n';
    if (existingTitles) prompt += 'Existing content (do not duplicate): ' + existingTitles + '\n';
    prompt += brandSnippet('seo');
    prompt += '\n\nProduce 8 publishable items. Sequence them so high-priority commercial pieces ship first, then supporting informational pieces.\n\nRespond ONLY as JSON: {"items":[{"week":1,"title":"specific title","content_type":"Blog Post|Guide|Landing Page|Case Study|Comparison|How-To|Tool","priority":"high|medium|low","rationale":"1 sentence on why this fits"}]}';
    _wcpAIPreflight.run({
      actionId: 'ai-plan-calendar',
      title: 'Plan content calendar',
      description: 'AI will plan an 8-item, 4-week calendar for hub "' + (hub.name || '') + '".',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('research'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var items = parsed.items || [];
        if (!items.length) { toast('No calendar items returned', 'warning'); return; }
        // Stash items so the "Adopt selected" save handler can read them by index.
        S._lastCalendarPlan = { hubId: hubId, items: items };
        var html = '<div class="wcp-editor-form">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--wcp-space-2);font-size:var(--wcp-font-size-sm)">';
        html += '<label style="cursor:pointer"><input type="checkbox" id="wcpCalAll" checked> Select all (' + items.length + ')</label>';
        html += '<span class="wcp-text-xs wcp-text-muted">Selected items will be created as content under this hub</span>';
        html += '</div>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:var(--wcp-font-size-sm)">';
        html += '<thead><tr style="background:var(--wcp-gray-50);text-align:left">';
        html += '<th style="padding:8px;border-bottom:1px solid var(--wcp-border-light);width:40px"></th>';
        html += '<th style="padding:8px;border-bottom:1px solid var(--wcp-border-light)">Week</th>';
        html += '<th style="padding:8px;border-bottom:1px solid var(--wcp-border-light)">Title</th>';
        html += '<th style="padding:8px;border-bottom:1px solid var(--wcp-border-light)">Type</th>';
        html += '<th style="padding:8px;border-bottom:1px solid var(--wcp-border-light)">Priority</th>';
        html += '</tr></thead><tbody>';
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          var prClr = it.priority === 'high' ? 'var(--wcp-error)' : (it.priority === 'medium' ? 'var(--wcp-warning)' : 'var(--wcp-text-muted)');
          html += '<tr style="border-bottom:1px solid var(--wcp-border-light)">';
          html += '<td style="padding:8px;text-align:center"><input type="checkbox" class="wcp-cal-item-cb" data-idx="' + i + '" checked></td>';
          html += '<td style="padding:8px;font-weight:600">W' + esc(it.week || '?') + '</td>';
          html += '<td style="padding:8px"><strong>' + esc(it.title || '') + '</strong>';
          if (it.rationale) html += '<div class="wcp-text-xs wcp-text-muted">' + esc(it.rationale) + '</div>';
          html += '</td>';
          html += '<td style="padding:8px">' + esc(it.content_type || '—') + '</td>';
          html += '<td style="padding:8px"><span class="wcp-badge" style="background:' + prClr + '20;color:' + prClr + '">' + esc(it.priority || 'medium') + '</span></td>';
          html += '</tr>';
        }
        html += '</tbody></table></div>';
        openModal('Content Calendar — ' + esc(hub.name), html, {
          size: 'lg',
          saveLabel: icon('check') + ' Adopt selected',
          onSave: function() {
            var pickedIdx = [];
            $('.wcp-cal-item-cb:checked').each(function() {
              pickedIdx.push(parseInt($(this).data('idx'), 10));
            });
            if (!pickedIdx.length) { toast('Select at least one item', 'warning'); return; }
            snapshot('Adopt calendar items');
            var created = 0;
            for (var j = 0; j < pickedIdx.length; j++) {
              var it = items[pickedIdx[j]];
              if (!it || !it.title) continue;
              var cnt = createContent({ title: it.title, hub_id: hubId, cluster_id: '' });
              cnt.basic_info = cnt.basic_info || {};
              if (it.content_type) {
                var matched = (S.data.content_types || []).find(function(t) { return (t.name || '').toLowerCase() === (it.content_type || '').toLowerCase(); });
                if (matched) cnt.content_type_id = matched.id;
              }
              if (it.priority) cnt.priority = it.priority;
              created++;
            }
            buildMaps(); syncToTextarea();
            closeModal();
            render();
            toast('Created ' + created + ' content piece' + (created !== 1 ? 's' : '') + ' from calendar', 'success');
          }
        });
        // Wire up "Select all" toggle for this modal (idempotent — replaces any previous binding).
        $(document).off('change.wcpCalAll').on('change.wcpCalAll', '#wcpCalAll', function() {
          $('.wcp-cal-item-cb').prop('checked', this.checked);
        });
        logActivity('ai_action', hub.id, hub.name, 'AI planned calendar (' + items.length + ' items)');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }
