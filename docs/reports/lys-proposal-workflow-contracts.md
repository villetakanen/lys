---
generated:
  by: codex/gpt-6
  at: 2026-10-17T21:36:03+03:00
---

# L4 — Align the development skills' handoffs

**Status: proposed; not implemented.** Part of the [field-trial lessons](lys-field-trials-lessons-0.5.x.md). These are current-source findings, not demonstrated causes of failure in the deck trials.

## Evidence and proposed changes

| Current mismatch | Exact destination and proposed delta | Future decision improved |
| --- | --- | --- |
| Assemble waits for `PASS`, `PASS WITH NOTES` or `FAIL`; Critic emits `Ship it`, `Fix before commit` or `Discuss`. There is no explicit handling of Critic's judgment-needed result. | Revise [Assemble](../../.agents/skills/assemble/SKILL.md), **Goal**, **Step 3 — Decision Gate** and **Principles**, to consume the existing [Critic](../../.agents/skills/critic/SKILL.md) **Step 4 — Verdict** vocabulary. `Ship it` finishes review; `Fix before commit` returns findings to development; `Discuss` identifies the unresolved judgment. Keep the existing bounded-cycle limit. | A coordinator does not invent a verdict translation or treat an unresolved judgment as a passing review. “Ship it” remains a review verdict, not an instruction to publish. |
| [AGENTS.md](../../AGENTS.md) says always commit each working change and update specs when new constraints emerge. [Dev](../../.agents/skills/dev/SKILL.md) advertises micro-commits but forbids committing; Assemble assigns commits to Ship and specs to Spec. | Choose one policy in AGENTS **Judgment Boundaries**, **Spec-Driven Workflow** and **Agent Harness**, then replace contradictory text in Dev **description**, **Step 5 — Report**, **Rules**, and Assemble **Boundaries** with links to it. Proposed default: Dev/Assemble prepare validated changes; an authorized shipping task handles commits and pushes. Required spec work remains part of the implementation handoff and must be resolved before completion. | The same authorized task does not receive incompatible ownership rules depending on which entry point it uses. Preserve authorization already supplied by the user; this is not a proposal for repeated confirmation. |
| [Ship](../../.agents/skills/ship/SKILL.md) **Step 4 — Stage & Commit** unconditionally supplies a `Claude Opus 4.6 (1M context)` coauthor trailer. | Replace the fixed identity with actual contributor metadata when known and appropriate; otherwise omit the model-specific trailer. | Provenance reflects the actual run rather than the model that happened to write the skill. User-reported model identity in a retrospective remains labelled as such. |

The commit/spec policy is an owner choice, not settled by this retrospective. The proposed default follows the existing Dev/Assemble/Ship separation; another coherent policy can be selected instead. Avoid adding a second source of authority or a new workflow framework to repair these small contradictions.

## Acceptance evidence

Walk through the written workflow with three sample Critic results. Each must have one defined outcome; `Discuss` must retain the unresolved concern rather than entering an automatic repair loop without a decision. A nonblocking note must survive in the final review report.

Read AGENTS, Dev, Assemble and Ship together for one implementation requiring a spec correction. The record must identify who completes the correction, who verifies it and when a commit is authorized. No skill should claim completion while a required contract update remains merely suggested.

Inspect a sample proposed commit message under a non-Claude run: it must not contain a fabricated Claude attribution. This verification needs no real commit or push. Review the documentation diff and run repository lint; no browser run or new runtime test is needed for these wording changes.

## Scope

Keep the existing workflow's useful bounded iteration and spec checks. Do not change tool/model selection, add new roles or launch agents as part of this proposal. [L3](lys-proposal-example-verification.md) separately addresses the substance of example reviews; this proposal addresses the handoff contract.
