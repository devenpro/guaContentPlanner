  // ============================================================
  // SECTION 11: CRUD HELPERS
  // ============================================================

  function createHub(data) {
    var now = new Date().toISOString();
    var hub = {
      id: generateId('hub'), name: data.name || 'New Hub',
      description: data.description || '', color: data.color || '#2563eb',
      pillar_keyword: data.pillar_keyword || '', pillar_content_id: '',
      seo_goals: data.seo_goals || {}, created: now, updated: now
    };
    S.data.hubs = S.data.hubs || [];
    S.data.hubs.push(hub);
    logActivity('hub_created', hub.id, hub.name, 'Hub created');
    buildMaps(); syncToTextarea(); toast('Hub created: ' + hub.name, 'success');
    return hub;
  }

  function createCluster(data) {
    var now = new Date().toISOString();
    var cluster = {
      id: generateId('cl'), name: data.name || 'New Cluster',
      hub_id: data.hub_id || '', description: data.description || '',
      status: 'planned', keywords: data.keywords || [],
      content_ids: [], ai_suggestions: [],
      created: now, updated: now
    };
    S.data.clusters = S.data.clusters || [];
    S.data.clusters.push(cluster);
    logActivity('cluster_created', cluster.id, cluster.name, 'Cluster created in hub');
    buildMaps(); syncToTextarea(); toast('Cluster created: ' + cluster.name, 'success');
    return cluster;
  }

  function createContent(data) {
    var now = new Date().toISOString();
    var content = {
      id: generateId('cnt'), title: data.title || 'Untitled Content',
      hub_id: data.hub_id || '', cluster_id: data.cluster_id || '',
      content_type_id: data.content_type_id || '', template_id: data.template_id || '',
      status: 'info', priority: data.priority || 'medium',
      basic_info: { audience: '', goal: '', funnel_stage: '', word_count_target: 0, word_count_min: 0, word_count_max: 0, search_intent: '', serp_targets: [], content_depth: '', tone_of_voice: '', ctas: [] },
      research: { angles: [], selected_angle: '', competitor_analysis: '', uvp: '', eeat_plan: '', questions: [], faqs: [], entities: [], external_references: [] },
      keywords: { primary: { keyword: '', volume: 0, difficulty: '' }, secondary: [], lsi: [], conflicts: [] },
      headline: { headlines: [], selected_headline: '', title_tag: '', meta_description: '', ai_summary: '' },
      outline: { sections: [], approved: false },
      aeo_gseo: { schema_types: [], qa_blocks: [], citation_score: 0, ai_overview_score: 0, eeat_status: {}, seo_score: 0, gseo_score: 0, aeo_score: 0 },
      internal_links: [],
      export: { exported_at: '', cw_node_id: '', export_version: '', writing_instructions: '' },
      tags: data.tags || [],
      created: now, updated: now,
      created_by: S.user.id || '', assigned_to: ''
    };
    S.data.content = S.data.content || [];
    S.data.content.unshift(content);
    logActivity('content_created', content.id, content.title, 'Content created');
    buildMaps(); syncToTextarea();
    S.selectedContentId = content.id;
    S.currentStep = 'info';
    if (S.currentView !== 'content') navigate('content');
    else renderCurrentView();
    toast('Content created', 'success');
    return content;
  }

  function saveContentField(contentId, path, value) {
    var content = S.contentMap[contentId || S.selectedContentId];
    if (!content) return;
    // Support dot-notation paths like 'keywords.primary.keyword'
    var parts = path.split('.');
    var obj = content;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    content.updated = new Date().toISOString();
    buildMaps(); syncToTextarea(); renderCurrentView();
  }

  // ── SITEMAP CRUD ───────────────────────────────────────────
  //
  // Priority is a manual traffic/revenue/link-building judgement. Unset
  // pages default to P3 (baseline). The previous hub-pillar / cluster-main
  // auto-compute was removed — structural relationships don't capture
  // what's strategic for traffic & revenue.
  function effectivePriority(page) {
    if (!page) return 3;
    if (page.priority === 1 || page.priority === 2 || page.priority === 3) return page.priority;
    return 3;
  }

  function addSitemapPage(data) {
    if (!data || !data.url) return null;
    var url = canonicalizeUrl(data.url);
    if (!url) return null;
    S.data.sitemap = S.data.sitemap || { pages: [], groups: [], links: [] };
    var existing = S.sitemapPageByUrl[url];
    if (existing) {
      // Upsert — only overwrite fields the caller explicitly passed
      if (data.title) existing.title = data.title;
      if (data.meta_description) existing.meta_description = data.meta_description;
      if (data.keywords && data.keywords.length) existing.keywords = data.keywords;
      if (data.priority === 1 || data.priority === 2 || data.priority === 3) existing.priority = data.priority;
      if (data.source === 'published' || data.source === 'imported_csv' || data.source === 'imported_xml' || data.source === 'manual') existing.source = data.source;
      existing.status = 'live';
      existing.updated_at = new Date().toISOString();
      return existing;
    }
    var now = new Date().toISOString();
    var page = {
      id: generateId('sp'),
      url: url,
      title: data.title || '',
      path_segments: pathSegments(url),
      group_id: data.group_id || '',
      priority: (data.priority === 1 || data.priority === 2 || data.priority === 3) ? data.priority : null,
      content_id: data.content_id || '',
      source: data.source || 'manual',
      status: 'live',
      keywords: data.keywords || [],
      meta_description: data.meta_description || '',
      imported_at: now,
      updated_at: now
    };
    S.data.sitemap.pages.push(page);
    return page;
  }

  // Bulk import — O(n) diff by url → added / updated / removed.
  //
  // Dedupe rule: URL is the primary key. An incoming row with a URL that
  // matches an existing page is always an UPDATE (never a new record).
  //
  // Field-level upsert policy:
  //   - Metrics (clicks/impressions/ctr/position): always overwrite when
  //     the row provides them (fresh GSC data supersedes stale).
  //   - title / meta_description / keywords / priority / group: overwrite
  //     only when the row explicitly provides a non-empty value. Empty
  //     cells (common in GSC exports) preserve the existing value.
  //   - source: preserved when the row is metrics-only (e.g. GSC refresh on
  //     a page originally imported via XML sitemap). A structural row
  //     (has title) updates source to the current batch.
  //
  // `replaceMissing=true` marks pages from the SAME source that weren't in
  // this batch as status='removed' (soft delete). Skipped for metrics-only
  // batches — GSC can be partial and shouldn't flag real pages as removed.
  function importSitemapPages(parsed, options) {
    options = options || {};
    var source = options.source || 'imported_csv';
    var replaceMissing = options.replaceMissing === true;
    var isMetricsOnly = options.isMetricsOnly === true;
    S.data.sitemap = S.data.sitemap || { pages: [], groups: [], links: [] };

    var now = new Date().toISOString();
    var added = 0, updated = 0, removed = 0, metricsUpdated = 0;
    var touchedUrls = {};

    for (var i = 0; i < parsed.length; i++) {
      var row = parsed[i];
      if (!row || !row.url) continue;
      var cUrl = canonicalizeUrl(row.url);
      if (!cUrl) continue;
      touchedUrls[cUrl] = true;

      // Per-row metrics presence check (a batch can be mixed)
      var rowHasMetrics = (row.clicks !== null && row.clicks !== undefined) ||
                          (row.impressions !== null && row.impressions !== undefined) ||
                          (row.ctr !== null && row.ctr !== undefined) ||
                          (row.position !== null && row.position !== undefined);
      var rowHasStructural = !!(row.title || row.meta_description || (row.keywords && row.keywords.length) || row.priority);

      var existing = S.sitemapPageByUrl[cUrl];
      if (existing) {
        // Structural fields — only overwrite when row has something
        if (row.title) existing.title = row.title;
        if (row.meta_description) existing.meta_description = row.meta_description;
        if (row.keywords && row.keywords.length) existing.keywords = row.keywords;
        if (row.priority === 1 || row.priority === 2 || row.priority === 3) existing.priority = row.priority;
        // Metrics — always overwrite when provided
        if (row.clicks !== null && row.clicks !== undefined)           { existing.clicks = row.clicks; }
        if (row.impressions !== null && row.impressions !== undefined) { existing.impressions = row.impressions; }
        if (row.ctr !== null && row.ctr !== undefined)                 { existing.ctr = row.ctr; }
        if (row.position !== null && row.position !== undefined)       { existing.position = row.position; }
        if (rowHasMetrics) existing.metrics_updated_at = now;
        if (existing.status === 'removed') existing.status = 'live';
        // Source: only update for structural batches. Metrics-only (GSC)
        // shouldn't rename the originating source of a page.
        if (rowHasStructural) existing.source = source;
        existing.updated_at = now;
        if (rowHasStructural) updated++;
        else if (rowHasMetrics) metricsUpdated++;
        else updated++;
      } else {
        var page = {
          id: generateId('sp'),
          url: cUrl,
          title: row.title || '',
          path_segments: pathSegments(cUrl),
          group_id: '',
          priority: (row.priority === 1 || row.priority === 2 || row.priority === 3) ? row.priority : null,
          content_id: '',
          source: source,
          status: 'live',
          keywords: row.keywords || [],
          meta_description: row.meta_description || '',
          clicks: (row.clicks != null) ? row.clicks : 0,
          impressions: (row.impressions != null) ? row.impressions : 0,
          ctr: (row.ctr != null) ? row.ctr : 0,
          position: (row.position != null) ? row.position : 0,
          metrics_updated_at: rowHasMetrics ? now : '',
          notes: '',
          imported_at: now,
          updated_at: now
        };
        S.data.sitemap.pages.push(page);
        // Prime the lookup so a later row with the same URL in the same batch
        // hits the updated branch instead of adding a duplicate record.
        S.sitemapPageByUrl[cUrl] = page;
        added++;
      }
    }

    // Metrics-only batches never soft-delete — partial GSC data would
    // incorrectly flag unreported pages as removed.
    if (replaceMissing && !isMetricsOnly) {
      var pages = S.data.sitemap.pages;
      for (var p = 0; p < pages.length; p++) {
        var pg = pages[p];
        if (pg.source !== source) continue;
        if (pg.status === 'removed') continue;
        if (!touchedUrls[pg.url]) { pg.status = 'removed'; pg.updated_at = now; removed++; }
      }
    }

    var summary = added + ' added, ' + updated + ' updated';
    if (metricsUpdated) summary += ', ' + metricsUpdated + ' metrics refreshed';
    if (removed) summary += ', ' + removed + ' marked removed';
    logActivity('sitemap_imported', '', '', 'Imported ' + parsed.length + ' rows — ' + summary);
    buildMaps(); syncToTextarea();
    toast('Sitemap: ' + summary, 'success');
    return { added: added, updated: updated, removed: removed, metrics_updated: metricsUpdated };
  }

  // Dry-run diff for the preview step — does not mutate state.
  function previewSitemapImport(parsed, options) {
    options = options || {};
    var source = options.source || 'imported_csv';
    var replaceMissing = options.replaceMissing === true;
    var isMetricsOnly = options.isMetricsOnly === true;
    var added = 0, updated = 0, removed = 0, metricsUpdated = 0;
    var touchedUrls = {};
    for (var i = 0; i < parsed.length; i++) {
      var row = parsed[i];
      if (!row || !row.url) continue;
      var cUrl = canonicalizeUrl(row.url);
      if (!cUrl) continue;
      touchedUrls[cUrl] = true;
      var rowHasMetrics = (row.clicks != null) || (row.impressions != null) || (row.ctr != null) || (row.position != null);
      var rowHasStructural = !!(row.title || row.meta_description || (row.keywords && row.keywords.length) || row.priority);
      if (S.sitemapPageByUrl[cUrl]) {
        if (rowHasStructural) updated++;
        else if (rowHasMetrics) metricsUpdated++;
        else updated++;
      } else {
        added++;
      }
    }
    if (replaceMissing && !isMetricsOnly) {
      var pages = (S.data.sitemap && S.data.sitemap.pages) || [];
      for (var p = 0; p < pages.length; p++) {
        var pg = pages[p];
        if (pg.source !== source || pg.status === 'removed') continue;
        if (!touchedUrls[pg.url]) removed++;
      }
    }
    return { added: added, updated: updated, removed: removed, metrics_updated: metricsUpdated, total: parsed.length };
  }

  function updateSitemapPage(pageId, patch) {
    var page = S.sitemapPageMap[pageId];
    if (!page) return null;
    if (patch.url) {
      var newUrl = canonicalizeUrl(patch.url);
      if (newUrl) { page.url = newUrl; page.path_segments = pathSegments(newUrl); }
    }
    if (typeof patch.title === 'string') page.title = patch.title;
    if (typeof patch.meta_description === 'string') page.meta_description = patch.meta_description;
    if (typeof patch.notes === 'string') page.notes = patch.notes;
    if (patch.keywords) page.keywords = patch.keywords;
    if (patch.group_id !== undefined) page.group_id = patch.group_id;
    if (patch.priority === null || patch.priority === 1 || patch.priority === 2 || patch.priority === 3) page.priority = patch.priority;
    if (patch.status === 'live' || patch.status === 'removed') page.status = patch.status;
    // Hub binding (Phase 4) — primary hub, primary cluster, secondary tags.
    if (patch.hub_id !== undefined)     page.hub_id = patch.hub_id;
    if (patch.cluster_id !== undefined) page.cluster_id = patch.cluster_id;
    if (Array.isArray(patch.tag_hub_ids))     page.tag_hub_ids = patch.tag_hub_ids;
    if (Array.isArray(patch.tag_cluster_ids)) page.tag_cluster_ids = patch.tag_cluster_ids;
    page.updated_at = new Date().toISOString();
    logActivity('sitemap_page_updated', '', page.title || page.url, 'Page updated');
    buildMaps(); syncToTextarea();
    return page;
  }

  function setSitemapPagePriority(pageId, priority) {
    var page = S.sitemapPageMap[pageId];
    if (!page) return;
    page.priority = (priority === 1 || priority === 2 || priority === 3 || priority === null) ? priority : null;
    page.updated_at = new Date().toISOString();
    logActivity('sitemap_priority_changed', '', page.title || page.url, 'Priority → ' + (priority === null ? 'auto' : ('P' + priority)));
    buildMaps(); syncToTextarea();
  }

  function deleteSitemapPage(pageId) {
    var page = S.sitemapPageMap[pageId];
    if (!page) return;
    var pages = S.data.sitemap.pages || [];
    S.data.sitemap.pages = pages.filter(function(p) { return p.id !== pageId; });
    // Remove any links targeting this page
    S.data.sitemap.links = (S.data.sitemap.links || []).filter(function(l) { return l.to_page_id !== pageId; });
    logActivity('sitemap_page_removed', '', page.title || page.url, 'Page deleted');
    if (S.selectedSitemapPageId === pageId) S.selectedSitemapPageId = null;
    buildMaps(); syncToTextarea();
  }

  // ── SITEMAP GROUP CRUD ─────────────────────────────────────
  //
  // Manual user-defined groups — the authoritative way to organise pages.
  // Auto-derived grouping by URL path was removed because path structure
  // rarely matches the user's mental model (e.g. /2024/03/15/ date folders
  // produce noise, and /blog/* mixes unrelated topics). Groups are flat
  // (no parent/child) — users tag pages into labelled buckets.

  function createSitemapGroup(data) {
    if (!data || !data.name || !String(data.name).trim()) return null;
    S.data.sitemap = S.data.sitemap || { pages: [], groups: [], links: [] };
    var now = new Date().toISOString();
    var group = {
      id: generateId('sg'),
      name: String(data.name).trim(),
      color: data.color || '#6b7280',
      created: now,
      updated: now
    };
    S.data.sitemap.groups = S.data.sitemap.groups || [];
    S.data.sitemap.groups.push(group);
    buildMaps(); syncToTextarea();
    return group;
  }

  function updateSitemapGroup(groupId, patch) {
    var group = S.sitemapGroupMap[groupId];
    if (!group) return null;
    if (typeof patch.name === 'string' && patch.name.trim()) group.name = patch.name.trim();
    if (typeof patch.color === 'string') group.color = patch.color;
    group.updated = new Date().toISOString();
    buildMaps(); syncToTextarea();
    return group;
  }

  function deleteSitemapGroup(groupId) {
    S.data.sitemap = S.data.sitemap || { pages: [], groups: [], links: [] };
    // Unassign any page pointing at this group — pages stay, they just become ungrouped.
    var pages = S.data.sitemap.pages || [];
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].group_id === groupId) pages[i].group_id = '';
    }
    S.data.sitemap.groups = (S.data.sitemap.groups || []).filter(function(g) { return g.id !== groupId; });
    buildMaps(); syncToTextarea();
  }

  function setSitemapPageGroup(pageId, groupId) {
    var page = S.sitemapPageMap[pageId];
    if (!page) return;
    page.group_id = groupId || '';
    page.updated_at = new Date().toISOString();
    buildMaps(); syncToTextarea();
  }

  // ── LINK LEDGER CRUD ───────────────────────────────────────
  //
  // Links use a separate top-level array (S.data.sitemap.links) so we can
  // reverse-lookup inbound links per page cheaply. Only committed states
  // persist — suggestions live in memory until the user checks them.

  function getLinksForContent(contentId) {
    if (!contentId) return [];
    var out = [];
    var links = (S.data.sitemap && S.data.sitemap.links) || [];
    for (var i = 0; i < links.length; i++) {
      if (links[i].from_content_id === contentId) out.push(links[i]);
    }
    return out;
  }

  function createSitemapLink(data) {
    if (!data || !data.from_content_id || !data.to_page_id) return null;
    S.data.sitemap = S.data.sitemap || { pages: [], groups: [], links: [] };
    // Dedupe — one link from X to Y max (state='rejected' doesn't block; user
    // previously dismissed it, re-selecting flips it back).
    var links = S.data.sitemap.links;
    for (var i = 0; i < links.length; i++) {
      if (links[i].from_content_id === data.from_content_id && links[i].to_page_id === data.to_page_id) {
        if (links[i].state === 'rejected') {
          links[i].state = 'selected';
          links[i].selected_at = new Date().toISOString();
          if (data.anchor_text) links[i].anchor_text = data.anchor_text;
          if (data.reason) links[i].reason = data.reason;
          if (data.score !== undefined) links[i].score = data.score;
          if (data.source) links[i].source = data.source;
          logActivity('sitemap_link_selected', data.from_content_id, '', 'Re-selected link');
          buildMaps(); syncToTextarea();
          return links[i];
        }
        return links[i];  // idempotent
      }
    }
    var now = new Date().toISOString();
    var link = {
      id: generateId('sl'),
      from_content_id: data.from_content_id,
      to_page_id: data.to_page_id,
      anchor_text: data.anchor_text || '',
      reason: data.reason || '',
      score: data.score || 0,
      source: data.source || 'manual',
      state: 'selected',
      selected_at: now,
      exported_at: '',
      published_at: ''
    };
    links.push(link);
    logActivity('sitemap_link_selected', data.from_content_id, '', 'Link selected');
    buildMaps(); syncToTextarea();
    return link;
  }

  function updateSitemapLink(linkId, patch) {
    var links = (S.data.sitemap && S.data.sitemap.links) || [];
    for (var i = 0; i < links.length; i++) {
      if (links[i].id === linkId) {
        if (typeof patch.anchor_text === 'string') links[i].anchor_text = patch.anchor_text;
        if (typeof patch.reason === 'string') links[i].reason = patch.reason;
        if (patch.state && SITEMAP_LINK_STATES[patch.state]) {
          links[i].state = patch.state;
          var now = new Date().toISOString();
          if (patch.state === 'exported') links[i].exported_at = now;
          if (patch.state === 'published') links[i].published_at = now;
        }
        buildMaps(); syncToTextarea();
        return links[i];
      }
    }
    return null;
  }

  function deleteSitemapLink(linkId) {
    S.data.sitemap = S.data.sitemap || { pages: [], groups: [], links: [] };
    S.data.sitemap.links = (S.data.sitemap.links || []).filter(function(l) { return l.id !== linkId; });
    buildMaps(); syncToTextarea();
  }

  // Flip all 'selected' links on a content piece to 'exported'. Called
  // by the export step when the content is sent to the writer app.
  function flipContentLinksToExported(contentId) {
    var links = (S.data.sitemap && S.data.sitemap.links) || [];
    var now = new Date().toISOString();
    var n = 0;
    for (var i = 0; i < links.length; i++) {
      if (links[i].from_content_id === contentId && links[i].state === 'selected') {
        links[i].state = 'exported';
        links[i].exported_at = now;
        n++;
      }
    }
    if (n) { logActivity('sitemap_link_exported', contentId, '', n + ' link' + (n !== 1 ? 's' : '') + ' exported'); buildMaps(); }
    return n;
  }

  // Called when content.status transitions to 'published' — upserts the
  // sitemap page record from content.published_url and flips this content's
  // 'exported' ledger entries to 'published'.
  function onContentPublished(content) {
    if (!content || !content.published_url) return;
    var url = canonicalizeUrl(content.published_url);
    if (!url) return;
    S.data.sitemap = S.data.sitemap || { pages: [], groups: [], links: [] };
    var now = new Date().toISOString();
    var existing = S.sitemapPageByUrl[url];
    if (existing) {
      existing.content_id = content.id;
      existing.source = 'published';
      existing.title = existing.title || content.title || '';
      existing.status = 'live';
      existing.updated_at = now;
    } else {
      var page = {
        id: generateId('sp'),
        url: url,
        title: content.title || '',
        path_segments: pathSegments(url),
        group_id: '',
        priority: null,
        content_id: content.id,
        source: 'published',
        status: 'live',
        keywords: [],
        meta_description: '',
        imported_at: now,
        updated_at: now
      };
      S.data.sitemap.pages.push(page);
      logActivity('sitemap_page_added', '', page.title || page.url, 'Page added from published content');
    }
    // Flip exported → published on this content's outgoing links
    var links = S.data.sitemap.links || [];
    for (var li = 0; li < links.length; li++) {
      if (links[li].from_content_id === content.id && links[li].state === 'exported') {
        links[li].state = 'published';
        links[li].published_at = now;
      }
    }
    buildMaps();
  }

  // ─── Planned sitemap CRUD wrappers ────────────────────────────────────
  // Thin shims over the 18-planned-sitemap helpers that handle activity
  // logging + sync. Callers in the events layer use these so logging and
  // persistence stay consistent across UI / AI paths.

  function plannedCreateNode(hubId, parentId, fields) {
    var node = createPlannedNode(hubId, parentId, fields);
    if (!node) return null;
    var hub = S.hubMap[hubId];
    logActivity('sitemap_planned_node_added', node.id, node.label || '(untitled)', 'Added to "' + (hub ? hub.name : hubId) + '"');
    buildMaps(); syncToTextarea();
    return node;
  }

  function plannedUpdateNode(nodeId, patch) {
    var node = updatePlannedNode(nodeId, patch);
    if (!node) return null;
    logActivity('sitemap_planned_node_updated', node.id, node.label || '(untitled)', 'Node updated');
    buildMaps(); syncToTextarea();
    return node;
  }

  function plannedDeleteNode(nodeId) {
    var node = getPlannedNode(nodeId);
    if (!node) return false;
    var label = node.label || '(untitled)';
    var ids = deletePlannedNode(nodeId);
    if (!ids.length) return false;
    if (S.selectedPlannedNodeId && ids.indexOf(S.selectedPlannedNodeId) > -1) S.selectedPlannedNodeId = null;
    logActivity('sitemap_planned_node_removed', '', label, 'Removed ' + ids.length + ' node' + (ids.length === 1 ? '' : 's'));
    buildMaps(); syncToTextarea();
    return true;
  }

  function plannedMoveNode(nodeId, newParentId, beforeSiblingId) {
    // Move parent_id, then re-order within the flat nodes[] array so the
    // sibling order matches what the user dropped. beforeSiblingId is the
    // id of the sibling that should come AFTER the moved node; pass ''
    // (or omit) to append at the end of the new parent's children.
    var node = getPlannedNode(nodeId);
    if (!node) return false;
    var found = getPlannedTreeOfNode(nodeId);
    if (!found) return false;
    var tree = found.tree;
    // Apply parent change via helper (rejects cycles).
    var ok = movePlannedNode(nodeId, newParentId || '');
    if (!ok) return false;
    // Reorder within the flat array: pull out the node, then splice back.
    var pos = tree.nodes.indexOf(node);
    if (pos >= 0) tree.nodes.splice(pos, 1);
    if (beforeSiblingId) {
      var sibling = getPlannedNode(beforeSiblingId);
      if (sibling) {
        var insertAt = tree.nodes.indexOf(sibling);
        if (insertAt >= 0) {
          tree.nodes.splice(insertAt, 0, node);
        } else {
          tree.nodes.push(node);
        }
      } else {
        tree.nodes.push(node);
      }
    } else {
      tree.nodes.push(node);
    }
    logActivity('sitemap_planned_node_moved', node.id, node.label || '(untitled)', 'Node moved');
    buildMaps(); syncToTextarea();
    return true;
  }

