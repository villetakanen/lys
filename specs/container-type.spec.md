# Container Type Size on Slide Articles

## Blueprint (Design)

### Context

Lys slides are constrained by `aspect-ratio`, `max-width`, and `max-height` — the slide article can be significantly smaller than the viewport. But content sizing currently uses viewport-relative or root-relative units (`rem`, `vw`), which means descendant elements cannot reference the slide's actual dimensions. This is the foundational blocker for container-relative scaling (ADR-002).

Adding `container-type: size` to each `<article>` establishes it as a CSS size container, enabling `cqi`/`cqw`/`cqh` units in descendant elements. This is a prerequisite for #29 (container-relative token defaults), #30 (example migration), and #31 (spec/docs updates).

This change is pure CSS. It does not affect the JS layer, does not add new API surface, and improves the CSS-only progressive enhancement tier.

### Architecture

#### DOM structure

No DOM changes. The existing `[data-lys] > article` selector gains one new property.

#### CSS change

```css
[data-lys] > article {
  container-type: size;
}
```

This is added to the existing slide layout rule block in `src/lys.css`.

#### Why this is safe

`container-type: size` requires the element to have explicit dimensions in both axes. Lys articles already satisfy this:

- **Scroll-snap mode:** `min-height: var(--_lys-slide-max-height)` (default `100vh`) + `max-width: var(--_lys-slide-max-width)` (default `100vw`) + `aspect-ratio: var(--_lys-aspect-ratio)` constrain both axes.
- **Stacked mode:** `height: var(--_lys-slide-max-height)` + `position: absolute` + `left: 50%; transform: translateX(-50%)` provide explicit block-axis sizing and inline-axis constraint via `max-width` + `aspect-ratio`.

#### Side effects of containment

`container-type: size` establishes:
1. A new **containing block** for absolutely-positioned descendants — since articles already have `position: relative`, this changes nothing.
2. A new **stacking context** — articles already create stacking contexts via `position: relative` + `overflow: hidden` (in scroll-snap mode) or `position: absolute` + `opacity` (in stacked mode), so this is already the case.
3. **Size containment** — the article's size is not influenced by its children's intrinsic sizes. Since articles are already sized by viewport/aspect-ratio constraints (not by content), this is correct behavior.

#### Module boundaries

- **`src/lys.css`** — Only file touched. One property addition.
- **No JS changes.** `container-type` is a CSS property; it requires no runtime support.
- **No new tokens, events, or data attributes.**

#### Integration points

- **Transitions** (`transitions.spec.md`): Stacked/fade mode uses `position: absolute` + `opacity` on articles. Size containment is compatible — absolute-positioned elements still participate as size containers when they have explicit dimensions.
- **Print layout** (`@media print`): Articles become `position: static` with `min-height: auto`. Size containment without explicit dimensions may cause articles to collapse to zero height in print. The print media query should reset `container-type` to ensure content-driven sizing.
- **A11y** (`a11y.spec.md`): No interaction — containment does not affect ARIA attributes or focus management.
- **Navigation** (`navigation.spec.md`): No interaction — containment does not affect scroll-snap behavior or keyboard/touch handling.

### Anti-Patterns

- **Adding `container-type` to the `[data-lys]` wrapper instead of articles.** The wrapper is always viewport-sized — content needs to scale with the slide, not the viewport. Per ADR-002.
- **Using `container-type: inline-size` instead of `size`.** `inline-size` only enables `cqi`/`cqw` but not `cqh`/`cqb`. Since slides have a fixed aspect ratio and content may need to reference height (e.g., vertically-centered layouts), full `size` containment is needed.
- **Forgetting to reset containment in `@media print`.** Print layout sets `min-height: auto` and `position: static`, which removes the explicit dimensions that size containment requires. Without a reset, articles may collapse.
- **Adding `container-name`.** Naming the container would create a specific query target, but it's unnecessary — descendant `cqi` units resolve against the nearest size container ancestor, which is always the article. A name would add API surface for no benefit.
- **Conditionally applying containment with JS.** This is a CSS-only change. Applying it conditionally would break the progressive enhancement guarantee.

## Contract (Quality)

### Definition of Done

1. `[data-lys] > article` has `container-type: size` in `src/lys.css`.
2. Stacked mode articles (`[data-lys][data-lys-mode] > article`) function correctly as size containers (no layout collapse).
3. Print layout (`@media print`) resets `container-type` so articles size to content.
4. CSS-only decks (no JS) still render correctly with containment.
5. `cqi` units in descendant elements resolve relative to the article's inline size (verification that containment works).
6. No regressions in existing unit tests.
7. No regressions in existing e2e tests.
8. Bundle size stays within budget (CSS < 2 KB gzip).

