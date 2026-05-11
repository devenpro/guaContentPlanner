  // ============================================================
  // SECTION 9: RESEARCH VIEW (2 tabs: Keyword Research + Competitor Research)
  // ============================================================

  function renderResearchView() {
    if (!S || !icon) return '<div class="wcp-view"><p>Research view not ready — please reload.</p></div>';
    S.researchTab = S.researchTab || 'keywords';
    var tab = S.researchTab;

    var html = '<div class="wcp-view wcp-view-research">';
    html += '<div class="wcp-view-header"><div class="wcp-view-header-left"><h1>' + icon('flask') + ' Research</h1>';
    html += '<span class="wcp-view-subtitle">Keyword & competitor research feeds into your content pipeline</span></div></div>';

    // ── Tab bar ──
    var tabs = [
      { key: 'keywords',   label: 'Keyword Research',    icon: 'key' },
      { key: 'competitor', label: 'Competitor Research', icon: 'chart-bar' }
    ];
    html += '<div class="wcp-settings-tabs" style="margin-bottom:var(--wcp-space-4)">';
    for (var ti = 0; ti < tabs.length; ti++) {
      var t = tabs[ti];
      html += '<button class="wcp-settings-tab' + (tab === t.key ? ' wcp-settings-tab-active' : '') + '" data-action="research-tab" data-tab="' + t.key + '">';
      html += icon(t.icon) + ' ' + esc(t.label);
      html += '</button>';
    }
    html += '</div>';

    // ── Tab body ──
    html += '<div class="wcp-card" style="padding:var(--wcp-space-5);margin-bottom:var(--wcp-space-4)">';
    if (tab === 'competitor') {
      html += renderResearchCompetitor();
    } else {
      html += renderResearchKeywords();
    }
    html += '</div>';

    // ── Session history + results (filtered by active tab) ──
    // Keyword tab also shows any inline gap-analysis sessions (type='gaps') since
    // they were run from within this tab.
    if (tab === 'keywords') {
      html += renderResearchSessions('keywords');
      html += renderResearchSessions('gaps');
    } else {
      html += renderResearchSessions('competitor');
    }

    html += '</div>';
    return html;
  }
