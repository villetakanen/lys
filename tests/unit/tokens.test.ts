import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Token resolution tests.
 *
 * happy-dom cannot resolve CSS custom properties or process stylesheets,
 * so these tests read the CSS source file directly to verify the two-tier
 * token declarations and structural rules. Full computed-style resolution
 * is verified in e2e tests.
 */

const cssPath = resolve(__dirname, "../../src/lys.css");
const cssRaw = readFileSync(cssPath, "utf-8");
// Strip comments for structural checks (comments may mention @import/url as documentation).
const cssText = cssRaw.replace(/\/\*[\s\S]*?\*\//g, "");

describe("token default values", () => {
	const expectedTokens = [
		["--_lys-aspect-ratio", "--lys-aspect-ratio", "16"],
		["--_lys-slide-padding", "--lys-slide-padding", "2rem"],
		["--_lys-transition-duration", "--lys-transition-duration", "300ms"],
		["--_lys-transition-easing", "--lys-transition-easing", "ease-in-out"],
		["--_lys-font-size-base", "--lys-font-size-base", "clamp(1rem, 2vw, 1.5rem)"],
		["--_lys-slide-gap", "--lys-slide-gap", "0"],
		["--_lys-slide-max-width", "--lys-slide-max-width", "100vw"],
		["--_lys-slide-max-height", "--lys-slide-max-height", "100vh"],
		["--_lys-focus-ring", "--lys-focus-ring", "2px solid currentColor"],
	] as const;

	for (const [internal, public_, defaultVal] of expectedTokens) {
		it(`declares ${internal} resolving to ${public_} with default containing "${defaultVal}"`, () => {
			expect(cssText).toContain(internal);
			expect(cssText).toContain(public_);
			expect(cssText).toContain(defaultVal);
		});
	}

	it("defines all nine two-tier tokens", () => {
		const internalTokenCount = (cssText.match(/--_lys-[\w-]+:\s*var\(--lys-/g) ?? []).length;
		expect(internalTokenCount).toBe(9);
	});
});

describe("CSS structural rules", () => {
	it("contains no @import directives", () => {
		expect(cssText).not.toContain("@import");
	});

	it("contains no url() references", () => {
		expect(cssText).not.toMatch(/url\s*\(/);
	});

	it("contains prefers-reduced-motion rule setting duration to 0ms", () => {
		expect(cssText).toContain("prefers-reduced-motion");
		expect(cssText).toContain("0ms");
	});

	it("contains print media rules with page breaks", () => {
		expect(cssText).toContain("@media print");
		expect(cssText).toContain("page-break-after");
	});

	it("uses scroll-snap-type: y mandatory on container", () => {
		expect(cssText).toContain("scroll-snap-type: y mandatory");
	});

	it("uses scroll-snap-align: start on slides", () => {
		expect(cssText).toContain("scroll-snap-align: start");
	});
});
