  function renderContentView() {
    var html = '<div class="wcp-view wcp-view-content"><div class="wcp-split-pane">';
    html += renderContentListPane();
    html += '<div class="wcp-detail-pane" id="wcpDetailPane">' + renderContentDetailPane() + '</div>';
    html += '</div></div>';
    return html;
  }

  function renderContentListPane() {
    var f = S.contentFilter;
    var html = '<div class="wcp-list-pane wcp-content-pane">';
    // Header with search + new
    html += '<div class="wcp-list-pane-header">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-2)">';
    html += '<span style="font-size:var(--wcp-font-size-sm);font-weight:700">Content <span class="wcp-text-muted">(' + S.totalContent + ')</span></span>';
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="create-content">' + icon('plus') + ' New</button>';
    html += '</div>';

    // Search
    html += '<div class="wcp-search-wrapper"><span class="wcp-icon">' + icon('search') + '</span>';
    html += '<input class="wcp-input" id="wcpContentSearch" placeholder="Search title, audience, angle, hub…" style="padding-left:30px" value="' + esc(f.search || '') + '">';
    if (f.search) html += '<button class="wcp-search-clear" data-action="clear-content-search" title="Clear search">' + icon('x') + '</button>';
    html += '</div>';

    // Sort + Group row
    html += '<div class="wcp-cl-sortgroup">';
    html += '<select class="wcp-select wcp-select-sm" id="wcpSortBy" title="Sort by">';
    var sortOptions = [
      ['updated', 'Recently updated'],
      ['created', 'Recently created'],
      ['title',   'Title (A–Z)'],
      ['status',  'Stage'],
      ['priority','Priority']
    ];
    for (var so = 0; so < sortOptions.length; so++) {
      html += '<option value="' + sortOptions[so][0] + '"' + (f.sortBy === sortOptions[so][0] ? ' selected' : '') + '>' + sortOptions[so][1] + '</option>';
    }
    html += '</select>';
    html += '<button class="wcp-btn-icon wcp-cl-sortdir" data-action="toggle-sort-dir" title="Toggle direction">' + icon(f.sortDir === 'asc' ? 'arrow-up' : 'arrow-down') + '</button>';
    html += '<select class="wcp-select wcp-select-sm" id="wcpGroupBy" title="Group by">';
    var groupOptions = [
      ['none',    'No grouping'],
      ['hub',     'By hub'],
      ['cluster', 'By cluster'],
      ['type',    'By type'],
      ['status',  'By stage'],
      ['priority','By priority']
    ];
    for (var go = 0; go < groupOptions.length; go++) {
      html += '<option value="' + groupOptions[go][0] + '"' + ((f.groupBy || 'none') === groupOptions[go][0] ? ' selected' : '') + '>' + groupOptions[go][1] + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Filters disclosure — collapses type pills + hub/stage selects + archived
    // toggle behind a single "Filters" button. Default closed to keep the
    // header compact; badge on the toggle shows how many advanced filters
    // are currently active.
    var activeAdvCount = 0;
    if (f.type) activeAdvCount++;
    if (f.hub) activeAdvCount++;
    if (f.statuses && f.statuses.length) activeAdvCount++;
    if (f.showClosed) activeAdvCount++;
    html += '<button class="wcp-cl-filters-toggle' + (f.advancedOpen ? ' is-open' : '') + '" data-action="toggle-content-advanced">';
    html += icon('filter') + ' Filters';
    if (activeAdvCount) html += ' <span class="wcp-cl-filters-badge">' + activeAdvCount + '</span>';
    html += ' <span class="wcp-cl-filters-chev">' + icon('chevron-down') + '</span>';
    html += '</button>';

    html += '<div class="wcp-cl-advanced-filters' + (f.advancedOpen ? ' is-open' : '') + '">';

    // Type filter pills
    html += '<div class="wcp-filter-pills">';
    var types = S.data.content_types || [];
    html += '<span class="wcp-filter-pill' + (!f.type ? ' wcp-filter-pill-active' : '') + '" data-action="filter-content-type" data-type="">All</span>';
    for (var fti = 0; fti < types.length; fti++) {
      var ft = types[fti];
      var typeCount = (S.data.content || []).filter(function(c) { return c.content_type_id === ft.id; }).length;
      if (typeCount > 0) html += '<span class="wcp-filter-pill' + (f.type === ft.id ? ' wcp-filter-pill-active' : '') + '" data-action="filter-content-type" data-type="' + esc(ft.id) + '">' + esc(ft.name) + ' <span class="wcp-filter-pill-num">' + typeCount + '</span></span>';
    }
    html += '</div>';

    // Hub + Stage filters
    html += '<div style="display:flex;gap:var(--wcp-space-1);margin-top:var(--wcp-space-2)">';
    html += '<select class="wcp-select wcp-select-sm" id="wcpFilterHub" style="flex:1"><option value="">All hubs</option>';
    var hubs = S.data.hubs || [];
    for (var fhi = 0; fhi < hubs.length; fhi++) {
      html += '<option value="' + esc(hubs[fhi].id) + '"' + (f.hub === hubs[fhi].id ? ' selected' : '') + '>' + esc(hubs[fhi].name) + '</option>';
    }
    html += '</select>';
    html += '<select class="wcp-select wcp-select-sm" id="wcpFilterStage" style="flex:1"><option value="">All stages</option>';
    for (var fsi = 0; fsi < STATUS_ORDER.length; fsi++) {
      var fsCfg = CONTENT_STATUSES[STATUS_ORDER[fsi]];
      if (!fsCfg) continue;
      if (CLOSED_STATUSES.indexOf(STATUS_ORDER[fsi]) !== -1 && !f.showClosed) continue;
      var isSelStage = (f.statuses && f.statuses.length === 1 && f.statuses[0] === STATUS_ORDER[fsi]);
      html += '<option value="' + STATUS_ORDER[fsi] + '"' + (isSelStage ? ' selected' : '') + '>' + esc(fsCfg.label) + '</option>';
    }
    html += '</select></div>';

    // Archived toggle
    var archivedCount = (S.archivedContent || 0) + (S.rejectedContent || 0);
    html += '<label class="wcp-mini-toggle" style="display:flex;align-items:center;gap:6px;margin-top:var(--wcp-space-2);font-size:var(--wcp-font-size-xs);color:var(--wcp-text-muted);cursor:pointer;user-select:none">';
    html += '<input type="checkbox" id="wcpFilterShowClosed"' + (f.showClosed ? ' checked' : '') + ' style="margin:0">';
    html += icon('box-archive') + ' Show archived + rejected';
    if (archivedCount) html += ' <span class="wcp-text-muted">(' + archivedCount + ')</span>';
    html += '</label>';

    html += '</div>';  // /advanced-filters

    // Active filter chips — shown always when any filter is applied (even if
    // the advanced panel is collapsed) so the user knows what's applied.
    html += _renderActiveFilterChips(f);

    html += '</div>';

    // Content list
    html += '<div class="wcp-list-pane-items" id="wcpContentList">';
    html += renderContentListItems();
    html += '</div></div>';
    return html;
  }

  function _renderActiveFilterChips(f) {
    var chips = [];
    if (f.search)   chips.push({ key: 'search',  label: 'Search: "' + f.search + '"' });
    if (f.type && S.contentTypeMap[f.type])  chips.push({ key: 'type', label: 'Type: ' + S.contentTypeMap[f.type].name });
    if (f.hub && S.hubMap[f.hub])            chips.push({ key: 'hub',  label: 'Hub: ' + S.hubMap[f.hub].name });
    if (f.statuses && f.statuses.length)     chips.push({ key: 'stage', label: 'Stage: ' + (CONTENT_STATUSES[f.statuses[0]] || {label: f.statuses[0]}).label });
    if (!chips.length) return '';
    var html = '<div class="wcp-cl-active-filters">';
    for (var i = 0; i < chips.length; i++) {
      html += '<span class="wcp-cl-filter-chip"><span>' + esc(chips[i].label) + '</span>' +
        '<button data-action="clear-filter" data-key="' + chips[i].key + '" title="Clear">' + icon('x') + '</button></span>';
    }
    if (chips.length > 1) {
      html += '<button class="wcp-cl-clear-all" data-action="clear-all-filters">Clear all</button>';
    }
    html += '</div>';
    return html;
  }

  function getFilteredContent() {
    var items = (S.data.content || []).slice();
    var f = S.contentFilter;
    var hasExplicitStatus = f.statuses && f.statuses.length > 0;
    if (!f.showClosed && !hasExplicitStatus) {
      items = items.filter(function(c) { return CLOSED_STATUSES.indexOf(c.status) === -1; });
    }
    if (f.search) {
      // Broad search: title, audience, angle, UVP, hub name, cluster name.
      // Keeps the query lowercase-compared and builds a concat-string per
      // item once (cheap at a few thousand items, no memoization needed).
      var q = f.search.toLowerCase();
      items = items.filter(function(c) {
        var hub = S.hubMap[c.hub_id];
        var cl  = S.clusterMap[c.cluster_id];
        var bi  = c.basic_info || {};
        var r   = c.research || {};
        var hay = [
          c.title || '',
          bi.audience || '',
          r.selected_angle || '',
          r.uvp || '',
          hub ? hub.name : '',
          cl  ? cl.name  : ''
        ].join(' ').toLowerCase();
        return hay.indexOf(q) > -1;
      });
    }
    if (f.type) items = items.filter(function(c) { return c.content_type_id === f.type; });
    if (f.hub) items = items.filter(function(c) { return c.hub_id === f.hub; });
    if (hasExplicitStatus) items = items.filter(function(c) { return f.statuses.indexOf(c.status) > -1; });
    // Sort
    var priorityRank = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3, '': 4 };
    items.sort(function(a, b) {
      if (f.sortBy === 'title')    return (a.title || '').localeCompare(b.title || '');
      if (f.sortBy === 'status')   return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (f.sortBy === 'priority') return (priorityRank[a.priority || ''] || 4) - (priorityRank[b.priority || ''] || 4);
      if (f.sortBy === 'created')  return (b.created || '') > (a.created || '') ? 1 : -1;
      // default: updated desc
      return (b.updated || b.created || '') > (a.updated || a.created || '') ? 1 : -1;
    });
    if (f.sortDir === 'asc') items.reverse();
    return items;
  }

  function renderContentListItems() {
    var items = getFilteredContent();
    if (items.length === 0) {
      return '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)">' +
        '<div class="wcp-empty-state-icon">' + icon('file-lines') + '</div>' +
        '<div class="wcp-empty-state-title" style="font-size:var(--wcp-font-size-sm)">No content found</div>' +
        '<div class="wcp-empty-state-text">Create content or adjust your filters.</div>' +
        '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="create-content">' + icon('plus') + ' New Content</button></div>';
    }
    // Single-level grouping when groupBy != 'none'. Maintains sort order
    // within each group.
    var groupBy = (S.contentFilter.groupBy || 'none');
    if (groupBy !== 'none') {
      return _renderContentListGrouped(items, groupBy);
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      html += _renderContentListRow(items[i]);
    }
    return html;
  }

  function _renderContentListRow(c) {
    var isActive = S.selectedContentId === c.id;
    var ct = S.contentTypeMap[c.content_type_id];
    var hub = S.hubMap[c.hub_id];
    var stCfg = CONTENT_STATUSES[c.status] || { label: c.status, color: '#80868b' };
    var cwLinked = S.contentWriterMap && S.contentWriterMap[c.id];
    var bi = c.basic_info || {};
    var intent = bi.search_intent;
    var funnel = bi.funnel_stage;
    var intentColorMap = { 'informational': 'var(--wcp-hub)', 'commercial': 'var(--wcp-accent)', 'transactional': 'var(--wcp-success)', 'navigational': 'var(--wcp-warning)' };
    var intentColor = intentColorMap[intent] || 'var(--wcp-text-muted)';

    var html = '<div class="wcp-list-item' + (isActive ? ' wcp-list-item-active' : '') + '" data-action="select-content" data-id="' + esc(c.id) + '" style="border-left-color:' + (intent ? intentColor : 'transparent') + '">';
    if (intent || funnel) {
      html += '<div class="wcp-intent-indicator">';
      if (intent) html += '<span style="color:' + intentColor + '">' + icon('compass') + ' ' + esc(intent) + '</span>';
      if (funnel) html += '<span class="wcp-text-xs wcp-text-muted">' + esc(funnel.toUpperCase()) + '</span>';
      html += '</div>';
    }
    html += '<div class="wcp-list-item-title">' + esc(truncate(c.title, 50)) + '</div>';
    html += '<div class="wcp-list-item-meta">';
    if (ct) html += badge(ct.name, ct.color || '#80868b');
    html += '<span class="wcp-status-badge"><span class="wcp-status-dot" style="background:' + stCfg.color + '"></span>' + esc(stCfg.label) + '</span>';
    if (cwLinked) html += '<a href="' + esc(cwLinked.url) + '" target="_blank" class="wcp-cw-link-icon" title="Open in Content Writer" onclick="event.stopPropagation()">' + icon('external-link') + '</a>';
    html += '</div>';
    if (hub) html += '<div class="wcp-list-item-sub">' + esc(hub.name) + '</div>';
    html += '</div>';
    return html;
  }

  function _renderContentListGrouped(items, groupBy) {
    // Single-level grouping. Buckets maintain the caller's sort order
    // (JS Map preserves insertion). Each bucket gets a header + count.
    var buckets = {};
    var bucketOrder = [];
    for (var i = 0; i < items.length; i++) {
      var c = items[i];
      var key = _groupKey(c, groupBy);
      if (!buckets[key.id]) {
        buckets[key.id] = { label: key.label, color: key.color, items: [] };
        bucketOrder.push(key.id);
      }
      buckets[key.id].items.push(c);
    }
    var html = '';
    for (var b = 0; b < bucketOrder.length; b++) {
      var bucket = buckets[bucketOrder[b]];
      html += '<div class="wcp-cl-group-header"' + (bucket.color ? ' style="--grp-color:' + bucket.color + '"' : '') + '>';
      html += '<span class="wcp-cl-group-label">' + esc(bucket.label) + '</span>';
      html += '<span class="wcp-cl-group-count">' + bucket.items.length + '</span>';
      html += '</div>';
      for (var bi = 0; bi < bucket.items.length; bi++) html += _renderContentListRow(bucket.items[bi]);
    }
    return html;
  }

  function _groupKey(c, groupBy) {
    if (groupBy === 'hub') {
      var hub = S.hubMap[c.hub_id];
      if (hub) return { id: hub.id, label: hub.name, color: hub.color };
      return { id: '__none_hub__', label: 'No hub', color: '#9aa0a6' };
    }
    if (groupBy === 'cluster') {
      var cl = S.clusterMap[c.cluster_id];
      if (cl) return { id: cl.id, label: cl.name, color: null };
      return { id: '__none_cluster__', label: 'No cluster', color: '#9aa0a6' };
    }
    if (groupBy === 'type') {
      var ct = S.contentTypeMap[c.content_type_id];
      if (ct) return { id: ct.id, label: ct.name, color: ct.color };
      return { id: '__none_type__', label: 'No type', color: '#9aa0a6' };
    }
    if (groupBy === 'status') {
      var sc = CONTENT_STATUSES[c.status] || { label: c.status, color: '#9aa0a6' };
      return { id: c.status, label: sc.label, color: sc.color };
    }
    if (groupBy === 'priority') {
      // PRIORITY_LEVELS is declared at the top of part1/01-constants.js — Part 1 scope.
      var PL = (typeof PRIORITY_LEVELS !== 'undefined') ? PRIORITY_LEVELS : {};
      var p = c.priority || 'medium';
      var pc = PL[p] || { label: p, color: '#9aa0a6' };
      return { id: p, label: pc.label + ' priority', color: pc.color };
    }
    return { id: '__all__', label: 'All', color: null };
  }

