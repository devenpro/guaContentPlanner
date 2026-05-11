  // ============================================================
  // SECTION 2b: AI PREFLIGHT MODAL
  // ============================================================
  // Single shared modal that fronts every AI action. Lets the user
  // confirm/change provider + model and append custom instructions
  // BEFORE the AI call fires. On Run, persists the choice via
  // LLMService.savePreferenceWithInstructions (which also updates the
  // global appDefault) and forwards to callAIWithRetry.
  //
  // Usage:
  //   _wcpAIPreflight.run({
  //     actionId:    'ai-suggest-tags',          // required
  //     title:       'Suggest content tags',     // shown in modal header
  //     description: 'AI will generate tags...', // optional one-liner
  //     basePrompt:  prompt,                     // required
  //     systemPrompt: '',                        // optional
  //     onResult: function(text) { ... },        // success
  //     onError:  function(err)  { ... }         // optional
  //   });

  var AIPreflight = (function() {

    function _esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function _renderProviderSelect(currentPid) {
      var provs = LLMService.getActiveProviders();
      var items = provs.map(function(p) { return { id: p.id, label: p.label || p.id }; });
      return _wcpSelect.render({
        name: '_aiPreflightProvider',
        dataPath: '',                         // empty → no auto-save into S
        value: currentPid,
        placeholder: 'Choose provider…',
        items: items,
        allowEmpty: false,
        extraClass: 'wcp-aipf-provider-mselect'
      });
    }

    function _renderModelSelect(providerId, currentMid) {
      var models = LLMService.getActiveModels(providerId) || [];
      var items = models.map(function(m) {
        return {
          id: m.id,
          label: m.label || m.id,
          description: 'T:' + (m.temperature !== undefined ? m.temperature : '1.0') + ' / ' + (m.max_tokens || 8192) + ' tokens'
        };
      });
      return _wcpSelect.render({
        name: '_aiPreflightModel',
        dataPath: '',
        value: currentMid,
        placeholder: 'Choose model…',
        items: items,
        allowEmpty: false,
        extraClass: 'wcp-aipf-model-mselect'
      });
    }

    function _readProvider() {
      return $('.wcp-aipf-provider-mselect .wcp-mselect-native').val() || '';
    }

    function _readModel() {
      return $('.wcp-aipf-model-mselect .wcp-mselect-native').val() || '';
    }

    function _readInstructions() {
      return $('.wcp-ai-preflight-instructions').val() || '';
    }

    function _initialInstructions(actionId) {
      var prefs = (S.meta && S.meta.aiPreferences) || {};
      var pa = (prefs.perAction || {})[actionId || ''];
      if (pa && pa.instructions) return pa.instructions;
      return prefs.defaultInstructions || '';
    }

    function _buildBody(opts, sel, instr) {
      var html = '<div class="wcp-ai-preflight">';
      if (opts.description) {
        html += '<div class="wcp-ai-preflight-desc">' + _esc(opts.description) + '</div>';
      }
      html += '<div class="wcp-form-row">';
      html += '<div class="wcp-form-half"><label class="wcp-form-label">AI Provider</label>';
      html += '<div class="wcp-aipf-provider-host">' + _renderProviderSelect(sel ? sel.provider : '') + '</div></div>';
      html += '<div class="wcp-form-half"><label class="wcp-form-label">Model</label>';
      html += '<div class="wcp-aipf-model-host">' + _renderModelSelect(sel ? sel.provider : '', sel ? sel.model : '') + '</div></div>';
      html += '</div>';
      html += '<div class="wcp-form-group">';
      html += '<label class="wcp-form-label">Custom Instructions <span class="wcp-form-hint">(optional — appended to the prompt)</span></label>';
      html += '<textarea class="wcp-textarea wcp-ai-preflight-instructions" rows="4" placeholder="e.g. Focus on B2B SaaS audience. Keep tone professional. Avoid jargon.">' + _esc(instr) + '</textarea>';
      html += '</div>';
      html += '</div>';
      return html;
    }

    function _bindProviderChange() {
      var ns = '.wcpAIPreflight';
      $(document).off('change' + ns).on('change' + ns, '.wcp-aipf-provider-mselect .wcp-mselect-native', function() {
        var pid = $(this).val();
        var models = LLMService.getActiveModels(pid) || [];
        var firstId = models.length ? models[0].id : '';
        $('.wcp-aipf-model-host').html(_renderModelSelect(pid, firstId));
      });
    }

    function _unbind() {
      $(document).off('.wcpAIPreflight');
    }

    function run(opts) {
      opts = opts || {};
      var actionId = opts.actionId || '';
      var basePrompt = opts.basePrompt || '';
      var onResult = typeof opts.onResult === 'function' ? opts.onResult : function() {};
      var onError = typeof opts.onError === 'function' ? opts.onError : function(e) { console.warn('[WCP] AI error:', e); if (typeof toast === 'function') toast('AI error: ' + e, 'error'); };

      if (!LLMService.isConfigured()) {
        if (typeof toast === 'function') toast('No AI providers configured. Configure in Settings → AI.', 'warning');
        return;
      }

      var sel = LLMService.resolveSelection(actionId);
      var instr = _initialInstructions(actionId);
      var body = _buildBody(opts, sel, instr);

      openModal(opts.title || 'Run AI', body, {
        size: 'md',
        saveLabel: '<span class="wcp-aipf-run-icon">' + (typeof icon === 'function' ? icon('sparkles') : '') + '</span> Run AI',
        onSave: function() {
          var pid = _readProvider();
          var mid = _readModel();
          if (!pid || !mid) {
            if (typeof toast === 'function') toast('Pick a provider and a model first', 'warning');
            return;
          }
          var instructions = _readInstructions();
          LLMService.savePreferenceWithInstructions(actionId, pid, mid, instructions);
          var finalPrompt = basePrompt;
          if (instructions && instructions.trim()) {
            finalPrompt = basePrompt + '\n\n--- Additional user instructions ---\n' + instructions.trim();
          }
          closeModal();
          _unbind();
          // Hand off to existing retry wrapper. callAI reads picker DOM by
          // actionId; the modal is gone, so it falls through to
          // resolveSelection(actionId) — which now returns the just-saved pref.
          callAIWithRetry(finalPrompt, onResult, onError, actionId, opts.systemPrompt || '');
        }
      });

      _bindProviderChange();
    }

    return { run: run };
  })();

  window._wcpAIPreflight = AIPreflight;

