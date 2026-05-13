  // ============================================================
  // SITEMAP — PLANNED MODE (per-hub tree editor)
  // ============================================================
  //
  // Renders the planned-tree pane for one hub at a time (driven by
  // S.sitemapPlanHubId). Layout: a split pane with the tree on the left
  // and a node-detail editor on the right.
  //
  // Drag-and-drop uses native HTML5 events:
  //  - Dragging a row stores its node id on the dataTransfer payload.
  //  - Each row exposes two drop zones: a thin "before" strip at the top
  //    (sibling-before) and the row body (reparent-as-child). Whitespace
  //    at the end of the tree is a "make root" drop zone.
  //  - All handler logic lives in src/part1/10-events.js.
  //
  // Status colors:
  //   planned  = manual user node (gray)
  //   proposed = AI-generated, awaiting accept (purple) — Phase 5
  //   promoted = linked to a live sitemap_page (green) — Phase 5

  function renderSitemapPlannedMode() {
    var hubs = (S.data.hubs || []);
    if (!hubs.length) {
      return '<div class="wcp-empty-state" style="padding:var(--wcp-space-8)">' +
        '<div class="wcp-empty-state-icon">' + icon('sitemap') + '</div>' +
        '<div class="wcp-empty-state-title">No hubs yet</div>' +
        '<div class="wcp-empty-state-text">Create a content hub first — planned sitemaps are scoped per hub.</div>' +
        '<button class="wcp-btn wcp-btn-primary" data-action="go-view" data-view="hubs" style="margin-top:var(--wcp-space-3)">' + icon('arrow-right') + ' Go to Content Hubs</button>' +
        '</div>';
    }
    var hubId = S.sitemapPlanHubId;
    var hub = S.hubMap[hubId];
    if (!hub) {
      return '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)"><div class="wcp-text-sm wcp-text-muted">Pick a hub above to start planning.</div></div>';
    }

    // Validate selected node belongs to this hub's tree; clear otherwise.
    if (S.selectedPlannedNodeId) {
      var sel = S.plannedNodeMap[S.selectedPlannedNodeId];
      if (!sel) S.selectedPlannedNodeId = null;
    }

    var html = '<div class="wcp-split-pane wcp-split-pane-planned">';
    html += renderPlannedTreePane(hub);
    html += '<div class="wcp-detail-pane" id="wcpPlannedDetailPane">' + renderPlannedDetailPane(hub) + '</div>';
    html += '</div>';
    return html;
  }

  function renderPlannedTreePane(hub) {
    var tree = (S.data.sitemap && S.data.sitemap.planned && S.data.sitemap.planned[hub.id]) || { nodes: [] };
    var nodes = tree.nodes || [];

    var html = '<div class="wcp-list-pane wcp-planned-pane">';
    html += '<div class="wcp-list-pane-header">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-2)">';
    html += '<span style="font-size:var(--wcp-font-size-sm);font-weight:700">' + icon('diagram-project') + ' Planned tree';
    html += ' <span class="wcp-text-muted">(' + nodes.length + ')</span></span>';
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="planned-add-root" data-hub="' + esc(hub.id) + '">' + icon('plus') + ' Root node</button>';
    html += '</div>';
    // Reserved row for Phase-5 AI actions (Plan Sitemap / Expand branch).
    // Hidden today but the slot keeps the visual rhythm consistent so the
    // toolbar height doesn't shift when the AI buttons appear.
    html += '<div class="wcp-planned-ai-row wcp-text-xs wcp-text-muted">' + icon('sparkles') + ' AI sitemap planning lands in the next phase.</div>';
    html += '</div>';

    html += '<div class="wcp-list-pane-items wcp-planned-tree" id="wcpPlannedTree" data-hub="' + esc(hub.id) + '">';
    if (!nodes.length) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)">';
      html += '<div class="wcp-empty-state-icon" style="font-size:var(--wcp-font-size-2xl)">' + icon('diagram-project') + '</div>';
      html += '<div class="wcp-empty-state-title" style="font-size:var(--wcp-font-size-sm)">No planned nodes yet</div>';
      html += '<div class="wcp-empty-state-text" style="font-size:var(--wcp-font-size-xs)">Click <strong>Root node</strong> to add the top-level page for this hub.</div>';
      html += '</div>';
    } else {
      // Render root-level nodes; each recurses into its children.
      var roots = _getPlannedChildrenLocal(hub.id, '');
      for (var i = 0; i < roots.length; i++) html += _renderPlannedTreeNode(hub, roots[i], 0);
    }
    // Trailing drop zone — drop here to demote a node to root level.
    html += '<div class="wcp-planned-drop-end" data-action="planned-drop-end" data-hub="' + esc(hub.id) + '"></div>';
    html += '</div></div>';
    return html;
  }

  function _getPlannedChildrenLocal(hubId, parentId) {
    // Local copy — avoids cross-file dependency at this render path. The
    // canonical helper is window._wcpGetPlannedChildren (Phase 3) and the
    // two return the same shape.
    var tree = (S.data.sitemap && S.data.sitemap.planned && S.data.sitemap.planned[hubId]) || null;
    if (!tree || !Array.isArray(tree.nodes)) return [];
    var pid = parentId || '';
    var out = [];
    for (var i = 0; i < tree.nodes.length; i++) {
      if ((tree.nodes[i].parent_id || '') === pid) out.push(tree.nodes[i]);
    }
    return out;
  }

  function _renderPlannedTreeNode(hub, node, depth) {
    var children = _getPlannedChildrenLocal(hub.id, node.id);
    // Default expanded; only collapsed when the user has explicitly toggled.
    var expanded = S.plannedTreeExpanded[node.id] !== false;
    var isActive = S.selectedPlannedNodeId === node.id;
    var statusCls = 'wcp-planned-status-' + (node.status || 'planned');
    var PR = SITEMAP_PRIORITIES;
    var priCfg = (node.priority === 1 || node.priority === 2 || node.priority === 3) ? PR[String(node.priority)] : null;

    // Row + drop strip above (sibling-before target). Indent via CSS var.
    var html = '<div class="wcp-planned-node ' + statusCls + (isActive ? ' is-active' : '') + '" data-node-id="' + esc(node.id) + '" data-hub="' + esc(hub.id) + '" style="--depth:' + depth + '">';
    html += '<div class="wcp-planned-drop-before" data-action="planned-drop-before" data-node-id="' + esc(node.id) + '"></div>';
    html += '<div class="wcp-planned-row" data-action="planned-select-node" data-node-id="' + esc(node.id) + '" draggable="true">';
    // Chevron (toggle) or spacer
    if (children.length > 0) {
      html += '<button class="wcp-planned-chev" data-action="planned-toggle-expand" data-node-id="' + esc(node.id) + '" title="Expand / collapse">';
      html += icon(expanded ? 'chevron-down' : 'chevron-right');
      html += '</button>';
    } else {
      html += '<span class="wcp-planned-chev wcp-planned-chev-empty"></span>';
    }
    // Status pip
    html += '<span class="wcp-planned-pip" title="' + esc(node.status || 'planned') + '"></span>';
    // Label
    html += '<span class="wcp-planned-label">' + esc(node.label || '(untitled)') + '</span>';
    // Priority pill (compact)
    if (priCfg) {
      html += '<span class="wcp-sitemap-pri-pill" style="background:' + priCfg.color + ';flex-shrink:0">' + priCfg.label + '</span>';
    }
    // Intent chip (very compact)
    if (node.intent) html += '<span class="wcp-planned-intent">' + esc(node.intent.charAt(0).toUpperCase()) + '</span>';
    // Child count badge
    if (children.length > 0) {
      html += '<span class="wcp-planned-count">' + children.length + '</span>';
    }
    // Quick-action kebab — keep at end so the row width is predictable.
    html += '<button class="wcp-btn-icon wcp-planned-kebab" data-action="planned-row-menu" data-node-id="' + esc(node.id) + '" title="Actions">' + icon('ellipsis-vertical') + '</button>';
    html += '</div>';

    // Children (recursive). Only rendered when expanded so a 1000-node tree
    // collapsed to its root costs near-zero DOM.
    if (expanded && children.length > 0) {
      html += '<div class="wcp-planned-children">';
      for (var i = 0; i < children.length; i++) {
        html += _renderPlannedTreeNode(hub, children[i], depth + 1);
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // Detail pane for the currently-selected planned node. Drives the edit
  // form for label / slug / description / priority / intent / content type.
  function renderPlannedDetailPane(hub) {
    var node = S.selectedPlannedNodeId ? S.plannedNodeMap[S.selectedPlannedNodeId] : null;
    if (!node) {
      return '<div class="wcp-empty-state" style="height:100%;justify-content:center">' +
        '<div class="wcp-empty-state-icon">' + icon('diagram-project') + '</div>' +
        '<div class="wcp-empty-state-title">Pick a node to edit</div>' +
        '<div class="wcp-empty-state-text">Click any row in the tree, or <strong>+ Root node</strong> to start.</div></div>';
    }
    var PR = SITEMAP_PRIORITIES;
    var SI = SEARCH_INTENTS;
    var types = S.data.content_types || [];
    var hubClusters = getHubClusters(hub.id);
    var linkedContent = node.content_id ? S.contentMap[node.content_id] : null;
    var livePage = node.live_page_id ? S.sitemapPageMap[node.live_page_id] : null;
    var ancestors = (window._wcpGetPlannedAncestors ? window._wcpGetPlannedAncestors(hub.id, node.id) : []).slice(0, -1); // exclude self

    var html = '<div class="wcp-detail-body wcp-planned-detail">';
    // Edit-affordance banner
    html += '<div class="wcp-sitemap-edit-banner">' + icon('pen') + ' <strong>Edit node</strong> — changes save automatically on blur</div>';

    // Breadcrumb path within the planned tree
    if (ancestors.length) {
      html += '<div class="wcp-planned-breadcrumb">';
      for (var ai = 0; ai < ancestors.length; ai++) {
        html += '<a href="#" data-action="planned-select-node" data-node-id="' + esc(ancestors[ai].id) + '">' + esc(ancestors[ai].label || '(untitled)') + '</a>';
        html += '<span class="wcp-planned-breadcrumb-sep">' + icon('chevron-right') + '</span>';
      }
      html += '<span class="wcp-planned-breadcrumb-current">' + esc(node.label || '(untitled)') + '</span>';
      html += '</div>';
    }

    // Header: label + status + delete
    html += '<div class="wcp-sitemap-detail-header">';
    html += '<div class="wcp-sitemap-detail-title-row">';
    html += '<input type="text" class="wcp-input wcp-sitemap-title-input" data-action="planned-save" data-node-id="' + esc(node.id) + '" data-field="label" value="' + esc(node.label || '') + '" placeholder="Node label…">';
    html += '<span class="wcp-badge wcp-planned-status-badge wcp-planned-status-' + (node.status || 'planned') + '">' + esc(node.status || 'planned') + '</span>';
    html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="planned-delete" data-node-id="' + esc(node.id) + '" title="Delete node (and its children)">' + icon('trash') + '</button>';
    html += '</div>';
    // Slug + URL preview
    html += '<div class="wcp-sitemap-detail-url">';
    html += '<span class="wcp-text-xs wcp-text-muted">Slug</span>';
    html += '<input type="text" class="wcp-input wcp-input-sm" data-action="planned-save" data-node-id="' + esc(node.id) + '" data-field="slug" value="' + esc(node.slug || '') + '" placeholder="e.g. products/widget">';
    html += '</div></div>';

    // Description
    html += '<div class="wcp-sitemap-detail-block">';
    html += '<div class="wcp-section-label">' + icon('align-left') + ' Description</div>';
    html += '<textarea class="wcp-textarea wcp-input-sm" data-action="planned-save" data-node-id="' + esc(node.id) + '" data-field="description" rows="2" placeholder="What this page is for…">' + esc(node.description || '') + '</textarea>';
    html += '</div>';

    // Priority
    html += '<div class="wcp-sitemap-detail-block">';
    html += '<div class="wcp-section-label">' + icon('flag') + ' Priority</div>';
    html += '<div class="wcp-sitemap-pri-picker">';
    var isAuto = (node.priority === null || node.priority === undefined);
    if (!isAuto) {
      html += '<button class="wcp-sitemap-pri-opt" data-action="planned-set-priority" data-node-id="' + esc(node.id) + '" data-priority="auto">' + icon('rotate-left') + ' Clear</button>';
    }
    for (var pk in PR) {
      var opt = PR[pk];
      var pActive = (String(node.priority) === String(pk));
      html += '<button class="wcp-sitemap-pri-opt' + (pActive ? ' is-active' : '') + '" style="--pri-color:' + opt.color + '" data-action="planned-set-priority" data-node-id="' + esc(node.id) + '" data-priority="' + pk + '" title="' + esc(opt.desc || '') + '">';
      html += '<span class="wcp-sitemap-pri-pill" style="background:' + opt.color + '">' + opt.label + '</span> ' + esc(opt.full.replace(/^P\d\s—\s/, ''));
      html += '</button>';
    }
    html += '</div></div>';

    // Intent + content type
    html += '<div class="wcp-sitemap-detail-block" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--wcp-space-3)">';
    html += '<div><div class="wcp-section-label">' + icon('compass') + ' Search intent</div>';
    html += '<select class="wcp-select wcp-select-sm" data-action="planned-save" data-node-id="' + esc(node.id) + '" data-field="intent">';
    html += '<option value=""' + (!node.intent ? ' selected' : '') + '>— None —</option>';
    for (var ik in SI) {
      html += '<option value="' + ik + '"' + (node.intent === ik ? ' selected' : '') + '>' + esc(SI[ik].label) + '</option>';
    }
    html += '</select></div>';

    html += '<div><div class="wcp-section-label">' + icon('layer-group') + ' Content type</div>';
    html += '<select class="wcp-select wcp-select-sm" data-action="planned-save" data-node-id="' + esc(node.id) + '" data-field="content_type_id">';
    html += '<option value=""' + (!node.content_type_id ? ' selected' : '') + '>— None —</option>';
    for (var ti = 0; ti < types.length; ti++) {
      var t = types[ti];
      html += '<option value="' + esc(t.id) + '"' + (node.content_type_id === t.id ? ' selected' : '') + '>' + esc(t.name) + '</option>';
    }
    html += '</select></div></div>';

    // Cluster tag (within the active hub)
    html += '<div class="wcp-sitemap-detail-block">';
    html += '<div class="wcp-section-label">' + icon('bookmark') + ' Cluster</div>';
    html += '<select class="wcp-select wcp-select-sm" data-action="planned-save" data-node-id="' + esc(node.id) + '" data-field="cluster_id">';
    html += '<option value=""' + (!node.cluster_id ? ' selected' : '') + '>— None —</option>';
    for (var ci = 0; ci < hubClusters.length; ci++) {
      var cl = hubClusters[ci];
      html += '<option value="' + esc(cl.id) + '"' + (node.cluster_id === cl.id ? ' selected' : '') + '>' + esc(cl.name) + '</option>';
    }
    html += '</select></div>';

    // Linked content + live page (read-only; phase 5/6 will add promote/unlink)
    if (linkedContent || livePage) {
      html += '<div class="wcp-sitemap-detail-block">';
      html += '<div class="wcp-section-label">' + icon('link') + ' Links</div>';
      if (linkedContent) {
        html += '<div class="wcp-sitemap-linked-content"><div class="wcp-sitemap-linked-title">' + icon('file-lines') + ' ' + esc(linkedContent.title || '(untitled)') + '</div>';
        html += '<button class="wcp-btn wcp-btn-sm" data-action="select-content" data-id="' + esc(linkedContent.id) + '">Open content</button></div>';
      }
      if (livePage) {
        html += '<div class="wcp-sitemap-linked-content" style="margin-top:var(--wcp-space-2)"><div class="wcp-sitemap-linked-title">' + icon('globe') + ' Live: ' + esc(livePage.url || '') + '</div></div>';
      }
      html += '</div>';
    }

    // AI rationale — only present on proposed nodes from Phase 5.
    if (node.ai_meta && node.ai_meta.rationale) {
      html += '<div class="wcp-sitemap-detail-block">';
      html += '<div class="wcp-section-label">' + icon('sparkles') + ' AI rationale</div>';
      html += '<div class="wcp-text-sm">' + esc(node.ai_meta.rationale) + '</div></div>';
    }

    // Footer metadata
    html += '<div class="wcp-sitemap-detail-block wcp-sitemap-detail-footer">';
    html += '<div class="wcp-text-xs wcp-text-muted">Created: ' + formatRelativeTime(node.created) + ' · Updated: ' + formatRelativeTime(node.updated) + '</div>';
    html += '</div>';

    html += '</div>';
    return html;
  }
