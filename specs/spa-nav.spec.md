# Chapter Navigation — Author Nav Region + Active-State Hook

## Blueprint (Design)

### Context

A long deck benefits from a persistent nav that jumps to sections and shows where you are.
The behavior an LLM (or author) cannot reliably hand-roll is two-fold: positioning a nav so
it floats above the slides without breaking scroll-snap paging, and keeping a "you are here"
highlight in sync as the deck scrolls. Lys owns exactly those two things and nothing more.

This mirrors how **slides** already work: Lys provides the **container** (structural
positioning + behavior); the **author provides the contents and styling**. The nav is a
*slot*, not a generated widget. If the author includes a nav region, Lys positions it and
tracks the active link; if not, nothing happens. Lys never generates links, derives labels,
or ships a toggle/progress/hamburger — that was rejected as over-reach against Lys's
*visually unopinionated* and *do-not-mutate-author-HTML* principles.

It is the deliberate, opt-in **exception** to navigation.spec.md's "no built-in UI" rule:
the default deck still ships zero UI; the nav appears only when the author adds the region.

### Division of responsibility

| Lys provides | Author provides |
|---|---|
| Container styling: positions the region out of the scroll-snap flow (so it never consumes a viewport page), pinned and above the slides. Structural only — overridable. | The region's existence and markup: a nav element with `<a href="#id">` links to slides. |
| Active-state hook: marks the link whose target is the current slide. | All visual styling (colors, fonts, layout, active-link appearance, mobile/responsive behavior, any toggle or progress UI). |

### Architecture

#### Opt-in trigger (approved API addition)

The author marks their nav region with the `data-lys-nav` attribute, on an element **inside**
the `[data-lys]` container:

```html
<div data-lys>
  <nav data-lys-nav aria-label="Slides">
    <a href="#intro">Intro</a>
    <a href="#approach">Approach</a>
    <a href="#results">Results</a>
  </nav>
  <article id="intro">…</article>
  <article id="approach">…</article>
  <article id="results">…</article>
</div>
```

`data-lys-nav` is the only public-API addition. It is additive (absent on every existing
deck). **No new `--lys-*` tokens** — positioning derives from existing structure; everything
visual is the author's. The links use the slides' existing `id`s as anchor targets — the same
`id` mechanism hash routing already uses — so **no per-article contract change**.

#### Lys responsibility 1 — container styling (`lys.css`)

`[data-lys] [data-lys-nav]` is taken **out of flow** (`position: fixed`, pinned to the top of
the viewport, above the slides). This is required because the default container is
`display: grid; grid-auto-rows: <max-height>`; a normal-flow or `sticky` child would occupy a
full viewport snap row and render as a blank "slide." Out-of-flow positioning consumes no row
and keeps the nav visible while the deck scrolls, in both default and stacked modes. The rule
is structural and visually unopinionated (no colors/fonts/sizes that assume a look); authors
override positioning and supply all appearance. In `@media print`, the region is not pinned
(static or hidden) so it does not overlap printed slides.

#### Lys responsibility 2 — active-state hook (`src/nav.ts`)

Lys keeps one link marked as active: the `<a>` inside the region whose `href` is `#{id}` of
the current slide gets `aria-current="true"` and a `data-lys-nav-active` attribute (for CSS);
all sibling links have neither. The author styles `[data-lys-nav-active]` however they like.

Current-slide detection covers both modes:

- **Default (scroll-snap) mode:** an `IntersectionObserver` over the `id`'d articles
  (`rootMargin: "-45% 0px -50% 0px"` — the article straddling viewport-middle is current)
  updates the active link as the user scrolls or swipes.
- **All modes:** the hook also updates on the existing `lys:slidechange` event, so
  keyboard/programmatic/hash navigation and stacked (`fade`/`direct`) mode stay in sync.

This is the entire JS surface: observe → resolve current slide `id` → set the active link.
**No** DOM generation, label logic, click interception, toggle, or progress.

