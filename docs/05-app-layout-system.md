# 05 — App Layout System

**File type:** Common knowledge (shared across all Go Ultra AI in-product apps)
**Status:** v1.0 — distilled from the Content Planner shell, reconciled with `04-design-system.md`.
**Reading order:** Read after `04-design-system.md`. This file is the app-side companion to that file: where `04` describes website/landing visuals, `05` describes the in-product shell.
**Last updated:** May 2026

> **What this file is:** The standard layout system for every Go Ultra AI product UI — navbar, sidebar, main content, shell behavior, and the common component patterns each app reuses. The intent is that a user moving between Content Planner, Brand Profile, Image Studio, and any future Go Ultra AI app should feel they are in the same product family.

> **Scope:** This guide governs **in-product app surfaces** — the UI the user works inside after they've logged in / loaded a Drupal editor page. It does **not** govern landing pages, comparison pages, pricing pages, or other marketing surfaces — those are governed by `04-design-system.md`.

> **Non-restriction principle:** This guide standardizes the *shell* and the *common components*. It does not constrain what features an app can ship inside the main content area. Different apps will have radically different views, editors, pipelines, and tools — that's expected. What must stay consistent is the chrome around those views.

---

## 1. Relationship to the landing design system

The brand is one brand. Token values (color, type, spacing, radius, shadow, iconography) all derive from `04-design-system.md`. App-level overrides exist only where in-product needs genuinely differ from marketing needs.

### 1.1 What's shared 1:1 with landing

- **Brand primary blue:** `#1a73e8`
- **Signature gradient:** coral `#f77062` → pink `#fe5196` → violet `#bc4cf4`, 135°
- **Fonts:** Plus Jakarta Sans (display), DM Sans (body), JetBrains Mono (mono)
- **8px base spacing scale**
- **Radius scale** (8/12/16/24/32/pill)
- **Shadow base** (slate-grey, low opacity — never pure black)
- **Iconography:** Font Awesome 6 Free Solid only
- **Status colors** (success / warning / error / info)
- **Neutrals** (Google-grey scale)
- **Reduced-motion handling**

### 1.2 What is app-specific

