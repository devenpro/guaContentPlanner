  function renderWizardStep0() {
    var sd = wizardGetSD();
    var html = '<div class="wcp-wizard-step-header">';
    html += '<h2>' + icon('hand-wave') + ' Welcome!</h2>';
    html += '<p>Let\'s set up your content planning workspace. This wizard will guide you through configuring your brand, content strategy, SEO goals, and AI tools.</p>';
    html += '</div>';

    html += '<div class="wcp-card"><div class="wcp-card-body">';
    html += '<div class="wcp-wizard-field-group"><label class="wcp-wizard-field-required">Workspace Name</label>';
    html += '<input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="workspaceName" placeholder="e.g., My Brand Content Hub" value="' + esc(sd.workspaceName || '') + '"></div>';

    html += '<div class="wcp-wizard-field-group"><label>Description</label>';
    html += '<textarea class="wcp-textarea wcp-wizard-field" data-wizard-path="workspaceDescription" rows="2" placeholder="Brief description of this workspace...">' + esc(sd.workspaceDescription || '') + '</textarea></div>';

    html += '<div class="wcp-wizard-field-group"><label>Timezone</label>';
    html += '<select class="wcp-select wcp-wizard-field" data-wizard-path="timezone">';
    var curTz = sd.timezone || (S.meta && S.meta.settings && S.meta.settings.timezone) || 'Asia/Kolkata';
    for (var ti = 0; ti < TIMEZONE_LIST.length; ti++) {
      html += '<option value="' + TIMEZONE_LIST[ti] + '"' + (curTz === TIMEZONE_LIST[ti] ? ' selected' : '') + '>' + TIMEZONE_LIST[ti] + '</option>';
    }
    html += '</select></div>';
    html += '</div></div>';
    return html;
  }

  // ── Step 1: Brand Profile ──
