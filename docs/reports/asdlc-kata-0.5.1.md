# ASDLC example identity and composition

17 October 2026

The six-slide ASDLC example has been rebuilt from the current site and its Avionics design identity. It retains the existing 16:9 Lys surface and scroll-snap navigation. Kata 0.5.1 was applied as delivered, with no edits to its gateway, forms, practices or integration guidance.

- [Built standalone deck](../../site/examples/themed.html)
- [Maintained source](../../examples/themed.html)
- [Authored content record](asdlc-kata-0.5.1-content.json)
- [Verification record](asdlc-kata-0.5.1-checks.json)

## Identity and content sources

The [Avionics design system](https://asdlc.io/resources/design-system/) describes a Timeless Industrial identity informed by equipment, packaging and flight manuals. Its declared tokens and the live homepage stylesheet agree on warm paper `#f4f4f0`, surface grey `#ebebe6`, toner black `#111111`, secondary grey `#585855` and safety orange `#f04e30`. Archivo supplies the sans-serif text and expanded uppercase headings; B612 Mono supplies technical labels and code.

The deck adapts those choices to a static presentation. Orange primarily marks the upper edge and wordmark. Rules distinguish rows; the code sample uses the surface grey. Main text stays black on paper, with a black closing slide. The website's responsive grid is not imported into the slide composition.

The [homepage](https://asdlc.io/) and [Getting Started guide](https://asdlc.io/getting-started/) replace the old expansion “Agent-Spec-Driven Lifecycle” with **Agentic Software Development Lifecycle**. The content also reflects the distinction between a durable [Spec](https://asdlc.io/patterns/the-spec/) and a transient [PBI](https://asdlc.io/patterns/the-pbi/). The Spec article's explicit qualification is retained: specs capture intent and constraints; code remains authoritative for runtime logic. The [Context Gates](https://asdlc.io/patterns/context-gates/) article's **Experimental** status remains visible with its three output-gate tiers.

The old claims of eliminating ambiguity and deterministic agent output are not repeated. The new copy describes responsibilities, artifacts and checks without promising infallible generation. The workflow is the introductory sequence explicitly supplied by Getting Started. Its speaker notes explain that review can return work for correction and discoveries can update the spec.

The public repository was inspected at commit `73b2bd7096cf612fc730501f5a300d0e3cf62b4b`, including its design specification and MIT license. Required source and font notices are embedded in the HTML. Archivo's variable font is embedded; B612 Mono uses a Google Fonts subset covering ASCII and the punctuation used here. Additional writing systems would need corresponding font coverage.

## Applying the existing Kata skill

The authored copy, table, code outline, workflow and slide boundaries were recorded before composing the deck. Selecting and adapting the source material was authoring work. Kata governed scale, placement, grouping, emphasis and space around those representations.

The intended setting is a laptop, desktop or shared-screen introduction, composed and reviewed at **1280×720**. Main informational headings are about **34 px**, ordinary text about **19–24 px**, and the code sample about **17 px** at that size. These are choices for this material and surface, not new Kata rules or universal readability thresholds. The cover and closing use larger type because each gives one subject the main emphasis.

| Item | Applied practice and chosen arrangement | Considered alternative and trade-off |
| --- | --- | --- |
| Opening | **One focus**, with a common left edge and open space around the title group. The subtitle and human/agent context remain subordinate. | A centred composition would be quieter; the left edge better matches the site's introductory reading style and accommodates the long subject. |
| Operating model | Keep the supplied three-layer **table** intact. Align layer, function and human role in rows, with a modest heading and caption next to the table. | Three panels would break the supplied table into separate objects and make its column associations harder to inspect. |
| State and change | **Equal peers** gives Spec and PBI matching heading scales and widths. The illustrative code outline stays with the Spec; a shared qualification sits below both fields. | Stacked rows would give longer measures but spend more height. The shallow grey code background distinguishes representation without turning the Spec into a preferred choice. |
| Gates | **Equal rows** give the three questions comparable treatment. Each tier retains its type and explanation; the experimental qualification follows the group. | Three narrow columns would wrap questions and explanations more heavily. Enlarging the tier labels further would compete with the questions. |
| First change | Compose the **authored workflow** as one figure, with its caption immediately below and two supporting paragraphs further down. The heading identifies the figure without dominating it. | A stacked sequence would use more height. No additional steps, branches or claims were invented to elaborate the diagram. |
| Closing | **One focus**, using the skill's quieter centred arrangement. The guide link follows the subject and its short context. | Reusing the cover's strong left edge would retain alignment but lose the deliberate centred pause chosen for this individual item. |

These are design judgments about the visible result. The existing skill already calls for modest headings, deliberate visual weight, restraint and meaningful alternatives. This application uses those instructions directly. Passing structural checks is not an aesthetic approval, and no reader-comprehension improvement is claimed.

## Lys behaviour and verification

The example retains **16:9**, the **400 ms transition token**, keyboard navigation, native horizontal-swipe handling, URL routing, focus and accessibility state, subject notes, JavaScript-free viewing and print. As in the previous themed example, it uses scroll-snap mode; the presence of a duration token does not enable fade transitions. There is no custom interaction code.

The built HTML embeds Lys 1.2.5 and its fonts. The browser checks block external requests and verify loaded fonts, exact authored text and notes, navigation state, and the absence of external script or stylesheet dependencies. The existing library's touch implementation is retained; this task did not test physical touch gestures.

The focused browser suite passed **41 tests**, with **4 expected skips** for Chromium-only native PDF export. Fit and fixed 16:9 geometry were checked in Chromium, Firefox and WebKit at **1280×720**, **1440×900**, **390×844** and **844×390**, with JavaScript both enabled and disabled. This checks scaling and containment; portrait-phone body text remains small.

All six compositions were visually inspected at 1280×720, with phone portrait and landscape samples and CSS-only output. The changed example listing was inspected at desktop and phone sizes and its ASDLC link opened the rebuilt deck. The existing documentation tables outside that listing were outside this change.

Chromium exported six **960×540 point** pages with and without JavaScript. All pages were rendered for visual inspection, and extracted text was checked against the authored titles and content. PDF inspection caught a browser focus outline at the page edges; the author stylesheet now suppresses that outline only in print. The regression checks the outline and page geometry.

No physical display-distance trial, screen-reader audit or native Firefox/Safari print-dialog export was performed. The type sizes and spatial choices remain open to owner review.

![Six final printed slides](asdlc-kata-0.5.1-pages.png)
