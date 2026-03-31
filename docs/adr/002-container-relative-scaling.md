# ADR-002: Container-Relative Scaling for Slide Content

| Field | Value |
|---|---|
| Status | **Accepted** |
| Date | 2026-03-30 |
| Decision makers | @villetakanen |
| Scope | `src/lys.css`, `specs/lys-core.spec.md`, token defaults |

## Context

Lys slides are constrained by `aspect-ratio`, `max-width`, and `max-height` — the slide container can be significantly smaller than the viewport. But text sizing currently uses viewport-relative or root-relative units (`rem`, `vw`), which means content does not scale with the slide. This causes two visible problems:

### Problem 1: Content overflow at non-native aspect ratios

A 24:10 cinema deck on a tall (9:16 mobile) viewport produces a slide that is a narrow horizontal strip. Text sized in `rem` or `vw` stays the same absolute size regardless of how much the slide has shrunk, causing content to overflow or clip.

The same issue affects any aspect ratio that doesn't match the viewport: 1:1 on a widescreen monitor, 4:3 on a phone, 16:9 on a portrait tablet.

### Problem 2: Slides don't behave like slides

In every presentation tool (PowerPoint, Keynote, Google Slides, Figma), content is positioned and sized relative to the slide canvas. Resize the canvas, and everything scales proportionally. This is what users — and LLMs — expect from a slide engine.

Currently, Lys slides are more like a scrollable document section than a self-contained canvas. The `--lys-font-size-base` token defaults to `clamp(1rem, 2vw, 1.5rem)`, which is viewport-relative. An LLM generating a deck has no way to know what viewport it will be displayed on, so it cannot pick font sizes that will fit.

### Problem 3: Example decks require manual tuning

The current example decks (themed, full, cinema pitch) all use hand-tuned `clamp()` values with `vw` units. These values only work well at specific viewport dimensions. A container-relative approach would make the examples work at any size without tuning.

## Decision

**Make slide articles CSS size containers and default to container-relative units for the base font size token.**

### Implementation

1. Add `container-type: size` to `[data-lys] > article` in `lys.css`:

```css
[data-lys] > article {
  container-type: size;
}
```

2. Change the `--lys-font-size-base` token default from viewport-relative to container-relative:

```css
/* Before */
--_lys-font-size-base: var(--lys-font-size-base, clamp(1rem, 2vw, 1.5rem));

/* After */
--_lys-font-size-base: var(--lys-font-size-base, clamp(0.75rem, 2.5cqi, 1.5rem));
```

`cqi` = 1% of the container's inline (width) dimension. As the slide shrinks, text shrinks proportionally. The `clamp()` floor prevents text from becoming unreadably small on very small containers.

3. Change the `--lys-slide-padding` token default to container-relative:

```css
/* Before */
--_lys-slide-padding: var(--lys-slide-padding, 2rem);

/* After */
--_lys-slide-padding: var(--lys-slide-padding, 4cqi);
```

4. Update example decks to use `em`-based or container-relative typography in their theme CSS, so heading sizes and spacing scale with the base font size.

### Why `container-type: size` is safe

`container-type: size` requires the element to have explicit dimensions in both axes. Lys articles already have:
- `aspect-ratio: var(--_lys-aspect-ratio)` — constrains proportions
- `max-height: var(--_lys-slide-max-height)` — constrains block axis (default `100vh`)
- `max-width: var(--_lys-slide-max-width)` — constrains inline axis (default `100vw`)

In stacked mode, articles also get explicit `height` from the CSS rules. The containment requirements are already met.

### Why `cqi` over other approaches

| Approach | Pros | Cons |
|---|---|---|
| `cqi` (container query inline) | Scales with slide width; works at any aspect ratio; pure CSS | Requires `container-type: size` on parent |
| `vw` / `vh` | No container setup needed | Scales with viewport, not slide — the root cause of the problem |
| JS-based `ResizeObserver` + `font-size` | Works everywhere | Adds JS complexity; layout shift on resize; violates CSS-first principle |
| CSS `zoom` | Simple; scales everything | Non-standard behavior; breaks layout calculations; accessibility issues |
| `svw` / `svh` (small viewport) | Newer viewport units | Still viewport-relative, not container-relative |

### Browser support

`container-type: size` and `cqi` units are supported in all modern browsers since February 2023:
- Chrome 105+ (Sept 2022)
- Firefox 110+ (Feb 2023)
- Safari 16+ (Sept 2022)

This covers >95% of global browser usage as of March 2026. The `clamp()` floor (`0.75rem`) provides a usable fallback if a browser somehow doesn't support container queries — text will be small but readable.

### Progressive enhancement

CSS-only decks (no JS) still work. `container-type: size` is a CSS property — it does not require JS. The containment is established by the CSS layout rules that already exist. This change improves the CSS-only experience as well.

## Consequences

**Positive:**
- Slides behave like slides — content scales with the canvas at any viewport size.
- LLM-generated decks "just work" at any aspect ratio without manual font tuning.
- Example decks become viewport-agnostic — no hand-tuned `clamp()` values needed.
- The `--lys-font-size-base` token remains overridable — authors who want absolute sizing can set it to a `rem` value.
- Print layout continues to work (`@media print` resets containment context, but the `clamp()` floor ensures readable text).

**Negative:**
- `container-type: size` establishes a new containing block and stacking context on each article. This could theoretically affect author CSS that relies on absolute positioning relative to ancestors above the article. In practice, since each slide is a self-contained canvas, this is the correct behavior.
- Authors who have tuned their themes with `vw`/`rem`-based font sizes will see text scale differently. Their `--lys-font-size-base` override will still work, but if they've also hard-coded heading sizes in `vw`, those won't scale with the container. This is a visual change, not a breakage — and it's the correct direction.

**Neutral:**
- The `--lys-slide-padding` default changes from `2rem` to `4cqi`. At a 1920px-wide slide, `4cqi` ≈ 76.8px ≈ 4.8rem — somewhat larger than the current default. The exact value can be tuned during implementation.
- This is a token default change, which is technically a visual change for existing decks that don't override the token. Per CLAUDE.md, token changes require approval.

## Alternatives Considered

### Keep viewport-relative units, document the limitation
Accept that content may overflow at extreme aspect ratios and advise authors to test at their target viewport. Rejected because this undermines the core promise: LLMs can generate presentations without knowing the display environment.

### Use JS `ResizeObserver` to set font size
Observe the article dimensions and set `font-size` via inline style. This works but violates the CSS-first principle, adds JS bundle size, causes layout shift on resize, and breaks the CSS-only progressive enhancement tier.

### Use `@container` queries for breakpoints instead of fluid scaling
Define discrete font sizes at container width breakpoints (e.g., `@container (min-width: 600px)`). This provides step-function scaling rather than smooth scaling. Rejected because fluid `cqi` is simpler, smoother, and requires fewer CSS rules.

### Apply `container-type` to the `[data-lys]` container instead of articles
This would make the deck container the size reference. Rejected because the deck container is always viewport-sized — it doesn't shrink with the slide. The articles are what get constrained by aspect ratio, and they are what content needs to scale with.
