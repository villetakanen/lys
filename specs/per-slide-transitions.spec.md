# Per-Slide Transitions

## Blueprint (Design)

### Context

`data-transition` is documented in ARCHITECTURE.md as a per-article attribute ("Transition hint"), but the current implementation treats it as deck-wide: if *any* slide has `data-transition="fade"`, the entire deck uses fade transitions for all slide changes. Issue #19 requests that the attribute be honored per-slide.

The core challenge is that scroll-snap and stacked (absolute) positioning cannot coexist in the same container. This means "per-slide transitions" cannot mean "some slides scroll-snap, others fade" — the layout mode must be uniform. Instead, per-slide means: **the transition style used when navigating TO a slide is determined by that slide's `data-transition` value.**

### Architecture

#### Behavioral model

The deck has two layout modes:

1. **Scroll-snap** (default) — All slides use scroll-snap. No `data-transition` attributes are present, or all are unrecognized values.
2. **Stacked** — Any slide has `data-transition="fade"` or `data-transition="direct"`. All slides are absolutely positioned and visibility is controlled via `opacity` + `data-lys-active`.

Within stacked mode, per-slide transitions work as follows:

| Target slide's `data-transition` | Transition TO that slide |
|---|---|
| `"fade"` | Opacity crossfade using `--lys-transition-duration` / `--lys-transition-easing` |
| `"direct"` | Instant switch (`transition-duration: 0ms`) |
| (none / unrecognized) | Instant switch (same as direct — no animation is the safe default in stacked mode) |

The transition style is always determined by the **destination** slide, not the source. When navigating from slide A to slide B, slide B's `data-transition` value controls the animation.

#### Mode detection changes (`src/lys.ts`)

The current deck-wide mode detection:

```ts
this.#mode = slides.some(s => s.dataset.transition === "fade")
  ? "fade"
  : slides.some(s => s.dataset.transition === "direct")
    ? "direct"
    : null;
```

Changes to detect whether *any* slide has a recognized transition (entering stacked mode), without picking a single deck-wide transition style:

```
const hasStacked = slides.some(s =>
  s.dataset.transition === "fade" || s.dataset.transition === "direct"
);
this.#mode = hasStacked ? "stacked" : null;
```

**New API surface — `data-lys-mode="stacked"`:**
The container attribute value changes from `"fade"` or `"direct"` to `"stacked"` when any slide has a recognized `data-transition`. This is an internal state attribute — not author-facing. The CSS rules currently scoped to `[data-lys][data-lys-mode]` (attribute-presence selector) continue to work unchanged.

#### CSS changes (`src/lys.css`)

The stacked layout rules already use the attribute-presence selector `[data-lys][data-lys-mode]`, which matches regardless of the attribute value. These rules need **no changes** for the layout switch.

Per-slide transition behavior is handled by targeting the `data-transition` attribute directly on the article:

```css
/* Fade slides: animate opacity */
[data-lys][data-lys-ready][data-lys-mode] > article[data-transition="fade"] {
  transition-property: opacity;
}

/* Direct slides and slides with no data-transition: instant */
[data-lys][data-lys-mode] > article:not([data-transition="fade"]) {
  transition-duration: 0ms;
}
```

Remove the old deck-wide selectors:
- `[data-lys][data-lys-ready][data-lys-mode] > article` (enabled opacity transitions for ALL articles)
- `[data-lys][data-lys-mode="direct"] > article` (overrode duration for direct mode)

Replace with per-slide selectors that apply the transition property only to `article[data-transition="fade"]`.

#### Navigation changes (`src/lys.ts`)

The `goTo()` branching already checks `if (!this.#mode)` to decide whether to call `scrollIntoView()`. This continues to work — stacked mode (any `#mode` value) skips scrolling.

No per-slide branching is needed in JS. The CSS `transition-property` and `transition-duration` on each article handle the visual behavior. JS just toggles `data-lys-active`.

#### Module boundaries

