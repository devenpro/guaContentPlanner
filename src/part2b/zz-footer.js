
  // ============================================================
  // SECTION 15: API EXPORTS
  // ============================================================

  window._wcpPart2B = {
    renderInlinePicker: LLMService.renderInlinePicker,
    callAI: LLMService.callAI,
    isAIConfigured: LLMService.isConfigured,
    getActiveProviders: LLMService.getActiveProviders,
    brandSnippet: brandSnippet,
    parseJSON: parseJSON,
    callAIWithRetry: callAIWithRetry,
    BrandService: BrandService,
    LLMService: LLMService,
    exportWorkspace: exportWorkspace,
    importWorkspace: importWorkspace,
    wizardResetSetup: wizardResetSetup
  };

  console.log('[WCP] Part 2B loaded');

})(jQuery, Drupal);
