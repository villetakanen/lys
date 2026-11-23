---
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-23T18:34:13+02:00"
---

# Lys development and verification

Runtime baseline: 1.2.5. The [approved 2.0 plan](docs/reports/lys-2.0-release-plan.md) and [contract baseline](specs/2.0-contracts/spec.md) govern migration; they are not claims of implemented 2.0 behaviour.

## Toolchain

Node >=20; pnpm version and scripts are defined in package.json. Configuration files are executable sources of truth; avoid copying stale scaffolding into this guide.

| Intent | Command | Notes |
| --- | --- | --- |
| Development server | `pnpm dev` | Vite |
| Format and lint | `pnpm lint` | Mutates files; run before readers |
| Read-only lint | `pnpm exec biome check .` | Reports without fixing |
| Type check | `pnpm typecheck` | TypeScript strict mode |
| Unit tests | `pnpm test` | Vitest/happy-dom |
| Coverage | `pnpm test:coverage` | Thresholds in vitest.config.ts |
| Production build | `pnpm build` | Type check, Vite, declarations, skill injection, site generation |
| Browser tests | `pnpm test:e2e` | Playwright starts dev server and builds/serves production site |
| Full tests | `pnpm test:all` | Unit then browser tests |

## Verification ordering

1. Format/lint; inspect fixes before continuing.
2. Type check and unit tests against the resulting tree.
3. For browser changes, run the relevant Playwright tests. Its production server performs a fresh build; do not run another build concurrently. Run a standalone build when verifying artifacts without a browser run.
4. Inspect generated outputs/diffs and run whitespace checks before staging relevant files.

Pre-commit uses read-only lint, type checks, unit tests, and an advisory front-matter report that never fails. These readers can run concurrently because none formats or builds. Pre-push runs the full browser suite. Do not bypass hooks to claim a passing change. Match verification to the change: prose needs link/consistency checks; runtime needs behavioural tests; publishing needs all release gates. Report environmental failures separately from product failures.

## Test evidence

Feature specs use Blueprint and Contract sections with observable scenarios. Map scenarios to tests without requiring a one-to-one test function count. happy-dom verifies logic; Playwright verifies actual layout, inputs, motion preferences, and native history. Browser suites include production-backed pages, not just development style injection.

Inspect real PDF output for print geometry and pagination. Verify fallback payload access with JavaScript disabled. Test engine clipping using known fixtures without assessing arbitrary authored composition. Synthetic gestures are useful but do not establish real trackpad/touch usability.

Screen-reader speech, reading position, and navigation need direct observation with recorded OS/browser/assistive-technology versions. Accessibility-tree snapshots and axe checks are supplementary. Follow task 1a's [protocol](docs/reports/lys-2.0-native-accessibility.md); never report unperformed manual checks as passing.

## Artifact budgets

Use the existing per-artifact limits from the project/architecture contract, eliminating the ambiguous blanket JS limit:

| Artifact | Limit, minified gzip bytes |
| --- | --- |
| dist/lys.js (ESM) | < 5,000 |
| dist/lys.iife.js (IIFE) | < 6,000 |
| dist/lys.css | < 2,000 |

Measure a fresh build using Node zlib.gzipSync with its default compression level, excluding maps and declarations. Report raw bytes too. The inline CSS + IIFE pair should remain under 20,000 raw bytes; record any excess as a budget issue. These budgets describe engine outputs, not embedded author assets. Do not silently raise them to pass a build.

## Development workflow

Follow AGENTS.md's single ownership policy for specs, commits, and external actions. Implement approved contracts in bounded increments with source/spec/tests together. A 2.0 requirement supersedes conflicting historical 1.x guardrails only when the migration is explicit. Specs state intent and are never marked pending; code and tests are the contract. Describe behaviour as shipped only once code and tests implement it.

Review verdicts: PASS (optional nonblocking notes), FAIL (actionable blockers), DISCUSS (owner decision required). The coordinator resolves review findings and commits verified local increments. Workers do not commit. Push/publication requires user authorisation; an explicitly invoked ship workflow authorises its stated commit/push operation, not a release publication.

## Delivered guidance

Build outputs are dist/lys.js, dist/lys.iife.js, dist/lys.css and declarations. scripts/inject-skill.js and scripts/build-site.js produce authoring/site artifacts. Verify actual scripts and outputs when changing this pipeline.

README, llms.txt, the delivered skill, and examples must reflect implemented capability. Teach author-supplied CSS, optional native IDs, offline assets, fallback access, and print. No required notes or inferred content checks. The demo set collectively covers 16:9, 24:10, and 9:19.5; reuse feature demos for that coverage.
