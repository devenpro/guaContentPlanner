  // ============================================================
  // SECTION 14: API EXPORTS
  // ============================================================

  window._wcpState = S;

  // Core
  window._wcpRender = renderCurrentView;
  window._wcpNavigate = navigate;
  window._wcpToast = toast;
  window._wcpGenerateId = generateId;
  window._wcpBuildMaps = buildMaps;
  window._wcpSyncToTextarea = syncToTextarea;
  window._wcpUpdateSaveStatus = updateSaveStatus;
  window._wcpLogActivity = logActivity;

  // Formatters
  window._wcpFormatDate = formatDate;
  window._wcpFormatDateShort = formatDateShort;
  window._wcpFormatRelativeTime = formatRelativeTime;
  window._wcpFormatNumber = formatNumber;

  // Utilities
  window._wcpEsc = esc;
  window._wcpIcon = icon;
  window._wcpTruncate = truncate;
  window._wcpDeepClone = deepClone;
  window._wcpDebounce = debounce;
  window._wcpIsEmpty = isEmpty;
  window._wcpCountWords = countWords;

  // Badges
  window._wcpBadge = badge;
  window._wcpStatusBadge = statusBadge;
  window._wcpPriorityBadge = priorityBadge;
  window._wcpScoreBadge = scoreBadge;
  window._wcpProgressBar = progressBar;

  // Getters
  window._wcpGetHubClusters = getHubClusters;
  window._wcpGetHubContent = getHubContent;
  window._wcpGetClusterContent = getClusterContent;
  window._wcpGetContentType = getContentType;
  window._wcpGetTemplate = getTemplate;
  window._wcpGetAllTags = getAllTags;
  window._wcpResolveTag = resolveTag;
  window._wcpGetRecentActivity = getRecentActivity;

  // Auto-status + quick-advance (used by the ▶ button in the content-detail
  // header; Part 2A imports these alongside maybeAdvanceStatus)
  window._wcpEvaluateAutoStatus = evaluateAutoStatus;
  window._wcpMaybeAdvanceStatus = maybeAdvanceStatus;
  window._wcpAdvanceContentStatus = advanceContentStatus;
  window._wcpNextQuickAdvanceStatus = nextQuickAdvanceStatus;

  // Relation helpers (hub ↔ cluster ↔ content ↔ pillar sync). Used by the
  // content-detail event handlers + new-content modal to keep bidirectional
  // references consistent through every mutation.
  window._wcpAssignContentToCluster = assignContentToCluster;
  window._wcpAssignContentToHub = assignContentToHub;
  window._wcpClearHubPillarReferences = clearHubPillarReferences;
  window._wcpSetContentAsHubPillar = setContentAsHubPillar;

  // CRUD
  window._wcpCreateHub = createHub;
  window._wcpCreateCluster = createCluster;
  window._wcpCreateContent = createContent;
  window._wcpSaveContentField = saveContentField;

  // Content filtering
  window._wcpGetFilteredContent = getFilteredContent;
  window._wcpRenderContentListItems = renderContentListItems;
  window._wcpRenderContentDetailPane = renderContentDetailPane;

  // Content types factory
  window._wcpGetDefaultContentTypes = getDefaultContentTypes;
  window._wcpRenderTemplateListItems = renderTemplateListItems;

  // Keyword groups
  window._wcpGetContentKeywordGroups = getContentKeywordGroups;
  window._wcpGetHubKeywordGroups = getHubKeywordGroups;
  window._wcpGetUnlinkedKeywordGroups = getUnlinkedKeywordGroups;

  // Constants
  window._wcpConstants = {
    APP_VIEWS: APP_VIEWS, SUB_VIEWS: SUB_VIEWS, NAV_GROUPS: NAV_GROUPS,
    CONTENT_STATUSES: CONTENT_STATUSES, STATUS_ORDER: STATUS_ORDER, ACTIVE_STATUSES: ACTIVE_STATUSES,
    LIVE_STATUSES: LIVE_STATUSES, CLOSED_STATUSES: CLOSED_STATUSES, QUICK_ADVANCE_PATH: QUICK_ADVANCE_PATH,
    PIPELINE_STEPS: PIPELINE_STEPS, CLUSTER_STATUSES: CLUSTER_STATUSES,
    HUB_COLORS: HUB_COLORS, SEARCH_INTENTS: SEARCH_INTENTS, FUNNEL_STAGES: FUNNEL_STAGES,
    PRIORITY_LEVELS: PRIORITY_LEVELS, ACTIVITY_TYPES: ACTIVITY_TYPES,
    SITEMAP_PRIORITIES: SITEMAP_PRIORITIES, SITEMAP_LINK_STATES: SITEMAP_LINK_STATES,
    CONTENT_DEPTHS: CONTENT_DEPTHS
  };

  // Sitemap utils (used by Part 2A modals for import/preview)
  window._wcpCanonicalizeUrl = canonicalizeUrl;
  window._wcpFetchPageTitle = fetchPageTitle;
  window._wcpFetchTitlesForSitemap = fetchTitlesForSitemap;
  window._wcpParseSitemapCSV = parseSitemapCSV;
  window._wcpParseSitemapXML = parseSitemapXML;
  window._wcpPreviewSitemapImport = previewSitemapImport;
  window._wcpImportSitemapPages = importSitemapPages;
  window._wcpAddSitemapPage = addSitemapPage;
  window._wcpUpdateSitemapPage = updateSitemapPage;
  window._wcpSetSitemapPagePriority = setSitemapPagePriority;
  window._wcpDeleteSitemapPage = deleteSitemapPage;
  window._wcpEffectivePriority = effectivePriority;
  window._wcpOnContentPublished = onContentPublished;
  // Sitemap groups (manual)
  window._wcpCreateSitemapGroup = createSitemapGroup;
  window._wcpUpdateSitemapGroup = updateSitemapGroup;
  window._wcpDeleteSitemapGroup = deleteSitemapGroup;
  window._wcpSetSitemapPageGroup = setSitemapPageGroup;
  // Link engine + ledger
  window._wcpScoreSitemapPagesForContent = scoreSitemapPagesForContent;
  window._wcpExplainNoLinkCandidates = explainNoLinkCandidates;
  window._wcpGetLinksForContent = getLinksForContent;
  window._wcpCreateSitemapLink = createSitemapLink;
  window._wcpUpdateSitemapLink = updateSitemapLink;
  window._wcpDeleteSitemapLink = deleteSitemapLink;
  window._wcpFlipContentLinksToExported = flipContentLinksToExported;
