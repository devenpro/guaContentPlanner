  // ============================================================
  // SECTION 6: AI ACTIONS — PER-CONTENT (aiSuggestType, aiFillBrief)
  // ============================================================
  // aiGenerateDirection was removed when the Direction step was dropped —
  // Content Writer app now owns writing-brief generation.

  function aiSuggestType(contentId) {
    var c = S.contentMap[contentId]; if (!c) return;
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var types = (S.data.content_types || []).map(function(t) { return t.name + ' — ' + t.description; }).join('\n');
    var bi = c.basic_info || {};
    var prompt = 'Suggest the best content type for this piece.\n\n';
    prompt += 'Title: ' + esc(c.title || '') + '\n';
    if (bi.audience) prompt += 'Audience: ' + bi.audience + '\n';
    if (bi.goal)     prompt += 'Goal: ' + bi.goal + '\n';
    prompt += '\nAvailable types:\n' + types;
    prompt += brandSnippet('research');
    prompt += '\n\nRespond ONLY as JSON: {"suggested_type":"exact type name from list","reasoning":"1 sentence"}';
    _wcpAIPreflight.run({
      actionId: 'ai-suggest-type',
      title: 'Suggest content type',
      description: 'AI will pick the best matching content type for "' + (c.title || 'this piece') + '".',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('content'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        if (parsed.suggested_type) {
          var matched = (S.data.content_types || []).find(function(t) { return t.name.toLowerCase() === parsed.suggested_type.toLowerCase(); });
          if (matched) c.content_type_id = matched.id;
        }
        c.updated = new Date().toISOString();
        logActivity('ai_action', c.id, c.title, 'AI suggested type: ' + (parsed.suggested_type || ''));
        snapshot('AI suggest type'); buildMaps(); syncToTextarea(); render();
        toast('Type suggested: ' + (parsed.suggested_type || 'see results') + (parsed.reasoning ? ' — ' + truncate(parsed.reasoning, 60) : ''), 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }


  function aiFillBrief(contentId) {
    var c = S.contentMap[contentId]; if (!c) return;
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }

    // Expanded brief schema (Phase 3) — asks for any field the user hasn't
    // filled yet. String fields produce a string; array fields produce a
    // list of strings; numeric fields produce a number.
    var bi = c.basic_info || {};
    var r  = c.research || {};
    var isEmpty = function(v) { return v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length); };

    // Field → (needed?, JSON type hint). Pared back in Apr 2026 — CTAs,
    // entities, FAQs, word_count_min/max, SERP competitors, and external
    // references are no longer part of the brief surface.
    var schema = {
      'audience':             { path: 'basic_info.audience',              type: 'string',       empty: isEmpty(bi.audience) },
      'goal':                 { path: 'basic_info.goal',                  type: 'string',       empty: isEmpty(bi.goal) },
      'search_intent':        { path: 'basic_info.search_intent',         type: 'enum:informational|navigational|commercial|transactional', empty: isEmpty(bi.search_intent) },
      'funnel_stage':         { path: 'basic_info.funnel_stage',          type: 'enum:tofu|mofu|bofu', empty: isEmpty(bi.funnel_stage) },
      'content_depth':        { path: 'basic_info.content_depth',         type: 'enum:beginner|intermediate|advanced|expert', empty: isEmpty(bi.content_depth) },
      'tone_of_voice':        { path: 'basic_info.tone_of_voice',         type: 'string',       empty: isEmpty(bi.tone_of_voice) },
      'word_count_target':    { path: 'basic_info.word_count_target',     type: 'number',       empty: isEmpty(bi.word_count_target) },
      'angle':                { path: 'research.selected_angle',          type: 'string',       empty: isEmpty(r.selected_angle) },
      'uvp':                  { path: 'research.uvp',                     type: 'string',       empty: isEmpty(r.uvp) }
    };
    var needs = Object.keys(schema).filter(function(k) { return schema[k].empty; });
    if (!needs.length) { toast('All brief fields already filled — nothing to do', 'info'); return; }

    toast('Filling content brief (' + needs.length + ' fields)…', 'info');
    var ct  = S.contentTypeMap[c.content_type_id];
    var hub = S.hubMap[c.hub_id];
    var cl  = S.clusterMap[c.cluster_id];

    var prompt = 'Fill the missing brief fields for this content piece.\n\n';
    prompt += 'Title: ' + (c.title || '(untitled)') + '\n';
    if (ct)  prompt += 'Content type: ' + ct.name + '\n';
    if (hub) prompt += 'Hub: ' + hub.name + '\n';
    if (cl)  prompt += 'Cluster: ' + cl.name + '\n';
    prompt += brandSnippet('research');
    prompt += '\n\nReturn ONLY JSON with these keys:\n';
    for (var ni = 0; ni < needs.length; ni++) {
      var key = needs[ni];
      var info = schema[key];
      prompt += '  ' + key + ' — ';
      if (info.type === 'string')       prompt += 'string (1-2 sentences, plain English)';
      else if (info.type === 'number')  prompt += 'number (integer)';
      else if (info.type === 'array')   prompt += 'array of 3-6 short strings';
      else if (info.type.indexOf('enum:') === 0) prompt += 'one of: ' + info.type.slice(5).replace(/\|/g, ', ');
      prompt += '\n';
    }
    prompt += '\nRespond ONLY as JSON with those keys — no prose, no markdown fences.';

    _wcpAIPreflight.run({
      actionId: 'ai-fill-brief',
      title: 'Fill content brief',
      description: 'AI will fill ' + needs.length + ' missing brief field' + (needs.length !== 1 ? 's' : '') + '.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('content'),
      onResult: function(text) {
        var parsed = parseJSON(text) || {};
        c.basic_info = c.basic_info || {};
        c.research   = c.research   || {};
        var filled = 0;
        for (var k = 0; k < needs.length; k++) {
          var key = needs[k];
          var info = schema[key];
          var val = parsed[key];
          if (val === undefined || val === null || val === '') continue;
          if (info.path.indexOf('basic_info.') === 0) {
            var fld = info.path.split('.')[1];
            if (info.type === 'number') c.basic_info[fld] = parseInt(val, 10) || 0;
            else if (info.type === 'array') c.basic_info[fld] = Array.isArray(val) ? val.slice() : String(val).split(/\n/).map(function(x) { return x.trim(); }).filter(Boolean);
            else c.basic_info[fld] = String(val).trim();
          } else if (info.path.indexOf('research.') === 0) {
            var rfld = info.path.split('.')[1];
            if (info.type === 'array') c.research[rfld] = Array.isArray(val) ? val.slice() : String(val).split(/\n/).map(function(x) { return x.trim(); }).filter(Boolean);
            else c.research[rfld] = String(val).trim();
          }
          filled++;
        }
        c.updated = new Date().toISOString();
        logActivity('ai_action', c.id, c.title, 'AI filled brief (' + filled + ' fields)');
        snapshot('AI fill brief'); maybeAdvanceStatus(c, 'brief filled'); buildMaps(); syncToTextarea(); render();
        toast('Brief filled (' + filled + ' field' + (filled !== 1 ? 's' : '') + ')', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }
