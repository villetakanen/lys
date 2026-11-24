---
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-24T08:34:03+02:00"
---

# Lys 2.0 deck transitions

## Blueprint (Design)

### Context

The [2.0 roadmap](../../docs/reports/lys-2.0-release-plan.md) settles one transition style per deck: none, fade, horizontal, or vertical, defaulting to none. Reduced motion makes engine slide changes immediate. Transition style never changes navigation meaning, and in-slide animation stays author-owned. This spec defines how an author chooses the style, how each style moves the frame, how timing is configured, and how motion responds to input. It completes the transition part of roadmap task 3 on top of the [surface geometry spec](../surface-geometry/spec.md).

In 1.x, any article with `data-transition="fade"` or `"direct"` switched the whole deck into stacked rendering, and decks without one used a native scroll-snap row. That made one slide's attribute change the whole deck's behaviour, and left two rendering models with different selection and wheel behaviour.

Owner decisions, 24 November 2026: the style is set with `data-transition` on the deck; the 1.x timing tokens are kept at deck scope; rapid input retargets immediately; all enhanced decks use stacked rendering, including none.

### Architecture

#### Configuration

> **New API surface.** `data-transition` moves from articles to the `[data-lys]` deck element, and gains the values `none`, `horizontal`, and `vertical`. The owner approved this on 24 November 2026.

| Deck `data-transition` | Style |
| --- | --- |
| `none` | Immediate change (default) |
| `fade` | Outgoing frame fades out while the incoming frame fades in |
| `horizontal` | Frames move along the horizontal axis |
| `vertical` | Frames move along the vertical axis |

- Values match ASCII case-insensitively, like HTML enumerated attributes. A missing, empty, or unrecognised value uses `none`. Lys does not rewrite or repair the attribute.
- 1.x `direct` is not an alias. It is unrecognised, so it resolves to `none`, which is what `direct` did.
- `data-transition` on articles has no effect in 2.0. Lys leaves it in the markup.
- A style change on the deck applies to later slide changes. The deck's slide membership and order stay fixed at initialisation.

| Timing token | Default | Contract |
| --- | --- | --- |
| `--lys-transition-duration` | `300ms` | Resolved on the deck, including through inheritance. Applies to fade, horizontal, and vertical. Slide-local declarations have no effect. |
| `--lys-transition-easing` | `ease-in-out` | Same scope and resolution as duration. |

Invalid timing values follow normal CSS rules; Lys does not repair them. `none` ignores both tokens. Reduced motion overrides both.

#### Rendering

With JavaScript, every deck uses stacked rendering. All slides share the settled frame from the surface spec, and only the selected slide is painted and receives pointer input. Inactive slides are not painted. Whether they are exposed to assistive technology belongs to the accessibility contract, which task 1a gates. Until that contract changes, keep the 1.x exposure. The scroll-snap row and its `scrollIntoView` selection path are removed.

#### Motion

- **Direction.** Direction comes from document order: moving to a later slide is forward, moving to an earlier one is backward. This holds for next/previous, Home/End, links, and Back/Forward alike.

  | Style | Forward | Backward |
  | --- | --- | --- |
  | `horizontal` | Incoming enters from the right; outgoing leaves to the left | Incoming enters from the left; outgoing leaves to the right |
  | `vertical` | Incoming enters from the bottom; outgoing leaves to the top | Incoming enters from the top; outgoing leaves to the bottom |

  Directions are physical so that they match the agreed input contract: a left swipe and a downward wheel both advance.
- **Jumps.** A change across several slides is one transition between the current and the target slide. Intermediate slides are not painted.
- **Confinement.** Motion stays inside the settled frame rectangle. Moving or fading frames never paint onto the backdrop. Frame dimensions, and therefore container query units, are the same during motion as when settled.
- **Engine scope.** Engine motion applies only to article frames. Lys never sets transitions, animations, or transforms on descendants, and author animation inside slides is unaffected by the style, the tokens, or reduced motion.
- **Selection timing.** Selection changes when navigation is requested, not when motion ends. The current index, selected-slide state, URL fragment handling, and any slide-change notification all update at the start. Motion is only a visual effect.
- **Rapid input.** A navigation request during a running transition retargets it immediately. Nothing is queued and nothing is locked. At most two frames are painted at any moment: the newest incoming frame and the frame it replaces. When motion stops, only the selected frame is painted.
- **Endpoints.** Next on the last slide and previous on the first change nothing and start no motion.
- **Initial state.** Initialisation, including a load that addresses a slide by fragment, selects the slide without motion. The existing first-paint guard stays in place.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, every style changes slides immediately. A change of preference takes effect without a reload.
- **Resize.** Resizing during motion recomputes the frame as the surface spec describes and does not change selection.

