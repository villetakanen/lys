# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Added discovery metadata to the Lys authoring skill so agent tools can identify it and know when to use it (#70). Rebuilding preserves the metadata.

## [1.2.3] — 2026-10-12

### Changed

- The progressive-enhancement slides in `full.html` and `demo.html` are now an aligned matrix of capabilities against the three tiers (no JS and no CSS, CSS only, CSS + JS) instead of three prose cards. This follows the one finding in the Kata 0.2.0 evaluation (`docs/reports/`) where a pattern was judged to clearly improve a slide. The size budget on the demo slide is separated from the tiers.
- The workflow slide in `themed.html` now shows the Ship → Spec feedback loop that its speaker notes described but the diagram omitted, and states what the arrows mean.

### Fixed

- Slide-number comments in `full.html` were off by one from the "What's new" slide onward.

## [1.2.2] — 2026-10-12

### Changed

- Agent harness moved to the cross-tool standard layout. `AGENTS.md` is now the canonical instruction file with `CLAUDE.md` symlinked to it, and the former `.claude/commands/*.md` slash commands are now skills under `.agents/skills/<name>/SKILL.md`, with `.claude/skills` symlinked to that directory. Every skill carries `name`/`description` frontmatter so it is discoverable by any agent that reads the standard directories.

### Added

