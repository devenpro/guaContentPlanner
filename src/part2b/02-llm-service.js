  // ============================================================
  // SECTION 2: LLMService
  // ============================================================

  var AI_ENDPOINTS = {
    'gemini': 'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent',
    'claude': 'https://api.anthropic.com/v1/messages',
    'openai': 'https://api.openai.com/v1/chat/completions',
    'grok': 'https://api.x.ai/v1/chat/completions',
    'groq': 'https://api.groq.com/openai/v1/chat/completions',
    'nvidia': 'https://integrate.api.nvidia.com/v1/chat/completions',
    'huggingface': 'https://router.huggingface.co/v1/chat/completions',
    'openrouter': 'https://openrouter.ai/api/v1/chat/completions'
  };

  var LLMService = (function() {
    var _config = null, _providerMap = {}, _initialized = false;
    var _configSource = 'none', _retryAttempts = 0, _retryTimer = null, _lastError = null;
    var MAX_RETRIES = 10, RETRY_INTERVAL = 500;

    function _tryLoadRaw() {
      var $brand = $('.llm-brand-config-data'), $user = $('.llm-config-data'), raw = null;
      if ($brand.length) {
        try { raw = JSON.parse($brand.text().trim()); _configSource = 'brand'; console.log('[WCP] LLMService: Brand config parsed'); }
        catch(e) { _lastError = 'Brand config parse failed: ' + e.message; console.warn('[WCP] LLMService: ' + _lastError); }
      }
      if (!raw && $user.length) {
        try { raw = JSON.parse($user.text().trim()); _configSource = 'user'; console.log('[WCP] LLMService: User config parsed'); }
        catch(e) { _lastError = 'User config parse failed: ' + e.message; console.warn('[WCP] LLMService: ' + _lastError); }
      }
      return raw;
    }

    function _parseConfig(raw) {
      _providerMap = {};
      _config = raw;
      if (_config && _config.providers) {
        for (var i = 0; i < _config.providers.length; i++) {
          var p = _config.providers[i];
          if (!p.active) continue;
          var am = (p.models || []).filter(function(m) { return m.active; });
          if (!am.length) continue;
          _providerMap[p.id] = { id: p.id, label: p.label || p.id, api_key: p.api_key || '', activeModels: am };
          console.log('[WCP] LLMService: "' + (p.label || p.id) + '" → ' + am.length + ' model(s)');
        }
      }
      _initialized = true;
      var pids = Object.keys(_providerMap);
      if (pids.length) { var def = getDefault(); console.log('[WCP] LLMService: ' + pids.length + ' provider(s). Default: ' + (def ? def.provider + '/' + def.model : 'none')); }
    }

    function init() {
      _config = null; _providerMap = {}; _configSource = 'none'; _retryAttempts = 0; _lastError = null;
      if (_retryTimer) { clearInterval(_retryTimer); _retryTimer = null; }
      var raw = _tryLoadRaw();
      if (raw) {
        _parseConfig(raw);
        return;
      }
      // Start retry loop if initial load failed
      console.warn('[WCP] LLMService: No config found — starting retry (up to ' + MAX_RETRIES + ' attempts)');
      _initialized = true; // Mark initialized so app doesn't block, but no providers yet
      _retryTimer = setInterval(function() {
        _retryAttempts++;
        var retryRaw = _tryLoadRaw();
        if (retryRaw) {
          clearInterval(_retryTimer); _retryTimer = null;
          _parseConfig(retryRaw);
          console.log('[WCP] LLMService: Config loaded on retry #' + _retryAttempts);
          try { if (typeof updateAIStatusIndicator === 'function') updateAIStatusIndicator(); } catch(e) {}
          try { if (render) render(); } catch(e) {}
          return;
        }
        if (_retryAttempts >= MAX_RETRIES) {
          clearInterval(_retryTimer); _retryTimer = null;
          _lastError = _lastError || 'No .llm-config-data or .llm-brand-config-data element found after ' + MAX_RETRIES + ' retries';
          console.warn('[WCP] LLMService: Config loading failed after ' + MAX_RETRIES + ' retries — AI unavailable');
        }
      }, RETRY_INTERVAL);
    }

    function reload() {
      console.log('[WCP] LLMService: Manual reload triggered');
      init();
      // If loaded immediately (no retry needed), update UI
      if (isConfigured()) {
        try { if (typeof updateAIStatusIndicator === 'function') updateAIStatusIndicator(); } catch(e) {}
      }
    }

    function getDiagnostics() {
      return {
        initialized: _initialized,
        configSource: _configSource,
        providerCount: Object.keys(_providerMap).length,
        providers: getActiveProviders().map(function(p) { return { id: p.id, label: p.label, modelCount: p.activeModels.length }; }),
        retryAttempts: _retryAttempts,
        lastError: _lastError,
        brandDivExists: !!$('.llm-brand-config-data').length,
        userDivExists: !!$('.llm-config-data').length,
        retrying: !!_retryTimer
      };
    }

    function isConfigured() { return Object.keys(_providerMap).length > 0; }
    function getActiveProviders() { return Object.keys(_providerMap).map(function(id) { return _providerMap[id]; }); }
    function getActiveModels(pid) { var p = _providerMap[pid]; return p ? p.activeModels : []; }
    function _getModelObj(pid, mid) { var p = _providerMap[pid]; if (!p) return null; for (var i = 0; i < p.activeModels.length; i++) { if (p.activeModels[i].id === mid) return p.activeModels[i]; } return null; }
    function _buildSel(pid, model) { return { provider: pid, model: model.id, temperature: model.temperature !== undefined ? model.temperature : 1.0, max_tokens: model.max_tokens || 8192, top_p: model.top_p !== undefined ? model.top_p : 0.95, api_key: _providerMap[pid] ? _providerMap[pid].api_key : '' }; }

    function getDefault() {
      var provs = getActiveProviders(); if (!provs.length) return null;
      var appDef = S && S.meta && S.meta.aiPreferences && S.meta.aiPreferences.appDefault;
      if (appDef && appDef.provider && appDef.model) { var ma = _getModelObj(appDef.provider, appDef.model); if (ma) return _buildSel(appDef.provider, ma); }
      if (_config && _config.default_provider && _config.default_model) { var m = _getModelObj(_config.default_provider, _config.default_model); if (m) return _buildSel(_config.default_provider, m); }
      var p = provs[0]; var defM = null; for (var i = 0; i < p.activeModels.length; i++) { if (p.activeModels[i].is_default) { defM = p.activeModels[i]; break; } }
      return _buildSel(p.id, defM || p.activeModels[0]);
    }

    function resolveSelection(actionId) {
      var prefs = S.meta.aiPreferences || {};
      var pa = (prefs.perAction || {})[actionId || ''];
      if (pa && pa.provider && pa.model) { var m = _getModelObj(pa.provider, pa.model); if (m) return _buildSel(pa.provider, m); }
      if (prefs.lastProvider && prefs.lastModel) { var m2 = _getModelObj(prefs.lastProvider, prefs.lastModel); if (m2) return _buildSel(prefs.lastProvider, m2); }
      return getDefault();
    }

    function savePreference(actionId, pid, mid) {
      S.meta.aiPreferences = S.meta.aiPreferences || {}; S.meta.aiPreferences.perAction = S.meta.aiPreferences.perAction || {};
      S.meta.aiPreferences.lastProvider = pid; S.meta.aiPreferences.lastModel = mid;
      // Last-picked provider/model also becomes the new global default (per user requirement).
      S.meta.aiPreferences.appDefault = { provider: pid, model: mid };
      if (actionId) {
        var _prev = S.meta.aiPreferences.perAction[actionId] || {};
        S.meta.aiPreferences.perAction[actionId] = { provider: pid, model: mid, instructions: _prev.instructions || '' };
      }
      syncToTextarea();
    }

    function savePreferenceWithInstructions(actionId, pid, mid, instructions) {
      S.meta.aiPreferences = S.meta.aiPreferences || {}; S.meta.aiPreferences.perAction = S.meta.aiPreferences.perAction || {};
      S.meta.aiPreferences.lastProvider = pid; S.meta.aiPreferences.lastModel = mid;
      S.meta.aiPreferences.appDefault = { provider: pid, model: mid };
      if (actionId) S.meta.aiPreferences.perAction[actionId] = { provider: pid, model: mid, instructions: instructions || '' };
      syncToTextarea();
    }

    function renderInlinePicker(actionId) {
      if (!isConfigured()) return '<span class="wcp-ai-not-configured">' + icon('warning') + ' <a href="#" data-action="go-view" data-view="settings" data-tab="ai" class="wcp-ai-config-link">Configure AI</a></span>';
      var sel = resolveSelection(actionId); var provs = getActiveProviders();
      var html = '<span class="wcp-ai-picker" data-action-id="' + esc(actionId) + '">';
      html += '<select class="wcp-select wcp-select-sm wcp-ai-provider-select" data-action-id="' + esc(actionId) + '">';
      for (var i = 0; i < provs.length; i++) html += '<option value="' + esc(provs[i].id) + '"' + (sel && sel.provider === provs[i].id ? ' selected' : '') + '>' + esc(provs[i].label) + '</option>';
      html += '</select>';
      var curProv = sel ? _providerMap[sel.provider] : provs[0]; var models = curProv ? curProv.activeModels : [];
      html += '<select class="wcp-select wcp-select-sm wcp-ai-model-select" data-action-id="' + esc(actionId) + '">';
      for (var j = 0; j < models.length; j++) html += '<option value="' + esc(models[j].id) + '"' + (sel && sel.model === models[j].id ? ' selected' : '') + ' data-temp="' + (models[j].temperature !== undefined ? models[j].temperature : 1.0) + '" data-tokens="' + (models[j].max_tokens || 8192) + '">' + esc(models[j].label) + '</option>';
      html += '</select></span>';
      return html;
    }

    function _getPickerSel(actionId) {
      var $p = $('.wcp-ai-provider-select[data-action-id="' + actionId + '"]');
      if (!$p.length) return resolveSelection(actionId);
      var pid = $p.val(), mid = $('.wcp-ai-model-select[data-action-id="' + actionId + '"]').val();
      var $opt = $('.wcp-ai-model-select[data-action-id="' + actionId + '"] option:selected');
      return { provider: pid, model: mid, temperature: parseFloat($opt.data('temp')) || 1.0, max_tokens: parseInt($opt.data('tokens'), 10) || 8192, top_p: 0.95, api_key: _providerMap[pid] ? _providerMap[pid].api_key : '' };
    }

    function callAI(prompt, onSuccess, onError, actionId, systemPrompt) {
      var cfg = _getPickerSel(actionId || '');
      if (!cfg || !cfg.api_key) { if (onError) onError('No AI providers configured.'); return; }
      var provider = cfg.provider, model = cfg.model, apiKey = cfg.api_key;
      var endpoint = AI_ENDPOINTS[provider]; if (!endpoint) { if (onError) onError('Unknown provider'); return; }
      systemPrompt = systemPrompt || '';
      var body, headers;
      switch (provider) {
        case 'gemini':
          endpoint = endpoint.replace('{MODEL}', model) + '?key=' + apiKey;
          headers = { 'Content-Type': 'application/json' };
          body = { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: cfg.max_tokens, temperature: cfg.temperature, topP: cfg.top_p, responseMimeType: 'application/json' } };
          if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] };
          break;
        case 'claude':
          headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
          body = { model: model, max_tokens: cfg.max_tokens, messages: [{ role: 'user', content: prompt }] };
          if (cfg.temperature !== undefined) body.temperature = cfg.temperature;
          if (systemPrompt) body.system = systemPrompt;
          break;
        default:
          headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
          if (provider === 'openrouter') { headers['HTTP-Referer'] = window.location.origin; headers['X-Title'] = 'Website Content Planner'; }
          body = { model: model, max_tokens: cfg.max_tokens, messages: [{ role: 'user', content: prompt }], temperature: cfg.temperature };
          if (systemPrompt) body.messages = [{ role: 'system', content: systemPrompt }].concat(body.messages);
          if (provider === 'groq' && body.temperature === 0) body.temperature = 0.01;
      }
      fetch(endpoint, { method: 'POST', headers: headers, body: JSON.stringify(body) })
        .then(function(res) { if (!res.ok) return res.text().then(function(t) { var m = 'API ' + res.status; try { m = JSON.parse(t).error.message || m; } catch(e) {} throw new Error(m); }); return res.json(); })
        .then(function(data) { var text = _extractText(provider, data); console.log('[WCP] AI (' + provider + '/' + model + '):', text.substring(0, 200)); if (actionId) savePreference(actionId, provider, model); if (onSuccess) onSuccess(text); })
        .catch(function(err) { console.error('[WCP] AI error:', err); if (onError) onError(err.message || 'Request failed'); });
    }

    function _extractText(provider, data) {
      try {
        if (provider === 'gemini') return data.candidates && data.candidates[0] && data.candidates[0].content ? data.candidates[0].content.parts.map(function(p) { return p.text || ''; }).join('') : JSON.stringify(data);
        if (provider === 'claude') return data.content ? data.content.filter(function(c) { return c.type === 'text'; }).map(function(c) { return c.text; }).join('') : '';
        return (data.choices && data.choices[0] && data.choices[0].message) ? data.choices[0].message.content || '' : '';
      } catch(e) { return JSON.stringify(data); }
    }

    return { init: init, reload: reload, getDiagnostics: getDiagnostics, isConfigured: isConfigured, getActiveProviders: getActiveProviders, getActiveModels: getActiveModels, getDefault: getDefault, resolveSelection: resolveSelection, savePreference: savePreference, savePreferenceWithInstructions: savePreferenceWithInstructions, renderInlinePicker: renderInlinePicker, callAI: callAI };
  })();

