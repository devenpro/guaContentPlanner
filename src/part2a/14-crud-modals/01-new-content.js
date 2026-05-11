  // ============================================================
  // SECTION 14: CRUD MODALS
  // ============================================================

  // opts.onCreate(createdContent) — callback fired AFTER the new content is
  // created and linked to its cluster. Used by callers that need to wire up
  // additional references (e.g. the pillar-create flow sets
  // hub.pillar_content_id = createdContent.id).
  function openNewContentModal(defaults, opts) {
    defaults = defaults || {};
    opts = opts || {};
    var hubs = S.data.hubs || [];
    var types = S.data.content_types || [];
    var templates = S.data.templates || [];
    var tags = S.data.tags || [];

    var html = '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Title</label><input type="text" class="wcp-input" data-field="title" placeholder="Content title..." value="' + esc(defaults.title || '') + '"></div>';

    html += '<div class="wcp-form-row"><div class="wcp-form-half">';
    html += '<label>Content Type</label><select class="wcp-select" data-field="content_type_id">';
    html += '<option value="">— Select type —</option>';
    for (var ti = 0; ti < types.length; ti++) html += '<option value="' + esc(types[ti].id) + '"' + (defaults.content_type_id === types[ti].id ? ' selected' : '') + '>' + esc(types[ti].name) + '</option>';
    html += '</select></div><div class="wcp-form-half">';
    html += '<label>Hub</label><select class="wcp-select" data-field="hub_id" id="wcpModalHub">';
    html += '<option value="">— No hub —</option>';
    for (var hi = 0; hi < hubs.length; hi++) html += '<option value="' + esc(hubs[hi].id) + '"' + (defaults.hub_id === hubs[hi].id ? ' selected' : '') + '>' + esc(hubs[hi].name) + '</option>';
    html += '</select></div></div>';

    html += '<div class="wcp-form-row"><div class="wcp-form-half">';
    html += '<label>Cluster</label><select class="wcp-select" data-field="cluster_id" id="wcpModalCluster">';
    html += '<option value="">— No cluster —</option>';
    if (defaults.hub_id) {
      var cls = getHubClusters(defaults.hub_id);
      for (var ci = 0; ci < cls.length; ci++) html += '<option value="' + esc(cls[ci].id) + '"' + (defaults.cluster_id === cls[ci].id ? ' selected' : '') + '>' + esc(cls[ci].name) + '</option>';
    }
    html += '</select></div><div class="wcp-form-half">';
    html += '<label>Template</label><select class="wcp-select" data-field="template_id">';
    html += '<option value="">— No template —</option>';
    for (var tpi = 0; tpi < templates.length; tpi++) html += '<option value="' + esc(templates[tpi].id) + '">' + esc(templates[tpi].name) + '</option>';
    html += '</select></div></div>';

    html += '<div class="wcp-form-group"><label>Priority</label><select class="wcp-select" data-field="priority">';
    for (var pk in Constants.PRIORITY_LEVELS) html += '<option value="' + pk + '"' + (pk === 'medium' ? ' selected' : '') + '>' + Constants.PRIORITY_LEVELS[pk].label + '</option>';
    html += '</select></div>';

    html += '</div>';

    openModal('New Content', html, {
      size: 'lg', saveLabel: 'Create Content',
      onSave: function() {
        var fields = collectModalFields();
        if (!fields.title || !fields.title.trim()) { toast('Title is required', 'warning'); return; }
        snapshot('Before create content');
        var cnt = createContent({
          title: fields.title.trim(),
          hub_id: fields.hub_id || '',
          cluster_id: fields.cluster_id || '',
          content_type_id: fields.content_type_id || '',
          template_id: fields.template_id || '',
          priority: fields.priority || 'medium',
          tags: defaults.tags || []
        });
        // Link to cluster via the bidirectional helper (handles back-ref
        // cleanup if the cluster is later changed).
        if (fields.cluster_id) {
          assignContentToCluster(cnt, fields.cluster_id);
          var cl = S.clusterMap[fields.cluster_id];
          if (cl && cl.status === 'planned') cl.status = 'content_linked';
        }
        // Let the caller hook additional reference wiring (e.g. pillar create).
        if (typeof opts.onCreate === 'function') {
          try { opts.onCreate(cnt); } catch (e) { console.error('[WCP] onCreate hook failed:', e); }
        }
        buildMaps(); syncToTextarea();
        closeModal();
      }
    });

    // Dynamic cluster dropdown when hub changes
    setTimeout(function() {
      $(document).off('change.wcp2a-mh').on('change.wcp2a-mh', '#wcpModalHub', function() {
        var hubId = $(this).val();
        var $cl = $('#wcpModalCluster');
        $cl.html('<option value="">— No cluster —</option>');
        if (hubId) {
          var clusters = getHubClusters(hubId);
          for (var i = 0; i < clusters.length; i++) $cl.append('<option value="' + esc(clusters[i].id) + '">' + esc(clusters[i].name) + '</option>');
        }
      });
    }, 50);
  }

  function deleteContentConfirm(contentId) {
    var c = S.contentMap[contentId]; if (!c) return;
    openConfirmDialog({
      title: 'Delete Content', message: 'Delete "' + (c.title || 'Untitled') + '"? This cannot be undone.', confirmLabel: 'Delete', danger: true,
      onConfirm: function() {
        // Clear any hub pointing at this content as its pillar (prevents
        // dangling pillar_content_id references post-delete).
        clearHubPillarReferences(contentId);
        // Unlink from cluster
        if (c.cluster_id) {
          var cl = S.clusterMap[c.cluster_id];
          if (cl && cl.content_ids) cl.content_ids = cl.content_ids.filter(function(id) { return id !== contentId; });
        }
        S.data.content = (S.data.content || []).filter(function(p) { return p.id !== contentId; });
        if (S.selectedContentId === contentId) S.selectedContentId = null;
        logActivity('content_deleted', contentId, c.title, 'Content deleted');
        snapshot('Delete content'); buildMaps(); syncToTextarea(); render();
        toast('Content deleted', 'success');
      }
    });
  }

  function duplicateContent(contentId) {
    var c = S.contentMap[contentId]; if (!c) return;
    var clone = deepClone(c);
    clone.id = generateId('cnt');
    clone.title = (clone.title || '') + ' (copy)';
    clone.status = 'info';
    clone.created = new Date().toISOString();
    clone.updated = clone.created;
    clone.export = { exported_at: '', cw_node_id: '', export_version: '', writing_instructions: '' };
    S.data.content = S.data.content || [];
    S.data.content.unshift(clone);
    logActivity('content_created', clone.id, clone.title, 'Content duplicated from ' + c.title);
    snapshot('Duplicate content'); buildMaps();
    S.selectedContentId = clone.id; S.currentStep = 'info';
    syncToTextarea(); render();
    toast('Content duplicated', 'success');
  }

