---
generated:
  by: codex/gpt-6
  at: 2026-10-16T12:06:00+03:00
---

# Kata 0.5.0 migration: primary Lys demo

**Superseded by the [0.5.1 correction](kata-lys-migration-0.5.1-demo.md).**
The responsive reading mode described below was an error inherited from Kata's
out-of-scope guidance, not intended Lys behavior. Finding 3's recommendation to
improve that adapter is withdrawn. Retain the screenshots and original test
results as evidence of that attempt, not acceptance evidence for current Lys.

On 16 October 2026, Lys 1.2.4's primary eight-slide demo was recomposed using
Kata 0.5.0. All visible wording, slide order, table cells and both code samples
were preserved. The result has a more deliberate hierarchy, a consistent author
theme, readable phone and no-JavaScript modes, and a portable standalone build.
This is an implementation and agent design review, not a reader study.

## Scope and provenance

All changes are in the **Lys repository**. Kata was read as the source; its
repository was not modified by this work.

- Baseline Lys commit: `7e38a6c` (1.2.4).
- Updated skill: `.agents/skills/kata/`, copied as the complete four-file kit.
  Obsolete catalogue references were removed rather than mixed with current guidance.
- Kata source: [`e02d32d9d49aec88e4a50140efe9f97424366e37`](https://github.com/villetakanen/kata/commit/e02d32d9d49aec88e4a50140efe9f97424366e37), version **0.5.0**.
  GitHub's version-bump commit changes only `package.json`; the skill files are
  byte-identical to the inspected local kit at `6753a3d`. The initial 0.4.0 label
  was corrected before delivery.
- Guidance used: Kata's entry point, shared practices, three forms and rendering
  integration; the available Lys authoring skill and relevant Lys specifications.
- Source deck: [examples/demo.html](../../examples/demo.html).
  The Pages examples list now links to this primary deck.
- Portable output: [site/examples/demo.html](../../site/examples/demo.html), rebuilt
  by `pnpm build`. This generated directory remains ignored under Lys conventions.
  The build inlines the current Lys CSS, IIFE and a scoped reading-mode adapter.
- Scope excludes the engine, other example decks, dependency changes and publication.

## What changed and why

The baseline had one largely uniform, centred content treatment. At 390×844,
its 16:9 canvas became a narrow strip: code, headings and list content were clipped
on several slides. Its counter stayed at 1/8 when navigating by ordinary scrolling,
which is visible in the baseline capture. Static theme classes also depended on
JavaScript applying `data-class`.

The new theme uses deep green, warm paper and a restrained pale-green accent.
Larger type and a shared reading edge give content more presence. Open space
separates subjects; thin rules connect peer claims without enclosing every item
in a card. These are design judgments, not claims of measured comprehension gains.
This is the demo author's theme, not a new default for the Lys engine.

| Slide | Communicative role and chosen form | Alternative considered and trade-off |
| --- | --- | --- |
| 1 — Lys | **One focus.** Large name at a clear reading edge, with the supplied description nearby. | The original quiet centre was viable. The larger offset group gives the opening more presence; it is less neutral. |
| 2 — What is Lys? | **Equal peers.** Four claims in equal fields, with matching emphasis and rules. | Equal rows allow longer lines. Two columns make the four short claims available together; phone reflow returns to rows in the supplied order. |
| 3 — The HTML Contract | **One focus, with subordinate context.** The unchanged code sample takes most of the width; its identifying heading sits beside it. | Heading above code offers wider lines. The supplied short sample fits beside the heading, so separation establishes the code as the subject. |
| 4 — Progressive Enhancement | **One focus on the supplied table.** Retain the matrix, align cells, keep the size-budget sentence adjacent. | Tier cards or an invented ladder would alter the authored representation. The table already expresses the relationship; the useful work is legibility and room. |
| 5 — Data Attributes | **One focus.** Heading above the unchanged code, leaving the long gradient attribute a full-width line at presentation sizes. | A side heading was tried and caused avoidable wrapping. Full width better serves the longest authored line. Phone code wraps visually without changing its text. |
| 6 — Design Tokens | **Equal peers in rows.** Shared alignment and consistent rules retain the list's equal status. | Four separate cards would narrow the longest statements. Rows use width economically and retain the supplied order. |
| 7 — LLM-First Design | **Equal peers in rows.** Five principles remain five prose claims, with comparable treatment. | A grid creates an awkward unmatched fifth field and suggests groups absent from the content. Rows are quieter and accommodate unequal lengths. |
| 8 — Closing | **One focus.** Centred fleur-de-lis, with the supplied navigation invitation nearby. | A left-aligned close would repeat the opening. The balanced centre gives this sparse item a calmer character. |

No subject was promoted into a recommendation. No proportional layout was
presented as evidence of priority. Code, table structure and numerical claims
were not rewritten to fit a form. Notes were completed or corrected to describe
the slide's supplied subject; layout rationale stays in this report.

## Evaluation and verification

Every slide was visually inspected in Chromium at **1440×900**, **1024×768**,
**390×844**, and **1440×500**. Every slide was also inspected with JavaScript
disabled at **1440×900** and **390×844**. The narrow and short views are natural-height
reading documents; all slides are exposed to accessibility tools. On the phone,
body text is 17.6px and the intact table is 16px. All table columns fit.

The offline inspection compared each slide's normalized visible text against the
captured baseline and both code samples character-for-character. All eight
matched in every inspected mode. No page errors or HTTP(S) asset requests were
observed. The copied file worked outside its generated site directory.

Axe scans using WCAG 2 A/AA and 2.1 AA tags found **zero violations** on each of the
eight desktop slides and on the complete phone document. This does not establish
full accessibility conformance or substitute for assistive-technology testing.

Keyboard verification covers ArrowRight, Home, End, Tab and Enter, the previous/next
controls, slide focus and hidden-slide ARIA state. Resize checks cover presentation
to phone, scrolling to a different article, and returning to presentation.
Controls have explicit zero tab stops so WebKit's default keyboard settings can
reach them. Direct mode uses no animated transition.

The [printed PDF](kata-lys-migration-0.5.0-demo-print.pdf) has **eight pages**, each
**960×540 points (16:9)**, with no extra page. All eight rasterized pages were
inspected. Backgrounds survive Chromium's default `printBackground: false`, all
text fits, and navigation is absent. Returning from native PDF print restores
the active slide and counter.

Automated checks:

- `pnpm build`: passed, including regenerated authoring skill and site.
- `pnpm lint`: passed. Temporary, ignored evaluation helpers produced advisory
  messages; changed production files pass their scoped check without warnings.
- `pnpm typecheck` and unit suite: passed, **192 tests**.
- Affected browser suite: `pnpm test:e2e tests/e2e/site.spec.ts tests/e2e/print.spec.ts tests/e2e/examples-theme.spec.ts`.
  **199 passed, 20 skipped** across Chromium, Firefox and WebKit. The skips
  are explicit Chromium-only PDF/page-box checks; no test failed.
- Vendored Kata files compared byte-for-byte with the four-file source kit.

WebKit's Playwright offline emulation rejects local `file:` navigation itself.
Its standalone test therefore blocks all HTTP(S) requests explicitly; Chromium
and Firefox also use offline browser contexts. Native PDF export is verified in
Chromium; print CSS is exercised in all three engines.

## Findings from using Kata

1. **The new forms apply to real demo content.** The earlier information-type
   catalogue left most titles, code and claim lists without a useful choice.
   One focus and equal peers now provide reasons for composition on all eight
   slides without inventing charts, criteria or process steps. This single use
   demonstrates applicability, not superiority to an unaided redesign.
2. **The content boundary was useful.** The existing capability matrix stayed
   intact, and code remained code. The most useful decision on slide 5 was to
   remove an attractive side-heading treatment because it took width from the
   authored sample. The form was adapted to the material.
3. **Withdrawn: responsive reading was outside scope.** The original review
   treated adapter repairs as an integration improvement. Owner clarification
   established that Kata composes a static surface and Lys scales that surface.
   Version 0.5.1 removes the adapter rather than improving or moving it into Lys.
   Tests that rewarded responsive reflow were replaced with fixed-canvas scaling,
   navigation and print checks.
4. **Keyboard inspection found what geometry checks missed.** An unnecessary
   tab stop on the table could receive focus while its slide was inactive.
   Removing it, and explicitly making the visible control buttons tabbable in
   WebKit, fixed the demonstrated problem without changing Lys's public API.
5. **Preservation can retain stale source claims.** Slide 2 still says “presenter
   sync”, while the current architecture defers presenter mode. Slide 6 still
   says “9 tokens”, describing the original slide-level set but omitting the
   additional backdrop and print-page tokens from a full public-token count.
   The closing navigation invitation also describes presentation mode, while
   phone mode uses ordinary scrolling. These are visible, pre-existing content
   issues for an authoring follow-up; they were not silently rewritten during
   composition.

## Delegated Lys skill-description issue

The requested subagent investigated [GitHub issue #70](https://github.com/villetakanen/lys/issues/70).
It was already **closed** and its fix already existed in Lys commit `30e8b78`,
before this task's baseline. `skill/SKILL.md` has both `name: lys` and a useful
`description`. The subagent verified both metadata tests, including preservation
through the real build injection, and the scoped formatting check. Both tests
passed. No duplicate patch was made; the integration build also preserves them.

## Evidence and limits

- Before: [desktop contact sheet](kata-lys-migration-0.5.0-demo-before-desktop.png),
  [phone contact sheet](kata-lys-migration-0.5.0-demo-before-phone.png).
- After: [desktop contact sheet](kata-lys-migration-0.5.0-demo-desktop.png),
  [phone contact sheet](kata-lys-migration-0.5.0-demo-phone.png).
- Fallbacks: [no-JavaScript desktop](kata-lys-migration-0.5.0-demo-nojs-desktop.png),
  [no-JavaScript phone](kata-lys-migration-0.5.0-demo-nojs-phone.png),
  [all printed pages](kata-lys-migration-0.5.0-demo-print.png).
- [Inspection measurements, fidelity results and axe results](kata-lys-migration-0.5.0-demo-checks.json).

Contact sheets reduce slides for comparison; the phone sheets show complete
natural-height articles rather than forcing each into an identical canvas.
No human owner review, reader comprehension study, physical phone test or screen
reader session was performed. The PDF is a visual print artifact, not an audited
accessible PDF. This work does not evaluate deck sequencing or establish a new
Lys brand. The broader browser suite outside the affected example, theme and print
checks was not rerun. The existing `themed.html` emits a parse warning for its
`&fleur;` entity during the development-server checks; that separate deck was not
changed.
