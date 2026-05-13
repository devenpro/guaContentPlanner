  // ============================================================
  // SECTION 8: APP SHELL
  // ============================================================

  function renderApp() {
    var toolbarH = 0;
    var $toolbarBar = $('#toolbar-bar');
    if ($toolbarBar.length) {
      toolbarH = $toolbarBar.outerHeight() || 0;
      var $tray = $('#toolbar-tray-horizontal');
      if ($tray.length && $tray.is(':visible')) toolbarH += $tray.outerHeight() || 0;
    }
    document.documentElement.style.setProperty('--wcp-drupal-toolbar', toolbarH + 'px');
    $('body').addClass('wcp-active');
    S.$form.closest('.layout-region-node-main, .node-form').hide();
    var $app = $('<div id="wcpApp" class="wcp-app"></div>');
    S.$form.closest('.layout-region-node-main, .node-form').before($app);
    $app.html(renderAppShell());
    renderCurrentView();
  }

  function renderAppShell() {
    return renderHeader() +
      '<div class="wcp-body">' + renderSidebar() +
      '<div class="wcp-main"><div class="wcp-content" id="wcpContent"></div></div>' +
      '</div>' +
      '<div id="wcpToasts" class="wcp-toast-container"></div>';
  }

  function renderHeader() {
    var ws = (S.meta && S.meta.workspace) || {};
    var html = '<div class="wcp-header"><div class="wcp-header-left">';
    html += '<button class="wcp-btn-icon" id="wcpSidebarToggle">' + icon('bars') + '</button>';
    html += '<span class="wcp-header-title">' + esc(ws.name || 'Website Content Planner') + '</span>';
    // Brand pill
    if (S.brand && S.brand.configured && S.brand.identity.name) {
      html += '<span class="wcp-badge" style="background:var(--wcp-gray-50);color:var(--wcp-text-secondary);border:1px solid var(--wcp-border-light);margin-left:var(--wcp-space-2)">';
      html += esc(S.brand.core && S.brand.core.brand_name ? S.brand.core.brand_name : S.brand.identity.name) + '</span>';
    }
    html += '</div><div class="wcp-header-right">';
    // Search
    html += '<div class="wcp-header-search" id="wcpGlobalSearch">' + icon('search') + ' Search... <span class="wcp-header-search-kbd">⌘K</span></div>';
    // Save status
    html += '<span class="wcp-header-save" id="wcpSaveStatus"></span>';
    // AI status (placeholder — updated by Part 2B)
    html += '<span class="wcp-header-ai-status" id="wcpAIStatus"><span class="wcp-header-ai-dot" style="background:var(--wcp-text-muted)"></span> AI</span>';
    // Save button
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" id="wcpSaveNodeBtn">' + icon('check') + ' Save</button>';
    // User
    if (S.user.fullName) {
      var initials = S.user.fullName.split(' ').map(function(w) { return w.charAt(0); }).join('').substring(0, 2).toUpperCase();
      html += '<div class="wcp-header-user" title="' + esc(S.user.fullName) + '">' + initials + '</div>';
    }
    html += '</div></div>';
    return html;
  }

  function renderSidebar() {
    var collapsed = S.sidebarCollapsed ? ' wcp-sidebar-collapsed' : '';
    var html = '<div class="wcp-sidebar' + collapsed + '" id="wcpSidebar">';
    // Brand
    html += '<div class="wcp-sidebar-brand" id="wcpSidebarBrand">';
    // Per-app brand mark, FA Free Solid (docs/05-app-layout-system.md §4).
    // Content Planner uses fa-sitemap — it is a hub-and-cluster topical
    // authority planner, so a sitemap glyph is the canonical mark.
    html += '<div class="wcp-sidebar-brand-icon">' + icon('sitemap') + '</div>';
    html += '<div class="wcp-sidebar-brand-text">';
    html += '<div class="wcp-sidebar-brand-name">Content Planner</div>';
    html += '<div class="wcp-sidebar-brand-sub">' + esc(S.brand.identity.name || 'WCP') + '</div>';
    html += '</div></div>';
    // Nav
    html += '<nav class="wcp-nav">';
    for (var gi = 0; gi < NAV_GROUPS.length; gi++) {
      var group = NAV_GROUPS[gi];
      html += '<div class="wcp-nav-group">';
      html += '<div class="wcp-nav-group-label">' + esc(group) + '</div>';
      for (var key in APP_VIEWS) {
        var v = APP_VIEWS[key];
        if (v.group !== group) continue;
        var active = (S.currentView === key || (S.currentView === 'hub-detail' && key === 'hubs')) ? ' wcp-nav-item-active' : '';
        var navBadge = '';
        if (key === 'hubs') navBadge = S.totalHubs > 0 ? '<span class="wcp-nav-badge">' + S.totalHubs + '</span>' : '';
        else if (key === 'content') navBadge = S.totalContent > 0 ? '<span class="wcp-nav-badge">' + S.totalContent + '</span>' : '';
        else if (key === 'tags') navBadge = (S.data.tags || []).length > 0 ? '<span class="wcp-nav-badge">' + (S.data.tags || []).length + '</span>' : '';
        else if (key === 'images') navBadge = S.images.length > 0 ? '<span class="wcp-nav-badge">' + S.images.length + '</span>' : '';
        html += '<a href="#' + key + '" class="wcp-nav-item' + active + '" data-view="' + key + '">';
        html += '<span class="wcp-nav-icon">' + icon(v.icon) + '</span>';
        html += '<span class="wcp-nav-label">' + esc(v.label) + '</span>';
        html += navBadge;
        html += '</a>';
      }
      html += '</div>';
    }
    html += '</nav>';
    // Footer
    html += '<div class="wcp-sidebar-footer">';
    html += '<div class="wcp-sidebar-footer-version">WCP v1.0</div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

