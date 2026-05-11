# WCP-DATA-MODEL.md — Data Model Reference

## field_json_data (S.data)

### hubs[]
```javascript
{
  id: "hub_001",              // generateId('hub')
  name: "AI Content Marketing",
  description: "Hub description",
  color: "#2563eb",           // From HUB_COLORS palette
  pillar_content_id: "cnt_001", // Pillar content piece ID
  pillar_keyword: "AI content marketing",
  seo_goals: { target_da, target_traffic },
  created: "ISO", updated: "ISO"
}
```

### clusters[]
```javascript
{
  id: "cl_001",
  name: "AI Writing Tools",
  hub_id: "hub_001",          // Parent hub
  description: "Cluster description",
  status: "planned|researching|content_linked",
  keywords: ["kw1", "kw2"],
  content_ids: ["cnt_001"],   // Linked content
  created: "ISO", updated: "ISO"
}
```

### content[] (the 8-stage pipeline object)
```javascript
{
  id: "cnt_001",
  title: "Content Title",
  hub_id: "hub_001",
  cluster_id: "cl_001",
  content_type_id: "ct_001",
  template_id: "tpl_001",
  status: "info|angles|keywords|headline|outline|aeo|readiness|export_ready|exported",
  priority: "low|medium|high|critical",

  // Stage 1: Info
  basic_info: {
    audience: "", goal: "", funnel_stage: "tofu|mofu|bofu",
    word_count_target: 0, search_intent: "informational|commercial|transactional|navigational",
    serp_targets: ["Featured Snippet", "AI Overview", "PAA", "Table Snippet"]
  },

  // Stage 2: Angles
  research: {
    angles: [{ id, angle, description, selected }],
    selected_angle: "",
    competitor_analysis: "",
    uvp: "",
    eeat_plan: "",
    questions: [{ question, category: "FAQ|PAA|Long-tail" }],
    angle_custom_input: ""
  },

  // Stage 3: Keywords
  keywords: {
    primary: { keyword: "", volume: 0, difficulty: "low|medium|high|very_high" },
    secondary: ["kw1", "kw2"],
    lsi: ["term1", "term2"],
    conflicts: [{ content_id, keyword, severity }]
  },

  // Stage 4: Headline
  headline: {
    headlines: [{ text, formula }],
    selected_headline: "",
    title_tag: "",           // 50-60 chars
    meta_description: "",    // 140-160 chars
    ai_summary: ""           // 2-3 sentences for AI Overview
  },

  // Stage 5: Outline
  outline: {
    sections: [{
      heading: "", level: "H2|H3|H4",
      word_count: 0, section_type: "intro|body|conclusion|faq|cta",
      key_points: "", target_keywords: [],
      schema_type: "", snippet_target: ""
    }],
    approved: false
  },

  // Stage 6: AEO/GSEO
  aeo_gseo: {
    schema_types: ["Article", "FAQ", "HowTo"],
    qa_blocks: [{ question, answer, schema_ready }],
    citation_score: 0, ai_overview_score: 0,
    eeat_status: { experience, expertise, authority, trust },
    seo_score: 0, gseo_score: 0, aeo_score: 0
  },

  // Cross-stage
  internal_links: [{ target_content_id, anchor_text, direction: "outbound|inbound" }],
  media_brief: { image_concepts: [{ type, description, alt_text }], style_references: [], brand_image_ids: [] },

  // Stage 8: Export
  export: { exported_at: "", cw_node_id: "", export_version: "", writing_instructions: "" },

  tags: ["tag_001"],
  created: "ISO", updated: "ISO",
  created_by: "1", assigned_to: ""
}
```

### content_types[]
```javascript
{
  id: "ct_001", name: "Blog Post", icon: "pen-fancy",
  description: "Standard articles — 1,500-3,000 words",
  color: "#2563eb", instructions: "",
  default_schema: "Article",
  snippet_targets: ["featured_snippet", "paa"],
  default_intent: "informational",
  cw_content_type: "blog_post",
  word_count_range: { min: 1500, max: 3000 },
  fields: ["title", "meta_description", "featured_image"]
}
```

### templates[]
```javascript
{
  id: "tpl_001", name: "Standard Blog Post",
  content_type_id: "ct_001", description: "",
  uses_count: 3,
  sections: [{
    name: "Introduction", instructions: "Hook the reader...",
    heading_level: "H2", section_type: "intro", est_words: 250
  }]
}
```

