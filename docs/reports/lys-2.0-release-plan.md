---
generated:
  by: "claude-code/claude-opus-5-5"
  at: "2026-11-23T18:35:06+02:00"
---

# Lys 2.0.0 release plan

Status: approved for execution on 23 October 2026. Begin tasks 1, 1a, and 2; implement each bounded area after its contract is ready. Unresolved product decisions remain explicit gates. No runtime capability is claimed by this document.

Branch: `feat/2_0_0`. Baseline runtime: 1.2.5. Consolidated: 21 October 2026.

## Release purpose

Deliver portable presentations whose authored composition survives delivery, with a consistent accessible engine and an explicit CSS-container boundary. Authors own composition; Lys owns slide geometry, containment, navigation, and the surrounding environment. See [VISION.md](../../VISION.md).

Removing implicit padding, base typography, inherited foreground styling, and incompatible APIs warrants a major release. Migration must address actual changes from 1.2.5. The license is MIT.

## Agreed product contracts

### Document and platform

- One deck per HTML document is the product model. Slides are sibling articles inside the deck container. Their membership and order are fixed at initialisation; content inside them may be interactive or dynamic.
- Prefer native HTML, CSS, and browser behaviour. Do not introduce custom protocols or replace browser behaviour when standard mechanisms fulfil the contract.
- Target evergreen browsers as of August 2026. Exact versions belong in the verification baseline.
- Primary delivery is a self-contained HTML file, including engine, author CSS, and required assets. Hosted and multi-file delivery remain alternatives.
- Embedding uses a complete document in an iframe. The host controls its dimensions and URL through browser APIs. No Lys-specific host-control protocol is required.
- No engine-supported slide metadata: no required titles, numbering, timing, or notes. Ordinary HTML metadata remains author-owned.

### Slide surface

- Each article is a CSS size container with definite dimensions. One aspect ratio applies across the deck, on screen and in print: default 16:9, with any valid positive authored ratio supported.
- Fit the complete slide within the viewport without changing its ratio. The remaining area is backdrop. Resizing changes the container; author CSS controls its contents.
- The slide is the final clipping frame. Intentional overflow is valid, but content never paints onto the backdrop. Lys does not inspect composition, judge overflow, rearrange contents, or shrink text. Engine checks verify the boundary, not author intent.
- No engine-imposed internal spacing, typography, or foreground styling. The explicit exception is the slide background: `light-dark(white, black)`, expected to be overridden by authors.
- The separate backdrop uses `light-dark()` with near-white and near-black blue-grey colours.
- One transition style applies to the deck: none, fade, horizontal, or vertical. Default to none. Reduced motion makes engine slide changes immediate. Transition style never changes navigation meaning; in-slide animation remains author-owned.

### Input and browser ownership

Next/previous moves one whole slide and stops at either end without wrapping. When the deck owns keyboard input:

| Keys | Action |
| --- | --- |
| Right, Down, Page Down, Space | Next slide |
| Left, Up, Page Up, Shift+Space | Previous slide |
| Home / End | First / last slide |

- Tab, Escape, and other modified shortcuts retain browser behaviour. Focused interactive content keeps its keyboard actions. Preserve authored focusability and semantics; add no focusability to ordinary content. Follow browser focus behaviour rather than inventing automatic focus transfer.
- No background click or tap navigation. Selection, links, native controls, and browser zoom retain their normal behaviour.
- Wheel/trackpad down advances and up returns, including in fade mode. Scrollable content receives scrolling first; momentum must not cause accidental multiple advances.
- Horizontal touch swipes navigate left/forward and right/backward. Preserve pinch zoom, authored interaction, and browser/OS gestures.
- Fullscreen belongs to the browser. No engine fullscreen command, UI, or presentation-exit Escape binding.
- Accessible engine behaviour is the commitment; Lys does not certify authored presentations. Screen-reader announcements remain an evidence-dependent decision under task 1a.

### Links and history

