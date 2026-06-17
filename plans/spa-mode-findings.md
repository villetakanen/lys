# SPA / Chapter-Nav Mode — Findings

> Source studied: a 1.6 MB single-page editorial microsite proposal (external HTML, since removed).
> Date: 2026-06-17. Status: analysis only, no implementation decided.

## What the source artifact is

It is **not a slide deck** — it's a long-scroll editorial microsite: one tall page,
~13 variable-height `<section>`s, a sticky top nav, and many content-level interactions.

This is the inverse of Lys's current model:

- **Lys default:** 1 `<article>` = 1 viewport, vertical `scroll-snap-type: y mandatory`
  (`src/lys.css:28`).
- **Lys stacked mode:** absolutely-positioned articles, JS-driven `data-lys-active`, for
  `fade`/`direct` transitions (`src/lys.ts:20,76`).
- **Proposal:** free-flowing scroll, sections any height, nav anchors jump between them.

## The reusable win: the chapter nav (source lines 597–630, 1566–1600)

~35 lines of vanilla JS — exactly the kind of behavior VISION says Lys should own
(an LLM can emit markup but won't reliably hand-roll correct nav behavior):

- **Sticky top nav** from numbered anchors (`01 Intro`, `02 Approach`…), blur backdrop,
  `.scrolled` border toggled past 40px.
- **Active-link tracking** via `IntersectionObserver`, `rootMargin:'-45% 0px -50% 0px'`
  (the section straddling viewport-middle is "active"). No scroll-offset math.
- **Scroll progress bar** — `progress.style.width = (scrollY / scrollHeight) * 100%`.
- **Mobile hamburger** toggling `aria-expanded`.

All layered as progressive enhancement on plain anchors + `scroll-behavior:smooth`.
Maps ~1:1 onto Lys's existing scroll-snap default: each `<article>` is already a chapter;
we'd generate the nav, observe active state, smooth-jump on click.

## What to deliberately NOT copy (conflicts with Lys hard constraints)

- **External Google Fonts** (`<link>` to fonts.googleapis) — violates self-contained +
  visually-unopinionated. Lys output must never emit this.
- **Inline base64 images** → 1.6 MB file. Fine for a content doc, irrelevant to the engine.
- **Modal is not a real focus trap** (lines 1758–1811): focuses close button, handles
  Escape, restores focus — but Tab can escape the dialog, and team photos use `alt=""`.
  If Lys ever ships a notes/modal overlay it must beat this (WCAG 2.1 AA is non-negotiable).
- **Reveal-on-scroll & count-up DO gate on `prefers-reduced-motion`** (lines 1604, 1615) —
  that part is the correct pattern to mirror.

## Content-level interactions to resist (out of scope for the engine)

Tabs, flip cards, a stepper, gantt tooltips, a KPI slider-calculator (lines 1634–1756) are
**author content, not engine concerns**. Lys stays visually unopinionated — naming these now
keeps "SPA mode" from scope-creeping into a component library. The one arguably-generic
primitive is **reveal-on-scroll**, which could become a Lys scroll-mode transition later.

## The two separable features (don't conflate)

1. **Chapter nav as an enhancement** *(recommended first step)*
   - Opt-in via a container attribute (e.g. `data-lys-nav`).
   - Nav labels derived from each article's first heading → **no article-contract change**.
   - Sits on top of the existing scroll-snap model. Small, low-risk, high fit.
   - New behavior to own: generated nav, IntersectionObserver active state, progress bar,
     smooth jump, mobile toggle.

2. **A new long-scroll "document" layout** *(bigger move)*
   - Relax 1-article-per-viewport snap so sections can be any height like the proposal.
   - A genuine new `data-lys-mode` value and a philosophical step away from "slides."

These can ship independently; #1 is the clear first win.

## Open API questions (require "ask before doing" per CLAUDE.md)

- A new `data-lys-nav` (or similar) container attribute — additive, but it's public surface.
- Deriving nav labels from headings avoids a new per-article `data-*` attribute; an explicit
  `data-nav-label` override would be an article-contract change → must ask first.
- A new `data-lys-mode` value (document layout) is a behavioral API addition → must ask first.

## Suggested next step

If we proceed, start with feature #1 and write `specs/spa-nav.spec.md` (Blueprint + Contract)
before any code, per the spec-driven workflow.
