  // ============================================================
  // SECTION 5: BRAND PROMPT HELPERS
  // ============================================================

  function brandSnippet(type) {
    if (!BrandService.isConfigured()) return '';
    var lines = [], core = BrandService.getCore(), aud = BrandService.getAudience(), seo = BrandService.getSeo();
    if (type === 'research' || type === 'angles') {
      if (aud.primary) lines.push('Target audience: ' + aud.primary);
      if (aud.pain_points) lines.push('Pain points: ' + (Array.isArray(aud.pain_points) ? aud.pain_points.join('; ') : aud.pain_points));
      if (core.brand_voice) lines.push('Brand voice: ' + core.brand_voice);
      if (seo.content_gaps) lines.push('Content gaps: ' + (Array.isArray(seo.content_gaps) ? seo.content_gaps.join(', ') : seo.content_gaps));
    }
    if (type === 'content' || type === 'headlines') {
      var cnt = BrandService.getContent();
      if (cnt.writing_style) lines.push('Writing style: ' + cnt.writing_style);
      if (cnt.cta_style) lines.push('CTA style: ' + cnt.cta_style);
      if (core.forbidden_words && core.forbidden_words.length) lines.push('NEVER use: ' + core.forbidden_words.join(', '));
    }
    if (type === 'seo' || type === 'keywords') {
      if (seo.keyword_clusters && seo.keyword_clusters.length) lines.push('Keyword clusters: ' + seo.keyword_clusters.slice(0, 5).join(', '));
      if (seo.niche) lines.push('Niche: ' + seo.niche);
    }
    return lines.length ? '\n\nBrand context:\n' + lines.join('\n') : '';
  }

