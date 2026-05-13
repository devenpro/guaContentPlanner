  // ============================================================
  // SECTION 10: EVENT HANDLERS
  // ============================================================

  function setupEventHandlers() {
    // WcpSelect (modern searchable dropdown) — delegated open/close/select
    if (window._wcpSelect && typeof window._wcpSelect.setupEvents === 'function') {
      window._wcpSelect.setupEvents();
    }

    // Detail-body scroll → toggle .is-scrolled for sticky header shadow.
    // Delegated via window event because `.wcp-detail-body` is replaced on
    // every render; we query fresh each scroll event.
    $(document).off('scroll.wcp-detail', '.wcp-detail-body').on('scroll.wcp-detail', '.wcp-detail-body', function() {
      var scrolled = this.scrollTop > 4;
      if (scrolled !== this._wcpIsScrolled) {
        this._wcpIsScrolled = scrolled;
        $(this).toggleClass('is-scrolled', scrolled);
      }
    });

    // Navigation
    $(document).off('click.wcp-nav').on('click.wcp-nav', '.wcp-nav-item', function(e) {
      e.preventDefault();
      var view = $(this).data('view');
      if (view) navigate(view);
    });

    // Sidebar toggle — viewport-aware per docs/05-app-layout-system.md §4.5.
    // On wide viewports (>992px) the sidebar lives in flow and the toggle
    // collapses it to 56px. On narrow viewports it leaves the flow and the
    // toggle opens/closes it as a drawer with a backdrop.
    function _toggleSidebar() {
      var $sidebar = $('#wcpSidebar');
      if (window.innerWidth <= 992) {
        var nowOpen = !$sidebar.hasClass('wcp-sidebar-open');
        $sidebar.toggleClass('wcp-sidebar-open', nowOpen);
        if (nowOpen) {
          if (!$('#wcpSidebarOverlay').length) {
            $('<div id="wcpSidebarOverlay" class="wcp-sidebar-overlay"></div>').appendTo('#wcpApp');
          }
        } else {
          $('#wcpSidebarOverlay').remove();
        }
      } else {
        S.sidebarCollapsed = !S.sidebarCollapsed;
        $sidebar.toggleClass('wcp-sidebar-collapsed', S.sidebarCollapsed);
      }
    }
    $(document).off('click.wcp-sidebar-toggle').on('click.wcp-sidebar-toggle', '#wcpSidebarToggle', _toggleSidebar);
    $(document).off('click.wcp-sidebar-brand').on('click.wcp-sidebar-brand', '#wcpSidebarBrand', _toggleSidebar);
    $(document).off('click.wcp-sidebar-overlay').on('click.wcp-sidebar-overlay', '#wcpSidebarOverlay', function() {
      $('#wcpSidebar').removeClass('wcp-sidebar-open');
      $(this).remove();
    });
    // Reset mobile drawer state if the user grows the viewport back past the
    // breakpoint while the drawer is open, so the inline-flow sidebar doesn't
    // get stuck with stale classes.
    $(window).off('resize.wcp-sidebar').on('resize.wcp-sidebar', function() {
      if (window.innerWidth > 992) {
        $('#wcpSidebar').removeClass('wcp-sidebar-open');
        $('#wcpSidebarOverlay').remove();
      }
    });

    // Save button
    $(document).off('click.wcp-save').on('click.wcp-save', '#wcpSaveNodeBtn', function() {
      syncToTextarea();
      updateSaveStatus('saving');
      S.$submitBtn.click();
    });

    // Toast close
    $(document).off('click.wcp-toast').on('click.wcp-toast', '.wcp-toast-close', function() {
      $(this).closest('.wcp-toast').removeClass('wcp-toast-show');
      var $t = $(this).closest('.wcp-toast');
      setTimeout(function() { $t.remove(); }, 300);
    });

    // Go to view (generic)
    $(document).off('click.wcp-go-view').on('click.wcp-go-view', '[data-action="go-view"]', function(e) {
      e.preventDefault();
      var view = $(this).data('view');
      if (view) navigate(view);
    });

    // Hub detail navigation
    $(document).off('click.wcp-go-hub').on('click.wcp-go-hub', '[data-action="go-hub-detail"]', function(e) {
      e.preventDefault();
      var hubId = $(this).data('id');
      if (hubId) { S.selectedHubId = hubId; navigate('hubs'); }
    });

    // Select hub in split-pane (update detail pane only)
    $(document).off('click.wcp-select-hub').on('click.wcp-select-hub', '[data-action="select-hub"]', function(e) {
      e.preventDefault();
      var hubId = $(this).data('id');
      S.selectedHubId = hubId;
      $('.wcp-list-item[data-action="select-hub"]').removeClass('wcp-list-item-active');
      $(this).addClass('wcp-list-item-active');
      $('#wcpHubDetailPane').html(renderHubDetailPane());
      if (window._wcpLocation) window._wcpLocation.capture();
    });

    // Select template in split-pane
    $(document).off('click.wcp-select-tpl').on('click.wcp-select-tpl', '[data-action="select-template"]', function(e) {
      e.preventDefault();
      S.selectedTemplateId = $(this).data('id');
      $('.wcp-list-item[data-action="select-template"]').removeClass('wcp-list-item-active');
      $(this).addClass('wcp-list-item-active');
      $('#wcpTemplateDetailPane').html(renderTemplateDetailPaneFallback());
      if (window._wcpLocation) window._wcpLocation.capture();
    });

    // Create hub (from dashboard)
    $(document).off('click.wcp-create-hub').on('click.wcp-create-hub', '[data-action="create-hub"]', function() {
      // Prompt-based fallback — overridden by Part 2A modal when loaded
      var name = prompt('Hub name:');
      if (!name || !name.trim()) return;
      var colorIdx = (S.data.hubs || []).length % HUB_COLORS.length;
      createHub({ name: name.trim(), color: HUB_COLORS[colorIdx].color });
      renderCurrentView();
    });

    // Edit hub
    $(document).off('click.wcp-edit-hub').on('click.wcp-edit-hub', '[data-action="edit-hub"]', function(e) {
      e.stopPropagation();
      var hubId = $(this).data('id');
      var hub = S.hubMap[hubId]; if (!hub) return;
      var newName = prompt('Hub name:', hub.name);
      if (newName === null || !newName.trim()) return;
      hub.name = newName.trim();
      hub.updated = new Date().toISOString();
      logActivity('hub_updated', hub.id, hub.name, 'Hub renamed');
      buildMaps(); syncToTextarea(); renderCurrentView();
      toast('Hub updated', 'success');
    });

    // Delete hub
    $(document).off('click.wcp-delete-hub').on('click.wcp-delete-hub', '[data-action="delete-hub"]', function(e) {
      e.stopPropagation();
      var hubId = $(this).data('id');
      var hub = S.hubMap[hubId]; if (!hub) return;
      var hubClusters = getHubClusters(hubId);
      var hubContent = getHubContent(hubId);
      var msg = 'Delete hub "' + hub.name + '"?';
      if (hubClusters.length > 0 || hubContent.length > 0) {
        msg += '\n\nThis hub has ' + hubClusters.length + ' cluster(s) and ' + hubContent.length + ' content piece(s). They will be unlinked (not deleted).';
      }
      if (!confirm(msg)) return;
      // Unlink clusters and content
      for (var ci = 0; ci < hubClusters.length; ci++) hubClusters[ci].hub_id = '';
      for (var coi = 0; coi < hubContent.length; coi++) hubContent[coi].hub_id = '';
      S.data.hubs = (S.data.hubs || []).filter(function(h) { return h.id !== hubId; });
      logActivity('hub_deleted', hubId, hub.name, 'Hub deleted');
      if (S.selectedHubId === hubId) { S.selectedHubId = null; if (S.currentView === 'hub-detail') navigate('hubs'); }
      buildMaps(); syncToTextarea(); renderCurrentView();
      toast('Hub deleted', 'success');
    });

    // Collapsible sections toggle
    $(document).off('click.wcp-collapsible').on('click.wcp-collapsible', '[data-action="toggle-collapsible"]', function() {
      var $section = $(this).closest('.wcp-collapsible-section');
      var $body = $section.find('.wcp-collapsible-body');
      var $chevron = $(this).find('.wcp-collapsible-chevron');
      $body.slideToggle(200);
      $section.toggleClass('wcp-collapsible-open');
    });

    // Quick-add cluster (inline)
    $(document).off('click.wcp-quick-cluster').on('click.wcp-quick-cluster', '[data-action="quick-add-cluster"]', function() {
      var hubId = $(this).data('hub') || S.selectedHubId;
      if (!hubId) { toast('Select a hub first', 'warning'); return; }
      var $input = $('#wcpQuickCluster');
      var name = ($input.val() || '').trim();
      if (!name) { toast('Enter a cluster name', 'warning'); $input.focus(); return; }
      createCluster({ name: name, hub_id: hubId });
      renderCurrentView();
    });
    // Quick-add cluster on Enter key
    $(document).off('keydown.wcp-quick-cluster-enter').on('keydown.wcp-quick-cluster-enter', '#wcpQuickCluster', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        $(this).closest('.wcp-hub-quick-add').find('[data-action="quick-add-cluster"]').trigger('click');
      }
    });

    // Create cluster (modal fallback)
    $(document).off('click.wcp-create-cluster').on('click.wcp-create-cluster', '[data-action="create-cluster"]', function() {
      var hubId = $(this).data('hub') || S.selectedHubId;
      if (!hubId) { toast('Select a hub first', 'warning'); return; }
      var name = prompt('Cluster name:');
      if (!name || !name.trim()) return;
      createCluster({ name: name.trim(), hub_id: hubId });
      renderCurrentView();
    });

    // Edit cluster
    $(document).off('click.wcp-edit-cluster').on('click.wcp-edit-cluster', '[data-action="edit-cluster"]', function(e) {
      e.stopPropagation();
      var clId = $(this).data('id');
      var cl = S.clusterMap[clId]; if (!cl) return;
      var newName = prompt('Cluster name:', cl.name);
      if (newName === null || !newName.trim()) return;
      cl.name = newName.trim();
      cl.updated = new Date().toISOString();
      logActivity('cluster_updated', cl.id, cl.name, 'Cluster renamed');
      buildMaps(); syncToTextarea(); renderCurrentView();
      toast('Cluster updated', 'success');
    });

    // Delete cluster
    $(document).off('click.wcp-delete-cluster').on('click.wcp-delete-cluster', '[data-action="delete-cluster"]', function(e) {
      e.stopPropagation();
      var clId = $(this).data('id');
      var cl = S.clusterMap[clId]; if (!cl) return;
      if (!confirm('Delete cluster "' + cl.name + '"? Content linked to this cluster will be unlinked.')) return;
      // Unlink content
      var linkedContent = getClusterContent(clId);
      for (var lci = 0; lci < linkedContent.length; lci++) linkedContent[lci].cluster_id = '';
      S.data.clusters = (S.data.clusters || []).filter(function(c) { return c.id !== clId; });
      logActivity('cluster_deleted', clId, cl.name, 'Cluster deleted');
      buildMaps(); syncToTextarea(); renderCurrentView();
      toast('Cluster deleted', 'success');
    });

    // Create pillar content
    $(document).off('click.wcp-create-pillar').on('click.wcp-create-pillar', '[data-action="create-pillar"]', function() {
      var hubId = $(this).data('hub') || S.selectedHubId;
      var hub = S.hubMap[hubId]; if (!hub) return;
      var title = prompt('Pillar content title:', hub.name + ' — Complete Guide');
      if (!title || !title.trim()) return;
      var ct = createContent({ title: title.trim(), hub_id: hubId, content_type_id: 'ct_002' }); // Ultimate Guide
      hub.pillar_content_id = ct.id;
      hub.updated = new Date().toISOString();
      syncToTextarea(); renderCurrentView();
      toast('Pillar content created for ' + hub.name, 'success');
    });

    // Create content for cluster
    $(document).off('click.wcp-create-content-cluster').on('click.wcp-create-content-cluster', '[data-action="create-content-for-cluster"]', function() {
      var clusterId = $(this).data('cluster');
      var hubId = $(this).data('hub') || S.selectedHubId;
      var cl = S.clusterMap[clusterId];
      var title = prompt('Content title:', cl ? cl.name + ' Guide' : '');
      if (!title || !title.trim()) return;
      var ct = createContent({ title: title.trim(), hub_id: hubId, cluster_id: clusterId });
      // Link content to cluster
      if (cl) {
        cl.content_ids = cl.content_ids || [];
        cl.content_ids.push(ct.id);
        cl.updated = new Date().toISOString();
        if (cl.status === 'planned') cl.status = 'content_linked';
        syncToTextarea();
      }
      renderCurrentView();
    });

    // Create content (generic)
    $(document).off('click.wcp-create-content').on('click.wcp-create-content', '[data-action="create-content"]', function() {
      var title = prompt('Content title:');
      if (!title || !title.trim()) return;
      createContent({ title: title.trim() });
    });

    // Select content
    $(document).off('click.wcp-select-content').on('click.wcp-select-content', '[data-action="select-content"]', function(e) {
      e.preventDefault();
      var id = $(this).data('id');
      if (id) {
        S.selectedContentId = id;
        if (S.currentView !== 'content') navigate('content');
        else renderCurrentView();
        if (window._wcpLocation) window._wcpLocation.capture();
      }
    });

    // Content type filter
    $(document).off('click.wcp-filter-type').on('click.wcp-filter-type', '[data-action="filter-content-type"]', function() {
      S.contentFilter.type = $(this).data('type') || '';
      renderCurrentView();
    });

    // Content hub filter
    $(document).off('change.wcp-filter-hub').on('change.wcp-filter-hub', '#wcpFilterHub', function() {
      S.contentFilter.hub = $(this).val() || '';
      $('#wcpContentList').html(renderContentListItems());
    });

    // Content stage filter
    $(document).off('change.wcp-filter-stage').on('change.wcp-filter-stage', '#wcpFilterStage', function() {
      var val = $(this).val();
      S.contentFilter.statuses = val ? [val] : [];
      $('#wcpContentList').html(renderContentListItems());
    });

    // Content tag filter
    $(document).off('change.wcp-filter-tag').on('change.wcp-filter-tag', '#wcpFilterTag', function() {
      S.contentFilter.tag = $(this).val() || '';
      $('#wcpContentList').html(renderContentListItems());
    });

    // Content search
    $(document).off('input.wcp-search-content').on('input.wcp-search-content', '#wcpContentSearch', debounce(function() {
      S.contentFilter.search = $(this).val() || '';
      $('#wcpContentList').html(renderContentListItems());
    }, 250));

    // Show archived + rejected toggle — rerender the whole list pane so the
    // stage dropdown options (which are filtered by showClosed) also update.
    $(document).off('change.wcp-filter-closed').on('change.wcp-filter-closed', '#wcpFilterShowClosed', function() {
      S.contentFilter.showClosed = !!$(this).prop('checked');
      renderCurrentView();
    });

    // Advanced-filters disclosure toggle (content list)
    $(document).off('click.wcp-cl-adv').on('click.wcp-cl-adv', '[data-action="toggle-content-advanced"]', function(e) {
      e.preventDefault();
      S.contentFilter.advancedOpen = !S.contentFilter.advancedOpen;
      renderCurrentView();
    });

    // Sort by
    $(document).off('change.wcp-sort-by').on('change.wcp-sort-by', '#wcpSortBy', function() {
      S.contentFilter.sortBy = $(this).val() || 'updated';
      $('#wcpContentList').html(renderContentListItems());
    });

    // Sort direction
    $(document).off('click.wcp-sort-dir').on('click.wcp-sort-dir', '[data-action="toggle-sort-dir"]', function() {
      S.contentFilter.sortDir = (S.contentFilter.sortDir === 'asc') ? 'desc' : 'asc';
      renderCurrentView();
    });

    // Group by
    $(document).off('change.wcp-group-by').on('change.wcp-group-by', '#wcpGroupBy', function() {
      S.contentFilter.groupBy = $(this).val() || 'none';
      $('#wcpContentList').html(renderContentListItems());
    });

    // Clear individual filter chip
    $(document).off('click.wcp-filter-clear').on('click.wcp-filter-clear', '[data-action="clear-filter"]', function() {
      var key = $(this).data('key');
      if (key === 'search')   S.contentFilter.search = '';
      else if (key === 'type')  S.contentFilter.type = '';
      else if (key === 'hub')   S.contentFilter.hub = '';
      else if (key === 'tag')   S.contentFilter.tag = '';
      else if (key === 'stage') S.contentFilter.statuses = [];
      renderCurrentView();
    });

    // Clear all filters
    $(document).off('click.wcp-filter-clear-all').on('click.wcp-filter-clear-all', '[data-action="clear-all-filters"]', function() {
      S.contentFilter.search = '';
      S.contentFilter.type = '';
      S.contentFilter.hub = '';
      S.contentFilter.tag = '';
      S.contentFilter.statuses = [];
      renderCurrentView();
    });

    // Clear search via X button inside search wrapper
    $(document).off('click.wcp-search-clear').on('click.wcp-search-clear', '[data-action="clear-content-search"]', function() {
      S.contentFilter.search = '';
      renderCurrentView();
    });

    // Create template
    $(document).off('click.wcp-create-template').on('click.wcp-create-template', '[data-action="create-template"]', function() {
      var name = prompt('Template name:');
      if (!name || !name.trim()) return;
      var tpl = {
        id: generateId('tpl'), name: name.trim(), content_type_id: '',
        description: '', uses_count: 0,
        sections: [
          { name: 'Introduction', instructions: 'Hook the reader. Include primary keyword in first 100 words.', heading_level: 'H2', section_type: 'intro', est_words: 200 },
          { name: 'Main Content', instructions: 'Core information with H3 subsections.', heading_level: 'H2', section_type: 'body', est_words: 800 },
          { name: 'Conclusion', instructions: 'Summarize key takeaway. Clear CTA.', heading_level: 'H2', section_type: 'conclusion', est_words: 150 }
        ]
      };
      S.data.templates = S.data.templates || [];
      S.data.templates.push(tpl);
      logActivity('template_created', tpl.id, tpl.name, 'Template created with ' + tpl.sections.length + ' sections');
      buildMaps(); syncToTextarea(); renderCurrentView();
      toast('Template created: ' + tpl.name, 'success');
    });

    // Delete template
    $(document).off('click.wcp-delete-template').on('click.wcp-delete-template', '[data-action="delete-template"]', function(e) {
      e.stopPropagation();
      var tplId = $(this).data('id');
      var tpl = S.templateMap[tplId]; if (!tpl) return;
      if (!confirm('Delete template "' + tpl.name + '"?')) return;
      S.data.templates = (S.data.templates || []).filter(function(t) { return t.id !== tplId; });
      logActivity('template_created', tplId, tpl.name, 'Template deleted');
      buildMaps(); syncToTextarea(); renderCurrentView();
      toast('Template deleted', 'success');
    });

    // Activity filter
    $(document).off('change.wcp-activity-filter').on('change.wcp-activity-filter', '#wcpActivityFilter', function() {
      S.activityFilter.type = $(this).val() || '';
      renderCurrentView();
    });

    // Hash change
    $(window).off('hashchange.wcp').on('hashchange.wcp', function() {
      var h = readHash();
      if (h !== S.currentView) navigate(h, { noHash: true });
    });

    // Keyboard shortcuts
    $(document).off('keydown.wcp-shortcuts').on('keydown.wcp-shortcuts', function(e) {
      // Cmd+K or Ctrl+K — global search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: open search modal (Phase 7)
        toast('Global search coming soon', 'info');
      }
    });

    // ── Sitemap events ───────────────────────────────────────

    // Open Import Sitemap modal (defined in Part 2A)
    $(document).off('click.wcp-sm-import').on('click.wcp-sm-import', '[data-action="sitemap-open-import"]', function() {
      if (typeof window._wcpOpenSitemapImport === 'function') window._wcpOpenSitemapImport();
      else toast('Import is loading — try again in a moment', 'info');
    });

    // Search / filter — live update the list pane only
    $(document).off('input.wcp-sm-search').on('input.wcp-sm-search', '#wcpSitemapSearch', function() {
      S.sitemapFilter.search = this.value || '';
      if (S._smSearchTimer) clearTimeout(S._smSearchTimer);
      S._smSearchTimer = setTimeout(function() {
        $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
      }, 180);
    });
    $(document).off('change.wcp-sm-pri').on('change.wcp-sm-pri', '#wcpSitemapPriorityFilter', function() {
      S.sitemapFilter.priority = this.value || '';
      $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
    });
    $(document).off('change.wcp-sm-rem').on('change.wcp-sm-rem', '#wcpSitemapShowRemoved', function() {
      S.sitemapFilter.showRemoved = this.checked;
      $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
    });

    // Expand / collapse folder
    $(document).off('click.wcp-sm-folder').on('click.wcp-sm-folder', '[data-action="sitemap-toggle-folder"]', function(e) {
      e.stopPropagation();
      var path = $(this).data('path');
      if (!path) return;
      S.sitemapTreeExpanded[path] = !S.sitemapTreeExpanded[path];
      $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
    });

    // Fetch titles (client-side best-effort)
    $(document).off('click.wcp-sm-fetch').on('click.wcp-sm-fetch', '[data-action="sitemap-fetch-titles"]', function() {
      if (typeof fetchTitlesForSitemap !== 'function') { toast('Fetch utility not loaded', 'error'); return; }
      var $btn = $(this);
      $btn.prop('disabled', true);
      toast('Fetching titles…', 'info');
      fetchTitlesForSitemap({
        onProgress: function(p) {
          // Update button label with live progress
          $btn.html(icon('spinner') + ' ' + p.done + ' / ' + p.total);
        }
      }).then(function(res) {
        var parts = [];
        if (res.fetched) parts.push(res.fetched + ' fetched');
        if (res.blocked) parts.push(res.blocked + ' blocked by CORS');
        if (res.failed)  parts.push(res.failed  + ' failed');
        toast(parts.join(' · ') || 'No pages needed fetching', res.fetched ? 'success' : 'warning', 5000);
        renderCurrentView();
      }).catch(function() {
        $btn.prop('disabled', false);
        renderCurrentView();
      });
    });

    // AI suggest priorities — handler defined in Part 2B (triggers the modal)
    $(document).off('click.wcp-sm-suggest-pri').on('click.wcp-sm-suggest-pri', '[data-action="sitemap-suggest-priorities"]', function() {
      if (typeof window._wcpSuggestSitemapPriorities === 'function') window._wcpSuggestSitemapPriorities();
      else toast('AI priority suggestion loading — try again in a moment', 'info');
    });

    // Sitemap sort
    $(document).off('change.wcp-sm-sortby').on('change.wcp-sm-sortby', '#wcpSitemapSortBy', function() {
      S.sitemapFilter.sortBy = this.value || 'url';
      $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
    });

    // View mode toggle (flat / by_group)
    $(document).off('click.wcp-sm-vm').on('click.wcp-sm-vm', '[data-action="sitemap-set-viewmode"]', function(e) {
      e.stopPropagation();
      var mode = $(this).data('mode');
      if (mode !== 'flat' && mode !== 'by_group') return;
      if (S.sitemapViewMode === mode) return;
      S.sitemapViewMode = mode;
      if (S.currentView === 'sitemap') renderCurrentView();
    });

    // Open Manage Groups modal
    $(document).off('click.wcp-sm-mg').on('click.wcp-sm-mg', '[data-action="sitemap-manage-groups"]', function(e) {
      e.stopPropagation();
      if (typeof window._wcpOpenSitemapGroupsModal === 'function') window._wcpOpenSitemapGroupsModal();
      else toast('Groups modal loading — try again in a moment', 'info');
    });

    // Assign a page to a group (detail pane dropdown)
    $(document).off('change.wcp-sm-sg').on('change.wcp-sm-sg', '[data-action="sitemap-set-group"]', function() {
      var id = $(this).data('id');
      var groupId = this.value || '';
      var page = S.sitemapPageMap[id];
      if (!page || page.group_id === groupId) return;
      setSitemapPageGroup(id, groupId);
      // Rerender list (page may move between buckets) + keep detail view in sync
      $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
    });

    // Select page — the core row-click handler. Wrapped in try/catch so a
    // downstream render error can never break this event's future firings.
    $(document).off('click.wcp-sm-sel').on('click.wcp-sm-sel', '[data-action="sitemap-select-page"]', function(e) {
      try {
        // Don't re-select when the click originated inside an inline control
        // on the row (priority picker, group chip, expanded pickers) — those
        // have their own handlers and shouldn't also fire row-select.
        var $t = $(e.target);
        if ($t.closest('.wcp-sitemap-row-pri, .wcp-sitemap-row-group, .wcp-sitemap-row-pri-expanded, .wcp-sitemap-row-group-expanded').length) return;
        e.stopPropagation();
        var id = $(this).data('id');
        if (!id) return;
        if (!S.sitemapPageMap[id]) { console.warn('[WCP] sitemap row click for unknown id:', id); buildMaps(); }
        S.selectedSitemapPageId = id;
        $('.wcp-sitemap-row').removeClass('wcp-list-item-active');
        $(this).addClass('wcp-list-item-active');
        var $pane = $('#wcpSitemapDetailPane');
        if ($pane.length) $pane.html(renderSitemapDetailPane());
        else if (typeof renderCurrentView === 'function') renderCurrentView();
        if (window._wcpLocation) window._wcpLocation.capture();
      } catch (err) {
        console.error('[WCP] sitemap-select-page failed:', err);
      }
    });

    // Priority pill toggle — when a row shows just the current pill, clicking
    // it expands an inline options strip (Auto / P1 / P2 / P3) below the row.
    $(document).off('click.wcp-sm-pri-toggle').on('click.wcp-sm-pri-toggle', '[data-action="sitemap-pri-toggle"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var id = $(this).data('id');
      if (!id) return;
      var $panel = $('.wcp-sitemap-row-pri-expanded[data-pri-for="' + id + '"]');
      var wasOpen = $panel.hasClass('is-open');
      $('.wcp-sitemap-row-pri-expanded, .wcp-sitemap-row-group-expanded').removeClass('is-open');
      if (!wasOpen) $panel.addClass('is-open');
    });

    // Group chip toggle — same pattern. Clicking the chip opens the inline
    // group picker below the row.
    $(document).off('click.wcp-sm-grp-toggle').on('click.wcp-sm-grp-toggle', '[data-action="sitemap-group-toggle"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var id = $(this).data('id');
      if (!id) return;
      var $panel = $('.wcp-sitemap-row-group-expanded[data-group-for="' + id + '"]');
      var wasOpen = $panel.hasClass('is-open');
      $('.wcp-sitemap-row-pri-expanded, .wcp-sitemap-row-group-expanded').removeClass('is-open');
      if (!wasOpen) {
        $panel.addClass('is-open');
        // Focus the filter input
        setTimeout(function() { $panel.find('.wcp-sitemap-group-search').focus(); }, 20);
      }
    });

    // Clicking outside any inline picker closes all of them.
    $(document).off('click.wcp-sm-rowpicker-close').on('click.wcp-sm-rowpicker-close', function(e) {
      var $t = $(e.target);
      if ($t.closest('.wcp-sitemap-row-pri, .wcp-sitemap-row-group, .wcp-sitemap-row-pri-expanded, .wcp-sitemap-row-group-expanded').length) return;
      $('.wcp-sitemap-row-pri-expanded.is-open, .wcp-sitemap-row-group-expanded.is-open').removeClass('is-open');
    });

    // Live-filter groups in the expanded inline picker
    $(document).off('input.wcp-sm-grp-filter').on('input.wcp-sm-grp-filter', '[data-action="sitemap-group-filter"]', function() {
      var id = $(this).data('id');
      var q = (this.value || '').toLowerCase().trim();
      var $opts = $('.wcp-sitemap-group-opts[data-group-opts-for="' + id + '"] .wcp-sitemap-group-opt');
      $opts.each(function() {
        var name = ($(this).data('name') || '').toLowerCase();
        if (!q || name.indexOf(q) > -1 || $(this).text().toLowerCase().indexOf(q) > -1) $(this).show();
        else $(this).hide();
      });
    });

    // Pick a group from the inline picker — commits + closes the panel
    $(document).off('click.wcp-sm-rowgrp-btn').on('click.wcp-sm-rowgrp-btn', '[data-action="sitemap-row-set-group-btn"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id');
      var groupId = String($(this).data('group-id') || '');
      var page = S.sitemapPageMap[id];
      if (!page) return;
      if (page.group_id !== groupId) setSitemapPageGroup(id, groupId);
      // Close the picker + rerender the row (+ pane if viewing By group)
      $('.wcp-sitemap-row-group-expanded.is-open').removeClass('is-open');
      $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
    });

    // (sitemap-row-set-priority handler below — single source of truth)

    // Inline menu — quick group assignment
    $(document).off('change.wcp-sm-rowgrp').on('change.wcp-sm-rowgrp', '[data-action="sitemap-row-set-group"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id');
      var groupId = this.value || '';
      var page = S.sitemapPageMap[id];
      if (!page || page.group_id === groupId) return;
      setSitemapPageGroup(id, groupId);
      $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
    });

    // Inline menu — quick delete
    $(document).off('click.wcp-sm-rowdel').on('click.wcp-sm-rowdel', '[data-action="sitemap-row-delete"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id');
      var page = S.sitemapPageMap[id];
      if (!page) return;
      if (!confirm('Remove "' + (page.title || page.url) + '" from the sitemap?')) return;
      deleteSitemapPage(id);
      renderCurrentView();
    });

    // Inline priority edit on row — must close expanded panels after set
    $(document).off('click.wcp-sm-rowpri').on('click.wcp-sm-rowpri', '[data-action="sitemap-row-set-priority"]', function(e) {
      e.stopPropagation();
      var id = $(this).data('id');
      var raw = $(this).data('priority');
      var val = (raw === 'auto') ? null : parseInt(raw, 10);
      if (val !== null && (val < 1 || val > 3)) return;
      setSitemapPagePriority(id, val);
      $('.wcp-sitemap-row-pri-expanded.is-open').removeClass('is-open');
      $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
      $('#wcpSitemapDetailPane').html(renderSitemapDetailPane());
    });

    // Priority edit (used in the DETAIL pane's priority picker, not the row)
    $(document).off('click.wcp-sm-pri-set').on('click.wcp-sm-pri-set', '[data-action="sitemap-set-priority"]', function() {
      var id = $(this).data('id');
      var raw = $(this).data('priority');
      var val = (raw === 'auto') ? null : parseInt(raw, 10);
      if (val !== null && (val < 1 || val > 3)) return;
      setSitemapPagePriority(id, val);
      // Re-render detail and the list (priority pills change)
      $('#wcpSitemapDetailPane').html(renderSitemapDetailPane());
      $('#wcpSitemapList').html($('<div>').append(_sitemapListRerender()).html());
    });

    // Save title (blur only — avoids churn on every keystroke)
    $(document).off('blur.wcp-sm-title').on('blur.wcp-sm-title', '[data-action="sitemap-save-title"]', function() {
      var id = $(this).data('id');
      var val = this.value || '';
      var page = S.sitemapPageMap[id];
      if (page && page.title !== val) updateSitemapPage(id, { title: val });
    });

    // Save notes (blur)
    $(document).off('blur.wcp-sm-notes').on('blur.wcp-sm-notes', '[data-action="sitemap-save-notes"]', function() {
      var id = $(this).data('id');
      var val = this.value || '';
      var page = S.sitemapPageMap[id];
      if (page && page.notes !== val) updateSitemapPage(id, { notes: val });
    });

    // Save url (blur)
    $(document).off('blur.wcp-sm-url').on('blur.wcp-sm-url', '[data-action="sitemap-save-url"]', function() {
      var id = $(this).data('id');
      var val = this.value || '';
      var page = S.sitemapPageMap[id];
      if (!page || !val) return;
      var canon = (typeof canonicalizeUrl === 'function') ? canonicalizeUrl(val) : val;
      if (canon !== page.url) { updateSitemapPage(id, { url: canon }); renderCurrentView(); }
    });

    // Delete page
    $(document).off('click.wcp-sm-del').on('click.wcp-sm-del', '[data-action="sitemap-delete-page"]', function() {
      var id = $(this).data('id');
      var page = S.sitemapPageMap[id];
      if (!page) return;
      if (!confirm('Delete "' + (page.title || page.url) + '" from the sitemap? This also removes any internal links targeting it.')) return;
      deleteSitemapPage(id);
      renderCurrentView();
    });

    // ── published_url — captured on the content detail header ──
    $(document).off('blur.wcp-pub-url').on('blur.wcp-pub-url', '[data-action="save-published-url"]', function() {
      var id = $(this).data('id');
      var c = S.contentMap[id];
      if (!c) return;
      var raw = this.value || '';
      var canon = raw ? (typeof canonicalizeUrl === 'function' ? canonicalizeUrl(raw) : raw) : '';
      if (canon === c.published_url) return;
      c.published_url = canon;
      c.updated = new Date().toISOString();
      // If already published, upsert sitemap immediately
      if (c.status === 'published' && typeof onContentPublished === 'function') {
        try { onContentPublished(c); } catch (e) {}
      }
      buildMaps(); syncToTextarea();
      // Re-render detail so the "In sitemap" chip updates
      renderCurrentView();
    });

    // ── Hub → Sitemap deep-link (Phase 6) ─────────────────────────────
    $(document).off('click.wcp-hub-sm-pln').on('click.wcp-hub-sm-pln', '[data-action="hub-open-sitemap-planned"]', function(e) {
      e.stopPropagation();
      var hid = $(this).data('hub') || S.selectedHubId;
      var nid = $(this).data('node-id') || '';
      if (!hid) return;
      S.sitemapMode = 'planned';
      S.sitemapPlanHubId = hid;
      if (nid) S.selectedPlannedNodeId = nid;
      if (window._wcpNavigate) window._wcpNavigate('sitemap'); else renderCurrentView();
    });
    $(document).off('click.wcp-hub-sm-live').on('click.wcp-hub-sm-live', '[data-action="hub-open-sitemap-live"]', function(e) {
      e.stopPropagation();
      S.sitemapMode = 'live';
      var hid = $(this).data('hub');
      if (hid) {
        // Land on the first live page tagged to this hub so the user sees
        // immediate context rather than the previously-selected page.
        var pages = (S.sitemapPagesByHub && S.sitemapPagesByHub[hid]) || [];
        if (pages.length) S.selectedSitemapPageId = pages[0].id;
      }
      if (window._wcpNavigate) window._wcpNavigate('sitemap'); else renderCurrentView();
    });

    // ── Sitemap mode bar (Phase 4) ────────────────────────────────────
    $(document).off('click.wcp-sm-mode').on('click.wcp-sm-mode', '[data-action="sitemap-set-mode"]', function() {
      var mode = $(this).data('mode');
      if (mode !== 'live' && mode !== 'planned') return;
      if (S.sitemapMode === mode) return;
      S.sitemapMode = mode;
      if (window._wcpLocation) window._wcpLocation.capture();
      renderCurrentView();
    });

    $(document).off('change.wcp-sm-planhub').on('change.wcp-sm-planhub', '#wcpSitemapPlanHub', function() {
      var newHub = $(this).val() || '';
      if (newHub === S.sitemapPlanHubId) return;
      S.sitemapPlanHubId = newHub;
      S.selectedPlannedNodeId = null; // selection is per-hub
      if (window._wcpLocation) window._wcpLocation.capture();
      renderCurrentView();
    });

    // ── Hub binding on a live sitemap page (Phase 4.5) ────────────────
    $(document).off('change.wcp-sm-pghub').on('change.wcp-sm-pghub', '[data-action="sitemap-page-set-hub"]', function() {
      var id = $(this).data('id');
      var page = S.sitemapPageMap[id]; if (!page) return;
      var newHubId = this.value || '';
      var patch = { hub_id: newHubId };
      // Changing primary hub invalidates the primary cluster (clusters are
      // hub-scoped). Reset cluster_id silently.
      if (newHubId !== page.hub_id) patch.cluster_id = '';
      updateSitemapPage(id, patch);
      $('#wcpSitemapDetailPane').html(renderSitemapDetailPane());
    });

    $(document).off('change.wcp-sm-pgcluster').on('change.wcp-sm-pgcluster', '[data-action="sitemap-page-set-cluster"]', function() {
      var id = $(this).data('id');
      updateSitemapPage(id, { cluster_id: this.value || '' });
      // No re-render needed — the dropdown reflects its own state.
    });

    $(document).off('change.wcp-sm-pghubtag').on('change.wcp-sm-pghubtag', '[data-action="sitemap-page-toggle-hubtag"]', function() {
      var id = $(this).data('id');
      var hubId = $(this).data('hub-id');
      var page = S.sitemapPageMap[id]; if (!page || !hubId) return;
      var tags = Array.isArray(page.tag_hub_ids) ? page.tag_hub_ids.slice() : [];
      var idx = tags.indexOf(hubId);
      if (this.checked && idx === -1) tags.push(hubId);
      else if (!this.checked && idx > -1) tags.splice(idx, 1);
      updateSitemapPage(id, { tag_hub_ids: tags });
      // Visual state change on the chip — toggle is-on class without full re-render
      $(this).closest('.wcp-sitemap-hubtag-chk').toggleClass('is-on', this.checked);
    });

    // ── Planned tree events (Phase 4.2-4.4) ───────────────────────────
    $(document).off('click.wcp-pln-root').on('click.wcp-pln-root', '[data-action="planned-add-root"]', function() {
      var hubId = $(this).data('hub') || S.sitemapPlanHubId;
      if (!hubId) return;
      var node = plannedCreateNode(hubId, '', { label: 'New page' });
      if (node) {
        S.selectedPlannedNodeId = node.id;
        renderCurrentView();
        // Focus the label input so the user can name it immediately.
        setTimeout(function() {
          var $el = $('#wcpPlannedDetailPane .wcp-sitemap-title-input').first();
          if ($el.length) $el.trigger('focus').select();
        }, 0);
      }
    });

    $(document).off('click.wcp-pln-sel').on('click.wcp-pln-sel', '[data-action="planned-select-node"]', function(e) {
      // Ignore clicks on inner controls (kebab, chevron). They bubble back here
      // because of the row's data-action, but their own handlers stopPropagation.
      var nodeId = $(this).data('node-id');
      if (!nodeId) return;
      e.preventDefault();
      S.selectedPlannedNodeId = nodeId;
      if (window._wcpLocation) window._wcpLocation.capture();
      // Cheap re-render: swap the detail pane + flip active class on rows.
      var hub = S.hubMap[S.sitemapPlanHubId]; if (!hub) return;
      $('#wcpPlannedDetailPane').html(renderPlannedDetailPane(hub));
      $('.wcp-planned-node').removeClass('is-active');
      $('.wcp-planned-node[data-node-id="' + nodeId + '"]').addClass('is-active');
    });

    $(document).off('click.wcp-pln-chev').on('click.wcp-pln-chev', '[data-action="planned-toggle-expand"]', function(e) {
      e.stopPropagation();
      var nodeId = $(this).data('node-id'); if (!nodeId) return;
      // Default-expanded; only stored when collapsed.
      var cur = S.plannedTreeExpanded[nodeId] !== false;
      S.plannedTreeExpanded[nodeId] = !cur;
      renderCurrentView();
    });

    // Field edits (save on blur for text/textarea, change for select)
    $(document).off('blur.wcp-pln-save').on('blur.wcp-pln-save', '[data-action="planned-save"]', function() {
      var $el = $(this);
      if ($el.is('select')) return; // handled by change below
      var nodeId = $el.data('node-id'); var field = $el.data('field');
      if (!nodeId || !field) return;
      var val = $el.val();
      var patch = {}; patch[field] = val;
      var node = plannedUpdateNode(nodeId, patch);
      if (node && (field === 'label' || field === 'priority' || field === 'intent')) {
        // Tree row needs to refresh too — re-render whole tree pane is cheapest.
        renderCurrentView();
      }
    });
    $(document).off('change.wcp-pln-save').on('change.wcp-pln-save', '[data-action="planned-save"]', function() {
      var $el = $(this); if (!$el.is('select')) return;
      var nodeId = $el.data('node-id'); var field = $el.data('field');
      if (!nodeId || !field) return;
      var patch = {}; patch[field] = $el.val();
      plannedUpdateNode(nodeId, patch);
      // Re-render tree pane so the intent letter / status / etc. update.
      renderCurrentView();
    });

    $(document).off('click.wcp-pln-pri').on('click.wcp-pln-pri', '[data-action="planned-set-priority"]', function(e) {
      e.stopPropagation();
      var nodeId = $(this).data('node-id');
      var raw = $(this).data('priority');
      var val = (raw === 'auto') ? null : parseInt(raw, 10);
      if (val !== null && (val < 1 || val > 3)) return;
      plannedUpdateNode(nodeId, { priority: val });
      renderCurrentView();
    });

    $(document).off('click.wcp-pln-del').on('click.wcp-pln-del', '[data-action="planned-delete"]', function(e) {
      e.stopPropagation();
      var nodeId = $(this).data('node-id'); if (!nodeId) return;
      var node = S.plannedNodeMap[nodeId];
      var label = node ? (node.label || '(untitled)') : 'this node';
      if (!confirm('Delete "' + label + '" and all its children?')) return;
      plannedDeleteNode(nodeId);
      renderCurrentView();
    });

    // Row kebab — for now opens a tiny prompt-based menu. A proper context
    // menu component lands in a follow-up; this keeps the wiring proven.
    $(document).off('click.wcp-pln-kebab').on('click.wcp-pln-kebab', '[data-action="planned-row-menu"]', function(e) {
      e.stopPropagation();
      var nodeId = $(this).data('node-id'); if (!nodeId) return;
      var hubId = S.sitemapPlanHubId;
      var actions = '1 Add child\n2 Add sibling\n3 Delete\n\nType a number:';
      var pick = window.prompt(actions, '1');
      if (!pick) return;
      if (pick === '1') {
        var child = plannedCreateNode(hubId, nodeId, { label: 'New page' });
        if (child) S.selectedPlannedNodeId = child.id;
        renderCurrentView();
      } else if (pick === '2') {
        var parent = S.plannedNodeMap[nodeId];
        var pid = parent ? (parent.parent_id || '') : '';
        var sib = plannedCreateNode(hubId, pid, { label: 'New page' });
        if (sib) S.selectedPlannedNodeId = sib.id;
        renderCurrentView();
      } else if (pick === '3') {
        var node = S.plannedNodeMap[nodeId];
        var label = node ? (node.label || '(untitled)') : 'this node';
        if (confirm('Delete "' + label + '" and all its children?')) {
          plannedDeleteNode(nodeId);
          renderCurrentView();
        }
      }
    });

    // ── Planned tree drag-and-drop (Phase 4.3) ────────────────────────
    // Native HTML5 DnD; payload = node id stored on dataTransfer. Drop
    // targets:
    //   .wcp-planned-row           → reparent as last child of target
    //   .wcp-planned-drop-before   → insert as sibling BEFORE target
    //   .wcp-planned-drop-end      → demote to root level (append)
    $(document).off('dragstart.wcp-pln').on('dragstart.wcp-pln', '.wcp-planned-row', function(e) {
      var nodeId = $(this).closest('.wcp-planned-node').data('node-id');
      if (!nodeId) return;
      var dt = e.originalEvent.dataTransfer;
      dt.setData('text/plain', nodeId);
      dt.setData('application/x-wcp-planned-node', nodeId);
      dt.effectAllowed = 'move';
      $(this).addClass('is-dragging');
    });
    $(document).off('dragend.wcp-pln').on('dragend.wcp-pln', '.wcp-planned-row', function() {
      $(this).removeClass('is-dragging');
      $('.wcp-planned-drop-active').removeClass('wcp-planned-drop-active');
    });
    $(document).off('dragover.wcp-pln').on('dragover.wcp-pln',
      '.wcp-planned-row, .wcp-planned-drop-before, .wcp-planned-drop-end',
      function(e) {
        var dt = e.originalEvent.dataTransfer;
        if (!dt) return;
        // Only handle our own payloads — refuse browser file drops, etc.
        if (dt.types && Array.prototype.indexOf.call(dt.types, 'application/x-wcp-planned-node') === -1 &&
            Array.prototype.indexOf.call(dt.types, 'text/plain') === -1) return;
        e.preventDefault();
        dt.dropEffect = 'move';
        $('.wcp-planned-drop-active').removeClass('wcp-planned-drop-active');
        $(this).addClass('wcp-planned-drop-active');
      });
    $(document).off('drop.wcp-pln').on('drop.wcp-pln',
      '.wcp-planned-row, .wcp-planned-drop-before, .wcp-planned-drop-end',
      function(e) {
        e.preventDefault();
        var dt = e.originalEvent.dataTransfer; if (!dt) return;
        var draggedId = dt.getData('application/x-wcp-planned-node') || dt.getData('text/plain');
        if (!draggedId) return;
        $('.wcp-planned-drop-active').removeClass('wcp-planned-drop-active');

        var $target = $(this);
        if ($target.hasClass('wcp-planned-drop-end')) {
          // Demote to root, append at end of root list.
          plannedMoveNode(draggedId, '', '');
        } else if ($target.hasClass('wcp-planned-drop-before')) {
          // Sibling-before — same parent as target, inserted before target.
          var siblingId = $target.data('node-id'); if (!siblingId) return;
          var sibling = S.plannedNodeMap[siblingId]; if (!sibling) return;
          plannedMoveNode(draggedId, sibling.parent_id || '', siblingId);
        } else {
          // Row body — reparent as last child of target.
          var targetId = $target.closest('.wcp-planned-node').data('node-id');
          if (!targetId || targetId === draggedId) return;
          plannedMoveNode(draggedId, targetId, '');
          // Auto-expand the parent so the move is visible.
          S.plannedTreeExpanded[targetId] = true;
        }
        renderCurrentView();
      });

    console.log('[WCP] Event handlers registered');
  }

  // Rerender only the list pane of the sitemap view without touching
  // the detail pane. Used by search / filter / toggle handlers.
  function _sitemapListRerender() {
    var frag = $('<div></div>');
    // Rebuild just the inner markup by calling the list pane and extracting
    // its #wcpSitemapList contents.
    var listHtml = renderSitemapListPane();
    frag.html(listHtml);
    return frag.find('#wcpSitemapList').html();
  }

