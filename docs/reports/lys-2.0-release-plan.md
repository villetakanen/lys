# Lys 2.0.0 release plan

Status: agreed release direction; implementation and detailed interaction decisions remain pending.
Branch: `feat/2_0_0`. Baseline runtime: 1.2.5.

## Release purpose

Deliver a consistent, accessible presentation engine with an explicit CSS-container boundary. Authors own all composition within slides. Lys owns slide geometry, containment, presentation behaviour, and the surrounding environment. See [VISION.md](../../VISION.md).

This warrants a major release: removing implicit padding, base typography, and inherited foreground styling changes existing decks even if their markup and JavaScript still run. Public token removals and interaction changes require explicit migration decisions. Documentation corrections alone do not require a major release.

## Scope and ordered work

| Work | Dependencies and destinations | Completion evidence |
| --- | --- | --- |
| 1. Define the 2.0 contracts | Review `ARCHITECTURE.md`, relevant `specs/`, and current source. Inventory public tokens and decide which remain. Define keyboard, mouse/trackpad, touch, chrome, URL/history, focus, multiple decks, and fallback behaviour. | Every interaction specifies its trigger, exclusions, state change, and verification. Record exact evergreen-browser versions for the August 2026 baseline. Explicitly decide default visible controls; do not infer them from the vision. |
| 2. Align development guidance | Update `AGENTS.md`, `PROJECT.md`, and affected development skills using L4/L5 below. Can proceed independently of runtime changes. | One coherent commit/spec ownership policy, compatible review verdicts, accurate contributor attribution, and verification ordering without competing writers. Reconcile size budgets by artifact and measurement. |
| 3. Implement the author-owned surface | Depends on token decisions in 1. Update structural CSS, token specifications, tests, and affected fixtures together. | No engine-imposed internal spacing, typography, or foreground styling; environment backdrop remains separate. Demonstrate authored container-relative sizing and stable composition. Explicit migration for removed or changed defaults/tokens. |
| 4. Implement the interaction and accessibility contract | Depends on 1. Update navigation, accessibility, lifecycle, and associated specifications/tests in bounded increments. | Verify all input paths and exclusions, active-slide state, focus, announcements, reduced motion, and preservation/restoration of authored semantics. Verify interaction with controls and nested scrolling content, including inactive-slide focusability. |
| 5. Resolve print and fallback mechanics | Depends on 3 and any relevant lifecycle changes. Investigate L1 before choosing engine versus author ownership. | Actual PDFs preserve complete frames, ratios, pagination, and visibility; CSS-only viewing keeps every slide reachable. Inspect output, not only page counts. Record native-browser print coverage limits. |
| 6. Align authoring guidance and migration | Depends on settled contracts and implementation. Update `llms.txt`, delivered skill, README, examples, and migration instructions; use L2. | One complete recipe works with explicit author styling, optional notes, offline assets, supported ratios, CSS-only viewing, and print. Demonstrate migration from a 1.2.5 deck without losing appearance or supplied meaning. |
| 7. Revise site and primary demo | Depends on 6. Review `site/index.html`, `examples/demo.html`, site builder, and site specification. Use L3 and vendored composition guidance when changing composition. | Site describes shipped capabilities accurately, package links resolve, references match the runtime, and demo illustrates the new boundaries. Inspect desktop, phone, keyboard, no-JavaScript, copied offline HTML, and rendered PDF output. Keep rendering verification distinct from compositional acceptance. |
| 8. Release verification | Depends on all required work above. | Fresh production build, lint, type checks, unit and browser tests; migration and release notes; measured artifact sizes; explicit remaining coverage limits. Set package version to 2.0.0 only as part of release preparation. |

Each implementation increment must update its affected contract and verification together. This plan does not authorize publishing a release or resolve unspecified API choices.

## Review findings to carry forward

- `site/index.html` still uses unscoped `unpkg.com/lys` and npm package links, describes accessible presentations rather than engine accessibility, and presents reference information that needs reconciliation with current tokens and their scopes.
- `examples/demo.html` still teaches internal padding/font-size tokens and the old progressive-enhancement and LLM-first framing. Existing print fixes and external controls are useful evidence, not an automatic 2.0 API decision.
- `ARCHITECTURE.md` advertises number-key navigation and configurable swipe thresholds; the inspected navigation implementation has neither. It accepts both horizontal and vertical arrow keys. Document actual behaviour before choosing the new contract.
- Current navigation exempts interactive elements for Space but not uniformly for arrows/Home/End. Current accessibility code overwrites roles and removes them on destruction. Review these against the agreed non-interference and semantic-preservation requirements; do not treat current behaviour as the target merely because it exists.
- AGENTS and development skills disagree about who commits and updates specs. Critic and Assemble use incompatible verdict vocabularies. Ship runs mutating checks/builds concurrently and hardcodes a model attribution. The pre-commit hook also runs a mutating formatter alongside readers and belongs in the verification-order review.
- The README's revised example has not completed browser verification: Chromium failed to launch in this session. Formatting and relative-link checks passed after adding the MIT license. The example must pass the production-backed authoring checks before it is treated as verified guidance.

## Existing evidence and proposals

The [field-trial lessons](lys-field-trials-lessons-0.5.x.md) retain the evidence and its limits. Their proposals remain inputs, not claims of implemented capability:

- [L1: Print behaviour](lys-proposal-print-behavior.md)
- [L2: Authoring skill](lys-proposal-authoring-skill.md)
- [L3: Example verification](lys-proposal-example-verification.md)
- [L4: Workflow contracts](lys-proposal-workflow-contracts.md)
- [L5: Verification ordering](lys-proposal-verification-ordering.md)

## Out of scope

No automatic content rewriting, responsive reading mode, automatic text shrinking, composition system inside the engine, PPTX parser, fragments, plugin API, or remote control is required for this release. Default visible chrome remains a decision, not a prerequisite assumed by this plan.
