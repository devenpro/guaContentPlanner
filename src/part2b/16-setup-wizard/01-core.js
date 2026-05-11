  // ============================================================
  // SECTION 16: SETUP WIZARD
  // ============================================================

  var WIZARD_STEPS = [
    { key: 'welcome',  label: 'Welcome',         icon: 'hand-wave' },
    { key: 'brand',    label: 'Brand Profile',    icon: 'fingerprint' },
    { key: 'strategy', label: 'Content Strategy', icon: 'sitemap' },
    { key: 'types',    label: 'Content Types',    icon: 'layer-group' },
    { key: 'seo',      label: 'SEO Goals',        icon: 'bullseye' },
    { key: 'ai',       label: 'AI Setup',         icon: 'sparkles' },
    { key: 'review',   label: 'Review & Launch',  icon: 'rocket-launch' }
  ];

  var TIMEZONE_LIST = ['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Sao_Paulo','Europe/London','Europe/Paris','Europe/Berlin','Europe/Moscow','Asia/Dubai','Asia/Kolkata','Asia/Bangkok','Asia/Shanghai','Asia/Tokyo','Asia/Seoul','Australia/Sydney','Pacific/Auckland'];

  function wizardGetSD() {
    S.meta.workspace.setupData = S.meta.workspace.setupData || {};
    return S.meta.workspace.setupData;
  }

  function wizardGetStep() {
    return S.meta.workspace.setupStep || 0;
  }

  // ── Main wizard renderer ──
  function renderFullSetupWizard() {
    var step = wizardGetStep();
    var sd = wizardGetSD();

    // Log first open
    if (!S.meta.workspace.setupStarted) {
      S.meta.workspace.setupStarted = new Date().toISOString();
      logActivity('setup_started', '', '', 'Setup wizard started');
      syncToTextarea();
    }

    var html = '<div class="wcp-view"><div class="wcp-wizard">';

    // Progress stepper
    html += renderWizardProgress(step);

    // Step content
    html += '<div class="wcp-wizard-body" id="wizardStepBody">';
    html += renderWizardStep(step);
    html += '</div>';

    // Navigation footer
    html += '<div class="wcp-wizard-nav">';
    html += '<div>';
    if (step > 0) html += '<button class="wcp-btn wcp-btn-outline" data-action="wizard-prev">' + icon('arrow-left') + ' Back</button>';
    html += '</div>';
    html += '<div class="wcp-wizard-nav-step">Step ' + (step + 1) + ' of ' + WIZARD_STEPS.length + '</div>';
    html += '<div>';
    if (step < WIZARD_STEPS.length - 1) {
      html += '<button class="wcp-btn wcp-btn-primary" data-action="wizard-next">Next ' + icon('arrow-right') + '</button>';
    } else {
      html += '<button class="wcp-btn wcp-btn-primary" data-action="wizard-complete" style="background:var(--wcp-success);border-color:var(--wcp-success)">' + icon('rocket-launch') + ' Launch Workspace</button>';
    }
    html += '</div>';
    html += '</div>';

    html += '</div></div>';
    return html;
  }

