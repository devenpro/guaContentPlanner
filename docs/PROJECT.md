# WCP-PROJECT.md — Website Content Planner

## Drupal Configuration

| Setting | Value |
|---------|-------|
| Content Type | `website_content_planner` |
| Machine Name | `website_content_planner` |
| Body Class | `node--type-website-content-planner` |
| Edit URL | `/node/{nid}/edit` |
| App Version | 1.0.0 |

## Fields

| Label | Machine Name | Type | Widget | Required | Purpose |
|-------|-------------|------|--------|----------|---------|
| Title | `title` | String | Text | Yes | Node title (hidden by app) |
| JSON Data | `field_json_data` | Text (long) | Textarea | No | Hubs, clusters, content, types, templates, research, tags |
| JSON Meta | `field_json_meta` | Text (long) | Textarea | No | Settings, AI preferences, image metadata, categories |
| Activity Log | `field_activity_log` | Text (long) | Textarea | No | Activity entries (JSON array) |
| Images | `field_images` | Image | Image widget | No | Multi-value reference images |

## Asset Injector Setup

The app ships as **two combined files** built from `src/` by `tools/build.ps1`. See [BUILD.md](BUILD.md).

| # | File | Type | Pages | Weight |
|---|------|------|-------|--------|
| 1 | `dist/wcp.css` | CSS | `/node/*/edit` (website_content_planner) | 0 |
| 2 | `dist/wcp.js`  | JS  | same | 0 |

The single `wcp.js` contains three IIFE blocks (Part 1 → Part 2A → Part 2B) concatenated in load order. The polling between parts and `window._wcp*` exports work the same as in the previous 3-asset setup.

**Page condition (Asset Injector):**
```
Body class contains: node--type-website-content-planner
AND path matches: /node/*/edit
```

## Global Resources Required on Page

| Resource | DOM Element | Source |
|----------|-----------|-------|
| User data | `#guau-userdata` div with `#guau-userid`, `#guau-username`, etc. | Drupal Views block |
| AI config | `.llm-brand-config-data` or `.llm-config-data` div | User profile field via Views |
| Brand identity | `.brand-data` with `.brand-name`, `.brand-id`, `.brand-logo-url` | Brand Profile entity via Views |
| Brand core | `.brand-core-data` div (JSON) | Brand Profile |
| Brand content | `.brand-content-data` div (JSON) | Brand Profile |
| Brand SEO | `.brand-seo-data` div (JSON) | Brand Profile |
| jQuery | Global | Drupal core |
| Font Awesome 6 Free Solid | Global | Theme or Asset Injector |
| Bootstrap 5 | Global | Theme or Asset Injector |

## File Inventory

### Source (`src/`)

| Folder | Files | Lines | Purpose |
|--------|------:|------:|---------|
| `src/part1/` | 31 | 2,991 | Core engine: state, init, 8 built-in views, utilities, events, sync, ~70 exports |
| `src/part2a/` | 24 | 2,969 | Pipeline editor: modals, undo/redo, 8 step renderers, CRUD modals, 75 event handlers |
| `src/part2b/` | 43 | 4,315 | AI engine: LLMService, BrandService, 36 AI actions, Research/Settings/Images, Setup wizard |
| `src/styles/part1/` | 7 | 594 | Design system, app shell, components, view layouts, responsive, wizard |
| `src/styles/part2/` | 9 | 530 | Modals, forms, editors, AI picker, settings, responsive, etc. |
| **Total** | **114** | **11,399** | (lines include section/sub-section markers preserved from original) |

### Built output (`dist/`)

| File | Bytes | Purpose |
|------|------:|---------|
| `dist/wcp.js` | ~603 KB | All 3 IIFE blocks concatenated for Asset Injector |
| `dist/wcp.css` | ~106 KB | Both stylesheets concatenated |

### Where to edit what — quick lookup

| To change… | Edit |
|---|---|
| Constants, statuses, pipeline steps | `src/part1/01-constants.js` |
| State init, defaults | `src/part1/02-state.js`, `src/part1/04-migration.js` |
| Init / Drupal attach / data loading | `src/part1/03-init.js` |
| Utility helpers (icons, badges, formatters) | `src/part1/07-utilities/` |
| Built-in views (dashboard, hubs, content, tags) | `src/part1/09-renderers/` |
| Sync to Drupal textareas | `src/part1/12-sync.js` |
| API exports (`window._wcp*`) | `src/part1/14-exports.js` |
| Modals + undo/redo | `src/part2a/02-modal.js`, `src/part2a/03-undo.js` |
| Pipeline step renderers | `src/part2a/steps/step1-info.js` … `step8-export.js` |
| CRUD modals (new content, edit hub/cluster/tag/type/template) | `src/part2a/14-crud-modals/` |
| Pipeline event handlers | `src/part2a/15-events.js` |
| LLM provider integration | `src/part2b/02-llm-service.js` |
| Brand context for prompts | `src/part2b/03-brand-service.js`, `src/part2b/05-brand-prompts.js` |
| AI actions (36 handlers) | `src/part2b/06-ai-actions/` |
| Research view (4 modes) | `src/part2b/09-views/01-research/` |
| Settings tabs | `src/part2b/09-views/02-settings/` |
| Images gallery | `src/part2b/09-views/04-images.js` |
| Setup wizard step | `src/part2b/16-setup-wizard/04-step0-welcome.js` … `10-step6-review.js` |
| Setup wizard logic (validate, navigate, complete) | `src/part2b/16-setup-wizard/11-data-nav.js`, `14-complete-reset.js` |
| Wizard event handlers | `src/part2b/16-setup-wizard/15-events.js` |
| CSS variables | `src/styles/part1/01-variables.css` |
| App shell, header, sidebar styles | `src/styles/part1/02-shell.css` |
| Pipeline editor / outline / scores styles | `src/styles/part2/03-pipeline.css`, `04-scores-blocks.css` |
| Wizard styles | `src/styles/part1/06-wizard.css` |

## Sample Data Files

| File | Maps to Field | Contents |
|------|--------------|----------|
| `wcp-v1_0-sample-data.json` | `field_json_data` | 3 hubs, 5 clusters, 7 content pieces, 6 types, 1 template, 1 research session, 5 tags |
| `wcp-v1_0-sample-meta.json` | `field_json_meta` | Workspace, SEO goals, pipeline config, AI prefs, 3 image metadata, 5 categories |
| `wcp-v1_0-sample-activity.json` | `field_activity_log` | 20 activity entries |

## Session Templates

**Bug Fix Session:**
```
I need to fix [describe bug]. The issue is in [file]. Please read the relevant code first.
```

**New Feature Session:**
```
I want to add [feature] to the WCP app. It should [behavior]. Scope: [which files/views affected].
```

**AI Action Session:**
```
I want to add a new AI action called [name] to Step [N]. It should [input → output].
```