- **`src/lys.ts`** — Mode detection changes: `#mode` becomes `"stacked" | null` instead of `"fade" | "direct" | null`. The `data-lys-mode` attribute value becomes `"stacked"`. `goTo()` branching is simplified (any non-null mode skips scroll).
- **`src/lys.css`** — Replace deck-wide transition selectors with per-slide selectors. Stacked layout rules unchanged.
- **`src/navigation.ts`** — No changes.
- **`src/a11y.ts`** — No changes.
- **`src/types.ts`** — No changes.
- **`tests/unit/transitions.test.ts`** — Update mode detection tests (expect `"stacked"` instead of `"fade"` or `"direct"`). Add mixed-mode deck scenarios.
- **`tests/e2e/transitions.spec.ts`** — Add mixed-mode visual verification if applicable.

#### Interaction with existing features

- **FOUC prevention (#22):** The `data-lys-ready` gate still works — `transition-property: opacity` is only applied after `data-lys-ready` is set, but now scoped to `article[data-transition="fade"]` instead of all articles.
- **`prefers-reduced-motion`:** The `--_lys-transition-duration: 0ms` override makes fade slides instant. Non-fade slides are already instant.
- **Print layout:** The print override targets `[data-lys][data-lys-mode] > article` (attribute-presence) — works unchanged.
- **Progressive enhancement:** Without JS, `data-lys-mode` is never set, so all slides remain scroll-snap. Unchanged.

### Anti-Patterns

- **Mixing scroll-snap and absolute positioning.** Cannot have some slides in scroll-snap flow and others absolute. The layout mode is always uniform for all slides in a deck.
- **Branching in JS per-slide for transition style.** The transition visual is a CSS concern. JS toggles `data-lys-active`; CSS applies the appropriate transition based on the article's `data-transition` attribute.
- **Defaulting unmarked slides to fade in a mixed deck.** Slides without `data-transition` in a stacked deck should switch instantly (no animation), not inherit the deck's fade behavior. This preserves author intent: only explicitly marked slides get animated transitions.
- **Adding inline styles for per-slide transitions.** All transition behavior is controlled by CSS rules. No `element.style.transition` manipulation.
- **Breaking the `data-lys-mode` attribute contract silently.** The value changes from `"fade"`/`"direct"` to `"stacked"`. Any external code or tests checking for the old values must be updated. **Known breaking change:** user CSS targeting `[data-lys-mode="fade"]` or `[data-lys-mode="direct"]` will stop matching. Users should migrate to `[data-lys-mode]` (attribute-presence) or `[data-lys-mode="stacked"]`.

## Contract (Quality)

### Definition of Done

1. A deck with no `data-transition` attributes behaves identically to before (scroll-snap, no regressions).
2. A deck with mixed `data-transition` values uses stacked layout for all slides.
3. The container gets `data-lys-mode="stacked"` when any slide has a recognized `data-transition`.
4. Navigating TO a slide with `data-transition="fade"` produces an opacity crossfade.
5. Navigating TO a slide with `data-transition="direct"` produces an instant switch.
6. Navigating TO a slide with no `data-transition` in a stacked deck produces an instant switch.
7. Fade slides fade symmetrically: they cross-fade both on entry (gaining `data-lys-active`) and exit (losing `data-lys-active`). This is inherent to CSS `transition-property: opacity` on the article — the transition applies in both directions.
8. `prefers-reduced-motion: reduce` makes all transitions instant.
9. `lys:slidechange` fires identically regardless of per-slide transition type.
10. Keyboard, touch, hash, and API navigation all work in mixed-mode decks.
11. A11y module works without changes.
12. `destroy()` removes `data-lys-mode`, reverts to scroll-snap.
13. CSS-only fallback: no `data-lys-mode` without JS, deck remains scroll-snap.
14. Print layout shows all slides.
15. Bundle size stays within budget: JS < 5 KB gzip, CSS < 2 KB gzip.
16. Existing tests updated: `data-lys-mode` expectations changed from `"fade"`/`"direct"` to `"stacked"`.

### Regression Guardrails

- Default decks (no `data-transition`) must not be affected. Stacked layout CSS is scoped under `[data-lys-mode]`.
- `scrollIntoView()` must still be called in scroll-snap mode.
- The `--lys-transition-duration` and `--lys-transition-easing` tokens must not change defaults.
- `data-lys-active` semantics are unchanged.
- `prefers-reduced-motion` media query continues to set `--_lys-transition-duration: 0ms`.
- FOUC prevention (`data-lys-ready` gate) must still work for fade slides.
- An empty deck must not throw.
- A single-slide deck in stacked mode must display the slide at `opacity: 1`.

### Scenarios (Gherkin)

#### Mode detection (updated)

```gherkin
Scenario: Default deck uses scroll-snap mode
  Given a [data-lys] container with 3 <article> children
  And no article has data-transition
  When the deck is initialized
  Then the container does not have data-lys-mode

Scenario: Deck with any recognized data-transition uses stacked mode
  Given a [data-lys] container with 3 <article> children
  And the second article has data-transition="fade"
  When the deck is initialized
  Then the container has data-lys-mode="stacked"

Scenario: Mixed fade and direct slides use stacked mode
  Given a [data-lys] container with 4 <article> children
  And the first article has data-transition="fade"
  And the third article has data-transition="direct"
  When the deck is initialized
  Then the container has data-lys-mode="stacked"

Scenario: Unknown data-transition value alone does not trigger stacked mode
  Given a [data-lys] container with 3 <article> children
  And one article has data-transition="zoom"
  When the deck is initialized
  Then the container does not have data-lys-mode
```

#### Per-slide transition behavior

```gherkin
Scenario: Navigating to a fade slide produces crossfade
  Given a stacked deck with slides [none, fade, none]
  When navigation changes from slide 0 to slide 1
  Then the second slide (fade) transitions with opacity animation
  And the transition uses --lys-transition-duration and --lys-transition-easing

Scenario: Navigating to a non-fade slide produces instant switch
  Given a stacked deck with slides [fade, none, fade]
  When navigation changes from slide 0 to slide 1
  Then the second slide (no data-transition) appears instantly

Scenario: Navigating to a direct slide produces instant switch
  Given a stacked deck with slides [fade, direct, fade]
  When navigation changes from slide 0 to slide 1
  Then the second slide (direct) appears instantly

Scenario: Fade slide fades out when navigating away
  Given a stacked deck with slides [fade, none]
  And the deck is at slide 0 (fade)
  When navigation changes to slide 1
  Then the first slide fades out (opacity transition)
  And the second slide appears instantly (no data-transition)
```

#### Mixed deck navigation

```gherkin
Scenario: Keyboard navigation works in mixed-mode deck
  Given a stacked deck with slides [fade, direct, none, fade]
  And the deck is at slide 0
  When the user presses ArrowRight 3 times
  Then the deck navigates to slides 1, 2, 3 in sequence
  And lys:slidechange fires for each transition

Scenario: Touch navigation works in mixed-mode deck
  Given a stacked deck with slides [fade, direct, none]
  And the deck is at slide 0
  When the user swipes left
  Then the deck navigates to slide 1

Scenario: Hash routing works in mixed-mode deck
  Given a stacked deck with slides [fade, direct, none]
  And the URL hash is #slide=3
  When the deck is initialized
  Then the deck starts at slide 2 (0-indexed)
  And the third slide has opacity 1

Scenario: scrollIntoView is NOT called in stacked mode
  Given a stacked deck with slides [fade, none, direct]
  When navigation changes to slide 1
  Then scrollIntoView is not called
```

#### A11y in mixed-mode deck

```gherkin
Scenario: ARIA attributes work in mixed-mode deck
  Given a stacked deck with slides [fade, none, direct]
  When the deck is initialized
  Then the container has role="group" and aria-roledescription="slide deck"
  And each slide has role="group" and aria-roledescription="slide"

Scenario: Live region announces in mixed-mode deck
  Given a stacked deck with slides [fade, none, direct]
  And the deck is at slide 0
  When navigation changes to slide 1
  Then the live region text content is "Slide 2 of 3"
```

#### Reduced motion

```gherkin
Scenario: Fade transitions are instant with reduced motion
  Given a stacked deck with slides [fade, none]
  And the user prefers reduced motion
  When navigation changes to slide 0 (fade)
  Then the opacity transition duration is 0ms
```

#### Progressive enhancement and print

```gherkin
Scenario: CSS-only deck with data-transition falls back to scroll-snap
  Given a [data-lys] container with articles having data-transition="fade"
  And only lys.css is loaded (no JS)
  Then the container uses scroll-snap (no data-lys-mode attribute)
  And all articles are visible

Scenario: Mixed-mode print layout shows all slides
  Given a stacked deck with slides [fade, direct, none]
  When the page is printed (@media print)
  Then all slides are visible
  And slides are not stacked
```

#### Cleanup

```gherkin
Scenario: destroy() removes stacked mode
  Given a stacked deck
  When destroy() is called
  Then the container does not have data-lys-mode
  And the deck reverts to scroll-snap behavior

Scenario: Re-initialization after destroy re-detects stacked mode
  Given a stacked deck that was destroyed
  When new Lys(container) is called
  Then the container has data-lys-mode="stacked"
```

#### Edge cases

```gherkin
Scenario: All-fade deck works like before (uniform crossfade)
  Given a [data-lys] container with 3 slides all having data-transition="fade"
  When initialized and navigated
  Then all transitions are crossfades
  And behavior is functionally identical to the previous deck-wide fade mode

Scenario: All-direct deck works like before (uniform instant)
  Given a [data-lys] container with 3 slides all having data-transition="direct"
  When initialized and navigated
  Then all transitions are instant

Scenario: Single fade slide in otherwise plain deck
  Given a [data-lys] container with 5 slides
  And only slide 3 has data-transition="fade"
  When navigation changes to slide 3
  Then the transition is a crossfade
  When navigation changes to slide 4
  Then the transition is instant
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Mode detection (updated) | `tests/unit/transitions.test.ts` |
| Per-slide transition behavior | `tests/unit/transitions.test.ts` + `tests/e2e/transitions.spec.ts` |
| Mixed deck navigation | `tests/unit/transitions.test.ts` |
| A11y in mixed-mode deck | `tests/unit/transitions.test.ts` |
| Reduced motion | `tests/e2e/transitions.spec.ts` |
| Progressive enhancement / print | `tests/e2e/transitions.spec.ts` |
| Cleanup | `tests/unit/transitions.test.ts` |
| Edge cases | `tests/unit/transitions.test.ts` |

## Spec Updates Required

This spec **supersedes** the following sections of `specs/transitions.spec.md`:
- Mode detection scenarios (deck-wide → stacked)
- Anti-pattern "Per-slide transition mixing" (removed — this is now the supported behavior)
- "Related / Future" item about per-slide transitions (now implemented)

After implementation, these specs should be updated to reflect the new model:
- `specs/transitions.spec.md` — mode detection, anti-patterns, related/future
- `specs/direct-transition.spec.md` — references `data-lys-mode="direct"` which no longer exists
- `specs/llm-deliverables.spec.md` — may reference deck-wide transition behavior
- `specs/fouc-fade.spec.md` — references `data-lys-mode` behavior

## Related / Future

- **View Transitions API** — Could replace the CSS opacity approach for smoother per-slide transitions. Browser support improving.
- **Additional transition values** — `"slide"`, `"zoom"`, etc. would work naturally with this per-slide model: add CSS rules for `article[data-transition="slide"]`, etc.
- **Transition events** — A `lys:transitionend` event could be useful for per-slide transitions where different slides complete at different times.
