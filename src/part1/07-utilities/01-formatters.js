  // ============================================================
  // SECTION 7: UTILITIES
  // ============================================================

  // --- Formatters ---
  function formatDate(iso) { if (!iso) return ''; var d = new Date(iso); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function formatDateShort(iso) { if (!iso) return ''; var d = new Date(iso); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function formatRelativeTime(iso) {
    if (!iso) return '';
    var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return formatDate(iso);
  }
  function formatNumber(n) { return (n || 0).toLocaleString(); }

