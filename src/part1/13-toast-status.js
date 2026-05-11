  // ============================================================
  // SECTION 13: TOAST & AUTO-STATUS ENGINE
  // ============================================================

  function toast(msg, type, dur) {
    type = type || 'info';
    // Error / warning toasts stick longer so users have time to read; info / success stay snappy.
    if (!dur) dur = (type === 'error' || type === 'warning') ? 6000 : 3000;
    var $c = $('#wcpToasts');
    if (!$c.length) { $c = $('<div id="wcpToasts" class="wcp-toast-container"></div>'); $('#wcpApp').append($c); }
    var id = 'toast_' + Date.now();
    var iconName = type === 'success' ? 'circle-check' : (type === 'error' ? 'circle-xmark' : (type === 'warning' ? 'warning' : 'info-circle'));
    $c.append('<div class="wcp-toast wcp-toast-' + type + '" id="' + id + '"><span class="wcp-toast-icon">' + icon(iconName) + '</span><span class="wcp-toast-message">' + esc(msg) + '</span><button class="wcp-toast-close" data-action="close-toast">&times;</button></div>');
    setTimeout(function() { $('#' + id).addClass('wcp-toast-show'); }, 10);
    setTimeout(function() { $('#' + id).removeClass('wcp-toast-show'); setTimeout(function() { $('#' + id).remove(); }, 300); }, dur);
  }

  // --- Auto-Status Engine (forward-only, single-step pipeline: info → export_ready → exported) ---
  // 'exported' is set explicitly by the Send-to-CW action, never inferred here.
  function evaluateAutoStatus(content) {
    if (!content) return null;
    var currentIdx = STATUS_ORDER.indexOf(content.status);
    if (currentIdx < 0) return null;
    var hasInfoBasics = !!(content.title && content.content_type_id && content.hub_id);

    // info → export_ready: title + content type + hub all set
    if (content.status === 'info' && hasInfoBasics) return 'export_ready';

    return null;
  }

  function maybeAdvanceStatus(content, reason) {
    if (!content) return false;
    var suggested = evaluateAutoStatus(content);
    if (!suggested) return false;
    var currentIdx = STATUS_ORDER.indexOf(content.status);
    var suggestedIdx = STATUS_ORDER.indexOf(suggested);
    if (suggestedIdx <= currentIdx) return false;

    var oldLabel = (CONTENT_STATUSES[content.status] || {}).label || content.status;
    var newLabel = (CONTENT_STATUSES[suggested] || {}).label || suggested;
    content.status = suggested;
    content.updated = new Date().toISOString();
    logActivity('content_status_changed', content.id, content.title, oldLabel + ' → ' + newLabel + (reason ? ' (' + reason + ')' : ''));
    toast('Advanced to ' + newLabel + (reason ? ' — ' + reason : ''), 'success', 4000);
    return true;
  }

  // ── Quick-advance along QUICK_ADVANCE_PATH ──
  // Used by the ▶ button on the content-detail status pill. Walks
  // info → export_ready → exported → ready_to_publish → published and
  // stops at published. Off-path states (rejected, archived) are not
  // advanced from here; those transitions are always explicit user actions.
  // Returns the new status key on success, or false if already at the end
  // of the path (or on an off-path state).
  function advanceContentStatus(content) {
    if (!content) return false;
    var i = QUICK_ADVANCE_PATH.indexOf(content.status);
    if (i < 0 || i >= QUICK_ADVANCE_PATH.length - 1) return false;
    // Require published_url before entering the published state. Without it we
    // have no way to merge this content with its sitemap record.
    var nextKey = QUICK_ADVANCE_PATH[i + 1];
    if (nextKey === 'published' && !content.published_url) {
      toast('Add the live page URL before publishing', 'warning');
      return false;
    }
    var prevKey = content.status;
    var oldLabel = (CONTENT_STATUSES[prevKey] || {}).label || prevKey;
    var newLabel = (CONTENT_STATUSES[nextKey] || {}).label || nextKey;
    content.status = nextKey;
    content.updated = new Date().toISOString();
    // Published gets its own activity type so the log feed can render it with
    // the globe icon; everything else uses content_status_changed.
    var activityType = (nextKey === 'published') ? 'content_published' : 'content_status_changed';
    logActivity(activityType, content.id, content.title, oldLabel + ' → ' + newLabel + ' (quick advance)');
    // Side-effect: upsert/merge sitemap page + flip exported links to published
    if (nextKey === 'published' && typeof onContentPublished === 'function') {
      try { onContentPublished(content); } catch (e) { console.error('[WCP] onContentPublished failed:', e); }
    }
    return nextKey;
  }

  // Peek at the next quick-advance step without mutating — used to render
  // the ▶ button's tooltip and disabled state.
  function nextQuickAdvanceStatus(status) {
    var i = QUICK_ADVANCE_PATH.indexOf(status);
    if (i < 0 || i >= QUICK_ADVANCE_PATH.length - 1) return null;
    return QUICK_ADVANCE_PATH[i + 1];
  }

