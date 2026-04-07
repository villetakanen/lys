# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/villetakanen/lys/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/villetakanen/lys/compare/6e5ed84...v1.0.0
[1.0.0-beta.4]: https://github.com/villetakanen/lys/compare/d2d7b46...6e5ed84
[1.0.0-beta.3]: https://github.com/villetakanen/lys/compare/7ea5fef...d2d7b46
[1.0.0-beta.1]: https://github.com/villetakanen/lys/compare/v0.1.0...7ea5fef
