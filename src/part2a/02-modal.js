  // ============================================================
  // SECTION 2: MODAL SYSTEM
  // ============================================================

  var currentModal = null;

  function openModal(title, content, options) {
    options = options || {};
    closeModal();
    var size = options.size || 'md';
    var html = '<div class="wcp-modal-backdrop"><div class="wcp-modal wcp-modal-' + size + '">';
    html += '<div class="wcp-modal-header"><h3>' + esc(title) + '</h3>';
    html += '<button class="wcp-btn-icon wcp-modal-close" data-action="close-modal">' + icon('x') + '</button></div>';
    html += '<div class="wcp-modal-body">' + content + '</div>';
    if (options.footer !== false) {
      html += '<div class="wcp-modal-footer">';
      html += '<button class="wcp-btn wcp-btn-outline" data-action="close-modal">Cancel</button>';
      html += '<button class="wcp-btn ' + (options.danger ? 'wcp-btn-danger' : 'wcp-btn-primary') + '" data-action="modal-save">' + (options.saveLabel || 'Save') + '</button>';
      html += '</div>';
    }
    html += '</div></div>';
    $('body').append(html);
    currentModal = options;
    setTimeout(function() { $('.wcp-modal-backdrop').addClass('wcp-modal-visible'); }, 10);
  }

  function closeModal() {
    $('.wcp-modal-backdrop').remove();
    currentModal = null;
  }

  function openConfirmDialog(opts) {
    var html = '<div class="wcp-confirm-backdrop"><div class="wcp-confirm-dialog">';
    html += '<h3>' + esc(opts.title || 'Confirm') + '</h3>';
    html += '<p>' + esc(opts.message || 'Are you sure?') + '</p>';
    html += '<div class="wcp-confirm-actions">';
    html += '<button class="wcp-btn wcp-btn-outline" data-action="confirm-cancel">Cancel</button>';
    html += '<button class="wcp-btn ' + (opts.danger ? 'wcp-btn-danger' : 'wcp-btn-primary') + '" data-action="confirm-ok">' + esc(opts.confirmLabel || 'Confirm') + '</button>';
    html += '</div></div></div>';
    $('body').append(html);
    $(document).off('click.wcp2a-cok').on('click.wcp2a-cok', '[data-action="confirm-ok"]', function() {
      closeConfirmDialog();
      if (opts.onConfirm) opts.onConfirm();
    });
    $(document).off('click.wcp2a-ccn').on('click.wcp2a-ccn', '[data-action="confirm-cancel"]', function() {
      closeConfirmDialog();
    });
  }

  function closeConfirmDialog() {
    $('.wcp-confirm-backdrop').remove();
    $(document).off('click.wcp2a-cok click.wcp2a-ccn');
  }

  function collectModalFields() {
    var data = {};
    $('.wcp-modal-body [data-field]').each(function() {
      var $f = $(this);
      data[$f.data('field')] = $f.is(':checkbox') ? $f.is(':checked') : $f.val();
    });
    return data;
  }

