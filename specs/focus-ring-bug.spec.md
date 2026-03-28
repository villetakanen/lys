# Focus Ring Bug — Extra Borders During Slide Navigation

## Blueprint (Design)

### Context

When navigating between slides with arrow keys, the a11y module moves focus to the newly active slide via `slide.focus({ preventScroll: true })`. Because the last user interaction was a keyboard event (arrow key), the browser's `:focus-visible` heuristic activates, showing the focus ring outline on every slide transition. This appears as "extra borders" — a visible outline flashing on each slide change.

The focus ring exists for WCAG 2.1 AA compliance: users who Tab into a slide need a visible indicator of where focus is. But during slide-to-slide navigation, the slide transition itself is the visual feedback — the ring adds noise.

**Desired behavior:**
- **Tab into a slide** → focus ring shown (user needs orientation)
- **Arrow key / touch / API navigation** → no focus ring (slide change is the indicator)
- **Mouse click** → no focus ring (already handled by `:focus:not(:focus-visible)`)

### Architecture

#### Root cause

The a11y module (`src/a11y.ts`) calls `slide.focus({ preventScroll: true })` in its `lys:slidechange` handler. The browser considers this "keyboard-initiated" focus because the triggering event was a keydown, so `:focus-visible` activates. This is correct browser behavior — the issue is that Lys should suppress the ring during programmatic navigation focus.

#### Fix: suppress outline during navigation-driven focus

