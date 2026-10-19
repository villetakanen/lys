---
generated:
  by: codex/gpt-6
  at: 2026-10-17T21:36:03+03:00
---

# L2 — Make the delivered authoring skill match the working practice

**Status: proposed; not implemented.** Part of the [field-trial lessons](lys-field-trials-lessons-0.5.x.md). This changes the delivered Lys skill, not the vendored Kata repertoire.

## Evidence

[skill/SKILL.md](../../skill/SKILL.md) correctly requires a static composition that scales proportionally. Its examples still use fixed `rem` padding/gaps, its output placeholder suggests 8–12 articles, and its quality checklist describes JavaScript-disabled articles as a readable document. Those details can steer authors away from the stated contract. The three local trials required a more explicit static-frame implementation.

The skill's token table omits `--lys-print-page-size` and `--lys-backdrop`; [ARCHITECTURE.md](../../ARCHITECTURE.md) documents both. The print token must be set at `:root`. Example classes supplied only through `data-class`, and gradients supplied only through `data-background`, rely on JavaScript for their application; they do not provide equivalent CSS-only theme styling.

The [Cowork report](../../../kata/docs/evals/0.5.x-real-world/sources/cowork/report.md) says missing notes were written because “Lys requires notes.” That interpretation matches the skill's checklist, but the architecture describes notes as optional metadata. Similarly, the checklist's heading rule is authoring guidance, not a runtime initialization requirement. Current [accessibility code](../../src/a11y.ts) has fallback labels; those fallbacks alone do not make a screenshot's contents accessible.

## Proposed bounded changes

Revise **CSS Tokens**, **Fixed slide composition**, **Slide Patterns**, **Quality Checklist** and **Output Template** in [skill/SKILL.md](../../skill/SKILL.md), outside the generated runtime markers:

- Supply one complete static-slide recipe whose inner spacing and type scale together. Declare exact ratio, reference dimensions and intended viewing conditions; illustrate 16:9 and 24:10 without turning either into a compulsory format. Distinguish aspect ratio, transition mode and transition duration.
- Complete the public token table and its scope exceptions. Show the print page-size token on `:root`, with dimensions matching the authored ratio.
- Put required styling in ordinary classes/CSS so the same composition survives without JavaScript. Demonstrate the current print positioning requirement, pending [L1](lys-proposal-print-behavior.md).
- Replace the 8–12-article placeholder with brief-determined content. A request to retain Lys features does not determine slide count. Record a reading target; do not prescribe a universal word count or type scale.
- Revise the notes rule to: “Preserve supplied speaker notes. Notes are optional metadata; write new notes only when content authoring is in scope, and identify them as authored additions.”
- Clarify the no-JavaScript check: “With Lys CSS retained, preserve the fixed-aspect composition and CSS-only navigation. With both Lys CSS and JavaScript absent, semantic HTML remains readable.”
- Add a finished-image example using a source-derived accessible title and appropriate image description, with no duplicated visible title or wordmark. Explain that a hidden heading cannot replace access to meaningful information inside an image.

Add a short conversion handoff note: identify which supplied diagrams were embedded or rebuilt; preserve labels, quantities, meaningful encodings and relationships; flag uncertain repairs; record treatment of hidden slides, language and missing notes. Use descriptive, scoped theme classes to reduce collisions. The external report motivates this advice; its source placements remain unverified. This is an authoring recipe, not a new PPTX ingestion feature or permission to invent missing material.

## Acceptance evidence

Render a small deck from the actual documented recipe with no undocumented CSS repairs. Cover 16:9 and 24:10, desktop and phone scaling, JavaScript-disabled navigation, actual print output and a copied HTML file with external requests blocked. Verify stable wrapping, frame placement and retained source meaning; review necessary small text at the declared reading target.

Extend the current [skill tests](../../tests/unit/skill.test.ts) beyond metadata and runtime injection with an appropriate browser fixture derived from the recipe. Check optional notes and the finished-image example deliberately. Keep build injection intact and regenerate delivered assets through the normal build.

## Decision changed

An author can begin from a proven implementation of Lys's contract instead of assembling conflicting hints. Rendering guidance stays in Lys; composition judgment stays with Kata and the author. If L1 changes the print guarantee later, update the recipe for that supported runtime version.
