---
generated:
  by: codex/gpt-6
  at: 2026-10-20T11:00:31+03:00
---

# Presentation and PDF viewer interaction conventions

Research date: 20 October 2026. Status: source-backed study for Lys 2.0 discussion; recommendations are not adopted contracts. Supports work item 1 in the [2.0 release plan](lys-2.0-release-plan.md).

## Question and method

Which established interactions should inform a predictable, accessible Lys engine, without taking over the composition or interactions inside authored slides?

This study combines the preceding presentation-tool research with PDF viewers: PowerPoint, Google Slides, Apple Keynote, Adobe Acrobat/Reader, Apple Preview, and the built-in Chrome and Firefox PDF viewers. These are representative familiar products, not a measured popularity ranking. Evidence is official vendor documentation, not hands-on testing or usability research. Sources were consulted on 19–20 October 2026; they do not establish an August 2026 historical snapshot or exact installed application versions. Platform and mode differences matter.

“Not documented here” means unverified, not unsupported. General viewer shortcuts must not be silently treated as slideshow shortcuts. Browser fullscreen, a PDF viewer's presentation mode, and ordinary document viewing are different states. Likewise, an application's editor is not its presentation mode.

## Presentation tools

| Product and mode | Documented keyboard behaviour | Pointer, touch, and chrome evidence |
| --- | --- | --- |
| PowerPoint, desktop slideshow | Right/Down, Space, Page Down, N advance an animation or slide; Left/Up, Page Up, P go back. Home/End on Windows; corresponding Mac shortcuts are documented separately. Number then Enter/Return jumps; Esc ends; B/W blanks. | Clicking a slide advances, possibly triggering an animation. Right-click offers navigation. Tab traverses slide hotspots and Enter activates a selected link. [Microsoft shortcuts][pp-keys], [navigation][pp-nav]. |
| Google Slides, desktop presentation | Right/Left, Home/End, number then Enter, Esc, B/W are explicitly documented. The cited presenting table does not establish Down/Up, Space, or Page Up/Down aliases. | Bottom arrows and a toolbar provide navigation and other actions. Android presentation instructions specify left/right swipes and an exit control. [Google shortcuts][gs-keys], [desktop][gs-present], [Android][gs-touch]. |
| Keynote, Mac presentation | Right/Down advance; Left/Up return. The play guide also documents Space for advancing. Home/End, a numeric slide switcher confirmed with Return, Esc, B/W, and keyboard help are documented. Builds can change what advancing means. | Configurable slideshow controls appear near the bottom when the pointer approaches. On iPad: tap advances, swipe right returns, touch-and-hold exposes controls, and pinch exits. A separate links-only mode limits navigation to links. [Apple shortcuts][kn-keys], [Mac playback][kn-play], [iPad playback][kn-touch], [navigation modes][kn-modes]. |

This establishes strong precedent for Right/Left and for supporting vertical-arrow aliases in presentation mode. It does not establish one universal list of aliases across all three products.

## PDF viewers: separate reading from presenting

| Product and context | Documented behaviour | Boundary relevant to Lys |
| --- | --- | --- |
| Acrobat/Reader, ordinary desktop document navigation | Up/Down scroll; Page Up/Down move by screen; Left/Right move between pages. Home/End reach document endpoints. Space also has hand-tool duties. | A screenful is not necessarily a page. Meaning depends on viewer state and active tool. [Adobe desktop shortcuts][ac-keys]. |
| Acrobat, Full Screen mode | Enter, Page Down, Down, or Right advance a page; Shift+Enter, Page Up, Up, or Left return. Esc exits when enabled in preferences. An optional lower-left bar supplies previous, next, and exit. Mouse preferences can assign left-click forward and right-click back. | Even a presentation convention may be configurable. Right-click navigation must not be assumed to coexist with the ordinary context menu. [Adobe fullscreen][ac-full]. |
| Preview, ordinary Mac viewing | Up/Down scroll a line or navigate sidebar items depending on context. Page Up/Down scroll a screen; Option+Up/Down change pages. | The same key belongs to content or chrome according to focus. [Apple Preview shortcuts][preview-keys]. |
| Preview, PDF slideshow | View > Slideshow starts it; bottom controls navigate pages or end it. The slideshow guide does not enumerate keyboard bindings. | Do not import ordinary Preview shortcuts into a slideshow contract without testing them. [Apple Preview slideshow][preview-show]. |
| Chrome, desktop PDF viewer | Official help describes page-fit/width and zoom controls. In caret browsing, enabled with F7, arrows navigate text and Shift+arrows select it after the PDF receives focus. | Arrows can be text-navigation commands. The reviewed help does not specify a complete PDF presentation-mode key map. Browser fullscreen alone is not evidence of page-navigation semantics. [Google PDF help][chrome-pdf]. |
| Chrome, Android PDF viewer | Scrolling moves through the file; pinching zooms; touch-and-hold selects text. | A pinch is a reading action here, unlike Keynote iPad's documented presentation exit. [Google Android PDF help][chrome-touch]. |
| Firefox, built-in PDF viewer | The general shortcut table lists Right/N/J for next page and Left/P/K for previous. It separately lists a presentation-mode command, text-selection and hand tools, and a page-number focus shortcut. The toolbar supplies page navigation, page entry, thumbnails, and zoom. | The general table does not completely specify presentation-mode exceptions, gesture handling, or focus rules. Those remain unverified. [Mozilla PDF viewer help][firefox-pdf]. |

