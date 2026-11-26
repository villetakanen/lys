---
name: write-spec
description: Create or amend a living feature spec, resolve questions about expected behaviour, or propose how to organise a repository’s specs.
generated:
  by: openai-codex/gpt-6
  at: "2026-11-26T08:34:32Z"
verified: []
---

# Write a living spec

A living spec tells a reader what one feature is for and how it should behave.

## Decide what to write

Read the request, the governing spec and its neighbours, and enough of the implementation to understand what happens today.

- When the user changes the expected behaviour, amend the existing spec in place. If the spec already covers the request, point to the relevant passage.
- For a new feature, start from [the template](template.md) at `specs/<feature>/spec.md`. Use a kebab-case directory name. Ask before adding a new top-level node to an existing tree.
- When the code and spec disagree and intent is unclear, give a concrete example that distinguishes the outcomes. Ask which is intended. Preserve the disputed text and code until the user decides. Leave unsettled new rules unwritten.
- When asked how to organise a repository’s specs, use the [guide to organising specs](references/spec-tree.md). Propose paths and explain what each spec would cover. Create the files once the user approves the layout.

## Write the spec

Use the feature name as the title. Follow it with these three level-two headings in order, even for a small feature.

- **Context** explains who needs the feature and what they are trying to do. One sentence often suffices.
- **Blueprint** states how the feature behaves. Put its rules, limits and exceptions here so a reader can find them directly. A single rule can be the whole Blueprint. Describe responsibilities and link to code or schemas when that helps explain the behaviour.
- **Scenarios** illustrates those rules in one fenced `gherkin` block. Start with `Feature:` and repeat the spec title exactly. Give each `Scenario:` a name, a starting condition (`Given`), an action or event (`When`) and an observable outcome (`Then`). Keep boundary examples that show what happens at or beyond a limit.

Use the brief, governing spec and explicit decisions to establish expected behaviour. If an outcome depends on an assumption, put the question in the handover. Keep acceptance criteria, checkboxes, task lists and test instructions out of specs. When amending behaviour in an older spec, carry its distinct promises from prose, checklists and guardrails into the new structure.

Split out a part when it can change independently. Link parent and child both ways. Use the [guide to splitting specs](references/splitting.md) for child specs and bulky attachments.

## Record and hand over the change

Spec frontmatter contains only `generated` and `verified`. For a substantive edit, including a rewrite from an older format into rules and examples, record the actual producer and current RFC 3339 time. Formatting and link repairs preserve generation metadata. Use the same provenance on written proposals and Markdown attachments.

A new spec starts with `verified: []`. When editing an existing spec, carry its latest human check into `verified`, including one recorded under the older `reviewed_by` field. Use `by: human:<id>` and keep the original date precision. A new human check replaces that entry. It covers the text only when dated at or after generation. Report gaps in attribution.

Run host checks. Identify the changed spec, any open decision and text awaiting verification. Implementation requires explicit authorization. When implementing an agreed behaviour change, include its spec amendment in the same commit.
