# Default Colors (Backdrop + Slide Foreground)

## Blueprint (Design)

### Context

When slides are narrower than the viewport — due to aspect-ratio constraints, `--lys-slide-max-width`, or non-native ratios on widescreen monitors — the `[data-lys]` container background is visible around the slides. Lys sets a default background on the container that adapts to the user's `prefers-color-scheme`: dark mode gets a dark backdrop, light mode a light one, overridable via `--lys-backdrop`.

**That adaptation was half-done (#47).** The backdrop adapts, but Lys set no text color, so slide text inherits the default black from `<body>` (which sits outside the container's `color-scheme`). In dark mode the result is **black text on the black backdrop — illegible.** An unstyled deck (e.g. `examples/minimal.html`) is invisible in dark mode. This is an **accessibility** failure of the out-of-box experience, not a styling preference.

The fix completes the pairing: the slide area gets a default **foreground** color that adapts in lockstep with the backdrop — the inverse value, for maximum contrast — so a deck with no author colors stays legible in both schemes. The slide **background stays transparent** (the adaptive backdrop is the slide surface); Lys imposes no slide-background color or theme. Authors still bring the visual identity and override the foreground with standard `color` CSS.

This is a pure CSS change. It does not affect the JS layer, does not change the `<article>` contract, and does not add a token. Lys remains *visually unopinionated* on identity (fonts, palette, spacing) while guaranteeing the *accessibility* floor — legible default contrast — that an adaptive backdrop demands.

### Architecture

#### CSS change

A single rule on the `[data-lys]` container, using `light-dark()` for automatic color scheme adaptation:

```css
[data-lys] {
  color-scheme: light dark;
  background: var(--_lys-backdrop);
}
```

**New API surface:**

| Token | Default | Purpose |
|---|---|---|
| `--lys-backdrop` | `light-dark(#fff, #000)` | Background color of the out-of-slide area |

The internal token follows the two-tier pattern:

```css
--_lys-backdrop: var(--lys-backdrop, light-dark(#fff, #000));
```

The `color-scheme: light dark` declaration on `[data-lys]` enables the `light-dark()` CSS function and tells the browser this container supports both schemes. Without it, `light-dark()` always resolves to the first (light) value.

#### Token placement

The `--_lys-backdrop` token is defined on `[data-lys]` (not on articles) because it is consumed by the container, not by slides. This is different from the slide-level tokens which are defined on `[data-lys] > article`.

#### Slide foreground (accessibility default, #47)

A single `color` declaration on the `[data-lys]` container, inherited by the slides (and any
nav region), using `light-dark()` so it adapts with the same `color-scheme` that drives the
backdrop:

```css
[data-lys] {
  color-scheme: light dark;
  background: var(--_lys-backdrop);
  color: light-dark(#000, #fff);
}
```

- The value is the **inverse** of the backdrop default (`light-dark(#fff, #000)`): light scheme →
  black text on the white backdrop; dark scheme → white text on the black backdrop. Maximum
  contrast (≈21:1, WCAG AAA), and as neutral as possible — no grays, no brand colors — matching
  the backdrop's "pure black/white" principle.
- **No new token.** Unlike the backdrop (which needed `--lys-backdrop` to target the otherwise
  hard-to-reach out-of-slide area), the foreground is the standard inheritable `color` property:
  authors override it with ordinary CSS on `[data-lys]`, `article`, or any descendant. Keeping it
  token-free leaves the `--lys-*` API frozen. (A future `--lys-color` token could be added with
  sign-off if author demand appears; out of scope here.)
- **Slide background is untouched** — it stays transparent so the adaptive backdrop shows through
  as the slide surface. Lys does not impose a slide-background color; `data-background` and author
  CSS remain the way to give a slide its own surface.

#### Author overrides

```css
/* Author foreground — standard CSS, overrides the accessible default */
[data-lys] { color: #1a1a2e; }

/* Force dark backdrop regardless of system preference */
[data-lys] { --lys-backdrop: #1a1a1a; }

/* Match a specific slide theme */
[data-lys] { --lys-backdrop: #0f0c29; }

/* Transparent — let body show through (current behavior) */
[data-lys] { --lys-backdrop: transparent; }
```

#### Module boundaries

- **`src/lys.css`** — Add token definition, `color-scheme`, and `background` to `[data-lys]` rule. ~3 lines.
- **No JS changes.** This is pure CSS.
- **No new events or data attributes.**

#### Integration points

- **Print layout** (`@media print`): The backdrop should be transparent in print to avoid wasting ink. Add `background: transparent` in the print media query.
- **Stacked mode**: No interaction — the container background is behind all slides regardless of layout mode.
- **Progressive enhancement**: Works in CSS-only mode (no JS required). `light-dark()` is supported in all modern browsers (Chrome 123+, Firefox 120+, Safari 17.5+).

### Anti-Patterns

- **Setting `background` on `<body>` instead of `[data-lys]`.** Lys must not touch elements outside its container. The body is the author's domain.
- **Using `@media (prefers-color-scheme)` with separate rules.** The `light-dark()` function is cleaner, more composable with author overrides, and avoids specificity issues with media query blocks.
- **Using opinionated colors (grays, brand colors).** The defaults should be pure black and pure white — the most neutral possible. Authors bring the visual identity. This applies to both the backdrop and the foreground.
- **A slide-background default.** The fix adds a foreground `color` only. Do not give slides a default background — they stay transparent over the adaptive backdrop. A slide surface is the author's call (`data-background` / author CSS).
- **A new token for the foreground.** Use the standard inheritable `color` property, not a new `--lys-*` token. Authors override with ordinary CSS; the token API stays frozen.
- **Setting `color` on `<body>` or `:root`.** Like the backdrop, the foreground default lives only on `[data-lys]` — never on elements outside the container.
- **Adding `color-scheme` to `:root` or `html`.** Lys must only set it on its own container to avoid affecting the rest of the page.
- **Using `url()` or gradients in the default.** The default must be a simple color to stay inline-friendly per CLAUDE.md constraints.
- **Expecting `light-dark()` to survive the build verbatim.** The source intentionally uses `light-dark()` for clarity and composability. However, the build tool (lightningcss) may polyfill this into `@media (prefers-color-scheme: dark)` blocks in the dist output depending on configured browser targets. This is acceptable as a build artifact — the source remains the canonical form, and the compiled output is semantically equivalent.

## Contract (Quality)

### Definition of Done

1. `[data-lys]` has `color-scheme: light dark` in `src/lys.css`.
2. `[data-lys]` has `background: var(--_lys-backdrop)` in `src/lys.css`.
3. `--_lys-backdrop` defaults to `light-dark(#fff, #000)`.
4. In light mode, the container background is white (`#fff` or `rgb(255, 255, 255)`).
5. In dark mode, the container background is black (`#000` or `rgb(0, 0, 0)`).
6. Authors can override via `--lys-backdrop` at any cascade level.
7. Print layout has transparent background (no ink waste).
8. CSS-only decks (no JS) show the correct backdrop.
9. `lys.css` remains under 2 KB gzip.
10. `lys.css` contains no `@import` or `url()`.
11. `[data-lys]` has a default `color: light-dark(#000, #fff)` in `src/lys.css` (#47).
12. In light mode, unstyled slide text is black (`#000`); in dark mode it is white (`#fff`).
13. An unstyled deck is legible in **both** schemes — slide text contrasts the backdrop (no black-on-black).
14. Slide background remains transparent — no default slide-background color is introduced.
15. Authors can override the foreground with standard `color` CSS at any cascade level.
16. The foreground default adds **no** new `--lys-*` token.

### Regression Guardrails

- Slides must still be visible — the backdrop must not obscure slide content.
- `data-background` on slides must still work (slide backgrounds are on articles, not the container).
- Existing author CSS that sets body background must not be affected.
- Scroll-snap navigation must not be affected by the new properties.
- Stacked/fade mode must not be affected.
- Print layout must not print a colored background.

### Scenarios (Gherkin)

#### Light mode backdrop

```gherkin
Scenario: Light mode shows white backdrop
  Given a [data-lys] container with slides
  And the system is in light mode (prefers-color-scheme: light)
  Then the container background-color is white (#fff)

Scenario: Light mode backdrop is visible around narrow slides
  Given a [data-lys] container with --lys-aspect-ratio: 4/3
  And a widescreen viewport (16:9)
  And the system is in light mode
  Then the area beside the slides is white
```

#### Dark mode backdrop

```gherkin
Scenario: Dark mode shows black backdrop
  Given a [data-lys] container with slides
  And the system is in dark mode (prefers-color-scheme: dark)
  Then the container background-color is black (#000)
```

#### Slide foreground (accessibility, #47)

```gherkin
Scenario: Light mode shows dark slide text
  Given a [data-lys] container with an unstyled slide
  And the system is in light mode
  Then the slide text color is black (#000)

Scenario: Dark mode shows light slide text
  Given a [data-lys] container with an unstyled slide
  And the system is in dark mode
  Then the slide text color is white (#fff)
  And the text is legible against the black backdrop (not black-on-black)

Scenario: Author overrides the foreground with standard CSS
  Given a [data-lys] container with color: #1a1a2e set by the author
  Then the slide text color is #1a1a2e regardless of color scheme

Scenario: Slide background stays transparent
  Given an unstyled [data-lys] slide
  Then the article has no opaque default background (the backdrop is its surface)
```

#### Author override

```gherkin
Scenario: Author overrides backdrop color
  Given a [data-lys] container with --lys-backdrop set to #1a1a2e
  Then the container background-color is #1a1a2e regardless of color scheme

Scenario: Author sets transparent backdrop
  Given a [data-lys] container with --lys-backdrop set to transparent
  Then the container background is transparent (body shows through)
```

#### Print layout

```gherkin
Scenario: Print layout has transparent backdrop
  Given a [data-lys] container with a dark mode backdrop
  When @media print applies
  Then the container background is transparent
```

#### Progressive enhancement

```gherkin
Scenario: Backdrop works without JS
  Given a [data-lys] container with only lys.css loaded (no JS)
  And the system is in dark mode
  Then the container background-color is black
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Light mode backdrop | `tests/e2e/slides.spec.ts` |
| Dark mode backdrop | `tests/e2e/slides.spec.ts` |
| Slide foreground (light/dark/override) | `tests/e2e/slides.spec.ts` |
| Author override | `tests/e2e/slides.spec.ts` |
| Print layout | `tests/e2e/print.spec.ts` |
| Progressive enhancement | `tests/e2e/slides.spec.ts` |

All scenarios are e2e because `color-scheme`, `light-dark()`, and `prefers-color-scheme` emulation require a real browser. Playwright supports `page.emulateMedia({ colorScheme: 'dark' })` for testing both modes.

## Related / Future

- **#34 — Focus ring on minimal example.** Separate visual bug, unrelated to backdrop.
- **Per-slide backdrop?** Not in scope. The backdrop is a container-level concern. Individual slides control their own background via `data-background`.
- **#47 — Default slide-area foreground color.** Implemented by this spec (the foreground sections above).
- **#48 — Consumer-side styling in the minimal example.** Complementary: even with the accessible default, the minimal example should *model* author styling (Lys is a slide-shell). Tracked separately; not an engine change.
- **A `--lys-color` token?** Deferred. The foreground uses the standard `color` property; a public token would be a token-API addition requiring sign-off. Revisit only on demand.
