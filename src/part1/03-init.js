  // ============================================================
  // SECTION 3: INITIALIZATION
  // ============================================================

  function isWcpPage() { return $('body').hasClass('node--type-content-planner'); }

  Drupal.behaviors = Drupal.behaviors || {};
  Drupal.behaviors.wcpPart1 = {
    attach: function(context) {
      // On a later attach (Drupal AJAX, asynchronous module injection), the
      // app is already running — but a separate Drupal module may have just
      // injected the brand-data DOM we couldn't find on first init. Re-try
      // just the brand parse if we haven't locked it in yet.
      if (S.initialized) {
        if (!S.brand.configured && isWcpPage()) {
          try { parseBrandData(); } catch (e) { console.warn('[WCP] brand re-parse on attach failed:', e.message); }
        }
        return;
      }
      if (S._initializing) return;
      if (!isWcpPage()) return;
      if (!$(context).find('#edit-field-json-data-0-value').length && !$(context).find('#edit-field-json-meta-0-value').length && context !== document) return;
      init();
    }
  };

  function init() {
    if (S._initializing || S.initialized) return;
    S._initializing = true;
    console.log('[WCP] Initializing Part 1...');

    parseUserData();
    if (!detectDrupalForm()) {
      console.error('[WCP] Could not find Drupal form fields');
      S._initializing = false;
      return;
    }

    loadData();
    migrateMeta();
    migrateData();
    buildMaps();
    if (window._wcpLocation) window._wcpLocation.restore();
    renderApp();
    setupEventHandlers();
    startAutoSave();

    S.initialized = true;
    S._initializing = false;
    console.log('[WCP] Part 1 initialized — ' + S.totalHubs + ' hubs, ' + S.totalClusters + ' clusters, ' + S.totalContent + ' content, user: ' + (S.user.name || 'unknown'));

    // Timeout: if Part 2B hasn't loaded in 12s, show helpful messages
    setTimeout(function() {
      var R = window._wcpRenderers || {};
      if (!R.researchView || !R.settingsView || !R.imagesView) {
        S._part2bTimeout = true;
        var diag = 'Part2A=' + !!window._wcpPart2A + ', Part2AReady=' + !!S._part2aReady + ', Renderers=' + Object.keys(R).join(',');
        console.warn('[WCP] Part 2B not loaded after 12s — ' + diag);
        if (S.currentView === 'research' || S.currentView === 'settings' || S.currentView === 'images') renderCurrentView();
      }
    }, 12000);
  }

  function parseUserData() {
    var $ud = $('#guau-userdata');
    if (!$ud.length) { console.warn('[WCP] User data div not found'); return; }
    S.user = {
      id: ($ud.find('#guau-userid').text() || '').trim(),
      name: ($ud.find('#guau-username').text() || '').trim(),
      email: ($ud.find('#guau-useremail').text() || '').trim(),
      fullName: ($ud.find('#guau-userfullname').text() || '').trim(),
      timezone: ($ud.find('#guau-usertimezone').text() || '').trim(),
      roles: ($ud.find('#guau-userroles').text() || '').trim()
    };
    console.log('[WCP] User: ' + S.user.fullName + ' (' + S.user.name + ', id=' + S.user.id + ')');
  }

  function detectDrupalForm() {
    var $ta = $('#edit-field-json-data-0-value');
    var $metaTa = $('#edit-field-json-meta-0-value');
    var $actTa = $('#edit-field-activity-log-0-value');
    if (!$ta.length || !$metaTa.length || !$actTa.length) {
      console.error('[WCP] Missing fields: data=' + $ta.length + ' meta=' + $metaTa.length + ' activity=' + $actTa.length);
      return false;
    }
    S.$textarea = $ta; S.$metaTextarea = $metaTa; S.$activityTextarea = $actTa;
    S.$form = $ta.closest('form');
    S.$submitBtn = S.$form.find('#edit-submit, [data-drupal-selector="edit-submit"]').first();

    // Optional 4th textarea — sitemap data lives here to isolate its ~MB-scale
    // JSON from the 30s hot-path sync that fires on every content edit. If the
    // Drupal field isn't present yet, sitemap data falls back into field_json_data
    // and logs a warning (user needs to add field_sitemap_data to the content type).
    var $sitemapTa = $('#edit-field-sitemap-data-0-value');
    if ($sitemapTa.length) {
      S.$sitemapTextarea = $sitemapTa;
      $sitemapTa.closest('.field--name-field-sitemap-data').hide();
    } else {
      S.$sitemapTextarea = null;
      console.warn('[WCP] field_sitemap_data not found — sitemap will fall back to field_json_data (not recommended at scale)');
    }

    // Hide Drupal form fields
    S.$textarea.closest('.field--name-field-json-data').hide();
    S.$metaTextarea.closest('.field--name-field-json-meta').hide();
    S.$activityTextarea.closest('.field--name-field-activity-log').hide();
    S.$form.find('.node-form-options, .field--name-title, .form-actions').hide();

    // Detect image field
    S.$imageField = S.$form.find('.field--name-field-images');
    if (S.$imageField.length) {
      S.$imageField.hide();
      console.log('[WCP] Image field detected');
    } else {
      console.log('[WCP] No image field found (field_images)');
    }

    console.log('[WCP] Drupal form detected — data: ' + (S.$textarea.val() || '').length + ' chars, meta: ' + (S.$metaTextarea.val() || '').length + ' chars');
    return true;
  }

  function loadData() {
    // Parse field_json_data
    var rawData = S.$textarea.val();
    if (rawData && rawData.trim()) {
      try { S.data = JSON.parse(rawData); console.log('[WCP] Data parsed OK'); }
      catch (e) { console.error('[WCP] Data parse error:', e.message); S.data = getDefaultData(); }
    } else { S.data = getDefaultData(); console.log('[WCP] No existing data — using defaults'); }

    // Parse field_json_meta
    var rawMeta = S.$metaTextarea.val();
    if (rawMeta && rawMeta.trim()) {
      try { S.meta = JSON.parse(rawMeta); console.log('[WCP] Meta parsed OK'); }
      catch (e) { console.error('[WCP] Meta parse error:', e.message); S.meta = getDefaultMeta(); }
    } else { S.meta = getDefaultMeta(); console.log('[WCP] No existing meta — using defaults'); }

    // Parse field_activity_log
    var rawActivity = S.$activityTextarea.val();
    if (rawActivity && rawActivity.trim()) {
      try { S.activity = JSON.parse(rawActivity); console.log('[WCP] Activity parsed: ' + S.activity.length + ' entries'); }
      catch (e) { console.error('[WCP] Activity parse error:', e.message); S.activity = []; }
    } else { S.activity = []; }
    if (!Array.isArray(S.activity)) S.activity = [];

    // Parse field_sitemap_data (optional; scales independently of field_json_data)
    if (S.$sitemapTextarea) {
      var rawSitemap = S.$sitemapTextarea.val();
      if (rawSitemap && rawSitemap.trim()) {
        try {
          var smParsed = JSON.parse(rawSitemap);
          // This overrides any sitemap nested in S.data (fallback-path residue)
          S.data.sitemap = smParsed && typeof smParsed === 'object' ? smParsed : { pages: [], groups: [], links: [] };
          console.log('[WCP] Sitemap parsed: ' + ((S.data.sitemap.pages || []).length) + ' pages, ' + ((S.data.sitemap.links || []).length) + ' links');
        } catch (e) { console.error('[WCP] Sitemap parse error:', e.message); S.data.sitemap = { pages: [], groups: [], links: [] }; }
      }
    }

    // One-time auto-repair: if any stored strings got double-encoded
    // (UTF-8 bytes that were once read as cp1252 by the old build script
    // and re-saved), undo the corruption in place. No-op for clean data.
    if (window._wcpFixMojibake) {
      var fixed = 0;
      fixed += window._wcpFixMojibake.fixDeep(S.data);
      fixed += window._wcpFixMojibake.fixDeep(S.meta);
      fixed += window._wcpFixMojibake.fixDeep(S.activity);
      if (fixed > 0) {
        console.log('[WCP] Fixed mojibake in ' + fixed + ' strings');
        S.dirty = true; // auto-save will persist the cleaned data
      }
    }

    // Parse brand data from page DOM
    parseBrandData();

    // Parse images from Drupal field
    parseImageField();

    // Parse Content Writer list from page DOM
    parseContentWriterList();

    // Extract brand ID and node ID from page
    extractPageIds();
  }

  // Read brand data from the DOM. Returns the number of JSON sections that
  // parsed successfully. Zero = DOM absent or empty, caller should retry.
  // Split out so the Drupal re-attach path and the MutationObserver can
  // re-run the parse cheaply without re-running the whole init chain.
  function parseBrandDataFromDom() {
    var $wrap = $('.brand-data');
    if (!$wrap.length) return 0;

    var identity = {
      name: ($wrap.find('.brand-name').text() || '').trim(),
      id: ($wrap.find('.brand-id').text() || '').trim(),
      logoUrl: ($wrap.find('.brand-logo-url').text() || '').trim()
    };

    var sections = { core: '.brand-core-data', content: '.brand-content-data', seo: '.brand-seo-data' };
    var parsed = { core: null, content: null, seo: null };
    var parsedCount = 0;
    for (var key in sections) {
      var $div = $(sections[key]);
      if (!$div.length) continue;
      var text = $div.text().trim();
      if (!text) continue;
      try {
        parsed[key] = JSON.parse(text);
        parsedCount++;
      } catch (e) {
        console.error('[WCP] Brand ' + key + ' parse failed:', e.message);
      }
    }

    if (parsedCount === 0) return 0;

    // Commit to live state
    S.brand.identity = identity;
    S.brand.core     = parsed.core;
    S.brand.content  = parsed.content;
    S.brand.seo      = parsed.seo;
    S.brand.configured = true;

    // Persist to cache for next cold load
    if (S.meta) {
      S.meta.brand_cache = {
        identity: identity,
        core:     parsed.core,
        content:  parsed.content,
        seo:      parsed.seo,
        cachedAt: new Date().toISOString()
      };
      S.dirty = true; // auto-save picks up the cache refresh
    }

    console.log('[WCP] BrandService: ' + (identity.name || 'none') + ', sections: ' + parsedCount);
    return parsedCount;
  }

  // Seed S.brand from S.meta.brand_cache if it exists. Used on cold loads
  // so the UI has brand context immediately, even before the observer fires.
  function seedBrandFromCache() {
    if (!S.meta || !S.meta.brand_cache || !S.meta.brand_cache.cachedAt) return false;
    var bc = S.meta.brand_cache;
    // Cache only seeds when DOM parse hasn't already succeeded.
    if (S.brand.configured) return false;
    S.brand.identity = bc.identity || {};
    S.brand.core     = bc.core     || null;
    S.brand.content  = bc.content  || null;
    S.brand.seo      = bc.seo      || null;
    S.brand.configured = !!(bc.core || bc.content || bc.seo);
    if (S.brand.configured) {
      console.log('[WCP] Brand seeded from cache (' + bc.cachedAt + ')');
      return true;
    }
    return false;
  }

  // Watch for late brand-data DOM injection. Some Drupal modules attach
  // the .brand-data blocks asynchronously; without this the app thinks
  // brand isn't configured until the user refreshes the page.
  function watchForBrandData() {
    if (S._brandObserver || typeof MutationObserver === 'undefined') return;
    if (S.brand.configured && (S.meta && S.meta.brand_cache && S.meta.brand_cache.cachedAt)) {
      // DOM already parsed AND cache is fresh — nothing to watch for.
      return;
    }
    var attempts = 0;
    var maxAttempts = 60; // ~30s at ~500ms of wall clock; mutations are cheap
    S._brandObserver = new MutationObserver(function() {
      attempts++;
      if (parseBrandDataFromDom() > 0) {
        try { S._brandObserver.disconnect(); } catch (e) {}
        S._brandObserver = null;
        // Re-render the views that depend on brand context.
        if (typeof renderCurrentView === 'function' && S.initialized) {
          try { renderCurrentView(); } catch (e) { console.warn('[WCP] brand re-render failed:', e.message); }
        }
        return;
      }
      if (attempts >= maxAttempts) {
        try { S._brandObserver.disconnect(); } catch (e) {}
        S._brandObserver = null;
        console.warn('[WCP] Brand data never appeared in DOM after ' + attempts + ' mutations');
      }
    });
    S._brandObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Kept for backwards-compatibility with loadData() and any other callers.
  // Tries DOM first, seeds from cache as fallback, and starts the observer
  // if the DOM wasn't ready yet.
  function parseBrandData() {
    var got = parseBrandDataFromDom();
    if (got === 0) {
      var seeded = seedBrandFromCache();
      if (!seeded) console.log('[WCP] Brand data div not found on page — observer will retry');
    }
    watchForBrandData();
  }

  function parseImageField() {
    S.images = []; S.imageMap = {};
    if (!S.$imageField || !S.$imageField.length) return;
    var imgMeta = (S.meta && S.meta.reference_images) || {};

    S.$imageField.find('.image-widget, [data-drupal-selector*="edit-field-images"]').each(function(idx) {
      var $widget = $(this);
      var $img = $widget.find('.image-preview img, .image-style-thumbnail, img').first();
      var $fileLink = $widget.find('.file a, a[href*="/files/"]').first();
      var imgUrl = '';
      if ($img.length) imgUrl = $img.attr('src') || '';
      if (!imgUrl && $fileLink.length) imgUrl = $fileLink.attr('href') || '';
      if (!imgUrl) return;

      var fid = '';
      var $fidInput = $widget.find('input[name*="fids"], input[data-fid]');
      if ($fidInput.length) fid = $fidInput.data('fid') || $fidInput.val() || '';
      if (!fid) {
        var $anyInput = $widget.find('input[name*="field_images"]').first();
        if ($anyInput.length) {
          var match = $anyInput.attr('name').match(/field_images\[(\d+)\]/);
          if (match) fid = 'idx_' + match[1];
        }
      }
      if (!fid) fid = 'img_' + idx;

      var filename = '';
      if ($fileLink.length) filename = $fileLink.text().trim();
      if (!filename && imgUrl) filename = imgUrl.split('/').pop().split('?')[0];

      var meta = imgMeta[String(fid)] || {};
      S.images.push({
        fid: String(fid), url: imgUrl, filename: filename,
        alt: $img.attr('alt') || '', index: idx,
        category: meta.category || '', tags: meta.tags || [],
        star: !!meta.star, description: meta.description || '',
        notes: meta.notes || '', usage: meta.usage || []
      });
    });

    for (var i = 0; i < S.images.length; i++) S.imageMap[S.images[i].fid] = S.images[i];
    console.log('[WCP] Parsed ' + S.images.length + ' reference images');
  }

  // Merge Drupal view DOM `.content-production-item` entries with the persisted
  // list in S.data.content_writer_links. The view is treated as a *freshness
  // feed* only — we never delete a persisted record just because the view
  // failed to render. This fixes the "linked CW disappears after save/reload"
  // bug where Drupal views occasionally emit no markup on the first paint.
  function parseContentWriterList() {
    S.data = S.data || {};
    S.data.content_writer_links = S.data.content_writer_links || [];
    var stored = S.data.content_writer_links;
    var now = new Date().toISOString();
    var changed = false;

    // Index persisted records by planner_id for O(1) merge
    var byId = {};
    for (var si = 0; si < stored.length; si++) {
      if (stored[si].planner_id) byId[stored[si].planner_id] = stored[si];
    }

    var domCount = 0;
    $('.content-production-item').each(function() {
      domCount++;
      var $el = $(this);
      var incoming = {
        planner_id: ($el.data('planner-id') || '').toString(),
        cw_node_id: ($el.find('.cp-id').text() || '').trim(),
        title:      ($el.find('.cp-title').text() || '').trim(),
        url:        ($el.find('.cp-url').text() || '').trim(),
        status:     ($el.find('.cp-status').text() || '').trim(),
        created:    $el.find('.cp-created time').attr('datetime') || '',
        updated:    $el.find('.cp-updated time').attr('datetime') || '',
        director:   ($el.find('.cp-director').text() || '').trim()
      };
      if (!incoming.planner_id) return;

      var existing = byId[incoming.planner_id];
      if (existing) {
        // Update in place — only flip `changed` if a field actually differs
        var keys = ['cw_node_id','title','url','status','created','updated','director'];
        for (var k = 0; k < keys.length; k++) {
          if (incoming[keys[k]] && existing[keys[k]] !== incoming[keys[k]]) {
            existing[keys[k]] = incoming[keys[k]];
            changed = true;
          }
        }
        existing.last_seen = now;
      } else {
        incoming.last_seen = now;
        stored.push(incoming);
        byId[incoming.planner_id] = incoming;
        changed = true;
      }
    });

    // Rebuild the consumer maps from the merged stored array
    S.contentWriterItems = stored.slice();
    S.contentWriterMap = {};
    for (var mi = 0; mi < stored.length; mi++) {
      if (stored[mi].planner_id) S.contentWriterMap[stored[mi].planner_id] = stored[mi];
    }

    // Persist only if something actually changed — avoids dirtying the form
    // (and the Drupal unsaved-changes warning) on every page load.
    if (changed && typeof syncToTextarea === 'function') {
      try { syncToTextarea(); } catch (e) { /* pre-init race, safe to ignore */ }
    }

    console.log('[WCP] Content Writer items: ' + stored.length + ' persisted, ' + domCount + ' from DOM, changed=' + changed);
  }

  function extractPageIds() {
    // Brand ID from entity reference field
    var brandVal = $('#edit-field-brand-0-target-id').val() || '';
    var brandMatch = brandVal.match(/\((\d+)\)/);
    S.brandId = brandMatch ? brandMatch[1] : '';
    // Node ID from body class
    var bodyClass = $('body').attr('class') || '';
    var nodeMatch = bodyClass.match(/page-node-(\d+)/);
    S.nodeId = nodeMatch ? nodeMatch[1] : '';
    console.log('[WCP] Page IDs: brand=' + S.brandId + ', node=' + S.nodeId);
  }

