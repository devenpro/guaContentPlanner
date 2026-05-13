  // ============================================================
  // SECTION 1: CONSTANTS
  // ============================================================

  // Sidebar layout (May 2026): Dashboard up top, Strategy (planning), Work
  // (producing), Settings (admin). Library group was dropped when Images and
  // the standalone Tags page were removed. Sitemap moved from Library to
  // Strategy because it's a planning artifact, not a reference library.
  var APP_VIEWS = {
    'dashboard':  { order: 1, label: 'Dashboard',     icon: 'chart-pie',         group: 'Overview', description: 'Overview & metrics' },
    'hubs':       { order: 2, label: 'Content Hubs',  icon: 'sitemap',           group: 'Strategy', description: 'Topical authority areas' },
    'research':   { order: 3, label: 'Research',      icon: 'flask',             group: 'Strategy', description: 'Keyword & competitor research' },
    'sitemap':    { order: 4, label: 'Sitemap',       icon: 'diagram-project',   group: 'Strategy', description: 'Site pages + internal-link map' },
    'content':    { order: 5, label: 'Content',       icon: 'file-lines',        group: 'Work',     description: 'Content pipeline' },
    'types':      { order: 6, label: 'Content Types', icon: 'layer-group',       group: 'Work',     description: 'Configure content types' },
    'templates':  { order: 7, label: 'Templates',     icon: 'clipboard-list',    group: 'Work',     description: 'Content structure templates' },
    'activity':   { order: 8, label: 'Activity',      icon: 'clock-rotate-left', group: 'Settings', description: 'Activity log' },
    'settings':   { order: 9, label: 'Settings',      icon: 'gear',              group: 'Settings', description: 'Configuration' }
  };

  // No sub-views currently — kept as an extension point for future
  // contextual deep-links (e.g. /sitemap/<hub>/planned).
  var SUB_VIEWS = {};

  var NAV_GROUPS = ['Overview', 'Strategy', 'Work', 'Settings'];

  // Content lifecycle — 7 states spanning plan → produce → live → closed.
  // `phase` is purely for visual grouping; `branch:true` flags Rejected as an
  // off-path state that the quick-advance button skips.
  var CONTENT_STATUSES = {
    'info':             { key: 'info',             label: 'Draft',            icon: 'pencil',        color: '#9aa0a6', order: 0, phase: 'plan' },
    'export_ready':     { key: 'export_ready',     label: 'Ready',            icon: 'box-open',      color: '#059669', order: 1, phase: 'plan' },
    'exported':         { key: 'exported',         label: 'Exported',         icon: 'paper-plane',   color: '#0891b2', order: 2, phase: 'produce' },
    'ready_to_publish': { key: 'ready_to_publish', label: 'Ready to Publish', icon: 'circle-check',  color: '#16a34a', order: 3, phase: 'produce' },
    'published':        { key: 'published',        label: 'Published',        icon: 'globe',         color: '#2563eb', order: 4, phase: 'live' },
    'rejected':         { key: 'rejected',         label: 'Rejected',         icon: 'circle-xmark',  color: '#dc2626', order: 5, phase: 'closed', branch: true },
    'archived':         { key: 'archived',         label: 'Archived',         icon: 'box-archive',   color: '#6b7280', order: 6, phase: 'closed' }
  };

  var STATUS_ORDER       = ['info', 'export_ready', 'exported', 'ready_to_publish', 'published', 'rejected', 'archived'];
  var ACTIVE_STATUSES    = ['info', 'export_ready', 'exported', 'ready_to_publish'];
  var LIVE_STATUSES      = ['published'];
  var CLOSED_STATUSES    = ['rejected', 'archived'];
  // Linear happy-path walked by the ▶ quick-advance button. Skips `rejected`
  // (off-path) and stops at `published` — archiving is always a manual choice.
  var QUICK_ADVANCE_PATH = ['info', 'export_ready', 'exported', 'ready_to_publish', 'published'];

  // Single-step pipeline — content view is one scrollable screen, no step bar.
  var PIPELINE_STEPS = [
    { key: 'info', label: 'Info', icon: 'info-circle', order: 0 }
  ];

  var CLUSTER_STATUSES = {
    'planned':        { label: 'Planned',        color: '#9aa0a6' },
    'researching':    { label: 'Researching',    color: '#d97706' },
    'content_linked': { label: 'Content Linked', color: '#2563eb' },
    'complete':       { label: 'Complete',       color: '#059669' }
  };

  var HUB_COLORS = [
    { id: 'blue',   color: '#2563eb' },
    { id: 'green',  color: '#059669' },
    { id: 'purple', color: '#7c3aed' },
    { id: 'amber',  color: '#d97706' },
    { id: 'red',    color: '#dc2626' },
    { id: 'teal',   color: '#0d9488' },
    { id: 'coral',  color: '#e85d3a' },
    { id: 'pink',   color: '#d946a8' }
  ];

  var SEARCH_INTENTS = {
    'informational': { label: 'Informational', color: '#2563eb' },
    'navigational':  { label: 'Navigational',  color: '#059669' },
    'commercial':    { label: 'Commercial',    color: '#7c3aed' },
    'transactional': { label: 'Transactional', color: '#d97706' }
  };

  var FUNNEL_STAGES = {
    'tofu': { label: 'ToFu — Awareness',    color: '#2563eb' },
    'mofu': { label: 'MoFu — Consideration', color: '#7c3aed' },
    'bofu': { label: 'BoFu — Decision',      color: '#059669' }
  };

  var CONTENT_DEPTHS = {
    'beginner':     { label: 'Beginner',     desc: 'Assumes no prior knowledge' },
    'intermediate': { label: 'Intermediate', desc: 'Some familiarity with the topic' },
    'advanced':     { label: 'Advanced',     desc: 'Deep technical / practitioner level' },
    'expert':       { label: 'Expert',       desc: 'Specialist audience, cites primary sources' }
  };

  var PRIORITY_LEVELS = {
    'low':    { label: 'Low',    icon: 'arrow-down', color: '#059669' },
    'medium': { label: 'Medium', icon: 'minus',      color: '#d97706' },
    'high':   { label: 'High',   icon: 'arrow-up',   color: '#dc2626' },
    'urgent': { label: 'Urgent', icon: 'bolt',       color: '#be123c' }
  };

  var ACTIVITY_TYPES = {
    'hub_created':          { icon: 'sitemap',       color: '#059669' },
    'hub_updated':          { icon: 'sitemap',       color: '#2563eb' },
    'hub_deleted':          { icon: 'trash',         color: '#dc2626' },
    'cluster_created':      { icon: 'bookmark',      color: '#7c3aed' },
    'cluster_updated':      { icon: 'bookmark',      color: '#2563eb' },
    'cluster_deleted':      { icon: 'trash',         color: '#dc2626' },
    'content_created':      { icon: 'plus',          color: '#059669' },
    'content_updated':      { icon: 'pen',           color: '#2563eb' },
    'content_deleted':      { icon: 'trash',         color: '#dc2626' },
    'content_status_changed': { icon: 'arrows-rotate', color: '#2563eb' },
    'content_exported':     { icon: 'paper-plane',   color: '#0891b2' },
    'content_published':    { icon: 'globe',         color: '#2563eb' },
    'content_archived':     { icon: 'box-archive',   color: '#6b7280' },
    'content_restored':     { icon: 'rotate-left',   color: '#059669' },
    'content_rejected':     { icon: 'circle-xmark',  color: '#dc2626' },
    'pillar_assigned':      { icon: 'star',          color: '#d97706' },
    'angles_researched':    { icon: 'lightbulb',     color: '#d97706' },
    'keywords_researched':  { icon: 'key',           color: '#2563eb' },
    'headlines_generated':  { icon: 'heading',       color: '#7c3aed' },
    'outline_generated':    { icon: 'list-ol',       color: '#0d9488' },
    'aeo_analyzed':         { icon: 'robot',         color: '#e85d3a' },
    'gap_analysis':         { icon: 'magnifying-glass', color: '#7c3aed' },
    'research_session':     { icon: 'flask',         color: '#d97706' },
    'ai_action':            { icon: 'sparkles',      color: '#7c3aed' },
    'tag_created':          { icon: 'tag',           color: '#059669' },
    'tag_updated':          { icon: 'tag',           color: '#2563eb' },
    'tag_deleted':          { icon: 'trash',         color: '#dc2626' },
    'type_created':         { icon: 'layer-group',   color: '#059669' },
    'template_created':     { icon: 'clipboard-list',color: '#059669' },
    'settings_changed':     { icon: 'gear',          color: '#80868b' },
    'image_uploaded':       { icon: 'upload',        color: '#059669' },
    'data_imported':        { icon: 'upload',        color: '#2563eb' },
    'data_exported':        { icon: 'download',      color: '#2563eb' },
    'setup_started':        { icon: 'wand-magic-sparkles', color: '#7c3aed' },
    'setup_resumed':        { icon: 'rotate-right',        color: '#2563eb' },
    'setup_completed':      { icon: 'circle-check',        color: '#059669' },
    'setup_step_saved':     { icon: 'floppy-disk',         color: '#80868b' },
    'sitemap_imported':     { icon: 'upload',              color: '#2563eb' },
    'sitemap_page_added':   { icon: 'file-circle-plus',    color: '#059669' },
    'sitemap_page_updated': { icon: 'pen',                 color: '#2563eb' },
    'sitemap_page_removed': { icon: 'trash',               color: '#dc2626' },
    'sitemap_priority_changed': { icon: 'flag',            color: '#d97706' },
    'sitemap_link_selected':  { icon: 'link',              color: '#7c3aed' },
    'sitemap_link_exported':  { icon: 'paper-plane',       color: '#0891b2' },
    'sitemap_link_published': { icon: 'link-simple',       color: '#059669' },
    'sitemap_link_rejected':  { icon: 'link-slash',        color: '#6b7280' },
    'sitemap_planned_node_added':    { icon: 'diagram-project', color: '#059669' },
    'sitemap_planned_node_updated':  { icon: 'diagram-project', color: '#2563eb' },
    'sitemap_planned_node_moved':    { icon: 'arrows-up-down-left-right', color: '#7c3aed' },
    'sitemap_planned_node_removed':  { icon: 'trash',             color: '#dc2626' }
  };

  // Sitemap page priority — a MANUAL traffic/revenue/link-building judgement.
  // Not derived from hub/cluster structure. `null` / unset defaults to P3
  // (baseline). Users set it explicitly (or via the AI-suggest action) to
  // signal which pages deserve strategic attention for internal links and
  // (later) off-page link-building.
  var SITEMAP_PRIORITIES = {
    '1': { label: 'P1', full: 'P1 — High',     color: '#dc2626', desc: 'Strategic for traffic, revenue, link-building' },
    '2': { label: 'P2', full: 'P2 — Medium',   color: '#d97706', desc: 'Supporting content; moderate priority' },
    '3': { label: 'P3', full: 'P3 — Standard', color: '#6b7280', desc: 'Evergreen / informational; baseline' }
  };

  // Link lifecycle — only committed states persist to the ledger.
  var SITEMAP_LINK_STATES = {
    'selected':  { label: 'Selected',  color: '#7c3aed' },
    'exported':  { label: 'Exported',  color: '#0891b2' },
    'published': { label: 'Published', color: '#059669' },
    'rejected':  { label: 'Rejected',  color: '#6b7280' }
  };

