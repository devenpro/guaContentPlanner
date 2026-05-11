  // ============================================================
  // SECTION 14: EVENTS & KEYBOARD SHORTCUTS
  // ============================================================

  function setupPart2BEvents() {
    var ns = '.wcp2b';

    // ── AI provider change → update model dropdown + propagate to appDefault ──
    $(document).off('change' + ns + '-ap').on('change' + ns + '-ap', '.wcp-ai-provider-select', function() {
      var pid = $(this).val();
      var actionId = $(this).data('action-id') || '';
      var models = LLMService.getActiveModels(pid);
      var $mSel = $('.wcp-ai-model-select[data-action-id="' + actionId + '"]');
      $mSel.html('');
      for (var i = 0; i < models.length; i++) {
        $mSel.append('<option value="' + esc(models[i].id) + '" data-temp="' + (models[i].temperature !== undefined ? models[i].temperature : 1.0) + '" data-tokens="' + (models[i].max_tokens || 8192) + '">' + esc(models[i].label) + '</option>');
      }
      // Last-picked rule: any change to the legacy inline picker updates appDefault too.
      var newMid = $mSel.val();
      if (pid && newMid) LLMService.savePreference(actionId, pid, newMid);
    });

    // ── AI model change → propagate to appDefault ──
    $(document).off('change' + ns + '-am').on('change' + ns + '-am', '.wcp-ai-model-select', function() {
      var mid = $(this).val();
      var actionId = $(this).data('action-id') || '';
      var pid = $('.wcp-ai-provider-select[data-action-id="' + actionId + '"]').val();
      if (pid && mid) LLMService.savePreference(actionId, pid, mid);
    });

    // ── AI status indicator → navigate to settings AI tab ──
    $(document).off('click' + ns + '-as').on('click' + ns + '-as', '.wcp-ai-status-indicator', function() {
      S.settingsTab = 'ai'; navigate('settings');
    });

    // ── Settings tab navigation ──
    $(document).off('click' + ns + '-st').on('click' + ns + '-st', '[data-action="settings-tab"]', function() {
      S.settingsTab = $(this).data('tab') || 'workspace';
      render();
      if (window._wcpLocation) window._wcpLocation.capture();
    });

    // ── Settings field save on blur (text inputs) ──
    $(document).off('blur' + ns + '-sf').on('blur' + ns + '-sf', '.wcp-settings-field', function() {
      var path = $(this).data('path');
      if (!path) return;
      var val = $(this).is(':checkbox') ? $(this).is(':checked') : $(this).val();
      var parts = path.split('.');
      var target = S.meta;
      for (var i = 0; i < parts.length - 1; i++) { target[parts[i]] = target[parts[i]] || {}; target = target[parts[i]]; }
      target[parts[parts.length - 1]] = val;
      syncToTextarea();
    });

    // ── Settings field save on change (selects, checkboxes) ──
    $(document).off('change' + ns + '-sc').on('change' + ns + '-sc', 'select.wcp-settings-field, input[type="checkbox"].wcp-settings-field', function() {
      var path = $(this).data('path');
      if (!path) return;
      var val = $(this).is(':checkbox') ? $(this).is(':checked') : $(this).val();
      var parts = path.split('.');
      var target = S.meta;
      for (var i = 0; i < parts.length - 1; i++) { target[parts[i]] = target[parts[i]] || {}; target = target[parts[i]]; }
      target[parts[parts.length - 1]] = val;
      syncToTextarea();
    });

    // ── Research tab switch (2 tabs: keywords / competitor) ──
    $(document).off('click' + ns + '-rt').on('click' + ns + '-rt', '[data-action="research-tab"]', function() {
      S.researchTab = $(this).data('tab') || 'keywords';
      render();
      if (window._wcpLocation) window._wcpLocation.capture();
    });

    // ── AI action buttons — Per-content ──
    var aiActionsContent = {
      'ai-suggest-type': aiSuggestType,
      'ai-fill-brief':   aiFillBrief
    };
    for (var aiKey in aiActionsContent) {
      (function(action, handler) {
        $(document).off('click' + ns + '-' + action).on('click' + ns + '-' + action, '[data-action="' + action + '"]', function() {
          var id = $(this).data('id') || S.selectedContentId;
          if (id) handler(id);
        });
      })(aiKey, aiActionsContent[aiKey]);
    }

    // ── AI action buttons — Hub & Global (kept: 5 actions) ──
    $(document).off('click' + ns + '-aish').on('click' + ns + '-aish', '[data-action="ai-suggest-hubs"]', function() { aiSuggestHubs(); });
    $(document).off('click' + ns + '-aiec').on('click' + ns + '-aiec', '[data-action="ai-enrich-cluster"]', function() { var id = $(this).data('id'); if (id) aiEnrichCluster(id); });
    $(document).off('click' + ns + '-aitg').on('click' + ns + '-aitg', '[data-action="ai-suggest-tags"]', function() { aiSuggestTags(); });
    $(document).off('click' + ns + '-aibt').on('click' + ns + '-aibt', '[data-action="ai-build-template"]', function() { aiBuildTemplate(); });
    $(document).off('click' + ns + '-aipc').on('click' + ns + '-aipc', '[data-action="ai-plan-calendar"]', function() { var hid = $(this).data('hub') || S.selectedHubId; if (hid) aiPlanCalendar(hid); });
    $(document).off('click' + ns + '-aipth').on('click' + ns + '-aipth', '[data-action="ai-plan-this-hub"]', function() { var hid = $(this).data('hub') || S.selectedHubId; if (hid) aiPlanThisHub(hid); });
    $(document).off('click' + ns + '-aiga').on('click' + ns + '-aiga', '[data-action="ai-gap-analysis"]', function() { var hid = $(this).data('hub') || S.selectedHubId; if (hid) aiGapAnalysisForHub(hid); });
    $(document).off('click' + ns + '-aisc').on('click' + ns + '-aisc', '[data-action="ai-suggest-content"]', function() { var id = $(this).data('id'); if (id) aiSuggestContent(id); });

    // ── Adopt hub from suggestion modal ──
    // Legacy bare "adopt-hub" button — still works if anything else in the
    // app emits it. Current AI-suggest-hubs modal uses the richer
    // "hub-suggest-quick-add" and "hub-suggest-refine" actions below.
    $(document).off('click' + ns + '-ah').on('click' + ns + '-ah', '[data-action="adopt-hub"]', function() {
      var name = $(this).data('name');
      var desc = $(this).data('desc') || '';
      var kw = $(this).data('kw') || '';
      if (!name) return;
      var colorIdx = (S.data.hubs || []).length % Constants.HUB_COLORS.length;
      snapshot('Before adopt hub');
      createHub({ name: name, color: Constants.HUB_COLORS[colorIdx].color, description: desc, pillar_keyword: kw });
      toast('Hub "' + name + '" created', 'success');
    });

    // Quick-add from the AI Suggest Hubs modal: create the hub AND every
    // cluster the user left checked in that card. Closes the modal and
    // navigates into the new hub so the user can keep editing.
    $(document).off('click' + ns + '-hsqa').on('click' + ns + '-hsqa', '[data-action="hub-suggest-quick-add"]', function() {
      var idx = parseInt($(this).data('hub-idx'), 10);
      var suggestions = S._lastHubSuggestions || [];
      var h = suggestions[idx];
      if (!h || !h.name) { toast('Suggestion not found', 'error'); return; }

      // Which clusters did the user leave checked?
      var $card = $(this).closest('.wcp-hs-card');
      var checkedClusterIdx = [];
      $card.find('.wcp-hs-cluster-cb:checked').each(function() {
        checkedClusterIdx.push(parseInt($(this).data('cluster-idx'), 10));
      });

      snapshot('Before quick-add hub');
      var colorIdx = (S.data.hubs || []).length % Constants.HUB_COLORS.length;
      var hub = createHub({
        name: h.name,
        color: Constants.HUB_COLORS[colorIdx].color,
        description: h.description || '',
        pillar_keyword: h.pillar_keyword || ''
      });

      // Attach extra enrichment fields so future AI calls have richer context
      if (h.target_audience) hub.target_audience = h.target_audience;
      if (h.search_intent_mix) hub.search_intent_mix = h.search_intent_mix;
      if (Array.isArray(h.keywords)) hub.keywords = h.keywords.slice();

      // Create checked clusters
      var clusters = Array.isArray(h.suggested_clusters) ? h.suggested_clusters : [];
      var created = 0;
      for (var ci = 0; ci < checkedClusterIdx.length; ci++) {
        var cluster = clusters[checkedClusterIdx[ci]];
        if (!cluster || !cluster.name) continue;
        createCluster({
          name: cluster.name,
          hub_id: hub.id,
          description: cluster.description || '',
          keywords: Array.isArray(cluster.keywords) ? cluster.keywords.slice() : []
        });
        created++;
      }

      logActivity('hub_created', hub.id, hub.name, 'Quick-added from AI suggestion with ' + created + ' cluster' + (created === 1 ? '' : 's'));
      buildMaps(); syncToTextarea();
      closeModal();
      S.selectedHubId = hub.id;
      navigate('hubs');
      toast('Hub "' + hub.name + '" + ' + created + ' cluster' + (created === 1 ? '' : 's') + ' added', 'success');
    });

    // Refine-in-Wizard: open the New Hub Wizard pre-filled at Step 2 so the
    // user can tweak details + clusters before commit. Hands the suggestion
    // object off to the wizard; the wizard owns all creation from there.
    $(document).off('click' + ns + '-hsrw').on('click' + ns + '-hsrw', '[data-action="hub-suggest-refine"]', function() {
      var idx = parseInt($(this).data('hub-idx'), 10);
      var suggestions = S._lastHubSuggestions || [];
      var h = suggestions[idx];
      if (!h || !h.name) { toast('Suggestion not found', 'error'); return; }
      if (typeof window._wcpOpenNewHubWizard !== 'function') {
        toast('New Hub Wizard not loaded yet', 'warning');
        return;
      }
      closeModal();
      window._wcpOpenNewHubWizard({ prefill: h });
    });

    // ── Adopt content suggestion ──
    //
    // Called from the cluster "Suggest content" modal and the calendar
    // modal. Carries through the full idea payload:
    //   - title, hub_id, cluster_id
    //   - search_intent → basic_info.search_intent
    //   - content_type (name) → matched against S.data.content_types
    //   - keywords[] → new keyword group linked to the created content
    //     (so it shows up on the content + flows into the export JSON)
    $(document).off('click' + ns + '-as2').on('click' + ns + '-as2', '[data-action="adopt-suggestion"]', function() {
      var $btn = $(this);
      var title = $btn.data('title');
      var clusterId = $btn.data('cluster') || '';
      var hubId = $btn.data('hub') || '';
      var sid = ($btn.data('sid') || '').toString();
      var intent = ($btn.data('intent') || '').toString();
      var typeName = ($btn.data('type') || '').toString();
      var kwRaw = $btn.data('keywords');
      if (!title) return;

      // Parse keywords — jQuery's data() will auto-parse JSON if the
      // attribute value looks like JSON, so kwRaw may already be an array.
      var keywords = [];
      if (Array.isArray(kwRaw)) keywords = kwRaw.slice();
      else if (typeof kwRaw === 'string' && kwRaw) {
        try { var parsed = JSON.parse(kwRaw); if (Array.isArray(parsed)) keywords = parsed; } catch (e) {}
      }

      snapshot('Before adopt suggestion');
      var cnt = createContent({ title: title, hub_id: hubId, cluster_id: clusterId });

      // Apply intent + type + linked keyword group
      cnt.basic_info = cnt.basic_info || {};
      if (intent) cnt.basic_info.search_intent = intent;
      if (typeName) {
        var matched = (S.data.content_types || []).find(function(t) { return (t.name || '').toLowerCase() === typeName.toLowerCase(); });
        if (matched) cnt.content_type_id = matched.id;
      }
      // Create & link a keyword group from the suggested keywords so they
      // appear on the content record and in the exported JSON.
      if (keywords.length) {
        var now = new Date().toISOString();
        var grp = {
          id: generateId('kwg'),
          name: title,
          intent: intent || '',
          search_intent: intent || 'informational',
          keywords: keywords.map(function(k) { return { keyword: String(k), volume: 0, difficulty: '' }; }),
          primary_keyword_index: 0,
          content_id: cnt.id,
          hub_id: hubId,
          cluster_id: clusterId,
          source_session_id: '',
          notes: 'Created from AI cluster suggestion',
          created: now,
          updated: now
        };
        S.data.keyword_groups = S.data.keyword_groups || [];
        S.data.keyword_groups.push(grp);
        logActivity('content_created', cnt.id, cnt.title, 'Adopted idea + linked keyword group (' + keywords.length + ' kws)');
      }

      // If this came from the Suggestions panel (sid present), flip the
      // suggestion to "used" and re-render the panel in place — keeps the
      // user in context so they can adopt more without regenerating.
      var fromPanel = !!sid;
      if (sid && clusterId) {
        var cl = S.clusterMap[clusterId];
        if (cl && Array.isArray(cl.ai_suggestions)) {
          for (var si = 0; si < cl.ai_suggestions.length; si++) {
            if (cl.ai_suggestions[si].id === sid) {
              cl.ai_suggestions[si].used_content_id = cnt.id;
              break;
            }
          }
        }
      }

      buildMaps(); syncToTextarea();
      if (fromPanel && window._wcpRefreshClusterSuggestionsPanel) {
        // Re-render the hubs view in the background so the "N suggestions"
        // badge count updates, but leave the modal open for further adopts.
        render();
        window._wcpRefreshClusterSuggestionsPanel(clusterId);
      } else {
        render();
        closeModal();
      }
      toast('Adopted: ' + truncate(title, 40), 'success');
    });

    // Delete a single cluster suggestion from the panel.
    $(document).off('click' + ns + '-csd').on('click' + ns + '-csd', '[data-action="cluster-suggest-delete"]', function() {
      var $btn = $(this);
      var clusterId = $btn.data('cluster');
      var sid = $btn.data('sid');
      if (!clusterId || !sid) return;
      var cl = S.clusterMap[clusterId]; if (!cl || !Array.isArray(cl.ai_suggestions)) return;
      cl.ai_suggestions = cl.ai_suggestions.filter(function(s) { return s.id !== sid; });
      cl.updated = new Date().toISOString();
      buildMaps(); syncToTextarea();
      if (window._wcpRefreshClusterSuggestionsPanel) window._wcpRefreshClusterSuggestionsPanel(clusterId);
      render();
    });

    // Clear ALL suggestions for a cluster (both used and unused). The legacy
    // ai_suggested_titles stash is NOT cleared so regenerations still dedup
    // against previously-generated titles.
    $(document).off('click' + ns + '-csc').on('click' + ns + '-csc', '[data-action="cluster-suggest-clear"]', function() {
      var $btn = $(this);
      var clusterId = $btn.data('cluster');
      if (!clusterId) return;
      var cl = S.clusterMap[clusterId]; if (!cl) return;
      if (!confirm('Clear all ' + (cl.ai_suggestions || []).length + ' suggestions for "' + cl.name + '"? This cannot be undone.')) return;
      cl.ai_suggestions = [];
      cl.updated = new Date().toISOString();
      buildMaps(); syncToTextarea();
      if (window._wcpRefreshClusterSuggestionsPanel) window._wcpRefreshClusterSuggestionsPanel(clusterId);
      render();
    });

    // Generate more ideas from within the panel (append, dedup).
    $(document).off('click' + ns + '-csm').on('click' + ns + '-csm', '[data-action="cluster-suggest-more"]', function() {
      var clusterId = $(this).data('cluster'); if (!clusterId) return;
      var cl = S.clusterMap[clusterId]; if (!cl) return;
      if (window._wcpRunClusterSuggestionGeneration) {
        window._wcpRunClusterSuggestionGeneration(cl, {
          onComplete: function() { if (window._wcpRefreshClusterSuggestionsPanel) window._wcpRefreshClusterSuggestionsPanel(clusterId); }
        });
      }
    });

    // Open the content that a used suggestion became.
    $(document).off('click' + ns + '-cso').on('click' + ns + '-cso', '[data-action="cluster-suggest-open-used"]', function() {
      var id = $(this).data('content'); if (!id) return;
      S.selectedContentId = id;
      closeModal();
      navigate('content');
    });

    // ── Import/Export ──
    $(document).off('click' + ns + '-exp').on('click' + ns + '-exp', '[data-action="export-json"]', function() { exportWorkspace(); });
    $(document).off('click' + ns + '-imp').on('click' + ns + '-imp', '[data-action="import-json"]', function() { importWorkspace(); });

    // ── LLM Config Reload ──
    $(document).off('click' + ns + '-llm-reload').on('click' + ns + '-llm-reload', '[data-action="reload-llm-config"]', function() {
      LLMService.reload();
      toast(LLMService.isConfigured() ? 'AI config reloaded — ' + LLMService.getActiveProviders().length + ' provider(s)' : 'AI config reload attempted — check diagnostics', LLMService.isConfigured() ? 'success' : 'warning');
      render();
    });

    console.log('[WCP] Part 2B events initialized');
  }

  function setupKeyboardShortcuts() {
    // Additional shortcuts beyond Part 2A's Ctrl+Z/Y and Escape
    $(document).off('keydown.wcp2b-kb').on('keydown.wcp2b-kb', function(e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        // Ctrl+S → save (trigger Drupal form submit)
        if (e.key === 's') {
          e.preventDefault();
          syncToTextarea();
          if (S.$submitBtn && S.$submitBtn.length) S.$submitBtn.trigger('click');
          toast('Saving...', 'info');
        }
      }
    });
  }