The PDF comparison changes the framing: “Down means next” is established in presentation contexts, but not a safe global rule for every focused surface. Selection, forms, zoom, panning, and reading are legitimate operations, not accidental interruptions.

## Implications for Lys — design judgments

These are proposals inferred from the evidence and the agreed [vision](../../VISION.md), not findings about which interaction is empirically best.

1. **Keep both arrow pairs for the deck surface.** Right/Down for next and Left/Up for previous are defensible presentation conventions. Define focus and input ownership before dispatching those commands.
2. **Consider Page Up/Down and Space explicitly.** Page keys have presentation precedent but mean screen scrolling in document viewers. Space has advance, activation, and media/tool meanings. Shift+Space is not established by the presentation tables as a shared backward-slide convention; retain or remove it only by an explicit compatibility decision.
3. **Use a command model beneath input bindings.** Next, previous, first, last, and jump should have consistent outcomes whether triggered by keys, controls, or gestures. Lys currently has slides rather than incremental builds; do not import build semantics by accident.
4. **Protect content interaction.** Editable fields, buttons, links, media, selections, custom widgets, nested scroll areas, and browser/assistive-technology commands need explicit exclusions or integration rules. A tag-name blacklist alone is unlikely to describe every authored widget. Define an author escape hatch only after evaluating existing DOM event handling.
5. **Evaluate minimal engine-owned chrome.** Previous/next, position, and discoverable help could reduce repeated author invention. Compare a persistent bar, reveal-on-interaction controls, and author-supplied controls using the engine contract. None is selected by this study. Controls must remain usable with keyboard and touch, not rely solely on hover.
6. **Treat click/tap advancement as a product decision.** It has precedent, but conflicts with selection and interactive HTML unless carefully scoped. Right-click should retain browser expectations unless an explicit mode justifies otherwise.
7. **Define Escape by state.** Dismissing an engine overlay, leaving fullscreen, and ending a slideshow are different operations. A standalone HTML file has no editor to return to. Specify priority, focus restoration, and what happens when no dismissible state exists.
8. **Preserve browser zoom and gesture access.** The Keynote pinch-to-exit convention should not be copied into Lys by default. Browser zoom serves reading and accessibility. Horizontal swipe navigation needs exclusions for controls and scrolling; vertical scrolling belongs in the fallback contract.

PDF viewers provide evidence for state-aware input handling, not a reason to add a responsive reading mode or reflow authored slides. Lys's CSS-only fallback and intended enhanced presentation experience remain distinct.

## Discussion outcome — 20 October 2026

The owner endorsed the overview and the proposed order for developing the interaction contract:

1. Define commands: next, previous, first, last, and jump.
2. Define input ownership: deck surface, engine controls, authored interactive content, and browser.
3. Define bindings: keyboard, gestures, clicks, and scrolling.
4. Define chrome and exit states: discoverability, fullscreen, overlays, and leaving those states.

The guiding approach is familiar navigation with explicit input ownership. The comparison supports retaining both arrow pairs on the presentation surface. At this stage of the discussion, the exact binding table, default visible controls, click-to-advance, wheel behaviour, gesture thresholds, and focus restoration remained open. Subsequent decisions below supersede that initial status.

