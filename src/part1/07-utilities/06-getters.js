  // --- Collection getters ---
  function getHubClusters(hubId) { return (S.data.clusters || []).filter(function(c) { return c.hub_id === hubId; }); }
  function getHubContent(hubId) { return (S.data.content || []).filter(function(c) { return c.hub_id === hubId; }); }
  function getClusterContent(clusterId) { return (S.data.content || []).filter(function(c) { return c.cluster_id === clusterId; }); }
  function getContentType(typeId) { return S.contentTypeMap[typeId] || null; }
  function getTemplate(templateId) { return S.templateMap[templateId] || null; }
  function resolveTag(id) { return S.tagMap[id] || null; }
  function getRecentActivity(n) { return (S.activity || []).slice(-(n || 15)).reverse(); }
  function getAllTags() { return (S.data.tags || []).slice().sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); }); }
  function getImages(filters) {
    var imgs = S.images.slice();
    if (!filters) return imgs;
    if (filters.star) imgs = imgs.filter(function(img) { return img.star; });
    if (filters.category) imgs = imgs.filter(function(img) { return img.category === filters.category; });
    if (filters.search) {
      var q = filters.search.toLowerCase();
      imgs = imgs.filter(function(img) { return (img.filename || '').toLowerCase().indexOf(q) > -1 || (img.description || '').toLowerCase().indexOf(q) > -1; });
    }
    return imgs;
  }

