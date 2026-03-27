Implement the following GitHub issue:

$ARGUMENTS

## Instructions

You are implementing a backlog item for the Lys project. This command orchestrates work using subagents.

### Step 1: Understand the task

1. Fetch the GitHub issue details using `gh issue view <number>`
2. Read the spec referenced in the issue (if any) from `specs/`
3. Read `CLAUDE.md` for hard constraints and judgment boundaries
4. Read the source files listed in "Files Likely Touched"

### Step 2: Plan the implementation

Before writing code, create a brief plan (use plan mode if the task is non-trivial):

- What changes are needed in each file
- What tests need to be written or updated
- What the commit message(s) will be

### Step 3: Implement using subagents

Use the Agent tool to parallelize independent work. Delegate to subagents for:

**Research / exploration subagents** (subagent_type: Explore):
- Investigating how existing modules work before making changes
- Finding all call sites or usages of something being modified
- Understanding test patterns used in the existing test suite

**Implementation subagents** (subagent_type: Code):
- Writing or modifying source files in `src/`
- Writing or updating unit tests in `tests/unit/`
- Writing or updating e2e tests in `tests/e2e/`

### Subagent guidelines

- Only parallelize truly independent work (e.g., unit tests and e2e tests for different scenarios)
- Do NOT parallelize source changes that touch the same file
- Each subagent should receive: the relevant spec section, the file(s) to read/modify, and the acceptance criteria it's fulfilling
- Subagents must follow CLAUDE.md constraints (Biome formatting, strict TS, no dependencies, etc.)

### Step 4: Verify

After implementation, run these checks sequentially:

1. `pnpm lint` — Biome lint + format
2. `pnpm typecheck` — TypeScript strict mode
3. `pnpm test` — Vitest unit tests
4. Fix any failures before proceeding

### Step 5: Report

After verification passes, report back:

1. What was done (files changed, tests added)
2. If implementation revealed new constraints, note what spec updates are needed
3. Any open questions

Do NOT commit, push, or close the issue — that is the user's decision.

## Rules

- Never skip the verification step — all four checks must pass
- If a check fails, fix it before proceeding
- If the task is blocked (missing dependency, spec ambiguity), stop and ask rather than guessing
- Do NOT commit, push, or close issues — the user controls git and GitHub operations
- Do not modify files outside the scope of the issue without asking
- If the issue's acceptance criteria can't all be met, explain what's missing and why