This records acceptance of the design approach, not independent human verification of every source claim or approval to implement all recommendations.

### Subsequent navigation decisions

- Mouse and touch clicks: no background click or tap navigation. Clicks and taps retain browser/content behaviour. Author-provided navigation buttons are outside the supported contract. This supersedes the earlier approval of click-to-advance after reconsidering browser expectations.
- Wheel and trackpad: downward scrolling advances and upward scrolling returns, across transition styles. In fade mode, navigation changes the slide with a fade rather than visibly scrolling. Input meaning must not depend on the transition style.
- Touch: swipe left advances and swipe right returns, regardless of transition style. Pinch zoom and authored interactive content retain their normal behaviour. Tapping the slide background does not navigate. Gesture recognition thresholds and conflict handling remain specification work.
- Scrollable content gets the scroll first; zoom gestures retain browser behaviour. Trackpad momentum must not cause accidental multiple advances. Do not map every wheel event to a slide command. Gesture boundaries, thresholds, and nested-scroll boundary handling still need formal specification and testing.
- For 2.0, next/previous navigate whole slides. Navigation stays on the current slide at either end; it does not wrap.
- Lys does not add focusability to ordinary slide contents. It preserves author-supplied focusability. When focus is inside authored interactive content, keyboard actions remain with the browser and the authored control rather than triggering deck navigation.
- Focus follows browser standards. Do not introduce a bespoke focus policy merely because a slide changes. Details of inactive-slide rendering and its effects on native focus remain specification work; no hiding mechanism or automatic focus transfer has been approved.
- Incremental reveals were explored, then explicitly removed from 2.0 scope by the owner because their complexity was growing. The exploration below is retained for future versions, not as an approved API or implementation requirement.

### Document model — approved 21 October 2026

One deck per HTML document is the product model. Multiple decks within one document are unsupported; no active-deck selection or arbitration between decks is needed.

### No-JavaScript fallback — approved 21 October 2026

JavaScript enhances presentation, not access to its content. Without JavaScript, Lys preserves access to the complete authored payload in document order through ordinary HTML and browser behaviour. This supports compatibility, accessibility, and agents reading the HTML. Presentation fidelity and enhanced interaction may degrade; permanently hidden or inaccessible clipped content is a fallback failure. Semantic HTML, links, and native controls remain usable. Authors supply meaningful fallbacks for their own JavaScript-dependent content; Lys cannot manufacture that payload.

### Geometry and authoring guidance — approved 21 October 2026

One aspect ratio applies to the whole deck. Lys fits the complete slide within the available viewport while preserving that ratio; remaining space belongs to the surrounding backdrop. Resizing changes the slide container, while author CSS controls its contents. Lys does not rearrange content or shrink text to make it fit.

Authoring guidance must teach positioning and sizing relative to the article, not merely list supported units. Provide a complete, verified recipe in the README and delivered authoring skill: percentage-based dimensions and positions with an explicit containing block, container-relative typography and spacing, Grid/Flexbox for relationships, and absolute positioning where explicit coordinates are intended. Explain that percentages resolve against the relevant containing block and container units against the eligible query container; nested layout or query containers can change that reference. Use cqw/cqh for physical width/height and explain logical units such as cqi where used. Avoid viewport units for slide-relative content because the viewport can include space outside the slide. Example values remain author choices, never engine defaults.

### Aspect ratios and required demos — approved 21 October 2026

Aspect-ratio contract approved 21 October 2026: default to 16:9; authors may select any valid positive aspect ratio, including square and portrait. One ratio applies to the entire deck and is preserved on screen and in print.

The shipped demo set must collectively cover default 16:9, ultra-wide 24:10, and portrait with iPhone-like proportions (9:19.5). These are coverage requirements, not three additional dedicated aspect-ratio demos: existing or planned feature demos may supply the coverage, and multiple demos may use the same ratio. For example, five decks may comprise three default, one ultra-wide, and one portrait deck. Each HTML document contains one deck with one ratio. Demonstrate slide-relative author styling and verify engine geometry across screen sizes and print; the portrait ratio is representative, not a device-specific compatibility claim.

### Transitions and reduced motion — approved 21 October 2026

