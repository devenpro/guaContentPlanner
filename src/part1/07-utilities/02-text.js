  // --- Text ---
  function esc(text) { if (!text) return ''; var d = document.createElement('div'); d.appendChild(document.createTextNode(text)); return d.innerHTML; }
  function truncate(text, max) { if (!text || text.length <= max) return text || ''; return text.substring(0, max) + '…'; }
  function countWords(text) { return text ? text.trim().split(/\s+/).filter(Boolean).length : 0; }

