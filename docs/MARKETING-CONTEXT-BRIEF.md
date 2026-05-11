# Website Content Planner (WCP) — Full Context Brief

> **Purpose of this document:** A self-contained briefing to hand to another LLM so it can help plan marketing content (explainer videos, YouTube videos, tutorials, sales scripts, sales material, ad copy, landing page content, etc.) about the Website Content Planner app. It covers what the product is, who it's for, what problems it solves, every feature, the workflow, and the measurable quality/time gains it delivers.
>
> **Last refreshed:** 2026-04-23 — reflects the single-screen content view, 7-state lifecycle, Sitemap + internal-link engine, 5-tab Settings, and 12-field AI brief auto-fill. Supersedes the April 2026 "8-stage pipeline" framing.

---

## 1. Product at a Glance

**Name:** Website Content Planner (WCP)
**Version:** 1.x (continuous build; `dist/wcp.js` ~805 KB, `dist/wcp.css` ~195 KB as of April 2026)
**Category:** AI-assisted content operations platform for SEO, GSEO (Generative SEO), and AEO (Answer Engine Optimization), with a built-in sitemap + internal-link planner
**Deployment:** Drupal-native web app (runs inside a Drupal content type called `website_content_planner`). No separate server, no npm, no framework — vanilla JS + jQuery injected via Drupal Asset Injector. Data persists to 4 JSON textarea fields on the Drupal node: `field_json_data`, `field_json_meta`, `field_activity_log`, `field_sitemap_data`.
**Tagline (working):** *"Plan it, link it, ship it — one Drupal workspace for topical authority, AEO-ready briefs, and sitemap-aware internal links."*

**One-sentence pitch:** WCP turns scattered content planning (keyword research in one tool, briefs in Google Docs, sitemap audits nowhere, internal-link decisions by gut) into a single workspace where every content piece is an AI-drafted brief, every sitemap page is a ranked internal-link candidate, and every export hands off to a downstream Content Writer app — so teams ship more pieces, faster, with consistent brand voice and measurable topical authority.

---

## 2. Who It Is For

Primary users:
- **Content marketing teams** at brands, agencies, and in-house SEO shops running 10+ pieces/month
- **Solo content strategists / SEO consultants** managing multiple client brands
- **Content managers** who build briefs for external writers (briefs feed a separate "Content Writer" app via a `planner_id → cw_node_id` handoff)
- **Founders / marketers** doing their own SEO who want a structured, AI-guided workflow instead of stitching Ahrefs + Surfer + ChatGPT + Notion + a sitemap spreadsheet by hand
- **SEO ops / technical SEOs** who care about internal-link topology and want a persistent link ledger, not ad-hoc link picks

Buyer persona psychographics:
- Knows SEO is shifting to AEO / AI Overviews / Answer Engines and wants a workflow built for that shift
- Is frustrated by tool sprawl and hand-offs between research, briefing, writing, optimization
- Wants one source of truth per piece of content — including which sitemap pages it should link to and be linked from
- Values brand-voice consistency at scale — not generic AI slop

---

## 3. The Problems WCP Solves

### 3.1 Tool sprawl & context loss
Teams today run keyword research in Tool A, write briefs in Tool B, track a sitemap spreadsheet in Tool C, decide internal links by gut, and track status somewhere else. Context is lost at every handoff.

**WCP fix:** Hubs, clusters, keywords, angles, tags, brief, sitemap pages, and committed internal links all live on the same Drupal record. Nothing is ever separated from its reasoning.

### 3.2 Unstructured AI = generic output
Copy-pasting prompts into ChatGPT gives inconsistent, brand-less content.

**WCP fix:** Every AI action is a structured handler with its own tuned prompt, brand context injection (name, voice, audience, writing style, SEO niche), and post-processing. Brand-calibrated AI, not chat roulette. The flagship *AI Fill Brief* fills **12 brief fields at once** (audience, goal, intent, funnel stage, content depth, tone of voice, word-count range, angle, UVP, CTAs, entities, FAQs).

