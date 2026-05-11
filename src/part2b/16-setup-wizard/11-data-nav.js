  function wizardSaveStepData() {
    var sd = wizardGetSD();
    var step = wizardGetStep();

    // Read all simple fields
    $('.wcp-wizard-field').each(function() {
      var $f = $(this);
      var path = $f.data('wizard-path');
      if (!path) return;
      var val = $f.val();

      // Handle nested paths like "brandOverrides.brand_name" and "seoGoals.monthly_target"
      var parts = path.split('.');
      if (parts.length === 2) {
        sd[parts[0]] = sd[parts[0]] || {};
        if ($f.attr('type') === 'number') val = val ? parseFloat(val) : 0;
        sd[parts[0]][parts[1]] = val;
      } else if (path.indexOf('hub-name-') === 0) {
        var hi = parseInt(path.replace('hub-name-', ''), 10);
        sd.contentHubs = sd.contentHubs || [];
        if (sd.contentHubs[hi]) sd.contentHubs[hi].name = val;
      } else if (path.indexOf('hub-kw-') === 0) {
        var hki = parseInt(path.replace('hub-kw-', ''), 10);
        sd.contentHubs = sd.contentHubs || [];
        if (sd.contentHubs[hki]) sd.contentHubs[hki].pillar_keyword = val;
      } else if (path.indexOf('hub-desc-') === 0) {
        var hdi = parseInt(path.replace('hub-desc-', ''), 10);
        sd.contentHubs = sd.contentHubs || [];
        if (sd.contentHubs[hdi]) sd.contentHubs[hdi].description = val;
      } else if (path.indexOf('cluster-name-') === 0) {
        var ci = parseInt(path.replace('cluster-name-', ''), 10);
        sd.contentClusters = sd.contentClusters || [];
        if (sd.contentClusters[ci]) sd.contentClusters[ci].name = val;
      } else {
        if ($f.attr('type') === 'number') val = val ? parseFloat(val) : 0;
        sd[path] = val;
      }
    });

    // Handle primary markets as array
    if (sd.seoGoals && typeof sd.seoGoals.primary_markets === 'string') {
      sd.seoGoals.primary_markets = sd.seoGoals.primary_markets.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    }

    // AI picker selection on step 5: the inline-picker change handler in
    // src/part2b/14-events.js already calls LLMService.savePreference(...)
    // on every change, which writes S.meta.aiPreferences.appDefault.
    // No need to mirror into setupData any more — appDefault is the canonical store.

    S.meta.workspace.setupData = sd;
    syncToTextarea();
  }

  // ── Validation ──
  function wizardValidateStep(idx) {
    var sd = wizardGetSD();
    var errors = [];
    switch (idx) {
      case 0:
        if (!sd.workspaceName || !sd.workspaceName.trim()) errors.push('Workspace name is required');
        break;
      case 2:
        var hubs = sd.contentHubs || [];
        var validHubs = hubs.filter(function(h) { return h.name && h.name.trim(); });
        if (!validHubs.length) errors.push('Add at least one content hub with a name');
        break;
      case 3:
        var defaultTypes = (window._wcpGetDefaultContentTypes || function() { return []; })();
        var selIds = sd.selectedTypeIds || defaultTypes.map(function(t) { return t.id; });
        var customLen = (sd.customTypes || []).length;
        if (!selIds.length && !customLen) errors.push('Select at least one content type');
        break;
      case 4:
        if (!sd.seoGoals || !sd.seoGoals.monthly_target || sd.seoGoals.monthly_target < 1) errors.push('Monthly content target must be at least 1');
        break;
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function wizardValidateAll() {
    var errors = [], warnings = [];
    var sd = wizardGetSD();

    // Required checks
    if (!sd.workspaceName || !sd.workspaceName.trim()) errors.push('Workspace name is required (Step 1)');
    var hubs = sd.contentHubs || [];
    if (!hubs.filter(function(h) { return h.name && h.name.trim(); }).length) errors.push('Add at least one content hub (Step 3)');
    var defaultTypes = (window._wcpGetDefaultContentTypes || function() { return []; })();
    var selIds = sd.selectedTypeIds || defaultTypes.map(function(t) { return t.id; });
    if (!selIds.length && !(sd.customTypes || []).length) errors.push('Select at least one content type (Step 4)');
    if (!sd.seoGoals || !sd.seoGoals.monthly_target || sd.seoGoals.monthly_target < 1) errors.push('Set a monthly content target (Step 5)');

    // Warnings
    if (!(S.brand && S.brand.configured)) {
      var bo = sd.brandOverrides || {};
      if (!bo.brand_name && !bo.industry) warnings.push('No brand data detected and no overrides set — AI features will work without brand context');
    }
    if (!LLMService.isConfigured()) warnings.push('No AI providers configured — AI features will be unavailable');
    var clustered = (sd.contentClusters || []).filter(function(c) { return c.name && c.name.trim(); });
    if (hubs.length && !clustered.length) warnings.push('No clusters added — consider adding clusters to organize content within hubs');

    return { valid: errors.length === 0, errors: errors, warnings: warnings };
  }

  // ── Navigation ──
  function wizardNextStep() {
    wizardSaveStepData();
    var step = wizardGetStep();
    var v = wizardValidateStep(step);
    if (!v.valid) {
      // Show error
      var $body = $('#wizardStepBody');
      $body.find('.wcp-wizard-error').remove();
      for (var i = 0; i < v.errors.length; i++) {
        $body.prepend('<div class="wcp-wizard-error">' + icon('circle-exclamation') + ' ' + esc(v.errors[i]) + '</div>');
      }
      return;
    }
    S.meta.workspace.setupStep = step + 1;
    syncToTextarea();
    render();
  }

  function wizardPrevStep() {
    wizardSaveStepData();
    var step = wizardGetStep();
    if (step > 0) {
      S.meta.workspace.setupStep = step - 1;
      syncToTextarea();
      render();
    }
  }

  function wizardGoToStep(stepIdx) {
    if (typeof stepIdx !== 'number' || stepIdx < 0 || stepIdx >= WIZARD_STEPS.length) return;
    var currentStep = wizardGetStep();
    if (stepIdx > currentStep) return; // Can't skip ahead
    wizardSaveStepData();
    S.meta.workspace.setupStep = stepIdx;
    syncToTextarea();
    render();
  }

  // ── Dynamic hub/cluster management ──
