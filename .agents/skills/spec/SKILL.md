---
name: spec
description: "Write an ASDLC spec for a feature request"
argument-hint: "[feature request description]"
---

Write an ASDLC spec for the following feature request:

$ARGUMENTS

## Instructions

You are writing a spec for the Lys project — a structural CSS+TS slide engine. Read these files for context before writing:

1. Read `AGENTS.md` for product boundaries, authority, and working policy
2. Read `VISION.md` for product principles
3. Read the [approved 2.0 roadmap](../../../docs/reports/lys-2.0-release-plan.md) for settled product contracts and exclusions
4. Read the roadmap's [task 1 working material](../../../docs/reports/lys-2.0-release-plan.md#task-1-working-material) for the 1.x interface inventory, open decisions, and gates
5. Read `PROJECT.md` section "Test evidence" for verification expectations

Then check existing specs in `specs/` to understand scope boundaries and avoid overlap. `ARCHITECTURE.md` and older feature specs describe 1.x until explicitly migrated: use them as evidence of current behaviour, not as authority over the 2.0 contracts.

## Output

Create a new file at `specs/<feature-slug>/spec.md` following this exact structure:

```markdown
# <Feature Name>

## Blueprint (Design)

### Context
Why does this feature exist? What problem does it solve for Lys users (LLMs and humans)?

### Architecture
- DOM structure and data attributes involved
- API surface (methods, events, tokens) — reference the roadmap's 1.x interface inventory and its 2.0 disposition
- Module boundaries — which source file(s) this touches
- Integration points with existing modules (navigation, a11y, transitions, core)

### Anti-Patterns
What must NOT be done. Include at least:
- Patterns that would violate the product boundaries in AGENTS.md
- Common implementation mistakes for this kind of feature
- Approaches that would hide authored payload without JavaScript

## Contract (Quality)

### Definition of Done
Observable, testable success criteria. Each criterion should map to at least one test.

### Regression Guardrails
Invariants that must never break — things that are true today and must remain true after this feature ships.

### Scenarios (Gherkin)
Behavioral specs as Given/When/Then. Cover:
- Happy path
- Boundary conditions
- Error / edge cases
- Accessibility requirements
- No-JavaScript payload access (fidelity may degrade)
- prefers-reduced-motion behavior (if applicable)
```

## Rules

- Build on the roadmap's agreed contracts and 1.x interface inventory rather than inventing new API surface; do not carry conflicting 1.x requirements into 2.0 by default
- If the feature requires a new `data-*` attribute, new custom event, or new `--lys-*` token, flag it clearly with a "**New API surface**" callout — scope outside the approved roadmap requires discussion per AGENTS.md
- Map each Gherkin scenario to the test file it belongs in, following the roadmap's verification mapping and PROJECT.md "Test evidence"
- Keep the spec focused on ONE feature — if the request implies multiple features, write the spec for the core one and note the others as "Related / Future" at the bottom
- Do not write implementation code — this is a spec, not a PR

After writing the spec, show the test/spec alignment (which test files need scenarios) and follow AGENTS.md: the coordinator commits verified bounded changes; do not request approval again when already authorised.
