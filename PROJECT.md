# ⚜ Lys — Project Setup & Development Guide

> Scaffolding instructions, toolchain configuration, and agentic workflow conventions.

## Toolchain

| Intent | Tool | Config |
|---|---|---|
| Build & dev server | Vite | `vite.config.ts` — library mode, ESM + IIFE dual output |
| Lint & format | Biome | `biome.json` |
| Git hooks | Lefthook | `lefthook.yml` |
| Commit convention | Conventional Commits | Enforced via Lefthook `commit-msg` hook |
| Type checking | TypeScript | `tsconfig.json` — strict mode |
| Unit tests | Vitest | `vitest.config.ts` — happy-dom for fast DOM tests |
| E2E tests | Playwright | `playwright.config.ts` — real browser verification |
| Package manager | pnpm | `pnpm-lock.yaml` |

## Scaffold Steps

### 1. Initialize the project

```bash
pnpm init
```

Set `"name": "lys"`, `"type": "module"` in `package.json`.

### 2. Install dev dependencies

```bash
pnpm add -D typescript vite @biomejs/biome lefthook vitest @vitest/coverage-v8 happy-dom @playwright/test
```

Zero runtime dependencies. This is a hard constraint.

### 3. TypeScript configuration

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

### 4. Vite configuration

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/lys.ts"),
      name: "Lys",
      formats: ["es", "iife"],
      fileName: (format) => format === "es" ? "lys.js" : "lys.iife.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "lys.[ext]",
      },
    },
    cssMinify: true,
    minify: "esbuild",
    target: "es2022",
  },
});
```

This produces:
- `dist/lys.js` — ESM module
- `dist/lys.iife.js` — Script-tag drop-in (exposes `window.Lys`)
- `dist/lys.css` — Structural stylesheet (extracted from CSS imports)

### 5. Biome configuration

`biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.x/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "useConst": "error",
        "noVar": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

### 6. Testing configuration

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
```

`playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "pnpm dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:5173",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
```

### 7. Lefthook & Conventional Commits

`lefthook.yml`:
```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.{ts,css,json}"
      run: pnpm biome check --write {staged_files}
      stage_fixed: true
    typecheck:
      run: pnpm tsc --noEmit
    unit-test:
      run: pnpm vitest run

commit-msg:
  commands:
    conventional:
      run: |
        MSG=$(cat {1})
        if ! echo "$MSG" | grep -qE '^(feat|fix|refactor|docs|test|chore|build|ci|perf|style|revert)(\(.+\))?!?:\ .+'; then
          echo "Commit message must follow Conventional Commits: type(scope): description"
          exit 1
        fi
```

### 7. Package scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "biome check --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "vitest run && playwright test",
    "prepare": "lefthook install"
  }
}
```

### 8. File structure

```
/Projects/Lys/
  VISION.md              ← product vision & API contract
  PROJECT.md             ← you are here
  CLAUDE.md              ← agent constitution
  package.json
  tsconfig.json
  vite.config.ts
  biome.json
  lefthook.yml
  src/
    lys.css              ← structural styles + design tokens
    lys.ts               ← entry point, auto-init, public API
    navigation.ts        ← keyboard, touch, hash routing
    presenter.ts         ← presenter mode (lazy-loaded)
    a11y.ts              ← ARIA live region, focus management
    types.ts             ← shared type definitions
  specs/
    lys-core.spec.md     ← spec: slide rendering, tokens, layout
    navigation.spec.md   ← spec: keyboard, touch, hash routing
    presenter.spec.md    ← spec: presenter mode
    a11y.spec.md         ← spec: accessibility contract
  examples/
    minimal.html         ← 4-line deck
    themed.html          ← custom tokens + author CSS
    full.html            ← all features demonstrated
  tests/
    unit/
      lys.test.ts        ← core init, auto-discovery, lifecycle
      navigation.test.ts ← keyboard, touch, hash routing logic
      a11y.test.ts       ← ARIA attributes, live region, focus
      tokens.test.ts     ← CSS custom property resolution
    e2e/
      slides.spec.ts     ← slide rendering, navigation, transitions
      presenter.spec.ts  ← presenter mode, BroadcastChannel sync
      a11y.spec.ts       ← axe-core scans, screen reader flow
      print.spec.ts      ← @media print layout
    fixtures/
      minimal.html       ← 4-line deck for testing
      full.html          ← all features for e2e
  dist/                  ← build output (git-ignored)
  llms.txt               ← LLM-readable project description (post-build)
  skill/
    SKILL.md             ← Cowork / Claude Code skill for Lys authoring
  vitest.config.ts
  playwright.config.ts
  LICENSE
  README.md
```