- Use real, optional, author-supplied HTML IDs and native fragments. `id="slide_3"` is an ordinary ID, not an instruction to parse a slide number. Runtime ID generation and repair are excluded.
- Sequential navigation replaces the current history entry with the selected slide's fragment. Entering an unnamed slide clears the previous slide fragment through replacement; unnamed slides remain valid and navigable in document order.
- Explicit slide links use native fragment navigation and create a history entry. Back/Forward restores the addressed slide without creating entries. A link to content within a slide selects its containing slide while respecting native anchor behaviour.
- Unknown fragments retain browser behaviour, without repair or error UI. This is distinct from clearing a previous slide fragment after deliberate sequential navigation.

### Fallback and print

Without JavaScript, preserve access to the complete authored payload in document order through ordinary HTML and browser behaviour. This supports compatibility, accessibility, and agents reading the HTML. Fidelity and enhanced UX may degrade. Lys must not make payload inaccessible through its fallback mechanics; authors supply fallbacks for their own JavaScript-dependent content. This is not permission to inspect or repair authored composition.

Print and browser Save as PDF use one slide per page, in document order, including all slides regardless of selection. Preserve ratio, composition, and intentional edge clipping; fit the complete slide frame on the printable page without additional cropping. Use browser print controls, with no Lys export interface.

### Authoring guidance and demos

Ship a complete, verified slide-relative recipe in the README and delivered skill. Teach percentages with an explicit containing block; container units for typography and spacing; Grid/Flexbox for relationships; and absolute positioning for explicit coordinates. Explain physical `cqw`/`cqh`, logical units where used, and how nested containing/query containers affect references. Avoid viewport units for slide-relative content. Example values are author choices, not engine defaults.

The demo set must collectively cover 16:9, 24:10, and iPhone-like portrait proportions (9:19.5). Existing or planned feature demos can supply coverage; no fixed demo count or separate ratio-only decks are required. Verify engine geometry on screen and in print. Portrait proportions are not a device-specific compatibility claim.

## Specification work still required

These tasks translate settled intent into implementable contracts. They do not reopen agreed scope by default.

| Area | Decision or evidence still needed | Work |
| --- | --- | --- |
| Native accessibility | Actual screen-reader speech and reading position; whether announcements are needed; inactive-slide exposure and focus behaviour without semantic overrides or focus stealing. | 1a, 1 |
| Input handling | Event ownership, nested-scroll boundaries, wheel momentum, swipe recognition, held keys, rapid input, and input during transitions. Preserve browser and assistive-technology actions. | 1 |
| CSS configuration | Public token inventory and migration; ratio/transition configuration, timing, exact backdrop colours, colour-scheme integration and inherited effects. | 1 |
| Native links/history | Back/Forward state for unnamed slides; native anchors within clipped slides; interactions between fragment navigation and visual slide selection; migration from existing URL syntax. No custom positional URL scheme. | 1 |
| Fallback/print | Mechanisms that preserve payload access without JavaScript while retaining the framed presentation contract with JavaScript; handling intentional clipping without content inspection; print sizing and browser settings. | 1, 5 |
| Runtime lifecycle/API | Inventory existing initialisation, methods, events, and teardown. Specify the minimal supported surface and migration. Iframe support does not itself approve removing every existing public method or event. | 1 |
| Validation/budgets | Behaviour for invalid deck structure/configuration; reconcile artifact size budgets and measurement; exact browser versions and verification coverage. | 1, 2 |

## Task 1 working material

Use this plan's agreed contracts as normative product requirements. Older feature specifications remain useful for understanding 1.x behaviour; their conflicting requirements (forced focus, generated slide labels, per-slide transitions, padding/type defaults, custom hash syntax, metadata, multiple decks) must not be carried into 2.0 by default. Feature specs live in `specs/<feature>/spec.md` and state intent; code and tests are the contract.

The [surface geometry spec](../../specs/surface-geometry/spec.md) defines screen fit, clipping, surface defaults, and surface token migration. Input recognition, native anchor/visual-state integration, inactive-slide accessibility, and public lifecycle/API choices need the evidence and decisions below before implementation. Do not invent a new author API just to simplify internal code.

### 1.x interface inventory

Source basis: src/lys.ts, src/types.ts, src/navigation.ts, src/nav.ts, src/a11y.ts, src/lys.css. This inventory separates runtime code from historical architecture claims.

