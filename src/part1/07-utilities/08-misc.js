  // --- Misc ---
  function debounce(fn, delay) { var t; return function() { var c = this, a = arguments; clearTimeout(t); t = setTimeout(function() { fn.apply(c, a); }, delay); }; }
  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function isEmpty(obj) { return !obj || (typeof obj === 'object' && Object.keys(obj).length === 0); }

