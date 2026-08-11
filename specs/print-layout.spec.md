# Print Layout

## Blueprint (Design)

### Context

VISION.md states Lys is "not a PDF exporter — use the browser's print-to-PDF. Lys provides a
`@media print` stylesheet for this." Print is therefore a **first-class output**, not a
courtesy: browser print-to-PDF is the only export path Lys offers, and the `@media print`
block is the whole of it.

That block is currently wrong. Measured in Chromium's print pipeline on a portrait Letter
page box (816 × 1056 CSS px):

| Deck | Slide box in print | Page fill |
|---|---|---|
| `examples/minimal.html` (16:9) | 816 × 459 | **43 %** |
| `examples/full.html` (16:9) | 816 × 459 | **43 %** |
| `examples/square.html` (24:10) | 816 × 340 | **32 %** |

Pagination itself is correct — one slide per page, right order, no trailing blank page. The
**geometry** is wrong: every slide prints as a letterbox strip pinned to the top of a portrait
sheet, wasting 57–68 % of each page.

**Root cause.** The contain-fit sizing from #45 (`src/lys.css`, `=== Aspect ratio ===`) is

```css
width: min(var(--_lys-slide-max-width), var(--_lys-slide-max-height) * var(--_lys-aspect-ratio));
aspect-ratio: var(--_lys-aspect-ratio);
```

with `--_lys-slide-max-width: 100vw` and `--_lys-slide-max-height: 100vh`. In paged media,
`vw`/`vh` resolve against the **page box**. The print block drops `max-height` but leaves the
formula intact, so on portrait paper the width saturates at page width and `aspect-ratio`
derives a height of `width × 9/16`. There is no `@page` rule, so the paper stays portrait.
Contain-fit is right for a landscape viewport and wrong for a portrait sheet.

A second, independent defect compounds it: Chrome's **Background graphics** checkbox is off by
default. With it off, every slide background is dropped, so a dark-themed deck prints light
grey text on white — unreadable. Lys never sets `print-color-adjust`.

**Why this shipped.** `tests/e2e/print.spec.ts` has six tests, all asserting *computed
properties* (`opacity`, `position`, `break-after`, `container-type`, a font-size range). None
compares the slide box to the page box, so a slide occupying 43 % of the page passes every
existing test.

**Why this spec exists at all.** Print behavior currently has no owning spec. It is scattered
as one-line clauses across five feature specs, each correct in isolation and none responsible
for the printed page as a whole:

