  function renderPipelineTab() {
    var stages = (S.meta && S.meta.settings && S.meta.settings.pipeline_stages) || [];
    var STEPS = Constants.PIPELINE_STEPS;
    var html = '<div class="wcp-settings-panel">';
    html += '<div class="wcp-settings-section"><h3>' + icon('arrows-rotate') + ' Pipeline Configuration</h3>';
    html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Configure auto-advance behavior for each pipeline stage.</p>';
    html += '<div class="wcp-config-list">';
    for (var pi = 0; pi < STEPS.length; pi++) {
      var step = STEPS[pi];
      var cfg = stages.find(function(s) { return s.id === step.key; }) || { auto_advance: true };
      html += '<div class="wcp-config-item">';
      html += '<span style="font-size:var(--wcp-font-size-sm);color:var(--wcp-text-muted);width:20px">' + (pi + 1) + '</span>';
      html += '<span class="wcp-config-item-name">' + icon(step.icon) + ' ' + esc(step.label) + '</span>';
      html += '<label class="wcp-toggle"><input type="checkbox" class="wcp-pipeline-toggle" data-step="' + step.key + '"' + (cfg.auto_advance !== false ? ' checked' : '') + '> <span class="wcp-toggle-track"><span class="wcp-toggle-thumb"></span></span><span class="wcp-toggle-label">Auto-advance</span></label>';
      html += '</div>';
    }
    html += '</div></div>';
    html += '<div class="wcp-settings-actions"><button class="wcp-btn wcp-btn-primary" data-action="save-settings">' + icon('check') + ' Save</button></div></div>';
    return html;
  }

  // ── Tab 7: Export to CW ──
