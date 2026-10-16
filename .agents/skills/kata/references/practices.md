# Kata practices

These practices help people and agents choose, adapt and inspect the
[forms](composition.md). Start with what the item should communicate and how it
should feel. The arrangement expresses relationships already present in the brief
or supplied material.

## Compose a static surface

Choose placement, scale and space for one specified surface. A different authored
surface can call for a separate composition. Viewport changes do not instruct
Kata to switch arrangements, stack fields or create a reading mode. The renderer
owns scaling and viewing behavior.

## Choose with a reason

Identify the subject, any authored priority, the subjects that deserve comparable
consideration, and the context that belongs with each. A recommendation comes
from the author. A caption's association with its image is part of its meaning.
Ask when a missing intention or relationship would materially change the result;
ordinary spacing, alignment and proportion are compositional decisions to resolve.

Read the relevant form's examples and limits. Compare a meaningful alternative:
what would a different scale, placement, grouping or amount of space communicate?
A familiar arrangement is useful when the reason fits. Retaining an existing
arrangement can also be a deliberate choice. Combine forms when needed; their
names need not cover every possible composition.

## Preserve authored material

Preserve supplied wording, quantities, uncertainty and associations. Within the
authored composition, line breaks and typography can change. Do not add a headline, shorten a sentence,
select a winner, or convert prose into a process to obtain a stronger composition.

Treat charts, tables, diagrams and code as authored content. Compose them with
their surroundings while preserving internal representation, labels, scales and
aspect ratio. A supplied table remains a table. Arrange already-stated prose
alternatives in peer fields without inventing criteria or relationships.

The practices below distinguish **meaning to preserve** from **placement defaults**.
A useful default can yield to the brief, an established publication convention or
a better arrangement. Preserving a qualification or its association is essential.

## Keep captions with their subjects

**Meaning to preserve.** It should be clear which subject a caption describes.
Treat the subject and caption as a group, with less space between them than between
unrelated groups. Keep a supplied attribution or source associated with that group.

**Placement default.** Put a supplied image caption below the image, aligned with
its reading edge. Place a supplied table caption adjacent to its table; below is
a starting point when no publication convention or existing treatment says otherwise.
An identifying title may sit above. Avoid an empty strip between a subject and
its caption that is larger than the gap to the next subject.

**Useful alternative.** A caption beside a subject can use available width and
preserve a larger image. Put it at the reading end where practical: to the right
in a left-to-right horizontal reading context, to the left in the reverse context.
Choose for the actual reading order and available space. Keep both close enough
that the association remains apparent.

For example, keep a supplied photograph and “Entrance after renovation” together
in either a column arrangement or a separately authored row arrangement. Read
image, caption, next image, next caption; do not collect captions beneath unrelated
images.

An informative image or table may need identifying context. If required context
is absent, identify what is missing rather than writing it. An already sufficient
title or surrounding explanation can serve that role. A decorative image does
not need an invented caption merely to satisfy a layout rule.

## Keep labels, units and qualifications attached

**Meaning to preserve.** A number needs the supplied information that tells the
reader what it measures, its unit and any condition that limits it. Keep a label
or qualification attached to the specific value or claim it describes. Preserve
all words in phrases such as “nearly 90%”; emphasis must not obscure the qualifier.

**Placement default.** Group a prominent number with its supplied label directly
beneath or beside it. Keep essential conditions in that same group, at a readable
scale. A shared qualification belongs near the whole group it covers. Units inside
a chart or table remain part of that authored representation.

For this fictional supplied material, “42” is the lead, “registered participants”
identifies it, and “Provisional count · 12 May” qualifies it:

```text
42
registered participants
Provisional count · 12 May
```

The number can be largest. Its meaning and status remain available together.
Moving the last line to a distant recurring footer would weaken that association.
If a second number has a different qualification, give each its own group.

**Useful alternative.** Keep a value, label and qualification on one line when
brevity permits. Use matching groups for equal metrics. If text length makes the
relationship ambiguous, allow more space or use rows instead of reducing only the
qualification's type size. Never supply missing units, dates or certainty yourself.

## Give headings and footers a clear role

**Meaning to preserve.** A heading introduces the material it actually governs.
Keep supplied heading levels and relationships clear. A footer should not become
the only place where the audience can discover a condition on the main claim.

**Placement default.** Place a supplied heading at the reading start of its
content group and give it a consistent alignment. Its scale reflects its role:
an opening title may be the subject; on a decision slide, a modest heading may
let the supplied decision lead. Use stable positions for recurring page numbers,
credits or document identity, where supplied or required.

**Useful alternative.** A quiet centred title can serve [one focus](composition.md#one-focus).
A heading beside a content group can create dialogue when the relationship remains
clear. An existing chart title can identify that chart without a duplicate heading.
An item can be complete without a heading or footer. Do not invent either to fill
a template. Place new layout explanations outside the audience material.

## Refine and inspect

Establish a main alignment and the relationships between content fields. Then
inspect the actual result:

- **Hierarchy:** what attracts attention first, and does the source support it?
- **Proximity and alignment:** is it clear what belongs together? Do gaps or
  misaligned edges suggest relationships that were not intended?
- **Balance and tension:** are differences in visual weight deliberate? A dark
  image can outweigh a similarly sized text field.
- **Whitespace and restraint:** does space give presence or clarify relationships?
  Reduce it when essential material loses room to remain readable.
- **Fit and continuity:** check the longest text and smallest necessary labels.
  The arrangement must preserve associations, reading order and qualifications.

If content is too dense, first reduce excess spacing or use a more economical
arrangement. Keep support readable. If it still cannot fit, explain the constraint
and recommend separation. Preserve supplied slide boundaries and order unless the
author authorizes a change. Kata composes individual surfaces; it does not script
deck sequence, timing or narrative.

Use [rendering integration](integration.md) for the handoff to the renderer and
checks of the delivered artifact. Kata owns composition; a renderer owns output behavior and a supplied
brand owns identity. Expressive choices remain possible within brand constraints.
Slides are the tested medium; other surfaces require fresh visual verification.

Explain a consequential choice briefly: “Equal fields keep the choice open;
shared alignment makes the supplied details comparable, at the cost of shorter
lines.” Keep this explanation outside audience content and speaker notes. These
are design judgments. Specific claims about comprehension or psychology need
relevant research and its limits; a named principle or a natural analogy is not
evidence on its own.
