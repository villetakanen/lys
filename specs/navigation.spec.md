# Navigation — Keyboard, Touch, Hash Routing, Programmatic API

## Blueprint (Design)

### Context

Navigation is the bridge between "a page with articles" and "a presentation you can deliver." Without it, Lys is a CSS layout engine. With it, Lys is a slide deck.

The CSS-only tier provides scroll-snap navigation — users can scroll between slides. The JS tier replaces scrolling with discrete slide transitions: keyboard shortcuts, touch/swipe gestures, URL hash routing, and a programmatic API (`next()`, `prev()`, `goTo()`). These are the behaviors that LLMs cannot reliably produce in generated HTML, and the reason Lys exists.

Navigation must:

- Feel instant and predictable — no debounce jank, no missed keystrokes.
- Work identically in IIFE (auto-init) and ESM (manual init) modes.
- Coexist with scroll-snap — when JS navigates, it scrolls the target slide into view smoothly (or instantly with reduced motion). The scroll-snap container remains the layout mechanism; JS just drives it programmatically.
- Support deep linking — opening `deck.html#slide=5` or `deck.html#slide=intro` jumps directly to that slide on load.
- Emit events — every navigation action dispatches `lys:slidechange` so other modules (a11y, transitions) can react.

### Architecture

#### Programmatic API (`src/lys.ts` — extends `Lys` class)

Navigation methods are added to the `Lys` class, fulfilling the `LysInstance` interface from ARCHITECTURE.md:

```typescript
next(): void;       // Advance to the next slide. No-op at the last slide.
prev(): void;       // Go to the previous slide. No-op at the first slide.
goTo(target: number | string): void;  // Jump to slide by 0-based index or article id.
```

**`goTo()` resolution rules:**
- `goTo(n)` where `n` is a number: clamp to `[0, total - 1]`. Out-of-range values are silently clamped (not an error).
- `goTo(id)` where `id` is a string: find the `<article id="...">` matching the string. If no match, no-op.
- `goTo()` on an empty deck: no-op.

**State updates:**
- All three methods update `#current`, `#slides[#current]` (the active slide reference), and the URL hash.
- All three dispatch `lys:slidechange` on the container.
- If the target slide is the same as the current slide, no event fires and no scroll occurs (idempotent).

#### `lys:slidechange` event

Defined in `types.ts` (already exists):

```typescript
interface LysSlideChangeDetail {
  from: number;   // Previous slide index
  to: number;     // New slide index
  slide: HTMLElement;  // The new active slide element
}
```

Dispatched on the `[data-lys]` container element with `bubbles: true`. This is the primary integration point for the a11y module (live region announcements, focus management).

#### Scroll behavior

When JS navigates to a slide, it calls `article.scrollIntoView()` on the target. Scroll behavior respects `prefers-reduced-motion`:

- **Normal motion:** `scrollIntoView({ behavior: 'smooth', block: 'start' })`
- **Reduced motion:** `scrollIntoView({ behavior: 'instant', block: 'start' })`

The `prefers-reduced-motion` check is done via `matchMedia('(prefers-reduced-motion: reduce)')` at navigation time (not cached — respects runtime changes).

#### Keyboard navigation (`src/navigation.ts`)

Keyboard listeners are attached to the `[data-lys]` container element (not `document`). This ensures:
- Multiple decks on one page each handle their own keys.
- Keys only fire when the container (or a child) has focus.
- No global listener pollution.

The container must be focusable. Navigation sets `tabindex="0"` on the container during init if it doesn't already have a `tabindex`. This is the only DOM mutation navigation performs (beyond state attribute updates).

**Auto-focus:** When there is only one `[data-lys]` container on the page, navigation auto-focuses it after init (`container.focus({ preventScroll: true })`). This allows keyboard navigation to work immediately without the user needing to click the deck first. With multiple decks, no auto-focus occurs — the user must click or tab to the desired deck.

**New API surface:** Navigation adds `tabindex="0"` to the container. This is a DOM mutation on an existing element, not a new data attribute. It enables keyboard interaction without requiring author markup changes.

| Key | Action | Condition |
|---|---|---|
| `ArrowRight` | `next()` | — |
| `ArrowDown` | `next()` | — |
| `ArrowLeft` | `prev()` | — |
| `ArrowUp` | `prev()` | — |
| `Space` | `next()` | Not when an interactive child is focused |
| `Shift+Space` | `prev()` | Not when an interactive child is focused |
| `Home` | `goTo(0)` | — |
| `End` | `goTo(total - 1)` | — |

