  // Research tab bodies — Keyword Research + Competitor Research.

  function renderResearchKeywords() {
    var hubs = S.data.hubs || [];
    var html = '';

    // ── Primary action: keyword research ──
    html += '<h3 style="margin-bottom:var(--wcp-space-2)">' + icon('key') + ' Keyword Research</h3>';
    html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Enter a seed keyword to discover related keywords grouped by intent. Each group can be promoted to a content piece.</p>';
    html += '<div class="wcp-form-group"><label>Seed Keyword</label>';
    html += '<input type="text" class="wcp-input" id="wcpResearchInput" placeholder="e.g. project management software"></div>';
    html += '<div class="wcp-form-row"><div class="wcp-form-half">';
    html += '<label>Results</label><select class="wcp-select" id="wcpResearchCount">';
    [10, 15, 20, 30].forEach(function(n) { html += '<option value="' + n + '"' + (n === 15 ? ' selected' : '') + '>' + n + ' keywords</option>'; });
    html += '</select></div><div class="wcp-form-half">';
    html += '<label>&nbsp;</label>';
    html += '<label class="wcp-toggle"><input type="checkbox" id="wcpResearchBrand"> <span class="wcp-toggle-track"><span class="wcp-toggle-thumb"></span></span><span class="wcp-toggle-label">Brand Context</span></label>';
    html += '</div></div>';
    html += '<div style="display:flex;gap:var(--wcp-space-2);margin-top:var(--wcp-space-3);align-items:center;flex-wrap:wrap">';
    html += '<button class="wcp-btn wcp-btn-ai" data-action="run-keyword-research">' + icon('sparkles') + ' Research Keywords</button>';
    html += LLMService.renderInlinePicker('research_keywords');
    html += '</div>';

    // ── Sub-action: find content gaps ──
    html += '<div class="wcp-section-divider" style="margin:var(--wcp-space-5) 0 var(--wcp-space-3)"></div>';
    html += '<details class="wcp-gap-details"><summary style="cursor:pointer;font-weight:600;padding:var(--wcp-space-2) 0">' + icon('magnifying-glass') + ' Find content gaps in existing content</summary>';
    html += '<div style="padding-top:var(--wcp-space-3)">';
    html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Scan your existing content inventory and surface missing topics, intents, or formats. Each gap can be promoted to a new content piece.</p>';
    html += '<div class="wcp-form-row"><div class="wcp-form-half">';
    html += '<label>Scope</label><select class="wcp-select" id="wcpGapScope">';
    html += '<option value="all">All Content (' + (S.data.content || []).length + ' pieces)</option>';
    for (var hi = 0; hi < hubs.length; hi++) {
      var hcnt = getHubContent(hubs[hi].id).length;
      html += '<option value="' + esc(hubs[hi].id) + '">' + esc(hubs[hi].name) + ' (' + hcnt + ')</option>';
    }
    html += '</select></div><div class="wcp-form-half">';
    html += '<label>&nbsp;</label>';
    html += '<label class="wcp-toggle"><input type="checkbox" id="wcpGapBrand" checked> <span class="wcp-toggle-track"><span class="wcp-toggle-thumb"></span></span><span class="wcp-toggle-label">Brand Context</span></label>';
    html += '</div></div>';
    html += '<div style="display:flex;gap:var(--wcp-space-2);margin-top:var(--wcp-space-3);align-items:center">';
    html += '<button class="wcp-btn wcp-btn-outline" data-action="find-content-gaps">' + icon('magnifying-glass') + ' Find Gaps</button>';
    html += LLMService.renderInlinePicker('research_gaps');
    html += '</div>';
    html += '</div></details>';

    return html;
  }

  function renderResearchCompetitor() {
    var html = '<h3 style="margin-bottom:var(--wcp-space-2)">' + icon('chart-bar') + ' Competitor Research</h3>';
    html += '<p class="wcp-text-sm wcp-text-muted" style="margin-bottom:var(--wcp-space-3)">Analyze competitor content strategy to surface opportunities they miss. Each opportunity can be promoted to a content piece.</p>';
    html += '<div class="wcp-form-group"><label>Competitor Info</label>';
    html += '<textarea class="wcp-textarea" id="wcpCompInput" rows="2" placeholder="Competitor names, URLs, or describe their content approach..."></textarea></div>';
    html += '<div class="wcp-form-group"><label>Focus Area</label>';
    html += '<input type="text" class="wcp-input" id="wcpCompFocus" placeholder="e.g. Their blog strategy, keyword targets, content gaps..."></div>';
    html += '<div style="display:flex;gap:var(--wcp-space-2);align-items:center">';
    html += '<label class="wcp-toggle"><input type="checkbox" id="wcpCompBrand" checked> <span class="wcp-toggle-track"><span class="wcp-toggle-thumb"></span></span><span class="wcp-toggle-label">Brand Context</span></label>';
    html += '</div>';
    html += '<div style="display:flex;gap:var(--wcp-space-2);margin-top:var(--wcp-space-3);align-items:center">';
    html += '<button class="wcp-btn wcp-btn-ai" data-action="run-competitor-research">' + icon('sparkles') + ' Analyze Competitors</button>';
    html += LLMService.renderInlinePicker('research_competitor');
    html += '</div>';
    return html;
  }
