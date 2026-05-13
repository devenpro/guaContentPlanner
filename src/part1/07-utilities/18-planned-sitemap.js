  // ============================================================
  // SECTION 7.18: PLANNED SITEMAP HELPERS
  // ============================================================
  //
  // Per-hub planned sitemap trees live at S.data.sitemap.planned[hubId] =
  // { root_id, nodes: [...] }. Each node has a parent_id (root nodes use '').
  // This module holds the CRUD primitives + traversal helpers — UI code in
  // Phase 4 (sitemap view) and AI code in Phase 5 (planning) both call into
  // these so the data shape stays consistent. The helpers do NOT call
  // syncToTextarea() or render() — callers decide when to commit.

  function getPlannedTree(hubId) {
    if (!hubId) return null;
    var sm = (S.data && S.data.sitemap) || {};
    sm.planned = sm.planned || {};
    return sm.planned[hubId] || null;
  }

  function ensurePlannedTree(hubId) {
    if (!hubId) return null;
    var sm = (S.data && S.data.sitemap) || {};
    sm.planned = sm.planned || {};
    if (!sm.planned[hubId]) sm.planned[hubId] = { root_id: '', nodes: [] };
    return sm.planned[hubId];
  }

  function getPlannedNode(nodeId) {
    if (!nodeId) return null;
    return (S.plannedNodeMap && S.plannedNodeMap[nodeId]) || null;
  }

  function getPlannedTreeOfNode(nodeId) {
    var node = getPlannedNode(nodeId); if (!node) return null;
    var sm = (S.data && S.data.sitemap) || {};
    var planned = sm.planned || {};
    for (var hid in planned) {
      var tree = planned[hid];
      if (tree && Array.isArray(tree.nodes) && tree.nodes.indexOf(node) !== -1) return { hubId: hid, tree: tree };
    }
    return null;
  }

  // Returns direct children of nodeId within the given hub's tree. Pass
  // parentId = '' for root-level nodes. Sort is stable on insertion order
  // since each node carries its own created timestamp.
  function getPlannedChildren(hubId, parentId) {
    var tree = getPlannedTree(hubId); if (!tree) return [];
    var pid = parentId || '';
    var out = [];
    for (var i = 0; i < tree.nodes.length; i++) {
      if ((tree.nodes[i].parent_id || '') === pid) out.push(tree.nodes[i]);
    }
    return out;
  }

  // Walks ancestors from a node up to root. Returns the path including the
  // node itself (last) and excluding any orphan refs. Useful for breadcrumbs.
  function getPlannedAncestors(hubId, nodeId) {
    var tree = getPlannedTree(hubId); if (!tree) return [];
    var byId = {}; for (var i = 0; i < tree.nodes.length; i++) byId[tree.nodes[i].id] = tree.nodes[i];
    var out = [];
    var cur = byId[nodeId];
    var guard = 0;
    while (cur && guard++ < 64) {
      out.unshift(cur);
      if (!cur.parent_id) break;
      cur = byId[cur.parent_id];
    }
    return out;
  }

  // Recursive descendants in a depth-first order. Includes nodeId? No — only
  // descendants (caller can prepend the node themselves).
  function getPlannedDescendants(hubId, nodeId) {
    var tree = getPlannedTree(hubId); if (!tree) return [];
    var byParent = {};
    for (var i = 0; i < tree.nodes.length; i++) {
      var pid = tree.nodes[i].parent_id || '';
      (byParent[pid] = byParent[pid] || []).push(tree.nodes[i]);
    }
    var out = [];
    function walk(parentId) {
      var kids = byParent[parentId] || [];
      for (var k = 0; k < kids.length; k++) { out.push(kids[k]); walk(kids[k].id); }
    }
    walk(nodeId);
    return out;
  }

  // Create a new planned node. parentId='' for root; status defaults to
  // 'planned' (manual user-created). Returns the node so callers can chain
  // setting fields before syncing. Caller is responsible for syncToTextarea
  // and any activity logging.
  function createPlannedNode(hubId, parentId, fields) {
    var tree = ensurePlannedTree(hubId); if (!tree) return null;
    var now = new Date().toISOString();
    fields = fields || {};
    var node = {
      id:              generateId('pln'),
      parent_id:       parentId || '',
      label:           fields.label || 'New node',
      slug:            fields.slug || '',
      description:     fields.description || '',
      priority:        (fields.priority === 1 || fields.priority === 2 || fields.priority === 3) ? fields.priority : null,
      intent:          fields.intent || '',
      content_type_id: fields.content_type_id || '',
      content_id:      fields.content_id || '',
      cluster_id:      fields.cluster_id || '',
      status:          fields.status || 'planned',
      live_page_id:    fields.live_page_id || '',
      ai_meta:         fields.ai_meta || null,
      created:         now,
      updated:         now
    };
    tree.nodes.push(node);
    if (!tree.root_id && !node.parent_id) tree.root_id = node.id;
    return node;
  }

  function updatePlannedNode(nodeId, patch) {
    var node = getPlannedNode(nodeId); if (!node) return null;
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) node[k] = patch[k];
    node.updated = new Date().toISOString();
    return node;
  }

  // Delete a node and its descendants. Returns deleted ids so the caller
  // can run activity logging or follow-up cleanup. If the deleted node was
  // the tree root, root_id is cleared (next root-level node will claim it).
  function deletePlannedNode(nodeId) {
    var node = getPlannedNode(nodeId); if (!node) return [];
    var found = getPlannedTreeOfNode(nodeId); if (!found) return [];
    var tree = found.tree;
    var doomed = {};
    doomed[nodeId] = true;
    var descendants = getPlannedDescendants(found.hubId, nodeId);
    for (var i = 0; i < descendants.length; i++) doomed[descendants[i].id] = true;
    tree.nodes = tree.nodes.filter(function(n) { return !doomed[n.id]; });
    if (tree.root_id === nodeId) tree.root_id = '';
    return Object.keys(doomed);
  }

  // Reparent a node. Refuses cycles (moving a node into its own subtree).
  // newParentId '' moves to root. Returns the node, or null on rejection.
  function movePlannedNode(nodeId, newParentId) {
    var node = getPlannedNode(nodeId); if (!node) return null;
    if (nodeId === newParentId) return null;
    if (newParentId) {
      var found = getPlannedTreeOfNode(nodeId); if (!found) return null;
      var descendants = getPlannedDescendants(found.hubId, nodeId);
      for (var i = 0; i < descendants.length; i++) {
        if (descendants[i].id === newParentId) return null;
      }
    }
    node.parent_id = newParentId || '';
    node.updated = new Date().toISOString();
    return node;
  }

  // Live pages tagged to a hub via primary hub_id OR secondary tag_hub_ids.
  // Mirrors the map built in 05-maps.js; exposing it here keeps callers off
  // S.* internals.
  function getLivePagesForHub(hubId) {
    if (!hubId) return [];
    return (S.sitemapPagesByHub && S.sitemapPagesByHub[hubId]) || [];
  }
