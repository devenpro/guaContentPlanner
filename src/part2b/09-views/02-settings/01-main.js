  // ============================================================
  // SECTION 10: SETTINGS VIEW (7 Tabs)
  // ============================================================

  function renderSettingsView() {
    if (!S || !icon) return '<div class="wcp-view"><p>Settings view not ready — please reload.</p></div>';
    var tab = S.settingsTab || 'general';
    // Migration: map old tab keys to new merged keys
    if (tab === 'workspace' || tab === 'pipeline') tab = 'general';
    if (tab === 'actions') tab = 'ai';
    var tabs = [
      { key: 'general',  label: 'General',        icon: 'briefcase' },
      { key: 'brand',    label: 'Brand Context',   icon: 'building' },
      { key: 'ai',       label: 'AI',              icon: 'sparkles' },
      { key: 'seo',      label: 'SEO Goals',       icon: 'chart-line' },
      { key: 'export',   label: 'Export to CW',    icon: 'paper-plane' }
    ];

    var html = '<div class="wcp-view wcp-view-settings">';
    html += '<div class="wcp-view-header"><h1>' + icon('gear') + ' Settings</h1></div>';
    html += '<div class="wcp-settings-tabs">';
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      html += '<button class="wcp-settings-tab' + (tab === t.key ? ' wcp-settings-tab-active' : '') + '" data-action="settings-tab" data-tab="' + t.key + '">' + icon(t.icon) + ' ' + esc(t.label) + '</button>';
    }
    html += '</div><div class="wcp-settings-body">';
    switch(tab) {
      case 'general':   html += renderGeneralTab(); break;
      case 'brand':     html += renderBrandTab(); break;
      case 'ai':        html += renderAITab() + renderActionsTab(); break;
      case 'seo':       html += renderSEOTab(); break;
      case 'export':    html += renderExportTab(); break;
    }
    html += '</div></div>';
    return html;
  }

  // ── Tab 1: General (merged Workspace + Pipeline) ──
