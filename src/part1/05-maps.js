  // ============================================================
  // SECTION 5: MAP BUILDERS
  // ============================================================

  function buildMaps() {
    // Hubs
    S.hubMap = {}; S.totalHubs = 0;
    var hubs = S.data.hubs || [];
    for (var hi = 0; hi < hubs.length; hi++) { S.hubMap[hubs[hi].id] = hubs[hi]; S.totalHubs++; }

    // Clusters
    S.clusterMap = {}; S.totalClusters = 0;
    var clusters = S.data.clusters || [];
    for (var ci = 0; ci < clusters.length; ci++) { S.clusterMap[clusters[ci].id] = clusters[ci]; S.totalClusters++; }

    // Content
    S.contentMap = {}; S.statusCounts = {}; S.hubCounts = {};
    S.totalContent = 0; S.activeContent = 0; S.exportedContent = 0;
    S.publishedContent = 0; S.archivedContent = 0; S.rejectedContent = 0;
    S.totalGaps = 0;
    for (var st in CONTENT_STATUSES) S.statusCounts[st] = 0;

    var content = S.data.content || [];
    for (var coi = 0; coi < content.length; coi++) {
      var c = content[coi];
      S.contentMap[c.id] = c;
      S.statusCounts[c.status] = (S.statusCounts[c.status] || 0) + 1;
      S.hubCounts[c.hub_id] = (S.hubCounts[c.hub_id] || 0) + 1;
      S.totalContent++;
      if (ACTIVE_STATUSES.indexOf(c.status) > -1) S.activeContent++;
      if (c.status === 'exported')         S.exportedContent++;
      if (c.status === 'published')        S.publishedContent++;
      if (c.status === 'archived')         S.archivedContent++;
      if (c.status === 'rejected')         S.rejectedContent++;
    }

    // Content types
    S.contentTypeMap = {};
    var types = S.data.content_types || [];
    for (var ti = 0; ti < types.length; ti++) S.contentTypeMap[types[ti].id] = types[ti];

    // Templates
    S.templateMap = {};
    var templates = S.data.templates || [];
    for (var tmi = 0; tmi < templates.length; tmi++) S.templateMap[templates[tmi].id] = templates[tmi];

    // Tags
    S.tagMap = {};
    var tags = S.data.tags || [];
    for (var tgi = 0; tgi < tags.length; tgi++) S.tagMap[tags[tgi].id] = tags[tgi];

    // Research sessions
    S.researchSessionMap = {};
    var sessions = S.data.research_sessions || [];
    for (var si = 0; si < sessions.length; si++) S.researchSessionMap[sessions[si].id] = sessions[si];

    // Keyword groups
    S.keywordGroupMap = {}; S.totalKeywordGroups = 0;
    var kwGroups = S.data.keyword_groups || [];
    for (var kwgi = 0; kwgi < kwGroups.length; kwgi++) { S.keywordGroupMap[kwGroups[kwgi].id] = kwGroups[kwgi]; S.totalKeywordGroups++; }

    // Content Writer links — rebuild lookup maps from persisted S.data so
    // programmatic mutations (undo/redo, import, in-session create) stay
    // consistent. parseContentWriterList() primes the array at init; this
    // keeps the maps in sync on every buildMaps() pass.
    var cwLinks = S.data.content_writer_links || [];
    S.contentWriterItems = cwLinks.slice();
    S.contentWriterMap = {};
    for (var cwli = 0; cwli < cwLinks.length; cwli++) {
      if (cwLinks[cwli].planner_id) S.contentWriterMap[cwLinks[cwli].planner_id] = cwLinks[cwli];
    }

    // Image category map
    S.imageCategoryMap = {};
    var cats = (S.meta && S.meta.image_categories) || [];
    for (var cci = 0; cci < cats.length; cci++) S.imageCategoryMap[cats[cci].id] = cats[cci];

    // Sitemap maps — page by id + by canonical url, group by id.
    // sitemapLinksByTo / sitemapLinksByFrom are cached counts used to render
    // inbound/outbound pills in the sitemap view without re-scanning the
    // ledger on every keystroke.
    S.sitemapPageMap = {}; S.sitemapPageByUrl = {}; S.sitemapGroupMap = {};
    S.sitemapLinksByTo = {}; S.sitemapLinksByFrom = {};
    S.totalSitemapPages = 0;
    var sitemap = (S.data && S.data.sitemap) || { pages: [], groups: [], links: [] };
    var pages = sitemap.pages || [];
    for (var spi = 0; spi < pages.length; spi++) {
      var sp = pages[spi];
      S.sitemapPageMap[sp.id] = sp;
      if (sp.url) S.sitemapPageByUrl[sp.url] = sp;
      S.totalSitemapPages++;
    }
    var groups = sitemap.groups || [];
    for (var sgi = 0; sgi < groups.length; sgi++) S.sitemapGroupMap[groups[sgi].id] = groups[sgi];

    // Backlink from published content → sitemap page (URL match).
    // `content_id` on the page is the durable backlink; this loop keeps it
    // fresh so renames/re-imports don't orphan it.
    var contentArr = S.data.content || [];
    for (var cci2 = 0; cci2 < contentArr.length; cci2++) {
      var cp = contentArr[cci2];
      if (cp.published_url && S.sitemapPageByUrl[cp.published_url]) {
        S.sitemapPageByUrl[cp.published_url].content_id = cp.id;
      }
    }

    // Link-count index (only committed states persist)
    var links = sitemap.links || [];
    for (var sli = 0; sli < links.length; sli++) {
      var sl = links[sli];
      if (sl.state === 'rejected') continue;
      if (sl.to_page_id) {
        S.sitemapLinksByTo[sl.to_page_id] = S.sitemapLinksByTo[sl.to_page_id] || { selected: 0, exported: 0, published: 0 };
        S.sitemapLinksByTo[sl.to_page_id][sl.state] = (S.sitemapLinksByTo[sl.to_page_id][sl.state] || 0) + 1;
      }
      if (sl.from_content_id) {
        S.sitemapLinksByFrom[sl.from_content_id] = S.sitemapLinksByFrom[sl.from_content_id] || { selected: 0, exported: 0, published: 0 };
        S.sitemapLinksByFrom[sl.from_content_id][sl.state] = (S.sitemapLinksByFrom[sl.from_content_id][sl.state] || 0) + 1;
      }
    }
  }

