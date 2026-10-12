---
type: Report
title: Kata 0.2.0 migration evaluation
tags: [kata, evaluation, examples, skills]
generated:
  by: claude/fable-5.1
  at: 2026-10-12T15:30:00+03:00
verified:
  - by: human:ville.takanen
    at: 2026-10-12T16:00:00+03:00
---

# Kata 0.2.0 migration evaluation

## Purpose

Kata 0.2.0 is vendored at `.agents/skills/kata/` in Lys 1.2.2. Six Claude Sonnet subagents, one per deck in `examples/`, evaluated all 42 slides against it. Three questions were asked of each slide:

1. Can a pattern from the Kata catalogue be discerned that the slide should have used, or is the needed form missing from Kata?
2. Does a clean-context subagent, given only `SKILL.md` and the seven references, reach a sensible "best result" verdict?
3. What does this imply for Kata and for the Lys examples?

The evaluation is a small harness-debugging exercise. It records agent verdicts and a reviewer's cross-check. It does not measure reader comprehension, and nothing here claims Kata improves a slide for an audience.

## Method

Each subagent was told to read `SKILL.md` and all seven reference files, then read one deck, and for every `<article>` report: content, audience question, information relationship, a verdict (`pattern`, `adapt`, `split`, `reject`, or `not applicable`), whether the pattern would improve the slide, a catalogue gap, and confidence. Subagents were told that `reject` and `not applicable` were expected outcomes and not to force a pattern. They had no knowledge of Kata beyond the skill files and no access to the Kata repository, gallery or evaluation corpus.

The reviewer read all 42 slides before the subagent reports arrived and formed independent expectations, then compared each report against them.

## Results by deck

### minimal.html (3 slides)

| Slide | Verdict | Gap named |
| --- | --- | --- |
| 1 First Slide | not applicable | title/cover |
| 2 Second Slide | not applicable | prose placeholder |
| 3 Third Slide | not applicable | closing |

Evaluator summary: a renderer smoke test with placeholder text. Correctly declined every slide. Recommended a deck with real content as a better target.

Reviewer: agrees on all three. Nothing to learn about Kata here beyond the fact that it declines cleanly.

### nav.html (5 slides)

| Slide | Verdict | Gap named |
| --- | --- | --- |
| 1 Chapter Navigation | not applicable | title |
| 2 The Problem | not applicable | single statement/claim |
| 3 The Approach | reject | process/steps; code snippet |
| 4 The Result | not applicable | single statement |
| 5 That's It | not applicable | closing |

Evaluator summary: a feature demo for `data-lys-nav`. Slide 3 was the only near-miss. The evaluator considered adapting Directed dependencies and rejected it because the source states no prerequisite edge meaning. A plain ordered list was judged the honest form.

Reviewer: agrees. The reasoning on slide 3 cites the right failure condition from `relationship.md` and does not invent structure.

### demo.html (8 slides)

| Slide | Verdict | Gap named |
| --- | --- | --- |
| 1 Lys | not applicable | title |
| 2 What is Lys? | not applicable | feature list / positioning statement |
| 3 The HTML Contract | not applicable | code sample |
| 4 Progressive Enhancement | adapt: Directed dependencies or Nested groups, or split | process/ladder; single key number |
| 5 Data Attributes | not applicable | code sample; reference table |
| 6 Design Tokens | not applicable, with a possible Nested groups sub-part | precedence/cascade; glossary |
| 7 LLM-First Design | not applicable | principles/pillars list |
| 8 Closing | not applicable | closing |

Evaluator summary: a renderer demo. Explicitly flagged the misapplication risk of forcing tiers into arrows or tokens into nested boxes.

Reviewer: agrees on seven slides. Slide 4 is the one weak verdict, discussed below.

### full.html (10 slides)

| Slide | Verdict | Gap named |
| --- | --- | --- |
| 1 Building with Lys | not applicable | title |
| 2 What is Lys? | reject | key-points / feature list |
| 3 The HTML Contract | not applicable | code sample |
| 4 Data Attributes (table) | pattern: Aligned comparison, with caveat | reference/glossary table |
| 5 CSS Design Tokens | not applicable | code sample; reference table |
| 6 Navigation | adapt: Aligned comparison, marginal | parallel features / definition list |
| 7 Accessibility (quote + bullets) | adapt: Golden cut, marginal | quote or callout with support |
| 8 Progressive Enhancement (3 cards) | adapt: Aligned comparison, improves | cumulative tiers / levels |
| 9 New in 1.1.0 | reject | changelog |
| 10 Closing | not applicable | closing |

