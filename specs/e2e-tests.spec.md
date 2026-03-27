# End-to-End Test Coverage

## Blueprint (Design)

### Context

Lys has comprehensive unit tests (Vitest + happy-dom) but incomplete end-to-end coverage. Unit tests verify JS logic in an emulated DOM; e2e tests verify the full stack — CSS layout, computed styles, real keyboard events, browser scroll behavior, print media emulation, and accessibility audits — in real browsers (Chromium, Firefox, WebKit via Playwright).

The existing specs (`lys-core`, `navigation`, `a11y`, `transitions`) each define which Gherkin scenarios belong in e2e tests via their Test/Spec Alignment tables. This spec consolidates those e2e requirements into a single test plan.

### Architecture

#### Test files and their spec sources

| E2E test file | Spec source(s) | Status |
|---|---|---|
| `tests/e2e/a11y.spec.ts` | `specs/a11y.spec.md` | Exists — needs fixes + axe-core |
| `tests/e2e/transitions.spec.ts` | `specs/transitions.spec.md` | Exists — complete |
| `tests/e2e/slides.spec.ts` | `specs/lys-core.spec.md` + `specs/navigation.spec.md` | **Missing** |
| `tests/e2e/navigation.spec.ts` | `specs/navigation.spec.md` | **Missing** |
| `tests/e2e/print.spec.ts` | `specs/lys-core.spec.md` + `specs/transitions.spec.md` | **Missing** |

Note: The existing specs originally mapped navigation e2e scenarios to `slides.spec.ts`. This spec splits them into `navigation.spec.ts` for clarity, since navigation has 17 e2e scenarios that would dominate a combined file. The alignment tables in `navigation.spec.md` and `lys-core.spec.md` have been updated to reflect this split.

#### Fixtures

| Fixture | Purpose | Status |
|---|---|---|
| `tests/fixtures/minimal.html` | 3-slide scroll-snap deck | Exists |
| `tests/fixtures/fade.html` | 3-slide fade-mode deck | Exists |
| `tests/fixtures/navigation.html` | 5-slide deck with ids, input, textarea for nav testing | **New** |
| `tests/fixtures/multi-deck.html` | 2 decks on one page for independent navigation | **New** |
| `tests/fixtures/data-attrs.html` | Deck with data-background, data-class, data-notes | **New** |

#### Dependencies

- `@axe-core/playwright` — dev dependency for automated accessibility scanning. This is the only new dev dependency required.

#### Module boundaries

E2e tests do not touch source code. They test against `dist/` output served by Vite dev server. Changes are limited to:

- `tests/e2e/*.spec.ts` — test files
- `tests/fixtures/*.html` — fixture files
- `package.json` — add `@axe-core/playwright` dev dependency

### Anti-Patterns

- **Testing JS logic in e2e.** If a scenario can be fully verified in happy-dom (event dispatch, state mutation, attribute checks), it belongs in unit tests. E2e tests are for behaviors that require a real browser: computed CSS, real keyboard focus, scroll position, media queries, print layout.
- **Flaky transition timing assertions.** Never assert exact opacity mid-transition. Either disable transitions (set `--lys-transition-duration: 0ms`) or wait for transitions to settle before asserting. Use `toPass({ timeout })` for values that need to stabilize.
- **Using `page.setJavaScriptEnabled()`.** This is not available on all browsers. Use `browser.newContext({ javaScriptEnabled: false })` instead to test CSS-only progressive enhancement.
- **Asserting browser-specific values.** Computed style string formats vary across engines. Prefer semantic assertions (e.g., check that position is not "absolute") over exact string matching where possible.
- **Large fixture files.** Fixtures should be minimal — just enough markup to test the scenario. Reuse `minimal.html` and `fade.html` where possible.
- **Testing navigation module internals.** E2e navigation tests verify that pressing a key results in a slide change, not that a specific internal method was called. No spying in e2e.

## Contract (Quality)

### Definition of Done

