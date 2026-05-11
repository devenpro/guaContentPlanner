  // ============================================================
  // SECTION 2: STATE OBJECT
  // ============================================================

  var S = {
    data: { hubs: [], clusters: [], content: [], content_types: [], templates: [], research_sessions: [], tags: [] },
    meta: { workspace: {}, settings: {}, aiPreferences: {} },
    activity: [],
    user: { id: '', name: '', email: '', fullName: '', timezone: '', roles: '' },
    brand: { configured: false, identity: {}, core: null, content: null, seo: null },
    // Lookup maps
    hubMap: {}, clusterMap: {}, contentMap: {}, contentTypeMap: {}, templateMap: {}, tagMap: {},
    researchSessionMap: {},
    // Aggregated counts
    statusCounts: {}, hubCounts: {}, totalContent: 0, activeContent: 0, exportedContent: 0,
    totalClusters: 0, totalHubs: 0, totalGaps: 0,
    // UI state
    currentView: 'dashboard', previousView: null,
    selectedContentId: null, currentStep: 'info',
    selectedHubId: null, selectedTemplateId: null, hubDetailTab: 'tree',
    settingsTab: 'workspace', researchMode: 'keywords',
    // Sequential research flow state
    researchFlow: { step: 1, sessionId: '', topics: {}, selectedTopics: [] },
    // Content view state
    contentFilter: { search: '', statuses: [], type: '', hub: '', tag: '', sortBy: 'updated', sortDir: 'desc', showClosed: false, groupBy: 'none', advancedOpen: false },
    // Activity view state
    activityFilter: { search: '', type: '' },
    // Tags view state
    selectedTagId: null,
    // Content Writer integration
    contentWriterItems: [], contentWriterMap: {},
    brandId: '', nodeId: '',
    // Images view state
    images: [], imageMap: {}, $imageField: null,
    selectedImageId: null,
    imageFilter: { search: '', category: '', tag: '', star: false, sort: 'newest' },
    // Shell UI
    sidebarCollapsed: false,
    // Drupal refs + flags
    $textarea: null, $metaTextarea: null, $activityTextarea: null, $sitemapTextarea: null, $form: null, $submitBtn: null,
    _initializing: false, initialized: false, _part2bTimeout: false,
    dirty: false, autoSaveTimer: null, lastSaved: null,
    // Sitemap view state
    sitemapPageMap: {}, sitemapPageByUrl: {}, sitemapGroupMap: {},
    totalSitemapPages: 0,
    selectedSitemapPageId: null,
    sitemapFilter: { search: '', priority: '', group: '', showRemoved: false, sort: 'url', sortBy: 'url' },
    sitemapTreeExpanded: {},   // groupId -> true/false (manual groups only)
    sitemapViewMode: 'flat'    // 'flat' (sorted list) | 'by_group' (manual user-defined groups)
  };

