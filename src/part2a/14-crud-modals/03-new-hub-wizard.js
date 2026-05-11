  // ============================================================
  // SECTION 14.3: NEW HUB AI WIZARD
  // ============================================================
  //
  // 3-step modal wizard that replaces the old prompt()-based hub creation.
  //
  //   Step 1: Brief        — user provides hub name + free-form description
  //   Step 2: AI Expansion — AI proposes hub details + 5-7 clusters; user
  //                          can regenerate, toggle clusters, go back to
  //                          edit the brief.
  //   Step 3: Confirm      — summary + Create. Clicking Create materialises
  //                          the hub + selected clusters into S.data and
  //                          navigates into the hub detail view.
  //
  // Entry points:
  //   * openNewHubWizard()                 — fresh wizard, starts at Step 1
  //   * openNewHubWizard({ prefill: h })   — skip straight to Step 2 with
  //                                          a hub payload from
  //                                          AI Suggest Hubs "Refine"
  //
  // State:
  //   S._newHubWizard = { step, brief:{name,description}, aiResult,
  //                       clustersIncluded:[], regenCount, loading, error }

  function openNewHubWizard(opts) {
    opts = opts || {};
    S._newHubWizard = {
      step: 1,
      brief: { name: '', description: '' },
      aiResult: null,
      clustersIncluded: [],
      regenCount: 0,
      loading: false,
      error: ''
    };
    if (opts.prefill) {
      var h = opts.prefill;
      S._newHubWizard.brief.name = h.name || '';
      S._newHubWizard.brief.description = h.description || '';
      S._newHubWizard.aiResult = h;
      // Default-include every suggested cluster
      var cnt = Array.isArray(h.suggested_clusters) ? h.suggested_clusters.length : 0;
      for (var i = 0; i < cnt; i++) S._newHubWizard.clustersIncluded.push(i);
      S._newHubWizard.step = 2;
    }
    openModal(newHubWizardTitle(), renderNewHubWizardBody(), {
      size: 'lg',
      footer: false
    });
  }

  function newHubWizardTitle() {
    var s = (S._newHubWizard && S._newHubWizard.step) || 1;
    return 'New Hub — Step ' + s + ' of 3';
  }

  // Rebuild just the modal body in place. Used after step transitions, AI
  // completions, cluster toggles. Cheaper than closing+reopening the modal.
  function refreshNewHubWizard() {
    var $body = $('.wcp-modal .wcp-modal-body');
    if (!$body.length) return;
    $('.wcp-modal-header h3').text(newHubWizardTitle());
    $body.html(renderNewHubWizardBody());
  }

  function renderNewHubWizardBody() {
    var w = S._newHubWizard; if (!w) return '';
    var html = '<div class="wcp-nhw">';
    html += renderNewHubWizardProgress(w.step);
    if (w.step === 1) html += renderNewHubWizardStep1(w);
    else if (w.step === 2) html += renderNewHubWizardStep2(w);
    else if (w.step === 3) html += renderNewHubWizardStep3(w);
    html += '</div>';
    return html;
  }

  function renderNewHubWizardProgress(step) {
    var steps = ['Brief', 'AI Expansion', 'Confirm'];
    var html = '<div class="wcp-nhw-progress">';
    for (var i = 0; i < steps.length; i++) {
      var idx = i + 1;
      var cls = 'wcp-nhw-step';
      if (idx < step)  cls += ' wcp-nhw-step-done';
      if (idx === step) cls += ' wcp-nhw-step-active';
      html += '<div class="' + cls + '">';
      html += '<div class="wcp-nhw-dot">' + idx + '</div>';
      html += '<div class="wcp-nhw-label">' + steps[i] + '</div>';
      html += '</div>';
      if (i < steps.length - 1) html += '<div class="wcp-nhw-line"></div>';
    }
    html += '</div>';
    return html;
  }

  // ───────── Step 1 — Brief ─────────
  function renderNewHubWizardStep1(w) {
    var html = '<div class="wcp-nhw-step-body">';
    html += '<div class="wcp-nhw-step-hero">';
    html += '<div class="wcp-nhw-hero-icon">' + icon('sitemap') + '</div>';
    html += '<div class="wcp-nhw-hero-title">Describe your new hub</div>';
    html += '<div class="wcp-nhw-hero-sub">We\'ll use AI to expand this into full strategic details and suggest starter clusters.</div>';
    html += '</div>';
    html += '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Hub Name <span class="wcp-text-xs wcp-text-muted">(required)</span></label>';
    html += '<input type="text" class="wcp-input" data-field="nhw_name" value="' + esc(w.brief.name || '') + '" placeholder="e.g. Digital Marketing, Homebrewing, SaaS Pricing..."></div>';
    html += '<div class="wcp-form-group"><label>What is this hub about? <span class="wcp-text-xs wcp-text-muted">(the more context you give AI, the better the output)</span></label>';
    html += '<textarea class="wcp-textarea" data-field="nhw_desc" rows="5" placeholder="What topics does this hub cover? Who is it for? What problems does it solve? Any specific angles or sub-topics you definitely want included?">' + esc(w.brief.description || '') + '</textarea></div>';
    if (w.error) html += '<div class="wcp-nhw-error" style="margin-top:var(--wcp-space-2)">' + icon('triangle-exclamation') + ' ' + esc(w.error) + '</div>';
    html += '</div>';
    html += '<div class="wcp-nhw-footer">';
    html += '<button class="wcp-btn wcp-btn-outline" data-action="nhw-cancel">Cancel</button>';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="nhw-step1-next">' + icon('sparkles') + ' Generate with AI</button>';
    html += '</div></div>';
    return html;
  }

  // ───────── Step 2 — AI Expansion ─────────
  function renderNewHubWizardStep2(w) {
    var html = '<div class="wcp-nhw-step-body">';
    if (w.loading) {
      html += '<div class="wcp-nhw-loading">';
      html += '<div class="wcp-nhw-spinner"></div>';
      html += '<div class="wcp-nhw-loading-title">Thinking about "' + esc(w.brief.name) + '"…</div>';
      html += '<div class="wcp-nhw-loading-sub">Generating hub details + cluster ideas. Takes 5–15 seconds.</div>';
      html += '</div>';
    } else if (w.error) {
      html += '<div class="wcp-nhw-error">' + icon('triangle-exclamation') + ' ' + esc(w.error) + '</div>';
      html += '<div class="wcp-nhw-footer">';
      html += '<button class="wcp-btn wcp-btn-outline" data-action="nhw-back-to-step1">' + icon('arrow-left') + ' Back</button>';
      html += '<button class="wcp-btn wcp-btn-primary" data-action="nhw-regenerate">' + icon('arrows-rotate') + ' Retry</button>';
      html += '</div>';
    } else if (w.aiResult) {
      // Build a transient copy of aiResult that reflects the user's cluster
      // include/exclude toggles — renderHubSuggestionCard renders all
      // clusters with checkboxes checked by default, but because we rebuild
      // in place we need to honour the user's prior state.
      var display = cloneForWizardDisplay(w.aiResult, w.clustersIncluded);
      // Neutralise the shared card's built-in footer buttons so they don't
      // compete with the wizard's own footer below. __disabled__ is caught
      // by a CSS rule that sets display:none on any element with that
      // data-action value.
      html += window._wcpRenderHubSuggestionCard(display, 0)
        .replace(/data-action="hub-suggest-refine"/g,   'data-action="__disabled__"')
        .replace(/data-action="hub-suggest-quick-add"/g, 'data-action="__disabled__"');

      // Override the card footer with the wizard's own nav buttons
      html += '<div class="wcp-nhw-footer">';
      html += '<button class="wcp-btn wcp-btn-outline" data-action="nhw-back-to-step1">' + icon('arrow-left') + ' Back</button>';
      html += '<button class="wcp-btn wcp-btn-outline" data-action="nhw-regenerate">' + icon('arrows-rotate') + ' Regenerate</button>';
      html += '<button class="wcp-btn wcp-btn-primary" data-action="nhw-step2-next">Next: Confirm ' + icon('arrow-right') + '</button>';
      html += '</div>';
    } else {
      // Shouldn't reach here — if aiResult is null and not loading, kick off the call
      scheduleNewHubWizardAICall();
      html += '<div class="wcp-nhw-loading"><div class="wcp-nhw-spinner"></div></div>';
    }
    html += '</div>';
    return html;
  }

  // Helper: build a display copy of the AI result that respects the user's
  // cluster include/exclude state. Unchecked clusters are stripped from the
  // displayed card but kept in w.aiResult.suggested_clusters.
  function cloneForWizardDisplay(ai, included) {
    var copy = { name: ai.name, description: ai.description, pillar_keyword: ai.pillar_keyword,
                 target_audience: ai.target_audience, search_intent_mix: ai.search_intent_mix,
                 keywords: ai.keywords, rationale: ai.rationale };
    var all = Array.isArray(ai.suggested_clusters) ? ai.suggested_clusters : [];
    copy.suggested_clusters = all;  // keep all; the card renders checkboxes for each
    return copy;
  }

  // ───────── Step 3 — Confirm ─────────
  function renderNewHubWizardStep3(w) {
    var ai = w.aiResult || {};
    var clusters = Array.isArray(ai.suggested_clusters) ? ai.suggested_clusters : [];
    var selected = w.clustersIncluded.map(function(i) { return clusters[i]; }).filter(Boolean);

    var html = '<div class="wcp-nhw-step-body">';
    html += '<div class="wcp-nhw-summary">';
    html += '<div class="wcp-nhw-summary-title">Ready to create</div>';
    html += '<div class="wcp-nhw-summary-sub">Review the summary below. Click <strong>Create Hub</strong> to commit and start working on it.</div>';
    html += '</div>';

    html += '<div class="wcp-nhw-confirm-card">';
    html += '<div class="wcp-nhw-confirm-row"><div class="wcp-nhw-confirm-label">Hub name</div><div class="wcp-nhw-confirm-value"><strong>' + esc(ai.name || w.brief.name) + '</strong></div></div>';
    if (ai.pillar_keyword)  html += '<div class="wcp-nhw-confirm-row"><div class="wcp-nhw-confirm-label">Pillar keyword</div><div class="wcp-nhw-confirm-value">' + esc(ai.pillar_keyword) + '</div></div>';
    if (ai.target_audience) html += '<div class="wcp-nhw-confirm-row"><div class="wcp-nhw-confirm-label">Target audience</div><div class="wcp-nhw-confirm-value">' + esc(ai.target_audience) + '</div></div>';
    if (ai.description)     html += '<div class="wcp-nhw-confirm-row"><div class="wcp-nhw-confirm-label">Description</div><div class="wcp-nhw-confirm-value">' + esc(ai.description) + '</div></div>';
    html += '<div class="wcp-nhw-confirm-row"><div class="wcp-nhw-confirm-label">Clusters</div><div class="wcp-nhw-confirm-value"><strong>' + selected.length + '</strong> of ' + clusters.length + ' selected</div></div>';
    if (selected.length) {
      html += '<div class="wcp-nhw-confirm-row"><div class="wcp-nhw-confirm-label"></div><div class="wcp-nhw-confirm-value"><ol class="wcp-nhw-cluster-summary">';
      for (var i = 0; i < selected.length; i++) html += '<li>' + esc(selected[i].name || '') + '</li>';
      html += '</ol></div></div>';
    }
    html += '</div>';

    html += '<div class="wcp-nhw-footer">';
    html += '<button class="wcp-btn wcp-btn-outline" data-action="nhw-back-to-step2">' + icon('arrow-left') + ' Back</button>';
    html += '<button class="wcp-btn wcp-btn-success-solid" data-action="nhw-create">' + icon('check') + ' Create Hub</button>';
    html += '</div></div>';
    return html;
  }

  // ───────── Wizard actions ─────────

  function commitNewHubWizardBrief() {
    var w = S._newHubWizard; if (!w) return false;
    var name = ($('[data-field="nhw_name"]').val() || '').trim();
    var desc = ($('[data-field="nhw_desc"]').val() || '').trim();
    if (!name) { w.error = 'Hub name is required'; refreshNewHubWizard(); return false; }
    w.brief.name = name;
    w.brief.description = desc;
    w.error = '';
    return true;
  }

  function snapshotWizardClusterSelection() {
    var w = S._newHubWizard; if (!w || !w.aiResult) return;
    var all = Array.isArray(w.aiResult.suggested_clusters) ? w.aiResult.suggested_clusters : [];
    var sel = [];
    $('.wcp-hs-cluster-cb:checked').each(function() {
      var ci = parseInt($(this).data('cluster-idx'), 10);
      if (!isNaN(ci) && ci >= 0 && ci < all.length) sel.push(ci);
    });
    if (sel.length) {
      w.clustersIncluded = sel;
    } else {
      // If the user unchecked everything, honour that (empty array valid)
      w.clustersIncluded = [];
    }
  }

  // Kick off the AI enrichment call. Re-entry-safe.
  function scheduleNewHubWizardAICall() {
    var w = S._newHubWizard; if (!w || w.loading) return;
    if (typeof window._wcpAiEnrichHubWithClusters !== 'function') {
      w.error = 'AI module not loaded yet. Try again.';
      refreshNewHubWizard();
      return;
    }
    w.loading = true;
    w.error = '';
    refreshNewHubWizard();
    window._wcpAiEnrichHubWithClusters(w.brief.name, w.brief.description, function(hub) {
      w.loading = false;
      w.aiResult = hub;
      var cnt = Array.isArray(hub.suggested_clusters) ? hub.suggested_clusters.length : 0;
      w.clustersIncluded = [];
      for (var i = 0; i < cnt; i++) w.clustersIncluded.push(i);
      w.regenCount++;
      refreshNewHubWizard();
    }, function(err) {
      w.loading = false;
      w.error = 'AI call failed: ' + (err || 'unknown error');
      refreshNewHubWizard();
    });
  }

  // Final commit — create hub + selected clusters, navigate into hub view.
  function commitNewHubWizard() {
    var w = S._newHubWizard; if (!w || !w.aiResult) return;
    var ai = w.aiResult;
    snapshot('Before create hub via wizard');

    var colorIdx = (S.data.hubs || []).length % Constants.HUB_COLORS.length;
    var hub = createHub({
      name: ai.name || w.brief.name,
      color: Constants.HUB_COLORS[colorIdx].color,
      description: ai.description || w.brief.description || '',
      pillar_keyword: ai.pillar_keyword || ''
    });
    if (ai.target_audience)   hub.target_audience   = ai.target_audience;
    if (ai.search_intent_mix) hub.search_intent_mix = ai.search_intent_mix;
    if (Array.isArray(ai.keywords)) hub.keywords = ai.keywords.slice();
    if (ai.rationale)         hub.rationale         = ai.rationale;

    var clusters = Array.isArray(ai.suggested_clusters) ? ai.suggested_clusters : [];
    var created = 0;
    for (var i = 0; i < w.clustersIncluded.length; i++) {
      var c = clusters[w.clustersIncluded[i]];
      if (!c || !c.name) continue;
      createCluster({
        name: c.name,
        hub_id: hub.id,
        description: c.description || '',
        keywords: Array.isArray(c.keywords) ? c.keywords.slice() : []
      });
      created++;
    }
    logActivity('hub_created', hub.id, hub.name, 'Created via AI Wizard with ' + created + ' cluster' + (created === 1 ? '' : 's'));
    buildMaps(); syncToTextarea();

    S._newHubWizard = null;
    closeModal();
    S.selectedHubId = hub.id;
    navigate('hubs');
    toast('Hub "' + hub.name + '" created with ' + created + ' cluster' + (created === 1 ? '' : 's'), 'success');
  }

  // ───────── Event wiring ─────────

  function setupNewHubWizardEvents() {
    var ns = '.wcp2a-nhw';

    $(document).off('click' + ns + '-can').on('click' + ns + '-can', '[data-action="nhw-cancel"]', function() {
      S._newHubWizard = null;
      closeModal();
    });

    $(document).off('click' + ns + '-s1n').on('click' + ns + '-s1n', '[data-action="nhw-step1-next"]', function() {
      if (!commitNewHubWizardBrief()) return;
      S._newHubWizard.step = 2;
      S._newHubWizard.aiResult = null;
      refreshNewHubWizard();
      scheduleNewHubWizardAICall();
    });

    $(document).off('click' + ns + '-bk1').on('click' + ns + '-bk1', '[data-action="nhw-back-to-step1"]', function() {
      // Preserve the aiResult so the user can come back without re-running
      snapshotWizardClusterSelection();
      S._newHubWizard.step = 1;
      refreshNewHubWizard();
    });

    $(document).off('click' + ns + '-s2n').on('click' + ns + '-s2n', '[data-action="nhw-step2-next"]', function() {
      snapshotWizardClusterSelection();
      S._newHubWizard.step = 3;
      refreshNewHubWizard();
    });

    $(document).off('click' + ns + '-bk2').on('click' + ns + '-bk2', '[data-action="nhw-back-to-step2"]', function() {
      S._newHubWizard.step = 2;
      refreshNewHubWizard();
    });

    $(document).off('click' + ns + '-reg').on('click' + ns + '-reg', '[data-action="nhw-regenerate"]', function() {
      scheduleNewHubWizardAICall();
    });

    $(document).off('click' + ns + '-cre').on('click' + ns + '-cre', '[data-action="nhw-create"]', function() {
      commitNewHubWizard();
    });
  }

  // Called from setupPart2AEvents() once Part 1 has finished initialising.
  // Unbinds Part 1's create-hub prompt() fallback and installs the wizard
  // handler under its own namespace so nothing else collides.
  function installNewHubWizardCreateHandler() {
    $(document).off('click.wcp-create-hub');
    $(document).off('click.wcp-create-hub-nhw').on('click.wcp-create-hub-nhw', '[data-action="create-hub"]', function(e) {
      e.preventDefault();
      openNewHubWizard();
    });
    setupNewHubWizardEvents();
  }

  window._wcpOpenNewHubWizard = openNewHubWizard;
  window._wcpInstallNewHubWizard = installNewHubWizardCreateHandler;
