# Combining Kata with a renderer and a brand

The first iteration uses three separate responsibilities:

| Layer | Owns | Example |
| --- | --- | --- |
| Kata | Message, relationships, encoding, reading order | A comparison matrix with common rows |
| Lys or another renderer | Output, navigation, sizing, notes, print behavior | Semantic HTML articles in a Lys deck |
| Optional brand skill | Visual identity | Approved typography and palette |

These are composition guidelines, not an adapter API. There is no separate `kata-lys` package yet.

## Lys

Read the available Lys instructions when producing a deck. The locally inspected Lys 1.2.1 contract uses a `div` with `data-lys` containing direct `article` children. Give each slide a heading and useful `data-notes`. Keep Kata's layout inside the article. Include the renderer CSS and JavaScript according to its packaging instructions, followed by the theme's CSS overrides. Use public `--lys-*` tokens; leave internal state attributes to Lys.

A dependency chart can be inline SVG with a title and text description. A comparison should remain a semantic table. Charts should retain their values in text or an accessible data table. A no-JavaScript view must still expose the slide content. Check both navigation and print output after integration.

The repository's `examples/kata-lys.html` is a working single-file specimen with ten slides: a before and after for each form. It bundles the locally available Lys build; it does not fetch a CDN resource at runtime. `examples/index.html` offers a scrollable comparison gallery. These are repository review artifacts and are not required when installing just this skill folder.

The specimen uses Lys's direct transition mode. A small chapter-navigation listener routes local anchor clicks through the public `Lys.Lys.from(element).goTo(id)` API so the active slide, accessibility state, and subsequent arrow-key navigation agree. Plain anchors remain usable without JavaScript. The vendored runtime itself is unchanged.

## Brand skills

If a Futurice brand skill is supplied, read and apply it. This repository does not contain or verify Futurice assets, tokens, or rules. Do not label a neutral example as on-brand. Keep the data's grouping and scales intact while changing the visual identity. If a brand palette cannot distinguish adjacent segments, retain explicit labels and boundaries instead of relying on hue.

## Example requests

“Use Kata to compare these three suppliers for the procurement team. Cost and delivery time matter, but don't choose a winner.”

“Use Kata with Lys to show how this budget is allocated. Apply the attached brand skill.”

“Improve this slide's structure using Kata. Preserve the supplied figures and explain the choice of pattern.”
