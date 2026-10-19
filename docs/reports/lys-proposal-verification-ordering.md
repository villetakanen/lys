---
generated:
  by: codex/gpt-6
  at: 2026-10-17T21:36:03+03:00
---

# L5 — Verify one fresh build without competing writers

**Status: proposed; not implemented.** Part of the [field-trial lessons](lys-field-trials-lessons-0.5.x.md). This is a source-inspection risk; no observed trial failure is attributed to it.

## Evidence

[Ship](../../.agents/skills/ship/SKILL.md), **Step 2 — Quality Gates**, runs lint, build, unit tests, browser tests and type checking in parallel. In [package.json](../../package.json), lint is `biome check --write .`, so it can change source files while other commands read them. The build also writes delivered skill assets and the site.

[playwright.config.ts](../../playwright.config.ts) independently runs `pnpm build` before starting the production preview. Running it alongside Ship's explicit build creates two writers of the same output. The configuration intentionally refuses a stale preview: the built-site tests exist because development CSS insertion has a different cascade and previously concealed delivery defects. That protection is worth retaining.

## Proposed bounded change

Revise Ship's **Step 2 — Quality Gates** so mutating formatting completes first. Then give one operation ownership of the fresh build and production preview. Run read-only checks in parallel only after their inputs are stable.

The narrowest option is to let the browser-test server's existing build satisfy Ship's build gate. Confirm and report that the build completed successfully before interpreting the browser results. Unit tests and type checking can run independently after formatting. An alternative is a shared verification command that builds once and starts tests against that exact output; use it only if the simpler arrangement cannot report build failures clearly.

Keep standalone `pnpm build` and `pnpm test:e2e` useful. Do not remove the automatic browser-test rebuild globally, reuse an arbitrary running preview, or replace built-site checks with development-server checks. If orchestration changes need configuration or scripts, keep the behavior specified in Ship and the production-server comments rather than duplicating it across several documents.

Destinations: [Ship's quality gates](../../.agents/skills/ship/SKILL.md); [playwright.config.ts](../../playwright.config.ts) only if necessary; [package.json](../../package.json) only if a shared command proves warranted. No runtime or public API change is required.

## Acceptance evidence

- Observe a representative validation run: formatting finishes before readers start, and only one build writes the deliverables.
- Build failure stops browser verification and is reported as a failed build, not successful validation of old output.
- Change a source fixture and verify that the production check sees the fresh built result. Standalone browser tests retain the same freshness guarantee.
- Lint, type checks, unit tests and browser tests remain required and their outcomes remain individually visible. A failed check still blocks shipping.
- Confirm the workflow preserves the intended ESM development path and standalone IIFE delivery checks. Inspect the resulting diff for accidental generated-file churn.

## Decision changed

Parallelism should reduce waiting only where operations are independent. This proposal removes avoidable ambiguity about which files were validated without weakening the current production checks. It does not require a new CI system or authorize any commit, push or publication during this review.
