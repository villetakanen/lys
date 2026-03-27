# Lys 1.0.0 Release Plan

> From v0.1.0 (core engine, navigation, a11y) to 1.0.0 (publishable, LLM-ready).

## What 0.1.0 shipped

- Core engine: init, destroy, state management, data-class, data-background
- Navigation: keyboard, touch/swipe, hash routing
- Accessibility: ARIA roles, live region, focus management, focus ring
- CSS: two-tier tokens, scroll-snap layout, print, reduced motion
- 117 unit tests across 4 test files

## What 1.0.0 means

A version that can be published to npm, referenced from CDN, discovered by search engines and LLMs, and used by LLMs to generate working presentations. The public web presence (GitHub Pages site, README, `llms.txt`, `SKILL.md`) is the integration surface — without it, Lys is invisible to both machines and humans.

## Work Items

### WI-1: Slide transitions (`data-transition`)

**Status:** In article contract, not implemented.
**Issue:** New — needs filing.
**Spec:** Needs writing (`specs/transitions.spec.md`).

The `data-transition` attribute is declared in ARCHITECTURE.md and lys-core.spec.md but has no implementation. For 1.0, two modes:

- **Default (no attribute)** — Scroll-snap behavior. This is the baseline and should not require any markup.
- **`fade`** — Opacity crossfade between slides. Requires switching from scroll-snap to a stacked layout for the affected deck (position: absolute, JS-driven visibility with opacity transitions). Must respect `prefers-reduced-motion`.

The `fade` transition fundamentally conflicts with scroll-snap (which physically scrolls). When `data-transition="fade"` is present on any slide in a deck, the deck switches to a stacked layout model where slides are positioned absolutely and visibility is controlled via opacity + JS. This is a per-deck decision, not per-slide — mixing scroll-snap and fade within one deck is not supported.

No other transition values for 1.0. The contract reserves `data-transition` for future values but only `fade` is implemented.

### WI-2: End-to-end tests (#9)

**Status:** Open issue. A11y e2e tests written but not yet run. No e2e tests for core slides, print, or navigation.
**Issue:** #9 (update scope — remove presenter references).

Scope for 1.0:
- Run the existing `tests/e2e/a11y.spec.ts` against real browsers
- Add `tests/e2e/slides.spec.ts` — basic slide rendering, scroll-snap, data-background
- Add `tests/e2e/navigation.spec.ts` — keyboard nav, touch (if Playwright supports it), hash routing
- Add `tests/e2e/print.spec.ts` — print layout (emulated print media)
- Transition e2e tests (after WI-1)

Playwright config already targets Chromium, Firefox, WebKit.

### WI-3: Example files (#10)

**Status:** `minimal.html` and `demo.html` exist. `themed.html` and `full.html` do not.
**Issue:** #10.

- `themed.html` — Themed with ASDLC.io's design system (pull colors, typography, spacing from their website). Demonstrates token customization with a real-world design language, not a toy theme.
- `full.html` — All features: data-class, data-background, data-notes, data-timing, data-transition, hash routing, multiple slides

These serve double duty: human reference and test fixtures for e2e.

### WI-4: Docs cleanup

**Status:** CLAUDE.md and ARCHITECTURE.md have stale presenter references.
**Issue:** New — needs filing or bundled with another WI.

- CLAUDE.md: Remove presenter references from context paragraph, key architecture decisions, commit example, and test/spec alignment table
- ARCHITECTURE.md: Clean up remaining presenter mentions (file structure still lists `presenter.ts`)
- Verify `specs/presenter.spec.md` row is removed from CLAUDE.md alignment table

### WI-5: `llms.txt` and `SKILL.md` (#11)

**Status:** Not started. These are derived artifacts — they should be written after the API surface is frozen.
**Issue:** #11.

**`llms.txt`** — Machine-readable project description:
- Article contract (container, slide attributes, tokens)
- Event names and detail shapes
- Minimal complete inline example
- Built file sizes

**`skill/SKILL.md`** — Claude Code skill for generating Lys presentations:
- HTML contract and token reference
- Slide patterns (title, content, code, image, multi-column)
- Quality checks (valid structure, a11y, progressive enhancement)
- Complete example output

Both are generated from the actual built output + specs, not speculated.

### WI-6: Project web presence

**Status:** README exists but is likely minimal. No GitHub Pages site.
**Issue:** New.

Three layers, all serving the same goal — a stranger (human or LLM) finds Lys and immediately understands what it is and how to use it.

#### GitHub README

The README is the landing page. It needs to do the job in 10 seconds:

- One-line pitch + badge row (npm version, bundle size, license)
- Live demo link (→ GitHub Pages)
- "What it does" — 3 bullets max, not a feature matrix
- Minimal inline example (the 4-line deck from VISION.md)
- CDN script tags (`unpkg.com/lys`)
- Token customization snippet
- Links to: GitHub Pages site, `llms.txt`, examples, ARCHITECTURE.md
- "For LLMs" section pointing to `llms.txt` and the skill

