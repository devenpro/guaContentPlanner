  // --- Badges ---
  function badge(text, bg, fg) {
    fg = fg || bg;
    return '<span class="wcp-badge" style="background:' + bg + '15;color:' + fg + '">' + esc(text) + '</span>';
  }
  function statusBadge(status) {
    var c = CONTENT_STATUSES[status] || { label: status, color: '#80868b' };
    return '<span class="wcp-status-badge"><span class="wcp-status-dot" style="background:' + c.color + '"></span>' + esc(c.label) + '</span>';
  }
  function priorityBadge(p) {
    if (!p) return '';
    var c = PRIORITY_LEVELS[p] || { label: p, color: '#80868b', icon: 'minus' };
    return '<span class="wcp-badge" style="background:' + c.color + '15;color:' + c.color + '">' + icon(c.icon) + ' ' + esc(c.label) + '</span>';
  }
  function scoreBadge(label, score, type) {
    var cls = type === 'seo' ? 'wcp-score-seo' : type === 'gseo' ? 'wcp-score-gseo' : 'wcp-score-aeo';
    return '<span class="wcp-score-badge ' + cls + '">' + esc(label) + ' ' + score + '%</span>';
  }
  function progressBar(pct, color) {
    color = color || 'var(--wcp-primary)';
    return '<div class="wcp-progress-bar"><div class="wcp-progress-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
  }

