  // ============================================================
  // SECTION 4: CONTENT DETAIL VIEW OVERRIDE
  // ============================================================
  //
  // 2026-04 redesign — two-row header:
  //   Row 1 : full-width title input (single source of truth)
  //   Row 2 : meta strip  [Type · Hub · Cluster · Pillar] ——— [Priority · Status+▶ · ⋮]
  //
  // Each chip in the meta strip is an outer <div.wcp-cd-chip> that owns the
  // visual chrome (border, bg, padding, hover/focus). Inside it: a small
  // "ROLE" label on top and a `.wcp-cd-chip-value` region on the bottom
  // holding either a WcpSelect (for Type / Hub / Cluster — styled transparent
  // when inside a chip) or static content (for Pillar / Priority). Keeping
  // the chrome on a single element eliminates the double-padding / competing
  // styles that broke earlier layouts.

  function _cdChip(role, valueHtml, modClasses, clickAttrs) {
    var cls = 'wcp-cd-chip' + (modClasses ? ' ' + modClasses : '');
    var attrs = clickAttrs || '';
    return '<div class="' + cls + '"' + attrs + '>' +
      '<span class="wcp-cd-chip-role">' + esc(role) + '</span>' +
      '<div class="wcp-cd-chip-value">' + valueHtml + '</div>' +
      '</div>';
  }

  function renderContentDetailView() {
    if (!S.selectedContentId) {
      return '<div class="wcp-empty-state" style="height:100%;justify-content:center">' +
        '<div class="wcp-empty-state-icon">' + icon('file-lines') + '</div>' +
        '<div class="wcp-empty-state-title">Select content to view details</div>' +
        '<div class="wcp-empty-state-text">Choose a content piece from the list, or create a new one to start planning.</div></div>';
    }
    var c = S.contentMap[S.selectedContentId];
    if (!c) return '<div class="wcp-empty-state"><p>Content not found.</p></div>';

    // Guard legacy step keys (pre-Phase-5 migrations may have left them in S).
    var STEPS = Constants.PIPELINE_STEPS;
    var validStepKeys = STEPS.map(function(s) { return s.key; });
    if (!S.currentStep || validStepKeys.indexOf(S.currentStep) === -1) S.currentStep = 'info';
    var currentStep = S.currentStep;

    var ct   = S.contentTypeMap[c.content_type_id];
    var hub  = S.hubMap[c.hub_id];
    var cl   = S.clusterMap[c.cluster_id];
    var bi   = c.basic_info || {};
    var PL   = Constants.PRIORITY_LEVELS;
    var CS   = Constants.CONTENT_STATUSES;
    var isClosed = Constants.CLOSED_STATUSES.indexOf(c.status) !== -1;

    // Wrap everything in .wcp-detail-body — this is the scroll container
    // (parent .wcp-detail-pane has overflow:hidden). Without this wrapper
    // the sticky header has no scroll ancestor and content is clipped
    // instead of scrolling.
    var html = '<div class="wcp-detail-body wcp-detail-body-v2">';
    html += '<div class="wcp-cd-header' + (isClosed ? ' wcp-cd-header-closed' : '') + '">';

    // ── Intent banner (only if intent/funnel/audience set) ──
    var intentMap = { 'informational': 'var(--wcp-hub)', 'commercial': 'var(--wcp-accent)', 'transactional': 'var(--wcp-success)', 'navigational': 'var(--wcp-warning)' };
    var intentClr = intentMap[bi.search_intent] || 'var(--wcp-text-muted)';
    if (bi.search_intent || bi.funnel_stage || bi.audience) {
      html += '<div class="wcp-intent-banner" style="border-left-color:' + intentClr + '">';
      html += '<span class="wcp-intent-banner-icon" style="color:' + intentClr + '">' + icon('compass') + '</span>';
      html += '<span class="wcp-intent-banner-text">Targeting ';
      if (bi.search_intent) html += '<strong style="color:' + intentClr + '">' + esc(bi.search_intent) + '</strong>';
      else html += '<span class="wcp-text-muted">[no intent set]</span>';
      html += ' users';
      if (bi.funnel_stage) html += ' at <strong>' + esc(bi.funnel_stage.toUpperCase()) + '</strong> stage';
      if (bi.audience) html += ' — ' + esc(truncate(bi.audience, 60));
      html += '</span></div>';
    }

    // ── Row 1: full-width title ──
    html += '<div class="wcp-cd-title-row">';
    html += '<input type="text" class="wcp-cd-title wcp-info-preview-field wcp-step-field" data-path="title" value="' + esc(c.title || '') + '" placeholder="Untitled content…" autocomplete="off" spellcheck="true">';
    html += '</div>';

    // ── Row 2: meta strip ──
    html += '<div class="wcp-cd-meta-strip">';

    // Meta left: Type · Hub · Cluster · Pillar (all as role-labeled chips)
    html += '<div class="wcp-cd-meta-left">';

    // Type chip — WcpSelect inside a chip wrapper
    var types = S.data.content_types || [];
    var typeItems = [];
    for (var ti = 0; ti < types.length; ti++) {
      var t = types[ti];
      typeItems.push({ id: t.id, label: t.name, icon: t.icon || 'file', color: t.color || '#80868b', description: t.description || '' });
    }
    var typeSelect = window._wcpSelect ? window._wcpSelect.render({
      name: 'content_type_id',
      dataPath: 'content_type_id',
      value: c.content_type_id || '',
      placeholder: 'Select type…',
      emptyLabel: '— No type —',
      items: typeItems,
      extraClass: 'wcp-cd-chip-select'
    }) : '';
    html += _cdChip('Type', typeSelect, 'wcp-cd-chip-type');

    // Hub chip
    var hubs = S.data.hubs || [];
    var hubItems = [];
    for (var hi = 0; hi < hubs.length; hi++) {
      hubItems.push({ id: hubs[hi].id, label: hubs[hi].name, color: hubs[hi].color || '#2563eb', description: hubs[hi].description || '' });
    }
    var hubSelect = window._wcpSelect ? window._wcpSelect.render({
      name: 'hub_id',
      dataPath: 'hub_id',
      value: c.hub_id || '',
      placeholder: 'Assign hub…',
      emptyLabel: '— No hub —',
      items: hubItems,
      extraClass: 'wcp-cd-chip-select'
    }) : '';
    html += _cdChip('Hub', hubSelect, 'wcp-cd-chip-hub');

    // Cluster chip (select disabled until hub is set)
    var clusterItems = [];
    if (c.hub_id) {
      var clusters = getHubClusters(c.hub_id);
      for (var ci = 0; ci < clusters.length; ci++) {
        clusterItems.push({ id: clusters[ci].id, label: clusters[ci].name, icon: 'bookmark', description: clusters[ci].description || '' });
      }
    }
    var clusterSelect = window._wcpSelect ? window._wcpSelect.render({
      name: 'cluster_id',
      dataPath: 'cluster_id',
      value: c.cluster_id || '',
      placeholder: c.hub_id ? 'Assign cluster…' : 'Select a hub first',
      emptyLabel: '— No cluster —',
      items: clusterItems,
      disabled: !c.hub_id,
      extraClass: 'wcp-cd-chip-select'
    }) : '';
    html += _cdChip('Cluster', clusterSelect, 'wcp-cd-chip-cluster' + (!c.hub_id ? ' wcp-cd-chip-disabled' : ''));

    // Pillar chip — same chip chrome as the others; three states:
    //   1) this content IS the hub's pillar → static star badge
    //   2) hub set but pillar is empty/other → "Mark as pillar" action
    //   3) no hub → not rendered
    if (c.hub_id && hub) {
      var isPillar = (hub.pillar_content_id === c.id);
      var pillarValue = '<span class="wcp-cd-pillar-face' + (isPillar ? ' wcp-cd-pillar-face-active' : '') + '">' +
        icon('star') + '<span class="wcp-cd-pillar-label">' +
        (isPillar ? ('Pillar of ' + esc(truncate(hub.name, 18))) : 'Mark as pillar') +
        '</span></span>';
      var pillarModClass = 'wcp-cd-chip-pillar ' + (isPillar ? 'wcp-cd-chip-pillar-active' : 'wcp-cd-chip-pillar-action');
      var pillarAttrs = isPillar
        ? ' title="This is the pillar content for ' + esc(hub.name) + '"'
        : ' role="button" tabindex="0" data-action="set-as-hub-pillar" data-id="' + esc(c.id) + '" title="Make this the cornerstone piece for ' + esc(hub.name) + '"';
      html += _cdChip('Pillar', pillarValue, pillarModClass, pillarAttrs);
    }

    html += '</div>'; // /meta-left

    // Meta right: Priority · Status+▶ · ⋮
    html += '<div class="wcp-cd-meta-right">';

    // Priority — WcpSelect with label/icon/color per level. The hidden native
    // <select> carries data-path="priority" so the existing .wcp-step-field
    // change handler (src/part2a/15-events.js) saves the value — no separate
    // click handler needed.
    var priorityItems = [];
    for (var pk in PL) {
      priorityItems.push({ id: pk, label: PL[pk].label, icon: PL[pk].icon, color: PL[pk].color });
    }
    var prioritySelect = window._wcpSelect ? window._wcpSelect.render({
      name: 'priority',
      dataPath: 'priority',
      value: c.priority || 'medium',
      placeholder: 'Priority…',
      items: priorityItems,
      extraClass: 'wcp-cd-chip-select'
    }) : '';
    html += _cdChip('Priority', prioritySelect, 'wcp-cd-chip-priority');

    // Status split-button — a chip wrapper with a split-button inside so it
    // visually matches the other meta chips (role "STATUS" on top, controls
    // on the bottom).
    //   Structure:
    //     .wcp-cd-chip.wcp-cd-chip-status
    //       .wcp-cd-chip-role "Status"
    //       .wcp-cd-chip-value
    //         .wcp-cd-status-split
    //           .wcp-cd-status-face (contains dot + label + caret + invisible <select>)
    //           button.wcp-cd-status-advance (▶)
    var stCfg = CS[c.status] || { label: c.status, color: '#80868b', icon: 'circle' };
    var nextKey = (typeof nextQuickAdvanceStatus === 'function') ? nextQuickAdvanceStatus(c.status) : null;
    var nextLabel = nextKey ? (CS[nextKey] || {}).label : '';
    var advanceDisabled = !nextKey;

    var statusValue = '<div class="wcp-cd-status-split" style="--status-color:' + stCfg.color + '">';
    statusValue += '<div class="wcp-cd-status-face" title="' + esc(stCfg.label) + ' — click to change">';
    statusValue += '<span class="wcp-cd-status-dot"></span>';
    statusValue += '<span class="wcp-cd-status-label">' + esc(stCfg.label) + '</span>';
    statusValue += icon('caret-down', 'wcp-cd-status-caret');
    statusValue += '<select class="wcp-cd-status-select" data-action="change-content-status" data-id="' + esc(c.id) + '" aria-label="Change status">';
    for (var sk in CS) {
      statusValue += '<option value="' + sk + '"' + (c.status === sk ? ' selected' : '') + '>' + CS[sk].label + '</option>';
    }
    statusValue += '</select>';
    statusValue += '</div>';
    statusValue += '<button type="button" class="wcp-cd-status-advance"' + (advanceDisabled ? ' disabled' : '') + ' data-action="advance-content-status" data-id="' + esc(c.id) + '" title="' + (nextLabel ? 'Advance to ' + esc(nextLabel) : 'Already at the final stage') + '">';
    statusValue += icon('play');
    statusValue += '</button>';
    statusValue += '</div>';
    html += _cdChip('Status', statusValue, 'wcp-cd-chip-status');

    // Overflow menu (⋮) — contextual items based on current status.
    html += '<div class="wcp-cd-overflow-wrap">';
    html += '<button class="wcp-btn-icon wcp-cd-overflow-btn" data-action="toggle-cd-overflow" title="More actions">' + icon('ellipsis-vertical') + '</button>';
    html += '<div class="wcp-cd-overflow-menu" hidden>';
    html += '<button class="wcp-cd-overflow-item" data-action="undo" title="Undo (Ctrl+Z)">' + icon('rotate-left') + ' Undo</button>';
    html += '<button class="wcp-cd-overflow-item" data-action="redo" title="Redo (Ctrl+Y)">' + icon('rotate-right') + ' Redo</button>';
    html += '<button class="wcp-cd-overflow-item" data-action="duplicate-content" data-id="' + esc(c.id) + '">' + icon('copy') + ' Duplicate</button>';
    // Reject — only for pre-closed statuses
    if (!isClosed && c.status !== 'published') {
      html += '<button class="wcp-cd-overflow-item" data-action="reject-content" data-id="' + esc(c.id) + '">' + icon('circle-xmark') + ' Reject…</button>';
    }
    // Archive vs Restore
    if (isClosed) {
      html += '<button class="wcp-cd-overflow-item" data-action="restore-content" data-id="' + esc(c.id) + '">' + icon('rotate-left') + ' Restore</button>';
    } else {
      html += '<button class="wcp-cd-overflow-item" data-action="archive-content" data-id="' + esc(c.id) + '">' + icon('box-archive') + ' Archive</button>';
    }
    html += '<div class="wcp-cd-overflow-divider"></div>';
    html += '<button class="wcp-cd-overflow-item wcp-cd-overflow-danger" data-action="delete-content-permanent" data-id="' + esc(c.id) + '">' + icon('trash') + ' Delete permanently</button>';
    html += '</div></div>';

    html += '</div>'; // /meta-right
    html += '</div>'; // /meta-strip

    // Rejected reason note (if any) — small banner under the meta strip
    if (c.status === 'rejected' && c.rejected_reason) {
      html += '<div class="wcp-cd-rejection-note">' + icon('circle-xmark') + ' <strong>Rejected:</strong> ' + esc(c.rejected_reason) + '</div>';
    }

    // Published URL — manual field captured before advancing to published.
    // Once set + matching a sitemap_page, shows a "Linked" chip and an "Open"
    // action. Only visible once content reaches ready_to_publish or published
    // to keep the header compact for early-stage work.
    var showPubUrl = (c.status === 'ready_to_publish' || c.status === 'published' || c.status === 'exported' || c.published_url);
    if (showPubUrl) {
      var pubUrl = c.published_url || '';
      var linkedPage = (pubUrl && window.canonicalizeUrl) ? null : null;
      // Use the in-scope function (not window) — it's defined in part1/07-utilities/11-url.js
      var canon = (typeof canonicalizeUrl === 'function' && pubUrl) ? canonicalizeUrl(pubUrl) : '';
      var matchedPage = (canon && S.sitemapPageByUrl) ? S.sitemapPageByUrl[canon] : null;
      html += '<div class="wcp-cd-pub-url' + (c.status === 'published' ? ' wcp-cd-pub-url-live' : '') + '">';
      html += '<span class="wcp-cd-pub-url-label">' + icon('globe') + ' Live URL</span>';
      html += '<input type="url" class="wcp-input wcp-input-sm wcp-cd-pub-url-input" data-action="save-published-url" data-id="' + esc(c.id) + '" value="' + esc(pubUrl) + '" placeholder="https://yoursite.com/…">';
      if (pubUrl) {
        html += '<a href="' + esc(pubUrl) + '" target="_blank" rel="noopener" class="wcp-btn-icon" title="Open in new tab">' + icon('arrow-up-right-from-square') + '</a>';
      }
      if (matchedPage) {
        html += '<span class="wcp-cd-pub-url-chip" title="Linked to sitemap page">' + icon('check') + ' In sitemap</span>';
      } else if (pubUrl && c.status === 'published') {
        html += '<span class="wcp-cd-pub-url-chip wcp-cd-pub-url-chip-muted" title="Not yet in sitemap">' + icon('circle-exclamation') + ' Not in sitemap</span>';
      }
      html += '</div>';
    }

    html += '</div>'; // /wcp-cd-header

    // ── Step body ──
    html += '<div class="wcp-step-content">';
    var R = window._wcpRenderers || {};
    var stepRenderer = R['step_' + currentStep];
    if (stepRenderer) {
      html += stepRenderer(c);
    } else {
      html += '<div class="wcp-empty-state"><p>Step renderer not found for: ' + esc(currentStep) + '</p></div>';
    }
    html += '</div>';

    html += '</div>'; // /wcp-detail-body
    return html;
  }

