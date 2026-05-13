# WCP-CHANGELOG.md — Version History

## Unreleased

### Standardization to shared Go Ultra AI app layout

Brought the Content Planner shell into compliance with the new shared
in-product layout standard at `docs/05-app-layout-system.md`. Visual
chrome unchanged for most users; underlying tokens, icons, and
sidebar wiring now match what every Go Ultra AI app will follow.

- **Tokens** — Introduced `--gua-*` brand tokens at the top of
  `src/styles/part1/01-variables.css`. Re-aliased `--wcp-primary`,
  `--wcp-primary-hover`, `--wcp-primary-light`, semantic colors, and
  the full grey scale to the brand tokens. Primary blue shifted from
  `#2563eb` to `#1a73e8` everywhere it surfaces as brand color
  (buttons, focus rings, hover lifts). Replaced all
  `rgba(37,99,235,…)` literals across 12 CSS files with
  `rgba(26,115,232,…)`. Domain colors (`--wcp-hub`, `--wcp-cluster`,
  `--wcp-content`, `--wcp-coral`, `--wcp-teal`, `--wcp-pink`)
  intentionally retained their literal values — they encode app
  semantics that ~80 JS literals depend on.
- **Icons** — Removed reliance on Font Awesome Pro. The icon helper
  now aliases `fa-wand-magic-sparkles` → `fa-wand-sparkles` and
  keeps the existing `fa-rocket-launch` → `fa-rocket` fallback.
  README and PROJECT.md updated to list "Font Awesome 6 Free Solid"
  as the prerequisite instead of FA Pro.
- **Sidebar nav groups** — Renamed `Strategy` → `Work` and
  `System` → `Settings` to match the canonical labels in
  `05-app-layout-system.md` §4.3. `Overview`, `Content`, and
  `Library` already matched.
- **Sidebar brand mark** — Replaced the hardcoded `W` span with
  `icon('sitemap')`. Each Go Ultra AI app now picks its own FA Free
  Solid icon for this slot.
- **Mobile drawer** — The sidebar toggle is now viewport-aware. Above
  992px it toggles inline collapse as before; at or below 992px it
  toggles a drawer with a backdrop. A resize listener clears mobile
  classes when the viewport grows past the breakpoint.

## v1.0.0 (2026-03-31)

### Initial Release

**Phase 1 — Foundation (part1.css + part1.js)**
- Design system with 80+ CSS variables, 4 responsive breakpoints
- App shell: fixed header with AI status, collapsible sidebar (5 groups), main content area
- State management: 3-field architecture (data, meta, activity)
- Global resource parsing: user data, brand context (3 sections), image field bridge
- Hash navigation with URL sync
- 8 built-in view renderers: Dashboard, Hubs, Hub Detail, Content, Types, Templates, Tags, Activity
- 28 delegated event handlers
- Auto-save (30s), toast system, auto-status engine
- ~50 window._wcp* API exports

**Phase 2 — All Views Built**
- Dashboard with metrics cards, status distribution, recent activity, hub overview
- Hub management with tree view, cluster cards, content lists, link architecture
- Content list/detail split-pane with filtering, search, sort
- Types, Templates, Tags CRUD views
- Activity log with type filters

**Phase 3 — Pipeline Editor (part2.css + part2a.js)**
- Modal system (open/close/confirm/collect)
- Undo/redo (max 50 snapshots)
- 8 interactive step renderers:
  - Step 1 Info: type selector, hub/cluster cascade, intent/funnel, SERP targets
  - Step 2 Angles: 4-phase research with locked states
  - Step 3 Keywords: pill manager with Enter-to-add
  - Step 4 Headline: radio list with char counts + SERP preview
  - Step 5 Outline: drag-and-drop sections, heading cycling, edit modal, approve
  - Step 6 AEO/GSEO: 3 score cards, schema toggles, EEAT grid, Q&A blocks
  - Step 7 Readiness: auto-calculated score ring, 22-item checklist, "Fix →" navigation
  - Step 8 Export: validation checklist, field mapping, JSON preview/copy/export
- 14 CRUD modals replacing all prompt()/confirm() calls
- Tag input component with add/remove

**Phase 4 — AI Engine (part2b.js)**
- LLMService: 8 providers, DOM config parsing, per-action model preferences, inline picker, callAI with provider-specific formatting
- BrandService: core/content/seo context, system prompt builder, brand snippets
- JSON parsing with 6-level fallback + callAIWithRetry
- 36 AI action handlers across all pipeline steps + hub/global operations
- Research Station: 4 modes (Keywords, Topics, Gaps, Competitor), session management, promote-to-content
- Settings: 7 tabs (Workspace, Brand, AI Providers, AI Actions, SEO Goals, Pipeline, Export to CW)
- Images: gallery grid, filter bar, detail panel with metadata editing, Drupal field bridge
- Workspace import/export (JSON backup/restore)

**Phase 5 — Polish**
- Pipeline header actions: duplicate, delete, status dropdown
- Content type CRUD modal with full fields (icon, color, schema, intent, word count)
- Template CRUD modal
- Delete-type and delete-template with confirm dialogs + usage warnings
- Settings select change handler fix
- Total Part 1 handler overrides: 18

**Audit & Fixes**
- Fixed init chain race condition: Part 2A exports moved inside initPart2A(), added S._part2aReady flag
- Part 2B polls for triple condition: initialized + _part2aReady + _wcpPart2A
- Part 2B resilient init: individual try-catch per step, always re-renders
- Error boundary in renderCurrentView: crashing views show error instead of blank
- Null guards in all Part 2B view renderers
- Timeout increased to 12s with diagnostic info
- Improved "Module Not Loaded" message with 4 troubleshooting steps
- Fixed missing CSS: 13 image classes + 4 settings tab classes added to wcp-part2.css
- Pipeline toggle save null guard

### Final Stats
- **Total lines:** 8,543 (5 code files)
- **Functions:** ~223
- **Event handlers:** ~144
- **AI actions:** 36
- **Views:** 10 main + 1 sub-view
- **Pipeline steps:** 8 (interactive editors)
- **CRUD modals:** 14
- **CSS classes:** ~420
- **API exports:** ~70
