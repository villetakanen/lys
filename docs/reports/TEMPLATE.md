---
generated:
  by: claude/fable-5.1
  at: 2026-10-12T15:30:00+03:00
verified:
  - by: human:ville.takanen
    at: 2026-10-12T16:00:00+03:00
---

# Report template

Reports in this directory carry [Open Knowledge Format](https://okf.md/spec/) trust fields in YAML frontmatter. Only the two fields below are used. Do not add others.

## `generated`

Required. Who produced the report and when.

| Key | Format |
| --- | --- |
| `by` | `<producer>/<version>` for a model (`claude/fable-5.1`), `human:<id>` for a person, `process:<id>` for a script |
| `at` | ISO 8601 datetime with explicit UTC offset, `2026-10-12T15:30:00+03:00` |

## `verified`

Omit entirely until a human has actually read and confirmed the report. Never pre-fill it. Once verified, a list of one or more entries using the same `by` and `at` conventions as `generated`.

## Body

The first line after the frontmatter is the `#` title. Put the date, versions and scope in the body prose, not in extra frontmatter keys.
