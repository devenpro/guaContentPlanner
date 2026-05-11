  function renderBrandTab() {
    var bce = (S.meta && S.meta.settings && S.meta.settings.brand_context_enabled) || {};
    var html = '<div class="wcp-settings-panel">';
    html += '<div class="wcp-settings-section"><h3>' + icon('building') + ' Brand Data Sources</h3>';
    html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Toggle which brand context sections to include in AI prompts.</p>';
    var sections = [
      { key: 'core', label: 'Core Brand', desc: 'Brand name, voice, audience, pain points, dos/donts, forbidden words' },
      { key: 'content', label: 'Content Writing', desc: 'Writing style, sentence rules, CTA style' },
      { key: 'seo', label: 'SEO Strategy', desc: 'Niche, keyword clusters, content gaps, markets' }
    ];
    for (var si = 0; si < sections.length; si++) {
      var sec = sections[si];
      var enabled = bce[sec.key] !== false;
      html += '<div class="wcp-config-item">';
      html += '<label class="wcp-toggle"><input type="checkbox" class="wcp-brand-toggle" data-brand-key="' + sec.key + '"' + (enabled ? ' checked' : '') + '> <span class="wcp-toggle-track"><span class="wcp-toggle-thumb"></span></span></label>';
      html += '<div><div class="wcp-config-item-name">' + sec.label + '</div>';
      html += '<div class="wcp-text-sm wcp-text-muted">' + sec.desc + '</div></div></div>';
    }
    html += '</div>';
    // Brand preview
    if (BrandService.isConfigured()) {
      html += '<div class="wcp-settings-section"><h3>' + icon('eye') + ' Brand Preview</h3>';
      var core = BrandService.getCore();
      if (core.brand_name) html += '<div class="wcp-form-group"><label>Brand Name</label><div class="wcp-text-sm">' + esc(core.brand_name) + '</div></div>';
      if (core.brand_voice) html += '<div class="wcp-form-group"><label>Voice</label><div class="wcp-text-sm">' + esc(core.brand_voice) + '</div></div>';
      if (core.audience && core.audience.primary) html += '<div class="wcp-form-group"><label>Audience</label><div class="wcp-text-sm">' + esc(core.audience.primary) + '</div></div>';
      var seo = BrandService.getSeo();
      if (seo.niche) html += '<div class="wcp-form-group"><label>Niche</label><div class="wcp-text-sm">' + esc(seo.niche) + '</div></div>';
      html += '</div>';
    } else {
      html += '<div class="wcp-settings-section"><h3>' + icon('warning') + ' No Brand Data</h3>';
      html += '<p class="wcp-text-sm wcp-text-muted">Brand data is parsed from <code>.brand-data</code> divs on the page. Configure your brand profile in Drupal and expose it via Views.</p></div>';
    }
    html += '<div class="wcp-settings-actions"><button class="wcp-btn wcp-btn-primary" data-action="save-settings">' + icon('check') + ' Save</button></div></div>';
    return html;
  }

  // ── Tab 3: AI Providers ──
