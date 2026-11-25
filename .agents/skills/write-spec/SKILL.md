---
name: write-spec
description: Create or amend a living feature spec, resolve questions about expected behaviour, or propose how to organise a repository’s specs.
generated:
  by: openai-codex/gpt-6
  at: "2026-11-25T16:49:17Z"
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

Use the feature name as the title. Open with a sentence explaining what the feature lets someone do. For a small feature, that sentence and one scenario can be the whole spec.

Add **Architecture** when a reader needs to know who owns a responsibility or how parts fit together. Link to code and schemas where they live. Add **Constraints** for limits and rules that apply throughout the feature.

Under **Scenarios**, put all examples in one fenced `gherkin` block. Start with `Feature:` and repeat the spec title exactly. Give each `Scenario:` a name, a starting condition (`Given`), an action or event (`When`) and an observable outcome (`Then`). Keep a boundary example when it explains what happens at or beyond a limit. The template shows both sides of a 20-row limit.

Use outcomes supported by the brief or an explicit decision. Keep acceptance criteria, checkboxes, task lists and test instructions out of specs. When amending an older spec, read each checklist item and guardrail for distinct promises. Carry those promises into constraints or scenario outcomes.

Split out a part when it can change independently. Link parent and child both ways. Use the [guide to splitting specs](references/splitting.md) for child specs and bulky attachments.

## Record and hand over the change

Spec frontmatter contains only `generated` and `verified`. For a substantive change, record the actual producer and current RFC 3339 time. Formatting and link repairs preserve generation metadata. Use the same provenance on written proposals and Markdown attachments.

Start with `verified: []`. A human source check replaces the previous entry. After an edit, retain the latest human check. It covers the text when dated at or after generation. For older records, keep the latest attributable human check, including its original date precision. Report gaps in attribution.

Run host checks. Identify the changed spec, any open decision and text awaiting verification. Implementation requires explicit authorization. When implementing an agreed behaviour change, include its spec amendment in the same commit.
