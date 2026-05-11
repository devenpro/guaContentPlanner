  // --- Icons (Font Awesome 6 Free Solid) ---
  //
  // Every icon name used by the app is mapped here explicitly. Unknown names
  // fall through to `fa-<name>` AND log a one-time console warning so we
  // can spot typos and missing mappings instead of silently rendering as
  // empty glyphs (the "random characters" users were seeing).
  //
  // When adding a new name, verify it exists in FA6 Free Solid — many FA5
  // names (`check-circle`, `times`, `history`, `rocket-launch`, `hand-wave`)
  // were renamed or are Pro-only in v6.

  var _iconWarned = {};

  function icon(name, className) {
    className = className || '';
    var icons = {
      // Search / find
      'search': 'fa-magnifying-glass',
      'magnifying-glass': 'fa-magnifying-glass',
      'magnifying-glass-chart': 'fa-magnifying-glass-chart',

      // Ideas / AI
      'lightbulb': 'fa-lightbulb',
      'sparkles': 'fa-sparkles',
      'wand-magic': 'fa-wand-magic-sparkles',
      'wand-magic-sparkles': 'fa-wand-magic-sparkles',
      'brain': 'fa-brain',
      'robot': 'fa-robot',

      // Files / content
      'file-lines': 'fa-file-lines',
      'book': 'fa-book',
      'clipboard-list': 'fa-clipboard-list',
      'note-sticky': 'fa-note-sticky',
      'heading': 'fa-heading',
      'align-left': 'fa-align-left',
      'quote-left': 'fa-quote-left',
      'code': 'fa-code',

      // Editing
      'edit': 'fa-pen-to-square',
      'pen': 'fa-pen',
      'pen-fancy': 'fa-pen-fancy',
      'trash': 'fa-trash',
      'copy': 'fa-copy',
      'plus': 'fa-plus',
      'minus': 'fa-minus',
      'check': 'fa-check',
      'x': 'fa-xmark',
      'xmark': 'fa-xmark',
      'times': 'fa-xmark',                   // FA5 → FA6 alias

      // Chevrons / carets / arrows
      'chevron-down': 'fa-chevron-down',
      'chevron-right': 'fa-chevron-right',
      'chevron-up': 'fa-chevron-up',
      'chevron-left': 'fa-chevron-left',
      'caret-down': 'fa-caret-down',
      'arrow-up': 'fa-arrow-up',
      'arrow-down': 'fa-arrow-down',
      'arrow-left': 'fa-arrow-left',
      'arrow-right': 'fa-arrow-right',
      'arrow-trend-up': 'fa-arrow-trend-up',
      'arrow-up-right-from-square': 'fa-arrow-up-right-from-square',
      'external-link': 'fa-arrow-up-right-from-square',
      'arrows-rotate': 'fa-arrows-rotate',
      'refresh': 'fa-arrows-rotate',          // alias
      'arrows-left-right': 'fa-arrows-left-right',
      'rotate-left': 'fa-rotate-left',
      'rotate-right': 'fa-rotate-right',
      'shuffle': 'fa-shuffle',

      // Time
      'clock': 'fa-clock',
      'clock-rotate-left': 'fa-clock-rotate-left',
      'history': 'fa-clock-rotate-left',      // FA5 → FA6 alias
      'calendar': 'fa-calendar',
      'calendar-check': 'fa-calendar-check',

      // Status / alerts
      'circle-check': 'fa-circle-check',
      'check-circle': 'fa-circle-check',      // FA5 → FA6 alias
      'circle-xmark': 'fa-circle-xmark',
      'circle-info': 'fa-circle-info',
      'info-circle': 'fa-circle-info',        // alias
      'circle-exclamation': 'fa-circle-exclamation',
      'circle-question': 'fa-circle-question',
      'triangle-exclamation': 'fa-triangle-exclamation',
      'warning': 'fa-triangle-exclamation',   // alias

      // Stars / badges
      'star': 'fa-star',
      'star-half': 'fa-star-half-stroke',
      'ranking-star': 'fa-ranking-star',
      'crown': 'fa-crown',
      'award': 'fa-award',
      'shield': 'fa-shield-halved',
      'fingerprint': 'fa-fingerprint',
      'flag': 'fa-flag',

      // Media
      'video': 'fa-video',
      'image': 'fa-image',
      'images': 'fa-images',
      'camera': 'fa-camera',
      'microphone': 'fa-microphone',
      'play': 'fa-play',
      'bolt': 'fa-bolt',

      // People / work
      'users': 'fa-users',
      'user': 'fa-user',
      'briefcase': 'fa-briefcase',
      'building': 'fa-building',
      'hand-wave': 'fa-hand',                 // hand-wave is Pro in FA6; fall back to fa-hand
      'stethoscope': 'fa-stethoscope',

      // Structure / nav
      'globe': 'fa-globe',
      'sitemap': 'fa-sitemap',
      'diagram-project': 'fa-diagram-project',
      'network-wired': 'fa-network-wired',
      'tree': 'fa-tree',
      'folder': 'fa-folder',
      'folder-open': 'fa-folder-open',
      'box-archive': 'fa-box-archive',
      'box-open': 'fa-box-open',
      'layer-group': 'fa-layer-group',
      'server': 'fa-server',
      'database': 'fa-database',

      // Links / navigation
      'link': 'fa-link',
      'link-simple': 'fa-link-simple',
      'link-slash': 'fa-link-slash',
      'compass': 'fa-compass',
      'bookmark': 'fa-bookmark',
      'bullseye': 'fa-bullseye',

      // Charts / data
      'chart-line': 'fa-chart-line',
      'chart-pie': 'fa-chart-pie',
      'chart-bar': 'fa-chart-bar',
      'signal': 'fa-signal',

      // Lists / tables / view
      'eye': 'fa-eye',
      'eye-slash': 'fa-eye-slash',
      'list': 'fa-list',
      'list-ol': 'fa-list-ol',
      'list-check': 'fa-list-check',
      'bars': 'fa-bars',
      'filter': 'fa-filter',
      'sort': 'fa-sort',
      'sliders': 'fa-sliders',

      // Science / experiments
      'flask': 'fa-flask',
      'key': 'fa-key',

      // Rockets / ships / send
      'rocket': 'fa-rocket',
      'rocket-launch': 'fa-rocket',           // FA Pro → fall back to fa-rocket
      'paper-plane': 'fa-paper-plane',
      'share-nodes': 'fa-share-nodes',

      // Tags / labels
      'tag': 'fa-tag',
      'tags': 'fa-tags',
      'palette': 'fa-palette',

      // Misc UI
      'gear': 'fa-gear',
      'download': 'fa-download',
      'upload': 'fa-upload',
      'grip-vertical': 'fa-grip-vertical',
      'ellipsis': 'fa-ellipsis',
      'ellipsis-vertical': 'fa-ellipsis-vertical',
      'spinner': 'fa-spinner fa-spin',
      'folder-tree': 'fa-folder-tree'
    };
    var faClass = icons[name];
    if (!faClass) {
      // Unknown — fall back to fa-<name> (often works because the name is
      // already the FA6 slug). Warn once per unknown name so we can fix it.
      if (!_iconWarned[name]) {
        _iconWarned[name] = true;
        if (typeof console !== 'undefined' && console.warn) console.warn('[WCP] Unknown icon name:', name);
      }
      faClass = 'fa-' + name;
    }
    return '<i class="fas ' + faClass + (className ? ' ' + className : '') + ' wcp-icon"></i>';
  }