#### Modules and integration

| Module | Change |
| --- | --- |
| `src/lys.ts` | Read the deck style and remove per-article mode detection. Always render stacked. Record motion direction and the outgoing frame as engine state. Remove the scroll-snap selection path. |
| `src/lys.css` | Key stacking, fade, and axis motion off enhanced state, so nothing stacks without JavaScript. Remove the scroll-snap row and the per-article fade rule. Apply timing at deck scope and skip motion under reduced motion. Keep everything screen-only. |
| `src/navigation.ts` | No change to the key mapping. Commands keep calling the core selection path, which owns motion. |
| `src/nav.ts` | The legacy scroll-driven active state has no scroll row to observe. The removal or migration of `data-lys-nav` stays a separate, explicit decision. |
| `src/a11y.ts` | No change in this spec; it is gated by task 1a. |

Engine state attributes such as `data-lys-active`, `data-lys-current`, and `data-lys-ready`, and any new markers for direction or the outgoing frame, are internal. They are not documented author API; the lifecycle/API spec owns that decision. `data-lys-mode` has no purpose once every deck is stacked.

#### 1.x migration

| 1.x | 2.0 |
| --- | --- |
| `data-transition="fade"` on one or more articles | `data-transition="fade"` on the deck |
| `data-transition="direct"` on articles | Remove it; the default `none` behaves the same |
| A mix of per-article styles | Choose one deck style |
| Default scroll-snap row | Stacked rendering with `none` |
| `--lys-transition-duration`, `--lys-transition-easing` | Kept; declare them on the deck |

### Anti-Patterns

- Per-slide styles, overrides, or timing; any reading of article `data-transition`.
- Setting transitions, animations, transforms, or `will-change` on descendants, or suspending author animation during engine motion.
- Measuring or inspecting slide content to drive motion, or animating with JavaScript frame loops that read layout.
- Delaying selection, URL updates, or notifications until motion ends; input locks, debounce queues, or dropped input during motion.
- Painting moving frames onto the backdrop, or resizing frames during motion.
- Letting the duration or easing tokens override reduced motion.
- Stacking or hiding slides before enhancement, which would hide authored payload without JavaScript.
- Moving focus, adding announcements, or changing roles because a transition ran.
- Applying stacked or motion styles to print.
- Keeping a scroll-based rendering mode for `none`, or adding aliases such as `slide` or `direct`.

## Contract (Quality)

### Definition of Done

- The scenarios below pass with production CSS and IIFE in Chromium, Firefox, and WebKit, under the verification requirements in [PROJECT.md](../../PROJECT.md).
- Style resolution, selection timing, retargeting, and endpoints have unit coverage.
- Motion direction, confinement, timing, and reduced motion are checked in a browser by sampling frame transforms, opacity, and paint bounds during motion.
- Every surface geometry scenario still passes under each style.
- The 1.x per-article transition fixtures and tests are replaced, not left asserting superseded behaviour.
- The migration table is carried into the 2.0 migration guidance under roadmap task 6.
- Artifact sizes stay within the PROJECT.md budgets, measured on a fresh build.

### Regression Guardrails

- Surface geometry holds under every style: fit, ratio cascade, clipping, and paint defaults.
- The agreed key mapping, endpoints without wrapping, and input ownership exclusions are unchanged by the style.
- Authored IDs, semantics, focusability, native control actions, and author animation are unchanged.
- Without JavaScript, every slide stays in normal flow in document order, whatever `data-transition` says.
- Print includes every slide, settled and unmoved, regardless of selection or motion.
- Engine code never reads slide content or layout to decide motion.

### Scenarios (Gherkin)

