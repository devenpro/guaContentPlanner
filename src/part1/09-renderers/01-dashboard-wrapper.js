  // ============================================================
  // SECTION 9: RENDER DELEGATION & PLACEHOLDERS
  // ============================================================

  // ─── DASHBOARD VIEW ───────────────────────────────────
  function renderDashboardView() {
    var ws = (S.meta && S.meta.workspace) || {};
    if (!ws.configured) return window._wcpRenderSetupWizard();
    return renderActiveDashboard();
  }

