  // ============================================================
  // SECTION 3: UNDO/REDO
  // ============================================================

  function snapshot(label) {
    S.undoStack = S.undoStack || [];
    S.undoStack.push({
      label: label || '',
      data: deepClone(S.data),
      meta: deepClone(S.meta),
      activity: deepClone(S.activity)
    });
    if (S.undoStack.length > 50) S.undoStack.shift();
    S.redoStack = [];
  }

  function undo() {
    if (!S.undoStack || S.undoStack.length <= 1) { toast('Nothing to undo', 'info'); return; }
    S.redoStack = S.redoStack || [];
    S.redoStack.push(S.undoStack.pop());
    var prev = S.undoStack[S.undoStack.length - 1];
    S.data = deepClone(prev.data);
    if (prev.meta) S.meta = deepClone(prev.meta);
    if (prev.activity) S.activity = deepClone(prev.activity);
    buildMaps(); render(); syncToTextarea();
    toast('Undone', 'info');
  }

  function redo() {
    if (!S.redoStack || S.redoStack.length === 0) { toast('Nothing to redo', 'info'); return; }
    var next = S.redoStack.pop();
    S.undoStack.push(next);
    S.data = deepClone(next.data);
    if (next.meta) S.meta = deepClone(next.meta);
    if (next.activity) S.activity = deepClone(next.activity);
    buildMaps(); render(); syncToTextarea();
    toast('Redone', 'info');
  }

