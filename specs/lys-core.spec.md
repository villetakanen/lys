# Lys Core — Container, Article Contract, Tokens, Layout

## Blueprint (Design)

### Context

Lys Core is the foundation layer. It answers: "Given a `[data-lys]` container with `<article>` children, make it look and behave like a slide deck."

This feature exists because LLMs can reliably produce flat HTML (`<div data-lys><article>...</article></div>`) but cannot reliably produce the CSS layout, scroll-snap behavior, aspect-ratio enforcement, or initialization logic needed to turn that markup into a presentation. Lys Core bridges that gap with zero configuration.

Three progressive enhancement tiers drive the design:

1. **No JS, no Lys CSS** — Articles flow vertically as a readable document.
2. **Lys CSS only** — Scroll-snap slides, each sized to the configured aspect ratio and centered in the viewport. Navigable by scrolling.
3. **Lys CSS + JS** — Full initialization: slide indexing, state tracking, `lys:ready` event, programmatic API.

### Architecture

#### Container discovery & initialization (`src/lys.ts`)

- **IIFE auto-init:** On `DOMContentLoaded`, find all `[data-lys]` elements and construct a `LysInstance` for each.
- **ESM manual init:** Export `Lys.init()` (returns `LysInstance[]`) and `new Lys(container)` for targeted init.
- **Instance state:** Each instance tracks `current` (0-indexed slide number), `total` (slide count), and a reference to the active `slide` element.
- **`lys:ready` event:** Dispatched on the container after initialization completes. `{ detail: { instance: LysInstance } }`.
- **`destroy()` method:** Removes all event listeners, cleans up ARIA attributes added by JS, resets internal state. The container returns to its CSS-only behavior.
- **Idempotency:** `Lys.from(container)` and `Lys.init()` are idempotent — they return existing instances without re-initialization. `new Lys(container)` on an already-initialized container destroys the previous instance first, then creates a fresh one (constructor always returns a new object).

#### The `<article>` contract (HTML)

Each `<article>` direct child of `[data-lys]` is a slide. The following data attributes are recognized (all optional):

| Attribute | Type | Purpose |
|---|---|---|
| `data-notes` | string | Speaker notes (general-purpose metadata) |
| `data-transition` | string | Transition hint (e.g., `"fade"`) |
| `data-class` | string | Space-separated CSS classes applied to the slide |
| `data-background` | string | Background shorthand: color, gradient, or image URL |
| `data-timing` | string (numeric) | Suggested duration in seconds |

Non-`<article>` children of `[data-lys]` are ignored by Lys. This allows authors to place supplementary elements (e.g., a progress bar `<div>`, a logo `<header>`) alongside slides without breaking the deck.

#### CSS design tokens (`src/lys.css`)

Two-tier custom property system per ARCHITECTURE.md:

| Internal token | Public token | Default |
|---|---|---|
| `--_lys-aspect-ratio` | `--lys-aspect-ratio` | `16/9` |
| `--_lys-slide-padding` | `--lys-slide-padding` | `4cqi` |
| `--_lys-transition-duration` | `--lys-transition-duration` | `300ms` |
| `--_lys-transition-easing` | `--lys-transition-easing` | `ease-in-out` |
| `--_lys-font-size-base` | `--lys-font-size-base` | `clamp(0.75rem, 2.5cqi, 1.5rem)` |
| `--_lys-slide-gap` | `--lys-slide-gap` | `0` |
| `--_lys-slide-max-width` | `--lys-slide-max-width` | `100vw` |
| `--_lys-slide-max-height` | `--lys-slide-max-height` | `100vh` |
| `--_lys-focus-ring` | `--lys-focus-ring` | `2px solid currentColor` |

Internal tokens are declared on `[data-lys] > article` and consumed by `lys.css` rules. This ensures per-article overrides of public `--lys-*` tokens are visible at the declaration site where `var()` fallbacks are evaluated. Authors set the public `--lys-*` tokens at any cascade level (`:root`, `[data-lys]`, individual `<article>`).