Evaluator summary: the only slide in all six decks that received a "yes, this would improve it" was slide 8, by turning three prose cards into a matrix with tiers as columns and explicit criteria as rows. The evaluator noted that per-criterion values would partly be the author's inference and would need support. Slide 9 was correctly kept away from Time series because release notes are not a measured series. Slide 4 was already in the comparison form, so Kata would change nothing. The evaluator also noticed that the deck's HTML comments mislabel the slide numbers.

Reviewer: agrees on all ten. The distinction drawn on slide 4 between a trade-off matrix and a glossary table is a useful one that Kata does not make.

### square.html (10 slides)

| Slide | Verdict | Gap named |
| --- | --- | --- |
| 1 FREE//FALL | not applicable | none |
| 2 Year 2048 (two cards) | adapt: Aligned comparison, only if criteria are supplied | scene-setting lead |
| 3 Deniable Asset | not applicable | thesis plus key points |
| 4 Action Pool | split: key number / TN scale lookup / special rules | stat callout; ordered scale lookup; mechanic explainer |
| 5 Harm & Consequences | reject | state list with consequences; rule illustration |
| 6 Three Principles | reject | enumerated peer cards |
| 7 Why FREE//FALL? | adapt: Aligned comparison, only with competitor data; else reject | differentiators list |
| 8 The Playtest | reject | ask-and-offer two-sided list |
| 9 What We Need | adapt: Golden cut, marginal | single key number with context |
| 10 Closing | not applicable | closing |

Evaluator summary: the only deck that is a real pitch rather than a Lys demo. No slide earned a clean `pattern` verdict. The most useful Kata advice was "separate questions into slides" for slides 4 and 9, not any visual pattern. The evaluator stopped after slide 7 on its first pass and completed the remaining three slides and the summary when prompted.

Reviewer: agrees on all ten. The reviewer had independently flagged slide 2 as a two-way comparison, slide 4's TN table as an ordered scale with no Kata home, and slide 9 as a Golden cut candidate. The evaluator reached the same three conclusions with appropriate hedging.

### themed.html (6 slides)

| Slide | Verdict | Gap named |
| --- | --- | --- |
| 1 ASDLC | not applicable | none |
| 2 What is ASDLC? | reject | definition / claim plus points |
| 3 The Workflow (Spec → Plan → Implement → Verify → Ship) | adapt: Directed dependencies as a linear chain, marginal | process/lifecycle, including cyclic with per-step inputs and outputs |
| 4 Spec as Contract | not applicable | code or artifact sample |
| 5 Benefits | reject | claims list; before/after comparison |
| 6 Closing | not applicable | quote; closing with link |

Evaluator summary: a conceptual explainer, not a feature demo. Kata served one slide. On slide 3 the evaluator noticed that the speaker notes describe a feedback cycle from Ship back to Spec that the diagram omits, and cited the rule in `relationship.md` that a cycle must stay explicit rather than be silently deleted. It also asked for the arrow meaning to be stated and for a text equivalent of the boxes.

Reviewer: agrees on all six. This was the strongest single evaluation. The cycle observation is the kind of fidelity catch Kata is designed to produce, and the evaluator found it by reading the notes, not just the visible slide.

## Aggregate

Verdict counts across 42 slides:

| Verdict | Count |
| --- | --- |
| not applicable | 24 |
| reject | 8 |
| adapt | 8 |
| split | 1 |
| pattern (already in form) | 1 |

Of the eight `adapt` verdicts, one was judged a real improvement (full.html slide 8), six were judged marginal, and one was conditional on data the slide does not contain (square.html slide 7).

Catalogue gaps named, by number of slides:

| Gap | Slides | Notes |
| --- | --- | --- |
| Title or closing slide | 12 | Outside Kata's stated scope. No evaluator thought Kata should cover it. |
| Flat key-points, feature, benefits or principles list | 11 | The commonest shape in every deck. Kata correctly refuses to force a pattern but offers no positive guidance. |
| Code or artifact sample | 6 | Three evaluators independently said a diagram of the code would replace the thing being taught. |
| Process, steps, ladder or lifecycle | 4 | See the inconsistency below. |
| Reference, glossary or lookup table | 4 | Distinct from a comparison matrix: rows are entries, not options; no decision is made. |
| Single key number or stat callout | 3 | Golden cut covers it only by analogy. |
| Quote or callout with supporting points | 2 | Golden cut nearly fits; priority must be agreed. |
| Enumerated peer cards | 2 | Equal-weight grids already respect Kata's own warning against implied priority. |
| Changelog | 1 | Correctly kept away from Time series. |
| State or category list with consequences | 1 | |

## Findings

### 1. Pattern discernment

