  // ── Research runners — each tab calls its own directly (no dispatcher) ──

  // Collect titles from prior research sessions of a given type, plus
  // committed content titles, so dedup context is easy to assemble.
  function _priorResearchTitles(type, limit) {
    var lim = limit || 30;
    var out = [];
    var sessions = (S.data.research_sessions || []).filter(function(s) { return !type || s.type === type; });
    for (var i = sessions.length - 1; i >= 0 && out.length < lim; i--) {
      var rs = sessions[i].results || [];
      for (var j = 0; j < rs.length && out.length < lim; j++) {
        var t = rs[j].title || rs[j].keyword || '';
        if (t) out.push(t);
      }
    }
    return out;
  }

  function _priorKeywordList(limit) {
    var lim = limit || 60;
    var out = [];
    var seen = {};
    var groups = (S.data.keyword_groups || []).slice(-10);
    for (var i = 0; i < groups.length; i++) {
      var kws = groups[i].keywords || [];
      for (var j = 0; j < kws.length; j++) {
        var k = (kws[j].keyword || '').toLowerCase().trim();
        if (!k || seen[k]) continue;
        seen[k] = true;
        out.push(k);
        if (out.length >= lim) break;
      }
      if (out.length >= lim) break;
    }
    return out;
  }

  function runKeywordResearch(seed, count, useBrand) {
    if (!seed) { toast('Enter a seed keyword', 'warning'); return; }
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var priorKw = _priorKeywordList(60);
    var prompt = 'You are an SEO keyword researcher. Expand this seed into intent-based keyword groups.\n\nSeed: ' + seed + '\nTarget: ' + count + ' keywords total, organized into groups.\n';
    if (priorKw.length) prompt += 'Already covered in existing keyword groups (do NOT duplicate): ' + priorKw.join(', ') + '\n';
    if (useBrand) prompt += brandSnippet('seo');
    prompt += '\n\nRULES:\n';
    prompt += '- Each GROUP = one page targeting one user intent. Keywords inside a group must all be answerable by the same page.\n';
    prompt += '- Prioritize commercial + transactional intent where they naturally exist — they convert better than pure informational.\n';
    prompt += '- The first keyword in each group is the primary (highest-value) keyword.\n';
    prompt += '- Volume is a rough monthly search-volume estimate; difficulty is low/medium/high/very_high.\n\n';
    prompt += 'Respond ONLY as JSON: {"groups":[{"name":"...","intent":"what the searcher wants","search_intent":"informational|navigational|commercial|transactional","content_type":"Blog Post|Guide|Landing Page|Case Study|Comparison|How-To|Tool","keywords":[{"keyword":"...","volume":number,"difficulty":"low|medium|high|very_high"}]}]}';
    var sessionId = generateId('rs');
    _wcpAIPreflight.run({
      actionId: 'research_keywords',
      title: 'Keyword research',
      description: 'AI will expand "' + seed + '" into ' + count + ' keywords organised by intent.',
      basePrompt: prompt,
      systemPrompt: useBrand ? BrandService.getSystemPrompt('seo') : '',
      onResult: function(text) {
        var parsed = parseJSON(text);
        var groups = parsed.groups || [];
        S.data.keyword_groups = S.data.keyword_groups || [];
        var createdGroupIds = [];
        var flatResults = [];
        for (var gi = 0; gi < groups.length; gi++) {
          var grp = groups[gi];
          var kws = grp.keywords || [];
          if (!kws.length) continue;
          var kwgId = generateId('kwg');
          var now = new Date().toISOString();
          S.data.keyword_groups.push({
            id: kwgId, name: grp.name || 'Group ' + (gi + 1),
            intent: grp.intent || '', search_intent: grp.search_intent || 'informational',
            keywords: kws.map(function(k) { return { keyword: k.keyword || '', volume: k.volume || 0, difficulty: k.difficulty || '' }; }),
            primary_keyword_index: 0, content_id: '', hub_id: '', cluster_id: '',
            source_session_id: sessionId, notes: '', created: now, updated: now
          });
          createdGroupIds.push(kwgId);
          for (var ki = 0; ki < kws.length; ki++) {
            flatResults.push({
              id: generateId('rr'), title: kws[ki].keyword || '', keyword: kws[ki].keyword || '',
              volume: kws[ki].volume || 0, difficulty: kws[ki].difficulty || '',
              search_intent: grp.search_intent || '', cluster: grp.name || '',
              content_type: grp.content_type || '', keyword_group_id: kwgId,
              promoted: false
            });
          }
        }
        var session = {
          id: sessionId, title: 'Keywords: ' + truncate(seed, 40), topic: seed, type: 'keywords',
          input: { topic: seed, count: count, brand_context: useBrand },
          results: flatResults, keyword_group_ids: createdGroupIds,
          created: new Date().toISOString(), updated: new Date().toISOString()
        };
        S.data.research_sessions = S.data.research_sessions || [];
        S.data.research_sessions.push(session);
        logActivity('research_session', '', '', 'Keyword research: ' + flatResults.length + ' keywords in ' + groups.length + ' groups');
        snapshot('Keyword research'); buildMaps(); render(); syncToTextarea();
        toast('Found ' + flatResults.length + ' keywords in ' + groups.length + ' groups', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function runGapResearch(scope, useBrand) {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var contentList = scope === 'all' ? (S.data.content || []) : getHubContent(scope);
    if (!contentList.length) { toast('No content to analyze', 'warning'); return; }
    var contentSummary = contentList.map(function(c) {
      var bi = c.basic_info || {};
      return '"' + c.title + '"' + (bi.audience ? ' [' + bi.audience + ']' : '');
    }).slice(0, 20).join('\n');
    var hubs = (S.data.hubs || []).map(function(h) { return h.name; });
    var priorGaps = _priorResearchTitles('gaps', 25);
    var prompt = 'You are a senior SEO content strategist. Perform a deep gap analysis on this content inventory and surface 15-20 distinct content gaps.\n\n';
    prompt += 'Content inventory (' + contentList.length + ' pieces):\n' + contentSummary + '\n\n';
    prompt += 'Hubs: ' + (hubs.join(', ') || '(none)') + '\n';
    if (priorGaps.length) prompt += 'Gaps already surfaced in prior analyses (do NOT repeat or rephrase): ' + priorGaps.join('; ') + '\n';
    if (useBrand) prompt += brandSnippet('seo');
    prompt += '\n\nAnalyze across ALL EIGHT gap dimensions and return gaps from as many as possible:\n';
    prompt += '1. Missing subtopics/pillar pages for topical authority\n';
    prompt += '2. Intent imbalance (informational vs commercial vs transactional)\n';
    prompt += '3. Missing content types/formats (guide, comparison, case study, how-to, tool, landing page)\n';
    prompt += '4. Keyword opportunities not yet covered\n';
    prompt += '5. Depth gaps (topics covered superficially that deserve dedicated deep-dives)\n';
    prompt += '6. Audience segments not addressed (different seniority, industries, use cases)\n';
    prompt += '7. Emerging-trend angles the inventory ignores\n';
    prompt += '8. Competitor-format gaps (formats competitors win on but you lack)\n\n';
    prompt += 'Return 15-20 gaps total. Each gap must be SPECIFIC and actionable — not vague categories.\n';
    prompt += 'Rank by priority: high = high-intent + low-effort; medium = standard; low = nice-to-have.\n\n';
    prompt += 'Respond ONLY as JSON: {"gaps":[{"title":"specific content title","description":"1-2 sentences on angle and why it matters","dimension":"one of the 8 above","search_intent":"informational|commercial|transactional|navigational","content_type":"Blog Post|Guide|Landing Page|Case Study|Comparison|How-To|Tool","priority":"high|medium|low"}]}';
    var sessionId = generateId('rs');
    _wcpAIPreflight.run({
      actionId: 'research_gaps',
      title: 'Find content gaps',
      description: 'AI will analyse ' + contentList.length + ' content piece' + (contentList.length !== 1 ? 's' : '') + ' across 8 gap dimensions.',
      basePrompt: prompt,
      systemPrompt: useBrand ? BrandService.getSystemPrompt('seo') : '',
      onResult: function(text) {
        var parsed = parseJSON(text);
        var gaps = parsed.gaps || [];
        var session = {
          id: sessionId, title: 'Gap Analysis' + (scope !== 'all' ? ': ' + ((S.hubMap[scope] || {}).name || scope) : ''), topic: 'Gap analysis', type: 'gaps',
          input: { scope: scope, brand_context: useBrand },
          results: gaps.map(function(g) {
            return { id: generateId('rr'), title: g.title || '', description: g.description || '', reasoning: g.description || '', search_intent: g.search_intent || '', content_type: g.content_type || '', priority: g.priority || 'medium', promoted: false };
          }),
          created: new Date().toISOString(), updated: new Date().toISOString()
        };
        S.data.research_sessions = S.data.research_sessions || [];
        S.data.research_sessions.push(session);
        logActivity('research_session', '', '', 'Gap analysis: ' + gaps.length + ' gaps found');
        snapshot('Gap research'); buildMaps(); render(); syncToTextarea();
        toast('Found ' + gaps.length + ' content gaps', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function runCompetitorResearch(input, focus, useBrand) {
    if (!input) { toast('Enter competitor info', 'warning'); return; }
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var priorOpps = _priorResearchTitles('competitor', 25);
    var prompt = 'You are a senior content strategist producing a DETAILED competitor analysis. Be thorough — this output drives real content planning.\n\n';
    prompt += 'Competitor info: ' + input + '\n';
    if (focus) prompt += 'Focus area: ' + focus + '\n';
    if (priorOpps.length) prompt += 'Opportunities already surfaced in prior competitor analyses (do NOT repeat): ' + priorOpps.join('; ') + '\n';
    if (useBrand) prompt += brandSnippet('research');
    prompt += '\n\nPRODUCE TWO OUTPUTS:\n\n';
    prompt += '===== OUTPUT 1: analysis =====\n';
    prompt += 'A DETAILED 5-7 paragraph analysis. Each paragraph is 3-5 sentences of concrete observation, not generic filler. Cover these six angles (one paragraph each where relevant):\n';
    prompt += '  (1) POSITIONING — how they frame themselves, their core promise, who they target\n';
    prompt += '  (2) CONTENT FORMATS — formats they dominate (long-form guides, comparison posts, tools, case studies, video, etc.) and why those work for them\n';
    prompt += '  (3) CONTENT GAPS — topics/intents they miss or cover weakly\n';
    prompt += '  (4) KEYWORD STRATEGY — what keyword clusters and intents they rank for; what they ignore\n';
    prompt += '  (5) AUDIENCE TARGETING — segments they serve well vs. underserve\n';
    prompt += '  (6) WEAKNESSES TO EXPLOIT — specific, actionable angles to beat them on\n\n';
    prompt += '===== OUTPUT 2: opportunities =====\n';
    prompt += 'Return EXACTLY 15 distinct content opportunities. Each must be a specific, publishable content piece — not vague categories like "more blog posts". Each opportunity should exploit a concrete gap from the analysis.\n\n';
    prompt += 'Respond ONLY as JSON: {"analysis":"full 5-7 paragraph analysis as a single string with \\n\\n between paragraphs","opportunities":[{"title":"specific content title","description":"1-2 sentences on the angle and why it beats the competitor","search_intent":"informational|commercial|transactional|navigational","content_type":"Blog Post|Guide|Landing Page|Case Study|Comparison|How-To|Tool","priority":"high|medium|low"}]}';
    var sessionId = generateId('rs');
    _wcpAIPreflight.run({
      actionId: 'research_competitor',
      title: 'Competitor analysis',
      description: 'AI will produce a detailed analysis + 15 opportunities for "' + truncate(input, 40) + '".',
      basePrompt: prompt,
      systemPrompt: useBrand ? BrandService.getSystemPrompt('seo') : '',
      onResult: function(text) {
        var parsed = parseJSON(text);
        var opps = parsed.opportunities || [];
        var session = {
          id: sessionId, title: 'Competitor: ' + truncate(input, 40), topic: input, type: 'competitor',
          input: { topic: input, focus: focus, brand_context: useBrand },
          analysis: parsed.analysis || '',
          results: opps.map(function(o) {
            return { id: generateId('rr'), title: o.title || '', description: o.description || '', reasoning: o.description || '', search_intent: o.search_intent || '', content_type: o.content_type || '', priority: o.priority || 'medium', promoted: false };
          }),
          created: new Date().toISOString(), updated: new Date().toISOString()
        };
        S.data.research_sessions = S.data.research_sessions || [];
        S.data.research_sessions.push(session);
        logActivity('research_session', '', '', 'Competitor research: ' + opps.length + ' opportunities');
        snapshot('Competitor research'); buildMaps(); render(); syncToTextarea();
        toast('Found ' + opps.length + ' opportunities', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function setupResearchEvents() {
    var ns = '.wcp2b-res';

    // Keyword research form submit
    $(document).off('click' + ns + '-rkw').on('click' + ns + '-rkw', '[data-action="run-keyword-research"]', function() {
      var seed = ($('#wcpResearchInput').val() || '').trim();
      var count = parseInt($('#wcpResearchCount').val(), 10) || 15;
      var useBrand = $('#wcpResearchBrand').is(':checked');
      runKeywordResearch(seed, count, useBrand);
    });

    // Find content gaps (sub-action in Keyword tab)
    $(document).off('click' + ns + '-fcg').on('click' + ns + '-fcg', '[data-action="find-content-gaps"]', function() {
      var scope = $('#wcpGapScope').val() || 'all';
      var useBrand = $('#wcpGapBrand').is(':checked');
      runGapResearch(scope, useBrand);
    });

    // Competitor research form submit
    $(document).off('click' + ns + '-rcp').on('click' + ns + '-rcp', '[data-action="run-competitor-research"]', function() {
      var input = ($('#wcpCompInput').val() || '').trim();
      var focus = ($('#wcpCompFocus').val() || '').trim();
      var useBrand = $('#wcpCompBrand').is(':checked');
      runCompetitorResearch(input, focus, useBrand);
    });

    // Delete session
    $(document).off('click' + ns + '-ds').on('click' + ns + '-ds', '[data-action="delete-session"]', function() {
      var sessionId = $(this).data('session');
      openConfirmDialog({
        title: 'Delete Session', message: 'Delete this research session?', confirmLabel: 'Delete', danger: true,
        onConfirm: function() {
          S.data.research_sessions = (S.data.research_sessions || []).filter(function(s) { return s.id !== sessionId; });
          snapshot('Delete session'); buildMaps(); syncToTextarea(); render();
          toast('Session deleted', 'success');
        }
      });
    });

    // Promote flat result (gap or competitor opportunity) to content.
    // Carries title, hub/cluster hints from the session, search intent, and
    // content type. If the result has an associated keyword_group_id (set by
    // keyword-research runs that already created groups) OR carries inline
    // keywords, the group is linked or created so the keywords are visible
    // on the content and in the export JSON.
    $(document).off('click' + ns + '-pr').on('click' + ns + '-pr', '[data-action="promote-research"]', function() {
      var sessionId = $(this).data('session');
      var resultIdx = parseInt($(this).data('result'), 10);
      var session = S.researchSessionMap[sessionId];
      if (!session || !session.results || !session.results[resultIdx]) return;
      var r = session.results[resultIdx];
      snapshot('Before promote');
      var cnt = createContent({
        title: r.title || r.keyword || 'Research Result',
        hub_id: (r.hub_id || session.hub_id || ''),
        cluster_id: (r.cluster_id || session.cluster_id || '')
      });
      // Pre-fill basic_info from research result
      cnt.basic_info = cnt.basic_info || {};
      if (r.search_intent) cnt.basic_info.search_intent = r.search_intent;
      if (r.content_type) {
        var matched = (S.data.content_types || []).find(function(t) { return t.name.toLowerCase() === (r.content_type || '').toLowerCase(); });
        if (matched) cnt.content_type_id = matched.id;
      }

      // Keyword group linkage — three paths:
      //   1. Result already references a keyword group → link existing group
      //   2. Result has inline keywords → create a new group for this content
      //   3. Neither → skip
      var now = new Date().toISOString();
      var linkedGrp = null;
      if (r.keyword_group_id && S.keywordGroupMap && S.keywordGroupMap[r.keyword_group_id]) {
        linkedGrp = S.keywordGroupMap[r.keyword_group_id];
        linkedGrp.content_id = cnt.id;
        linkedGrp.updated = now;
      } else if (r.keywords && r.keywords.length) {
        linkedGrp = {
          id: generateId('kwg'),
          name: r.title || r.keyword || 'Research keywords',
          intent: r.search_intent || '',
          search_intent: r.search_intent || 'informational',
          keywords: r.keywords.map(function(k) {
            if (typeof k === 'string') return { keyword: k, volume: 0, difficulty: '' };
            return { keyword: k.keyword || String(k), volume: k.volume || 0, difficulty: k.difficulty || '' };
          }),
          primary_keyword_index: 0,
          content_id: cnt.id,
          hub_id: cnt.hub_id || '',
          cluster_id: cnt.cluster_id || '',
          source_session_id: sessionId || '',
          notes: 'Created from research result',
          created: now,
          updated: now
        };
        S.data.keyword_groups = S.data.keyword_groups || [];
        S.data.keyword_groups.push(linkedGrp);
      }

      r.promoted = true;
      if (linkedGrp) logActivity('content_created', cnt.id, cnt.title, 'Promoted research result + linked keywords (' + (linkedGrp.keywords || []).length + ')');
      buildMaps(); syncToTextarea(); render();
      toast('Created content: ' + truncate(r.title || r.keyword || '', 40) + (linkedGrp ? ' — ' + (linkedGrp.keywords || []).length + ' keywords linked' : ''), 'success');
    });

    // Promote keyword group → create content with full group linked
    $(document).off('click' + ns + '-pkg').on('click' + ns + '-pkg', '[data-action="promote-keyword-group"]', function() {
      var groupId = $(this).data('group-id');
      var grp = S.keywordGroupMap[groupId];
      if (!grp || !grp.keywords || !grp.keywords.length) return;
      snapshot('Before promote group');
      var primaryKw = grp.keywords[grp.primary_keyword_index || 0] || grp.keywords[0];
      var cnt = createContent({ title: grp.name || primaryKw.keyword || 'Keyword Group Content', hub_id: grp.hub_id || '', cluster_id: grp.cluster_id || '' });
      cnt.basic_info = cnt.basic_info || {};
      if (grp.search_intent) cnt.basic_info.search_intent = grp.search_intent;
      // Link group → content (export step reads this FK)
      grp.content_id = cnt.id;
      grp.updated = new Date().toISOString();
      logActivity('content_created', cnt.id, cnt.title, 'Created from keyword group: ' + grp.name);
      buildMaps(); syncToTextarea(); render();
      toast('Created content linked to "' + truncate(grp.name, 30) + '" (' + grp.keywords.length + ' keywords)', 'success');
    });

    // Edit keyword group modal
    $(document).off('click' + ns + '-ekg').on('click' + ns + '-ekg', '[data-action="edit-keyword-group"]', function() {
      openEditKeywordGroupModal($(this).data('id'));
    });

    // Delete keyword group
    $(document).off('click' + ns + '-dkg').on('click' + ns + '-dkg', '[data-action="delete-keyword-group"]', function() {
      var groupId = $(this).data('id');
      var grp = S.keywordGroupMap[groupId];
      if (!grp) return;
      openConfirmDialog({
        title: 'Delete Keyword Group', message: 'Delete keyword group "' + grp.name + '"? This will not affect any linked content.',
        confirmLabel: 'Delete', danger: true,
        onConfirm: function() {
          S.data.keyword_groups = (S.data.keyword_groups || []).filter(function(g) { return g.id !== groupId; });
          snapshot('Delete keyword group'); buildMaps(); syncToTextarea(); render();
          toast('Keyword group deleted', 'success');
        }
      });
    });
  }
