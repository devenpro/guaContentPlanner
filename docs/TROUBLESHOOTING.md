# WCP-TROUBLESHOOTING.md — Troubleshooting Guide

## "Part 2B not loaded after 12s" / Module Not Loaded

**Symptoms:** Research, Settings, or Images view shows "Module Not Loaded" with a reload button. Console shows: `[WCP] Part 2B not loaded after 12s`

**Root Cause:** Part 2B's `initPart2B()` either never ran or crashed during init.

**Diagnostics (check console):**
```
Part2A=true/false    → Is Part 2A's file loaded?
Part2AReady=true/false → Did initPart2A() complete?
Renderers=...        → Which renderers are registered?
```

**Fixes:**
1. Check Asset Injector: all 3 JS files attached with correct weight order (0, 1, 2)
2. Check for JS errors BEFORE the timeout message — the real error is earlier
3. Check that `.llm-config-data` or `.llm-brand-config-data` div exists on page (AI config)
4. Check load order: part1 must load before part2a, part2a before part2b

---

## AI Features Not Working / "No AI providers configured"

**Symptoms:** AI buttons show toast "No AI providers configured". Settings → AI Providers shows red "No AI providers found."

**Root Cause:** LLMService couldn't find or parse AI config from the DOM.

**Diagnostics (console):**
```
[WCP] LLMService: No config found — AI unavailable
```

**Fixes:**
1. Check that user profile has LLM Config field populated with valid JSON
2. Check that a Views block exposes the config as a `<div class="llm-config-data">` or `<div class="llm-brand-config-data">`
3. Verify the JSON structure: `{"providers": [{"id":"gemini","active":true,"api_key":"...","models":[...]}]}`
4. Check for JSON parse errors in console

---

## Brand Context Not Available

**Symptoms:** AI prompts don't include brand context. Settings → Brand Context shows "No Brand Data."

**Diagnostics (console):**
```
[WCP] Brand data div not found on page
[WCP] Brand section not found: .brand-core-data
```

**Fixes:**
1. Create a Brand Profile entity in Drupal
2. Expose brand data via Views: `.brand-data` wrapper with `.brand-core-data`, `.brand-content-data`, `.brand-seo-data` child divs
3. Each child div must contain valid JSON

---

## Content View Shows Blank Detail Pane

**Symptoms:** Content list works but selecting an item shows nothing in the detail pane.

**Root Cause:** Part 2A's `contentDetailView` renderer not registered.

**Fixes:**
1. Check console for Part 2A init errors
2. Verify Part 2A file loads (look for `[WCP] Part 2A loaded` and `[WCP] Part 2A initialized`)

---

## Undo/Redo Not Working

**Symptoms:** Ctrl+Z/Ctrl+Y do nothing.

**Root Cause:** Part 2A's keyboard handlers not registered.

**Fixes:**
1. Check that Part 2A initialized: console should show `[WCP] Part 2A initialized`
2. Check no other JS on the page is consuming Ctrl+Z before it reaches the app
3. Verify the snapshot stack: `console.log(window._wcpPart2A.snapshot)` should be a function

---

## Settings Don't Save

**Symptoms:** Changing settings and clicking Save shows toast but values revert on reload.

**Root Cause:** Either `syncToTextarea()` not called, or Drupal Save button not clicked.

**Important:** The app's "Save Settings" button saves to state + textareas. You must then click Drupal's actual Save button (or Ctrl+S) to persist to the database.

---

## Images View "Image Field Not Found"

**Symptoms:** Images view shows "Image Field Not Found" instead of gallery.

**Root Cause:** No `field_images` on the content type.

**Fix:** Add `field_images` (Image, multi-value) to the `website_content_planner` content type in Drupal's Field UI.

---

## Hash Navigation — View Shows Loading on First Load

**Symptoms:** Navigating to `#research` directly shows "Loading..." briefly before the view appears.

**This is expected behavior.** Part 1 renders the loading state while Part 2B initializes. Once Part 2B inits (~1-3s), it re-renders and the view appears.

---

## Console Error Reference

| Message | Meaning | Action |
|---------|---------|--------|
| `[WCP] Part 1 initialized` | Part 1 OK | Normal |
| `[WCP] Part 2A initialized` | Part 2A OK | Normal |
| `[WCP] Part 2B initialized` | Part 2B OK | Normal |
| `Part 2B initialized WITH ERRORS` | Partial init | Check listed errors |
| `Part 2B: Timed out (15s)` | Part 2B never inited | Check Part 2A ready + file load |
| `Missing fields: data=0` | Textarea not found | Check content type fields |
| `LLMService: No config found` | No AI config | Add .llm-config-data div |
| `BrandService init error` | Brand parse failed | Check .brand-*-data JSON |
| `View "X" render error` | View crashed | Check error details + stack |

---

## Diagnostic Commands (Browser Console)

```javascript
// Check init state
console.log('Initialized:', window._wcpState.initialized);
console.log('Part2A Ready:', window._wcpState._part2aReady);
console.log('Part2A Export:', !!window._wcpPart2A);
console.log('Renderers:', Object.keys(window._wcpRenderers));

// Check AI
console.log('AI Configured:', window._wcpPart2B.isAIConfigured());
console.log('Providers:', window._wcpPart2B.getActiveProviders());

// Check brand
console.log('Brand:', window._wcpState.brand);

// Check data
console.log('Hubs:', window._wcpState.data.hubs.length);
console.log('Content:', window._wcpState.data.content.length);

// Force re-render
window._wcpRender();
```
