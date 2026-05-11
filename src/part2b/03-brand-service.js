  // ============================================================
  // SECTION 3: BrandService
  // ============================================================

  var BrandService = (function() {
    var _parsed = {}, _identity = { name: '', id: '', logoUrl: '' };
    var CONTEXT_DIVS = { core: '.brand-core-data', content: '.brand-content-data', seo: '.brand-seo-data' };

    function init() {
      _parsed = {};
      var $wrap = $('.brand-data');
      if ($wrap.length) _identity = { name: ($wrap.find('.brand-name').text() || '').trim(), id: ($wrap.find('.brand-id').text() || '').trim(), logoUrl: ($wrap.find('.brand-logo-url').text() || '').trim() };
      for (var type in CONTEXT_DIVS) {
        var $div = $(CONTEXT_DIVS[type]);
        if ($div.length) { var text = $div.text().trim(); if (text) { try { _parsed[type] = JSON.parse(text); } catch(e) { _parsed[type] = null; } } }
      }
      S.brand = { configured: Object.keys(_parsed).filter(function(k) { return _parsed[k]; }).length > 0, identity: _identity, core: _parsed.core || null, content: _parsed.content || null, seo: _parsed.seo || null };
      console.log('[WCP] BrandService: ' + (_identity.name || 'none') + ', contexts: ' + Object.keys(_parsed).filter(function(k) { return _parsed[k]; }).join(', '));
    }

    function isConfigured() { return S.brand && S.brand.configured; }
    function getCore() { return _parsed.core || {}; }
    function getContent() { return _parsed.content || {}; }
    function getSeo() { return _parsed.seo || {}; }
    function getAudience() { return (_parsed.core || {}).audience || {}; }
    function getForbiddenWords() { return (_parsed.core || {}).forbidden_words || []; }
    function getDos() { return (_parsed.core || {}).dos || []; }
    function getDonts() { return (_parsed.core || {}).donts || []; }

    function getSystemPrompt(contextType) {
      if (!isConfigured()) return '';
      var core = _parsed.core || {}; var parts = [];
      var brandName = core.brand_name || _identity.name || 'this brand';
      parts.push('You are an expert SEO content strategist for ' + brandName + '.');
      if (core.tagline) parts.push('Tagline: ' + core.tagline);
      if (core.brand_voice) parts.push('Voice: ' + core.brand_voice);
      if (core.audience) { var aud = core.audience; if (aud.primary) parts.push('Audience: ' + aud.primary); if (aud.pain_points) parts.push('Pain points: ' + (Array.isArray(aud.pain_points) ? aud.pain_points.join('; ') : aud.pain_points)); }
      if (core.forbidden_words && core.forbidden_words.length) parts.push('FORBIDDEN WORDS: ' + core.forbidden_words.join(', '));
      if ((contextType === 'content' || contextType === 'research') && _parsed.content) { var cnt = _parsed.content; if (cnt.writing_style) parts.push('Writing style: ' + cnt.writing_style); if (cnt.cta_style) parts.push('CTA style: ' + cnt.cta_style); }
      if ((contextType === 'seo' || contextType === 'research') && _parsed.seo) { var seo = _parsed.seo; if (seo.niche) parts.push('Niche: ' + seo.niche); if (seo.keyword_clusters && seo.keyword_clusters.length) parts.push('Keyword clusters: ' + seo.keyword_clusters.slice(0, 5).join(', ')); if (seo.content_gaps) parts.push('Content gaps: ' + (Array.isArray(seo.content_gaps) ? seo.content_gaps.join(', ') : seo.content_gaps)); }
      if (core.dos && core.dos.length) parts.push('ALWAYS: ' + core.dos.slice(0, 6).join('; '));
      if (core.donts && core.donts.length) parts.push('NEVER: ' + core.donts.slice(0, 6).join('; '));
      return parts.join('\n');
    }

    return { init: init, isConfigured: isConfigured, getSystemPrompt: getSystemPrompt, getCore: getCore, getContent: getContent, getSeo: getSeo, getAudience: getAudience, getForbiddenWords: getForbiddenWords, getDos: getDos, getDonts: getDonts };
  })();

