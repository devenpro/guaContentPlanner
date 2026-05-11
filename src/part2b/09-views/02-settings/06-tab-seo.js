  function renderSEOTab() {
    var goals = (S.meta && S.meta.settings && S.meta.settings.seo_goals) || {};
    var html = '<div class="wcp-settings-panel">';
    html += '<div class="wcp-settings-section"><h3>' + icon('chart-line') + ' SEO Targets</h3>';
    html += '<div class="wcp-form-row"><div class="wcp-form-third"><label>Monthly Content Target</label>';
    html += '<input type="number" class="wcp-input wcp-settings-field" data-path="settings.seo_goals.monthly_target" value="' + (goals.monthly_target || 12) + '"></div>';
    html += '<div class="wcp-form-third"><label>DA Current</label>';
    html += '<input type="number" class="wcp-input wcp-settings-field" data-path="settings.seo_goals.da_current" value="' + (goals.da_current || 0) + '"></div>';
    html += '<div class="wcp-form-third"><label>DA Target</label>';
    html += '<input type="number" class="wcp-input wcp-settings-field" data-path="settings.seo_goals.da_target" value="' + (goals.da_target || 50) + '"></div></div>';
    html += '<div class="wcp-form-row"><div class="wcp-form-third"><label>Traffic Current</label>';
    html += '<input type="number" class="wcp-input wcp-settings-field" data-path="settings.seo_goals.traffic_current" value="' + (goals.traffic_current || 0) + '"></div>';
    html += '<div class="wcp-form-third"><label>Traffic Target</label>';
    html += '<input type="number" class="wcp-input wcp-settings-field" data-path="settings.seo_goals.traffic_target" value="' + (goals.traffic_target || 50000) + '"></div>';
    html += '<div class="wcp-form-third"><label>Keywords Target (Top 10)</label>';
    html += '<input type="number" class="wcp-input wcp-settings-field" data-path="settings.seo_goals.keywords_target" value="' + (goals.keywords_target || 50) + '"></div></div>';
    html += '<div class="wcp-form-group"><label>Primary Markets <span class="wcp-form-hint">(comma-separated)</span></label>';
    html += '<input type="text" class="wcp-input wcp-settings-field" data-path="settings.seo_goals.primary_markets" value="' + esc((goals.primary_markets || []).join(', ')) + '"></div>';
    html += '</div>';
    html += '<div class="wcp-settings-actions"><button class="wcp-btn wcp-btn-primary" data-action="save-settings">' + icon('check') + ' Save</button></div></div>';
    return html;
  }

  // ── Tab 6: Pipeline ──
