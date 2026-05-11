  // ============================================================
  // INTERNAL LINKS PICKER — brief section
  // ============================================================
  //
  // Two sub-lists inside one section:
  //   1. Committed — links already in the ledger for this content
  //                  (state=selected / exported / published). Anchor text
  //                  is editable. Each row has a Remove button.
  //   2. Suggestions — transient S.linkSuggestions[contentId]. Checkbox
  //                    commits to the ledger; editing anchor text before
  //                    commit stores the edit on the suggestion object.
  //
  // The whole section re-renders via window._wcpRenderLinkPicker so the
  // AI action can swap it without touching the rest of the brief.

  function renderLinkPicker(contentId) {
    var c = S.contentMap[contentId]; if (!c) return '';
    var links = (typeof window._wcpGetLinksForContent === 'function') ? window._wcpGetLinksForContent(contentId) : [];
    var committed = links.filter(function(l) { return l.state !== 'rejected'; });
    S.linkSuggestions = S.linkSuggestions || {};
    var suggestions = (S.linkSuggestions[contentId] || []).filter(function(s) {
      // Hide any suggestion already committed (checkbox would be redundant)
      for (var i = 0; i < committed.length; i++) { if (committed[i].to_page_id === s.page_id) return false; }
      return true;
    });

    // Outbound tallies by state (for the header pill row)
    var tally = { selected: 0, exported: 0, published: 0 };
    for (var ti = 0; ti < committed.length; ti++) {
      var st = committed[ti].state;
      if (tally[st] !== undefined) tally[st]++;
    }

    var html = '<section class="wcp-cd-section" id="wcpLinkPicker_' + esc(contentId) + '">';
    html += '<header class="wcp-cd-section-header">';
    html += '<div class="wcp-cd-section-title"><span class="wcp-cd-section-icon">' + icon('link') + '</span><h3>Internal Links</h3></div>';
    html += '<span class="wcp-cd-section-hint">Pick pages this piece should link to. Suggestions use your hubs, clusters, keywords + AI.</span>';
    html += '<div class="wcp-cd-section-action">';
    if (committed.length) {
      html += '<span class="wcp-linkpick-tally" title="Outbound internal links from this content">';
      html += '<span class="wcp-linkpick-tally-num">' + tally.selected + '</span><span class="wcp-linkpick-tally-lbl">selected</span>';
      html += '<span class="wcp-linkpick-tally-sep">·</span>';
      html += '<span class="wcp-linkpick-tally-num">' + tally.exported + '</span><span class="wcp-linkpick-tally-lbl">exported</span>';
      html += '<span class="wcp-linkpick-tally-sep">·</span>';
      html += '<span class="wcp-linkpick-tally-num wcp-linkpick-tally-pub">' + tally.published + '</span><span class="wcp-linkpick-tally-lbl">live</span>';
      html += '</span>';
    }
    html += '<button class="wcp-btn wcp-btn-ai wcp-btn-sm" data-action="suggest-internal-links" data-id="' + esc(contentId) + '">' + icon('sparkles') + ' Suggest links</button>';
    html += (window._wcpAiSel ? window._wcpAiSel('ai-suggest-links') : '');
    html += '</div></header>';

    // Committed
    if (committed.length) {
      html += '<div class="wcp-linkpick-group">';
      html += '<div class="wcp-linkpick-group-label">Selected for this content</div>';
      for (var i = 0; i < committed.length; i++) {
        html += _renderCommittedLinkRow(committed[i]);
      }
      html += '</div>';
    }

    // Suggestions
    if (suggestions.length) {
      html += '<div class="wcp-linkpick-group">';
      html += '<div class="wcp-linkpick-group-label">Suggested (<button class="wcp-linkpick-clear" data-action="clear-link-suggestions" data-id="' + esc(contentId) + '">clear</button>)</div>';
      for (var s = 0; s < suggestions.length; s++) {
        html += _renderSuggestionRow(suggestions[s], contentId);
      }
      html += '</div>';
    } else if (!committed.length) {
      // If the engine ran and found nothing, show the targeted "why" hint
      // from explainNoLinkCandidates — better than a blank "no links".
      var hintMsg = (S._linkSuggestionHint && S._linkSuggestionHint[contentId]) || '';
      if (hintMsg) {
        html += '<div class="wcp-linkpick-empty wcp-linkpick-empty-why">';
        html += icon('circle-info') + ' <strong>No link candidates.</strong> ' + hintMsg;
        html += '</div>';
      } else {
        html += '<div class="wcp-linkpick-empty">';
        html += icon('link') + ' <strong>No links yet.</strong> Click <em>Suggest links</em> to see relevant pages from your sitemap.';
        html += '</div>';
      }
    }

    // Manual add — a simple URL input. Canonicalizes + resolves to an
    // existing sitemap_page; if the URL isn't in the sitemap, offers to
    // create a stub.
    html += '<div class="wcp-linkpick-manual">';
    html += '<label class="wcp-text-xs wcp-text-muted">Add a URL manually</label>';
    html += '<div class="wcp-linkpick-manual-row">';
    html += '<input type="url" class="wcp-input wcp-input-sm" id="wcpLinkManual_' + esc(contentId) + '" placeholder="https://yoursite.com/target-page">';
    html += '<button class="wcp-btn wcp-btn-sm" data-action="add-manual-link" data-id="' + esc(contentId) + '">' + icon('plus') + ' Add</button>';
    html += '</div></div>';

    html += '</section>';
    return html;
  }

  function _renderCommittedLinkRow(link) {
    var page = S.sitemapPageMap[link.to_page_id];
    var STATES = Constants.SITEMAP_LINK_STATES || {};
    var st = STATES[link.state] || { label: link.state, color: '#6b7280' };
    var title = page ? (page.title || _sidTruncUrl(page.url)) : '(missing page)';
    var urlText = page ? _sidTruncUrl(page.url) : '';
    var eff = (page && typeof window._wcpEffectivePriority === 'function') ? window._wcpEffectivePriority(page) : 3;
    var PR = (Constants.SITEMAP_PRIORITIES || {})[String(eff)] || { label: 'P3', color: '#6b7280' };

    var html = '<div class="wcp-linkpick-row wcp-linkpick-row-committed" data-link-id="' + esc(link.id) + '">';
    html += '<div class="wcp-linkpick-row-main">';
    html += '<span class="wcp-sitemap-pri-pill" style="background:' + PR.color + '">' + PR.label + '</span>';
    html += '<div class="wcp-linkpick-row-title">';
    html += '<strong>' + esc(title) + '</strong>';
    html += '<span class="wcp-linkpick-state" style="background:' + st.color + '15;color:' + st.color + '">' + esc(st.label) + '</span>';
    html += '</div>';
    html += '<span class="wcp-linkpick-row-url">' + esc(urlText) + '</span>';
    html += '</div>';
    html += '<input type="text" class="wcp-input wcp-input-sm wcp-linkpick-anchor" data-action="save-link-anchor" data-id="' + esc(link.id) + '" value="' + esc(link.anchor_text || '') + '" placeholder="Anchor text (optional — writer fills this)…">';
    if (link.reason) html += '<div class="wcp-linkpick-reason">' + icon('info-circle') + ' ' + esc(link.reason) + '</div>';
    html += '<div class="wcp-linkpick-row-actions">';
    // Unselect — moves the link out of the ledger, back into the suggestion list
    // on the next AI run. Kept deliberately non-destructive visually (no red
    // trash); this is a reversible action, not a data-loss one.
    html += '<button class="wcp-btn-icon wcp-linkpick-unselect" data-action="unselect-link" data-id="' + esc(link.id) + '" title="Unselect (remove this link)">' + icon('xmark') + ' <span>Unselect</span></button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function _renderSuggestionRow(sug, contentId) {
    // Suggestion rows are deliberately LIGHT now — just a checkbox, the
    // target page info, and the reason. No anchor-text input; anchor text
    // is added later on the committed row (or the writer app fills it).
    var page = S.sitemapPageMap[sug.page_id];
    if (!page) return '';
    var eff = (typeof window._wcpEffectivePriority === 'function') ? window._wcpEffectivePriority(page) : 3;
    var PR = (Constants.SITEMAP_PRIORITIES || {})[String(eff)] || { label: 'P3', color: '#6b7280' };
    var title = page.title || _sidTruncUrl(page.url);
    var srcBadge = sug.source === 'ai' ? 'AI' : 'Rule';
    var srcColor = sug.source === 'ai' ? 'var(--wcp-cluster)' : 'var(--wcp-text-muted)';

    var html = '<div class="wcp-linkpick-row wcp-linkpick-row-sug wcp-linkpick-row-light" data-page-id="' + esc(sug.page_id) + '">';
    html += '<label class="wcp-linkpick-check"><input type="checkbox" data-action="commit-suggestion" data-content-id="' + esc(contentId) + '" data-page-id="' + esc(sug.page_id) + '"><span></span></label>';
    html += '<div class="wcp-linkpick-row-main">';
    html += '<span class="wcp-sitemap-pri-pill" style="background:' + PR.color + '">' + PR.label + '</span>';
    html += '<div class="wcp-linkpick-row-title">';
    html += '<strong>' + esc(title) + '</strong>';
    html += '<span class="wcp-linkpick-source" style="background:' + srcColor + '15;color:' + srcColor + '">' + srcBadge + '</span>';
    if (typeof sug.confidence === 'number') html += '<span class="wcp-linkpick-conf">' + Math.round(sug.confidence * 100) + '%</span>';
    html += '</div>';
    html += '<span class="wcp-linkpick-row-url">' + esc(_sidTruncUrl(page.url)) + '</span>';
    if (sug.reason) html += '<div class="wcp-linkpick-reason wcp-linkpick-reason-inline">' + icon('info-circle') + ' ' + esc(sug.reason) + '</div>';
    html += '</div>';
    // Dismiss button — removes just this suggestion from the transient list
    // without committing. Useful when the AI proposes a bad match.
    html += '<button class="wcp-linkpick-dismiss" data-action="delete-suggestion" data-content-id="' + esc(contentId) + '" data-page-id="' + esc(sug.page_id) + '" title="Dismiss this suggestion">' + icon('xmark') + '</button>';
    html += '</div>';
    return html;
  }

  function _sidTruncUrl(url) {
    if (!url) return '';
    var s = String(url);
    var m = s.match(/^https?:\/\/[^\/]+(\/.*)?$/i);
    var path = m && m[1] ? m[1] : s;
    return path && path.length > 60 ? path.substr(0, 57) + '…' : (path || '/');
  }

  // Expose for Part 2B's re-render helper
  window._wcpRenderLinkPicker = renderLinkPicker;
