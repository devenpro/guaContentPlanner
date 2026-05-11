  function openEditTemplateModal(templateId) {
    var tpl = null;
    var templates = S.data.templates || [];
    for (var i = 0; i < templates.length; i++) { if (templates[i].id === templateId) { tpl = templates[i]; break; } }
    if (!tpl) return;
    var sections = tpl.sections || [];
    var html = '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Template Name</label><input type="text" class="wcp-input" data-field="name" value="' + esc(tpl.name) + '"></div>';
    html += '<div class="wcp-form-group"><label>Description</label><textarea class="wcp-textarea" data-field="description" rows="2">' + esc(tpl.description || '') + '</textarea></div>';
    html += '<div class="wcp-form-group" style="margin-bottom:var(--wcp-space-2)"><label>Sections</label></div>';
    html += '<div id="tplSectionsContainer">';
    for (var si = 0; si < sections.length; si++) {
      html += renderTemplateSectionEditor(sections[si], si);
    }
    html += '</div>';
    html += '<button class="wcp-btn wcp-btn-outline wcp-btn-sm" data-action="tpl-add-section" style="width:100%;border-style:dashed;margin-top:var(--wcp-space-2)">' + icon('plus') + ' Add Section</button>';
    html += '</div>';
    openModal('Edit Template — ' + esc(tpl.name), html, {
      size: 'lg',
      saveLabel: 'Save Template',
      onSave: function() {
        var f = collectModalFields();
        if (!f.name || !f.name.trim()) { toast('Name is required', 'warning'); return; }
        var newSections = collectTemplateSections();
        if (!newSections.length) { toast('At least one section is required', 'warning'); return; }
        var hasName = newSections.some(function(s) { return s.name.trim(); });
        if (!hasName) { toast('At least one section needs a name', 'warning'); return; }
        // Remove sections with empty names
        newSections = newSections.filter(function(s) { return s.name.trim(); });
        tpl.name = f.name.trim();
        tpl.description = f.description || '';
        tpl.sections = newSections;
        logActivity('template_updated', tpl.id, tpl.name, 'Template updated (' + newSections.length + ' sections)');
        snapshot('Edit template'); buildMaps(); closeModal(); syncToTextarea(); render();
        toast('Template updated with ' + newSections.length + ' sections', 'success');
      }
    });

    // Wire up modal-internal section events
    setupTemplateSectionEvents();
  }

  function _renumberTplSections() {
    $('#tplSectionsContainer .wcp-tpl-card').each(function(i) {
      $(this).attr('data-section-index', i);
      $(this).find('.wcp-tpl-num').text(i + 1);
    });
  }

  // Sync a card's edit-mode values → view-mode display. Called on Done-click
  // so users see their changes immediately without reopening the card.
  function _syncTemplateCardView($card) {
    var name = ($card.find('[data-sec-field="name"]').val() || '').trim();
    var instr = ($card.find('[data-sec-field="instructions"]').val() || '').trim();
    var level = $card.find('[data-sec-field="heading_level"]').val() || 'H2';
    var typeVal = $card.find('[data-sec-field="section_type"]').val() || 'body';
    var words = parseInt($card.find('[data-sec-field="est_words"]').val(), 10) || 0;
    var sectionTypes = { intro: 'Introduction', body: 'Body', conclusion: 'Conclusion', faq: 'FAQ', cta: 'CTA' };
    var typeLabel = sectionTypes[typeVal] || 'Body';
    $card.attr('data-type', typeVal);
    $card.find('.wcp-tpl-name-display').html(name ? esc(name) : '<span class="wcp-text-muted">Untitled section</span>');
    $card.find('.wcp-tpl-badge-level').text(level);
    $card.find('.wcp-tpl-badge-type').text(typeLabel);
    var $words = $card.find('.wcp-tpl-words');
    if (words > 0) {
      if ($words.length) $words.text('~' + words + 'w');
      else $card.find('.wcp-tpl-meta').append('<span class="wcp-tpl-words">~' + words + 'w</span>');
    } else {
      $words.remove();
    }
    var $preview = $card.find('.wcp-tpl-instructions-preview');
    if (instr) {
      var truncated = truncate(instr, 140);
      if ($preview.length) $preview.text(truncated);
      else $card.find('.wcp-tpl-body').append('<div class="wcp-tpl-instructions-preview">' + esc(truncated) + '</div>');
    } else {
      $preview.remove();
    }
  }

  function setupTemplateSectionEvents() {
    var tplNs = '.wcp-tpl-edit';

    // Add new section
    $(document).off('click' + tplNs + '-add').on('click' + tplNs + '-add', '[data-action="tpl-add-section"]', function() {
      var count = $('#tplSectionsContainer .wcp-tpl-card').length;
      var newSec = { name: '', instructions: '', heading_level: 'H2', section_type: 'body', est_words: 0 };
      $('#tplSectionsContainer').append(renderTemplateSectionEditor(newSec, count));
      _renumberTplSections();
      // Auto-expand the freshly-added card so the user can type immediately
      var $newCard = $('#tplSectionsContainer .wcp-tpl-card').last();
      $newCard.find('.wcp-tpl-card-view').hide();
      $newCard.find('.wcp-tpl-card-edit').show();
      $newCard.find('[data-sec-field="name"]').trigger('focus');
    });

    // Remove section
    $(document).off('click' + tplNs + '-rm').on('click' + tplNs + '-rm', '[data-action="tpl-remove-section"]', function(e) {
      e.stopPropagation();
      $(this).closest('.wcp-tpl-card').remove();
      _renumberTplSections();
    });

    // Edit-toggle (✎ → expand | Done → collapse)
    $(document).off('click' + tplNs + '-ed').on('click' + tplNs + '-ed', '[data-action="tpl-section-edit"]', function(e) {
      e.stopPropagation();
      var $card = $(this).closest('.wcp-tpl-card');
      var $view = $card.find('.wcp-tpl-card-view');
      var $edit = $card.find('.wcp-tpl-card-edit');
      if ($edit.is(':visible')) {
        _syncTemplateCardView($card);
        $edit.slideUp(150); $view.show();
      } else {
        $view.hide(); $edit.slideDown(150);
        $card.find('[data-sec-field="name"]').trigger('focus');
      }
    });

    // Re-sync card type attribute when section_type changes (updates color bar live)
    $(document).off('change' + tplNs + '-type').on('change' + tplNs + '-type', '.wcp-tpl-sec-type-select', function() {
      $(this).closest('.wcp-tpl-card').attr('data-type', $(this).val());
    });

    // ── Native HTML5 drag-drop reordering ──
    var $container = $('#tplSectionsContainer');
    var dragSrc = null;

    $container.off('dragstart' + tplNs).on('dragstart' + tplNs, '.wcp-tpl-card', function(e) {
      dragSrc = this;
      $(this).addClass('wcp-tpl-dragging');
      try { e.originalEvent.dataTransfer.effectAllowed = 'move'; e.originalEvent.dataTransfer.setData('text/plain', ''); } catch (err) {}
    });

    $container.off('dragover' + tplNs).on('dragover' + tplNs, '.wcp-tpl-card', function(e) {
      if (!dragSrc || dragSrc === this) return;
      e.preventDefault();
      try { e.originalEvent.dataTransfer.dropEffect = 'move'; } catch (err) {}
      // Decide whether to insert before or after based on mouse position
      var rect = this.getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      $container.find('.wcp-tpl-drop-above,.wcp-tpl-drop-below').removeClass('wcp-tpl-drop-above wcp-tpl-drop-below');
      if (e.originalEvent.clientY < midY) $(this).addClass('wcp-tpl-drop-above');
      else                                 $(this).addClass('wcp-tpl-drop-below');
    });

    $container.off('dragleave' + tplNs).on('dragleave' + tplNs, '.wcp-tpl-card', function() {
      $(this).removeClass('wcp-tpl-drop-above wcp-tpl-drop-below');
    });

    $container.off('drop' + tplNs).on('drop' + tplNs, '.wcp-tpl-card', function(e) {
      e.preventDefault();
      if (!dragSrc || dragSrc === this) return;
      var insertBefore = $(this).hasClass('wcp-tpl-drop-above');
      $(this).removeClass('wcp-tpl-drop-above wcp-tpl-drop-below');
      if (insertBefore) this.parentNode.insertBefore(dragSrc, this);
      else              this.parentNode.insertBefore(dragSrc, this.nextSibling);
      _renumberTplSections();
    });

    $container.off('dragend' + tplNs).on('dragend' + tplNs, '.wcp-tpl-card', function() {
      $(this).removeClass('wcp-tpl-dragging');
      $container.find('.wcp-tpl-drop-above,.wcp-tpl-drop-below').removeClass('wcp-tpl-drop-above wcp-tpl-drop-below');
      dragSrc = null;
    });
  }

  // ── Template Detail View (inline editor in split-pane) ──
  function renderTemplateDetailView() {
    var tpl = S.selectedTemplateId ? S.templateMap[S.selectedTemplateId] : null;
    if (!tpl) {
      return '<div class="wcp-empty-state" style="height:100%;justify-content:center">' +
        '<div class="wcp-empty-state-icon">' + icon('clipboard-list') + '</div>' +
        '<div class="wcp-empty-state-title">Select a template to view & edit</div>' +
        '<div class="wcp-empty-state-text">Choose a template from the list, or create a new one.</div></div>';
    }
    var linkedType = S.contentTypeMap[tpl.content_type_id];
    var sections = tpl.sections || [];
    var html = '<div class="wcp-detail-header">';
    html += '<div class="wcp-step-title-row">';
    html += '<h2>' + esc(tpl.name) + '</h2>';
    if (linkedType) html += badge(linkedType.name, linkedType.color || '#80868b');
    html += badge('→ CW Blueprint', 'var(--wcp-teal)');
    html += '</div>';
    html += '<div class="wcp-step-actions">';
    html += '<span class="wcp-text-sm wcp-text-muted">Used ' + (tpl.uses_count || 0) + '×</span>';
    html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="delete-template" data-id="' + esc(tpl.id) + '" title="Delete">' + icon('trash') + '</button>';
    html += '</div></div>';

    html += '<div class="wcp-detail-body">';
    // Editable name + description
    html += '<div class="wcp-form-group"><label>Template Name</label>';
    html += '<input type="text" class="wcp-input wcp-info-preview-field" id="wcpTplName" value="' + esc(tpl.name) + '"></div>';
    html += '<div class="wcp-form-group"><label>Description</label>';
    html += '<textarea class="wcp-textarea wcp-info-preview-field" id="wcpTplDesc" rows="2">' + esc(tpl.description || '') + '</textarea></div>';

    // Sections (inline editor)
    html += '<div class="wcp-form-group" style="margin-bottom:var(--wcp-space-2)"><label>Sections (' + sections.length + ')</label></div>';
    html += '<div id="tplSectionsContainer">';
    for (var si = 0; si < sections.length; si++) {
      html += renderTemplateSectionEditor(sections[si], si);
    }
    html += '</div>';
    html += '<button class="wcp-btn wcp-btn-outline wcp-btn-sm" data-action="tpl-add-section" style="width:100%;border-style:dashed;margin-top:var(--wcp-space-2)">' + icon('plus') + ' Add Section</button>';

    // Save button
    html += '<div style="margin-top:var(--wcp-space-4);display:flex;gap:var(--wcp-space-2)">';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="save-template-inline" data-id="' + esc(tpl.id) + '">' + icon('check') + ' Save Template</button>';
    html += '</div>';

    html += '</div>';
    return html;
  }