### research_sessions[]
```javascript
{
  id: "rs_001", title: "Keywords: AI content",
  topic: "AI content marketing", type: "keywords|topics|gaps|competitor",
  input: { topic, count, brand_context, scope, focus },
  analysis: "",  // Competitor mode only
  results: [{
    id: "rr_001", title: "", keyword: "",
    volume: 0, difficulty: "", search_intent: "",
    cluster: "", content_type: "", description: "",
    reasoning: "", priority: "", promoted: false
  }],
  created: "ISO", updated: "ISO"
}
```

### tags[]
```javascript
{
  id: "tag_001", name: "Pillar Content",
  color: "#7c3aed", group: "Priority",
  description: "Hub pillar pages",
  created: "ISO"
}
```

### keyword_groups[]
```javascript
{
  id: "kwg_001",
  name: "Provider in Bangalore",       // Group name
  intent: "Find a trusted service provider in Bangalore",  // Shared user intent
  search_intent: "commercial",         // informational/commercial/transactional/navigational
  keywords: [
    { keyword: "best service provider bangalore", volume: 2400, difficulty: "medium" },
    { keyword: "trusted professional bangalore", volume: 1200, difficulty: "low" }
  ],
  primary_keyword_index: 0,            // Index of primary keyword in array
  content_id: "",                       // Linked content piece (FK)
  hub_id: "", cluster_id: "",           // Optional organization
  source_session_id: "",                // Research session that created this group
  notes: "",
  created: "ISO", updated: "ISO"
}
```

---

## field_json_meta (S.meta)

```javascript
{
  workspace: {
    name, description, configured, created,
    setupStep: 0,          // 0-6, current wizard step (for save/resume)
    setupStarted: "",      // ISO timestamp, when wizard was first opened
    setupCompleted: "",    // ISO timestamp, when wizard was completed
    setupData: {           // Staging area — committed to S.data on wizard completion
      workspaceName: "", workspaceDescription: "", timezone: "",
      brandOverrides: { brand_name, industry, target_audience, brand_voice, writing_style, content_pillars },
      contentHubs: [{ name, description, pillar_keyword, color }],
      contentClusters: [{ name, hub_index, keywords }],
      selectedTypeIds: ["ct_001", "ct_002"],  // IDs of selected default content types
      customTypes: [{ id, name, description, icon, color }],
      seoGoals: { monthly_target, da_current, da_target, traffic_current, traffic_target, keywords_current, keywords_target, primary_markets },
      aiProvider: "", aiModel: "", aiTested: false
    }
  },

  settings: {
    timezone: "Asia/Kolkata",
    seo_goals: {
      monthly_target: 12, da_current: 0, da_target: 50,
      traffic_current: 0, traffic_target: 50000,
      keywords_current: 0, keywords_target: 50,
      primary_markets: ["US", "UK"], deadlines: {}
    },
    pipeline_stages: [{ id: "info", name: "Info", required_fields: [], auto_advance: true }],
    brand_context_enabled: { core: true, content: true, seo: true },
    export_config: {
      cw_landing_stage: "research",
      include_writing_instructions: true, include_media_brief: true,
      include_link_map: true, include_schema_plan: true,
      include_research_data: "none|summarized|full",
      content_type_mapping: { blog_post: "blog_post", guide: "guide" }
    }
  },

  aiPreferences: {
    appDefault: { provider: "gemini", model: "gemini-2.0-flash" },
    perAction: { "ai-research-angles": { provider, model } },
    lastProvider: "", lastModel: ""
  },

  reference_images: {
    "idx_0": { category: "brand_style", tags: ["logo"], star: true, description: "", notes: "", usage: ["cnt_001"] }
  },

  image_categories: [
    { id: "brand_style", label: "Brand Style", icon: "palette", color: "#2563eb" }
  ]
}
```

---

## field_activity_log (S.activity)

```javascript
[{
  id: "act_001",
  type: "content_created|content_status_changed|hub_created|cluster_created|ai_action|research_session|...",
  content_id: "cnt_001",
  content_title: "Content Title",
  hub_id: "", hub_name: "",
  description: "3 angles generated",
  timestamp: "ISO",
  user_id: "1", user_name: "admin"
}]
```

**Activity Types:** `content_created`, `content_updated`, `content_status_changed`, `content_deleted`, `hub_created`, `hub_updated`, `hub_deleted`, `cluster_created`, `cluster_updated`, `cluster_deleted`, `tag_created`, `tag_deleted`, `ai_action`, `angles_researched`, `keywords_researched`, `headlines_generated`, `outline_generated`, `aeo_analyzed`, `readiness_audited`, `research_session`, `gap_analysis`, `template_created`, `template_deleted`, `workspace_exported`, `workspace_imported`, `settings_changed`
