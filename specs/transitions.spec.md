# Transitions — Scroll-Snap and Fade Modes

## Blueprint (Design)

### Context

Lys supports two layout modes for presenting slides: **scroll-snap** (the default) and **fade** (an opacity crossfade). The default scroll-snap mode requires no markup beyond the standard `[data-lys]` + `<article>` structure — it is the CSS-only progressive enhancement baseline. The fade mode is activated by the `data-transition="fade"` attribute and requires JS.

This matters because LLMs generating presentations may want crossfade transitions for a polished feel, while keeping the zero-config default for simpler decks. The transition system must be transparent to navigation — keyboard, touch, hash, and API navigation all work identically regardless of transition mode.

### Architecture

#### Two layout modes

**Scroll-snap mode (default):**
- The current behavior. `[data-lys]` is a scroll-snap container; slides are scroll-snap children.
- Navigation via `scrollIntoView()` drives smooth scrolling between slides.
- Works CSS-only (progressive enhancement tier 2).
- No changes needed to this mode.

**Fade mode (`data-transition="fade"`):**
- Activated when **any** `<article>` in the deck has `data-transition="fade"`. This is a **per-deck** decision — if one slide requests fade, the entire deck uses fade layout. Mixing scroll-snap and fade within a single deck is not supported.
- The container switches from scroll-snap to a **stacked layout**: slides are positioned absolutely on top of each other within the container. Only one slide is visually active at a time.
- Slide visibility is controlled via `opacity`. The active slide has `opacity: 1`; all other slides have `opacity: 0` and `pointer-events: none`.
- Transitions between slides use CSS `opacity` transition, respecting `--lys-transition-duration` and `--lys-transition-easing` tokens (same tokens used by scroll-snap mode for its CSS transitions).
- Navigation calls **do not** use `scrollIntoView()` in fade mode. Instead, the active slide's opacity is toggled, and the transition is handled by CSS.

#### Mode detection (`src/lys.ts`)

During `Lys` construction, after collecting slides, detect whether any slide has `data-transition="fade"`:

```
const hasFade = slides.some(s => s.dataset.transition === "fade");
```

If `hasFade` is true:
1. Set `data-lys-mode="fade"` on the container (used as a CSS hook).
2. Store the mode internally for `goTo()` to branch on.

On `destroy()`:
1. Remove `data-lys-mode` from the container. Once removed, the scoped CSS rules no longer apply and the deck reverts to scroll-snap behavior. No inline style cleanup is needed because fade mode uses CSS rules (via `data-lys-active` and `data-lys-mode`), not inline styles.

**New API surface — `data-lys-mode` state attribute:**
This is an internal state attribute (like `data-lys-active` and `data-lys-current`), not an author-facing API. It is set by Lys and used by `lys.css` for layout switching. Authors should not set it manually.

#### CSS layout switching (`src/lys.css`)

Fade mode styles are scoped under `[data-lys][data-lys-mode="fade"]`:

```css
/* === Fade mode layout === */
[data-lys][data-lys-mode="fade"] {
  position: relative;
  overflow: hidden;
  scroll-snap-type: none;  /* Disable scroll-snap */
  height: 100vh;
}

[data-lys][data-lys-mode="fade"] > article {
  position: absolute;
  top: 0;
  left: 50%;            /* Centering — mirrors margin-inline: auto from scroll-snap mode */
  transform: translateX(-50%);
  scroll-snap-align: unset;
  min-height: unset;    /* Override scroll-snap min-height; use aspect-ratio + max-height instead */
  opacity: 0;
  pointer-events: none;
  transition-property: opacity;
  transition-duration: var(--_lys-transition-duration);
  transition-timing-function: var(--_lys-transition-easing);
  /* aspect-ratio, max-width, max-height, padding, font-size, box-sizing carry over from base rules */
}

[data-lys][data-lys-mode="fade"] > article[data-lys-active] {
  opacity: 1;
  pointer-events: auto;
}
```

This approach:
- Uses the existing `data-lys-active` state attribute (already toggled by `goTo()`) as the CSS hook for visibility.
- Reuses `--_lys-transition-duration` and `--_lys-transition-easing` tokens — no new tokens needed.
- Respects `prefers-reduced-motion` automatically because the reduced motion media query already sets `--_lys-transition-duration: 0ms`, which makes the opacity transition instant.

**Print layout override:** The existing `@media print` rules reset scroll-snap. For fade mode, print must also reset `position`, `opacity`, and `pointer-events` so all slides are visible and flow vertically:

```css
@media print {
  [data-lys][data-lys-mode="fade"] > article {
    position: static;
    opacity: 1;
    pointer-events: auto;
  }
}
```

#### Navigation changes (`src/lys.ts`)

