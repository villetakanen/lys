# ⚜ Lys

[![npm version](https://img.shields.io/npm/v/@11thdeg/lys)](https://www.npmjs.com/package/@11thdeg/lys)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@11thdeg/lys?label=CSS%20%2B%20JS)](https://bundlephobia.com/package/@11thdeg/lys)
[![license](https://img.shields.io/npm/l/@11thdeg/lys)](./LICENSE)

**Portable presentations whose authored composition survives delivery.**

[Live demo](https://villetakanen.github.io/lys/)

## What it does

Lys gives HTML presentations a consistent engine. Authors should not have to reinvent navigation for every deck, and viewers should not have to discover whether Down or Right advances it.

- **Predictable operation** — Keyboard and swipe navigation, focus management, slide announcements, and reduced-motion handling.
- **Author-controlled composition** — Semantic `<article>` slides provide CSS size containers. Author CSS defines the contents; Lys fits the slide surface to the viewing area at its authored aspect ratio.
- **Portable delivery** — Zero runtime dependencies. Embed the engine, author CSS, and required assets in one HTML file for offline viewing.

Lys targets evergreen browsers as of August 2026. Its accessibility goal concerns the engine's operation; using Lys does not establish accessibility of the authored content.

## Delivery

The primary delivery format is a self-contained HTML file. Inline `dist/lys.css` and `dist/lys.iife.js`, include your theme, and embed any required images, fonts, and media. The recipient can open the file locally without a server or build step. Hosted and multi-file decks are also supported.

The example below uses a CDN for a quick start and **requires network access**. Replace its external stylesheet and script with their inline contents for standalone delivery.

## Minimal example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Deck</title>
  <link rel="stylesheet" href="https://unpkg.com/@11thdeg/lys@1.2.5/dist/lys.css">
  <style>
    body { margin: 0; }
    [data-lys] { --lys-backdrop: #dedee3; }
    [data-lys] > article { padding: 0; background: #fff; color: #17171b; }
    .slide-content {
      box-sizing: border-box;
      height: 100%;
      padding: 6cqi;
      font: 3cqi/1.4 system-ui, sans-serif;
    }
    .slide-content h1, .slide-content h2 { margin: 0 0 0.5em; font-size: 2em; }
    .slide-content p { margin: 0; }
  </style>
</head>
<body>
  <div data-lys>
    <article>
      <div class="slide-content">
        <h1>Hello, Lys</h1>
        <p>Your first slide.</p>
      </div>
    </article>
    <article>
      <div class="slide-content">
        <h2>Second Slide</h2>
        <p>Use Right or Down to advance; Left or Up to go back.</p>
      </div>
    </article>
  </div>
  <script src="https://unpkg.com/@11thdeg/lys@1.2.5/dist/lys.iife.js"></script>
</body>
</html>
```

The example theme explicitly sets slide colours, spacing, and typography. The inner content uses the article’s CSS container for sizing; it keeps the same composition as the slide scales.

## CDN usage

```html
<link rel="stylesheet" href="https://unpkg.com/@11thdeg/lys@1.2.5/dist/lys.css">
<script src="https://unpkg.com/@11thdeg/lys@1.2.5/dist/lys.iife.js"></script>
```

No setup code needed — Lys auto-initializes on `[data-lys]` containers.

## Token customization

Use public `--lys-*` properties for engine configuration. For example, pair a screen aspect ratio with a matching print page size:

```css
:root {
  --lys-aspect-ratio: 4/3;
  --lys-print-page-size: 10in 7.5in;
  --lys-transition-duration: 500ms;
}
```

`--lys-print-page-size` must be set at `:root`. See [Architecture](./ARCHITECTURE.md) for token scopes and the full reference.

Version 1.2.5 still supplies padding, base font-size, and inherited foreground defaults. The [vision](./VISION.md) establishes a stricter author-owned surface; removing those defaults is pending compatibility work. Explicit author styling, as above, avoids relying on them.

## Viewing and fallback access

CSS and JavaScript together provide the intended engine experience. Current navigation includes Right/Down for next, Left/Up for previous, Home/End for first/last, and horizontal swipes. There is no default click-anywhere navigation or visible navigation toolbar.

With JavaScript disabled and Lys CSS retained, slides remain available through browser scrolling and authored anchor links. Removing Lys preserves the HTML semantics, but author styles may depend on its container geometry. Smaller screens show the same composition at a smaller scale; fitting the screen does not guarantee comfortable reading of every authored detail.

## Chapter navigation (opt-in)

Add a `data-lys-nav` region inside the deck with anchor links to slide `id`s. Lys positions it
out of the scroll-snap flow and marks the current slide's link with `aria-current="true"` and
`data-lys-nav-active`; you write the links and the styling. The links work as anchors even without JavaScript.

```html
<div data-lys>
  <nav data-lys-nav aria-label="Slides">
    <a href="#intro">Intro</a>
    <a href="#results">Results</a>
  </nav>
  <article id="intro"><h1>Intro</h1></article>
  <article id="results"><h2>Results</h2></article>
</div>
```

See [`examples/nav.html`](./examples/nav.html).

## Authoring with agents

Agents are a primary authoring audience. Read [`llms.txt`](https://raw.githubusercontent.com/villetakanen/lys/main/llms.txt) for the HTML contract, CSS tokens, and metadata. The delivered authoring guidance is in [`skill/SKILL.md`](./skill/SKILL.md).

## Links

- [Live demo and examples](https://villetakanen.github.io/lys/)
- [`llms.txt`](https://raw.githubusercontent.com/villetakanen/lys/main/llms.txt) — Machine-readable API reference
- [`examples/`](./examples/) — Example decks
- [`VISION.md`](./VISION.md) — Product intent and responsibility boundaries
- [`DESIGN.md`](./DESIGN.md) — Accepted palette for Lys-authored presentation materials
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Technical contract and internals
- [`PROJECT.md`](./PROJECT.md) — Development setup and toolchain

## Built with ASDLC

Lys is developed using the [ASDLC](https://asdlc.io) (Agent-Spec-Driven Lifecycle) methodology — specs define the contract, agents fulfill it.

## License

MIT
