  // ============================================================
  // SECTION 6: NAVIGATION
  // ============================================================

  function navigate(viewName, options) {
    options = options || {};
    var isSubView = !!SUB_VIEWS[viewName];
    if (!APP_VIEWS[viewName] && !isSubView) { console.warn('[WCP] Unknown view:', viewName); return; }
    S.previousView = S.currentView;
    S.currentView = viewName;
    updateSidebarActive(isSubView ? SUB_VIEWS[viewName].parent : viewName);
    renderCurrentView();
    if (!options.noHash) updateHash(isSubView ? SUB_VIEWS[viewName].parent : viewName);
    if (options.scrollTop !== false) $('#wcpContent').scrollTop(0);
    if (window._wcpLocation) window._wcpLocation.capture();
  }

  function updateHash(v) { if (history.replaceState) history.replaceState(null, null, '#' + v); else window.location.hash = v; }
  function readHash() { var h = window.location.hash.replace('#', ''); return (h && APP_VIEWS[h]) ? h : 'dashboard'; }
  function updateSidebarActive(v) { $('.wcp-nav-item').removeClass('wcp-nav-item-active'); $('.wcp-nav-item[data-view="' + v + '"]').addClass('wcp-nav-item-active'); }

  function renderCurrentView() {
    var $c = $('#wcpContent');
    if (!$c.length) return;

    var R = window._wcpRenderers;
    var view = S.currentView;

    // Check if a renderer is registered for this view
    if (R[view + 'View']) {
      try {
        $c.html(R[view + 'View']());
        if (R['setup' + capitalize(view) + 'Events']) R['setup' + capitalize(view) + 'Events']();
      } catch(e) {
        console.error('[WCP] View "' + view + '" render error:', e.message, e.stack);
        $c.html('<div class="wcp-empty-state" style="height:100%;justify-content:center">' +
          '<div class="wcp-empty-state-icon">' + icon('triangle-exclamation') + '</div>' +
          '<div class="wcp-empty-state-title">View Error</div>' +
          '<div class="wcp-empty-state-text">The "' + esc(view) + '" view encountered an error:<br><code style="font-size:12px;color:var(--wcp-error)">' + esc(e.message) + '</code><br><br>Check the browser console for details.</div></div>');
      }
      return;
    }

    // Built-in views (rendered in Part 1 — added in Phase 2)
    var builtInRenderers = {
      'dashboard': renderDashboardView,
      'hubs': renderHubsView,
      'content': renderContentView,
      'types': renderTypesView,
      'templates': renderTemplatesView,
      'activity': renderActivityView,
      'sitemap': renderSitemapView
    };

    if (builtInRenderers[view]) {
      try {
        $c.html(builtInRenderers[view]());
      } catch(e) {
        console.error('[WCP] Built-in view "' + view + '" render error:', e.message, e.stack);
        $c.html('<div class="wcp-empty-state" style="height:100%;justify-content:center">' +
          '<div class="wcp-empty-state-icon">' + icon('triangle-exclamation') + '</div>' +
          '<div class="wcp-empty-state-title">Render Error</div>' +
          '<div class="wcp-empty-state-text"><code style="font-size:12px;color:var(--wcp-error)">' + esc(e.message) + '</code></div></div>');
      }
      return;
    }

    // Placeholder for views not yet loaded (research, settings, images — Part 2B)
    if (S._part2bTimeout) {
      $c.html(renderModuleNotLoaded(view));
    } else {
      $c.html(renderViewLoading(view));
    }
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

