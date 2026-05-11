  // ── Wizard event handlers ──
  function setupWizardEvents() {
    var ns = '.wcp2b-wiz';
    $(document).off('click' + ns + '-next').on('click' + ns + '-next', '[data-action="wizard-next"]', wizardNextStep);
    $(document).off('click' + ns + '-prev').on('click' + ns + '-prev', '[data-action="wizard-prev"]', wizardPrevStep);
    $(document).off('click' + ns + '-step').on('click' + ns + '-step', '[data-action="wizard-go-step"]', function() {
      var step = parseInt($(this).data('step'), 10);
      if (!isNaN(step)) wizardGoToStep(step);
    });
    $(document).off('click' + ns + '-complete').on('click' + ns + '-complete', '[data-action="wizard-complete"]', wizardCompleteSetup);
    $(document).off('click' + ns + '-reset').on('click' + ns + '-reset', '[data-action="wizard-reset"]', function() {
      openConfirmDialog({
        title: 'Re-enter Setup Wizard',
        message: 'This will reset your workspace configuration and restart the setup wizard. Your content data will not be deleted.',
        confirmLabel: 'Reset & Restart',
        danger: true,
        onConfirm: wizardResetSetup
      });
    });

    // AI buttons
    $(document).off('click' + ns + '-ai-brand').on('click' + ns + '-ai-brand', '[data-action="wizard-ai-brand"]', wizardAISuggestBrand);
    $(document).off('click' + ns + '-ai-hubs').on('click' + ns + '-ai-hubs', '[data-action="wizard-ai-hubs"]', wizardAISuggestHubs);
    $(document).off('click' + ns + '-ai-clusters').on('click' + ns + '-ai-clusters', '[data-action="wizard-ai-clusters"]', function() {
      var hubIdx = parseInt($(this).data('hub-index'), 10);
      if (!isNaN(hubIdx)) wizardAISuggestClusters(hubIdx);
    });
    $(document).off('click' + ns + '-ai-types').on('click' + ns + '-ai-types', '[data-action="wizard-ai-types"]', wizardAISuggestTypes);
    $(document).off('click' + ns + '-ai-seo').on('click' + ns + '-ai-seo', '[data-action="wizard-ai-seo"]', wizardAISuggestSEOGoals);
    $(document).off('click' + ns + '-ai-test').on('click' + ns + '-ai-test', '[data-action="wizard-ai-test"]', wizardAITestConnection);

    // Dynamic add/remove
    $(document).off('click' + ns + '-add-hub').on('click' + ns + '-add-hub', '[data-action="wizard-add-hub"]', wizardAddHub);
    $(document).off('click' + ns + '-rm-hub').on('click' + ns + '-rm-hub', '[data-action="wizard-remove-hub"]', function() {
      var idx = parseInt($(this).data('index'), 10);
      if (!isNaN(idx)) wizardRemoveHub(idx);
    });
    $(document).off('click' + ns + '-add-cl').on('click' + ns + '-add-cl', '[data-action="wizard-add-cluster"]', function() {
      var hubIdx = parseInt($(this).data('hub-index'), 10);
      if (!isNaN(hubIdx)) wizardAddCluster(hubIdx);
    });
    $(document).off('click' + ns + '-rm-cl').on('click' + ns + '-rm-cl', '[data-action="wizard-remove-cluster"]', function() {
      var clIdx = parseInt($(this).data('cluster-index'), 10);
      if (!isNaN(clIdx)) wizardRemoveCluster(clIdx);
    });
    $(document).off('click' + ns + '-toggle-type').on('click' + ns + '-toggle-type', '[data-action="wizard-toggle-type"]', function() {
      var typeId = $(this).data('type-id');
      if (typeId) wizardToggleType(typeId);
    });
    $(document).off('click' + ns + '-rm-ctype').on('click' + ns + '-rm-ctype', '[data-action="wizard-remove-custom-type"]', function() {
      var idx = parseInt($(this).data('custom-index'), 10);
      if (!isNaN(idx)) wizardRemoveCustomType(idx);
    });

    // Auto-save on field blur
    $(document).off('blur' + ns + '-field').on('blur' + ns + '-field', '.wcp-wizard-field', function() {
      wizardSaveStepData();
    });
    $(document).off('change' + ns + '-select').on('change' + ns + '-select', 'select.wcp-wizard-field', function() {
      wizardSaveStepData();
    });
  }
