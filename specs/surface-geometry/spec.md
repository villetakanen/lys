---
generated:
  by: "pi/gpt-6.2-sol"
  at: "2026-11-23T20:09:22+02:00"
verified:
  - by: "human:ville.takanen"
    at: "2026-11-23T18:23:20+02:00"
  - by: "human:ville.takanen"
    at: "2026-11-23T18:38:12+02:00"
---

# Lys 2.0 surface and geometry CSS

## Blueprint (Design)

### Context

Lys fits the slide frame to the viewport; authors compose everything inside it. This spec defines the screen surface agreed in the [2.0 roadmap](../../docs/reports/lys-2.0-release-plan.md).

### Architecture

- **Frame.** `[data-lys]` owns the backdrop. Each direct `article` child is a slide, a CSS size container (`container-type: size`), and a containing block for positioned content. Descendant queries, units, and percentage positioning follow native CSS rules, including authored nested containers and containing blocks.
- **Fit.** With usable viewport dimensions `W × H` and deck width-to-height ratio `r`, the settled frame is centered and measures `min(W, H × r)` by `min(H, W ÷ r)`, subject to subpixel rounding. Both dimensions are definite. Fit uses the deck document's viewport, including in an iframe, and recomputes on resize without changing slide selection. Browser zoom remains native.
- **Clip.** The article clips descendant painting at its boundary, including positioned or transformed content and shadows. The frame is not a content scroller; authored scroll regions inside it remain native. Clipping does not decide focus or accessibility exposure.
- **Paint.** The backdrop defaults to `light-dark(#f3f6f9, #111820)` and each slide background to `light-dark(white, black)`. The deck opts into `color-scheme: light dark` locally; authors can override that property on the deck. Normal inheritance and native UA scheme effects apply. Authors own contrast. These paint defaults have zero specificity, so any author selector, even a bare `article` or a later `[data-lys]` rule, overrides the backdrop, slide background, and colour scheme, including with `transparent`.

| Screen setting | Contract |
| --- | --- |
| `--lys-aspect-ratio` | One value resolved on the deck, including through inheritance. Accept a finite positive CSS `<ratio>` (a single positive number has denominator 1). A missing value uses `16 / 9`. With JavaScript, invalid values, including zero, negative, or non-finite ratios, also use `16 / 9`, without altering authored markup or the author's declaration. Without JavaScript, invalid values follow normal CSS rules. A cascade change on the deck updates all frames; slide-local declarations have no effect. |
| `--lys-backdrop` | Deck-level CSS background override. `transparent` is valid; invalid overrides follow normal CSS rules. |

`src/lys.css` owns frame geometry and paint. Transitions share the same frame dimensions and clip; reduced motion makes engine changes immediate without suppressing author animation. Before enhancement, frame styling must not hide authored payload. Print preserves the ratio, definite query-container dimensions, and clip. Default programmatic slide changes are immediate. During migration, the existing fade/direct modes use the same settled geometry and fade runs only when motion is allowed. The final deck-wide transition configuration is tracked separately in the roadmap; this increment does not introduce an author setting. Before enhancement, screen articles retain definite frames in normal flow without engine clipping. Print pagination and full fallback verification are separate tasks.

### Token migration

| 1.x token | 2.0 disposition |
| --- | --- |
| `--lys-aspect-ratio` | Retain; move per-article declarations to the deck. Default 16/9 |
| `--lys-backdrop` | Retain backdrop capability; near-white/near-black blue-grey light-dark defaults |
| `--lys-slide-max-width`, `--lys-slide-max-height` | Remove from screen geometry; size the iframe if the presentation needs a smaller viewport |
| `--lys-slide-padding`, `--lys-font-size-base` | Remove; use ordinary CSS for spacing and typography, with container-relative units where they should scale with the frame |
| `--lys-slide-gap` | Remove; no adjustable gap between enhanced frames |
| `--lys-focus-ring` | Not a 2.0 surface setting; preserve native focus indicators |

Override the slide background with ordinary article background CSS; no token is needed.

### Anti-Patterns

Do not measure or rearrange payload to make it fit, add engine padding, typography, foreground or focus styling, or repair markup in response to invalid CSS. No new author-facing tokens, attributes, events, or container names.

## Contract (Quality)

### Definition of Done

The scenarios below hold with production CSS under the verification requirements in [PROJECT.md](../../PROJECT.md).

### Regression Guardrails

Frame styling preserves authored IDs, semantics, focusability, and native control actions. The token migration table records the disposition of historical 1.x CSS settings.

### Scenarios (Gherkin)

```gherkin
Scenario: Fit and containment
  Given a deck at 16:9, 24:10, 9:19.5, or 1:1
  When the viewport, including an iframe viewport, changes between width-limited and height-limited sizes
  Then the selected frame remains centered and fits at the deck ratio
  And descendant cqw and cqh without a nearer query container track the article, not the viewport

Scenario: Deck ratio cascade
  Given the deck ratio is missing, or invalid with JavaScript enabled
  Then all slides use 16:9
  When a valid ratio is applied to the deck and a conflicting token to one article
  Then all slides use the new deck ratio

Scenario: Frame clipping
  Given a letterboxed slide with oversized, transformed or fixed descendants and an authored scroll region
  Then descendant paint stops at the article boundary
  And the scroll region still scrolls independently

Scenario: Surface cascade
  Given an enhanced deck with a light or dark scheme from browser preference or an explicit deck override
  Then the backdrop and slide have distinct scheme-appropriate default colours
  And the authored foreground and typography are unchanged
  When the author overrides the backdrop token and the slide background with low-specificity selectors such as `article`
  Then both overrides win, including transparent values
```

## Test / Spec Alignment

All four scenarios → `tests/e2e/slides.spec.ts` and `tests/fixtures/surface.html` (production CSS and IIFE). Default navigation and legacy transition motion gates → `tests/unit/navigation.test.ts` and `tests/e2e/transitions.spec.ts`. This contract supersedes the screen fit, surface token, outline suppression, and default navigation motion requirements in the historical 1.x specs.