**Interactive child guard:** When focus is on an `<input>`, `<textarea>`, `<select>`, `<button>`, `[contenteditable]`, or any element with `role="textbox"` inside the container, `Space` and `Shift+Space` must NOT navigate. Arrow keys still navigate (this matches WAI-ARIA carousel conventions — arrow keys are the primary navigation mechanism, Space is secondary).

**Key repeat:** Rapid key repeat (holding an arrow key) must not cause navigation to skip slides or queue up transitions. Each keydown navigates exactly one slide. The scroll-snap container's behavior naturally throttles this — `scrollIntoView` on an already-scrolling container is a no-op until the previous scroll completes.

#### Touch / swipe navigation (`src/navigation.ts`)

Touch gestures use a horizontal swipe model:

- Track `touchstart` → `touchend` displacement.
- **Swipe right** (positive X delta, `> threshold`): `prev()`
- **Swipe left** (negative X delta, `> threshold`): `next()`
- **Threshold:** 50px minimum horizontal displacement. Vertical-dominant gestures (|deltaY| > |deltaX|) are ignored (allow normal scrolling).
- **Velocity is not considered** — distance alone determines the gesture. This keeps the implementation simple and predictable.

Touch listeners are attached to the container with `{ passive: true }` where possible (touchstart, touchmove) to avoid scroll-blocking warnings. The `touchend` handler computes the delta and calls `next()`/`prev()`.

**No `preventDefault()` on touch events.** The scroll-snap container handles visual scrolling natively. Touch navigation simply programmatically syncs the JS state with where the user scrolled. This avoids fighting the browser's touch scroll handling.

#### URL hash routing

Hash routing syncs the current slide with the URL fragment:

- **On navigation:** After every `goTo()` call, update `location.hash` to `#slide=N` (1-based for human readability) or `#slide=id` if the target article has an `id` attribute.
- **On load:** During init, if `location.hash` matches `#slide=N` or `#slide=id`, call `goTo()` with the parsed value.
- **On `hashchange`:** Listen for external hash changes (e.g., user editing the URL, browser back/forward) and navigate accordingly.

**Hash format:**
- `#slide=3` — 1-based numeric index (converts to 0-based internally).
- `#slide=intro` — article `id` attribute value.
- Any other hash format is ignored (no-op).

**`hashchange` listener** is attached to `window`, scoped by checking that the hash refers to a slide in this specific container. With multiple decks, only the deck containing the matching slide responds.

**History behavior:** Uses `history.replaceState` to update the hash without adding history entries for every slide change. The `hashchange` listener only fires for external changes (browser back/forward, direct URL edit), not for programmatic `replaceState` calls.

#### State attribute

**New API surface:** Navigation sets `data-lys-current` on the container element, reflecting the 0-based current slide index as a string. This allows CSS authors to style based on the current slide position (e.g., progress indicators) without JS. Cleared on `destroy()`.

Additionally, the active slide receives a `data-lys-active` attribute (no value), and the previously active slide has this attribute removed. This allows CSS-based slide visibility or highlight without JS class manipulation.

#### Module boundaries

- **`src/navigation.ts`** — Exports a `setupNavigation(instance, container, slides)` function and a `teardownNavigation()` cleanup function. Contains keyboard handler, touch handler, and hash routing logic. Does not import from `lys.ts` (avoids circular dependencies) — receives what it needs as arguments.
- **`src/lys.ts`** — Imports and calls `setupNavigation` during construction. Adds `next()`, `prev()`, `goTo()` methods to the `Lys` class. Calls `teardownNavigation` during `destroy()`.
- **`src/types.ts`** — `LysInstance` interface gains `next()`, `prev()`, `goTo()` methods. `LysSlideChangeDetail` already exists.

#### Integration with other modules

- **a11y** (future): Listens for `lys:slidechange` to announce slide transitions via ARIA live region and manage focus.
- **transitions**: Navigation is mode-agnostic. Fade mode branches in `goTo()`, not in the navigation module.
- **core**: Navigation reads `#slides` and `#current` from the instance. It updates `#current` via an internal setter (not the public readonly property).

### Anti-Patterns

