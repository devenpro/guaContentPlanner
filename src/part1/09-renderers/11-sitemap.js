  // ============================================================
  // SITEMAP VIEW — tree (path-derived) + detail pane
  // ============================================================
  //
  // Left rail:  scope bar (search + priority filter + show-removed toggle) +
  //             collapsible folder tree (folders derived from URL path
  //             segments, counts precomputed per node).
  // Right pane: selected-page detail (url, title, priority pills, keywords,
  //             inbound/outbound link counts, linked planner content).
  //
  // Performance notes: the folder tree is rendered from a nested object, but
  // collapsed folders don't emit their children — so a 10K-page sitemap only
  // materialises DOM for the user-expanded subtree. Filter + search both
  // flatten into a list view to bypass the tree entirely.

  function renderSitemapView() {
    // Auto-select the first live page when none is selected — guarantees the
    // detail pane shows editing controls on first open, so users don't have
    // to discover that they need to click a row to edit.
    if (!S.selectedSitemapPageId) {
      var pagesArr = (S.data.sitemap && S.data.sitemap.pages) || [];
      for (var ai = 0; ai < pagesArr.length; ai++) {
        if (pagesArr[ai].status !== 'removed') { S.selectedSitemapPageId = pagesArr[ai].id; break; }
      }
    } else {
      // Also validate the stored id still exists (page may have been deleted)
      if (!S.sitemapPageMap[S.selectedSitemapPageId]) S.selectedSitemapPageId = null;
    }
    // Default the planned-mode hub to the first hub when nothing's chosen.
    if (!S.sitemapPlanHubId) {
      var firstHub = (S.data.hubs || [])[0];
      if (firstHub) S.sitemapPlanHubId = firstHub.id;
    }

    var html = '<div class="wcp-view wcp-view-sitemap">';
    html += renderSitemapSummary();
    html += renderSitemapModeBar();
    if (S.sitemapMode === 'planned') {
      html += renderSitemapPlannedMode();
    } else {
      html += '<div class="wcp-split-pane">';
      html += renderSitemapListPane();
      html += '<div class="wcp-detail-pane" id="wcpSitemapDetailPane">' + renderSitemapDetailPane() + '</div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // Mode bar — switches between the live (imported) view and the per-hub
  // planned tree editor. The mode is sticky (persists via S.sitemapMode +
  // lastLocation) so a user returning to Sitemap lands where they left off.
  function renderSitemapModeBar() {
    var mode = S.sitemapMode === 'planned' ? 'planned' : 'live';
    var hubs = (S.data.hubs || []).slice().sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var liveCount = ((S.data.sitemap && S.data.sitemap.pages) || []).filter(function(p) { return p.status !== 'removed'; }).length;
    var plannedCount = 0;
    if (S.sitemapPlanHubId && S.plannedNodeCountByHub) plannedCount = S.plannedNodeCountByHub[S.sitemapPlanHubId] || 0;

    var html = '<div class="wcp-sitemap-modebar">';
    html += '<div class="wcp-sitemap-modebar-tabs" role="tablist">';
    html += '<button class="wcp-sitemap-modebar-tab' + (mode === 'live' ? ' is-active' : '') + '" data-action="sitemap-set-mode" data-mode="live" role="tab">';
    html += icon('list') + ' Live <span class="wcp-text-muted">(' + liveCount + ')</span>';
    html += '</button>';
    html += '<button class="wcp-sitemap-modebar-tab' + (mode === 'planned' ? ' is-active' : '') + '" data-action="sitemap-set-mode" data-mode="planned" role="tab">';
    html += icon('diagram-project') + ' Planned';
    if (mode === 'planned') html += ' <span class="wcp-text-muted">(' + plannedCount + ')</span>';
    html += '</button>';
    html += '</div>';
    // Hub picker (planned mode only — live mode shows all pages across hubs)
    if (mode === 'planned') {
      html += '<div class="wcp-sitemap-modebar-hub">';
      html += '<label class="wcp-text-xs wcp-text-muted" style="margin-right:6px">Hub:</label>';
      html += '<select class="wcp-select wcp-select-sm" id="wcpSitemapPlanHub">';
      if (!hubs.length) {
        html += '<option value="">— No hubs yet —</option>';
      } else {
        for (var hi = 0; hi < hubs.length; hi++) {
          var h = hubs[hi];
          html += '<option value="' + esc(h.id) + '"' + (S.sitemapPlanHubId === h.id ? ' selected' : '') + '>' + esc(h.name) + '</option>';
        }
      }
      html += '</select>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // Thin summary strip at the top of the sitemap view — factual counts only,
  // no thresholds. Priority breakdown helps spot coverage gaps (e.g. "only 2
  // P1 pages" is a signal for planning pillars).
  function renderSitemapSummary() {
    var sm = (S.data && S.data.sitemap) || { pages: [], links: [] };
    var pages = (sm.pages || []).filter(function(p) { return p.status !== 'removed'; });
    var links = sm.links || [];
    var priCount = { 1: 0, 2: 0, 3: 0 };
    var withContent = 0;
    for (var i = 0; i < pages.length; i++) {
      var eff = effectivePriority(pages[i]);
      priCount[eff] = (priCount[eff] || 0) + 1;
      if (pages[i].content_id) withContent++;
    }
    var publishedLinks = 0, selectedLinks = 0, exportedLinks = 0;
    for (var li = 0; li < links.length; li++) {
      if (links[li].state === 'published') publishedLinks++;
      else if (links[li].state === 'exported') exportedLinks++;
      else if (links[li].state === 'selected') selectedLinks++;
    }
    var PR = SITEMAP_PRIORITIES;
    var html = '<div class="wcp-sitemap-summary">';
    html += '<div class="wcp-sitemap-summary-stat"><span class="wcp-sitemap-summary-num">' + pages.length + '</span><span class="wcp-sitemap-summary-lbl">Pages</span></div>';
    html += '<div class="wcp-sitemap-summary-divider"></div>';
    html += '<div class="wcp-sitemap-summary-stat"><span class="wcp-sitemap-summary-num" style="color:' + PR['1'].color + '">' + priCount[1] + '</span><span class="wcp-sitemap-summary-lbl">P1</span></div>';
    html += '<div class="wcp-sitemap-summary-stat"><span class="wcp-sitemap-summary-num" style="color:' + PR['2'].color + '">' + priCount[2] + '</span><span class="wcp-sitemap-summary-lbl">P2</span></div>';
    html += '<div class="wcp-sitemap-summary-stat"><span class="wcp-sitemap-summary-num" style="color:' + PR['3'].color + '">' + priCount[3] + '</span><span class="wcp-sitemap-summary-lbl">P3</span></div>';
    html += '<div class="wcp-sitemap-summary-divider"></div>';
    html += '<div class="wcp-sitemap-summary-stat"><span class="wcp-sitemap-summary-num">' + withContent + '</span><span class="wcp-sitemap-summary-lbl">Linked to content</span></div>';
    html += '<div class="wcp-sitemap-summary-divider"></div>';
    html += '<div class="wcp-sitemap-summary-stat"><span class="wcp-sitemap-summary-num wcp-sitemap-summary-num-pub">' + publishedLinks + '</span><span class="wcp-sitemap-summary-lbl">Published links</span></div>';
    html += '<div class="wcp-sitemap-summary-stat"><span class="wcp-sitemap-summary-num">' + exportedLinks + '</span><span class="wcp-sitemap-summary-lbl">Exported</span></div>';
    html += '<div class="wcp-sitemap-summary-stat"><span class="wcp-sitemap-summary-num">' + selectedLinks + '</span><span class="wcp-sitemap-summary-lbl">Selected</span></div>';
    html += '</div>';
    return html;
  }

  function renderSitemapListPane() {
    var sm = (S.data && S.data.sitemap) || { pages: [], groups: [], links: [] };
    var allPages = sm.pages || [];
    var filter = S.sitemapFilter || {};
    var pages = _filterSitemapPages(allPages, filter);

    var html = '<div class="wcp-list-pane wcp-sitemap-pane">';
    html += '<div class="wcp-list-pane-header">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-2)">';
    html += '<span style="font-size:var(--wcp-font-size-sm);font-weight:700">' + icon('diagram-project') + ' Sitemap <span class="wcp-text-muted">(' + allPages.length + ')</span></span>';
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="sitemap-open-import">' + icon('upload') + ' Import</button>';
    html += '</div>';
    // Toolbar action row — only shows buttons that are actually useful given
    // current sitemap state (no-title pages → Fetch titles; has pages → AI suggest priorities)
    var untitled = 0;
    for (var ui = 0; ui < allPages.length; ui++) { if (!allPages[ui].title && allPages[ui].status !== 'removed') untitled++; }
    // Show the Diff button only when at least one hub has a planned tree
    // (otherwise there's nothing to diff against).
    var anyPlanned = false;
    var plannedAll = (sm.planned || {});
    for (var phid in plannedAll) {
      if (plannedAll[phid] && plannedAll[phid].nodes && plannedAll[phid].nodes.length) { anyPlanned = true; break; }
    }
    if (untitled > 0 || allPages.length > 0 || anyPlanned) {
      html += '<div class="wcp-sitemap-ai-row">';
      if (untitled > 0) {
        html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="sitemap-fetch-titles" title="Try to fetch <title> from each URL that has no title. Many public sites will be blocked by CORS.">' + icon('download') + ' Fetch titles <span class="wcp-text-muted">(' + untitled + ')</span></button>';
      }
      if (allPages.length > 0) {
        html += '<button class="wcp-btn wcp-btn-ai wcp-btn-sm" data-action="sitemap-suggest-priorities" title="Let AI propose P1/P2/P3 for each page based on traffic/revenue signal">' + icon('sparkles') + ' Suggest priorities</button>';
      }
      if (anyPlanned) {
        html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="sitemap-show-diff" title="Compare planned vs live pages per hub">' + icon('arrows-left-right') + ' Diff vs planned</button>';
      }
      html += '</div>';
    }

    // Search + filter row
    html += '<div class="wcp-sitemap-toolbar">';
    html += '<input type="text" class="wcp-input wcp-input-sm" id="wcpSitemapSearch" placeholder="Search URL or title…" value="' + esc(filter.search || '') + '">';
    html += '<select class="wcp-select wcp-select-sm" id="wcpSitemapPriorityFilter">';
    html += '<option value=""' + (!filter.priority ? ' selected' : '') + '>All priorities</option>';
    html += '<option value="1"' + (filter.priority === '1' ? ' selected' : '') + '>P1 only</option>';
    html += '<option value="2"' + (filter.priority === '2' ? ' selected' : '') + '>P2 only</option>';
    html += '<option value="3"' + (filter.priority === '3' ? ' selected' : '') + '>P3 only</option>';
    html += '<option value="auto"' + (filter.priority === 'auto' ? ' selected' : '') + '>Unset only</option>';
    html += '</select>';
    html += '</div>';
    // Sort row — URL alpha by default, or by GSC metrics when imported
    html += '<div class="wcp-sitemap-toolbar">';
    html += '<select class="wcp-select wcp-select-sm" id="wcpSitemapSortBy">';
    var sortOpts = [
      ['url', 'Sort: URL (A–Z)'],
      ['clicks-desc', 'Sort: Clicks ↓'],
      ['impressions-desc', 'Sort: Impressions ↓'],
      ['position-asc', 'Sort: Avg position ↑'],
      ['ctr-desc', 'Sort: CTR ↓']
    ];
    for (var soi = 0; soi < sortOpts.length; soi++) {
      html += '<option value="' + sortOpts[soi][0] + '"' + ((filter.sortBy || 'url') === sortOpts[soi][0] ? ' selected' : '') + '>' + sortOpts[soi][1] + '</option>';
    }
    html += '</select>';
    html += '</div>';
    html += '<div class="wcp-sitemap-toolbar-row">';
    html += '<div class="wcp-sitemap-viewmode" role="tablist">';
    html += '<button class="wcp-sitemap-viewmode-btn' + (S.sitemapViewMode !== 'by_group' ? ' is-active' : '') + '" data-action="sitemap-set-viewmode" data-mode="flat">' + icon('list') + ' Flat</button>';
    html += '<button class="wcp-sitemap-viewmode-btn' + (S.sitemapViewMode === 'by_group' ? ' is-active' : '') + '" data-action="sitemap-set-viewmode" data-mode="by_group">' + icon('folder') + ' By group</button>';
    html += '</div>';
    html += '<div class="wcp-sitemap-toolbar-right">';
    html += '<button class="wcp-btn wcp-btn-ghost wcp-btn-sm" data-action="sitemap-manage-groups" title="Create / rename / delete groups">' + icon('sliders') + ' Groups</button>';
    html += '<label class="wcp-sitemap-chk"><input type="checkbox" id="wcpSitemapShowRemoved"' + (filter.showRemoved ? ' checked' : '') + '> <span>Removed</span></label>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // "No groups yet" workflow hint — teaches the user how to organise a
    // fresh sitemap without forcing fake auto-grouping. Only shown once the
    // user has pages but no groups created AND no pages assigned yet.
    var groupsCount = (sm.groups || []).length;
    var anyAssigned = false;
    for (var agi = 0; agi < allPages.length && !anyAssigned; agi++) {
      if (allPages[agi].group_id) anyAssigned = true;
    }
    if (allPages.length > 0 && groupsCount === 0 && !anyAssigned) {
      html += '<div class="wcp-sitemap-workflow-hint">';
      html += icon('circle-info') + ' <strong>' + allPages.length + ' pages imported.</strong> ';
      html += 'To organise them, click <a href="#" data-action="sitemap-manage-groups">Groups</a> to create categories (e.g. Blog, Product, Support), then open each page and assign it using the Group dropdown in the detail pane.';
      html += '</div>';
    }

    // Body: flat by default. Search / priority filter always forces flat
    // (grouping doesn't help when the result set is already narrow).
    html += '<div class="wcp-list-pane-items" id="wcpSitemapList">';
    if (allPages.length === 0) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)">';
      html += '<div class="wcp-empty-state-icon" style="font-size:var(--wcp-font-size-2xl)">' + icon('diagram-project') + '</div>';
      html += '<div class="wcp-empty-state-title" style="font-size:var(--wcp-font-size-sm)">No pages yet</div>';
      html += '<div class="wcp-empty-state-text" style="font-size:var(--wcp-font-size-xs)">Import your current site pages as CSV or paste an XML sitemap to get started.</div>';
      html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="sitemap-open-import" style="margin-top:var(--wcp-space-3)">' + icon('upload') + ' Import</button>';
      html += '</div>';
    } else {
      var isFiltered = !!(filter.search || filter.priority);
      if (!isFiltered && S.sitemapViewMode === 'by_group') {
        html += _renderSitemapByGroup(pages);
      } else {
        html += _renderSitemapFlatList(pages);
      }
    }
    html += '</div></div>';
    return html;
  }

  function _filterSitemapPages(pages, filter) {
    var out = [];
    var search = (filter.search || '').toLowerCase();
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      if (!filter.showRemoved && p.status === 'removed') continue;
      if (search) {
        var hay = ((p.url || '') + ' ' + (p.title || '')).toLowerCase();
        if (hay.indexOf(search) === -1) continue;
      }
      if (filter.priority) {
        var eff = effectivePriority(p);
        if (filter.priority === 'auto') {
          if (p.priority !== null && p.priority !== undefined) continue;
        } else {
          if (String(eff) !== String(filter.priority)) continue;
        }
      }
      out.push(p);
    }
    _sortSitemapPages(out, filter.sortBy || 'url');
    return out;
  }

  // In-place sort. Pages missing the relevant metric sink to the bottom so
  // "sort by clicks" doesn't put zero-click pages ahead of un-imported ones.
  function _sortSitemapPages(pages, sortBy) {
    var metric = null, dir = 'desc';
    if (sortBy === 'clicks-desc')        { metric = 'clicks';      dir = 'desc'; }
    else if (sortBy === 'impressions-desc') { metric = 'impressions'; dir = 'desc'; }
    else if (sortBy === 'ctr-desc')      { metric = 'ctr';         dir = 'desc'; }
    else if (sortBy === 'position-asc')  { metric = 'position';    dir = 'asc';  }
    if (!metric) {
      // URL alphabetical
      pages.sort(function(a, b) { return (a.url || '').localeCompare(b.url || ''); });
      return;
    }
    pages.sort(function(a, b) {
      var av = a[metric], bv = b[metric];
      var aHas = (typeof av === 'number' && av > 0);
      var bHas = (typeof bv === 'number' && bv > 0);
      if (!aHas && !bHas) return (a.url || '').localeCompare(b.url || '');
      if (!aHas) return 1;   // a missing → after b
      if (!bHas) return -1;
      if (dir === 'asc') return av - bv;
      return bv - av;
    });
  }

  function _renderSitemapFlatList(pages) {
    if (!pages.length) {
      return '<div class="wcp-empty-state" style="padding:var(--wcp-space-4)"><div class="wcp-text-sm wcp-text-muted">No pages match.</div></div>';
    }
    // Cap rendered rows to keep the DOM sane — 500 is plenty for triage
    var CAP = 500;
    var html = '';
    var n = Math.min(pages.length, CAP);
    for (var i = 0; i < n; i++) html += _renderSitemapRow(pages[i]);
    if (pages.length > CAP) {
      html += '<div class="wcp-text-xs wcp-text-muted" style="padding:var(--wcp-space-3);text-align:center">Showing ' + CAP + ' of ' + pages.length + ' matches. Narrow your search to see more.</div>';
    }
    return html;
  }

  function _renderSitemapRow(page) {
    var isActive = S.selectedSitemapPageId === page.id;
    var PR = SITEMAP_PRIORITIES;
    var titleText = page.title || _shortUrl(page.url);
    var urlText = _shortUrl(page.url);
    var isManual = (page.priority === 1 || page.priority === 2 || page.priority === 3);
    var eff = effectivePriority(page);
    var effCfg = PR[String(eff)] || PR['3'];

    var sm = (S.data && S.data.sitemap) || { groups: [] };
    var groups = (sm.groups || []).slice().sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var currentGroup = page.group_id ? S.sitemapGroupMap[page.group_id] : null;

    var html = '<div class="wcp-list-item wcp-sitemap-row' + (isActive ? ' wcp-list-item-active' : '') + '" data-action="sitemap-select-page" data-id="' + esc(page.id) + '">';

    // Row header: priority control + title + group chip
    html += '<div class="wcp-sitemap-row-header">';

    // PRIORITY — when manually set, show ONE pill (click to expand options);
    // when unset, show P1/P2/P3 buttons inline so the user can tag it with
    // one click. The "is-expanded" class is toggled by the pri-pill click
    // handler to flip between compact + expanded on a per-row basis.
    html += '<div class="wcp-sitemap-row-pri" data-page-id="' + esc(page.id) + '">';
    if (isManual) {
      // Compact: single pill for the current priority — click expands
      html += '<button class="wcp-sitemap-pri-pill wcp-sitemap-pri-current" data-action="sitemap-pri-toggle" data-id="' + esc(page.id) + '" style="background:' + effCfg.color + '" title="' + esc(effCfg.full) + ' — click to change">';
      html += effCfg.label + '</button>';
    } else {
      // Unset — render all three P-buttons inline. Current "auto" resolved
      // priority is shown as faintly highlighted so the user sees what the
      // system computed.
      html += _renderInlinePriOptions(page.id, null, eff);
    }
    html += '</div>';

    // TITLE — adds a primary-hub dot (Phase 4 hybrid binding) and a
    // "from plan" badge when the page was promoted from a planned node
    // (Phase 5). Both are subtle visual cues, not interactive.
    html += '<div class="wcp-sitemap-row-title">';
    var primaryHub = page.hub_id ? S.hubMap[page.hub_id] : null;
    if (primaryHub) html += '<span class="wcp-sitemap-row-hubdot" style="background:' + (primaryHub.color || '#6b7280') + '" title="Hub: ' + esc(primaryHub.name) + '"></span>';
    html += '<span class="wcp-sitemap-row-title-text">' + esc(titleText) + '</span>';
    if (page.source === 'planned') html += '<span class="wcp-badge wcp-badge-plan" title="Promoted from planned tree">' + icon('sparkles') + ' planned</span>';
    html += '</div>';

    // GROUP chip — click opens the inline group picker on that row
    html += '<div class="wcp-sitemap-row-group" data-page-id="' + esc(page.id) + '">';
    if (currentGroup) {
      html += '<button class="wcp-sitemap-group-chip" data-action="sitemap-group-toggle" data-id="' + esc(page.id) + '" title="Change group">';
      html += '<span class="wcp-sitemap-group-dot" style="background:' + esc(currentGroup.color || '#9aa0a6') + '"></span>';
      html += '<span class="wcp-sitemap-group-chip-name">' + esc(currentGroup.name) + '</span>';
      html += '</button>';
    } else {
      html += '<button class="wcp-sitemap-group-chip wcp-sitemap-group-chip-empty" data-action="sitemap-group-toggle" data-id="' + esc(page.id) + '" title="Assign to a group">';
      html += icon('plus') + ' Group';
      html += '</button>';
    }
    html += '</div>';

    if (page.status === 'removed') html += '<span class="wcp-badge wcp-badge-muted wcp-sitemap-row-removed">Removed</span>';

    html += '</div>';  // /row-header

    // URL (always visible, on its own line)
    html += '<div class="wcp-sitemap-row-url">' + esc(urlText) + '</div>';

    // Expanded priority picker (hidden unless .is-expanded on the row)
    html += '<div class="wcp-sitemap-row-pri-expanded" data-pri-for="' + esc(page.id) + '">';
    html += _renderInlinePriOptions(page.id, page.priority, eff);
    html += '</div>';

    // Expanded group picker (hidden unless .is-expanded on the row)
    html += '<div class="wcp-sitemap-row-group-expanded" data-group-for="' + esc(page.id) + '">';
    html += _renderInlineGroupOptions(page, groups);
    html += '</div>';

    html += '</div>';
    return html;
  }

  function _renderInlinePriOptions(pageId, current /*, effectivePri */) {
    var PR = SITEMAP_PRIORITIES;
    var isUnset = (current === null || current === undefined);
    var html = '<div class="wcp-sitemap-pri-opts">';
    // "Clear" button — visible only when something is set. Resets to unset
    // (baseline P3). No more auto-compute from hub/cluster structure.
    if (!isUnset) {
      html += '<button class="wcp-sitemap-pri-btn wcp-sitemap-pri-btn-auto" data-action="sitemap-row-set-priority" data-id="' + esc(pageId) + '" data-priority="auto" title="Clear priority (resets to baseline P3)">Clear</button>';
    }
    for (var pk in PR) {
      var isActive = String(current) === String(pk);
      var cls = 'wcp-sitemap-pri-btn';
      if (isActive) cls += ' is-active';
      html += '<button class="' + cls + '" data-action="sitemap-row-set-priority" data-id="' + esc(pageId) + '" data-priority="' + pk + '" title="' + esc(PR[pk].full + (PR[pk].desc ? ' — ' + PR[pk].desc : '')) + '" style="--pri-color:' + PR[pk].color + '">';
      html += '<span class="wcp-sitemap-pri-pill" style="background:' + PR[pk].color + '">' + PR[pk].label + '</span>';
      html += '</button>';
    }
    html += '</div>';
    return html;
  }

  function _renderInlineGroupOptions(page, groups) {
    // Compact searchable group picker — list of groups (with color dot) +
    // an "Ungrouped" option at the top + a live filter input.
    var html = '<div class="wcp-sitemap-group-picker">';
    html += '<input type="text" class="wcp-input wcp-input-sm wcp-sitemap-group-search" data-action="sitemap-group-filter" data-id="' + esc(page.id) + '" placeholder="Filter groups…">';
    html += '<div class="wcp-sitemap-group-opts" data-group-opts-for="' + esc(page.id) + '">';
    html += '<button class="wcp-sitemap-group-opt' + (!page.group_id ? ' is-active' : '') + '" data-action="sitemap-row-set-group-btn" data-id="' + esc(page.id) + '" data-group-id=""><span class="wcp-sitemap-group-dot" style="background:#cbd5e1"></span>Ungrouped</button>';
    for (var gi = 0; gi < groups.length; gi++) {
      var g = groups[gi];
      html += '<button class="wcp-sitemap-group-opt' + (page.group_id === g.id ? ' is-active' : '') + '" data-action="sitemap-row-set-group-btn" data-id="' + esc(page.id) + '" data-group-id="' + esc(g.id) + '" data-name="' + esc((g.name || '').toLowerCase()) + '">';
      html += '<span class="wcp-sitemap-group-dot" style="background:' + esc(g.color || '#9aa0a6') + '"></span>';
      html += esc(g.name);
      html += '</button>';
    }
    if (!groups.length) {
      html += '<div class="wcp-sitemap-group-empty">' + icon('circle-info') + ' No groups yet. <a href="#" data-action="sitemap-manage-groups">Create one</a>.</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  // Manual groups only — pages are bucketed by `group_id` set explicitly by
  // the user (via the detail pane's Group dropdown or bulk actions). Pages
  // with no group_id fall into "Ungrouped". No auto-grouping by URL path —
  // that was removed because path structure rarely matches the user's mental
  // model and creates noisy, arbitrary nesting.
  function _renderSitemapByGroup(pages) {
    var sm = (S.data && S.data.sitemap) || { pages: [], groups: [], links: [] };
    var groups = sm.groups || [];
    var buckets = {};   // group_id -> [pages]
    var ungrouped = [];
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      if (p.group_id && S.sitemapGroupMap[p.group_id]) {
        (buckets[p.group_id] = buckets[p.group_id] || []).push(p);
      } else {
        ungrouped.push(p);
      }
    }

    var html = '';

    // If no groups have been created yet, show a friendly hint at the top
    if (!groups.length) {
      html += '<div class="wcp-sitemap-noGroups-hint">';
      html += icon('circle-info') + ' No groups yet. Click <strong>Groups</strong> above to create groups like "Blog", "Product", "Support" — then assign pages from each page\'s detail pane.';
      html += '</div>';
    }

    // Rendered order: user-defined groups first (alphabetical), then Ungrouped.
    // Pages inside each bucket respect the active sort (URL alpha or metric).
    var sortedGroups = groups.slice().sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var activeSort = (S.sitemapFilter && S.sitemapFilter.sortBy) || 'url';
    for (var g = 0; g < sortedGroups.length; g++) {
      var grp = sortedGroups[g];
      var bucket = (buckets[grp.id] || []).slice();
      _sortSitemapPages(bucket, activeSort);
      html += _renderSitemapGroupFolder(grp, bucket);
    }
    // Ungrouped bucket — always visible (even when empty, to make the concept clear)
    html += _renderSitemapUngroupedFolder(ungrouped);

    return html;
  }

  function _renderSitemapGroupFolder(grp, pages) {
    var isExpanded = S.sitemapTreeExpanded[grp.id] !== false;  // default open for manual groups
    var html = '<div class="wcp-sitemap-folder" data-group-id="' + esc(grp.id) + '">';
    html += '<div class="wcp-sitemap-folder-row" data-action="sitemap-toggle-folder" data-path="' + esc(grp.id) + '">';
    html += '<span class="wcp-sitemap-folder-chev">' + icon(isExpanded ? 'chevron-down' : 'chevron-right') + '</span>';
    html += '<span class="wcp-sitemap-folder-name"><span class="wcp-sitemap-folder-dot" style="background:' + esc(grp.color || '#6b7280') + '"></span>' + esc(grp.name) + '</span>';
    html += '<span class="wcp-sitemap-folder-count">' + pages.length + '</span>';
    html += '</div>';
    if (isExpanded && pages.length) {
      html += '<div class="wcp-sitemap-folder-body">';
      var CAP = 500;
      var limit = Math.min(pages.length, CAP);
      for (var bi = 0; bi < limit; bi++) html += _renderSitemapRow(pages[bi]);
      if (pages.length > CAP) {
        html += '<div class="wcp-text-xs wcp-text-muted" style="padding:6px 14px">Showing ' + CAP + ' of ' + pages.length + '. Use search to find more.</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function _renderSitemapUngroupedFolder(pages) {
    if (!pages.length) return '';
    var isExpanded = S.sitemapTreeExpanded['__ungrouped__'] !== false;
    var html = '<div class="wcp-sitemap-folder wcp-sitemap-folder-ungrouped">';
    html += '<div class="wcp-sitemap-folder-row" data-action="sitemap-toggle-folder" data-path="__ungrouped__">';
    html += '<span class="wcp-sitemap-folder-chev">' + icon(isExpanded ? 'chevron-down' : 'chevron-right') + '</span>';
    html += '<span class="wcp-sitemap-folder-name"><span class="wcp-sitemap-folder-dot" style="background:#cbd5e1"></span>Ungrouped</span>';
    html += '<span class="wcp-sitemap-folder-count">' + pages.length + '</span>';
    html += '</div>';
    if (isExpanded) {
      html += '<div class="wcp-sitemap-folder-body">';
      var CAP = 500;
      var limit = Math.min(pages.length, CAP);
      for (var bi = 0; bi < limit; bi++) html += _renderSitemapRow(pages[bi]);
      if (pages.length > CAP) {
        html += '<div class="wcp-text-xs wcp-text-muted" style="padding:6px 14px">Showing ' + CAP + ' of ' + pages.length + '. Use search to find more.</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function _shortUrl(url) {
    if (!url) return '';
    var m = String(url).match(/^https?:\/\/[^\/]+(\/.*)?$/i);
    var path = m && m[1] ? m[1] : url;
    return path || '/';
  }

  function renderSitemapDetailPane() {
    var page = S.selectedSitemapPageId ? S.sitemapPageMap[S.selectedSitemapPageId] : null;
    if (!page) {
      return '<div class="wcp-empty-state" style="height:100%;justify-content:center">' +
        '<div class="wcp-empty-state-icon">' + icon('diagram-project') + '</div>' +
        '<div class="wcp-empty-state-title">Select a page to view details</div>' +
        '<div class="wcp-empty-state-text">Pick a page from the tree to see its priority, linked content, and inbound/outbound link counts.</div></div>';
    }

    var eff = effectivePriority(page);
    var PR = SITEMAP_PRIORITIES;
    var linkedContent = page.content_id ? S.contentMap[page.content_id] : null;
    var inb = S.sitemapLinksByTo[page.id] || { selected: 0, exported: 0, published: 0 };

    var html = '<div class="wcp-detail-body wcp-sitemap-detail">';

    // Edit affordance banner — makes it obvious the right pane IS the editor.
    // Changes save on blur (text) / change (selects).
    html += '<div class="wcp-sitemap-edit-banner">' + icon('pen') + ' <strong>Edit page</strong> — changes save automatically on blur</div>';

    // Header
    html += '<div class="wcp-sitemap-detail-header">';
    html += '<div class="wcp-sitemap-detail-title-row">';
    html += '<input type="text" class="wcp-input wcp-sitemap-title-input" data-action="sitemap-save-title" data-id="' + esc(page.id) + '" value="' + esc(page.title || '') + '" placeholder="Page title…">';
    html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="sitemap-delete-page" data-id="' + esc(page.id) + '" title="Delete page">' + icon('trash') + '</button>';
    html += '</div>';
    html += '<div class="wcp-sitemap-detail-url">';
    html += '<span class="wcp-text-xs wcp-text-muted">URL</span>';
    html += '<input type="text" class="wcp-input wcp-input-sm" data-action="sitemap-save-url" data-id="' + esc(page.id) + '" value="' + esc(page.url || '') + '">';
    html += '<a href="' + esc(page.url) + '" target="_blank" rel="noopener" class="wcp-btn-icon" title="Open in new tab">' + icon('arrow-up-right-from-square') + '</a>';
    html += '</div>';
    html += '</div>';

    // Group assignment — user-defined buckets the page belongs to
    var sm = (S.data && S.data.sitemap) || { groups: [] };
    var groups = (sm.groups || []).slice().sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
    html += '<div class="wcp-sitemap-detail-block">';
    html += '<div class="wcp-section-label">' + icon('folder') + ' Group</div>';
    html += '<div class="wcp-sitemap-group-assign">';
    html += '<select class="wcp-select wcp-select-sm" data-action="sitemap-set-group" data-id="' + esc(page.id) + '">';
    html += '<option value=""' + (!page.group_id ? ' selected' : '') + '>— Ungrouped —</option>';
    for (var gi = 0; gi < groups.length; gi++) {
      var g = groups[gi];
      html += '<option value="' + esc(g.id) + '"' + (page.group_id === g.id ? ' selected' : '') + '>' + esc(g.name) + '</option>';
    }
    html += '</select>';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="sitemap-manage-groups" title="Create or edit groups">' + icon('sliders') + ' Manage</button>';
    html += '</div></div>';

    // Hub binding (Phase 4.5) — primary hub + secondary tag hubs/clusters.
    // Hybrid model: the primary hub drives tree coloring & default ownership;
    // tag arrays let one page belong to multiple hubs (cross-cutting topics).
    var allHubs = (S.data.hubs || []).slice().sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
    html += '<div class="wcp-sitemap-detail-block">';
    html += '<div class="wcp-section-label">' + icon('sitemap') + ' Hub Binding</div>';
    html += '<div class="wcp-form-group" style="margin-bottom:var(--wcp-space-2)">';
    html += '<label class="wcp-text-xs wcp-text-muted">Primary hub</label>';
    html += '<select class="wcp-select wcp-select-sm" data-action="sitemap-page-set-hub" data-id="' + esc(page.id) + '">';
    html += '<option value=""' + (!page.hub_id ? ' selected' : '') + '>— Unassigned —</option>';
    for (var hbi = 0; hbi < allHubs.length; hbi++) {
      var hb = allHubs[hbi];
      html += '<option value="' + esc(hb.id) + '"' + (page.hub_id === hb.id ? ' selected' : '') + '>' + esc(hb.name) + '</option>';
    }
    html += '</select></div>';

    // Primary cluster (filtered to the primary hub's clusters; disabled
    // when no primary hub is set since clusters don't exist outside a hub).
    var primaryClusters = page.hub_id ? getHubClusters(page.hub_id) : [];
    html += '<div class="wcp-form-group" style="margin-bottom:var(--wcp-space-2)">';
    html += '<label class="wcp-text-xs wcp-text-muted">Primary cluster</label>';
    html += '<select class="wcp-select wcp-select-sm" data-action="sitemap-page-set-cluster" data-id="' + esc(page.id) + '"' + (!page.hub_id ? ' disabled' : '') + '>';
    html += '<option value=""' + (!page.cluster_id ? ' selected' : '') + '>— None —</option>';
    for (var pci = 0; pci < primaryClusters.length; pci++) {
      var pc = primaryClusters[pci];
      html += '<option value="' + esc(pc.id) + '"' + (page.cluster_id === pc.id ? ' selected' : '') + '>' + esc(pc.name) + '</option>';
    }
    html += '</select>';
    if (!page.hub_id) html += '<div class="wcp-form-hint">Pick a primary hub first.</div>';
    html += '</div>';

    // Secondary hub tags — multi-select for cross-cutting pages. Excludes
    // the primary hub (which is implicit).
    var tagHubIds = Array.isArray(page.tag_hub_ids) ? page.tag_hub_ids : [];
    html += '<div class="wcp-form-group">';
    html += '<label class="wcp-text-xs wcp-text-muted">Secondary hubs</label>';
    html += '<div class="wcp-sitemap-hubtags">';
    var secondaryRendered = 0;
    for (var hsi = 0; hsi < allHubs.length; hsi++) {
      var sh = allHubs[hsi];
      if (sh.id === page.hub_id) continue; // primary is implicit
      var on = tagHubIds.indexOf(sh.id) > -1;
      html += '<label class="wcp-sitemap-hubtag-chk' + (on ? ' is-on' : '') + '" style="--hub-color:' + (sh.color || '#6b7280') + '">';
      html += '<input type="checkbox" data-action="sitemap-page-toggle-hubtag" data-id="' + esc(page.id) + '" data-hub-id="' + esc(sh.id) + '"' + (on ? ' checked' : '') + '>';
      html += '<span>' + esc(sh.name) + '</span>';
      html += '</label>';
      secondaryRendered++;
    }
    if (!secondaryRendered) html += '<span class="wcp-text-xs wcp-text-muted">No other hubs to tag.</span>';
    html += '</div></div>';
    html += '</div>';

    // Priority picker — manual traffic/revenue/link-building judgement
    html += '<div class="wcp-sitemap-detail-block">';
    html += '<div class="wcp-section-label">' + icon('flag') + ' Priority</div>';
    html += '<div class="wcp-sitemap-pri-picker">';
    // "Clear" (unset → defaults to P3 baseline) when something is set
    var isAuto = (page.priority === null || page.priority === undefined);
    if (!isAuto) {
      html += '<button class="wcp-sitemap-pri-opt" data-action="sitemap-set-priority" data-id="' + esc(page.id) + '" data-priority="auto">';
      html += icon('rotate-left') + ' Clear';
      html += '</button>';
    }
    for (var pk in PR) {
      var opt = PR[pk];
      var isActive = (String(page.priority) === String(pk));
      html += '<button class="wcp-sitemap-pri-opt' + (isActive ? ' is-active' : '') + '" style="--pri-color:' + opt.color + '" data-action="sitemap-set-priority" data-id="' + esc(page.id) + '" data-priority="' + pk + '" title="' + esc(opt.desc || '') + '">';
      html += '<span class="wcp-sitemap-pri-pill" style="background:' + opt.color + '">' + opt.label + '</span> ' + esc(opt.full.replace(/^P\d\s—\s/, ''));
      html += '</button>';
    }
    html += '</div>';
    html += '<div class="wcp-text-xs wcp-text-muted" style="margin-top:var(--wcp-space-1)">Set priority based on how strategic this page is for traffic, revenue, and link-building. Guides internal-link planning and (later) off-page strategy.</div>';
    html += '</div>';

    // GSC / search metrics — only rendered when any metric is set. Numbers
    // are raw (clicks/impressions as integers; CTR as percent e.g. 4.2;
    // position as average e.g. 12.4). metrics_updated_at tells the user
    // how fresh the data is.
    var hasMetrics = (page.clicks || page.impressions || page.ctr || page.position || page.metrics_updated_at);
    if (hasMetrics) {
      html += '<div class="wcp-sitemap-detail-block">';
      html += '<div class="wcp-section-label">' + icon('magnifying-glass-chart') + ' Search metrics';
      if (page.metrics_updated_at) html += ' <span class="wcp-text-xs wcp-text-muted" style="font-weight:500;text-transform:none;letter-spacing:normal"> · updated ' + formatRelativeTime(page.metrics_updated_at) + '</span>';
      html += '</div>';
      html += '<div class="wcp-sitemap-metrics">';
      html += '<div class="wcp-sitemap-metric"><span class="wcp-sitemap-metric-num">' + formatNumber(page.clicks || 0) + '</span><span class="wcp-sitemap-metric-lbl">Clicks</span></div>';
      html += '<div class="wcp-sitemap-metric"><span class="wcp-sitemap-metric-num">' + formatNumber(page.impressions || 0) + '</span><span class="wcp-sitemap-metric-lbl">Impressions</span></div>';
      html += '<div class="wcp-sitemap-metric"><span class="wcp-sitemap-metric-num">' + (page.ctr ? page.ctr.toFixed(2) + '%' : '—') + '</span><span class="wcp-sitemap-metric-lbl">CTR</span></div>';
      html += '<div class="wcp-sitemap-metric"><span class="wcp-sitemap-metric-num">' + (page.position ? page.position.toFixed(1) : '—') + '</span><span class="wcp-sitemap-metric-lbl">Avg position</span></div>';
      html += '</div></div>';
    }

    // Notes — freeform page-level context (any extra info the user wants to
    // keep for this page, e.g. internal owner, last content audit date, etc.)
    html += '<div class="wcp-sitemap-detail-block">';
    html += '<div class="wcp-section-label">' + icon('note-sticky') + ' Notes</div>';
    html += '<textarea class="wcp-textarea wcp-input-sm" data-action="sitemap-save-notes" data-id="' + esc(page.id) + '" rows="2" placeholder="Anything worth remembering about this page…">' + esc(page.notes || '') + '</textarea>';
    html += '</div>';

    // Link counts — plain factual, no thresholds
    html += '<div class="wcp-sitemap-detail-block">';
    html += '<div class="wcp-section-label">' + icon('link') + ' Inbound Internal Links</div>';
    html += '<div class="wcp-sitemap-link-counts">';
    html += '<div class="wcp-sitemap-link-count"><span class="wcp-sitemap-link-num">' + (inb.selected || 0) + '</span><span class="wcp-sitemap-link-lbl">Selected</span></div>';
    html += '<div class="wcp-sitemap-link-count"><span class="wcp-sitemap-link-num">' + (inb.exported || 0) + '</span><span class="wcp-sitemap-link-lbl">Exported</span></div>';
    html += '<div class="wcp-sitemap-link-count wcp-sitemap-link-count-pub"><span class="wcp-sitemap-link-num">' + (inb.published || 0) + '</span><span class="wcp-sitemap-link-lbl">Published</span></div>';
    html += '</div>';
    html += '<div class="wcp-text-xs wcp-text-muted" style="margin-top:var(--wcp-space-1)">Published links are the canonical count — selections and exports show what\'s in flight.</div>';
    html += '</div>';

    // Linked planner content
    html += '<div class="wcp-sitemap-detail-block">';
    html += '<div class="wcp-section-label">' + icon('file-lines') + ' Planner Content</div>';
    if (linkedContent) {
      html += '<div class="wcp-sitemap-linked-content">';
      html += '<div class="wcp-sitemap-linked-title">' + esc(linkedContent.title || '(untitled)') + '</div>';
      html += '<div class="wcp-sitemap-linked-meta">';
      html += statusBadge(linkedContent.status);
      var linkedHub = linkedContent.hub_id ? S.hubMap[linkedContent.hub_id] : null;
      if (linkedHub) html += '<span class="wcp-badge" style="background:' + (linkedHub.color || '#2563eb') + '15;color:' + (linkedHub.color || '#2563eb') + '">' + esc(linkedHub.name) + '</span>';
      html += '</div>';
      html += '<button class="wcp-btn wcp-btn-sm" data-action="select-content" data-id="' + esc(linkedContent.id) + '">' + icon('arrow-right') + ' Open content</button>';
      html += '</div>';
    } else {
      html += '<div class="wcp-text-sm wcp-text-muted">Not linked to any planner content. When you publish content with URL "' + esc(_shortUrl(page.url)) + '", it will link automatically.</div>';
    }
    html += '</div>';

    // Metadata footer
    html += '<div class="wcp-sitemap-detail-block wcp-sitemap-detail-footer">';
    html += '<div class="wcp-text-xs wcp-text-muted">';
    html += 'Source: <strong>' + esc(page.source) + '</strong> · ';
    html += 'Imported: ' + formatRelativeTime(page.imported_at) + ' · ';
    html += 'Updated: ' + formatRelativeTime(page.updated_at);
    if (page.status === 'removed') html += ' · <strong style="color:var(--wcp-error)">Removed</strong>';
    html += '</div></div>';

    html += '</div>';
    return html;
  }
