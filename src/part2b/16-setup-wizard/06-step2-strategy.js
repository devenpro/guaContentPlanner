  function renderWizardStep2() {
    var sd = wizardGetSD();
    var hubs = sd.contentHubs || [];
    var clusters = sd.contentClusters || [];

    var html = '<div class="wcp-wizard-step-header">';
    html += '<h2>' + icon('sitemap') + ' Content Strategy</h2>';
    html += '<p>Content hubs organize your content around core topics. Each hub can have clusters for sub-topics.</p>';
    html += '</div>';

    if (LLMService.isConfigured()) {
      html += '<div style="margin-bottom:var(--wcp-space-4)"><button class="wcp-wizard-ai-btn" data-action="wizard-ai-hubs">' + icon('sparkles') + ' Suggest Content Hubs</button></div>';
    }

    // Render hub cards
    for (var hi = 0; hi < hubs.length; hi++) {
      var hub = hubs[hi];
      var hubColor = hub.color || Constants.HUB_COLORS[hi % Constants.HUB_COLORS.length].color;
      html += '<div class="wcp-wizard-hub-card" style="border-left:4px solid ' + hubColor + '">';
      html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost wcp-wizard-hub-remove" data-action="wizard-remove-hub" data-index="' + hi + '">' + icon('times') + '</button>';
      html += '<div class="wcp-wizard-field-row">';
      html += '<div class="wcp-wizard-field-group"><label class="wcp-wizard-field-required">Hub Name</label><input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="hub-name-' + hi + '" value="' + esc(hub.name || '') + '" placeholder="e.g., SEO Strategy"></div>';
      html += '<div class="wcp-wizard-field-group"><label>Pillar Keyword</label><input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="hub-kw-' + hi + '" value="' + esc(hub.pillar_keyword || '') + '" placeholder="e.g., seo strategy"></div>';
      html += '</div>';
      html += '<div class="wcp-wizard-field-group"><label>Description</label><input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="hub-desc-' + hi + '" value="' + esc(hub.description || '') + '" placeholder="Brief description of this hub topic"></div>';

      // Clusters for this hub
      html += '<div class="wcp-wizard-cluster-list">';
      html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-2)"><span class="wcp-section-label">Clusters</span>';
      if (LLMService.isConfigured()) {
        html += '<button class="wcp-wizard-ai-btn" style="padding:var(--wcp-space-1) var(--wcp-space-2);font-size:10px" data-action="wizard-ai-clusters" data-hub-index="' + hi + '" data-hub-name="' + esc(hub.name || '') + '">' + icon('sparkles') + ' Suggest</button>';
      }
      html += '</div>';
      var hubClusters = clusters.filter(function(c) { return c.hub_index === hi; });
      for (var ci = 0; ci < hubClusters.length; ci++) {
        var cidx = clusters.indexOf(hubClusters[ci]);
        html += '<div class="wcp-wizard-cluster-item">';
        html += '<input type="text" class="wcp-input wcp-input-sm wcp-wizard-field" data-wizard-path="cluster-name-' + cidx + '" value="' + esc(hubClusters[ci].name || '') + '" placeholder="Cluster name">';
        html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="wizard-remove-cluster" data-cluster-index="' + cidx + '">' + icon('times') + '</button>';
        html += '</div>';
      }
      html += '<button class="wcp-btn wcp-btn-sm wcp-btn-outline" data-action="wizard-add-cluster" data-hub-index="' + hi + '" style="margin-top:var(--wcp-space-1)">' + icon('plus') + ' Add Cluster</button>';
      html += '</div>';
      html += '</div>';
    }

    html += '<button class="wcp-btn wcp-btn-outline" data-action="wizard-add-hub" style="width:100%;border-style:dashed">' + icon('plus') + ' Add Content Hub</button>';
    return html;
  }

  // ── Step 3: Content Types ──
