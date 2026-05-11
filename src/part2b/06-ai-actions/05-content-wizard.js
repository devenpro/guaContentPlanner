  // ============================================================
  // SECTION 8.5: AI ACTION — DRAFT CONTENT BRIEF (NEW CONTENT WIZARD)
  // ============================================================
  //
  // Single LLM call that takes the wizard's user-provided brief (+ the
  // fetched/pasted article body if mode === 'refresh') and returns a rich
  // draft of the whole content record: title, content_type, hub/cluster
  // suggestion (matched against existing ids), basic_info, keywords, research
  // angles, audience, goal, word-count band.
  //
  // The wizard renders the response as an editable preview; on commit, the
  // payload is merged into createContent() plus a linked keyword group.
  //
  // Signature:
  //   aiDraftContentBrief(input, onSuccess, onError)
  // where input = {
  //   mode: 'new' | 'refresh',
  //   userBrief: { title, topic, audience, goal, hub_id, cluster_id, priority },
  //   source?: { url, title, body }   // refresh mode only
  // }
  // onSuccess(draft) — draft is the parsed hub object
  // onError(errMsg)  — toasts already fired by LLMService

  function aiDraftContentBrief(input, onSuccess, onError) {
    if (!LLMService.isConfigured()) {
      toast('No AI providers configured', 'warning');
      if (onError) onError('no-providers');
      return;
    }
    input = input || {};
    var mode = input.mode === 'refresh' ? 'refresh' : 'new';
    var u = input.userBrief || {};
    var src = input.source || {};

    // Pull existing hubs + clusters so the AI can match by ID. Only supply
    // candidates with names filled so the model has something to reason about.
    var hubs = (S.data.hubs || []).filter(function(h) { return h && h.name; }).map(function(h) {
      return { id: h.id, name: h.name, pillar_keyword: h.pillar_keyword || '', description: (h.description || '').substring(0, 140) };
    });
    var clusters = (S.data.clusters || []).filter(function(c) { return c && c.name; }).map(function(c) {
      return { id: c.id, hub_id: c.hub_id || '', name: c.name, description: (c.description || '').substring(0, 120) };
    });
    var types = (S.data.content_types || []).map(function(t) { return t.name; }).filter(Boolean);

    var prompt = '';
    if (mode === 'refresh') {
      prompt += 'You are helping refresh an existing piece of content. Analyse the page text below and draft an updated content brief that improves on it.\n\n';
      prompt += 'Existing URL: ' + (src.url || '(not provided)') + '\n';
      if (src.title) prompt += 'Existing title: ' + src.title + '\n';
      if (src.body)  prompt += 'Existing page text (truncated):\n"""\n' + src.body.substring(0, 6000) + '\n"""\n';
    } else {
      prompt += 'You are helping create a brand-new piece of content. Draft a complete content brief from the user input below.\n\n';
    }

    prompt += '\nUser input:\n';
    if (u.title)    prompt += '  Title idea:       ' + u.title + '\n';
    if (u.topic)    prompt += '  What it is about: ' + u.topic + '\n';
    if (u.audience) prompt += '  Target audience:  ' + u.audience + '\n';
    if (u.goal)     prompt += '  Primary goal:     ' + u.goal + '\n';
    if (u.hub_id)     prompt += '  User chose hub:     ' + u.hub_id + ' (do NOT change this)\n';
    if (u.cluster_id) prompt += '  User chose cluster: ' + u.cluster_id + ' (do NOT change this)\n';

    if (hubs.length && !u.hub_id) {
      prompt += '\nAvailable hubs (pick the best match by id, or return null if none fit — the user can assign later):\n';
      for (var hi = 0; hi < hubs.length; hi++) {
        prompt += '  - id="' + hubs[hi].id + '" name="' + hubs[hi].name + '"';
        if (hubs[hi].pillar_keyword) prompt += ' pillar="' + hubs[hi].pillar_keyword + '"';
        if (hubs[hi].description) prompt += ' ' + hubs[hi].description;
        prompt += '\n';
      }
    }
    if (clusters.length && !u.cluster_id) {
      prompt += '\nAvailable clusters (pick by id if one fits the chosen or suggested hub, else null):\n';
      for (var ci = 0; ci < clusters.length; ci++) {
        prompt += '  - id="' + clusters[ci].id + '" hub="' + clusters[ci].hub_id + '" name="' + clusters[ci].name + '"';
        if (clusters[ci].description) prompt += ' — ' + clusters[ci].description;
        prompt += '\n';
      }
    }

    if (types.length) {
      prompt += '\nAvailable content types (return one EXACT name from this list): ' + types.join(', ') + '\n';
    }

    prompt += brandSnippet('content');

    prompt += '\n\nProduce a JSON object with:\n';
    prompt += '  title:         polished, publishable headline (6-14 words)\n';
    prompt += '  content_type:  EXACT name from the list above, or "Blog Post" if unsure\n';
    prompt += '  hub_id:        id of a matching hub from the list, OR null\n';
    prompt += '  cluster_id:    id of a matching cluster from the list, OR null\n';
    prompt += '  basic_info: {\n';
    prompt += '    audience:            1-sentence description,\n';
    prompt += '    goal:                primary outcome (e.g. "drive demo signups"),\n';
    prompt += '    funnel_stage:        "awareness" | "consideration" | "decision",\n';
    prompt += '    word_count_min:      integer (e.g. 1500),\n';
    prompt += '    word_count_max:      integer (e.g. 3000),\n';
    prompt += '    search_intent:       "informational" | "commercial" | "transactional" | "navigational",\n';
    prompt += '    tone_of_voice:       short descriptor (e.g. "friendly expert")\n';
    prompt += '  },\n';
    prompt += '  keywords: {\n';
    prompt += '    primary:   { "keyword": "...", "volume": 0 },\n';
    prompt += '    secondary: ["...", "..."]   // 3-5 items,\n';
    prompt += '    lsi:       ["...", "..."]   // 3-6 items\n';
    prompt += '  },\n';
    prompt += '  research: {\n';
    prompt += '    angles:          ["angle A", "angle B", "angle C"],\n';
    prompt += '    selected_angle:  "the strongest of the three",\n';
    prompt += '    uvp:             "unique value proposition — why read this over the alternatives",\n';
    prompt += '    questions:       ["q1", "q2", "q3"]    // 3-5 questions the content must answer\n';
    prompt += '  }' + (mode === 'refresh' ? ',\n  refresh_notes: ["what to add/remove/update vs. the existing page"] // 3-6 items\n' : '\n');
    prompt += '}\n\nRespond ONLY with the JSON object. No prose.';

    callAIWithRetry(prompt, function(text) {
      var parsed = parseJSON(text);
      if (!parsed || !parsed.title) {
        if (onError) onError('empty-response');
        else toast('AI returned an empty brief', 'error');
        return;
      }
      // Normalise shape so the wizard never has to guard against missing fields.
      parsed.basic_info = parsed.basic_info || {};
      parsed.keywords = parsed.keywords || { primary: { keyword: '', volume: 0 }, secondary: [], lsi: [] };
      parsed.keywords.primary = parsed.keywords.primary || { keyword: '', volume: 0 };
      if (!Array.isArray(parsed.keywords.secondary)) parsed.keywords.secondary = [];
      if (!Array.isArray(parsed.keywords.lsi))       parsed.keywords.lsi = [];
      parsed.research = parsed.research || {};
      if (!Array.isArray(parsed.research.angles))    parsed.research.angles = [];
      if (!Array.isArray(parsed.research.questions)) parsed.research.questions = [];

      // Validate hub_id / cluster_id against the maps — AI sometimes hallucinates
      if (parsed.hub_id && !S.hubMap[parsed.hub_id])         parsed.hub_id = null;
      if (parsed.cluster_id && !S.clusterMap[parsed.cluster_id]) parsed.cluster_id = null;
      // If cluster points to a different hub than the one picked, clear it
      if (parsed.cluster_id && parsed.hub_id) {
        var cl = S.clusterMap[parsed.cluster_id];
        if (cl && cl.hub_id && cl.hub_id !== parsed.hub_id) parsed.cluster_id = null;
      }

      if (onSuccess) onSuccess(parsed);
    }, function(err) {
      if (onError) onError(err);
      else toast('AI Error: ' + err, 'error');
    }, 'ai-draft-content-brief', BrandService.getSystemPrompt('content'));
  }

  window._wcpAiDraftContentBrief = aiDraftContentBrief;
