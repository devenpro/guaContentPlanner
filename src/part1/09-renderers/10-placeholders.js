  function renderPlaceholder(title, iconName, desc) {
    return '<div class="wcp-view"><div class="wcp-empty-state">' +
      '<div class="wcp-empty-state-icon">' + icon(iconName) + '</div>' +
      '<div class="wcp-empty-state-title">' + esc(title) + '</div>' +
      '<div class="wcp-empty-state-text">' + esc(desc) + '<br><br>This view will be built in Phase 2.</div>' +
      '</div></div>';
  }

  function renderViewLoading(viewName) {
    var label = APP_VIEWS[viewName] ? APP_VIEWS[viewName].label : viewName;
    return '<div class="wcp-view"><div class="wcp-empty-state">' +
      '<div class="wcp-empty-state-icon">' + icon('spinner') + '</div>' +
      '<div class="wcp-empty-state-title">Loading ' + esc(label) + '...</div>' +
      '<div class="wcp-empty-state-text">Waiting for module to initialize.</div>' +
      '</div></div>';
  }

  function renderModuleNotLoaded(viewName) {
    var label = APP_VIEWS[viewName] ? APP_VIEWS[viewName].label : viewName;
    var p2aLoaded = !!window._wcpPart2A;
    var p2aReady = !!(S && S._part2aReady);
    var diag = 'Part 2A loaded: ' + (p2aLoaded ? 'Yes' : 'NO') + ' | Part 2A ready: ' + (p2aReady ? 'Yes' : 'NO');
    return '<div class="wcp-view"><div class="wcp-empty-state">' +
      '<div class="wcp-empty-state-icon">' + icon('circle-exclamation') + '</div>' +
      '<div class="wcp-empty-state-title">' + esc(label) + ' — Module Not Loaded</div>' +
      '<div class="wcp-empty-state-text">The advanced features module (Part 2B) did not initialize.<br><br>' +
      '<strong>Diagnostics:</strong> ' + esc(diag) + '<br><br>' +
      '<strong>Common fixes:</strong><br>' +
      '1. Check that <code>wcp-part2a.js</code> and <code>wcp-part2b.js</code> are added in Asset Injector<br>' +
      '2. Ensure load order: part1.js → part2a.js → part2b.js<br>' +
      '3. Check browser console (F12) for JavaScript errors<br>' +
      '4. Verify files are attached to the correct content type page</div>' +
      '<button class="wcp-btn wcp-btn-primary" onclick="window.location.reload()">' + icon('arrows-rotate') + ' Reload Page</button>' +
      '</div></div>';
  }

