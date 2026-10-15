# Directed dependencies

**Scope:** This reference preserves the existing form and worked specimen.
Use it to arrange supplied dependencies only when the entities and edge
meaning are already provided. Structure notes describe the specimen's
constraints; they do not authorize deriving edges, changing their meaning, or
splitting content without the content author's direction. For shared checks,
see [layout assessment](layout-assessment.md).

**Form:** Named entities connected by a defined relation. **Audience question:** What must happen before what?

The retained examples use a small directed diagram for supplied prerequisite relations. Dates, durations, or a dense network may constrain how legibly the supplied content fits. Keep the supplied edge meaning explicit: data flow, ownership, influence, and prerequisite are different relations. Do not convert between them or split the network without the content author's direction.

## Structure

In the prerequisite specimen, prerequisites sit left of dependent work, the arrow meaning is stated, and connector endpoints, forks, and joins remain clear. Horizontal distance does not imply duration. Preserve supplied edge types and meanings.

## Retained worked example (historical)

Fictional service launch. The launch lead needs to explain readiness prerequisites.

- Research must finish before Design.
- Design must finish before Build.
- Build must finish before Launch.
- Compliance must finish before Launch.

**Before:** A list of these four rules.

**After headline (historical):** “Launch requires both Build and Compliance”

**After layout:** The historical specimen arranges the supplied prerequisites left to right, with Compliance on a separate branch. The annotation clarifies edge meaning and that spacing does not represent duration. These are retained example choices, not instructions to infer relations.

## Rationale and limits

Design judgment: continuous paths make the prerequisite chain traceable. Good continuation is a Gestalt analogy, not proof of easier comprehension. The lower branch is a separate prerequisite, not a later phase. No durations or slack are supplied, so the diagram cannot identify a critical path or a bottleneck.

**Check:** All four source edges survive; no connector merely passes through a box that could look like another dependency. A cycle should remain explicit and trigger a question about its meaning, not be silently deleted.
