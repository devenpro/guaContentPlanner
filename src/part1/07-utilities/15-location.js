  // ============================================================
  // SECTION 7.15: LAST-LOCATION PERSISTENCE
  // ============================================================
  //
  // Captures the user's current view + selected item + sub-tab into
  // S.meta.lastLocation so that the next time the node loads, we can
  // land them back on the same screen instead of the Dashboard.
  //
  // captureLocation() is called from navigate() and from any handler
  // that mutates a selectedXxxId / step / sub-tab. It marks S.dirty so
  // the 30s auto-save picks it up - no extra Drupal sync on every click.
  //
  // restoreLocation() runs once in init() after buildMaps() and before
  // renderApp(). It validates each id against its map, clears any that
  // no longer exist, then assigns onto S so the first render targets
  // the right view + item + tab.

  function captureLocation() {
    if (!S || !S.meta) return;
    var ll = S.meta.lastLocation = S.meta.lastLocation || {};
    ll.view                   = S.currentView || 'dashboard';
    ll.selectedContentId      = S.selectedContentId || null;
    ll.selectedHubId          = S.selectedHubId || null;
    ll.selectedTemplateId     = S.selectedTemplateId || null;
    ll.selectedSitemapPageId  = S.selectedSitemapPageId || null;
    ll.currentStep            = S.currentStep || 'info';
    ll.settingsTab            = S.settingsTab || 'workspace';
    ll.researchTab            = S.researchTab || 'keywords';
    ll.savedAt                = new Date().toISOString();
    S.dirty = true;
  }

  function restoreLocation() {
    if (!S || !S.meta) return;
    var ll = S.meta.lastLocation;
    if (!ll || typeof ll !== 'object') return;

    // View: only restore if it's a known view (APP_VIEWS or SUB_VIEWS).
    // Otherwise keep whatever readHash() / default already set.
    if (ll.view && (APP_VIEWS[ll.view] || SUB_VIEWS[ll.view])) {
      S.currentView = ll.view;
    }

    // Selections: validate against their map; clear stale ids silently.
    if (ll.selectedContentId && S.contentMap && S.contentMap[ll.selectedContentId]) {
      S.selectedContentId = ll.selectedContentId;
    }
    if (ll.selectedHubId && S.hubMap && S.hubMap[ll.selectedHubId]) {
      S.selectedHubId = ll.selectedHubId;
    }
    if (ll.selectedTemplateId && S.templateMap && S.templateMap[ll.selectedTemplateId]) {
      S.selectedTemplateId = ll.selectedTemplateId;
    }
    if (ll.selectedSitemapPageId && S.sitemapPageMap && S.sitemapPageMap[ll.selectedSitemapPageId]) {
      S.selectedSitemapPageId = ll.selectedSitemapPageId;
    }

    // Step: only if it's a known pipeline step.
    if (ll.currentStep) {
      for (var i = 0; i < PIPELINE_STEPS.length; i++) {
        if (PIPELINE_STEPS[i].key === ll.currentStep) { S.currentStep = ll.currentStep; break; }
      }
    }

    // Sub-tabs: free-form strings, restore as-is if present.
    if (ll.settingsTab)  S.settingsTab  = ll.settingsTab;
    if (ll.researchTab)  S.researchTab  = ll.researchTab;
  }

  window._wcpLocation = {
    capture: captureLocation,
    restore: restoreLocation
  };
