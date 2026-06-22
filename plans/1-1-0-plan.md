# Lys 1.1.0 Release Plan

> From 1.0.0 (published, LLM-ready slide engine) to 1.1.0: **aspect-ratio conformity**
> (the headline correctness fix), **opt-in chapter navigation**, and — gated — a
> long-scroll document layout.

## What 1.0.0 shipped

- Core engine, navigation (keyboard/touch/hash), accessibility, two-tier tokens.
- Transitions: scroll-snap default, `fade`, `direct`; per-slide overrides.
- Container-relative scaling (`cqi`), `container-type: size`, adaptive `--lys-backdrop`.
- Published to npm with `.d.ts`, CI publish workflow, GitHub Pages site, `llms.txt`, `SKILL.md`.
- 175 unit tests; e2e across Chromium/Firefox/WebKit.

## What 1.1.0 means

A release led by a **core-correctness fix** plus an **additive** feature:

1. **Aspect-ratio conformity (#45)** — the headline. Today a set `--lys-aspect-ratio` is
   silently ignored across most viewports (slides adopt the viewport ratio on mobile and
   non-matching desktops). This breaks the engine's core promise. Fixing it is the priority.
2. **Chapter navigation (#42)** — opt-in top nav to jump between slides/sections, with
   active-state tracking and a progress indicator.
3. **Long-scroll document layout (#43)** — larger, **gated** behind a product decision
   (see WI-6); may slip to 1.2.0.

No breaking changes to the `<article>` contract, the `--lys-*` token API, events, or file
structure. The aspect-ratio fix changes rendered *layout* but not the public API — it makes
the existing `--lys-aspect-ratio` token actually work, so it is a fix, not a breaking change.

Sources: aspect-ratio diagnosis in `plans/aspect-ratio-conformity-findings.md`; nav/document
feature ideas and rejected patterns in `plans/spa-mode-findings.md`.

## Budget status (entering 1.1.0)

| Output | gzip now | budget | headroom |
|---|---|---|---|
| `lys.iife.js` | 2.25 KB | 5 KB | ~2.75 KB |
| `lys.css` | 0.92 KB | 2 KB | ~1.1 KB |

Comfortable, but the nav feature adds JS + CSS. Size is an explicit guardrail (WI-5).

## Work Items

> Aspect-ratio conformity (WI-AR*) is the priority and ships first; it is independent of the
> nav work and can land as its own patch even if nav slips.

### WI-AR1: Spec the aspect-ratio fix (#45)

**Status:** Issue filed (#45); diagnosis in `plans/aspect-ratio-conformity-findings.md`.

Update an existing spec rather than adding one — the constraint lives in `lys-core.spec.md`
("Aspect ratio: … using `aspect-ratio` + `max-width`/`max-height` + centering"), which is the
exact rule that is wrong. Revise that line and the related Gherkin to specify **contain-fit**
sizing (both axes bounded, letterbox/pillarbox against `--lys-backdrop`). Cross-check
`container-type.spec.md` (both axes must stay definite) and `transitions.spec.md` /
`direct-transition.spec.md` (stacked-mode height).

### WI-AR2: Implement the fix (#45)

**Status:** Blocked on WI-AR1.

- Default mode (`src/lys.css:36–53`): remove the `min-height:100vh` pin; size to fit via
  `width: min(100vw, 100vh × R)` + `aspect-ratio` (or the height-bounded equivalent). Keep
  both axes definite for `container-type: size`.
- Stacked mode (`src/lys.css:94–104`): apply the parallel fix to the `height:100vh` pin.
- **Preserve scroll-snap one-slide-per-swipe** without a forced full-viewport article height
  (full-height snap track / centering wrapper / `scroll-snap-stop`) — validate, don't assume.
- Confirm print (`@media print`) still pages one slide per page.
- Micro-commits; `pnpm lint` + budgets after each.

### WI-AR3: Aspect-ratio conformity tests

The existing e2e "extreme aspect ratios" block (`tests/e2e/slides.spec.ts:307–342`) only
asserts font-size — never the rendered ratio. That gap is why the bug shipped.

- **E2e** — assert measured `width/height ≈ target` **and** slide-fits-viewport (no overflow)
  across a viewport matrix: mobile portrait (430×932), small landscape, desktop 16:9
  (1920×1080) and 16:10 (1920×1200), tablet (1024×1366); for ratios 16:9, 4:3, 3:4, 1:1.
- Cover both default and stacked modes.
- Keep/extend the font-size clamp assertions.
- **Unit** — token resolution unchanged; add any computed-style assertions feasible in jsdom.

### WI-AR4: Docs for the fix

- `ARCHITECTURE.md` + `lys-core.spec.md` token notes describe contain-fit behavior and the
  backdrop letterbox.
- `CHANGELOG.md` — `### Fixed` entry under `[Unreleased]`.

### WI-1: Spec the chapter nav (#42)

**Status:** Issue filed (#42), no spec.
**Spec:** Write `specs/spa-nav.spec.md` (Blueprint + Contract) **before any code**, per the
spec-driven workflow. Add the spec→test mapping row to CLAUDE.md.

Blueprint must pin down:

- **Opt-in trigger** — container attribute `data-lys-nav` (additive; needs API sign-off, WI-0).
- **Label source** — derived from each `<article>`'s first heading (`h1`–`h4` `textContent`).
  No new per-article attribute, so no contract change. Articles with no heading are skipped
  or numbered ("Slide N") — decide in spec.
- **Active tracking** — `IntersectionObserver`, viewport-middle `rootMargin` pattern.
- **Progress indicator** — scroll progress (default mode) or current/total (stacked mode).
- **Smooth jump on click** — respect `prefers-reduced-motion` (no smooth scroll when reduced).
- **Works in both layouts** — scroll-snap default *and* stacked (fade/direct) decks.
- **Mobile toggle** — correct `aria-expanded`, focus handling.

Contract must include Gherkin for: nav generation, active highlight on scroll, click-to-jump,
keyboard reachability of nav links, reduced-motion behavior, CSS-only graceful absence.

### WI-0: API sign-off gate (blocks WI-1 → WI-2)

**Status:** Required per CLAUDE.md "never do without asking."

Get explicit owner approval for:

- New **container** attribute `data-lys-nav` (and any modifier values it takes).
- Whether a generated nav needs any new `--lys-*` token (e.g. `--lys-nav-height`) — adding a
  token is also a sign-off boundary. Prefer deriving from existing tokens / internal `--_lys-*`.
- Confirm **no** new per-article `data-*` attribute (label-from-heading keeps the contract frozen).

### WI-2: Implement chapter nav (#42)

**Status:** Blocked on WI-0 + WI-1.

- New module `src/nav.ts` (small, focused — prefer over growing `lys.ts`).
- Generate nav DOM, wire IntersectionObserver, progress, smooth-jump, mobile toggle.
- CSS in `lys.css` — structural only, visually unopinionated (no colors/fonts); themeable via
  existing tokens. Sticky positioning, blur backdrop optional and overridable.
- Progressive enhancement: nav is JS-built; CSS-only decks remain fully functional without it.
- Verify ARIA on nav landmark, links, and toggle. Micro-commits.

### WI-3: Tests for chapter nav

- **Unit** (`tests/unit/nav.test.ts`) — label derivation, active-index math, observer wiring
  (jsdom), reduced-motion branch, mobile toggle aria state.
- **E2e** (`tests/e2e/nav.spec.ts`) — real-browser: nav renders, active highlight follows
  scroll, click jumps, keyboard reachability, works in both scroll-snap and stacked decks.
- Every Gherkin scenario in `specs/spa-nav.spec.md` maps to a test (no gaps).

### WI-4: Example + docs for chapter nav

- New example `examples/nav.html` (double duty: human reference + e2e fixture).
- `ARCHITECTURE.md` — document `data-lys-nav`, label-from-heading behavior, any token.
- `llms.txt` + `skill/SKILL.md` — add the nav opt-in so LLMs emit it correctly.
- `README.md` — one line + snippet in the feature list.
- `CHANGELOG.md` — `### Added` entry under `[Unreleased]`.

### WI-5: Size-budget guardrail

**Status:** Assessment item — confirm enforcement exists.

- Verify (or add) a build-time size check that fails CI if `lys.iife.js` > 5 KB gzip or
  `lys.css` > 2 KB gzip. The nav feature is the first post-1.0 size pressure; budgets are a
  hard constraint and should not rely on manual checking.
- Record post-feature sizes in this plan's Definition of Done.

### WI-6: Long-scroll document layout (#43) — GATED / stretch

**Status:** Issue filed (#43). **Decision gate before committing to 1.1.0.**

This is a larger, more philosophical change — relaxing the 1-article-per-viewport snap so
sections flow at natural height. It touches the core identity question in VISION ("is Lys a
*slide* engine?") and intersects the unresolved **fragments / view-transitions** open questions.

**Gate:** Resolve with the owner *whether a document layout belongs in Lys at all*. If yes and
it fits a minor (additive `data-lys-mode` value, no contract break), include in 1.1.0:

- Spec `specs/document-layout.spec.md` first; API sign-off for the new `data-lys-mode` value
  and any spacing tokens.
- Implement variable-height layout; compose with the WI-2 nav.
- Candidate sub-primitive: **reveal-on-scroll** transition (gate on `prefers-reduced-motion`).
- Unit + e2e tests; example `examples/document.html`; docs + CHANGELOG.

If the gate is unresolved or the work proves heavy, **defer #43 to 1.2.0** and ship 1.1.0 as
the chapter-nav release. The plan is designed so 1.1.0 is complete and releasable without WI-6.

### WI-7: Release 1.1.0

- Version bump to `1.1.0` in `package.json`.
- `CHANGELOG.md` — move `[Unreleased]` items under `## [1.1.0] — <date>`.
- Confirm bundle sizes within budget (WI-5).
- Tag `v1.1.0` → CI publish workflow handles npm.
- Pages site: update demo to show the nav.

## Dependency Order

```
WI-AR1 (spec) → WI-AR2 (impl) → WI-AR3 (tests) → WI-AR4 (docs) ─────────────────────────┐  ← priority, independent
WI-0 (API sign-off) → WI-1 (spec) → WI-2 (impl) → WI-3 (tests) → WI-4 (example+docs) ────┤
WI-5 (size guard, parallel) ─────────────────────────────────────────────────────────────┤
WI-6 (#43 document layout) — GATED: only if approved; own spec→impl→test→docs chain ──────┤
                                                                                           └→ WI-7 (release)
```

- **WI-AR* is the priority** and independent of the nav chain — it can ship as a 1.1.0 (or
  even a 1.0.1 patch) on its own if nav slips. Do it first.
- WI-0 blocks the nav chain (don't build against an unapproved API).
- WI-5 can run anytime (independent guardrail).
- WI-6 is optional for 1.1.0; if deferred, WI-7 ships chapter-nav alone.

## Out of Scope for 1.1.0

Content-level components seen in the source study (tabs, flip cards, steppers, tooltips,
slider-calculators) — author content, not engine concerns; Lys stays visually unopinionated.

Per VISION open questions (still unresolved):

- Fragment / step support (incremental reveals) — except the narrow reveal-on-scroll primitive
  *if* WI-6 is approved.
- Plugin API.
- Remote control.
- View Transitions API integration.

Per [ADR-001](../docs/adr/001-defer-presenter-mode.md): presenter mode.

External fonts/assets, base64-bloated output, non-trapping modals — explicitly rejected
patterns from the source study (`plans/spa-mode-findings.md`).

## Definition of Done for 1.1.0

**Aspect-ratio conformity (#45) — priority:**

- [ ] `lys-core.spec.md` aspect-ratio rule + Gherkin updated to contain-fit
- [ ] Default and stacked modes honor `--lys-aspect-ratio`; both axes stay definite
- [ ] Scroll-snap one-slide-per-swipe preserved; print still pages one slide per page
- [ ] E2e asserts rendered ratio ≈ target **and** no overflow across the viewport matrix
- [ ] ARCHITECTURE.md updated; CHANGELOG `### Fixed` entry added

**Chapter nav (#42):**

- [ ] API sign-off recorded for `data-lys-nav` (and any new token) — WI-0
- [ ] `specs/spa-nav.spec.md` written; CLAUDE.md spec→test row added
- [ ] Chapter nav implemented (opt-in, label-from-heading, active tracking, progress, mobile)
- [ ] Works in both scroll-snap and stacked decks; CSS-only deck unaffected
- [ ] `prefers-reduced-motion` respected; ARIA verified on nav, links, toggle
- [ ] Unit tests (`nav.test.ts`) + e2e (`nav.spec.ts`); every Gherkin scenario covered
- [ ] `examples/nav.html` added and used as an e2e fixture
- [ ] ARCHITECTURE.md, `llms.txt`, `SKILL.md`, README updated
- [ ] Bundle sizes within budget: JS < 5 KB gzip, CSS < 2 KB gzip (record actuals)
- [ ] WI-6 (#43) either shipped to its own DoD **or** explicitly deferred to 1.2.0 in this plan
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test:all` green
- [ ] CHANGELOG `[1.1.0]` section written; version bumped to `1.1.0`
- [ ] Tagged `v1.1.0` and published to npm via CI