1. `tests/e2e/slides.spec.ts` exists and covers: CSS-only scroll-snap layout, data-background rendering, data-class application, auto-init behavior, reduced motion token resolution.
2. `tests/e2e/navigation.spec.ts` exists and covers: keyboard navigation (all keys), hash routing (load + runtime), multiple independent decks, Space suppression in form elements.
3. `tests/e2e/print.spec.ts` exists and covers: scroll-snap print layout, fade-mode print layout.
4. `tests/e2e/a11y.spec.ts` passes across all 3 browsers (fix pre-existing failures in `setJavaScriptEnabled` and custom focus ring tests).
5. `tests/e2e/a11y.spec.ts` includes an axe-core automated scan on an initialized deck with 0 critical/serious violations.
6. All fixture files exist and are minimal, self-contained HTML.
7. `pnpm test:e2e` passes with 0 failures across Chromium, Firefox, WebKit.
8. `@axe-core/playwright` is added as a dev dependency.
9. No e2e test relies on exact transition timing — either transitions are disabled or values are polled to stability.

### Regression Guardrails

- Existing unit tests (`pnpm test`) must continue to pass — e2e work must not modify source code.
- Existing e2e tests in `transitions.spec.ts` must continue to pass.
- `tests/fixtures/minimal.html` and `tests/fixtures/fade.html` must not be modified (other tests depend on them).
- No runtime dependencies added. `@axe-core/playwright` is a dev dependency only.
- Size budget unaffected — no source changes.

### Scenarios (Gherkin)

#### slides.spec.ts — CSS-only layout

These scenarios come from `lys-core.spec.md` CSS-only layout and data attribute groups.

```gherkin
Scenario: Minimal deck renders as scroll-snap slides
  Given the minimal.html fixture loaded in a browser
  When the page is fully loaded
  Then the container has scroll-snap-type: y mandatory
  And each article has scroll-snap-align: start
  And each article fills the viewport height

Scenario: Single-slide deck renders without error
  Given inline HTML via page.setContent with 1 article in a [data-lys] container
  When the page is loaded with lys.css and lys.js
  Then no console errors are thrown
  And the article is visible

Scenario: Empty container renders without error
  Given inline HTML via page.setContent with 0 articles in a [data-lys] container
  When the page is loaded with lys.css and lys.js
  Then no console errors are thrown

Scenario: Auto-init discovers containers on DOMContentLoaded
  Given the minimal.html fixture
  When the page is loaded
  Then the container has role="group" (set by JS a11y module)
  And the first slide has data-lys-active

Scenario: data-background applies as CSS background
  Given a fixture with data-background="#1a1a2e" on an article
  When the page is loaded
  Then that article's computed background-color is #1a1a2e

Scenario: data-class classes are applied
  Given a fixture with data-class="title-slide dark" on an article
  When the page is loaded
  Then that article has class "title-slide"
  And that article has class "dark"

Scenario: Reduced motion disables transitions
  Given prefers-reduced-motion: reduce is emulated
  When the minimal.html fixture is loaded
  Then the computed transition-duration on articles is 0s
```

#### navigation.spec.ts — Keyboard navigation

These scenarios come from `navigation.spec.md` keyboard, touch, and hash groups.

```gherkin
Scenario: ArrowRight advances to next slide
  Given the navigation fixture at slide 0
  When the user presses ArrowRight
  Then the second slide has data-lys-active

Scenario: ArrowLeft goes to previous slide
  Given the navigation fixture at slide 2
  When the user presses ArrowLeft
  Then the second slide has data-lys-active

Scenario: Home jumps to first slide
  Given the navigation fixture at slide 3
  When the user presses Home
  Then the first slide has data-lys-active

Scenario: End jumps to last slide
  Given the navigation fixture at slide 0
  When the user presses End
  Then the last slide has data-lys-active

Scenario: Space advances to next slide
  Given the navigation fixture at slide 0
  When the user presses Space
  Then the second slide has data-lys-active

Scenario: Shift+Space goes to previous slide
  Given the navigation fixture at slide 2
  When the user presses Shift+Space
  Then the second slide has data-lys-active

Scenario: Space does not navigate when input is focused
  Given the navigation fixture with a focused input element
  When the user presses Space
  Then the current slide does not change

Scenario: Arrow keys still navigate when input is focused
  Given the navigation fixture with a focused input element
  When the user presses ArrowRight
  Then the next slide has data-lys-active
```

#### navigation.spec.ts — Hash routing

