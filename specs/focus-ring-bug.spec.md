# Focus Ring Bug — Extra Borders During Slide Navigation

## Blueprint (Design)

### Context

Lys slides fill the entire viewport. Only one slide is ever visible at a time. When the a11y module moves focus to the active slide, the browser's `:focus-visible` rule displays a `2px solid currentColor` outline around it. This outline is entirely redundant — there is nothing else on screen to distinguish the focused element from. The slide *is* the viewport.

Focus management must remain for screen reader support (`tabindex="-1"`, `focus({ preventScroll: true })`), but the visible focus ring on slides serves no purpose and creates a distracting border on every navigation.

### Architecture

#### Fix: remove focus ring CSS rules for slides

Remove the two focus ring rules from `src/lys.css`:

```css
/* REMOVE */
[data-lys] > article:focus-visible {
  outline: var(--_lys-focus-ring);
  outline-offset: -2px;
}

[data-lys] > article:focus:not(:focus-visible) {
  outline: none;
}
```

Replace with a single rule that suppresses the outline on all slide focus states:

```css
[data-lys] > article:focus {
  outline: none;
}
```

The `--lys-focus-ring` token remains defined (it is part of the public token API) but is no longer applied to slides by default. Authors who want a focus ring can still use it in their own CSS.

#### Module boundaries

- **`src/lys.css`** — Replace the two focus ring rules with `outline: none` on `:focus`.
- **`src/a11y.ts`** — No changes. Focus management (`tabindex`, `focus()`) is unchanged.
- **`src/lys.ts`** — No changes.
- **`src/navigation.ts`** — No changes.

### Anti-Patterns

- **Removing focus management.** The `tabindex="-1"` and `focus()` calls must stay — screen readers need programmatic focus to announce the active slide.
- **Removing the `--lys-focus-ring` token.** The token is public API. Keep it defined; just stop applying it to slides by default.
- **Adding JS-based focus suppression.** No `data-lys-focusing` attribute, no `requestAnimationFrame` timing hacks. A single CSS rule is sufficient.

## Contract (Quality)

### Definition of Done

1. No visible outline appears on slides during arrow key navigation.
2. No visible outline appears on slides during Tab focus.
3. No visible outline appears on slides during mouse click.
4. Focus management still works — screen readers announce the active slide on navigation.
5. `tabindex="-1"` is still set on slides.
6. `focus({ preventScroll: true })` is still called on slide change.
7. The `--lys-focus-ring` token is still defined in the token block.
8. No WCAG 2.1 AA regressions — axe-core scans still pass (slides are not actionable controls that require visible focus indicators; they are content regions that receive focus for AT purposes).
9. The fix works in all three transition modes (scroll-snap, fade, direct).

### Regression Guardrails

- The `--lys-focus-ring` token definition must remain in the CSS token block.
- The a11y module must still call `focus({ preventScroll: true })` on slide change.
- Slides must still have `tabindex="-1"`.
- Existing a11y tests for focus movement and ARIA attributes must continue to pass.

### Scenarios (Gherkin)

#### Focus ring removal

```gherkin
Scenario: No outline on arrow key navigation
  Given an initialized deck at slide 0
  When the user presses ArrowRight
  Then the deck navigates to slide 1
  And the second slide has focus
  And the second slide has no visible outline

Scenario: No outline on Tab focus
  Given an initialized deck
  When the user presses Tab to focus a slide
  Then the focused slide has no visible outline

Scenario: No outline on mouse click
  Given an initialized deck
  When the user clicks on a slide
  Then the slide has no visible outline
```

#### Focus management preserved

```gherkin
Scenario: Focus still moves to active slide on navigation
  Given an initialized deck at slide 0
  When navigation changes to slide 1
  Then the second slide has focus

Scenario: focus() is called with preventScroll
  Given an initialized deck
  When navigation changes to slide 1
  Then focus() is called with { preventScroll: true }
```

#### Cross-mode behavior

```gherkin
Scenario: No outline in fade mode
  Given a fade-mode deck at slide 0
  When the user presses ArrowRight
  Then the second slide has no visible outline

Scenario: No outline in direct mode
  Given a direct-mode deck at slide 0
  When the user presses ArrowRight
  Then the second slide has no visible outline
```

#### Regression

```gherkin
Scenario: axe-core scan passes after fix
  Given an initialized deck
  When an axe-core accessibility scan is run
  Then there are zero critical or serious violations
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Focus ring removal | `tests/e2e/a11y.spec.ts` |
| Focus management preserved | `tests/unit/a11y.test.ts` (existing tests) |
| Cross-mode behavior | `tests/e2e/a11y.spec.ts` |
| Regression | `tests/e2e/a11y.spec.ts` |
