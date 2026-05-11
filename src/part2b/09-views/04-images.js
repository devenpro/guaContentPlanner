  // ============================================================
  // SECTION 12: IMAGES VIEW
  // ============================================================

  function renderImagesView() {
    if (!S || !icon || !getImages) return '<div class="wcp-view"><p>Images view not ready — please reload.</p></div>';
    var cats = (S.meta && S.meta.image_categories) || [];
    var imgs = getImages(S.imageFilter);

    var html = '<div class="wcp-view wcp-view-images">';
    html += '<div class="wcp-view-header"><div class="wcp-view-header-left"><h1>' + icon('images') + ' Reference Images</h1>';
    html += '<span class="wcp-view-subtitle">' + S.images.length + ' image' + (S.images.length !== 1 ? 's' : '') + '</span></div>';
    html += '<div class="wcp-view-header-right">';
    html += '<button class="wcp-btn wcp-btn-primary" data-action="upload-image">' + icon('upload') + ' Upload</button>';
    html += '</div></div>';

    // Filter bar
    html += '<div class="wcp-img-filters">';
    html += '<div class="wcp-search-wrapper"><span class="wcp-icon">' + icon('search') + '</span>';
    html += '<input type="text" class="wcp-input" id="wcpImgSearch" placeholder="Search images..." value="' + esc(S.imageFilter.search || '') + '" style="padding-left:30px"></div>';
    html += '<select class="wcp-select wcp-select-sm" id="wcpImgCategory"><option value="">All Categories</option>';
    for (var ci = 0; ci < cats.length; ci++) html += '<option value="' + esc(cats[ci].id) + '"' + (S.imageFilter.category === cats[ci].id ? ' selected' : '') + '>' + esc(cats[ci].label) + '</option>';
    html += '</select>';
    html += '<button class="wcp-btn wcp-btn-sm' + (S.imageFilter.star ? ' wcp-btn-primary' : ' wcp-btn-outline') + '" data-action="toggle-img-star-filter">' + icon('star') + ' Starred</button>';
    html += '</div>';

    // Gallery
    if (imgs.length === 0) {
      html += '<div class="wcp-empty-state" style="padding:var(--wcp-space-8)">';
      if (S.images.length === 0 && (!S.$imageField || !S.$imageField.length)) {
        html += '<div class="wcp-empty-state-icon">' + icon('triangle-exclamation') + '</div>';
        html += '<div class="wcp-empty-state-title">Image Field Not Found</div>';
        html += '<div class="wcp-empty-state-text">Add a <strong>field_images</strong> (Image, multi-value) field to your Website Content Planner content type in Drupal, then upload reference images on this node.</div>';
      } else if (S.images.length === 0) {
        html += '<div class="wcp-empty-state-icon">' + icon('images') + '</div>';
        html += '<div class="wcp-empty-state-title">No reference images yet</div>';
        html += '<div class="wcp-empty-state-text">Upload brand reference images for blog headers, infographics, and style guides.</div>';
        html += '<button class="wcp-btn wcp-btn-primary" data-action="upload-image">' + icon('upload') + ' Upload First Image</button>';
      } else {
        html += '<div class="wcp-empty-state-icon">' + icon('search') + '</div>';
        html += '<div class="wcp-empty-state-title">No matches</div>';
        html += '<div class="wcp-empty-state-text">Try adjusting your search or filters.</div>';
      }
      html += '</div>';
    } else {
      html += '<div class="wcp-img-grid">';
      for (var gi = 0; gi < imgs.length; gi++) {
        var img = imgs[gi];
        var cat = S.imageCategoryMap[img.category];
        var isSelected = S.selectedImageId === img.fid;
        html += '<div class="wcp-img-card' + (isSelected ? ' wcp-img-card-selected' : '') + '" data-action="select-image" data-fid="' + esc(img.fid) + '">';
        html += '<div class="wcp-img-card-thumb"><img src="' + esc(img.url) + '" alt="' + esc(img.alt || img.filename) + '" loading="lazy"></div>';
        html += '<div class="wcp-img-card-body">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:var(--wcp-space-1)">';
        html += '<span style="font-size:var(--wcp-font-size-xs);font-weight:600;color:var(--wcp-text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(truncate(img.filename, 24)) + '</span>';
        html += '<button class="wcp-img-star' + (img.star ? ' wcp-img-star-active' : '') + '" data-action="toggle-image-star" data-fid="' + esc(img.fid) + '" style="background:none;border:none;cursor:pointer;font-size:14px;color:' + (img.star ? '#f59e0b' : 'var(--wcp-gray-300)') + '">★</button>';
        html += '</div>';
        if (cat) html += '<div style="margin-top:2px">' + badge(cat.label, cat.color) + '</div>';
        if (img.tags && img.tags.length > 0) {
          html += '<div style="display:flex;gap:2px;flex-wrap:wrap;margin-top:2px">';
          for (var t = 0; t < Math.min(img.tags.length, 3); t++) html += '<span style="font-size:10px;padding:1px 5px;border:1px solid var(--wcp-border-light);border-radius:var(--wcp-radius-sm);color:var(--wcp-text-muted)">' + esc(img.tags[t]) + '</span>';
          if (img.tags.length > 3) html += '<span style="font-size:10px;color:var(--wcp-text-muted)">+' + (img.tags.length - 3) + '</span>';
          html += '</div>';
        }
        html += '</div></div>';
      }
      html += '</div>';
    }

    // Detail panel
    if (S.selectedImageId && S.imageMap[S.selectedImageId]) {
      html += renderImageDetailPanel(S.imageMap[S.selectedImageId]);
    }

    html += '</div>';
    return html;
  }

  function renderImageDetailPanel(img) {
    var cats = (S.meta && S.meta.image_categories) || [];
    var html = '<div class="wcp-img-detail">';
    html += '<div class="wcp-img-detail-header"><h3>' + icon('image') + ' Image Details</h3>';
    html += '<button class="wcp-btn-icon" data-action="close-image-detail">' + icon('x') + '</button></div>';
    html += '<div class="wcp-img-detail-body">';

    // Preview
    html += '<div class="wcp-img-detail-preview"><img src="' + esc(img.url) + '" alt="' + esc(img.alt || '') + '" style="max-width:100%;border-radius:var(--wcp-radius-md)"></div>';

    // Filename + star
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin:var(--wcp-space-3) 0">';
    html += '<strong style="font-size:var(--wcp-font-size-sm)">' + esc(img.filename) + '</strong>';
    html += '<button class="wcp-img-star' + (img.star ? ' wcp-img-star-active' : '') + '" data-action="toggle-image-star" data-fid="' + esc(img.fid) + '" style="background:none;border:none;cursor:pointer;font-size:18px;color:' + (img.star ? '#f59e0b' : 'var(--wcp-gray-300)') + '">★</button>';
    html += '</div>';

    // Editable fields
    html += '<div class="wcp-editor-form">';
    html += '<div class="wcp-form-group"><label>Description</label>';
    html += '<textarea class="wcp-textarea wcp-img-meta-field" data-fid="' + esc(img.fid) + '" data-field="description" rows="2" placeholder="Describe this image...">' + esc(img.description || '') + '</textarea></div>';

    html += '<div class="wcp-form-group"><label>Category</label>';
    html += '<select class="wcp-select wcp-img-meta-field" data-fid="' + esc(img.fid) + '" data-field="category">';
    html += '<option value="">— None —</option>';
    for (var ci = 0; ci < cats.length; ci++) html += '<option value="' + esc(cats[ci].id) + '"' + (img.category === cats[ci].id ? ' selected' : '') + '>' + esc(cats[ci].label) + '</option>';
    html += '</select></div>';

    html += '<div class="wcp-form-group"><label>Tags <span class="wcp-form-hint">(comma-separated)</span></label>';
    html += '<input type="text" class="wcp-input wcp-img-meta-field" data-fid="' + esc(img.fid) + '" data-field="tags" value="' + esc((img.tags || []).join(', ')) + '" placeholder="hero, brand, dark-mode..."></div>';

    html += '<div class="wcp-form-group"><label>Notes</label>';
    html += '<textarea class="wcp-textarea wcp-img-meta-field" data-fid="' + esc(img.fid) + '" data-field="notes" rows="2" placeholder="Usage notes...">' + esc(img.notes || '') + '</textarea></div>';
    html += '</div>';

    // Usage
    if (img.usage && img.usage.length > 0) {
      html += '<div style="margin-top:var(--wcp-space-3);padding-top:var(--wcp-space-3);border-top:1px solid var(--wcp-border-light)">';
      html += '<div style="font-size:var(--wcp-font-size-xs);font-weight:600;color:var(--wcp-text-muted);margin-bottom:var(--wcp-space-1)">USED IN</div>';
      for (var ui = 0; ui < img.usage.length; ui++) {
        var c = S.contentMap[img.usage[ui]];
        if (c) html += '<div style="font-size:var(--wcp-font-size-xs);color:var(--wcp-text-secondary);padding:2px 0">' + icon('file-lines') + ' ' + esc(truncate(c.title, 40)) + '</div>';
      }
      html += '</div>';
    }

    html += '</div></div>';
    return html;
  }

  function setupImagesEvents() {
    var ns = '.wcp2b-img';

    // Select image
    $(document).off('click' + ns + '-si').on('click' + ns + '-si', '[data-action="select-image"]', function() {
      var fid = $(this).data('fid');
      S.selectedImageId = (S.selectedImageId === fid) ? null : fid;
      render();
      if (window._wcpLocation) window._wcpLocation.capture();
    });

    // Close detail
    $(document).off('click' + ns + '-cd').on('click' + ns + '-cd', '[data-action="close-image-detail"]', function() {
      S.selectedImageId = null;
      render();
      if (window._wcpLocation) window._wcpLocation.capture();
    });

    // Toggle star
    $(document).off('click' + ns + '-ts').on('click' + ns + '-ts', '[data-action="toggle-image-star"]', function(e) {
      e.stopPropagation();
      var fid = $(this).data('fid');
      var img = S.imageMap[fid]; if (!img) return;
      img.star = !img.star;
      // Sync to meta
      S.meta.reference_images = S.meta.reference_images || {};
      S.meta.reference_images[fid] = S.meta.reference_images[fid] || {};
      S.meta.reference_images[fid].star = img.star;
      syncToTextarea(); render();
    });

    // Toggle star filter
    $(document).off('click' + ns + '-sf').on('click' + ns + '-sf', '[data-action="toggle-img-star-filter"]', function() {
      S.imageFilter.star = !S.imageFilter.star;
      render();
    });

    // Category filter
    $(document).off('change' + ns + '-cf').on('change' + ns + '-cf', '#wcpImgCategory', function() {
      S.imageFilter.category = $(this).val() || '';
      render();
    });

    // Search
    $(document).off('input' + ns + '-sr').on('input' + ns + '-sr', '#wcpImgSearch', debounce(function() {
      S.imageFilter.search = $(this).val() || '';
      render();
    }, 250));

    // Save image metadata on blur
    $(document).off('blur' + ns + '-mf').on('blur' + ns + '-mf', '.wcp-img-meta-field', function() {
      var fid = $(this).data('fid');
      var field = $(this).data('field');
      var val = $(this).val();
      var img = S.imageMap[fid]; if (!img) return;

      S.meta.reference_images = S.meta.reference_images || {};
      S.meta.reference_images[fid] = S.meta.reference_images[fid] || {};

      if (field === 'tags') {
        var tags = val.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
        img.tags = tags;
        S.meta.reference_images[fid].tags = tags;
      } else {
        img[field] = val;
        S.meta.reference_images[fid][field] = val;
      }
      syncToTextarea();
    });

    // Category change (select)
    $(document).off('change' + ns + '-mc').on('change' + ns + '-mc', '.wcp-img-meta-field', function() {
      var $el = $(this);
      if (!$el.is('select')) return;
      var fid = $el.data('fid');
      var field = $el.data('field');
      var val = $el.val();
      var img = S.imageMap[fid]; if (!img) return;
      img[field] = val;
      S.meta.reference_images = S.meta.reference_images || {};
      S.meta.reference_images[fid] = S.meta.reference_images[fid] || {};
      S.meta.reference_images[fid][field] = val;
      syncToTextarea(); render();
    });

    // Upload (trigger Drupal image field)
    $(document).off('click' + ns + '-up').on('click' + ns + '-up', '[data-action="upload-image"]', function() {
      if (!S.$imageField || !S.$imageField.length) {
        toast('Image field not found on this page. Add field_images to the content type.', 'warning');
        return;
      }
      // Show Drupal's image widget temporarily
      S.$imageField.show();
      var $addBtn = S.$imageField.find('[name*="field_images"][value*="Upload"], .image-widget-data .button, input[type="submit"][value*="Upload"]').first();
      if ($addBtn.length) {
        $addBtn.trigger('click');
        toast('Use Drupal\'s upload dialog, then save the node to add the image.', 'info', 6000);
      } else {
        toast('Scroll down to the image field to upload. Save the node when done.', 'info', 6000);
      }
    });
  }