The `goTo()` method currently calls `scrollIntoView()`. In fade mode, this call must be skipped — the CSS opacity transition handles the visual change. The method needs to branch:

```
// In goTo(), after updating data-lys-active:
if (!this.#fadeMode) {
  nextSlide.scrollIntoView({ behavior: ..., block: "start" });
}
```

All other `goTo()` behavior remains identical: state update, `data-lys-active` toggle, `data-lys-current` update, `lys:slidechange` event dispatch. Navigation, a11y, and hash routing continue to work unchanged because they all go through `goTo()`.

#### Initial slide visibility

On init in fade mode, the current slide (index 0 or hash-routed target) already has `data-lys-active` set by the constructor. The CSS rule `article[data-lys-active] { opacity: 1 }` handles initial visibility. Non-active slides have `opacity: 0` by default in fade mode CSS.

#### Progressive enhancement

**CSS-only deck with `data-transition="fade"` and no JS:**
The `data-lys-mode="fade"` attribute is set by JS, so without JS it is never present. The deck falls back to scroll-snap mode. `data-transition="fade"` is ignored by CSS (it's just a data attribute with no CSS rules targeting it directly). The deck remains fully functional in scroll-snap mode.

This is the correct progressive enhancement behavior: fade mode is a JS enhancement, scroll-snap is the CSS-only baseline.

#### Module boundaries

- **`src/lys.ts`** — Mode detection in constructor. Branching in `goTo()` to skip `scrollIntoView()` in fade mode. Setting/removing `data-lys-mode` attribute. No inline style manipulation — visibility is controlled entirely by CSS via `data-lys-active` and `data-lys-mode` attributes.
- **`src/lys.css`** — Fade mode layout rules scoped under `[data-lys][data-lys-mode="fade"]`. No new tokens.
- **`src/navigation.ts`** — No changes. Navigation calls `instance.next()`/`prev()`/`goTo()` which are mode-agnostic.
- **`src/a11y.ts`** — No changes. A11y listens for `lys:slidechange` which fires identically in both modes.
- **`src/types.ts`** — No changes. The `LysInstance` interface is unchanged.

#### Interaction with existing tokens

| Token | Scroll-snap mode | Fade mode |
|---|---|---|
| `--lys-transition-duration` | Applied to `transition-duration` on articles (general CSS transitions) | Controls opacity transition duration |
| `--lys-transition-easing` | Applied to `transition-timing-function` on articles | Controls opacity transition easing |
| `--lys-aspect-ratio` | Constrains article dimensions | Same — base `aspect-ratio` rule still applies; slides are sized by aspect-ratio within container |
| `--lys-slide-padding` | Article padding | Same — base padding rule still applies |
| `--lys-slide-max-width` | Constrains article width | Same — base `max-width` rule still applies; slide is centered via `left: 50%; transform: translateX(-50%)` |
| `--lys-slide-max-height` | Constrains article height | Same — base `max-height` rule still applies |

### Anti-Patterns

- **Per-slide transition mixing.** Do not support different transition modes on different slides within one deck. If any slide has `data-transition="fade"`, the whole deck uses fade. Mixing scroll-snap and absolute positioning within a container produces broken layout.
- **Adding new CSS tokens for transitions.** Reuse `--lys-transition-duration` and `--lys-transition-easing`. These already exist and are already respected by the reduced motion media query.
- **JS-driven opacity animation.** Do not use `requestAnimationFrame`, `Web Animations API`, or inline style manipulation for the crossfade. Use CSS `transition: opacity` and let the browser handle it. The CSS approach is simpler, respects `prefers-reduced-motion` via the token system, and has zero JS overhead per transition.
- **Hiding slides with `display: none` or `visibility: hidden`.** Use `opacity: 0` + `pointer-events: none`. The slides must remain in the accessibility tree (the a11y module manages `aria-hidden` separately). `display: none` would remove them from layout and break the a11y module.
- **Modifying the navigation module.** Navigation is mode-agnostic. It calls `instance.goTo()` — the mode branching happens inside `goTo()`, not in the navigation module.
- **Breaking scroll-snap for decks without `data-transition`.** The default mode must remain exactly as it is today. Fade mode CSS is scoped under `[data-lys-mode="fade"]` and does not affect default decks.
- **Setting `data-lys-mode` from author markup.** This is an internal state attribute managed by Lys. If an author manually sets `data-lys-mode="fade"` without JS, the stacked layout will be applied but no slide will have `data-lys-active`, making all slides invisible. The attribute must only be set by the constructor.
- **Using `scrollIntoView()` in fade mode.** In a stacked layout, `scrollIntoView()` is meaningless (all slides share the same position). It would cause a no-op or unexpected scroll behavior on the container.

## Contract (Quality)

### Definition of Done

1. A deck with no `data-transition` attributes behaves identically to v0.1.0 (scroll-snap, no regressions).
2. A deck with `data-transition="fade"` on any slide uses stacked layout with opacity transitions.
3. The container gets `data-lys-mode="fade"` when fade mode is detected.
4. Active slide has `opacity: 1` and `pointer-events: auto`.
5. Inactive slides have `opacity: 0` and `pointer-events: none`.
6. Opacity transitions respect `--lys-transition-duration` and `--lys-transition-easing`.
7. `prefers-reduced-motion: reduce` makes fade transitions instant (0ms duration via existing token override).
8. `scrollIntoView()` is NOT called in fade mode.
9. `lys:slidechange` fires with identical detail shape in both modes.
10. Keyboard, touch, hash, and API navigation all work in fade mode.
11. A11y module (ARIA, live region, focus) works in fade mode without changes.
12. `destroy()` removes `data-lys-mode`, reverts to CSS-only scroll-snap behavior.
13. CSS-only deck with `data-transition="fade"` (no JS) falls back to scroll-snap mode.
14. Print layout works in fade mode (all slides visible, one per page).
15. Bundle size stays within budget: JS < 5 KB gzip, CSS < 2 KB gzip.

### Regression Guardrails

- A deck with no `data-transition` attributes must produce byte-identical CSS behavior to v0.1.0. The fade mode CSS must be fully scoped under `[data-lys-mode="fade"]`.
- `scrollIntoView()` must still be called in scroll-snap mode. The branching must not accidentally disable it for default decks.
- The existing `--lys-transition-duration` and `--lys-transition-easing` tokens must not change default values. Fade mode reuses them, not overrides them.
- The `data-lys-active` attribute semantics must not change. It still marks the current slide in both modes.
- `prefers-reduced-motion` media query must continue to set `--_lys-transition-duration: 0ms` — this is the mechanism that makes fade transitions instant.
- An empty deck (0 slides) with `data-transition` on the container (nonsensical but possible) must not throw.
- A single-slide deck in fade mode must display the slide at `opacity: 1` without transitions.
- The constructor must always set `data-lys-active` on the initial slide before setting `data-lys-mode="fade"`. This guarantees at least one slide is visible in fade mode — if `data-lys-active` were absent from all slides, all would be `opacity: 0` and the deck would appear blank.

### Scenarios (Gherkin)

#### Mode detection

```gherkin
Scenario: Default deck uses scroll-snap mode
  Given a [data-lys] container with 3 <article> children
  And no article has data-transition
  When the deck is initialized
  Then the container does not have data-lys-mode
  And the container has scroll-snap-type: y mandatory

Scenario: Deck with data-transition="fade" uses fade mode
  Given a [data-lys] container with 3 <article> children
  And the second article has data-transition="fade"
  When the deck is initialized
  Then the container has data-lys-mode="fade"

Scenario: Any slide with fade activates fade for the whole deck
  Given a [data-lys] container with 5 <article> children
  And only the third article has data-transition="fade"
  When the deck is initialized
  Then the container has data-lys-mode="fade"
  And all slides use stacked layout (position: absolute)
```

#### Fade layout

```gherkin
Scenario: Active slide is visible in fade mode
  Given a fade-mode deck with 3 slides
  When the deck is initialized (current = 0)
  Then the first slide has opacity 1
  And the first slide has pointer-events auto
  And the second slide has opacity 0
  And the second slide has pointer-events none

Scenario: Slide transition on navigation
  Given a fade-mode deck at slide 0
  When navigation changes to slide 1
  Then the first slide transitions to opacity 0
  And the second slide transitions to opacity 1

Scenario: Transition uses correct duration and easing
  Given a fade-mode deck with --lys-transition-duration: 500ms
  And --lys-transition-easing: linear
  When navigation changes to slide 1
  Then the opacity transition has duration 500ms
  And the opacity transition has easing linear
```

#### Scroll-snap mode unchanged

```gherkin
Scenario: Default deck still uses scrollIntoView
  Given a [data-lys] container with 3 <article> children (no data-transition)
  When navigation changes to slide 1
  Then scrollIntoView is called on the second article

Scenario: Default deck does not have stacked layout
  Given a [data-lys] container with 3 <article> children (no data-transition)
  When the deck is initialized
  Then articles have scroll-snap-align: start
  And articles do not have position: absolute
```

#### Navigation in fade mode

```gherkin
Scenario: Keyboard navigation works in fade mode
  Given a fade-mode deck at slide 0
  When the user presses ArrowRight
  Then the deck navigates to slide 1
  And lys:slidechange fires with from=0, to=1

Scenario: Touch navigation works in fade mode
  Given a fade-mode deck at slide 0
  When the user swipes left (deltaX > 50px)
  Then the deck navigates to slide 1

Scenario: Hash routing works in fade mode
  Given a fade-mode deck
  And the URL hash is #slide=2
  When the deck is initialized
  Then the deck starts at slide 1 (0-indexed)
  And the second slide has opacity 1

Scenario: API navigation works in fade mode
  Given a fade-mode deck at slide 0
  When instance.goTo(2) is called
  Then the deck navigates to slide 2
  And lys:slidechange fires with from=0, to=2

Scenario: scrollIntoView is NOT called in fade mode
  Given a fade-mode deck at slide 0
  When navigation changes to slide 1
  Then scrollIntoView is not called
```

#### Reduced motion

```gherkin
Scenario: Fade transitions are instant with reduced motion
  Given a fade-mode deck
  And the user prefers reduced motion
  When navigation changes to slide 1
  Then the opacity transition duration is 0ms
  And the slide change appears instant (no visible animation)
```

#### A11y in fade mode

```gherkin
Scenario: ARIA attributes work in fade mode
  Given a fade-mode deck with 3 slides
  When the deck is initialized
  Then the container has role="group" and aria-roledescription="slide deck"
  And each slide has role="group" and aria-roledescription="slide"
  And non-active slides have aria-hidden="true"

Scenario: Live region announces in fade mode
  Given a fade-mode deck at slide 0
  When navigation changes to slide 1
  Then the live region text content is "Slide 2 of 3"

Scenario: Focus moves in fade mode
  Given a fade-mode deck at slide 0
  When navigation changes to slide 1
  Then the second slide has focus
```

#### Progressive enhancement

```gherkin
Scenario: CSS-only deck with data-transition="fade" falls back to scroll-snap
  Given a [data-lys] container with 3 <article> children
  And the first article has data-transition="fade"
  And only lys.css is loaded (no JS)
  Then the container uses scroll-snap-type: y mandatory
  And all articles are visible (not stacked, not hidden)
  And the deck is navigable by scrolling

Scenario: Fade mode print layout shows all slides
  Given a fade-mode deck with 3 slides
  When the page is printed (@media print)
  Then all 3 slides are visible
  And slides are not stacked (position is not absolute)
  And each slide has a page-break-after
```

#### Cleanup

```gherkin
Scenario: destroy() removes fade mode
  Given a fade-mode deck
  When destroy() is called
  Then the container does not have data-lys-mode
  And articles do not have inline opacity styles
  And the container reverts to scroll-snap behavior

Scenario: Re-initialization after destroy preserves mode
  Given a fade-mode deck that was destroyed
  When new Lys(container) is called
  Then the deck re-enters fade mode (data-transition is still on the article)
  And the container has data-lys-mode="fade"
```

#### Edge cases

```gherkin
Scenario: Empty deck with data-transition does not throw
  Given a [data-lys] container with 0 <article> children
  And the container itself has some irrelevant attribute
  When the deck is initialized
  Then no error is thrown
  And data-lys-mode is not set (no slides to detect fade from)

Scenario: Single-slide fade deck shows the slide
  Given a [data-lys] container with 1 <article> child
  And the article has data-transition="fade"
  When the deck is initialized
  Then the container has data-lys-mode="fade"
  And the article has opacity 1

Scenario: Unknown data-transition value is ignored
  Given a [data-lys] container with 3 <article> children
  And one article has data-transition="zoom"
  When the deck is initialized
  Then the container does not have data-lys-mode
  And the deck uses scroll-snap mode
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Mode detection | `tests/unit/transitions.test.ts` |
| Fade layout | `tests/unit/transitions.test.ts` + `tests/e2e/transitions.spec.ts` |
| Scroll-snap mode unchanged | `tests/unit/transitions.test.ts` |
| Navigation in fade mode | `tests/unit/transitions.test.ts` |
| Reduced motion | `tests/e2e/transitions.spec.ts` |
| A11y in fade mode | `tests/unit/transitions.test.ts` |
| Progressive enhancement | `tests/e2e/transitions.spec.ts` |
| Cleanup | `tests/unit/transitions.test.ts` |
| Edge cases | `tests/unit/transitions.test.ts` |

## Related / Future

- **Additional transition values** — `slide`, `zoom`, `none`, etc. could be added post-1.0. The mode detection would need to support a set of known values rather than just checking for `"fade"`.
- **Per-slide transitions** — The current design is per-deck. A future enhancement could support different transitions per slide, but this requires significantly more complex layout management. Deferred.
- **View Transitions API** — The browser-native `document.startViewTransition()` API could provide smoother crossfades without the stacked layout hack. Browser support is still limited (Chrome/Edge only as of 2026). Worth revisiting post-1.0.
- **Transition events** — A `lys:transitionend` event could notify when the opacity transition completes. Not needed for 1.0 — the `lys:slidechange` event fires synchronously on navigation, before the visual transition starts.