### 3.3 AEO / GSEO readiness is ad-hoc
Most workflows don't produce structured Q&A data, schema plans, or AI-Overview-ready summaries. Content ranks on Google but gets skipped by AI search.

**WCP fix:** FAQ data, entities, and AEO-friendly fields are first-class fields on every content piece, filled by AI, and emitted into the export JSON so the Content Writer app and schema layer can consume them directly.

### 3.4 Brand voice dilutes at scale
More writers + more AI = more voice drift.

**WCP fix:** `BrandService` pulls structured brand identity (core, content, SEO sections from a Drupal Brand Profile entity) and injects a `brandSnippet(contextType)` block into every AI prompt. Toggleable per-workspace in Settings → Brand Context.

### 3.5 Topical authority is hand-drawn
Hub-and-spoke topical maps live in spreadsheets. Gaps are invisible.

**WCP fix:** Hubs + clusters are core entities. Each hub has a pillar content piece, cluster children, a color, an AI-authority-audit button, and a per-hub Gap Analysis / Link Architecture view. AI can suggest new hubs, enrich clusters with keywords+angles, propose content ideas per cluster, and plan an editorial calendar for a hub.

### 3.6 Pipeline status is a gut feeling
"Is this piece ready?" gets answered by reading a doc.

**WCP fix:** A **7-state content lifecycle** — Draft → Ready → Exported → Ready to Publish → Published, with Rejected and Archived as off-path branches. A one-click ▶ quick-advance button walks content along the happy path. Status never regresses.

### 3.7 Internal linking is guesswork
"What should this piece link to?" is answered by opening five tabs and squinting. Nobody tracks which suggestions were actually committed or published.

**WCP fix:** The **Sitemap view** imports your whole site (CSV or pasted XML — handles 10K+ pages), derives a folder tree from URL paths, assigns P1/P2/P3 priorities (auto or manual or AI-suggested), and feeds a **hybrid rule+AI internal-link engine**: rule-based scoring (hub +40, cluster +30, shared keyword group +20, shared tag +10, priority boost) shortlists the top 20 candidates, then an LLM ranks the best ~8 with anchor text and reason. Every chosen link is persisted to a **link ledger** with states: `selected → exported → published` (or `rejected`). You finally know which links actually shipped.

### 3.8 Writer briefs are inconsistent
Some pieces ship with 3 bullets; others with a 2-page doc.

**WCP fix:** Every content record exports the same JSON shape — `basic_info`, `research`, `internal_links[]`, sitemap joins, FAQs, entities, CTAs, word-count range, tone, depth — and hands off to the Content Writer app via a deep link that pre-fills the planner_id. Writers get identical briefs.

### 3.9 Setup friction kills adoption
Onboarding to content-ops tools is a chore.

**WCP fix:** A **7-step interactive setup wizard** (Welcome → Brand → Content Strategy → Content Types → SEO Goals → AI Configuration → Review) with AI-assisted fill-in at each step, save-and-resume via `S.meta.workspace.setupStep`, a staging area (`setupData` never touches `S.data` until the user confirms on Review), and a "Re-enter Setup Wizard" button in Settings. Fresh workspace to configured in ~15 minutes.

---

## 4. Core Features (What Ships)

### 4.1 The 7-State Content Lifecycle

Every content record moves through this lifecycle:

```
info (Draft) → export_ready (Ready) → exported → ready_to_publish → published
                                                                       ↘ rejected  (branch)
                                                                       ↘ archived  (terminal)
```

- **Quick-advance ▶ button** — one click promotes the content along the happy path, skipping `rejected` and stopping at `published`.
- **`ACTIVE_STATUSES`** (visible by default): info, export_ready, exported, ready_to_publish
- **`CLOSED_STATUSES`** (hidden behind "Show archived + rejected"): rejected, archived
- **Overflow menu per content:** Undo, Redo, Duplicate, Reject… (pre-published only), Archive / Restore, Delete permanently (two-step confirm)
- **Publish gate:** advancing to `published` requires the user to fill a `published_url` field. That URL becomes the join key that merges the content with its matching sitemap page.

