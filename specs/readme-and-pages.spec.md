# README, GitHub Pages & SEO

## Blueprint (Design)

### Context

Lys needs a public web presence for discoverability by both humans and LLMs. The library is feature-complete for 1.0 but invisible — there is no README beyond the scaffold default, no public demo, and no SEO metadata. This blocks `npm publish` (#18) because the README ships with the npm package.

Three layers:
1. **README.md** — The first thing a developer or LLM sees on GitHub or npm. Must convey what Lys is, show a working example, and link to deeper resources.
2. **GitHub Pages site** — A conventional HTML page with quick-start instructions, reference tables, and links to live example decks. Optimized for SEO, accessibility, and LLM crawling.
3. **SEO/OpenGraph metadata** — So the Pages site renders well in search results, social cards, and LLM web fetches.

### Architecture

#### README.md

A single Markdown file at the project root. Sections in order:

1. **Title + badges** — `⚜ Lys` with npm version, bundle size (CSS + JS), and license badges.
2. **One-line pitch** — What Lys is in one sentence.
3. **Live demo link** — Points to the GitHub Pages site.
4. **"What it does"** — 3 bullets max: structural slides, zero-dependency, LLM-first.
5. **Minimal example** — The 4-line deck from `examples/minimal.html` (the `<div data-lys>` + `<article>` pattern). Copy-paste ready.
6. **CDN usage** — `<script>` and `<link>` tags using `unpkg.com/lys`.
7. **Token customization** — A `--lys-*` override snippet showing 2-3 tokens.
8. **"For LLMs"** — Points to `llms.txt` (raw URL on GitHub) and `skill/SKILL.md`. Explains that LLMs should read `llms.txt` for the full API reference.
9. **Links** — Pages site, `llms.txt`, `examples/`, `ARCHITECTURE.md`.
10. **License** — MIT, one line.

**Constraints:**
- No install-from-source instructions in the README body — link to PROJECT.md instead.
- No API reference in the README — that lives in `llms.txt` and ARCHITECTURE.md. The README is marketing, not documentation.
- Badge URLs must use shields.io or similar static badge services — no custom badge servers.

#### GitHub Pages site (`site/index.html`)

A single conventional HTML page — documentation, not a presentation.

Sections:
1. **Header** — Project name, one-line pitch, link to GitHub repo.
2. **Quick start** — CDN `<script>` + `<link>` tags, minimal HTML.
3. **Token reference** — Table of all 9 `--lys-*` tokens with defaults.
4. **Article contract** — Table of all 5 `data-*` attributes.
5. **Examples** — Links to `examples/*.html` served from Pages (live over HTTPS).
6. **Footer** — Links to GitHub repo, npm, `llms.txt`, license.

**File location:** `site/index.html`. This introduces a new top-level directory (`site/`) — a file structure change per CLAUDE.md. GitHub Pages will be configured to serve from this directory.

**`llms.txt` on Pages:** Copy `llms.txt` into the site directory so it's accessible at the Pages root URL (e.g., `https://villetakanen.github.io/lys/llms.txt`).

#### GitHub Actions workflow (`.github/workflows/pages.yml`)

Deploys the `site/` directory to GitHub Pages on push to `main`. Uses the standard `actions/deploy-pages` workflow:

1. Checkout
2. `pnpm install && pnpm build`
3. Copy `llms.txt` into `site/`
4. Copy `examples/*.html` into `site/examples/`
5. Copy `dist/lys.css` and `dist/lys.iife.js` into `site/examples/`
6. Rewrite example asset paths: `/src/lys.css` → `lys.css`, `/src/lys.ts` → `lys.iife.js`. Also change `<script type="module" src="...">` to `<script src="...">` since the IIFE build is a classic script, not an ESM module.
7. Upload `site/` as Pages artifact
8. Deploy

The workflow builds fresh so the site always has the latest dist output. Examples need path rewriting because they reference Vite dev server paths (`/src/lys.ts`) that don't exist on the static Pages site.

#### SEO metadata (in `site/index.html`)

```html
<meta name="description" content="Zero-dependency CSS+JS slide engine. Turns <article> elements into accessible presentations. Designed for LLM-generated single-file HTML.">
<meta property="og:title" content="⚜ Lys — Structural Slide Engine">
<meta property="og:description" content="Zero-dependency slide engine for LLM-generated presentations. < 8 KB total.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://villetakanen.github.io/lys/">
<link rel="canonical" href="https://villetakanen.github.io/lys/">
```

`og:image` is optional for 1.0 — a screenshot of the demo deck would be ideal but is not blocking.

#### package.json fields

```json
{
  "homepage": "https://villetakanen.github.io/lys/",
  "repository": {
    "type": "git",
    "url": "https://github.com/villetakanen/lys.git"
  },
  "bugs": {
    "url": "https://github.com/villetakanen/lys/issues"
  }
}
```

#### Module boundaries

- **`README.md`** — Project root. Markdown only, no build step.
- **`site/index.html`** — New directory `site/`. Conventional HTML, self-contained.
- **`.github/workflows/pages.yml`** — CI workflow. No runtime impact.
- **`package.json`** — Metadata fields only (`homepage`, `repository`, `bugs`).
- **`llms.txt`** — Already exists; copied to `site/` by the workflow, not modified.

No changes to `src/`, `specs/` (other than this spec), `tests/`, or `dist/`.

### Anti-Patterns

- **Making the Pages site a Lys deck.** The site must be a conventional HTML document. Slide decks are terrible for SEO, screen reader navigation of documentation, and LLM web scraping. Link to example decks instead.
- **Duplicating API documentation in README.** The README links to `llms.txt` and ARCHITECTURE.md. It does not reproduce token tables, event signatures, or the full API. Duplication creates drift.
- **Embedding a live Lys deck in the site.** Lys owns the full viewport (`height: 100vh`, scroll-snap). There is no embedded/contained mode. Link to example decks instead of trying to inline one.
- **Adding a static site generator.** No Jekyll, Hugo, Astro, or similar. The site is one HTML file. Lys is a zero-dependency project; its website should reflect that simplicity.
- **External dependencies on the Pages site.** No CDN links for fonts, icons, or analytics. The page must work offline after initial load (same self-contained philosophy as Lys decks).
- **Framework components in the site.** No React, Vue, or web components. Plain HTML + CSS.

## Contract (Quality)

### Definition of Done

1. `README.md` exists and contains all 10 sections listed in the Architecture.
2. `README.md` minimal example is valid HTML that works with Lys.
3. `README.md` CDN URLs use `unpkg.com/lys` (the npm package name).
4. `README.md` links to the Pages site, `llms.txt`, examples, and ARCHITECTURE.md — all links resolve.
5. `README.md` contains no install-from-source instructions in the body.
6. `site/index.html` exists and is a valid HTML5 document (not a Lys deck).
7. `site/index.html` includes a token reference table listing all 9 `--lys-*` tokens.
8. `site/index.html` includes an article contract table listing all 5 `data-*` attributes.
9. `site/index.html` has `<meta name="description">`, `og:title`, `og:description`, and `<link rel="canonical">`.
10. `site/index.html` has no external dependencies (no CDN links, no `<script src>` to external hosts).
11. `.github/workflows/pages.yml` exists and deploys `site/` to GitHub Pages on push to `main`.
12. The workflow copies `llms.txt` and `examples/*.html` (with rewritten asset paths) into the site before deploy.
13. `package.json` has `homepage`, `repository`, and `bugs` fields set.
14. `llms.txt` is accessible at the Pages site root URL after deployment.
15. All example files are accessible as live demos over HTTPS after deployment.

### Regression Guardrails

- `README.md` must not contain a full API reference — it links to `llms.txt` and ARCHITECTURE.md.
- `site/index.html` must not be a Lys deck (no `data-lys` container).
- The Pages workflow must not modify source files or push to the source branch.
- Token names and defaults in the site's reference table must match `src/lys.css` exactly. If they drift, the site is wrong.
- Data attribute names in the site's contract table must match ARCHITECTURE.md exactly.

### Scenarios (Gherkin)

These scenarios are **documentation validation checks**, not automated test suite scenarios. Verification is manual or script-based.

#### README — Content

```gherkin
Scenario: README contains all required sections
  Given the README.md file
  Then it contains a title with badges
  And a one-line pitch
  And a live demo link
  And a "what it does" section with 3 or fewer bullets
  And a minimal HTML example
  And CDN usage instructions
  And a token customization snippet
  And a "For LLMs" section
  And links to Pages site, llms.txt, examples, ARCHITECTURE.md
  And a license line

Scenario: README minimal example is valid
  Given the HTML example in README.md
  When extracted and combined with lys.css and lys.iife.js
  Then it renders a working Lys deck in a browser

Scenario: README contains no install-from-source instructions
  Given the README.md file
  When searched for "git clone", "pnpm install", "npm install" (as setup instructions)
  Then no matches are found in the body (links to PROJECT.md are acceptable)

Scenario: README links all resolve
  Given the README.md file
  When each link URL is checked
  Then all links resolve (relative links exist in the repo, external links return 200)
```

#### Pages site — Structure

```gherkin
Scenario: Pages site is a conventional HTML page
  Given the site/index.html file
  Then the top-level document structure is a standard HTML page
  And there is no data-lys attribute anywhere in the document

Scenario: Pages site has reference tables
  Given the site/index.html file
  Then it contains a table listing all 9 --lys-* tokens with defaults
  And it contains a table listing all 5 data-* attributes with purposes

Scenario: Pages site has no external dependencies
  Given the site/index.html file
  When scanned for external URLs in src, href, and url() attributes
  Then no external hosts are referenced (except in link/canonical and og:url)
```

#### SEO — Metadata

```gherkin
Scenario: Pages site has SEO metadata
  Given the site/index.html file
  Then it has a <meta name="description"> tag
  And it has <meta property="og:title"> and <meta property="og:description"> tags
  And it has a <link rel="canonical"> tag

Scenario: package.json has npm metadata
  Given the package.json file
  Then it has a "homepage" field pointing to the Pages URL
  And it has a "repository" field pointing to the GitHub repo
  And it has a "bugs" field pointing to GitHub issues
```

#### Deployment — Workflow

```gherkin
Scenario: Pages workflow deploys on push to main
  Given the .github/workflows/pages.yml file
  Then it triggers on push to main
  And it runs pnpm build
  And it copies dist assets, llms.txt, and examples into site/
  And it deploys site/ to GitHub Pages

Scenario: llms.txt is accessible on Pages
  Given a successful Pages deployment
  When https://villetakanen.github.io/lys/llms.txt is fetched
  Then the response contains the llms.txt content

Scenario: Examples are accessible as live demos
  Given a successful Pages deployment
  When https://villetakanen.github.io/lys/examples/minimal.html is fetched
  Then the response is a valid HTML file
  And the presentation is functional
```

## Test / Spec Alignment

These scenarios are documentation/infrastructure validation — they do not map to the unit or e2e test suite. Verification approach:

| Scenario group | Verification method |
|---|---|
| README content | Manual review + link checker script |
| Pages site structure | Manual review + HTML validator |
| SEO metadata | Manual review + OpenGraph preview tool |
| Deployment workflow | GitHub Actions run log after first push to main |
| llms.txt / examples on Pages | Manual fetch after first deployment |

A future CI step could automate README link checking and HTML validation, but this is not required for 1.0.

## Related / Future

- **Custom domain.** If Lys gets its own domain, update `canonical`, `og:url`, and `package.json` homepage.
- **og:image.** A branded screenshot or generated image for social cards. Nice to have, not blocking.
- **README localization.** Not planned.
- **Changelog.** Could be auto-generated from conventional commits. Separate concern from this spec.
