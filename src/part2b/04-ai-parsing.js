  // ============================================================
  // SECTION 4: AI RESPONSE PARSING & RETRY WRAPPER
  // ============================================================

  function parseJSON(text) {
    if (!text || !text.trim()) throw new Error('Empty AI response');
    try { return JSON.parse(text); } catch(e) {}
    var cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    try { return JSON.parse(cleaned); } catch(e) {}
    var objStr = extractBraceBlock(cleaned, '{', '}');
    if (objStr) { try { return JSON.parse(objStr); } catch(e) {} }
    var arrStr = extractBraceBlock(cleaned, '[', ']');
    if (arrStr) { try { return JSON.parse(arrStr); } catch(e) {} }
    if (objStr) { var relaxed = objStr.replace(/,\s*([}\]])/g, '$1'); try { return JSON.parse(relaxed); } catch(e) {} }
    throw new Error('Could not parse AI response as JSON');
  }

  function extractBraceBlock(text, openChar, closeChar) {
    var start = text.indexOf(openChar); if (start === -1) return null;
    var depth = 0, inStr = false, escaped = false;
    for (var i = start; i < text.length; i++) {
      var ch = text[i]; if (escaped) { escaped = false; continue; } if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; } if (inStr) continue;
      if (ch === openChar) depth++; if (ch === closeChar) { depth--; if (depth === 0) return text.substring(start, i + 1); }
    }
    return null;
  }

  function callAIWithRetry(prompt, onSuccess, onError, actionId, systemPrompt) {
    LLMService.callAI(prompt, function(text) {
      try { onSuccess(text); } catch(e) {
        console.warn('[WCP] AI parse failed (attempt 1), retrying. Error:', e.message, '\n--- AI returned ---\n', text);
        var retryPrompt = prompt + '\n\nCRITICAL: Respond with ONLY valid JSON. No markdown, no code fences.';
        toast('AI returned malformed JSON — retrying...', 'info');
        LLMService.callAI(retryPrompt, function(text2) {
          try { onSuccess(text2); }
          catch(e2) {
            // Both attempts failed to parse. Log the full text and surface a snippet so the user can see WHY.
            console.error('[WCP] AI parse failed (attempt 2). Error:', e2.message, '\n--- AI returned (attempt 1) ---\n', text, '\n--- AI returned (attempt 2) ---\n', text2);
            var snippet = (text2 || text || '').replace(/\s+/g, ' ').trim().slice(0, 120);
            var msg = 'AI format error: ' + e2.message + (snippet ? ' — Response started with: "' + snippet + (snippet.length >= 120 ? '…' : '') + '"' : '');
            toast(msg, 'error');
            if (onError) onError(msg);
          }
        }, function(err) {
          // HTTP error on retry — surface the real network/API error, not a format error.
          console.error('[WCP] AI retry HTTP error:', err);
          var msg = 'AI request failed on retry: ' + err;
          toast(msg, 'error');
          if (onError) onError(msg);
        }, actionId, systemPrompt);
      }
    }, function(err) {
      // First-attempt HTTP error — surface immediately, don't retry (likely API down / auth issue).
      console.error('[WCP] AI HTTP error:', err);
      if (onError) onError(err);
    }, actionId, systemPrompt);
  }

  // ── Intent dedup helper ──
  function deduplicateByIntent(ideas) {
    if (!ideas || ideas.length < 2) return ideas || [];
    // Build word sets from intent_summary or title as fallback
    var wordSets = ideas.map(function(idea) {
      var text = (idea.intent_summary || idea.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
      var words = text.split(/\s+/).filter(function(w) { return w.length > 2; }); // Skip tiny words
      return words;
    });
    for (var i = 0; i < ideas.length; i++) {
      if (ideas[i].possible_duplicate) continue;
      for (var j = i + 1; j < ideas.length; j++) {
        if (ideas[j].possible_duplicate) continue;
        // Jaccard similarity on word sets
        var setA = wordSets[i], setB = wordSets[j];
        if (!setA.length || !setB.length) continue;
        var intersection = 0;
        for (var k = 0; k < setA.length; k++) {
          if (setB.indexOf(setA[k]) !== -1) intersection++;
        }
        var union = setA.length + setB.length - intersection;
        var similarity = union > 0 ? intersection / union : 0;
        if (similarity >= 0.6) {
          ideas[j].possible_duplicate = true;
        }
      }
    }
    return ideas;
  }

  // ── Intent color helper (used by intent-first cards) ──
  function _intentColor(searchIntent) {
    var map = {
      'informational': 'var(--wcp-hub)',
      'commercial':    'var(--wcp-accent)',
      'transactional': 'var(--wcp-success)',
      'navigational':  'var(--wcp-warning)'
    };
    return map[searchIntent] || 'var(--wcp-text-muted)';
  }

