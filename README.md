# Website Content Planner (WCP)

Drupal-native content planning app for topical authority, keyword clustering, and SEO/GSEO/AEO optimization. Runs as sequential Asset Injector assets against a custom `website_content_planner` content type.

## Repository Map

```
content_planner/
├── dist/            # Built output — upload these 2 files to Drupal
│   ├── wcp.js       #   combined JS (part1 + part2a + part2b)
│   └── wcp.css      #   combined CSS
│
├── src/             # Source files — edit these, then run the build
│   ├── part1/       #   Core engine: state, init, shell, views, events
│   ├── part2a/      #   Pipeline editor: modals, undo/redo, 8 step renderers
│   ├── part2b/      #   AI engine: LLMService, 36 AI actions, setup wizard
│   └── styles/      #   CSS source (part1/ + part2/)
│
├── tools/           # Build scripts (PowerShell + Node)
│   ├── build.ps1
│   └── build.js
│
├── docs/            # All project docs
│   ├── PROJECT.md            — Drupal config, fields, asset setup
│   ├── ARCHITECTURE.md       — load chain, state flow, renderer registry
│   ├── DATA-MODEL.md         — JSON schemas for the 3 textarea fields
│   ├── API-REFERENCE.md      — every window._wcp* export
│   ├── DEVELOPMENT-GUIDE.md  — how to add views, AI actions, etc.
│   ├── QUICK-REFERENCE.md
│   ├── TROUBLESHOOTING.md
│   ├── CHANGELOG.md
│   └── BUILD.md              — build system reference
│
├── backups/         # Manual save snapshots
├── references/      # Captured HTML fragments for reference
├── samples/         # Sample JSON payloads (future)
└── .claude/         # Claude Code local config
```

## Install in Drupal (via jsDelivr CDN — recommended)

The `dist/` folder is published in this repo and served by [jsDelivr](https://www.jsdelivr.com/), so no manual upload is needed. Create **two Asset Injector entries** with these URLs:

**CSS** (Add CSS — load first):
```
https://cdn.jsdelivr.net/gh/devenpro/guaContentPlanner@main/dist/wcp.css
```

**JS** (Add JS — load second):
```
https://cdn.jsdelivr.net/gh/devenpro/guaContentPlanner@main/dist/wcp.js
```

**Visibility condition** for both:
- Content type: `website_content_planner`
- Path: `/node/*/edit`

**Drupal-side prerequisites** (must be loaded globally, outside Asset Injector): jQuery, Bootstrap 5, Font Awesome Pro, and the brand/user config divs (`.llm-brand-config-data`, `.llm-config-data`).

### Pushing updates to production
After `git push`, jsDelivr caches the `@main` URLs for up to 12 hours. To force an instant refresh, open these two URLs in a browser tab — they'll respond `{"status":"finished"}`:

```
https://purge.jsdelivr.net/gh/devenpro/guaContentPlanner@main/dist/wcp.js
https://purge.jsdelivr.net/gh/devenpro/guaContentPlanner@main/dist/wcp.css
```

### Stable production URLs (optional)
For a release-pinned setup, tag a version and reference it instead of `@main`:
```powershell
git tag v1.0.1
git push --tags
```
Then in Asset Injector:
```
https://cdn.jsdelivr.net/gh/devenpro/guaContentPlanner@v1.0.1/dist/wcp.css
https://cdn.jsdelivr.net/gh/devenpro/guaContentPlanner@v1.0.1/dist/wcp.js
```
Tag URLs are immutable and cached for a year — production won't drift between releases.

## Build & Deploy (local)

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File tools\build.ps1
```

```bash
# Any OS
node tools/build.js
```

Outputs `dist/wcp.js` and `dist/wcp.css`. Commit `dist/` along with your `src/` changes so jsDelivr picks them up. (Alternative: skip the CDN and upload the two files directly into Asset Injector as raw text.)

See [docs/BUILD.md](docs/BUILD.md) for details.

## Where to Edit What

| To change… | Edit this folder |
|---|---|
| Global constants / state / init | `src/part1/` (01–03) |
| Utility helpers | `src/part1/07-utilities/` |
| A built-in view layout | `src/part1/09-renderers/` |
| A pipeline step UI | `src/part2a/steps/` |
| A CRUD modal | `src/part2a/14-crud-modals/` |
| The LLM service | `src/part2b/02-llm-service.js` |
| An AI action handler | `src/part2b/ai-actions/` |
| The research / settings / images view | `src/part2b/views/` |
| The setup wizard | `src/part2b/16-setup-wizard/` |
| CSS tokens | `src/styles/part1/01-variables.css` |
| Modal / editor / wizard styles | `src/styles/part2/` |

## Stack

Vanilla JS + jQuery. No npm, no bundler, no framework. The "build" is a dependency-free concat.
