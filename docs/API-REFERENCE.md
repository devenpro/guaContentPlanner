# WCP-API-REFERENCE.md — API Reference

## Part 1 Exports (window._wcp*)

### Core
| Export | Signature | Purpose |
|--------|-----------|---------|
| `_wcpState` | `S` (object) | Global state — all data, meta, UI state |
| `_wcpRender` | `renderCurrentView()` | Re-render current view |
| `_wcpNavigate` | `navigate(viewName, options?)` | Switch view + update hash |
| `_wcpToast` | `toast(msg, type?, duration?)` | Show toast notification |
| `_wcpGenerateId` | `generateId(prefix)` → string | Generate unique ID like `cnt_a1b2c3d4` |
| `_wcpBuildMaps` | `buildMaps()` | Rebuild all lookup maps + counts |
| `_wcpSyncToTextarea` | `syncToTextarea()` | Write state JSON to Drupal fields |
| `_wcpUpdateSaveStatus` | `updateSaveStatus()` | Update save indicator |
| `_wcpLogActivity` | `logActivity(type, id, title, desc)` | Add activity entry |

### Formatters
| Export | Signature | Returns |
|--------|-----------|---------|
| `_wcpFormatDate` | `formatDate(iso)` | "Mar 15, 2026" |
| `_wcpFormatDateShort` | `formatDateShort(iso)` | "Mar 15" |
| `_wcpFormatRelativeTime` | `formatRelativeTime(iso)` | "3h ago", "just now" |
| `_wcpFormatNumber` | `formatNumber(n)` | "8,100" |

### Utilities
| Export | Signature | Purpose |
|--------|-----------|---------|
| `_wcpEsc` | `esc(text)` | HTML escape |
| `_wcpIcon` | `icon(name)` | Font Awesome HTML |
| `_wcpTruncate` | `truncate(text, len)` | Truncate with ellipsis |
| `_wcpDeepClone` | `deepClone(obj)` | JSON deep clone |
| `_wcpDebounce` | `debounce(fn, delay)` | Debounce wrapper |
| `_wcpIsEmpty` | `isEmpty(obj)` | Check empty object |
| `_wcpCountWords` | `countWords(text)` | Word count |

### Badges
| Export | Signature | Purpose |
|--------|-----------|---------|
| `_wcpBadge` | `badge(text, color)` | Colored badge HTML |
| `_wcpStatusBadge` | `statusBadge(status)` | Content status badge |
| `_wcpPriorityBadge` | `priorityBadge(priority)` | Priority badge |
| `_wcpScoreBadge` | `scoreBadge(score)` | Color-coded score (red/yellow/green) |
| `_wcpProgressBar` | `progressBar(value, max, color?)` | Progress bar HTML |

### Getters
| Export | Signature | Returns |
|--------|-----------|---------|
| `_wcpGetHubClusters` | `getHubClusters(hubId)` | Cluster array for hub |
| `_wcpGetHubContent` | `getHubContent(hubId)` | Content array for hub |
| `_wcpGetClusterContent` | `getClusterContent(clusterId)` | Content array for cluster |
| `_wcpGetContentType` | `getContentType(typeId)` | Type object or null |
| `_wcpGetTemplate` | `getTemplate(templateId)` | Template object or null |
| `_wcpGetAllTags` | `getAllTags()` | All tags array |
| `_wcpResolveTag` | `resolveTag(tagId)` | Tag object or null |
| `_wcpGetRecentActivity` | `getRecentActivity(count)` | Latest N activities |
| `_wcpGetImages` | `getImages(filters?)` | Filtered images array |
| `_wcpGetFilteredContent` | `getFilteredContent()` | Content matching S.contentFilter |
| `_wcpRenderContentListItems` | `renderContentListItems(items)` | HTML for content list |
| `_wcpRenderContentDetailPane` | `renderContentDetailPane()` | HTML for detail pane |

### Auto-Status & CRUD
| Export | Signature | Purpose |
|--------|-----------|---------|
| `_wcpEvaluateAutoStatus` | `evaluateAutoStatus(content)` | Calculate next status |
| `_wcpMaybeAdvanceStatus` | `maybeAdvanceStatus(content, reason)` | Advance if ready |
| `_wcpCreateHub` | `createHub(data)` | Create hub + log |
| `_wcpCreateCluster` | `createCluster(data)` | Create cluster + log |
| `_wcpCreateContent` | `createContent(data)` → content obj | Create content piece |
| `_wcpSaveContentField` | `saveContentField(id, path, value)` | Update nested field |

