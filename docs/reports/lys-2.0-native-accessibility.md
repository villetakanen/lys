---
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-23T18:34:13+02:00"
---

# Native accessibility baseline for Lys 2.0

Status: task 1a in progress. Protocol prepared 23 October 2026. Actual screen-reader observation is pending; no speech results or announcement policy are approved.

## Question

Does native HTML/browser behaviour communicate navigation and preserve access sufficiently for Lys's agreed model? Only add engine announcements if observation establishes a concrete gap.

## Controls and comparisons

Start with plain sibling articles, headings, a link, an input, an unnamed article, and an inner anchor. No role replacement, tabindex injection, live region, forced focus, or Lys runtime. Compare:

1. Native document reading and real fragment links, including an unknown fragment.
2. Scrolling plus history replacement, distinguishing visual position, DOM focus, and screen-reader reading position.
3. Minimal enhanced rendering for none, fade, horizontal, and vertical styles, without announcements or forced focus. These prototypes must not quietly inherit current src/a11y.ts behaviour.
4. Existing 1.2.5 as a labelled comparison only, never as evidence of native behaviour.

Use the same content throughout. Do not infer speech from DOM focus or an accessibility-tree snapshot. Do not make an unnamed slide linkable by adding an ID for the test.

## Observation matrix

Record exact OS/browser/screen-reader versions, interaction mode, relevant settings, action, visible slide, focus, reading position, spoken output, reachable content, and outcome. Include a native Safari/VoiceOver run and a Windows browser/screen-reader run such as Firefox/NVDA; this is a proposed evidence matrix, not a claim those systems are available or tested. Identify any coverage limitations.

Actions: open document; read in order; follow slide and inner-content links; navigate sequentially; use Back/Forward after visiting named and unnamed slides; operate a link/input; Tab out normally; change transition style; disable JavaScript. Distinguish screen-reader navigation commands from keys delivered to the page.

## Decision criteria

- Can the reader locate and read the selected material without hidden reachable controls or inaccessible payload?
- Is reading/focus position preserved or moved by native browser behaviour in a comprehensible way?
- Does an actual gap require a position announcement, or would one duplicate native speech?
- Can any gap be resolved through native layout/semantics before introducing custom behaviour?

Record observations first, then a reasoned policy and its limitations. The owner decides any material deviation from the agreed browser-native model. Formalise the resulting policy in specs/a11y/spec.md before implementing it.

## Evidence ledger

| Evidence | Status |
| --- | --- |
| Standards and current source review | Recorded in the interaction study; shows why native links and replaceState cannot be assumed equivalent |
| Plain-browser fragment/history experiment | Completed 23 October 2026; observations below, no assistive technology |
| Actual screen-reader speech and reading-position observations | Pending |
| Enhanced inactive-slide rendering comparison | Pending; depends on bounded prototype |
| Announcement requirement | Undecided |

Sources: [HTML focus model](https://html.spec.whatwg.org/multipage/interaction.html#sequential-focus-navigation-starting-point), [WAI carousel example](https://www.w3.org/WAI/tutorials/carousels/functionality/), and [local study](lys-interaction-conventions-study.md#screen-reader-announcements--evidence-review-21-october-2026). These do not replace hands-on evidence.

## Plain-browser observations — 23 October 2026

Fixture: [native-accessibility.html](fixtures/native-accessibility.html), loaded as a local file in headless Playwright browsers on the macOS host, viewport 960×640. These are installed test builds, not certification of the August 2026 evergreen baseline or native Safari.

Procedure: click the real link to #third; record hash, scrollY, and activeElement; press Tab; record focus/scroll again; set location.hash to missing; record scroll; call history.replaceState(null, "", "#first"); record scroll. No Lys, ARIA injection, focus script, or screen reader ran.

| Browser build | Native link result | Next Tab | Missing fragment | replaceState to #first |
| --- | --- | --- | --- | --- |
| Chromium 145.0.7632.6 | #third; y=1341; activeElement BODY | Return link in third article; y=1341 | No scroll change | URL changes; y remains 1341 |
| Firefox 146.0.1 | #third; y≈1341.27; activeElement BODY | Return link in third article; same y | No scroll change | URL changes; same y |
| Playwright WebKit 26.0 | #third; y=1341; activeElement BODY | Input in unnamed article; y=1341 at sampling | No scroll change at sampling | URL changes; same y |

Inference: history replacement does not perform native anchor scrolling in this experiment. Tab handling differs in the tested WebKit environment; do not infer native Safari or screen-reader behaviour from it. Measurements are immediate observations, not guarantees about delayed scrolling. Actual speech and reading position remain unverified. The experiment neither approves a live region nor establishes that announcements are unnecessary.
