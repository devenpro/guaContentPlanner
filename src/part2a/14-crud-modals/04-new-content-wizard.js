  // ============================================================
  // SECTION 14.4: NEW CONTENT AI WIZARD
  // ============================================================
  //
  // 4-step modal wizard that replaces the old single-form new-content modal.
  //
  //   Step 1: Mode      — Brand new vs Content refresh
  //   Step 2: Source    — (refresh only) URL + fetch → body; CORS paste fallback
  //   Step 3: Brief     — topic / audience / goal / hub / cluster / priority
  //   Step 4: AI draft  — AI-generated preview, editable; then Confirm+Create
  //
  // Entry: openNewContentWizard(defaults, opts)
  //   defaults.title / hub_id / cluster_id / content_type_id / tags — pre-fill
  //   opts.onCreate(content) — fired after createContent() commits so callers
  //     can wire extra refs (e.g. create-pillar sets hub.pillar_content_id)
  //
  // State:
  //   S._newContentWizard = {
  //     step, mode ('new'|'refresh'),
  //     source: { url, title, body, status, pasted },
  //     brief:  { title, topic, audience, goal, hub_id, cluster_id, priority },
  //     aiDraft: {} | null,
  //     fetching: false, aiLoading: false, error: '',
  //     defaults, onCreate
  //   }

  function openNewContentWizard(defaults, opts) {
    defaults = defaults || {};
    opts = opts || {};
    S._newContentWizard = {
      step: 1,
      mode: 'new',
      source: { url: '', title: '', body: '', status: '', pasted: false },
      brief: {
        title:       defaults.title       || '',
        topic:       '',
        audience:    '',
        goal:        '',
        hub_id:      defaults.hub_id      || '',
        cluster_id:  defaults.cluster_id  || '',
        priority:    'medium'
      },
      aiDraft: null,
      fetching: false,
      aiLoading: false,
      error: '',
      defaults: defaults,
      onCreate: opts.onCreate || null
    };
    openModal(newContentWizardTitle(), renderNewContentWizardBody(), { size: 'lg', footer: false });
  }

  function newContentWizardTitle() {
    var w = S._newContentWizard; if (!w) return 'New Content';
    var totalSteps = (w.mode === 'refresh') ? 4 : 3;
    // Step numbering when mode === 'new' skips the Source step entirely.
    var visible = w.step;
    if (w.mode === 'new' && w.step >= 3) visible = w.step - 1;
    return 'New Content — Step ' + visible + ' of ' + totalSteps;
  }

  function refreshNewContentWizard() {
    var $body = $('.wcp-modal .wcp-modal-body');
    if (!$body.length) return;
    $('.wcp-modal-header h3').text(newContentWizardTitle());
    $body.html(renderNewContentWizardBody());
  }

  function renderNewContentWizardBody() {
    var w = S._newContentWizard; if (!w) return '';
    var html = '<div class="wcp-ncw">';
    html += renderContentWizardProgress(w);
    if (w.step === 1)      html += renderContentWizardStep1(w);
    else if (w.step === 2) html += renderContentWizardStep2Source(w);
    else if (w.step === 3) html += renderContentWizardStep3Brief(w);
    else if (w.step === 4) html += renderContentWizardStep4Draft(w);
    html += '</div>';
    return html;
  }

  function renderContentWizardProgress(w) {
    var steps = (w.mode === 'refresh')
      ? ['Mode', 'Source', 'Brief', 'AI Draft']
      : ['Mode', 'Brief', 'AI Draft'];
    var stepMap = (w.mode === 'refresh') ? [1, 2, 3, 4] : [1, 3, 4];

    var html = '<div class="wcp-nhw-progress">';
    for (var i = 0; i < steps.length; i++) {
      var idx = stepMap[i];
      var cls = 'wcp-nhw-step';
      if (idx < w.step)  cls += ' wcp-nhw-step-done';
      if (idx === w.step) cls += ' wcp-nhw-step-active';
      html += '<div class="' + cls + '">';
      html += '<div class="wcp-nhw-dot">' + (i + 1) + '</div>';
      html += '<div class="wcp-nhw-label">' + steps[i] + '</div>';
      html += '</div>';
      if (i < steps.length - 1) html += '<div class="wcp-nhw-line"></div>';
    }
    html += '</div>';
    return html;
  }

  // ───────── Step 1 — Mode ─────────
  function renderContentWizardStep1(w) {
    var isNew = w.mode === 'new';
    var html = '<div class="wcp-nhw-step-body">';
    html += '<div class="wcp-nhw-step-hero">';
    html += '<div class="wcp-nhw-hero-icon">' + icon('file-lines') + '</div>';
    html += '<div class="wcp-nhw-hero-title">What are you creating?</div>';
    html += '<div class="wcp-nhw-hero-sub">Pick a mode — we\'ll tailor the rest of the wizard to match.</div>';
    html += '</div>';

    html += '<div class="wcp-ncw-mode-grid">';
    html += '<button class="wcp-ncw-mode' + (isNew ? ' wcp-ncw-mode-active' : '') + '" data-action="ncw-set-mode" data-mode="new">';
    html += '<div class="wcp-ncw-mode-icon">' + icon('plus') + '</div>';
    html += '<div class="wcp-ncw-mode-title">Brand new content</div>';
    html += '<div class="wcp-ncw-mode-sub">Start from scratch. You give AI a topic and context, it produces a full brief with title, type, keywords and angles.</div>';
    html += '</button>';

    html += '<button class="wcp-ncw-mode' + (!isNew ? ' wcp-ncw-mode-active' : '') + '" data-action="ncw-set-mode" data-mode="refresh">';
    html += '<div class="wcp-ncw-mode-icon">' + icon('arrows-rotate') + '</div>';
    html += '<div class="wcp-ncw-mode-title">Content refresh</div>';
    html += '<div class="wcp-ncw-mode-sub">Update an existing page. Give AI the URL + article text, it drafts an improvement plan and new brief.</div>';
    html += '</button>';
    html += '</div>';

    html += '<div class="wcp-nhw-footer">';
    html += '<button class="wcp-btn wcp-btn-outline" data-action="ncw-cancel">Cancel</button>';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="ncw-step1-next">Next ' + icon('arrow-right') + '</button>';
    html += '</div></div>';
    return html;
  }

  // ───────── Step 2 — Source (refresh only) ─────────
  function renderContentWizardStep2Source(w) {
    var s = w.source || {};
    var statusNote = '';
    var pasteBlock = '';
    if (s.status === 'ok') {
      statusNote = '<div class="wcp-ncw-source-ok">' + icon('check') + ' Fetched <strong>' + esc(truncate(s.title || '(no title found)', 80)) + '</strong> — ' + (s.body ? s.body.length + ' chars of text' : 'no body text extracted') + '</div>';
    } else if (s.status === 'cors' || s.status === 'timeout' || (s.status && s.status.indexOf('http-') === 0) || s.status === 'empty') {
      var reason = s.status === 'cors' ? "the site blocks direct fetches (CORS)" :
                   s.status === 'timeout' ? "the fetch timed out" :
                   s.status === 'empty' ? "no text could be extracted" :
                   "the server returned " + s.status;
      statusNote = '<div class="wcp-ncw-source-warn">' + icon('triangle-exclamation') + ' Couldn\'t fetch — ' + reason + '. Paste the article text below instead.</div>';
    } else if (s.pasted) {
      statusNote = '<div class="wcp-ncw-source-ok">' + icon('check') + ' Using pasted text — ' + (s.body ? s.body.length : 0) + ' chars</div>';
    }
    // Show paste textarea whenever fetch failed OR user is in an unknown state
    var showPaste = (s.status && s.status !== 'ok') || s.pasted;

    var html = '<div class="wcp-nhw-step-body">';
    html += '<div class="wcp-nhw-step-hero">';
    html += '<div class="wcp-nhw-hero-icon">' + icon('link') + '</div>';
    html += '<div class="wcp-nhw-hero-title">What page is this refreshing?</div>';
    html += '<div class="wcp-nhw-hero-sub">Paste the URL of the existing page. We\'ll try to fetch the text automatically.</div>';
    html += '</div>';

    html += '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Existing URL</label>';
    html += '<div class="wcp-ncw-url-row">';
    html += '<input type="url" class="wcp-input" data-field="ncw_url" placeholder="https://example.com/article" value="' + esc(s.url || '') + '">';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="ncw-fetch-url"' + (w.fetching ? ' disabled' : '') + '>';
    html += (w.fetching ? icon('arrows-rotate') + ' Fetching…' : icon('download') + ' Fetch page');
    html += '</button>';
    html += '</div></div>';
    if (statusNote) html += statusNote;

    if (showPaste) {
      html += '<div class="wcp-form-group"><label>Article text <span class="wcp-text-xs wcp-text-muted">(paste or edit — first ~8,000 characters are sent to AI)</span></label>';
      html += '<textarea class="wcp-textarea" data-field="ncw_body" rows="10" placeholder="Paste the article text here…">' + esc(s.body || '') + '</textarea></div>';
      html += '<div class="wcp-form-group"><label>Page title <span class="wcp-text-xs wcp-text-muted">(optional, helps AI anchor its draft)</span></label>';
      html += '<input type="text" class="wcp-input" data-field="ncw_title" value="' + esc(s.title || '') + '" placeholder="Original article title"></div>';
    }
    html += '</div>';

    html += '<div class="wcp-nhw-footer">';
    html += '<button class="wcp-btn wcp-btn-outline" data-action="ncw-back-to-step1">' + icon('arrow-left') + ' Back</button>';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="ncw-step2-next">Next: Brief ' + icon('arrow-right') + '</button>';
    html += '</div></div>';
    return html;
  }

  // ───────── Step 3 — Brief ─────────
  function renderContentWizardStep3Brief(w) {
    var b = w.brief || {};
    var hubs = S.data.hubs || [];
    var clusters = S.data.clusters || [];
    // Only clusters belonging to the selected hub
    var hubClusters = b.hub_id ? clusters.filter(function(c) { return c.hub_id === b.hub_id; }) : [];

    var html = '<div class="wcp-nhw-step-body">';
    html += '<div class="wcp-nhw-step-hero">';
    html += '<div class="wcp-nhw-hero-icon">' + icon('pencil') + '</div>';
    html += '<div class="wcp-nhw-hero-title">Tell us about this piece</div>';
    html += '<div class="wcp-nhw-hero-sub">The more context you give, the sharper the AI draft. Everything except the topic is optional.</div>';
    html += '</div>';

    html += '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Title idea <span class="wcp-text-xs wcp-text-muted">(optional — AI will polish)</span></label>';
    html += '<input type="text" class="wcp-input" data-field="ncw_brief_title" value="' + esc(b.title) + '" placeholder="e.g. The ultimate guide to…"></div>';

    html += '<div class="wcp-form-group"><label>What is this ' + (w.mode === 'refresh' ? 'refresh ' : '') + 'about? <span class="wcp-text-xs wcp-text-muted">(required)</span></label>';
    html += '<textarea class="wcp-textarea" data-field="ncw_brief_topic" rows="4" placeholder="' +
      (w.mode === 'refresh'
        ? 'What do you want to improve? New angles to add, sections to remove, audience shift, SEO targets…'
        : 'What topics does this cover? Who is it for? What\'s the main takeaway?') + '">' + esc(b.topic) + '</textarea></div>';

    html += '<div class="wcp-form-row">';
    html += '<div class="wcp-form-half"><label>Target audience <span class="wcp-text-xs wcp-text-muted">(optional)</span></label>';
    html += '<input type="text" class="wcp-input" data-field="ncw_brief_audience" value="' + esc(b.audience) + '" placeholder="e.g. mid-market SaaS founders"></div>';
    html += '<div class="wcp-form-half"><label>Primary goal <span class="wcp-text-xs wcp-text-muted">(optional)</span></label>';
    html += '<input type="text" class="wcp-input" data-field="ncw_brief_goal" value="' + esc(b.goal) + '" placeholder="e.g. generate demo signups"></div>';
    html += '</div>';

    html += '<div class="wcp-form-row">';
    html += '<div class="wcp-form-half"><label>Hub <span class="wcp-text-xs wcp-text-muted">(optional — AI will auto-suggest)</span></label>';
    html += '<select class="wcp-select" data-field="ncw_brief_hub" id="wcpNcwHub">';
    html += '<option value="">— Auto-suggest —</option>';
    for (var hi = 0; hi < hubs.length; hi++) {
      html += '<option value="' + esc(hubs[hi].id) + '"' + (b.hub_id === hubs[hi].id ? ' selected' : '') + '>' + esc(hubs[hi].name) + '</option>';
    }
    html += '</select></div>';
    html += '<div class="wcp-form-half"><label>Cluster <span class="wcp-text-xs wcp-text-muted">(optional)</span></label>';
    html += '<select class="wcp-select" data-field="ncw_brief_cluster" id="wcpNcwCluster">';
    html += '<option value="">— Auto-suggest —</option>';
    for (var ci = 0; ci < hubClusters.length; ci++) {
      html += '<option value="' + esc(hubClusters[ci].id) + '"' + (b.cluster_id === hubClusters[ci].id ? ' selected' : '') + '>' + esc(hubClusters[ci].name) + '</option>';
    }
    html += '</select></div>';
    html += '</div>';

    html += '<div class="wcp-form-group"><label>Priority</label>';
    html += '<select class="wcp-select" data-field="ncw_brief_priority">';
    for (var pk in Constants.PRIORITY_LEVELS) {
      html += '<option value="' + pk + '"' + (b.priority === pk ? ' selected' : '') + '>' + Constants.PRIORITY_LEVELS[pk].label + '</option>';
    }
    html += '</select></div>';

    if (w.error) html += '<div class="wcp-nhw-error">' + icon('triangle-exclamation') + ' ' + esc(w.error) + '</div>';
    html += '</div>';

    html += '<div class="wcp-nhw-footer">';
    var backStep = (w.mode === 'refresh') ? 2 : 1;
    html += '<button class="wcp-btn wcp-btn-outline" data-action="ncw-back-to-step' + backStep + '">' + icon('arrow-left') + ' Back</button>';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="ncw-step3-next">' + icon('sparkles') + ' Draft with AI</button>';
    html += '</div></div>';
    return html;
  }

  // ───────── Step 4 — AI Draft / Review ─────────
  function renderContentWizardStep4Draft(w) {
    var html = '<div class="wcp-nhw-step-body">';
    if (w.aiLoading) {
      html += '<div class="wcp-nhw-loading">';
      html += '<div class="wcp-nhw-spinner"></div>';
      html += '<div class="wcp-nhw-loading-title">Drafting "' + esc(truncate(w.brief.title || w.brief.topic, 60)) + '"…</div>';
      html += '<div class="wcp-nhw-loading-sub">Generating full brief + keywords + angles. Takes 5–20 seconds.</div>';
      html += '</div>';
    } else if (w.error && !w.aiDraft) {
      html += '<div class="wcp-nhw-error">' + icon('triangle-exclamation') + ' ' + esc(w.error) + '</div>';
      html += '<div class="wcp-nhw-footer">';
      html += '<button class="wcp-btn wcp-btn-outline" data-action="ncw-back-to-step3">' + icon('arrow-left') + ' Back</button>';
      html += '<button class="wcp-btn wcp-btn-primary" data-action="ncw-regenerate">' + icon('arrows-rotate') + ' Retry</button>';
      html += '</div>';
    } else if (w.aiDraft) {
      html += renderContentDraftPreview(w);
      html += '<div class="wcp-nhw-footer">';
      html += '<button class="wcp-btn wcp-btn-outline" data-action="ncw-back-to-step3">' + icon('arrow-left') + ' Back</button>';
      html += '<button class="wcp-btn wcp-btn-outline" data-action="ncw-regenerate">' + icon('arrows-rotate') + ' Regenerate</button>';
      html += '<button class="wcp-btn wcp-btn-success-solid" data-action="ncw-create">' + icon('check') + ' Create Content</button>';
      html += '</div>';
    } else {
      html += '<div class="wcp-nhw-loading"><div class="wcp-nhw-spinner"></div></div>';
    }
    html += '</div>';
    return html;
  }

  function renderContentDraftPreview(w) {
    var d = w.aiDraft || {};
    var hub = d.hub_id ? S.hubMap[d.hub_id] : null;
    var cluster = d.cluster_id ? S.clusterMap[d.cluster_id] : null;
    var kws = d.keywords || {};
    var primary = kws.primary || {};
    var bi = d.basic_info || {};
    var r = d.research || {};

    var html = '<div class="wcp-ncw-draft">';

    // Title (editable)
    html += '<div class="wcp-ncw-draft-block">';
    html += '<label class="wcp-ncw-draft-label">Title</label>';
    html += '<input type="text" class="wcp-input wcp-ncw-draft-title" data-field="ncw_d_title" value="' + esc(d.title || '') + '">';
    html += '</div>';

    // Type + intent + audience chips row
    html += '<div class="wcp-ncw-chip-row">';
    if (d.content_type)    html += '<span class="wcp-badge" style="background:var(--wcp-hub)15;color:var(--wcp-hub)">' + icon('file-lines') + ' ' + esc(d.content_type) + '</span>';
    if (bi.search_intent)  html += '<span class="wcp-badge" style="background:var(--wcp-accent)15;color:var(--wcp-accent)">' + icon('compass') + ' ' + esc(bi.search_intent) + '</span>';
    if (bi.funnel_stage)   html += '<span class="wcp-badge" style="background:var(--wcp-success)15;color:var(--wcp-success)">' + icon('stairs') + ' ' + esc(bi.funnel_stage) + '</span>';
    if (bi.word_count_min && bi.word_count_max) html += '<span class="wcp-badge" style="background:var(--wcp-gray-100);color:var(--wcp-text-secondary)">' + icon('align-left') + ' ' + bi.word_count_min + '-' + bi.word_count_max + ' words</span>';
    html += '</div>';

    // Hub + cluster
    if (hub || cluster) {
      html += '<div class="wcp-ncw-draft-block">';
      html += '<label class="wcp-ncw-draft-label">Hub / Cluster <span class="wcp-text-xs wcp-text-muted">(AI recommendation)</span></label>';
      html += '<div class="wcp-ncw-draft-hubrow">';
      if (hub) html += '<span class="wcp-badge" style="background:var(--wcp-hub);color:white">' + icon('sitemap') + ' ' + esc(hub.name) + '</span>';
      if (cluster) html += '<span class="wcp-badge" style="background:var(--wcp-cluster);color:white">' + icon('diagram-project') + ' ' + esc(cluster.name) + '</span>';
      html += '</div></div>';
    } else {
      html += '<div class="wcp-ncw-draft-block">';
      html += '<label class="wcp-ncw-draft-label">Hub / Cluster</label>';
      html += '<div class="wcp-ncw-draft-empty">' + icon('circle-info') + ' No match found. Content will be unassigned — you can link a hub later from the detail view.</div>';
      html += '</div>';
    }

    // Audience + goal (editable)
    html += '<div class="wcp-form-row">';
    html += '<div class="wcp-form-half"><label>Audience</label><input type="text" class="wcp-input" data-field="ncw_d_audience" value="' + esc(bi.audience || '') + '"></div>';
    html += '<div class="wcp-form-half"><label>Goal</label><input type="text" class="wcp-input" data-field="ncw_d_goal" value="' + esc(bi.goal || '') + '"></div>';
    html += '</div>';

    // Keywords
    html += '<div class="wcp-ncw-draft-block">';
    html += '<label class="wcp-ncw-draft-label">Keywords</label>';
    html += '<div class="wcp-ncw-draft-kw"><strong>Primary:</strong> ' + esc(primary.keyword || '—') + '</div>';
    if (kws.secondary && kws.secondary.length) {
      html += '<div class="wcp-ncw-draft-kw-row"><span class="wcp-text-xs wcp-text-muted">Secondary:</span>';
      for (var si = 0; si < kws.secondary.length; si++) html += '<span class="wcp-badge" style="background:var(--wcp-cluster)15;color:var(--wcp-cluster)">' + icon('key') + ' ' + esc(kws.secondary[si]) + '</span>';
      html += '</div>';
    }
    if (kws.lsi && kws.lsi.length) {
      html += '<div class="wcp-ncw-draft-kw-row"><span class="wcp-text-xs wcp-text-muted">LSI:</span>';
      for (var li = 0; li < kws.lsi.length; li++) html += '<span class="wcp-badge" style="background:var(--wcp-gray-100);color:var(--wcp-text-secondary)">' + esc(kws.lsi[li]) + '</span>';
      html += '</div>';
    }
    html += '</div>';

    // Angles
    if (r.angles && r.angles.length) {
      html += '<div class="wcp-ncw-draft-block">';
      html += '<label class="wcp-ncw-draft-label">Angles <span class="wcp-text-xs wcp-text-muted">(AI picked: ' + esc(r.selected_angle || r.angles[0] || '') + ')</span></label>';
      html += '<ul class="wcp-ncw-draft-list">';
      for (var ai = 0; ai < r.angles.length; ai++) html += '<li>' + esc(r.angles[ai]) + '</li>';
      html += '</ul></div>';
    }

    // UVP
    if (r.uvp) {
      html += '<div class="wcp-ncw-draft-block">';
      html += '<label class="wcp-ncw-draft-label">Unique value proposition</label>';
      html += '<div class="wcp-ncw-draft-uvp">' + esc(r.uvp) + '</div></div>';
    }

    // Questions to answer
    if (r.questions && r.questions.length) {
      html += '<div class="wcp-ncw-draft-block">';
      html += '<label class="wcp-ncw-draft-label">Questions to answer</label>';
      html += '<ul class="wcp-ncw-draft-list">';
      for (var qi = 0; qi < r.questions.length; qi++) html += '<li>' + esc(r.questions[qi]) + '</li>';
      html += '</ul></div>';
    }

    // Refresh notes (if present)
    if (d.refresh_notes && d.refresh_notes.length) {
      html += '<div class="wcp-ncw-draft-block wcp-ncw-draft-refresh">';
      html += '<label class="wcp-ncw-draft-label">' + icon('arrows-rotate') + ' Refresh plan</label>';
      html += '<ul class="wcp-ncw-draft-list">';
      for (var ri = 0; ri < d.refresh_notes.length; ri++) html += '<li>' + esc(d.refresh_notes[ri]) + '</li>';
      html += '</ul></div>';
    }

    html += '</div>';
    return html;
  }

  // ───────── Actions ─────────

  function collectContentWizardSourceFromDom() {
    var w = S._newContentWizard; if (!w) return;
    var url = ($('[data-field="ncw_url"]').val() || '').trim();
    if (url) w.source.url = url;
    // If a paste textarea is showing, pull its current contents into state
    var $body = $('[data-field="ncw_body"]');
    if ($body.length) {
      var body = ($body.val() || '').trim();
      if (body) { w.source.body = body; w.source.pasted = true; if (!w.source.status) w.source.status = 'pasted'; }
    }
    var $t = $('[data-field="ncw_title"]');
    if ($t.length) {
      var t = ($t.val() || '').trim();
      if (t) w.source.title = t;
    }
  }

  function collectContentWizardBriefFromDom() {
    var w = S._newContentWizard; if (!w) return;
    w.brief.title       = ($('[data-field="ncw_brief_title"]').val() || '').trim();
    w.brief.topic       = ($('[data-field="ncw_brief_topic"]').val() || '').trim();
    w.brief.audience    = ($('[data-field="ncw_brief_audience"]').val() || '').trim();
    w.brief.goal        = ($('[data-field="ncw_brief_goal"]').val() || '').trim();
    w.brief.hub_id      = ($('[data-field="ncw_brief_hub"]').val() || '').trim();
    w.brief.cluster_id  = ($('[data-field="ncw_brief_cluster"]').val() || '').trim();
    w.brief.priority    = ($('[data-field="ncw_brief_priority"]').val() || 'medium').trim();
    // A user-chosen cluster whose hub doesn't match clears itself
    if (w.brief.hub_id && w.brief.cluster_id) {
      var cl = S.clusterMap[w.brief.cluster_id];
      if (cl && cl.hub_id && cl.hub_id !== w.brief.hub_id) w.brief.cluster_id = '';
    }
  }

  function collectContentWizardDraftEditsFromDom() {
    var w = S._newContentWizard; if (!w || !w.aiDraft) return;
    var d = w.aiDraft;
    var $t = $('[data-field="ncw_d_title"]');     if ($t.length) d.title = ($t.val() || '').trim() || d.title;
    var $a = $('[data-field="ncw_d_audience"]');  if ($a.length) d.basic_info.audience = ($a.val() || '').trim();
    var $g = $('[data-field="ncw_d_goal"]');      if ($g.length) d.basic_info.goal     = ($g.val() || '').trim();
  }

  // Fire the URL fetch; resolve via refreshNewContentWizard() regardless.
  function fetchContentWizardUrl() {
    var w = S._newContentWizard; if (!w) return;
    var url = ($('[data-field="ncw_url"]').val() || '').trim();
    if (!url) { w.error = 'Enter a URL first'; refreshNewContentWizard(); return; }
    w.source.url = url;
    w.fetching = true;
    w.error = '';
    refreshNewContentWizard();
    if (typeof window._wcpFetchPageBody !== 'function') {
      w.fetching = false; w.error = 'Fetch helper not loaded'; refreshNewContentWizard(); return;
    }
    window._wcpFetchPageBody(url).then(function(res) {
      w.fetching = false;
      w.source.status = res.status;
      w.source.title  = res.title || '';
      w.source.body   = res.body  || '';
      w.source.pasted = false;
      refreshNewContentWizard();
    });
  }

  // Step transitions
  function advanceFromStep1() {
    var w = S._newContentWizard; if (!w) return;
    // Mode was already set by data-action="ncw-set-mode". Move to Source if
    // refresh, else jump straight to Brief.
    w.step = (w.mode === 'refresh') ? 2 : 3;
    refreshNewContentWizard();
  }
  function advanceFromStep2() {
    var w = S._newContentWizard; if (!w) return;
    collectContentWizardSourceFromDom();
    w.step = 3;
    refreshNewContentWizard();
  }
  function advanceFromStep3() {
    var w = S._newContentWizard; if (!w) return;
    collectContentWizardBriefFromDom();
    if (!w.brief.topic && !w.brief.title) {
      w.error = 'Give at least a title or a short description of what this content is about.';
      refreshNewContentWizard();
      return;
    }
    w.error = '';
    w.step = 4;
    w.aiDraft = null;
    refreshNewContentWizard();
    scheduleContentWizardAICall();
  }

  function scheduleContentWizardAICall() {
    var w = S._newContentWizard; if (!w || w.aiLoading) return;
    if (typeof window._wcpAiDraftContentBrief !== 'function') {
      w.error = 'AI module not loaded yet';
      refreshNewContentWizard();
      return;
    }
    w.aiLoading = true;
    w.error = '';
    refreshNewContentWizard();
    var input = {
      mode: w.mode,
      userBrief: {
        title:       w.brief.title,
        topic:       w.brief.topic,
        audience:    w.brief.audience,
        goal:        w.brief.goal,
        hub_id:      w.brief.hub_id,
        cluster_id:  w.brief.cluster_id,
        priority:    w.brief.priority
      }
    };
    if (w.mode === 'refresh' && (w.source.body || w.source.title || w.source.url)) {
      input.source = { url: w.source.url, title: w.source.title, body: w.source.body };
    }
    window._wcpAiDraftContentBrief(input, function(draft) {
      w.aiLoading = false;
      w.aiDraft = draft;
      // If the user locked a hub/cluster in the brief, enforce it over the AI's choice
      if (w.brief.hub_id)     w.aiDraft.hub_id     = w.brief.hub_id;
      if (w.brief.cluster_id) w.aiDraft.cluster_id = w.brief.cluster_id;
      refreshNewContentWizard();
    }, function(err) {
      w.aiLoading = false;
      w.error = 'AI call failed: ' + (err || 'unknown error');
      refreshNewContentWizard();
    });
  }

  function commitContentWizard() {
    var w = S._newContentWizard; if (!w || !w.aiDraft) return;
    collectContentWizardDraftEditsFromDom();
    var d = w.aiDraft;

    // Resolve content_type name → id
    var typeId = '';
    if (d.content_type) {
      var match = (S.data.content_types || []).find(function(t) { return (t.name || '').toLowerCase() === (d.content_type || '').toLowerCase(); });
      if (match) typeId = match.id;
    }

    snapshot('Before create content via wizard');
    var cnt = createContent({
      title:           d.title || w.brief.title || w.brief.topic || 'Untitled Content',
      hub_id:          d.hub_id     || w.brief.hub_id     || '',
      cluster_id:      d.cluster_id || w.brief.cluster_id || '',
      content_type_id: typeId,
      priority:        w.brief.priority || 'medium',
      tags:            (w.defaults && w.defaults.tags) || []
    });

    // Merge AI-generated details into the record
    var bi = d.basic_info || {};
    cnt.basic_info = cnt.basic_info || {};
    if (bi.audience)       cnt.basic_info.audience       = bi.audience;
    if (bi.goal)           cnt.basic_info.goal           = bi.goal;
    if (bi.funnel_stage)   cnt.basic_info.funnel_stage   = bi.funnel_stage;
    if (bi.word_count_min) cnt.basic_info.word_count_min = bi.word_count_min;
    if (bi.word_count_max) cnt.basic_info.word_count_max = bi.word_count_max;
    if (bi.word_count_min || bi.word_count_max) cnt.basic_info.word_count_target = bi.word_count_max || bi.word_count_min;
    if (bi.search_intent)  cnt.basic_info.search_intent  = bi.search_intent;
    if (bi.tone_of_voice)  cnt.basic_info.tone_of_voice  = bi.tone_of_voice;

    var r = d.research || {};
    cnt.research = cnt.research || {};
    if (Array.isArray(r.angles) && r.angles.length) cnt.research.angles = r.angles.slice();
    if (r.selected_angle) cnt.research.selected_angle = r.selected_angle;
    if (r.uvp) cnt.research.uvp = r.uvp;
    if (Array.isArray(r.questions)) cnt.research.questions = r.questions.slice();

    // Refresh notes — stash in research so the user sees them on the content
    if (w.mode === 'refresh') {
      cnt.research.refresh_notes = Array.isArray(d.refresh_notes) ? d.refresh_notes.slice() : [];
      cnt.research.source_url = w.source.url || '';
      if (w.source.title) cnt.research.source_title = w.source.title;
    }

    // Link cluster via bidirectional helper
    if (cnt.cluster_id) {
      assignContentToCluster(cnt, cnt.cluster_id);
      var cl = S.clusterMap[cnt.cluster_id];
      if (cl && cl.status === 'planned') cl.status = 'content_linked';
    }

    // Build a linked keyword group from the AI keywords
    var kws = d.keywords || {};
    var primary = kws.primary || {};
    var secondary = Array.isArray(kws.secondary) ? kws.secondary : [];
    var lsi = Array.isArray(kws.lsi) ? kws.lsi : [];
    if ((primary.keyword && primary.keyword.length) || secondary.length || lsi.length) {
      var now = new Date().toISOString();
      var allKws = [];
      if (primary.keyword) allKws.push({ keyword: String(primary.keyword), volume: primary.volume || 0, difficulty: '' });
      for (var si = 0; si < secondary.length; si++) allKws.push({ keyword: String(secondary[si]), volume: 0, difficulty: '' });
      for (var li = 0; li < lsi.length; li++)       allKws.push({ keyword: String(lsi[li]),       volume: 0, difficulty: '' });
      var grp = {
        id: generateId('kwg'),
        name: cnt.title,
        intent: bi.search_intent || '',
        search_intent: bi.search_intent || 'informational',
        keywords: allKws,
        primary_keyword_index: 0,
        content_id: cnt.id,
        hub_id: cnt.hub_id || '',
        cluster_id: cnt.cluster_id || '',
        source_session_id: '',
        notes: 'Generated by New Content Wizard (' + w.mode + ' mode)',
        created: now,
        updated: now
      };
      S.data.keyword_groups = S.data.keyword_groups || [];
      S.data.keyword_groups.push(grp);
      // Mirror primary + secondary onto the content's keyword fields
      cnt.keywords = cnt.keywords || { primary: { keyword: '', volume: 0, difficulty: '' }, secondary: [], lsi: [], conflicts: [] };
      if (primary.keyword) cnt.keywords.primary = { keyword: String(primary.keyword), volume: primary.volume || 0, difficulty: '' };
      if (secondary.length) cnt.keywords.secondary = secondary.map(function(k) { return { keyword: String(k), volume: 0, difficulty: '' }; });
      if (lsi.length)       cnt.keywords.lsi       = lsi.map(function(k) { return String(k); });
    }

    cnt.updated = new Date().toISOString();
    logActivity('content_created', cnt.id, cnt.title,
      (w.mode === 'refresh' ? 'Refresh draft' : 'New draft') +
      ' created via AI Wizard' +
      (cnt.hub_id ? ' · hub=' + (S.hubMap[cnt.hub_id] ? S.hubMap[cnt.hub_id].name : cnt.hub_id) : '') +
      (cnt.cluster_id ? ' · cluster=' + (S.clusterMap[cnt.cluster_id] ? S.clusterMap[cnt.cluster_id].name : cnt.cluster_id) : ''));
    buildMaps(); syncToTextarea();

    // Caller hook (create-pillar etc.)
    if (typeof w.onCreate === 'function') {
      try { w.onCreate(cnt); } catch (e) { console.error('[WCP] New Content Wizard onCreate hook failed:', e); }
    }

    S._newContentWizard = null;
    closeModal();
    S.selectedContentId = cnt.id;
    S.currentStep = 'info';
    navigate('content');
    toast('Content "' + truncate(cnt.title, 40) + '" created', 'success');
  }

  // ───────── Events ─────────

  function setupNewContentWizardEvents() {
    var ns = '.wcp2a-ncw';

    $(document).off('click' + ns + '-can').on('click' + ns + '-can', '[data-action="ncw-cancel"]', function() {
      S._newContentWizard = null;
      closeModal();
    });

    $(document).off('click' + ns + '-sm').on('click' + ns + '-sm', '[data-action="ncw-set-mode"]', function() {
      var w = S._newContentWizard; if (!w) return;
      w.mode = ($(this).data('mode') === 'refresh') ? 'refresh' : 'new';
      refreshNewContentWizard();
    });

    $(document).off('click' + ns + '-s1n').on('click' + ns + '-s1n', '[data-action="ncw-step1-next"]', function() { advanceFromStep1(); });
    $(document).off('click' + ns + '-s2n').on('click' + ns + '-s2n', '[data-action="ncw-step2-next"]', function() { advanceFromStep2(); });
    $(document).off('click' + ns + '-s3n').on('click' + ns + '-s3n', '[data-action="ncw-step3-next"]', function() { advanceFromStep3(); });

    $(document).off('click' + ns + '-b1').on('click' + ns + '-b1', '[data-action="ncw-back-to-step1"]', function() {
      S._newContentWizard.step = 1;
      refreshNewContentWizard();
    });
    $(document).off('click' + ns + '-b2').on('click' + ns + '-b2', '[data-action="ncw-back-to-step2"]', function() {
      collectContentWizardBriefFromDom();
      S._newContentWizard.step = 2;
      refreshNewContentWizard();
    });
    $(document).off('click' + ns + '-b3').on('click' + ns + '-b3', '[data-action="ncw-back-to-step3"]', function() {
      S._newContentWizard.step = 3;
      refreshNewContentWizard();
    });

    $(document).off('click' + ns + '-fu').on('click' + ns + '-fu', '[data-action="ncw-fetch-url"]', function() {
      fetchContentWizardUrl();
    });

    $(document).off('click' + ns + '-reg').on('click' + ns + '-reg', '[data-action="ncw-regenerate"]', function() {
      collectContentWizardDraftEditsFromDom();
      S._newContentWizard.aiDraft = null;
      scheduleContentWizardAICall();
    });

    $(document).off('click' + ns + '-cre').on('click' + ns + '-cre', '[data-action="ncw-create"]', function() {
      commitContentWizard();
    });

    // Keep cluster dropdown in sync when hub changes on Step 3
    $(document).off('change' + ns + '-hub').on('change' + ns + '-hub', '#wcpNcwHub', function() {
      var w = S._newContentWizard; if (!w) return;
      w.brief.hub_id = $(this).val() || '';
      w.brief.cluster_id = '';
      refreshNewContentWizard();
    });
  }

  // Installed from setupPart2AEvents()
  function installNewContentWizardCreateHandlers() {
    // Unbind Part 1's prompt-fallbacks and the old Part 2A modal bindings
    $(document).off('click.wcp-create-content');
    $(document).off('click.wcp-create-content-cluster');
    $(document).off('click.wcp-create-pillar');

    $(document).off('click.wcp-ncw-cc').on('click.wcp-ncw-cc', '[data-action="create-content"]', function(e) {
      e.preventDefault();
      openNewContentWizard();
    });

    $(document).off('click.wcp-ncw-ccc').on('click.wcp-ncw-ccc', '[data-action="create-content-for-cluster"]', function(e) {
      e.preventDefault();
      var clusterId = $(this).data('cluster');
      var hubId = $(this).data('hub') || S.selectedHubId || '';
      openNewContentWizard({ hub_id: hubId, cluster_id: clusterId });
    });

    $(document).off('click.wcp-ncw-cp').on('click.wcp-ncw-cp', '[data-action="create-pillar"]', function(e) {
      e.preventDefault();
      var hubId = $(this).data('hub') || S.selectedHubId;
      var hub = S.hubMap[hubId]; if (!hub) return;
      openNewContentWizard(
        { title: hub.name + ' — Complete Guide', hub_id: hubId, content_type_id: 'ct_002' },
        { onCreate: function(newContent) {
            setContentAsHubPillar(newContent);
            logActivity('pillar_assigned', newContent.id, newContent.title, 'Set as pillar of ' + hub.name);
            toast('Pillar content assigned to ' + hub.name, 'success');
        } }
      );
    });

    setupNewContentWizardEvents();
  }

  window._wcpOpenNewContentWizard = openNewContentWizard;
  window._wcpInstallNewContentWizard = installNewContentWizardCreateHandlers;
