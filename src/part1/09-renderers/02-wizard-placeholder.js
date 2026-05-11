  // --- Setup Wizard (loading placeholder — full wizard in Part 2B) ---
  function renderSetupWizard() {
    var html = '<div class="wcp-view"><div class="wcp-wizard">';
    html += '<div style="text-align:center;padding:var(--wcp-space-10) 0">';
    html += '<div style="font-size:48px;margin-bottom:var(--wcp-space-4);color:var(--wcp-accent)">' + icon('wand-magic-sparkles') + '</div>';
    html += '<h1 style="font-size:var(--wcp-font-size-3xl);justify-content:center">Setting Up Your Workspace</h1>';
    html += '<p class="wcp-text-sm wcp-text-muted" style="margin-top:var(--wcp-space-2)">Loading setup wizard...</p>';
    html += '<div class="wcp-wizard-spinner"></div>';
    html += '</div>';
    html += '</div></div>';
    return html;
  }
  window._wcpRenderSetupWizard = renderSetupWizard;

