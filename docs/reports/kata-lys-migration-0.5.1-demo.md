---
generated:
  by: codex/gpt-6
  at: 2026-10-16T15:04:33+03:00
---

# Kata 0.5.1 / Lys 1.2.5 — restore static slide composition

This corrects the responsive behavior introduced during the
[0.5.0 migration](kata-lys-migration-0.5.0-demo.md). The project owner clarified
that Kata composes a static surface and Lys scales the authored slide. A phone
viewport does not authorize a new composition or a reading document.

## Source and corrections

Lys's vendored Kata skill is copied from version 0.5.1, commit
`ed08e83655ac04bb1f3069b15369ac32e662a037`. The four portable files match that
source. Kata's shared forms, practices and integration guidance no longer
prescribe viewport reflow or renderer lifecycle changes. The earlier frozen
independent trial is explicitly historical and does not validate the corrected
scope; its artifacts have not been rewritten or rerun.

Lys package metadata is 1.2.5. The primary demo retains its eight slides, supplied
wording, code samples, capability table and accepted green palette. The reading
adapter, breakpoint reflow and print lifecycle handlers are removed. Lys stays
active at every viewport size. Theme content scales within its fixed 16:9 canvas;
controls outside that canvas retain usable screen sizing.

The engine's source and public API are unchanged. The authoring skill and API
reference now explain the fixed-canvas contract. The demo specification and tests
were corrected to enforce scaling, navigation and stable selection. The standalone
build continues to inline the renderer, author theme and control script.

During visual PDF review, an absolute content frame initially lost its slide
anchor when print CSS returned the article to normal flow. The authored print
rule now keeps each article positioned, resets its stacked offsets, and leaves
pagination to Lys. Regression checks verify each frame's anchor and page edge.
This was a theme defect, not a missing engine capability.

## Verification

- Every slide was visually inspected at **1440×900** and **390×844**, with
  JavaScript enabled and disabled, offline. All slides remain 16:9 with the same
  arrangement. All original visible text and both code samples match the pre-fix
  demo. No external requests or page errors were observed.
- Cross-browser checks cover **1440×900**, **1024×768**, **390×844**, and
  **1440×500**. Columns and widths remain proportional, type scales with the
  canvas, and code keeps its line count. A few pixels of native vertical
  line-box/border rounding are allowed; responsive rearrangement is not.
- Keyboard controls, synthetic horizontal touch gestures, resize state and
  inactive-slide ARIA state pass. Phone views retain presentation navigation.
  CSS-only views retain fixed-aspect scroll-snap slides with all content present.
- Axe WCAG 2 A/AA and 2.1 AA checks found no violations on the eight desktop
  slides. This is automated evidence, not a full accessibility certification.
- Native PDF export retains the current slide. The result has **eight 960×540-point
  pages**, with no extra page and no controls. Every rasterized page was inspected;
  normalized extracted text confirms each page contains its expected slide.
- Build, lint, type checking and **192 unit tests** pass. The affected browser
  suite passes **205 checks**, with **20 explicit PDF-related skips** across
  Chromium, Firefox and WebKit. The checks are `site.spec.ts`, `print.spec.ts`,
  and `examples-theme.spec.ts`.

WebKit rejects local file navigation under Playwright's offline emulation. Its
standalone test blocks all HTTP(S) requests explicitly; Chromium and Firefox also
use offline contexts. Native PDF export is Chromium-only. No physical phone,
screen reader or reader-comprehension study was used. On a portrait phone, slide
text is smaller because the whole composition scales; larger-text reflow is not
claimed as part of Lys behavior.

## Evidence

- [Desktop slides](kata-lys-migration-0.5.1-demo-desktop.png)
- [Phone slides with presentation controls](kata-lys-migration-0.5.1-demo-phone.png)
- [JavaScript-disabled phone slides](kata-lys-migration-0.5.1-demo-nojs-phone.png)
- [All print pages](kata-lys-migration-0.5.1-demo-print.png) and
  [print PDF](kata-lys-migration-0.5.1-demo-print.pdf)
- [Artifact hash, geometry, fidelity and accessibility record](kata-lys-migration-0.5.1-demo-checks.json)

The earlier report's proposed Lys reading-mode capability gap is withdrawn. The
lesson is to enforce the existing responsibility boundary and test the renderer's
contract. The source-copy concerns already recorded in 0.5.0, such as “presenter
sync”, remain authoring follow-ups; no supplied claims were silently rewritten.
