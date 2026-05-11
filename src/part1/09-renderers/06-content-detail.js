  function renderContentDetailPane() {
    // Delegate to Part 2A's interactive editor when loaded
    var R = window._wcpRenderers || {};
    if (R.contentDetailView) return R.contentDetailView();

    if (!S.selectedContentId) {
      return '<div class="wcp-empty-state" style="height:100%;justify-content:center">' +
        '<div class="wcp-empty-state-icon">' + icon('file-lines') + '</div>' +
        '<div class="wcp-empty-state-title">Select content to view details</div>' +
        '<div class="wcp-empty-state-text">Choose a content piece from the list, or create a new one to start planning.</div>' +
        '</div>';
    }

    var c = S.contentMap[S.selectedContentId];
    if (!c) return '<div class="wcp-empty-state"><p>Content not found.</p></div>';

    var ct = S.contentTypeMap[c.content_type_id];
    var hub = S.hubMap[c.hub_id];
    var cl = S.clusterMap[c.cluster_id];

    var html = '';
    // Header with pipeline
    html += '<div class="wcp-detail-header">';
    // Pipeline steps
    html += '<div class="wcp-pipeline-steps">';
    for (var pi = 0; pi < PIPELINE_STEPS.length; pi++) {
      var step = PIPELINE_STEPS[pi];
      var stepStatus = step.key === 'export' ? 'export_ready' : step.key;
      var currentIdx = STATUS_ORDER.indexOf(c.status);
      var stepIdx = STATUS_ORDER.indexOf(stepStatus);
      var isDone = stepIdx < currentIdx;
      var isActive = stepStatus === c.status || (step.key === 'export' && (c.status === 'export_ready' || c.status === 'exported'));
      html += '<div class="wcp-pipeline-step">';
      html += '<div class="wcp-pipeline-step-bar ' + (isDone ? 'wcp-pipeline-step-bar-done' : isActive ? 'wcp-pipeline-step-bar-active' : 'wcp-pipeline-step-bar-pending') + '"></div>';
      html += '<div class="wcp-pipeline-step-label ' + (isDone ? 'wcp-pipeline-step-label-done' : isActive ? 'wcp-pipeline-step-label-active' : 'wcp-pipeline-step-label-pending') + '">' + esc(step.label) + '</div>';
      html += '</div>';
    }
    html += '</div>';
    // Title
    html += '<div class="wcp-flex-between">';
    html += '<div style="flex:1;min-width:0"><div style="font-size:var(--wcp-font-size-xl);font-weight:800;font-family:var(--wcp-font-display);color:var(--wcp-text-primary);line-height:1.3">' + esc(c.title) + '</div>';
    html += '<div style="font-size:var(--wcp-font-size-xs);color:var(--wcp-text-secondary);margin-top:var(--wcp-space-1)">';
    if (ct) html += esc(ct.name);
    if (hub) html += ' · ' + esc(hub.name);
    if (cl) html += ' · ' + esc(cl.name);
    html += '</div></div>';
    html += '<div style="display:flex;gap:var(--wcp-space-1);flex-shrink:0;margin-left:var(--wcp-space-3)">';
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="export-to-cw" data-id="' + esc(c.id) + '">' + icon('paper-plane') + ' Export to CW</button>';
    html += '</div></div>';
    html += '</div>';

    // Detail body — read-only fallback (only used in the brief moment before Part 2A loads).
    // Once Part 2A's contentDetailView registers, this function returns early at line 4.
    html += '<div class="wcp-detail-body">';
    html += renderContentSectionReadonly('BASIC INFORMATION', 'info-circle', [
      ['Content Type', ct ? ct.name : '—'],
      ['Target Audience', (c.basic_info && c.basic_info.audience) || '—'],
      ['Word Count Target', c.basic_info && c.basic_info.word_count_target ? formatNumber(c.basic_info.word_count_target) : '—'],
      ['Angle', (c.research && c.research.selected_angle) || '—']
    ], []);

    html += '</div>';
    return html;
  }

  function renderContentSectionReadonly(label, iconName, fields, aiActions) {
    var html = '<div class="wcp-section">';
    html += '<div class="wcp-section-header"><span class="wcp-section-label">' + icon(iconName) + ' ' + esc(label) + '</span>';
    if (aiActions && aiActions.length > 0) {
      html += '<div class="wcp-section-actions">';
      for (var ai = 0; ai < aiActions.length; ai++) {
        // AI action buttons — placeholders until Phase 4
        html += '<button class="wcp-btn-ai wcp-btn-ai-sm" data-action="' + esc(aiActions[ai]) + '" data-id="' + esc(S.selectedContentId || '') + '">' + icon('sparkles') + '</button>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="wcp-section-body">';
    for (var fi = 0; fi < fields.length; fi++) {
      var isLast = fi === fields.length - 1;
      html += '<div class="wcp-field-row" style="' + (isLast ? 'border-bottom:none' : '') + '">';
      html += '<span class="wcp-field-label">' + esc(fields[fi][0]) + '</span>';
      html += '<span class="wcp-field-value">' + esc(fields[fi][1]) + ' <span class="wcp-field-edit-icon">✎</span></span>';
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  }

  // ─── CONTENT TYPES VIEW ──────────────────────────────
