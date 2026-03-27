# ⚜ Lys

**A structural slide engine for the age of generated content.**

Lys turns semantic HTML into accessible, navigable slide presentations. Write `<article>` elements — Lys handles the rest.

## Quick Start

A single HTML file with everything inlined — no external dependencies:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Deck</title>
  <style>/* contents of lys.css */</style>
</head>
<body>
  <div data-lys>
    <article>
      <h1>Hello, Lys</h1>
      <p>Your first slide.</p>
    </article>
    <article>
      <h2>Second Slide</h2>
      <p>Navigate with arrow keys, swipe, or the API.</p>
    </article>
  </div>
  <script>/* contents of lys.iife.js */</script>
</body>
</html>
```

Open in a browser. That's it — a complete, accessible, navigable presentation in one file.

## Features

- **Zero dependencies** — CSS + JS, nothing else.
- **Semantic HTML** — Slides are `<article>` elements. Screen readers, search engines, and print stylesheets understand them natively.
- **Progressive enhancement** — Works as a plain document (no JS), as scroll-snap slides (CSS only), or as a full interactive deck (CSS + JS).
- **LLM-friendly** — Designed as a stable target format for AI-generated presentations. Flat structure, standard elements, graceful degradation.
- **CSS design tokens** — Override `--lys-aspect-ratio`, `--lys-slide-padding`, and more at any cascade level.
- **Accessible by default** — WCAG 2.1 AA. ARIA live regions, focus management, `prefers-reduced-motion` support.

## Usage

### Single-file inline (primary — the LLM output format)

Paste the contents of `lys.css` into a `<style>` tag and `lys.iife.js` into a `<script>` tag. No setup code — Lys auto-initializes on `[data-lys]` containers.

### External files (multi-file projects)

```html
<link rel="stylesheet" href="lys.css">
<script src="lys.iife.js"></script>
```

### ES module

```js
import { Lys } from './lys.js';

const deck = new Lys(document.querySelector('[data-lys]'));
```

### Custom tokens

```css
:root {
  --lys-aspect-ratio: 4/3;
  --lys-slide-padding: 3rem 4rem;
  --lys-transition-duration: 500ms;
}
```

## Development

```bash
pnpm install
pnpm dev          # Vite dev server
pnpm build        # TypeScript check + Vite library build
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright browser tests
pnpm lint         # Biome lint + format
```

## Documentation

| Document | Purpose |
|---|---|
| [VISION.md](./VISION.md) | Product vision and principles |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical contract, API, tokens, events |
| [PROJECT.md](./PROJECT.md) | Toolchain, scaffolding, testing, workflow |
| [CLAUDE.md](./CLAUDE.md) | Agent constitution for AI-assisted development |

## Size Budget

| Artifact | Target |
|---|---|
| `lys.js` (ESM, gzip) | < 5 KB |
| `lys.css` (gzip) | < 2 KB |

## License

MIT

---
