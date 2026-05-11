# WCP-QUICK-REFERENCE.md — Quick Reference

## Field Selectors
```
field_json_data:     #edit-field-json-data-0-value     → S.data
field_json_meta:     #edit-field-json-meta-0-value     → S.meta
field_activity_log:  #edit-field-activity-log-0-value  → S.activity
field_images:        .field--name-field-images          → S.images[]
```

## Global Resource Access
```javascript
// AI: check, call, get providers
LLMService.isConfigured()
LLMService.callAI(prompt, okFn, errFn, 'action-id', systemPrompt)
callAIWithRetry(prompt, okFn, errFn, 'action-id', systemPrompt)
LLMService.getActiveProviders()  // → [{id, label, api_key, activeModels}]
LLMService.getDefault()          // → {provider, model, temperature, max_tokens, api_key}
LLMService.renderInlinePicker('action-id')  // → HTML picker

// Brand: check, get sections, inject into prompts
BrandService.isConfigured()
BrandService.getCore()     // → {brand_name, brand_voice, audience, ...}
BrandService.getContent()  // → {writing_style, sentence_rules, ...}
BrandService.getSeo()      // → {niche, keyword_clusters, ...}
brandSnippet('content')    // → formatted string for AI prompts
BrandService.getSystemPrompt('seo')  // → system prompt string

// User
S.user.id / S.user.name / S.user.fullName / S.user.email / S.user.roles
```

## State Change Pattern
```javascript
c.field = newValue;
c.updated = new Date().toISOString();
logActivity('type', c.id, c.title, 'description');
snapshot('Label');
maybeAdvanceStatus(c, 'reason');
buildMaps(); syncToTextarea(); render();
toast('Done', 'success');
```

## Views & Navigation
```javascript
navigate('dashboard')       // Switch view
navigate('hub-detail')      // Sub-view
S.currentView               // Current view name
readHash()                  // Read URL hash
```

## Content Pipeline
```
info → angles → keywords → headline → outline → aeo → readiness → export
 0       1         2          3          4        5        6          7
```

## Status Flow
```
info → angles → keywords → headline → outline → aeo → readiness → export_ready → exported
```

## Lookup Maps
```javascript
S.hubMap[hubId]                // Hub object
S.clusterMap[clusterId]        // Cluster object
S.contentMap[contentId]        // Content object
S.contentTypeMap[typeId]       // Type object
S.templateMap[templateId]      // Template object
S.tagMap[tagId]                // Tag object
S.researchSessionMap[sessId]   // Research session
S.imageMap[fid]                // Image object
S.imageCategoryMap[catId]      // Category object
```

## Getters
```javascript
getHubClusters(hubId)          // Clusters in hub
getHubContent(hubId)           // Content in hub (direct + via clusters)
getClusterContent(clusterId)   // Content in cluster
getContentType(typeId)         // Type object
getImages({star:true, category:'brand_style', search:'logo'})
getFilteredContent()           // Content matching S.contentFilter
```

## Modal System
```javascript
openModal('Title', html, {size:'lg', saveLabel:'Save', onSave: fn})
closeModal()
openConfirmDialog({title, message, confirmLabel, danger:true, onConfirm: fn})
collectModalFields()           // → {field: value, ...} from data-field attrs
```

## File Structure
```
wcp-part1.css   (465 lines)  — Design system, app shell, view layouts
wcp-part2.css   (404 lines)  — Modals, forms, editors, images, settings
wcp-part1.js   (2751 lines)  — Core, state, 8 views, utils, events, sync
wcp-part2a.js  (2531 lines)  — Pipeline editor, modals, undo/redo, CRUD
wcp-part2b.js  (2392 lines)  — AI engine, Research, Settings, Images
```

## Asset Injector Load Order
```
1. wcp-part1.css  (weight 0)
2. wcp-part2.css  (weight 1)
3. wcp-part1.js   (weight 0)
4. wcp-part2a.js  (weight 1)
5. wcp-part2b.js  (weight 2)
```

## CSS Conventions
```
Prefix:      wcp-
Variables:   --wcp-primary, --wcp-space-4, --wcp-font-size-sm
Icons:       icon('sparkles') → Font Awesome Pro
Breakpoints: 1200px, 992px, 768px, 480px
```
