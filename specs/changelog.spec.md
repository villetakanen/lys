# CHANGELOG.md

## Blueprint (Design)

### Context

Lys is preparing for its 1.0.0 release (see #41). Currently there is no CHANGELOG.md — release notes depend entirely on GitHub's auto-generated notes, which are unsorted commit lists without categorization or editorial context. A structured changelog matters because:

1. **npm consumers** see the changelog on the package page. It signals project maturity.
2. **LLM integrators** need to know when the token API or article contract changes — breaking changes must be unmissable.
3. **Contributors** need a human-readable history that explains *what changed and why*, not just a list of commits.

The changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions and [Semantic Versioning](https://semver.org/).

### Architecture

#### File location

`CHANGELOG.md` at the project root — the standard location recognized by GitHub, npm, and tooling.

#### Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] — YYYY-MM-DD

### Added
- ...

### Fixed
- ...

### Changed
- ...

## [1.0.0-beta.4] — YYYY-MM-DD
...
```

#### Categories

Per Keep a Changelog, each release section uses these subsections (only when applicable):

| Category | Maps to | Content |
|---|---|---|
| **Added** | `feat` commits | New features and capabilities |
| **Fixed** | `fix` commits | Bug fixes |
| **Changed** | `refactor`, `perf` commits | Changes to existing behavior or defaults |
| **Removed** | removal commits | Features or API surface removed |
| **Deprecated** | deprecation notices | API surface marked for future removal |
| **Security** | security fixes | Vulnerability patches |

`docs`, `test`, `chore`, `ci`, and `build` commits are generally **not** included unless they have user-facing impact (e.g., a build change that alters the dist output).

#### Scope of initial changelog

Cover the beta releases that led to 1.0.0. Based on git history, the release sections are:

1. **1.0.0-beta.1** — Initial public beta (README, Pages site, llms.txt, skill, examples, core engine).
2. **1.0.0-beta.3** — Per-slide transitions, direct transition mode, FOUC fix, focus ring fix, ASDLC branding.
3. **1.0.0-beta.4** — Container-type sizing, container-relative tokens, stacked mode nav bug fix, adaptive backdrop color.
4. **1.0.0** — The stable release (content TBD at release time).

Each section should highlight user-facing changes only. Internal refactors, spec additions, and CI tweaks are omitted unless they changed the dist output.

#### Module boundaries

- **`CHANGELOG.md`** — New file at project root. No build step, no generation script.
- **`README.md`** — Add a link to the changelog (optional, in the Links section).

No changes to `src/`, `tests/`, `dist/`, or any config files.

#### Maintenance convention

- The `[Unreleased]` section accumulates entries as features land on `dev`.
- At release time, `[Unreleased]` is renamed to the version + date, and a fresh `[Unreleased]` section is added above it.
- Entries are written in past tense, user-facing language ("Added adaptive backdrop color for the out-of-slide area"), not commit-message style ("feat(css): add adaptive backdrop...").

### Anti-Patterns

- **Auto-generating the changelog from commits.** Commit messages are terse and implementation-focused. The changelog should be editorial — written for users, not developers. A commit dump is not a changelog.
- **Including every commit.** Internal refactors, spec docs, test additions, and CI changes are noise in a changelog. Only user-facing changes belong.
- **Duplicating content from GitHub Releases.** The changelog and GitHub Releases serve different audiences. The changelog is the canonical file (ships with npm); GitHub Releases can be auto-generated or link to the changelog.
- **Inventing version sections that never existed.** Only include versions that were actually tagged or published. The git history shows `v0.1.0`, then beta.1 through beta.4 — no phantom releases.
- **Omitting breaking changes.** Any change to the `--lys-*` token defaults, `data-*` attribute contract, or event shapes must be called out explicitly, even in a beta changelog.

## Contract (Quality)

### Definition of Done

1. `CHANGELOG.md` exists at the project root.
2. It follows Keep a Changelog format with the standard preamble.
3. It has sections for each beta release (beta.1, beta.3, beta.4) with correct dates from git tags/commits.
4. It has an `[Unreleased]` section at the top.
5. Each release section uses only the standard categories (Added, Fixed, Changed, Removed, Deprecated, Security).
6. Entries are written in past tense, user-facing language.
7. Internal-only changes (specs, tests, CI, chore) are excluded unless they affected the dist output.
8. Token default changes (e.g., the container-relative migration in beta.4) are called out as **Changed** with the old and new defaults.
9. Comparison links at the bottom of the file point to valid GitHub compare URLs.
10. No `docs`, `test`, or `chore` entries appear unless they had user-facing impact.

### Regression Guardrails

- The changelog must not drift from actual release history. Dates and version numbers must match git tags.
- The `[Unreleased]` section must always exist — it is the accumulator for in-progress work.
- The changelog must not include implementation details, file paths, or internal module names — it is written for library consumers, not contributors.
- Category names must exactly match Keep a Changelog conventions (title case, no custom categories).

### Scenarios (Gherkin)

These are documentation validation checks, not automated test scenarios.

#### Structure

```gherkin
Scenario: CHANGELOG.md follows Keep a Changelog format
  Given the CHANGELOG.md file
  Then it starts with a title "# Changelog"
  And it contains the Keep a Changelog preamble
  And it mentions Semantic Versioning
  And it has an [Unreleased] section before all versioned sections

Scenario: Each release section has a version and date
  Given the CHANGELOG.md file
  When each release heading is inspected
  Then it follows the format "## [X.Y.Z] — YYYY-MM-DD"
  And the dates match the corresponding git tag or release commit dates

Scenario: Categories use standard names only
  Given the CHANGELOG.md file
  When all ### headings inside release sections are inspected
  Then they are one of: Added, Fixed, Changed, Removed, Deprecated, Security
```

#### Content quality

```gherkin
Scenario: Entries are user-facing
  Given the CHANGELOG.md file
  When each bullet entry is inspected
  Then it describes a user-visible change
  And it does not reference internal file names, test files, or spec documents
  And it is written in past tense

Scenario: Internal changes are excluded
  Given the CHANGELOG.md file
  When searched for entries about spec additions, test additions, or CI changes
  Then no such entries exist (unless the change affected dist output)

Scenario: Token default changes are documented
  Given the container-relative token migration in beta.4
  When the beta.4 section is inspected
  Then it lists the changed tokens under "Changed"
  And it notes the old defaults (rem/viewport) and new defaults (cqi/container-relative)
```

#### Comparison links

```gherkin
Scenario: Version comparison links are present
  Given the CHANGELOG.md file
  Then the bottom of the file contains link definitions for each version
  And each link points to a GitHub compare URL between consecutive tags
  And the [Unreleased] link compares the latest tag to HEAD
```

## Test / Spec Alignment

These scenarios are documentation validation — they do not map to the automated test suite.

| Scenario group | Verification method |
|---|---|
| Structure | Manual review against Keep a Changelog spec |
| Content quality | Manual review — editorial judgment required |
| Comparison links | Click-test each GitHub compare URL |
| Dates | Cross-reference with `git log --tags` |

## Related / Future

- **#39 — CI publish workflow.** The workflow could validate that `[Unreleased]` is empty before publishing (i.e., all changes have been moved to a versioned section).
- **#41 — Release 1.0.0.** The 1.0.0 section will be written as part of the release process.
- **Automated link checking.** A CI step could verify comparison links resolve. Not required for 1.0.