- **Global keyboard listeners.** Never attach to `document` or `window` for key events. Each deck manages its own keys on its container. The only `window`-level listener is `hashchange` (scoped to the specific deck).
- **Preventing default scroll behavior.** Do not `preventDefault()` on scroll or touch events. Lys works *with* scroll-snap, not against it. JS navigation calls `scrollIntoView` to drive scrolling programmatically.
- **Queuing navigation.** Do not buffer or animate navigation. `next()` immediately updates state and scrolls. If the user presses arrow keys rapidly, each keydown moves exactly one slide.
- **Modifying `data-transition` behavior.** The `data-transition` attribute is declared in the article contract but its visual implementation is deferred. Navigation must not add transition classes or animations — it only changes which slide is current.
- **Adding navigation UI.** No prev/next buttons, no pagination dots, no progress bars. Navigation is behavioral, not visual. Authors add their own UI and wire it to the API.
- **Using `scroll` event for state tracking.** Scroll events are noisy and unreliable for determining which slide is active (especially during momentum scrolling). State is tracked via explicit `goTo()` calls, not by observing scroll position.
- **Breaking the size budget.** Navigation adds to the JS bundle. Target: navigation module should add < 1 KB gzipped to the total. Keep the implementation minimal.

## Contract (Quality)

### Definition of Done

1. `next()` advances to the next slide and updates `current`, `slide`, hash, and `data-lys-current`.
2. `prev()` goes to the previous slide with the same state updates.
3. `goTo(n)` jumps to slide `n` (0-based), clamped to valid range.
4. `goTo(id)` jumps to the slide with matching `id` attribute.
5. `lys:slidechange` fires on every navigation with correct `from`, `to`, and `slide` detail.
6. `lys:slidechange` does NOT fire when navigating to the already-current slide.
7. Arrow keys (Left/Right/Up/Down) navigate between slides when the container has focus.
8. Space/Shift+Space navigate unless an interactive child element is focused.
9. Home/End jump to the first/last slide.
10. Horizontal swipe gestures navigate (left = next, right = prev) with 50px threshold.
11. Vertical-dominant touch gestures do not trigger navigation.
12. `#slide=N` (1-based) and `#slide=id` deep links work on page load.
13. Hash updates on every navigation via `replaceState` (no history pollution).
14. `hashchange` event from external sources (back/forward, URL edit) triggers navigation.
15. `prefers-reduced-motion: reduce` causes instant scroll (no smooth scrolling).
16. All listeners are removed on `destroy()`.
17. Navigation on an empty deck (0 slides) is a no-op for all methods.
18. `data-lys-active` attribute is set on the current slide and removed from the previous.
19. `data-lys-current` attribute on the container reflects the current slide index.

### Regression Guardrails

- Navigation must never throw, regardless of input. Out-of-range indices are clamped, missing IDs are no-ops.
- A single-slide deck must not error on `next()` or `prev()` — they are simply no-ops.
- `destroy()` must fully clean up: no orphaned event listeners, no stale hash listeners, no leftover `data-lys-*` attributes.
- Keyboard navigation must not interfere with native browser shortcuts (Ctrl+C, Ctrl+V, Alt+Tab, etc.). Only unmodified keys and Shift+Space are captured.
- Touch navigation must not break native scroll on non-deck elements.
- Multiple decks on one page must each navigate independently.
- CSS-only decks (no JS) must remain scrollable — navigation JS must not break the scroll-snap fallback.

### Scenarios (Gherkin)

#### Programmatic navigation

```gherkin
Scenario: next() advances to the next slide
  Given a 5-slide deck initialized at slide 0
  When next() is called
  Then current is 1
  And slide is the second <article>
  And lys:slidechange fires with { from: 0, to: 1 }

Scenario: next() is a no-op at the last slide
  Given a 5-slide deck at slide 4
  When next() is called
  Then current remains 4
  And no lys:slidechange fires

Scenario: prev() goes to the previous slide
  Given a 5-slide deck at slide 3
  When prev() is called
  Then current is 2
  And lys:slidechange fires with { from: 3, to: 2 }

Scenario: prev() is a no-op at the first slide
  Given a 5-slide deck at slide 0
  When prev() is called
  Then current remains 0
  And no lys:slidechange fires

Scenario: goTo(n) jumps to a specific slide
  Given a 5-slide deck at slide 0
  When goTo(3) is called
  Then current is 3
  And lys:slidechange fires with { from: 0, to: 3 }

Scenario: goTo() clamps out-of-range positive index
  Given a 5-slide deck at slide 0
  When goTo(99) is called
  Then current is 4 (last slide)
  And lys:slidechange fires with { from: 0, to: 4 }

Scenario: goTo() clamps negative index to 0
  Given a 5-slide deck at slide 3
  When goTo(-1) is called
  Then current is 0
  And lys:slidechange fires with { from: 3, to: 0 }

Scenario: goTo(id) navigates by article id
  Given a 5-slide deck where slide 2 has id="conclusion"
  When goTo("conclusion") is called
  Then current is 2
  And lys:slidechange fires with { from: 0, to: 2 }

Scenario: goTo(id) with non-existent id is a no-op
  Given a 5-slide deck at slide 0
  When goTo("nonexistent") is called
  Then current remains 0
  And no lys:slidechange fires

Scenario: Navigating to the current slide is a no-op
  Given a 5-slide deck at slide 2
  When goTo(2) is called
  Then current remains 2
  And no lys:slidechange fires

Scenario: Navigation on empty deck is a no-op
  Given an empty deck (0 slides)
  When next(), prev(), or goTo(0) is called
  Then no error is thrown
  And no lys:slidechange fires
```

