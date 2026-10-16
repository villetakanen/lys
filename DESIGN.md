# Lys design

## Accepted colour palette

The primary Lys demo establishes this palette for Lys's own presentation
materials. The project owner accepted it on 16 October 2026 after reviewing the
Kata 0.5.0 redesign. The engine remains visually unopinionated: these are author
theme choices, not defaults imposed on presentations made with Lys.

| Colour | Value | Role |
| --- | --- | --- |
| Deep green | `#173b32` | Primary ink on light surfaces; dark surface for the opening, closing and code slides. |
| Warm paper | `#f3f0e7` | Main light surface; primary text on deep green. |
| Pale yellow-green | `#dce7ae` | Restrained accent for the fleur-de-lis and selected headings; an occasional full surface with deep-green text. |
| Dark backdrop | `#102822` | Frame around the presentation and background behind its controls. |

The intended character is calm, confident and warm. Deep green supplies visual
weight; warm paper gives the content a softer field than pure white; the pale
accent gives selected elements presence. The darker backdrop separates the
slide from its surroundings without adding a competing colour. These are design
judgments, not claims about measured psychological effects.

## Use the colours by role

Use deep-green text on warm paper for ordinary content, and warm-paper text on
deep green for dark compositions. Pale yellow-green works as an accent against
deep green or as a surface carrying deep-green text. Keep equivalent subjects
equivalent in colour treatment unless the content supplies a reason to favour
one. Colour supports the composition; it does not manufacture a recommendation.

Measured contrast ratios for solid, fully opaque pairs are:

| Pair | Contrast |
| --- | --- |
| Deep green and warm paper | 10.79:1 |
| Deep green and pale yellow-green | 9.42:1 |
| Dark backdrop and warm paper | 13.66:1 |

Pale yellow-green against warm paper has only 1.15:1 contrast. Use deep green for
text on either light surface. Recheck contrast when introducing other pairings,
transparency or overlays. Decorative rules and secondary neutrals may support
the palette, but do not use faint decoration as the only indication of meaning
or keyboard focus.

## Implementation and provenance

The palette was chosen specifically for the demo redesign, without an external
palette source. Kata supplied composition guidance; the palette belongs to Lys's
authored visual identity.

The current implementation is [examples/demo.html](examples/demo.html):
`--ink`, `--paper` and `--accent` are theme-local properties, and the public
`--lys-backdrop` token sets the frame. These theme-local names are not additions
to the engine's token API.

See the [migration report](docs/reports/kata-lys-migration-0.5.0-demo.md) for
before/after evidence and the composition and rendering checks performed during
the redesign.
