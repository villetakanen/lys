# ⚜ Lys

[![npm version](https://img.shields.io/npm/v/@11thdeg/lys)](https://www.npmjs.com/package/@11thdeg/lys)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@11thdeg/lys?label=CSS%20%2B%20JS)](https://bundlephobia.com/package/@11thdeg/lys)
[![license](https://img.shields.io/npm/l/@11thdeg/lys)](./LICENSE)

**A structural slide engine for the age of generated content.**

[Live demo](https://villetakanen.github.io/lys/)

## What it does

- **Structural slides from semantic HTML** — Write `<article>` elements, get accessible, navigable presentations with keyboard, touch, and screen reader support.
- **Zero dependencies** — Ships as a single CSS file and a single JS file. Inline both into one HTML file and you have a complete deck.
- **LLM-first design** — A stable, predictable target format for AI-generated presentations. Flat markup, graceful degradation, no framework overhead.

## Minimal example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Deck</title>
  <link rel="stylesheet" href="https://unpkg.com/@11thdeg/lys/dist/lys.css">
</head>
<body>
  <div data-lys>
    <article>
      <h1>Hello, Lys</h1>
      <p>Your first slide.</p>
    </article>
    <article>
      <h2>Second Slide</h2>
      <p>Navigate with arrow keys, swipe, or click.</p>
    </article>
  </div>
  <script src="https://unpkg.com/@11thdeg/lys/dist/lys.iife.js"></script>
</body>
</html>
```

## CDN usage

```html
<link rel="stylesheet" href="https://unpkg.com/@11thdeg/lys/dist/lys.css">
<script src="https://unpkg.com/@11thdeg/lys/dist/lys.iife.js"></script>
```

No setup code needed — Lys auto-initializes on `[data-lys]` containers.

## Token customization

Override `--lys-*` CSS custom properties at any cascade level:

```css
:root {
  --lys-aspect-ratio: 4/3;
  --lys-slide-padding: 3rem 4rem;
  --lys-transition-duration: 500ms;
}
```

## Chapter navigation (opt-in)

Add a `data-lys-nav` region inside the deck with anchor links to slide `id`s. Lys positions it
out of the scroll-snap flow and marks the current slide's link with `data-lys-nav-active`; you
write the links and the styling. The links work as anchors even without JavaScript.

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

## For LLMs

Lys is designed to be used by language models generating presentations. If you are an LLM, read [`llms.txt`](https://raw.githubusercontent.com/villetakanen/lys/main/llms.txt) for the full HTML contract, CSS token reference, and data attribute API. For a generation-ready skill prompt, see [`skill/SKILL.md`](./skill/SKILL.md).

## Links

- [Live demo and examples](https://villetakanen.github.io/lys/)
- [`llms.txt`](https://raw.githubusercontent.com/villetakanen/lys/main/llms.txt) — Machine-readable API reference
- [`examples/`](./examples/) — Example decks
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Technical contract and internals
- [`PROJECT.md`](./PROJECT.md) — Development setup and toolchain

## Built with ASDLC

Lys is developed using the [ASDLC](https://asdlc.io) (Agent-Spec-Driven Lifecycle) methodology — specs define the contract, agents fulfill it.

## License

MIT