#### State attributes

```gherkin
Scenario: data-lys-active is set on the current slide
  Given a 3-slide deck initialized at slide 0
  Then the first article has [data-lys-active]
  And the other articles do not have [data-lys-active]

Scenario: data-lys-active moves on navigation
  Given a 3-slide deck at slide 0
  When next() is called
  Then the first article does not have [data-lys-active]
  And the second article has [data-lys-active]

Scenario: data-lys-current reflects the current index
  Given a 3-slide deck initialized at slide 0
  Then the container has data-lys-current="0"
  When next() is called
  Then the container has data-lys-current="1"

Scenario: State attributes are cleaned up on destroy
  Given an initialized deck with data-lys-current and data-lys-active set
  When destroy() is called
  Then the container does not have [data-lys-current]
  And no article has [data-lys-active]
```

#### Keyboard navigation

```gherkin
Scenario: ArrowRight advances to next slide
  Given a 5-slide deck with the container focused
  When the user presses ArrowRight
  Then current advances by 1

Scenario: ArrowLeft goes to previous slide
  Given a 5-slide deck at slide 2 with the container focused
  When the user presses ArrowLeft
  Then current is 1

Scenario: ArrowDown advances to next slide
  Given a 5-slide deck with the container focused
  When the user presses ArrowDown
  Then current advances by 1

Scenario: ArrowUp goes to previous slide
  Given a 5-slide deck at slide 2 with the container focused
  When the user presses ArrowUp
  Then current is 1

Scenario: Home jumps to first slide
  Given a 5-slide deck at slide 3 with the container focused
  When the user presses Home
  Then current is 0

Scenario: End jumps to last slide
  Given a 5-slide deck at slide 0 with the container focused
  When the user presses End
  Then current is 4

Scenario: Space advances to next slide
  Given a 5-slide deck with the container focused
  When the user presses Space
  Then current advances by 1

Scenario: Shift+Space goes to previous slide
  Given a 5-slide deck at slide 2 with the container focused
  When the user presses Shift+Space
  Then current is 1

Scenario: Space does not navigate when an input is focused
  Given a 5-slide deck with a focused <input> inside the current slide
  When the user presses Space
  Then current does not change
  And the input receives the space character

Scenario: Space does not navigate when a textarea is focused
  Given a 5-slide deck with a focused <textarea> inside the current slide
  When the user presses Space
  Then current does not change

Scenario: Arrow keys still navigate when an input is focused
  Given a 5-slide deck with a focused <input> inside the current slide
  When the user presses ArrowRight
  Then current advances by 1

Scenario: Modified keys are ignored
  Given a 5-slide deck with the container focused
  When the user presses Ctrl+ArrowRight
  Then current does not change (browser shortcut preserved)
  When the user presses Alt+ArrowRight
  Then current does not change
  When the user presses Meta+ArrowRight
  Then current does not change

Scenario: Keys do not fire when container lacks focus
  Given a 5-slide deck where the container does not have focus
  When the user presses ArrowRight
  Then current does not change
```

#### Touch navigation

```gherkin
Scenario: Swipe left triggers next()
  Given a 5-slide deck at slide 0
  When the user swipes left (deltaX < -50px, |deltaX| > |deltaY|)
  Then current is 1

Scenario: Swipe right triggers prev()
  Given a 5-slide deck at slide 2
  When the user swipes right (deltaX > 50px, |deltaX| > |deltaY|)
  Then current is 1

Scenario: Short swipe is ignored
  Given a 5-slide deck at slide 0
  When the user swipes left with deltaX = -30px
  Then current remains 0

Scenario: Vertical-dominant swipe is ignored
  Given a 5-slide deck at slide 0
  When the user swipes with deltaX = -60px and deltaY = -100px
  Then current remains 0 (vertical scroll, not navigation)

Scenario: Swipe left at last slide is a no-op
  Given a 5-slide deck at slide 4
  When the user swipes left
  Then current remains 4
```

#### Hash routing

