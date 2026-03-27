# LLM Deliverables — llms.txt and skill/SKILL.md

## Blueprint (Design)

### Context

Lys exists primarily as a **target format for LLMs** generating presentations. The library itself is invisible to the LLM — what the LLM sees is `llms.txt` (the API reference) and `skill/SKILL.md` (the authoring guide). If these artifacts are wrong, incomplete, or stale, every LLM-generated deck will be wrong. They are the primary binary artifacts of the project.

`llms.txt` follows the [llms.txt convention](https://llmstxt.org/) — a machine-readable project description concise enough to fit in a system prompt. `skill/SKILL.md` is a Claude Code slash command that wraps the reference with patterns, quality checks, and output conventions, enabling "make me a presentation about X" as a first-class workflow.

Both are **derived from the frozen 1.0 API surface** — they document what exists, not what's planned. They must be regenerated whenever the API changes.

### Architecture

#### `llms.txt` — API Reference

A single file at the project root. Content sections:

1. **Project summary** — One-paragraph description of what Lys is.
2. **HTML contract** — The `[data-lys]` container + `<article>` structure. All 5 data attributes (`data-notes`, `data-transition`, `data-class`, `data-background`, `data-timing`) with purpose and examples.
3. **CSS token API** — All 9 `--lys-*` public tokens with their default values. No `--_lys-*` internals.
4. **Events** — `lys:ready` and `lys:slidechange` with their `detail` shapes.
5. **JS API** — `Lys.init()`, `Lys.from()`, `new Lys()`, and the `LysInstance` interface (methods + properties).
6. **Inline usage** — A minimal complete example: single HTML file with inlined CSS and JS. Copy-paste ready.
7. **Size** — Raw byte sizes of `dist/lys.css` and `dist/lys.iife.js`.

**Constraint:** Must fit in ~2000 tokens. Every word must earn its place. No prose, no history, no rationale — just the contract.

**Source of truth:** ARCHITECTURE.md (article contract, tokens, events, API), `src/types.ts` (interface), `dist/` (actual sizes).

#### `skill/SKILL.md` — Authoring Skill

A Claude Code slash command at `skill/SKILL.md`. Content sections:

1. **Trigger** — When to use: user asks to create a presentation, slide deck, or talk.
2. **HTML contract** — Condensed from `llms.txt`. Container, articles, data attributes.
3. **Token reference** — The 9 public tokens with defaults and override examples.
4. **Slide patterns** — Recipes for common slide types:
   - Title slide (centered, gradient background, `data-class`)
   - Content slide (heading + bullet list)
   - Code slide (heading + `<pre><code>` block)
   - Image slide (`data-background` with image URL or gradient)
   - Two-column layout (CSS grid)
   - Quote slide (`<blockquote>` with attribution)
5. **Quality checklist** — Validation rules the agent must follow:
   - Every slide has a heading (`<h1>`–`<h6>`)
   - `data-notes` on every slide (speaker notes)
   - Valid HTML5 (`lang` attribute, charset, viewport meta)
   - Progressive enhancement (works without JS)
   - Print-friendly (content visible in `@media print`)
6. **Output template** — The complete HTML skeleton with the actual `lys.css` and `lys.iife.js` content inlined between marker comments. A post-build script (`scripts/inject-skill.js`) replaces the content between markers on every build, keeping the skill self-contained and fresh.
7. **Anti-patterns** — What NOT to generate:
   - No `<div>` slides (must be `<article>`)
   - No inline `onclick` or JS event handlers
   - No external dependencies or CDN links
   - No framework components
   - No `data-lys-*` state attributes (those are internal)

**Source of truth:** `llms.txt` + `examples/*.html` (patterns derived from real examples).

#### Derivation chain

```
ARCHITECTURE.md + src/types.ts + dist/
        ↓
    llms.txt (API reference)
        ↓
    llms.txt + examples/*.html
        ↓
    skill/SKILL.md (authoring skill)
```

Each artifact is derived from the one above. If `llms.txt` and the source disagree, `llms.txt` is wrong. If `SKILL.md` and `llms.txt` disagree, `SKILL.md` is wrong.

#### Post-build injection (`scripts/inject-skill.js`)

A Node script that runs after `vite build` to keep derived artifacts fresh:

1. Reads `dist/lys.css` and `dist/lys.iife.js`.
2. In `skill/SKILL.md`, replaces content between `<!-- LYS:CSS -->…<!-- /LYS:CSS -->` and `<!-- LYS:JS -->…<!-- /LYS:JS -->` marker pairs with the actual file contents.
3. In `llms.txt`, replaces content between `<!-- LYS:SIZES -->…<!-- /LYS:SIZES -->` markers with the current raw and gzip sizes.

The `pnpm build` script chains this: `tsc --noEmit && vite build && node scripts/inject-skill.js`.

Marker format in SKILL.md output template:
```html
<style>
<!-- LYS:CSS -->
…injected lys.css content…
<!-- /LYS:CSS -->
</style>
```

This makes the skill **fully self-contained** — an LLM with only SKILL.md can produce a working deck without repo access or network fetches.

#### Module boundaries

- `llms.txt` — project root, standalone text file
- `skill/SKILL.md` — `skill/` directory, Claude Code slash command format
- `scripts/inject-skill.js` — post-build script, no runtime impact

### Anti-Patterns

- **Speculating features.** Only document what exists in the 1.0 build. No "coming soon", no presenter mode, no fragment support.
- **Duplicating prose from VISION.md or ARCHITECTURE.md.** `llms.txt` is a compact reference, not documentation. Strip all motivation, history, and explanation.
- **Manually hardcoding dist file contents into SKILL.md.** The actual CSS+JS must be present in the skill (it must be self-contained), but they are injected by `scripts/inject-skill.js` on each build — never pasted by hand. Manual edits to the injected sections will be overwritten.
- **Including `--_lys-*` internal tokens.** Authors interact only with `--lys-*`. Internal tokens are implementation details.
- **Omitting the inline usage example from llms.txt.** This is the single most important section — without it, an LLM cannot produce a working deck.
- **Making SKILL.md too long.** If it exceeds the context window of the target model, it defeats the purpose. Aim for concise, scannable sections.
- **Generating llms.txt before the API is frozen.** Both artifacts are post-build deliverables. If the API changes, regenerate.

## Contract (Quality)

### Definition of Done

1. `llms.txt` exists at project root and contains all 7 sections listed in the Architecture.
2. `llms.txt` documents exactly the 5 data attributes from ARCHITECTURE.md — no more, no fewer.
3. `llms.txt` documents exactly the 9 `--lys-*` public tokens with correct default values matching `src/lys.css`.
4. `llms.txt` documents exactly the 2 events (`lys:ready`, `lys:slidechange`) with correct detail shapes matching `src/types.ts`.
5. `llms.txt` documents the `LysInstance` interface: 3 read-only properties + 4 methods, matching `src/types.ts`.
6. `llms.txt` includes a complete, valid inline HTML example that works when saved and opened in a browser.
7. `llms.txt` is under 2000 tokens (measurable via `wc -w`, target ~1200 words).
8. `llms.txt` file sizes match current `dist/` output.
9. `skill/SKILL.md` exists at `skill/SKILL.md`.
10. `skill/SKILL.md` includes at least 6 slide pattern recipes.
11. `skill/SKILL.md` includes a quality checklist with at least 5 validation rules.
12. `skill/SKILL.md` includes an output template skeleton.
13. `skill/SKILL.md` anti-patterns section lists at least 4 "do not generate" rules.
14. An LLM given `llms.txt` as context can produce a valid, working Lys deck (manual validation).
15. An LLM given `skill/SKILL.md` as a slash command can produce a themed, multi-slide presentation with speaker notes (manual validation).

### Regression Guardrails

- `llms.txt` must not reference any API that doesn't exist in `src/`. Every attribute, token, event, and method must be grep-able in the source.
- `llms.txt` must not reference `--_lys-*` internal tokens.
- `llms.txt` must not reference presenter mode, `lys:presenter`, or any post-1.0 feature.
- `skill/SKILL.md` must not contradict `llms.txt`. The skill is a superset (adds patterns + checks), never a divergent source.
- `skill/SKILL.md` must contain the actual `lys.css` and `lys.iife.js` content between marker comments, injected by the build. The skill must be usable without repo access.
- `dist/` sizes in `llms.txt` must match the actual build output. Both are updated automatically by `scripts/inject-skill.js`.

### Scenarios (Gherkin)

#### llms.txt — Completeness

```gherkin
Scenario: llms.txt documents all data attributes
  Given the llms.txt file
  When checked against ARCHITECTURE.md article contract
  Then it lists data-notes, data-transition, data-class, data-background, and data-timing
  And no other data attributes are listed

Scenario: llms.txt documents all public tokens
  Given the llms.txt file
  When checked against src/lys.css token declarations
  Then it lists all 9 --lys-* tokens with matching default values
  And no --_lys-* internal tokens are listed

Scenario: llms.txt documents all events
  Given the llms.txt file
  When checked against src/types.ts event map
  Then it lists lys:ready and lys:slidechange
  And the detail shapes match LysReadyDetail and LysSlideChangeDetail

Scenario: llms.txt documents the full LysInstance interface
  Given the llms.txt file
  When checked against src/types.ts LysInstance
  Then it lists current, total, slide (read-only properties)
  And next(), prev(), goTo(), destroy() (methods)
  And Lys.init(), Lys.from(), new Lys() (static/constructor)

Scenario: llms.txt includes a working inline example
  Given the inline HTML example from llms.txt
  When saved to a file and opened in a browser with dist/ assets available
  Then the presentation renders and is navigable

Scenario: llms.txt fits in a system prompt
  Given the llms.txt file
  When word count is measured
  Then it is under 1200 words
```

#### llms.txt — Accuracy

```gherkin
Scenario: llms.txt token defaults match source
  Given the llms.txt file
  And the src/lys.css file
  When each --lys-* token default in llms.txt is compared to the CSS declaration
  Then all defaults match exactly

Scenario: llms.txt file sizes match dist output
  Given the llms.txt file
  And the current dist/ build
  When the stated sizes are compared to actual file sizes
  Then they match within rounding (to nearest 0.1 KB)

Scenario: llms.txt contains no post-1.0 references
  Given the llms.txt file
  When searched for "presenter", "fragment", "plugin", "remote"
  Then no matches are found
```

#### skill/SKILL.md — Structure

```gherkin
Scenario: SKILL.md contains all required sections
  Given the skill/SKILL.md file
  Then it contains a trigger section
  And an HTML contract section
  And a token reference section
  And a slide patterns section with at least 6 patterns
  And a quality checklist with at least 5 rules
  And an output template section
  And an anti-patterns section with at least 4 rules

Scenario: SKILL.md slide patterns are valid HTML
  Given each slide pattern in skill/SKILL.md
  When the HTML fragments are checked
  Then each uses <article> as the slide element
  And each is valid HTML5

Scenario: SKILL.md does not contradict llms.txt
  Given the skill/SKILL.md file and the llms.txt file
  When token names, attribute names, and event names are compared
  Then they are identical in both files
```

#### Build freshness — inject script

```gherkin
Scenario: SKILL.md contains actual CSS after build
  Given a fresh pnpm build
  When skill/SKILL.md is read
  Then the content between <!-- LYS:CSS --> and <!-- /LYS:CSS --> matches dist/lys.css exactly

Scenario: SKILL.md contains actual JS after build
  Given a fresh pnpm build
  When skill/SKILL.md is read
  Then the content between <!-- LYS:JS --> and <!-- /LYS:JS --> matches dist/lys.iife.js exactly

Scenario: llms.txt sizes match after build
  Given a fresh pnpm build
  When llms.txt is read
  Then the file sizes table matches the actual dist/ output

Scenario: SKILL.md is self-contained
  Given an LLM with only skill/SKILL.md as context (no repo access)
  When asked to create a presentation
  Then the output contains the full lys.css in a <style> tag
  And the output contains the full lys.iife.js in a <script> tag
  And the file opens in a browser and works
```

#### Integration — LLM can produce valid output

```gherkin
Scenario: LLM produces a valid deck from llms.txt
  Given an LLM with llms.txt as context
  When asked to create a 5-slide presentation about any topic
  Then the output is a valid HTML5 file
  And it contains a [data-lys] container with <article> children
  And it includes lys.css and lys.iife.js (inline or linked)
  And it opens in a browser without errors

Scenario: LLM produces a themed deck from SKILL.md
  Given an LLM with skill/SKILL.md as context
  When asked to create a presentation about any topic
  Then the output includes custom --lys-* token values
  And at least one slide uses data-background
  And at least one slide uses data-notes
  And all slides have headings
```

## Test / Spec Alignment

These scenarios are **not automated in the test suite** — they are validation checks for documentation artifacts. Verification approach:

| Scenario group | Verification method |
|---|---|
| llms.txt completeness | Grep-based script comparing llms.txt against source files |
| llms.txt accuracy | Manual comparison + `wc -w` for word count |
| llms.txt sizes | `wc -c dist/*` comparison |
| skill/SKILL.md structure | Manual section checklist |
| LLM integration | Manual: paste llms.txt as context, generate a deck, open in browser |

A future CI step could automate the grep-based checks (tokens, attributes, events match source), but this is not required for 1.0.

## Related / Future

- **Full auto-generation.** `scripts/inject-skill.js` handles size and asset injection. Full regeneration of `llms.txt` prose from source could further prevent drift but is not needed at this API surface size.
- **llms-full.txt.** A longer version with examples and patterns for LLMs with larger context windows. The current `llms.txt` is the compact version.
- **Skill testing harness.** An automated test that invokes Claude with `SKILL.md` and validates the output HTML. Would catch skill regressions but requires API access.