```gherkin
Scenario: Hash deep link on page load (numeric)
  Given the navigation fixture URL includes #slide=3
  When the page is loaded
  Then the third slide has data-lys-active

Scenario: Hash deep link on page load (id)
  Given the navigation fixture URL includes #slide=overview
  And the second slide has id="overview"
  When the page is loaded
  Then the second slide has data-lys-active

Scenario: Hash updates on navigation
  Given the navigation fixture at slide 0
  When the user presses ArrowRight
  Then the URL hash contains "slide=2"

Scenario: Hash updates use article id when available
  Given the navigation fixture with id="overview" on slide 1
  When the user navigates to slide 1
  Then the URL hash contains "slide=overview"

Scenario: External hashchange triggers navigation
  Given the navigation fixture at slide 0
  When the URL hash is changed to #slide=4 via page.evaluate
  Then the fourth slide has data-lys-active

Scenario: Invalid hash is ignored
  Given the navigation fixture URL includes #something-else
  When the page is loaded
  Then the first slide has data-lys-active

Scenario: Hash with out-of-range number is clamped
  Given the navigation fixture URL includes #slide=99
  When the page is loaded
  Then the last slide has data-lys-active
```

#### navigation.spec.ts — Multiple decks

```gherkin
Scenario: Two decks navigate independently
  Given the multi-deck fixture with two [data-lys] containers
  When ArrowRight is pressed while deck A is focused
  Then deck A advances to slide 1
  And deck B remains at slide 0

Scenario: Hash routing targets the correct deck
  Given the multi-deck fixture
  And deck B has an article with id="target"
  When the URL hash is set to #slide=target
  Then deck B navigates to that slide
  And deck A does not change
```

#### print.spec.ts — Print layout

These scenarios come from `lys-core.spec.md` print layout and `transitions.spec.md` fade print groups. The fade-mode print test currently lives in `transitions.spec.ts`; `print.spec.ts` consolidates all print scenarios into one file. The existing test in `transitions.spec.ts` should be removed once `print.spec.ts` covers it, to avoid duplication.

```gherkin
Scenario: Scroll-snap print layout shows all slides
  Given the minimal.html fixture
  When print media is emulated
  Then all articles are visible
  And all articles have position: static or relative (not absolute)
  And each article (except last) has page-break-after

Scenario: Fade-mode print layout shows all slides
  Given the fade.html fixture
  When print media is emulated
  Then all articles have opacity 1
  And all articles have position: static
  And each article (except last) has page-break-after
```

#### a11y.spec.ts — Fixes and axe-core

```gherkin
Scenario: CSS-only deck has valid article semantics (fix)
  Given a browser context with javaScriptEnabled: false
  When the minimal.html fixture is loaded
  Then all articles are present
  And no article has role="group" (JS not loaded)

Scenario: Initialized deck has zero axe-core violations
  Given the minimal.html fixture loaded with JS
  When the deck is initialized
  Then an axe-core scan reports 0 critical violations
  And an axe-core scan reports 0 serious violations

Scenario: Fade-mode deck has zero axe-core violations
  Given the fade.html fixture loaded with JS
  When the deck is initialized
  Then an axe-core scan reports 0 critical violations
  And an axe-core scan reports 0 serious violations
```

## Test / Spec Alignment

| E2E test file | Scenarios | Source specs |
|---|---|---|
| `tests/e2e/slides.spec.ts` | CSS-only layout (3), auto-init (1), data attributes (2), reduced motion (1) | `lys-core.spec.md` |
| `tests/e2e/navigation.spec.ts` | Keyboard (8), hash routing (7), multiple decks (2) | `navigation.spec.md` |
| `tests/e2e/print.spec.ts` | Scroll-snap print (1), fade print (1) | `lys-core.spec.md`, `transitions.spec.md` |
| `tests/e2e/a11y.spec.ts` | Fix existing (1), axe-core scan (2) | `a11y.spec.md` |
| `tests/e2e/transitions.spec.ts` | *(already complete — no changes)* | `transitions.spec.md` |

**Total new e2e scenarios:** 28 (across 4 files, one existing)

## Related / Future

- **Touch e2e tests.** Playwright's touch simulation (`page.touchscreen`) has limited cross-browser support. Touch navigation scenarios are adequately covered by unit tests. Can be added when Playwright touch support matures.
- **axe-core rule configuration.** The initial scan should use default rules. If specific rules produce false positives on the `[data-lys]` pattern, they can be selectively disabled with documented rationale.
- **Visual regression tests.** Screenshot comparison for slide layout could be added post-1.0 using Playwright's `toHaveScreenshot()`. Not in scope for this issue.
- **Performance tests.** Lighthouse or Web Vitals measurement for "time to first slide" (< 50ms target from VISION.md). Deferred.
