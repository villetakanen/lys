# Container-Relative Token Defaults

## Blueprint (Design)

### Context

With `container-type: size` on articles (#28), slides are now CSS size containers. But the two tokens that govern content sizing — `--lys-font-size-base` and `--lys-slide-padding` — still use viewport-relative or absolute units. This means content does not scale with the slide canvas.

Per ADR-002, changing these defaults to `cqi` units is the user-visible payoff of the container-type foundation. After this change:
- Text and padding scale proportionally when the slide shrinks (e.g., non-native aspect ratios, embedded decks).
- LLM-generated decks work at any viewport size without manual font tuning.
- A `clamp()` floor prevents text from becoming unreadably small on very small containers.

This is a **token default change**, which is a visual change for existing decks that don't override the tokens. It is approved via ADR-002.

### Architecture

#### Token changes

Two internal token defaults change in `src/lys.css`:

| Token | Before | After |
|---|---|---|
| `--_lys-font-size-base` | `clamp(1rem, 2vw, 1.5rem)` | `clamp(0.75rem, 2.5cqi, 1.5rem)` |
| `--_lys-slide-padding` | `2rem` | `4cqi` |

The public API tokens (`--lys-font-size-base`, `--lys-slide-padding`) are unchanged — authors still override them at any cascade level. Only the fallback defaults change.

The exact `cqi` multipliers (2.5 and 4) should be tuned during implementation to produce comparable visual output at 1920x1080 with 16:9 slides. The values from ADR-002 are starting points, not mandates.

#### Tuning reference

At a 1920x1080 viewport with 16:9 slides, the article content-box width is approximately 1920px minus padding. Key equivalences to match:

- Current font-size at 1920px wide: `clamp(1rem, 2vw, 1.5rem)` → `2vw` = 38.4px, clamped to 24px max (1.5rem). So the effective value is **24px** (1.5rem ceiling).
- Target: `2.5cqi` of ~1856px content width ≈ 46.4px, clamped to 24px. Same ceiling applies. At narrower widths, `cqi` scales with the slide rather than the viewport — this is the improvement.
- Current padding: `2rem` = 32px. Target: `4cqi` of ~1920px article width ≈ 76.8px. This is larger. Tune downward if needed (e.g., `3cqi` ≈ 57.6px).

#### Module boundaries

- **`src/lys.css`** — Token default values change (2 lines).
- **`ARCHITECTURE.md`** — Token table updated with new defaults.
- **`specs/lys-core.spec.md`** — Token table updated with new defaults.
- **`site/index.html`** — Token reference table updated (if one exists).
- **`tests/unit/tokens.test.ts`** — Expected default values updated.
- **No JS changes.** Token resolution is pure CSS.

#### Integration points

- **Container type** (`container-type.spec.md`): Depends on #28. `cqi` units only work because articles are now size containers.
- **Print layout**: `@media print` resets `container-type: normal` (#28). With `cqi` in a non-contained context, the browser falls back to viewport-relative resolution (confirmed across Chromium, Firefox, and WebKit). For font-size, the `clamp()` ceiling (`1.5rem`) typically applies at print-sized viewports. For padding, `4cqi` falls back to a viewport-relative value — not zero.
- **Reduced motion**: Unaffected. These tokens control sizing, not animation.
- **Transitions**: Unaffected. `--lys-transition-duration` and `--lys-transition-easing` are unchanged.

### Anti-Patterns

- **Using `vw`/`vh` in the new defaults.** The entire point is to move away from viewport-relative units. Using `vw` as a fallback inside `clamp()` would reintroduce the problem.
- **Removing the `clamp()` floor on font-size.** Without a minimum, text becomes unreadable on very small containers. The `0.75rem` floor is a safety net.
- **Adding `clamp()` to padding.** Padding collapsing to zero on small containers is acceptable behavior — it maximizes content area. A `clamp()` floor on padding would waste space on small slides.
- **Changing the public token names.** `--lys-font-size-base` and `--lys-slide-padding` are public API. Only the defaults (the fallback values in the `var()`) change.
- **Hardcoding pixel values.** The defaults must remain relative units so they scale.
- **Forgetting to update documentation.** ARCHITECTURE.md and the lys-core spec both contain the token table — both must be updated in the same changeset.

## Contract (Quality)

### Definition of Done

1. `--_lys-font-size-base` default uses `cqi` units inside a `clamp()` with a `rem` floor.
2. `--_lys-slide-padding` default uses `cqi` units.
3. At 1920x1080 with 16:9 slides, visual output is comparable to current defaults (font-size hits the clamp ceiling; padding is in a reasonable range).
4. At 960x540, font-size and padding are visibly smaller than at 1920x1080 (scaling works).
5. At extreme aspect ratios (1:1 on a widescreen viewport), text scales with the slide and does not overflow.
6. `clamp()` floor prevents font-size from dropping below `0.75rem` on very small containers.
7. Authors can override both tokens with absolute values (`rem`, `px`) and the overrides take effect.
8. Print layout: text is readable (cqi falls back to viewport; clamp ceiling applies).
9. `prefers-reduced-motion` still works (transition tokens unchanged).
10. ARCHITECTURE.md token table reflects new defaults.
11. `specs/lys-core.spec.md` token table reflects new defaults.
12. No regressions in unit tests (after updating expected values).
13. No regressions in e2e tests.
14. Bundle size stays within budget (CSS < 2 KB gzip).

### Regression Guardrails

- All nine two-tier tokens must still be declared. The count must not change.
- The public token names (`--lys-font-size-base`, `--lys-slide-padding`) must not change.
- Author overrides at `:root`, `[data-lys]`, and `<article>` levels must still cascade correctly.
- `lys.css` must contain no `@import` or `url()` directives.
- `lys.css` must remain under 2 KB gzip.
- A minimal deck must still render as a visible, full-viewport slide with only `lys.css` loaded.
- `prefers-reduced-motion: reduce` must still set transition duration to `0ms`.

### Scenarios (Gherkin)

#### Token declaration

```gherkin
Scenario: font-size-base default uses cqi with clamp floor
  Given the lys.css source
  Then --_lys-font-size-base resolves to var(--lys-font-size-base, clamp(0.75rem, <N>cqi, 1.5rem))
  And the clamp floor is 0.75rem
  And the clamp ceiling is 1.5rem

Scenario: slide-padding default uses cqi units
  Given the lys.css source
  Then --_lys-slide-padding resolves to var(--lys-slide-padding, <N>cqi)
```

#### Scaling behavior

```gherkin
Scenario: font-size scales with slide at standard viewport
  Given a [data-lys] container with a 16:9 article at 1920x1080
  Then the computed font-size is between 16px and 24px (within clamp range)

Scenario: font-size scales down at half viewport
  Given a [data-lys] container with a 16:9 article at 960x540
  Then the computed font-size is smaller than at 1920x1080
  And the computed font-size is at least 12px (0.75rem floor)

Scenario: font-size hits clamp floor on very small container
  Given a [data-lys] container with a 16:9 article at 320x180
  Then the computed font-size is 12px (0.75rem floor)

Scenario: padding scales with slide width
  Given a [data-lys] container with a 16:9 article at 1920x1080
  And the same deck at 960x540
  Then the padding at 960x540 is smaller than at 1920x1080
```

#### Author overrides

```gherkin
Scenario: author override with absolute rem value
  Given an author sets --lys-font-size-base: 1.25rem on :root
  Then the computed font-size on articles is 20px regardless of container size

Scenario: author override with px value on a single article
  Given an author sets --lys-slide-padding: 16px on one <article>
  Then that article has 16px padding
  And sibling articles use the cqi default

Scenario: author override at container level
  Given an author sets --lys-slide-padding: 2rem on [data-lys]
  Then all articles in that container have 2rem padding
```

#### Print layout

```gherkin
Scenario: print layout has readable text
  Given a [data-lys] container with articles
  When @media print applies (container-type reset to normal)
  Then cqi falls back to viewport-relative resolution
  And font-size is clamped by the clamp ceiling (1.5rem = 24px)
  And text is visible and readable

Scenario: print layout padding behavior
  Given a [data-lys] container with articles
  When @media print applies (container-type reset to normal)
  Then padding falls back to a viewport-relative value (cqi resolves against viewport when no container exists)
  Or padding is overridden by author CSS
```

#### Extreme aspect ratios

```gherkin
Scenario: 1:1 aspect ratio on widescreen viewport
  Given a [data-lys] container with --lys-aspect-ratio: 1/1
  And a 1920x1080 viewport
  Then the article is 1080x1080 (constrained by height)
  And font-size scales relative to 1080px width, not 1920px viewport
  And content does not overflow the article

Scenario: 24:10 cinema ratio on portrait viewport
  Given a [data-lys] container with --lys-aspect-ratio: 24/10
  And a 430x932 viewport (mobile portrait)
  Then the article is a narrow horizontal strip
  And font-size scales down with the narrow slide width
  And the clamp floor prevents text from becoming invisible
```

#### Documentation

```gherkin
Scenario: ARCHITECTURE.md token table is current
  Given the ARCHITECTURE.md file
  Then the --_lys-font-size-base row shows the new cqi-based default
  And the --_lys-slide-padding row shows the new cqi-based default

Scenario: lys-core spec token table is current
  Given the specs/lys-core.spec.md file
  Then the token table reflects the new defaults
```

## Test / Spec Alignment

| Scenario group | Test file |
|---|---|
| Token declaration | `tests/unit/tokens.test.ts` |
| Scaling behavior | `tests/e2e/slides.spec.ts` |
| Author overrides | `tests/e2e/slides.spec.ts` |
| Print layout | `tests/e2e/print.spec.ts` |
| Extreme aspect ratios | `tests/e2e/slides.spec.ts` |
| Documentation | Manual review (or unit test reading file content) |

Token declaration tests are unit tests (string matching on CSS source). Scaling and override behavior requires a real browser — these are e2e tests.

## Related / Future

- **#28 — Container-type size** (prerequisite, already shipped).
- **#30 — Example migration.** After token defaults change, example decks should use `em`-based heading sizes that scale with the new base font size.
- **#31 — Spec and docs update.** The lys-core spec and ARCHITECTURE.md token tables must be updated as part of THIS changeset (same-commit rule), but #31 may cover additional doc updates beyond the token table.