#### Layout engine (`src/lys.css`)

- **Container:** `[data-lys]` is a scroll-snap container (`overflow-x: hidden; overflow-y: auto; scroll-snap-type: y mandatory`). Full viewport by default.
- **Slides:** Each `article` is a scroll-snap child. Each slide occupies exactly one scroll-snap page so that scrolling/swiping advances exactly one slide. The slide's rendered box is sized by the aspect-ratio rule below and is **not** forced to fill the viewport height. Snap paging must be preserved **without wrapping author HTML** in extra elements (see Anti-Patterns). Content is padded per `--_lys-slide-padding`.
- **Aspect ratio (contain-fit):** Slides always honor `--lys-aspect-ratio` (default `16/9`). The slide is sized to **fit within** the viewport at that ratio: **both** axes are bounded — width by `--_lys-slide-max-width` (default `100vw`) and height by `--_lys-slide-max-height` (default `100vh`) — and whichever bound is reached first governs, so the configured ratio is preserved on every viewport (mobile portrait, small landscape, desktop 16:9 *and* 16:10). The slide is centered; `--lys-backdrop` shows in the letterbox/pillarbox margins (per `backdrop-color.spec.md`). A slide must **never** stretch to the viewport's own ratio. Both axes stay definite so `container-type: size` and `cqi`/`cqh` scaling keep working (see `container-type.spec.md`).
- **`data-background` handling:** CSS rule applies the value as `background` shorthand on the article. Supports colors (`#hex`, `rgb()`, named), gradients (`linear-gradient(...)`), and images (`url(...)`).
- **`data-class` handling:** JS reads `data-class` and adds those classes to the `<article>` element's `classList` on init.
- **Print layout:** `@media print` removes scroll-snap, shows all slides vertically, applies `page-break-after: always` to each article.
- **`prefers-reduced-motion`:** Transition duration resolves to `0ms` when reduced motion is preferred.

#### Module boundaries

- `src/lys.ts` — Entry point, `Lys` class, auto-init, instance lifecycle, `data-class` application.
- `src/lys.css` — All layout, tokens, scroll-snap, print styles, `data-background` handling, `prefers-reduced-motion`.
- `src/types.ts` — `LysInstance` interface, event detail types.

This spec does NOT cover: keyboard/touch navigation (`navigation.spec.md`), ARIA attributes and focus management (`a11y.spec.md`), or transitions (`transitions.spec.md`).

### Anti-Patterns

