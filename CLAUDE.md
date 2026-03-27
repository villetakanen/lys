# CLAUDE.md

> Agent constitution for ⚜ Lys — a structural CSS+TS slide engine for LLM-generated presentations.

## Project Context

Lys is a zero-dependency library that turns `<article>` elements into accessible slide presentations. It ships as CSS + JS (ESM and IIFE). The primary consumer is LLMs generating presentations, but humans use it too.

Lys is **visually unopinionated** (no default fonts, colors, or spacing) but **heavily opinionated about behavior** — navigation, focus management, ARIA announcements, touch handling, and transition timing. This is the core value: LLMs can produce markup, but they cannot reliably produce correct interactive presentation behavior. Lys makes those decisions so the generated HTML doesn't have to.

Read these before working:

- [VISION.md](./VISION.md) — Product principles. Understand *why* before *how*.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — API contract, tokens, events, data attributes.
- [PROJECT.md](./PROJECT.md) — Toolchain config, testing strategy, agentic workflow.
- `specs/*.spec.md` — Feature-level contracts. **Read the relevant spec before implementing.**

## Toolchain

| Action | Command |
|---|---|
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Lint + format | `pnpm lint` |
| Type check | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| E2E tests | `pnpm test:e2e` |
| Full suite | `pnpm test:all` |

Biome handles linting and formatting (tabs, double quotes, semicolons). Lefthook runs lint + typecheck + unit tests on pre-commit. Conventional Commits are enforced on commit-msg.

## Hard Constraints

These are non-negotiable. Violating any of these is always wrong.

- **Zero runtime dependencies.** Never add a `dependency` to package.json. Dev dependencies are fine.
- **Inline-friendly outputs.** Both `lys.css` and `lys.iife.js` must be fully self-contained — no `@import`, no `url()` to external files, no dynamic `import()` in the IIFE build. An LLM must be able to paste both into a single HTML file's `<style>` and `<script>` tags and have a working presentation.
- **Size budget.** JS < 5 KB gzip, CSS < 2 KB gzip. Raw (uncompressed) should stay well under 20 KB total for both, since inline usage means no gzip.
- **Progressive enhancement.** CSS-only decks must remain functional. Never make JS required for basic slide viewing.
- **No framework APIs.** No React, Lit, Vue, web component registries, or framework-specific patterns. This is vanilla CSS + TS.
- **Semantic HTML contract.** Slides are `<article>` elements in a `[data-lys]` container. This structure is the public API — changing it is a breaking change.
- **WCAG 2.1 AA.** Every feature must be accessible. `prefers-reduced-motion` must be respected in all animation code. ARIA attributes must be correct.

## Judgment Boundaries

### Never do without asking

- Add a new `data-*` attribute to the article contract
- Add a new custom event to the public API
- Change the `--lys-*` token API (add, remove, or rename tokens)
- Change the file structure
- Add a dev dependency

### Always do

- Read the relevant `specs/*.spec.md` before implementing a feature
- Write or update tests alongside implementation (unit for logic, e2e for browser behavior)
- Commit after each discrete, working change (micro-commits)
- Verify ARIA attributes on any DOM manipulation
- Run `pnpm lint` before considering work complete
- Update the spec if implementation reveals missing constraints

### Prefer

- CSS solutions over JS solutions (progressive enhancement)
- Standard DOM APIs over abstractions
- `const` over `let`, never `var`
- Explicit types over inference for public API surfaces
- Small, focused modules over monolithic files
- Custom events over callbacks for extensibility

## Spec-Driven Workflow

This project uses a spec-anchored development model. Specs in `specs/` are living documents with two sections:

- **Blueprint** — Architecture, API contracts, anti-patterns.
- **Contract** — Definition of Done, regression guardrails, Gherkin scenarios.

When implementing:

1. Read the spec.
2. Plan against the Blueprint section.
3. Implement in micro-commits.
4. Verify against the Contract section (every Gherkin scenario should have a test).
5. Update the spec if you discover new constraints.

If code and spec disagree, the spec wins — unless the spec is wrong, in which case update the spec first.

## Commit Convention

```
type(scope): description

feat(core): add slide container initialization
fix(nav): prevent double-fire on rapid arrow key
test(a11y): verify live region announces slide changes
docs(spec): add edge case scenario for empty decks
chore(build): update Vite to 6.x
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`, `perf`, `style`, `revert`.

## Key Architecture Decisions

- **Two-tier CSS tokens.** Internal `--_lys-*` resolve against public `--lys-*` with fallback defaults. Authors only touch `--lys-*`. See ARCHITECTURE.md.
- **Auto-init pattern.** IIFE build auto-discovers `[data-lys]` containers on DOMContentLoaded. ESM build exposes `Lys.init()` for manual control.

## Test / Spec Alignment

```
specs/lys-core.spec.md      →  tests/unit/lys.test.ts + tests/unit/tokens.test.ts
specs/navigation.spec.md    →  tests/unit/navigation.test.ts + tests/e2e/navigation.spec.ts
specs/a11y.spec.md          →  tests/unit/a11y.test.ts + tests/e2e/a11y.spec.ts
specs/transitions.spec.md   →  tests/unit/transitions.test.ts + tests/e2e/transitions.spec.ts
```

A spec scenario without a test is a gap. A test without a spec scenario means the spec needs updating.
