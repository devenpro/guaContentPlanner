  // --- Keyword Group Helpers ---
  function getContentKeywordGroups(contentId) {
    return (S.data.keyword_groups || []).filter(function(g) { return g.content_id === contentId; });
  }
  function getHubKeywordGroups(hubId) {
    return (S.data.keyword_groups || []).filter(function(g) { return g.hub_id === hubId; });
  }
  function getUnlinkedKeywordGroups() {
    return (S.data.keyword_groups || []).filter(function(g) { return !g.content_id; });
  }