| Current surface | Source behaviour | 2.0 disposition |
| --- | --- | --- |
| `Lys.init()` | Discovers every deck, returns an array | One deck model agreed; exact return shape and invalid multiple-deck handling pending |
| `Lys.from(element)` / constructor | Idempotent lookup / destroys an existing instance before replacement | Lifecycle API retention pending; embedding alone does not require these |
| Module side effect | Auto-initialisation occurs in shared entry code, including ESM, despite docs implying IIFE-only | Explicit ESM versus automatic IIFE policy must be specified |
| `next`, `prev`, `goTo` | Public imperative navigation by index/ID | Internal commands required; public exposure not yet decided |
| `current`, `total`, `slide` | Public state getters | Retention pending API decision |
| `destroy()` | Removes listeners/state and reverts selected author transformations | Define teardown if public lifecycle retained; must preserve authored values |
| `lys:ready`, `lys:slidechange` | Public events used by internal modules | Decide public retention separately from internal coordination |
| `data-class`, `data-background` | Mutate article class/style | Remove author shorthand behaviour under standard HTML/CSS boundary; migrate to ordinary class/style |
| `data-notes`, `data-timing` | Advertised metadata, no presenter UI | No engine metadata contract in 2.0; remove documentation promises |
| Article `data-transition` | Any fade/direct article activates stacked mode | Replace per-slide interpretation with one deck style; exact configuration pending |
| `data-lys-nav`, active markers | Optional navigation-region styling and active-link management | Custom navigation integration is not implied by ordinary anchor support; removal/migration must be explicit |
| `#slide=…` | Custom numeric/ID parser; sequential replaceState | Replace with actual optional authored IDs; no ID synthesis/repair |
| Accessibility mutations | Article roles replaced; labels/tabindex/live region added; focus moved | Do not adopt as native baseline; task 1a gates replacements |

### Open token decisions

| 1.x token | Migration direction |
| --- | --- |
| `--lys-transition-duration`, `--lys-transition-easing` | Retain motion configuration only if needed; deck scope, reduced-motion override must win |
| `--lys-print-page-size` | Investigate actual page-context resolution and native print sizing before retaining/replacing |

### Native history and unnamed slides

A real ID supplies a reloadable fragment target. Unnamed slide navigation clears the fragment through replacement, as agreed. The URL alone then cannot identify which unnamed slide was selected. Evaluate browser scroll restoration first. If stacked rendering cannot restore selection, a private entry in standard history.state could preserve the index without generating IDs; that is a candidate, not an approved mechanism. Preserve unrelated state and document how fresh loads differ from Back/Forward. Return the trade-off to the owner if native behaviour cannot fulfil the agreed contract.

Unknown fragments are not errors to repair. Following an inner anchor must not lose the browser's target/focus handling merely to select the containing slide. No custom URL parser or ID fixer.

### Accessibility gate

Task 1a uses [the observation protocol](lys-2.0-native-accessibility.md). No new live-region, role, or forced-focus requirement is approved. Determine inactive-slide exposure using native mechanisms and actual assistive-technology evidence. No-JavaScript payload access remains required, independently of enhanced rendering.

### Task 1 definition of done

- Migrate relevant feature specs and architecture with explicit source/API changes and test mapping.
- Resolve configuration, input ownership, lifecycle/API scope, native history integration, fallback/print mechanics, and invalid structure behaviour.
- Record exact August 2026 browser versions and separate current test versions from that baseline.
- Complete task 1a's evidence and decision before finalising accessibility behaviour.
- Preserve agreed exclusions.

### Scenarios for feature specs

These state required 2.0 outcomes. Each moves into the feature spec that owns it when that spec is written; the surface outcome is in the surface geometry spec.

These state required 2.0 intent. Code and tests are the contract; until they change, 1.2.5 behaviour stands.

