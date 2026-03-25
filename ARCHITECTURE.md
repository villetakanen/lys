# ⚜ Lys — Architecture

> Technical contract, API surface, and structural reference.

This document defines *how* Lys works. For *why* it exists and what it values, see [VISION.md](./VISION.md).

Lys is visually unopinionated but **behaviorally opinionated**. Everything below — navigation, focus management, ARIA announcements, presenter sync, transition handling — represents strong, deliberate decisions that free authors (human or LLM) from having to get these right themselves.

## Distribution

Lys ships as:

- **`lys.css`** — The structural stylesheet. Can be used standalone for CSS-only decks.
- **`lys.ts` / `lys.js`** — The behavioral layer. Auto-initializes on `data-lys` containers.
- **ESM module** — `import { Lys } from 'lys'`
- **Script tag** — `<script src="lys.js"></script>` (auto-init via IIFE, exposes `window.Lys`)

### Single-File Inline Usage

A core design requirement is that an LLM can produce a **complete, self-contained presentation as a single HTML file** by inlining both the CSS and JS. The build must produce outputs that are small and clean enough to embed directly:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Deck</title>
  <style>/* contents of lys.css pasted here */</style>
  <style>
    /* author's own theme */
    :root { --lys-aspect-ratio: 16/9; }
  </style>
</head>
<body>
  <div data-lys>
    <article><h1>First Slide</h1></article>
    <article><h2>Second Slide</h2></article>
  </div>
  <script>/* contents of lys.iife.js pasted here */</script>
</body>
</html>
```

This means:

- **lys.css must be self-contained.** No `@import`, no external references, no `url()` pointing to other files.
- **lys.iife.js must be self-contained.** No dynamic `import()` in the IIFE build (presenter mode lazy-loading uses dynamic import only in the ESM build; the IIFE build must bundle everything).
- **Both must be small enough to inline.** The size budgets (< 2 KB CSS, < 6 KB IIFE JS gzipped) are designed with inline usage in mind — raw (uncompressed) should stay well under 20 KB total.
- **No initialization boilerplate.** The IIFE auto-discovers `[data-lys]` on DOMContentLoaded. Zero lines of setup code needed from the author.

This single-file pattern is the **primary LLM output format**. External `<link>` and `<script src>` are alternatives for multi-file projects, not the default.

## The `<article>` Contract

Each `<article>` inside a `[data-lys]` container is a slide. Optional data attributes:

| Attribute | Purpose | Example |
|---|---|---|
| `data-notes` | Speaker notes (plain text or HTML) | `data-notes="Mention the Q3 figures here"` |
| `data-transition` | Transition hint | `data-transition="fade"` |
| `data-class` | Additional CSS classes for this slide | `data-class="title-slide dark"` |
| `data-background` | Background shorthand (color, image URL, or gradient) | `data-background="#1a1a2e"` |
| `data-timing` | Suggested duration in seconds | `data-timing="30"` |

## CSS Design Tokens

Lys uses a two-tier custom property convention to give authors full control while maintaining sane defaults. Internal properties (prefixed `--_lys-`) resolve against public tokens (prefixed `--lys-`) with fallback defaults:

```css
/* Internal — consumed by lys.css, never set by authors */
--_lys-aspect-ratio: var(--lys-aspect-ratio, 16/9);
--_lys-slide-padding: var(--lys-slide-padding, 2rem);
--_lys-transition-duration: var(--lys-transition-duration, 300ms);
--_lys-transition-easing: var(--lys-transition-easing, ease-in-out);
--_lys-font-size-base: var(--lys-font-size-base, clamp(1rem, 2vw, 1.5rem));
--_lys-slide-gap: var(--lys-slide-gap, 0);
--_lys-slide-max-width: var(--lys-slide-max-width, 100vw);
--_lys-slide-max-height: var(--lys-slide-max-height, 100vh);
--_lys-focus-ring: var(--lys-focus-ring, 2px solid currentColor);
```

Authors override by setting the public token at any level — `:root`, the `[data-lys]` container, or a single `<article>`:

```css
/* Global override */
:root {
  --lys-aspect-ratio: 4/3;
  --lys-slide-padding: 3rem 4rem;
}

/* Per-deck override */
.widescreen[data-lys] {
  --lys-aspect-ratio: 21/9;
}