```gherkin
Scenario: Default immediate change
  Given an enhanced deck without data-transition
  When the reader moves to the next slide
  Then the next slide is selected and painted immediately
  And no other frame is painted
  And the deck is not a scroll container for slides

Scenario Outline: Style resolution
  Given a deck with data-transition "<value>"
  When Lys initialises
  Then the deck uses the "<style>" style
  And the attribute value is unchanged
  Examples:
    | value      | style      |
    | fade       | fade       |
    | Horizontal | horizontal |
    | vertical   | vertical   |
    |            | none       |
    | direct     | none       |
    | spin       | none       |

Scenario: Article data-transition is ignored
  Given a deck without data-transition whose second article has data-transition "fade"
  When the reader moves from slide 1 to slide 2
  Then the change is immediate
  And the article's attribute is unchanged

Scenario: Fade
  Given a deck with data-transition "fade" and motion allowed
  When the reader moves to the next slide
  Then selection and the URL update when the request is made
  And the outgoing frame fades out while the incoming frame fades in, using the deck's duration and easing
  And when the motion ends only the incoming frame is painted

Scenario Outline: Axis direction
  Given a deck with data-transition "<style>" and motion allowed
  When the reader moves <direction>
  Then the incoming frame enters from the <enters> and the outgoing frame leaves toward the <leaves>
  Examples:
    | style      | direction | enters | leaves |
    | horizontal | forward   | right  | left   |
    | horizontal | backward  | left   | right  |
    | vertical   | forward   | bottom | top    |
    | vertical   | backward  | top    | bottom |

Scenario: Jump to a distant slide
  Given a deck with an axis style on slide 1 of 6
  When the reader presses End
  Then one forward transition runs between slide 1 and slide 6
  And slides 2 to 5 are never painted

Scenario: Motion stays inside the frame
  Given a letterboxed deck with an axis or fade style
  When a transition runs
  Then nothing paints outside the settled frame rectangle
  And the frame dimensions and descendant container query units match the settled frame

Scenario: Timing tokens
  Given a deck with --lys-transition-duration and --lys-transition-easing declared on the deck
  And a conflicting duration declared on one article
  When a transition runs to or from that article
  Then it uses the deck's duration and easing
  When the deck style is none
  Then the tokens have no effect

Scenario: Rapid input retargets
  Given a deck with a motion style on slide 1 of 6
  When the reader presses next three times before the first transition ends
  Then slide 4 is selected after the third press
  And at most two frames are painted at any moment
  And no further motion runs after slide 4 settles

Scenario: Endpoints
  Given a deck with a motion style on its last slide
  When the reader presses next
  Then nothing changes and no motion starts

Scenario: Initial load without motion
  Given a deck with a motion style
  When the page loads, including with a fragment addressing slide 3
  Then the selected slide is painted without a transition

Scenario: Reduced motion
  Given a deck with any style and long duration tokens
  And reduced motion is requested
  When the reader moves to the next slide
  Then the change is immediate
  And authored animations inside the slides still run
  When the reduced-motion preference is withdrawn without a reload
  Then the next slide change uses the deck style

Scenario: Author animation preserved
  Given a slide whose descendants carry authored transitions and animations
  When transitions of every style run
  Then the descendants' authored transition, animation and transform styles are unchanged

Scenario: Accessibility of motion
  Given a deck with any style and focus on the deck
  When the reader navigates
  Then focus does not move because of the transition
  And no roles, labels or announcements are added by the transition
  And only the selected slide receives pointer input

Scenario: No-JavaScript access
  Given a deck with any data-transition value and JavaScript disabled
  When the document is read in document order
  Then every slide is in normal flow and none is stacked or hidden by transition styles

Scenario: Print during motion
  Given a deck with an axis style that is mid-transition
  When the page is printed
  Then every slide prints settled, untransformed and fully opaque, in document order
```

## Test / Spec Alignment

| Scenarios | Tests |
| --- | --- |
| Style resolution, article attribute ignored, selection timing, rapid input, endpoints, initial load | `tests/unit/transitions.test.ts`, `tests/unit/lys.test.ts` |
| Default change, fade, axis direction, jump, confinement, timing, reduced motion, author animation, pointer input | `tests/e2e/transitions.spec.ts` with a production-backed deck-level fixture replacing `tests/fixtures/fade.html` and `tests/fixtures/direct.html` |
| Surface geometry under each style | `tests/e2e/slides.spec.ts` with `tests/fixtures/surface.html` |
| Accessibility of motion | `tests/e2e/a11y.spec.ts`; speech and reading position remain task 1a evidence |
| No-JavaScript access | JavaScript-disabled check in `tests/e2e/transitions.spec.ts` |
| Print during motion | `tests/e2e/print.spec.ts`, plus inspecting PDF output during the print task |

This contract supersedes the transition requirements in the historical 1.x specs [transitions](../transitions/spec.md), [per-slide transitions](../per-slide-transitions/spec.md), and [direct transition](../direct-transition/spec.md), and the scroll-snap default it replaces. The first-paint guard in [fouc-fade](../fouc-fade/spec.md) remains.

## Related / Future

- Inactive-slide exposure to assistive technology, and whether a change needs an announcement: task 1a and the accessibility spec.
- Wheel momentum, swipe recognition, held keys, and nested-scroll boundaries: the input spec.
- History, fragments, and unnamed slides: the links and history spec.
- Public exposure of navigation commands and events: the lifecycle/API spec.
- Writing direction: horizontal motion follows the physical swipe contract. Mirroring it for right-to-left documents would be a separate owner decision.
