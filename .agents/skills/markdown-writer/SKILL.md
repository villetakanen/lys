---
name: markdown-writer
description: "Maintain OKF trust front matter (generated, verified) when writing Markdown or MDX in this repository. Apply whenever creating or editing any .md or .mdx file."
---

# Markdown Writer

Apply this whenever you create or edit a Markdown (`.md`) or MDX (`.mdx`) file in this repository. The fields follow the [Open Knowledge Format](https://okf.md/spec/): `generated` says who produced the current content; `verified` says which humans confirmed it.

## Rule

Every time you create or edit a document, set `generated` to yourself and the current time. If the document has no front matter, add the block as the very first lines of the file:

```yaml
---
generated:
  by: "<harness>/<model-id>"
  at: "<ISO 8601 datetime with UTC offset>"
---
```

If `generated` already exists, replace its `by` and `at` with the new values. `generated` is a single value describing the current content, not a change history; Git keeps the history.

- `generated.by` — the producer of this revision. For an agent, the harness and the actual runtime model identifier, `<harness>/<model-id>`. Read both from your runtime; never copy a name from an example or hardcode one.
- `generated.at` — when this revision was written, as a full datetime with an explicit offset, for example `2026-11-23T13:11:45+02:00` (`date -Iseconds`).

## Verification

`verified` records human confirmation only. Each entry's `by` is `human:<id>`; never add agent, model, `process:`, or CI entries.

```yaml
verified:
  - by: "human:<id>"
    at: "<ISO 8601 datetime with UTC offset>"
```

- Add an entry only after a human has actually read and confirmed the document and given their identity and time. Never pre-fill or infer it.
- `at` is a full datetime with an explicit offset, never a bare date.
- Keep existing entries when you edit. A verification counts only when its `at` is equal to or later than `generated.at`, so your edit makes earlier verifications stale until a human confirms again. Do not remove or re-date them.
- Further verifications append entries to the list.

## Boundaries

- Only these two OKF fields. No title, tags, status, description, or other keys; date, versions, and scope belong in the body. Keep any keys already present that you did not add.
- Do not merge these fields into front matter owned by other tooling, such as a skill's `name`/`description`.
- Do not edit vendored or generated Markdown to add front matter: the vendored Kata skill and the build-generated `skill/` output. Change their sources instead.
- `CLAUDE.md` is a symlink to `AGENTS.md`; edit `AGENTS.md`.

## Commit check

Pre-commit runs `node scripts/check-frontmatter.js`, which lists every tracked Markdown/MDX file without a `generated` field and prints the total. It only warns and never blocks a commit. Missing front matter in existing files is acceptable; add it when you next write that file.
