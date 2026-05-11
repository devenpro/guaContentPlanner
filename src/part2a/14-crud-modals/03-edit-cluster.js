  function openEditClusterModal(clusterId) {
    var cl = S.clusterMap[clusterId]; if (!cl) return;
    var html = '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Cluster Name</label><input type="text" class="wcp-input" data-field="name" value="' + esc(cl.name) + '"></div>';
    html += '<div class="wcp-form-group"><label>Description</label><textarea class="wcp-textarea" data-field="description" rows="2" placeholder="What this cluster covers...">' + esc(cl.description || '') + '</textarea></div>';
    html += '<div class="wcp-form-group"><label>Status</label><select class="wcp-select" data-field="status">';
    for (var sk in Constants.CLUSTER_STATUSES) {
      html += '<option value="' + sk + '"' + (cl.status === sk ? ' selected' : '') + '>' + Constants.CLUSTER_STATUSES[sk].label + '</option>';
    }
    html += '</select></div>';
    html += '<div class="wcp-form-group"><label>Keywords <span class="wcp-form-hint">(comma-separated)</span></label>';
    html += '<textarea class="wcp-textarea" data-field="keywords" rows="2" placeholder="keyword1, keyword2...">' + esc((cl.keywords || []).join(', ')) + '</textarea></div>';
    html += '</div>';

    openModal('Edit Cluster — ' + esc(cl.name), html, {
      saveLabel: 'Save Cluster',
      onSave: function() {
        var fields = collectModalFields();
        if (!fields.name || !fields.name.trim()) { toast('Cluster name is required', 'warning'); return; }
        cl.name = fields.name.trim();
        cl.description = fields.description || '';
        cl.status = fields.status || cl.status;
        cl.keywords = (fields.keywords || '').split(',').map(function(k) { return k.trim(); }).filter(Boolean);
        cl.updated = new Date().toISOString();
        logActivity('cluster_updated', cl.id, cl.name, 'Cluster updated');
        snapshot('Edit cluster'); buildMaps(); closeModal(); syncToTextarea(); render();
        toast('Cluster updated', 'success');
      }
    });
  }

  function deleteClusterConfirm(clusterId) {
    var cl = S.clusterMap[clusterId]; if (!cl) return;
    openConfirmDialog({
      title: 'Delete Cluster', message: 'Delete cluster "' + cl.name + '"? Linked content will be unlinked.', confirmLabel: 'Delete', danger: true,
      onConfirm: function() {
        var linked = getClusterContent(clusterId);
        for (var i = 0; i < linked.length; i++) linked[i].cluster_id = '';
        S.data.clusters = (S.data.clusters || []).filter(function(c) { return c.id !== clusterId; });
        logActivity('cluster_deleted', clusterId, cl.name, 'Cluster deleted');
        snapshot('Delete cluster'); buildMaps(); syncToTextarea(); render();
        toast('Cluster deleted', 'success');
      }
    });
  }

