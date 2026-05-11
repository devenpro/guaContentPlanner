  function renderWizardStep3() {
    var sd = wizardGetSD();
    var defaultTypes = (window._wcpGetDefaultContentTypes || function() { return []; })();
    var selectedIds = sd.selectedTypeIds || defaultTypes.map(function(t) { return t.id; });

    var html = '<div class="wcp-wizard-step-header">';
    html += '<h2>' + icon('layer-group') + ' Content Types</h2>';
    html += '<p>Select the content types you plan to create. You can add or modify types later.</p>';
    html += '</div>';

    if (LLMService.isConfigured()) {
      html += '<div style="margin-bottom:var(--wcp-space-4)"><button class="wcp-wizard-ai-btn" data-action="wizard-ai-types">' + icon('sparkles') + ' Suggest Additional Types</button></div>';
    }

    html += '<div class="wcp-wizard-type-grid">';
    for (var ti = 0; ti < defaultTypes.length; ti++) {
      var t = defaultTypes[ti];
      var sel = selectedIds.indexOf(t.id) !== -1;
      html += '<div class="wcp-wizard-type-card' + (sel ? ' selected' : '') + '" data-action="wizard-toggle-type" data-type-id="' + esc(t.id) + '">';
      html += '<div class="wcp-wizard-type-icon" style="background:' + (t.color || '#2563eb') + '">' + icon(t.icon || 'file') + '</div>';
      html += '<div class="wcp-wizard-type-info"><strong>' + esc(t.name) + '</strong><span>' + esc(t.description || '') + '</span></div>';
      html += '<div class="wcp-wizard-type-check">' + icon('check') + '</div>';
      html += '</div>';
    }

    // Custom types added by user
    var customTypes = sd.customTypes || [];
    for (var ci = 0; ci < customTypes.length; ci++) {
      var ct = customTypes[ci];
      html += '<div class="wcp-wizard-type-card selected" data-action="wizard-remove-custom-type" data-custom-index="' + ci + '">';
      html += '<div class="wcp-wizard-type-icon" style="background:' + (ct.color || '#80868b') + '">' + icon(ct.icon || 'file') + '</div>';
      html += '<div class="wcp-wizard-type-info"><strong>' + esc(ct.name) + '</strong><span>' + esc(ct.description || '') + '</span></div>';
      html += '<div class="wcp-wizard-type-check">' + icon('times') + '</div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // ── Step 4: SEO Goals ──
