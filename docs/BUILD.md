# BUILD.md — Build System

The WCP app ships as **two files** to Drupal Asset Injector: `dist/wcp.js` and `dist/wcp.css`. Both are produced from small, focused source files under `src/` by a dependency-free concat script.

## Quick Start

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File tools\build.ps1
```

**Any OS (Node):**
```bash
node tools/build.js
```

No npm packages, no config files, no Node modules. Both scripts use only their platform's built-in filesystem APIs.

## What the Script Does

1. Walks `src/part1/`, `src/part2a/`, `src/part2b/` recursively and concatenates every `.js` file in **lexicographic order of full path**.
2. Stitches the three resulting IIFE blocks into a single `dist/wcp.js` in load order: Part 1 → Part 2A → Part 2B.
3. Same for CSS: walks `src/styles/part1/` and `src/styles/part2/` and concatenates into `dist/wcp.css`.
4. Prepends a timestamped banner comment to each output.
5. **Fallback:** if a source folder is empty, the script falls back to the original root-level file (`wcp-part1.js`, etc.). This lets Phase 0 of the refactor produce valid output before any source files exist. Once Phases 1–4 are complete and the root files are deleted, the fallback becomes a no-op.

## Concat Order Rules

Each `src/partN/` folder builds a single IIFE:

- `_header.js` — opens the IIFE + file banner (starts with `_` to sort before numbered files)
- `01-*.js`, `02-*.js`, … — numbered module files, **zero-padded** so lexicographic sort matches numeric sort
- Subfolders sort alphabetically within their parent; name them carefully (e.g., `steps/`, `views/`)
- `_footer.js` — closes the IIFE with `})(jQuery, Drupal);` (starts with `_` but sorts after numbers in ASCII; if you need to force last, rename to `zz-footer.js`)

> Note: In ASCII, `_` (0x5F) sorts **after** `0-9` (0x30-0x39). So `_footer.js` naturally sorts after `99-*.js`. Test your ordering after adding files by running the build and checking the header comments in `dist/wcp.js`.

## Source Files Must NOT Self-Execute

Each module file contains **only function and var declarations** — no standalone IIFEs, no bare statements that mutate state. The only file that opens an IIFE is `_header.js`; the only file that closes one is `_footer.js`. Everything between shares scope.

## Editing Workflow

1. Edit a small module file under `src/`.
2. Run `tools/build.ps1` (or `tools/build.js`).
3. Upload `dist/wcp.js` and/or `dist/wcp.css` to your Drupal Asset Injector settings (or wherever Drupal reads them from).
4. Hard-refresh a node-edit page (`Ctrl+F5`).

## Drupal Asset Injector Setup

Two assets total — this replaces the 5-asset setup from the monolithic era.

| # | Asset | Type | Pages | Weight |
|---|-------|------|-------|--------|
| 1 | `dist/wcp.css` (or `wcp.css`) | CSS | body-class `node--type-website-content-planner` + path `/node/*/edit` | 0 |
| 2 | `dist/wcp.js` (or `wcp.js`) | JS | same | 0 |

Everything else (polling between parts, `window._wcp*` exports, `Drupal.behaviors` registration) is internal to the combined file and works automatically.

## Troubleshooting

**"Module X is not defined" error:**
- Function declaration in a later file references a function in an earlier file that wasn't loaded yet. Check your numeric prefixes.

**Duplicate function declaration warning in strict mode:**
- Two module files declared the same `var`/`function` name. Rename one.

**`dist/wcp.js` is smaller than expected:**
- A source folder is empty and the fallback loaded a stale root file. Check the build console output for `fallback to …` lines.

**IIFE closes prematurely:**
- A module file accidentally has a stray `})();` — remove it. Only `_header.js` opens, only `_footer.js` closes.
