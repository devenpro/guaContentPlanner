/**
 * Website Content Planner v1.0 - Part 1: Core Engine
 *
 * Hub-centric content planning for topical authority,
 * keyword clusters, SEO/GSEO/AEO optimization, CW export.
 *
 * Sections:
 *  1. Constants (views, statuses, types, activity types)
 *  2. State object
 *  3. Initialization (page detect, fields, user, brand)
 *  4. Data migration & defaults
 *  5. Map builders
 *  6. Navigation
 *  7. Utilities (icons 80+, badges, formatters, getters)
 *  8. App shell (header, sidebar with 5 groups, main)
 *  9. Render delegation & placeholder views
 * 10. Event handlers
 * 11. CRUD helpers
 * 12. Sync & save
 * 13. Toast & auto-status engine
 * 14. API exports (~70)
 *
 * @version 1.0.0
 */
(function($, Drupal) {
  'use strict';

  window._wcpRenderers = window._wcpRenderers || {};

