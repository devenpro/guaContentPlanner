  // --- Rule-based internal-link scoring ---
  //
  // scoreSitemapPagesForContent(content, options) -> [{ page, score, reasons[] }]
  //
  // The previous version relied heavily on the target page having a
  // `content_id` backlink to a planner content record — which is rare for
  // imported sitemaps (CSV / GSC / XML imports don't link to planner state).
  // The revamped scorer builds a **query token set** from the source content
  // (title + hub name + cluster name + keyword group + tags + content type)
  // and matches it against the page's full **surface** (title + URL path
  // segments + page keywords + group name). This gives useful matches even
  // for a pure-imported sitemap with no content_id backlinks.
  //
  // Scoring rules (per matched signal):
  //   same hub (via content_id backlink)           +40
  //   same cluster (via content_id backlink)       +30
  //   shared keyword group keyword match           +20 per hit  (cap 3)
  //   shared tag match                             +10 per hit  (cap 3)
  //   hub-name token hits page surface             +15 per hit  (cap 2)
  //   cluster-name token hits page surface         +12 per hit  (cap 2)
  //   title token overlap                           +3 per hit  (cap 5)
  //   path-segment token match (any content token) +8 per hit   (cap 3)
  //   priority boost                               P1 +10, P2 +5
  //
  // Disqualifications: self-link, removed pages, already in ledger (non-rejected).
  //
  // Returns top N (default 20), sorted by score desc.

  function scoreSitemapPagesForContent(content, options) {
    options = options || {};
    var topN = options.topN || 20;
    var minScore = options.minScore || 1;

    if (!content) return [];
    var sm = (S.data && S.data.sitemap) || { pages: [], links: [], groups: [] };
    var pages = sm.pages || [];
    var links = sm.links || [];

    // Exclude already-linked targets (non-rejected) and self
    var excluded = {};
    for (var li = 0; li < links.length; li++) {
      var l = links[li];
      if (l.from_content_id === content.id && l.state !== 'rejected') excluded[l.to_page_id] = true;
    }
    var selfUrl = content.published_url ? canonicalizeUrl(content.published_url) : '';
    var selfPageId = selfUrl && S.sitemapPageByUrl[selfUrl] ? S.sitemapPageByUrl[selfUrl].id : '';

    // ── Build the content's search surface (all tokens the scorer cares about)
    var contentTags = (content.tags || []).map(function(t) { return String(t).toLowerCase(); });
    var titleTokens = _tokenizeTerms(content.title || '');

    // Keyword-group primary + secondary keywords
    var contentKeywords = [];
    var groupsKw = (S.data && S.data.keyword_groups) || [];
    for (var gi = 0; gi < groupsKw.length; gi++) {
      if (groupsKw[gi].content_id === content.id) {
        var kws = groupsKw[gi].keywords || [];
        for (var kj = 0; kj < kws.length; kj++) {
          var kw = (kws[kj].keyword || '').toLowerCase().trim();
          if (kw) contentKeywords.push(kw);
        }
      }
    }

    // Hub + cluster name tokens (high-signal topical hints)
    var hub = content.hub_id ? S.hubMap[content.hub_id] : null;
    var cluster = content.cluster_id ? S.clusterMap[content.cluster_id] : null;
    var hubTokens = hub ? _tokenizeTerms(hub.name + ' ' + (hub.pillar_keyword || '')) : [];
    var clusterTokens = cluster ? _tokenizeTerms(cluster.name) : [];

    // Union "any-topic token" — used for path-segment matching (weakest but
    // broadest signal). Keywords first, then hub, cluster, then title words.
    var anyTokens = _uniqueLower(contentKeywords.concat(hubTokens).concat(clusterTokens).concat(titleTokens));

    var scored = [];
    for (var p = 0; p < pages.length; p++) {
      var page = pages[p];
      if (!page.url) continue;
      if (page.status === 'removed') continue;
      if (page.id === selfPageId) continue;
      if (excluded[page.id]) continue;
      if (page.content_id && page.content_id === content.id) continue;

      var score = 0;
      var reasons = [];

      // Build the page's surface: title tokens, path-segment tokens, keywords
      var pageTitleTokens = _tokenizeTerms(page.title || '');
      var pagePathTokens = _tokenizeSegments(page.path_segments || []);
      var pageKeywords = (page.keywords || []).map(function(k) { return String(k).toLowerCase().trim(); });
      var pageGroup = page.group_id ? S.sitemapGroupMap[page.group_id] : null;
      var pageGroupTokens = pageGroup ? _tokenizeTerms(pageGroup.name) : [];
      var pageAnyTokens = _uniqueLower(pageTitleTokens.concat(pagePathTokens).concat(pageKeywords).concat(pageGroupTokens));

      // ── Content-ID-backed signals (strongest, when available) ──
      var pageContent = page.content_id ? S.contentMap[page.content_id] : null;
      if (pageContent) {
        if (content.hub_id && pageContent.hub_id === content.hub_id) {
          score += 40; reasons.push('Same hub');
        }
        if (content.cluster_id && pageContent.cluster_id === content.cluster_id) {
          score += 30; reasons.push('Same cluster');
        }
        if (pageContent.tags && pageContent.tags.length) {
          var shared = 0;
          for (var t = 0; t < pageContent.tags.length && shared < 3; t++) {
            var pt = String(pageContent.tags[t]).toLowerCase();
            if (contentTags.indexOf(pt) > -1) shared++;
          }
          if (shared > 0) { score += shared * 10; reasons.push(shared + ' shared tag' + (shared > 1 ? 's' : '')); }
        }
      }

      // ── Keyword group ↔ page keywords (substring-tolerant match) ──
      if (contentKeywords.length && pageKeywords.length) {
        var kwMatches = 0;
        for (var ckw = 0; ckw < contentKeywords.length && kwMatches < 3; ckw++) {
          for (var pkw = 0; pkw < pageKeywords.length; pkw++) {
            if (contentKeywords[ckw] === pageKeywords[pkw] ||
                pageKeywords[pkw].indexOf(contentKeywords[ckw]) > -1 ||
                contentKeywords[ckw].indexOf(pageKeywords[pkw]) > -1) {
              kwMatches++;
              break;
            }
          }
        }
        if (kwMatches > 0) { score += kwMatches * 20; reasons.push(kwMatches + ' keyword match' + (kwMatches > 1 ? 'es' : '')); }
      }

      // ── Hub-name tokens hitting the page surface ──
      if (hubTokens.length && pageAnyTokens.length) {
        var hubHits = _tokenOverlap(hubTokens, pageAnyTokens, 2);
        if (hubHits > 0) { score += hubHits * 15; reasons.push('Hub "' + hub.name + '" topic'); }
      }

      // ── Cluster-name tokens hitting the page surface ──
      if (clusterTokens.length && pageAnyTokens.length) {
        var clHits = _tokenOverlap(clusterTokens, pageAnyTokens, 2);
        if (clHits > 0) { score += clHits * 12; reasons.push('Cluster "' + cluster.name + '" topic'); }
      }

      // ── Title-word overlap (weakest title signal, still useful) ──
      if (titleTokens.length && pageTitleTokens.length) {
        var titleHits = _tokenOverlap(titleTokens, pageTitleTokens, 5);
        if (titleHits > 0) { score += titleHits * 3; reasons.push(titleHits + ' title word' + (titleHits > 1 ? 's' : '') + ' in common'); }
      }

      // ── Path-segment match (content's any-tokens against page path segments) ──
      // Catches cases like content keyword "seo" matching page URL /blog/seo/...
      if (anyTokens.length && pagePathTokens.length) {
        var pathHits = _tokenOverlap(anyTokens, pagePathTokens, 3);
        if (pathHits > 0) { score += pathHits * 8; reasons.push('URL path matches topic'); }
      }

      // ── Priority boost — favour P1/P2 pages when relevance is otherwise equal ──
      var eff = effectivePriority(page);
      if (eff === 1)      { score += 10; reasons.push('P1 page'); }
      else if (eff === 2) { score += 5;  reasons.push('P2 page'); }

      if (score >= minScore) scored.push({ page: page, score: score, reasons: reasons });
    }

    scored.sort(function(a, b) { return b.score - a.score; });
    return scored.slice(0, topN);
  }

  // Diagnostic helper — tells the caller why scoring produced no matches.
  // Returns a short human-readable string. Exposed via window._wcpExplainNoLinks.
  function explainNoLinkCandidates(content) {
    if (!content) return 'No content selected.';
    var sm = (S.data && S.data.sitemap) || { pages: [] };
    var pages = (sm.pages || []).filter(function(p) { return p.status !== 'removed'; });
    if (!pages.length) return 'No sitemap pages yet — import your sitemap first.';
    var hub = content.hub_id ? S.hubMap[content.hub_id] : null;
    var cluster = content.cluster_id ? S.clusterMap[content.cluster_id] : null;
    var hasKw = false;
    var groupsKw = (S.data && S.data.keyword_groups) || [];
    for (var gi = 0; gi < groupsKw.length; gi++) {
      if (groupsKw[gi].content_id === content.id && (groupsKw[gi].keywords || []).length) { hasKw = true; break; }
    }
    var missing = [];
    if (!hub)      missing.push('a <strong>hub</strong>');
    if (!cluster)  missing.push('a <strong>cluster</strong>');
    if (!hasKw)    missing.push('a <strong>keyword group</strong> (from the Research view)');
    if (!content.title) missing.push('a <strong>title</strong>');
    if (missing.length === 0) return 'Your sitemap pages don\'t share topics with this content. Try enriching page titles/keywords or grouping pages by topic.';
    return 'Add ' + missing.join(' + ') + ' to this content so the engine has topical signal to match on.';
  }

  // ── Helpers ──

  function _tokenizeTerms(s) {
    if (!s) return [];
    var stops = { 'the':1,'a':1,'an':1,'and':1,'or':1,'of':1,'to':1,'for':1,'in':1,'on':1,'with':1,'at':1,'by':1,'is':1,'are':1,'how':1,'why':1,'what':1,'when':1,'your':1,'our':1,'you':1,'we':1,'from':1,'that':1,'this':1,'it':1,'as':1,'be':1,'has':1,'have':1,'do':1,'does':1 };
    var parts = String(s).toLowerCase().split(/[^a-z0-9]+/);
    var out = [];
    var seen = {};
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p || p.length < 3) continue;
      if (stops[p]) continue;
      if (seen[p]) continue;
      seen[p] = true;
      out.push(p);
    }
    return out;
  }

  // Path segments are typically 1-2 words joined with dashes ("best-seo-practices")
  // — split on dashes to extract individual terms, then apply the same stopword
  // + min-length filter as _tokenizeTerms.
  function _tokenizeSegments(segments) {
    if (!segments || !segments.length) return [];
    var joined = segments.join(' ').replace(/[-_]+/g, ' ');
    return _tokenizeTerms(joined);
  }

  function _uniqueLower(arr) {
    var seen = {}, out = [];
    for (var i = 0; i < arr.length; i++) {
      var v = String(arr[i] || '').toLowerCase().trim();
      if (!v) continue;
      if (seen[v]) continue;
      seen[v] = true;
      out.push(v);
    }
    return out;
  }

  function _tokenOverlap(a, b, cap) {
    var max = (typeof cap === 'number') ? cap : 10;
    var hits = 0;
    var bset = {};
    for (var j = 0; j < b.length; j++) bset[b[j]] = true;
    for (var i = 0; i < a.length && hits < max; i++) {
      if (bset[a[i]]) hits++;
    }
    return hits;
  }
