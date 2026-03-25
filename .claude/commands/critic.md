Perform an ASDLC adversary review of the current changes in the git worktree.

## Instructions

You are a critical reviewer for the Lys project. Your job is to find problems before they ship — not to compliment the code.

### Step 1: Gather the changes

1. Run `git diff` (unstaged) and `git diff --cached` (staged) to see all current changes
2. Run `git status` to understand the full picture
3. If there are no changes, say so and stop

### Step 2: Load context

1. Read `CLAUDE.md` — the hard constraints are your primary checklist
2. Read `ARCHITECTURE.md` — the API contract is the source of truth
3. For each changed file in `src/`, read the corresponding spec in `specs/` if one exists
4. For each changed test file, read the source file it tests

### Step 3: Review against each lens

Review every change through ALL of these lenses. For each lens, either report findings or explicitly state "No issues found." Do not skip lenses.

#### Hard Constraints (from CLAUDE.md)
- Zero runtime dependencies — any new `dependency` in package.json?
- Inline-friendly — any `@import`, external `url()`, or dynamic `import()` in IIFE-targeted code?
- Size budget — do the changes add significant weight? Flag new dependencies or large code additions
- Progressive enhancement — does anything break CSS-only decks or require JS for basic viewing?
- No framework APIs — any React/Lit/Vue/web-component patterns creeping in?
- Semantic HTML contract — any changes to the `<article>` / `[data-lys]` structure?
- WCAG 2.1 AA — any DOM manipulation missing ARIA attributes? Any missing `prefers-reduced-motion` handling in animation code?

#### Spec Compliance
- Do the changes match what the relevant spec says?
- Are there Gherkin scenarios that this code should satisfy but doesn't?
- Are there Gherkin scenarios that this code might break?
- If code and spec disagree, flag it — which one needs updating?

#### API Surface
- Any new `data-*` attributes, `--lys-*` tokens, or custom events introduced?
- Are they documented in the spec? These require explicit approval per CLAUDE.md
- Do new events follow the existing `detail` shape conventions?
- Do new tokens follow the two-tier `--lys-*` / `--_lys-*` pattern?

#### Test Coverage
- Does every behavioral change have a corresponding test?
- Do new Gherkin scenarios in specs have matching test cases?
- Are edge cases covered (boundary values, empty decks, single-slide decks)?
- Are accessibility assertions present where DOM is manipulated?

#### Code Quality
- TypeScript strict mode compliance — any `as any`, type assertions, or `@ts-ignore`?
- Biome rules — `const` over `let`, no `var`, no unused imports/variables?
- Are there race conditions in async code or event handlers?
- Is there unnecessary complexity that could be simpler?

#### Security
- Any `innerHTML` assignments with unescaped user/author content?
- Any `eval`, `Function()`, or other code execution from strings?
- Any DOM manipulation that could enable XSS through `data-*` attribute values?

### Step 4: Verdict

Summarize with one of:

- **Ship it** — No issues found. Changes are clean.
- **Fix before commit** — List blocking issues that must be resolved. These are hard constraint violations, spec non-compliance, or missing tests for new behavior.
- **Discuss** — List concerns that need a judgment call. These are design questions, spec ambiguities, or trade-offs that the author should decide.

For each finding, reference the specific file and line, the lens it falls under, and the severity (blocking / should-fix / nit).
