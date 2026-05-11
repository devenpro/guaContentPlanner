  function renderAITab() {
    var diag = LLMService.getDiagnostics();
    var html = '<div class="wcp-settings-panel">';
    if (LLMService.isConfigured()) {
      var provs = LLMService.getActiveProviders();
      var def = LLMService.getDefault();
      var aiPrefs = (S.meta && S.meta.aiPreferences) || {};
      var appDef = aiPrefs.appDefault || {};
      var defProvider = appDef.provider || (def ? def.provider : '');
      var defModel = appDef.model || (def ? def.model : '');
      var defInstr = aiPrefs.defaultInstructions || '';

      html += '<div class="wcp-ai-status-summary wcp-ai-status-summary-ok">' + icon('circle-check') + ' <strong>' + provs.length + ' provider(s) active</strong>';
      if (def) html += ' — Default: ' + esc(def.provider) + '/' + esc(def.model);
      html += '</div>';

      // ── Editable defaults ──
      html += '<div class="wcp-settings-section"><h3>' + icon('settings') + ' Default AI</h3>';
      html += '<p class="wcp-text-sm wcp-text-muted" style="margin-top:0;margin-bottom:var(--wcp-space-3)">';
      html += 'Used as the starting selection in the AI run dialog. The last provider/model you pick from any AI action automatically updates this default.';
      html += '</p>';
      html += '<div class="wcp-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--wcp-space-3)">';
      html += '<div class="wcp-form-group"><label>Default Provider</label>';
      html += '<select class="wcp-select wcp-settings-field" data-path="aiPreferences.appDefault.provider">';
      html += '<option value=""' + (!defProvider ? ' selected' : '') + '>— Auto —</option>';
      for (var pp = 0; pp < provs.length; pp++) {
        html += '<option value="' + esc(provs[pp].id) + '"' + (provs[pp].id === defProvider ? ' selected' : '') + '>' + esc(provs[pp].label || provs[pp].id) + '</option>';
      }
      html += '</select></div>';
      html += '<div class="wcp-form-group"><label>Default Model</label>';
      html += '<select class="wcp-select wcp-settings-field" data-path="aiPreferences.appDefault.model">';
      html += '<option value=""' + (!defModel ? ' selected' : '') + '>— Auto —</option>';
      var defModels = defProvider ? (LLMService.getActiveModels(defProvider) || []) : [];
      for (var mm = 0; mm < defModels.length; mm++) {
        html += '<option value="' + esc(defModels[mm].id) + '"' + (defModels[mm].id === defModel ? ' selected' : '') + '>' + esc(defModels[mm].label || defModels[mm].id) + '</option>';
      }
      html += '</select></div>';
      html += '</div>';
      html += '<div class="wcp-form-group" style="margin-top:var(--wcp-space-3)">';
      html += '<label>Default Custom Instructions <span class="wcp-form-hint">(optional — appended to every AI prompt unless overridden in the run dialog)</span></label>';
      html += '<textarea class="wcp-textarea wcp-settings-field" data-path="aiPreferences.defaultInstructions" rows="3" placeholder="e.g. Always respond in plain English. Focus on B2B SaaS context.">' + esc(defInstr) + '</textarea>';
      html += '</div>';
      html += '<div class="wcp-settings-actions"><button class="wcp-btn wcp-btn-primary" data-action="save-settings">' + icon('check') + ' Save Defaults</button></div>';
      html += '</div>';

      for (var pi = 0; pi < provs.length; pi++) {
        var p = provs[pi];
        html += '<div class="wcp-provider-card">';
        html += '<div class="wcp-provider-header"><span class="wcp-provider-name">' + icon('server') + ' ' + esc(p.label) + '</span>';
        html += '<span class="wcp-provider-key">' + esc(p.api_key ? '••••' + p.api_key.slice(-4) : 'no key') + '</span></div>';
        for (var mi = 0; mi < p.activeModels.length; mi++) {
          var m = p.activeModels[mi];
          html += '<div class="wcp-model-row">';
          html += '<span class="wcp-model-name">' + esc(m.label || m.id) + '</span>';
          if (m.is_default) html += '<span class="wcp-model-default">' + icon('star') + '</span>';
          html += '<span class="wcp-model-meta">T:' + (m.temperature !== undefined ? m.temperature : '1.0') + ' / ' + (m.max_tokens || 8192) + ' tokens</span>';
          html += '</div>';
        }
        html += '</div>';
      }
    } else {
      html += '<div class="wcp-ai-status-summary wcp-ai-status-summary-off">' + icon('warning') + ' <strong>No AI providers found</strong></div>';
      html += '<div class="wcp-ai-setup-guide"><p class="wcp-text-sm">To enable AI features:</p>';
      html += '<ol class="wcp-ai-setup-steps"><li>Go to your <strong>user profile</strong> edit page</li>';
      html += '<li>Find the <strong>LLM Config</strong> field (JSON textarea)</li>';
      html += '<li>Add your API keys and model configuration</li>';
      html += '<li>Ensure the config div is exposed via <strong>Drupal Views</strong></li></ol>';
      html += '<p class="wcp-text-xs wcp-text-muted">The app looks for <code>.llm-config-data</code> or <code>.llm-brand-config-data</code> on the page.</p></div>';
    }
    // Diagnostics section
    html += '<div class="wcp-settings-section" style="margin-top:var(--wcp-space-4)"><h3>' + icon('stethoscope') + ' Diagnostics</h3>';
    html += '<div style="font-size:var(--wcp-font-size-xs);color:var(--wcp-text-secondary);display:grid;grid-template-columns:1fr 1fr;gap:var(--wcp-space-2)">';
    html += '<div><strong>Config source:</strong> ' + esc(diag.configSource) + '</div>';
    html += '<div><strong>Providers loaded:</strong> ' + diag.providerCount + '</div>';
    html += '<div><strong>.llm-brand-config-data:</strong> ' + (diag.brandDivExists ? '<span style="color:var(--wcp-success)">Found</span>' : '<span style="color:var(--wcp-text-muted)">Not found</span>') + '</div>';
    html += '<div><strong>.llm-config-data:</strong> ' + (diag.userDivExists ? '<span style="color:var(--wcp-success)">Found</span>' : '<span style="color:var(--wcp-text-muted)">Not found</span>') + '</div>';
    if (diag.retryAttempts > 0) html += '<div><strong>Retry attempts:</strong> ' + diag.retryAttempts + '</div>';
    if (diag.lastError) html += '<div style="grid-column:1/-1;color:var(--wcp-error)"><strong>Last error:</strong> ' + esc(diag.lastError) + '</div>';
    if (diag.retrying) html += '<div style="grid-column:1/-1;color:var(--wcp-warning)">' + icon('spinner') + ' Retrying config loading...</div>';
    html += '</div>';
    html += '<div style="margin-top:var(--wcp-space-3)"><button class="wcp-btn wcp-btn-outline wcp-btn-sm" data-action="reload-llm-config">' + icon('rotate-right') + ' Reload Config</button></div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  // ── Cascade: when default provider changes, re-render so models repopulate ──
  $(document).off('change.wcpAITabProv').on('change.wcpAITabProv', 'select.wcp-settings-field[data-path="aiPreferences.appDefault.provider"]', function() {
    var newPid = $(this).val();
    var models = newPid ? (LLMService.getActiveModels(newPid) || []) : [];
    // Reset model to first available so the saved combo stays valid
    if (S.meta && S.meta.aiPreferences) {
      S.meta.aiPreferences.appDefault = S.meta.aiPreferences.appDefault || {};
      S.meta.aiPreferences.appDefault.model = models.length ? models[0].id : '';
    }
    if (typeof render === 'function') render();
  });

  // ── Tab 4: AI Actions (per-action preferences) ──
