  function renderWizardStep6() {
    var sd = wizardGetSD();
    var html = '<div class="wcp-wizard-step-header">';
    html += '<h2>' + icon('rocket-launch') + ' Review & Launch</h2>';
    html += '<p>Review your workspace configuration before launching.</p>';
    html += '</div>';

    // Workspace
    html += '<div class="wcp-wizard-review-card">';
    html += '<div class="wcp-wizard-review-header"><h4>' + icon('briefcase') + ' Workspace</h4>';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="wizard-go-step" data-step="0">' + icon('pen') + ' Edit</button></div>';
    html += '<dl class="wcp-wizard-review-items">';
    html += '<dt>Name</dt><dd>' + esc(sd.workspaceName || '(Not set)') + '</dd>';
    html += '<dt>Timezone</dt><dd>' + esc(sd.timezone || 'Default') + '</dd>';
    if (sd.workspaceDescription) { html += '<dt>Description</dt><dd>' + esc(sd.workspaceDescription) + '</dd>'; }
    html += '</dl></div>';

    // Brand
    html += '<div class="wcp-wizard-review-card">';
    html += '<div class="wcp-wizard-review-header"><h4>' + icon('fingerprint') + ' Brand Profile</h4>';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="wizard-go-step" data-step="1">' + icon('pen') + ' Edit</button></div>';
    var bo = sd.brandOverrides || {};
    var hasBrand = S.brand && S.brand.configured;
    if (hasBrand) {
      html += '<p class="wcp-text-sm" style="color:var(--wcp-success)">' + icon('check-circle') + ' Brand data loaded from page</p>';
    }
    var boKeys = Object.keys(bo).filter(function(k) { return bo[k]; });
    if (boKeys.length) {
      html += '<dl class="wcp-wizard-review-items">';
      for (var bi = 0; bi < boKeys.length; bi++) { html += '<dt>' + esc(boKeys[bi].replace(/_/g, ' ')) + '</dt><dd>' + esc(bo[boKeys[bi]]) + '</dd>'; }
      html += '</dl>';
    } else if (!hasBrand) {
      html += '<div class="wcp-wizard-warning">' + icon('circle-info') + ' No brand data — AI features will work without brand context</div>';
    }
    html += '</div>';

    // Hubs
    var hubs = sd.contentHubs || [];
    var clusters = sd.contentClusters || [];
    html += '<div class="wcp-wizard-review-card">';
    html += '<div class="wcp-wizard-review-header"><h4>' + icon('sitemap') + ' Content Strategy</h4>';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="wizard-go-step" data-step="2">' + icon('pen') + ' Edit</button></div>';
    if (hubs.length) {
      html += '<div class="wcp-wizard-review-items">';
      for (var hi = 0; hi < hubs.length; hi++) {
        var hcl = clusters.filter(function(c) { return c.hub_index === hi; });
        html += '<div style="margin-bottom:var(--wcp-space-2)"><strong>' + esc(hubs[hi].name || 'Unnamed Hub') + '</strong>';
        if (hubs[hi].pillar_keyword) html += ' ' + badge(hubs[hi].pillar_keyword, hubs[hi].color || '#2563eb');
        if (hcl.length) html += '<div class="wcp-text-sm wcp-text-muted" style="margin-top:2px">' + hcl.length + ' cluster' + (hcl.length !== 1 ? 's' : '') + ': ' + hcl.map(function(c) { return c.name; }).filter(Boolean).join(', ') + '</div>';
        html += '</div>';
      }
      html += '</div>';
    } else {
      html += '<div class="wcp-wizard-warning">' + icon('warning') + ' No content hubs created — add at least one hub</div>';
    }
    html += '</div>';

    // Content Types
    var defaultTypes = (window._wcpGetDefaultContentTypes || function() { return []; })();
    var selectedIds = sd.selectedTypeIds || defaultTypes.map(function(t) { return t.id; });
    var selectedTypes = defaultTypes.filter(function(t) { return selectedIds.indexOf(t.id) !== -1; });
    var customTypes = sd.customTypes || [];
    html += '<div class="wcp-wizard-review-card">';
    html += '<div class="wcp-wizard-review-header"><h4>' + icon('layer-group') + ' Content Types</h4>';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="wizard-go-step" data-step="3">' + icon('pen') + ' Edit</button></div>';
    html += '<div class="wcp-wizard-review-items">' + selectedTypes.concat(customTypes).map(function(t) { return '<span style="display:inline-block;margin:2px 4px 2px 0">' + badge(t.name, t.color || '#80868b') + '</span>'; }).join('') + '</div>';
    html += '</div>';

    // SEO Goals
    var sg = sd.seoGoals || {};
    html += '<div class="wcp-wizard-review-card">';
    html += '<div class="wcp-wizard-review-header"><h4>' + icon('bullseye') + ' SEO Goals</h4>';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="wizard-go-step" data-step="4">' + icon('pen') + ' Edit</button></div>';
    html += '<dl class="wcp-wizard-review-items">';
    html += '<dt>Monthly target</dt><dd>' + (sg.monthly_target || '(Not set)') + ' articles/mo</dd>';
    html += '<dt>Domain Authority</dt><dd>' + (sg.da_current || 0) + ' → ' + (sg.da_target || '(Not set)') + '</dd>';
    html += '<dt>Organic Traffic</dt><dd>' + formatNumber(sg.traffic_current || 0) + ' → ' + formatNumber(sg.traffic_target || 0) + ' sessions/mo</dd>';
    html += '<dt>Keywords Top 10</dt><dd>' + (sg.keywords_current || 0) + ' → ' + (sg.keywords_target || '(Not set)') + '</dd>';
    html += '</dl></div>';

    // AI
    html += '<div class="wcp-wizard-review-card">';
    html += '<div class="wcp-wizard-review-header"><h4>' + icon('sparkles') + ' AI Configuration</h4>';
    html += '<button class="wcp-btn wcp-btn-sm wcp-btn-ghost" data-action="wizard-go-step" data-step="5">' + icon('pen') + ' Edit</button></div>';
    if (LLMService.isConfigured()) {
      var def = LLMService.getDefault();
      html += '<p class="wcp-text-sm" style="color:var(--wcp-success)">' + icon('check-circle') + ' AI configured' + (def ? ' — default: ' + esc(def.provider + '/' + def.model) : '') + '</p>';
      if (sd.aiTested) html += '<p class="wcp-text-sm" style="color:var(--wcp-success)">' + icon('flask') + ' Connection verified</p>';
    } else {
      html += '<div class="wcp-wizard-warning">' + icon('circle-info') + ' No AI providers — AI features will be unavailable</div>';
    }
    html += '</div>';

    // Final validation warnings
    var validation = wizardValidateAll();
    if (validation.warnings.length) {
      html += '<div style="margin-top:var(--wcp-space-4)">';
      for (var wi = 0; wi < validation.warnings.length; wi++) {
        html += '<div class="wcp-wizard-warning">' + icon('circle-info') + ' ' + esc(validation.warnings[wi]) + '</div>';
      }
      html += '</div>';
    }
    if (validation.errors.length) {
      html += '<div style="margin-top:var(--wcp-space-4)">';
      for (var ei = 0; ei < validation.errors.length; ei++) {
        html += '<div class="wcp-wizard-error">' + icon('circle-exclamation') + ' ' + esc(validation.errors[ei]) + '</div>';
      }
      html += '</div>';
    }

    return html;
  }

  // ── Save step data from DOM ──
