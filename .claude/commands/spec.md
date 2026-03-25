Write an ASDLC spec for the following feature request:

$ARGUMENTS

## Instructions

You are writing a spec for the Lys project — a structural CSS+TS slide engine. Read these files for context before writing:

1. Read `VISION.md` for product principles
2. Read `ARCHITECTURE.md` for the technical contract (API, tokens, events, data attributes)
3. Read `CLAUDE.md` for hard constraints and judgment boundaries
4. Read `PROJECT.md` section "Spec Structure" for the anatomy of a spec

Then check existing specs in `specs/` to understand scope boundaries and avoid overlap.

## Output

Create a new file at `specs/<feature-slug>.spec.md` following this exact structure:

```markdown
# <Feature Name>

## Blueprint (Design)

### Context
Why does this feature exist? What problem does it solve for Lys users (LLMs and humans)?

### Architecture
- DOM structure and data attributes involved
- API surface (methods, events, tokens) — reference ARCHITECTURE.md conventions
- Module boundaries — which source file(s) this touches
- Integration points with existing modules (navigation, a11y, presenter, core)

### Anti-Patterns
What must NOT be done. Include at least:
- Patterns that would violate the hard constraints in CLAUDE.md
- Common implementation mistakes for this kind of feature
- Approaches that would break progressive enhancement

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
- Progressive enhancement (CSS-only fallback)
- prefers-reduced-motion behavior (if applicable)
```

## Rules

- Reference specific ARCHITECTURE.md sections (tokens, events, data attributes) rather than inventing new API surface
- If the feature requires a new `data-*` attribute, new custom event, or new `--lys-*` token, flag it clearly with a "**New API surface**" callout — these require explicit approval per CLAUDE.md
- Map each Gherkin scenario to the test file it belongs in using the alignment table from CLAUDE.md
- Keep the spec focused on ONE feature — if the request implies multiple features, write the spec for the core one and note the others as "Related / Future" at the bottom
- Do not write implementation code — this is a spec, not a PR

After writing the spec, show the test/spec alignment (which test files need scenarios) and ask if the spec should be committed.