- **Density.** App UI is denser than landing. Header is 52px (not 64–96px). Body padding is `--gua-space-6` (24px) at desktop. Cards have tighter internal padding. This is deliberate — in-product users work for long sessions; landing visitors scan.
- **Responsive direction.** Landing is mobile-first (`min-width` queries from 640px up). App is **desktop-first** (`max-width` breakdowns from 1200/992/768/480 down). Rationale: the in-product audience is on a laptop or desktop the majority of the time; mobile is a fallback view, not the conversion view.
- **Type scale.** App uses a fixed type scale (no `clamp()`) because the shell is a fixed viewport. Landing uses fluid type because the page scrolls and stretches.
- **Gradient density.** Landing uses 3–5 gradient moments per page. App uses **1–3 gradient moments per view** — typically the sidebar brand mark, one primary CTA, and the AI-status pill. Gradient remains punctuation.
- **Dark surfaces.** Landing uses dark CTA sections. App stays light-mode throughout. Dark mode is not built (see anti-patterns in `04`).
- **Component density.** Buttons have `min-height: 38px` (vs landing's 40–48px). Inputs are `min-height: 38px`. The app default is the pill-radius button; the rectangular 12px-radius button is reserved for very dense form contexts.

### 1.3 Token-layering rule

Every app keeps its own per-app prefix and maps it to the brand tokens.

**Convention.** App tokens are namespaced `--<app>-*` (e.g., `--wcp-*` for Website Content Planner, `--bpa-*` for Brand Profile App, `--isa-*` for Image Studio App). Inside `:root`, each app variable is **assigned from the matching `--gua-*` token**. App code reads its own variables; the brand is the source of truth.

```css
/* Inside each app's variables file */
:root {
  /* Brand tokens (defined once, ideally from the shared brand stylesheet) */
  --gua-primary: #1a73e8;
  --gua-accent-start: #f77062;
  --gua-accent-mid:   #fe5196;
  --gua-accent-end:   #bc4cf4;
  --gua-gradient: linear-gradient(135deg, var(--gua-accent-start), var(--gua-accent-mid), var(--gua-accent-end));
  /* …rest of --gua-* per 04-design-system.md… */

  /* App tokens (alias the brand) */
  --wcp-primary:        var(--gua-primary, #1a73e8);
  --wcp-primary-hover:  var(--gua-primary-hover, #1557b0);
  --wcp-gradient:       var(--gua-gradient);

  /* App-specific semantic aliases (no brand equivalent) */
  --wcp-hub:     #1a73e8;
  --wcp-cluster: #7c3aed;
  --wcp-content: #0d904f;
}
```

**Rules:**
1. Always provide a hex fallback before any `var()` reference (Drupal silently drops custom-property resolution occasionally — same rule as landing).
2. Never let an app token define a *different* brand color than the matching `--gua-*` token. If the app currently does (e.g., Content Planner currently uses `#2563eb` for `--wcp-primary`), that is a drift to correct, not a precedent to copy.
3. App-only semantic aliases (like `--wcp-hub`, `--wcp-cluster`) are fine. They expand the system; they don't redefine it.

---

## 2. App shell anatomy

Every Go Ultra AI app renders the same four-zone shell.

```
┌──────────────────────────────────────────────────────────────┐
│  NAVBAR (fixed, full width, 52px)                            │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│ SIDEBAR  │  MAIN CONTENT AREA                                │
│ (210px,  │  (flex: 1, scrollable, padding: 24px)             │
│ collapses│                                                   │
│ to 56px) │                                                   │
│          │                                                   │
└──────────┴───────────────────────────────────────────────────┘
   TOAST LAYER (fixed bottom-right, z-index: 10000)
```

### 2.1 Shell HTML structure

```html
<div id="<app>App" class="<app>-app">
  <div class="<app>-header"> … </div>
  <div class="<app>-body">
    <div class="<app>-sidebar"> … </div>
    <div class="<app>-main">
      <div class="<app>-content"> … </div>
    </div>
  </div>
  <div class="<app>-toast-container"> … </div>
</div>
```

### 2.2 Shell CSS contract

The shell is `position: fixed`, fills the viewport below the Drupal admin toolbar, and is the only scroll boundary the app owns.

```css
.<app>-app {
  position: fixed;
  top: var(--<app>-drupal-toolbar, 0px);
  left: 0; right: 0; bottom: 0;
  display: flex; flex-direction: column;
  background: var(--<app>-bg-secondary, #f8f9fb);
  overflow: hidden;
}
body.<app>-active { overflow: hidden; }
```

When the app boots, it (a) measures the Drupal admin toolbar height, sets `--<app>-drupal-toolbar`, (b) adds the activation class to `body`, (c) hides the native Drupal page chrome (`.region-breadcrumb`, `.page-title-wrapper`, `.block-page-title-block`).

### 2.3 Frozen dimensions

| Surface | Token | Value |
|---|---|---|
| Header height | `--<app>-header-height` | 52px |
| Sidebar width (expanded) | `--<app>-sidebar-width` | 210px |
| Sidebar width (collapsed) | `--<app>-sidebar-collapsed` | 56px |
| List pane (when in split-pane views) | `--<app>-list-pane-width` | 320px |
| Body padding (desktop) | `--gua-space-6` | 24px |
| Body padding (≤768px) | `--gua-space-4` | 16px |
| Body padding (≤480px) | `--gua-space-3` | 12px |

These dimensions are part of the brand experience; don't tune them per app to "fit better." If your nav needs more room, collapse less aggressively or reduce label length — don't widen the sidebar.

### 2.4 Z-index scale

```css
--<app>-z-sidebar:  100;
--<app>-z-header:   110;
--<app>-z-dropdown: 200;
--<app>-z-overlay:  300;   /* mobile sidebar backdrop */
--<app>-z-modal:    1000;
--<app>-z-confirm:  1100;
--<app>-z-toast:    10000;
```

Apps that need additional layers (e.g., a command palette over modals) extend the scale; they don't reorder it.

---

## 3. Top navbar

### 3.1 Anatomy

The navbar is a single fixed row with a **left cluster** and **right cluster**.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [☰] App Name • [Brand pill]    [🔍 Search ⌘K] [Save status] [● AI] [✓ Save] [👤] │
└──────────────────────────────────────────────────────────────────────┘
```

#### Left cluster (in order)

1. **Sidebar toggle** — icon button, `fa-bars`. Toggles `<app>-sidebar-collapsed` on desktop, opens `<app>-sidebar-open` drawer on mobile.
2. **App name** — display font, weight 700, 14px. e.g., "Content Planner", "Brand Profile", "Image Studio". Always uses the app's full name, not an abbreviation.
3. **Workspace / brand pill** *(optional)* — Shows the active brand context (e.g., "Acme Co.") on apps that operate on a selected brand. Pill shape (`--gua-radius-pill`), `--gua-gray-50` background, subtle border. If the app is brand-aware but no brand is selected, omit the pill — don't show "No brand."
4. **Breadcrumb** *(optional, contextual)* — Only when the user is deep in a sub-view (e.g., a specific content piece inside Content Planner). Format: `Parent › Current`. Uses `--<app>-text-secondary` for the parent, `--<app>-primary` for the current.

#### Right cluster (in order)

5. **Global search** — Pill-bordered input, gray text "Search…", with `⌘K` keyboard hint in a small mono kbd chip. Click opens a command-palette-style overlay. Hidden on ≤480px (the chrome is too tight).
6. **Save status** *(if app persists work)* — One word: "Saved" (green), "Saving…" (gray), "Unsaved" (amber). 12px, weight 500.
7. **AI status pill** — `<span class="<app>-header-ai-status">` containing a 6px dot + label "AI". Green dot = configured, red dot = not configured, gray dot = unknown. Click opens the AI settings view. **Every app that uses AI must surface this pill.**
8. **Primary save action** *(if applicable)* — Small primary button. Text = "Save". Icon = `fa-check`. Triggers the underlying Drupal form submit or app save action. Hidden on apps that auto-save with no manual save step.
9. **User avatar** — 30px circle, user's initials (max 2 chars), `--<app>-primary-light` background, `--<app>-primary` text. Hover opens user menu (sign out, settings, switch workspace).

### 3.2 Slot rules for app-specific additions

The navbar is the most-shared surface and the most likely place an app wants to add custom controls. Rules:

- **Add to the right cluster, between the AI pill and Save button.** This is the "app-actions" slot.
- **Maximum 2 app-specific controls.** More than that turns the navbar into a toolbar — push extras into the view header instead.
- **Match the existing visual density.** Use `--<app>-btn-sm` and 32px-icon-buttons. Don't introduce a chunky 40px button just for one app.
- **Never relocate or rename core elements.** The save button is always called "Save". The AI pill is always called "AI". Don't translate or re-label these per app.

### 3.3 Navbar CSS contract

```css
.<app>-header {
  display: flex; align-items: center; justify-content: space-between;
  height: var(--<app>-header-height);   /* 52px */
  padding: 0 var(--gua-space-5);        /* 20px */
  background: var(--gua-white);
  border-bottom: 1px solid var(--gua-gray-200);
  flex-shrink: 0;
  z-index: var(--<app>-z-header);
}
.<app>-header-left  { display: flex; align-items: center; gap: var(--gua-space-3); }
.<app>-header-right { display: flex; align-items: center; gap: var(--gua-space-3); }
```

### 3.4 Responsive behavior

- **≤768px:** Brand pill collapses to icon only. Breadcrumb hides; the view header inside the main area becomes the breadcrumb surrogate.
- **≤480px:** Global search hides (the ⌘K kbd hint doesn't apply on mobile anyway). Save action stays. AI pill stays. User avatar stays.

---

## 4. Sidebar

### 4.1 Anatomy

```
┌────────────────────┐
│ [APP] App Name     │  ← Brand block (30px gradient icon + name + sub)
│       Brand sub    │
├────────────────────┤
│ GROUP LABEL        │
│  ◉ Item A      [3] │
│  ○ Item B          │
│  ○ Item C      [12]│
│                    │
│ GROUP LABEL        │
│  ○ Item D          │
│  ○ Item E          │
├────────────────────┤
│ v1.0               │  ← Footer (version, optional)
└────────────────────┘
```

### 4.2 Sidebar blocks (top to bottom)

1. **Brand block** — 30px square with the brand gradient background, an **FA Free Solid icon chosen per app** rendered in white at ~14–15px. Each app picks the icon that best represents what it is: Content Planner uses `fa-sitemap` (a hub-and-cluster topical-authority planner *is* a sitemap), Brand Profile uses `fa-fingerprint`, Image Studio uses `fa-images`, etc. To the right: app name (700, 13px) and a sub-label (10px, muted) — usually the active brand name or workspace. Clicking the block does what makes sense for the app (typically navigates home or opens a workspace switcher).
2. **Nav groups** — Each group has a small all-caps eyebrow label (9px, weight 700, +1.2px tracking, muted color), followed by nav items.
3. **Nav items** — Icon (18px, Font Awesome Free Solid) + label + optional badge. Hover: `--gua-gray-50` background. Active: `--gua-primary-light` (e.g., `#e8f0fe`) background, `--gua-primary` text, weight 600. Badges: pill, count or label, secondary color; active item's badge inverts to primary background + white text.
4. **Sidebar footer** *(optional)* — Version number, small help link, or upgrade nudge. Stays at the bottom (`flex-shrink: 0`).

### 4.3 Nav grouping convention

Group nav items by **what the user is trying to do**, not by data model. Common groups across apps:

| Group label | Typical items |
|---|---|
| `OVERVIEW` | Dashboard, Recent activity |
| `WORK` | Content, Hubs, Projects, Images — the verbs the user came to do |
| `INTELLIGENCE` | Research, Insights, AI history |
| `LIBRARY` | Templates, Tags, Brand assets |
| `SETTINGS` | AI providers, Workspace, Integrations |

Apps should not invent novel group labels when one of these fits. Consistency across apps reduces re-learning cost.

### 4.4 Collapsed state

- Sidebar collapses to **56px** (icon only).
- Group labels hide. Item labels hide. Badges hide.
- Brand block hides the text; just the 30px icon centers.
- Footer hides.
- Hover still highlights the row; tooltip on hover shows the item label.

Toggle persists per user (store in `localStorage` outside Drupal, or in the user's app prefs).

### 4.5 Mobile drawer (≤992px)

- Sidebar leaves the flow (`display: none`).
- Hamburger in the navbar opens the drawer (`<app>-sidebar-open` class).
- Drawer is `position: fixed`, full height, slides in from the left, `--gua-shadow-xl`.
- A backdrop (`rgba(0,0,0,0.3)`) covers the rest of the viewport at `z-overlay - 1`. Clicking it closes the drawer.

### 4.6 Sidebar CSS contract

```css
.<app>-sidebar {
  width: var(--<app>-sidebar-width);          /* 210px */
  background: var(--gua-white);
  border-right: 1px solid var(--gua-gray-200);
  display: flex; flex-direction: column;
  flex-shrink: 0; overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
}
.<app>-sidebar-collapsed { width: var(--<app>-sidebar-collapsed); /* 56px */ }

.<app>-nav-group-label {
  font-size: 9px; font-weight: 700;
  color: var(--gua-gray-500);
  text-transform: uppercase; letter-spacing: 1.2px;
  padding: 8px 8px 4px;
}
.<app>-nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--gua-gray-700);
  font-size: 13px; font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.<app>-nav-item:hover  { background: var(--gua-gray-50); color: var(--gua-gray-900); }
.<app>-nav-item-active { background: var(--gua-primary-light); color: var(--gua-primary); font-weight: 600; }
```

---

## 5. Main content area

### 5.1 Anatomy

```
┌──────────────────────────────────────────────────┐
│ View Header                                      │
│   Title              [Action] [Action] [Primary] │
│   Subtitle / one-liner                           │
├──────────────────────────────────────────────────┤
│                                                  │
│ View body (cards, lists, editors, etc.)          │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 5.2 View header pattern

Every view opens with the same header structure: a left column (title + optional subtitle) and a right column (action buttons, max 3). Wraps to two rows on ≤768px.

```html
<div class="<app>-view-header">
  <div class="<app>-view-header-left">
    <h1>View Title</h1>
    <p class="<app>-view-subtitle">One-line context for what this view is.</p>
  </div>
  <div class="<app>-view-header-right">
    <button class="<app>-btn <app>-btn-outline">Secondary</button>
    <button class="<app>-btn <app>-btn-primary">Primary</button>
  </div>
</div>
```

This is the app-side analog of the landing `eyebrow / headline / subhead` trio in `04-design-system.md` §2.5 — but tuned for working surfaces, not marketing.

### 5.3 View fade-in

Each view fades in on mount via a 250ms `translateY(4px) → 0` + `opacity 0 → 1` animation. Smaller than the landing 24px entrance because in-app navigation is frequent — big animations become tiring.

```css
.<app>-view { animation: <app>-fadeIn 0.25s cubic-bezier(0.4,0,0.2,1); padding-bottom: 32px; }
@keyframes <app>-fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
```

Honor `prefers-reduced-motion: reduce` — element should be visible without the animation.

### 5.4 Split-pane views

For list-and-detail interactions (browse a list on the left, see the detail on the right):

- Left pane: `--<app>-list-pane-width` (320px), border-right, scrollable.
- Right pane: `flex: 1`, scrollable independently.
- ≤992px: panes stack vertically; list becomes a max-40vh strip on top, detail fills below.

Use split-pane for: content lists, hub lists, template lists, image galleries, anything where the user wants to switch between items quickly without losing context.

### 5.5 Dense content area: padding and rhythm

| Container | Padding |
|---|---|
| `.<app>-content` (desktop) | 24px (`--gua-space-6`) |
| `.<app>-content` (≤768px)  | 16px (`--gua-space-4`) |
| `.<app>-content` (≤480px)  | 12px (`--gua-space-3`) |
| Section gap (between major view sections) | 24–32px |
| Card grid gap | 16px (`--gua-space-4`) |
| Form field gap | 16px |

Apps may add more spacing inside cards or wizards as needed, but the outer rhythm above is shared.

---

## 6. Common components

These components must look and behave the same across every Go Ultra AI app. App-specific variants are allowed, but the base must be recognizable.

### 6.1 Buttons

Five variants. Pill radius (`--gua-radius-pill`) is the app default.

| Variant | Class | Use |
|---|---|---|
| Primary | `.<app>-btn-primary` | The one main action per view (e.g., "Save", "Generate") |
| Secondary | `.<app>-btn` (base) | Common actions |
| Outline | `.<app>-btn-outline` | Tertiary actions |
| Ghost | `.<app>-btn-ghost` | Inline text-like actions inside cards |
| Danger | `.<app>-btn-danger` | Destructive actions only |

**Hover lift:** `translateY(-1px)` + `--gua-shadow-sm`. **Focus ring:** 3px `rgba(26,115,232,0.18)` outline. **Disabled:** opacity 0.55, no hover.

**Sizes:** base (38px min-height), `-sm` (28–30px min-height), `-icon` (32×32 square).

**Special:** the **AI button** (`.<app>-btn-ai`) is the one place inside the working surfaces where the brand purple/coral accent appears as a button face. Use it on any button that triggers an AI action (e.g., "Generate angles with AI"). Subtle purple-tinted background (`rgba(124,58,237,0.06)`), purple-tinted border, gradient or purple text. Don't use the AI button for non-AI actions.

### 6.2 Cards

Three variants:

| Variant | Background | Radius | Shadow | Use |
|---|---|---|---|---|
| Standard `.<app>-card` | white | 16px | none (border) | Content blocks |
| Clickable `.<app>-card-clickable` | white | 16px | hover: `--gua-shadow-md` + `-2px` lift | List items, browseable |
| Stat `.<app>-stat-card` | white | 16px | hover: same | KPI tiles on dashboards |

Stat card structure: label (uppercase, 11px, tertiary text) → value (display font, 24px, weight 800) → sub-label (11px, muted).

### 6.3 Badges and chips

| Component | Use | Style |
|---|---|---|
| `.<app>-badge` | Brand pill, generic count chip | Pill, 8px horizontal padding, 11px |
| `.<app>-status-badge` | Status label with dot | Pill + dot, neutral background |
| `.<app>-tag-chip` | User tag in tag clouds | Pill, color border, hover lift |
| `.<app>-filter-pill` | Filter toggle in a strip of filters | Pill, gray default, primary when active |

The 8px dot inside status badges takes the semantic status color (success / warning / error / info / muted). Apps may add domain-specific dot colors (e.g., `--wcp-hub`).

### 6.4 Tabs

Pill-track tab bar — gray background strip, white "active pill" with subtle shadow.

```html
<div class="<app>-tab-bar" role="tablist">
  <button class="<app>-tab-item <app>-tab-active">Tab 1</button>
  <button class="<app>-tab-item">Tab 2</button>
  <button class="<app>-tab-item">Tab 3</button>
</div>
```

Use tabs to switch between **equally-important sibling views** (e.g., "All / Drafts / Published"). Don't use tabs as the primary nav — that's the sidebar's job.

### 6.5 Forms

- **Input / select / textarea:** 38px min-height, 12px radius, soft inset shadow, primary-blue focus ring (3px `rgba(26,115,232,0.15)`).
- **Select:** custom SVG chevron (no native browser caret).
- **Field label:** 12px, weight 600, secondary text, uppercase, +0.04em tracking.
- **Form group:** flex column, 4px gap between label and field.
- **Form row:** flex row, 16px gap, equal-width fields.
- **Hint text:** 12px, muted, below the field.

This is the "app-grade control language" — every native Drupal form control the app touches should inherit it (apply the class to the rendered Drupal field so users see a unified system, not a half-Drupal half-app look).

### 6.6 Modals

Backdrop: `rgba(0,0,0,0.4)`, centered modal. Modal: 16px radius, `--gua-shadow-xl`, max-height 85vh, flex column.

Modal structure: **header** (title + close button) → **body** (scrollable) → **footer** (right-aligned actions).

Sizes: `-sm` (420px), `-md` (560px), `-lg` (720px), `-xl` (900px). Use the smallest size that fits the content; don't default to large.

**Confirm dialog:** smaller variant for destructive confirmations (400px max-width, centered text, two buttons: Cancel + Confirm/Danger).

### 6.7 Toasts

Bottom-right stack, max 3 visible at once. Auto-dismiss after 4–6 seconds (sticky for errors). Slide-in from the right. Each toast: icon + message + optional action link.

Status colors per type: success, error, warning, info — match the brand semantic colors.

### 6.8 Empty states

When a list, hub, or area has no content, show:

```
┌────────────────────────────────┐
│        [Large FA icon]         │
│                                │
│        Headline (h3)           │
│   One-line explanation (sm)    │
│                                │
│      [Primary CTA button]      │
└────────────────────────────────┘
```

- Icon: 48px Font Awesome Free Solid, muted gray.
- Headline: display font, 18px, weight 700.
- Explanation: body font, 14px, secondary text, max 2 lines.
- CTA: one primary button — the most natural next action.

Don't ship empty placeholders without a CTA. An empty state with no path forward is dead surface.

### 6.9 Loading states

- **View-level loading:** centered spinner (`fa-circle-notch fa-spin`, 28px) + 14px muted text below. No skeleton screens (skeletons read as "fake content"; the app is too varied for them to be consistently helpful).
- **Inline loading:** button switches text to a spinner + label ("Saving…", "Generating…"). Disable the button during the action.
- **Pending state on AI actions:** the AI button shows a spinner and the AI pill in the navbar pulses (subtle 1.2s opacity 0.6→1 animation).

---

## 7. Drupal embedding rules

Every Go Ultra AI app ships as an Asset Injector entry against a Drupal content type, and behaves as a takeover UI of the node edit page. Patterns:

### 7.1 Boot sequence

1. Detect: the app's `attach()` runs; checks for the app's body class (e.g., `body.page-node-type-website-content-planner`).
2. Measure: read `#toolbar-bar` and `#toolbar-tray-horizontal` heights; set `--<app>-drupal-toolbar` to their combined height.
3. Activate: add `body.<app>-active`. Hide Drupal's breadcrumb, page title, and any other in-flow chrome.
4. Mount: prepend `<div id="<app>App">` before the Drupal node form region; hide the form.
5. Wire: textarea fields (the source of truth) are hidden but stay in the DOM so Drupal still submits them on save.

### 7.2 Save flow

Apps never submit forms directly — they mirror state into the hidden textarea fields and trigger the Drupal save button. This keeps Drupal as the persistence boundary. The "Save" button in the navbar is a façade over the Drupal submit.

### 7.3 Asset loading

- Apps ship one combined JS bundle and one combined CSS bundle.
- Bundles are served via jsDelivr from a tagged GitHub release for production stability.
- Two Asset Injector entries per app: one CSS (load first), one JS (load second).
- Visibility condition: content-type-scoped, path-scoped to `/node/*/edit`.

### 7.4 Drupal-side prerequisites

Every Go Ultra AI app assumes these are loaded globally outside Asset Injector:

- jQuery (Drupal default)
- Bootstrap 5 (for grid only — components are app-owned)
- Font Awesome 6 Free Solid (FA Pro broke in Drupal context — see `04` §11)
- The `.llm-config-data`, `.llm-brand-config-data`, and brand config divs (`.brand-data`, `.brand-core-data`, etc.)
- The `#guau-userdata` div with user fields

If any of these are missing, the app should fail soft (log a warning, render an empty state explaining what's missing) rather than render broken UI.

---

## 8. Responsive strategy

The app is **desktop-first** with three graceful step-downs.

```css
/* Base: ≥1201px (desktop) */
.<app>-element { … }

@media (max-width: 1200px) { /* Small desktop / large tablet */ }
@media (max-width: 992px)  { /* Tablet — sidebar becomes drawer */ }
@media (max-width: 768px)  { /* Phone — content padding shrinks, view header wraps */ }
@media (max-width: 480px)  { /* Small phone — search collapses, view header stacks */ }
```

| Breakpoint | What changes |
|---|---|
| ≤1200px | Multi-column dashboards drop a column; list pane narrows to 280px |
| ≤992px  | Sidebar leaves flow → becomes left drawer with backdrop; split-panes stack vertically |
| ≤768px  | Content padding 16px; card grids drop to 2 columns; view headers wrap |
| ≤480px  | Content padding 12px; navbar search hides; view header stacks; stat values shrink to 18px |

**Why desktop-first for apps** (and not mobile-first like landing): the in-product user is doing focused work — writing, editing, planning. They're on a laptop or desktop. Mobile is a fallback view ("I'll check this on my phone before lunch"). Mobile-first would force every dense desktop layout to be re-derived from a phone baseline, which costs more than it earns. The landing pages, where mobile is the conversion device, stay mobile-first.

---

## 9. Iconography in-app

Same rule as landing: **Font Awesome 6 Free Solid only.** No Pro icons.

App-side icon mappings (in addition to the landing mappings in `04` §7.2):

| Concept | Icon |
|---|---|
| Sidebar toggle | `fa-bars` |
| Search | `fa-magnifying-glass` |
| Save | `fa-check` or `fa-floppy-disk` |
| AI / generation | `fa-brain` (avoid `fa-wand-magic-sparkles` — broke in Drupal per `04` §11) |
| Settings | `fa-gear` |
| User / profile | `fa-user` |
| Sign out | `fa-arrow-right-from-bracket` |
| Add new | `fa-plus` |
| Edit | `fa-pen` |
| Delete | `fa-trash` |
| Duplicate | `fa-copy` |
| Drag handle | `fa-grip-vertical` |
| Expand | `fa-chevron-down` |
| Collapse | `fa-chevron-up` |
| External link | `fa-arrow-up-right-from-square` |
| Loading | `fa-circle-notch fa-spin` |
| Success check | `fa-circle-check` |
| Warning | `fa-triangle-exclamation` |
| Error | `fa-circle-xmark` |
| Info | `fa-circle-info` |

When the same concept exists in both landing and app mappings, use the same icon. Cross-product consistency beats per-app cleverness.

---

## 10. App-side anti-patterns

In addition to the landing anti-patterns in `04` §11, these are rejected at the app level:

| Anti-pattern | Why rejected |
|---|---|
| Dark mode (yet) | Same as landing — not built. Light mode only. |
| Skeleton screens | They read as fake content and break trust when the real content arrives different. Use a centered spinner. |
| Toast for confirmations of destructive actions | Use a confirm dialog. Toasts are too easy to miss. |
| Multiple primary buttons per view | One primary action per view. If you have two, pick the truer one and demote the other to outline. |
| Sidebar > 240px or < 200px | Frozen at 210px. Wider feels heavy; narrower truncates everything. |
| Header > 56px | Frozen at 52px. Apps that need more controls should add a view-level toolbar inside the content area, not a taller navbar. |
| Custom modal sizes outside `sm/md/lg/xl` | Pick the smallest variant that fits. Custom sizes drift the system. |
| Building a new button shape per app | Pill is the default. Rectangular 12px-radius button is the only allowed alternative, reserved for dense form contexts. |
| Animating sidebar or header on view change | The shell is stable furniture. Only the view fades in. |
| Inlining inline styles for color values | Always reference a token. Hex literals belong in `:root` only. |
| Bypassing the Drupal form on save | Always submit via the Drupal save button. Direct AJAX to the node endpoint breaks the form-validation chain. |

---

## 11. Quick-reference summary

| Question | Answer |
|---|---|
| Navbar height? | 52px |
| Sidebar width (expanded / collapsed)? | 210px / 56px |
| Primary brand color in-app? | `#1a73e8` (same as landing) |
| App default button shape? | Pill (`--gua-radius-pill`) |
| App default content padding? | 24px desktop, 16px tablet, 12px phone |
| Responsive direction? | Desktop-first, max-width steps at 1200 / 992 / 768 / 480 |
| Sidebar collapses to drawer at? | ≤992px |
| Toast position? | Fixed bottom-right, z-index 10000 |
| Icon library? | Font Awesome 6 **Free Solid** only |
| Token prefix? | App-specific (`--wcp-*`, `--bpa-*`, etc.) aliasing brand `--gua-*` |
| One primary action per…? | View |
| Modal default size? | The smallest that fits — `-sm` (420px) or `-md` (560px) |
| Empty state must include? | Icon + headline + explanation + one CTA |
| Loading default? | Centered spinner — no skeletons |
| Where do app-specific navbar controls go? | Right cluster, between AI pill and Save button, max 2 |
| What stays consistent across all GUA apps? | Shell (navbar + sidebar + main + toast), token names, common components, iconography, save flow |
| What is allowed to differ per app? | Views inside the content area, domain-specific tokens, view-level toolbars, sub-renderers |

---

**End of 05-app-layout-system.md**
