  // ============================================================
  // SITEMAP IMPORT MODAL — paste CSV or XML, preview diff, commit
  // ============================================================
  //
  // Flow:
  //   1. User picks format (CSV / XML) and pastes content OR picks a file.
  //   2. "Preview" runs parse + dry-run diff → shows Added / Updated / Removed counts.
  //   3. "Import" commits. Source tag depends on format (imported_csv / imported_xml).

  function openSitemapImportModal() {
    var html = '<div class="wcp-sitemap-import">';
    html += '<div class="wcp-sitemap-import-format">';
    html += '<label class="wcp-radio"><input type="radio" name="sitemap-format" value="csv" checked> <span>CSV (recommended)</span></label>';
    html += '<label class="wcp-radio"><input type="radio" name="sitemap-format" value="xml"> <span>XML sitemap (paste)</span></label>';
    html += '</div>';

    html += '<div class="wcp-sitemap-import-help wcp-text-xs wcp-text-muted" id="wcpSitemapImportHelp">';
    html += 'Paste CSV with headers. Required: <code>url</code> (or <code>top pages</code>). Optional: <code>title</code>, <code>priority</code>, <code>group</code>, <code>meta_description</code>, <code>keywords</code>.<br>';
    html += '<strong>Google Search Console exports</strong> are supported — <code>Clicks</code>, <code>Impressions</code>, <code>CTR</code>, <code>Position</code> columns auto-import as page metrics. Existing pages are matched by URL; only metrics fields get overwritten.';
    html += '</div>';

    html += '<div class="wcp-form-group">';
    html += '<label>Paste contents</label>';
    html += '<textarea class="wcp-textarea" id="wcpSitemapImportPaste" rows="10" placeholder="url,title\nhttps://example.com/blog/seo,SEO Guide\n..." style="font-family:var(--wcp-font-mono);font-size:12px"></textarea>';
    html += '<div class="wcp-text-xs wcp-text-muted" style="margin-top:var(--wcp-space-1)">— or —</div>';
    html += '<input type="file" class="wcp-input wcp-input-sm" id="wcpSitemapImportFile" accept=".csv,.xml,.txt">';
    html += '</div>';

    html += '<label class="wcp-chk"><input type="checkbox" id="wcpSitemapImportReplace"> <span>Mark pages absent from this batch as removed (same source only)</span></label>';

    html += '<div id="wcpSitemapImportPreview" class="wcp-sitemap-import-preview" style="display:none"></div>';
    html += '</div>';

    openModal('Import Sitemap', html, {
      size: 'lg',
      saveLabel: 'Preview',
      onSave: function() {
        var $m = $('.wcp-modal-body');
        var format = $m.find('input[name="sitemap-format"]:checked').val() || 'csv';
        var text = $m.find('#wcpSitemapImportPaste').val() || '';
        if (!text.trim()) { toast('Paste CSV or XML content first', 'warning'); return; }
        var parseFn = (format === 'xml') ? window._wcpParseSitemapXML : window._wcpParseSitemapCSV;
        var parsed = parseFn(text);
        if (parsed.errors && parsed.errors.length) {
          toast(parsed.errors[0], 'warning');
        }
        if (!parsed.pages || !parsed.pages.length) {
          $m.find('#wcpSitemapImportPreview').show().html('<div class="wcp-text-sm" style="color:var(--wcp-error)">No valid rows found.</div>');
          return;
        }
        // GSC-style batch: metrics present, no title column → tag source
        // accordingly and treat it as a metrics refresh (no soft-delete on
        // missing pages, no title/source overwrite for existing records).
        var isMetricsOnly = (format !== 'xml') && !!parsed.has_metrics && !parsed.has_title;
        var sourceTag;
        if (format === 'xml') sourceTag = 'imported_xml';
        else if (isMetricsOnly) sourceTag = 'imported_gsc';
        else sourceTag = 'imported_csv';
        var replaceMissing = $m.find('#wcpSitemapImportReplace').is(':checked');
        var preview = window._wcpPreviewSitemapImport(parsed.pages, { source: sourceTag, replaceMissing: replaceMissing, isMetricsOnly: isMetricsOnly });
        _renderSitemapImportPreview($m, preview, parsed.pages, sourceTag, replaceMissing, isMetricsOnly);
      }
    });

    // Format switch updates the help text
    $(document).off('change.wcp-smi-fmt').on('change.wcp-smi-fmt', 'input[name="sitemap-format"]', function() {
      var $help = $('#wcpSitemapImportHelp');
      if (this.value === 'xml') {
        $help.html('Paste XML sitemap content (<code>&lt;urlset&gt;…</code>). Only <code>&lt;loc&gt;</code> and optional <code>&lt;title&gt;</code> are used.');
      } else {
        $help.html('Paste CSV with headers. Required: <code>url</code>. Optional: <code>title</code>, <code>priority</code>, <code>group</code>, <code>meta_description</code>, <code>keywords</code>.');
      }
    });

    // File picker — read file into the paste textarea (streaming not needed
    // for pasted files; a 10MB file loads fine here).
    $(document).off('change.wcp-smi-file').on('change.wcp-smi-file', '#wcpSitemapImportFile', function() {
      var f = this.files && this.files[0];
      if (!f) return;
      if (f.size > 50 * 1024 * 1024) { toast('File is larger than 50MB — paste it instead', 'warning'); return; }
      // Auto-detect format by filename
      if (/\.xml$/i.test(f.name)) {
        $('input[name="sitemap-format"][value="xml"]').prop('checked', true).trigger('change');
      } else if (/\.csv$/i.test(f.name)) {
        $('input[name="sitemap-format"][value="csv"]').prop('checked', true).trigger('change');
      }
      var reader = new FileReader();
      reader.onload = function(ev) {
        $('#wcpSitemapImportPaste').val(ev.target.result || '');
        toast('Loaded ' + f.name + ' (' + Math.round((f.size || 0) / 1024) + ' KB)', 'success');
      };
      reader.onerror = function() { toast('File read failed', 'error'); };
      reader.readAsText(f);
    });
  }

  function _renderSitemapImportPreview($m, preview, parsedPages, sourceTag, replaceMissing, isMetricsOnly) {
    var $p = $m.find('#wcpSitemapImportPreview');
    var html = '<div class="wcp-sitemap-import-preview-inner">';
    if (isMetricsOnly) {
      html += '<div class="wcp-sitemap-import-badge">' + icon('magnifying-glass-chart') + ' Detected Google Search Console export — treating as metrics refresh. Existing page titles / priorities / other fields will be preserved.</div>';
    }
    html += '<div class="wcp-sitemap-import-stats">';
    html += '<div class="wcp-sitemap-import-stat"><span class="wcp-sitemap-import-stat-num" style="color:var(--wcp-success)">+' + preview.added + '</span><span class="wcp-sitemap-import-stat-lbl">New</span></div>';
    html += '<div class="wcp-sitemap-import-stat"><span class="wcp-sitemap-import-stat-num" style="color:var(--wcp-primary)">' + preview.updated + '</span><span class="wcp-sitemap-import-stat-lbl">Updated</span></div>';
    if (preview.metrics_updated) {
      html += '<div class="wcp-sitemap-import-stat"><span class="wcp-sitemap-import-stat-num" style="color:var(--wcp-cluster)">' + preview.metrics_updated + '</span><span class="wcp-sitemap-import-stat-lbl">Metrics refreshed</span></div>';
    }
    if (replaceMissing && !isMetricsOnly) {
      html += '<div class="wcp-sitemap-import-stat"><span class="wcp-sitemap-import-stat-num" style="color:var(--wcp-error)">−' + preview.removed + '</span><span class="wcp-sitemap-import-stat-lbl">Removed</span></div>';
    }
    html += '<div class="wcp-sitemap-import-stat"><span class="wcp-sitemap-import-stat-num">' + preview.total + '</span><span class="wcp-sitemap-import-stat-lbl">Total rows</span></div>';
    html += '</div>';
    // First 5 URLs preview
    var sample = parsedPages.slice(0, 5);
    html += '<div class="wcp-text-xs wcp-text-muted" style="margin-top:var(--wcp-space-2)">Sample:</div>';
    html += '<ul class="wcp-sitemap-import-sample">';
    for (var i = 0; i < sample.length; i++) {
      html += '<li><span class="wcp-text-xs">' + esc(sample[i].url) + '</span>' + (sample[i].title ? ' <span class="wcp-text-xs wcp-text-muted">— ' + esc(sample[i].title) + '</span>' : '') + '</li>';
    }
    html += '</ul>';
    html += '<button class="wcp-btn wcp-btn-primary" id="wcpSitemapImportCommit">' + icon('check') + ' Commit import</button>';
    html += '</div>';
    $p.show().html(html);

    $(document).off('click.wcp-smi-commit').on('click.wcp-smi-commit', '#wcpSitemapImportCommit', function() {
      window._wcpImportSitemapPages(parsedPages, { source: sourceTag, replaceMissing: replaceMissing, isMetricsOnly: isMetricsOnly });
      closeModal();
      if (S.currentView === 'sitemap' && window._wcpRender) window._wcpRender();
    });
  }

  // Expose for the events handler (Part 1) without threading through
  // window._wcpRenderers — Part 2A loads right after Part 1 and can just
  // hang the function on window.
  window._wcpOpenSitemapImport = openSitemapImportModal;
