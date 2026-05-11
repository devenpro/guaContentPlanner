  function renderTypesView() {
    var types = S.data.content_types || [];
    var html = '<div class="wcp-view">';
    html += '<div class="wcp-view-header"><div class="wcp-view-header-left"><h1>' + icon('layer-group') + ' Content Types</h1>';
    html += '<span class="wcp-view-subtitle">Define types with instructions, SEO guidelines, and CW mapping</span></div>';
    html += '<div class="wcp-view-header-right">';
    html += '<button class="wcp-btn-ai" data-action="ai-suggest-types">' + icon('sparkles') + ' AI Suggest</button>';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="create-type">' + icon('plus') + ' New Type</button>';
    html += '</div></div>';

    html += '<div class="wcp-card-grid wcp-card-grid-3">';
    for (var ti = 0; ti < types.length; ti++) {
      var t = types[ti];
      var contentCount = (S.data.content || []).filter(function(c) { return c.content_type_id === t.id; }).length;
      html += '<div class="wcp-card wcp-card-clickable" data-action="edit-type" data-id="' + esc(t.id) + '">';
      html += '<div class="wcp-card-body">';
      html += '<div style="display:flex;align-items:center;gap:var(--wcp-space-2);margin-bottom:var(--wcp-space-2)">';
      html += '<span style="font-size:var(--wcp-font-size-xl);color:' + (t.color || 'var(--wcp-primary)') + '">' + icon(t.icon || 'file-lines') + '</span>';
      html += '<div><div style="font-size:var(--wcp-font-size-sm);font-weight:700">' + esc(t.name) + '</div>';
      html += '<span style="font-size:var(--wcp-font-size-xs);color:var(--wcp-text-muted)">' + contentCount + ' pieces</span></div>';
      html += '</div>';
      html += '<div style="font-size:var(--wcp-font-size-xs);color:var(--wcp-text-secondary);margin-bottom:var(--wcp-space-3);line-height:1.4">' + esc(t.description || '') + '</div>';
      // Tags
      html += '<div style="display:flex;gap:var(--wcp-space-1);flex-wrap:wrap">';
      if (t.default_schema) html += badge(t.default_schema, 'var(--wcp-cluster)');
      if (t.default_intent) html += badge(t.default_intent, 'var(--wcp-hub)');
      if (t.cw_content_type) html += badge('CW: ' + t.cw_content_type, 'var(--wcp-teal)');
      html += '</div>';
      html += '</div></div>';
    }
    // Add custom type card
    html += '<div class="wcp-card" style="border-style:dashed;cursor:pointer" data-action="create-type">';
    html += '<div class="wcp-card-body" style="display:flex;align-items:center;justify-content:center;min-height:140px;color:var(--wcp-text-muted)">';
    html += '<div style="text-align:center"><span style="font-size:var(--wcp-font-size-xl)">' + icon('plus') + '</span>';
    html += '<div style="font-size:var(--wcp-font-size-sm);font-weight:600;margin-top:var(--wcp-space-1)">Custom Type</div></div>';
    html += '</div></div>';
    html += '</div></div>';
    return html;
  }

  // ─── TEMPLATES VIEW (Split-pane) ──────────────────────────────────
  function renderTemplatesView() {
    var html = '<div class="wcp-view wcp-view-templates"><div class="wcp-split-pane">';
    html += renderTemplateListPane();
    html += '<div class="wcp-detail-pane" id="wcpTemplateDetailPane">' + renderTemplateDetailPaneFallback() + '</div>';
    html += '</div></div>';
    return html;
  }

  function renderTemplateListPane() {
    var templates = S.data.templates || [];
    var html = '<div class="wcp-list-pane">';
    html += '<div class="wcp-list-pane-header">';
    html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-2)">';
    html += '<span style="font-size:var(--wcp-font-size-sm);font-weight:700">' + icon('clipboard-list') + ' Templates</span>';
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="create-template">' + icon('plus') + ' New</button>';
    html += '</div>';
    html += '<button class="wcp-btn-ai wcp-btn-sm" data-action="ai-build-template" style="width:100%">' + icon('sparkles') + ' AI Build Template</button>';
    html += '</div>';
    html += '<div class="wcp-list-pane-items" id="wcpTemplateList">';
    if (!templates.length) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-6)">';
      html += '<div class="wcp-empty-state-icon" style="font-size:var(--wcp-font-size-2xl)">' + icon('clipboard-list') + '</div>';
      html += '<div class="wcp-empty-state-title" style="font-size:var(--wcp-font-size-sm)">No templates yet</div>';
      html += '<div class="wcp-empty-state-text" style="font-size:var(--wcp-font-size-xs)">Create a template to structure your content.</div>';
      html += '</div>';
    } else {
      for (var ti = 0; ti < templates.length; ti++) {
        var tpl = templates[ti];
        var linkedType = S.contentTypeMap[tpl.content_type_id];
        var isActive = S.selectedTemplateId === tpl.id;
        html += '<div class="wcp-list-item' + (isActive ? ' wcp-list-item-active' : '') + '" data-action="select-template" data-id="' + esc(tpl.id) + '">';
        html += '<div class="wcp-list-item-title">' + esc(tpl.name) + '</div>';
        html += '<div class="wcp-list-item-meta">';
        if (linkedType) html += badge(linkedType.name, linkedType.color || '#80868b');
        html += '<span class="wcp-text-xs">' + (tpl.sections || []).length + ' sections</span>';
        html += '<span class="wcp-text-xs" style="margin-left:auto;color:var(--wcp-text-muted)">Used ' + (tpl.uses_count || 0) + '×</span>';
        html += '</div></div>';
      }
    }
    html += '</div></div>';
    return html;
  }

  function renderTemplateListItems() {
    var templates = S.data.templates || [];
    var html = '';
    for (var ti = 0; ti < templates.length; ti++) {
      var tpl = templates[ti];
      var linkedType = S.contentTypeMap[tpl.content_type_id];
      var isActive = S.selectedTemplateId === tpl.id;
      html += '<div class="wcp-list-item' + (isActive ? ' wcp-list-item-active' : '') + '" data-action="select-template" data-id="' + esc(tpl.id) + '">';
      html += '<div class="wcp-list-item-title">' + esc(tpl.name) + '</div>';
      html += '<div class="wcp-list-item-meta">';
      if (linkedType) html += badge(linkedType.name, linkedType.color || '#80868b');
      html += '<span class="wcp-text-xs">' + (tpl.sections || []).length + ' sections</span>';
      html += '<span class="wcp-text-xs" style="margin-left:auto;color:var(--wcp-text-muted)">Used ' + (tpl.uses_count || 0) + '×</span>';
      html += '</div></div>';
    }
    return html;
  }

  function renderTemplateDetailPaneFallback() {
    // Fallback detail pane (when Part 2A hasn't loaded yet or no template selected)
    var R = window._wcpRenderers || {};
    if (R.templateDetailView && S.selectedTemplateId) return R.templateDetailView();
    if (!S.selectedTemplateId) {
      return '<div class="wcp-empty-state" style="height:100%;justify-content:center">' +
        '<div class="wcp-empty-state-icon">' + icon('clipboard-list') + '</div>' +
        '<div class="wcp-empty-state-title">Select a template to view & edit</div>' +
        '<div class="wcp-empty-state-text">Choose a template from the list, or create a new one.</div></div>';
    }
    // Simple readonly fallback if Part 2A not loaded
    var tpl = S.templateMap[S.selectedTemplateId];
    if (!tpl) return '<div class="wcp-empty-state"><p>Template not found.</p></div>';
    var html = '<div class="wcp-detail-header"><h2>' + esc(tpl.name) + '</h2></div>';
    html += '<div class="wcp-detail-body"><p>' + esc(tpl.description || '') + '</p>';
    html += '<p class="wcp-text-sm wcp-text-muted">' + (tpl.sections || []).length + ' sections</p></div>';
    return html;
  }

  // ─── TAGS VIEW (Stage 2.5) ──────────────────────────