#### What Lys does NOT do

- Generate or modify nav links (beyond the two active-state attributes).
- Derive labels, slugs, or `id`s. The author writes link text and points `href` at slide `id`s.
- Intercept clicks. The links are native `#id` anchors — they scroll to the slide on their
  own in the default mode (progressive enhancement; they work even with no JS). In stacked
  mode, native `#id` jumps don't move overlaid slides; authors needing click-to-switch there
  wire it to the public `goTo()` API themselves (documented; candidate for a later minor).
- Ship any toggle, hamburger, progress bar, or responsive behavior. That is author styling.

#### Module boundaries

- **`src/nav.ts`** — exports `setupNav(container, slides)` and `teardownNav()`. Holds the
  IntersectionObserver + `lys:slidechange` listener and the set-active-link logic. Receives
  what it needs as arguments; no import from `lys.ts`.
- **`src/lys.ts`** — calls `setupNav` during init only when a `[data-lys-nav]` region exists
  in the container; calls `teardownNav` in `destroy()`.
- **`lys.css`** — one structural block for `[data-lys] [data-lys-nav]` (+ print).

### Anti-Patterns

- **Generating nav DOM.** Lys never creates links, lists, toggles, or progress elements. The
  region and its contents are the author's.
- **A new per-article attribute or new `--lys-*` token.** Membership/labels come from author
  markup and existing `id`s; appearance is author CSS.
- **Mutating author markup beyond the hook.** The only writes are `aria-current` and
  `data-lys-nav-active` on the active link. Never rewrite, reorder, or restyle author links.
- **Baking in visual opinion.** No colors, fonts, icons, or dimensions. Container positioning
  only.
- **Consuming a scroll-snap page.** The region must be out of flow (no full-viewport grid row).
- **Scroll-tracking that leaks.** The observer and event listener are scoped to the deck and
  fully removed on `destroy()`.
- **Breaking the size budget.** The hook targets a few hundred bytes gzip; JS stays < 5 KB,
  CSS < 2 KB gzip (hard constraint).

## Contract (Quality)

### Definition of Done

1. A deck **without** a `[data-lys-nav]` region behaves exactly as before — no nav styling
   applied, no `setupNav`, no listeners, no size regression on that path.
2. When a `[data-lys-nav]` region exists, Lys positions it out of the scroll-snap flow so it
   does not consume a viewport page and stays visible while scrolling.
3. Lys generates no nav DOM and adds no link text — the region's contents are author markup.
4. The link whose `href` is `#{current-slide-id}` has `aria-current="true"` and
   `data-lys-nav-active`; no other link in the region does.
5. In default mode the active link follows scroll position (viewport-middle article).
6. In all modes the active link updates on `lys:slidechange` (keyboard/programmatic/hash/stacked).
7. A link whose `href` does not match any slide `id` is never marked active and causes no error.
8. The links scroll to their slides as native `#id` anchors with no JS (progressive enhancement).
9. `destroy()` removes the active-state attributes and every nav listener/observer; no leaks.
10. Multiple decks each track their own region independently.
11. The nav does not break scroll-snap one-slide-per-swipe, contain-fit aspect ratio, or print
    (region not pinned in `@media print`).
12. Bundle sizes within budget after the feature (record actuals).

### Regression Guardrails

- The no-region path adds zero DOM and zero runtime cost; `setupNav` runs only when a
  `[data-lys-nav]` region is present.
- The hook never throws: no matching link → nothing marked; empty region → no-op; no `id`'d
  slides → no active link.
- `destroy()` fully cleans up — no leaked observer or `lys:slidechange` listener, no leftover
  `data-lys-nav-active`/`aria-current`.
- CSS-only decks (no JS) with a nav region remain navigable via the native anchor links and an
  unaffected scroll-snap fallback.
- WCAG 2.1 AA: the active link is conveyed via `aria-current`; links are the author's real
  `<a>` elements (keyboard reachable); Lys adds no inaccessible chrome.

