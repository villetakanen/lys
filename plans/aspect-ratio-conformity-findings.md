# Aspect-Ratio Conformity — Diagnosis

> Why a set `--lys-aspect-ratio` (e.g. 4/3 portrait) is not honored across viewports.
> Date: 2026-06-22. Status: root cause confirmed by box-model analysis; fix proposed, not yet built.

## Symptom

Setting `--lys-aspect-ratio` does not reliably constrain the slide. On mobile and on
desktops whose viewport ratio differs from the target, slides render at the **viewport's**
ratio instead of the author's. "4×3 portrait does not always follow."

## Root cause (`src/lys.css:36–53`)

A default-mode `[data-lys] > article` is given **both**:

- `min-height: var(--_lys-slide-max-height)` → `100vh` (line 38)
- `max-height: var(--_lys-slide-max-height)` → `100vh` (line 51)

`min == max` pins the article height to exactly `100vh`. With height definite, `aspect-ratio: R`
(line 50) can only derive **width** (`width = 100vh × R`); `max-width: 100vw` (line 39) then
clamps width when it overflows — but the height pin means **height never reduces to restore the
ratio**. So whenever the slide should be *width-constrained* (viewport taller/narrower than the
target — every mobile portrait, plus non-matching desktops), the slide fills the viewport and
adopts the viewport ratio.

### When it breaks (box-model trace, w/h)

| Target | Viewport | Rendered ratio | Correct? |
|---|---|---|---|
| 16:9 | 1920×1080 (16:9) | 1.778 | ✅ only because viewport already matches |
| 16:9 | 1920×1200 (16:10) | 1.60 | ❌ viewport ratio |
| 16:9 | 430×932 (mobile) | 0.461 | ❌ viewport ratio |
| 3:4 portrait | 1920×1080 | 0.75 | ✅ (height-constrained case) |
| 16:9 | 1024×1366 (tablet) | 0.75 | ❌ |
| 1:1 | 1920×1080 | 1.0 | ✅ |

It works only in the *height-constrained* direction; it fails in the *width-constrained*
direction, which is the common mobile case.

## Fix (contain-fit, both axes bounded)

Size the slide to **fit inside** the viewport at the target ratio (`object-fit: contain`
semantics):

- `width: min(100vw, 100vh × R)` with `aspect-ratio: R` deriving height — equivalently
  `height: min(100vh, 100vw / R)`.
- **Remove the `min-height: 100vh` pin** in default mode (it is what forces the viewport ratio).
- Letterbox/pillarbox shows the `--lys-backdrop` around the slide — that token already exists
  for this gap (`specs/backdrop-color.spec.md`).

This holds the ratio identically on mobile, small, and desktop.

## Risks to validate during implementation (not assumptions)

1. **Scroll-snap** — without `min-height:100vh`, an article no longer fills a viewport "page."
   One-slide-per-swipe must be preserved, likely via a full-height snap track / centering
   wrapper or `scroll-snap-stop`, rather than a forced full-viewport article height.
2. **Stacked mode** (`data-lys-mode`, `src/lys.css:94–104`) uses `height: 100vh` + absolute
   positioning — same pin, same bug. Needs the parallel fix.
3. **`container-type: size`** (line 45) requires a definite size on the article for `cqi`/`cqh`
   scaling. The fix must keep **both** axes definite so container-relative tokens still work.
4. **Print** (`@media print`, lines 131–158) sets `min-height:auto` already — confirm the fix
   does not regress page-per-slide printing.

## Coverage gap in existing tests

`tests/e2e/slides.spec.ts` "extreme aspect ratios" (lines 307–342) only asserts **font-size**
stays within the clamp range — it never asserts the rendered **width/height ratio** matches the
target. That is why the bug shipped. New tests must assert measured `width/height ≈ target` and
that the slide fits within the viewport (no overflow), across a viewport matrix
(mobile portrait, small landscape, desktop 16:9 and 16:10).
