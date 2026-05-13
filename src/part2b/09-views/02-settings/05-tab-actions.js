  function renderActionsTab() {
    var prefs = (S.meta && S.meta.aiPreferences) || {};
    var perAction = prefs.perAction || {};
    var actionList = [
      // Per-content actions (2)
      'ai-suggest-type', 'ai-fill-brief',
      // Hub & global actions (5)
      'ai-suggest-hubs', 'ai-enrich-cluster', 'ai-suggest-tags', 'ai-build-template', 'ai-plan-calendar',
      // Sitemap planning (Phase 5)
      'ai-plan-sitemap', 'ai-expand-sitemap-branch',
      // Research runners (3)
      'research_keywords', 'research_gaps', 'research_competitor'
    ];
    var html = '<div class="wcp-settings-panel">';
    html += '<div class="wcp-settings-section"><h3>' + icon('bolt') + ' Per-Action Model Preferences</h3>';
    html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Each AI action remembers which provider/model you last used. Reset to use the default.</p>';
    html += '<div class="wcp-config-list">';
    for (var ai = 0; ai < actionList.length; ai++) {
      var aId = actionList[ai];
      var pa = perAction[aId];
      var label = aId.replace('ai-', '').replace('research_', 'Research: ').replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
      html += '<div class="wcp-config-item">';
      html += '<span class="wcp-config-item-name">' + esc(label) + '</span>';
      if (pa && pa.provider && pa.model) {
        html += '<span class="wcp-text-sm wcp-text-muted">' + esc(pa.provider + '/' + pa.model) + '</span>';
        html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="reset-ai-pref" data-action-id="' + esc(aId) + '">' + icon('xmark') + '</button>';
      } else {
        html += '<span class="wcp-text-sm wcp-text-muted">Default</span>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="wcp-settings-actions"><button class="wcp-btn wcp-btn-outline" data-action="reset-all-ai-prefs">' + icon('rotate-left') + ' Reset All to Default</button></div>';
    html += '</div></div>';
    return html;
  }

  // ── Tab 5: SEO Goals ──
