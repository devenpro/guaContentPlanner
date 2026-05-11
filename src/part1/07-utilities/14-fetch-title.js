  // --- Fetch page title from URL (client-side, best-effort) ---
  //
  // Works for same-origin URLs and any site that sends permissive CORS
  // headers. Most public sites do NOT, so many fetches will fail — the
  // batch helper reports how many succeeded / were blocked so users know
  // what happened.
  //
  // Future upgrade path: add a Drupal server-side endpoint that fetches
  // the HTML server-side (no CORS wall) and returns `{ title }`. Swap
  // fetchPageTitle() to call that endpoint instead.

  function fetchPageTitle(url) {
    return new Promise(function(resolve, reject) {
      if (!url) { reject(new Error('invalid-url')); return; }
      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function() { if (controller) controller.abort(); reject(new Error('timeout')); }, 12000);
      var fetchOpts = { method: 'GET', credentials: 'omit', mode: 'cors', redirect: 'follow' };
      if (controller) fetchOpts.signal = controller.signal;
      fetch(url, fetchOpts).then(function(res) {
        clearTimeout(timer);
        if (!res.ok) { reject(new Error('http-' + res.status)); return; }
        return res.text();
      }).then(function(html) {
        if (!html) { reject(new Error('empty')); return; }
        // Prefer <title>…</title>; fall back to og:title if present
        var m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        var title = m ? m[1] : '';
        if (!title) {
          var og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
          if (og) title = og[1];
        }
        title = _decodeHtmlEntities(title).trim();
        if (!title) { reject(new Error('no-title')); return; }
        resolve(title);
      }).catch(function(err) {
        clearTimeout(timer);
        // TypeError is the usual CORS-failure signature in modern browsers
        if (err && err.name === 'TypeError') reject(new Error('cors'));
        else if (err && err.name === 'AbortError') reject(new Error('timeout'));
        else reject(err);
      });
    });
  }

  // Batch helper — iterates sitemap pages missing a title, fetches in
  // parallel (capped), writes back via updateSitemapPage, reports counts.
  // Returns a Promise<{ fetched, blocked, failed, skipped }>.
  function fetchTitlesForSitemap(options) {
    options = options || {};
    var concurrency = options.concurrency || 5;
    var onProgress = options.onProgress || function() {};
    var sm = (S.data && S.data.sitemap) || { pages: [] };
    var candidates = (sm.pages || []).filter(function(p) {
      return p.status !== 'removed' && !p.title && !!p.url;
    });
    var total = candidates.length;
    var fetched = 0, blocked = 0, failed = 0;
    var done = 0;

    return new Promise(function(resolve) {
      if (!candidates.length) { resolve({ fetched: 0, blocked: 0, failed: 0, skipped: 0, total: 0 }); return; }
      var idx = 0;
      var active = 0;
      function next() {
        while (active < concurrency && idx < candidates.length) {
          var page = candidates[idx++];
          active++;
          fetchPageTitle(page.url).then(function(title) {
            if (typeof updateSitemapPage === 'function') updateSitemapPage(page.id, { title: title });
            fetched++;
          }).catch(function(err) {
            if (err && err.message === 'cors') blocked++;
            else failed++;
          }).then(function() {
            active--;
            done++;
            onProgress({ done: done, total: total, fetched: fetched, blocked: blocked, failed: failed });
            if (done === total) {
              resolve({ fetched: fetched, blocked: blocked, failed: failed, skipped: 0, total: total });
            } else {
              next();
            }
          });
        }
      }
      next();
    });
  }

  function _decodeHtmlEntities(s) {
    if (!s) return '';
    return String(s)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, function(_, n) { return String.fromCharCode(parseInt(n, 10)); })
      .replace(/&#x([0-9a-f]+);/gi, function(_, h) { return String.fromCharCode(parseInt(h, 16)); });
  }