Across all 42 slides the evaluators found no slide that should have used a Kata pattern and did not. The one slide where a pattern was judged to clearly help (full.html slide 8, the three-tier progressive enhancement cards) is a case where the slide already uses the right form, a side-by-side comparison, but with prose cells instead of aligned criteria. Every other candidate was marginal or conditional.

The reason is content, not the catalogue. The Lys examples are documentation of a renderer and one narrative pitch. They contain no totals with parts, no time series, no rooted hierarchies and one dependency chain. Kata's six patterns all encode a data relationship, and the decks have almost none. Four of the six evaluators said this explicitly and unprompted.

### 2. Evaluator sensibility

The clean-context evaluators reached sensible answers on 41 of 42 slides, judged against the reviewer's independent read. They did not force patterns, they cited the specific failure conditions in the references, and they preferred `reject` and `split` over invented structure. Three evaluators independently flagged the same misapplication risk, which suggests the skill's prohibitions on inventing structure are being read and applied.

The one weak verdict is demo.html slide 4. Its content is nearly identical to full.html slide 8 (the three progressive enhancement tiers). The demo.html evaluator proposed Directed dependencies or Nested groups; the full.html evaluator proposed Aligned comparison and explicitly rejected Directed dependencies because "must finish before" is not the relation. The reviewer agrees with the full.html evaluator. The demo.html evaluator hedged correctly (marginal, medium confidence, edge meaning unstated) but still reached for the wrong pattern first. Two agents given the same guidance and near-identical content chose different patterns, which points at a gap in Kata rather than at either agent.

Two process observations. One evaluator stopped at slide 7 of 10 and had to be prompted to finish, so a run that collects a single hand-back can silently lose the tail of a deck. And every evaluator produced a long, fully hedged report; none produced a short "nothing applies" answer when that was the honest result, which is a prompt-design cost, not a Kata cost.

### 3. Strongest catches

Three verdicts show Kata doing what it is for:

- themed.html slide 3: the speaker notes describe a Ship → Spec feedback loop that the diagram drops. `relationship.md` says cycles must stay explicit. The evaluator found it by reading the notes.
- full.html slide 9: release notes look like a timeline, and the evaluator refused Time series because there is no consistently defined measure.
- square.html slide 4: a slide mixing a key number, an ordered lookup table and two special-case rules. The most useful advice was to split it, which comes from `SKILL.md` rather than any pattern.

## Implications for Kata

These are observations for the Kata project, not changes made in this repository.

- **Cumulative tiers or levels** is the one relationship-shaped gap that produced contradictory verdicts between evaluators. It is neither a comparison (the tiers are ordered and each contains the last) nor a dependency (nothing "must finish before"). A note in `comparison.md` covering ordered or cumulative options, or a short seventh reference, would remove the ambiguity.
- **Process versus dependency.** Four slides were sequential steps. `relationship.md` says what a dependency edge means but does not say what to do with a plain procedure. One sentence stating that an ordered procedure without prerequisite meaning should stay an ordered list would have settled nav.html slide 3 and themed.html slide 3 faster.
- **Lookup table versus comparison matrix.** `comparison.md` is written around decisions between options. Reference tables share its shape but not its purpose. A sentence distinguishing them would stop evaluators from labelling a glossary as a comparison.
- **Flat lists.** Eleven slides were qualitative claim lists. Kata's current answer is "name a better representation outside this catalogue", which is honest but gives the agent nothing to say. A short out-of-catalogue note (lists, code samples, quotes, key numbers, titles) with "leave as is, check density and reading order" guidance would reduce the hedging the evaluators produced on every one of them.
- **Golden cut and the single key number.** Two evaluators mapped a stat callout to Golden cut by analogy. The reference could say whether that is intended.

## Implications for Lys

- The example decks are not a test of Kata and should not be used as one. If Lys wants a deck that exercises Kata, it needs at least one slide each with a total and parts, a measured series, and options on shared criteria. The Kata repository's `examples/kata-lys.html` already is that deck.
- full.html slide 8 and demo.html slide 4 would both read better as an aligned matrix of tiers against features. This is a genuine improvement to the examples and would also give the Lys skill a worked instance of the one Kata pattern the decks can actually use.
- The HTML comments in full.html mislabel the slide numbers (the comment says "Slide 9: Closing" on the tenth article).
- themed.html slide 3 omits the feedback loop that its own notes describe.

## Limits

Single run per deck, one model, no temperature variation, no rendered-output inspection, no human readers. Verdicts are agent judgments cross-checked by one reviewer who is also a model. The reviewer's independent read was formed before the reports arrived but was not blind to the slides' authorship context. One evaluator required a follow-up prompt to complete its deck. None of this measures whether a Kata-shaped slide is understood better by anyone.
