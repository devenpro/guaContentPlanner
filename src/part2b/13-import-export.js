  // ============================================================
  // SECTION 13: IMPORT/EXPORT
  // ============================================================

  function exportWorkspace() {
    var exportData = {
      app: 'wcp', version: '1.0',
      exported_at: new Date().toISOString(),
      data: deepClone(S.data),
      meta: deepClone(S.meta),
      activity: deepClone(S.activity)
    };
    var jsonStr = JSON.stringify(exportData, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'wcp-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Workspace exported', 'success');
    logActivity('workspace_exported', '', '', 'Workspace backup downloaded');
  }

  function importWorkspace() {
    var $file = $('#wcpImportFile');
    if (!$file.length) return;
    $file.off('change').on('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var imported = JSON.parse(ev.target.result);
          if (!imported.data || !imported.meta) throw new Error('Invalid WCP backup format');
          openConfirmDialog({
            title: 'Import Workspace',
            message: 'This will replace ALL current data with the imported backup. This cannot be undone. Continue?',
            confirmLabel: 'Import & Replace',
            danger: true,
            onConfirm: function() {
              snapshot('Before import');
              S.data = imported.data;
              S.meta = imported.meta;
              if (imported.activity) S.activity = imported.activity;
              buildMaps(); syncToTextarea(); render();
              toast('Workspace imported successfully', 'success');
              logActivity('workspace_imported', '', '', 'Workspace restored from backup');
            }
          });
        } catch(err) {
          toast('Import failed: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      $file.val('');
    });
    $file.trigger('click');
  }