- **Adding visual opinions.** No default fonts, colors, shadows, or border-radius. Lys is a layout engine, not a theme.
- **Requiring JS for slide visibility.** CSS-only decks must work. Never use `display: none` on slides that is only toggled by JS. The CSS-only tier uses scroll-snap, not show/hide.
- **Nesting slides.** Slides are always direct `<article>` children of `[data-lys]`. Never traverse deeper.
- **Mutating author HTML.** Do not wrap articles in extra `<div>`s, rewrite the DOM tree, or move elements around. Lys operates on the structure as authored. The only mutations allowed are: adding/removing classes (from `data-class`), adding/removing ARIA attributes (covered by a11y spec), and setting `data-lys-*` state attributes.
- **Using `innerHTML` with data attribute values.** `data-background`, `data-class`, etc. come from author markup but must never be injected as HTML. Use DOM APIs (`classList.add`, `style.background`).
- **Pinning a slide to the viewport ratio.** Never bound a slide's height on both sides to the same viewport value (e.g. `min-height` *and* `max-height` both `100vh`). That pins the height, leaves only width free, and makes the slide silently adopt the viewport's ratio — ignoring `--lys-aspect-ratio` on any non-matching viewport. Size to contain-fit (both axes bounded, smaller bound governs) instead. This was the root cause of the pre-1.1.0 aspect-ratio bug (#45). Note the converse trap: a *definite* `width` (e.g. `100vw`) plus `aspect-ratio` plus `max-height` does **not** contain-fit either — `max-height` clamps the height but never feeds back to shrink the width, so a ratio taller than the viewport still renders at the viewport ratio. The width itself must take the smaller bound, e.g. `width: min(max-width, max-height × ratio)`.
- **Breaking the size budget.** The entire `lys.css` must stay under 2 KB gzipped. Do not add utilities, resets, or helpers.
- **Using `@import` or `url()` in lys.css.** The CSS must be fully self-contained for inline usage.

## Contract (Quality)

### Definition of Done

1. `lys.css` renders a `[data-lys]` container with `<article>` children as aspect-ratio-constrained scroll-snap slides (contain-fit, centered, one slide per scroll page) without any JS.
1a. Slides honor `--lys-aspect-ratio` (default `16/9`) on every viewport — mobile portrait, small landscape, and desktop (16:9 and 16:10) — never adopting the viewport's own ratio, and never overflowing it.
2. All nine CSS tokens resolve through the two-tier system with correct defaults.
3. Author overrides at `:root`, `[data-lys]`, and `<article>` levels cascade correctly.
4. `Lys.init()` discovers all `[data-lys]` containers and returns `LysInstance[]`.
5. `new Lys(container)` initializes a single container and returns a `LysInstance`.
6. `lys:ready` fires on each container after initialization.
7. Instance exposes `current`, `total`, and `slide` read-only properties with correct values.
8. `destroy()` cleans up all JS state and listeners; container reverts to CSS-only behavior.
9. `Lys.from()` is idempotent — returns the existing instance. `new Lys()` on an initialized container destroys the old instance and creates a fresh one.
10. Non-`<article>` children of `[data-lys]` are ignored.
11. `data-background` applies as CSS `background` shorthand.
12. `data-class` classes are applied to articles on init and removed on destroy.
13. `@media print` shows all slides vertically with page breaks.
14. `prefers-reduced-motion: reduce` sets transition duration to `0ms`.
15. No runtime dependencies. No `@import`. No external `url()`.

### Regression Guardrails

- A 4-line deck (`<div data-lys><article>Hello</article></div>`) must always render as a visible slide sized to the configured aspect ratio within the viewport (contain-fit, centered) with only `lys.css` loaded.
- A configured `--lys-aspect-ratio` must be honored regardless of viewport ratio — the rendered slide's measured `width/height` must equal the configured ratio (within rounding), not the viewport's, on mobile, small, and desktop screens.
- `[data-lys]` with zero `<article>` children must not throw.
- `[data-lys]` with one `<article>` child must work identically to multi-slide decks (no off-by-one).
- Token defaults must never change without a major version bump (they are public API).
- `lys.css` must contain no `@import` or `url()` directives.
- `lys.css` must remain under 2 KB gzipped.
- The IIFE build must auto-initialize without any author JS.

### Scenarios (Gherkin)

#### CSS-only layout

```gherkin
Scenario: Minimal deck renders as scroll-snap slides
  Given a [data-lys] container with 3 <article> children
  And only lys.css is loaded (no JS)
  Then each article is sized to the configured aspect ratio (default 16/9), centered within the viewport
  And each article occupies one scroll-snap page (scrolling advances exactly one slide)
  And the container has scroll-snap-type: y mandatory

Scenario: Single-slide deck renders without error
  Given a [data-lys] container with 1 <article> child
  And only lys.css is loaded
  Then the article is sized to the configured aspect ratio, centered within the viewport
  And no scroll-snap artifacts are visible

Scenario: Empty container renders without error
  Given a [data-lys] container with 0 <article> children
  And only lys.css is loaded
  Then the container is rendered (may be empty)
  And no CSS errors occur
```

#### Token resolution

```gherkin
Scenario: Tokens resolve to defaults when no overrides are set
  Given a [data-lys] container with default markup
  Then --_lys-aspect-ratio resolves to 16/9
  And --_lys-slide-padding resolves to 4cqi
  And --_lys-transition-duration resolves to 300ms
  And --_lys-font-size-base resolves to clamp(0.75rem, 2.5cqi, 1.5rem)

Scenario: Author overrides a token at :root level
  Given :root sets --lys-aspect-ratio: 4/3
  Then --_lys-aspect-ratio resolves to 4/3 on all slides

Scenario: Author overrides a token at container level
  Given a [data-lys] container sets --lys-slide-padding: 3rem
  Then --_lys-slide-padding resolves to 3rem on slides in that container
  And other containers retain the default 4cqi

Scenario: Author overrides a token at article level
  Given an <article> sets --lys-slide-padding: 1rem
  Then --_lys-slide-padding resolves to 1rem on that article only
  And sibling articles retain the container or root value
```

#### Aspect-ratio conformity

These scenarios assert the *rendered* slide ratio (measured `width/height`), not just token
resolution. They map to `tests/e2e/slides.spec.ts` (extend the existing "extreme aspect ratios"
block, which today only asserts font-size). Each scenario waits a frame for layout, then
measures the article's bounding box.

```gherkin
Scenario: Default 16:9 slide is contained within a 16:10 desktop viewport
  Given a [data-lys] container with default markup (--lys-aspect-ratio: 16/9)
  And the viewport is 1920x1200
  And only lys.css is loaded
  Then the rendered slide's width/height ratio equals 16/9 (within rounding)
  And the slide fits within the viewport on both axes (no overflow)
  And the slide is centered, with --lys-backdrop visible above and below

Scenario: 3:4 portrait ratio is honored on a mobile portrait viewport
  Given a [data-lys] container with --lys-aspect-ratio: 3/4
  And the viewport is 430x932
  Then the rendered slide's width/height ratio equals 3/4 (within rounding)
  And the slide fits within the viewport on both axes
  And the slide is centered, with --lys-backdrop visible left and right

Scenario: 16:9 ratio is honored on a tall tablet viewport
  Given a [data-lys] container with --lys-aspect-ratio: 16/9
  And the viewport is 1024x1366
  Then the rendered slide's width/height ratio equals 16/9 (within rounding)
  And the slide fits within the viewport on both axes

Scenario: A slide never adopts the viewport's own ratio
  Given any --lys-aspect-ratio R and any viewport whose ratio differs from R
  Then the rendered slide's ratio equals R, not the viewport ratio
  And the slide is contained within the viewport on both axes

Scenario: One slide per scroll-snap page is preserved at contain-fit size
  Given a [data-lys] container with 3 contain-fit slides shorter than the viewport
  When the user scrolls or swipes once
  Then exactly one slide advances
  And the resting slide is centered in the viewport

Scenario: Stacked mode honors the aspect ratio too
  Given a deck in stacked mode (data-lys-mode) with --lys-aspect-ratio: 4/3
  And a viewport whose ratio differs from 4/3
  Then the active slide's rendered ratio equals 4/3 (within rounding)
  And the slide is contained within the viewport on both axes
```

#### JS initialization

```gherkin
Scenario: Auto-init discovers all containers on DOMContentLoaded
  Given 2 [data-lys] containers in the document
  When DOMContentLoaded fires
  Then both containers are initialized
  And lys:ready fires on each container

Scenario: Lys.init() returns instances for all containers
  Given 2 [data-lys] containers in the document
  When Lys.init() is called
  Then it returns an array of 2 LysInstance objects

Scenario: new Lys(container) initializes a single container
  Given a [data-lys] container element
  When new Lys(container) is called
  Then it returns a LysInstance
  And lys:ready fires on that container

Scenario: Lys.from() returns existing instance (idempotent)
  Given a [data-lys] container that is already initialized
  When Lys.from(container) is called again
  Then it returns the same LysInstance (referential equality)
  And lys:ready does not fire again

Scenario: new Lys() on initialized container replaces the instance
  Given a [data-lys] container that is already initialized
  When new Lys(container) is called again
  Then the previous instance is destroyed
  And a new LysInstance is returned
  And lys:ready fires for the new instance

Scenario: Instance exposes correct state
  Given a [data-lys] container with 5 <article> children
  When initialization completes
  Then instance.current is 0
  And instance.total is 5
  And instance.slide is the first <article> element
```

#### Data attributes

```gherkin
Scenario: data-background applies as CSS background
  Given an <article> with data-background="#1a1a2e"
  When lys.css is loaded
  Then the article's computed background is #1a1a2e

Scenario: data-background supports gradients
  Given an <article> with data-background="linear-gradient(to right, red, blue)"
  When lys.css is loaded
  Then the article's computed background-image contains the gradient

Scenario: data-class classes are applied on init
  Given an <article> with data-class="title-slide dark"
  When the container is initialized by JS
  Then the article has class "title-slide" and class "dark"

Scenario: data-class classes are removed on destroy
  Given an initialized container with an <article> with data-class="title-slide"
  When instance.destroy() is called
  Then the article no longer has class "title-slide"

Scenario: Non-article children are ignored
  Given a [data-lys] container with 2 <article> children and a <div> child
  When the container is initialized
  Then instance.total is 2
  And the <div> is not treated as a slide
```

#### Lifecycle

```gherkin
Scenario: destroy() reverts to CSS-only state
  Given an initialized [data-lys] container
  When instance.destroy() is called
  Then all JS event listeners are removed
  And data-class additions are reverted
  And the container still works as a CSS-only scroll-snap deck

Scenario: Empty container initializes without error
  Given a [data-lys] container with 0 <article> children
  When Lys.init() is called
  Then it returns an instance with total 0 and current -1
  And no error is thrown
```

#### Print layout

```gherkin
Scenario: Print media shows all slides vertically
  Given a [data-lys] container with 3 <article> children
  When the page is printed (@media print)
  Then all 3 articles are visible (not hidden by scroll-snap)
  And each article has a page-break-after
```

#### Reduced motion

```gherkin
Scenario: Transitions are disabled when reduced motion is preferred
  Given the user has prefers-reduced-motion: reduce
  Then --_lys-transition-duration resolves to 0ms
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| CSS-only layout | `tests/e2e/slides.spec.ts` |
| Token resolution | `tests/unit/tokens.test.ts` |
| JS initialization | `tests/unit/lys.test.ts` |
| Data attributes | `tests/unit/lys.test.ts` + `tests/e2e/slides.spec.ts` + `tests/e2e/navigation.spec.ts` |
| Lifecycle | `tests/unit/lys.test.ts` |
| Print layout | `tests/e2e/print.spec.ts` |
| Reduced motion | `tests/unit/tokens.test.ts` + `tests/e2e/slides.spec.ts` |

## Known Gaps

- **Auto-init test coverage.** The IIFE module-level auto-init code path (`DOMContentLoaded` listener / immediate `Lys.init()`) has no unit test. Will be covered by e2e tests in `tests/e2e/slides.spec.ts`.
- **No ARIA attributes in core init.** The `destroy()` contract mentions cleaning up "ARIA attributes added by JS," but core currently sets none. ARIA roles (`role="group"`, `aria-roledescription`), live regions, and focus management are deferred to `a11y.spec.md`. Track this to ensure the a11y module is implemented before shipping.

## Related / Future

- **Navigation** (`specs/navigation.spec.md`) — Keyboard, touch, hash routing, `next()`/`prev()`/`goTo()` methods. Depends on core initialization.
- **Accessibility** (`specs/a11y.spec.md`) — ARIA roles, live region, focus management. Augments core init with a11y attributes.
- **Transitions** (`specs/transitions.spec.md`) — `data-transition` is declared here; transition modes are defined in the transitions spec.
