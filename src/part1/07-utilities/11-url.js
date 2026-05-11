  // --- URL normalization + path parsing ---
  //
  // canonicalizeUrl  — lowercases host, strips protocol optionally, drops
  //                    fragment + tracking params (utm_*, fbclid, gclid),
  //                    removes trailing slash (except root). Result is the
  //                    join key between content.published_url and
  //                    sitemap page records.
  //
  // pathSegments     — returns an array of non-empty path parts for tree
  //                    building. `/blog/seo/best-practices` -> ['blog','seo','best-practices'].

  function canonicalizeUrl(raw) {
    if (!raw) return '';
    var s = String(raw).trim();
    if (!s) return '';
    // Strip fragment
    var hashIdx = s.indexOf('#');
    if (hashIdx > -1) s = s.slice(0, hashIdx);
    // Split query
    var qIdx = s.indexOf('?');
    var base = qIdx > -1 ? s.slice(0, qIdx) : s;
    var query = qIdx > -1 ? s.slice(qIdx + 1) : '';
    // Lowercase host (everything up to first path slash after protocol)
    var protoMatch = base.match(/^(https?:\/\/)([^\/]+)(.*)$/i);
    if (protoMatch) {
      base = protoMatch[1].toLowerCase() + protoMatch[2].toLowerCase() + protoMatch[3];
    }
    // Strip tracking params
    if (query) {
      var kept = [];
      var parts = query.split('&');
      for (var i = 0; i < parts.length; i++) {
        var kv = parts[i];
        if (!kv) continue;
        var k = kv.split('=')[0].toLowerCase();
        if (k.indexOf('utm_') === 0) continue;
        if (k === 'fbclid' || k === 'gclid' || k === 'ref' || k === 'ref_src') continue;
        kept.push(kv);
      }
      query = kept.join('&');
    }
    // Trailing slash (keep for root-only urls like 'https://site.com/')
    if (base.length > 1 && base.charAt(base.length - 1) === '/') {
      // Only strip if there's actually a path beyond the domain
      var pathStart = base.indexOf('/', base.indexOf('://') + 3);
      if (pathStart > -1 && pathStart < base.length - 1) {
        base = base.replace(/\/+$/, '');
      }
    }
    return query ? (base + '?' + query) : base;
  }

  function pathSegments(url) {
    if (!url) return [];
    var s = String(url);
    // Drop protocol + host if present
    var protoMatch = s.match(/^https?:\/\/[^\/]+(.*)$/i);
    var path = protoMatch ? protoMatch[1] : s;
    // Drop query + fragment
    path = path.split('?')[0].split('#')[0];
    // Split and drop empty
    var parts = path.split('/');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i]) out.push(parts[i]);
    }
    return out;
  }

  function urlHost(url) {
    if (!url) return '';
    var m = String(url).match(/^https?:\/\/([^\/]+)/i);
    return m ? m[1].toLowerCase() : '';
  }

  function isValidUrl(raw) {
    if (!raw) return false;
    var s = String(raw).trim();
    // Accept http(s)://… or /relative-path forms
    if (/^https?:\/\/.+/i.test(s)) return true;
    if (s.charAt(0) === '/' && s.length > 1) return true;
    return false;
  }
