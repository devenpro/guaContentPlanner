  // --- Active Dashboard ---
  function renderActiveDashboard() {
    var html = '<div class="wcp-view">';
    // Header
    html += '<div class="wcp-view-header"><div class="wcp-view-header-left"><h1>' + icon('chart-pie') + ' Dashboard</h1>';
    html += '<span class="wcp-view-subtitle">' + esc((S.meta.workspace || {}).name || 'Website Content Planner') + '</span></div>';
    html += '<div class="wcp-view-header-right">';
    // Hidden until AI Audit Authority is implemented (no handler today)
    // html += '<button class="wcp-btn-ai" data-action="ai-audit-authority">' + icon('sparkles') + ' AI Audit Authority</button>';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="create-hub">' + icon('plus') + ' New Hub</button>';
    html += '</div></div>';

    // Stats row (5 cards)
    html += renderDashStats();

    // Middle row: Pipeline + Optimization
    html += '<div class="wcp-dash-grid">';
    html += renderDashPipeline();
    html += renderDashOptScores();
    html += '</div>';

    // Bottom row: Hubs + Activity/Notifications
    html += '<div class="wcp-dash-grid">';
    html += renderDashHubs();
    html += renderDashNotifications();
    html += '</div>';

    // Brand status
    if (!S.brand || !S.brand.configured) {
      html += '<div style="padding:var(--wcp-space-3) var(--wcp-space-4);background:var(--wcp-warning-light);border-radius:var(--wcp-radius-md);color:var(--wcp-warning);font-size:var(--wcp-font-size-sm);margin-top:var(--wcp-space-4)">';
      html += icon('warning') + ' No brand profile detected on page. AI prompts will lack brand context. ';
      html += '<a href="#" data-action="go-view" data-view="settings">Configure in Settings</a></div>';
    }

    html += '</div>';
    return html;
  }

  function renderDashStats() {
    // Calculate gap count from clusters with no content
    var gapCount = 0;
    var clusters = S.data.clusters || [];
    for (var gci = 0; gci < clusters.length; gci++) {
      if (!clusters[gci].content_ids || clusters[gci].content_ids.length === 0) gapCount++;
    }
    S.totalGaps = gapCount;

    var exportReady = (S.statusCounts['export_ready'] || 0) + (S.statusCounts['exported'] || 0);

    var html = '<div class="wcp-dash-stats">';
    html += renderStatCard('Content Hubs', S.totalHubs, S.totalHubs === 1 ? '1 hub' : S.totalHubs + ' hubs', 'var(--wcp-hub)');
    html += renderStatCard('Clusters', S.totalClusters, S.totalClusters + ' keyword groups', 'var(--wcp-cluster)');
    html += renderStatCard('Content', S.totalContent, S.activeContent + ' active', 'var(--wcp-content)');
    html += renderStatCard('Gaps', gapCount, 'Clusters need content', 'var(--wcp-warning)');
    html += renderStatCard('Export Ready', exportReady, exportReady + ' for CW', 'var(--wcp-teal)');
    html += '</div>';
    return html;
  }

  function renderStatCard(label, value, sub, color) {
    return '<div class="wcp-stat-card"><div class="wcp-stat-label">' + esc(label) + '</div>' +
      '<div class="wcp-stat-value" style="color:' + color + '">' + formatNumber(value) + '</div>' +
      '<div class="wcp-stat-sub">' + esc(sub) + '</div></div>';
  }

  function renderDashPipeline() {
    var html = '<div class="wcp-dash-panel">';
    html += '<div class="wcp-dash-panel-header"><span class="wcp-dash-panel-title">' + icon('list-ol') + ' Content Pipeline</span></div>';
    if (S.totalContent === 0) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)"><p class="wcp-text-sm wcp-text-muted">No content yet. Create your first hub to get started.</p></div>';
    } else {
      for (var pi = 0; pi < PIPELINE_STEPS.length; pi++) {
        var step = PIPELINE_STEPS[pi];
        var statusKey = step.key === 'export' ? 'export_ready' : step.key;
        var count = S.statusCounts[statusKey] || 0;
        var stCfg = CONTENT_STATUSES[statusKey] || { color: '#80868b' };
        var pct = S.totalContent > 0 ? Math.round((count / S.totalContent) * 100) : 0;
        html += '<div class="wcp-pipeline-row">';
        html += '<span class="wcp-pipeline-label">' + esc(step.label) + '</span>';
        html += '<div class="wcp-pipeline-bar">';
        html += '<div class="wcp-pipeline-bar-fill" style="width:' + Math.max(pct, count > 0 ? 8 : 0) + '%;background:' + stCfg.color + '20"></div>';
        html += '<span class="wcp-pipeline-bar-count" style="color:' + stCfg.color + '">' + count + '</span>';
        html += '</div>';
        html += '</div>';
      }
      // Pipeline summary bar
      html += '<div style="margin-top:var(--wcp-space-3)">' + progressBar(
        S.totalContent > 0 ? Math.round(((S.statusCounts['export_ready'] || 0) + (S.statusCounts['exported'] || 0)) / S.totalContent * 100) : 0,
        'var(--wcp-success)'
      ) + '</div>';
      html += '<div style="font-size:10px;color:var(--wcp-text-muted);margin-top:var(--wcp-space-1);text-align:right">';
      html += ((S.statusCounts['export_ready'] || 0) + (S.statusCounts['exported'] || 0)) + ' of ' + S.totalContent + ' export-ready</div>';
    }
    html += '</div>';
    return html;
  }

  function renderDashOptScores() {
    // Calculate average scores across all content
    var seoTotal = 0, gseoTotal = 0, aeoTotal = 0, scored = 0;
    var content = S.data.content || [];
    for (var oi = 0; oi < content.length; oi++) {
      var a = content[oi].aeo_gseo;
      if (a && (a.seo_score > 0 || a.gseo_score > 0 || a.aeo_score > 0)) {
        seoTotal += a.seo_score || 0;
        gseoTotal += a.gseo_score || 0;
        aeoTotal += a.aeo_score || 0;
        scored++;
      }
    }
    var avgSeo = scored > 0 ? Math.round(seoTotal / scored) : 0;
    var avgGseo = scored > 0 ? Math.round(gseoTotal / scored) : 0;
    var avgAeo = scored > 0 ? Math.round(aeoTotal / scored) : 0;

    var html = '<div class="wcp-dash-panel">';
    html += '<div class="wcp-dash-panel-header"><span class="wcp-dash-panel-title">' + icon('shield') + ' Optimization Readiness</span>';
    // Hidden until AI Refresh Scores is implemented (no handler today)
    // html += '<button class="wcp-btn-ai wcp-btn-ai-sm" data-action="ai-refresh-scores">' + icon('sparkles') + ' Refresh</button>';
    html += '</div>';

    var scores = [
      { label: 'Traditional SEO', score: avgSeo, color: 'var(--wcp-hub)', desc: 'Keywords, structure, meta' },
      { label: 'GSEO (Gen. Search)', score: avgGseo, color: 'var(--wcp-cluster)', desc: 'Schema, AI Overview format' },
      { label: 'AEO (Answer Engine)', score: avgAeo, color: 'var(--wcp-coral)', desc: 'Citations, Q&A blocks, E-E-A-T' }
    ];

    if (scored === 0) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)"><p class="wcp-text-sm wcp-text-muted">No scored content yet. Scores appear as content progresses through the AEO/GSEO stage.</p></div>';
    } else {
      for (var sci = 0; sci < scores.length; sci++) {
        var sc = scores[sci];
        html += '<div class="wcp-opt-score">';
        html += '<div class="wcp-opt-score-header">';
        html += '<span class="wcp-opt-score-label">' + esc(sc.label) + '</span>';
        html += '<span class="wcp-opt-score-value" style="color:' + sc.color + '">' + sc.score + '%</span>';
        html += '</div>';
        html += progressBar(sc.score, sc.color);
        html += '<div class="wcp-opt-score-desc">' + esc(sc.desc) + '</div>';
        html += '</div>';
      }
      html += '<div style="font-size:10px;color:var(--wcp-text-muted);margin-top:var(--wcp-space-2)">Average across ' + scored + ' scored content piece' + (scored > 1 ? 's' : '') + '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderDashHubs() {
    var hubs = S.data.hubs || [];
    var html = '<div class="wcp-dash-panel">';
    html += '<div class="wcp-dash-panel-header"><span class="wcp-dash-panel-title">' + icon('sitemap') + ' Hubs Overview</span>';
    html += '<button class="wcp-btn-link" data-action="go-view" data-view="hubs">View all ' + icon('arrow-right') + '</button></div>';

    if (hubs.length === 0) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)">';
      html += '<p class="wcp-text-sm wcp-text-muted">No hubs yet. Create your first content hub to organize your topical authority areas.</p>';
      html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="create-hub" style="margin-top:var(--wcp-space-3)">' + icon('plus') + ' Create Hub</button>';
      html += '</div>';
    } else {
      for (var hi = 0; hi < hubs.length; hi++) {
        var h = hubs[hi];
        var hubClusters = getHubClusters(h.id);
        var hubContent = getHubContent(h.id);
        var total = hubClusters.length + hubContent.length;
        var done = hubContent.filter(function(c) { return c.status === 'export_ready' || c.status === 'exported'; }).length;
        var pct = total > 0 ? Math.round((done / total) * 100) : 0;
        var hasPillar = !!h.pillar_content_id;

        html += '<div style="display:flex;align-items:center;gap:var(--wcp-space-3);padding:var(--wcp-space-3) 0;';
        if (hi < hubs.length - 1) html += 'border-bottom:1px solid var(--wcp-border-light);';
        html += 'cursor:pointer" data-action="go-hub-detail" data-id="' + esc(h.id) + '">';
        html += '<div style="width:8px;height:8px;border-radius:50%;background:' + (h.color || 'var(--wcp-primary)') + ';flex-shrink:0"></div>';
        html += '<span style="flex:1;font-size:var(--wcp-font-size-sm);font-weight:600;color:var(--wcp-text-primary)">' + esc(h.name) + '</span>';
        html += badge(hasPillar ? 'Pillar ✓' : 'No pillar', hasPillar ? 'var(--wcp-success)' : 'var(--wcp-warning)');
        html += '<div style="display:flex;align-items:center;gap:var(--wcp-space-2);width:100px">';
        html += progressBar(pct, h.color || 'var(--wcp-primary)');
        html += '<span style="font-size:10px;font-weight:700;color:' + (h.color || 'var(--wcp-primary)') + ';width:28px;text-align:right">' + pct + '%</span>';
        html += '</div></div>';
      }
    }
    html += '</div>';
    return html;
  }

  function renderDashNotifications() {
    var html = '<div class="wcp-dash-panel">';
    html += '<div class="wcp-dash-panel-header"><span class="wcp-dash-panel-title">' + icon('sparkles') + ' AI Notifications</span>';
    // Badge showing count
    var notifCount = buildNotifications().length;
    if (notifCount > 0) html += badge(notifCount + ' new', 'var(--wcp-cluster)');
    html += '</div>';

    var notifs = buildNotifications();
    if (notifs.length === 0) {
      html += '<div style="padding:var(--wcp-space-4);font-size:var(--wcp-font-size-sm);color:var(--wcp-text-muted)">No notifications — everything looks good!</div>';
    } else {
      for (var ni = 0; ni < Math.min(notifs.length, 5); ni++) {
        var n = notifs[ni];
        html += '<div class="wcp-notif-item">';
        html += '<span class="wcp-notif-icon">' + esc(n.icon) + '</span>';
        html += '<div class="wcp-notif-text"><strong>' + esc(n.title) + '</strong>';
        if (n.desc) html += '<div style="font-size:10px;color:var(--wcp-text-secondary);margin-top:1px">' + esc(n.desc) + '</div>';
        html += '</div></div>';
      }
    }

    // Recent activity (compact)
    var acts = getRecentActivity(4);
    if (acts.length > 0) {
      html += '<div style="border-top:1px solid var(--wcp-border-light);margin-top:var(--wcp-space-3);padding-top:var(--wcp-space-3)">';
      html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-2)">';
      html += '<span style="font-size:var(--wcp-font-size-xs);font-weight:700;color:var(--wcp-text-secondary)">Recent Activity</span>';
      html += '<button class="wcp-btn-link" data-action="go-view" data-view="activity">All</button></div>';
      for (var ai = 0; ai < acts.length; ai++) {
        html += renderActivityItemCompact(acts[ai]);
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function buildNotifications() {
    var notifs = [];
    // Stale content (in early stages for 14+ days)
    var now = Date.now();
    var content = S.data.content || [];
    var staleCount = 0;
    for (var sci = 0; sci < content.length; sci++) {
      var c = content[sci];
      var stIdx = STATUS_ORDER.indexOf(c.status);
      if (stIdx >= 0 && stIdx <= 2 && c.updated) {
        var age = (now - new Date(c.updated).getTime()) / 86400000;
        if (age > 14) staleCount++;
      }
    }
    if (staleCount > 0) {
      notifs.push({ icon: '⚡', title: staleCount + ' piece' + (staleCount > 1 ? 's' : '') + ' stuck in early stages 14+ days', desc: 'Consider completing angle or keyword research' });
    }
    // Clusters without content
    var emptyClusters = (S.data.clusters || []).filter(function(cl) { return !cl.content_ids || cl.content_ids.length === 0; });
    if (emptyClusters.length > 0) {
      notifs.push({ icon: '🎯', title: emptyClusters.length + ' cluster' + (emptyClusters.length > 1 ? 's' : '') + ' have no content', desc: 'Link content pieces or create new ones' });
    }
    // Export-ready content
    var exportReady = (S.statusCounts['export_ready'] || 0);
    if (exportReady > 0) {
      notifs.push({ icon: '✅', title: exportReady + ' content piece' + (exportReady > 1 ? 's' : '') + ' ready to export', desc: 'Export to Content Writer to start writing' });
    }
    // Hubs without pillar
    var noPillar = (S.data.hubs || []).filter(function(h) { return !h.pillar_content_id; });
    if (noPillar.length > 0) {
      notifs.push({ icon: '👑', title: noPillar.length + ' hub' + (noPillar.length > 1 ? 's' : '') + ' missing pillar content', desc: 'Pillar pages anchor topical authority — create them first' });
    }
    return notifs;
  }

  function renderActivityItemCompact(act) {
    var at = ACTIVITY_TYPES[act.type] || { icon: 'circle', color: '#80868b' };
    var html = '<div style="display:flex;align-items:center;gap:var(--wcp-space-2);padding:var(--wcp-space-1) 0;font-size:var(--wcp-font-size-xs)">';
    html += '<span style="color:' + at.color + '">' + icon(at.icon) + '</span>';
    html += '<span style="flex:1;color:var(--wcp-text-primary)">';
    html += '<strong>' + esc((act.type || '').replace(/_/g, ' ')) + '</strong>';
    if (act.content_title) html += ' — ' + esc(truncate(act.content_title, 28));
    html += '</span>';
    html += '<span style="color:var(--wcp-text-muted);flex-shrink:0">' + formatRelativeTime(act.timestamp) + '</span>';
    html += '</div>';
    return html;
  }

  // ─── HUBS VIEW (Stage 2.2) ────────────────────────────
