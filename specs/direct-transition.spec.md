# Direct Transition Mode (No Animation)

## Blueprint (Design)

### Context

Lys currently supports two transition modes: **scroll-snap** (default, CSS-only) and **fade** (opacity crossfade, JS-enhanced). Both involve visual motion — scroll-snap scrolls between slides, fade crossfades opacity. Some use cases need **instant, zero-animation slide switching**: kiosk displays, LLM-generated decks where transitions add no value, or authors who simply prefer snappy navigation without any motion.

The `prefers-reduced-motion: reduce` media query already makes transitions instant, but that's a user-level OS setting, not an author-level choice. Authors need a way to say "this deck should never animate" regardless of the user's motion preference.

This feature adds `data-transition="direct"` as a new recognized value for the existing `data-transition` attribute. Like `fade`, it is a per-deck decision — if any slide has `data-transition="direct"`, the entire deck uses direct mode.

### Architecture

#### How it works

`data-transition="direct"` reuses the **fade mode's stacked layout** (absolute positioning, opacity-based visibility) but with **zero transition duration**. Slides switch instantly — no scroll, no crossfade.

This is architecturally identical to fade mode with `--lys-transition-duration: 0ms`, but expressed as a distinct mode so that:
1. Authors don't need to know about CSS tokens to disable animation.
2. The intent is explicit in markup — an LLM can reliably produce `data-transition="direct"`.
3. It is independent of `prefers-reduced-motion` (direct mode is always instant, even if the user allows motion).

#### Mode detection (`src/lys.ts`)

The existing mode detection checks for `data-transition="fade"`. This expands to also recognize `"direct"`:

```
const transitionMode = slides.some(s => s.dataset.transition === "fade")
  ? "fade"
  : slides.some(s => s.dataset.transition === "direct")
    ? "direct"
    : null;
```

If `transitionMode` is `"fade"` or `"direct"`:
1. Set `data-lys-mode` to the detected value on the container.
2. Skip `scrollIntoView()` in `goTo()` (both modes use stacked layout).

Fade takes precedence over direct if both are present in the same deck (edge case — unlikely but deterministic).

#### CSS (`src/lys.css`)

Direct mode shares the same stacked layout as fade mode. The only difference is the transition duration:

```css
[data-lys][data-lys-mode="direct"] > article {
  transition-duration: 0ms;
}
```

The existing fade mode selector `[data-lys][data-lys-mode="fade"]` already handles the stacked layout. Direct mode needs the same layout rules. Rather than duplicating, both modes can share a selector:

```css
[data-lys][data-lys-mode="fade"],
[data-lys][data-lys-mode="direct"] {
  /* shared stacked layout rules */
}
```

Or use an attribute-presence selector if future modes also need stacked layout:

```css
[data-lys][data-lys-mode] {
  /* stacked layout for any non-default mode */
}
```

The second approach is cleaner and forward-compatible. The only mode-specific CSS is the transition override for direct mode.

**New API surface — `data-lys-mode="direct"` state value:**
This extends the existing `data-lys-mode` attribute (already used for `"fade"`) with a new value. It is an internal state attribute, not author-facing. Authors use `data-transition="direct"` on `<article>` elements.

#### Navigation (`src/lys.ts`)

The `goTo()` method already branches on `this.#fadeMode` to skip `scrollIntoView()`. This needs to generalize: skip `scrollIntoView()` for any non-default mode (fade or direct). A simple approach:

```
if (!this.#mode) {
  nextSlide.scrollIntoView(...);
}
```

Where `#mode` is `null` for scroll-snap, `"fade"` for fade, or `"direct"` for direct.

#### Module boundaries

- **`src/lys.ts`** — Expand mode detection to recognize `"direct"`. Generalize `#fadeMode: boolean` to `#mode: "fade" | "direct" | null`. Branch `goTo()` on `#mode` instead of `#fadeMode`.
- **`src/lys.css`** — Generalize fade stacked-layout rules to apply to any `[data-lys-mode]`. Add zero-duration override for `[data-lys-mode="direct"]`.
- **`src/navigation.ts`** — No changes. Navigation is mode-agnostic.
- **`src/a11y.ts`** — No changes. A11y listens for `lys:slidechange`, which fires identically in all modes.
- **`src/types.ts`** — No changes to the public `LysInstance` interface.

#### Interaction with existing tokens

| Token | Direct mode behavior |
|---|---|
| `--lys-transition-duration` | **Ignored** — direct mode forces 0ms regardless of token value |
| `--lys-transition-easing` | Irrelevant — no transition to ease |
| `--lys-aspect-ratio` | Same as fade — base aspect-ratio rule applies |
| `--lys-slide-padding` | Same as fade — base padding rule applies |

