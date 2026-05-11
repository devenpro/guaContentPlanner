  // ============================================================
  // SECTION: CONTENT VIEW — single-screen view-first layout
  //   [Hero] → [Primary inline-edit block] → [Advanced collapsed] → [Export]
  // ============================================================

  // Helper: CW URL (used by the export section and by the header's Export button)
  function buildContentWriterURL(content) {
    var title = encodeURIComponent(content.title || '');
    var brandId = S.brandId || '';
    var nodeId = S.nodeId || '';
    var contentId = encodeURIComponent(content.id || '');
    return '/node/add/content_writer' +
      '?edit[title][widget][0][value]=' + title +
      '&edit[field_brand][widget][0][target_id]=' + brandId +
      '&edit[field_planner_hub][widget][0][target_id]=' + nodeId +
      '&edit[field_planner_id][widget][0][value]=' + contentId;
  }

  // Helper: render one collapsible sub-section inside the Brief. Each sub-section
  // starts collapsed and uses the same toggle class as the existing "Advanced
  // settings" block (wcp-info-section + wcp-info-collapsed + toggle handler).
  function _infoSubSection(opts) {
    var h = '<section class="wcp-cd-section wcp-info-section wcp-info-collapsed">';
    h += '<header class="wcp-cd-section-header wcp-info-section-toggle" data-action="toggle-info-section" role="button" tabindex="0">';
    h += '<div class="wcp-cd-section-title"><span class="wcp-cd-section-icon">' + icon(opts.icon || 'sliders') + '</span><h3>' + opts.title + '</h3></div>';
    h += '<span class="wcp-cd-section-hint">' + (opts.hint || '') + '</span>';
    h += '<div class="wcp-cd-section-action"><span class="wcp-info-chevron">' + icon('chevron-down') + '</span></div>';
    h += '</header>';
    h += '<div class="wcp-info-section-body">' + (opts.body || '') + '</div>';
    h += '</section>';
    return h;
  }

  // renderStepInfo — body of the content detail page.
  //
  // 2026-04: the hero (title / type / priority) has been hoisted into the
  // content-detail header (src/part2a/04-content-detail.js), so this
  // function renders ONLY the brief fields, the collapsed Advanced section,
  // and the export block. Every field below has exactly one home on the
  // page — no duplication with the header.
  function renderStepInfo(content) {
    var bi = content.basic_info || {};
    var r  = content.research || {};
    var templates = S.data.templates || [];
    var ct  = S.contentTypeMap[content.content_type_id];
    var hub = S.hubMap[content.hub_id];
    var isClosed = Constants.CLOSED_STATUSES.indexOf(content.status) !== -1;

    var html = '<div class="wcp-cd-body" data-content-id="' + esc(content.id) + '">';

    // Closed-state banner — when archived or rejected, collapse the editor
    // affordance; show a restore CTA instead. User can still scroll to read
    // everything below, but editing is de-emphasized.
    if (isClosed) {
      var stKey = content.status;
      var stCfg = Constants.CONTENT_STATUSES[stKey] || {};
      html += '<div class="wcp-cd-closed-banner" style="--closed-color:' + (stCfg.color || '#6b7280') + '">';
      html += '<div class="wcp-cd-closed-banner-icon">' + icon(stCfg.icon || 'box-archive') + '</div>';
      html += '<div class="wcp-cd-closed-banner-body">';
      html += '<strong>This content is ' + esc((stCfg.label || stKey).toLowerCase()) + '.</strong>';
      if (stKey === 'rejected' && content.rejected_reason) {
        html += '<div class="wcp-text-sm wcp-text-muted" style="margin-top:4px">Reason: ' + esc(content.rejected_reason) + '</div>';
      }
      if (content.archived_at || content.rejected_at) {
        html += '<div class="wcp-text-xs wcp-text-muted" style="margin-top:2px">' + formatRelativeTime(content.archived_at || content.rejected_at) + '</div>';
      }
      html += '</div>';
      html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="restore-content" data-id="' + esc(content.id) + '">' + icon('rotate-left') + ' Restore</button>';
      html += '</div>';
    }

    // ──────────────── BRIEF — slim two-section editor ────────────────
    // Pared back to the essentials per user feedback: audience/intent + a
    // collapsible Positioning & Voice section. Removed CTAs, min/max word
    // count, entities, FAQs, SERP competitors, and external references — the
    // data fields still exist on the content record for backward compat but
    // are no longer surfaced in the UI or the export JSON.
    var FS   = Constants.FUNNEL_STAGES || {};
    var SI   = Constants.SEARCH_INTENTS || {};
    var CD   = Constants.CONTENT_DEPTHS || {};

    // ── 1. AUDIENCE & INTENT (open by default) ──
    html += '<section class="wcp-cd-section">';
    html += '<header class="wcp-cd-section-header">';
    html += '<div class="wcp-cd-section-title"><span class="wcp-cd-section-icon">' + icon('users') + '</span><h3>Audience &amp; Intent</h3></div>';
    html += '<span class="wcp-cd-section-hint">Who it\'s for and what they came looking for.</span>';
    html += '<div class="wcp-cd-section-action">';
    html += '<button class="wcp-btn wcp-btn-ai wcp-btn-sm" data-action="ai-fill-brief" data-id="' + esc(content.id) + '">' + icon('sparkles') + ' AI Fill Brief</button>';
    html += (window._wcpAiSel ? window._wcpAiSel('ai-fill-brief') : '');
    html += '</div>';
    html += '</header>';
    html += '<div class="wcp-cd-fieldgrid">';

    // Audience (col-12)
    html += '<div class="wcp-cd-field wcp-cd-col-12">';
    html += '<label class="wcp-cd-field-label">' + icon('users') + ' Target audience</label>';
    html += '<input type="text" class="wcp-input wcp-info-preview-field wcp-step-field" data-path="basic_info.audience" value="' + esc(bi.audience || '') + '" placeholder="e.g. SaaS founders, marketing managers">';
    html += '</div>';

    // Search intent (col-6)
    html += '<div class="wcp-cd-field wcp-cd-col-6">';
    html += '<label class="wcp-cd-field-label">' + icon('compass') + ' Search intent</label>';
    html += '<select class="wcp-select wcp-step-field" data-path="basic_info.search_intent">';
    html += '<option value=""' + (!bi.search_intent ? ' selected' : '') + '>— Not set —</option>';
    for (var sik in SI) {
      html += '<option value="' + sik + '"' + (bi.search_intent === sik ? ' selected' : '') + '>' + esc(SI[sik].label) + '</option>';
    }
    html += '</select></div>';

    // Funnel stage (col-6)
    html += '<div class="wcp-cd-field wcp-cd-col-6">';
    html += '<label class="wcp-cd-field-label">' + icon('filter') + ' Funnel stage</label>';
    html += '<select class="wcp-select wcp-step-field" data-path="basic_info.funnel_stage">';
    html += '<option value=""' + (!bi.funnel_stage ? ' selected' : '') + '>— Not set —</option>';
    for (var fsk in FS) {
      html += '<option value="' + fsk + '"' + (bi.funnel_stage === fsk ? ' selected' : '') + '>' + esc(FS[fsk].label) + '</option>';
    }
    html += '</select></div>';

    // Content depth (col-6)
    html += '<div class="wcp-cd-field wcp-cd-col-6">';
    html += '<label class="wcp-cd-field-label">' + icon('layer-group') + ' Content depth <span class="wcp-cd-field-hint">reader level</span></label>';
    html += '<select class="wcp-select wcp-step-field" data-path="basic_info.content_depth">';
    html += '<option value=""' + (!bi.content_depth ? ' selected' : '') + '>— Not set —</option>';
    for (var cdk in CD) {
      html += '<option value="' + cdk + '"' + (bi.content_depth === cdk ? ' selected' : '') + '>' + esc(CD[cdk].label) + ' — ' + esc(CD[cdk].desc) + '</option>';
    }
    html += '</select></div>';

    // Word count target (col-6)
    html += '<div class="wcp-cd-field wcp-cd-col-6">';
    html += '<label class="wcp-cd-field-label">' + icon('align-left') + ' Word count target</label>';
    html += '<input type="number" class="wcp-input wcp-step-field" data-path="basic_info.word_count_target" value="' + (bi.word_count_target || '') + '" placeholder="e.g. 2000">';
    html += '</div>';

    // Tags (col-12)
    html += '<div class="wcp-cd-field wcp-cd-col-12">';
    html += '<label class="wcp-cd-field-label">' + icon('tags') + ' Tags</label>';
    html += renderTagInput(content.tags || [], content.id);
    html += '</div>';

    html += '</div></section>';

    // ── 2. POSITIONING & VOICE (collapsible) — angle / UVP / tone only ──
    html += _infoSubSection({
      icon: 'wand-magic-sparkles',
      title: 'Positioning &amp; Voice',
      hint: 'The hook, unique value, and tone.',
      body: (function() {
        var h = '<div class="wcp-cd-fieldgrid">';
        h += '<div class="wcp-cd-field wcp-cd-col-12"><label class="wcp-cd-field-label">' + icon('compass') + ' Angle</label>';
        h += '<input type="text" class="wcp-input wcp-step-field" data-path="research.selected_angle" value="' + esc(r.selected_angle || '') + '" placeholder="Why this piece exists — the hook"></div>';
        h += '<div class="wcp-cd-field wcp-cd-col-12"><label class="wcp-cd-field-label">' + icon('star') + ' Unique value proposition</label>';
        h += '<textarea class="wcp-input wcp-step-field" data-path="research.uvp" rows="2" placeholder="What makes this content uniquely valuable?">' + esc(r.uvp || '') + '</textarea></div>';
        h += '<div class="wcp-cd-field wcp-cd-col-12"><label class="wcp-cd-field-label">' + icon('microphone') + ' Tone of voice</label>';
        h += '<input type="text" class="wcp-input wcp-step-field" data-path="basic_info.tone_of_voice" value="' + esc(bi.tone_of_voice || '') + '" placeholder="e.g. friendly + technical, direct, no-nonsense"></div>';
        h += '</div>';
        return h;
      })()
    });

    // ──────────────── INTERNAL LINKS SECTION ────────────────
    // Hybrid rule+AI link picker. Hidden for closed states — no edits possible.
    if (!isClosed && typeof renderLinkPicker === 'function') {
      html += renderLinkPicker(content.id);
    }

    // ──────────────── ADVANCED SECTION (collapsed by default) ────────────────
    html += '<section class="wcp-cd-section wcp-info-section wcp-info-collapsed">';
    html += '<header class="wcp-cd-section-header wcp-info-section-toggle" data-action="toggle-info-section" role="button" tabindex="0">';
    html += '<div class="wcp-cd-section-title"><span class="wcp-cd-section-icon">' + icon('sliders') + '</span><h3>Advanced settings</h3></div>';
    html += '<span class="wcp-cd-section-hint">Template choice and content goal.</span>';
    html += '<div class="wcp-cd-section-action"><span class="wcp-info-chevron">' + icon('chevron-down') + '</span></div>';
    html += '</header>';
    html += '<div class="wcp-info-section-body">';
    html += '<div class="wcp-cd-fieldgrid">';

    // Template (col-6) — WcpSelect
    html += '<div class="wcp-cd-field wcp-cd-col-6">';
    html += '<label class="wcp-cd-field-label">' + icon('clipboard-list') + ' Template</label>';
    if (window._wcpSelect) {
      var tplItems = [];
      for (var tpi = 0; tpi < templates.length; tpi++) {
        tplItems.push({ id: templates[tpi].id, label: templates[tpi].name, icon: 'clipboard-list', description: templates[tpi].description || '' });
      }
      html += window._wcpSelect.render({
        name: 'template_id',
        dataPath: 'template_id',
        value: content.template_id || '',
        placeholder: 'Choose a template…',
        emptyLabel: '— No template —',
        items: tplItems
      });
    } else {
      html += '<select class="wcp-select wcp-info-preview-field wcp-step-field" data-path="template_id">';
      html += '<option value="">— No template —</option>';
      for (var tpif = 0; tpif < templates.length; tpif++) {
        html += '<option value="' + esc(templates[tpif].id) + '"' + (content.template_id === templates[tpif].id ? ' selected' : '') + '>' + esc(templates[tpif].name) + '</option>';
      }
      html += '</select>';
    }
    html += '</div>';

    // Content goal (col-12)
    html += '<div class="wcp-cd-field wcp-cd-col-12">';
    html += '<label class="wcp-cd-field-label">' + icon('bullseye') + ' Content goal</label>';
    html += '<textarea class="wcp-input wcp-info-preview-field wcp-step-field" data-path="basic_info.goal" rows="2" placeholder="e.g. Drive free trial signups by demonstrating product value">' + esc(bi.goal || '') + '</textarea>';
    html += '</div>';

    html += '</div></div></section>';

    // ──────────────── EXPORT BLOCK ────────────────
    // Hidden entirely for closed states — the banner at the top already says
    // "this content is archived/rejected" and offers the Restore action.
    if (!isClosed) {
      html += renderContentExportBlock(content, ct, hub);
    }

    html += '</div>'; // /wcp-cd-body
    return html;
  }

  // Export block — inline at bottom of the content view
  function renderContentExportBlock(content, ct, hub) {
    var cwItem = S.contentWriterMap ? S.contentWriterMap[content.id] : null;

    // Find linked keyword group
    var linkedGroup = null;
    var allGroups = (S.data && S.data.keyword_groups) || [];
    for (var lgi = 0; lgi < allGroups.length; lgi++) {
      if (allGroups[lgi].content_id === content.id) { linkedGroup = allGroups[lgi]; break; }
    }
    var primaryKw = '';
    if (linkedGroup && linkedGroup.keywords && linkedGroup.keywords.length) {
      var pIdx = linkedGroup.primary_keyword_index || 0;
      primaryKw = linkedGroup.keywords[pIdx] ? (linkedGroup.keywords[pIdx].keyword || '') : '';
    }

    // Validation (4 required + 1 optional)
    var bi = content.basic_info || {};
    var validations = [
      { label: 'Title set',            pass: !!(content.title && content.title !== 'Untitled Content'), required: true },
      { label: 'Content type chosen',  pass: !!content.content_type_id, required: true },
      { label: 'Hub assigned',         pass: !!content.hub_id,          required: true },
      { label: 'Target audience set',  pass: !!bi.audience,             required: true },
      { label: 'Keyword group linked', pass: !!linkedGroup,             required: false }
    ];
    var requiredItems = validations.filter(function(v) { return v.required; });
    var passCount = requiredItems.filter(function(v) { return v.pass; }).length;
    var allPass = passCount === requiredItems.length;

    var html = '<div class="wcp-cv-export">';

    // Hero banner
    var heroClass = cwItem ? 'wcp-export-hero-exported' : (allPass ? 'wcp-export-hero-ready' : 'wcp-export-hero-incomplete');
    html += '<div class="wcp-export-hero ' + heroClass + '">';
    html += '<div class="wcp-export-hero-status">';
    if (cwItem)          html += icon('circle-check') + ' Exported to Content Writer';
    else if (allPass)    html += icon('circle-check') + ' Ready to send to Content Writer';
    else                 html += icon('info-circle') + ' ' + passCount + ' of ' + requiredItems.length + ' required items ready';
    html += '</div>';

    // CTA row
    html += '<div class="wcp-export-cta-row" style="margin-top:var(--wcp-space-3);margin-bottom:0">';
    if (cwItem) {
      html += '<a href="' + esc(cwItem.url) + '" target="_blank" class="wcp-btn wcp-btn-success-solid wcp-btn-lg wcp-export-cta wcp-export-cta-open">' + icon('external-link') + ' Open in Content Writer</a>';
    } else {
      html += '<button class="wcp-btn wcp-btn-primary wcp-btn-lg wcp-export-cta' + (allPass ? '' : ' wcp-export-cta-warn') + '" data-action="create-in-cw" data-id="' + esc(content.id) + '">' + icon('paper-plane') + ' Send to Content Writer</button>';
    }
    html += '<button class="wcp-btn wcp-btn-outline" data-action="preview-export-json" data-id="' + esc(content.id) + '">' + icon('eye') + ' Preview JSON</button>';
    html += '</div>';
    html += '</div>'; // /hero

    // Two-column layout
    html += '<div class="wcp-export-columns">';

    // What we're sending
    html += '<div class="wcp-export-panel">';
    html += '<div class="wcp-export-panel-header">' + icon('box-open') + ' What we\'re sending</div>';
    html += '<div class="wcp-export-panel-body">';
    var rows = [];
    if (ct)                   rows.push(['Content type', ct.name]);
    if (hub)                  rows.push(['Hub', hub.name]);
    if (bi.audience)          rows.push(['Audience', bi.audience]);
    if (bi.word_count_target) rows.push(['Word count', formatNumber(bi.word_count_target) + ' words']);
    if (primaryKw)            rows.push(['Primary keyword', primaryKw + (linkedGroup.keywords.length > 1 ? ' + ' + (linkedGroup.keywords.length - 1) + ' related' : '')]);
    else if (linkedGroup)     rows.push(['Keyword group', linkedGroup.name + ' (' + (linkedGroup.keywords || []).length + ' keywords)']);
    if ((content.research || {}).selected_angle) rows.push(['Angle', truncate(content.research.selected_angle, 60)]);
    if ((content.research || {}).uvp) rows.push(['UVP', truncate(content.research.uvp, 60)]);
    if (!rows.length) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-3)"><span class="wcp-text-muted">Fill in the primary fields to see the payload preview.</span></div>';
    } else {
      for (var ri = 0; ri < rows.length; ri++) {
        html += '<div class="wcp-export-row">';
        html += '<span class="wcp-export-row-label">' + esc(rows[ri][0]) + '</span>';
        html += '<span class="wcp-export-row-value">' + esc(rows[ri][1]) + '</span>';
        html += '</div>';
      }
    }
    html += '</div></div>';

    // Readiness
    html += '<div class="wcp-export-panel">';
    html += '<div class="wcp-export-panel-header">' + icon('list-check') + ' Readiness</div>';
    html += '<div class="wcp-export-panel-body">';
    for (var vi = 0; vi < validations.length; vi++) {
      var v = validations[vi];
      var stateClass = v.pass ? 'wcp-export-val-pass' : (v.required ? 'wcp-export-val-fail' : 'wcp-export-val-info');
      var stateIcon  = v.pass ? 'circle-check' : (v.required ? 'circle-xmark' : 'info-circle');
      var suffix = !v.required ? ' <span class="wcp-text-muted wcp-text-xs">(optional)</span>' : '';
      html += '<div class="wcp-export-val-item ' + stateClass + '">';
      html += icon(stateIcon) + ' ' + esc(v.label) + suffix;
      html += '</div>';
    }
    html += '</div></div>';

    html += '</div>'; // /columns

    // Already-exported link card
    if (cwItem) {
      html += '<div class="wcp-cw-link-card" style="margin-top:var(--wcp-space-4)">';
      html += '<div class="wcp-cw-link-card-header">';
      html += '<span style="color:var(--wcp-success)">' + icon('circle-check') + '</span>';
      html += '<div style="flex:1;min-width:0"><strong>Content Writer node #' + esc(cwItem.cw_node_id) + '</strong>';
      html += '<div class="wcp-text-sm wcp-text-muted">' + esc(cwItem.title) + '</div></div>';
      html += '</div>';
      html += '<div class="wcp-cw-link-card-meta">';
      if (cwItem.status)   html += '<span>' + icon('signal') + ' ' + esc(cwItem.status) + '</span>';
      if (cwItem.director) html += '<span>' + icon('user') + ' ' + esc(cwItem.director) + '</span>';
      if (cwItem.updated)  html += '<span>' + icon('clock') + ' ' + formatRelativeTime(cwItem.updated) + '</span>';
      html += '</div></div>';
    }

    // Export history
    var exp = content.export || {};
    if (exp.exported_at) {
      html += '<div class="wcp-export-history" style="margin-top:var(--wcp-space-3)">';
      html += icon('paper-plane') + ' <span class="wcp-text-sm wcp-text-muted">Exported ' + formatDate(exp.exported_at);
      if (exp.cw_node_id) html += ' → CW Node ' + esc(exp.cw_node_id);
      if (exp.export_version) html += ' (v' + esc(exp.export_version) + ')';
      html += '</span></div>';
    }

    html += '</div>'; // /wcp-cv-export
    return html;
  }
