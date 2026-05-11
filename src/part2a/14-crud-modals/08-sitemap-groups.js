  // ============================================================
  // MANAGE SITEMAP GROUPS MODAL
  // ============================================================
  //
  // Flat list of user-defined groups with inline rename / color-pick /
  // delete + an "Add group" form at the top. Deleting a group unassigns
  // pages from it (pages don't cascade-delete).

  function openSitemapGroupsModal() {
    var html = '<div class="wcp-sitemap-groups">';
    html += '<div class="wcp-sitemap-groups-hint">' + icon('circle-info') + ' Groups are how <strong>you</strong> organise the sitemap. Create groups that match your site structure — "Blog", "Product pages", "Support docs" — then assign pages from each page\'s detail pane.</div>';

    // Add form
    html += '<div class="wcp-sitemap-groups-add">';
    html += '<input type="text" class="wcp-input wcp-input-sm" id="wcpSitemapGroupName" placeholder="Group name (e.g. Blog — SEO)" maxlength="60">';
    html += '<input type="color" class="wcp-sitemap-groups-color" id="wcpSitemapGroupColor" value="#2563eb" title="Pick a color">';
    html += '<button class="wcp-btn wcp-btn-primary wcp-btn-sm" data-action="sitemap-group-create">' + icon('plus') + ' Add group</button>';
    html += '</div>';

    // List
    html += '<div id="wcpSitemapGroupsList">' + _renderSitemapGroupsList() + '</div>';

    html += '</div>';

    openModal('Manage Groups', html, {
      size: 'md',
      footer: false
    });

    // Enter key submits the add form
    $(document).off('keydown.wcp-sg-enter').on('keydown.wcp-sg-enter', '#wcpSitemapGroupName', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); $('[data-action="sitemap-group-create"]').click(); }
    });

    // Bind inline actions
    _bindSitemapGroupsEvents();
  }

  function _renderSitemapGroupsList() {
    var sm = (S.data && S.data.sitemap) || { pages: [], groups: [] };
    var groups = (sm.groups || []).slice().sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
    if (!groups.length) {
      return '<div class="wcp-sitemap-groups-empty">' + icon('folder-open') + ' No groups yet. Create one above.</div>';
    }
    // Count pages per group (O(n) — fine at 10K pages)
    var counts = {};
    var pages = sm.pages || [];
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].group_id) counts[pages[i].group_id] = (counts[pages[i].group_id] || 0) + 1;
    }
    var html = '<div class="wcp-sitemap-groups-list">';
    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g];
      var n = counts[grp.id] || 0;
      html += '<div class="wcp-sitemap-groups-row" data-id="' + esc(grp.id) + '">';
      html += '<input type="color" class="wcp-sitemap-groups-color" data-action="sitemap-group-color" data-id="' + esc(grp.id) + '" value="' + esc(grp.color || '#6b7280') + '">';
      html += '<input type="text" class="wcp-input wcp-input-sm" data-action="sitemap-group-rename" data-id="' + esc(grp.id) + '" value="' + esc(grp.name) + '" maxlength="60">';
      html += '<span class="wcp-sitemap-groups-count">' + n + ' page' + (n !== 1 ? 's' : '') + '</span>';
      html += '<button class="wcp-btn-icon wcp-btn-delete-sm" data-action="sitemap-group-delete" data-id="' + esc(grp.id) + '" title="Delete group (pages become ungrouped)">' + icon('trash') + '</button>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function _bindSitemapGroupsEvents() {
    // Create
    $(document).off('click.wcp-sg-add').on('click.wcp-sg-add', '[data-action="sitemap-group-create"]', function() {
      var name = ($('#wcpSitemapGroupName').val() || '').trim();
      var color = $('#wcpSitemapGroupColor').val() || '#6b7280';
      if (!name) { toast('Enter a group name', 'warning'); return; }
      if (typeof window._wcpCreateSitemapGroup === 'function') {
        window._wcpCreateSitemapGroup({ name: name, color: color });
        $('#wcpSitemapGroupName').val('');
        $('#wcpSitemapGroupsList').html(_renderSitemapGroupsList());
        toast('Group "' + name + '" created', 'success');
        // If the user is on the sitemap view, refresh it too so the new group
        // bucket shows up immediately.
        if (S.currentView === 'sitemap' && window._wcpRender) window._wcpRender();
      }
    });

    // Rename (blur)
    $(document).off('blur.wcp-sg-ren').on('blur.wcp-sg-ren', '[data-action="sitemap-group-rename"]', function() {
      var id = $(this).data('id');
      var name = (this.value || '').trim();
      if (!name || !id) return;
      var existing = S.sitemapGroupMap ? S.sitemapGroupMap[id] : null;
      if (!existing || existing.name === name) return;
      if (typeof window._wcpUpdateSitemapGroup === 'function') {
        window._wcpUpdateSitemapGroup(id, { name: name });
        if (S.currentView === 'sitemap' && window._wcpRender) window._wcpRender();
      }
    });

    // Color change
    $(document).off('change.wcp-sg-col').on('change.wcp-sg-col', '[data-action="sitemap-group-color"]', function() {
      var id = $(this).data('id');
      if (!id) return;
      if (typeof window._wcpUpdateSitemapGroup === 'function') {
        window._wcpUpdateSitemapGroup(id, { color: this.value });
        if (S.currentView === 'sitemap' && window._wcpRender) window._wcpRender();
      }
    });

    // Delete
    $(document).off('click.wcp-sg-del').on('click.wcp-sg-del', '[data-action="sitemap-group-delete"]', function() {
      var id = $(this).data('id');
      if (!id) return;
      var grp = S.sitemapGroupMap ? S.sitemapGroupMap[id] : null;
      if (!grp) return;
      if (!confirm('Delete group "' + grp.name + '"? Pages in this group will become ungrouped (not deleted).')) return;
      if (typeof window._wcpDeleteSitemapGroup === 'function') {
        window._wcpDeleteSitemapGroup(id);
        $('#wcpSitemapGroupsList').html(_renderSitemapGroupsList());
        toast('Group deleted', 'success');
        if (S.currentView === 'sitemap' && window._wcpRender) window._wcpRender();
      }
    });
  }

  // Expose for Part 1 events wiring
  window._wcpOpenSitemapGroupsModal = openSitemapGroupsModal;
