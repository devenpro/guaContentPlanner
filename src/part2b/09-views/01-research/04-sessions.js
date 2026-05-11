  function renderResearchSessions(mode) {
    var sessions = (S.data.research_sessions || []).filter(function(s) { return !mode || s.type === mode || !s.type; });
    sessions.sort(function(a, b) { return (b.created || '') > (a.created || '') ? 1 : -1; });
    if (!sessions.length) {
      return '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)">' +
        '<div class="wcp-empty-state-icon">' + icon('flask') + '</div>' +
        '<div class="wcp-empty-state-title">No research sessions yet</div>' +
        '<div class="wcp-empty-state-text">Run a research query above to get started.</div></div>';
    }
    var html = '<div style="margin-top:var(--wcp-space-2)">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-3)"><h3>' + icon('history') + ' Research Sessions (' + sessions.length + ')</h3></div>';
    for (var si = 0; si < sessions.length; si++) {
      var sess = sessions[si];
      var results = sess.results || [];
      var isLatest = si === 0;
      // Collapsible session card
      html += '<div class="wcp-collapsible-section' + (isLatest ? ' wcp-collapsible-open' : '') + '" style="margin-bottom:var(--wcp-space-3)">';
      html += '<div class="wcp-collapsible-toggle" data-action="toggle-collapsible">';
      html += '<div style="flex:1;min-width:0"><strong style="font-size:var(--wcp-font-size-sm)">' + esc(sess.title || 'Research Session') + '</strong>';
      html += '<span class="wcp-text-sm wcp-text-muted" style="margin-left:var(--wcp-space-2)">' + badge(sess.type || 'research', 'var(--wcp-text-muted)') + ' ' + results.length + ' results</span></div>';
      html += '<div style="display:flex;gap:var(--wcp-space-1);align-items:center;flex-shrink:0">';
      html += '<span class="wcp-text-sm wcp-text-muted">' + formatRelativeTime(sess.created) + '</span>';
      html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="delete-session" data-session="' + esc(sess.id) + '" onclick="event.stopPropagation()">' + icon('trash') + '</button>';
      html += '<span class="wcp-collapsible-chevron">' + icon('chevron-down') + '</span>';
      html += '</div></div>';
      html += '<div class="wcp-collapsible-body" style="' + (isLatest ? '' : 'display:none') + '">';

      // Session content
      if (sess.type === 'keywords' && sess.keyword_group_ids && sess.keyword_group_ids.length) {
        html += renderKeywordGroupedResults(sess);
      } else if (results.length > 0) {
        html += renderFlatResults(sess);
      }
      html += '</div></div>';
    }
    html += '</div>';
    return html;
  }

  function renderKeywordGroupedResults(sess) {
    var groupIds = sess.keyword_group_ids || [];
    var html = '';
    for (var gi = 0; gi < groupIds.length; gi++) {
      var grp = S.keywordGroupMap[groupIds[gi]];
      if (!grp) continue;
      var kws = grp.keywords || [];
      var linkedContent = grp.content_id ? S.contentMap[grp.content_id] : null;

      var intentColor = _intentColor(grp.search_intent);
      html += '<div class="wcp-kw-group-card">';
      html += '<div class="wcp-intent-bar" style="background:' + intentColor + '"></div>';
      html += '<div class="wcp-kw-group-header">';
      html += '<div style="flex:1;min-width:0">';
      html += '<div class="wcp-intent-leader">' + icon('compass') + ' ' + esc(grp.intent || 'No intent set') + '</div>';
      html += '<div class="wcp-kw-group-supporting">' + badge(grp.search_intent || 'informational', intentColor) + ' <span class="wcp-text-xs wcp-text-muted">' + icon('layer-group') + ' ' + esc(grp.name) + '</span></div>';
      html += '</div>';
      html += '<div style="display:flex;gap:var(--wcp-space-1);align-items:center;flex-shrink:0">';
      html += '<button class="wcp-btn-icon" data-action="edit-keyword-group" data-id="' + esc(grp.id) + '" title="Edit group">' + icon('pen') + '</button>';
      html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="delete-keyword-group" data-id="' + esc(grp.id) + '" title="Delete group">' + icon('trash') + '</button>';
      html += '</div>';
      html += '</div>';

      // Keywords list
      html += '<div class="wcp-kw-list">';
      for (var ki = 0; ki < kws.length; ki++) {
        var kw = kws[ki];
        var isPrimary = ki === grp.primary_keyword_index;
        html += '<div class="wcp-kw-item' + (isPrimary ? ' wcp-kw-primary' : '') + '">';
        html += '<span class="wcp-kw-keyword">' + (isPrimary ? icon('star') + ' ' : '') + esc(kw.keyword) + '</span>';
        html += '<span class="wcp-kw-meta">';
        if (kw.volume) html += badge(formatNumber(kw.volume) + '/mo', 'var(--wcp-hub)');
        if (kw.difficulty) html += badge(kw.difficulty, 'var(--wcp-text-muted)');
        html += '</span>';
        html += '</div>';
      }
      html += '</div>';

      // Actions
      html += '<div class="wcp-kw-group-actions">';
      if (linkedContent) {
        html += '<span class="wcp-text-sm" style="color:var(--wcp-success)">' + icon('circle-check') + ' Linked to: ' + esc(truncate(linkedContent.title, 30)) + '</span>';
      } else {
        html += '<button class="wcp-btn wcp-btn-sm wcp-btn-primary" data-action="promote-keyword-group" data-group-id="' + esc(grp.id) + '">' + icon('plus') + ' Create Content from Group</button>';
      }
      html += '</div>';
      html += '</div>';
    }
    return html;
  }

  function renderFlatResults(sess) {
    var results = sess.results || [];
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--wcp-space-3)">';
    for (var ri = 0; ri < results.length; ri++) {
      var r = results[ri];
      var intentColor = _intentColor(r.search_intent);
      html += '<div class="wcp-card wcp-intent-card" style="padding:0;border:1px solid var(--wcp-border-light);overflow:hidden">';
      // Intent bar at top
      html += '<div class="wcp-intent-bar" style="background:' + intentColor + '"></div>';
      html += '<div style="padding:var(--wcp-space-3)">';
      // Intent leader (top, prominent)
      if (r.intent_summary) {
        html += '<div class="wcp-intent-leader">' + icon('compass') + ' ' + esc(r.intent_summary) + '</div>';
      } else if (r.search_intent) {
        html += '<div class="wcp-intent-leader">' + icon('compass') + ' ' + esc(r.search_intent.charAt(0).toUpperCase() + r.search_intent.slice(1)) + ' intent</div>';
      }
      // Title second
      html += '<div style="font-weight:600;font-size:var(--wcp-font-size-sm);margin-top:var(--wcp-space-1);margin-bottom:var(--wcp-space-1)">' + esc(r.title || r.keyword || '') + '</div>';
      if (r.description || r.reasoning) html += '<div class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-2);line-height:1.5">' + esc(truncate(r.description || r.reasoning || '', 120)) + '</div>';
      // Supporting badges
      html += '<div style="display:flex;gap:var(--wcp-space-1);flex-wrap:wrap;margin-bottom:var(--wcp-space-2)">';
      if (r.volume) html += badge(formatNumber(r.volume) + '/mo', 'var(--wcp-hub)');
      if (r.difficulty) html += badge(r.difficulty, 'var(--wcp-text-muted)');
      if (r.search_intent) html += badge(r.search_intent, intentColor);
      if (r.content_type) html += badge(r.content_type, 'var(--wcp-cluster)');
      if (r.priority) html += badge(r.priority, r.priority === 'high' ? 'var(--wcp-error)' : 'var(--wcp-warning)');
      if (r.possible_duplicate) html += badge('Possible duplicate intent', 'var(--wcp-warning)');
      html += '</div>';
      if (r.promoted) {
        html += '<span class="wcp-text-sm" style="color:var(--wcp-success)">' + icon('circle-check') + ' Promoted to content</span>';
      } else {
        html += '<button class="wcp-btn wcp-btn-sm wcp-btn-outline" data-action="promote-research" data-session="' + esc(sess.id) + '" data-result="' + ri + '">' + icon('plus') + ' Create Content</button>';
      }
      html += '</div></div>';
    }
    html += '</div>';
    return html;
  }

  // ── Research runners ──

