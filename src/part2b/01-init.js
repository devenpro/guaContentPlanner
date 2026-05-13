  // ============================================================
  // SECTION 1: INIT & IMPORTS
  // ============================================================

  var S, render, navigate, toast, generateId, buildMaps, syncToTextarea;
  var updateSaveStatus, logActivity;
  var esc, icon, truncate, deepClone, debounce, isEmpty, countWords;
  var formatDate, formatDateShort, formatRelativeTime, formatNumber;
  var badge, statusBadge, priorityBadge, scoreBadge, progressBar;
  var getHubClusters, getHubContent, getClusterContent;
  var getContentType, getTemplate, getAllTags, resolveTag;
  var getRecentActivity;
  var evaluateAutoStatus, maybeAdvanceStatus;
  var createHub, createCluster, createContent, saveContentField;
  var getFilteredContent, renderContentListItems;
  var getContentKeywordGroups, getHubKeywordGroups, getUnlinkedKeywordGroups;
  var Constants;
  var snapshot, openModal, closeModal, openConfirmDialog, closeConfirmDialog, collectModalFields;
  var getSelectedContent, buildExportJson;

  var _checkCount = 0;
  var checkInterval = setInterval(function() {
    _checkCount++;
    // Poll for Part 1 initialized AND Part 2A fully ready (not just loaded)
    if (window._wcpState && window._wcpState.initialized && window._wcpState._part2aReady && window._wcpPart2A) {
      clearInterval(checkInterval); initPart2B();
    } else if (_checkCount > 150) {
      clearInterval(checkInterval);
      console.error('[WCP] Part 2B: Timed out (15s). State=' + !!(window._wcpState && window._wcpState.initialized) + ', Part2A=' + !!window._wcpPart2A + ', Part2AReady=' + !!(window._wcpState && window._wcpState._part2aReady));
    }
  }, 100);

  function initPart2B() {
    console.log('[WCP] Initializing Part 2B...');
    var initErrors = [];

    // ── Import Part 1 ──
    try {
    S = window._wcpState;
    render = window._wcpRender; navigate = window._wcpNavigate; toast = window._wcpToast;
    generateId = window._wcpGenerateId; buildMaps = window._wcpBuildMaps;
    syncToTextarea = window._wcpSyncToTextarea; updateSaveStatus = window._wcpUpdateSaveStatus;
    logActivity = window._wcpLogActivity;
    formatDate = window._wcpFormatDate; formatDateShort = window._wcpFormatDateShort;
    formatRelativeTime = window._wcpFormatRelativeTime; formatNumber = window._wcpFormatNumber;
    esc = window._wcpEsc; icon = window._wcpIcon; truncate = window._wcpTruncate;
    deepClone = window._wcpDeepClone; debounce = window._wcpDebounce; isEmpty = window._wcpIsEmpty;
    countWords = window._wcpCountWords;
    badge = window._wcpBadge; statusBadge = window._wcpStatusBadge;
    priorityBadge = window._wcpPriorityBadge; scoreBadge = window._wcpScoreBadge;
    progressBar = window._wcpProgressBar;
    getHubClusters = window._wcpGetHubClusters; getHubContent = window._wcpGetHubContent;
    getClusterContent = window._wcpGetClusterContent; getContentType = window._wcpGetContentType;
    getTemplate = window._wcpGetTemplate; getAllTags = window._wcpGetAllTags;
    resolveTag = window._wcpResolveTag; getRecentActivity = window._wcpGetRecentActivity;
    evaluateAutoStatus = window._wcpEvaluateAutoStatus; maybeAdvanceStatus = window._wcpMaybeAdvanceStatus;
    createHub = window._wcpCreateHub; createCluster = window._wcpCreateCluster;
    createContent = window._wcpCreateContent; saveContentField = window._wcpSaveContentField;
    getFilteredContent = window._wcpGetFilteredContent; renderContentListItems = window._wcpRenderContentListItems;
    getContentKeywordGroups = window._wcpGetContentKeywordGroups; getHubKeywordGroups = window._wcpGetHubKeywordGroups;
    getUnlinkedKeywordGroups = window._wcpGetUnlinkedKeywordGroups;
    Constants = window._wcpConstants;
    } catch(e) { console.error('[WCP] Part 2B: Part 1 import failed:', e.message); initErrors.push('Part 1 imports: ' + e.message); }

    if (!S || !render || !icon) {
      console.error('[WCP] Part 2B: Critical imports missing (S=' + !!S + ', render=' + !!render + ', icon=' + !!icon + ')');
      return;
    }

    // ── Import Part 2A ──
    try {
    var P2A = window._wcpPart2A;
    if (!P2A) throw new Error('window._wcpPart2A is null');
    snapshot = P2A.snapshot; openModal = P2A.openModal; closeModal = P2A.closeModal;
    openConfirmDialog = P2A.openConfirmDialog; closeConfirmDialog = P2A.closeConfirmDialog;
    collectModalFields = P2A.collectModalFields;
    getSelectedContent = P2A.getSelectedContent; buildExportJson = P2A.buildExportJson;
    } catch(e) { console.error('[WCP] Part 2B: Part 2A import failed:', e.message); initErrors.push('Part 2A imports: ' + e.message); }

    // ── Register view renderers (do this BEFORE anything that can crash) ──
    var R = window._wcpRenderers = window._wcpRenderers || {};
    R.researchView = renderResearchView; R.setupResearchEvents = setupResearchEvents;
    R.settingsView = renderSettingsView; R.setupSettingsEvents = setupSettingsEvents;

    // Replace Part 1's placeholder wizard with the full wizard
    window._wcpRenderSetupWizard = renderFullSetupWizard;

    // ── Init services (each in own try-catch) ──
    try { setupPart2BEvents(); } catch(e) { console.error('[WCP] Part 2B: Events setup failed:', e.message); initErrors.push('Events: ' + e.message); }
    try { setupWizardEvents(); } catch(e) { console.error('[WCP] Part 2B: Wizard events failed:', e.message); initErrors.push('Wizard events: ' + e.message); }
    try { setupKeyboardShortcuts(); } catch(e) { console.error('[WCP] Part 2B: Keyboard shortcuts failed:', e.message); }
    try { LLMService.init(); } catch(e) { console.error('[WCP] Part 2B: LLMService init failed:', e.message); initErrors.push('LLMService: ' + e.message); }
    try { BrandService.init(); } catch(e) { console.error('[WCP] Part 2B: BrandService init failed:', e.message); initErrors.push('BrandService: ' + e.message); }

    // ── Replace AI picker loading placeholders ──
    try {
    $('.wcp-ai-picker-loading').each(function() {
      var actionId = $(this).data('pending-action');
      if (actionId) $(this).replaceWith(LLMService.renderInlinePicker(actionId));
    });
    } catch(e) { console.error('[WCP] Part 2B: AI picker replacement failed:', e.message); }

    // ── Update AI status ──
    try { updateAIStatusIndicator(); } catch(e) { console.error('[WCP] Part 2B: AI status update failed:', e.message); }

    // ── Clear timeout flag + re-render (ALWAYS runs) ──
    S._part2bTimeout = false;
    try { if (render) render(); } catch(e) { console.error('[WCP] Part 2B: Re-render failed:', e.message); initErrors.push('Render: ' + e.message); }

    if (initErrors.length > 0) {
      console.warn('[WCP] Part 2B initialized WITH ERRORS:', initErrors.join('; '));
      if (toast) toast('Part 2B loaded with ' + initErrors.length + ' warning(s) — check console', 'warning');
    } else {
      console.log('[WCP] Part 2B initialized — renderers: research, settings, images');
    }
  }

  function updateAIStatusIndicator() {
    var $ind = $('#wcpAiStatus');
    if (!$ind.length) return;
    if (LLMService.isConfigured()) {
      var def = LLMService.getDefault();
      var label = def ? (def.provider + '/' + def.model).substring(0, 30) : 'Ready';
      $ind.html('<span class="wcp-ai-status-dot wcp-ai-status-ok"></span><span class="wcp-ai-status-label">' + esc(label) + '</span>');
    } else {
      $ind.html('<span class="wcp-ai-status-dot wcp-ai-status-off"></span><span class="wcp-ai-status-label">No AI</span>');
    }
  }

