---
generated:
  by: codex/gpt-6
  at: 2026-10-17T21:36:03+03:00
---

# L3 — Review examples beyond technical fit

**Status: proposed; not implemented.** Part of the [field-trial lessons](lys-field-trials-lessons-0.5.x.md).

## Evidence

The owner found both [Northern Lights](free-fall-northern-lights-kata-0.5.1.md) and [ASDLC](asdlc-kata-0.5.1.md) packed despite improved formatting and passing technical checks. Rendered review caught clipping but did not adequately assess scale, balance and reading demand. ASDLC increased principal copy by about 44% while retaining six slides; those were authoring choices, not Lys requirements.

The general “content is not clipped” check in [print.spec.ts](../../tests/e2e/print.spec.ts) measures each article's scroll height. That does not establish that a nested scrolling code panel shows all its lines or that two labels do not overlap. The old ASDLC panel demonstrates the first limitation; the [external agent report](../../../kata/docs/evals/0.5.x-real-world/sources/cowork/report.md) reports the second. Northern Lights demonstrates that correct page count can coexist with wrong page placement.

[site.spec.ts](../../tests/e2e/site.spec.ts) already contains stronger, example-specific checks for frame origins, text bounds, fonts, print geometry and offline artifacts. The [Critic skill](../../.agents/skills/critic/SKILL.md) is principally a code/spec review and does not explicitly request rendered evidence for changed decks.

## Proposed bounded changes

In Critic's **Step 2 — Load context**, include the presentation brief and rendered evidence when an example or its theme changes. In **Step 3 — Review against each lens**, add a scoped example-review lens with three distinct conclusions:

1. **Rendering:** aspect ratio, proportional scaling, clipping, navigation, JavaScript-disabled behavior, offline delivery and print.
2. **Source fidelity:** supplied text, qualifications, quantities and meaningful relationships; separately identify author-approved content changes.
3. **Composition:** what draws attention, relative weight, reading effort and smallest necessary text at the declared viewing conditions. Record this as design judgment and keep owner feedback visible.

Suggested wording: “Technical checks passing does not establish compositional acceptance. For changed presentation items, inspect the delivered rendering at its intended viewing size and in PDF. If material fits but remains too demanding, return that finding to the author; do not silently shrink, remove qualifications or rewrite the source.”

Merge duplicated frame/edge/text checks into shared helpers within the existing browser test suite where practical. Preserve deck-specific content expectations. Add bounded regressions for wrong frame origins and hidden nested code content. Do not claim a universal collision detector or a density score: deliberate overlap and visual hierarchy require context.

## Acceptance evidence

- A known offset frame and a clipped code fixture fail the intended assertions; corrected versions pass. Keep the actual PDF page checks.
- Inspect every changed slide and rendered PDF page at a useful size, with a whole-deck overview for consistency. Reinspect after fixes. Include phone scaling and JavaScript-disabled evidence without claiming portrait-phone readability from mere fit.
- Run against built delivery output, preserving the production-cascade rationale in [playwright.config.ts](../../playwright.config.ts). Use offline copied-file checks when portability changes.
- The review reports technical results, agent design assessment and owner acceptance separately. Existing owner criticism is not converted into acceptance by a subsequent passing suite.
- A subsequent bounded composition study may compare two rendered alternatives for the same supplied slide and viewing conditions. That study is separate work, not required for every small correction.

## Decision changed

The next agent should be able to reject a technically valid arrangement for the specific reading problem it creates. The harness helps route that judgment back to authoring or Kata; Lys does not become a copy editor or impose a visual style. This improves review discipline but does not guarantee aesthetic success or replace owner review.
