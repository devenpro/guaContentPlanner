  function openEditTypeModal(typeId) {
    var t = null;
    var types = S.data.content_types || [];
    for (var i = 0; i < types.length; i++) { if (types[i].id === typeId) { t = types[i]; break; } }
    if (!t) return;
    var html = '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Name</label><input type="text" class="wcp-input" data-field="name" value="' + esc(t.name) + '"></div>';
    html += '<div class="wcp-form-group"><label>Description</label><textarea class="wcp-textarea" data-field="description" rows="2">' + esc(t.description || '') + '</textarea></div>';
    html += '<div class="wcp-form-row"><div class="wcp-form-half"><label>Icon (FA name)</label><input type="text" class="wcp-input" data-field="icon" value="' + esc(t.icon || 'file') + '"></div>';
    html += '<div class="wcp-form-half"><label>Color</label><div class="wcp-color-picker">';
    var colors = Constants.HUB_COLORS;
    for (var ci = 0; ci < colors.length; ci++) html += '<button class="wcp-color-swatch' + (t.color === colors[ci].color ? ' wcp-color-swatch-active' : '') + '" data-action="pick-color" data-color="' + colors[ci].color + '" style="background:' + colors[ci].color + '"></button>';
    html += '<input type="hidden" data-field="color" value="' + esc(t.color || '#80868b') + '"></div></div></div>';
    html += '<div class="wcp-form-group"><label>Instructions</label><textarea class="wcp-textarea" data-field="instructions" rows="3" placeholder="Writing instructions for this type...">' + esc(t.instructions || '') + '</textarea></div>';
    html += '<div class="wcp-form-row"><div class="wcp-form-third"><label>Default Schema</label><input type="text" class="wcp-input" data-field="default_schema" value="' + esc(t.default_schema || '') + '"></div>';
    html += '<div class="wcp-form-third"><label>Default Intent</label><select class="wcp-select" data-field="default_intent">';
    for (var ik in Constants.SEARCH_INTENTS) html += '<option value="' + ik + '"' + (t.default_intent === ik ? ' selected' : '') + '>' + Constants.SEARCH_INTENTS[ik].label + '</option>';
    html += '</select></div>';
    html += '<div class="wcp-form-third"><label>CW Type</label><input type="text" class="wcp-input" data-field="cw_content_type" value="' + esc(t.cw_content_type || '') + '"></div></div>';
    html += '<div class="wcp-form-row"><div class="wcp-form-half"><label>Min Words</label><input type="number" class="wcp-input" data-field="min_words" value="' + ((t.word_count_range || {}).min || '') + '"></div>';
    html += '<div class="wcp-form-half"><label>Max Words</label><input type="number" class="wcp-input" data-field="max_words" value="' + ((t.word_count_range || {}).max || '') + '"></div></div>';
    html += '</div>';
    openModal('Edit Content Type — ' + esc(t.name), html, {
      size: 'lg', saveLabel: 'Save Type',
      onSave: function() {
        var f = collectModalFields();
        if (!f.name || !f.name.trim()) { toast('Name is required', 'warning'); return; }
        t.name = f.name.trim(); t.description = f.description || '';
        t.icon = f.icon || 'file'; t.color = f.color || t.color;
        t.instructions = f.instructions || '';
        t.default_schema = f.default_schema || ''; t.default_intent = f.default_intent || '';
        t.cw_content_type = f.cw_content_type || '';
        t.word_count_range = { min: parseInt(f.min_words, 10) || 0, max: parseInt(f.max_words, 10) || 0 };
        logActivity('ai_action', t.id, t.name, 'Content type updated');
        snapshot('Edit type'); buildMaps(); closeModal(); syncToTextarea(); render();
        toast('Content type updated', 'success');
      }
    });
  }

  function renderTemplateSectionEditor(sec, idx) {
    var headingLevels = ['H2', 'H3', 'H4'];
    var sectionTypes = [
      { v: 'intro', l: 'Introduction' }, { v: 'body', l: 'Body' }, { v: 'conclusion', l: 'Conclusion' },
      { v: 'faq', l: 'FAQ' }, { v: 'cta', l: 'CTA' }
    ];
    var typeLabel = (sectionTypes.find(function(t) { return t.v === sec.section_type; }) || { l: 'Body' }).l;
    var level = sec.heading_level || 'H2';
    var words = parseInt(sec.est_words, 10) || 0;
    var typeAttr = sec.section_type || 'body';
    var html = '<div class="wcp-tpl-card" data-section-index="' + idx + '" data-type="' + esc(typeAttr) + '" draggable="true">';

    // ── VIEW MODE (shown by default) ──
    html += '<div class="wcp-tpl-card-view">';
    html += '<div class="wcp-tpl-handle" title="Drag to reorder">' + icon('grip-vertical') + '</div>';
    html += '<div class="wcp-tpl-num">' + (idx + 1) + '</div>';
    html += '<div class="wcp-tpl-body">';
    html += '<div class="wcp-tpl-name-display">' + (sec.name ? esc(sec.name) : '<span class="wcp-text-muted">Untitled section</span>') + '</div>';
    html += '<div class="wcp-tpl-meta">';
    html += '<span class="wcp-tpl-badge wcp-tpl-badge-level">' + esc(level) + '</span>';
    html += '<span class="wcp-tpl-badge wcp-tpl-badge-type">' + esc(typeLabel) + '</span>';
    if (words) html += '<span class="wcp-tpl-words">~' + words + 'w</span>';
    html += '</div>';
    if (sec.instructions) html += '<div class="wcp-tpl-instructions-preview">' + esc(truncate(sec.instructions, 140)) + '</div>';
    html += '</div>';
    html += '<div class="wcp-tpl-card-actions">';
    html += '<button class="wcp-btn-icon" data-action="tpl-section-edit" title="Edit section">' + icon('pen') + '</button>';
    html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="tpl-remove-section" title="Remove section">' + icon('trash') + '</button>';
    html += '</div>';
    html += '</div>';

    // ── EDIT MODE (hidden until ✎ clicked) ──
    html += '<div class="wcp-tpl-card-edit" style="display:none">';
    html += '<div class="wcp-form-group"><label>Section name</label>';
    html += '<input type="text" class="wcp-input wcp-tpl-sec-field" data-sec-field="name" value="' + esc(sec.name || '') + '" placeholder="Section name"></div>';
    html += '<div class="wcp-form-group"><label>Instructions</label>';
    html += '<textarea class="wcp-textarea wcp-tpl-sec-field" data-sec-field="instructions" rows="3" placeholder="Guidance for the writer...">' + esc(sec.instructions || '') + '</textarea></div>';
    html += '<div class="wcp-form-row" style="gap:var(--wcp-space-3)">';
    html += '<div class="wcp-form-half"><label>Heading</label><select class="wcp-select wcp-tpl-sec-field" data-sec-field="heading_level">';
    for (var hi = 0; hi < headingLevels.length; hi++) {
      html += '<option value="' + headingLevels[hi] + '"' + (sec.heading_level === headingLevels[hi] ? ' selected' : '') + '>' + headingLevels[hi] + '</option>';
    }
    html += '</select></div>';
    html += '<div class="wcp-form-half"><label>Type</label><select class="wcp-select wcp-tpl-sec-field wcp-tpl-sec-type-select" data-sec-field="section_type">';
    for (var ti = 0; ti < sectionTypes.length; ti++) {
      html += '<option value="' + sectionTypes[ti].v + '"' + (sec.section_type === sectionTypes[ti].v ? ' selected' : '') + '>' + sectionTypes[ti].l + '</option>';
    }
    html += '</select></div>';
    html += '<div class="wcp-form-half"><label>Est. words</label>';
    html += '<input type="number" class="wcp-input wcp-tpl-sec-field" data-sec-field="est_words" value="' + (sec.est_words || '') + '" placeholder="200" min="0"></div>';
    html += '</div>';
    html += '<div style="display:flex;justify-content:flex-end;margin-top:var(--wcp-space-2)">';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-outline" data-action="tpl-section-edit" title="Collapse">' + icon('check') + ' Done</button>';
    html += '</div>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function collectTemplateSections() {
    var sections = [];
    $('.wcp-tpl-card').each(function() {
      var $card = $(this);
      // Prefer edit-mode field values (they have the live-editable inputs);
      // fall back to the view-mode name-display text if edit form doesn't exist.
      var nameVal = $card.find('[data-sec-field="name"]').val();
      if (nameVal == null) nameVal = $card.find('.wcp-tpl-name-display').text().trim();
      var sec = {
        name: nameVal || '',
        instructions: $card.find('[data-sec-field="instructions"]').val() || '',
        heading_level: $card.find('[data-sec-field="heading_level"]').val() || 'H2',
        section_type: $card.find('[data-sec-field="section_type"]').val() || 'body',
        est_words: parseInt($card.find('[data-sec-field="est_words"]').val(), 10) || 0
      };
      sections.push(sec);
    });
    return sections;
  }