Transition styles approved 21 October 2026: support none (immediate change), fade (crossfade), horizontal (left/right movement), and vertical (up/down movement). One style applies to the whole deck. Default to none; authors explicitly select motion. All styles retain the same navigation semantics, and the browser’s reduced-motion preference makes engine slide changes immediate. Exact configuration names remain specification work.

Transition and reduced-motion contract approved 21 October 2026: transition style changes only the visual movement between slides; navigation commands retain the same meaning in every style. When the browser’s reduced-motion preference is enabled, engine slide changes are immediate. This applies only to engine transitions; animation inside a slide remains author-owned.

### Embedding — approved 21 October 2026

Embedding decision approved 21 October 2026: support a complete Lys HTML document inside an iframe. The host controls the frame’s dimensions and URL through standard browser APIs; Lys fits the deck to the frame’s viewport. Each embedded document still contains one deck. No Lys-specific host-control protocol is in scope for 2.0. Parent-driven slide commands are a separate integration requirement, not implied by embedding support.

### Slide-list lifecycle — approved 21 October 2026

Slide-list lifecycle approved 21 October 2026: slide articles and their order are established when Lys initialises. Live addition, removal, or reordering of slides is outside 2.0 scope; loading an updated HTML document supplies the revised deck. This restriction concerns the slide list only. Interactive or changing content within a slide remains author-owned.

### Surface colour defaults — approved 21 October 2026

Surface colour defaults approved 21 October 2026: use CSS light-dark() for the surrounding backdrop, with a near-white blue-grey in light mode and a near-black blue-grey in dark mode. The slide surface defaults to white in light mode and black in dark mode; authors are expected to override its background. This is an explicit surface-background exception to the author-owned styling boundary, not permission to introduce internal spacing, typography, or foreground styling. Exact backdrop colour values and colour-scheme integration remain specification work.

### Metadata — approved 21 October 2026

Metadata scope approved 21 October 2026: Lys 2.0 has no engine-supported slide metadata contract. Titles, numbering, timing, and notes metadata are not required. Speaker-note display, timers, and presenter mode are outside scope. Authors may use ordinary HTML metadata, but Lys does not interpret it as presentation metadata. Existing metadata APIs and documentation must be reviewed for removal and migration as part of the major release.

### Overflow — approved 21 October 2026

Content extending beyond the slide boundary is an authoring error or intentional author styling. Lys preserves the slide geometry and does not automatically shrink, rearrange, or expand content to correct overflow. Lys does not inspect or validate in-slide composition, judge overflow, or distinguish intentional cropping from mistakes. Engine verification checks only that the slide boundary clips correctly and prevents content painting onto the backdrop. The slide is the final clipping frame: content may intentionally extend beyond its edges, but it must not paint onto the surrounding backdrop. For example, a heading positioned beyond the bottom or left edge may be deliberately cropped by the slide. This is valid composition, not an overflow defect; the slide boundary is not an author-overridable opening onto the backdrop.

### Print — approved 21 October 2026

Print and browser Save as PDF use one slide per page in document order. All slides print, regardless of the currently selected slide. Preserve slide proportions and authored composition, fitting the complete slide frame onto the printable page without additional cropping. Intentional clipping at the slide boundary is preserved. Printing uses the browser’s controls; Lys provides no export interface. Composition fidelity is part of portable delivery, unlike the permitted fidelity loss in the no-JavaScript viewing fallback.

### Keyboard bindings — approved 21 October 2026

When the deck owns the input:

| Key | Action |
| --- | --- |
| Right, Down, Page Down, Space | Next slide |
| Left, Up, Page Up, Shift+Space | Previous slide |
| Home | First slide |
| End | Last slide |

Tab, Escape, and modified shortcuts remain with the browser, except for the explicitly supported Shift+Space binding. Focused interactive content retains its native keyboard behaviour, including Space activation. These bindings do not authorize focus stealing or overriding browser/assistive-technology actions. Exact input ownership and event handling remain specification work.

### URL and browser-history decisions

The owner approved distinguishing sequential movement from following a link:

- Sequential navigation (wheel, swipe, next/previous keys) updates the current slide URL by replacing the current history entry.
- Following an explicit slide link, such as a table of contents or cross-reference, adds a history entry. Back returns to the slide from which the link was followed.
- Back and Forward restore the slide identified by the history entry without creating another entry.
- Opening a deep link selects that slide.