No install-from-source instructions in the README body — that's contributor docs, link to CONTRIBUTING.md or PROJECT.md if needed.

#### GitHub Pages site

A single-page site deployed from `gh-pages` branch (or `/docs` folder on main). Purpose: live demo + documentation that works over HTTPS.

Content:
- **Hero** — Live embedded Lys deck (the `full.html` example or a purpose-built demo). Visitors see the product immediately.
- **Quick start** — CDN tags + minimal HTML
- **Token reference** — The `--lys-*` custom properties with defaults
- **Article contract** — The `data-*` attributes table
- **Examples** — Links to the example HTML files (served from the same Pages site, so they work as live demos)

Technical approach:
- A conventional static HTML page — not a Lys deck. Slide-deck-as-landing-page is a cool flex but hurts SEO, accessibility, and LLM readability. The site needs to be a normal document that search engines and LLMs can parse as prose.
- Embedded live Lys demo within the page (an `<iframe>` or inline `<div data-lys>` section) to show the product in action.
- No framework, no SSG. A single `index.html` with standard HTML.
- GitHub Pages deployment via GitHub Actions on push to main.

#### SEO and discoverability

- `<meta name="description">` on the Pages site
- OpenGraph tags (`og:title`, `og:description`, `og:image`) — a screenshot or diagram of a Lys deck
- `<link rel="canonical">` pointing to the Pages URL
- `llms.txt` served at the Pages root (`https://<user>.github.io/lys/llms.txt`) — this is the [llms.txt convention](https://llmstxt.org/) for LLM discoverability
- npm `"homepage"` field pointing to the Pages site (shows on npmjs.com)
- npm `"repository"` field (shows on npmjs.com)
- GitHub repo description and topics (`slides`, `presentation`, `css`, `accessible`, `llm`, `zero-dependency`)

The Pages URL becomes the canonical identity: README links to it, npm links to it, `llms.txt` lives there, examples are accessible over HTTPS.

### WI-7: npm publish preparation

**Status:** package.json is mostly ready (exports, files, keywords).
**Issue:** New.

- Version bump to `1.0.0`
- Verify `"files"` field includes only `dist/`
- Add `"types"` field if not auto-resolved
- Ensure `pnpm build` produces `.d.ts` files (check vite/tsc config)
- Add `"repository"`, `"homepage"`, `"bugs"` fields
- Test with `pnpm pack` — verify tarball contents
- `npm publish` (or `pnpm publish`)

CDN usage works automatically via unpkg/jsdelivr once published.

## Dependency Order

```
WI-4 (docs cleanup) ──────────────────────────────┐
WI-1 (transitions) → WI-2 (e2e tests) ───────────┤
WI-3 (examples) ──────────────────────────────────┤
                                                    ├→ WI-5 (llms.txt + SKILL.md) ─┐
                                                    ├→ WI-6 (web presence + README) ─┤→ WI-7 (publish)
```

- WI-1, WI-3, WI-4 can run in parallel (no dependencies)
- WI-2 depends on WI-1 (transition e2e tests) and benefits from WI-3 (examples as fixtures)
- WI-5 and WI-6 need the API surface frozen (all features done, examples complete)
- WI-6 needs WI-5 (`llms.txt` is served from the Pages site)
- WI-7 is the final step — version bump, `pnpm pack`, `npm publish`, tag `v1.0.0`

## Out of Scope for 1.0

Per [ADR-001](../docs/adr/001-defer-presenter-mode.md):
- Presenter mode (window, BroadcastChannel, timer, overview)
- `lys.presenter()` API
- `lys:presenter` event

Per VISION.md open questions (unresolved):
- Fragment/step support (incremental reveals)
- Plugin API
- Remote control
- View Transitions API integration

## Definition of Done for 1.0.0

- [ ] All existing unit tests pass (117+)
- [ ] E2e tests pass across Chromium, Firefox, WebKit
- [ ] `data-transition="fade"` works with reduced-motion fallback
- [ ] `themed.html` and `full.html` examples are complete
- [ ] CLAUDE.md and ARCHITECTURE.md have no stale presenter references
- [ ] `llms.txt` accurately describes the 1.0 API surface
- [ ] `skill/SKILL.md` can be used by Claude to generate a valid Lys deck
- [ ] GitHub README is polished with badges, examples, and links
- [ ] GitHub Pages site is live with demo, quick start, and token reference
- [ ] `llms.txt` is accessible at the Pages URL over HTTPS
- [ ] OpenGraph and meta tags are set on the Pages site
- [ ] npm `"homepage"` points to the Pages site
- [ ] `pnpm pack` produces a clean tarball with only `dist/`
- [ ] Bundle sizes within budget: JS < 5 KB gzip, CSS < 2 KB gzip
- [ ] Version is `1.0.0` in package.json
- [ ] Tagged `v1.0.0` and published to npm
