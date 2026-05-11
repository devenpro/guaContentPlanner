  // ============================================================
  // SECTION 16: DATA SAVE HELPERS
  // ============================================================

  // All save logic is handled via event handlers calling saveContentField (Part 1)
  // and direct field mutations with buildMaps → syncToTextarea → render chain.

  // Clipboard fallback for browsers that don't support navigator.clipboard
  // (or where it's blocked by permissions). Returns true on success.
  function _fallbackCopyText(text) {
    try {
      var $ta = $('<textarea>').val(text).css({ position: 'fixed', left: '-9999px', top: 0 }).appendTo('body');
      $ta[0].select();
      var ok = document.execCommand('copy');
      $ta.remove();
      return ok;
    } catch (e) { return false; }
  }

  // ── Shared helpers used across steps ──

  function getSelectedContent() {
    return S.selectedContentId ? S.contentMap[S.selectedContentId] : null;
  }

  function setNestedValue(obj, path, value) {
    var parts = path.split('.');
    var target = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      target[parts[i]] = target[parts[i]] || {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
  }

  function getNestedValue(obj, path) {
    var parts = path.split('.');
    var target = obj;
    for (var i = 0; i < parts.length; i++) {
      if (target == null) return undefined;
      target = target[parts[i]];
    }
    return target;
  }

  function buildExportJson(content) {
    var ct  = S.contentTypeMap[content.content_type_id];
    var hub = S.hubMap[content.hub_id];
    var cl  = S.clusterMap[content.cluster_id];
    var bi  = content.basic_info || {};
    var r   = content.research || {};
    var exp = content.export || {};
    var settings = (S.meta && S.meta.settings) || {};
    var exportSettings = settings.export_to_cw || {};

    // Linked keyword group (if any) — find the first group whose content_id matches
    var linkedGroup = null;
    var allGroups = (S.data && S.data.keyword_groups) || [];
    for (var gi = 0; gi < allGroups.length; gi++) {
      if (allGroups[gi].content_id === content.id) { linkedGroup = allGroups[gi]; break; }
    }
    var primaryKeyword = '';
    var secondaryKeywords = [];
    if (linkedGroup && linkedGroup.keywords && linkedGroup.keywords.length) {
      var pi = linkedGroup.primary_keyword_index || 0;
      var primary = linkedGroup.keywords[pi] || linkedGroup.keywords[0];
      primaryKeyword = primary ? (primary.keyword || '') : '';
      for (var ki = 0; ki < linkedGroup.keywords.length; ki++) {
        if (ki !== pi) secondaryKeywords.push(linkedGroup.keywords[ki].keyword || '');
      }
    }

    // Internal links — pulled from the sitemap link ledger. Only committed
    // states (selected/exported/published) ship; rejected + transient
    // suggestions never reach the writer app. Sorted by (priority desc,
    // score desc) so the writer places highest-priority links first.
    var internalLinks = [];
    var sm = (S.data && S.data.sitemap) || { pages: [], links: [] };
    var pageMap = S.sitemapPageMap || {};
    var getPriority = (typeof window._wcpEffectivePriority === 'function') ? window._wcpEffectivePriority : function() { return 3; };
    var ledger = sm.links || [];
    for (var li2 = 0; li2 < ledger.length; li2++) {
      var lk = ledger[li2];
      if (lk.from_content_id !== content.id) continue;
      if (lk.state === 'rejected') continue;
      var targetPage = pageMap[lk.to_page_id];
      if (!targetPage) continue;
      internalLinks.push({
        url: targetPage.url,
        anchor_text: lk.anchor_text || '',
        reason: lk.reason || '',
        target_title: targetPage.title || '',
        priority: getPriority(targetPage),
        state: lk.state,
        score: lk.score || 0
      });
    }
    internalLinks.sort(function(a, b) {
      if (a.priority !== b.priority) return a.priority - b.priority;  // P1 (1) first
      return (b.score || 0) - (a.score || 0);
    });

    return {
      source: 'wcp',
      version: exp.export_version || '3',
      exported_at: new Date().toISOString(),
      content: {
        title: content.title || '',
        content_type: ct ? ct.name : '',
        cw_content_type: ct ? (ct.cw_content_type || '') : '',
        hub: hub ? hub.name : '',
        cluster: cl ? cl.name : '',
        target_audience: bi.audience || '',
        content_goal: bi.goal || '',
        word_count_target: bi.word_count_target || 0,
        search_intent: bi.search_intent || '',
        funnel_stage: bi.funnel_stage || '',
        content_depth: bi.content_depth || '',
        tone_of_voice: bi.tone_of_voice || '',
        published_url: content.published_url || '',
        angle: r.selected_angle || '',
        uvp: r.uvp || '',
        // Linked keyword group (set in Research view)
        keyword_group: linkedGroup ? {
          id: linkedGroup.id,
          name: linkedGroup.name,
          intent: linkedGroup.intent,
          search_intent: linkedGroup.search_intent,
          primary_keyword: primaryKeyword,
          secondary_keywords: secondaryKeywords
        } : null,
        internal_links: internalLinks
      },
      cw_landing_stage: exportSettings.cw_landing_stage || 'research'
    };
  }

