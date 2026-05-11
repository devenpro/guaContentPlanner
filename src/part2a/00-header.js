/**
 * Website Content Planner v1.0 - Part 2A: Pipeline Editor & CRUD
 *
 * Modals, undo/redo, 8 pipeline step renderers, inline editing,
 * CRUD modals for content/hub/cluster/tag, event handlers, data save helpers.
 *
 * Registry: contentDetailView, step_info, step_angles, step_keywords,
 *   step_headline, step_outline, step_aeo, step_readiness, step_export,
 *   tagInput
 *
 * Sections:
 *  1. Init & imports
 *  2. Modal system
 *  3. Undo/redo
 *  4. Content detail view override (pipeline header + step routing)
 *  5. Step 1: Info renderer
 *  6. Step 2: Angles renderer (phased research)
 *  7. Step 3: Keywords renderer (pill manager)
 *  8. Step 4: Headline renderer (radio list + char counts)
 *  9. Step 5: Outline renderer (structured editor)
 * 10. Step 6: AEO/GSEO renderer (scores + schema + Q&A)
 * 11. Step 7: Readiness renderer (checklist)
 * 12. Step 8: Export renderer (preview + validate)
 * 13. Tag input component
 * 14. CRUD modals (new content, edit hub/cluster/tag)
 * 15. Event handlers
 * 16. Data save helpers
 * 17. API exports
 *
 * @version 1.0.0
 */
(function($, Drupal) {
  'use strict';

