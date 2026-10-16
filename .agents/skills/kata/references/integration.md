# Render the composition

Kata composes one static surface. The renderer owns document structure, output,
scaling, navigation and print behavior. A supplied brand owns identity; Kata can
choose restraint, balance and emphasis within it. Without a brand, choose a
cohesive readable theme. Kata's own example styling is not required.

## Hand off to the renderer

Read and follow the available renderer authoring guidance. Compose within the
specified surface and aspect ratio, accounting for any reserved margins or
controls. A smaller viewing window does not authorize a new composition or a
viewing mode. Keep viewport-driven reflow and renderer lifecycle code out of
Kata's compositional instructions.

For Lys, use direct `article` children of a `div` with `data-lys`, semantic content,
slide IDs, headings and useful `data-notes` about the supplied subject. Keep layout
rationale outside speaker notes. Use public `--lys-*` tokens and leave internal
state to Lys. Lys fits the authored slide into the available viewport; retain
its aspect ratio and spatial relationships when it scales.

For standalone HTML, package the renderer, styles and assets according to its
authoring guidance, retaining required notices. Inline the supplied Lys stylesheet
and runtime and used images/fonts. Place theme overrides after renderer CSS. The
finished file must not depend on a CDN or repository-relative asset paths.

Use flexible grids such as `minmax(0, 1fr)` and `min-width: 0` to fit supplied
content inside the authored surface. These are composition tools, not instructions
to replace the layout at viewport breakpoints.

## Inspect the delivered artifact

Inspect every composition at its intended presentation size. Check emphasis,
associations, the longest text, clipping, overlap and readable labels. A phone or
short-window check verifies the renderer's scaling and navigation contract while
the authored composition remains intact. Report the practical limits of a scaled
view; do not invent reflow to satisfy the check.

Follow renderer guidance when checking keyboard/touch navigation, JavaScript-free
viewing, offline packaging and print. For Lys, verify that the same fixed-aspect
slides remain available with JavaScript disabled and that print shows one complete
slide per page. Inspect the PDF. Report the sizes and modes actually checked and
any remaining gaps. Structural checks support visual review, not replace it.
