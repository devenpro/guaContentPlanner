  // ============================================================
  // SECTION 12: SYNC & SAVE
  // ============================================================

  function syncToTextarea() {
    if (!S.$textarea || !S.$metaTextarea || !S.$activityTextarea) return;
    try {
      // Split sitemap out of field_json_data when the dedicated textarea exists.
      // This isolates the potentially large sitemap blob from the 30s auto-save
      // path so a single content edit doesn't re-serialize 10K+ page records.
      if (S.$sitemapTextarea) {
        var sitemap = (S.data && S.data.sitemap) || { pages: [], groups: [], links: [] };
        S.$sitemapTextarea.val(JSON.stringify(sitemap, null, 2)).trigger('change');
        // Serialize S.data WITHOUT the sitemap key
        var dataNoSitemap = {};
        for (var k in S.data) { if (k !== 'sitemap') dataNoSitemap[k] = S.data[k]; }
        S.$textarea.val(JSON.stringify(dataNoSitemap, null, 2)).trigger('change');
      } else {
        // Fallback: sitemap rides inside field_json_data
        S.$textarea.val(JSON.stringify(S.data, null, 2)).trigger('change');
      }
      S.$metaTextarea.val(JSON.stringify(S.meta, null, 2)).trigger('change');
      S.$activityTextarea.val(JSON.stringify(S.activity, null, 2)).trigger('change');
      S.dirty = true;
      updateSaveStatus('unsaved');
    } catch (e) { console.error('[WCP] Sync error:', e); }
  }

  function updateSaveStatus(status) {
    var $s = $('#wcpSaveStatus');
    if (status === 'saving') $s.text('Saving...').removeClass('wcp-header-save-saved wcp-header-save-unsaved');
    else if (status === 'saved') { $s.text('Saved').removeClass('wcp-header-save-unsaved').addClass('wcp-header-save-saved'); S.dirty = false; }
    else $s.text('Unsaved').removeClass('wcp-header-save-saved').addClass('wcp-header-save-unsaved');
  }

  function logActivity(type, itemId, itemTitle, description) {
    S.activity = S.activity || [];
    S.activity.push({
      id: generateId('act'), type: type,
      content_id: itemId || '', content_title: itemTitle || '',
      hub_id: '', hub_name: '',
      description: description || '',
      timestamp: new Date().toISOString(),
      user_id: S.user.id || '', user_name: S.user.name || ''
    });
  }

  function startAutoSave() {
    if (S.autoSaveTimer) clearInterval(S.autoSaveTimer);
    S.autoSaveTimer = setInterval(function() { if (S.dirty) { syncToTextarea(); updateSaveStatus('saved'); } }, 30000);
  }

  $(window).on('beforeunload', function() { if (S.autoSaveTimer) clearInterval(S.autoSaveTimer); });

