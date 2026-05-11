# DEVELOPMENT-GUIDE.md — Development Guide

> Source code lives under `src/`, organized into small focused modules.
> The build script (`tools/build.ps1` or `tools/build.js`) concatenates them
> into `dist/wcp.js` + `dist/wcp.css` for Drupal Asset Injector.
> See [BUILD.md](BUILD.md) for build details and [PROJECT.md](PROJECT.md#where-to-edit-what--quick-lookup) for the file map.

## Workflow Loop

1. Edit a small file under `src/`.
2. Run the build: `powershell tools\build.ps1` (or `node tools/build.js`).
3. Hard-refresh a node-edit page in Drupal.

## Adding a New View

1. **Register in Part 1 constants:** Add entry to `APP_VIEWS` in [src/part1/01-constants.js](../src/part1/01-constants.js).

2. **Create renderer:** Either in Part 1 (simple views — add a file under `src/part1/09-renderers/`) or Part 2B (advanced views needing AI — add a file under `src/part2b/09-views/`).
```javascript
function renderMyView() {
  var html = '<div class="wcp-view">';
  html += '<div class="wcp-view-header"><h1>' + icon('star') + ' My View</h1></div>';
  // ... build HTML
  html += '</div>';
  return html;
}
```

3. **Register renderer:**
   - Part 1 built-in: Add to `builtInRenderers` object in `renderCurrentView()` ([src/part1/06-navigation.js](../src/part1/06-navigation.js))
   - Part 2B: Register in `initPart2B()` ([src/part2b/01-init.js](../src/part2b/01-init.js)) → `R.myView = renderMyView; R.setupMyEvents = setupMyEvents;`

4. **Add CSS** to appropriate file under `src/styles/` with `wcp-` prefix, then rebuild.

## Adding a New AI Action

1. **Add button in the step renderer** (`src/part2a/steps/stepN-*.js`):
```javascript
html += '<button class="wcp-btn-ai" data-action="ai-my-action" data-id="' + esc(c.id) + '">' + icon('sparkles') + ' My AI Action</button>';
html += _wcpAiSel('ai-my-action');  // Inline AI picker
```

2. **Create handler** in the matching `src/part2b/06-ai-actions/` file (`01-steps-1-4.js`, `02-steps-5-8.js`, or `03-hub-global.js`):
```javascript
function aiMyAction(contentId) {
  var c = S.contentMap[contentId]; if (!c) return;
  if (!LLMService.isConfigured()) { toast('No AI configured', 'warning'); return; }
  toast('Working...', 'info');

  var prompt = 'Your prompt here.\n\n';
  prompt += 'Title: ' + esc(c.title) + '\n';
  prompt += brandSnippet('content');  // Inject brand context
  prompt += '\n\nRespond ONLY as JSON: {"field":"value"}';

  callAIWithRetry(prompt, function(text) {
    var parsed = parseJSON(text);
    // Update content fields
    c.my_field = parsed.field || '';
    c.updated = new Date().toISOString();
    logActivity('ai_action', c.id, c.title, 'My AI action');
    snapshot('AI my action');
    maybeAdvanceStatus(c, 'my action done');
    buildMaps(); syncToTextarea(); render();
    toast('Done!', 'success');
  }, function(err) {
    toast('AI Error: ' + err, 'error');
  }, 'ai-my-action', BrandService.getSystemPrompt('content'));
}
```

3. **Wire event handler** in `setupPart2BEvents()` ([src/part2b/14-events.js](../src/part2b/14-events.js)):
```javascript
// Add to aiActions58 map or directly:
$(document).off('click' + ns + '-myact').on('click' + ns + '-myact', '[data-action="ai-my-action"]', function() {
  var id = $(this).data('id') || S.selectedContentId;
  if (id) aiMyAction(id);
});
```

4. **Add to per-action preferences** in `renderActionsTab()` actionList array.

## Using Global Resources

### Making AI Calls
```javascript
// Check if AI is available
if (!LLMService.isConfigured()) { toast('No AI', 'warning'); return; }

// Simple call
LLMService.callAI(prompt, successFn, errorFn, actionId, systemPrompt);

// With JSON retry (recommended)
callAIWithRetry(prompt, successFn, errorFn, actionId, systemPrompt);
// → Adds "Respond ONLY as valid JSON" if first call fails JSON parse
```

### Accessing Brand Context
```javascript
// Check availability
if (BrandService.isConfigured()) { ... }

// Get data sections
var core = BrandService.getCore();      // {brand_name, brand_voice, audience, ...}
var content = BrandService.getContent(); // {writing_style, sentence_rules, ...}
var seo = BrandService.getSeo();        // {niche, keyword_clusters, ...}

// Inject into AI prompt
prompt += brandSnippet('content');  // Adds relevant brand context
prompt += brandSnippet('seo');
prompt += brandSnippet('research');

// Get full system prompt
var systemPrompt = BrandService.getSystemPrompt('content');
```

### Getting User Info
```javascript
S.user.id        // Drupal user ID
S.user.name      // Username
S.user.fullName  // Display name
S.user.email     // Email
S.user.timezone  // Timezone string
S.user.roles     // Comma-separated roles
```

## Common Patterns

### Event Delegation (REQUIRED)
```javascript
// Always use delegation — DOM is rebuilt on every render
$(document).off('click.wcp-myaction').on('click.wcp-myaction', '[data-action="my-action"]', handler);
```

### State Change Flow (REQUIRED)
```javascript
// Every data mutation must follow:
c.my_field = newValue;
c.updated = new Date().toISOString();
logActivity('type', c.id, c.title, 'description');
snapshot('Label');           // Undo point (Part 2A)
maybeAdvanceStatus(c, 'reason'); // Auto-status if applicable
buildMaps();                 // Rebuild lookup maps
syncToTextarea();            // Write JSON to Drupal fields
render();                    // Re-render current view
toast('Message', 'success'); // User feedback
```

### Opening Modals (Part 2A)
```javascript
openModal('Title', htmlContent, {
  size: 'lg',           // 'sm' | 'md' | 'lg'
  saveLabel: 'Create',  // Save button text
  onSave: function() {
    var f = collectModalFields(); // Reads data-field attributes
    // validate + save
    closeModal();
  },
  footer: false          // Omit footer (for display-only modals)
});
```

### Confirm Dialogs (Part 2A)
```javascript
openConfirmDialog({
  title: 'Delete Item',
  message: 'Are you sure?',
  confirmLabel: 'Delete',
  danger: true,
  onConfirm: function() { /* destructive action */ }
});
```

### Null-Safe Access
```javascript
var kw = (c.keywords && c.keywords.primary) ? c.keywords.primary.keyword : '';
var goals = (S.meta && S.meta.settings && S.meta.settings.seo_goals) || {};
```

## Adding CSS

- All classes must use `wcp-` prefix
- Never hardcode colors — use `var(--wcp-*)` variables (defined in [src/styles/part1/01-variables.css](../src/styles/part1/01-variables.css))
- View layouts and app shell → `src/styles/part1/`
- Modals, editors, AI picker → `src/styles/part2/`
- Test all 4 breakpoints: 1200, 992, 768, 480

## Validation Checklist

Before delivering any code change:
- [ ] `tools\build.ps1` (or `node tools/build.js`) succeeds
- [ ] `node -c dist/wcp.js` passes
- [ ] No prefix leaks (`Grep '_scp\|\.scp-'` across `src/`)
- [ ] Save flow preserved (syncToTextarea called after mutations)
- [ ] Event delegation used (never direct binding)
- [ ] Null-safe access for S.meta, S.data, S.brand
- [ ] Activity logged for user-facing actions
- [ ] CSS variables used (no hardcoded colors)