## Testing Strategy

Two layers, each with a clear purpose.

### Unit Tests (Vitest + happy-dom)

Fast, isolated tests for the JS/TS logic. Run in happy-dom — no real browser, no network. These verify:

- **Initialization** — `Lys.init()` discovers `[data-lys]` containers, creates instances, emits `lys:ready`.
- **Navigation logic** — `next()`, `prev()`, `goTo()` update state correctly; boundary clamping; hash sync.
- **Event dispatch** — `lys:slidechange` fires with correct `detail` shape.
- **Token resolution** — CSS custom properties inherit and cascade as designed (via `getComputedStyle` in happy-dom).
- **A11y attributes** — Correct `role`, `aria-live`, `aria-roledescription`, `tabindex` on init and slide change.
- **Destroy lifecycle** — Event listeners removed, ARIA attributes cleaned up.

Unit tests map 1:1 to the `specs/*.spec.md` Gherkin scenarios. Every `Given/When/Then` in a spec should have a corresponding `it()` block.

### E2E Tests (Playwright)

Real browser tests against the Vite dev server. These verify things happy-dom cannot:

- **Visual layout** — Slides fill the viewport at the correct aspect ratio.
- **Keyboard navigation** — Arrow keys, Space, Home/End actually change slides in a real browser.
- **Touch/swipe** — Simulated touch gestures trigger navigation.
- **Transitions** — CSS transitions and `prefers-reduced-motion` behave correctly.
- **Presenter mode** — `BroadcastChannel` sync between windows works.
- **Print layout** — `@media print` produces one slide per page.
- **Accessibility audit** — `@axe-core/playwright` scans for WCAG 2.1 AA violations on every fixture.
- **Progressive enhancement** — Deck is navigable with JS disabled (CSS-only scroll-snap).

E2E tests run against `tests/fixtures/*.html` — standalone decks that exercise the real built output.

### Test / Spec Alignment

```
specs/lys-core.spec.md    →  tests/unit/lys.test.ts + tests/unit/tokens.test.ts
specs/navigation.spec.md  →  tests/unit/navigation.test.ts + tests/e2e/slides.spec.ts
specs/presenter.spec.md   →  tests/e2e/presenter.spec.ts
specs/a11y.spec.md        →  tests/unit/a11y.test.ts + tests/e2e/a11y.spec.ts
```

If a spec scenario has no corresponding test, that's a gap. If a test has no spec scenario, the spec needs updating.

### Coverage Targets

| Metric | Target |
|---|---|
| Statement coverage (unit) | ≥ 90% |
| Branch coverage (unit) | ≥ 85% |
| E2E pass rate (3 browsers) | 100% |
| axe-core violations | 0 critical, 0 serious |

### When Tests Run

| Trigger | What runs |
|---|---|
| Pre-commit (Lefthook) | `vitest run` (unit only — fast) |
| `pnpm test:all` | Unit + E2E (full suite) |
| CI (future) | Unit + E2E + coverage report |

## Agentic Workflow (ASDLC)

This project follows a **spec-anchored** development model. Specs are living documents that define the contract; code fulfills the contract. Neither is disposable.

### Development Flow

```
1. VISION.md        — Product intent (human-authored, rarely changes)
2. specs/*.spec.md  — Feature contracts: Blueprint + Quality (human or agent)
3. PBI              — Task delta referencing the spec (agent-consumable)
4. Implementation   — Code fulfilling the spec (agent-generated, human-reviewed)
5. Verification     — Toolchain gates (Biome, TSC, browser tests)
6. Spec update      — If implementation reveals new constraints, update the spec
```