#### Interaction with `prefers-reduced-motion`

Direct mode is always instant. `prefers-reduced-motion` has no additional effect — the behavior is already reduced. This is correct: an author choosing `data-transition="direct"` has explicitly opted out of animation.

### Anti-Patterns

- **Adding a new CSS token for direct mode.** No `--lys-direct-*` tokens. Direct mode is a layout/transition behavior, not a new token surface.
- **Using JS to set `transition-duration: 0ms` inline.** The CSS rule `[data-lys-mode="direct"] > article { transition-duration: 0ms }` handles this declaratively. No inline styles.
- **Treating direct as a third layout mode.** Direct mode shares fade's stacked layout. Do not create a third layout system — reuse the existing stacked layout and only override transition timing.
- **Breaking the `#fadeMode` → `#mode` refactor boundary.** The refactor from boolean to enum must be contained to `lys.ts`. Navigation and a11y modules must not need changes.
- **Making `data-transition="direct"` work without JS.** Like fade, direct mode requires JS to set `data-lys-mode`. Without JS, the deck falls back to scroll-snap (progressive enhancement baseline). This is correct behavior.
- **Allowing direct + fade mixing.** If a deck has both `data-transition="fade"` and `data-transition="direct"` on different slides, fade wins. Do not attempt per-slide mixing.

## Contract (Quality)

### Definition of Done

1. A deck with `data-transition="direct"` on any slide uses stacked layout with instant (0ms) opacity switching.
2. The container gets `data-lys-mode="direct"` when direct mode is detected.
3. `scrollIntoView()` is NOT called in direct mode.
4. Slide changes are visually instant — no crossfade, no scroll animation.
5. `--lys-transition-duration` does not affect direct mode (always 0ms).
6. `lys:slidechange` fires with identical detail shape as other modes.
7. Keyboard, touch, hash, and API navigation all work in direct mode.
8. A11y module (ARIA, live region, focus) works in direct mode without changes.
9. `destroy()` removes `data-lys-mode="direct"`, reverting to scroll-snap.
10. CSS-only deck with `data-transition="direct"` (no JS) falls back to scroll-snap.
11. Print layout works in direct mode (all slides visible, flowing vertically).
12. Existing fade mode behavior is unchanged.
13. Existing scroll-snap (default) behavior is unchanged.
14. Bundle size stays within budget: JS < 5 KB gzip, CSS < 2 KB gzip.

### Regression Guardrails

- All existing transitions.spec.md scenarios must continue to pass — direct mode must not alter fade or scroll-snap behavior.
- The `data-lys-active` attribute semantics are unchanged.
- The `data-lys-mode="fade"` value continues to work exactly as before.
- Default decks (no `data-transition`) must not be affected by any CSS selector changes (e.g., generalizing `[data-lys-mode="fade"]` to `[data-lys-mode]` must not introduce side effects for decks without the attribute).
- `prefers-reduced-motion` must continue to affect fade mode as before (0ms duration via token). Direct mode is always 0ms regardless.
- The refactor from `#fadeMode: boolean` to `#mode` must not change behavior for any existing mode.

### Scenarios (Gherkin)

#### Mode detection

```gherkin
Scenario: Deck with data-transition="direct" uses direct mode
  Given a [data-lys] container with 3 <article> children
  And the first article has data-transition="direct"
  When the deck is initialized
  Then the container has data-lys-mode="direct"

Scenario: Any slide with direct activates direct for the whole deck
  Given a [data-lys] container with 5 <article> children
  And only the third article has data-transition="direct"
  When the deck is initialized
  Then the container has data-lys-mode="direct"
  And all slides use stacked layout (position: absolute)

Scenario: Fade takes precedence over direct
  Given a [data-lys] container with 3 <article> children
  And the first article has data-transition="fade"
  And the second article has data-transition="direct"
  When the deck is initialized
  Then the container has data-lys-mode="fade"
```

#### Direct mode layout

```gherkin
Scenario: Active slide is visible in direct mode
  Given a direct-mode deck with 3 slides
  When the deck is initialized (current = 0)
  Then the first slide has opacity 1
  And the first slide has pointer-events auto
  And the second slide has opacity 0
  And the second slide has pointer-events none

Scenario: Slide switch is instant in direct mode
  Given a direct-mode deck at slide 0
  When navigation changes to slide 1
  Then the first slide immediately has opacity 0
  And the second slide immediately has opacity 1
  And no CSS transition animation occurs
```

#### Navigation in direct mode