### 4.2 The Single-Screen Content Brief

Every content piece opens to **one scrollable editor** (no step bar, no wizard). Layout:

- **Two-row sticky header** — Row 1: full-width title input. Row 2 meta strip: Type chip · Hub chip · Cluster chip · Pillar chip · Priority pill group · Status pill + ▶ quick-advance · ⋮ overflow menu. Header gets a shadow on scroll.
- **Brief body** — 12-col fieldgrid with 4 collapsible sub-sections: **Audience & Intent** · **Positioning & Voice** · **Targets & Structure** · **References**. Fields include audience, goal, search intent, funnel stage (TOFU/MOFU/BOFU), content depth, tone of voice, word-count min/max, angle, UVP, CTAs, entities, FAQs, external references, tags.
- **Internal Links picker** — inline in the brief; shows rule-scored + AI-ranked candidates from the Sitemap, lets the user commit selections to the link ledger.
- **AI Fill Brief** — one button drafts 12 fields at once using brand context.
- **Export block** — "Open in Content Writer" deep-links to the separate CW app with `title`, `field_brand`, `field_planner_hub`, `field_planner_id` pre-filled. Link persisted in `S.data.content_writer_links[]`.
- **Closed-state banner** — replaces the export block when the content is archived or rejected.

### 4.3 Topical Authority Engine (Hubs + Clusters)

- **Hubs** — topic containers with pillar content, color, pillar keyword, per-hub SEO targets (target DA, target traffic). AI actions: `ai-suggest-hubs`, `ai-audit-authority` (dashboard-level), `ai-gap-analysis` (per-hub deep gap), `ai-plan-calendar` (per-hub editorial calendar), `ai-optimize-links` (plans a link architecture across the hub).
- **Clusters** — children of hubs; hold keywords, linked content, status (planned/researching/content_linked/complete). AI actions: `ai-enrich-cluster`, `ai-suggest-content` (content ideas for a cluster).
- **Pillar sync** — marking a content as a hub's pillar writes both ways; helpers in `src/part1/07-utilities/10-relations.js` keep `cluster.content_ids`, `hub.pillar_content_id`, and content-side references in sync on every write.
- **Hub detail view** — single scroll, clusters always visible, inline quick-add cluster, Gaps + Links sections.

### 4.4 Sitemap + Internal-Link Engine (new top-level view)

- **Top-level nav entry:** Sitemap (under "Library" group)
- **Import:** CSV (streaming parser) or pasted XML (regex scanner — DOMParser chokes on huge sitemaps). Handles 10K+ pages at ~120 bytes/record.
- **Tree view:** folder hierarchy derived from URL path segments; lazy-expanded; precomputed folder counts cached in `S.maps.sitemapFolderCounts`; search + priority filter flatten into a list view.
- **Detail pane:** per-page URL, title, priority pills (P1/P2/P3), keywords, inbound/outbound link counts by state, linked planner content, live edit controls.
- **Priority model:** `null` = auto (P1 = hub pillar, P2 = cluster member, P3 = default); any set value is a manual override. `ai-suggest-priorities` batches pages (40 at a time) and proposes P1/P2/P3 with a reason — user accepts/rejects in a preview modal.
- **Hybrid link engine** (`suggestInternalLinks`):
  - Rule phase (always runs): hub match +40, cluster match +30, shared keyword group +20/ea, shared tag +10/ea, priority boost → top 20 candidates
  - AI phase (when configured): LLM re-ranks, picks ~8, generates anchor text + reason
  - Fallback: rule-only when no AI is configured
- **Link ledger** — only committed states persist (`selected`, `exported`, `published`, `rejected`); `suggested` is transient. Sort by inbound count to find under-linked P1s.
- **Publish flow integration:** when content advances to `published`, its `selected` links flip to `published` and the sitemap page merges with the content record via `published_url`.

### 4.5 Multi-Provider AI Engine