The fix uses a CSS approach: during programmatic focus (navigation-driven), the container gets a transient `data-lys-focusing` attribute that suppresses the focus ring. The attribute is removed on the next animation frame, so Tab-driven focus (which doesn't go through the a11y handler) shows the ring normally.

**In `src/a11y.ts`** — Before calling `slide.focus()`, set `data-lys-focusing` on the container. Remove it on the next animation frame:

```
container.setAttribute("data-lys-focusing", "");
slide.focus({ preventScroll: true });
requestAnimationFrame(() => container.removeAttribute("data-lys-focusing"));
```

**In `src/lys.css`** — Suppress the focus ring while the attribute is present:

```css
[data-lys][data-lys-focusing] > article:focus-visible {
  outline: none;
}
```

This approach:
- Is purely CSS-driven once the attribute is set — no inline styles.
- The attribute is transient (removed next frame) so Tab focus immediately after navigation still shows the ring.
- Does not affect the existing `:focus:not(:focus-visible)` rule for mouse clicks.
- Does not modify the `--lys-focus-ring` token or its default value.
- Progressive enhancement is preserved: without JS, there is no `data-lys-focusing`, so the ring shows normally on `:focus-visible`.

**New API surface — `data-lys-focusing` state attribute:**
This is a transient internal state attribute (like `data-lys-active`, `data-lys-current`, `data-lys-mode`), not author-facing. It is set and removed by the a11y module within a single frame. Authors should not set it manually.

#### Module boundaries

- **`src/a11y.ts`** — Set/remove `data-lys-focusing` around the `focus()` call in the `lys:slidechange` handler. Remove the attribute in `destroy()` cleanup.
- **`src/lys.css`** — Add suppression rule for `[data-lys][data-lys-focusing] > article:focus-visible`.
- **`src/lys.ts`** — No changes.
- **`src/navigation.ts`** — No changes.

#### Interaction with existing modules

- **transitions** — No interaction. The focus ring suppression is independent of transition mode (scroll-snap, fade, direct).
- **navigation** — Navigation triggers `lys:slidechange`, which triggers the a11y focus handler. The suppression is contained to the a11y module.

### Anti-Patterns

- **Removing the focus ring entirely.** The ring is required for WCAG 2.1 AA. Tab-into-slide must show it.
- **Using `outline: none` on all focus states.** This breaks keyboard accessibility.
- **Using inline styles to suppress the ring.** The CSS attribute selector approach is cleaner and doesn't require cleanup.
- **Delaying focus to avoid `:focus-visible`.** This would create a race condition and break screen reader announcements.
- **Using `setTimeout` instead of `requestAnimationFrame`.** `rAF` is the correct timing primitive — it fires after the browser has processed focus but before the next paint.
- **Leaving `data-lys-focusing` on the container permanently.** The attribute must be removed on the next frame. Forgetting to remove it would permanently suppress the focus ring.

## Contract (Quality)

### Definition of Done

1. Arrow key navigation between slides does NOT show a focus ring on the target slide.
2. Tab into a slide DOES show a focus ring.
3. Mouse click on a slide does NOT show a focus ring (existing behavior, regression check).
4. The `--lys-focus-ring` token still works for customizing the ring appearance.
5. `data-lys-focusing` is set on the container during programmatic focus and removed on the next animation frame.
6. `destroy()` removes `data-lys-focusing` if present.
7. The fix works in all three transition modes (scroll-snap, fade, direct).
8. No WCAG 2.1 AA regressions — axe-core scans still pass.

### Regression Guardrails

- The `:focus-visible` rule must remain in the CSS — it is only suppressed during navigation, not removed.
- The `--lys-focus-ring` token default and two-tier resolution must not change.
- The a11y module must still call `focus({ preventScroll: true })` — focus management is essential for screen readers.
- The `outline-offset: -2px` must be preserved.
- Existing a11y tests for focus movement must continue to pass.

### Scenarios (Gherkin)

#### Focus ring suppression during navigation

```gherkin
Scenario: Arrow key navigation does not show focus ring
  Given an initialized deck at slide 0
  When the user presses ArrowRight
  Then the deck navigates to slide 1
  And the second slide has focus
  And the second slide does NOT display a focus ring outline

Scenario: Tab into slide shows focus ring
  Given an initialized deck
  When the user presses Tab to focus a slide
  Then the focused slide displays the focus ring matching --lys-focus-ring

Scenario: Mouse click does not show focus ring
  Given an initialized deck
  When the user clicks on a slide
  Then the slide does NOT display a focus ring outline
```

#### Transient attribute lifecycle

```gherkin
Scenario: data-lys-focusing is set during programmatic focus
  Given an initialized deck at slide 0
  When navigation changes to slide 1
  Then data-lys-focusing is set on the container before focus() is called
  And data-lys-focusing is removed on the next animation frame

Scenario: data-lys-focusing is removed on destroy
  Given an initialized deck with data-lys-focusing present
  When destroy() is called
  Then the container does not have data-lys-focusing
```

#### Cross-mode behavior

```gherkin
Scenario: Focus ring suppression works in fade mode
  Given a fade-mode deck at slide 0
  When the user presses ArrowRight
  Then the second slide has focus
  And the second slide does NOT display a focus ring outline

Scenario: Focus ring suppression works in direct mode
  Given a direct-mode deck at slide 0
  When the user presses ArrowRight
  Then the second slide has focus
  And the second slide does NOT display a focus ring outline
```

#### Regression

```gherkin
Scenario: Custom focus ring token still works
  Given --lys-focus-ring is set to "3px dashed red"
  When a slide receives Tab focus
  Then the focus ring is 3px dashed red

Scenario: axe-core scan passes after fix
  Given an initialized deck
  When an axe-core accessibility scan is run
  Then there are zero critical or serious violations
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Focus ring suppression during navigation | `tests/e2e/a11y.spec.ts` |
| Transient attribute lifecycle | `tests/unit/a11y.test.ts` |
| Cross-mode behavior | `tests/e2e/a11y.spec.ts` |
| Regression | `tests/e2e/a11y.spec.ts` |

Note: Focus ring visual tests require a real browser (`:focus-visible` is not reliable in happy-dom). Unit tests can verify the `data-lys-focusing` attribute lifecycle but not the visual outcome.

## Related / Future

- **Issue #22 — FOUC on fade transition.** Unrelated bug but similar timing concerns (init-time visual flash vs. navigation-time visual flash).
- **a11y.spec.md** — The existing a11y spec's focus ring scenarios (lines 316–331) describe the desired `:focus-visible` behavior. This spec fixes the gap where programmatic navigation focus was not accounted for.
