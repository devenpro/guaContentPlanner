  function renderTagsView() {
    var tags = S.data.tags || [];
    var html = '<div class="wcp-view">';
    html += '<div class="wcp-view-header"><div class="wcp-view-header-left"><h1>' + icon('tags') + ' Tags</h1>';
    html += '<span class="wcp-view-subtitle">Organized by category for clean taxonomy</span></div>';
    html += '<div class="wcp-view-header-right">';
    html += '<button class="wcp-btn-ai" data-action="ai-suggest-tags">' + icon('sparkles') + ' AI Suggest</button>';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="create-tag">' + icon('plus') + ' New Tag</button>';
    html += '</div></div>';

    if (tags.length === 0) {
      html += '<div class="wcp-empty-state">';
      html += '<div class="wcp-empty-state-icon">' + icon('tags') + '</div>';
      html += '<div class="wcp-empty-state-title">No tags yet</div>';
      html += '<div class="wcp-empty-state-text">Tags help categorize and organize your content. Create tags for topics, difficulty levels, content lifecycle, and more.</div>';
      html += '<button class="wcp-btn wcp-btn-primary" data-action="create-tag">' + icon('plus') + ' Create First Tag</button>';
      html += '</div>';
    } else {
      // Group tags by group field
      var groups = {};
      for (var tgi = 0; tgi < tags.length; tgi++) {
        var t = tags[tgi];
        var g = t.group || 'General';
        if (!groups[g]) groups[g] = [];
        groups[g].push(t);
      }
      for (var gName in groups) {
        html += '<div style="margin-bottom:var(--wcp-space-5)">';
        html += '<div class="wcp-section-label">' + esc(gName) + '</div>';
        html += '<div class="wcp-tag-cloud">';
        var gTags = groups[gName];
        for (var gti = 0; gti < gTags.length; gti++) {
          var tag = gTags[gti];
          var tagColor = tag.color || 'var(--wcp-primary)';
          // Count content with this tag
          var tagCount = (S.data.content || []).filter(function(c) { return (c.tags || []).indexOf(tag.id) > -1; }).length;
          html += '<span class="wcp-tag-chip" style="background:' + tagColor + '15;color:' + tagColor + ';border-color:' + tagColor + '30" data-action="edit-tag" data-id="' + esc(tag.id) + '">';
          html += '<span style="width:10px;height:10px;border-radius:50%;background:' + tagColor + ';flex-shrink:0"></span> ';
          html += esc(tag.name);
          html += ' <span class="wcp-tag-chip-count" style="opacity:0.7;font-weight:700">' + tagCount + '</span>';
          html += '</span>';
        }
        html += '</div></div>';
      }
    }
    html += '</div>';
    return html;
  }

  // ─── ACTIVITY VIEW (Stage 2.6) ──────────────────────