- **8 LLM providers supported** via one `LLMService`: Gemini, Claude, OpenAI, Grok, Groq, NVIDIA, HuggingFace, OpenRouter
- **Per-action model selection** — default provider/model per app, plus per-action overrides (Settings → AI → Actions)
- **Inline AI picker** — every AI button has a dropdown to switch provider/model in one click
- **Retry + diagnostics** — `callAIWithRetry` with 6-level JSON-parsing fallback, `LLMService.reload()`, `getDiagnostics()`, a Reload button in Settings
- **Brand-aware prompts** — different system prompts for research / content / SEO contexts

### 4.6 AI Actions (the built-in AI helpers)

Not a single chat box — ~18 purpose-built action handlers, each with a tuned prompt:

| Action | What it does |
|---|---|
| `ai-fill-brief` | One-click fill of 12 brief fields (audience, goal, intent, funnel, depth, tone, word-count, angle, UVP, CTAs, entities, FAQs) |
| `ai-suggest-type` | Picks the best content type for a topic |
| `ai-suggest-hubs` | Proposes new hubs from brand context |
| `ai-enrich-hub` | Builds a new hub with initial clusters |
| `ai-enrich-cluster` | Expands a cluster with keywords and angles |
| `ai-suggest-content` | Generates content ideas for a cluster |
| `ai-suggest-tags` | Brand-aware tag suggestions |
| `ai-suggest-types` | Proposes new content types |
| `ai-build-template` | Generates a section-by-section content template |
| `ai-plan-calendar` | Editorial calendar for a hub |
| `ai-draft-content-brief` | Drafts a full content brief from a title + context (content wizard) |
| `ai-audit-authority` | Dashboard-level topical-authority audit |
| `ai-refresh-scores` | Recomputes dashboard scores |
| `ai-gap-analysis` | Per-hub deep gap analysis |
| `ai-optimize-links` | Plans a link architecture across a hub |
| `ai-suggest-links` | Hybrid rule+AI internal-link ranking for a content piece |
| `ai-suggest-priorities` | Batched P1/P2/P3 assignment for the sitemap |
| Research runners | Keyword research (grouped by intent), content-gap scan, competitor research |

