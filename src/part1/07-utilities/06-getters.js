  // --- Collection getters ---
  function getHubClusters(hubId) { return (S.data.clusters || []).filter(function(c) { return c.hub_id === hubId; }); }
  function getHubContent(hubId) { return (S.data.content || []).filter(function(c) { return c.hub_id === hubId; }); }
  function getClusterContent(clusterId) { return (S.data.content || []).filter(function(c) { return c.cluster_id === clusterId; }); }
  function getContentType(typeId) { return S.contentTypeMap[typeId] || null; }
  function getTemplate(templateId) { return S.templateMap[templateId] || null; }
  function resolveTag(id) { return S.tagMap[id] || null; }
  function getRecentActivity(n) { return (S.activity || []).slice(-(n || 15)).reverse(); }
  function getAllTags() { return (S.data.tags || []).slice().sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); }); }

