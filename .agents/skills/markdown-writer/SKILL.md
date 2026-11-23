---
name: markdown-writer
description: "Add OKF trust front matter (generated, verified) when writing Markdown or MDX in this repository. Apply whenever creating or editing any .md or .mdx file."
---

# Markdown Writer

Apply this whenever you create or edit a Markdown (`.md`) or MDX (`.mdx`) file in this repository.

## Rule

If the document has no front matter, add this block as the very first lines of the file:

```yaml
---
generated:
  by: "<harness>/<model-id>"
  at: "<ISO 8601 datetime with UTC offset>"
---
```

- `generated.by` — the producer that wrote this revision. For an agent, the harness and the actual runtime model identifier, `<harness>/<model-id>`. Read both from your runtime; never copy a name from an example or hardcode one. A person is `human:<id>`; a script is `process:<id>`.
- `generated.at` — when it was written, with an explicit offset, for example `2026-11-23T13:11:45+02:00` (`date -Iseconds`).

Add `verified` only after a human has actually read and confirmed the document and gives their identity and date. Never pre-fill or infer it:

```yaml
verified:
  - by: "human:<id>"
    at: "<ISO 8601 date or datetime>"
```

Further verifications append entries to the list.

## Boundaries

- Only these two OKF fields. No title, tags, status, description, or other keys; date, versions, and scope belong in the body.
- A document that already has front matter keeps it unchanged. Do not merge these fields into front matter owned by other tooling, such as a skill's `name`/`description`.
- Do not edit vendored or generated Markdown to add front matter: the vendored Kata skill and the build-generated `skill/` output. Change their sources instead.
- `CLAUDE.md` is a symlink to `AGENTS.md`; edit `AGENTS.md`.

## Commit check

Pre-commit runs `node scripts/check-frontmatter.js`, which lists every tracked Markdown/MDX file without a `generated` field and prints the total. It only warns and never blocks a commit. Missing front matter in existing files is acceptable; add it when you write that file.
