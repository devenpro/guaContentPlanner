  function wizardAISuggestBrand() {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var sd = wizardGetSD();
    wizardSaveStepData();
    var name = sd.workspaceName || sd.brandOverrides && sd.brandOverrides.brand_name || '';
    var prompt = 'Suggest brand profile details for a content planning workspace.\n';
    if (name) prompt += 'Brand/workspace name: ' + name + '\n';
    if (sd.brandOverrides && sd.brandOverrides.industry) prompt += 'Industry: ' + sd.brandOverrides.industry + '\n';
    prompt += brandSnippet('research');
    prompt += '\n\nSuggest missing brand profile fields.\nRespond ONLY as JSON: {"brand_name":"...","industry":"...","target_audience":"...","brand_voice":"...","writing_style":"...","content_pillars":"comma-separated pillars"}';
    _wcpAIPreflight.run({
      actionId: 'wizard-ai-brand',
      title: 'Suggest brand details',
      description: 'AI will fill any missing brand profile fields.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('content'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var bo = sd.brandOverrides || {};
        if (parsed.brand_name && !bo.brand_name) bo.brand_name = parsed.brand_name;
        if (parsed.industry && !bo.industry) bo.industry = parsed.industry;
        if (parsed.target_audience && !bo.target_audience) bo.target_audience = parsed.target_audience;
        if (parsed.brand_voice && !bo.brand_voice) bo.brand_voice = parsed.brand_voice;
        if (parsed.writing_style && !bo.writing_style) bo.writing_style = parsed.writing_style;
        if (parsed.content_pillars && !bo.content_pillars) bo.content_pillars = parsed.content_pillars;
        sd.brandOverrides = bo;
        S.meta.workspace.setupData = sd;
        syncToTextarea();
        render();
        toast('Brand suggestions applied — review and adjust', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function wizardAISuggestHubs() {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    wizardSaveStepData();
    var sd = wizardGetSD();
    var prompt = 'Suggest content hub topics for a website content strategy.\n';
    if (sd.brandOverrides && sd.brandOverrides.brand_name) prompt += 'Brand: ' + sd.brandOverrides.brand_name + '\n';
    if (sd.brandOverrides && sd.brandOverrides.industry) prompt += 'Industry: ' + sd.brandOverrides.industry + '\n';
    if (sd.brandOverrides && sd.brandOverrides.target_audience) prompt += 'Audience: ' + sd.brandOverrides.target_audience + '\n';
    var existingNames = (sd.contentHubs || []).map(function(h) { return h.name; }).filter(Boolean);
    if (existingNames.length) prompt += 'Existing hubs: ' + existingNames.join(', ') + '\n';
    prompt += brandSnippet('research');
    prompt += '\n\nSuggest 4-6 content hub topics with pillar keywords.\nRespond ONLY as JSON: {"hubs":[{"name":"Hub Name","description":"Brief description","pillar_keyword":"main keyword"}]}';
    _wcpAIPreflight.run({
      actionId: 'wizard-ai-hubs',
      title: 'Suggest content hubs',
      description: 'AI will propose 4-6 hub topics with pillar keywords.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('research'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var suggested = parsed.hubs || [];
        sd.contentHubs = sd.contentHubs || [];
        for (var i = 0; i < suggested.length; i++) {
          if (!suggested[i].name) continue;
          var exists = sd.contentHubs.some(function(h) { return h.name && h.name.toLowerCase() === suggested[i].name.toLowerCase(); });
          if (exists) continue;
          var colorIdx = sd.contentHubs.length % Constants.HUB_COLORS.length;
          sd.contentHubs.push({
            name: suggested[i].name,
            description: suggested[i].description || '',
            pillar_keyword: suggested[i].pillar_keyword || '',
            color: Constants.HUB_COLORS[colorIdx].color
          });
        }
        S.meta.workspace.setupData = sd;
        syncToTextarea();
        render();
        toast('Added ' + suggested.length + ' hub suggestions', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function wizardAISuggestClusters(hubIdx) {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    wizardSaveStepData();
    var sd = wizardGetSD();
    var hub = (sd.contentHubs || [])[hubIdx];
    if (!hub || !hub.name) { toast('Name the hub first', 'warning'); return; }
    var prompt = 'Suggest content clusters (sub-topics) for this content hub.\n\nHub: ' + hub.name + '\n';
    if (hub.description) prompt += 'Description: ' + hub.description + '\n';
    if (hub.pillar_keyword) prompt += 'Pillar keyword: ' + hub.pillar_keyword + '\n';
    if (sd.brandOverrides && sd.brandOverrides.industry) prompt += 'Industry: ' + sd.brandOverrides.industry + '\n';
    prompt += brandSnippet('research');
    prompt += '\n\nSuggest 4-6 clusters.\nRespond ONLY as JSON: {"clusters":[{"name":"Cluster Name"}]}';
    _wcpAIPreflight.run({
      actionId: 'wizard-ai-clusters',
      title: 'Suggest clusters',
      description: 'AI will suggest 4-6 sub-topic clusters for hub "' + (hub.name || '') + '".',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('research'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        var suggested = parsed.clusters || [];
        sd.contentClusters = sd.contentClusters || [];
        var existing = sd.contentClusters.filter(function(c) { return c.hub_index === hubIdx; }).map(function(c) { return (c.name || '').toLowerCase(); });
        for (var i = 0; i < suggested.length; i++) {
          if (!suggested[i].name) continue;
          if (existing.indexOf(suggested[i].name.toLowerCase()) !== -1) continue;
          sd.contentClusters.push({ name: suggested[i].name, hub_index: hubIdx, keywords: [] });
        }
        S.meta.workspace.setupData = sd;
        syncToTextarea();
        render();
        toast('Added cluster suggestions for ' + hub.name, 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function wizardAISuggestTypes() {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    wizardSaveStepData();
    var sd = wizardGetSD();
    var defaultTypes = (window._wcpGetDefaultContentTypes || function() { return []; })();
    var existingNames = defaultTypes.map(function(t) { return t.name; }).join(', ');
    var prompt = 'Suggest additional content types for a content planning workspace.\n';
    if (sd.brandOverrides && sd.brandOverrides.industry) prompt += 'Industry: ' + sd.brandOverrides.industry + '\n';
    prompt += 'Existing types: ' + existingNames + '\n';
    prompt += brandSnippet('content');
    prompt += '\n\nSuggest 2-3 additional content types that complement the existing ones.\nRespond ONLY as JSON: {"types":[{"name":"Type Name","description":"Brief description","icon":"font-awesome-icon-name","color":"#hex"}]}';
    _wcpAIPreflight.run({
      actionId: 'wizard-ai-types',
      title: 'Suggest content types',
      description: 'AI will propose 2-3 additional content types complementing the defaults.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('content'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        sd.customTypes = sd.customTypes || [];
        var suggested = parsed.types || [];
        for (var i = 0; i < suggested.length; i++) {
          if (!suggested[i].name) continue;
          sd.customTypes.push({
            id: generateId('ct'),
            name: suggested[i].name,
            description: suggested[i].description || '',
            icon: suggested[i].icon || 'file',
            color: suggested[i].color || '#80868b'
          });
        }
        S.meta.workspace.setupData = sd;
        syncToTextarea();
        render();
        toast('Added ' + suggested.length + ' type suggestions', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function wizardAISuggestSEOGoals() {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    wizardSaveStepData();
    var sd = wizardGetSD();
    var prompt = 'Suggest realistic 6-month SEO goals for a content strategy.\n';
    if (sd.brandOverrides && sd.brandOverrides.industry) prompt += 'Industry: ' + sd.brandOverrides.industry + '\n';
    if (sd.seoGoals && sd.seoGoals.da_current) prompt += 'Current DA: ' + sd.seoGoals.da_current + '\n';
    if (sd.seoGoals && sd.seoGoals.traffic_current) prompt += 'Current monthly traffic: ' + sd.seoGoals.traffic_current + '\n';
    var hubCount = (sd.contentHubs || []).length;
    if (hubCount) prompt += 'Planned content hubs: ' + hubCount + '\n';
    prompt += brandSnippet('seo');
    prompt += '\n\nSuggest realistic targets.\nRespond ONLY as JSON: {"monthly_target":8,"da_target":40,"traffic_target":25000,"keywords_target":50}';
    _wcpAIPreflight.run({
      actionId: 'wizard-ai-seo',
      title: 'Suggest SEO goals',
      description: 'AI will propose realistic 6-month SEO targets.',
      basePrompt: prompt,
      systemPrompt: BrandService.getSystemPrompt('seo'),
      onResult: function(text) {
        var parsed = parseJSON(text);
        sd.seoGoals = sd.seoGoals || {};
        if (parsed.monthly_target) sd.seoGoals.monthly_target = parsed.monthly_target;
        if (parsed.da_target) sd.seoGoals.da_target = parsed.da_target;
        if (parsed.traffic_target) sd.seoGoals.traffic_target = parsed.traffic_target;
        if (parsed.keywords_target) sd.seoGoals.keywords_target = parsed.keywords_target;
        S.meta.workspace.setupData = sd;
        syncToTextarea();
        render();
        toast('SEO goal suggestions applied', 'success');
      },
      onError: function(err) { toast('AI Error: ' + err, 'error'); }
    });
  }

  function wizardAITestConnection() {
    if (!LLMService.isConfigured()) { toast('No AI providers configured', 'warning'); return; }
    var $btn = $('[data-action="wizard-ai-test"]');
    $btn.prop('disabled', true).html(icon('spinner') + ' Testing...');
    var $result = $('#wizardAITestResult');
    $result.html('');
    LLMService.callAI('Respond with exactly this JSON: {"success":true,"message":"Hello from AI!"}', function(text) {
      wizardGetSD().aiTested = true;
      // Provider/model already persisted to S.meta.aiPreferences.appDefault by the
      // inline-picker change handler (src/part2b/14-events.js calls savePreference
      // on every provider/model change). No need to mirror into setupData.
      syncToTextarea();
      $result.html('<div class="wcp-wizard-ai-test-result success">' + icon('check-circle') + ' AI connection verified! Response received successfully.</div>');
      $btn.prop('disabled', false).html(icon('bolt') + ' Send Test Prompt');
      toast('AI connection successful!', 'success');
    }, function(err) {
      $result.html('<div class="wcp-wizard-ai-test-result error">' + icon('circle-exclamation') + ' Connection failed: ' + esc(err) + '</div>');
      $btn.prop('disabled', false).html(icon('bolt') + ' Send Test Prompt');
      toast('AI test failed: ' + err, 'error');
    }, 'wizard-ai-test', '');
  }

  // ── Completion ──
