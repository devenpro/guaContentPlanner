  // ============================================================
  // SECTION 15: EVENT HANDLERS
  // ============================================================

  function setupPart2AEvents() {
    var ns = '.wcp2a';

    // ── Modal close ──
    $(document).off('click' + ns + '-mc').on('click' + ns + '-mc', '[data-action="close-modal"]', function() { closeModal(); });
    $(document).off('click' + ns + '-ms').on('click' + ns + '-ms', '[data-action="modal-save"]', function() {
      if (currentModal && currentModal.onSave) currentModal.onSave();
    });

    // ── Backdrop click closes modal ──
    $(document).off('click' + ns + '-mb').on('click' + ns + '-mb', '.wcp-modal-backdrop', function(e) {
      if ($(e.target).hasClass('wcp-modal-backdrop')) closeModal();
    });

    // ── Pipeline step navigation ──
    $(document).off('click' + ns + '-gs').on('click' + ns + '-gs', '[data-action="goto-step"]', function() {
      var step = $(this).data('step');
      if (step && S.currentStep !== step) {
        S.currentStep = step;
        render();
        if (window._wcpLocation) window._wcpLocation.capture();
      }
    });
    $(document).off('click' + ns + '-ps').on('click' + ns + '-ps', '[data-action="prev-step"]', function() {
      var keys = Constants.PIPELINE_STEPS.map(function(s) { return s.key; });
      var idx = keys.indexOf(S.currentStep);
      if (idx > 0) { S.currentStep = keys[idx - 1]; render(); if (window._wcpLocation) window._wcpLocation.capture(); }
    });
    $(document).off('click' + ns + '-ns').on('click' + ns + '-ns', '[data-action="next-step"]', function() {
      var keys = Constants.PIPELINE_STEPS.map(function(s) { return s.key; });
      var idx = keys.indexOf(S.currentStep);
      if (idx < keys.length - 1) { S.currentStep = keys[idx + 1]; render(); if (window._wcpLocation) window._wcpLocation.capture(); }
    });

    // ── Undo/Redo ──
    $(document).off('click' + ns + '-un').on('click' + ns + '-un', '[data-action="undo"]', function() { undo(); });
    $(document).off('click' + ns + '-re').on('click' + ns + '-re', '[data-action="redo"]', function() { redo(); });

    // ── Keyboard shortcuts ──
    $(document).off('keydown' + ns + '-kb').on('keydown' + ns + '-kb', function(e) {
      // Escape closes modal
      if (e.key === 'Escape') {
        if ($('.wcp-confirm-backdrop').length) { closeConfirmDialog(); return; }
        if ($('.wcp-modal-backdrop').length) { closeModal(); return; }
      }
      // Ctrl+Z / Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
      }
    });

    // ── Color picker in modals ──
    $(document).off('click' + ns + '-cp').on('click' + ns + '-cp', '[data-action="pick-color"]', function() {
      var $sw = $(this);
      var color = $sw.data('color');
      $sw.closest('.wcp-color-picker').find('.wcp-color-swatch').removeClass('wcp-color-swatch-active');
      $sw.addClass('wcp-color-swatch-active');
      $sw.closest('.wcp-color-picker').find('input[data-field="color"]').val(color);
    });

    // ── Inline field save (blur on text inputs, change on selects) ──
    $(document).off('blur' + ns + '-sf').on('blur' + ns + '-sf', '.wcp-step-field', function() {
      var $el = $(this);
      var path = $el.data('path');
      if (!path || !S.selectedContentId) return;
      // Textareas flagged with data-lines="1" split their value by newlines and
      // save as an array. Empty lines + trailing whitespace are dropped.
      var isLines = ($el.data('lines') === 1 || $el.data('lines') === '1');
      var val;
      if (isLines) {
        var raw = String($el.val() || '');
        val = raw.split(/\r?\n/).map(function(l) { return l.trim(); }).filter(Boolean);
      } else if ($el.is(':checkbox')) {
        val = $el.is(':checked');
      } else if ($el.attr('type') === 'number') {
        var n = parseInt($el.val(), 10);
        val = isNaN(n) ? 0 : n;
      } else {
        val = $el.val();
      }
      saveContentField(S.selectedContentId, path, val);
      maybeAdvanceStatus(S.contentMap[S.selectedContentId], path + ' updated');
    });
    $(document).off('change' + ns + '-sc').on('change' + ns + '-sc', '.wcp-step-field', function() {
      var $el = $(this);
      if ($el.is('select')) {
        var path = $el.data('path');
        if (!path || !S.selectedContentId) return;
        var val = $el.val();
        var c = S.contentMap[S.selectedContentId];

        // hub_id / cluster_id go through the relationship helpers so cluster
        // back-refs and hub pillar refs stay consistent. saveContentField()
        // handles anything else + the persistence + render roundtrip.
        // `render` is the Part-1 exported re-render (window._wcpRender);
        // renderCurrentView is Part 1 internal and NOT in Part 2A scope.
        if (path === 'hub_id' && c) {
          assignContentToHub(c, val);
          c.updated = new Date().toISOString();
          snapshot('Hub changed'); buildMaps(); syncToTextarea(); render();
        } else if (path === 'cluster_id' && c) {
          assignContentToCluster(c, val);
          c.updated = new Date().toISOString();
          snapshot('Cluster changed'); buildMaps(); syncToTextarea(); render();
        } else {
          saveContentField(S.selectedContentId, path, val);
        }
        maybeAdvanceStatus(S.contentMap[S.selectedContentId], path + ' updated');
      }
    });

    // ── Content type selector ──
    $(document).off('click' + ns + '-ct').on('click' + ns + '-ct', '[data-action="set-content-type"]', function() {
      var typeId = $(this).data('type-id');
      if (!S.selectedContentId) return;
      saveContentField(S.selectedContentId, 'content_type_id', typeId);
      snapshot('Content type changed'); render();
    });

    // ── Priority selector (pill buttons) ──
    $(document).off('click' + ns + '-pr').on('click' + ns + '-pr', '[data-action="set-priority"]', function() {
      var priority = $(this).data('priority');
      if (!S.selectedContentId) return;
      saveContentField(S.selectedContentId, 'priority', priority);
      snapshot('Priority changed'); render();
    });

    // ── Info section collapse/expand ──
    // Collapse/expand sub-sections — pure class toggle. Animation is done
    // entirely in CSS (max-height + opacity transitions on .wcp-info-section-body),
    // so the first click always registers. Previously used slideToggle which
    // raced against the CSS `display: none` rule on .wcp-info-collapsed.
    $(document).off('click' + ns + '-is').on('click' + ns + '-is', '[data-action="toggle-info-section"]', function() {
      var $section = $(this).closest('.wcp-info-section');
      $section.toggleClass('wcp-info-collapsed');
    });

    // ── Search intent selector ──
    $(document).off('click' + ns + '-si').on('click' + ns + '-si', '[data-action="set-intent"]', function() {
      var intent = $(this).data('intent');
      if (!S.selectedContentId) return;
      saveContentField(S.selectedContentId, 'basic_info.search_intent', intent);
      snapshot('Intent changed'); render();
    });

    // ── Funnel stage selector ──
    $(document).off('click' + ns + '-fs').on('click' + ns + '-fs', '[data-action="set-funnel"]', function() {
      var funnel = $(this).data('funnel');
      if (!S.selectedContentId) return;
      saveContentField(S.selectedContentId, 'basic_info.funnel_stage', funnel);
      snapshot('Funnel stage changed'); render();
    });

    // ── SERP target toggle ──
    $(document).off('change' + ns + '-sp').on('change' + ns + '-sp', '[data-action="toggle-serp"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.basic_info = c.basic_info || {};
      var targets = c.basic_info.serp_targets || [];
      var serp = $(this).data('serp');
      var idx = targets.indexOf(serp);
      if (idx > -1) targets.splice(idx, 1);
      else targets.push(serp);
      c.basic_info.serp_targets = targets;
      c.updated = new Date().toISOString();
      buildMaps(); syncToTextarea(); render();
    });

    // ── Angle: select ──
    $(document).off('change' + ns + '-sa').on('change' + ns + '-sa', '[data-action="select-angle"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.research) return;
      var angles = c.research.angles || [];
      angles.forEach(function(a, i) { a.selected = (i === index); });
      c.research.selected_angle = angles[index] ? angles[index].angle : '';
      c.updated = new Date().toISOString();
      snapshot('Angle selected');
      maybeAdvanceStatus(c, 'angle selected');
      buildMaps(); syncToTextarea(); render();
    });

    // ── Angle: add manual ──
    $(document).off('click' + ns + '-am').on('click' + ns + '-am', '[data-action="add-angle-manual"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.research = c.research || { angles: [], selected_angle: '', competitor_analysis: '', uvp: '', eeat_plan: '', questions: [] };
      c.research.angles.push({ id: generateId('ang'), angle: '', description: '', selected: false });
      c.updated = new Date().toISOString();
      buildMaps(); syncToTextarea(); render();
      // Focus the new empty angle input
      setTimeout(function() { $('.wcp-radio-list .wcp-radio-title:last').attr('contenteditable', 'true').focus(); }, 50);
    });

    // ── Angle: remove ──
    $(document).off('click' + ns + '-ra').on('click' + ns + '-ra', '[data-action="remove-angle"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.research || !c.research.angles) return;
      var wasSelected = c.research.angles[index] && c.research.angles[index].selected;
      c.research.angles.splice(index, 1);
      if (wasSelected) c.research.selected_angle = '';
      c.updated = new Date().toISOString();
      snapshot('Angle removed'); buildMaps(); syncToTextarea(); render();
    });

    // ── Angle custom input save ──
    $(document).off('blur' + ns + '-ac').on('blur' + ns + '-ac', '.wcp-angle-custom', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.research = c.research || {};
      c.research.angle_custom_input = $(this).val();
      c.updated = new Date().toISOString();
      syncToTextarea();
    });

    // ── Question: add manual ──
    $(document).off('click' + ns + '-qm').on('click' + ns + '-qm', '[data-action="add-question-manual"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.research = c.research || {};
      c.research.questions = c.research.questions || [];
      c.research.questions.push({ question: '', category: '' });
      c.updated = new Date().toISOString();
      buildMaps(); syncToTextarea(); render();
    });

    // ── Question: remove ──
    $(document).off('click' + ns + '-rq').on('click' + ns + '-rq', '[data-action="remove-question"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.research || !c.research.questions) return;
      c.research.questions.splice(index, 1);
      c.updated = new Date().toISOString();
      snapshot('Question removed'); buildMaps(); syncToTextarea(); render();
    });

    // ── Headline: select ──
    $(document).off('change' + ns + '-sh').on('change' + ns + '-sh', '[data-action="select-headline"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.headline) return;
      var headlines = c.headline.headlines || [];
      var h = headlines[index];
      var hText = typeof h === 'string' ? h : (h.text || h.headline || '');
      c.headline.selected_headline = hText;
      c.updated = new Date().toISOString();
      snapshot('Headline selected');
      maybeAdvanceStatus(c, 'headline selected');
      buildMaps(); syncToTextarea(); render();
    });

    // ── Headline: remove ──
    $(document).off('click' + ns + '-rh').on('click' + ns + '-rh', '[data-action="remove-headline"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.headline || !c.headline.headlines) return;
      var removed = c.headline.headlines[index];
      var removedText = typeof removed === 'string' ? removed : (removed.text || removed.headline || '');
      c.headline.headlines.splice(index, 1);
      if (c.headline.selected_headline === removedText) c.headline.selected_headline = '';
      c.updated = new Date().toISOString();
      snapshot('Headline removed'); buildMaps(); syncToTextarea(); render();
    });

    // ── Keywords: add via Enter key ──
    $(document).off('keydown' + ns + '-ka').on('keydown' + ns + '-ka', '.wcp-kw-add-input', function(e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      var $inp = $(this);
      var val = $inp.val().trim();
      if (!val || !S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.keywords = c.keywords || {};
      var kwType = $inp.data('kw-type');
      if (kwType === 'secondary') {
        c.keywords.secondary = c.keywords.secondary || [];
        c.keywords.secondary.push(val);
      } else if (kwType === 'lsi') {
        c.keywords.lsi = c.keywords.lsi || [];
        c.keywords.lsi.push(val);
      }
      c.updated = new Date().toISOString();
      snapshot('Keyword added'); buildMaps(); syncToTextarea(); render();
    });

    // ── Keywords: remove pill ──
    $(document).off('click' + ns + '-kr').on('click' + ns + '-kr', '[data-action="remove-keyword"]', function() {
      var index = parseInt($(this).data('index'), 10);
      var kwType = $(this).data('kw-type');
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.keywords) return;
      if (kwType === 'secondary' && c.keywords.secondary) c.keywords.secondary.splice(index, 1);
      else if (kwType === 'lsi' && c.keywords.lsi) c.keywords.lsi.splice(index, 1);
      c.updated = new Date().toISOString();
      snapshot('Keyword removed'); buildMaps(); syncToTextarea(); render();
    });

    // ── Keyword Group: link to content ──
    $(document).off('click' + ns + '-lkg').on('click' + ns + '-lkg', '[data-action="link-keyword-group"]', function() {
      var contentId = $(this).data('content-id');
      var groupId = $('#wcpLinkKwGroup').val();
      if (!groupId || !contentId) { toast('Select a keyword group', 'warning'); return; }
      var grp = S.keywordGroupMap[groupId];
      var cnt = S.contentMap[contentId];
      if (!grp || !cnt) return;
      // Link the group
      grp.content_id = contentId;
      grp.updated = new Date().toISOString();
      // Copy keywords to content
      var pk = grp.keywords[grp.primary_keyword_index || 0] || grp.keywords[0];
      if (pk && (!cnt.keywords.primary || !cnt.keywords.primary.keyword)) {
        cnt.keywords.primary = { keyword: pk.keyword, volume: pk.volume || 0, difficulty: pk.difficulty || '' };
      }
      // Add remaining as secondary (avoid duplicates)
      var existingSecondary = (cnt.keywords.secondary || []).map(function(s) { return (typeof s === 'string' ? s : s.keyword || '').toLowerCase(); });
      grp.keywords.forEach(function(k, i) {
        if (i === (grp.primary_keyword_index || 0)) return;
        if (existingSecondary.indexOf(k.keyword.toLowerCase()) === -1) {
          cnt.keywords.secondary = cnt.keywords.secondary || [];
          cnt.keywords.secondary.push({ keyword: k.keyword, volume: k.volume || 0, difficulty: k.difficulty || '' });
        }
      });
      cnt.updated = new Date().toISOString();
      snapshot('Link keyword group'); buildMaps(); syncToTextarea(); render();
      toast('Linked "' + grp.name + '" — ' + grp.keywords.length + ' keywords applied', 'success');
    });

    // ── Keyword Group: unlink from content ──
    $(document).off('click' + ns + '-ukg').on('click' + ns + '-ukg', '[data-action="unlink-keyword-group"]', function() {
      var groupId = $(this).data('group-id');
      var grp = S.keywordGroupMap[groupId];
      if (!grp) return;
      grp.content_id = '';
      grp.updated = new Date().toISOString();
      snapshot('Unlink keyword group'); buildMaps(); syncToTextarea(); render();
      toast('Keyword group unlinked', 'info');
    });

    // ── Tag: add to content via legacy <select> (kept for backwards compat
    //   with any view that still renders the old selector) ──
    $(document).off('change' + ns + '-ta').on('change' + ns + '-ta', '[data-action="add-tag-to-content"]', function() {
      var tagId = $(this).val();
      var contextId = $(this).data('context');
      if (!tagId || !contextId) return;
      var c = S.contentMap[contextId];
      if (!c) return;
      c.tags = c.tags || [];
      if (c.tags.indexOf(tagId) === -1) {
        c.tags.push(tagId);
        c.updated = new Date().toISOString();
        snapshot('Tag added'); buildMaps(); syncToTextarea(); render();
      }
    });

    // ── Tag: inline create-or-attach (Enter or comma in the tag input) ──
    // If the typed name matches an existing tag (case-insensitive) we attach
    // that tag; otherwise we create a brand-new tag in the General group and
    // attach it. Fast path for content editors — no modal detour required.
    $(document).off('keydown' + ns + '-tak').on('keydown' + ns + '-tak', '[data-action="add-tag-inline"]', function(e) {
      if (e.key !== 'Enter' && e.key !== ',') return;
      e.preventDefault();
      var $input = $(this);
      var raw = ($input.val() || '').replace(/,/g, '').trim();
      if (!raw) return;
      var contextId = $input.data('context');
      if (!contextId) return;
      var c = S.contentMap[contextId];
      if (!c) return;
      c.tags = c.tags || [];

      // Try to match an existing tag by (case-insensitive) name
      var existing = null;
      var all = (S.data && S.data.tags) || [];
      var needle = raw.toLowerCase();
      for (var ei = 0; ei < all.length; ei++) {
        if ((all[ei].name || '').toLowerCase() === needle) { existing = all[ei]; break; }
      }

      if (existing) {
        if (c.tags.indexOf(existing.id) === -1) {
          c.tags.push(existing.id);
          logActivity('tag_added_to_content', c.id, c.title, 'Tagged with "' + existing.name + '"');
        }
      } else {
        // Create a new tag on the fly — a rotating palette picks a color so
        // fresh tags don't all come out the same gray.
        var palette = (Constants.HUB_COLORS || []).map(function(h) { return h.color; });
        var color = palette[((S.data.tags || []).length) % (palette.length || 1)] || '#6b7280';
        var newTag = {
          id: generateId('tag'),
          name: raw,
          color: color,
          group: 'General',
          description: '',
          created: new Date().toISOString()
        };
        S.data.tags = S.data.tags || [];
        S.data.tags.push(newTag);
        c.tags.push(newTag.id);
        logActivity('tag_created', newTag.id, newTag.name, 'Tag created (inline) and applied to content');
      }
      c.updated = new Date().toISOString();
      snapshot('Tag added'); buildMaps(); syncToTextarea(); render();
    });

    // Also attach on blur if user typed something and clicked away
    $(document).off('blur' + ns + '-tab').on('blur' + ns + '-tab', '[data-action="add-tag-inline"]', function() {
      var val = ($(this).val() || '').trim();
      if (!val) return;
      $(this).trigger($.Event('keydown', { key: 'Enter' }));
    });

    // ── Tag: remove from content ──
    $(document).off('click' + ns + '-tr').on('click' + ns + '-tr', '[data-action="remove-tag-from-content"]', function() {
      var tagId = $(this).data('tag-id');
      var contextId = $(this).data('context');
      if (!tagId || !contextId) return;
      var c = S.contentMap[contextId];
      if (!c) return;
      c.tags = (c.tags || []).filter(function(t) { return t !== tagId; });
      c.updated = new Date().toISOString();
      snapshot('Tag removed'); buildMaps(); syncToTextarea(); render();
    });

    // ── Outline: add section ──
    $(document).off('click' + ns + '-oa').on('click' + ns + '-oa', '[data-action="add-outline-section"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.outline = c.outline || { sections: [], approved: false };
      c.outline.sections.push({ heading: '', level: 'H2', word_count: 0, section_type: 'body', key_points: '', target_keywords: [], schema_type: '', snippet_target: '' });
      c.updated = new Date().toISOString();
      snapshot('Section added'); buildMaps(); syncToTextarea(); render();
    });

    // ── Outline: remove section ──
    $(document).off('click' + ns + '-or').on('click' + ns + '-or', '[data-action="remove-outline-section"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.outline || !c.outline.sections) return;
      c.outline.sections.splice(index, 1);
      c.updated = new Date().toISOString();
      snapshot('Section removed'); buildMaps(); syncToTextarea(); render();
    });

    // ── Outline: heading blur save ──
    $(document).off('blur' + ns + '-oh').on('blur' + ns + '-oh', '[data-action="outline-heading"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.outline || !c.outline.sections || !c.outline.sections[index]) return;
      c.outline.sections[index].heading = $(this).val();
      c.updated = new Date().toISOString();
      syncToTextarea();
    });

    // ── Outline: word count blur save ──
    $(document).off('blur' + ns + '-ow').on('blur' + ns + '-ow', '[data-action="outline-words"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.outline || !c.outline.sections || !c.outline.sections[index]) return;
      c.outline.sections[index].word_count = parseInt($(this).val(), 10) || 0;
      c.updated = new Date().toISOString();
      syncToTextarea(); render();
    });

    // ── Outline: cycle level H2→H3→H4→H2 ──
    $(document).off('click' + ns + '-ol').on('click' + ns + '-ol', '[data-action="cycle-outline-level"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.outline || !c.outline.sections || !c.outline.sections[index]) return;
      var levels = ['H2', 'H3', 'H4'];
      var cur = levels.indexOf(c.outline.sections[index].level || 'H2');
      c.outline.sections[index].level = levels[(cur + 1) % 3];
      c.updated = new Date().toISOString();
      syncToTextarea(); render();
    });

    // ── Outline: edit section (modal) ──
    $(document).off('click' + ns + '-oe').on('click' + ns + '-oe', '[data-action="edit-outline-section"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.outline || !c.outline.sections || !c.outline.sections[index]) return;
      var sec = c.outline.sections[index];
      var sectionTypes = ['intro', 'body', 'conclusion', 'faq', 'cta', 'comparison', 'case_study'];
      var mHtml = '<div class="wcp-section-edit">';
      mHtml += '<div class="wcp-form-group"><label>Heading</label><input type="text" class="wcp-input" data-field="heading" value="' + esc(sec.heading || '') + '"></div>';
      mHtml += '<div class="wcp-form-row"><div class="wcp-form-half"><label>Level</label><div class="wcp-level-selector">';
      var levels = ['H2', 'H3', 'H4'];
      for (var li = 0; li < levels.length; li++) {
        mHtml += '<button class="wcp-level-btn' + (sec.level === levels[li] ? ' wcp-level-btn-active' : '') + '" data-action="pick-level" data-level="' + levels[li] + '">' + levels[li] + '</button>';
      }
      mHtml += '<input type="hidden" data-field="level" value="' + esc(sec.level || 'H2') + '">';
      mHtml += '</div></div><div class="wcp-form-half"><label>Est. Words</label>';
      mHtml += '<input type="number" class="wcp-input" data-field="word_count" value="' + (sec.word_count || '') + '"></div></div>';
      mHtml += '<div class="wcp-form-group"><label>Section Type</label><div class="wcp-section-type-selector">';
      for (var sti = 0; sti < sectionTypes.length; sti++) {
        var st = sectionTypes[sti];
        var stLabel = st.replace('_', ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
        mHtml += '<button class="wcp-section-type-btn' + (sec.section_type === st ? ' wcp-section-type-btn-active' : '') + '" data-action="pick-section-type" data-stype="' + st + '">' + stLabel + '</button>';
      }
      mHtml += '<input type="hidden" data-field="section_type" value="' + esc(sec.section_type || 'body') + '">';
      mHtml += '</div></div>';
      mHtml += '<div class="wcp-form-group"><label>Key Points</label><textarea class="wcp-textarea" data-field="key_points" rows="3" placeholder="Main points to cover...">' + esc(sec.key_points || '') + '</textarea></div>';
      mHtml += '<div class="wcp-form-group"><label>Schema Type</label><input type="text" class="wcp-input" data-field="schema_type" value="' + esc(sec.schema_type || '') + '" placeholder="e.g. FAQ, HowTo..."></div>';
      mHtml += '<div class="wcp-form-group"><label>Snippet Target</label><input type="text" class="wcp-input" data-field="snippet_target" value="' + esc(sec.snippet_target || '') + '" placeholder="e.g. Featured Snippet, PAA..."></div>';
      mHtml += '</div>';
      openModal('Edit Section — ' + esc(sec.heading || 'New Section'), mHtml, {
        size: 'md',
        saveLabel: 'Save Section',
        onSave: function() {
          var fields = collectModalFields();
          sec.heading = fields.heading || '';
          sec.level = fields.level || 'H2';
          sec.word_count = parseInt(fields.word_count, 10) || 0;
          sec.section_type = fields.section_type || 'body';
          sec.key_points = fields.key_points || '';
          sec.schema_type = fields.schema_type || '';
          sec.snippet_target = fields.snippet_target || '';
          c.updated = new Date().toISOString();
          snapshot('Section edited'); buildMaps(); closeModal(); syncToTextarea(); render();
          toast('Section updated', 'success');
        }
      });
    });

    // ── Outline: level picker in modal ──
    $(document).off('click' + ns + '-lp').on('click' + ns + '-lp', '[data-action="pick-level"]', function() {
      var $btn = $(this);
      $btn.closest('.wcp-level-selector').find('.wcp-level-btn').removeClass('wcp-level-btn-active');
      $btn.addClass('wcp-level-btn-active');
      $btn.closest('.wcp-level-selector').find('input[data-field="level"]').val($btn.data('level'));
    });

    // ── Outline: section type picker in modal ──
    $(document).off('click' + ns + '-st').on('click' + ns + '-st', '[data-action="pick-section-type"]', function() {
      var $btn = $(this);
      $btn.closest('.wcp-section-type-selector').find('.wcp-section-type-btn').removeClass('wcp-section-type-btn-active');
      $btn.addClass('wcp-section-type-btn-active');
      $btn.closest('.wcp-section-type-selector').find('input[data-field="section_type"]').val($btn.data('stype'));
    });

    // ── Outline: toggle approval ──
    $(document).off('click' + ns + '-ap').on('click' + ns + '-ap', '[data-action="toggle-outline-approval"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.outline) return;
      c.outline.approved = !c.outline.approved;
      c.updated = new Date().toISOString();
      snapshot(c.outline.approved ? 'Outline approved' : 'Outline unlocked');
      if (c.outline.approved) maybeAdvanceStatus(c, 'outline approved');
      buildMaps(); syncToTextarea(); render();
      toast(c.outline.approved ? 'Outline approved' : 'Outline unlocked', 'success');
    });

    // ── Outline: drag and drop reorder ──
    var dragIdx = null;
    $(document).off('dragstart' + ns + '-ds').on('dragstart' + ns + '-ds', '.wcp-outline-row[draggable="true"]', function(e) {
      dragIdx = parseInt($(this).data('index'), 10);
      $(this).addClass('wcp-outline-row-dragging');
      e.originalEvent.dataTransfer.effectAllowed = 'move';
    });
    $(document).off('dragover' + ns + '-do').on('dragover' + ns + '-do', '.wcp-outline-row', function(e) {
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = 'move';
      $(this).addClass('wcp-outline-row-drop-target');
    });
    $(document).off('dragleave' + ns + '-dl').on('dragleave' + ns + '-dl', '.wcp-outline-row', function() {
      $(this).removeClass('wcp-outline-row-drop-target');
    });
    $(document).off('drop' + ns + '-dp').on('drop' + ns + '-dp', '.wcp-outline-row', function(e) {
      e.preventDefault();
      $(this).removeClass('wcp-outline-row-drop-target');
      var dropIdx = parseInt($(this).data('index'), 10);
      if (dragIdx === null || dragIdx === dropIdx || !S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.outline || !c.outline.sections) return;
      var moved = c.outline.sections.splice(dragIdx, 1)[0];
      c.outline.sections.splice(dropIdx, 0, moved);
      c.updated = new Date().toISOString();
      snapshot('Section reordered'); buildMaps(); syncToTextarea(); render();
    });
    $(document).off('dragend' + ns + '-de').on('dragend' + ns + '-de', '.wcp-outline-row', function() {
      dragIdx = null;
      $('.wcp-outline-row').removeClass('wcp-outline-row-dragging wcp-outline-row-drop-target');
    });

    // ── Schema: toggle type ──
    $(document).off('change' + ns + '-ss').on('change' + ns + '-ss', '[data-action="toggle-schema"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.aeo_gseo = c.aeo_gseo || {};
      var types = c.aeo_gseo.schema_types || [];
      var schema = $(this).data('schema');
      var idx = types.indexOf(schema);
      if (idx > -1) types.splice(idx, 1);
      else types.push(schema);
      c.aeo_gseo.schema_types = types;
      c.updated = new Date().toISOString();
      maybeAdvanceStatus(c, 'schema updated');
      buildMaps(); syncToTextarea(); render();
    });

    // ── E-E-A-T: set status ──
    $(document).off('change' + ns + '-ee').on('change' + ns + '-ee', '[data-action="set-eeat"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.aeo_gseo = c.aeo_gseo || {};
      c.aeo_gseo.eeat_status = c.aeo_gseo.eeat_status || {};
      c.aeo_gseo.eeat_status[$(this).data('eeat-key')] = $(this).val();
      c.updated = new Date().toISOString();
      syncToTextarea();
    });

    // ── Q&A: add block ──
    $(document).off('click' + ns + '-qa').on('click' + ns + '-qa', '[data-action="add-qa"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.aeo_gseo = c.aeo_gseo || {};
      c.aeo_gseo.qa_blocks = c.aeo_gseo.qa_blocks || [];
      c.aeo_gseo.qa_blocks.push({ question: '', answer: '', schema_ready: false });
      c.updated = new Date().toISOString();
      snapshot('Q&A added');
      maybeAdvanceStatus(c, 'Q&A block added');
      buildMaps(); syncToTextarea(); render();
    });

    // ── Q&A: remove block ──
    $(document).off('click' + ns + '-qr').on('click' + ns + '-qr', '[data-action="remove-qa"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.aeo_gseo || !c.aeo_gseo.qa_blocks) return;
      c.aeo_gseo.qa_blocks.splice(index, 1);
      c.updated = new Date().toISOString();
      snapshot('Q&A removed'); buildMaps(); syncToTextarea(); render();
    });

    // ── Q&A: save question/answer on blur ──
    $(document).off('blur' + ns + '-qq').on('blur' + ns + '-qq', '[data-action="qa-question"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.aeo_gseo || !c.aeo_gseo.qa_blocks || !c.aeo_gseo.qa_blocks[index]) return;
      c.aeo_gseo.qa_blocks[index].question = $(this).val();
      c.updated = new Date().toISOString();
      syncToTextarea();
    });
    $(document).off('blur' + ns + '-qw').on('blur' + ns + '-qw', '[data-action="qa-answer"]', function() {
      var index = parseInt($(this).data('index'), 10);
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c || !c.aeo_gseo || !c.aeo_gseo.qa_blocks || !c.aeo_gseo.qa_blocks[index]) return;
      c.aeo_gseo.qa_blocks[index].answer = $(this).val();
      c.aeo_gseo.qa_blocks[index].schema_ready = !!($(this).val() && c.aeo_gseo.qa_blocks[index].question);
      c.updated = new Date().toISOString();
      syncToTextarea();
    });

    // ── Export: mark export ready ──
    $(document).off('click' + ns + '-er').on('click' + ns + '-er', '[data-action="mark-export-ready"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      var oldLabel = (Constants.CONTENT_STATUSES[c.status] || {}).label || c.status;
      c.status = 'export_ready';
      c.updated = new Date().toISOString();
      logActivity('content_status_changed', c.id, c.title, oldLabel + ' → Export Ready (manual)');
      snapshot('Marked export ready'); buildMaps(); syncToTextarea(); render();
      toast('Marked as Export Ready', 'success');
    });

    // ── Export: preview JSON ──
    $(document).off('click' + ns + '-ep').on('click' + ns + '-ep', '[data-action="preview-export-json"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      var exportData = buildExportJson(c);
      var jsonStr = JSON.stringify(exportData, null, 2);
      var linksCount = (exportData.content && exportData.content.internal_links) ? exportData.content.internal_links.length : 0;
      var body = '<div class="wcp-export-preview-actions">';
      body += '<div class="wcp-export-preview-meta">';
      body += icon('link') + ' <strong>' + linksCount + '</strong> internal link' + (linksCount !== 1 ? 's' : '') + ' included';
      body += '</div>';
      body += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="copy-export-json">' + icon('copy') + ' Copy JSON</button>';
      body += '</div>';
      body += '<div class="wcp-export-preview"><pre class="wcp-export-json" id="wcpExportJsonPre">' + esc(jsonStr) + '</pre></div>';
      openModal('Export Preview — ' + esc(c.title), body, { size: 'lg', footer: false });
    });

    // ── Export: copy JSON to clipboard (works from both Preview + Export Complete modals) ──
    $(document).off('click' + ns + '-cpy').on('click' + ns + '-cpy', '[data-action="copy-export-json"]', function() {
      var $pre = $('#wcpExportJsonPre');
      if (!$pre.length) { toast('No JSON to copy', 'warning'); return; }
      var text = $pre.text();
      // Prefer the modern clipboard API; fall back to execCommand for older browsers
      var done = function() { toast('JSON copied to clipboard', 'success'); };
      var fail = function() { toast('Copy failed — select the text manually', 'error'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function() {
          _fallbackCopyText(text) ? done() : fail();
        });
      } else {
        _fallbackCopyText(text) ? done() : fail();
      }
    });

    // ── Export: copy JSON ──
    $(document).off('click' + ns + '-ec').on('click' + ns + '-ec', '[data-action="copy-export-json"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      var exportData = buildExportJson(c);
      var jsonStr = JSON.stringify(exportData, null, 2);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(jsonStr).then(function() { toast('JSON copied to clipboard', 'success'); });
      } else {
        var $ta = $('<textarea>').val(jsonStr).appendTo('body').select();
        document.execCommand('copy');
        $ta.remove();
        toast('JSON copied to clipboard', 'success');
      }
    });

    // ── Export: export to CW ──
    $(document).off('click' + ns + '-ex').on('click' + ns + '-ex', '[data-action="export-to-cw"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.export = c.export || {};
      c.export.exported_at = new Date().toISOString();
      c.export.export_version = (parseInt(c.export.export_version || '0', 10) + 1).toString();
      c.status = 'exported';
      c.updated = new Date().toISOString();
      // Flip any selected internal links to 'exported' — committed intent
      // becomes committed production.
      if (typeof window._wcpFlipContentLinksToExported === 'function') {
        window._wcpFlipContentLinksToExported(c.id);
      }
      logActivity('content_exported', c.id, c.title, 'Exported to Content Writer v' + c.export.export_version);
      snapshot('Exported'); buildMaps(); syncToTextarea(); render();
      toast('Exported to Content Writer', 'success');
      // Show JSON preview
      var exportData = buildExportJson(c);
      var bodyHtml = '<div class="wcp-success-strip" style="margin-bottom:var(--wcp-space-3)">' + icon('circle-check') + ' Successfully exported v' + esc(c.export.export_version) + '</div>';
      bodyHtml += '<div class="wcp-export-preview-actions"><div></div>';
      bodyHtml += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="copy-export-json">' + icon('copy') + ' Copy JSON</button></div>';
      bodyHtml += '<div class="wcp-export-preview"><pre class="wcp-export-json" id="wcpExportJsonPre">' + esc(JSON.stringify(exportData, null, 2)) + '</pre></div>';
      openModal('Export Complete', bodyHtml, { size: 'lg', footer: false });
    });

    // ── Create in Content Writer (opens CW in new tab with URL params) ──
    $(document).off('click' + ns + '-cw').on('click' + ns + '-cw', '[data-action="create-in-cw"]', function() {
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      var url = buildContentWriterURL(c);
      window.open(url, '_blank');
      var now = new Date().toISOString();
      c.export = c.export || {};
      c.export.exported_at = now;
      c.export.export_version = (parseInt(c.export.export_version || '0', 10) + 1).toString();
      c.status = 'exported';
      c.updated = now;
      if (typeof window._wcpFlipContentLinksToExported === 'function') {
        window._wcpFlipContentLinksToExported(c.id);
      }

      // Upsert a content_writer_links row so the "Open in CW" button appears
      // immediately in-session — without waiting for the next page reload to
      // pick it up from the Drupal view.
      S.data.content_writer_links = S.data.content_writer_links || [];
      var links = S.data.content_writer_links;
      var found = false;
      for (var li = 0; li < links.length; li++) {
        if (links[li].planner_id === c.id) {
          links[li].url = url;
          links[li].title = c.title || links[li].title;
          links[li].updated = now;
          links[li].last_seen = now;
          if (!links[li].status) links[li].status = 'draft';
          found = true;
          break;
        }
      }
      if (!found) {
        links.push({
          planner_id: c.id,
          cw_node_id: '',
          title:      c.title || '',
          url:        url,
          status:     'draft',
          created:    now,
          updated:    now,
          director:   '',
          last_seen:  now
        });
      }

      logActivity('content_exported', c.id, c.title, 'Created in Content Writer');
      snapshot('Created in CW'); buildMaps(); syncToTextarea(); render();
      toast('Content Writer opened in new tab', 'success');
    });

    // ── Schema direction toggle (Direction step) ──
    $(document).off('change' + ns + '-sd').on('change' + ns + '-sd', '[data-action="toggle-schema-direction"]', function() {
      var schema = $(this).data('schema');
      if (!S.selectedContentId) return;
      var c = S.contentMap[S.selectedContentId];
      if (!c) return;
      c.direction = c.direction || { schema_direction: [] };
      c.direction.schema_direction = c.direction.schema_direction || [];
      var arr = c.direction.schema_direction;
      var idx = arr.indexOf(schema);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push(schema);
      c.updated = new Date().toISOString();
      saveContentField(S.selectedContentId, 'direction.schema_direction', arr);
      maybeAdvanceStatus(c, 'schema direction updated');
      snapshot('Schema direction'); render();
    });

    // ════════════════════════════════════════════════════════════
    // CRUD HANDLER OVERRIDES — replace Part 1's prompt() calls
    // ════════════════════════════════════════════════════════════

    // Override: Create content (generic)
    $(document).off('click.wcp-create-content').on('click.wcp-create-content', '[data-action="create-content"]', function() {
      openNewContentModal();
    });

    // Override: Create content for cluster
    $(document).off('click.wcp-create-content-cluster').on('click.wcp-create-content-cluster', '[data-action="create-content-for-cluster"]', function() {
      var clusterId = $(this).data('cluster');
      var hubId = $(this).data('hub') || S.selectedHubId;
      openNewContentModal({ hub_id: hubId, cluster_id: clusterId });
    });

    // Override: Create hub
    $(document).off('click.wcp-create-hub').on('click.wcp-create-hub', '[data-action="create-hub"]', function() {
      var colors = Constants.HUB_COLORS;
      var colorIdx = (S.data.hubs || []).length % colors.length;
      var html = '<div class="wcp-editor-form">';
      html += '<div class="wcp-form-group"><label>Hub Name</label><input type="text" class="wcp-input" data-field="name" placeholder="e.g. Content Marketing"></div>';
      html += '<div class="wcp-form-group"><label>Description</label><textarea class="wcp-textarea" data-field="description" rows="2" placeholder="What this hub covers..."></textarea></div>';
      html += '<div class="wcp-form-group"><label>Pillar Keyword</label><input type="text" class="wcp-input" data-field="pillar_keyword" placeholder="Main keyword..."></div>';
      html += '<div class="wcp-form-group"><label>Color</label><div class="wcp-color-picker">';
      for (var ci = 0; ci < colors.length; ci++) {
        html += '<button class="wcp-color-swatch' + (ci === colorIdx ? ' wcp-color-swatch-active' : '') + '" data-action="pick-color" data-color="' + colors[ci].color + '" style="background:' + colors[ci].color + '"></button>';
      }
      html += '<input type="hidden" data-field="color" value="' + colors[colorIdx].color + '">';
      html += '</div></div></div>';
      openModal('New Hub', html, {
        saveLabel: 'Create Hub',
        onSave: function() {
          var fields = collectModalFields();
          if (!fields.name || !fields.name.trim()) { toast('Hub name is required', 'warning'); return; }
          snapshot('Before create hub');
          createHub({ name: fields.name.trim(), color: fields.color || colors[colorIdx].color, description: fields.description || '', pillar_keyword: fields.pillar_keyword || '' });
          closeModal(); render();
        }
      });
    });

    // Override: Edit hub
    $(document).off('click.wcp-edit-hub').on('click.wcp-edit-hub', '[data-action="edit-hub"]', function(e) {
      e.stopPropagation();
      openEditHubModal($(this).data('id'));
    });

    // Override: Delete hub (confirm dialog instead of confirm())
    $(document).off('click.wcp-delete-hub').on('click.wcp-delete-hub', '[data-action="delete-hub"]', function(e) {
      e.stopPropagation();
      deleteHubConfirm($(this).data('id'));
    });

    // Override: Create cluster
    $(document).off('click.wcp-create-cluster').on('click.wcp-create-cluster', '[data-action="create-cluster"]', function() {
      var hubId = $(this).data('hub') || S.selectedHubId;
      if (!hubId) { toast('Select a hub first', 'warning'); return; }
      var html = '<div class="wcp-editor-form">';
      html += '<div class="wcp-form-group"><label>Cluster Name</label><input type="text" class="wcp-input" data-field="name" placeholder="e.g. Keyword Research Guides"></div>';
      html += '<div class="wcp-form-group"><label>Description</label><textarea class="wcp-textarea" data-field="description" rows="2" placeholder="What this cluster covers..."></textarea></div>';
      html += '<div class="wcp-form-group"><label>Keywords <span class="wcp-form-hint">(comma-separated)</span></label>';
      html += '<textarea class="wcp-textarea" data-field="keywords" rows="2" placeholder="keyword1, keyword2..."></textarea></div>';
      html += '</div>';
      openModal('New Cluster', html, {
        saveLabel: 'Create Cluster',
        onSave: function() {
          var fields = collectModalFields();
          if (!fields.name || !fields.name.trim()) { toast('Cluster name is required', 'warning'); return; }
          snapshot('Before create cluster');
          createCluster({
            name: fields.name.trim(), hub_id: hubId,
            description: fields.description || '',
            keywords: (fields.keywords || '').split(',').map(function(k) { return k.trim(); }).filter(Boolean)
          });
          closeModal(); render();
        }
      });
    });

    // Override: Edit cluster
    $(document).off('click.wcp-edit-cluster').on('click.wcp-edit-cluster', '[data-action="edit-cluster"]', function(e) {
      e.stopPropagation();
      openEditClusterModal($(this).data('id'));
    });

    // Select cluster card from hub tree → open its edit modal
    $(document).off('click.wcp-select-cluster').on('click.wcp-select-cluster', '[data-action="select-cluster"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id');
      if (id) openEditClusterModal(id);
    });

    // Override: Delete cluster (confirm dialog instead of confirm())
    $(document).off('click.wcp-delete-cluster').on('click.wcp-delete-cluster', '[data-action="delete-cluster"]', function(e) {
      e.stopPropagation();
      deleteClusterConfirm($(this).data('id'));
    });

    // Override: Create tag
    $(document).off('click.wcp-create-tag').on('click.wcp-create-tag', '[data-action="create-tag"]', function() {
      openNewTagModal();
    });

    // Override: Edit tag
    $(document).off('click.wcp-edit-tag').on('click.wcp-edit-tag', '[data-action="edit-tag"]', function() {
      openEditTagModal($(this).data('id'));
    });

    // Override: Create pillar (modal instead of prompt).
    // Previously this opened the new-content modal with no post-create hook —
    // so the created content was never assigned as the hub's pillar, and the
    // hub card kept rendering "NO PILLAR CONTENT". The onCreate callback
    // closes that gap.
    $(document).off('click.wcp-create-pillar').on('click.wcp-create-pillar', '[data-action="create-pillar"]', function() {
      var hubId = $(this).data('hub') || S.selectedHubId;
      var hub = S.hubMap[hubId]; if (!hub) return;
      openNewContentModal(
        { title: hub.name + ' — Complete Guide', hub_id: hubId, content_type_id: 'ct_002' },
        { onCreate: function(newContent) {
            setContentAsHubPillar(newContent);
            logActivity('pillar_assigned', newContent.id, newContent.title, 'Set as pillar of ' + hub.name);
            toast('Pillar content assigned to ' + hub.name, 'success');
        }}
      );
    });

    // ── Content actions (pipeline header) ──
    $(document).off('click' + ns + '-dc').on('click' + ns + '-dc', '[data-action="delete-content"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id') || S.selectedContentId;
      if (id) deleteContentConfirm(id);
    });
    $(document).off('click' + ns + '-dup').on('click' + ns + '-dup', '[data-action="duplicate-content"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id') || S.selectedContentId;
      if (id) duplicateContent(id);
    });
    $(document).off('change' + ns + '-ccs').on('change' + ns + '-ccs', '[data-action="change-content-status"]', function() {
      var id = $(this).data('id') || S.selectedContentId;
      var newStatus = $(this).val();
      if (!id || !newStatus) return;
      var c = S.contentMap[id]; if (!c) return;
      var oldLabel = (Constants.CONTENT_STATUSES[c.status] || {}).label || c.status;
      var newLabel = (Constants.CONTENT_STATUSES[newStatus] || {}).label || newStatus;
      c.status = newStatus;
      c.updated = new Date().toISOString();
      logActivity('content_status_changed', c.id, c.title, oldLabel + ' → ' + newLabel + ' (manual)');
      snapshot('Status changed'); buildMaps(); syncToTextarea(); render();
      toast('Status: ' + newLabel, 'success');
    });

    // ── Quick-advance status (▶ button next to the status pill) ──
    // Walks QUICK_ADVANCE_PATH one step forward. advanceContentStatus()
    // handles the no-op cases (off-path status, already at 'published').
    $(document).off('click' + ns + '-adv').on('click' + ns + '-adv', '[data-action="advance-content-status"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id') || S.selectedContentId;
      if (!id) return;
      var c = S.contentMap[id]; if (!c) return;
      var result = advanceContentStatus(c);
      if (!result) { toast('Already at the final stage', 'info'); return; }
      snapshot('Advanced stage'); buildMaps(); syncToTextarea(); render();
      toast('Advanced to ' + (Constants.CONTENT_STATUSES[result] || {}).label, 'success');
    });

    // ── Archive (soft-delete) ──
    // If the content was a hub's pillar, clears that ref so the hub doesn't
    // dangle. Keeps cluster_id so a Restore puts it back where it was.
    $(document).off('click' + ns + '-arch').on('click' + ns + '-arch', '[data-action="archive-content"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id') || S.selectedContentId;
      if (!id) return;
      var c = S.contentMap[id]; if (!c) return;
      if (c.status === 'archived') return;
      c._prev_status = c.status;
      c.status = 'archived';
      c.archived_at = new Date().toISOString();
      c.updated = c.archived_at;
      clearHubPillarReferences(c.id);
      logActivity('content_archived', c.id, c.title, 'Archived from ' + ((Constants.CONTENT_STATUSES[c._prev_status] || {}).label || c._prev_status));
      snapshot('Archive content'); buildMaps(); syncToTextarea(); render();
      toast('Archived — find it under "Show archived"', 'success');
    });

    // ── Restore (from archived/rejected back to active) ──
    $(document).off('click' + ns + '-rest').on('click' + ns + '-rest', '[data-action="restore-content"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id') || S.selectedContentId;
      if (!id) return;
      var c = S.contentMap[id]; if (!c) return;
      var prev = c._prev_status || 'info';
      // Guard: never restore to an off-path or closed state.
      if (Constants.CLOSED_STATUSES.indexOf(prev) !== -1 || prev === 'rejected') prev = 'info';
      c.status = prev;
      c.archived_at = '';
      c.rejected_at = '';
      c.rejected_reason = '';
      c._prev_status = '';
      c.updated = new Date().toISOString();
      logActivity('content_restored', c.id, c.title, 'Restored to ' + ((Constants.CONTENT_STATUSES[prev] || {}).label || prev));
      snapshot('Restore content'); buildMaps(); syncToTextarea(); render();
      toast('Restored', 'success');
    });

    // ── Reject (branch state) ──
    $(document).off('click' + ns + '-rej').on('click' + ns + '-rej', '[data-action="reject-content"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id') || S.selectedContentId;
      if (!id) return;
      var c = S.contentMap[id]; if (!c) return;
      var reason = prompt('Reason for rejection (optional):', c.rejected_reason || '');
      if (reason === null) return; // cancelled
      c._prev_status = (Constants.CLOSED_STATUSES.indexOf(c.status) === -1) ? c.status : (c._prev_status || 'info');
      c.status = 'rejected';
      c.rejected_at = new Date().toISOString();
      c.rejected_reason = (reason || '').trim();
      c.updated = c.rejected_at;
      clearHubPillarReferences(c.id);
      logActivity('content_rejected', c.id, c.title, c.rejected_reason || 'Rejected');
      snapshot('Reject content'); buildMaps(); syncToTextarea(); render();
      toast('Marked as rejected', 'info');
    });

    // ── Permanent delete (two-step confirm) ──
    // Routes through the existing deleteContentConfirm — which already
    // clears pillar refs and cluster back-refs thanks to the edit earlier.
    $(document).off('click' + ns + '-delp').on('click' + ns + '-delp', '[data-action="delete-content-permanent"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id') || S.selectedContentId;
      if (!id) return;
      deleteContentConfirm(id);
    });

    // ── Overflow menu toggle (⋮) ──
    $(document).off('click' + ns + '-ovt').on('click' + ns + '-ovt', '[data-action="toggle-cd-overflow"]', function(e) {
      e.stopPropagation();
      var $menu = $(this).siblings('.wcp-cd-overflow-menu');
      var willOpen = $menu.prop('hidden');
      // Close every other overflow menu on the page first
      $('.wcp-cd-overflow-menu').prop('hidden', true);
      $menu.prop('hidden', !willOpen);
      if (willOpen) $menu.find('.wcp-cd-overflow-item').first().trigger('focus');
    });
    // Close overflow on any click outside it
    $(document).off('click' + ns + '-ovo').on('click' + ns + '-ovo', function(e) {
      if ($(e.target).closest('.wcp-cd-overflow-wrap').length) return;
      $('.wcp-cd-overflow-menu').prop('hidden', true);
    });
    // Any click on an overflow item closes the menu (after the item's own
    // handler runs — these share delegation on document).
    $(document).off('click' + ns + '-ovi').on('click' + ns + '-ovi', '.wcp-cd-overflow-item', function() {
      $('.wcp-cd-overflow-menu').prop('hidden', true);
    });
    // Escape anywhere closes all overflow menus.
    $(document).off('keydown' + ns + '-ovk').on('keydown' + ns + '-ovk', function(e) {
      if (e.key === 'Escape' && $('.wcp-cd-overflow-menu:not([hidden])').length) {
        $('.wcp-cd-overflow-menu').prop('hidden', true);
      }
    });

    // Keyboard activation on static pillar chip (role="button" tabindex="0")
    $(document).off('keydown' + ns + '-pkb').on('keydown' + ns + '-pkb', '.wcp-cd-chip-pillar-action', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $(this).trigger('click');
      }
    });

    // ── Mark current content as its hub's pillar ──
    $(document).off('click' + ns + '-spillar').on('click' + ns + '-spillar', '[data-action="set-as-hub-pillar"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id') || S.selectedContentId;
      if (!id) return;
      var c = S.contentMap[id]; if (!c || !c.hub_id) return;
      var hub = setContentAsHubPillar(c);
      if (!hub) return;
      logActivity('pillar_assigned', c.id, c.title, 'Set as pillar of ' + hub.name);
      snapshot('Mark pillar'); buildMaps(); syncToTextarea(); render();
      toast('Marked as pillar of ' + hub.name, 'success');
    });

    // Override: Edit content type (modal instead of prompt)
    $(document).off('click.wcp-edit-type').on('click.wcp-edit-type', '[data-action="edit-type"]', function(e) {
      e.stopPropagation();
      openEditTypeModal($(this).data('id'));
    });

    // Override: Create content type (modal)
    $(document).off('click.wcp-create-type').on('click.wcp-create-type', '[data-action="create-type"]', function() {
      var colors = Constants.HUB_COLORS;
      var html = '<div class="wcp-editor-form">';
      html += '<div class="wcp-form-group"><label>Name</label><input type="text" class="wcp-input" data-field="name" placeholder="e.g. How-To Guide"></div>';
      html += '<div class="wcp-form-group"><label>Description</label><textarea class="wcp-textarea" data-field="description" rows="2" placeholder="What this type is for..."></textarea></div>';
      html += '<div class="wcp-form-row"><div class="wcp-form-half"><label>Icon (FA name)</label><input type="text" class="wcp-input" data-field="icon" value="file" placeholder="pen-fancy, book, chart-line..."></div>';
      html += '<div class="wcp-form-half"><label>Color</label><div class="wcp-color-picker">';
      var colorIdx = (S.data.content_types || []).length % colors.length;
      for (var ci = 0; ci < colors.length; ci++) html += '<button class="wcp-color-swatch' + (ci === colorIdx ? ' wcp-color-swatch-active' : '') + '" data-action="pick-color" data-color="' + colors[ci].color + '" style="background:' + colors[ci].color + '"></button>';
      html += '<input type="hidden" data-field="color" value="' + colors[colorIdx].color + '"></div></div></div>';
      html += '<div class="wcp-form-row"><div class="wcp-form-half"><label>Default Intent</label><select class="wcp-select" data-field="default_intent">';
      for (var ik in Constants.SEARCH_INTENTS) html += '<option value="' + ik + '">' + Constants.SEARCH_INTENTS[ik].label + '</option>';
      html += '</select></div><div class="wcp-form-half"><label>Default Schema</label><input type="text" class="wcp-input" data-field="default_schema" value="Article"></div></div>';
      html += '</div>';
      openModal('New Content Type', html, {
        size: 'lg', saveLabel: 'Create Type',
        onSave: function() {
          var f = collectModalFields();
          if (!f.name || !f.name.trim()) { toast('Name is required', 'warning'); return; }
          var t = { id: generateId('ct'), name: f.name.trim(), icon: f.icon || 'file', description: f.description || '', color: f.color || colors[colorIdx].color, instructions: '', default_schema: f.default_schema || 'Article', snippet_targets: [], default_intent: f.default_intent || 'informational', cw_content_type: f.name.trim().toLowerCase().replace(/\s+/g, '_'), word_count_range: { min: 1000, max: 3000 }, fields: [] };
          S.data.content_types = S.data.content_types || [];
          S.data.content_types.push(t);
          logActivity('ai_action', t.id, t.name, 'Content type created');
          snapshot('Create type'); buildMaps(); closeModal(); syncToTextarea(); render();
          toast('Content type created: ' + t.name, 'success');
        }
      });
    });

    // Override: Edit template (modal)
    $(document).off('click.wcp-edit-template').on('click.wcp-edit-template', '[data-action="edit-template"]', function(e) {
      e.stopPropagation();
      openEditTemplateModal($(this).data('id'));
    });

    // Override: Create template (modal)
    $(document).off('click.wcp-create-template').on('click.wcp-create-template', '[data-action="create-template"]', function() {
      var html = '<div class="wcp-editor-form">';
      html += '<div class="wcp-form-group"><label>Template Name</label><input type="text" class="wcp-input" data-field="name" placeholder="e.g. Blog Post Standard"></div>';
      html += '<div class="wcp-form-group"><label>Description</label><textarea class="wcp-textarea" data-field="description" rows="2" placeholder="What this template produces..."></textarea></div>';
      html += '</div>';
      openModal('New Template', html, {
        saveLabel: 'Create Template',
        onSave: function() {
          var f = collectModalFields();
          if (!f.name || !f.name.trim()) { toast('Name is required', 'warning'); return; }
          var tpl = { id: generateId('tpl'), name: f.name.trim(), content_type_id: '', description: f.description || '', uses_count: 0,
            sections: [
              { name: 'Introduction', instructions: 'Hook the reader. Include primary keyword in first 100 words.', heading_level: 'H2', section_type: 'intro', est_words: 200 },
              { name: 'Main Content', instructions: 'Core information with H3 subsections.', heading_level: 'H2', section_type: 'body', est_words: 800 },
              { name: 'Conclusion', instructions: 'Summarize key takeaway. Clear CTA.', heading_level: 'H2', section_type: 'conclusion', est_words: 150 }
            ] };
          S.data.templates = S.data.templates || [];
          S.data.templates.push(tpl);
          logActivity('template_created', tpl.id, tpl.name, 'Template created');
          snapshot('Create template'); buildMaps(); closeModal(); syncToTextarea(); render();
          toast('Template created: ' + tpl.name, 'success');
        }
      });
    });

    // Save template inline (from split-pane detail view)
    $(document).off('click.wcp-save-tpl-inline').on('click.wcp-save-tpl-inline', '[data-action="save-template-inline"]', function() {
      var tplId = $(this).data('id');
      var tpl = S.templateMap[tplId];
      if (!tpl) return;
      var name = ($('#wcpTplName').val() || '').trim();
      if (!name) { toast('Template name is required', 'warning'); return; }
      var newSections = collectTemplateSections();
      if (!newSections.length) { toast('At least one section is required', 'warning'); return; }
      newSections = newSections.filter(function(s) { return s.name.trim(); });
      if (!newSections.length) { toast('At least one section needs a name', 'warning'); return; }
      tpl.name = name;
      tpl.description = ($('#wcpTplDesc').val() || '').trim();
      tpl.sections = newSections;
      logActivity('template_updated', tpl.id, tpl.name, 'Template updated (' + newSections.length + ' sections)');
      snapshot('Save template inline'); buildMaps(); syncToTextarea();
      // Re-render both panes
      $('#wcpTemplateList').html(renderTemplateListItems());
      $('#wcpTemplateDetailPane').html(renderTemplateDetailView());
      toast('Template saved', 'success');
    });

    // Template section events (work in both modal and inline contexts).
    // Uses the shared setupTemplateSectionEvents() helper so all handlers
    // (add / remove / edit-toggle / native HTML5 drag-drop) stay in one place.
    setupTemplateSectionEvents();

    // Override: Delete tag (confirm dialog)
    $(document).off('click.wcp-delete-tag').on('click.wcp-delete-tag', '[data-action="delete-tag"]', function(e) {
      e.stopPropagation();
      deleteTagConfirm($(this).data('id'));
    });

    // Override: Delete template (confirm dialog instead of confirm())
    $(document).off('click.wcp-delete-template').on('click.wcp-delete-template', '[data-action="delete-template"]', function(e) {
      e.stopPropagation();
      var tplId = $(this).data('id');
      var tpl = null;
      for (var i = 0; i < (S.data.templates || []).length; i++) { if (S.data.templates[i].id === tplId) { tpl = S.data.templates[i]; break; } }
      if (!tpl) return;
      openConfirmDialog({
        title: 'Delete Template', message: 'Delete template "' + tpl.name + '"?', confirmLabel: 'Delete', danger: true,
        onConfirm: function() {
          S.data.templates = (S.data.templates || []).filter(function(t) { return t.id !== tplId; });
          logActivity('template_deleted', tplId, tpl.name, 'Template deleted');
          snapshot('Delete template'); buildMaps(); syncToTextarea(); render();
          toast('Template deleted', 'success');
        }
      });
    });

    // Override: Delete content type (confirm dialog)
    $(document).off('click.wcp-delete-type').on('click.wcp-delete-type', '[data-action="delete-type"]', function(e) {
      e.stopPropagation();
      var typeId = $(this).data('id');
      var ct = null;
      for (var i = 0; i < (S.data.content_types || []).length; i++) { if (S.data.content_types[i].id === typeId) { ct = S.data.content_types[i]; break; } }
      if (!ct) return;
      var usedCount = (S.data.content || []).filter(function(c) { return c.content_type_id === typeId; }).length;
      var msg = 'Delete content type "' + ct.name + '"?';
      if (usedCount > 0) msg += ' (' + usedCount + ' content piece' + (usedCount > 1 ? 's' : '') + ' use this type — they will be unlinked)';
      openConfirmDialog({
        title: 'Delete Content Type', message: msg, confirmLabel: 'Delete', danger: true,
        onConfirm: function() {
          S.data.content_types = (S.data.content_types || []).filter(function(t) { return t.id !== typeId; });
          (S.data.content || []).forEach(function(c) { if (c.content_type_id === typeId) c.content_type_id = ''; });
          logActivity('ai_action', typeId, ct.name, 'Content type deleted');
          snapshot('Delete type'); buildMaps(); syncToTextarea(); render();
          toast('Content type deleted', 'success');
        }
      });
    });

    // ── Internal-Link Picker events ────────────────────────────

    // Suggest links button — hands off to Part 2B AI action (rule+AI)
    $(document).off('click' + ns + '-sil').on('click' + ns + '-sil', '[data-action="suggest-internal-links"]', function() {
      var cid = $(this).data('id');
      if (!cid) return;
      if (typeof window._wcpSuggestInternalLinks === 'function') window._wcpSuggestInternalLinks(cid);
      else toast('Link engine loading — try again in a moment', 'info');
    });

    // Clear suggestions
    $(document).off('click' + ns + '-cls').on('click' + ns + '-cls', '[data-action="clear-link-suggestions"]', function(e) {
      e.preventDefault();
      var cid = $(this).data('id');
      if (!cid) return;
      S.linkSuggestions = S.linkSuggestions || {};
      delete S.linkSuggestions[cid];
      var $slot = $('#wcpLinkPicker_' + cid);
      if ($slot.length && typeof window._wcpRenderLinkPicker === 'function') $slot.replaceWith(window._wcpRenderLinkPicker(cid));
    });

    // Commit a suggestion — checkbox toggle. Checked = new ledger entry.
    // Unchecked in this handler = unselect (remove from ledger, move back to
    // suggestions). This is the checkbox-click path; the "Unselect" button
    // on committed rows uses the `unselect-link` action below.
    $(document).off('change' + ns + '-cmt').on('change' + ns + '-cmt', '[data-action="commit-suggestion"]', function() {
      var contentId = $(this).data('content-id');
      var pageId = $(this).data('page-id');
      if (!contentId || !pageId) return;
      S.linkSuggestions = S.linkSuggestions || {};
      var list = S.linkSuggestions[contentId] || [];
      var sug = null;
      for (var i = 0; i < list.length; i++) { if (list[i].page_id === pageId) { sug = list[i]; break; } }
      if (this.checked) {
        if (typeof window._wcpCreateSitemapLink === 'function') {
          window._wcpCreateSitemapLink({
            from_content_id: contentId,
            to_page_id: pageId,
            anchor_text: '',  // writer types their own anchor later
            reason: sug ? sug.reason : '',
            score: sug ? sug.score : 0,
            source: sug ? sug.source : 'manual'
          });
          // Drop from suggestions so the row moves up to "Committed" on re-render
          S.linkSuggestions[contentId] = list.filter(function(s) { return s.page_id !== pageId; });
          var $slot = $('#wcpLinkPicker_' + contentId);
          if ($slot.length && typeof window._wcpRenderLinkPicker === 'function') $slot.replaceWith(window._wcpRenderLinkPicker(contentId));
        }
      }
    });

    // Delete a suggestion — removes it from the transient S.linkSuggestions
    // map without touching the ledger. Useful when the AI proposes a bad
    // match and you want to clear it without committing.
    $(document).off('click' + ns + '-dsg').on('click' + ns + '-dsg', '[data-action="delete-suggestion"]', function(e) {
      e.stopPropagation();
      var contentId = $(this).data('content-id');
      var pageId = $(this).data('page-id');
      if (!contentId || !pageId) return;
      S.linkSuggestions = S.linkSuggestions || {};
      var list = S.linkSuggestions[contentId] || [];
      S.linkSuggestions[contentId] = list.filter(function(s) { return s.page_id !== pageId; });
      var $slot = $('#wcpLinkPicker_' + contentId);
      if ($slot.length && typeof window._wcpRenderLinkPicker === 'function') $slot.replaceWith(window._wcpRenderLinkPicker(contentId));
      toast('Suggestion dismissed', 'info', 1500);
    });

    // Unselect a committed link — removes from the ledger and returns it to
    // the suggestion list (so the user can re-pick if they change their
    // mind). Intentionally non-destructive — the link isn't a deletion.
    $(document).off('click' + ns + '-ul').on('click' + ns + '-ul', '[data-action="unselect-link"]', function() {
      var linkId = $(this).data('id');
      if (!linkId) return;
      var links = (S.data && S.data.sitemap && S.data.sitemap.sitemap && S.data.sitemap.sitemap.links) ||
                  (S.data && S.data.sitemap && S.data.sitemap.links) || [];
      var link = null;
      for (var i = 0; i < links.length; i++) { if (links[i].id === linkId) { link = links[i]; break; } }
      if (!link) return;
      var contentId = link.from_content_id;
      var pageId = link.to_page_id;
      var page = S.sitemapPageMap[pageId];
      // Delete the ledger entry
      if (typeof window._wcpDeleteSitemapLink === 'function') window._wcpDeleteSitemapLink(linkId);
      // Put the unselected link back at the top of the suggestions so the
      // user can immediately re-check it if they clicked by mistake.
      if (contentId && page) {
        S.linkSuggestions = S.linkSuggestions || {};
        var arr = S.linkSuggestions[contentId] || [];
        // Avoid duplicates
        var dup = false;
        for (var j = 0; j < arr.length; j++) { if (arr[j].page_id === pageId) { dup = true; break; } }
        if (!dup) {
          arr.unshift({
            page_id: pageId,
            anchor_text: '',
            reason: link.reason || '',
            score: link.score || 0,
            confidence: 0.7,
            source: link.source || 'manual'
          });
          S.linkSuggestions[contentId] = arr;
        }
      }
      var $slot = $('#wcpLinkPicker_' + contentId);
      if ($slot.length && typeof window._wcpRenderLinkPicker === 'function') $slot.replaceWith(window._wcpRenderLinkPicker(contentId));
      toast('Link unselected — back in suggestions', 'info');
    });

    // Save anchor text on a committed link (blur)
    $(document).off('blur' + ns + '-sla').on('blur' + ns + '-sla', '[data-action="save-link-anchor"]', function() {
      var id = $(this).data('id');
      if (!id) return;
      var val = this.value || '';
      if (typeof window._wcpUpdateSitemapLink === 'function') window._wcpUpdateSitemapLink(id, { anchor_text: val });
    });

    // Remove a committed link
    $(document).off('click' + ns + '-rml').on('click' + ns + '-rml', '[data-action="remove-link"]', function() {
      var id = $(this).data('id');
      if (!id) return;
      if (typeof window._wcpDeleteSitemapLink === 'function') window._wcpDeleteSitemapLink(id);
      var cid = S.selectedContentId;
      var $slot = $('#wcpLinkPicker_' + cid);
      if ($slot.length && typeof window._wcpRenderLinkPicker === 'function') $slot.replaceWith(window._wcpRenderLinkPicker(cid));
    });

    // Manual add link (paste URL)
    $(document).off('click' + ns + '-aml').on('click' + ns + '-aml', '[data-action="add-manual-link"]', function() {
      var cid = $(this).data('id');
      if (!cid) return;
      var $inp = $('#wcpLinkManual_' + cid);
      var raw = ($inp.val() || '').trim();
      if (!raw) { toast('Paste a URL first', 'warning'); return; }
      var canon = (typeof window._wcpCanonicalizeUrl === 'function') ? window._wcpCanonicalizeUrl(raw) : raw;
      var page = S.sitemapPageByUrl ? S.sitemapPageByUrl[canon] : null;
      if (!page) {
        // Offer to add it to the sitemap
        if (!confirm('This URL isn\'t in your sitemap yet. Add it and link to it?')) return;
        if (typeof window._wcpAddSitemapPage !== 'function') { toast('Sitemap CRUD not available', 'error'); return; }
        page = window._wcpAddSitemapPage({ url: canon, source: 'manual' });
        if (!page) { toast('Could not add page', 'error'); return; }
      }
      if (typeof window._wcpCreateSitemapLink === 'function') {
        window._wcpCreateSitemapLink({ from_content_id: cid, to_page_id: page.id, source: 'manual' });
        $inp.val('');
        var $slot = $('#wcpLinkPicker_' + cid);
        if ($slot.length && typeof window._wcpRenderLinkPicker === 'function') $slot.replaceWith(window._wcpRenderLinkPicker(cid));
        toast('Linked to ' + (page.title || canon), 'success');
      }
    });

    // ── Wizards install LAST so their unbind+rebind wins over any legacy
    //    CRUD overrides registered earlier in this function. Each installer
    //    explicitly `.off()`s the namespaces it's taking over.
    if (typeof installNewHubWizardCreateHandler    === 'function') installNewHubWizardCreateHandler();
    if (typeof installNewContentWizardCreateHandlers === 'function') installNewContentWizardCreateHandlers();

    console.log('[WCP] Part 2A events initialized');
  }