```gherkin
Scenario: Native optional IDs
  Given one named slide and one unnamed slide
  When Lys initialises and sequential navigation visits both
  Then their authored IDs remain unchanged
  And no IDs are generated
  And the unnamed slide has no stale slide fragment in the URL

Scenario: Input ownership
  Given focus is inside an authored interactive control
  When a normally supported deck navigation key is pressed
  Then Lys does not consume the control's native action

Scenario: Reduced motion
  Given any supported deck transition style
  And reduced motion is requested
  When navigation changes slides
  Then the engine change is immediate

Scenario: No-JavaScript access
  Given engine JavaScript is unavailable
  When the document is read in document order
  Then engine fallback mechanics do not hide any authored payload

Scenario: Complete print frames
  Given a deck on any selected slide
  When browser printing is used
  Then all slide frames print in document order, one per page
  And their ratios and intentional edge clipping are preserved
```

### Verification mapping

Surface → token/core and browser geometry tests; input/history → navigation tests; semantics/focus → a11y tests plus task 1a observations; print → rendered PDF and print tests; fallback → JS-disabled browser checks. Update individual specs alongside each implementation increment. No tests of author composition or assumptions about authored intent.

## Ordered work and completion evidence

| Work | Dependencies and destinations | Completion evidence |
| --- | --- | --- |
| 1. Specify the 2.0 contracts | Use the agreed contracts above, current source, `ARCHITECTURE.md`, and relevant `specs/`. Incorporate 1a before finalising the accessibility contract. | Resolve or explicitly return material product questions to the owner. Define triggers, exclusions, state changes, configuration, and migration. Map contracts to verification and record the August 2026 browser baseline. |
| 1a. Verify native screen-reader behaviour | Evidence task within 1, before accessibility implementation. Compare native articles/fragment links with engine navigation without injected announcements or forced focus. | Record actual speech, reading position, focus, and content reachability with browser/screen-reader/OS versions. Cover explicit links, sequential history replacement, Back/Forward, named/unnamed slides, and all transition styles. Decide from observed gaps whether minimal announcements are necessary; update the specification. DOM assertions alone are insufficient. |
| 2. Align development guidance | Can proceed independently of runtime work. Update `AGENTS.md`, `PROJECT.md`, and affected development skills using L4/L5. | Guidance matches agreed product boundaries; one commit/spec ownership policy, compatible review verdicts, accurate attribution, ordered verification without competing writers, and reconciled artifact budgets. |
| 3. Implement geometry and the author-owned surface | Depends on relevant contracts in 1. Update structural CSS, token specs, tests, and fixtures together. | Container geometry, clipping, ratios, backdrop, overridable slide background, transitions, and reduced motion match contracts. No internal spacing, type, or foreground defaults. Verify engine behaviour without judging authored composition. |
| 4. Implement interaction and accessibility | Depends on 1 and 1a, plus relevant surface mechanics from 3. Update navigation, history, accessibility, and lifecycle in bounded increments. | Test agreed input paths, exclusions, endpoints, links/history, iframe operation, and preservation of authored semantics. Verify the evidence-backed announcement decision and native focus behaviour. |
| 5. Implement print and no-JavaScript fallback | Depends on 1, 3, and relevant lifecycle changes in 4. Use L1 as evidence. | Inspect actual PDFs for frames, ratios, pagination, visibility, and intentional clipping. Verify fallback payload access with allowed fidelity loss. Record native-browser print coverage and settings. |
| 6. Align authoring guidance and migration | Depends on settled contracts and implemented behaviour in 3–5. Update README, `llms.txt`, delivered skill, examples, and migration guidance using L2. | A complete recipe demonstrates explicit author styling, container-relative sizing, assets, optional authored IDs, fallback, and print. Verify migration from 1.2.5 without losing supplied meaning or intended appearance. Explain removed APIs/defaults. |
| 7. Revise site and demo set | Depends on 6. Update site, primary demo, builders, and site specification using L3. | Accurate shipped claims and package links; collective ratio coverage of 16:9, 24:10, and 9:19.5. Inspect desktop/phone rendering, keyboard operation, reduced motion, no-JavaScript access, offline HTML, iframe embedding, and PDF output. |
| 8. Release verification | Depends on all required work above. | Fresh production build, lint/type/unit/browser checks, recorded screen-reader evidence, verified migration and release notes, artifact sizes, and explicit coverage gaps. Set version 2.0.0 during release preparation. Publication requires separate authorisation. |

