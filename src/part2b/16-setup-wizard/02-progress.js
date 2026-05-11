  // ── Progress indicator ──
  function renderWizardProgress(currentStep) {
    var html = '<div class="wcp-wizard-progress">';
    for (var i = 0; i < WIZARD_STEPS.length; i++) {
      var ws = WIZARD_STEPS[i];
      var state = i < currentStep ? 'done' : (i === currentStep ? 'active' : '');
      var clickable = i <= currentStep;
      html += '<div class="wcp-wizard-step-ind"' + (clickable ? ' data-action="wizard-go-step" data-step="' + i + '"' : '') + '>';
      html += '<div class="wcp-wizard-step-circle ' + state + '">';
      if (state === 'done') html += icon('check');
      else html += (i + 1);
      html += '</div>';
      html += '<div class="wcp-wizard-step-label ' + state + '">' + esc(ws.label) + '</div>';
      html += '</div>';
      if (i < WIZARD_STEPS.length - 1) {
        html += '<div class="wcp-wizard-step-conn ' + (i < currentStep ? 'done' : '') + '"></div>';
      }
    }
    html += '</div>';
    return html;
  }

  // ── Step dispatcher ──
