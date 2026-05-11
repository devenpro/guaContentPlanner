  function wizardAddHub() {
    wizardSaveStepData();
    var sd = wizardGetSD();
    sd.contentHubs = sd.contentHubs || [];
    var colorIdx = sd.contentHubs.length % Constants.HUB_COLORS.length;
    sd.contentHubs.push({ name: '', description: '', pillar_keyword: '', color: Constants.HUB_COLORS[colorIdx].color });
    S.meta.workspace.setupData = sd;
    syncToTextarea();
    render();
  }

  function wizardRemoveHub(idx) {
    wizardSaveStepData();
    var sd = wizardGetSD();
    sd.contentHubs = sd.contentHubs || [];
    if (idx >= 0 && idx < sd.contentHubs.length) {
      sd.contentHubs.splice(idx, 1);
      // Remove associated clusters and re-index
      sd.contentClusters = (sd.contentClusters || []).filter(function(c) { return c.hub_index !== idx; }).map(function(c) {
        if (c.hub_index > idx) c.hub_index = c.hub_index - 1;
        return c;
      });
    }
    S.meta.workspace.setupData = sd;
    syncToTextarea();
    render();
  }

  function wizardAddCluster(hubIdx) {
    wizardSaveStepData();
    var sd = wizardGetSD();
    sd.contentClusters = sd.contentClusters || [];
    sd.contentClusters.push({ name: '', hub_index: hubIdx, keywords: [] });
    S.meta.workspace.setupData = sd;
    syncToTextarea();
    render();
  }

  function wizardRemoveCluster(clusterIdx) {
    wizardSaveStepData();
    var sd = wizardGetSD();
    sd.contentClusters = sd.contentClusters || [];
    if (clusterIdx >= 0 && clusterIdx < sd.contentClusters.length) {
      sd.contentClusters.splice(clusterIdx, 1);
    }
    S.meta.workspace.setupData = sd;
    syncToTextarea();
    render();
  }

  function wizardToggleType(typeId) {
    wizardSaveStepData();
    var sd = wizardGetSD();
    var defaultTypes = (window._wcpGetDefaultContentTypes || function() { return []; })();
    sd.selectedTypeIds = sd.selectedTypeIds || defaultTypes.map(function(t) { return t.id; });
    var pos = sd.selectedTypeIds.indexOf(typeId);
    if (pos === -1) sd.selectedTypeIds.push(typeId);
    else sd.selectedTypeIds.splice(pos, 1);
    S.meta.workspace.setupData = sd;
    syncToTextarea();
    render();
  }

  function wizardRemoveCustomType(idx) {
    wizardSaveStepData();
    var sd = wizardGetSD();
    sd.customTypes = sd.customTypes || [];
    if (idx >= 0 && idx < sd.customTypes.length) sd.customTypes.splice(idx, 1);
    S.meta.workspace.setupData = sd;
    syncToTextarea();
    render();
  }

  // ── AI Assistance Functions ──