### Spec Structure

Each spec in `specs/` follows this anatomy:

```markdown
# Feature Name

## Blueprint (Design)

### Context
Why does this feature exist?

### Architecture
API contracts, DOM structure, event flow.

### Anti-Patterns
What agents must NOT do.

## Contract (Quality)

### Definition of Done
Observable success criteria.

### Regression Guardrails
Invariants that must never break.

### Scenarios (Gherkin)
Given/When/Then behavioral specifications.
```

### Commit Convention

Conventional Commits, enforced by Lefthook. Micro-commit granularity during development — one commit per discrete change. Squash to logical units before merge if desired.

```
feat(core): add slide container initialization
fix(nav): prevent double-fire on rapid arrow key
refactor(presenter): extract timer into standalone module
docs(spec): add edge case scenario for empty decks
test(a11y): verify live region announces slide changes
chore(build): update Vite to 6.x
```

### Agent Constitution

See [CLAUDE.md](./CLAUDE.md) for the full agent constitution — hard constraints, judgment boundaries, commit conventions, and spec-driven workflow instructions.

### Working with Specs as an Agent

When an agent receives a task:

1. **Read** the relevant `specs/*.spec.md` first — this is the contract.
2. **Plan** the implementation against the spec's Blueprint section.
3. **Implement** in micro-commits, one module at a time.
4. **Verify** against the spec's Contract section (Gherkin scenarios).
5. **Update the spec** if implementation reveals missing constraints.

The spec is the authority. If code and spec disagree, the spec wins — unless the spec is wrong, in which case update it first, then update the code.

## Build Targets

| Output | Format | Usage |
|---|---|---|
| `dist/lys.js` | ESM | `import { Lys } from './lys.js'` |
| `dist/lys.iife.js` | IIFE | `<script src="lys.iife.js"></script>` → `window.Lys` |
| `dist/lys.css` | CSS | `<link rel="stylesheet" href="lys.css">` |

## Size Budget

Enforced manually during review (automated gate can be added later):

| Artifact | Budget (minified + gzip) |
|---|---|
| `lys.js` (ESM) | < 5 KB |
| `lys.css` | < 2 KB |
| `lys.iife.js` | < 6 KB |

## Post-Build Deliverables

These artifacts are written **after** the library is implemented and stable. They are derived from the real API surface, not predicted.

### `llms.txt`

Machine-readable project description following the [llms.txt](https://llmstxt.org/) convention. Content is distilled from the verified implementation:

- The `<article>` contract (required structure, optional `data-*` attributes)
- CSS token API (`--lys-*` public surface with defaults)
- Custom events and their `detail` shapes
- JS API (`Lys.init()`, instance methods)
- A minimal complete example (copy-paste ready)
- A full-featured example showing all capabilities

The `llms.txt` is the **single source of truth** an LLM needs to generate a correct Lys deck. It should be concise enough to fit comfortably in a system prompt or tool context.

### `skill/SKILL.md`

A Cowork / Claude Code skill that enables "make me a presentation about X" as a first-class workflow. The skill wraps `llms.txt` content with:

- Slide pattern recipes (title slide, content slide, code slide, image slide, two-column, quote)
- Token presets for common aspect ratios and spacing
- Quality checklist (valid structure, headings present, `data-notes` on all slides, print-friendly)
- Output conventions (where to save, how to include Lys assets)

The skill is authored last because it depends on everything else being settled — it's the integration test for the entire developer experience.

### Generation order

```
1. Build library          → dist/lys.js, dist/lys.css
2. Write examples         → examples/*.html (exercising real API)
3. Derive llms.txt        → from VISION.md contracts + verified dist/ output
4. Author skill/SKILL.md  → from llms.txt + examples + specs
```

Each step validates the previous one. If the skill can't produce a working deck, something upstream is wrong.

---
