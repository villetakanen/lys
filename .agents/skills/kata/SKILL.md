---
name: kata
description: Choose, adapt, or reject slide patterns for an audience's question. Use when turning structured information into a clear slide or improving its visual structure. Works with a slide renderer and optional brand skill; does not plan a whole deck narrative.
---

# Kata

Start with the audience's question and the understanding or decision it supports. Identify the information relationship before choosing a visual structure. A slide may communicate a useful fact without making a recommendation.

## Choose a pattern

| Audience question | Pattern | Read |
| --- | --- | --- |
| How do these options differ on the same criteria? | Aligned comparison | [comparison](references/comparison.md) |
| What makes up this total? | Whole and parts | [composition](references/composition.md) |
| What belongs inside what? | Nested groups | [hierarchy](references/hierarchy.md) |
| What depends on what? | Directed dependencies | [relationship](references/relationship.md) |
| How did this measure change? | Time series | [change-over-time](references/change-over-time.md) |
| What is primary, with context beside it? | Asymmetric composition | [golden cut](references/golden-cut.md) |

Read the relevant reference. Check whether the source supports the relationship and whether the medium, density, and reading context keep it legible. Choose a pattern, adapt it, separate questions into slides, or name a better representation outside this catalogue. If none fits, say so and identify what missing information would change the choice. Do not score patterns or imply one wins apart from the purpose.

## Adapt to the information

Identify the audience question, the units and scope of the supplied data, and a supportable headline. Keep the headline within the evidence: an observed category is not “most common” or a winner when other categories were unrecorded; say when the records do not establish a ranking. Preserve missing values as unknown; distinguish them from zero. Ask for missing information when it changes the meaning, such as whether categories overlap or what a dependency arrow represents. Otherwise proceed with a stated assumption. Explain the consequential trade-off and retain values, units, scope, uncertainty, and caveats.

Keep labels, units, denominators, dates, uncertainty, and sources that affect interpretation. Do not invent measurements, causal explanations, option weights, or winners. The worked examples use fictional data and are layout specimens, not evidence to reuse in a real presentation.

Each reference includes a message, a layout, an example, a failure condition, and a rationale. The rationales are design judgments. Gestalt vocabulary supplies analogies, not proof that a layout is universally effective. When making empirical psychology claims, find and cite research supporting the particular claim.

## Render with the available tools

Kata owns the information structure and its reading order. The renderer owns slide behavior and output format. The brand skill owns typography, colors, imagery, and other visual identity. Preserve meaningful scales, grouping, and labels when applying a brand. The examples' cream and rust theme is replaceable and is not a Futurice theme.

For Lys, read [the integration note](references/integration.md) and use the available Lys skill or documented HTML contract. For another output format, use its authoring workflow. Kata works without Lys or a brand skill and does not install either. Only claim an integration was tested when the actual output has been inspected.

## Review the slide

Check whether a reader can answer the audience question from the visual without reconstructing the source prose. Check data fidelity, meaningful grouping, and the suggested reading order. Make numeric encodings proportional; do not use decorative size or area to imply magnitude. Inspect at presentation size for clipped text, unreadable labels, and connectors that imply the wrong relationship. Preserve a text equivalent for charts and diagrams, and use labels or shape as well as color.

Review the rendered deliverable in its intended reading contexts, including phone size when relevant. Structural validity does not establish readability: inspect the actual output for legible text, clipping, overflow, and labels and caveats that remain attached to their evidence. When fitting a narrow screen, reflow or stack content in reading order; do not shrink a desktop canvas until its text is unreadable. Simplify only when the values, units, uncertainty, and caveats that affect the answer remain visible. For Lys, inspect the rendered output at the supplied sizes, with no JavaScript and in print where supported; use the renderer's keyboard navigation. Record the sizes and modes reviewed, plus any gaps.

Keep the explanation of the selected pattern and consequential assumptions with the deliverable when useful.

Deliver the slide in the requested format. Include the chosen pattern and consequential assumptions in the accompanying explanation when useful; keep authoring instructions out of the audience's slide.
