---
generated:
  by: openai-codex/gpt-6
  at: "2026-11-25T16:49:17Z"
verified: []
---

# Split a spec

Keep rules together when they describe one feature. A long spec is a reason to look for repetition or a part that changes independently. Its length alone does not decide the split.

For a part with its own behaviour, create `specs/<feature>/<child>/spec.md` from [the template](../template.md). Give it a purpose and move its rules and examples with it. Update the parent and child to link to each other where the relationship is explained. Check that each distinct outcome survives the move.

For bulky reference material, put the table, diagram or sample in `attachments/` beside the owning spec and link it from the relevant passage. When the code already owns a schema or configuration, link directly to that file. Use the spec’s provenance convention on Markdown and MDX attachments.
