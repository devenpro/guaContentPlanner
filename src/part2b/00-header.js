/**
 * Website Content Planner v1.0 - Part 2B: AI & Advanced Features
 *
 * Multi-provider AI (LLMService), brand context (BrandService),
 * Research workspace (4 modes), Settings (7 tabs), Images gallery,
 * 38 AI action handlers, config CRUD, import/export.
 *
 * Registry: researchView, setupResearchEvents, settingsView,
 *   setupSettingsEvents, imagesView, setupImagesEvents
 *
 * Sections:
 *  1. Init & imports
 *  2. LLMService (multi-provider AI)
 *  3. BrandService (brand context — core, content, seo)
 *  4. AI response parsing & retry wrapper
 *  5. Brand prompt helpers
 *  6. AI actions — Pipeline Steps 1-4
 *  7. AI actions — Pipeline Steps 5-8
 *  8. AI actions — Hub, Cluster & Global
 *  9. Research view (4 modes)
 * 10. Settings view (7 tabs)
 * 11. Config CRUD (content types, templates)
 * 12. Images view (gallery, detail, categories)
 * 13. Import/Export workspace
 * 14. Events & keyboard shortcuts
 * 15. API exports
 *
 * @version 1.0.0
 */
(function($, Drupal) {
  'use strict';