### Regression Guardrails

- A minimal deck (`<div data-lys><article>Hello</article></div>`) with only `lys.css` must still render as a visible, full-viewport slide.
- Stacked mode (fade transitions) must still show the active slide and hide inactive slides.
- Print layout must still show all slides vertically with correct page breaks — articles must not collapse to zero height.
- `aspect-ratio` enforcement must still work — slides must maintain their ratio.
- Existing `--lys-*` token overrides must still cascade correctly.
- `lys.css` must contain no `@import` or `url()` directives.
- `lys.css` must remain under 2 KB gzip.

### Scenarios (Gherkin)

#### Container establishment

```gherkin
Scenario: Articles are CSS size containers
  Given a [data-lys] container with 3 <article> children
  And lys.css is loaded
  Then each article has computed container-type of "size"

Scenario: Stacked mode articles are CSS size containers
  Given a [data-lys][data-lys-mode] container with 3 <article> children
  And lys.css is loaded
  Then each article has computed container-type of "size"
```

#### Container query unit resolution

```gherkin
Scenario: cqi units resolve relative to article inline size
  Given a [data-lys] container with an <article> child
  And the article contains a <p> with font-size set to 5cqi
  And the article's computed inline size is 800px
  Then the <p> computed font-size is 40px (5% of 800px)

Scenario: cqi scales when viewport changes
  Given a [data-lys] container with an <article> child
  And the article contains a <p> with font-size set to 5cqi
  When the viewport is resized from 1920px to 960px wide
  Then the <p> computed font-size decreases proportionally
```

#### Layout integrity

```gherkin
Scenario: Scroll-snap layout is unaffected by containment
  Given a [data-lys] container with 3 <article> children
  And lys.css is loaded (no JS)
  Then the container has scroll-snap-type: y mandatory
  And each article has scroll-snap-align: start
  And each article fills the viewport height

Scenario: Aspect ratio is preserved with containment
  Given a [data-lys] container with --lys-aspect-ratio set to 16/9
  And lys.css is loaded
  Then each article maintains a 16:9 aspect ratio within the viewport

Scenario: Stacked mode layout is unaffected by containment
  Given a [data-lys][data-lys-mode] container with articles
  And one article has data-lys-active
  Then the active article is visible (opacity: 1)
  And inactive articles are hidden (opacity: 0)
  And no articles have collapsed dimensions
```

#### Print layout

```gherkin
Scenario: Print layout resets containment for content-driven sizing
  Given a [data-lys] container with 3 <article> children
  When the page is printed (@media print)
  Then articles are not size-contained (container-type is reset)
  And all articles are visible with content-driven height
  And page breaks are applied between articles
```

#### Progressive enhancement

```gherkin
Scenario: CSS-only deck works with containment
  Given a [data-lys] container with 3 <article> children
  And only lys.css is loaded (no JS)
  Then articles are scrollable via scroll-snap
  And articles are CSS size containers
  And content is visible and not clipped

Scenario: Containment works without JS initialization
  Given a [data-lys] container (no data-lys-mode, no JS)
  And an article contains a <p> styled with cqi units
  Then the cqi units resolve correctly against the article
```

#### Size budget

```gherkin
Scenario: CSS bundle stays within size budget
  Given the built lys.css output
  Then the gzipped size is less than 2048 bytes
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Container establishment | `tests/e2e/slides.spec.ts` |
| Container query unit resolution | `tests/e2e/slides.spec.ts` |
| Layout integrity | `tests/e2e/slides.spec.ts` |
| Print layout | `tests/e2e/print.spec.ts` |
| Progressive enhancement | `tests/e2e/slides.spec.ts` |
| Size budget | `tests/unit/tokens.test.ts` (or build verification) |

All scenarios are e2e because `container-type` and `cqi` resolution require a real browser layout engine — happy-dom does not implement CSS containment or container queries.

## Related / Future

- **#29 — Container-relative token defaults.** Changes `--_lys-font-size-base` and `--_lys-slide-padding` defaults to use `cqi` units. Depends on this spec.
- **#30 — Example migration.** Updates example decks to use `em`/`cqi`-based typography. Depends on #28 + #29.
- **#31 — Spec and docs update.** Updates `lys-core.spec.md` token table and ARCHITECTURE.md. Depends on #28 + #29.
