---
generated:
  by: codex/gpt-6
  at: 2026-10-17T21:36:03+03:00
---

# L1 — Make authored slide frames predictable in print

**Status: proposed investigation; not implemented.** Part of the [field-trial lessons](lys-field-trials-lessons-0.5.x.md). The two candidates below can be accepted separately.

## Evidence

The [primary demo](kata-lys-migration-0.5.1-demo.md) and [Northern Lights](free-fall-northern-lights-kata-0.5.1.md) needed theme rules that keep an absolutely positioned content frame anchored to its slide in print. Northern Lights also needed stacked `top`/`left` offsets cleared: correct page count and page dimensions had concealed content displaced off-page. Both decks now contain working theme fixes.

The [ASDLC report](asdlc-kata-0.5.1.md) records a second, narrower issue: the auto-focused deck container's outline appeared at PDF edges. Its theme now suppresses the outline in print, and the JavaScript-on/off PDFs matched.

Current [print CSS](../../src/lys.css) intentionally changes stacked articles to `position: static`. The [print specification](../../specs/print-layout.spec.md), “Unchanged, restated here as this spec's responsibility” and “Regression Guardrails,” explicitly require this, as does [the stacked print test](../../tests/e2e/print.spec.ts). A generic change must revise that contract, not merely turn the existing assertion green. These findings are integration friction with an authored absolute frame, not proof that all stacked decks print incorrectly.

## Proposed bounded changes

**Positioning candidate.** Reproduce the failure with two slides, one absolute inner frame and fade mode. Evaluate a print-only `position: relative; inset: auto; transform: none` rule on stacked articles. Preserve normal-flow pagination and the authored frame's positioning reference. Compare with the existing theme override before choosing engine ownership. If this has undesirable effects on supported decks, retain and document the author-side recipe instead.

**Focus candidate.** Evaluate print-only suppression of the `[data-lys]` container outline. Preserve screen focus behavior. Do not change initialization, navigation or focus restoration to solve a printed decoration.

Proposed destinations: the print block in [src/lys.css](../../src/lys.css); the positioning, layout-mode and accessibility sections of [print-layout.spec.md](../../specs/print-layout.spec.md); shared regressions in [print.spec.ts](../../tests/e2e/print.spec.ts); and existing example-specific assertions in [site.spec.ts](../../tests/e2e/site.spec.ts). Update the spec before changing a contradictory contract. Remove redundant theme workarounds only once the engine behavior is verified against the built examples.

## Acceptance evidence

- A minimal reproduction fails before the chosen fix and passes afterward. Check frame origin and containing block, not only article size.
- Actual PDFs retain one page per slide, correct page dimensions, all content and no trailing blank page, at 16:9 and 24:10, with and without JavaScript. Inspect the rendered pages.
- Exercise stacked/fade and scroll-snap modes, absolute frames and ordinary flow content. Retain existing page-size mismatch, navigation and background coverage.
- Compare print after initialization and after keyboard navigation; the outline is absent on paper while screen focus/navigation still work.
- Run the required build, lint, type, unit and affected browser checks. State native-print coverage limits explicitly; Chromium export does not establish native Safari or Firefox printing.

## Decision changed

Authors should not have to rediscover the same engine/theme interaction in each deck. The unresolved decision is whether a positioned article becomes the engine's print guarantee or remains a documented recipe. Neither candidate needs a new public token, runtime dependency or print lifecycle script.
