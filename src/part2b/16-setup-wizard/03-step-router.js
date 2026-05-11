  function renderWizardStep(idx) {
    switch (idx) {
      case 0: return renderWizardStep0();
      case 1: return renderWizardStep1();
      case 2: return renderWizardStep2();
      case 3: return renderWizardStep3();
      case 4: return renderWizardStep4();
      case 5: return renderWizardStep5();
      case 6: return renderWizardStep6();
      default: return renderWizardStep0();
    }
  }

  // ── Step 0: Welcome & Workspace ──
