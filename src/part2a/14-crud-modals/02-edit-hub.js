  function openEditHubModal(hubId) {
    var hub = S.hubMap[hubId]; if (!hub) return;
    var colors = Constants.HUB_COLORS;

    // Pillar dropdown — list every content already assigned to this hub.
    // Without this field the user had no way to assign an existing piece as
    // the hub's pillar once created; the only path was the "Create pillar"
    // shortcut (which was itself broken before this round).
    var hubContent = (S.data.content || []).filter(function(c) { return c.hub_id === hub.id; });

    var html = '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Hub Name</label><input type="text" class="wcp-input" data-field="name" value="' + esc(hub.name) + '"></div>';
    html += '<div class="wcp-form-group"><label>Description</label><textarea class="wcp-textarea" data-field="description" rows="2" placeholder="Describe this hub\'s topic focus...">' + esc(hub.description || '') + '</textarea></div>';
    html += '<div class="wcp-form-group"><label>Pillar Keyword</label><input type="text" class="wcp-input" data-field="pillar_keyword" value="' + esc(hub.pillar_keyword || '') + '" placeholder="Main keyword for this hub..."></div>';

    html += '<div class="wcp-form-group"><label>Pillar Content <span class="wcp-text-xs wcp-text-muted">— the cornerstone piece for this hub</span></label>';
    if (hubContent.length === 0) {
      html += '<div class="wcp-text-sm wcp-text-muted" style="padding:8px 0">No content assigned to this hub yet. Create content with this hub, or use the "Create Pillar" shortcut on the hub card.</div>';
      html += '<input type="hidden" data-field="pillar_content_id" value="' + esc(hub.pillar_content_id || '') + '">';
    } else {
      html += '<select class="wcp-select" data-field="pillar_content_id">';
      html += '<option value=""' + (!hub.pillar_content_id ? ' selected' : '') + '>— None —</option>';
      for (var pci = 0; pci < hubContent.length; pci++) {
        var hc = hubContent[pci];
        html += '<option value="' + esc(hc.id) + '"' + (hub.pillar_content_id === hc.id ? ' selected' : '') + '>' + esc(hc.title || '(untitled)') + '</option>';
      }
      html += '</select>';
    }
    html += '</div>';

    html += '<div class="wcp-form-group"><label>Color</label><div class="wcp-color-picker">';
    for (var ci = 0; ci < colors.length; ci++) {
      html += '<button class="wcp-color-swatch' + (hub.color === colors[ci].color ? ' wcp-color-swatch-active' : '') + '" data-action="pick-color" data-color="' + colors[ci].color + '" style="background:' + colors[ci].color + '"></button>';
    }
    html += '<input type="hidden" data-field="color" value="' + esc(hub.color) + '">';
    html += '</div></div></div>';

    openModal('Edit Hub — ' + esc(hub.name), html, {
      saveLabel: 'Save Hub',
      onSave: function() {
        var fields = collectModalFields();
        if (!fields.name || !fields.name.trim()) { toast('Hub name is required', 'warning'); return; }
        hub.name = fields.name.trim();
        hub.description = fields.description || '';
        hub.pillar_keyword = fields.pillar_keyword || '';
        var prevPillarId = hub.pillar_content_id || '';
        hub.pillar_content_id = fields.pillar_content_id || '';
        hub.color = fields.color || hub.color;
        hub.updated = new Date().toISOString();
        logActivity('hub_updated', hub.id, hub.name, 'Hub updated');
        if (hub.pillar_content_id && hub.pillar_content_id !== prevPillarId) {
          var pc = S.contentMap[hub.pillar_content_id];
          logActivity('pillar_assigned', hub.pillar_content_id, pc ? pc.title : '', 'Set as pillar of ' + hub.name);
        }
        snapshot('Edit hub'); buildMaps(); closeModal(); syncToTextarea(); render();
        toast('Hub updated', 'success');
      }
    });
  }

  function deleteHubConfirm(hubId) {
    var hub = S.hubMap[hubId]; if (!hub) return;
    var hubClusters = getHubClusters(hubId);
    var hubContent = getHubContent(hubId);
    var msg = 'Delete hub "' + hub.name + '"?';
    if (hubClusters.length > 0 || hubContent.length > 0) {
      msg += ' This hub has ' + hubClusters.length + ' cluster(s) and ' + hubContent.length + ' content piece(s). They will be unlinked (not deleted).';
    }
    openConfirmDialog({
      title: 'Delete Hub', message: msg, confirmLabel: 'Delete Hub', danger: true,
      onConfirm: function() {
        for (var ci = 0; ci < hubClusters.length; ci++) hubClusters[ci].hub_id = '';
        for (var coi = 0; coi < hubContent.length; coi++) hubContent[coi].hub_id = '';
        // Clear the pillar ref (cosmetic — the hub is about to be removed,
        // but keeps import/export data clean and prevents any late readers
        // from chasing a stale ID).
        hub.pillar_content_id = '';
        S.data.hubs = (S.data.hubs || []).filter(function(h) { return h.id !== hubId; });
        logActivity('hub_deleted', hubId, hub.name, 'Hub deleted');
        if (S.selectedHubId === hubId) { S.selectedHubId = null; if (S.currentView === 'hub-detail') navigate('hubs'); }
        snapshot('Delete hub'); buildMaps(); syncToTextarea(); render();
        toast('Hub deleted', 'success');
      }
    });
  }

