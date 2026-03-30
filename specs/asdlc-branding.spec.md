# ASDLC Branding

## Blueprint (Design)

### Context

Lys is built using the ASDLC (Agent-Spec-Driven Lifecycle) methodology. The project should visibly credit this — both as attribution to the parent methodology and as a signal to other developers that the spec-driven workflow is real and in use. Issue #26 requests that the site and README "proudly state" this, with a link back to the ASDLC project.

This is a docs-only change. No runtime code, no new API surface, no test changes.

### Architecture

#### Files touched

- **`README.md`** — Add an "Built with ASDLC" line or section. Should be near the bottom (before License) so it doesn't compete with the primary pitch but is clearly visible.
- **`site/index.html`** — Add the ASDLC attribution to the footer. The footer already has links to GitHub, npm, llms.txt, and the license — ASDLC fits naturally here.

#### Placement guidelines

- **README**: A short line or subsection between the "Links" section and "License". One sentence explaining what ASDLC is and a link to the project. Keep it concise — this is attribution, not a sales pitch.
- **Site footer**: Add an "Built with ASDLC" link alongside the existing footer nav links. Same visual weight as the other footer links.

#### Link target

The ASDLC link should point to `https://asdlc.io`.

#### Module boundaries

No changes to `src/`, `tests/`, `dist/`, `specs/` (other than this spec), or any build/CI configuration.

### Anti-Patterns

- **Making ASDLC branding the headline.** Lys is the product; ASDLC is the methodology. The branding should be visible but secondary — footer and bottom-of-README, not the hero section.
- **Adding an ASDLC badge image.** Badges in the README header are for project metadata (version, size, license). A methodology badge would be unusual and clutter the badge row. Use text instead.
- **Explaining ASDLC in detail.** The README and site are not the place to document ASDLC. One sentence + a link is sufficient. Let the ASDLC project speak for itself.
- **Adding external dependencies for the branding.** No badge service images, no external CSS, no JavaScript for the attribution. Plain text and an `<a>` tag.
- **Duplicating the attribution in multiple places per file.** One mention per file (README, site). Not in the header AND the footer of the same page.

## Contract (Quality)

### Definition of Done

1. `README.md` contains an "ASDLC" mention with a working hyperlink to the ASDLC project, placed after the "Links" section and before "License".
2. `site/index.html` footer contains an "ASDLC" link alongside existing footer links.
3. Both links point to the same canonical ASDLC URL and resolve (return 200).
4. The branding text is concise — no more than one sentence in each location.
5. No changes to any file outside `README.md` and `site/index.html`.
6. `site/index.html` remains a valid HTML5 document with no external dependencies added.

### Regression Guardrails

- The README badge row must not change (no new badges added).
- The README section order must remain: badges → pitch → demo → what it does → example → CDN → tokens → LLMs → links → **ASDLC** → license.
- The site footer must remain a simple `<nav>` with inline links — no layout changes.
- No `data-lys` containers may be introduced in `site/index.html`.
- The site must have no new external dependencies (no CDN links, no images from other hosts).

### Scenarios (Gherkin)

#### README — ASDLC attribution

```gherkin
Scenario: README credits ASDLC
  Given the README.md file
  Then it contains a mention of "ASDLC" between the "Links" section and "License"
  And the mention includes a hyperlink to the ASDLC project
  And the mention is no longer than one sentence

Scenario: README ASDLC link resolves
  Given the ASDLC URL in README.md
  When the URL is fetched
  Then the response status is 200
```

#### Site — ASDLC footer link

```gherkin
Scenario: Site footer credits ASDLC
  Given the site/index.html file
  Then the <footer> element contains a link with text referencing "ASDLC"
  And the link points to the canonical ASDLC project URL

Scenario: Site footer link count increases by one
  Given the site/index.html footer
  Then it contains exactly 5 links (GitHub, npm, llms.txt, MIT License, ASDLC)

Scenario: No external dependencies added
  Given the site/index.html file
  When scanned for external URLs in src, href, and url() attributes
  Then the only new external URL is the ASDLC project link in the footer
```

## Test / Spec Alignment

These scenarios are documentation validation checks, not automated test suite scenarios — consistent with the parent spec (`readme-and-pages.spec.md`).

| Scenario group | Verification method |
|---|---|
| README ASDLC attribution | Manual review + link check |
| Site footer ASDLC link | Manual review + HTML validation |
| No external dependencies | Manual scan of `site/index.html` |

No unit or e2e test files need updating for this change.

## Related / Future

- **ASDLC badge.** If the ASDLC project provides an official badge/shield, it could be added to the README badge row in a future PR.
- **ASDLC in `llms.txt`.** The LLM-facing reference does not need methodology branding — it's about the API contract, not how the project was built.