/* Per-slide override */
article.compact {
  --lys-slide-padding: 1rem;
}
```

The `--_lys-` prefix signals "hands off" — authors interact only with the `--lys-` API surface.

## Navigation

Lys handles navigation through:

- **Keyboard** — `ArrowRight`/`ArrowLeft`, `Space`/`Shift+Space`, `Home`/`End`, number keys for direct jump.
- **Touch** — Horizontal swipe gestures with configurable threshold.
- **URL hash** — `#slide=3` or `#slide=intro` (by `id` attribute on article).
- **API** — `lys.next()`, `lys.prev()`, `lys.goTo(n)`, `lys.goTo('intro')`.

## Presenter Mode

Activated via `Ctrl+Shift+P` or `lys.presenter()`. Opens a separate window (or panel) containing:

- Current slide preview
- Next slide preview
- Speaker notes for the current slide
- Elapsed timer and per-slide timer
- Slide counter (`3 / 17`)
- Slide overview grid (thumbnail navigation)

Presenter mode communicates with the main deck via `BroadcastChannel`, so it works across windows on the same origin.

## Events

Lys emits custom events on the container element:

- `lys:slidechange` — `{ detail: { from: number, to: number, slide: HTMLElement } }`
- `lys:ready` — Initialization complete.
- `lys:presenter` — Presenter mode opened/closed.

## Programmatic API

```typescript
interface LysInstance {
  // Navigation
  next(): void;
  prev(): void;
  goTo(index: number | string): void;

  // State
  readonly current: number;
  readonly total: number;
  readonly slide: HTMLElement;

  // Presenter
  presenter(): void;

  // Lifecycle
  destroy(): void;
}

// Auto-init returns instances for all [data-lys] containers
const instances: LysInstance[] = Lys.init();

// Or target a specific container
const deck: LysInstance = new Lys(document.getElementById('my-deck'));
```

## File Structure

```
/Projects/Lys/
  VISION.md              ← product vision & principles
  ARCHITECTURE.md        ← you are here — technical contract
  PROJECT.md             ← toolchain, scaffolding, workflow
  CLAUDE.md              ← agent constitution
  src/
    lys.css              ← structural styles + design tokens
    lys.ts               ← entry point, auto-init, public API
    navigation.ts        ← keyboard, touch, hash routing
    presenter.ts         ← presenter mode (lazy-loaded)
    a11y.ts              ← ARIA live region, focus management
    types.ts             ← shared type definitions
  specs/
    lys-core.spec.md     ← spec: slide rendering, tokens, layout
    navigation.spec.md   ← spec: keyboard, touch, hash routing
    presenter.spec.md    ← spec: presenter mode
    a11y.spec.md         ← spec: accessibility contract
  tests/
    unit/                ← Vitest + happy-dom
    e2e/                 ← Playwright (real browser)
    fixtures/            ← standalone HTML decks for testing
  examples/
    minimal.html         ← 4-line deck
    themed.html          ← custom tokens + author CSS
    full.html            ← all features demonstrated
  dist/                  ← build output (git-ignored)
  llms.txt               ← LLM-readable project description (post-build)
  skill/
    SKILL.md             ← Cowork / Claude Code skill for Lys authoring
  LICENSE
  README.md
```

## LLM Deliverables

Two artifacts are generated **after** the library is built and stable — not speculated upfront. They are derived from the actual implementation, not the vision.

### `llms.txt`

A machine-readable project description following the `llms.txt` convention. Contains the article contract, token API, data attributes, event names, and a minimal complete example. This is what an LLM reads to learn how to author a Lys deck — it replaces the need to read source code or long documentation.

Generated from: VISION.md (contract sections) + actual `dist/` output (verified API surface).

### `skill/SKILL.md`

A Cowork / Claude Code skill that teaches an agent to produce Lys presentations on demand. Includes the HTML contract, token reference, example patterns (title slides, code slides, image slides, multi-column layouts), and quality checks (valid structure, a11y attributes, progressive enhancement).

Generated from: `llms.txt` + `examples/*.html` + `specs/*.spec.md`.

The skill is the highest-level integration — it turns "make me a presentation about X" into a correct Lys HTML file without the user needing to know anything about the library.

---