| Spec | Print clause | Disposition here |
|---|---|---|
| `backdrop-color.spec.md` | container background transparent in print | **Kept**, restated below |
| `spa-nav.spec.md` | nav region not pinned (`position: static`) | **Superseded** — hidden instead |
| `per-slide-transitions.spec.md` | print override targets `[data-lys][data-lys-mode] > article` | **Kept**, restated below |
| `container-relative-tokens.spec.md` | `container-type: normal` in print (#28) | **Superseded** — `size` is kept |
| `stacked-mode-nav-bug.spec.md` | print must still show all slides | **Kept**, restated below |
| `fouc-fade.spec.md` | print is unaffected by the FOUC guard | **Kept**, no change |

This spec becomes the single owner of the `@media print` block. The clauses above stay in
their home specs as guardrails; where this spec says *superseded*, the source spec is updated
to point here as part of the implementation.

### Architecture

Everything here lives in the `=== Print layout ===` block of **`src/lys.css`**. No JS changes,
no change to the `<article>` contract, no new events. The print block currently costs ~30
lines; the changes below are roughly net-neutral on the 2 KB gzip budget.

#### 1. Page box — orientation and size

The page box must be landscape and, ideally, the deck's own aspect ratio. Three candidates were
measured end-to-end in Chromium (real `page.pdf()`, `preferCSSPageSize: true`, PDF MediaBox
inspected), using `examples/minimal.html`:

| `@page` rule | MediaBox (pt) | Page box (CSS px) | Slide box | Fill |
|---|---|---|---|---|
| *(none — today)* | 612 × 792 | 816 × 1056 | 816 × 459 | 43 % |
| `size: landscape; margin: 0` | 792 × 612 | 1056 × 816 | 1056 × 594 | 73 % |
| `size: 10in 5.625in; margin: 0` | 720 × 405 | 960 × 540 | 960 × 540 | **100 %** |
| `size: var(--pg); margin: 0` | 720 × 405 | 960 × 540 | 960 × 540 | **100 %** |

**Decision: a ratio-matched page box, expressed through a token.**

```css
@media print {
  @page {
    size: var(--lys-print-page-size, 10in 5.625in);
    margin: 0;
  }
}
```

Rationale:

- A ratio-matched page makes the slide box **exactly** the page box. The letterboxing that
  contain-fit produces on screen collapses to zero, so there is no wasted ink, no dead band,
  and — crucially — **no centering problem to solve** (see §3).
- `10in × 5.625in` is 16:9 at the same physical scale as PowerPoint/Keynote widescreen exports,
  so the PDF reads as a deck export rather than a document.
- `margin: 0` is what allows full-bleed slides. Chrome applies the CSS page margin when the
  user leaves the print dialog's Margins control at *Default*.
- `size: landscape` alone was rejected: it improves fill to 73 % but leaves a 27 % band whose
  position depends on paper size, reintroducing the centering problem for a worse result.

**New API surface** — approved by the maintainer on 2026-08-11, per CLAUDE.md:

| Token | Default | Purpose |
|---|---|---|
| `--lys-print-page-size` | `10in 5.625in` | Page box for printed output; any valid `@page size` value (`landscape`, `A4 landscape`, `<length> <length>`) |

Notes for implementation:

- `var()` inside `@page { size }` is **verified working in Chromium** (row 4 above produces a
  MediaBox identical to the literal). Custom properties reach the page context from the root
  element, so the token must be readable at `:root` — unlike every other `--lys-*` token, it
  **cannot** be scoped to `[data-lys]` or to an article. Document this asymmetry.
- Follow the two-tier convention where it is expressible, but the `@page` context has no
  element to hang `--_lys-print-page-size` on; a direct `var(--lys-print-page-size, <default>)`
  in the descriptor is acceptable and should be commented as the reason.
- A 4:3 or 24:10 deck left on the default page is **not broken** — contain-fit pillarboxes or
  letterboxes it inside the 16:9 page. Authors who want an exact fit set the token.

#### 2. Slide sizing

With a landscape, ratio-matched page box, the existing contain-fit formula becomes **correct as
written** — `100vw`/`100vh` now resolve against a page whose ratio matches the slide's. The
print block should therefore **stop fighting it**:

- Keep `width: min(…)` and `aspect-ratio` inherited from the base rule. Do not re-declare them.
- The current `max-height: none` override is the reason the slide can exceed the page and must
  be re-examined: with a definite, correctly-shaped page box, `max-height: 100vh` is exactly the
  bound we want. Removing the override restores the screen behavior verbatim, which is the goal.
- Do not introduce print-specific width/height values. Any formula that differs from the screen
  formula is a second layout to keep in sync, and drift there is what produced this bug.
- **Reset slide margins.** `--lys-slide-gap` is applied by `[data-lys] > article + article`,
  whose specificity (0,1,2) outranks a plain `[data-lys] > article` (0,1,1) reset. Left alone,
  a deck with a gap set pushes every slide after the first down inside its own page. The print
  block needs `margin: 0 auto` on articles **and** a matching-specificity
  `[data-lys] > article + article { margin-top: 0 }`. *(Found during implementation.)*
- **Use `:last-of-type`, not `:last-child`, for the trailing break-avoid.** `a11y.ts` appends
  the `.lys-sr-only` live region to the container, so once JS initializes the final article is
  no longer the container's last child and `:last-child` stops matching — the last slide keeps
  `break-after: page` and emits a trailing blank page. This was a **pre-existing defect**,
  latent because the previous print tests never counted pages; it is fixed here.
  *(Found during implementation.)*

#### 3. Position within the page

With the ratio-matched default the slide fills the page box, so centering is unobservable. It
becomes observable only when the author sets `--lys-print-page-size` to a ratio that does not
match `--lys-aspect-ratio`.

**Decision: guarantee horizontal centering (`margin-inline: auto`); vertical centering is
explicitly out of scope.** Block-flow fragmentation offers no reliable way to center a
short block in its page (`margin-block: auto` does not resolve against a page box, and flex or
grid page-level centering degrades fragmentation behavior across engines). A mismatched page
box letterboxes toward the top; this is documented, not fixed. Authors who want it centered
match the page size to their ratio.

#### 4. `container-type` in print

The print block currently resets `container-type: normal`, per #28 — correct at the time,
because the print box had no definite size, and `cqi` in a size container with an indefinite
axis is unresolvable. The reset has a cost: author `cqi` type scales (which is how every themed
deck sizes its headings, including all four `examples/*.html`) silently re-resolve against the
**page**, not the slide, so print typography diverges from screen typography.

With a ratio-matched page box the slide has a definite width *and* a definite
`aspect-ratio`-derived height. **Decision: keep `container-type: size` in print** — verified:
with `@page { size: landscape }` and the reset removed, `container-type` computes to `size` and
layout resolves cleanly.

This is the payoff of the whole change: the printed slide is the screen slide at a different
scale, so a deck that fits on screen fits on paper, with proportional type.

`container-relative-tokens.spec.md` §"Print layout" and its DoD item 8 are superseded and must
be updated to reference this spec.

#### 5. Slide backgrounds — `print-color-adjust`

**Decision: force slide backgrounds to print.**

```css
[data-lys] > article {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

- Scoped to **articles only**. The `[data-lys]` container background stays `transparent`
  (`backdrop-color.spec.md`), so the out-of-slide area still costs no ink.
- This is an accessibility floor, not a visual opinion — the same reasoning as #47. A slide's
  background is not decoration: it is the surface its foreground color was chosen against.
  Dropping it inverts the contrast pair and can take a deck to zero effective contrast.
- The `-webkit-` prefix is required for Safari, which has not unprefixed the property.
- Ink cost is real and is accepted deliberately: a deck printed without its slide backgrounds
  is not a usable artifact.

#### 6. Nav region

`spa-nav.spec.md` specifies `position: static` in print so the fixed region does not overlay
the slides. Measured on `examples/nav.html` in print media, that region then occupies 51 px of
block flow at the top of the container and pushes slide 1 down by 51 px — which, once the slide
box equals the page box, spills slide 1 onto a second page.

**Decision: `display: none` in print.** The nav is on-screen navigation chrome; a printed deck
has no navigation. Its links remain in the DOM for the accessibility tree and for non-print
media. `spa-nav.spec.md` DoD item 11 and its print scenario are superseded and must be updated.

#### 7. Unchanged, restated here as this spec's responsibility

- `[data-lys]` → `display: block; overflow: visible; height: auto; scroll-snap-type: none;`
  and `background: transparent` (`backdrop-color.spec.md`).
- Articles → `break-after: page` (with the legacy `page-break-after: always` alias),
  `:last-child` → `break-after: avoid`, so there is no trailing blank page.
- Stacked mode (`[data-lys][data-lys-mode] > article`) → `position: static; transform: none;
  opacity: 1; pointer-events: auto`, so all slides print, not just the active one
  (`per-slide-transitions.spec.md`, `stacked-mode-nav-bug.spec.md`).
- `overflow: hidden` on articles is retained: with matching ratios, content that fits on screen
  fits on paper, and the clip prevents overflow bleeding across a page boundary.

#### Progressive enhancement and cross-browser behavior

`@page { size }` support is uneven. Firefox and WebKit both **parse** the descriptor (verified
via CSSOM round-trip: `size` reads back as `10in 5.625in` in both), but neither can be verified
for page-box application from this toolchain — Playwright's `page.pdf()` is Chromium-only.

The degradation is safe by construction: an engine that ignores `size` prints on the user's
selected paper and falls back to today's contain-fit-on-portrait result. That is the current
behavior, not a regression, and the other four changes (container-type, print-color-adjust,
nav hiding, pagination) are engine-independent. The user can also select landscape in the print
dialog to recover most of the benefit.

CSS-only decks (no JS) print identically — nothing here depends on the JS layer.

### Anti-Patterns

- **A print-specific width/height formula.** Do not re-derive slide geometry inside
  `@media print`. Two layout formulas drift; that drift is this bug. Fix the page box and let
  the screen formula apply.
- **`@page` rules outside `@media print`.** Keep the page box inside the print block so the
  descriptor is inert in screen media.
- **Setting `size` to a literal paper name as the default** (`A4 landscape`, `letter
  landscape`). Locks the deck to one region's paper and reintroduces the dead band.
- **Scoping `--lys-print-page-size` to `[data-lys]`.** The page context inherits from the root
  element only; a container-scoped value silently does nothing. This is the one token that must
  be documented as `:root`-only.
- **`print-color-adjust: exact` on `[data-lys]` or on `body`.** The container backdrop must stay
  transparent (ink), and Lys never styles elements outside its container.
- **Hiding slides to save ink** (`display: none` on non-active slides in stacked mode). Printing
  the whole deck is the contract.
- **Adding a `--lys-print-*` token family.** One token, one decision. Margins, per-slide page
  breaks, and header/footer content are not in scope and must not be speculatively tokenized.
- **`url()`, `@import`, or embedded assets** to achieve any of this — violates the
  inline-friendly constraint in CLAUDE.md.
- **Requiring JS to fix print.** No print-time DOM manipulation, no `beforeprint` handler. Print
  must work in a CSS-only deck.
- **Asserting print behavior only through computed styles.** The existing tests did exactly
  that and let a 43 %-fill regression through. Geometry must be compared to the page box.

## Contract (Quality)

### Definition of Done

1. `src/lys.css` contains an `@page` rule inside `@media print` with `margin: 0` and
   `size: var(--lys-print-page-size, 10in 5.625in)`.
2. With default tokens, the printed page box is landscape (width > height).
3. With default tokens on a 16:9 deck, the slide box fills **≥ 99 %** of the page box on both
   axes (measured, not inferred from properties).
4. No deck at any supported aspect ratio prints a slide filling **< 60 %** of the page box's
   block axis — the regression floor that today's 43 % / 32 % would fail.
5. Authors can override the page box via `--lys-print-page-size` set at `:root`.
6. A deck whose `--lys-aspect-ratio` does not match the page box is letterboxed or pillarboxed
   inside it, never cropped and never overflowing onto a second page.
7. The slide box is centered on the inline axis of the page box.
8. `container-type` computes to `size` on articles in print media.
9. Author `cqi`-based type resolves against the slide box in print, so heading sizes scale
   proportionally between screen and print rather than diverging.
10. Articles have `print-color-adjust: exact` (and the `-webkit-` prefix) in print media.
11. A dark-themed deck printed with Chrome's *Background graphics* off retains its slide
    backgrounds and its foreground/background contrast pair.
12. `[data-lys]` background remains transparent in print (no ink for the out-of-slide area).
13. A `[data-lys-nav]` region is not rendered in print and consumes no block space, so slide 1
    starts at the top of page 1.
14. A deck of N slides produces exactly N pages, in document order, with no trailing blank page —
    including after JS has appended the live region to the container.
14b. A deck with `--lys-slide-gap` set prints with no slide displaced inside its page.
15. Stacked/fade decks print all slides, not only the active one.
16. Print behavior is identical with JS disabled.
17. `lys.css` stays under 2 KB gzip and contains no `@import` or `url()`.
18. `container-relative-tokens.spec.md` and `spa-nav.spec.md` are updated where this spec
    supersedes their print clauses.
19. `ARCHITECTURE.md` documents `--lys-print-page-size` in the token table, with the
    `:root`-only caveat.

### Regression Guardrails

- One slide per page, in document order, no trailing blank page (true today — must survive).
- All slides print in every layout mode, including stacked/fade (`opacity: 1`,
  `position: static`).
- The `[data-lys]` container background stays transparent in print.
- Screen layout is untouched: contain-fit geometry, scroll-snap paging, `scroll-snap-stop`,
  and stacked-mode positioning must be byte-for-byte unaffected by any change in this spec.
- No new `data-*` attribute and no new custom event.
- Zero runtime dependencies; no JS added for print.
- `prefers-reduced-motion` handling is unaffected (print has no animation).
- Author `@page` rules declared after `lys.css` continue to win by cascade order.
- The nav region remains in the DOM and in the accessibility tree; only its print rendering
  changes.

### Scenarios (Gherkin)

#### Page box geometry — happy path

```gherkin
Scenario: A 16:9 deck fills the printed page
  Given a [data-lys] deck with the default --lys-aspect-ratio of 16/9
  And no author override of --lys-print-page-size
  When the deck is printed
  Then the page box is landscape
  And the slide box covers at least 99% of the page box on both axes
  And the slide box is centered on the inline axis

Scenario: Every slide gets its own page
  Given a [data-lys] deck with 5 slides
  When the deck is printed
  Then the output has exactly 5 pages
  And the slides appear in document order
  And there is no trailing blank page

Scenario: No trailing blank page once the live region exists
  Given a [data-lys] deck that has initialized its ARIA live region
  And the live region is the container's last child
  When the deck is printed
  Then the last slide still avoids a page break after it
  And the output has exactly one page per slide

Scenario: A slide gap does not displace slides in print
  Given a [data-lys] deck with --lys-slide-gap set to 4rem
  When the deck is printed
  Then every slide has no top margin
  And each slide starts at the top of its own page
```

#### Page box geometry — regression floor

```gherkin
Scenario: No deck prints as a letterbox strip
  Given a [data-lys] deck at any supported aspect ratio
  When the deck is printed
  Then the slide box covers at least 60% of the page box's block axis

Scenario: The pre-fix geometry is rejected
  Given a 16:9 deck printed onto a portrait page box
  Then the slide box would cover only ~43% of the block axis
  And this must fail the print geometry assertion
```

#### Author page-box override

```gherkin
Scenario: Author sets an A4 landscape page
  Given :root sets --lys-print-page-size to "A4 landscape"
  When the deck is printed
  Then the page box is A4 landscape
  And the 16:9 slide is letterboxed inside it without cropping

Scenario: Author page size is ignored when scoped to the container
  Given --lys-print-page-size is set on [data-lys] instead of :root
  When the deck is printed
  Then the default page box applies
  And no layout error occurs
```

#### Aspect-ratio mismatch — boundary

```gherkin
Scenario: A 4:3 deck on a 16:9 page is pillarboxed
  Given a [data-lys] deck with --lys-aspect-ratio: 4/3
  And the default 16:9 page box
  When the deck is printed
  Then the slide fits entirely within one page
  And the slide is not cropped
  And the slide does not overflow onto a second page

Scenario: A 24:10 deck fits within the page box
  Given examples/square.html with --lys-aspect-ratio: 24/10
  When the deck is printed
  Then the slide box fits within the page box on both axes
```

#### Container query context

```gherkin
Scenario: Slides remain size containers in print
  Given a [data-lys] deck
  When @media print applies
  Then container-type computes to "size" on every article

Scenario: cqi type scales proportionally between screen and print
  Given a slide whose heading is sized with a cqi-based clamp
  When the deck is printed at the default page box
  Then the heading's size relative to the slide box matches its on-screen ratio
```

#### Slide backgrounds and contrast

```gherkin
Scenario: Slide backgrounds print without the Background graphics option
  Given a slide with a dark background and light foreground text
  When the deck is printed with background graphics disabled
  Then the slide background is still painted
  And the foreground text retains its contrast against it

Scenario: The out-of-slide area costs no ink
  Given a [data-lys] container with a dark --lys-backdrop
  When @media print applies
  Then the container background is transparent
```

#### Nav region

```gherkin
Scenario: The nav region is not printed
  Given a [data-lys] deck with a [data-lys-nav] region
  When @media print applies
  Then the nav region is not rendered
  And it consumes no block space
  And the first slide starts at the top of the first page

Scenario: The nav region stays in the accessibility tree
  Given a [data-lys] deck with a [data-lys-nav] region
  When the deck is viewed on screen
  Then the nav region and its links are present and focusable
```

#### Layout modes

```gherkin
Scenario: Stacked/fade decks print every slide
  Given a [data-lys] deck in stacked mode with 6 slides
  When @media print applies
  Then every article has opacity 1 and position static
  And the output has 6 pages

Scenario: Scroll-snap decks print every slide
  Given a [data-lys] deck in default scroll-snap mode
  When @media print applies
  Then scroll-snap is disabled on the container
  And every slide is rendered
```

#### Progressive enhancement

```gherkin
Scenario: Print works with CSS only
  Given a deck with lys.css and no JavaScript
  When the deck is printed
  Then the page box, slide geometry, and pagination match the JS-enabled result

Scenario: Engines without @page size support degrade safely
  Given a browser that ignores the @page size descriptor
  When the deck is printed
  Then slides still paginate one per page
  And no content is cropped or lost
```

#### Accessibility

```gherkin
Scenario: Printed output preserves reading order
  Given a [data-lys] deck
  When the deck is printed to PDF
  Then the text of each slide appears on its own page in document order
  And no slide's content is clipped away by the print layout

Scenario: Screen-reader-only content is not printed as visible text
  Given a deck with a .lys-sr-only live region
  When @media print applies
  Then the live region text is not visible in the printed output
```

## Test / Spec Alignment

All scenarios are **e2e** — paged media, `@page` resolution, and PDF page boxes require a real
browser. `tests/e2e/print.spec.ts` is the single target file; `tests/unit/tokens.test.ts` gains
one case for the token default only.

| Scenario group | Test file | Status |
|---|---|---|
| Page box geometry — happy path | `tests/e2e/print.spec.ts` | **New** |
| Page box geometry — regression floor | `tests/e2e/print.spec.ts` | **New** |
| Author page-box override | `tests/e2e/print.spec.ts` | **New** |
| Aspect-ratio mismatch | `tests/e2e/print.spec.ts` | **New** |
| Container query context | `tests/e2e/print.spec.ts` | **Rewrite** — existing test asserts `normal`; now asserts `size` |
| Slide backgrounds and contrast | `tests/e2e/print.spec.ts` | **New** |
| Nav region | `tests/e2e/print.spec.ts` | **New** — `spa-nav.spec.md` mapped a print scenario to `nav.spec.ts`, but no such test was ever written (a pre-existing spec/test gap). The print-nav scenarios live here instead. |
| Layout modes | `tests/e2e/print.spec.ts` | **Exists** — keep as guardrail |
| Progressive enhancement | `tests/e2e/print.spec.ts` | **New** |
| Accessibility | `tests/e2e/print.spec.ts` | **New** |
| `--lys-print-page-size` default | `tests/unit/tokens.test.ts` | **New** |

Add to the alignment table in CLAUDE.md:

```
specs/print-layout.spec.md  →  tests/e2e/print.spec.ts
```

**Test technique.** Geometry must be measured, not inferred. Two complementary methods, both
validated while writing this spec:

1. **Emulated print media** — `page.emulateMedia({ media: 'print' })` with the viewport set to
   the expected page box in CSS px, then compare `getBoundingClientRect()` of the article
   against `innerWidth`/`innerHeight`. Fast; suitable for most assertions.
2. **Real PDF** — `page.pdf({ preferCSSPageSize: true })`, then assert page count and read the
   `/MediaBox` from the PDF bytes to confirm orientation and size. Chromium-only, so gate it on
   `browserName === 'chromium'`. This is the only method that proves `@page` actually applied.

Method 1 alone would have passed the buggy code if the viewport were chosen to match the fixed
page box, so at least one assertion in the geometry group must use method 2.

## Related / Future

- **Print-color-adjust as a token.** Not in scope. If authors want ink-saving output, that is a
  second token and a second decision; revisit only on demand.
- **Speaker-notes printing.** `data-notes` content is not printed today. A notes-per-page or
  handout layout is a separate feature, not a fix to this one.
- **Handout mode** (N slides per sheet). Frequently requested of slide tools; would need its own
  token and page-box math. Out of scope.
- **Page headers/footers, slide numbers via `@page` margin boxes.** Chromium support for margin
  boxes is partial; explicitly deferred.
- **#28 — `container-type: size` on articles.** This spec reverses its print-media reset only;
  the screen behavior it established is unchanged.
- **#45 — contain-fit aspect-ratio sizing.** This spec makes the print page box match the
  assumption that formula was written under, rather than altering the formula.
