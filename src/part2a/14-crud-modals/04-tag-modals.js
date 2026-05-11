  function openNewTagModal() {
    var colors = Constants.HUB_COLORS;
    var html = '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Tag Name</label><input type="text" class="wcp-input" data-field="name" placeholder="e.g. Pillar Content"></div>';
    html += '<div class="wcp-form-group"><label>Group</label><input type="text" class="wcp-input" data-field="group" value="General" placeholder="e.g. Topic, Difficulty, Lifecycle"></div>';
    html += '<div class="wcp-form-group"><label>Description</label><input type="text" class="wcp-input" data-field="description" placeholder="What this tag represents..."></div>';
    html += '<div class="wcp-form-group"><label>Color</label><div class="wcp-color-picker">';
    for (var ci = 0; ci < colors.length; ci++) {
      html += '<button class="wcp-color-swatch' + (ci === 0 ? ' wcp-color-swatch-active' : '') + '" data-action="pick-color" data-color="' + colors[ci].color + '" style="background:' + colors[ci].color + '"></button>';
    }
    html += '<input type="hidden" data-field="color" value="' + colors[0].color + '">';
    html += '</div></div></div>';

    openModal('New Tag', html, {
      size: 'sm', saveLabel: 'Create Tag',
      onSave: function() {
        var fields = collectModalFields();
        if (!fields.name || !fields.name.trim()) { toast('Tag name is required', 'warning'); return; }
        var tag = { id: generateId('tag'), name: fields.name.trim(), color: fields.color || colors[0].color, group: (fields.group || 'General').trim(), description: fields.description || '', created: new Date().toISOString() };
        S.data.tags = S.data.tags || [];
        S.data.tags.push(tag);
        logActivity('tag_created', tag.id, tag.name, 'Tag created in ' + tag.group);
        snapshot('Create tag'); buildMaps(); closeModal(); syncToTextarea(); render();
        toast('Tag "' + tag.name + '" created', 'success');
      }
    });
  }

  function openEditTagModal(tagId) {
    var tag = S.tagMap[tagId]; if (!tag) return;
    var colors = Constants.HUB_COLORS;
    var html = '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Tag Name</label><input type="text" class="wcp-input" data-field="name" value="' + esc(tag.name) + '"></div>';
    html += '<div class="wcp-form-group"><label>Group</label><input type="text" class="wcp-input" data-field="group" value="' + esc(tag.group || 'General') + '"></div>';
    html += '<div class="wcp-form-group"><label>Description</label><input type="text" class="wcp-input" data-field="description" value="' + esc(tag.description || '') + '"></div>';
    html += '<div class="wcp-form-group"><label>Color</label><div class="wcp-color-picker">';
    for (var ci = 0; ci < colors.length; ci++) {
      html += '<button class="wcp-color-swatch' + (tag.color === colors[ci].color ? ' wcp-color-swatch-active' : '') + '" data-action="pick-color" data-color="' + colors[ci].color + '" style="background:' + colors[ci].color + '"></button>';
    }
    html += '<input type="hidden" data-field="color" value="' + esc(tag.color) + '">';
    html += '</div></div></div>';

    openModal('Edit Tag — ' + esc(tag.name), html, {
      size: 'sm', saveLabel: 'Save Tag',
      onSave: function() {
        var fields = collectModalFields();
        if (!fields.name || !fields.name.trim()) { toast('Tag name is required', 'warning'); return; }
        tag.name = fields.name.trim();
        tag.group = (fields.group || 'General').trim();
        tag.description = fields.description || '';
        tag.color = fields.color || tag.color;
        logActivity('tag_updated', tag.id, tag.name, 'Tag updated');
        snapshot('Edit tag'); buildMaps(); closeModal(); syncToTextarea(); render();
        toast('Tag updated', 'success');
      }
    });
  }

  function deleteTagConfirm(tagId) {
    var tag = S.tagMap[tagId]; if (!tag) return;
    openConfirmDialog({
      title: 'Delete Tag', message: 'Delete tag "' + tag.name + '"? Content will be untagged.', confirmLabel: 'Delete', danger: true,
      onConfirm: function() {
        S.data.tags = (S.data.tags || []).filter(function(t) { return t.id !== tagId; });
        (S.data.content || []).forEach(function(c) { c.tags = (c.tags || []).filter(function(t) { return t !== tagId; }); });
        logActivity('tag_deleted', tagId, tag.name, 'Tag deleted');
        snapshot('Delete tag'); buildMaps(); syncToTextarea(); render();
        toast('Tag deleted', 'success');
      }
    });
  }

