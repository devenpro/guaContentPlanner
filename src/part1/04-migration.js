  // ============================================================
  // SECTION 4: DATA MIGRATION & DEFAULTS
  // ============================================================

  function getDefaultData() {
    return {
      hubs: [], clusters: [], content: [],
      content_types: getDefaultContentTypes(),
      templates: [],
      research_sessions: [],
      tags: [],
      keyword_groups: [],
      sitemap: { pages: [], groups: [], links: [], planned: {} }
    };
  }

  function getDefaultMeta() {
    return {
      workspace: { name: '', description: '', configured: false, created: new Date().toISOString(), setupStep: 0, setupStarted: '', setupCompleted: '', setupData: {} },
      settings: {
        timezone: 'Asia/Kolkata',
        seo_goals: {
          monthly_target: 12, da_current: 0, da_target: 50,
          traffic_current: 0, traffic_target: 50000,
          keywords_current: 0, keywords_target: 50,
          primary_markets: [], deadlines: {}
        },
        pipeline_stages: getDefaultPipelineConfig(),
        brand_context_enabled: { core: true, content: true, seo: true, design_guide: true },
        export_config: {
          cw_landing_stage: 'research',
          include_writing_instructions: true,
          include_link_map: true,
          include_schema_plan: true,
          include_research_data: 'summarized',
          content_type_mapping: {
            blog_post: 'blog_post', guide: 'guide', landing: 'landing',
            case_study: 'case_study', comparison: 'comparison', how_to: 'how_to'
          }
        }
      },
      aiPreferences: { appDefault: {}, perAction: {}, lastProvider: '', lastModel: '', defaultInstructions: '' },
      // Persistent snapshot of the last successful brand-data parse.
      // Lets cold loads show brand context immediately while the
      // MutationObserver waits for the real DOM to arrive. Overwritten
      // whenever parseBrandData() succeeds with a populated payload.
      brand_cache: { identity: {}, core: null, content: null, seo: null, cachedAt: '' },
      lastLocation: {
        view: 'dashboard',
        selectedContentId: null, selectedHubId: null, selectedTemplateId: null,
        selectedSitemapPageId: null,
        currentStep: 'info',
        settingsTab: 'workspace', researchTab: 'keywords',
        savedAt: ''
      }
    };
  }

  function getDefaultContentTypes() {
    return [
      { id: 'ct_001', name: 'Blog Post', icon: 'pen-fancy', description: 'Standard articles — 1,500-3,000 words', color: '#2563eb', instructions: '', default_schema: 'Article', snippet_targets: ['featured_snippet', 'paa'], default_intent: 'informational', cw_content_type: 'blog_post', word_count_range: { min: 1500, max: 3000 }, fields: ['title', 'meta_description', 'featured_image'] },
      { id: 'ct_002', name: 'Ultimate Guide', icon: 'book', description: 'Long-form comprehensive guides — 5,000+ words', color: '#7c3aed', instructions: '', default_schema: 'Article', snippet_targets: ['featured_snippet'], default_intent: 'informational', cw_content_type: 'guide', word_count_range: { min: 5000, max: 10000 }, fields: ['title', 'meta_description', 'toc', 'featured_image'] },
      { id: 'ct_003', name: 'Landing Page', icon: 'bullseye', description: 'Conversion-focused pages with CTA', color: '#059669', instructions: '', default_schema: 'WebPage', snippet_targets: [], default_intent: 'commercial', cw_content_type: 'landing', word_count_range: { min: 500, max: 2000 }, fields: ['headline', 'value_props', 'cta'] },
      { id: 'ct_004', name: 'Case Study', icon: 'chart-line', description: 'Client success stories with data', color: '#d97706', instructions: '', default_schema: 'Article', snippet_targets: [], default_intent: 'commercial', cw_content_type: 'case_study', word_count_range: { min: 1500, max: 3000 }, fields: ['client', 'challenge', 'solution', 'results'] },
      { id: 'ct_005', name: 'Comparison', icon: 'arrows-left-right', description: 'Product/tool comparison posts', color: '#dc2626', instructions: '', default_schema: 'Article', snippet_targets: ['table_snippet'], default_intent: 'commercial', cw_content_type: 'comparison', word_count_range: { min: 2000, max: 4000 }, fields: ['products', 'criteria', 'verdict'] },
      { id: 'ct_006', name: 'How-To', icon: 'list-ol', description: 'Step-by-step instructional content', color: '#0d9488', instructions: '', default_schema: 'HowTo', snippet_targets: ['featured_snippet', 'paa'], default_intent: 'informational', cw_content_type: 'how_to', word_count_range: { min: 1500, max: 4000 }, fields: ['title', 'steps', 'tools_needed'] }
    ];
  }

  function getDefaultPipelineConfig() {
    return PIPELINE_STEPS.map(function(step) {
      return { id: step.key, name: step.label, required_fields: [], auto_advance: true };
    });
  }

  function migrateData() {
    var d = S.data;
    d.hubs = d.hubs || [];
    d.clusters = d.clusters || [];
    d.content = d.content || [];
    d.content_types = d.content_types || getDefaultContentTypes();
    d.templates = d.templates || [];
    d.research_sessions = d.research_sessions || [];
    d.tags = d.tags || [];
    d.keyword_groups = d.keyword_groups || [];
    d.content_writer_links = d.content_writer_links || [];
    d.sitemap = d.sitemap || { pages: [], groups: [], links: [], planned: {} };
    d.sitemap.pages   = d.sitemap.pages   || [];
    d.sitemap.groups  = d.sitemap.groups  || [];
    d.sitemap.links   = d.sitemap.links   || [];
    // Planned sitemap = one nested tree per hub. Key = hub_id, value =
    // { root_id, nodes: [{ id, parent_id, ... }] }. Phase 3 introduces the
    // shape; Phase 4 builds the editor, Phase 5 adds AI planning. Live pages
    // in d.sitemap.pages[] are unaffected — the two trees co-exist and can
    // be diff'd later.
    d.sitemap.planned = d.sitemap.planned || {};

    // Ensure each hub has all fields
    for (var hi = 0; hi < d.hubs.length; hi++) {
      var h = d.hubs[hi];
      h.description = h.description || '';
      h.color = h.color || '#2563eb';
      h.pillar_keyword = h.pillar_keyword || '';
      h.pillar_content_id = h.pillar_content_id || '';
      h.seo_goals = h.seo_goals || {};
      h.created = h.created || new Date().toISOString();
      h.updated = h.updated || h.created;
    }

    // Ensure each cluster has all fields
    for (var ci = 0; ci < d.clusters.length; ci++) {
      var cl = d.clusters[ci];
      cl.hub_id = cl.hub_id || '';
      cl.description = cl.description || '';
      cl.status = cl.status || 'planned';
      cl.keywords = cl.keywords || [];
      cl.content_ids = cl.content_ids || [];
      // Full-object suggestion history: persisted across generations so the
      // user can return to pick more, see which ones were already adopted,
      // and manually prune. Replaces legacy `ai_suggested_titles` (which
      // stays alive as a dedup source for the next aiSuggestContent() run).
      if (!Array.isArray(cl.ai_suggestions)) cl.ai_suggestions = [];
      cl.created = cl.created || new Date().toISOString();
      cl.updated = cl.updated || cl.created;
    }

    // Ensure each content piece has all sub-objects
    for (var coi = 0; coi < d.content.length; coi++) {
      var c = d.content[coi];
      c.hub_id = c.hub_id || '';
      c.cluster_id = c.cluster_id || '';
      c.content_type_id = c.content_type_id || '';
      c.template_id = c.template_id || '';
      c.status = c.status || 'info';
      c.basic_info = c.basic_info || { audience: '', goal: '', funnel_stage: '', word_count_target: 0, search_intent: '', serp_targets: [] };
      // Phase 3 brief additions — all optional
      if (c.basic_info.content_depth === undefined) c.basic_info.content_depth = '';
      if (c.basic_info.tone_of_voice === undefined) c.basic_info.tone_of_voice = '';
      if (c.basic_info.word_count_min === undefined) c.basic_info.word_count_min = 0;
      if (c.basic_info.word_count_max === undefined) c.basic_info.word_count_max = 0;
      if (!Array.isArray(c.basic_info.ctas)) c.basic_info.ctas = [];
      if (!Array.isArray(c.basic_info.serp_targets)) c.basic_info.serp_targets = [];
      c.research = c.research || { angles: [], selected_angle: '', competitor_analysis: '', uvp: '', eeat_plan: '', questions: [] };
      if (!Array.isArray(c.research.faqs)) c.research.faqs = [];
      if (!Array.isArray(c.research.entities)) c.research.entities = [];
      if (!Array.isArray(c.research.external_references)) c.research.external_references = [];
      c.keywords = c.keywords || { primary: { keyword: '', volume: 0, difficulty: '' }, secondary: [], lsi: [], conflicts: [] };
      c.headline = c.headline || { headlines: [], selected_headline: '', title_tag: '', meta_description: '', ai_summary: '' };
      c.outline = c.outline || { sections: [], approved: false };
      c.aeo_gseo = c.aeo_gseo || { schema_types: [], qa_blocks: [], citation_score: 0, ai_overview_score: 0, eeat_status: {}, seo_score: 0, gseo_score: 0, aeo_score: 0 };
      c.internal_links = c.internal_links || [];
      // media_brief / image_concepts / style_references / brand_image_ids were
      // part of the now-removed reference-images feature. Strip on load so the
      // data drops out of S.data on the next syncToTextarea() save.
      if (c.media_brief !== undefined) delete c.media_brief;
      c.export = c.export || { exported_at: '', cw_node_id: '', export_version: '', writing_instructions: '' };
      c.direction = c.direction || { headline_hints: '', structure_notes: '', writing_instructions: '', schema_direction: [], seo_notes: '' };
      // Migrate writing_instructions from export to direction if direction is empty
      if (!c.direction.writing_instructions && c.export && c.export.writing_instructions) {
        c.direction.writing_instructions = c.export.writing_instructions;
      }
      // Migrate old statuses to new single-step pipeline (info / export_ready / exported).
      // Anything pre-export collapses to either 'info' (data not ready) or 'export_ready'
      // (had direction text, so was effectively ready to export).
      var _legacyMidStages = ['headline','outline','aeo','readiness','angles','keywords','direction'];
      if (_legacyMidStages.indexOf(c.status) !== -1) {
        var _hadDirection = c.direction && (c.direction.writing_instructions || c.direction.headline_hints || c.direction.structure_notes);
        c.status = _hadDirection ? 'export_ready' : 'info';
      }
      c.tags = c.tags || [];
      c.published_url = c.published_url || '';
      c.created = c.created || new Date().toISOString();
      c.updated = c.updated || c.created;
      c.created_by = c.created_by || '';
      c.assigned_to = c.assigned_to || '';
    }

    // Migrate sitemap pages — ensure all fields
    for (var spi = 0; spi < (d.sitemap.pages || []).length; spi++) {
      var sp = d.sitemap.pages[spi];
      sp.id = sp.id || generateId('sp');
      sp.url = sp.url || '';
      sp.title = sp.title || '';
      sp.path_segments = sp.path_segments || [];
      sp.group_id = sp.group_id || '';
      sp.priority = (sp.priority === 1 || sp.priority === 2 || sp.priority === 3) ? sp.priority : null;
      sp.content_id = sp.content_id || '';
      sp.source = sp.source || 'imported_csv';
      sp.status = sp.status || 'live';
      sp.keywords = sp.keywords || [];
      sp.meta_description = sp.meta_description || '';
      // GSC-style metrics — numeric, optional. Refreshed in place on re-import.
      if (typeof sp.clicks !== 'number') sp.clicks = 0;
      if (typeof sp.impressions !== 'number') sp.impressions = 0;
      if (typeof sp.position !== 'number') sp.position = 0;
      if (typeof sp.ctr !== 'number') sp.ctr = 0;
      sp.metrics_updated_at = sp.metrics_updated_at || '';
      // Freeform notes for arbitrary page-level context (not covered by structured fields)
      sp.notes = sp.notes || '';
      sp.imported_at = sp.imported_at || new Date().toISOString();
      sp.updated_at = sp.updated_at || sp.imported_at;
      // Hybrid hub binding (Phase 3) — every live page may have ONE primary
      // hub for tree coloring and tag arrays for secondary cross-references.
      // All optional; absent means "Unassigned" in the by-hub view.
      sp.hub_id          = sp.hub_id          || '';
      sp.cluster_id      = sp.cluster_id      || '';
      if (!Array.isArray(sp.tag_hub_ids))     sp.tag_hub_ids     = [];
      if (!Array.isArray(sp.tag_cluster_ids)) sp.tag_cluster_ids = [];
    }

    // Migrate planned sitemap trees — one document per hub. Each tree carries
    // a self-contained nodes[] array (parent_id refs); root nodes have
    // parent_id === ''. Sanitize against orphaned trees (hub deleted) by
    // dropping planned[hubId] when the hub no longer exists.
    var planned = d.sitemap.planned;
    for (var phid in planned) {
      var tree = planned[phid];
      if (!tree || typeof tree !== 'object') { delete planned[phid]; continue; }
      tree.nodes = Array.isArray(tree.nodes) ? tree.nodes : [];
      tree.root_id = tree.root_id || '';
      for (var pni = 0; pni < tree.nodes.length; pni++) {
        var pn = tree.nodes[pni];
        pn.id              = pn.id || generateId('pln');
        pn.parent_id       = pn.parent_id || '';
        pn.label           = pn.label || '';
        pn.slug            = pn.slug || '';
        pn.description     = pn.description || '';
        pn.priority        = (pn.priority === 1 || pn.priority === 2 || pn.priority === 3) ? pn.priority : null;
        pn.intent          = pn.intent || '';                // informational / commercial / etc.
        pn.content_type_id = pn.content_type_id || '';
        pn.content_id      = pn.content_id || '';            // optional link to planner content
        pn.cluster_id      = pn.cluster_id || '';            // optional secondary cluster tag
        pn.status          = pn.status || 'planned';         // 'planned' | 'proposed' (AI) | 'promoted' (linked to live page)
        pn.live_page_id    = pn.live_page_id || '';          // set when promoted to a live sitemap page
        pn.ai_meta         = pn.ai_meta || null;             // {rationale, generated_at, ...}
        pn.created         = pn.created || new Date().toISOString();
        pn.updated         = pn.updated || pn.created;
      }
    }

    // Migrate sitemap links — only committed states persist
    for (var sli = 0; sli < (d.sitemap.links || []).length; sli++) {
      var sl = d.sitemap.links[sli];
      sl.id = sl.id || generateId('sl');
      sl.from_content_id = sl.from_content_id || '';
      sl.to_page_id = sl.to_page_id || '';
      sl.anchor_text = sl.anchor_text || '';
      sl.reason = sl.reason || '';
      sl.score = sl.score || 0;
      sl.source = sl.source || 'manual';
      sl.state = sl.state || 'selected';
      sl.selected_at = sl.selected_at || '';
      sl.exported_at = sl.exported_at || '';
      sl.published_at = sl.published_at || '';
    }

    // Ensure each keyword group has all fields
    for (var kwgi = 0; kwgi < (d.keyword_groups || []).length; kwgi++) {
      var kwg = d.keyword_groups[kwgi];
      kwg.name = kwg.name || '';
      kwg.intent = kwg.intent || '';
      kwg.search_intent = kwg.search_intent || 'informational';
      kwg.keywords = kwg.keywords || [];
      kwg.primary_keyword_index = (typeof kwg.primary_keyword_index === 'number') ? kwg.primary_keyword_index : 0;
      kwg.content_id = kwg.content_id || '';
      kwg.hub_id = kwg.hub_id || '';
      kwg.cluster_id = kwg.cluster_id || '';
      kwg.source_session_id = kwg.source_session_id || '';
      kwg.notes = kwg.notes || '';
      kwg.created = kwg.created || new Date().toISOString();
      kwg.updated = kwg.updated || kwg.created;
    }

    // Ensure each content_writer_links entry has all fields
    for (var cwli = 0; cwli < (d.content_writer_links || []).length; cwli++) {
      var cwl = d.content_writer_links[cwli];
      cwl.planner_id = cwl.planner_id || '';
      cwl.cw_node_id = cwl.cw_node_id || '';
      cwl.title      = cwl.title      || '';
      cwl.url        = cwl.url        || '';
      cwl.status     = cwl.status     || '';
      cwl.created    = cwl.created    || '';
      cwl.updated    = cwl.updated    || '';
      cwl.director   = cwl.director   || '';
      cwl.last_seen  = cwl.last_seen  || '';
    }
  }

  function migrateMeta() {
    var m = S.meta;
    m.workspace = m.workspace || { name: '', description: '', configured: false, created: new Date().toISOString() };
    m.workspace.setupStep = (typeof m.workspace.setupStep === 'number') ? m.workspace.setupStep : 0;
    m.workspace.setupStarted = m.workspace.setupStarted || '';
    m.workspace.setupCompleted = m.workspace.setupCompleted || '';
    m.workspace.setupData = m.workspace.setupData || {};
    m.settings = m.settings || {};
    m.settings.timezone = m.settings.timezone || 'Asia/Kolkata';
    m.settings.seo_goals = m.settings.seo_goals || getDefaultMeta().settings.seo_goals;
    m.settings.pipeline_stages = m.settings.pipeline_stages || getDefaultPipelineConfig();
    // Clean up stale pipeline_stages entries pointing to removed steps (headline/outline/aeo/readiness)
    var validStepKeys = PIPELINE_STEPS.map(function(s) { return s.key; });
    m.settings.pipeline_stages = m.settings.pipeline_stages.filter(function(s) { return validStepKeys.indexOf(s.id) !== -1; });
    // Ensure all current pipeline steps are represented
    var existingIds = m.settings.pipeline_stages.map(function(s) { return s.id; });
    for (var psi = 0; psi < PIPELINE_STEPS.length; psi++) {
      var pstep = PIPELINE_STEPS[psi];
      if (existingIds.indexOf(pstep.key) === -1) {
        m.settings.pipeline_stages.push({ id: pstep.key, name: pstep.label, required_fields: [], auto_advance: true });
      }
    }
    m.settings.brand_context_enabled = m.settings.brand_context_enabled || { core: true, content: true, seo: true, design_guide: true };
    // Backfill design_guide toggle for workspaces saved before it existed
    if (m.settings.brand_context_enabled.design_guide === undefined) m.settings.brand_context_enabled.design_guide = true;
    m.settings.export_config = m.settings.export_config || getDefaultMeta().settings.export_config;
    m.aiPreferences = m.aiPreferences || { appDefault: {}, perAction: {}, lastProvider: '', lastModel: '', defaultInstructions: '' };
    m.aiPreferences.perAction = m.aiPreferences.perAction || {};
    if (m.aiPreferences.defaultInstructions == null) m.aiPreferences.defaultInstructions = '';
    // Normalize per-action entries to include `instructions`
    var _paKeys = Object.keys(m.aiPreferences.perAction);
    for (var _pi = 0; _pi < _paKeys.length; _pi++) {
      var _pa = m.aiPreferences.perAction[_paKeys[_pi]];
      if (_pa && typeof _pa === 'object' && _pa.instructions == null) _pa.instructions = '';
    }
    // Reference-images feature was removed — strip persisted meta so it
    // drops from saved JSON on the next sync.
    if (m.reference_images !== undefined) delete m.reference_images;
    if (m.image_categories !== undefined) delete m.image_categories;
    m.brand_cache = m.brand_cache || { identity: {}, core: null, content: null, seo: null, cachedAt: '' };
    m.lastLocation = m.lastLocation || getDefaultMeta().lastLocation;
    // Research view: collapsed from 4-mode flow to 2 tabs (keywords / competitor).
    // Drop legacy researchFlow state; map old researchMode → new researchTab.
    if (S.researchFlow) { try { delete S.researchFlow; } catch (e) { S.researchFlow = null; } }
    var _oldMode = S.researchMode || '';
    S.researchTab = (_oldMode === 'competitor') ? 'competitor' : 'keywords';
    S.currentView = readHash();
  }

