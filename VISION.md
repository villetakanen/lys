# ⚜ Lys — Vision

> A structural slide engine for the age of generated content.

## What is Lys?

Lys is a zero-dependency CSS + TypeScript library that turns semantic HTML into accessible, navigable slide presentations. It is designed primarily as a **target format for LLMs** — a stable, predictable HTML structure that language models can generate reliably, and that humans can read, edit, and present without tooling beyond a browser.

The name means *light* in several Nordic languages. The logo is ⚜ (U+269C, fleur-de-lis).

## Core Principles

### 1. Slides are articles

Every slide is an `<article>` element inside a container. This is not a metaphor — it is the actual DOM structure. An LLM (or a human) authors a presentation by writing `<article>` elements with standard HTML content inside them. Lys handles everything else: layout, navigation, transitions, and accessibility announcements.

```html
<div data-lys>
  <article>
    <h1>First Slide</h1>
    <p>Hello, world.</p>
  </article>
  <article>
    <h2>Second Slide</h2>
    <ul>
      <li>Point one</li>
      <li>Point two</li>
    </ul>
  </article>
</div>
```

That's a complete presentation. No frontmatter, no config objects, no build step.

### 2. Visually minimal, behaviorally opinionated

Lys has **zero visual opinions** — no default fonts, no color palette, no drop shadows. The authored HTML is styled by whatever CSS the author provides, or by nothing at all.

But Lys is **heavily opinionated about behavior**. This is the gap in AI-generated slideshows: an LLM can produce markup, but it cannot reliably produce correct keyboard navigation, focus management, screen reader announcements, touch gesture handling, URL hash routing, or motion preference detection. These are exactly the things that make a slide deck *work* as an interactive presentation rather than just a styled document.

Lys makes strong, correct decisions about all of this so the generated HTML doesn't have to. The behavioral layer handles: focus trapping and restoration on slide change, ARIA live region announcements, keyboard shortcut conventions (following WAI-ARIA carousel patterns), swipe gesture thresholds, transition timing that respects `prefers-reduced-motion`, and print layout via `@media print`.

Theming, branding, and visual design live entirely in user-supplied CSS. Behavior lives entirely in Lys.

### 3. LLM-first authoring

The HTML contract is designed to be trivially correct for an LLM to produce:

- **Flat structure.** Slides are siblings, not nested. No tree of components to get wrong.
- **Standard elements only.** `<article>`, `<h1>`–`<h6>`, `<p>`, `<ul>`, `<figure>`, `<blockquote>`, `<code>`, `<table>` — nothing proprietary.
- **Optional metadata via `data-*` attributes.** Speaker notes, transition hints, and slide classes are expressed as data attributes on the `<article>`, never as separate config.
- **Graceful degradation.** If the LLM omits something or gets an attribute wrong, the slide still renders — it just doesn't get that particular enhancement.

### 4. Accessibility is structural

Because slides are semantic `<article>` elements:

- Screen readers can navigate the deck as a sequence of articles.
- Each slide has an implicit or explicit accessible name (from its heading).
- Focus management follows WAI-ARIA practices for tab panels / carousels.
- Keyboard navigation uses standard patterns (Arrow keys, Home/End, Escape).
- Slide transitions respect `prefers-reduced-motion`.
- A live region announces slide changes for assistive technology.

Accessibility is not a feature flag. It is a consequence of the structural approach.

### 5. Progressive enhancement

A Lys presentation works at three levels:

1. **No JS, no Lys CSS** — A readable HTML document. Articles flow vertically. Printable.
2. **Lys CSS only** — Scroll-snap slides with CSS-only navigation. A functional deck.
3. **Lys CSS + JS** — Full experience: keyboard/touch/swipe navigation, ARIA announcements, URL hash routing.

## What Lys is NOT

- **Not a Markdown-to-slides tool.** Lys consumes HTML. If you want Markdown, preprocess it first.
- **Not a theme library.** Bring your own CSS.
- **Not a WYSIWYG editor.** Author in a text editor (or let an LLM author for you).
- **Not a PDF exporter.** Use the browser's print-to-PDF. Lys provides a `@media print` stylesheet for this.
- **Not a framework.** No components, no state management, no virtual DOM. Just behavior on top of HTML.

## Design Goals

| Goal | Target |
|---|---|
| JS bundle size (minified + gzipped) | < 5 KB |
| CSS size (minified + gzipped) | < 2 KB |
| Time to first slide (no cache) | < 50ms |
| Dependencies | 0 |
| Minimum viable deck (HTML) | 4 lines |
| WCAG compliance | 2.1 AA |

## LLM Integration Surface

An LLM producing a Lys deck needs only this context:

```
Produce a single HTML file. Inline lys.css in a <style> tag and lys.iife.js in a <script> tag.
Wrap slides in <article> elements inside a <div data-lys>.
Use standard HTML elements. Add data-notes="..." for speaker notes.
No setup code needed — Lys auto-initializes.
```

The primary output format is a **single, self-contained HTML file** with both CSS and JS inlined. No external dependencies, no CDN links, no build step. Open the file in a browser and present. This is what makes Lys practical for LLM-generated content: the model produces one file, and it works.

## Open Questions

1. **Fragment / step support?** Should Lys handle incremental reveals within a slide (bullet-by-bullet)? This adds complexity but is a common presentation need.
2. **Plugin API?** Should third parties be able to hook into slide lifecycle (e.g., for syntax highlighting, chart rendering, live code)? Or is event-based extension sufficient?
3. **Remote control?** WebSocket-based remote for presenting from a phone — in scope or out of scope?
4. **Slide transitions** — CSS-only with `view-transition` API where supported, or a JS fallback system?

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical contract, API surface, tokens, events, file structure.
- [PROJECT.md](./PROJECT.md) — Toolchain, scaffolding, testing strategy, agentic workflow.
- [CLAUDE.md](./CLAUDE.md) — Agent constitution for working on this codebase.

---