### Constants
`_wcpConstants` → object with: `APP_VIEWS`, `SUB_VIEWS`, `NAV_GROUPS`, `CONTENT_STATUSES`, `STATUS_ORDER`, `ACTIVE_STATUSES`, `PIPELINE_STEPS`, `CLUSTER_STATUSES`, `HUB_COLORS`, `SEARCH_INTENTS`, `FUNNEL_STAGES`, `PRIORITY_LEVELS`, `ACTIVITY_TYPES`

---

## Part 2A Exports (window._wcpPart2A)

| Export | Signature | Purpose |
|--------|-----------|---------|
| `snapshot` | `snapshot(label?)` | Save undo point |
| `undo` | `undo()` | Undo last change |
| `redo` | `redo()` | Redo last undo |
| `openModal` | `openModal(title, html, options?)` | Open modal dialog |
| `closeModal` | `closeModal()` | Close modal |
| `openConfirmDialog` | `openConfirmDialog(options)` | Danger confirm dialog |
| `closeConfirmDialog` | `closeConfirmDialog()` | Close confirm |
| `collectModalFields` | `collectModalFields()` → object | Read `data-field` values |
| `getSelectedContent` | `getSelectedContent()` → content | Get selected content object |
| `setNestedValue` | `setNestedValue(obj, path, val)` | Deep set by dot path |
| `getNestedValue` | `getNestedValue(obj, path)` | Deep get by dot path |
| `buildExportJson` | `buildExportJson(content)` → object | Build CW export payload |
| `openNewContentModal` | `openNewContentModal(defaults?)` | Content creation modal |
| `openEditHubModal` | `openEditHubModal(hubId)` | Hub edit modal |
| `openEditClusterModal` | `openEditClusterModal(clusterId)` | Cluster edit modal |
| `openNewTagModal` | `openNewTagModal()` | Tag creation modal |
| `openEditTagModal` | `openEditTagModal(tagId)` | Tag edit modal |
| `deleteContentConfirm` | `deleteContentConfirm(contentId)` | Delete with confirm |
| `deleteHubConfirm` | `deleteHubConfirm(hubId)` | Delete hub with confirm |
| `deleteClusterConfirm` | `deleteClusterConfirm(clusterId)` | Delete cluster with confirm |
| `deleteTagConfirm` | `deleteTagConfirm(tagId)` | Delete tag with confirm |
| `duplicateContent` | `duplicateContent(contentId)` | Clone content piece |
| `openEditTypeModal` | `openEditTypeModal(typeId)` | Content type edit modal |
| `openEditTemplateModal` | `openEditTemplateModal(templateId)` | Template edit modal |

---

## Part 2B Exports (window._wcpPart2B)

| Export | Signature | Purpose |
|--------|-----------|---------|
| `renderInlinePicker` | `LLMService.renderInlinePicker(actionId)` | AI model picker HTML |
| `callAI` | `LLMService.callAI(prompt, ok, err, actionId, sys)` | Make AI call |
| `isAIConfigured` | `LLMService.isConfigured()` → boolean | Check AI availability |
| `getActiveProviders` | `LLMService.getActiveProviders()` → array | List active providers |
| `brandSnippet` | `brandSnippet(contextType)` → string | Brand context for prompts |
| `parseJSON` | `parseJSON(text)` → object | Parse with 6-level fallback |
| `callAIWithRetry` | `callAIWithRetry(prompt, ok, err, id, sys)` | AI call + JSON retry |
| `BrandService` | Module object | Brand data access |
| `LLMService` | Module object | Full LLM service access |
| `exportWorkspace` | `exportWorkspace()` | Download JSON backup |
| `importWorkspace` | `importWorkspace()` | Upload + restore backup |

---

## AI Action Functions (36)

### Steps 1-4 (13 functions)
`aiSuggestType`, `aiFillBrief`, `aiResearchAngles`, `aiAnalyzeCompetitors`, `aiBuildUvp`, `aiEeatPlanner`, `aiQuestionDiscovery`, `aiExpandKeywords`, `aiLsiTerms`, `aiCheckConflicts`, `aiGenerateHeadlines`, `aiWriteMeta`, `aiSocialTitles`

### Steps 5-8 (11 functions)
`aiGenerateOutline`, `aiPlanSchema`, `aiPlanLinks`, `aiCitationCheck`, `aiOverviewCheck`, `aiSuggestSources`, `aiQaBlocks`, `aiReadinessAudit`, `aiFillGaps`, `aiWritingInstructions`, `aiMediaBrief`

### Hub/Global (12 functions)
`aiSuggestHubs`, `aiEnrichCluster`, `aiSuggestContent`, `aiGapAnalysis`, `aiOptimizeLinks`, `aiAuditAuthority`, `aiSuggestTypes`, `aiSuggestTags`, `aiAuditContent`, `aiBuildTemplate`, `aiRefreshScores`, `aiPlanCalendar`
