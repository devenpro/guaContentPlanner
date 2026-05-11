  function renderHubsView() {
    var html = '<div class="wcp-view wcp-view-hubs"><div class="wcp-split-pane">';
    html += renderHubListPane();
    html += '<div class="wcp-detail-pane" id="wcpHubDetailPane">' + renderHubDetailPane() + '</div>';
    html += '</div></div>';
    return html;
  }

  function renderHubListPane() {
    var hubs = S.data.hubs || [];
    var html = '<div class="wcp-list-pane">';
    html += '<div class="wcp-list-pane-header">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-2)">';
    html += '<span style="font-size:var(--wcp-font-size-sm);font-weight:700">' + icon('sitemap') + ' Content Hubs</span>';
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="create-hub">' + icon('plus') + ' New</button>';
    html += '</div>';
    html += '<button class="wcp-btn-ai wcp-btn-sm" data-action="ai-suggest-hubs" style="width:100%">' + icon('sparkles') + ' AI Suggest Hubs</button>';
    html += '</div>';
    html += '<div class="wcp-list-pane-items" id="wcpHubList">';
    if (!hubs.length) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)">';
      html += '<div class="wcp-empty-state-icon" style="font-size:var(--wcp-font-size-2xl)">' + icon('sitemap') + '</div>';
      html += '<div class="wcp-empty-state-title" style="font-size:var(--wcp-font-size-sm)">No hubs yet</div>';
      html += '<div class="wcp-empty-state-text" style="font-size:var(--wcp-font-size-xs)">Create your first content hub to organize topics.</div>';
      html += '</div>';
    } else {
      for (var hi = 0; hi < hubs.length; hi++) {
        html += renderHubListItem(hubs[hi]);
      }
    }
    html += '</div></div>';
    return html;
  }

  function renderHubListItem(hub) {
    var clusters = getHubClusters(hub.id);
    var content = getHubContent(hub.id);
    var isActive = S.selectedHubId === hub.id;
    var totalItems = clusters.length + content.length;
    var doneItems = content.filter(function(c) { return c.status === 'export_ready' || c.status === 'exported'; }).length;
    var pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    var html = '<div class="wcp-list-item' + (isActive ? ' wcp-list-item-active' : '') + '" data-action="select-hub" data-id="' + esc(hub.id) + '" style="border-left-color:' + (hub.color || 'var(--wcp-primary)') + '">';
    html += '<div class="wcp-list-item-title">' + esc(hub.name) + '</div>';
    html += '<div class="wcp-list-item-meta">';
    html += '<span class="wcp-text-xs">' + icon('bookmark') + ' ' + clusters.length + '</span>';
    html += '<span class="wcp-text-xs">' + icon('file-lines') + ' ' + content.length + '</span>';
    html += '<span class="wcp-text-xs" style="margin-left:auto;color:' + (hub.color || 'var(--wcp-primary)') + '">' + pct + '%</span>';
    html += '</div></div>';
    return html;
  }

  function renderHubDetailPane() {
    var hub = S.selectedHubId ? S.hubMap[S.selectedHubId] : null;
    if (!hub) {
      return '<div class="wcp-empty-state" style="height:100%;justify-content:center">' +
        '<div class="wcp-empty-state-icon">' + icon('sitemap') + '</div>' +
        '<div class="wcp-empty-state-title">Select a hub to view details</div>' +
        '<div class="wcp-empty-state-text">Choose a content hub from the list, or create a new one.</div></div>';
    }

    var clusters = getHubClusters(hub.id);
    var content = getHubContent(hub.id);
    var pillarContent = hub.pillar_content_id ? S.contentMap[hub.pillar_content_id] : null;

    var html = '<div class="wcp-detail-header">';
    html += '<div class="wcp-step-title-row">';
    html += '<h2 style="color:' + (hub.color || 'var(--wcp-primary)') + '">' + esc(hub.name) + '</h2>';
    html += '<button class="wcp-btn-icon" data-action="edit-hub" data-id="' + esc(hub.id) + '" title="Edit hub">' + icon('pen') + '</button>';
    html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="delete-hub" data-id="' + esc(hub.id) + '" title="Delete hub">' + icon('trash') + '</button>';
    html += '</div>';
    html += '<div class="wcp-step-actions">';
    html += '<button class="wcp-btn-ai wcp-btn-sm" data-action="ai-plan-this-hub" data-hub="' + esc(hub.id) + '" title="AI proposes a complete cluster structure for this hub">' + icon('sparkles') + ' Plan this Hub</button>';
    html += '<button class="wcp-btn-ai wcp-btn-sm" data-action="ai-gap-analysis" data-hub="' + esc(hub.id) + '" title="AI proposes new clusters to fill coverage gaps">' + icon('sparkles') + ' Gap Analysis</button>';
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="go-view" data-view="research">' + icon('flask') + ' Research</button>';
    html += '</div></div>';

    html += '<div class="wcp-detail-body">';

    // Hub description
    if (hub.description) {
      html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-4)">' + esc(hub.description) + '</p>';
    }

    // Aggregate intent summary (intent-first principle)
    if (content.length > 0) {
      var intentCounts = { 'informational': 0, 'commercial': 0, 'transactional': 0, 'navigational': 0 };
      var withIntent = 0;
      for (var hci = 0; hci < content.length; hci++) {
        var hcbi = content[hci].basic_info || {};
        if (hcbi.search_intent && intentCounts.hasOwnProperty(hcbi.search_intent)) {
          intentCounts[hcbi.search_intent]++;
          withIntent++;
        }
      }
      if (withIntent > 0) {
        html += '<div class="wcp-hub-intent-summary">';
        html += '<span class="wcp-section-label">' + icon('compass') + ' Intent Distribution</span>';
        html += '<div class="wcp-hub-intent-bars">';
        var intentColorMap2 = { 'informational': 'var(--wcp-hub)', 'commercial': 'var(--wcp-accent)', 'transactional': 'var(--wcp-success)', 'navigational': 'var(--wcp-warning)' };
        for (var ik in intentCounts) {
          if (intentCounts[ik] > 0) {
            var pctIntent = Math.round((intentCounts[ik] / withIntent) * 100);
            html += '<div class="wcp-hub-intent-bar-row">';
            html += '<span class="wcp-text-xs" style="color:' + intentColorMap2[ik] + ';font-weight:600;width:90px">' + ik + '</span>';
            html += '<div style="flex:1;height:8px;background:var(--wcp-gray-100);border-radius:4px;overflow:hidden"><div style="width:' + pctIntent + '%;height:100%;background:' + intentColorMap2[ik] + '"></div></div>';
            html += '<span class="wcp-text-xs wcp-text-muted" style="width:50px;text-align:right">' + pctIntent + '% (' + intentCounts[ik] + ')</span>';
            html += '</div>';
          }
        }
        html += '</div></div>';
      }
    }

    // Pillar bar
    html += '<div class="wcp-pillar-bar">';
    html += '<span style="font-size:var(--wcp-font-size-lg)">' + icon('crown') + '</span>';
    if (pillarContent) {
      html += '<div style="flex:1"><div class="wcp-pillar-bar-label">PILLAR CONTENT</div>';
      html += '<div class="wcp-pillar-bar-title">' + esc(pillarContent.title) + '</div></div>';
      html += statusBadge(pillarContent.status);
      html += '<button class="wcp-btn wcp-btn-sm" data-action="select-content" data-id="' + esc(pillarContent.id) + '">View</button>';
    } else {
      html += '<div style="flex:1"><div class="wcp-pillar-bar-label" style="color:var(--wcp-warning)">NO PILLAR CONTENT</div>';
      html += '<div class="wcp-pillar-bar-title" style="color:var(--wcp-text-secondary)">Create pillar content to anchor this hub</div></div>';
      html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="create-pillar" data-hub="' + esc(hub.id) + '">' + icon('plus') + ' Create Pillar</button>';
    }
    html += '</div>';

    // Clusters section
    html += '<div style="margin-top:var(--wcp-space-4)">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-3)">';
    html += '<h3 style="font-size:var(--wcp-font-size-base)">' + icon('bookmark') + ' Clusters (' + clusters.length + ')</h3>';
    html += '</div>';
    // Quick-add cluster row
    html += '<div class="wcp-hub-quick-add">';
    html += '<input type="text" class="wcp-input wcp-input-sm" id="wcpQuickCluster" placeholder="New cluster name..." style="flex:1">';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-primary" data-action="quick-add-cluster" data-hub="' + esc(hub.id) + '">' + icon('plus') + ' Add</button>';
    html += '</div>';
    html += renderHubClusters(hub, clusters);
    html += '</div>';

    // Gaps (collapsible)
    html += '<div class="wcp-collapsible-section" style="margin-top:var(--wcp-space-4)">';
    html += '<div class="wcp-collapsible-toggle" data-action="toggle-collapsible">';
    html += '<h3 style="font-size:var(--wcp-font-size-base)">' + icon('circle-exclamation') + ' Gaps</h3>';
    html += '<span class="wcp-collapsible-chevron">' + icon('chevron-down') + '</span>';
    html += '</div>';
    html += '<div class="wcp-collapsible-body" style="display:none">';
    html += renderHubGaps(hub, clusters, content);
    html += '</div></div>';

    // Links (collapsible)
    html += '<div class="wcp-collapsible-section" style="margin-top:var(--wcp-space-3)">';
    html += '<div class="wcp-collapsible-toggle" data-action="toggle-collapsible">';
    html += '<h3 style="font-size:var(--wcp-font-size-base)">' + icon('link') + ' Internal Links</h3>';
    html += '<span class="wcp-collapsible-chevron">' + icon('chevron-down') + '</span>';
    html += '</div>';
    html += '<div class="wcp-collapsible-body" style="display:none">';
    html += renderHubLinks(hub, content);
    html += '</div></div>';

    html += '</div>';
    return html;
  }

  function renderHubCard(hub) {
    var clusters = getHubClusters(hub.id);
    var content = getHubContent(hub.id);
    var gapCount = clusters.filter(function(cl) { return !cl.content_ids || cl.content_ids.length === 0; }).length;
    var pillarContent = hub.pillar_content_id ? S.contentMap[hub.pillar_content_id] : null;
    var totalItems = clusters.length + content.length;
    var doneItems = content.filter(function(c) { return c.status === 'export_ready' || c.status === 'exported'; }).length;
    var pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    // Calculate average scores
    var seoAvg = 0, gseoAvg = 0, aeoAvg = 0, scored = 0;
    for (var si = 0; si < content.length; si++) {
      var a = content[si].aeo_gseo;
      if (a && (a.seo_score > 0 || a.gseo_score > 0 || a.aeo_score > 0)) {
        seoAvg += a.seo_score || 0; gseoAvg += a.gseo_score || 0; aeoAvg += a.aeo_score || 0; scored++;
      }
    }
    if (scored > 0) { seoAvg = Math.round(seoAvg / scored); gseoAvg = Math.round(gseoAvg / scored); aeoAvg = Math.round(aeoAvg / scored); }

    var html = '<div class="wcp-hub-card" data-action="go-hub-detail" data-id="' + esc(hub.id) + '">';
    html += '<div class="wcp-hub-card-bar" style="background:' + (hub.color || 'var(--wcp-primary)') + '"></div>';

    // Title + actions
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-2)">';
    html += '<div><div class="wcp-hub-card-title">' + esc(hub.name) + '</div>';
    if (hub.description) html += '<div class="wcp-hub-card-desc">' + esc(truncate(hub.description, 80)) + '</div>';
    html += '</div>';
    html += '<div style="display:flex;gap:var(--wcp-space-1);flex-shrink:0">';
    html += '<button class="wcp-btn-icon" data-action="edit-hub" data-id="' + esc(hub.id) + '" title="Edit hub">' + icon('edit') + '</button>';
    html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="delete-hub" data-id="' + esc(hub.id) + '" title="Delete hub">' + icon('trash') + '</button>';
    html += '</div></div>';

    // Pillar status
    if (pillarContent) {
      html += '<div class="wcp-hub-pillar wcp-hub-pillar-ok">' + icon('crown') + ' Pillar: ' + esc(truncate(pillarContent.title, 50));
      html += ' ' + statusBadge(pillarContent.status) + '</div>';
    } else {
      html += '<div class="wcp-hub-pillar wcp-hub-pillar-missing">' + icon('warning') + ' No pillar content — create one to anchor this hub</div>';
    }

    // Metrics row
    html += '<div class="wcp-hub-metrics">';
    html += '<span>' + icon('bookmark') + ' <b>' + clusters.length + '</b> clusters</span>';
    html += '<span>' + icon('file-lines') + ' <b>' + content.length + '</b> content</span>';
    if (gapCount > 0) html += '<span style="color:var(--wcp-warning)">' + icon('circle-exclamation') + ' <b>' + gapCount + '</b> gaps</span>';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="create-cluster" data-hub="' + esc(hub.id) + '" onclick="event.stopPropagation()" style="margin-left:auto;font-size:var(--wcp-font-size-xs)">' + icon('plus') + ' Cluster</button>';
    html += '</div>';

    // Score row
    html += '<div class="wcp-hub-scores">';
    html += '<div class="wcp-hub-score"><div class="wcp-hub-score-value" style="color:var(--wcp-hub)">' + seoAvg + '%</div><div class="wcp-hub-score-label">SEO</div></div>';
    html += '<div class="wcp-hub-score"><div class="wcp-hub-score-value" style="color:var(--wcp-cluster)">' + gseoAvg + '%</div><div class="wcp-hub-score-label">GSEO</div></div>';
    html += '<div class="wcp-hub-score"><div class="wcp-hub-score-value" style="color:var(--wcp-coral)">' + aeoAvg + '%</div><div class="wcp-hub-score-label">AEO</div></div>';
    html += '</div>';

    // Progress
    html += '<div class="wcp-hub-progress">';
    html += progressBar(pct, hub.color || 'var(--wcp-primary)');
    html += '<span class="wcp-hub-progress-pct" style="color:' + (hub.color || 'var(--wcp-primary)') + '">' + pct + '%</span>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  // ─── HUB DETAIL VIEW (Stage 2.3) ────────────────────
  function renderHubDetailView() {
    var hub = S.hubMap[S.selectedHubId];
    if (!hub) {
      return '<div class="wcp-view"><div class="wcp-empty-state">' +
        '<div class="wcp-empty-state-icon">' + icon('sitemap') + '</div>' +
        '<div class="wcp-empty-state-title">Hub not found</div>' +
        '<button class="wcp-btn wcp-btn-primary" data-action="go-view" data-view="hubs">' + icon('arrow-left') + ' Back to Hubs</button>' +
        '</div></div>';
    }

    var clusters = getHubClusters(hub.id);
    var content = getHubContent(hub.id);
    var pillarContent = hub.pillar_content_id ? S.contentMap[hub.pillar_content_id] : null;

    var html = '<div class="wcp-view">';
    // Breadcrumb
    html += '<div class="wcp-header-breadcrumb" style="margin-bottom:var(--wcp-space-2)">';
    html += '<a href="#" data-action="go-view" data-view="dashboard">Dashboard</a>';
    html += '<span class="wcp-header-breadcrumb-sep">' + icon('chevron-right') + '</span>';
    html += '<a href="#" data-action="go-view" data-view="hubs">Hubs</a>';
    html += '<span class="wcp-header-breadcrumb-sep">' + icon('chevron-right') + '</span>';
    html += '<span class="wcp-header-breadcrumb-current">' + esc(hub.name) + '</span>';
    html += '</div>';

    // Header with edit button
    html += '<div class="wcp-view-header"><div class="wcp-view-header-left">';
    html += '<h1 style="color:' + (hub.color || 'var(--wcp-primary)') + '">' + esc(hub.name) + '</h1>';
    html += '<button class="wcp-btn-icon" data-action="edit-hub" data-id="' + esc(hub.id) + '" title="Edit hub">' + icon('pen') + '</button>';
    html += '</div>';
    html += '<div class="wcp-view-header-right">';
    html += '<button class="wcp-btn-ai wcp-btn-sm" data-action="ai-plan-this-hub" data-hub="' + esc(hub.id) + '" title="AI proposes a complete cluster structure for this hub">' + icon('sparkles') + ' Plan this Hub</button>';
    html += '<button class="wcp-btn-ai wcp-btn-sm" data-action="ai-gap-analysis" data-hub="' + esc(hub.id) + '" title="AI proposes new clusters to fill coverage gaps">' + icon('sparkles') + ' Gap Analysis</button>';
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="go-view" data-view="research">' + icon('flask') + ' Research</button>';
    html += '</div></div>';

    // Hub description (if set)
    if (hub.description) {
      html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-4)">' + esc(hub.description) + '</p>';
    }

    // Pillar bar
    html += '<div class="wcp-pillar-bar">';
    html += '<span style="font-size:var(--wcp-font-size-lg)">' + icon('crown') + '</span>';
    if (pillarContent) {
      html += '<div style="flex:1"><div class="wcp-pillar-bar-label">PILLAR CONTENT</div>';
      html += '<div class="wcp-pillar-bar-title">' + esc(pillarContent.title) + '</div></div>';
      html += statusBadge(pillarContent.status);
      html += '<button class="wcp-btn wcp-btn-sm" data-action="select-content" data-id="' + esc(pillarContent.id) + '">View</button>';
    } else {
      html += '<div style="flex:1"><div class="wcp-pillar-bar-label" style="color:var(--wcp-warning)">NO PILLAR CONTENT</div>';
      html += '<div class="wcp-pillar-bar-title" style="color:var(--wcp-text-secondary)">Create pillar content to anchor this hub\'s authority</div></div>';
      html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="create-pillar" data-hub="' + esc(hub.id) + '">' + icon('plus') + ' Create Pillar</button>';
    }
    html += '</div>';

    // ── Clusters section (always visible, primary content) ──
    html += '<div style="margin-top:var(--wcp-space-4)">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-3)">';
    html += '<h3 style="font-size:var(--wcp-font-size-base)">' + icon('bookmark') + ' Clusters (' + clusters.length + ')</h3>';
    html += '<button class="wcp-btn-ai wcp-btn-sm" data-action="ai-plan-calendar" data-hub="' + esc(hub.id) + '">' + icon('sparkles') + ' Plan Calendar</button>';
    html += '</div>';

    // Quick-add cluster row
    html += '<div class="wcp-hub-quick-add">';
    html += '<input type="text" class="wcp-input wcp-input-sm" id="wcpQuickCluster" placeholder="New cluster name..." style="flex:1">';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-primary" data-action="quick-add-cluster" data-hub="' + esc(hub.id) + '">' + icon('plus') + ' Add</button>';
    html += '</div>';

    html += renderHubClusters(hub, clusters);
    html += '</div>';

    // ── Gaps section (collapsible) ──
    html += '<div class="wcp-collapsible-section" style="margin-top:var(--wcp-space-4)">';
    html += '<div class="wcp-collapsible-toggle" data-action="toggle-collapsible">';
    html += '<h3 style="font-size:var(--wcp-font-size-base)">' + icon('circle-exclamation') + ' Gaps</h3>';
    html += '<span class="wcp-collapsible-chevron">' + icon('chevron-down') + '</span>';
    html += '</div>';
    html += '<div class="wcp-collapsible-body" style="display:none">';
    html += renderHubGaps(hub, clusters, content);
    html += '</div></div>';

    // ── Links section (collapsible) ──
    html += '<div class="wcp-collapsible-section" style="margin-top:var(--wcp-space-3)">';
    html += '<div class="wcp-collapsible-toggle" data-action="toggle-collapsible">';
    html += '<h3 style="font-size:var(--wcp-font-size-base)">' + icon('link') + ' Internal Links</h3>';
    html += '<span class="wcp-collapsible-chevron">' + icon('chevron-down') + '</span>';
    html += '</div>';
    html += '<div class="wcp-collapsible-body" style="display:none">';
    html += renderHubLinks(hub, content);
    html += '</div></div>';

    html += '</div>';
    return html;
  }

  function renderHubTree(hub, clusters, content) {
    var html = '<div class="wcp-card"><div class="wcp-card-body wcp-tree-container" style="min-height:300px">';
    // Root node
    html += '<div style="text-align:center;margin-bottom:var(--wcp-space-4)">';
    html += '<div class="wcp-tree-root" style="background:' + (hub.color || 'var(--wcp-primary)') + '">' + icon('crown') + ' ' + esc(hub.name) + '</div>';
    html += '<div class="wcp-tree-connector"></div>';
    html += '</div>';

    if (clusters.length === 0) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)">';
      html += '<p class="wcp-text-sm wcp-text-muted">No clusters yet. Add clusters through research or manually.</p>';
      html += '<button class="wcp-btn wcp-btn-sm" data-action="create-cluster" data-hub="' + esc(hub.id) + '">' + icon('plus') + ' Add Cluster</button>';
      html += '</div>';
    } else {
      // Determine grid columns based on cluster count
      var cols = clusters.length <= 2 ? clusters.length : clusters.length <= 4 ? clusters.length : 4;
      html += '<div class="wcp-tree-branches" style="grid-template-columns:repeat(' + cols + ',1fr)">';
      for (var ci = 0; ci < clusters.length; ci++) {
        var cl = clusters[ci];
        var clContent = getClusterContent(cl.id);
        var stCfg = CLUSTER_STATUSES[cl.status] || { label: cl.status, color: '#80868b' };
        var isDashed = cl.status === 'planned' || clContent.length === 0;

        html += '<div>';
        html += '<div class="wcp-tree-connector"></div>';
        html += '<div class="wcp-tree-node' + (isDashed ? ' wcp-tree-node-dashed' : '') + '" style="border-color:' + stCfg.color + '" data-action="select-cluster" data-id="' + esc(cl.id) + '">';
        // Header
        html += '<div class="wcp-tree-node-header">';
        html += '<span class="wcp-tree-node-title">' + esc(truncate(cl.name, 22)) + '</span>';
        html += badge(stCfg.label, stCfg.color);
        html += '</div>';
        // Content items
        if (clContent.length > 0) {
          for (var cci = 0; cci < Math.min(clContent.length, 4); cci++) {
            var c = clContent[cci];
            var stColor = (CONTENT_STATUSES[c.status] || {}).color || '#80868b';
            var stIcon = c.status === 'export_ready' || c.status === 'exported' ? '✓' : c.status === 'info' ? '○' : '◑';
            html += '<div class="wcp-tree-node-item" style="color:' + stColor + '">' + stIcon + ' ' + esc(truncate(c.title, 24)) + '</div>';
          }
          if (clContent.length > 4) html += '<div class="wcp-tree-node-item" style="color:var(--wcp-text-muted)">+' + (clContent.length - 4) + ' more</div>';
        } else {
          html += '<div class="wcp-tree-node-item" style="color:var(--wcp-warning)">' + icon('circle-exclamation') + ' No content</div>';
        }
        html += '</div></div>';
      }
      html += '</div>';
    }

    // Legend
    html += '<div style="text-align:center;margin-top:var(--wcp-space-4);font-size:var(--wcp-font-size-xs);color:var(--wcp-text-muted)">';
    html += '✓ Complete &nbsp; ◑ In progress &nbsp; ○ Not started &nbsp; ' + icon('circle-exclamation') + ' Gap — Click nodes to view details';
    html += '</div>';

    html += '</div></div>';
    return html;
  }

  function renderHubClusters(hub, clusters) {
    if (clusters.length === 0) {
      var html = '<div class="wcp-card"><div class="wcp-card-body"><div class="wcp-empty-state" style="padding:var(--wcp-space-6)">';
      html += '<p class="wcp-text-sm wcp-text-muted">No clusters in this hub. Use Research to discover keyword clusters or create one manually.</p>';
      html += '<div style="display:flex;gap:var(--wcp-space-2);margin-top:var(--wcp-space-3)">';
      html += '<button class="wcp-btn wcp-btn-sm" data-action="create-cluster" data-hub="' + esc(hub.id) + '">' + icon('plus') + ' Manual</button>';
      html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="go-view" data-view="research">' + icon('flask') + ' Research</button>';
      html += '</div></div></div></div>';
      return html;
    }

    var html = '';
    for (var ci = 0; ci < clusters.length; ci++) {
      var cl = clusters[ci];
      var clContent = getClusterContent(cl.id);
      var stCfg = CLUSTER_STATUSES[cl.status] || { label: cl.status, color: '#80868b' };
      var doneCount = clContent.filter(function(c) { return c.status === 'export_ready' || c.status === 'exported'; }).length;

      html += '<div class="wcp-cluster-card">';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="display:flex;align-items:center;gap:var(--wcp-space-2);margin-bottom:var(--wcp-space-1)">';
      html += '<span style="font-size:var(--wcp-font-size-base);font-weight:700;color:var(--wcp-text-primary)">' + esc(cl.name) + '</span>';
      html += badge(stCfg.label, stCfg.color);
      html += '</div>';
      // Keywords preview
      var kwPreview = (cl.keywords || []).slice(0, 5).map(function(k) { return typeof k === 'string' ? k : (k.keyword || ''); }).filter(Boolean).join(', ');
      if (kwPreview) html += '<div style="font-size:var(--wcp-font-size-xs);color:var(--wcp-text-secondary)">Keywords: ' + esc(truncate(kwPreview, 60)) + '</div>';
      html += '</div>';
      // Right side
      html += '<div style="display:flex;align-items:center;gap:var(--wcp-space-3);flex-shrink:0">';
      html += '<span style="font-size:var(--wcp-font-size-sm);font-weight:600;color:' + stCfg.color + '">' + doneCount + '/' + clContent.length + '</span>';
      html += '<button class="wcp-btn-ai wcp-btn-ai-sm" data-action="ai-enrich-cluster" data-id="' + esc(cl.id) + '">' + icon('sparkles') + ' Enrich</button>';
      // Suggest button — shows unused-suggestion count when the cluster has
      // prior ideas persisted. Clicking opens the Suggestions panel instead
      // of forcing a fresh LLM call (the panel has its own "Generate more").
      var sugList = Array.isArray(cl.ai_suggestions) ? cl.ai_suggestions : [];
      var sugUnused = sugList.filter(function(s) { return !s.used_content_id; }).length;
      var sugLabel = sugUnused > 0 ? ('Ideas (' + sugUnused + ')') : 'Suggest';
      html += '<button class="wcp-btn-ai wcp-btn-ai-sm" data-action="ai-suggest-content" data-id="' + esc(cl.id) + '" title="' + (sugList.length ? sugList.length + ' suggestion(s) on file' : 'Generate AI content ideas') + '">' + icon('sparkles') + ' ' + sugLabel + '</button>';
      html += '<button class="wcp-btn wcp-btn-sm" data-action="edit-cluster" data-id="' + esc(cl.id) + '">Edit</button>';
      html += '<button class="wcp-btn-delete-sm" data-action="delete-cluster" data-id="' + esc(cl.id) + '">' + icon('trash') + '</button>';
      html += '</div></div>';
    }
    return html;
  }

  function renderHubGaps(hub, clusters, content) {
    var html = '<div class="wcp-card"><div class="wcp-card-body">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-4)">';
    html += '<span style="font-size:var(--wcp-font-size-base);font-weight:700">' + icon('circle-exclamation') + ' Content Gaps</span>';
    html += '<button class="wcp-btn-ai" data-action="ai-gap-analysis" data-hub="' + esc(hub.id) + '">' + icon('sparkles') + ' AI Deep Gap Analysis</button>';
    html += '</div>';

    // Auto-detect gaps: clusters with no content
    var gaps = [];
    for (var gi = 0; gi < clusters.length; gi++) {
      var cl = clusters[gi];
      var clContent = getClusterContent(cl.id);
      if (clContent.length === 0) {
        gaps.push({ type: 'empty_cluster', cluster: cl, reason: 'Cluster "' + cl.name + '" has no content linked — needs at least one content piece' });
      }
    }
    // Hub without pillar
    if (!hub.pillar_content_id) {
      gaps.unshift({ type: 'no_pillar', cluster: null, reason: 'This hub has no pillar content — pillar pages are essential for topical authority' });
    }

    if (gaps.length === 0) {
      html += '<div style="padding:var(--wcp-space-4);text-align:center;color:var(--wcp-success);font-size:var(--wcp-font-size-sm)">';
      html += icon('circle-check') + ' No gaps detected — all clusters have content and pillar is set!';
      html += '<br><span style="color:var(--wcp-text-muted)">Run AI Gap Analysis for deeper competitor and topic coverage analysis.</span></div>';
    } else {
      for (var gpi = 0; gpi < gaps.length; gpi++) {
        var gap = gaps[gpi];
        html += '<div class="wcp-gap-item">';
        html += '<span style="font-size:var(--wcp-font-size-lg);color:var(--wcp-warning)">' + icon('circle-exclamation') + '</span>';
        html += '<div style="flex:1;min-width:0">';
        if (gap.type === 'no_pillar') {
          html += '<div style="font-size:var(--wcp-font-size-sm);font-weight:600;color:var(--wcp-text-primary)">Missing Pillar Content</div>';
        } else {
          html += '<div style="font-size:var(--wcp-font-size-sm);font-weight:600;color:var(--wcp-text-primary)">Empty Cluster: ' + esc(gap.cluster.name) + '</div>';
        }
        html += '<div style="font-size:var(--wcp-font-size-xs);color:var(--wcp-text-secondary)">' + esc(gap.reason) + '</div>';
        html += '</div>';
        html += badge('Action needed', 'var(--wcp-warning)');
        if (gap.type === 'no_pillar') {
          html += '<button class="wcp-btn wcp-btn-sm" data-action="create-pillar" data-hub="' + esc(hub.id) + '">' + icon('plus') + ' Create Pillar</button>';
        } else {
          html += '<button class="wcp-btn wcp-btn-sm" data-action="create-content-for-cluster" data-cluster="' + esc(gap.cluster.id) + '" data-hub="' + esc(hub.id) + '">' + icon('plus') + ' Create Content</button>';
        }
        html += '</div>';
      }
    }

    html += '</div></div>';
    return html;
  }

  function renderHubLinks(hub, content) {
    var html = '<div class="wcp-card"><div class="wcp-card-body">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-4)">';
    html += '<span style="font-size:var(--wcp-font-size-base);font-weight:700">' + icon('link') + ' Internal Linking Map</span>';
    // Hidden until AI Optimize Links is implemented (no handler today)
    // html += '<button class="wcp-btn-ai" data-action="ai-optimize-links" data-hub="' + esc(hub.id) + '">' + icon('sparkles') + ' AI Optimize Links</button>';
    html += '</div>';

    // Collect all internal links from content in this hub
    var links = [];
    for (var li = 0; li < content.length; li++) {
      var c = content[li];
      var cLinks = c.internal_links || [];
      for (var lj = 0; lj < cLinks.length; lj++) {
        var link = cLinks[lj];
        var targetContent = S.contentMap[link.target_content_id];
        links.push({
          from: c.title, fromId: c.id,
          direction: link.direction || '→',
          to: targetContent ? targetContent.title : (link.target_content_id || 'Unknown'),
          toId: link.target_content_id,
          anchor: link.anchor_text || ''
        });
      }
    }

    if (links.length === 0) {
      html += '<div style="padding:var(--wcp-space-3);background:var(--wcp-gray-50);border-radius:var(--wcp-radius-md);font-size:var(--wcp-font-size-sm);color:var(--wcp-text-secondary);margin-bottom:var(--wcp-space-3)">';
      html += 'Internal linking is planned during the Outline stage of each content piece. Links show here once content has linking plans defined.';
      html += '</div>';
      html += '<div style="text-align:center;padding:var(--wcp-space-4);color:var(--wcp-text-muted)">';
      html += '<p class="wcp-text-sm">No links planned yet. Set up internal links from each content piece\'s detail view.</p>';
      // Hidden until AI Optimize Links is implemented (no handler today)
      // html += '<button class="wcp-btn-ai" data-action="ai-optimize-links" data-hub="' + esc(hub.id) + '" style="margin-top:var(--wcp-space-2)">' + icon('sparkles') + ' AI Plan Link Architecture</button>';
      html += '</div>';
    } else {
      for (var lri = 0; lri < links.length; lri++) {
        var lr = links[lri];
        html += '<div class="wcp-link-row">';
        html += '<span class="wcp-link-from">' + esc(truncate(lr.from, 24)) + '</span>';
        html += badge(lr.direction, 'var(--wcp-hub)');
        html += '<span class="wcp-link-to">' + esc(truncate(lr.to, 24)) + '</span>';
        if (lr.anchor) html += '<span class="wcp-link-anchor">"' + esc(truncate(lr.anchor, 30)) + '"</span>';
        html += '</div>';
      }
    }

    html += '</div></div>';
    return html;
  }
  // ─── CONTENT VIEW (Stage 2.4) — Split Pane ────────────
