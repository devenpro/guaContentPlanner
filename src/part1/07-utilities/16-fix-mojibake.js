  // ============================================================
  // SECTION 7.16: MOJIBAKE REPAIR
  // ============================================================
  //
  // Repairs "mojibake" text like  â€™  ðŸŽ  âœ…  ðŸ'‘
  // These strings are UTF-8 bytes that were once decoded as Windows-1252
  // and re-saved as UTF-8. The inverse operation is:
  //   re-encode each char as a single cp1252 byte, then decode as UTF-8.
  // If the re-decoded result is valid UTF-8, it's the original text.
  // If decoding throws, the input wasn't mojibake and is returned unchanged.

  function fixMojibakeString(s) {
    if (typeof s !== 'string' || s.length === 0) return s;
    // Fast-path: mojibake always contains one of these tell-tale chars.
    // Skip any string that doesn't.
    if (!/[\u00C2\u00C3\u00E2\u00F0\u00D8\u00D9]/.test(s)) return s;
    try {
      var bytes = new Uint8Array(s.length);
      for (var i = 0; i < s.length; i++) {
        var cp = s.charCodeAt(i);
        if (cp > 0xFF) return s; // char not cp1252-representable -> not mojibake
        bytes[i] = cp;
      }
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (e) {
      return s;
    }
  }

  // Recurse into objects / arrays, fix every string leaf in place.
  // Returns count of strings that were changed.
  function fixMojibakeDeep(node) {
    var count = 0;
    if (node === null || node === undefined) return 0;
    if (typeof node === 'string') return 0; // caller needs a container to mutate
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        var v = node[i];
        if (typeof v === 'string') {
          var fixed = fixMojibakeString(v);
          if (fixed !== v) { node[i] = fixed; count++; }
        } else if (v && typeof v === 'object') {
          count += fixMojibakeDeep(v);
        }
      }
      return count;
    }
    if (typeof node === 'object') {
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        var val = node[k];
        if (typeof val === 'string') {
          var f = fixMojibakeString(val);
          if (f !== val) { node[k] = f; count++; }
        } else if (val && typeof val === 'object') {
          count += fixMojibakeDeep(val);
        }
      }
    }
    return count;
  }

  window._wcpFixMojibake = {
    fixString: fixMojibakeString,
    fixDeep: fixMojibakeDeep
  };
