# Stacked Mode Navigation Bug

## Blueprint (Design)

### Context

Issue #35: Arrow key navigation does not work on `examples/full.html`. The example has one slide with `data-transition="fade"` and the rest without. This triggers stacked layout mode (`data-lys-mode="stacked"`), where all slides become `position: absolute; opacity: 0` and only the active slide gets `opacity: 1`.

Investigation reveals two problems:

1. **E2e test fixture mismatch.** The per-slide transitions refactor (commit `0bf82e4`) changed `data-lys-mode` from `"fade"`/`"direct"` to `"stacked"`, but the e2e test helpers (`setupFadeDeck`, `setupDirectDeck`) still wait for `data-lys-mode === "fade"` / `"direct"`, causing all stacked-mode tests to time out. This is why 42+ e2e tests have been failing since beta.3.

2. **Navigation may not work in mixed-transition decks.** When only some slides have `data-transition="fade"` and others have none, the deck enters stacked mode. All slides get `opacity: 0` with `transition-duration: 0ms` (line 108 in lys.css: `article:not([data-transition="fade"])` gets instant transitions). The active slide gets `opacity: 1`. This should work, but needs verification — the bug report says it doesn't.

### Architecture

#### Root cause: e2e test mode value mismatch

In `tests/e2e/transitions.spec.ts`, the setup helpers wait for a `data-lys-mode` value that no longer exists:

```ts
// Current (broken) — waits forever
return container?.getAttribute("data-lys-mode") === "fade";

// Fixed — matches the actual JS behavior
return container?.getAttribute("data-lys-mode") === "stacked";
```

The same applies to the direct mode helper.

#### Files involved

- `tests/e2e/transitions.spec.ts` — Fix `setupFadeDeck` and `setupDirectDeck` helpers to wait for `data-lys-mode="stacked"`.
- `tests/fixtures/fade.html` — Verify it still triggers stacked mode.
- `tests/fixtures/direct.html` — Verify it still triggers stacked mode.
- `src/lys.ts` — Lines 76-82, the mode detection logic. No change expected unless the navigation bug is in the JS.
- `src/lys.css` — Lines 83-114, stacked layout rules. No change expected.
- `examples/full.html` — The user-reported example. Verify navigation works after fixes.

#### Module boundaries

- **`src/lys.ts`** — Mode detection and `goTo()` method.
- **`src/lys.css`** — Stacked layout, opacity transitions, active slide visibility.
- **`src/navigation.ts`** — Keyboard event handling, calls `goTo()`.

### Anti-Patterns

- **Reverting to per-mode attribute values (`"fade"`, `"direct"`).** The refactor to `"stacked"` was intentional — per-slide transitions use `data-transition` on individual articles, not a deck-wide mode. The mode is just "stacked" (vs scroll-snap).
- **Adding mode-specific CSS selectors.** `[data-lys-mode="fade"]` and `[data-lys-mode="direct"]` should not exist in CSS. The per-slide `data-transition` attribute on each `<article>` controls individual slide behavior.
- **Fixing tests without verifying the actual navigation bug.** The e2e timeout is a test bug, but #35 reports a real user-facing issue. Both must be addressed.

## Contract (Quality)

### Definition of Done

1. `setupFadeDeck` and `setupDirectDeck` in `tests/e2e/transitions.spec.ts` wait for `data-lys-mode="stacked"` (not `"fade"` or `"direct"`).
2. All previously-timing-out fade/direct e2e tests pass.
3. Arrow key navigation works on `examples/full.html` in the dev server.
4. Arrow key navigation works on a deck with mixed `data-transition` values (some fade, some none).
5. The active slide is visible and non-active slides are hidden in stacked mode.
6. No regressions in unit tests or passing e2e tests.

### Regression Guardrails

- Scroll-snap navigation (decks without `data-transition`) must still work.
- `data-lys-mode="stacked"` must be set when any slide has `data-transition="fade"` or `"direct"`.
- `data-lys-active` must toggle correctly on `goTo()`.
- `lys:slidechange` event must fire with correct `from`/`to`/`slide` detail.
- Print layout must still show all slides.
- `prefers-reduced-motion` must still disable transitions.

### Scenarios (Gherkin)

#### Stacked mode initialization

```gherkin
Scenario: Deck with data-transition="fade" enters stacked mode
  Given a [data-lys] container where one article has data-transition="fade"
  When Lys initializes
  Then the container has data-lys-mode="stacked"
  And the first article has data-lys-active

Scenario: Deck with data-transition="direct" enters stacked mode
  Given a [data-lys] container where one article has data-transition="direct"
  When Lys initializes
  Then the container has data-lys-mode="stacked"
```

#### Navigation in stacked mode

```gherkin
Scenario: ArrowRight advances slide in stacked mode
  Given a stacked-mode deck on slide 1 of 3
  When the user presses ArrowRight
  Then slide 2 becomes active (data-lys-active)
  And slide 1 is no longer active
  And slide 2 is visible (opacity: 1)
  And slide 1 is hidden (opacity: 0)

Scenario: ArrowLeft goes back in stacked mode
  Given a stacked-mode deck on slide 2 of 3
  When the user presses ArrowLeft
  Then slide 1 becomes active

Scenario: Mixed transitions — fade slide transitions smoothly, others switch instantly
  Given a deck where slide 1 has data-transition="fade" and slides 2-3 have none
  When navigating from slide 1 to slide 2
  Then slide 1 fades out (has transition-property: opacity)
  And slide 2 appears instantly (transition-duration: 0ms)
```

#### Visibility

```gherkin
Scenario: Only active slide is visible in stacked mode
  Given a stacked-mode deck with 3 articles
  Then the active article has opacity: 1 and pointer-events: auto
  And inactive articles have opacity: 0 and pointer-events: none
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Stacked mode initialization | `tests/e2e/transitions.spec.ts` (existing tests, fix setup helpers) |
| Navigation in stacked mode | `tests/e2e/transitions.spec.ts` + `tests/e2e/navigation.spec.ts` |
| Visibility | `tests/e2e/transitions.spec.ts` (existing tests) |

The primary fix is in the test setup helpers. Once `setupFadeDeck`/`setupDirectDeck` wait for `"stacked"`, the existing test scenarios should pass.

## Related / Future

- **#34 — Focus ring on minimal example.** Separate visual bug.
- **#36 — Dark/light background for out-of-slide area.** Feature request, unrelated.
