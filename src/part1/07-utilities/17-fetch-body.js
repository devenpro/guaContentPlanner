  // --- Fetch full page text from URL (client-side, best-effort) ---
  //
  // Used by the New Content Wizard's "Content refresh" mode. Tries a plain
  // fetch() and extracts readable text from the returned HTML. Most public
  // sites block this with CORS; in that case the caller surfaces a "paste
  // the article text here" fallback. Status codes:
  //
  //   'ok'       — fetched + parsed, body + title populated
  //   'cors'     — CORS-blocked (TypeError from fetch)
  //   'http-NNN' — non-2xx response
  //   'timeout'  — AbortController kicked at 15s
  //   'empty'    — response had no usable content
  //
  // Body is capped at ~8000 chars so the AI prompt stays inside token budget.

  function fetchPageBody(url) {
    return new Promise(function(resolve) {
      if (!url || !/^https?:\/\//i.test(url)) { resolve({ status: 'invalid-url', url: url, title: '', body: '' }); return; }
      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function() { if (controller) controller.abort(); }, 15000);
      var fetchOpts = { method: 'GET', credentials: 'omit', mode: 'cors', redirect: 'follow' };
      if (controller) fetchOpts.signal = controller.signal;

      fetch(url, fetchOpts).then(function(res) {
        clearTimeout(timer);
        if (!res.ok) { resolve({ status: 'http-' + res.status, url: url, title: '', body: '' }); return null; }
        return res.text();
      }).then(function(html) {
        if (html === null || html === undefined) return;
        if (!html) { resolve({ status: 'empty', url: url, title: '', body: '' }); return; }
        var parsed = _extractPageText(html);
        if (!parsed.body) { resolve({ status: 'empty', url: url, title: parsed.title, body: '' }); return; }
        resolve({ status: 'ok', url: url, title: parsed.title, body: parsed.body });
      }).catch(function(err) {
        clearTimeout(timer);
        var code = 'error';
        if (err && err.name === 'TypeError') code = 'cors';
        else if (err && err.name === 'AbortError') code = 'timeout';
        resolve({ status: code, url: url, title: '', body: '', error: err ? err.message : '' });
      });
    });
  }

  // Strip script/style/nav/header/footer, get readable text, clamp length.
  function _extractPageText(html) {
    var title = '';
    var m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (m) title = m[1];
    if (!title) {
      var og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      if (og) title = og[1];
    }
    title = _decodeHtmlEntities(title).trim();

    // Remove everything that isn't content text
    var cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
      .replace(/<form[\s\S]*?<\/form>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    cleaned = _decodeHtmlEntities(cleaned);

    // Clamp — keep enough for AI context without blowing the token budget.
    if (cleaned.length > 8000) cleaned = cleaned.substring(0, 8000) + '…';
    return { title: title, body: cleaned };
  }

  window._wcpFetchPageBody = fetchPageBody;
