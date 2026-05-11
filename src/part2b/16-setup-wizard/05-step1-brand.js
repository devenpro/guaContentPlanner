  function renderWizardStep1() {
    var sd = wizardGetSD();
    var bo = sd.brandOverrides || {};
    var hasBrand = S.brand && S.brand.configured;

    var html = '<div class="wcp-wizard-step-header">';
    html += '<h2>' + icon('fingerprint') + ' Brand Profile</h2>';
    html += '<p>Your brand context helps AI generate content that matches your voice and audience.</p>';
    html += '</div>';

    if (hasBrand) {
      var bc = S.brand.core || {};
      var bseo = S.brand.seo || {};
      var bcont = S.brand.content || {};
      html += '<div class="wcp-card" style="margin-bottom:var(--wcp-space-4)"><div class="wcp-card-body">';
      html += '<div class="wcp-flex-between" style="margin-bottom:var(--wcp-space-3)"><h3 style="font-size:var(--wcp-font-size-sm)">' + icon('check-circle') + ' Brand Data Detected</h3></div>';
      var brandFields = [
        ['Brand Name', bc.brand_name || '—'],
        ['Industry / Niche', bseo.niche || '—'],
        ['Target Audience', (bc.audience && bc.audience.primary) || '—'],
        ['Brand Voice', bc.brand_voice || '—'],
        ['Writing Style', bcont.writing_style || '—'],
        ['Content Pillars', Array.isArray(bc.content_pillars) ? bc.content_pillars.join(', ') : (bc.content_pillars || '—')]
      ];
      html += '<div class="wcp-wizard-brand-grid">';
      for (var fi = 0; fi < brandFields.length; fi++) {
        html += '<div class="wcp-wizard-brand-item">';
        html += '<div class="wcp-section-label">' + esc(brandFields[fi][0]) + '</div>';
        html += '<div class="wcp-wizard-brand-val">' + esc(brandFields[fi][1]) + '</div>';
        html += '</div>';
      }
      html += '</div>';
      html += '</div></div>';

      html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Brand data is auto-loaded from your page. You can add overrides below if anything is missing or needs adjustment.</p>';
    } else {
      html += '<div class="wcp-wizard-warning">' + icon('circle-info') + ' No brand profile detected on this page. Fill in the fields below to provide brand context for AI features.</div>';
    }

    // Override / manual entry fields
    html += '<div class="wcp-card"><div class="wcp-card-body">';
    html += '<h3 style="font-size:var(--wcp-font-size-sm);margin-bottom:var(--wcp-space-3)">' + icon('pen') + ' Brand Overrides</h3>';

    if (LLMService.isConfigured()) {
      html += '<div style="margin-bottom:var(--wcp-space-4)"><button class="wcp-wizard-ai-btn" data-action="wizard-ai-brand">' + icon('sparkles') + ' Suggest Brand Details</button></div>';
    }

    html += '<div class="wcp-wizard-field-row">';
    html += '<div class="wcp-wizard-field-group"><label>Brand Name</label><input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="brandOverrides.brand_name" placeholder="Your brand name" value="' + esc(bo.brand_name || '') + '"></div>';
    html += '<div class="wcp-wizard-field-group"><label>Industry / Niche</label><input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="brandOverrides.industry" placeholder="e.g., Digital Marketing" value="' + esc(bo.industry || '') + '"></div>';
    html += '</div>';
    html += '<div class="wcp-wizard-field-row">';
    html += '<div class="wcp-wizard-field-group"><label>Target Audience</label><input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="brandOverrides.target_audience" placeholder="e.g., Small business owners" value="' + esc(bo.target_audience || '') + '"></div>';
    html += '<div class="wcp-wizard-field-group"><label>Brand Voice</label><input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="brandOverrides.brand_voice" placeholder="e.g., Professional yet approachable" value="' + esc(bo.brand_voice || '') + '"></div>';
    html += '</div>';
    html += '<div class="wcp-wizard-field-group"><label>Writing Style</label><input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="brandOverrides.writing_style" placeholder="e.g., Clear, data-driven, actionable" value="' + esc(bo.writing_style || '') + '"></div>';
    html += '<div class="wcp-wizard-field-group"><label>Content Pillars</label><input type="text" class="wcp-input wcp-wizard-field" data-wizard-path="brandOverrides.content_pillars" placeholder="Comma-separated, e.g., SEO, Content Marketing, Analytics" value="' + esc(bo.content_pillars || '') + '"></div>';
    html += '</div></div>';

    return html;
  }

  // ── Step 2: Content Strategy (Hubs & Clusters) ──