```gherkin
Scenario: Hash deep link on page load (numeric)
  Given a 5-slide deck
  And the URL hash is #slide=3
  When the deck initializes
  Then current is 2 (0-based from 1-based hash)

Scenario: Hash deep link on page load (id)
  Given a 5-slide deck where slide 1 has id="overview"
  And the URL hash is #slide=overview
  When the deck initializes
  Then current is 1

Scenario: Hash updates on navigation
  Given a 5-slide deck at slide 0
  When next() is called
  Then location.hash contains "slide=2" (1-based)

Scenario: Hash updates use article id when available
  Given a 5-slide deck where slide 2 has id="details"
  When goTo(2) is called
  Then location.hash contains "slide=details"

Scenario: External hashchange triggers navigation
  Given a 5-slide deck at slide 0
  When location.hash is set to "#slide=4" externally
  Then current is 3

Scenario: Invalid hash is ignored
  Given a 5-slide deck at slide 0
  And the URL hash is #something-else
  When the deck initializes
  Then current remains 0

Scenario: Hash with out-of-range number is clamped
  Given a 5-slide deck
  And the URL hash is #slide=99
  When the deck initializes
  Then current is 4 (last slide)
```

#### Reduced motion

```gherkin
Scenario: Smooth scroll when motion is allowed
  Given a 5-slide deck with prefers-reduced-motion: no-preference
  When next() is called
  Then scrollIntoView is called with behavior: "smooth"

Scenario: Instant scroll when reduced motion is preferred
  Given a 5-slide deck with prefers-reduced-motion: reduce
  When next() is called
  Then scrollIntoView is called with behavior: "instant"
```

#### Lifecycle

```gherkin
Scenario: destroy() removes keyboard listener
  Given an initialized deck
  When destroy() is called
  And the user presses ArrowRight on the container
  Then no navigation occurs

Scenario: destroy() removes touch listener
  Given an initialized deck
  When destroy() is called
  And the user swipes left on the container
  Then no navigation occurs

Scenario: destroy() removes hashchange listener
  Given an initialized deck
  When destroy() is called
  And location.hash changes to #slide=3
  Then no navigation occurs

Scenario: destroy() removes tabindex if navigation added it
  Given a container without an explicit tabindex
  When the deck is initialized (navigation adds tabindex="0")
  And destroy() is called
  Then the container does not have a tabindex attribute

Scenario: destroy() preserves tabindex if it was already present
  Given a container with tabindex="-1"
  When the deck is initialized and then destroyed
  Then the container still has tabindex="-1"
```

#### Multiple decks

```gherkin
Scenario: Two decks navigate independently
  Given two [data-lys] containers, each with 3 slides
  When ArrowRight is pressed on deck A (focused)
  Then deck A advances to slide 1
  And deck B remains at slide 0

Scenario: Hash routing targets the correct deck
  Given two [data-lys] containers
  And deck B has an article with id="target"
  When location.hash is set to "#slide=target"
  Then deck B navigates to that slide
  And deck A does not change
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Programmatic navigation | `tests/unit/navigation.test.ts` |
| State attributes | `tests/unit/navigation.test.ts` |
| Keyboard navigation | `tests/unit/navigation.test.ts` + `tests/e2e/navigation.spec.ts` |
| Touch navigation | `tests/unit/navigation.test.ts` |
| Hash routing | `tests/unit/navigation.test.ts` + `tests/e2e/navigation.spec.ts` |
| Reduced motion | `tests/e2e/slides.spec.ts` |
| Lifecycle | `tests/unit/navigation.test.ts` |
| Multiple decks | `tests/e2e/navigation.spec.ts` |

## Known Constraints

- **`scrollIntoView` in happy-dom.** happy-dom does not implement smooth scrolling or `scrollIntoView` behavior. Unit tests verify state changes and event dispatch; e2e tests verify actual scroll behavior in a real browser.
- **Touch event simulation in unit tests.** happy-dom supports `TouchEvent` construction but not real gesture physics. Unit tests verify the touch handler logic with synthetic events; e2e tests verify real swipe behavior.

## Related / Future

- **Accessibility** (`specs/a11y.spec.md`) — Listens for `lys:slidechange` to manage focus and ARIA live region. Navigation provides the events; a11y provides the announcements.
- **Transitions** (`specs/transitions.spec.md`) — Fade mode changes how `goTo()` renders slide changes (opacity instead of scroll). Navigation itself is unchanged.
- **Fragments / steps** (VISION.md open question) — Incremental reveals within a slide. If implemented, `next()` would need to check for pending fragments before advancing to the next slide. This spec does not account for fragments; it would require a spec update.
- **`data-transition` visual effects** — The `data-transition` attribute is part of the article contract but its visual implementation is deferred. Navigation changes state; transitions are a separate concern.
