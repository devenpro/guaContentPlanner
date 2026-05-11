  function renderWizardStep4() {
    var sd = wizardGetSD();
    var sg = sd.seoGoals || {};

    var html = '<div class="wcp-wizard-step-header">';
    html += '<h2>' + icon('bullseye') + ' SEO Goals</h2>';
    html += '<p>Set targets for your content strategy. These drive dashboard tracking and AI recommendations.</p>';
    html += '</div>';

    if (LLMService.isConfigured()) {
      html += '<div style="margin-bottom:var(--wcp-space-4)"><button class="wcp-wizard-ai-btn" data-action="wizard-ai-seo">' + icon('sparkles') + ' Suggest Realistic Goals</button></div>';
    }

    html += '<div class="wcp-wizard-seo-grid">';

    html += '<div class="wcp-wizard-seo-card"><h4>' + icon('file-lines') + ' Monthly Content Target</h4>';
    html += '<div class="wcp-wizard-field-group"><label class="wcp-wizard-field-required">Articles per month</label>';
    html += '<input type="number" class="wcp-input wcp-wizard-field" data-wizard-path="seoGoals.monthly_target" value="' + (sg.monthly_target || '') + '" placeholder="e.g., 8" min="1"></div></div>';

    html += '<div class="wcp-wizard-seo-card"><h4>' + icon('chart-line') + ' Domain Authority</h4>';
    html += '<div class="wcp-wizard-field-row">';
    html += '<div class="wcp-wizard-field-group"><label>Current DA</label><input type="number" class="wcp-input wcp-wizard-field" data-wizard-path="seoGoals.da_current" value="' + (sg.da_current || '') + '" placeholder="0-100" min="0" max="100"></div>';
    html += '<div class="wcp-wizard-field-group"><label>Target DA</label><input type="number" class="wcp-input wcp-wizard-field" data-wizard-path="seoGoals.da_target" value="' + (sg.da_target || '') + '" placeholder="e.g., 40" min="0" max="100"></div>';
    html += '</div></div>';

    html += '<div class="wcp-wizard-seo-card"><h4>' + icon('arrow-trend-up') + ' Organic Traffic</h4>';
    html += '<div class="wcp-wizard-field-row">';
    html += '<div class="wcp-wizard-field-group"><label>Current (monthly)</label><input type="number" class="wcp-input wcp-wizard-field" data-wizard-path="seoGoals.traffic_current" value="' + (sg.traffic_current || '') + '" placeholder="e.g., 5000" min="0"></div>';
    html += '<div class="wcp-wizard-field-group"><label>Target (monthly)</label><input type="number" class="wcp-input wcp-wizard-field" data-wizard-path="seoGoals.traffic_target" value="' + (sg.traffic_target || '') + '" placeholder="e.g., 25000" min="0"></div>';
    html += '</div></div>';

    html += '<div class="wcp-wizard-seo-card"><h4>' + icon('ranking-star') + ' Keywords in Top 10</h4>';
    html += '<div class="wcp-wizard-field-row">';
    html += '<div class="wcp-wizard-field-group"><label>Current</label><input type="number" class="wcp-input wcp-wizard-field" data-wizard-path="seoGoals.keywords_current" value="' + (sg.keywords_current || '') + '" placeholder="e.g., 10" min="0"></div>';
    html += '<div class="wcp-wizard-field-group"><label>Target</label><input type="number" class="wcp-input wcp-wizard-field" data-wizard-path="seoGoals.keywords_target" value="' + (sg.keywords_target || '') + '" placeholder="e.g., 50" min="0"></div>';
    html += '</div></div>';

    html += '</div>';

    html += '<div class="wcp-wizard-field-group" style="margin-top:var(--wcp-space-4)"><label>Primary Markets</label>';
    html += '<input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="seoGoals.primary_markets" value="' + esc((sg.primary_markets || []).join(', ')) + '" placeholder="Comma-separated, e.g., US, UK, India"></div>';

    return html;
  }

  // ── Step 5: AI Configuration ──
