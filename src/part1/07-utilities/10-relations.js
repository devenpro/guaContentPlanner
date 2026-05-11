  // ============================================================
  // SECTION 7.10: RELATIONSHIP HELPERS
  // ============================================================
  //
  // The app stores Hub ↔ Cluster ↔ Content relations as a mix of forward
  // references (content.hub_id, content.cluster_id) and back references
  // (cluster.content_ids[], hub.pillar_content_id). These helpers keep both
  // sides in sync whenever a reference changes or an entity is deleted.
  //
  // ALWAYS use these when:
  //   - moving content between clusters
  //   - changing a content's hub
  //   - deleting a content (clears hub pillar + cluster membership)
  //   - archiving a content that's someone's pillar

  // Move content to a new cluster (or detach by passing '' / null).
  // Keeps the old cluster's content_ids clean and adds to the new cluster's
  // content_ids if not already present.
  function assignContentToCluster(content, newClusterId) {
    if (!content) return;
    var oldId = content.cluster_id || '';
    newClusterId = newClusterId || '';
    if (oldId === newClusterId) { content.cluster_id = newClusterId; return; }

    if (oldId) {
      var oldCl = S.clusterMap[oldId];
      if (oldCl && Array.isArray(oldCl.content_ids)) {
        oldCl.content_ids = oldCl.content_ids.filter(function(id) { return id !== content.id; });
        oldCl.updated = new Date().toISOString();
      }
    }
    content.cluster_id = newClusterId;
    if (newClusterId) {
      var newCl = S.clusterMap[newClusterId];
      if (newCl) {
        newCl.content_ids = newCl.content_ids || [];
        if (newCl.content_ids.indexOf(content.id) === -1) newCl.content_ids.push(content.id);
        newCl.updated = new Date().toISOString();
      }
    }
  }

  // Move content to a new hub — also clears cluster_id if that cluster
  // belongs to a different hub (a cluster can't span hubs).
  function assignContentToHub(content, newHubId) {
    if (!content) return;
    newHubId = newHubId || '';
    if (content.hub_id === newHubId) return;
    // If currently in a cluster that doesn't belong to the new hub, detach.
    if (content.cluster_id) {
      var cl = S.clusterMap[content.cluster_id];
      if (cl && cl.hub_id !== newHubId) {
        assignContentToCluster(content, '');
      }
    }
    // If this content was a pillar of its old hub, clear that reference
    // (a pillar can't belong to a hub it's not part of).
    if (content.hub_id) {
      var oldHub = S.hubMap[content.hub_id];
      if (oldHub && oldHub.pillar_content_id === content.id) {
        oldHub.pillar_content_id = '';
        oldHub.updated = new Date().toISOString();
      }
    }
    content.hub_id = newHubId;
  }

  // Clear any hub that points at this content as its pillar. Called on
  // content delete, archive, reject, or hub-reassignment.
  function clearHubPillarReferences(contentId) {
    if (!contentId || !S.hubMap) return 0;
    var cleared = 0;
    var now = new Date().toISOString();
    for (var hid in S.hubMap) {
      if (S.hubMap[hid] && S.hubMap[hid].pillar_content_id === contentId) {
        S.hubMap[hid].pillar_content_id = '';
        S.hubMap[hid].updated = now;
        cleared++;
      }
    }
    return cleared;
  }

  // Set a content piece as its hub's pillar. Returns the hub or null.
  function setContentAsHubPillar(content) {
    if (!content || !content.hub_id) return null;
    var hub = S.hubMap[content.hub_id];
    if (!hub) return null;
    hub.pillar_content_id = content.id;
    hub.updated = new Date().toISOString();
    return hub;
  }

