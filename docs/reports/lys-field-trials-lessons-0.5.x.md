---
generated:
  by: codex/gpt-6
  at: 2026-10-17T21:36:03+03:00
---

# Lys lessons from the Kata 0.5.x field trials

**Status: findings and proposals for owner review.** No proposal is adopted or implemented by this collection. The five linked files are independently reviewable follow-ups, not new harness instructions.

The strongest opportunity is to make reliable deck authoring easier around Lys. The local redesigns retained Lys 1.2.5 and its public API. They exposed repeated print integration work, gaps between the delivered skill's instructions and its examples, and review that established technical fit without establishing comfortable reading. Two small print changes merit investigation in the renderer; the remaining proposals concern authoring and development practice.

This review inspects Lys at `02ba2ae7c991765116cd38670a90b788c25a049f`. It draws on three local trials and one external agent retrospective. It does not rerun those trials or independently inspect the proprietary deck. Kata versions identify the composition guidance being tested, not Lys release versions.

## Evidence and its limits

| Case | What the record establishes | Implication for Lys |
| --- | --- | --- |
| Primary Lys demo, eight 16:9 slides; [0.5.0 attempt](kata-lys-migration-0.5.0-demo.md) and [0.5.1 correction](kata-lys-migration-0.5.1-demo.md) | A responsive reading adapter was removed after the owner clarified static composition. The final theme scales the original material. An absolute content frame required a positioned article and cleared stacked offsets in print. | Retain the corrected static-surface boundary. Make the working authoring mechanics easier to reproduce. The initial report classified the print failure as a theme defect; recurrence motivates investigation, not retroactive reclassification as a proven engine bug. |
| [Northern Lights](free-fall-northern-lights-kata-0.5.1.md), eleven 24:10 slides | Owner: improved, but packed with large text, unbalanced and illegible. A PDF with correct page count still placed half the canvas off-page until the theme cleared stacked offsets. | Exact geometry and visual success are different outcomes. Page count alone cannot establish print correctness. The ratio is an authored choice: 24:10 = 12:5 = 2.4:1; it must not be silently relabelled 21:9. |
| [ASDLC](asdlc-kata-0.5.1.md), six 16:9 slides | Owner: better formatted but still packed. Principal copy increased from about 197 to 284 words. The old code panel concealed its last line behind internal scrolling. A focused deck container produced a printed outline; the theme removed it. | Density is not solely a cinema-ratio problem. Authored content boundaries, nested clipping and print focus state need distinct review. |
| [Claude Cowork retrospective](../../../kata/docs/evals/0.5.x-real-world/sources/cowork/report.md), reported 42-slide 1920×1080 conversion | The agent reports rebuilt diagrams, four finished-image slides, label collisions missed by overflow checks, a CSS class collision, and writing missing notes because it believed Lys required them. | Useful evidence about guidance interpretation and conversion handoffs. It does not establish a runtime defect or validate the proposed fixes. |

The external environment is **Claude Cowork, Opus 5.5, medium thinking**, as supplied by the user. Exact runtime and Lys version are not independently established. The proprietary PPTX, output HTML, screenshots and execution logs were not supplied; the report explicitly awaits Ville's review. No proprietary source deck is copied into Lys.

The [Kata evidence collection](../../../kata/docs/evals/0.5.x-real-world/README.md) retains frozen sources, baselines, provenance and the external report. Those two cross-repository links assume the adjacent `kata` checkout; all local trial reports above live in this repository. The primary demo's two phases remain one case. These are not four independent controlled experiments, and changes in content, brand treatment and composition prevent attributing outcomes to Kata alone.

## Proposals to pick up individually

| Proposal | Suggested priority | What would change |
| --- | --- | --- |
| [L1 — Print behavior](lys-proposal-print-behavior.md) | High: recurrent delivery friction | Investigate preserving the slide as the print positioning reference, and excluding the deck's focus outline from print. |
| [L2 — Delivered authoring skill](lys-proposal-authoring-skill.md) | High: direct author benefit | Supply one complete, tested static-slide recipe; clarify ratio, print tokens, CSS-only styling, optional notes and finished-image handling. |
| [L3 — Example review and verification](lys-proposal-example-verification.md) | High: observed review failure | Separate rendering, source fidelity and compositional assessment; reuse proven geometry checks and inspect actual output. |
| [L4 — Workflow contracts](lys-proposal-workflow-contracts.md) | Small, useful harness cleanup | Align Critic and Assemble verdicts, resolve commit/spec ownership contradictions, and remove hardcoded model attribution. |
| [L5 — Verification ordering](lys-proposal-verification-ordering.md) | Bounded harness reliability work | Avoid parallel formatting and duplicate builds while retaining verification of fresh production output. |

L1–L3 arise from trial evidence plus current source inspection. L4–L5 are inconsistencies found while reviewing the harness; the trial records do not demonstrate that they caused a failed run. Each file identifies exact destinations, a bounded change and acceptance evidence. L2 can document current theme requirements before an L1 engine decision; if L1 lands, keep the recipe aligned with the supported release.

## Practices worth retaining

The local work produced more than screenshots: authored-content records, artifact hashes, desktop and phone captures, JavaScript-disabled views, offline copied-file checks and actual PDF pages. These made corrections traceable. In particular, reviewing PDF images caught a defect that geometry totals missed. Testing the built site matters because development-time CSS insertion does not reproduce the production cascade.

Keep those practices proportional to the change. A report-only edit does not need a browser run; a changed slide needs review of its delivered rendering. A frozen content record proves preservation relative to that record, not that the author chose an appropriate amount of material. ASDLC's increased copy and retained six-slide boundary remained authoring decisions open to revision.

## Responsibility and decision boundaries

Lys owns rendering, scaling, navigation, accessibility behavior and print mechanics. Kata supports deliberate composition of one supplied surface. Brands supply identity constraints. The author owns source interpretation, copy, conversion choices and slide boundaries. The harness must help these responsibilities meet without silently transferring them.

The trial findings do not justify a Lys reading mode, automatic text shrinking, mandatory word quotas, default visual styling, new composition forms or a PowerPoint parser. Small portrait-phone text is a consequence of proportional scaling; a different reading surface would require a separate authoring decision. Passing technical checks is not owner acceptance, and “better than before” does not close the reported density problem.

Suggested first work: review L2 and L4 for clear guidance corrections, reproduce L1 in a small fixture, and use L3 when the next example changes. L5 can proceed independently. These are proposed starting points, not an adopted roadmap or a claim that work is complete.

## Review verification

This collection was checked against the cited reports and current source, skills, specifications and tests. All 52 local links across the six new files resolve, and whitespace checks pass. `pnpm lint` passes with two pre-existing informational notices in ignored scratch files; it applied no fixes. No runtime, deck, delivered skill, development skill, specification or standing instruction is changed. Historical passing tests are evidence from their respective runs, not fresh verification of the proposals.
