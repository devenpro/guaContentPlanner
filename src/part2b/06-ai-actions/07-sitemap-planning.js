  // ============================================================
  // SECTION 8.7: AI ACTIONS — SITEMAP PLANNING
  // ============================================================
  //
  // Two complementary actions on the planned sitemap editor:
  //
  //   aiPlanSitemap(hubId)
  //     Builds a complete proposed subtree for a hub. Pulls brand context
  //     (niche, audience, design guide), hub clusters / pillar / keywords,
  //     and existing live pages tagged to this hub (so we don't propose
  //     duplicates). Returns ~12-20 nodes in 2-3 levels of hierarchy.
  //
  //   aiExpandSitemapBranch(nodeId)
  //     Generates 4-8 child nodes under a single parent node. Useful when
  //     the user wants to flesh out one category without re-planning the
  //     whole tree.
  //
  // Both write status:'proposed' nodes into S.data.sitemap.planned[hub_id].
  // The user can edit/delete/promote them like any other node.

  function aiPlanSitemap(hubId) {
    var hub = S.hubMap[hubId];
    if (!hub) { toast('Hub not found', 'warning'); return; }
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }

    var clusters = getHubClusters(hubId);
    var hubContent = getHubContent(hubId);
    var livePages = (window._wcpGetLivePagesForHub ? window._wcpGetLivePagesForHub(hubId) : []) || [];
    var existingTree = (S.data.sitemap && S.data.sitemap.planned && S.data.sitemap.planned[hubId]) || null;
    var existingLabels = existingTree ? existingTree.nodes.map(function(n) { return n.label; }).filter(Boolean) : [];

    var prompt = 'Plan a complete sitemap (page hierarchy) for the content hub below. Think like an information architect: organise pages so a visitor can navigate from broad → specific in 1-2 clicks, and so search-engine crawlers can build topical authority. Aim for 12-20 nodes across 2-3 levels.\n\n';
    prompt += '=== HUB ===\n';
    prompt += 'Name: ' + (hub.name || '') + '\n';
    if (hub.description)    prompt += 'Description: ' + hub.description + '\n';
    if (hub.pillar_keyword) prompt += 'Pillar keyword: ' + hub.pillar_keyword + '\n';

    if (clusters.length) {
      prompt += '\n=== CLUSTERS IN THIS HUB ===\n';
      for (var ci = 0; ci < clusters.length; ci++) {
        prompt += '- ' + clusters[ci].name + (clusters[ci].description ? ' — ' + clusters[ci].description : '') + '\n';
      }
    }
    if (hubContent.length) {
      prompt += '\n=== EXISTING CONTENT (' + hubContent.length + ' pieces — these will sit somewhere in the tree) ===\n';
      var ctSample = hubContent.slice(0, 12);
      for (var hci = 0; hci < ctSample.length; hci++) prompt += '- ' + ctSample[hci].title + '\n';
      if (hubContent.length > ctSample.length) prompt += '… and ' + (hubContent.length - ctSample.length) + ' more.\n';
    }
    if (livePages.length) {
      prompt += '\n=== LIVE PAGES ALREADY TAGGED TO THIS HUB (' + livePages.length + ') ===\n';
      var pSample = livePages.slice(0, 10);
      for (var lpi = 0; lpi < pSample.length; lpi++) prompt += '- ' + (pSample[lpi].title || pSample[lpi].url) + '\n';
      if (livePages.length > pSample.length) prompt += '… and ' + (livePages.length - pSample.length) + ' more.\n';
    }
    if (existingLabels.length) {
      prompt += '\nDO NOT propose pages with these labels — they already exist in the planned tree: ' + existingLabels.join('; ') + '\n';
    }
    prompt += brandSnippet('design');

    prompt += '\n\nReturn a JSON tree. Each node has:\n';
    prompt += '  - label: short page title (2-5 words)\n';
    prompt += '  - slug: URL-friendly path fragment (lowercase, hyphens, no leading slash)\n';
    prompt += '  - description: 1 sentence on what this page covers\n';
    prompt += '  - priority: 1 (high traffic / revenue / link target) | 2 (supporting) | 3 (baseline)\n';
    prompt += '  - intent: "informational" | "commercial" | "transactional" | "navigational"\n';
    prompt += '  - rationale: 1 short sentence on why this page belongs in the hub\n';
    prompt += '  - children: array of nested nodes (same shape, max 2 levels deep)\n';
    prompt += '\nRespond ONLY as JSON: {"nodes":[{"label":"...","slug":"...","description":"...","priority":1,"intent":"informational","rationale":"...","children":[]}]}';

    _wcpAIPreflight.run({
      actionId: 'ai-plan-sitemap',
      title: 'Plan sitemap for ' + (hub.name || 'this hub'),
      description: existingLabels.length
        ? 'AI will propose new sitemap nodes for "' + (hub.name || 'this hub') + '" (skipping the ' + existingLabels.length + ' already planned). Each gets status "proposed" — edit, accept, or delete in the tree.'
        : 'AI will propose a 2-3 level sitemap tree for "' + (hub.name || 'this hub') + '". Each node gets status "proposed" — edit, accept, or delete in the tree.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('design'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var roots = (parsed && Array.isArray(parsed.nodes)) ? parsed.nodes : [];
        if (!roots.length) { toast('AI returned no sitemap nodes', 'warning'); return; }

        var existingLc = {};
        for (var eli = 0; eli < existingLabels.length; eli++) existingLc[(existingLabels[eli] || '').toLowerCase()] = true;

        snapshot('AI plan sitemap');
        var created = _walkAndCreateProposedNodes(hubId, '', roots, existingLc);
        if (!created) {
          toast('All proposed nodes already existed — nothing added', 'info');
          return;
        }
        // Auto-switch to planned mode + this hub so the result is visible
        // immediately. Selection lands on the first new root for fast review.
        S.sitemapMode = 'planned';
        S.sitemapPlanHubId = hubId;
        logActivity('ai_action', '', hub.name, 'AI planned sitemap — ' + created + ' node' + (created !== 1 ? 's' : ''));
        buildMaps(); syncToTextarea(); render();
        toast('Added ' + created + ' proposed node' + (created !== 1 ? 's' : '') + ' to the planned tree', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function aiExpandSitemapBranch(nodeId) {
    var node = (window._wcpGetPlannedNode ? window._wcpGetPlannedNode(nodeId) : null);
    if (!node) { toast('Node not found', 'warning'); return; }
    var found = window._wcpGetPlannedTree ? null : null;
    // Resolve the hub id by scanning planned trees (no direct back-ref on a
    // node). Cheap — there's only ever a handful of hubs with planned trees.
    var hubId = '';
    var planned = (S.data.sitemap && S.data.sitemap.planned) || {};
    for (var hid in planned) {
      if (planned[hid] && Array.isArray(planned[hid].nodes) && planned[hid].nodes.indexOf(node) !== -1) { hubId = hid; break; }
    }
    if (!hubId) { toast('Could not resolve hub for this node', 'warning'); return; }
    var hub = S.hubMap[hubId];
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }

    var siblings = (window._wcpGetPlannedChildren ? window._wcpGetPlannedChildren(hubId, nodeId) : []);
    var siblingLabels = siblings.map(function(n) { return n.label; }).filter(Boolean);

    var prompt = 'Expand a single branch of a planned sitemap with 4-8 child pages. The parent below is the category; the children should be the specific pages that live under it.\n\n';
    prompt += '=== HUB ===\n';
    prompt += 'Name: ' + (hub.name || '') + '\n';
    if (hub.description) prompt += 'Description: ' + hub.description + '\n';
    prompt += '\n=== PARENT NODE ===\n';
    prompt += 'Label: ' + (node.label || '') + '\n';
    if (node.slug)        prompt += 'Slug: ' + node.slug + '\n';
    if (node.description) prompt += 'Description: ' + node.description + '\n';
    if (node.intent)      prompt += 'Search intent: ' + node.intent + '\n';
    if (siblingLabels.length) prompt += '\nDO NOT propose pages with these labels — they already exist as children: ' + siblingLabels.join('; ') + '\n';
    prompt += brandSnippet('design');

    prompt += '\n\nReturn 4-8 child pages. For each node:\n';
    prompt += '  - label, slug, description, priority (1|2|3), intent, rationale\n';
    prompt += '\nRespond ONLY as JSON: {"nodes":[{"label":"...","slug":"...","description":"...","priority":2,"intent":"informational","rationale":"..."}]}';

    _wcpAIPreflight.run({
      actionId: 'ai-expand-sitemap-branch',
      title: 'Expand "' + (node.label || 'branch') + '"',
      description: 'AI will propose 4-8 child pages under this branch. Each gets status "proposed" — edit, accept, or delete in the tree.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('design'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var kids = (parsed && Array.isArray(parsed.nodes)) ? parsed.nodes : [];
        if (!kids.length) { toast('AI returned no nodes', 'warning'); return; }

        var existingLc = {};
        for (var sli = 0; sli < siblingLabels.length; sli++) existingLc[(siblingLabels[sli] || '').toLowerCase()] = true;

        snapshot('AI expand sitemap branch');
        var created = _walkAndCreateProposedNodes(hubId, nodeId, kids, existingLc);
        if (!created) { toast('All proposed children already existed', 'info'); return; }
        // Auto-expand the parent so the new nodes are visible without an extra click.
        S.plannedTreeExpanded[nodeId] = true;
        logActivity('ai_action', '', hub.name, 'AI expanded branch "' + (node.label || '') + '" — ' + created + ' node' + (created !== 1 ? 's' : ''));
        buildMaps(); syncToTextarea(); render();
        toast('Added ' + created + ' proposed child' + (created !== 1 ? 'ren' : '') + ' under "' + (node.label || 'this node') + '"', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  // Walk a nested AI response and instantiate proposed nodes via the Phase 3
  // createPlannedNode helper. Caps depth at 2 levels under the seed parent
  // (matches the prompt). Returns the count of nodes actually added.
  function _walkAndCreateProposedNodes(hubId, parentId, nodes, existingLc) {
    if (!Array.isArray(nodes)) return 0;
    var added = 0;
    function walk(parent, list, depthLeft) {
      for (var i = 0; i < list.length; i++) {
        var raw = list[i] || {};
        var lbl = (raw.label || '').toString().trim();
        if (!lbl) continue;
        var key = lbl.toLowerCase();
        if (existingLc[key]) continue;
        existingLc[key] = true;

        var pri = (raw.priority === 1 || raw.priority === 2 || raw.priority === 3) ? raw.priority : null;
        var intent = (raw.intent || '').toString().toLowerCase();
        if (intent && ['informational','commercial','transactional','navigational'].indexOf(intent) === -1) intent = '';

        var node = (window._wcpCreatePlannedNode ? window._wcpCreatePlannedNode(hubId, parent, {
          label:       lbl,
          slug:        (raw.slug || '').toString().trim(),
          description: (raw.description || '').toString().trim(),
          priority:    pri,
          intent:      intent,
          status:      'proposed',
          ai_meta:     { rationale: (raw.rationale || '').toString().trim(), generated_at: new Date().toISOString() }
        }) : null);
        if (!node) continue;
        added++;
        var kids = Array.isArray(raw.children) ? raw.children : [];
        if (kids.length && depthLeft > 0) walk(node.id, kids, depthLeft - 1);
      }
    }
    walk(parentId, nodes, 2);
    return added;
  }

  // Diff overlay (Phase 5.3) — flags planned nodes whose slug doesn't match
  // any live page, and live pages not represented in the planned tree.
  // Returned shape feeds the badges shown in the planned tree + live list.
  function buildSitemapDiff(hubId) {
    var out = { plannedOnly: [], liveOnly: [], matched: [] };
    if (!hubId) return out;
    var tree = (S.data.sitemap && S.data.sitemap.planned && S.data.sitemap.planned[hubId]) || null;
    var planned = tree ? tree.nodes : [];
    var live = (window._wcpGetLivePagesForHub ? window._wcpGetLivePagesForHub(hubId) : []) || [];
    // Slug-only match. Canonical paths would be cleaner but we don't always
    // have a domain for planned nodes — match by trailing path slug only.
    var liveBySlug = {};
    for (var li = 0; li < live.length; li++) {
      var url = live[li].url || '';
      var slug = url.replace(/^https?:\/\/[^\/]+/i, '').replace(/^\/+|\/+$/g, '').toLowerCase();
      if (slug) liveBySlug[slug] = live[li];
    }
    for (var pi = 0; pi < planned.length; pi++) {
      var pn = planned[pi];
      var pslug = (pn.slug || '').replace(/^\/+|\/+$/g, '').toLowerCase();
      if (pslug && liveBySlug[pslug]) {
        out.matched.push({ node: pn, page: liveBySlug[pslug] });
        delete liveBySlug[pslug];
      } else {
        out.plannedOnly.push(pn);
      }
    }
    for (var k in liveBySlug) out.liveOnly.push(liveBySlug[k]);
    return out;
  }

  // Promote a planned node to a live sitemap page (Phase 5.4). Creates the
  // live page from the planned node fields; marks the planned node
  // status='promoted' and stores live_page_id. Caller decides whether to
  // navigate to the live page afterwards.
  function promotePlannedNodeToLive(nodeId) {
    var node = (window._wcpGetPlannedNode ? window._wcpGetPlannedNode(nodeId) : null);
    if (!node) { toast('Node not found', 'warning'); return null; }
    if (node.status === 'promoted' && node.live_page_id && S.sitemapPageMap[node.live_page_id]) {
      toast('Already promoted', 'info');
      return S.sitemapPageMap[node.live_page_id];
    }
    // Resolve hub
    var hubId = '';
    var planned = (S.data.sitemap && S.data.sitemap.planned) || {};
    for (var hid in planned) {
      if (planned[hid] && Array.isArray(planned[hid].nodes) && planned[hid].nodes.indexOf(node) !== -1) { hubId = hid; break; }
    }
    var hub = S.hubMap[hubId];
    var slug = (node.slug || '').replace(/^\/+/, '');
    var url = slug ? '/' + slug : '/' + ((node.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));

    // Create live page (mirroring updateSitemapPage's shape).
    S.data.sitemap = S.data.sitemap || { pages: [], groups: [], links: [], planned: {} };
    S.data.sitemap.pages = S.data.sitemap.pages || [];
    var now = new Date().toISOString();
    var live = {
      id: generateId('sp'),
      url: url,
      title: node.label || '',
      path_segments: (typeof pathSegments === 'function' ? pathSegments(url) : []),
      group_id: '',
      priority: node.priority || null,
      content_id: node.content_id || '',
      source: 'planned',
      status: 'live',
      keywords: [],
      meta_description: '',
      clicks: 0, impressions: 0, ctr: 0, position: 0, metrics_updated_at: '',
      notes: node.description || '',
      imported_at: now,
      updated_at: now,
      hub_id: hubId,
      cluster_id: node.cluster_id || '',
      tag_hub_ids: [],
      tag_cluster_ids: []
    };
    S.data.sitemap.pages.push(live);
    // Update the planned node
    node.status = 'promoted';
    node.live_page_id = live.id;
    node.updated = now;
    logActivity('sitemap_planned_node_updated', node.id, node.label || '(untitled)', 'Promoted to live page');
    logActivity('sitemap_page_added', '', live.title || live.url, 'Page added from planned node' + (hub ? ' in "' + hub.name + '"' : ''));
    snapshot('Promote planned node');
    buildMaps(); syncToTextarea();
    return live;
  }