Each implementation increment updates its affected specification and verification together. Existing implementation and old specifications are evidence, not authority to override the settled 2.0 decisions. Unresolved product choices must not be silently converted into implementation defaults.

## Known implementation and guidance gaps

These findings were recorded during review and must be rechecked against the working tree when their tasks begin.

| Finding | Owner work |
| --- | --- |
| Site uses unscoped package URLs, overstates presentation accessibility, and has stale token references. Demo teaches old padding/type defaults and framing. | 6, 7 |
| Architecture advertises number-key navigation and configurable swipe thresholds not found in the inspected implementation. Current custom URL parsing conflicts with native-ID addressing. | 1, 4 |
| Keyboard exclusions are inconsistent across keys. Accessibility code replaces roles, hides inactive slides, injects labels/live-region output, and forces focus. None establishes a native baseline. | 1a, 4 |
| Metadata, controls, and other existing APIs need explicit removal/retention and migration decisions under the new scope. | 1, 6 |
| AGENTS/skills disagree about commits and spec ownership; Critic/Assemble verdicts conflict. Ship and pre-commit run mutating work alongside readers; attribution is hardcoded. | 2 |
| The revised README recipe lacks dedicated browser-verification evidence from the earlier session because Chromium failed to launch. Formatting/link checks do not establish rendering. | 6 |

## Out of scope

- Incremental reveals, speaker notes, timers, presenter mode, and engine-interpreted slide metadata.
- Built-in visible chrome and author-provided navigation buttons. Ordinary links remain supported.
- Engine fullscreen management, custom host-control protocols, plugin APIs, and remote-control protocols.
- Multiple decks per document, live slide-list mutation, runtime ID generation/repair, and an authoring generator tool.
- Automatic content rewriting, text shrinking, a composition system, a separate responsive reading mode, and PPTX parsing. No-JavaScript payload access remains required.

Deferred ideas are not promised future features or release dates. In particular, later visible chrome would still need a design, size budget, and compatibility assessment.

## Evidence and discussion history

The [interaction study](lys-interaction-conventions-study.md) retains research, discussion history, superseded proposals, the deferred reveal exploration, and screen-reader research limits. Its historical recommendations do not override this consolidated plan's agreed contracts.

The [field-trial lessons](lys-field-trials-lessons-0.5.x.md) and proposals are inputs, not implemented capabilities:

- [L1: Print behaviour](lys-proposal-print-behavior.md)
- [L2: Authoring skill](lys-proposal-authoring-skill.md)
- [L3: Example verification](lys-proposal-example-verification.md)
- [L4: Workflow contracts](lys-proposal-workflow-contracts.md)
- [L5: Verification ordering](lys-proposal-verification-ordering.md)

## Execution record

23 October 2026: tasks 1, 1a, and 2 started. See [task 1 working material](#task-1-working-material) for implementation readiness and the source-backed API inventory. Task 1a remains pending actual screen-reader observation; the [native-accessibility protocol](lys-2.0-native-accessibility.md) defines the evidence needed. Runtime remains 1.2.5.

Initial increment: added a source-backed API/token inventory and implementation gates in the contract baseline; aligned AGENTS/PROJECT and development skill ownership/verdict rules; made pre-commit lint read-only so concurrent checks cannot race a formatter. A native HTML fixture and three-browser fragment/history observations support task 1a, but actual screen-reader speech is still pending. Tasks 1 and 1a remain open. Task 2 guidance changes are implemented. Verification: pnpm lint passed with two existing informational notices; TypeScript checks and all 192 unit tests passed; local documentation links and whitespace checks passed. The complete runtime/browser regression suite is deferred until runtime changes; the native three-browser experiment is recorded separately.

23 November 2026: the [surface geometry spec](../../specs/surface-geometry/spec.md) defines screen fit, clipping, surface defaults, and surface token migration. Specs moved to `specs/<feature>/spec.md`. The former contract baseline was not a feature spec, so its task 1 material moved into this plan and its surface token dispositions into the surface spec. No product decisions changed in the move.