For example, sequentially reaching slide 4, following a link to slide 12, and pressing Back returns to slide 4.

Addressing model revised 21 October 2026: use ordinary HTML IDs and native fragment links. Predictable IDs such as id="slide_3" are acceptable; #slide_3 references that actual element rather than instructing Lys to parse a slide number. This supersedes the custom positional-address proposal (#slide=3). Preserve authored IDs. IDs are optional and author-supplied. The runtime neither generates nor repairs IDs; slides without IDs remain valid and sequential navigation follows document order. Guidance and examples demonstrate author-supplied IDs. If automatic ID generation is needed later, it belongs in a separate generator tool, outside 2.0 scope. Unknown fragments retain browser behaviour without custom repair or error UI. Sequential URL updates use real element IDs under the agreed replace-history contract. Navigating sequentially to a slide without an ID clears the previous slide fragment through history replacement, so the URL does not identify the wrong slide. This does not authorize rewriting unknown fragments as error recovery. Explicit links use native fragment navigation. Existing URL compatibility remains migration/specification work.

### Chrome and fullscreen scope

The owner deferred built-in visible controls beyond 2.0. Author-provided navigation buttons are also outside the supported 2.0 contract; the earlier suggestion to support these through a navigation API was rejected. Ordinary slide links remain a separately agreed browser-navigation mechanism. Engine-supplied chrome is a possible later release (for example 2.1), not a committed feature or date. Keep the implementation minimal: icon assets, styling, focus behaviour, and visibility logic all carry size and maintenance costs. A future design must establish its budget and compatibility; adding default visible UI is not automatically non-breaking.

Fullscreen belongs to the browser. Lys 2.0 supplies no fullscreen command or fullscreen UI, and does not introduce an Escape binding to enter or leave a Lys presentation mode. Browser and authored-content Escape behaviour remain intact. Browser resizing/fullscreen changes must still preserve slide geometry and navigation state.

### Deferred reveal exploration — future versions

The discussion reached the following provisional model before deferral:

- Next reveals the next step; after the final step it advances to the next slide. Previous reverses the most recent reveal; before the first step it returns to the preceding slide at its final step. Direct jumps open a slide at its initial state.
- Keep the HTML contract minimal: opt in on the article, with an illustrative presence attribute such as `<article data-lys-reveal>`. The name and syntax were not finalised.
- Only direct element children of the article become steps, in document order. No Lys attributes or mandatory wrappers inside the article. Ordinary HTML grouping determines which material appears together; descendants are not interpreted as separate steps.
- The first direct child is visible on entry. An author wanting an initially empty slide can supply an empty `<div></div>` first. In HTML, `<div/>` is not a self-closing div.
- Subsequent children would appear cumulatively. The layout and interaction semantics of hidden children were not agreed.

The unresolved issue was how unrevealed content behaves. Reserving its layout space would avoid movement as steps appear. `opacity: 0` alone does not prevent invisible controls from receiving interaction or remaining exposed to assistive technology. `visibility: hidden` was discussed as a possible starting point, with descendant overrides and focus/accessibility handling still requiring specification. No hiding technique was selected.

The owner then outscoped reveals from 2.0 and requested preservation of this discussion for later versions. Reopening it requires a separate scope decision. Neither the proposed attribute nor the provisional reveal state model belongs in the 2.0 runtime, authoring guidance, or acceptance criteria.

### Screen-reader announcements — evidence review, 21 October 2026

The owner chose to verify native browser behaviour before approving custom announcements. No new announcement requirement is approved.

