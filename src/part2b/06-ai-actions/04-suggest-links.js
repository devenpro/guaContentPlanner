  // ============================================================
  // SECTION 8B: AI SUGGEST INTERNAL LINKS
  // ============================================================
  //
  // Hybrid engine: rule scoring shortlists top-20 candidates, then the LLM
  // ranks the best ~8 with anchor text + reason. When no AI is configured,
  // falls back to rule-only suggestions (still useful for new setups).
  //
  // Suggestions live on S.linkSuggestions[contentId] — transient, not
  // persisted. Committing a suggestion creates a ledger record via
  // createSitemapLink (exposed as window._wcpCreateSitemapLink).

  function suggestInternalLinks(contentId) {
    var c = S.contentMap[contentId]; if (!c) return;
    var sm = (S.data.sitemap) || { pages: [] };
    if (!sm.pages || !sm.pages.length) {
      toast('Import your sitemap first — no pages to link to', 'warning');
      return;
    }

    // Rule phase (always runs). Lowered minScore to 1 so weak title/path
    // overlaps still surface — the AI phase will re-rank and prune.
    var scoreFn = window._wcpScoreSitemapPagesForContent;
    var candidates = scoreFn ? scoreFn(c, { topN: 25, minScore: 1 }) : [];
    if (!candidates.length) {
      // Explain exactly what's missing so the user knows how to unblock.
      var why = (typeof window._wcpExplainNoLinkCandidates === 'function')
        ? window._wcpExplainNoLinkCandidates(c)
        : 'No relevant pages found.';
      // Render an inline hint in the picker (via transient suggestions marker) + toast
      S.linkSuggestions = S.linkSuggestions || {};
      S.linkSuggestions[contentId] = [];
      S._linkSuggestionHint = S._linkSuggestionHint || {};
      S._linkSuggestionHint[contentId] = why;
      _rerenderLinkPickerSection(contentId);
      toast('No link candidates yet — see the picker for details', 'info');
      return;
    }
    // Clear any stale "no candidates" hint now that we have matches
    if (S._linkSuggestionHint) delete S._linkSuggestionHint[contentId];

    // If AI isn't configured, render rule-only suggestions and stop.
    if (!LLMService.isConfigured()) {
      var fallback = candidates.slice(0, 10).map(function(r) {
        return {
          page_id: r.page.id,
          anchor_text: '',
          reason: r.reasons.join(' · '),
          score: r.score,
          confidence: Math.min(1, r.score / 100),
          source: 'rule'
        };
      });
      S.linkSuggestions = S.linkSuggestions || {};
      S.linkSuggestions[contentId] = fallback;
      _rerenderLinkPickerSection(contentId);
      toast('Rule-based suggestions ready (' + fallback.length + ') — configure AI for smarter ranking', 'info');
      return;
    }

    // AI phase — rank the top 20 and return the best 8 with anchor + reason.
    var ct  = S.contentTypeMap[c.content_type_id];
    var hub = S.hubMap[c.hub_id];
    var cl  = S.clusterMap[c.cluster_id];
    var bi  = c.basic_info || {};

    var prompt = 'Pick the best internal links for this new content piece from the candidate list.\n\n';
    prompt += '=== NEW CONTENT ===\n';
    prompt += 'Title: ' + (c.title || '(untitled)') + '\n';
    if (ct)  prompt += 'Type: ' + ct.name + '\n';
    if (hub) prompt += 'Hub: ' + hub.name + '\n';
    if (cl)  prompt += 'Cluster: ' + cl.name + '\n';
    if (bi.audience) prompt += 'Audience: ' + bi.audience + '\n';
    if (bi.search_intent) prompt += 'Intent: ' + bi.search_intent + '\n';
    var r = c.research || {};
    if (r.selected_angle) prompt += 'Angle: ' + r.selected_angle + '\n';
    if (r.uvp) prompt += 'UVP: ' + r.uvp + '\n';

    prompt += '\n=== CANDIDATE PAGES (id, title, url, priority) ===\n';
    for (var i = 0; i < candidates.length; i++) {
      var p = candidates[i].page;
      var eff = (typeof window._wcpEffectivePriority === 'function') ? window._wcpEffectivePriority(p) : 3;
      prompt += (i + 1) + '. id="' + p.id + '" | P' + eff + ' | ' + (p.title || '(untitled)') + ' — ' + p.url + '\n';
    }
    prompt += brandSnippet('content');

    prompt += '\n\nPick 5-8 links that would genuinely help this content\'s reader. For each, write:\n';
    prompt += '  - page_id: exact id from the list\n';
    prompt += '  - reason: 1 sentence on *why* this link helps the reader\n';
    prompt += '  - confidence: 0.0 to 1.0\n';
    prompt += '\nPrefer P1/P2 pages when relevance is similar. Avoid forced links. The writer will write their own anchor text — do NOT provide anchor text.\n';
    prompt += '\nRespond ONLY as JSON: {"links":[{"page_id":"sp_xxx","reason":"...","confidence":0.9}]}';

    _wcpAIPreflight.run({
      actionId: 'ai-suggest-links',
      title: 'Suggest internal links',
      description: 'AI will rank ' + candidates.length + ' candidate page' + (candidates.length !== 1 ? 's' : '') + ' and pick the 5-8 most relevant.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('content'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var ranked = (parsed.links || []).filter(function(x) { return x && x.page_id; });
        var out = [];
        for (var k = 0; k < ranked.length; k++) {
          var rk = ranked[k];
          var match = null;
          for (var m = 0; m < candidates.length; m++) {
            if (candidates[m].page.id === rk.page_id) { match = candidates[m]; break; }
          }
          if (!match) continue;
          out.push({
            page_id: rk.page_id,
            anchor_text: '',
            reason: rk.reason || match.reasons.join(' · '),
            score: match.score,
            confidence: typeof rk.confidence === 'number' ? rk.confidence : 0.7,
            source: 'ai'
          });
        }
        S.linkSuggestions = S.linkSuggestions || {};
        S.linkSuggestions[contentId] = out;
        logActivity('ai_action', c.id, c.title, 'AI suggested ' + out.length + ' internal links');
        _rerenderLinkPickerSection(contentId);
        toast('AI suggested ' + out.length + ' link' + (out.length !== 1 ? 's' : ''), 'success');
      },
      onError: function(err) {
        toast('AI Error: ' + err, 'error');
        var fallback2 = candidates.slice(0, 10).map(function(rr) {
          return { page_id: rr.page.id, anchor_text: '', reason: rr.reasons.join(' · '), score: rr.score, confidence: 0.5, source: 'rule' };
        });
        S.linkSuggestions = S.linkSuggestions || {};
        S.linkSuggestions[contentId] = fallback2;
        _rerenderLinkPickerSection(contentId);
      }
    });
  }

  // Swap only the link picker section's DOM — keeps scroll position and
  // avoids clobbering any user input elsewhere in the brief.
  function _rerenderLinkPickerSection(contentId) {
    if (typeof window._wcpRenderLinkPicker !== 'function') { if (render) render(); return; }
    var html = window._wcpRenderLinkPicker(contentId);
    var $slot = $('#wcpLinkPicker_' + contentId);
    if ($slot.length) $slot.replaceWith(html);
    else if (render) render();
  }

  // Expose to Part 2A's event wiring
  window._wcpSuggestInternalLinks = suggestInternalLinks;
