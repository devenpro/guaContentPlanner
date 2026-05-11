  // --- Sitemap parsers: CSV + XML ---
  //
  // Both parsers are designed for thousands of rows. They avoid building
  // DOM trees or loading entire files into intermediate strings when possible.
  //
  // parseSitemapCSV(text) -> { pages: [{url,title,priority,group,meta_description,keywords}], errors: [...] }
  //   - Detects headers from the first non-empty row (case-insensitive).
  //   - Required columns: url OR (any column containing 'url' or 'loc').
  //   - Optional: title, priority, group, parent_url, meta_description, keywords.
  //   - Supports quoted fields with embedded commas and escaped quotes ("").
  //
  // parseSitemapXML(text) -> { pages: [{url,title}], errors: [...] }
  //   - Regex-scans <loc>...</loc> instead of DOMParser (DOMParser chokes
  //     on 10+ MB XML and rejects malformed inputs). Optional <title> or
  //     <news:title> is picked up per-<url> block.

  function parseSitemapCSV(text) {
    var out = { pages: [], errors: [] };
    if (!text) return out;
    var rows = _splitCsvRows(text);
    if (!rows.length) return out;

    // Header detection — includes GSC ("Top pages", "Clicks", "Impressions",
    // "CTR", "Position") alongside generic CSV conventions. When a GSC-style
    // file is detected (metrics present, no title column), importer treats
    // each row as a metrics refresh instead of a structural update.
    var header = rows[0].map(function(h) { return String(h || '').trim().toLowerCase(); });
    var urlIdx = _findCol(header, ['url', 'loc', 'page url', 'page_url', 'address', 'link', 'top pages', 'pages']);
    var titleIdx = _findCol(header, ['title', 'page title', 'page_title', 'name']);
    var priorityIdx = _findCol(header, ['priority', 'tier']);
    var groupIdx = _findCol(header, ['group', 'category', 'section']);
    var metaIdx = _findCol(header, ['meta_description', 'meta description', 'description', 'meta']);
    var keywordsIdx = _findCol(header, ['keywords', 'tags', 'kws']);
    var clicksIdx = _findCol(header, ['clicks']);
    var impIdx = _findCol(header, ['impressions']);
    var ctrIdx = _findCol(header, ['ctr']);
    var posIdx = _findCol(header, ['position', 'average position', 'avg position']);

    if (urlIdx === -1) {
      out.errors.push('No URL column detected. Expected a header like "url", "loc", "page url", or "top pages".');
      return out;
    }

    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      if (!row || !row.length) continue;
      var url = String(row[urlIdx] || '').trim();
      if (!url) continue;
      var rec = {
        url: url,
        title: titleIdx > -1 ? String(row[titleIdx] || '').trim() : '',
        priority: priorityIdx > -1 ? _parsePriority(row[priorityIdx]) : null,
        group: groupIdx > -1 ? String(row[groupIdx] || '').trim() : '',
        meta_description: metaIdx > -1 ? String(row[metaIdx] || '').trim() : '',
        keywords: keywordsIdx > -1 ? _splitKeywords(row[keywordsIdx]) : [],
        clicks:      clicksIdx > -1 ? _parseMetricNumber(row[clicksIdx]) : null,
        impressions: impIdx    > -1 ? _parseMetricNumber(row[impIdx])    : null,
        ctr:         ctrIdx    > -1 ? _parsePercent(row[ctrIdx])         : null,
        position:    posIdx    > -1 ? _parseMetricNumber(row[posIdx])    : null
      };
      out.pages.push(rec);
    }
    // Attach a flag for downstream — tells the importer whether this batch
    // looks like a GSC metrics export vs a structural sitemap.
    out.has_metrics = (clicksIdx > -1 || impIdx > -1 || ctrIdx > -1 || posIdx > -1);
    out.has_title = (titleIdx > -1);
    return out;
  }

  function parseSitemapXML(text) {
    var out = { pages: [], errors: [] };
    if (!text) return out;
    // Fast scan: match each <url>...</url> block and pull <loc> + optional <title>.
    // Handles namespaces (<news:title>) and CDATA.
    var urlBlockRe = /<url\b[^>]*>([\s\S]*?)<\/url>/gi;
    var locRe = /<loc\b[^>]*>([\s\S]*?)<\/loc>/i;
    var titleRe = /<(?:[a-z0-9]+:)?title\b[^>]*>([\s\S]*?)<\/(?:[a-z0-9]+:)?title>/i;
    var match;
    var seen = {};
    while ((match = urlBlockRe.exec(text)) !== null) {
      var body = match[1];
      var lm = body.match(locRe);
      if (!lm) continue;
      var loc = _decodeXml(_stripCdata(lm[1])).trim();
      if (!loc) continue;
      if (seen[loc]) continue;
      seen[loc] = true;
      var tm = body.match(titleRe);
      var title = tm ? _decodeXml(_stripCdata(tm[1])).trim() : '';
      out.pages.push({ url: loc, title: title, priority: null, group: '', meta_description: '', keywords: [] });
    }
    // Fallback: if no <url> blocks found, try scanning bare <loc> (urlset-less dumps)
    if (out.pages.length === 0) {
      var locOnlyRe = /<loc\b[^>]*>([\s\S]*?)<\/loc>/gi;
      var lm2;
      while ((lm2 = locOnlyRe.exec(text)) !== null) {
        var u = _decodeXml(_stripCdata(lm2[1])).trim();
        if (!u || seen[u]) continue;
        seen[u] = true;
        out.pages.push({ url: u, title: '', priority: null, group: '', meta_description: '', keywords: [] });
      }
    }
    if (out.pages.length === 0) {
      out.errors.push('No <loc> URLs found. Make sure you pasted a valid XML sitemap.');
    }
    return out;
  }

  // --- Internal helpers ---

  // Split CSV into rows of cells, honoring quoted fields with commas and
  // escaped double-quotes. Tolerates \r\n and \n line breaks.
  function _splitCsvRows(text) {
    var rows = [];
    var row = [];
    var cell = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (inQuotes) {
        if (ch === '"') {
          if (text.charAt(i + 1) === '"') { cell += '"'; i++; }
          else { inQuotes = false; }
        } else {
          cell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(cell); cell = '';
        } else if (ch === '\r') {
          // swallow; \n handles row push
        } else if (ch === '\n') {
          row.push(cell); cell = '';
          if (row.length && !(row.length === 1 && row[0] === '')) rows.push(row);
          row = [];
        } else {
          cell += ch;
        }
      }
    }
    // Last cell/row
    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      if (!(row.length === 1 && row[0] === '')) rows.push(row);
    }
    return rows;
  }

  function _findCol(header, candidates) {
    for (var c = 0; c < candidates.length; c++) {
      for (var h = 0; h < header.length; h++) {
        if (header[h] === candidates[c]) return h;
      }
    }
    // Partial match (any header contains candidate as substring)
    for (var c2 = 0; c2 < candidates.length; c2++) {
      for (var h2 = 0; h2 < header.length; h2++) {
        if (header[h2].indexOf(candidates[c2]) > -1) return h2;
      }
    }
    return -1;
  }

  // "1,234" / "1234" / "" → number. Empty / non-numeric → null (caller can skip).
  function _parseMetricNumber(raw) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw).trim();
    if (!s) return null;
    s = s.replace(/,/g, '');  // strip thousands separators
    var n = parseFloat(s);
    if (isNaN(n)) return null;
    return n;
  }

  // "4.2%" / "4.2" → 4.2 (stored as percent, not decimal). GSC exports
  // "0.00%" for zero-CTR rows; returns 0 for those.
  function _parsePercent(raw) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw).trim();
    if (!s) return null;
    s = s.replace(/%/g, '').replace(/,/g, '');
    var n = parseFloat(s);
    if (isNaN(n)) return null;
    return n;
  }

  function _parsePriority(raw) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw).trim().toLowerCase();
    if (!s) return null;
    // Accept '1', '2', '3', 'p1', 'p2', 'p3', 'high', 'medium', 'low'
    if (s === '1' || s === 'p1' || s === 'high' || s === 'pillar') return 1;
    if (s === '2' || s === 'p2' || s === 'medium' || s === 'cluster') return 2;
    if (s === '3' || s === 'p3' || s === 'low' || s === 'standard') return 3;
    var n = parseInt(s, 10);
    if (n >= 1 && n <= 3) return n;
    return null;
  }

  function _splitKeywords(raw) {
    if (!raw) return [];
    var s = String(raw).trim();
    if (!s) return [];
    // Split on | ; or , — whichever appears first
    var sep = (s.indexOf('|') > -1) ? '|' : (s.indexOf(';') > -1) ? ';' : ',';
    var parts = s.split(sep);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var k = parts[i].trim();
      if (k) out.push(k);
    }
    return out;
  }

  function _stripCdata(s) {
    if (!s) return '';
    var m = s.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
    return m ? m[1] : s;
  }

  function _decodeXml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, function(_, n) { return String.fromCharCode(parseInt(n, 10)); });
  }
