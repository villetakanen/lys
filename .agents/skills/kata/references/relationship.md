# Directed dependencies

**Form:** Named entities connected by a defined relation. **Audience question:** What must happen before what?

Use a small directed diagram when prerequisite structure matters. Use a timeline when dates or durations are the question. Use a matrix or several focused views for a dense network. Keep direction and edge meaning explicit; data flow, ownership, influence, and prerequisite are different relations.

## Structure

For prerequisite edges, put prerequisites on the left and dependent work on the right. State that an arrow means “must finish before.” Route connectors so endpoints are unambiguous. Preserve forks and joins. Do not imply that horizontal distance means duration. Label different edge types individually if they must coexist.

## Worked example

Fictional service launch. The launch lead needs to explain readiness prerequisites.

- Research must finish before Design.
- Design must finish before Build.
- Build must finish before Launch.
- Compliance must finish before Launch.

**Before:** A list of these four rules.

**After headline:** “Launch requires both Build and Compliance”

**After layout:** Research, Design, Build, and Launch run left to right. Compliance sits on a separate lower branch with its own arrow into Launch. State the edge meaning and “Spacing does not represent duration.” The final join retains two independent prerequisites.

## Rationale and limits

Design judgment: continuous paths make the prerequisite chain traceable. Good continuation is a Gestalt analogy, not proof of easier comprehension. The lower branch is a separate prerequisite, not a later phase. No durations or slack are supplied, so the diagram cannot identify a critical path or a bottleneck.

**Check:** All four source edges survive; no connector merely passes through a box that could look like another dependency. A cycle should remain explicit and trigger a question about its meaning, not be silently deleted.
