  // ============================================================
  // SECTION 7.9: WcpSelect — modern searchable dropdown
  // ============================================================
  //
  // Renders a rich select (icon + color dot + label + description) on top of
  // a hidden native <select.wcp-step-field>. The hidden select carries the
  // `data-path` contract, so the existing field-save handler in part2a's
  // `setupPart2aEventHandlers()` (see `.wcp-step-field` change handler in
  // src/part2a/15-events.js) keeps working unchanged — picking an option
  // syncs the hidden select's value and dispatches a native change event.
  //
  // Usage (from any renderer):
  //   html += _wcpSelect.render({
  //     name: 'content_type_id',
  //     dataPath: 'content_type_id',
  //     value: content.content_type_id,
  //     placeholder: 'Choose a content type…',
  //     searchable: true,
  //     items: types.map(function(t) {
  //       return { id: t.id, label: t.name, icon: t.icon, color: t.color, description: t.description };
  //     })
  //   });

  var WcpSelect = (function() {

    function _esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function _icon(name) {
      // Reuse the shared icon helper when available; fall back to empty string.
      try { return (typeof icon === 'function') ? icon(name) : ''; }
      catch (e) { return ''; }
    }

    function _findItem(items, value) {
      if (value == null) return null;
      for (var i = 0; i < items.length; i++) {
        if (String(items[i].id) === String(value)) return items[i];
      }
      return null;
    }

    function _triggerHTML(item, placeholder) {
      if (!item) {
        return '<span class="wcp-mselect-placeholder">' + _esc(placeholder || 'Select…') + '</span>';
      }
      var parts = '';
      if (item.color) {
        parts += '<span class="wcp-mselect-dot" style="background:' + _esc(item.color) + '"></span>';
      }
      if (item.icon) {
        parts += '<span class="wcp-mselect-icon">' + _icon(item.icon) + '</span>';
      }
      parts += '<span class="wcp-mselect-label">' + _esc(item.label || item.id) + '</span>';
      return parts;
    }

    function render(opts) {
      opts = opts || {};
      var items       = opts.items || [];
      var value       = opts.value == null ? '' : String(opts.value);
      var placeholder = opts.placeholder || 'Select…';
      var name        = opts.name || '';
      var dataPath    = opts.dataPath || '';
      var searchable  = opts.searchable !== false && items.length > 6;
      var disabled    = !!opts.disabled;
      var allowEmpty  = opts.allowEmpty !== false; // default: allow a "— none —" option
      var emptyLabel  = opts.emptyLabel || '— None —';
      var extraClass  = opts.extraClass || '';

      var selected = _findItem(items, value);

      var html = '';
      html += '<div class="wcp-mselect ' + _esc(extraClass) + (disabled ? ' wcp-mselect-disabled' : '') + '" ';
      html += 'data-wcp-mselect="1" ';
      html += 'data-name="' + _esc(name) + '" ';
      html += 'data-value="' + _esc(value) + '">';

      // Hidden native select — preserves the `.wcp-step-field` + `data-path`
      // contract so existing change handlers keep working. Users never see it.
      html += '<select class="wcp-mselect-native wcp-step-field" ';
      html += 'data-path="' + _esc(dataPath) + '" ';
      html += 'name="' + _esc(name) + '" ';
      html += 'tabindex="-1" aria-hidden="true"';
      html += (disabled ? ' disabled' : '') + '>';
      if (allowEmpty) {
        html += '<option value=""' + (value ? '' : ' selected') + '>' + _esc(emptyLabel) + '</option>';
      }
      for (var ni = 0; ni < items.length; ni++) {
        var it = items[ni];
        html += '<option value="' + _esc(it.id) + '"' + (String(it.id) === value ? ' selected' : '') + '>' + _esc(it.label || it.id) + '</option>';
      }
      html += '</select>';

      // Visible trigger
      html += '<button type="button" class="wcp-mselect-trigger" ';
      html += 'aria-haspopup="listbox" aria-expanded="false"' + (disabled ? ' disabled' : '') + '>';
      html += '<span class="wcp-mselect-trigger-content">' + _triggerHTML(selected, placeholder) + '</span>';
      html += '<span class="wcp-mselect-chevron">' + _icon('chevron-down') + '</span>';
      html += '</button>';

      // Panel
      html += '<div class="wcp-mselect-panel" hidden>';
      if (searchable) {
        html += '<div class="wcp-mselect-search-wrap">';
        html += _icon('search');
        html += '<input type="text" class="wcp-mselect-search" placeholder="Search…" aria-label="Search options">';
        html += '</div>';
      }
      html += '<ul class="wcp-mselect-options" role="listbox">';
      if (allowEmpty) {
        html += '<li class="wcp-mselect-option wcp-mselect-option-empty' + (value ? '' : ' wcp-mselect-option-active') + '" role="option" data-value="" tabindex="-1">';
        html += '<span class="wcp-mselect-option-label">' + _esc(emptyLabel) + '</span>';
        html += '</li>';
      }
      for (var oi = 0; oi < items.length; oi++) {
        var op = items[oi];
        var opId = String(op.id);
        var active = (opId === value);
        html += '<li class="wcp-mselect-option' + (active ? ' wcp-mselect-option-active' : '') + '" role="option" data-value="' + _esc(opId) + '" tabindex="-1">';
        if (op.color) html += '<span class="wcp-mselect-dot" style="background:' + _esc(op.color) + '"></span>';
        if (op.icon)  html += '<span class="wcp-mselect-icon">' + _icon(op.icon) + '</span>';
        html += '<span class="wcp-mselect-option-body">';
        html += '<span class="wcp-mselect-option-label">' + _esc(op.label || op.id) + '</span>';
        if (op.description) html += '<span class="wcp-mselect-option-desc">' + _esc(op.description) + '</span>';
        html += '</span>';
        if (active) html += '<span class="wcp-mselect-option-check">' + _icon('check') + '</span>';
        html += '</li>';
      }
      html += '</ul>';
      html += '<div class="wcp-mselect-empty" hidden>No matches</div>';
      html += '</div>'; // /panel

      html += '</div>'; // /wcp-mselect
      return html;
    }

    // ──────────── runtime behavior ────────────
    //
    // Delegation: all event wiring lives here so every render (re-render
    // rebuilds the DOM) stays hooked without per-instance setup.

    function _closeAll($except) {
      $('.wcp-mselect.wcp-mselect-open').each(function() {
        if ($except && $(this).is($except)) return;
        var $m = $(this);
        $m.removeClass('wcp-mselect-open');
        $m.find('.wcp-mselect-trigger').attr('aria-expanded', 'false');
        $m.find('.wcp-mselect-panel').prop('hidden', true);
      });
    }

    function _setValue($mselect, newValue, newLabel) {
      var $native = $mselect.find('.wcp-mselect-native');
      var currentValue = $native.val();
      if (String(currentValue) === String(newValue)) return false;
      $native.val(newValue);
      $mselect.attr('data-value', newValue);
      // Fire a native-equivalent change so `.wcp-step-field` change handler
      // picks it up exactly like a regular select.
      $native.trigger('change');
      return true;
    }

    function _filter($mselect, query) {
      query = (query || '').trim().toLowerCase();
      var $opts = $mselect.find('.wcp-mselect-option').not('.wcp-mselect-option-empty');
      var matched = 0;
      $opts.each(function() {
        var $opt = $(this);
        var label = ($opt.find('.wcp-mselect-option-label').text() || '').toLowerCase();
        var desc  = ($opt.find('.wcp-mselect-option-desc').text() || '').toLowerCase();
        var ok = !query || label.indexOf(query) !== -1 || desc.indexOf(query) !== -1;
        $opt.toggle(ok);
        if (ok) matched++;
      });
      $mselect.find('.wcp-mselect-option-empty').toggle(!query);
      $mselect.find('.wcp-mselect-empty').prop('hidden', matched > 0);
    }

    function setupEvents() {
      // Toggle open/close on trigger click
      $(document).off('click.wcp-msel-trigger').on('click.wcp-msel-trigger', '.wcp-mselect-trigger', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $m = $(this).closest('.wcp-mselect');
        if ($m.hasClass('wcp-mselect-disabled')) return;
        var willOpen = !$m.hasClass('wcp-mselect-open');
        _closeAll($m);
        if (willOpen) {
          $m.addClass('wcp-mselect-open');
          $(this).attr('aria-expanded', 'true');
          $m.find('.wcp-mselect-panel').prop('hidden', false);
          // Focus search if present
          var $search = $m.find('.wcp-mselect-search');
          if ($search.length) {
            $search.val('');
            _filter($m, '');
            setTimeout(function() { $search.trigger('focus'); }, 10);
          }
          // Ensure active option is in view
          var $active = $m.find('.wcp-mselect-option-active').first();
          if ($active.length) {
            var $opts = $m.find('.wcp-mselect-options');
            $opts.scrollTop(Math.max(0, $active.position().top - 40));
          }
        } else {
          $m.removeClass('wcp-mselect-open');
          $(this).attr('aria-expanded', 'false');
          $m.find('.wcp-mselect-panel').prop('hidden', true);
        }
      });

      // Option selection
      $(document).off('click.wcp-msel-opt').on('click.wcp-msel-opt', '.wcp-mselect-option', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $opt = $(this);
        if ($opt.is(':hidden')) return;
        var $m = $opt.closest('.wcp-mselect');
        var newValue = $opt.attr('data-value') || '';
        _setValue($m, newValue);
        _closeAll();
        // (The re-render triggered by the change handler will rebuild the
        // trigger label — no need to mutate it here.)
      });

      // Keyboard: arrow navigation + enter + escape inside search
      $(document).off('keydown.wcp-msel-kb').on('keydown.wcp-msel-kb', '.wcp-mselect-search, .wcp-mselect-options', function(e) {
        var $m = $(this).closest('.wcp-mselect');
        if (!$m.length) return;
        var $opts = $m.find('.wcp-mselect-option').filter(':visible');
        if (!$opts.length && e.key !== 'Escape') return;
        var $current = $opts.filter('.wcp-mselect-option-focus').first();
        var idx = $current.length ? $opts.index($current) : -1;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          idx = (idx + 1) % $opts.length;
          $opts.removeClass('wcp-mselect-option-focus');
          $opts.eq(idx).addClass('wcp-mselect-option-focus')[0].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          idx = idx <= 0 ? $opts.length - 1 : idx - 1;
          $opts.removeClass('wcp-mselect-option-focus');
          $opts.eq(idx).addClass('wcp-mselect-option-focus')[0].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          var $pick = $current.length ? $current : $opts.first();
          var newValue = $pick.attr('data-value') || '';
          _setValue($m, newValue);
          _closeAll();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          _closeAll();
          $m.find('.wcp-mselect-trigger').trigger('focus');
        }
      });

      // Search typing
      $(document).off('input.wcp-msel-s').on('input.wcp-msel-s', '.wcp-mselect-search', function() {
        var $m = $(this).closest('.wcp-mselect');
        _filter($m, $(this).val());
      });

      // Click outside → close
      $(document).off('click.wcp-msel-out').on('click.wcp-msel-out', function(e) {
        if ($(e.target).closest('.wcp-mselect').length) return;
        _closeAll();
      });

      // Hard-close on navigation / re-render
      $(document).off('wcp:beforeRender.wcp-msel').on('wcp:beforeRender.wcp-msel', _closeAll);
    }

    return { render: render, setupEvents: setupEvents };
  })();

  window._wcpSelect = WcpSelect;

