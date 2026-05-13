  // ============================================================
  // SECTION 1: INIT & IMPORTS
  // ============================================================

  // Part 1 imports (populated in initPart2A)
  var S, render, navigate, toast, generateId, buildMaps, syncToTextarea;
  var updateSaveStatus, logActivity;
  var esc, icon, truncate, deepClone, debounce, isEmpty, countWords;
  var formatDate, formatDateShort, formatRelativeTime, formatNumber;
  var badge, statusBadge, priorityBadge, scoreBadge, progressBar;
  var getHubClusters, getHubContent, getClusterContent;
  var getContentType, getTemplate, getAllTags, resolveTag;
  var getRecentActivity;
  var evaluateAutoStatus, maybeAdvanceStatus, advanceContentStatus, nextQuickAdvanceStatus;
  var assignContentToCluster, assignContentToHub, clearHubPillarReferences, setContentAsHubPillar;
  var createHub, createCluster, createContent, saveContentField;
  var getFilteredContent, renderContentListItems, renderContentDetailPaneFallback;
  var getContentKeywordGroups, getUnlinkedKeywordGroups;
  var renderTemplateListItems;
  var Constants;

  // Poll for Part 1 readiness
  var _checkCount = 0;
  var checkInterval = setInterval(function() {
    _checkCount++;
    if (window._wcpState && window._wcpState.initialized) {
      clearInterval(checkInterval);
      initPart2A();
    } else if (_checkCount > 100) {
      clearInterval(checkInterval);
      console.error('[WCP] Part 2A: Timed out waiting for Part 1');
    }
  }, 100);

  function initPart2A() {
    console.log('[WCP] Initializing Part 2A...');

    // ── Import state ──
    S = window._wcpState;

    // ── Import core functions ──
    render          = window._wcpRender;
    navigate        = window._wcpNavigate;
    toast           = window._wcpToast;
    generateId      = window._wcpGenerateId;
    buildMaps       = window._wcpBuildMaps;
    syncToTextarea  = window._wcpSyncToTextarea;
    updateSaveStatus = window._wcpUpdateSaveStatus;
    logActivity     = window._wcpLogActivity;

    // ── Import formatters ──
    formatDate         = window._wcpFormatDate;
    formatDateShort    = window._wcpFormatDateShort;
    formatRelativeTime = window._wcpFormatRelativeTime;
    formatNumber       = window._wcpFormatNumber;

    // ── Import utilities ──
    esc        = window._wcpEsc;
    icon       = window._wcpIcon;
    truncate   = window._wcpTruncate;
    deepClone  = window._wcpDeepClone;
    debounce   = window._wcpDebounce;
    isEmpty    = window._wcpIsEmpty;
    countWords = window._wcpCountWords;

    // ── Import UI helpers ──
    badge         = window._wcpBadge;
    statusBadge   = window._wcpStatusBadge;
    priorityBadge = window._wcpPriorityBadge;
    scoreBadge    = window._wcpScoreBadge;
    progressBar   = window._wcpProgressBar;

    // ── Import data helpers ──
    getHubClusters  = window._wcpGetHubClusters;
    getHubContent   = window._wcpGetHubContent;
    getClusterContent = window._wcpGetClusterContent;
    getContentType  = window._wcpGetContentType;
    getTemplate     = window._wcpGetTemplate;
    getAllTags       = window._wcpGetAllTags;
    resolveTag      = window._wcpResolveTag;
    getRecentActivity = window._wcpGetRecentActivity;

    // ── Import status logic ──
    evaluateAutoStatus     = window._wcpEvaluateAutoStatus;
    maybeAdvanceStatus     = window._wcpMaybeAdvanceStatus;
    advanceContentStatus   = window._wcpAdvanceContentStatus;
    nextQuickAdvanceStatus = window._wcpNextQuickAdvanceStatus;

    // ── Import relation helpers (hub/cluster/pillar sync) ──
    assignContentToCluster   = window._wcpAssignContentToCluster;
    assignContentToHub       = window._wcpAssignContentToHub;
    clearHubPillarReferences = window._wcpClearHubPillarReferences;
    setContentAsHubPillar    = window._wcpSetContentAsHubPillar;

    // ── Import CRUD ──
    createHub     = window._wcpCreateHub;
    createCluster = window._wcpCreateCluster;
    createContent = window._wcpCreateContent;
    saveContentField = window._wcpSaveContentField;

    // ── Import keyword group helpers ──
    getContentKeywordGroups = window._wcpGetContentKeywordGroups;
    getUnlinkedKeywordGroups = window._wcpGetUnlinkedKeywordGroups;

    // ── Import template list helper ──
    renderTemplateListItems = window._wcpRenderTemplateListItems;

    // ── Import content view helpers (for list refreshes) ──
    getFilteredContent   = window._wcpGetFilteredContent;
    renderContentListItems = window._wcpRenderContentListItems;
    renderContentDetailPaneFallback = window._wcpRenderContentDetailPane;

    // ── Import constants ──
    Constants = window._wcpConstants;

    // ── AI picker helper — lazy evaluation (Part 2B may not be loaded yet) ──
    window._wcpAiSel = function(actionId) {
      if (window._wcpPart2B && window._wcpPart2B.renderInlinePicker) {
        return window._wcpPart2B.renderInlinePicker(actionId);
      }
      // Part 2B not ready yet — show loading placeholder that gets replaced later
      return '<span class="wcp-ai-picker-loading" data-pending-action="' + esc(actionId) + '">' +
        icon('spinner') + '</span>';
    };

    // ── Register renderers ──
    var R = window._wcpRenderers = window._wcpRenderers || {};
    R.contentDetailView = renderContentDetailView;
    R.step_info = renderStepInfo;
    R.tagInput  = renderTagInput;
    R.templateDetailView = renderTemplateDetailView;

    // ── Init ──
    setupPart2AEvents();
    snapshot('Initial state');

    // ── Export API (MUST be inside initPart2A so Part 2B knows we're ready) ──
    window._wcpPart2A = {
      snapshot: snapshot, undo: undo, redo: redo,
      openModal: openModal, closeModal: closeModal,
      openConfirmDialog: openConfirmDialog, closeConfirmDialog: closeConfirmDialog,
      collectModalFields: collectModalFields,
      getSelectedContent: getSelectedContent,
      setNestedValue: setNestedValue, getNestedValue: getNestedValue,
      buildExportJson: buildExportJson,
      openNewContentModal: openNewContentModal,
      openEditHubModal: openEditHubModal,
      openEditClusterModal: openEditClusterModal,
      deleteContentConfirm: deleteContentConfirm,
      deleteHubConfirm: deleteHubConfirm, deleteClusterConfirm: deleteClusterConfirm,
      duplicateContent: duplicateContent,
      openEditTypeModal: openEditTypeModal, openEditTemplateModal: openEditTemplateModal
    };

    // Signal readiness for Part 2B
    S._part2aReady = true;

    if (render) render();
    console.log('[WCP] Part 2A initialized — renderers registered, API exported');
  }

