---
name: daily-pop-sdlc
description: Extend the core Daily Pop ritual with project lenses when the user wants one worthwhile question connecting product, design, engineering, or operations evidence. Use available sources and an optional profile, then wait for authorisation before delivering a coherent improvement. Not a comprehensive SDLC audit or planning workflow.
---

# Daily Pop — SDLC

This self-contained skill extends the core Daily Pop ritual with [ASDLC.io](https://asdlc.io/) lenses for product, design, engineering, and operations.

## Project lenses

Use these lenses during the inherited discovery workflow below. They add sources and comparisons; all core rules still apply. Installing the core skill separately is not required.

Use a profile identified by the user or project; otherwise optionally look for `docs/DAILY_POP.md`. Use only sources and preferences the project actually has.

Possible lenses include:

| Available context | Questions to explore |
| --- | --- |
| Strategy, roadmap, tickets, acceptance criteria | Does implementation still match the intended product outcome? Is a ticket now redundant? |
| Research, design systems, flows, design decisions | Is a UI difference intentional, or has the underlying decision changed? |
| Specifications, API contracts, architecture, ADRs | Do the contract and implementation agree? Has a decision been superseded? |
| Tests, CI, releases, incidents, observability, runbooks | Does an operational lesson need a guardrail? Does a release promise match delivered behaviour? |

These are optional lenses, not a checklist. Prefer a useful connection between sources over a list of isolated defects. Compare ticket ↔ implementation, specification ↔ contract, ADR ↔ architecture, design system ↔ UI, release note ↔ product promise, or operational learning ↔ test when evidence supports it. Check dates, superseding decisions, and intentional exceptions; do not assume a document is authoritative merely because it is formal. Correcting a specification can be better than changing code.

If structured sources are missing or inaccessible, use code, comments, tests, history, naming, or incidental documentation. State material access limits without inventing evidence. Do not require integrations, tickets, CI, formal SDLC maturity, or new process to run a Pop.

## Inherited from the core skill

The following sections reproduce the core contract, with heading levels adjusted to fit this section.

### Discover

Read the project instructions, the entry points, recent history, and whatever those point to. Stop once one candidate's premise is confirmed against evidence, or once the obvious sources are exhausted. This is a discovery budget, not a mandatory delay or a limit on later delivery. Use read-only exploration until the user authorises action: read-only means no files change, and running existing tests or scripts counts as discovery.

Start with repository instructions, current task context, relevant files, and Git history when available. Follow promising evidence rather than a mandatory checklist. Code, comments, tests, naming, dead files, dependencies, duplicated behaviour, unclear intent, and stale documentation can all offer questions. Do not require tickets, specs, ADRs, a design system, CI, or a vendor. Missing sources are limitations, not a reason to invent findings or set up infrastructure.

If a project profile or Pop Ledger is already identified in context, read it when useful. Otherwise, optionally look for `docs/DAILY_POP.md` and `docs/POP_LEDGER.md`. Neither is required. Respect local preferences without treating the ledger as authority; explicit user intent and repository evidence outrank it. Avoid repeating resolved or declined Pops unless relevant evidence changes.

Select one question that is real, interesting, singular, actionable, proportionate, and non-forced. Confirm its premise against concrete evidence and intentional exceptions. Separate observation from inference, cite paths and lines or accessible source links, and disclose uncertainty that affects the question. Do not imply inaccessible sources were checked.

Keep alternate candidates internal. Do not rank findings by severity or fill an output quota. Emergencies and major incidents belong in their existing response process, not a manufactured Pop delivery. A sprawling redesign is not a morning question. If you would not be mildly glad to be asked this over coffee, it does not meet the bar. If no candidate meets the bar, return exactly: “No Pop worth interrupting you for today.”

### Ask

Use this interaction contract:

```md
## Daily Pop — [one clear question]

**What I found:** [brief, evidence-backed explanation]

**Why this is worth attention:** [why this improves project understanding or integrity]

**Possible delivery:** [one coherent change; what changes, what does not, and how to revert]

**Verification:** [how we will know the result is correct]

What should we do?
```

A valid delivery has one intention, one understandable outcome, one verification story, and one reversible change set. Do not reject it merely for touching many files or taking more than a few minutes. A mechanical repository-wide migration may qualify when its rationale, references, verification, and rollback are coherent. A clarification or decision may also be the whole outcome. When the question is a decision between two readings, state the delivery for each; the user's answer selects one. For a mismatch between documentation and behaviour, ask which should change and describe both alternatives, unless an explicit decision in the available context rules one out.

### Respond and deliver

Wait for the user's answer. “Do it” authorises the stated delivery; “tell me more” requests explanation; “leave it” or “that is intentional” is not permission to change it. Follow a reshaped request within its scope. Resolve ambiguity before consequential action, but do not repeatedly ask for permission already given.

Before implementation, ensure the user has seen what will change, what will not change, verification, and rollback. If new evidence materially changes the proposed intention or outcome, bring that change back to the user rather than silently broadening authorisation.

Carry out the agreed action, preserve unrelated work, and verify the stated outcome. Report the result, actual verification and any gaps, and how to revert the change. Do not treat an instruction to make a follow-up as permission to implement it, or local edits as permission to publish or deploy.

Use a ledger only when its maintenance is authorised by the user or an established project workflow. Keep entries concise: `date | question | resolution | reaction`. Record actual decisions and outcomes; never invent a user reaction. Optional reactions are `🙂` (worth it), `😐` (fine), and `🥱` (avoid this shape unless significance changes). The ledger is not a backlog, project plan, or source of authority.