The [HTML focus model](https://html.spec.whatwg.org/multipage/interaction.html#sequential-focus-navigation-starting-point) gives fragment navigation a native sequential-focus starting point. This is not a guarantee of spoken slide position. Changing the URL through history replacement is also not equivalent to following a native fragment link. [WAI carousel guidance](https://www.w3.org/WAI/tutorials/carousels/functionality/) demonstrates a polite live region for position announcements, but that example does not establish that Lys needs one.

Source inspection finds that current src/a11y.ts already injects a live region, replaces article roles, labels slides, hides inactive slides from accessibility, and moves focus on slide changes. Consequently, current Lys output cannot establish what unenhanced HTML communicates.

This review covers standards and source, not actual screen-reader speech. Before choosing an announcement policy, compare native articles and fragment links against engine navigation without injected announcements or forced focus, including history replacement and none/fade/moving transitions. Observe content reachability, reading position, focus and actual speech with browser/screen-reader combinations. DOM assertions alone cannot verify speech. Retain this as a specification prerequisite, not permission to impose new ARIA or focus behaviour.

## Decisions and verification still needed

| Question | Focused follow-up |
| --- | --- |
| Wheel and trackpad | Test discrete wheel notches, momentum, horizontal/vertical gestures, zoomed content, and nested scrolling. Record app version, OS, hardware, mode, and preferences. Do not invent thresholds from shortcut tables. |
| Touch | Compare swipe, tap, selection, link activation, long press, pinch zoom, and OS edge gestures on real touch devices. Synthetic swipes alone do not establish usability. |
| Keyboard and focus | Test deck surface, chrome, links, input fields, custom widgets, media, selected text, and nested scroll areas. Verify Tab exits normally and navigation does not steal a content action. Include screen-reader operation. |
| Boundaries and repetition | Check first/last slide, held keys, rapid input, transitions, and direct jumps. The reviewed documents do not establish a universal endpoint or repeat policy. |
| Fullscreen and exit | Distinguish browser fullscreen from viewer presentation mode; test Escape with overlays, controls, and content focus. Record where focus returns. |
| Chrome alternatives | Compare discoverability, occlusion, touch targets, keyboard access, and whether controls can occupy surrounding space without changing authored composition. |

Use the same small sample across tools: several pages/slides with visible numbers, a link, text selection, and controls where supported. Compare ordinary viewing and presentation mode separately. Native tool limitations should be recorded rather than simulated away.

Owner decisions already established: consistent accessible engine operation; author ownership inside the CSS container; an explicit multi-input/chrome contract; no background click/tap navigation; wheel/trackpad and horizontal touch-swipe navigation independent of transition style. Built-in chrome is deferred beyond 2.0 and fullscreen is browser-owned. Keyboard bindings are agreed above; exact input ownership and gesture handling remain specification work. No runtime or public API changes follow automatically from this study.

## Sources

All links below are vendor documentation. Mutable pages are evidence as retrieved, not frozen specifications. The presentation-tool sources were first reviewed on 19 October; PDF sources were reviewed on 20 October 2026.

[pp-keys]: https://support.microsoft.com/en-us/accessibility/powerpoint/use-keyboard-shortcuts-to-deliver-powerpoint-presentations
[pp-nav]: https://support.microsoft.com/en-us/powerpoint/go-to-a-slide-when-delivering-your-presentation
[gs-keys]: https://support.google.com/docs/answer/1696717?hl=en
[gs-present]: https://support.google.com/docs/answer/1696787?co=GENIE.Platform%3DDesktop&hl=en
[gs-touch]: https://support.google.com/docs/answer/1696787?co=GENIE.Platform%3DAndroid&hl=en
[kn-keys]: https://support.apple.com/guide/keynote/keyboard-shortcuts-tanfde4a3e6d/mac
[kn-play]: https://support.apple.com/guide/keynote/present-on-your-mac-tan72233051/mac
[kn-touch]: https://support.apple.com/en-mide/guide/keynote-ipad/tan72233051/ipados
[kn-modes]: https://support.apple.com/guide/keynote-ipad/choose-how-to-navigate-your-presentation-tanaf84dabdd/ipados
[ac-keys]: https://helpx.adobe.com/acrobat/desktop/get-started/preferences-and-settings/keyboard-shortcuts.html
[ac-full]: https://helpx.adobe.com/acrobat/using/viewing-pdfs-viewing-preferences.html
[preview-keys]: https://support.apple.com/guide/preview/keyboard-shortcuts-cpprvw0003/mac
[preview-show]: https://support.apple.com/en-in/guide/preview/prvw3b268798/mac
[chrome-pdf]: https://support.google.com/chrome/answer/16215622?hl=en-GBf
[chrome-touch]: https://support.google.com/chrome/answer/16215622?co=GENIE.Platform%3DAndroid&hl=en-2
[firefox-pdf]: https://support.mozilla.org/en-US/kb/view-pdf-files-firefox-or-choose-another-viewer
