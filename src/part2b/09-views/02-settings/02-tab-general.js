  function renderGeneralTab() {
    // Workspace section + Pipeline section + Data Management + Setup Wizard
    return renderWorkspaceTab();
  }

  function renderWorkspaceTab() {
    var ws = (S.meta && S.meta.workspace) || {};
    var stg = (S.meta && S.meta.settings) || {};
    var html = '<div class="wcp-settings-panel">';
    html += '<div class="wcp-settings-section"><h3>' + icon('briefcase') + ' Workspace</h3>';
    html += '<div class="wcp-form-group"><label>Workspace Name</label><input type="text" class="wcp-input wcp-settings-field" data-path="workspace.name" value="' + esc(ws.name || '') + '"></div>';
    html += '<div class="wcp-form-group"><label>Description</label><textarea class="wcp-textarea wcp-settings-field" data-path="workspace.description" rows="2">' + esc(ws.description || '') + '</textarea></div>';
    html += '<div class="wcp-form-group"><label>Timezone</label><select class="wcp-select wcp-settings-field" data-path="settings.timezone">';
    var tzList = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Kolkata', 'Asia/Shanghai', 'Australia/Sydney'];
    for (var tz = 0; tz < tzList.length; tz++) html += '<option value="' + tzList[tz] + '"' + (stg.timezone === tzList[tz] ? ' selected' : '') + '>' + tzList[tz] + '</option>';
    html += '</select></div></div>';
    html += '<div class="wcp-settings-section"><h3>' + icon('database') + ' Data Management</h3>';
    html += '<div class="wcp-settings-actions">';
    html += '<button class="wcp-btn wcp-btn-outline" data-action="export-json">' + icon('download') + ' Export Workspace</button>';
    html += '<button class="wcp-btn wcp-btn-outline" data-action="import-json">' + icon('upload') + ' Import Workspace</button>';
    html += '<input type="file" id="wcpImportFile" accept=".json" style="display:none">';
    html += '</div></div>';
    if (ws.configured) {
      html += '<div class="wcp-settings-section"><h3>' + icon('wand-magic-sparkles') + ' Setup Wizard</h3>';
      html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Re-run the setup wizard to reconfigure your workspace. Your existing content will not be deleted.</p>';
      html += '<button class="wcp-btn wcp-btn-outline" data-action="wizard-reset">' + icon('rotate-left') + ' Re-enter Setup Wizard</button>';
      html += '</div>';
    }
    // Pipeline config (merged from old Pipeline tab)
    var stages = (S.meta && S.meta.settings && S.meta.settings.pipeline_stages) || [];
    var STEPS = Constants.PIPELINE_STEPS;
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

  // ── Tab 2: Brand Context ──
