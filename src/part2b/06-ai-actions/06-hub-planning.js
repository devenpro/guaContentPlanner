  // ============================================================
  // SECTION 8.6: AI ACTIONS — HUB PLANNING (per-hub)
  // ============================================================
  //
  // Two complementary actions on hub detail view:
  //
  //   aiPlanThisHub(hubId)        — User just created a hub. AI proposes
  //                                  5-7 clusters that together give the hub
  //                                  comprehensive topical coverage. Auto-
  //                                  creates the clusters and re-renders.
  //                                  User deletes any they don't want.
  //
  //   aiGapAnalysisForHub(hubId)  — Hub has some clusters / content already.
  //                                  AI analyses what's covered and proposes
  //                                  3-6 NEW clusters to fill gaps. Auto-
  //                                  creates them and re-renders.
  //
  // Both auto-create on success (per user UX choice). Toast reports counts.
  // Persistence handled by createCluster() which calls syncToTextarea().

  function aiPlanThisHub(hubId) {
    var hub = S.hubMap[hubId]; if (!hub) return;
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }

    var existingClusters = getHubClusters(hubId);
    var existingNames = existingClusters.map(function(c) { return c.name; });

    var prompt = 'Plan a complete cluster structure for this content hub. Think like a topical-authority strategist: propose 5-7 clusters that together cover the hub comprehensively. Each cluster should anchor 3-5 future content pieces.\n\n';
    prompt += '=== HUB ===\n';
    prompt += 'Name: ' + (hub.name || '') + '\n';
    if (hub.description)     prompt += 'Description: ' + hub.description + '\n';
    if (hub.pillar_keyword)  prompt += 'Pillar keyword: ' + hub.pillar_keyword + '\n';
    if (hub.target_audience) prompt += 'Target audience: ' + hub.target_audience + '\n';
    if (hub.keywords && hub.keywords.length) prompt += 'Hub keywords: ' + hub.keywords.join(', ') + '\n';

    if (existingNames.length) {
      prompt += '\nALREADY EXISTING clusters in this hub (do NOT duplicate or rephrase): ' + existingNames.join('; ') + '\n';
    }
    prompt += brandSnippet('research');

    prompt += '\n\nFor each cluster return:\n';
    prompt += '  - name: short, publishable cluster title (2-5 words)\n';
    prompt += '  - description: 1-2 sentence overview\n';
    prompt += '  - keywords: array of 4-6 target keywords for this cluster\n';
    prompt += '  - rationale: 1 sentence on why this cluster matters for the hub\n';
    prompt += '\nRespond ONLY as JSON: {"clusters":[{"name":"...","description":"...","keywords":["..."],"rationale":"..."}]}';

    _wcpAIPreflight.run({
      actionId: 'ai-plan-this-hub',
      title: 'Plan this hub',
      description: existingNames.length
        ? 'AI will propose new clusters for "' + (hub.name || 'this hub') + '" (skipping the ' + existingNames.length + ' you already have). Each accepted cluster is auto-created — delete any you don\'t want.'
        : 'AI will propose 5-7 clusters for "' + (hub.name || 'this hub') + '". Each is auto-created — delete any you don\'t want.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('research'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var proposals = (parsed.clusters || []).filter(function(c) { return c && c.name; });
        if (!proposals.length) { toast('AI returned no cluster proposals', 'warning'); return; }

        // Dedup against existing cluster names (case-insensitive)
        var existingLc = {};
        existingNames.forEach(function(n) { existingLc[(n || '').toLowerCase()] = true; });

        snapshot('AI plan hub');
        var created = 0;
        var skipped = 0;
        for (var i = 0; i < proposals.length; i++) {
          var prop = proposals[i];
          var nm = (prop.name || '').trim();
          if (!nm) continue;
          if (existingLc[nm.toLowerCase()]) { skipped++; continue; }
          existingLc[nm.toLowerCase()] = true;
          createCluster({
            name: nm,
            hub_id: hubId,
            description: prop.description || '',
            keywords: Array.isArray(prop.keywords) ? prop.keywords.slice() : []
          });
          created++;
        }
        logActivity('ai_action', hub.id, hub.name, 'AI planned hub: created ' + created + ' cluster' + (created !== 1 ? 's' : '') + (skipped ? ' (skipped ' + skipped + ' duplicates)' : ''));
        // createCluster already does buildMaps + syncToTextarea per call.
        // One render at the end refreshes the hub detail view.
        render();
        if (created > 0) {
          toast('Created ' + created + ' cluster' + (created !== 1 ? 's' : '') + (skipped ? ' — ' + skipped + ' duplicate' + (skipped !== 1 ? 's' : '') + ' skipped' : '') + '. Delete any you don\'t want.', 'success');
        } else {
          toast('All ' + proposals.length + ' proposals were duplicates of existing clusters', 'info');
        }
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function aiGapAnalysisForHub(hubId) {
    var hub = S.hubMap[hubId]; if (!hub) return;
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }

    var existingClusters = getHubClusters(hubId);
    var existingContent  = getHubContent(hubId);

    if (!existingClusters.length && !existingContent.length) {
      toast('This hub is empty — use "Plan this Hub" instead', 'info');
      return;
    }

    var prompt = 'Analyse this content hub and identify the most important COVERAGE GAPS — sub-topics the hub should cover but currently doesn\'t. Propose 3-6 NEW clusters that would fill the most strategic gaps.\n\n';
    prompt += '=== HUB ===\n';
    prompt += 'Name: ' + (hub.name || '') + '\n';
    if (hub.description)     prompt += 'Description: ' + hub.description + '\n';
    if (hub.pillar_keyword)  prompt += 'Pillar keyword: ' + hub.pillar_keyword + '\n';
    if (hub.target_audience) prompt += 'Target audience: ' + hub.target_audience + '\n';

    if (existingClusters.length) {
      prompt += '\n=== EXISTING CLUSTERS (' + existingClusters.length + ') ===\n';
      for (var i = 0; i < existingClusters.length; i++) {
        var c = existingClusters[i];
        prompt += '  - ' + (c.name || '') + (c.description ? ' — ' + c.description : '');
        if (c.keywords && c.keywords.length) {
          var kwTxt = c.keywords.map(function(k) { return typeof k === 'string' ? k : (k.keyword || ''); }).filter(Boolean).slice(0, 5).join(', ');
          if (kwTxt) prompt += ' [kw: ' + kwTxt + ']';
        }
        prompt += '\n';
      }
    }

    if (existingContent.length) {
      prompt += '\n=== EXISTING CONTENT TITLES (sample) ===\n';
      var titles = existingContent.slice(0, 15).map(function(c) { return c.title; }).filter(Boolean);
      prompt += titles.join('; ') + '\n';
    }
    prompt += brandSnippet('research');

    prompt += '\n\nAnalyse coverage across these dimensions and return clusters that fill the biggest gaps:\n';
    prompt += '  1. Missing sub-topics that competitors / topical authorities cover\n';
    prompt += '  2. Intent gaps (e.g. lots of informational, no commercial / transactional)\n';
    prompt += '  3. Funnel stage gaps (top vs middle vs bottom of funnel)\n';
    prompt += '  4. Audience-segment gaps (different personas / use cases not addressed)\n';
    prompt += '  5. Format gaps (no comparison content, no how-to, etc.)\n\n';
    prompt += 'For each cluster return:\n';
    prompt += '  - name: short, publishable cluster title (2-5 words) — must NOT duplicate any existing cluster\n';
    prompt += '  - description: 1-2 sentence overview\n';
    prompt += '  - keywords: array of 4-6 target keywords\n';
    prompt += '  - gap_dimension: which of the 5 dimensions this cluster addresses\n';
    prompt += '  - rationale: 1 sentence explaining the gap this fills\n';
    prompt += '\nRespond ONLY as JSON: {"clusters":[{"name":"...","description":"...","keywords":["..."],"gap_dimension":"...","rationale":"..."}]}';

    _wcpAIPreflight.run({
      actionId: 'ai-gap-analysis-hub',
      title: 'Find gaps in this hub',
      description: 'AI will analyse the ' + existingClusters.length + ' cluster' + (existingClusters.length !== 1 ? 's' : '') + ' and ' + existingContent.length + ' content piece' + (existingContent.length !== 1 ? 's' : '') + ' in "' + (hub.name || 'this hub') + '" and propose missing clusters. Each accepted cluster is auto-created — delete any you don\'t want.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('research'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var proposals = (parsed.clusters || []).filter(function(c) { return c && c.name; });
        if (!proposals.length) { toast('AI returned no gap proposals', 'warning'); return; }

        // Dedup against existing cluster names
        var existingLc = {};
        existingClusters.forEach(function(c) { existingLc[(c.name || '').toLowerCase()] = true; });

        snapshot('AI hub gap analysis');
        var created = 0;
        var skipped = 0;
        for (var i = 0; i < proposals.length; i++) {
          var prop = proposals[i];
          var nm = (prop.name || '').trim();
          if (!nm) continue;
          if (existingLc[nm.toLowerCase()]) { skipped++; continue; }
          existingLc[nm.toLowerCase()] = true;
          // Stash the rationale in description so the user sees WHY the gap was flagged
          var desc = prop.description || '';
          if (prop.rationale) desc = (desc ? desc + ' ' : '') + '[Gap: ' + prop.rationale + ']';
          createCluster({
            name: nm,
            hub_id: hubId,
            description: desc,
            keywords: Array.isArray(prop.keywords) ? prop.keywords.slice() : []
          });
          created++;
        }
        logActivity('ai_action', hub.id, hub.name, 'AI gap analysis: created ' + created + ' cluster' + (created !== 1 ? 's' : '') + (skipped ? ' (skipped ' + skipped + ' duplicates)' : ''));
        render();
        if (created > 0) {
          toast('Created ' + created + ' gap-fill cluster' + (created !== 1 ? 's' : '') + (skipped ? ' — ' + skipped + ' duplicate' + (skipped !== 1 ? 's' : '') + ' skipped' : '') + '. Delete any you don\'t want.', 'success');
        } else {
          toast('All ' + proposals.length + ' proposals duplicate existing clusters — no gaps found', 'info');
        }
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  // Expose for events
  window._wcpAiPlanThisHub = aiPlanThisHub;
  window._wcpAiGapAnalysisForHub = aiGapAnalysisForHub;

