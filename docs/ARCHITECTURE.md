# WCP-ARCHITECTURE.md — Technical Architecture

## Fundamental Pattern

```
Drupal page loads → App JS detects body class → Finds & hides textarea fields
→ Parses JSON from each field → Builds state object S → Renders full UI
→ Every change syncs back to textareas → "Save" triggers Drupal form submit
```

## Initialization Chain

```
Part 1 IIFE
  └─ Sets window._wcpRenderers = {}
  └─ Sets window._wcpState = S (initialized=false)
  └─ Sets 50+ window._wcp* exports (function references)
  └─ Registers Drupal.behaviors.wcpPart1.attach()

Part 2A IIFE
  └─ Starts polling window._wcpState.initialized (100ms intervals)

Part 2B IIFE
  └─ Starts polling _wcpState.initialized + _part2aReady + _wcpPart2A (100ms)

Drupal calls attach()
  └─ isWcpPage() → body class check
  └─ init()
       ├─ parseUserData() → #guau-userdata div → S.user
       ├─ detectDrupalForm() → finds 3 textareas + field_images → hides widgets
       ├─ loadData() → parses JSON + brand DOM + image DOM
       ├─ migrateMeta() → defaults + reads hash → S.currentView
       ├─ migrateData() → ensures arrays/objects exist
       ├─ buildMaps() → lookup maps + counts
       ├─ renderApp() → header + sidebar + content area
       ├─ setupEventHandlers() → 28 delegated handlers
       ├─ startAutoSave() → 30s interval
       └─ S.initialized = true → starts 12s timeout check

Part 2A poll fires
  └─ initPart2A()
       ├─ Imports all Part 1 exports
       ├─ Registers 10 renderers (contentDetailView, 8 steps, tagInput)
       ├─ Sets up 75 event handlers
       ├─ Takes initial snapshot
       ├─ Exports window._wcpPart2A = {...} (INSIDE init)
       ├─ Sets S._part2aReady = true
       └─ Calls render()

Part 2B poll fires (after _part2aReady)
  └─ initPart2B()
       ├─ Imports Part 1 + Part 2A (individual try-catch)
       ├─ Registers 3 view renderers (research, settings, images)
       ├─ Inits LLMService (parses .llm-config-data)
       ├─ Inits BrandService (parses .brand-*-data)
       ├─ Sets up events + keyboard shortcuts
       ├─ Replaces AI picker placeholders
       └─ Calls render() (picks up hash view)
```

**Critical Design Decision:** Part 2A sets `window._wcpPart2A` INSIDE `initPart2A()` — not at IIFE level. This prevents a race condition where Part 2B detects the export before Part 2A's imports are complete.

## Global Resources Architecture

### AI Config Loading
```
1. Part 2B's LLMService.init() fires
2. Looks for: $('.llm-brand-config-data').text() → JSON parse
3. Fallback: $('.llm-config-data').text() → JSON parse
4. Parses providers[].active + models[].active → builds _providerMap
5. Resolves default: appDefault → config default → first provider's default model
```

### Brand Context Loading
```
1. Part 1's parseBrandData() fires during init
2. Reads .brand-data → identity (name, id, logoUrl)
3. Parses 3 sections: .brand-core-data, .brand-content-data, .brand-seo-data
4. Stores in S.brand = { configured, identity, core, content, seo }
5. Part 2B's BrandService.init() reads S.brand for prompt building
```

### User Info Loading
```
1. Part 1's parseUserData() fires first in init
2. Reads #guau-userdata → #guau-userid, #guau-username, etc.
3. Stores in S.user = { id, name, email, fullName, timezone, roles }
```

### Hash Navigation
```
1. migrateMeta() calls readHash() → reads window.location.hash
2. Sets S.currentView (e.g., 'research' if hash=#research)
3. renderApp() builds shell, renderCurrentView() renders the view
4. If view is research/settings/images AND Part 2B hasn't loaded → "Loading..." spinner
5. When Part 2B inits → re-renders → correct view appears
6. hashchange event handler keeps URL and view in sync
```

## State Architecture

### 3-Field Data Model
| Field | Selector | State | Persisted |
|-------|----------|-------|-----------|
| `field_json_data` | `#edit-field-json-data-0-value` | `S.data` | Yes |
| `field_json_meta` | `#edit-field-json-meta-0-value` | `S.meta` | Yes |
| `field_activity_log` | `#edit-field-activity-log-0-value` | `S.activity` | Yes |

### Save Flow
```
User edits → update S.data/S.meta → snapshot() → maybeAdvanceStatus()
→ buildMaps() → render() → syncToTextarea() → toast()

syncToTextarea() → JSON.stringify → writes to all 3 textareas → marks dirty
"Save" button → syncToTextarea() → S.$submitBtn.click() → Drupal saves to DB
```

### Renderer Registry
```javascript
window._wcpRenderers = {
  // Part 2A registers:
  contentDetailView,        // Pipeline detail view
  step_info, step_angles, step_keywords, step_headline,
  step_outline, step_aeo, step_readiness, step_export,
  tagInput,                 // Reusable tag input component

  // Part 2B registers:
  researchView, setupResearchEvents,
  settingsView, setupSettingsEvents,
  imagesView, setupImagesEvents
};
```

`renderCurrentView()` checks registered renderers first, then falls back to built-in renderers, then shows loading/error states.

### Auto-Status Engine
```
maybeAdvanceStatus(content, reason)
  → evaluateAutoStatus(content) → checks pipeline stage data completeness
  → Only advances forward (never regresses)
  → Logs activity with transition description
```

## AI Architecture

### Provider Resolution Chain
```
resolveSelection(actionId)
  1. Check S.meta.aiPreferences.perAction[actionId]
  2. Check S.meta.aiPreferences.lastProvider + lastModel
  3. Check S.meta.aiPreferences.appDefault
  4. Check _config.default_provider + default_model
  5. First active provider's default model
```

### AI Call Flow
```
aiAction(contentId)
  → Validates LLMService.isConfigured()
  → Builds prompt with brandSnippet(contextType)
  → callAIWithRetry(prompt, onSuccess, onError, actionId, systemPrompt)
     → LLMService.callAI(prompt, ..., actionId, systemPrompt)
        → resolveSelection(actionId) → gets provider/model/apiKey
        → Formats request body per provider
        → $.ajax() to provider endpoint
        → _extractText() per provider
        → onSuccess(text) → parseJSON(text) → update state → save
```

### Brand Context Injection
```
brandSnippet(contextType)
  → BrandService.getSnippet(contextType)
  → Builds text block from S.brand[contextType]
  → Returns formatted string for prompt injection
  → Empty string if brand not configured
```

## CSS Architecture

### Design System (Part 1 CSS)
- 80+ CSS variables (`--wcp-*`) for colors, spacing, typography, shadows
- App shell: fixed header, collapsible sidebar, scrollable main
- 8 built-in view layouts
- 4 responsive breakpoints: 1200px, 992px, 768px, 480px

### Component Library (Part 2 CSS)
- Modal system with backdrop + sizes (sm, md, lg)
- Pipeline editor forms
- Outline drag-and-drop
- Score cards, EEAT grid
- Settings tabs, Images gallery with detail panel
- AI picker inline dropdown
- 3 responsive breakpoints: 992px, 768px, 480px

### Prefix Convention
- All classes: `wcp-*`
- CSS variables: `--wcp-*`
- Never bare class names — always prefixed