(The legacy v1.0 changelog mentioned "36 AI actions" across 8 pipeline steps — those were consolidated into the single-screen brief's `ai-fill-brief` plus the focused action set above when the pipeline UI was unified.)

### 4.7 Research Workspace (separate view)

- **Keyword Research** — seed keyword → AI groups results by user intent, with primary keyword per group, volume, difficulty, search intent. Each group promotable to content (pre-fills keywords).
- **Content Gap scan** — inline sub-action under Keyword Research: scans existing content inventory, surfaces missing topics/intents/formats, scope filter (all content or per hub).
- **Competitor Research** — structured competitor content analysis.
- Every run is persisted as a research session (`research_sessions[]`); results promote to content in one click.

### 4.8 Content Types & Templates

- **Content types** — Blog Post, Guide, Landing Page, etc. Each with icon, color, description, default schema, default intent, word-count range, mapped CW content type. AI Suggest button for new types.
- **Templates** — fully editable section-by-section templates (each section: name, instructions, heading level, section type, est. words). Full editor in a large modal: add/remove/reorder sections. `ai-build-template` generates one from scratch.

### 4.9 Keyword Groups (intent-based)

Dedicated entity (`S.data.keyword_groups[]`) — keywords are clustered by shared user intent (e.g., "Find a trusted provider in Bangalore"), with a primary keyword per group. Groups can be linked to content, hubs, or clusters; promoting a group to content pre-fills all keywords.

### 4.10 Brand Profile Integration

- Reads structured brand identity from a separate Drupal Brand Profile entity (core, content, SEO sections)
- Every AI call can inject this context; which sections are enabled is configurable in Settings → Brand Context
- Keeps voice, audience targeting, and SEO focus consistent across hundreds of pieces

### 4.11 Content Writer (CW) Integration

- Completed briefs export to a separate Content Writer app (also Drupal-based)
- Deep-link with `title`, `field_brand`, `field_planner_hub`, `field_planner_id` pre-populated
- Links persisted in `S.data.content_writer_links[]` with `{planner_id, cw_node_id, title, url, status, created, updated, director, last_seen}` — robust to page reloads
- Green "Open in Content Writer" button appears on exported pieces
- Per-type CW content type mapping in Settings → Export

### 4.12 Setup Wizard (7 Steps)

1. **Welcome**
2. **Brand Profile** — overrides brand name, industry, target audience, voice, writing style, content pillars
3. **Content Strategy** — define content hubs + clusters (with AI suggestion)
4. **Content Types** — pick from defaults + add custom types
5. **SEO Goals** — monthly target, DA current/target, traffic current/target, keywords current/target, primary markets
6. **AI Configuration** — pick provider/model, test the connection
7. **Review & Launch**

Features: save-and-resume via `S.meta.workspace.setupStep`, staging area (`setupData` — nothing hits `S.data` until completion), AI-assisted fill-in at each step, validation, complete-reset, "Re-enter Setup Wizard" button in Settings → General.

### 4.13 Settings (5 tabs)

- **General** (Workspace + Pipeline config — merged April 2026)
- **Brand Context** (Brand Profile toggles, preview)
- **AI** (Providers + per-Action defaults — Actions sub-panel merged in)
- **SEO Goals**
- **Export to CW** (CW landing stage, what to include in brief, content type mapping)

### 4.14 Activity Log

Every mutation writes a timestamped activity entry (user, action type, target, description). 30+ activity types including: content CRUD, status changes (content_published, content_archived, content_restored, content_rejected, pillar_assigned), hub/cluster/tag CRUD, AI runs, research sessions, gap analysis, template CRUD, workspace export/import, settings changes, sitemap imports, link-ledger commits.

### 4.15 Image Management

- Multi-value image field on the content type
- Gallery view with configurable category system (brand_style, hero, diagrams, etc.)
- Per-image metadata: category, tags, star rating, description, notes, usage array
- Brand image references link into briefs

### 4.16 Tags System

Color-coded tags with groups and descriptions; `ai-suggest-tags` generates tag suggestions based on brand context.

### 4.17 Undo / Redo, Snapshots, Toasts, Modals

Full undo/redo with labeled snapshots (`snapshot('Label')`), up to 50 snapshots, toast notifications, modal system with sizes (sm/md/lg), confirm dialogs, 14+ CRUD modals (no `prompt()` / `confirm()` anywhere in the UI).

### 4.18 Auto-save

30-second auto-save interval writing to 4 Drupal textarea fields. Manual Save triggers Drupal form submit.

### 4.19 Modern UI

- Sticky content-detail 2-row header (shadow on scroll)
- `WcpSelect` component — modern searchable dropdown with keyboard nav, icons, color dots, descriptions (used for Type / Hub / Cluster / Template)
- 38px min-height controls, 1px borders, 3px soft-blue focus ring, custom SVG chevron
- Priority as pill buttons, collapsible info sub-sections
- Virtual-scrolled sitemap tree
- 4 responsive breakpoints (1200 / 992 / 768 / 480)
- 5-group sidebar nav: Overview, Strategy, Content, Library, System

---

## 5. The 11 Built-in Views (main nav)

1. **Dashboard** — metrics cards, status distribution, recent activity, hub overview, `ai-audit-authority`, `ai-refresh-scores`
2. **Content Hubs** — hub tree, cluster cards, link architecture, gap analysis, editorial calendar
3. **Research** — Keyword Research (grouped by intent), Content Gap scan, Competitor Research
4. **Content** — split-pane list + detail (the single-screen brief editor)
5. **Content Types** — type CRUD
6. **Templates** — template CRUD with full section editor
7. **Sitemap** — tree + detail pane, CSV/XML import, priority management, link ledger
8. **Images** — gallery + metadata
9. **Tags** — tag CRUD with groups
10. **Activity** — timestamped log with type filters
11. **Settings** — 5 tabs

Plus `hub-detail` as a sub-view.

---

## 6. Workflow Before vs. After

### Before WCP (typical content marketer's day)
1. Open Ahrefs / SEMrush → export keyword list → CSV
2. Paste into Google Sheet → mark intent manually
3. Pick topic → ChatGPT → prompt for angles → copy into Notion
4. Back to Ahrefs for competitor check
5. Draft brief in Google Docs
6. Forget AEO / schema → "we'll do it at the end"
7. Guess which internal links to add; no record of what was actually committed
8. Send to writer with inconsistent brief quality
9. Writer delivers → back-and-forth
10. Publish → no structured FAQ/entity data → skipped by AI Overview

**Time per piece, planning only:** 2–4 hours
**Quality risk:** brand drift, inconsistent briefs, missing AEO, no topical authority map, untracked internal links

### After WCP
1. Open a new content record → click **AI Fill Brief** → 12 fields populated from brand context + title
2. Review the 4 brief sub-sections (Audience/Intent, Positioning/Voice, Targets/Structure, References) — tweak what matters
3. Click **Suggest Internal Links** → rule+AI shortlist of sitemap pages with anchor text + reason → commit the winners to the ledger
4. Click ▶ to advance Draft → Ready → Exported; the "Open in Content Writer" button deep-links with pre-filled fields
5. Writer ships the piece in the CW app; when published, fill `published_url` and advance to Published — the link ledger flips selected → published automatically
6. Over time, the Sitemap view shows which P1 pages are under-linked; `ai-suggest-priorities` rebalances; `ai-plan-calendar` queues the next hub's content
7. Brand voice, AEO fields, and internal-link topology all handled uniformly

**Time per piece, planning:** 20–40 minutes (≈80% reduction)
**Quality gain:** consistent brand voice, every piece has AEO-ready fields, every internal link is tracked end-to-end, topical authority visible in hub/cluster views, writer briefs are uniform

---

## 7. Measurable Output & Quality Gains

**Speed**
- ~80% less time per planning cycle (2–4h → 20–40min)
- Setup wizard: 0 → fully configured workspace in ~15 min
- AI Fill Brief: 12 fields at once in ~10 seconds vs. ~30 minutes typed by hand
- Internal-link research: rule+AI shortlist in seconds vs. ~15 minutes of tab-juggling per piece

**Consistency**
- Every piece uses the same single-screen brief shape — no more "some briefs are thorough, others aren't"
- Same brand voice injection into every AI call — no drift across writers or pieces
- Auto-advancing status — pipeline tracking isn't a human chore
- Every committed internal link is in the ledger with a state

**Quality**
- 12-field brief catches strategic inputs the writer would otherwise have to invent (tone, depth, CTAs, entities, FAQs)
- FAQ / entity fields flow into the export JSON → schema + AEO are ready at the brief stage, not an afterthought
- Intent-based keyword grouping beats flat keyword lists for topical authority
- Hybrid link engine beats either pure-rule or pure-AI: rules surface obvious structural matches, AI re-ranks for editorial fit
- Sitemap priority (P1/P2/P3) surfaces under-linked high-value pages
- Conflict detection stops keyword cannibalization

**Scale**
- One workspace can hold unlimited hubs/clusters/content + a 10K+ page sitemap
- Tag system + activity log let teams of 3–20 collaborate with an audit trail
- External writers get uniform briefs via Content Writer handoff
- Link ledger = compliance + audit trail for SEO decisions

**Flexibility**
- 8 LLM providers, per-action overrides, bring your own API keys — never locked to one vendor
- Fully editable templates, content types, tag groups, image categories
- Brand context toggles per workspace
- Settings tabs collapsible, 4 responsive breakpoints

---

## 8. Technical Truths (for credibility in sales material)

- **Drupal-native** — runs inside your existing Drupal stack; no SaaS subscription, no data sent to a third-party vendor (except the LLM API the user chooses)
- **Your data stays yours** — all state in 4 JSON text fields on a Drupal node: `field_json_data`, `field_json_meta`, `field_activity_log`, `field_sitemap_data`; easy to export, backup, migrate
- **Vanilla JS architecture** — no framework lock-in; **133 source files totalling ~19,800 lines**, built by a dependency-free concat into 2 asset files (`wcp.js` ~805 KB, `wcp.css` ~195 KB)
- **Vendor-agnostic AI** — Gemini, Claude, OpenAI, Grok, Groq, NVIDIA, HuggingFace, OpenRouter
- **Single source of truth** — everything for a content piece + its internal links + its sitemap page lives in one Drupal record graph
- **Scale-minded sitemap** — streaming CSV parser, regex XML scanner, virtual-scrolled tree, lazy-expanded folders, debounced search — 10K+ pages stay responsive
- **Activity log** — every change is timestamped and attributed; compliance-ready
- **Asset Injector deploy** — upload 2 files (`wcp.js` + `wcp.css`), attach to the content type + `/node/*/edit`, done

---

## 9. Content Planning Hooks (for video / YouTube / sales)

### Suggested explainer angles
1. **"One button, twelve fields"** — the AI Fill Brief demo: blank content record → fully populated 12-field brief in ten seconds
2. **"The sitemap tells the link engine what to do"** — show CSV import → tree view → `ai-suggest-links` picking anchor text for a P1 page
3. **"From Draft to Published in one click each"** — the ▶ quick-advance flow with publish-url gate and link ledger flip
4. **"Brand voice at scale"** — set brand once, see it injected into every AI call; demo how the same title produces different briefs for two different brands
5. **"Hubs and clusters that audit themselves"** — `ai-audit-authority`, `ai-gap-analysis`, `ai-plan-calendar` chain
6. **"Multi-provider AI, one workflow"** — live-switch from Gemini to Claude to OpenAI mid-action; per-action defaults
7. **"Your internal links finally live somewhere"** — the link ledger: selected → exported → published, sortable under-linked P1 report
8. **"Setup wizard walkthrough"** — 7 steps, 15 minutes, empty → configured workspace with AI help at every step

### Suggested pain-point hooks
- *"You're still copy-pasting between Ahrefs, ChatGPT, Google Docs, and a sitemap spreadsheet?"*
- *"Your internal-link decisions live in your head. That's why coverage is uneven."*
- *"AI Overview is eating your rankings. Is your brief producing FAQ and entity data?"*
- *"Your writers get a different brief every time. That's why output quality is inconsistent."*
- *"Topical authority shouldn't live in a spreadsheet."*
- *"You configured your brand voice once. Why isn't every AI prompt using it?"*
- *"You have 5,000 sitemap pages and no way to spot the under-linked ones."*

### Suggested sales-script beats
1. **Open on the pain:** tool sprawl, tab chaos, inconsistent briefs, AI slop, ad-hoc internal linking, no sitemap audit
2. **Agitate:** content ops teams are shipping more slowly than ever, even with AI everywhere; and the AI Overview shift is punishing untagged content
3. **Reveal:** WCP — one Drupal workspace, 11 views, a 7-state lifecycle, 8 LLM providers, a hybrid rule+AI link engine, a persistent link ledger, a 12-field AI brief filler
4. **Prove:** 80% planning-time reduction, every piece AEO-field ready, every internal link tracked, consistent briefs
5. **Demo script:** new content → AI Fill Brief (12 fields) → Suggest Internal Links (rule+AI) → ▶ to Exported → Open in Content Writer
6. **Objection handling:**
   - *"We already use ChatGPT"* → Every prompt in WCP is brand-aware and tuned per action; ChatGPT is a chat box, WCP is a workflow with a ledger.
   - *"We have Surfer/Clearscope"* → Those optimize after writing. WCP plans AEO fields and internal links before writing — at the brief stage.
   - *"Our team won't learn another tool"* → Setup wizard runs in 15 minutes; the single-screen brief maps to how writers already think.
   - *"We want to use our own LLM"* → 8 providers, per-action overrides, bring your own keys.
   - *"We don't want to redo our sitemap"* → Paste your existing sitemap.xml once, done. Re-import anytime.
7. **Close:** Drupal-native, your data stays yours, 2 files to deploy, set up this week.

### Headline / slogan candidates
- *"One brief. Every link tracked. Every piece on-voice."*
- *"From sitemap to ship, in one workspace."*
- *"AEO-ready by design. Internally linked by default."*
- *"AI Fill Brief. Twelve fields. Ten seconds."*
- *"The content pipeline your tool stack was missing — now with a link ledger."*

---

## 10. Content Marketing Asset Checklist

When the secondary LLM plans content from this brief, it should produce:

- [ ] 90-second explainer video script (hook → pain → demo → CTA)
- [ ] 3–5 minute product tour video outline (Dashboard → Hubs → Research → Content brief → Sitemap → Export)
- [ ] 15–30 minute in-depth YouTube tutorial series:
  - The 12-field AI Brief
  - Sitemap import + link engine
  - Hubs, clusters, pillars
  - The 7-state lifecycle
  - Multi-provider AI setup
  - Setup wizard walkthrough
  - Brand context deep dive
  - Research workspace
- [ ] Short-form (30–60s) clips per pain point (8–10 clips)
- [ ] Landing page hero + sections (problem, solution, features, workflow, pricing, FAQ)
- [ ] Sales one-pager (pain → solution → proof → CTA)
- [ ] Cold outreach email template (3 variants by persona: agency owner, in-house SEO lead, founder)
- [ ] Sales discovery call script (pain excavation + demo pivot)
- [ ] Demo script with specific clicks tied to the 11 views
- [ ] FAQ page content (objection handling from §9)
- [ ] Blog post pillar — "The AEO-first, sitemap-aware content workflow"
- [ ] Case study template (time before / time after, output quality, internal-link coverage)
- [ ] Social proof posts (LinkedIn carousels on each feature cluster)

---

## 11. Glossary (terms the marketing LLM should use correctly)

- **Hub** — a topic cluster container with a pillar content piece (e.g., "AI Content Marketing")
- **Cluster** — a sub-topic under a hub (e.g., "AI Writing Tools")
- **Pillar content** — the flagship content piece assigned to a hub; P1 priority by default
- **Lifecycle** — the 7 content states (Draft → Ready → Exported → Ready to Publish → Published, with Rejected / Archived branches)
- **Quick-advance (▶)** — one-click status promotion along the happy path
- **SEO / GSEO / AEO** — Search Engine Optimization / Generative SEO / Answer Engine Optimization (AI Overviews, ChatGPT Search, Perplexity, etc.)
- **EEAT** — Experience, Expertise, Authority, Trust
- **Angle** — the strategic take on a topic (e.g., "for beginners" vs "for enterprise")
- **Brief** — the single-screen editor holding every planning field for a content piece
- **AI Fill Brief** — the one-click action that fills 12 brief fields at once
- **CW (Content Writer)** — the separate downstream Drupal app that receives exported briefs
- **Keyword Group** — an intent-based cluster of related keywords with one primary
- **Brand Snippet** — the injected brand-voice block in every AI prompt
- **Sitemap page** — a single row in the imported sitemap (url, title, priority, keywords, meta)
- **Link ledger** — the persistent store of internal-link decisions (states: selected, exported, published, rejected)
- **Link engine** — the hybrid rule+AI ranker that proposes internal links for a content piece
- **Priority (P1/P2/P3)** — sitemap-page importance; auto-assigned (P1 = pillar, P2 = cluster member, P3 = default) unless overridden
- **Published URL** — the live URL filled before a content advances to Published; the join key with its sitemap page
- **Activity Log** — the timestamped audit trail of every change
- **Research Session** — a saved AI research run (keywords / gaps / competitor)

---

*End of brief. Feed this entire document into the secondary LLM and ask it to plan any of the content assets listed in §10.*
