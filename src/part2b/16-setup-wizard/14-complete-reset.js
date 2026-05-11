  function wizardCompleteSetup() {
    wizardSaveStepData();
    var v = wizardValidateAll();
    if (!v.valid) {
      for (var i = 0; i < v.errors.length; i++) toast(v.errors[i], 'error', 5000);
      return;
    }

    var sd = wizardGetSD();

    // 1. Workspace info
    S.meta.workspace.name = sd.workspaceName || 'Content Hub';
    S.meta.workspace.description = sd.workspaceDescription || '';
    S.meta.settings.timezone = sd.timezone || S.meta.settings.timezone || 'Asia/Kolkata';

    // 2. Brand overrides
    if (sd.brandOverrides && Object.keys(sd.brandOverrides).filter(function(k) { return sd.brandOverrides[k]; }).length) {
      S.meta.brandOverrides = sd.brandOverrides;
    }

    // 3. Create hubs
    var hubIdMap = {};
    var hubsData = sd.contentHubs || [];
    for (var hi = 0; hi < hubsData.length; hi++) {
      if (!hubsData[hi].name || !hubsData[hi].name.trim()) continue;
      var newHub = createHub({
        name: hubsData[hi].name.trim(),
        description: hubsData[hi].description || '',
        color: hubsData[hi].color || Constants.HUB_COLORS[hi % Constants.HUB_COLORS.length].color,
        pillar_keyword: hubsData[hi].pillar_keyword || ''
      });
      hubIdMap[hi] = newHub.id;
    }

    // 4. Create clusters
    var clustersData = sd.contentClusters || [];
    for (var ci = 0; ci < clustersData.length; ci++) {
      if (!clustersData[ci].name || !clustersData[ci].name.trim()) continue;
      var parentHubId = hubIdMap[clustersData[ci].hub_index] || '';
      createCluster({
        name: clustersData[ci].name.trim(),
        hub_id: parentHubId,
        keywords: clustersData[ci].keywords || []
      });
    }

    // 5. Content types
    var defaultTypes = (window._wcpGetDefaultContentTypes || function() { return []; })();
    var selectedIds = sd.selectedTypeIds || defaultTypes.map(function(t) { return t.id; });
    S.data.content_types = defaultTypes.filter(function(t) { return selectedIds.indexOf(t.id) !== -1; });
    // Add custom types
    var customs = sd.customTypes || [];
    for (var cti = 0; cti < customs.length; cti++) {
      var ct = customs[cti];
      S.data.content_types.push({
        id: ct.id || generateId('ct'),
        name: ct.name, icon: ct.icon || 'file', description: ct.description || '',
        color: ct.color || '#80868b', instructions: '', default_schema: 'Article',
        snippet_targets: [], default_intent: 'informational', cw_content_type: ct.name.toLowerCase().replace(/\s+/g, '_'),
        word_count_range: { min: 1000, max: 3000 }, fields: ['title', 'meta_description']
      });
    }

    // 6. SEO goals
    if (sd.seoGoals) {
      var sg = S.meta.settings.seo_goals;
      if (sd.seoGoals.monthly_target) sg.monthly_target = sd.seoGoals.monthly_target;
      if (sd.seoGoals.da_current !== undefined) sg.da_current = sd.seoGoals.da_current;
      if (sd.seoGoals.da_target) sg.da_target = sd.seoGoals.da_target;
      if (sd.seoGoals.traffic_current !== undefined) sg.traffic_current = sd.seoGoals.traffic_current;
      if (sd.seoGoals.traffic_target) sg.traffic_target = sd.seoGoals.traffic_target;
      if (sd.seoGoals.keywords_current !== undefined) sg.keywords_current = sd.seoGoals.keywords_current;
      if (sd.seoGoals.keywords_target) sg.keywords_target = sd.seoGoals.keywords_target;
      if (sd.seoGoals.primary_markets && sd.seoGoals.primary_markets.length) sg.primary_markets = sd.seoGoals.primary_markets;
    }

    // 7. AI default — already persisted by the inline-picker change handler
    // in src/part2b/14-events.js as the user selects on step 5. Kept here as
    // a fallback for any legacy setup data carrying the old aiProvider/aiModel
    // fields (e.g. resumed from a saved wizard started before this refactor).
    if (sd.aiProvider && sd.aiModel) {
      S.meta.aiPreferences.appDefault = { provider: sd.aiProvider, model: sd.aiModel };
    }

    // 8. Finalize
    S.meta.workspace.configured = true;
    S.meta.workspace.setupCompleted = new Date().toISOString();

    var hubCount = Object.keys(hubIdMap).length;
    var clusterCount = clustersData.filter(function(c) { return c.name && c.name.trim(); }).length;
    logActivity('setup_completed', '', '', 'Setup wizard completed — ' + hubCount + ' hubs, ' + clusterCount + ' clusters created');
    if (snapshot) snapshot('Setup wizard complete');
    buildMaps(); syncToTextarea(); render();
    toast('Workspace configured! Welcome to your Content Planner.', 'success', 6000);
  }

  // ── Reset (re-enter wizard) ──
  function wizardResetSetup() {
    S.meta.workspace.configured = false;
    S.meta.workspace.setupStep = 0;
    S.meta.workspace.setupStarted = '';
    S.meta.workspace.setupCompleted = '';
    S.meta.workspace.setupData = {};
    logActivity('setup_started', '', '', 'Setup wizard restarted');
    syncToTextarea(); navigate('dashboard');
    toast('Setup wizard restarted', 'info');
  }

