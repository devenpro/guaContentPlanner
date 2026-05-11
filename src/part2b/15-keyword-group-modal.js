  // ============================================================
  // SECTION 15B: KEYWORD GROUP EDIT MODAL
  // ============================================================

  function openEditKeywordGroupModal(groupId) {
    var grp = S.keywordGroupMap[groupId];
    if (!grp) return;
    var kws = grp.keywords || [];
    var html = '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Group Name</label><input type="text" class="wcp-input" data-field="name" value="' + esc(grp.name) + '"></div>';
    html += '<div class="wcp-form-group"><label>User Intent</label><input type="text" class="wcp-input" data-field="intent" value="' + esc(grp.intent) + '" placeholder="What the searcher wants..."></div>';
    html += '<div class="wcp-form-row"><div class="wcp-form-half">';
    html += '<label>Search Intent</label><select class="wcp-select" data-field="search_intent">';
    ['informational', 'commercial', 'transactional', 'navigational'].forEach(function(si) {
      html += '<option value="' + si + '"' + (grp.search_intent === si ? ' selected' : '') + '>' + si.charAt(0).toUpperCase() + si.slice(1) + '</option>';
    });
    html += '</select></div><div class="wcp-form-half">';
    html += '<label>Primary Keyword</label><select class="wcp-select" data-field="primary_keyword_index">';
    for (var pi = 0; pi < kws.length; pi++) {
      html += '<option value="' + pi + '"' + (pi === (grp.primary_keyword_index || 0) ? ' selected' : '') + '>' + esc(kws[pi].keyword) + '</option>';
    }
    html += '</select></div></div>';

    // Keywords list
    html += '<div class="wcp-form-group"><label>Keywords (' + kws.length + ')</label></div>';
    html += '<div id="kwgKeywordsContainer">';
    for (var ki = 0; ki < kws.length; ki++) {
      html += '<div class="wcp-kw-edit-row" data-kw-index="' + ki + '">';
      html += '<input type="text" class="wcp-input wcp-input-sm" data-kw-field="keyword" value="' + esc(kws[ki].keyword) + '" style="flex:1">';
      html += '<input type="number" class="wcp-input wcp-input-sm" data-kw-field="volume" value="' + (kws[ki].volume || '') + '" placeholder="Vol." style="width:80px">';
      html += '<select class="wcp-select wcp-select-sm" data-kw-field="difficulty" style="width:90px">';
      ['low', 'medium', 'high', 'very_high'].forEach(function(d) {
        html += '<option value="' + d + '"' + (kws[ki].difficulty === d ? ' selected' : '') + '>' + d + '</option>';
      });
      html += '</select>';
      html += '<button class="wcp-btn-delete-sm" data-action="kwg-remove-kw" data-index="' + ki + '">' + icon('times') + '</button>';
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="wcp-btn wcp-btn-outline wcp-btn-sm" data-action="kwg-add-kw" style="width:100%;border-style:dashed;margin-top:var(--wcp-space-2)">' + icon('plus') + ' Add Keyword</button>';

    html += '<div class="wcp-form-group" style="margin-top:var(--wcp-space-3)"><label>Notes</label>';
    html += '<textarea class="wcp-textarea" data-field="notes" rows="2" placeholder="Optional notes...">' + esc(grp.notes || '') + '</textarea></div>';
    html += '</div>';

    openModal('Edit Keyword Group — ' + esc(grp.name), html, {
      size: 'lg',
      saveLabel: 'Save Group',
      onSave: function() {
        var f = collectModalFields();
        if (!f.name || !f.name.trim()) { toast('Group name is required', 'warning'); return; }
        // Collect keywords from DOM
        var newKws = [];
        $('#kwgKeywordsContainer .wcp-kw-edit-row').each(function() {
          var kw = $(this).find('[data-kw-field="keyword"]').val() || '';
          if (!kw.trim()) return;
          newKws.push({
            keyword: kw.trim(),
            volume: parseInt($(this).find('[data-kw-field="volume"]').val(), 10) || 0,
            difficulty: $(this).find('[data-kw-field="difficulty"]').val() || 'medium'
          });
        });
        if (!newKws.length) { toast('At least one keyword is required', 'warning'); return; }
        grp.name = f.name.trim();
        grp.intent = f.intent || '';
        grp.search_intent = f.search_intent || 'informational';
        grp.primary_keyword_index = Math.min(parseInt(f.primary_keyword_index, 10) || 0, newKws.length - 1);
        grp.keywords = newKws;
        grp.notes = f.notes || '';
        grp.updated = new Date().toISOString();
        // If linked to content, update content keywords
        if (grp.content_id) {
          var cnt = S.contentMap[grp.content_id];
          if (cnt) {
            var pk = newKws[grp.primary_keyword_index] || newKws[0];
            cnt.keywords.primary = { keyword: pk.keyword, volume: pk.volume || 0, difficulty: pk.difficulty || '' };
            cnt.keywords.secondary = newKws.filter(function(k, i) { return i !== grp.primary_keyword_index; }).map(function(k) {
              return { keyword: k.keyword, volume: k.volume || 0, difficulty: k.difficulty || '' };
            });
          }
        }
        snapshot('Edit keyword group'); buildMaps(); closeModal(); syncToTextarea(); render();
        toast('Keyword group updated', 'success');
      }
    });

    // Modal-internal keyword management events
    var kwgNs = '.wcp-kwg-edit';
    $(document).off('click' + kwgNs + '-add').on('click' + kwgNs + '-add', '[data-action="kwg-add-kw"]', function() {
      var count = $('#kwgKeywordsContainer .wcp-kw-edit-row').length;
      var row = '<div class="wcp-kw-edit-row" data-kw-index="' + count + '">';
      row += '<input type="text" class="wcp-input wcp-input-sm" data-kw-field="keyword" value="" placeholder="New keyword..." style="flex:1">';
      row += '<input type="number" class="wcp-input wcp-input-sm" data-kw-field="volume" value="" placeholder="Vol." style="width:80px">';
      row += '<select class="wcp-select wcp-select-sm" data-kw-field="difficulty" style="width:90px"><option value="low">low</option><option value="medium" selected>medium</option><option value="high">high</option><option value="very_high">very_high</option></select>';
      row += '<button class="wcp-btn-delete-sm" data-action="kwg-remove-kw" data-index="' + count + '">' + icon('times') + '</button>';
      row += '</div>';
      $('#kwgKeywordsContainer').append(row);
    });
    $(document).off('click' + kwgNs + '-rm').on('click' + kwgNs + '-rm', '[data-action="kwg-remove-kw"]', function() {
      $(this).closest('.wcp-kw-edit-row').remove();
    });
  }

