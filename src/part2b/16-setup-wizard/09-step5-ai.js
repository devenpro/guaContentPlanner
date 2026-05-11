  function renderWizardStep5() {
    var sd = wizardGetSD();
    var html = '<div class="wcp-wizard-step-header">';
    html += '<h2>' + icon('sparkles') + ' AI Configuration</h2>';
    html += '<p>Verify your AI providers and set a default model for AI-assisted content planning.</p>';
    html += '</div>';

    if (LLMService.isConfigured()) {
      var provs = LLMService.getActiveProviders();
      html += '<div class="wcp-card" style="margin-bottom:var(--wcp-space-4)"><div class="wcp-card-body">';
      html += '<h3 style="font-size:var(--wcp-font-size-sm);margin-bottom:var(--wcp-space-3)">' + icon('check-circle') + ' ' + provs.length + ' AI Provider' + (provs.length !== 1 ? 's' : '') + ' Available</h3>';
      for (var pi = 0; pi < provs.length; pi++) {
        var p = provs[pi];
        html += '<div class="wcp-wizard-ai-provider">';
        html += '<div class="wcp-wizard-ai-dot ok"></div>';
        html += '<div style="flex:1"><strong style="font-size:var(--wcp-font-size-sm)">' + esc(p.label || p.id) + '</strong>';
        html += '<div class="wcp-text-sm wcp-text-muted">' + p.activeModels.length + ' model' + (p.activeModels.length !== 1 ? 's' : '') + ' active</div></div>';
        html += '</div>';
      }
      html += '</div></div>';

      // Default provider/model picker
      html += '<div class="wcp-card" style="margin-bottom:var(--wcp-space-4)"><div class="wcp-card-body">';
      html += '<h3 style="font-size:var(--wcp-font-size-sm);margin-bottom:var(--wcp-space-3)">' + icon('sliders') + ' Default AI Provider</h3>';
      html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Select the default provider and model used for AI actions across the app.</p>';
      html += '<div id="wizardAIPicker">' + LLMService.renderInlinePicker('wizard-default') + '</div>';
      html += '</div></div>';

      // Test connection
      html += '<div class="wcp-card"><div class="wcp-card-body">';
      html += '<h3 style="font-size:var(--wcp-font-size-sm);margin-bottom:var(--wcp-space-3)">' + icon('flask') + ' Test Connection</h3>';
      html += '<button class="wcp-wizard-ai-btn" data-action="wizard-ai-test">' + icon('bolt') + ' Send Test Prompt</button>';
      html += '<div id="wizardAITestResult"></div>';
      if (sd.aiTested) html += '<div class="wcp-wizard-ai-test-result success" style="margin-top:var(--wcp-space-2)">' + icon('check-circle') + ' AI connection verified</div>';
      html += '</div></div>';

    } else {
      html += '<div class="wcp-card"><div class="wcp-card-body">';
      html += '<div class="wcp-wizard-warning" style="margin-bottom:var(--wcp-space-3)">' + icon('circle-info') + ' No AI providers detected. AI features will be unavailable until configured.</div>';
      html += '<p class="wcp-text-sm wcp-text-muted">AI configuration is loaded from your page via <code>.llm-config-data</code> or <code>.llm-brand-config-data</code> divs. Set up your AI providers in the Drupal admin.</p>';
      html += '<p class="wcp-text-sm wcp-text-muted" style="margin-top:var(--wcp-space-2)">You can still complete setup without AI — all features work manually.</p>';
      html += '</div></div>';
    }

    return html;
  }

  // ── Step 6: Review & Launch ──
