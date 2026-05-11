  // ============================================================
  // SECTION 13: TAG INPUT COMPONENT
  // ============================================================
  //
  // Inline tag editor for the content detail view.
  //   - Each applied tag renders as a removable chip.
  //   - A text input lets the user TYPE a tag name. Enter (or comma) either:
  //       - attaches an existing tag (case-insensitive match), or
  //       - creates a new tag and attaches it in one step.
  //   - A native <datalist> provides autocomplete suggestions from existing
  //     tags that aren't already applied.

  function renderTagInput(tagIds, contextId) {
    tagIds = tagIds || [];
    var allTags = getAllTags ? getAllTags() : [];
    var applied = {};
    for (var a = 0; a < tagIds.length; a++) applied[tagIds[a]] = true;

    var html = '<div class="wcp-tag-input" data-context="' + esc(contextId || '') + '">';
    html += '<div class="wcp-tag-chips">';

    // Applied tag chips
    for (var ti = 0; ti < tagIds.length; ti++) {
      var tag = resolveTag ? resolveTag(tagIds[ti]) : null;
      if (!tag) continue;
      html += '<span class="wcp-tag-input-chip" style="background:' + tag.color + '22;border-color:' + tag.color + ';color:' + tag.color + '">';
      html += esc(tag.name);
      html += '<button class="wcp-tag-remove" data-action="remove-tag-from-content" data-tag-id="' + esc(tag.id) + '" data-context="' + esc(contextId || '') + '" title="Remove tag" type="button">&times;</button>';
      html += '</span>';
    }

    // Inline create-or-attach input
    var listId = 'wcp-tag-sugg-' + (contextId || 'x');
    html += '<span class="wcp-tag-inline-add">';
    html += '<input type="text" class="wcp-tag-inline-input" data-action="add-tag-inline" data-context="' + esc(contextId || '') + '" list="' + esc(listId) + '" placeholder="+ add tag (type and press Enter)" autocomplete="off">';
    html += '<datalist id="' + esc(listId) + '">';
    for (var si = 0; si < allTags.length; si++) {
      if (applied[allTags[si].id]) continue;
      html += '<option value="' + esc(allTags[si].name) + '"></option>';
    }
    html += '</datalist>';
    html += '</span>';

    html += '</div></div>';
    return html;
  }

