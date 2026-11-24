---
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-24T11:57:43+02:00"
verified:
  - by: "human:ville.takanen"
    at: "2026-11-24T08:42:02+02:00"
---

# Deck transitions

## Blueprint (Design)

### Context

A deck has one transition style: none, fade, horizontal, or vertical. The style changes how a slide change looks, never what it means.

### Architecture

#### Configuration

> **New API surface.** `data-transition` on the `[data-lys]` deck element.

| Deck `data-transition` | Style |
| --- | --- |
| `none` | Immediate change (default) |
| `fade` | The outgoing frame fades out while the incoming frame fades in |
| `horizontal` | Frames move along the horizontal axis |
| `vertical` | Frames move along the vertical axis |

- Values match ASCII case-insensitively, like HTML enumerated attributes. A missing, empty, or unrecognised value uses `none`. Lys does not rewrite or repair the attribute.
- `data-transition` on articles has no effect.
- A style change on the deck applies to later slide changes.

| Timing token | Default | Contract |
| --- | --- | --- |
| `--lys-transition-duration` | `300ms` | Resolved on the deck, including through inheritance. Applies to fade, horizontal, and vertical. Slide-local declarations have no effect. |
| `--lys-transition-easing` | `ease-in-out` | Same scope and resolution as duration. |

Invalid timing values follow normal CSS rules; Lys does not repair them. `none` ignores both tokens.

#### Rendering

With JavaScript, all slides share the settled frame defined by the [surface geometry spec](../surface-geometry/spec.md). Only the selected slide is painted and receives pointer input. The deck is not a scroll container for slides. Whether inactive slides are exposed to assistive technology belongs to the accessibility contract, not to this one.

#### Motion

- **Direction.** Moving to a later slide in document order is forward; moving to an earlier one is backward. This holds for every kind of navigation.

  | Style | Forward | Backward |
  | --- | --- | --- |
  | `horizontal` | Incoming enters from the right; outgoing leaves to the left | Incoming enters from the left; outgoing leaves to the right |
  | `vertical` | Incoming enters from the bottom; outgoing leaves to the top | Incoming enters from the top; outgoing leaves to the bottom |

  Directions are physical and match the input contract: a left swipe and a downward wheel both advance.
- **Jumps.** A change across several slides is one transition between the current and the target slide. Intermediate slides are not painted.
- **Confinement.** Motion stays inside the settled frame rectangle and never paints onto the backdrop. Frame dimensions, and therefore container query units, are the same during motion as when settled.
- **Engine scope.** Engine motion applies only to article frames. Lys never sets transitions, animations, or transforms on descendants. Author animation inside slides is unaffected by the style, the tokens, or reduced motion.
- **Selection timing.** Selection changes when navigation is requested, not when motion ends. The current index, selected-slide state, URL, and any slide-change notification update at the start.
- **Rapid input.** A navigation request during a running transition retargets it immediately. Nothing is queued or locked. At most two frames are painted at any moment: the newest incoming frame and the frame it replaces. When motion stops, only the selected frame is painted.
- **Endpoints.** Next on the last slide and previous on the first change nothing and start no motion.
- **Initial state.** Initialisation, including a load that addresses a slide by fragment, selects the slide without motion.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, every style changes slides immediately, whatever the timing tokens say. A change of preference takes effect without a reload.
- **Resize.** Resizing during motion recomputes the frame and does not change selection.

#### Modules

| Module | Responsibility |
| --- | --- |
| `src/lys.ts` | Owns selection and marks the outgoing frame. On retarget, ends the engine's frame transitions on the previous outgoing frame. |
| `src/lys.css` | Resolves the deck style. Stacking, fade, and axis motion, keyed off enhanced state and limited to screen; direction follows document order. Deck-scope timing; no motion under reduced motion. |
| `src/navigation.ts` | Input commands call the core selection path, which owns motion. |

Engine state attributes are internal and not author API.

### Anti-Patterns

- Measuring or inspecting slide content to drive motion, or animating with JavaScript frame loops that read layout.
- Stacking or hiding slides before enhancement, which would hide authored payload without JavaScript.
- Moving focus, adding announcements, or changing roles because a transition ran.
- Value aliases.

## Contract (Quality)

### Definition of Done

- The scenarios below pass with production CSS and IIFE in Chromium, Firefox, and WebKit, under the verification requirements in [PROJECT.md](../../PROJECT.md). Browser checks sample frame transforms, opacity, and paint bounds during motion.
- Every surface geometry scenario passes under each style.

### Regression Guardrails

Key mapping, endpoints, and input ownership are independent of the style. Authored IDs, semantics, focusability, and native control actions are unchanged.

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
| Default change, fade, axis direction, jump, confinement, timing, reduced motion, author animation, pointer input, no-JavaScript access | `tests/e2e/transitions.spec.ts` with a production-backed deck-level fixture |
| Surface geometry under each style | `tests/e2e/slides.spec.ts` with `tests/fixtures/surface.html` |
| Accessibility of motion | `tests/e2e/a11y.spec.ts` |
| Print during motion | `tests/e2e/print.spec.ts` |

## Related

- Inactive-slide exposure and change announcements: accessibility.
- Wheel, swipe, and key recognition: input.
- Fragments and history: links and history.
- Writing direction: horizontal motion follows physical directions in all documents.
