Plan atomically deliverable tasks for the following feature or request:

$ARGUMENTS

## Instructions

You are planning implementation work for the Lys project. Before planning:

1. Read `CLAUDE.md` for hard constraints, judgment boundaries, and commit conventions
2. Read `PROJECT.md` for the ASDLC workflow and testing strategy
3. If a spec exists for this feature in `specs/`, read it — the spec is the authority
4. If no spec exists, tell the user to run `/spec` first, unless the request is a bug fix or chore that doesn't need a spec

Then check the current state of the codebase and GitHub issues to understand what already exists.

## Planning Rules

Each task must be **atomically deliverable** — it can be implemented, tested, and committed independently. A task is atomic when:

- It produces a working state (tests pass, lint passes, types check)
- It does not depend on uncommitted work from another task
- It can be described in one conventional commit message
- It is small enough for a single focused implementation session

## Output

For each task, create a GitHub issue using `gh issue create` with:

- **Title**: conventional-commit-style (`feat(scope): description` or `fix(scope): description`)
- **Labels**: one of `feat`, `fix`, `refactor`, `test`, `docs`, `chore` (create label if missing)
- **Body** containing:

```markdown
## Context
One paragraph: what this task does and why, referencing the spec if applicable.

## Spec Reference
`specs/<name>.spec.md` — <relevant section or scenario>
(or "N/A — this is a bug fix / chore" if no spec)

## Acceptance Criteria
- [ ] Criterion 1 (maps to a specific test or verification)
- [ ] Criterion 2
- ...

## Files Likely Touched
- `src/<file>.ts`
- `tests/unit/<file>.test.ts`
- ...

## Commit Convention
`type(scope): description`
```

## Ordering

Create issues in dependency order. If task B depends on task A, note it in B's body: `Depends on #<A>`.

Typical ordering for a new feature:
1. Types / interfaces (if new API surface)
2. Core logic (the module implementation)
3. Integration (wire into lys.ts, navigation, etc.)
4. Tests (unit tests for logic, e2e for browser behavior)
5. Docs / spec updates (if implementation revealed new constraints)

## After Planning

List all created issues with their numbers and titles. Show the dependency graph if there are dependencies. Ask if the ordering and scope look right before the user starts `/dev`.
