# FOUC on Fade/Direct Transition Init

## Blueprint (Design)

### Context

When a fade-mode or direct-mode deck loads, there is a visible flash: all slides appear briefly in scroll-snap layout, then non-active slides animate to `opacity: 0` over 300ms as the stacked layout kicks in. This happens because:

1. CSS loads first — all slides are visible in scroll-snap mode (correct progressive enhancement).
2. JS sets `data-lys-mode` on the container — CSS switches to stacked layout.
3. Slides get `transition-property: opacity` — the browser animates the opacity change from 1 → 0 for non-active slides instead of applying it instantly.

The 300ms fade-out of non-active slides during initialization is the FOUC. The issue says "slides flash couple of times as the JS is applied."

### Architecture

#### Fix: defer transition-property until after first paint

The `transition-property: opacity` rule currently lives on the stacked layout selector `[data-lys][data-lys-mode] > article`. This means transitions are active from the moment `data-lys-mode` is set — including during initialization, when we want the initial state to appear instantly.

**CSS change (`src/lys.css`):**

Remove `transition-property: opacity` from the stacked layout base rule. Move it behind a `data-lys-ready` gate:

```css
/* Stacked layout — no transition-property here */
[data-lys][data-lys-mode] > article {
  position: absolute;
  /* ... existing rules ... */
  opacity: 0;
  pointer-events: none;
  /* transition-property: opacity — REMOVED from here */
}

/* Enable transitions only after init */
[data-lys][data-lys-ready][data-lys-mode] > article {
  transition-property: opacity;
}
```

**JS change (`src/lys.ts`):**

After all init is complete (after dispatching `lys:ready`), set `data-lys-ready` on the next animation frame:

```
requestAnimationFrame(() => {
  container.setAttribute("data-lys-ready", "");
});
```

On `destroy()`, remove `data-lys-ready`.

This ensures:
- On init: slides snap to their final opacity instantly (no animation).
- After init: slide changes animate normally via `transition-property: opacity`.
- Direct mode is unaffected (its `transition-duration: 0ms` already prevents visible animation, but the fix applies cleanly to it too).
- Scroll-snap mode is unaffected (no `data-lys-mode`, so the `data-lys-ready` gate is irrelevant).

**New API surface — `data-lys-ready` state attribute:**
This is an internal state attribute (like `data-lys-active`, `data-lys-current`, `data-lys-mode`), not author-facing. It signals that initialization is complete and transitions may begin. Authors should not set it manually.

#### Module boundaries

- **`src/lys.css`** — Move `transition-property: opacity` behind `[data-lys-ready]` gate.
- **`src/lys.ts`** — Set `data-lys-ready` via `requestAnimationFrame` after `lys:ready` dispatch. Remove it in `destroy()`.
- **`src/a11y.ts`** — No changes.
- **`src/navigation.ts`** — No changes.

### Anti-Patterns

- **Using `setTimeout` instead of `requestAnimationFrame`.** `rAF` guarantees the browser has painted the initial state before enabling transitions. `setTimeout(0)` may fire before paint in some browsers.
- **Hiding all slides with CSS until JS runs.** This breaks progressive enhancement — CSS-only decks must show all slides in scroll-snap mode.
- **Using inline styles to suppress transitions.** The CSS attribute gate is cleaner and doesn't require per-slide inline style cleanup.
- **Setting `data-lys-ready` synchronously in the constructor.** The attribute must be set after the first paint so the browser renders the initial state without transitions.

## Contract (Quality)

### Definition of Done

1. Fade-mode deck does not flash non-active slides during initialization.
2. Direct-mode deck does not flash non-active slides during initialization.
3. After initialization, fade-mode slide transitions still animate with `--lys-transition-duration`.
4. `data-lys-ready` is set on the container after the first animation frame following init.
5. `destroy()` removes `data-lys-ready`.
6. Scroll-snap (default) mode is unaffected.
7. CSS-only decks (no JS) are unaffected — all slides remain visible in scroll-snap.
8. Print layout is unaffected.
9. `prefers-reduced-motion` behavior is unchanged.

### Regression Guardrails

- The stacked layout rules (`position: absolute`, `opacity: 0/1`, `pointer-events`) must not change.
- `transition-duration` and `transition-timing-function` on articles must remain as-is (inherited from base article rule via tokens).
- The `lys:ready` event must still fire synchronously during construction (before `data-lys-ready` is set).
- Direct mode's `transition-duration: 0ms` override must not be affected.
- Existing fade mode E2E tests must continue to pass.

### Scenarios (Gherkin)

#### FOUC prevention

```gherkin
Scenario: Fade-mode deck does not animate on init
  Given a [data-lys] container with 3 slides, first has data-transition="fade"
  When the deck is initialized
  Then the first slide is immediately visible (opacity: 1)
  And the second and third slides are immediately hidden (opacity: 0)
  And no CSS opacity transition occurs during init

Scenario: Direct-mode deck does not animate on init
  Given a [data-lys] container with 3 slides, first has data-transition="direct"
  When the deck is initialized
  Then the first slide is immediately visible (opacity: 1)
  And the second and third slides are immediately hidden (opacity: 0)
```

#### Transitions enabled after init

```gherkin
Scenario: Fade transitions work after init
  Given an initialized fade-mode deck at slide 0
  And data-lys-ready is set on the container
  When navigation changes to slide 1
  Then the opacity transition animates (transition-property includes opacity)

Scenario: data-lys-ready is set after first animation frame
  Given a [data-lys] container with data-transition="fade"
  When the deck is initialized
  Then data-lys-ready is NOT present immediately after construction
  And data-lys-ready IS present after the next animation frame
```

#### Cleanup

```gherkin
Scenario: destroy() removes data-lys-ready
  Given an initialized fade-mode deck with data-lys-ready
  When destroy() is called
  Then the container does not have data-lys-ready
```

#### Progressive enhancement

```gherkin
Scenario: CSS-only deck is unaffected
  Given a [data-lys] container with data-transition="fade" on a slide
  And only lys.css is loaded (no JS)
  Then all slides are visible in scroll-snap layout
  And no slide has opacity: 0

Scenario: Scroll-snap mode is unaffected
  Given a [data-lys] container with no data-transition attributes
  When the deck is initialized
  Then data-lys-ready is set after the first frame
  And slides use scroll-snap layout (no stacked layout)
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| FOUC prevention | `tests/unit/transitions.test.ts` + `tests/e2e/transitions.spec.ts` |
| Transitions enabled after init | `tests/unit/transitions.test.ts` |
| Cleanup | `tests/unit/transitions.test.ts` |
| Progressive enhancement | `tests/e2e/transitions.spec.ts` |

Note: The "no CSS opacity transition occurs during init" assertion is best verified in E2E (real browser), since happy-dom does not compute transitions. Unit tests can verify the `data-lys-ready` attribute lifecycle.

## Related / Future

- **Issue #23 — focus ring bug.** Already fixed. Unrelated but was a similar init-time visual issue.
- **View Transitions API.** A future enhancement could use the browser's native view transition API to avoid layout shifts entirely. Deferred to post-1.0.
