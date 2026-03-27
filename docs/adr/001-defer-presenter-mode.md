# ADR-001: Defer Presenter Mode to Post-1.0

| Field | Value |
|---|---|
| Status | **Accepted** |
| Date | 2026-03-27 |
| Decision makers | @villetakanen |
| Scope | `src/presenter.ts`, `specs/presenter.spec.md`, issues #7, #8 |

## Context

The ARCHITECTURE.md and VISION.md describe a presenter mode feature: a second browser window showing current/next slide previews, speaker notes, timers, and a slide overview grid, synchronized with the main deck via `BroadcastChannel`.

During implementation planning, several unresolved design problems surfaced that make presenter mode a poor fit for the 1.0 release:

### Problem 1: Popup blockers

Presenter mode requires `window.open()` to launch the presenter window. Modern browsers aggressively block popups unless triggered by a direct user gesture. Even with a gesture, many corporate environments and browser extensions block `window.open()` entirely. This makes the feature unreliable for the primary audience (people viewing LLM-generated presentations).

### Problem 2: Same-origin constraint on `file://`

`BroadcastChannel` requires same-origin communication. For `file://` URLs (the most common way to open a single-HTML-file presentation), browser behavior varies:

- Chrome: each `file://` page is its own origin — BroadcastChannel won't connect.
- Firefox: all `file://` pages share an origin — works, but this is a known security exception.
- Safari: similar to Chrome.

This means the feature would silently fail on the primary delivery format (single HTML file opened locally) in 2 of 3 major browsers.

### Problem 3: Presenter window content

The presenter window needs its own HTML document (layout, CSS, slide previews). For the inline single-file use case, this HTML must be generated at runtime — likely via a Blob URL or data URI constructed in JS. This adds significant bundle size (HTML templates, layout logic, preview rendering) and complexity that conflicts with the size budget (<5 KB JS gzip) and the zero-dependency constraint.

### Problem 4: Dual-instance coordination

Both windows would load the same HTML file and auto-init Lys. Distinguishing "I am the presenter view" from "I am the audience view" requires either:
- A URL parameter convention (`?presenter=true`) — fragile, leaks into shared URLs
- A BroadcastChannel negotiation protocol — complex, race-prone on load
- A separate HTML document for the presenter — breaks the single-file model

### Problem 5: Scope vs. value for 1.0

The core value proposition of Lys is: **LLMs can produce markup, but they cannot produce correct interactive presentation behavior.** Navigation, focus management, ARIA, touch handling, and hash routing deliver this value. Presenter mode is a power-user feature for live talks — a valid use case, but not the primary one, and not necessary to prove the core thesis.

## Decision

**Defer presenter mode to a post-1.0 release.** Remove it from the 1.0 scope entirely.

Specifically:
- Do not create `specs/presenter.spec.md` for 1.0.
- Do not implement `src/presenter.ts` for 1.0.
- Close issues #7 and #8 with a reference to this ADR.
- Keep `data-notes` and `data-timing` attributes in the article contract — they are useful metadata independent of presenter mode, and removing them would be a contract change.
- Keep `lys.presenter()` and `lys:presenter` out of the 1.0 API surface. Do not document them in `llms.txt` or `SKILL.md`.
- Update ARCHITECTURE.md and VISION.md to mark presenter mode as a future capability rather than a 1.0 feature.

## Consequences

**Positive:**
- 1.0 scope is smaller, shippable sooner, and easier to validate.
- Bundle size stays well within budget without presenter HTML/CSS/JS.
- No risk of shipping a feature that silently fails on `file://` in Chrome/Safari.
- The `data-notes` attribute still works as semantic metadata (screen readers, custom tooling, print stylesheets).

**Negative:**
- Users who want speaker notes during a live presentation have no built-in solution in 1.0.
- The ARCHITECTURE.md description of presenter mode has been forward-looking since project inception — deferring it may feel like a regression in ambition.

**Neutral:**
- A post-1.0 presenter mode could use a different architecture (e.g., a companion PWA, a localhost dev server mode, or a `<dialog>`-based overlay) that sidesteps the popup/origin problems entirely. Deferring gives space to find a better design.

## Alternatives Considered

### Ship presenter mode with known limitations
Accept that it won't work on `file://` in Chrome/Safari and document the limitation. Rejected because the primary use case is single-file HTML opened locally — a feature that fails silently in that scenario is worse than no feature.

### Use a `<dialog>` overlay instead of a second window
Show presenter controls in a modal overlay on the same page. This avoids popup blockers and BroadcastChannel entirely. However, it still adds significant bundle size and doesn't solve the "two views at once" use case (notes on laptop, slides on projector). Worth exploring for post-1.0 but not ready for 1.0.

### Use SharedWorker instead of BroadcastChannel
Same origin restrictions apply. Does not solve the fundamental problems.