- The [Kata](https://github.com/villetakanen/kata) 0.2.0 slide-pattern skill is vendored at `.agents/skills/kata/` for use when designing or reviewing example decks. No runtime or package contents changed.

## [1.2.1] — 2026-08-11

### Fixed

- Printed slides no longer clip their content (#63). The `--lys-print-page-size` default introduced in 1.2.0 was `10in 5.625in`, a 960 px slide — narrower than the ~1280 px decks are usually authored at. Content sized in absolute units does not shrink with the slide, so it overflowed and was cut off; three slides of the bundled `full.html` lost text, one of them half a heading. The default is now `13.333in 7.5in` (1280×720 px, the PowerPoint/Keynote widescreen size). Authors who preferred the smaller page can set the token.
- Example decks are legible in a light color scheme (#62). `full.html` and `square.html` pinned their dark backdrop but left the text color adaptive, so it flipped to black over their dark slides — 1.06:1 — in a light OS theme and in every print, since Chrome always prints in the light scheme. Both decks now pin the foreground alongside the backdrop.
- The published `demo.html` and `full.html` examples load JavaScript again (#64). The site build rewrote their `import { Lys } from "/src/lys.ts"` to a bare `"lys.iife.js"` specifier that browsers cannot resolve, pointing at a build with no exports — so those two decks had no keyboard navigation, no ARIA, no hash routing and no `data-class` on the live site. They now load the ESM build.

### Changed

- `square.html` prints at its own 24:10 ratio via `--lys-print-page-size`, demonstrating the token on a non-16:9 deck.

## [1.2.0] — 2026-08-11

### Added

- `--lys-print-page-size` token (default `10in 5.625in`) sets the page box for printed output (#60). Accepts any valid `@page` size — `landscape`, `A4 landscape`, or an explicit `<length> <length>` pair. Unlike every other token, it must be set at `:root`: the page context inherits custom properties from the root element only, so a value set on the deck or a single slide has no effect.

### Fixed

- Printing produced unusable pages (#60). Slides printed as a letterbox strip pinned to the top of a portrait sheet — a 16:9 deck covered 43% of the page and a 24:10 deck 32%, wasting the rest. Slides are sized to fit the viewport, and in print the "viewport" is the page box, which stayed portrait because no page size was declared. Decks now print to a landscape, ratio-matched page, so a 16:9 deck fills the page edge to edge. A deck whose ratio differs from the page is letterboxed or pillarboxed and centered, never cropped.
- Every deck printed a trailing blank page once JavaScript had initialized. The rule that suppresses the final page break matched only when the last slide was the deck's last element, and the ARIA live region added at startup took that position. Present since the print stylesheet shipped in 1.0.0.
- Slide backgrounds are no longer dropped when printing. Chrome prints with its **Background graphics** option off by default, which removed each slide's background while keeping its text color — taking dark decks to unreadable light-grey-on-white. Backgrounds are now forced to print; the out-of-slide backdrop still prints transparent, so no ink is spent on it.
- `--lys-slide-gap` no longer displaces printed slides. The gap between slides was applied in print too, pushing every slide after the first down inside its own page.

### Changed

- Slides stay container-query containers when printing, so `cqi`-based type and spacing resolve against the slide rather than the page. Print typography is now proportional to the on-screen result instead of diverging from it. Decks that relied on the previous fallback may see different printed text sizes — closer to what the deck looks like on screen.
- A `data-lys-nav` chapter navigation region is hidden when printing rather than moved into the flow. In the flow it consumed space at the top of the first page and pushed the opening slide onto a second sheet. The region and its links are unchanged on screen and remain in the accessibility tree.

## [1.1.1] — 2026-06-26

### Fixed

- Reduced motion now disables fade transitions. The `prefers-reduced-motion: reduce` override set `--_lys-transition-duration: 0ms` only on the `[data-lys]` container, but the slide re-declares that token (for per-slide overrides), so the container reset was shadowed and fade slides kept animating. The override now also applies to `[data-lys] > article`. Surfaced by pointing the e2e suite at the real demo decks (#54).
- Bundled example decks now render correctly in a light OS theme (#51). The fixed-theme demos left `--lys-backdrop` at its adaptive default, so the letterbox area followed the viewer's system scheme — a dark deck (e.g. `examples/square.html`) showed white bands in light mode, and light decks would show black bands in dark mode. Each fixed-theme deck now pins `--lys-backdrop` to its palette; `examples/minimal.html` stays adaptive as the exemplar. Examples only — the published library output is unchanged.

### Changed

- E2E tests now load the shipped demo decks (`examples/*.html`) as fixtures instead of duplicate purpose-built fixtures, so a change that breaks a demo fails CI (#54). This dog-fooding is what surfaced the reduced-motion fix above. Purpose-built fixtures remain only for cases no demo demonstrates: library defaults, mixed transitions, direct mode, form inputs, and multiple decks on one page.

## [1.1.0] — 2026-06-23

### Added

- Opt-in chapter navigation (#42): add `data-lys-nav` to a nav region inside the deck with `<a href="#id">` links to slide `id`s. Lys positions the region out of the scroll-snap flow and marks the current slide's link with `aria-current="true"` and `data-lys-nav-active`; you provide the links and all styling. The active link follows scroll position and slide changes; links work as anchors without JavaScript. No new tokens and no per-article attribute. See `examples/nav.html`.

### Fixed

- Dark-mode legibility (#47): unstyled decks were black-on-black (illegible) in dark mode — the backdrop adapted but slide text inherited black. Slides now get an accessible default `color: light-dark(#000, #fff)` (the inverse of the backdrop, maximum contrast) so minimal markup stays readable in both color schemes. The slide background stays transparent and authors override with standard `color` CSS; no new token.

## [1.0.2] — 2026-06-22

### Changed

- Published under the scoped npm name `@11thdeg/lys` (the unscoped `lys` is owned by an unrelated package). Install with `npm install @11thdeg/lys`; CDN URLs use `unpkg.com/@11thdeg/lys`. No prior version was published to npm, so there is no migration.

### Fixed

- Aspect-ratio conformity (#45): slides now honor `--lys-aspect-ratio` on every viewport instead of silently adopting the viewport's own ratio. Slides are sized to fit inside the viewport at the configured ratio (contain-fit — both axes bounded, smaller governs, centered with `--lys-backdrop` in the letterbox/pillarbox margins). Previously a `100vh` height pin forced the viewport ratio on mobile and non-16:9 desktops. Applies to both default scroll-snap and stacked (fade/direct) modes.

## [1.0.0] — 2026-04-07

### Added

- TypeScript declaration files (`lys.d.ts`) now included in the npm package.
- Automated npm publish workflow — tagged releases are built, tested, and published via CI.

## [1.0.0-beta.4] — 2026-03-31

### Added

- Adaptive backdrop color for the out-of-slide area, using `light-dark()` to match the user's color scheme. Customizable via the new `--lys-backdrop` token.
- `container-type: size` on slide articles, enabling container queries within slides.

### Fixed

- Stacked mode navigation bug where arrow keys could fail to advance slides.

### Changed

- Token defaults now use container-relative units (`cqi`) instead of viewport/rem units. `--lys-slide-padding` default changed from `5%` to `4cqi`. `--lys-font-size-base` default changed from `clamp(1rem, 2.5vw, 2rem)` to `clamp(0.75rem, 2.5cqi, 1.5rem)`. This makes slides scale relative to their container rather than the viewport.

## [1.0.0-beta.3] — 2026-03-30

### Added

- `data-transition="direct"` mode for instant slide switching with no animation.
- Per-slide transition overrides — `data-transition` can now be set on individual `<article>` elements, not just the deck container.

### Fixed

- Flash of unstyled content (FOUC) on fade and direct mode initialization.
- Distracting focus ring on slides removed — slides no longer show a visible outline when focused for keyboard navigation.

## [1.0.0-beta.1] — 2026-03-27

### Added

- Core slide engine: `<article>` elements inside a `[data-lys]` container become navigable slides.
- CSS layout engine with design tokens (`--lys-aspect-ratio`, `--lys-slide-padding`, `--lys-transition-duration`, `--lys-transition-easing`, `--lys-font-size-base`, `--lys-slide-gap`, `--lys-slide-max-width`, `--lys-slide-max-height`, `--lys-focus-ring`).
- Two-tier token system: authors set `--lys-*` public tokens; internals resolve via `--_lys-*` with fallback defaults.
- Keyboard navigation: Arrow keys, Space/Shift+Space, Home/End, number keys for direct jump.
- Touch/swipe navigation with configurable gesture threshold.
- URL hash routing (`#slide=3` or `#slide=intro` by article `id`).
- Programmatic API: `Lys.init()`, `lys.next()`, `lys.prev()`, `lys.goTo()`, `lys.destroy()`.
- IIFE build with auto-initialization on `DOMContentLoaded` — zero setup code needed.
- ARIA roles, live region announcements, and focus management for screen readers.
- `data-transition="fade"` mode with opacity crossfade transitions.
- Scroll-snap mode as the CSS-only progressive enhancement fallback.
- `prefers-reduced-motion` support across all transition modes.
- Print stylesheet via `@media print` — one slide per page.
- Custom events: `lys:ready` and `lys:slidechange` on the container element.
- `llms.txt` and authoring skill for LLM-generated presentations.
- Example decks: minimal, themed, full-featured, and 1:1 aspect ratio.
- GitHub Pages site with token reference, article contract, and live examples.

[Unreleased]: https://github.com/villetakanen/lys/compare/v1.2.3...HEAD
[1.2.3]: https://github.com/villetakanen/lys/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/villetakanen/lys/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/villetakanen/lys/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/villetakanen/lys/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/villetakanen/lys/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/villetakanen/lys/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/villetakanen/lys/compare/v1.0.0...v1.0.2
[1.0.0]: https://github.com/villetakanen/lys/compare/6e5ed84...v1.0.0
[1.0.0-beta.4]: https://github.com/villetakanen/lys/compare/d2d7b46...6e5ed84
[1.0.0-beta.3]: https://github.com/villetakanen/lys/compare/7ea5fef...d2d7b46
[1.0.0-beta.1]: https://github.com/villetakanen/lys/compare/v0.1.0...7ea5fef
