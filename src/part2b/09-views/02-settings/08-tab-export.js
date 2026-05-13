  function renderExportTab() {
    var ec = (S.meta && S.meta.settings && S.meta.settings.export_config) || {};
    var html = '<div class="wcp-settings-panel">';
    html += '<div class="wcp-settings-section"><h3>' + icon('paper-plane') + ' Content Writer Export</h3>';
    html += '<div class="wcp-form-group"><label>CW Landing Stage</label>';
    html += '<select class="wcp-select wcp-settings-field" data-path="settings.export_config.cw_landing_stage">';
    var cwStages = ['research', 'outline', 'writing', 'editing', 'review'];
    for (var si = 0; si < cwStages.length; si++) {
      html += '<option value="' + cwStages[si] + '"' + (ec.cw_landing_stage === cwStages[si] ? ' selected' : '') + '>' + cwStages[si].charAt(0).toUpperCase() + cwStages[si].slice(1) + '</option>';
    }
    html += '</select><div class="wcp-form-hint">Which CW pipeline stage the exported content lands at</div></div>';
    html += '</div>';
    html += '<div class="wcp-settings-section"><h3>' + icon('list-check') + ' Included Data</h3>';
    var toggles = [
      { key: 'include_writing_instructions', label: 'Writing Instructions', desc: 'AI-generated or manual writing brief' },
      { key: 'include_link_map', label: 'Internal Link Map', desc: 'Planned internal links with anchors' },
      { key: 'include_schema_plan', label: 'Schema Plan', desc: 'Schema types and section annotations' },
    ];
    for (var ti = 0; ti < toggles.length; ti++) {
      var tg = toggles[ti];
      var isOn = ec[tg.key] !== false;
      html += '<div class="wcp-config-item">';
      html += '<label class="wcp-toggle"><input type="checkbox" class="wcp-export-toggle" data-export-key="' + tg.key + '"' + (isOn ? ' checked' : '') + '> <span class="wcp-toggle-track"><span class="wcp-toggle-thumb"></span></span></label>';
      html += '<div><div class="wcp-config-item-name">' + tg.label + '</div><div class="wcp-text-sm wcp-text-muted">' + tg.desc + '</div></div></div>';
    }
    html += '</div>';
    html += '<div class="wcp-settings-section"><h3>' + icon('shuffle') + ' Research Data</h3>';
    html += '<div class="wcp-form-group"><label>Include Research Data</label>';
    html += '<select class="wcp-select wcp-settings-field" data-path="settings.export_config.include_research_data">';
    var rdOpts = [{ v: 'none', l: 'None' }, { v: 'summarized', l: 'Summarized' }, { v: 'full', l: 'Full Detail' }];
    for (var ri = 0; ri < rdOpts.length; ri++) html += '<option value="' + rdOpts[ri].v + '"' + (ec.include_research_data === rdOpts[ri].v ? ' selected' : '') + '>' + rdOpts[ri].l + '</option>';
    html += '</select></div></div>';
    html += '<div class="wcp-settings-actions"><button class="wcp-btn wcp-btn-primary" data-action="save-settings">' + icon('check') + ' Save</button></div></div>';
    return html;
  }

  function setupSettingsEvents() {
    var ns = '.wcp2b-set';

    // Save settings button
    $(document).off('click' + ns + '-sv').on('click' + ns + '-sv', '[data-action="save-settings"]', function() {
      // Collect all settings fields
      $('.wcp-settings-field').each(function() {
        var path = $(this).data('path');
        if (!path) return;
        var val = $(this).is(':checkbox') ? $(this).is(':checked') : $(this).val();
        // Handle comma-separated arrays
        if (path === 'settings.seo_goals.primary_markets') {
          val = val.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        }
        // Handle numeric fields
        if (path.indexOf('target') > -1 || path.indexOf('current') > -1 || path.indexOf('monthly') > -1) {
          val = parseInt(val, 10) || 0;
        }
        var parts = path.split('.');
        var target = S.meta;
        for (var i = 0; i < parts.length - 1; i++) { target[parts[i]] = target[parts[i]] || {}; target = target[parts[i]]; }
        target[parts[parts.length - 1]] = val;
      });
      // Brand context toggles
      $('.wcp-brand-toggle').each(function() {
        var key = $(this).data('brand-key');
        if (key) {
          S.meta.settings = S.meta.settings || {};
          S.meta.settings.brand_context_enabled = S.meta.settings.brand_context_enabled || {};
          S.meta.settings.brand_context_enabled[key] = $(this).is(':checked');
        }
      });
      // Pipeline toggles
      $('.wcp-pipeline-toggle').each(function() {
        var stepKey = $(this).data('step');
        S.meta.settings = S.meta.settings || {};
        S.meta.settings.pipeline_stages = S.meta.settings.pipeline_stages || [];
        var stages = S.meta.settings.pipeline_stages;
        var cfg = stages.find(function(s) { return s.id === stepKey; });
        if (cfg) cfg.auto_advance = $(this).is(':checked');
      });
      // Export toggles
      $('.wcp-export-toggle').each(function() {
        var key = $(this).data('export-key');
        if (key) {
          S.meta.settings = S.meta.settings || {};
          S.meta.settings.export_config = S.meta.settings.export_config || {};
          S.meta.settings.export_config[key] = $(this).is(':checked');
        }
      });
      snapshot('Settings saved');
      syncToTextarea();
      toast('Settings saved', 'success');
    });

    // Reset single AI preference
    $(document).off('click' + ns + '-rp').on('click' + ns + '-rp', '[data-action="reset-ai-pref"]', function() {
      var actionId = $(this).data('action-id');
      if (S.meta && S.meta.aiPreferences && S.meta.aiPreferences.perAction) {
        delete S.meta.aiPreferences.perAction[actionId];
        syncToTextarea(); render();
        toast('Reset preference for ' + actionId, 'success');
      }
    });

    // Reset all AI preferences
    $(document).off('click' + ns + '-ra').on('click' + ns + '-ra', '[data-action="reset-all-ai-prefs"]', function() {
      if (S.meta && S.meta.aiPreferences) {
        S.meta.aiPreferences.perAction = {};
        S.meta.aiPreferences.lastProvider = '';
        S.meta.aiPreferences.lastModel = '';
        syncToTextarea(); render();
        toast('All AI preferences reset', 'success');
      }
    });
  }

