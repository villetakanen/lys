# Backdrop Color (Out-of-Slide Area)

## Blueprint (Design)

### Context

When slides are narrower than the viewport — due to aspect-ratio constraints, `--lys-slide-max-width`, or non-native ratios on widescreen monitors — the `[data-lys]` container background is visible around the slides. Currently, Lys sets no background on the container, so the page body color shows through. This produces a jarring mismatch when the author's slide theme is dark but the browser is in light mode (or vice versa).

The fix: Lys should set a sensible default background on the `[data-lys]` container that adapts to the user's `prefers-color-scheme`. Dark mode gets a dark backdrop; light mode gets a light one. Authors can override it with a single token.

This is a pure CSS change. It does not affect the JS layer, does not change the `<article>` contract, and improves the out-of-box experience for LLM-generated decks that don't set a body background.

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

#### Author overrides

```css
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
- **Using opinionated colors (grays, brand colors).** The defaults should be pure black and pure white — the most neutral possible. Authors bring the visual identity.
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
| Author override | `tests/e2e/slides.spec.ts` |
| Print layout | `tests/e2e/print.spec.ts` |
| Progressive enhancement | `tests/e2e/slides.spec.ts` |

All scenarios are e2e because `color-scheme`, `light-dark()`, and `prefers-color-scheme` emulation require a real browser. Playwright supports `page.emulateMedia({ colorScheme: 'dark' })` for testing both modes.

## Related / Future

- **#34 — Focus ring on minimal example.** Separate visual bug, unrelated to backdrop.
- **Per-slide backdrop?** Not in scope. The backdrop is a container-level concern. Individual slides control their own background via `data-background`.
