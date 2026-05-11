  function renderActivityView() {
    var html = '<div class="wcp-view">';
    html += '<div class="wcp-view-header"><div class="wcp-view-header-left"><h1>' + icon('clock-rotate-left') + ' Activity Log</h1>';
    html += '<span class="wcp-view-subtitle">All workspace actions</span></div>';
    html += '<div class="wcp-view-header-right">';
    html += '<select class="wcp-select wcp-select-sm" id="wcpActivityFilter" style="width:auto"><option value="">All types</option>';
    html += '<option value="ai_action">AI actions</option><option value="content_created">Content</option>';
    html += '<option value="hub_created">Hubs</option><option value="cluster_created">Clusters</option>';
    html += '<option value="settings_changed">Settings</option>';
    html += '</select></div></div>';

    var acts = (S.activity || []).slice().reverse();
    // Apply filter
    if (S.activityFilter.type) {
      var filterBase = S.activityFilter.type.replace('_created', '');
      acts = acts.filter(function(a) { return (a.type || '').indexOf(filterBase) > -1; });
    }

    if (acts.length === 0) {
      html += '<div class="wcp-empty-state">';
      html += '<div class="wcp-empty-state-icon">' + icon('clock-rotate-left') + '</div>';
      html += '<div class="wcp-empty-state-title">No activity yet</div>';
      html += '<div class="wcp-empty-state-text">Actions like creating hubs, content, running AI analysis, and exporting will appear here.</div>';
      html += '</div>';
    } else {
      // Stats row
      var aiCount = acts.filter(function(a) { return (a.type || '').indexOf('ai') > -1 || a.type === 'research_session'; }).length;
      html += '<div style="display:flex;gap:var(--wcp-space-3);margin-bottom:var(--wcp-space-4)">';
      html += '<div class="wcp-stat-card" style="flex:1;text-align:center"><div class="wcp-stat-label">Total Actions</div><div class="wcp-stat-value" style="color:var(--wcp-primary);font-size:var(--wcp-font-size-xl)">' + acts.length + '</div></div>';
      html += '<div class="wcp-stat-card" style="flex:1;text-align:center"><div class="wcp-stat-label">AI Actions</div><div class="wcp-stat-value" style="color:var(--wcp-cluster);font-size:var(--wcp-font-size-xl)">' + aiCount + '</div></div>';
      html += '<div class="wcp-stat-card" style="flex:1;text-align:center"><div class="wcp-stat-label">Manual</div><div class="wcp-stat-value" style="color:var(--wcp-content);font-size:var(--wcp-font-size-xl)">' + (acts.length - aiCount) + '</div></div>';
      html += '</div>';

      html += '<div class="wcp-card"><div class="wcp-activity-list">';
      var showCount = Math.min(acts.length, 50);
      for (var ai = 0; ai < showCount; ai++) {
        var act = acts[ai];
        var at = ACTIVITY_TYPES[act.type] || { icon: 'circle', color: '#80868b' };
        html += '<div class="wcp-activity-item">';
        html += '<div style="width:28px;height:28px;border-radius:50%;background:' + at.color + '15;color:' + at.color + ';display:flex;align-items:center;justify-content:center;font-size:var(--wcp-font-size-xs);flex-shrink:0">' + icon(at.icon) + '</div>';
        html += '<div class="wcp-activity-body">';
        html += '<div class="wcp-activity-action"><b>' + esc((act.type || '').replace(/_/g, ' ')) + '</b></div>';
        if (act.content_title) {
          html += '<div class="wcp-activity-target">';
          if (act.content_id) html += '<a href="#" style="color:var(--wcp-primary);text-decoration:none" data-action="select-content" data-id="' + esc(act.content_id) + '">' + esc(act.content_title) + '</a>';
          else html += esc(act.content_title);
          html += '</div>';
        }
        if (act.description) html += '<div style="font-size:var(--wcp-font-size-xs);color:var(--wcp-text-secondary)">' + esc(act.description) + '</div>';
        html += '<div style="display:flex;gap:var(--wcp-space-2);font-size:10px;color:var(--wcp-text-muted);margin-top:2px">';
        if (act.user_name) html += '<span>' + icon('user') + ' ' + esc(act.user_name) + '</span>';
        html += '<span>' + formatRelativeTime(act.timestamp) + '</span>';
        html += '</div></div>';
        html += '<span class="wcp-activity-time">' + formatDateShort(act.timestamp) + '</span>';
        html += '</div>';
      }
      if (acts.length > 50) {
        html += '<div style="padding:var(--wcp-space-3);text-align:center;font-size:var(--wcp-font-size-xs);color:var(--wcp-text-muted)">';
        html += 'Showing 50 of ' + acts.length + ' entries</div>';
      }
      html += '</div></div>';
    }
    html += '</div>';
    return html;
  }

