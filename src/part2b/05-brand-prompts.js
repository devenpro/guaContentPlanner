  // ============================================================
  // SECTION 5: BRAND PROMPT HELPERS
  // ============================================================

  // Build a brand-context block to append to user prompts.
  //
  // `type` selects which slice of brand data is relevant for the action:
  //   research / angles  → audience, voice, content gaps
  //   content / headlines → writing style, CTA style, forbidden words
  //   seo / keywords     → keyword clusters, niche
  //   design             → full design guide markdown (visual / structural work)
  //
  // Every section honors the user-controlled toggles in
  // S.meta.settings.brand_context_enabled (core / content / seo / design_guide)
  // — so admins can mute parts of the brand context without losing the data.
  function brandSnippet(type) {
    if (!BrandService.isConfigured()) return '';
    var lines = [];
    var core    = BrandService.getCore();
    var aud     = BrandService.getAudience();
    var seo     = BrandService.getSeo();
    var coreOn  = BrandService.isContextEnabled('core');
    var cntOn   = BrandService.isContextEnabled('content');
    var seoOn   = BrandService.isContextEnabled('seo');
    var dgOn    = BrandService.isContextEnabled('design_guide');

    if (type === 'research' || type === 'angles') {
      if (coreOn) {
        if (aud.primary) lines.push('Target audience: ' + aud.primary);
        if (aud.pain_points) lines.push('Pain points: ' + (Array.isArray(aud.pain_points) ? aud.pain_points.join('; ') : aud.pain_points));
        if (core.brand_voice) lines.push('Brand voice: ' + core.brand_voice);
      }
      if (seoOn && seo.content_gaps) lines.push('Content gaps: ' + (Array.isArray(seo.content_gaps) ? seo.content_gaps.join(', ') : seo.content_gaps));
    }
    if (type === 'content' || type === 'headlines') {
      var cnt = BrandService.getContent();
      if (cntOn) {
        if (cnt.writing_style) lines.push('Writing style: ' + cnt.writing_style);
        if (cnt.cta_style) lines.push('CTA style: ' + cnt.cta_style);
      }
      if (coreOn && core.forbidden_words && core.forbidden_words.length) lines.push('NEVER use: ' + core.forbidden_words.join(', '));
    }
    if (type === 'seo' || type === 'keywords') {
      if (seoOn) {
        if (seo.keyword_clusters && seo.keyword_clusters.length) lines.push('Keyword clusters: ' + seo.keyword_clusters.slice(0, 5).join(', '));
        if (seo.niche) lines.push('Niche: ' + seo.niche);
      }
    }
    // Design block — full markdown, included verbatim. Kept as the last
    // section so it doesn't get truncated by an upstream prompt cap.
    if (dgOn) {
      var dg = BrandService.getDesignGuide();
      if (dg && (type === 'design' || type === 'content' || type === 'headlines' || type === 'research')) {
        lines.push('---\nDesign guide:\n' + dg);
      }
    }
    return lines.length ? '\n\nBrand context:\n' + lines.join('\n') : '';
  }