### Scenarios (Gherkin)

```gherkin
Scenario: No region, no behavior
  Given a [data-lys] deck with no [data-lys-nav] element
  When the deck initializes
  Then no nav listeners are attached
  And no element receives data-lys-nav-active

Scenario: Region is positioned out of the snap flow
  Given a [data-lys] deck with a [data-lys-nav] region as a child
  Then the region does not occupy a scroll-snap page
  And the first article is the first reachable snap page

Scenario: Lys adds no link DOM
  Given a [data-lys-nav] region authored with 3 links
  When the deck initializes
  Then the region still contains exactly those 3 author links

Scenario: Active link follows scroll in default mode
  Given an initialized deck with a [data-lys-nav] region linking #a #b #c
  When the user scrolls so the slide with id="b" straddles the viewport middle
  Then the link href="#b" has aria-current="true" and data-lys-nav-active
  And the links for #a and #c have neither

Scenario: Active link follows slide changes (keyboard / stacked)
  Given an initialized deck with a [data-lys-nav] region
  When current changes to the slide with id="c" (via key, goTo, hash, or fade)
  Then the link href="#c" becomes the active link

Scenario: Non-matching link is never active
  Given a [data-lys-nav] region with a link href="#missing" matching no slide
  Then that link never receives aria-current or data-lys-nav-active
  And no error is thrown

Scenario: Links work without JS
  Given a [data-lys-nav] deck rendered with CSS only (no lys.js)
  When the user activates a link href="#approach"
  Then the browser scrolls the article id="approach" into view via the anchor

Scenario: destroy() cleans up the hook
  Given an initialized deck with an active nav link
  When destroy() is called
  Then no link has aria-current or data-lys-nav-active
  And scrolling or slide changes no longer update any link

Scenario: Two decks track independently
  Given two [data-lys] decks, each with a [data-lys-nav] region
  When deck A's current slide changes
  Then only deck A's active link updates

Scenario: Print does not pin the nav
  Given a [data-lys-nav] deck
  When the page is printed
  Then the region is not fixed over slide content
  And each slide still prints one per page
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| No region / region positioning | `tests/unit/nav.test.ts` + `tests/e2e/nav.spec.ts` |
| Lys adds no link DOM | `tests/unit/nav.test.ts` |
| Active link follows scroll | `tests/e2e/nav.spec.ts` |
| Active link follows slide changes | `tests/unit/nav.test.ts` + `tests/e2e/nav.spec.ts` |
| Non-matching link / lifecycle / multi-deck | `tests/unit/nav.test.ts` |
| Progressive enhancement / print | `tests/e2e/nav.spec.ts` |

## Known Constraints

- **IntersectionObserver in happy-dom.** happy-dom does not run real intersection logic. Unit
  tests verify the active-link logic given a synthetic current-slide id and `lys:slidechange`;
  e2e verifies real active-on-scroll behavior in a browser.
- **Stacked-mode native anchors.** `#id` anchor jumps don't move overlaid slides in
  `fade`/`direct` modes. Active-state tracking still works there (via `lys:slidechange`);
  click-to-switch in stacked mode is left to authors via `goTo()`.
- **Fixed positioning + multiple decks.** Each region pins to the viewport top; two on one
  page would overlap. Single-deck is the design target; authors reposition for multi-deck.

## Related / Future

- **Navigation** (`navigation.spec.md`) — the hook consumes `lys:slidechange` and the existing
  `id` anchors; it adds no new navigation mechanics, only an active-state reflection. It is the
  scoped exception to that spec's "no built-in UI" rule.
- **Accessibility** (`a11y.spec.md`) — `aria-current` marks the active link; live-region
  announcements on `lys:slidechange` are unchanged.
- **Document layout (#43, gated)** — the anchor/active-state model generalizes to non-article
  `[id]` targets if that layout ships.
- **Click-to-switch in stacked mode** and any **toggle/progress UI** are explicitly author
  concerns now; revisit only with a fresh, specific request.
