# Render the composition

Kata chooses composition. Use the renderer's authoring guidance for document
structure, packaging and behavior. A supplied brand owns identity; Kata can
choose restraint, balance and emphasis within it. Without a brand, choose a
cohesive readable theme. Kata's own example styling is not required.

## Using Lys

Read the available Lys authoring skill. The tested Lys 1.2.1 structure is a `div`
with `data-lys` containing direct `article` children. Use semantic headings,
paragraphs, lists, figures and tables. Give slides IDs, headings and useful
`data-notes` about the supplied content. Keep layout rationale and implementation
instructions outside speaker notes. Preserve supplied wording and slide order.

For standalone HTML, inline the supplied Lys stylesheet and runtime and any
used images/fonts, retaining required notices. Never depend on a relative font
path, CDN or repository stylesheet in the delivered file. Use public `--lys-*`
tokens and put theme overrides after renderer CSS. Leave internal state
attributes and `--_lys-*` tokens to Lys.

Use flexible grids: `minmax(0, 1fr)` avoids long text forcing a column wider than
its share. Give grid children `min-width: 0`. Prefer a few purposeful compositions
over identical cards on every slide.

## Presentation and reading modes

Choose a readable 16:9 composition unless the brief says otherwise. Account for
navigation and margins in the usable height. In short or narrow windows, switch
to a scrolling document with natural content height. Make that the default
without JavaScript too. Keep useful text sizes instead of scaling the canvas down.

With stacked Lys slides (`data-transition="direct"`), changing CSS alone leaves
inactive slides hidden from accessibility tools. Destroy the Lys instance in
reading mode and recreate it on return to presentation mode. After the supplied
runtime initializes, for example:

```js
const surface = document.querySelector('[data-lys]');
const reading = matchMedia('(max-width: 900px), (max-height: 560px)');
function adapt() {
  if (reading.matches) Lys.Lys.from(surface).destroy();
  else Lys.Lys.from(surface);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', adapt, { once: true });
} else adapt();
reading.addEventListener('change', adapt);
```

This behavior example needs matching natural-height CSS for that media query.
A presentation-only class set by the adapter can make reading the default without
JavaScript. Use a **screen** condition for reading CSS; print needs a separate
page-sized layout. Restore every slide in print, hide navigation, use one page per
slide, and inspect the PDF. Do not let a narrow print viewport trigger phone styles.

Put optional navigation outside the composition. In presentation mode, route
slide links through `Lys.Lys.from(surface).goTo(id)` so visual and accessibility
state agree. In reading mode use ordinary anchors. Keep controls keyboard reachable
with visible focus. On resize, preserve the current slide where practical.

## Check the delivered file

Open the copied standalone file with no network access. Inspect **every** slide
at a presentation viewport such as 1440×900 and a phone viewport such as 390×844.
Check content and intended emphasis. Look for clipping, overlap, excessive wrapping,
broken images and text too small to read.

Use ArrowLeft/ArrowRight, Home/End and Tab where supported. Disable JavaScript and
confirm all content is readable. Print to PDF and inspect each page, including
long qualifications. Resize between reading and presentation modes and verify
all content stays reachable. Structural checks support visual review, not replace it.

Report the sizes and modes actually checked. If a renderer cannot meet a required
mode, state the limitation and deliver a usable fallback rather than claiming
unperformed verification.