```gherkin
Scenario: Keyboard navigation works in direct mode
  Given a direct-mode deck at slide 0
  When the user presses ArrowRight
  Then the deck navigates to slide 1
  And lys:slidechange fires with from=0, to=1

Scenario: Touch navigation works in direct mode
  Given a direct-mode deck at slide 0
  When the user swipes left (deltaX > 50px)
  Then the deck navigates to slide 1

Scenario: Hash routing works in direct mode
  Given a direct-mode deck
  And the URL hash is #slide=2
  When the deck is initialized
  Then the deck starts at slide 1 (0-indexed)
  And the second slide has opacity 1

Scenario: API navigation works in direct mode
  Given a direct-mode deck at slide 0
  When instance.goTo(2) is called
  Then the deck navigates to slide 2
  And lys:slidechange fires with from=0, to=2

Scenario: scrollIntoView is NOT called in direct mode
  Given a direct-mode deck at slide 0
  When navigation changes to slide 1
  Then scrollIntoView is not called
```

#### Token independence

```gherkin
Scenario: --lys-transition-duration does not affect direct mode
  Given a direct-mode deck with --lys-transition-duration: 2000ms
  When navigation changes to slide 1
  Then the slide switch is still instant (0ms)
```

#### A11y in direct mode

```gherkin
Scenario: ARIA attributes work in direct mode
  Given a direct-mode deck with 3 slides
  When the deck is initialized
  Then the container has role="group" and aria-roledescription="slide deck"
  And each slide has role="group" and aria-roledescription="slide"
  And non-active slides have aria-hidden="true"

Scenario: Live region announces in direct mode
  Given a direct-mode deck at slide 0
  When navigation changes to slide 1
  Then the live region text content is "Slide 2 of 3"

Scenario: Focus moves in direct mode
  Given a direct-mode deck at slide 0
  When navigation changes to slide 1
  Then the second slide has focus
```

#### Progressive enhancement

```gherkin
Scenario: CSS-only deck with data-transition="direct" falls back to scroll-snap
  Given a [data-lys] container with 3 <article> children
  And the first article has data-transition="direct"
  And only lys.css is loaded (no JS)
  Then the container uses scroll-snap-type: y mandatory
  And all articles are visible (not stacked, not hidden)
  And the deck is navigable by scrolling

Scenario: Direct mode print layout shows all slides
  Given a direct-mode deck with 3 slides
  When the page is printed (@media print)
  Then all 3 slides are visible
  And slides are not stacked (position is not absolute)
  And each slide has a page-break-after
```

#### Cleanup

```gherkin
Scenario: destroy() removes direct mode
  Given a direct-mode deck
  When destroy() is called
  Then the container does not have data-lys-mode
  And the container reverts to scroll-snap behavior

Scenario: Re-initialization after destroy preserves direct mode
  Given a direct-mode deck that was destroyed
  When new Lys(container) is called
  Then the deck re-enters direct mode
  And the container has data-lys-mode="direct"
```

#### Edge cases

```gherkin
Scenario: Single-slide direct deck shows the slide
  Given a [data-lys] container with 1 <article> child
  And the article has data-transition="direct"
  When the deck is initialized
  Then the container has data-lys-mode="direct"
  And the article has opacity 1
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Mode detection | `tests/unit/transitions.test.ts` |
| Direct mode layout | `tests/unit/transitions.test.ts` + `tests/e2e/transitions.spec.ts` |
| Navigation in direct mode | `tests/unit/transitions.test.ts` |
| Token independence | `tests/e2e/transitions.spec.ts` |
| A11y in direct mode | `tests/unit/transitions.test.ts` |
| Progressive enhancement | `tests/e2e/transitions.spec.ts` |
| Cleanup | `tests/unit/transitions.test.ts` |
| Edge cases | `tests/unit/transitions.test.ts` |

## Known Test Utility Limitation

The `createDeck` helper in `tests/unit/transitions.test.ts` accepts both `fadeSlides` and `directSlides` arrays. If the same slide index appears in both, the last-write wins (`data-transition="direct"` overwrites `"fade"`). This is a mild footgun in the test utility, not a production issue — callers should avoid overlapping indices.

## Related / Future

- **Issue #19 — per-slide transitions.** Currently deferred. If per-slide transitions are implemented later, `"direct"` would be one of the per-slide values. The current per-deck approach is forward-compatible.
- **Issue #22 — FOUC on fade transition.** Direct mode inherits the same stacked layout as fade, so any FOUC fix for fade should also cover direct mode.
- **`data-transition="none"` alias.** Some authors may expect `"none"` to mean no animation. This could be added as an alias for `"direct"` post-1.0 if there's demand. For now, `"direct"` is the canonical value.
