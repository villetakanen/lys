import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Token resolution tests.
 *
 * happy-dom cannot resolve CSS custom properties or process stylesheets,
 * so these tests read the CSS source file directly to verify the
 * token declarations and structural rules. Full computed-style resolution
 * is verified in e2e tests.
 */

const cssPath = resolve(__dirname, "../../src/lys.css");
const cssRaw = readFileSync(cssPath, "utf-8");
// Strip comments for structural checks (comments may mention @import/url as documentation).
const cssText = cssRaw.replace(/\/\*[\s\S]*?\*\//g, "");

describe("token default values", () => {
	const expectedTokens = [
		["--_lys-deck-ratio", "--lys-aspect-ratio", "16 / 9"],
		["--_lys-transition-duration", "--lys-transition-duration", "300ms"],
		["--_lys-transition-easing", "--lys-transition-easing", "ease-in-out"],
	] as const;

	for (const [internal, public_, defaultVal] of expectedTokens) {
		it(`declares ${internal} resolving to ${public_} with default containing "${defaultVal}"`, () => {
			expect(cssText).toContain(internal);
			expect(cssText).toContain(public_);
			expect(cssText).toContain(defaultVal);
		});
	}

	it("drops historical spacing, type, axis limits and focus tokens", () => {
		expect(cssText).not.toMatch(
			/--lys-(slide-(padding|gap|max-(width|height))|font-size-base|focus-ring)/,
		);
	});
});

describe("CSS structural rules", () => {
	it("contains no @import directives", () => {
		expect(cssText).not.toContain("@import");
	});

	it("contains no url() references", () => {
		expect(cssText).not.toMatch(/url\s*\(/);
	});

	it("only enables engine fade when motion is allowed", () => {
		expect(cssText).toContain("(prefers-reduced-motion: no-preference)");
	});

	it("contains print media rules with page breaks", () => {
		expect(cssText).toContain("@media print");
		expect(cssText).toContain("page-break-after");
	});

	it("declares a landscape, ratio-matched @page box with no margin (#60)", () => {
		expect(cssText).toContain("@page");
		expect(cssText).toContain("size: var(--lys-print-page-size, 13.333in 7.5in)");
		expect(cssText).toMatch(/@page\s*\{[^}]*margin:\s*0/);
	});

	it("keeps the @page rule inside @media print", () => {
		const printBlockStart = cssText.indexOf("@media print");
		expect(printBlockStart).toBeGreaterThan(-1);
		expect(cssText.indexOf("@page")).toBeGreaterThan(printBlockStart);
	});

	it("does not reset container-type in print (#60 reverses #28)", () => {
		const printBlock = cssText.slice(cssText.indexOf("@media print"));
		expect(printBlock).not.toContain("container-type: normal");
	});

	it("forces slide backgrounds to print", () => {
		const printBlock = cssText.slice(cssText.indexOf("@media print"));
		expect(printBlock).toContain("print-color-adjust: exact");
		expect(printBlock).toContain("-webkit-print-color-adjust: exact");
	});

	it("avoids the trailing page break with :last-of-type, not :last-child (#60)", () => {
		// a11y.ts appends the live region to the container, so the final article
		// is not the container's last child once JS has initialized.
		const printBlock = cssText.slice(cssText.indexOf("@media print"));
		expect(printBlock).toContain("article:last-of-type");
		expect(printBlock).not.toContain("article:last-child");
	});

	it("hides the nav region in print", () => {
		const printBlock = cssText.slice(cssText.indexOf("@media print"));
		expect(printBlock).toMatch(/\[data-lys-nav\]\s*\{\s*display:\s*none/);
	});

	it("uses scroll-snap-type: y mandatory on container", () => {
		expect(cssText).toContain("scroll-snap-type: y mandatory");
	});

	it("centers slides on a snap page that always stops", () => {
		// Contain-fit slides are shorter than the viewport, so they are centered
		// in a full-viewport snap row and scroll-snap-stop forces one-per-swipe (#45).
		expect(cssText).toContain("scroll-snap-align: center");
		expect(cssText).toContain("scroll-snap-stop: always");
	});
});
