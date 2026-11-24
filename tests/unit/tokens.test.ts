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
});

interface Rule {
	selector: string;
	body: string;
	context: string[];
}

/** Flatten style rules with their enclosing at-rule preludes. */
function parseRules(css: string): Rule[] {
	const rules: Rule[] = [];
	const stack: { prelude: string; start: number }[] = [];
	let mark = 0;
	for (let i = 0; i < css.length; i++) {
		const ch = css[i];
		if (ch === "{") {
			stack.push({ prelude: css.slice(mark, i).trim(), start: i + 1 });
			mark = i + 1;
		} else if (ch === "}") {
			const block = stack.pop();
			if (block && !block.prelude.startsWith("@")) {
				rules.push({
					selector: block.prelude.replace(/\s+/g, " "),
					body: css.slice(block.start, i),
					context: stack.map((b) => b.prelude),
				});
			}
			mark = i + 1;
		} else if (ch === ";") {
			mark = i + 1;
		}
	}
	return rules;
}

/** Split a selector list on top-level commas. */
function selectorList(selector: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let mark = 0;
	for (let i = 0; i < selector.length; i++) {
		const ch = selector[i];
		if (ch === "(") depth++;
		else if (ch === ")") depth--;
		else if (ch === "," && depth === 0) {
			parts.push(selector.slice(mark, i).trim());
			mark = i + 1;
		}
	}
	parts.push(selector.slice(mark).trim());
	return parts;
}

const rules = parseRules(cssText);
const declares = (rule: Rule, prop: string): boolean =>
	new RegExp(`(^|[;\\s])${prop}\\s*:`).test(rule.body);
const motionRules = rules.filter((r) => declares(r, "transition"));
const axisRules = rules.filter(
	(r) => declares(r, "translate") || declares(r, "clip-path") || declares(r, "--_lys-offset"),
);
/** Transitioned property names of a rule's `transition` declaration. */
function transitionItems(rule: Rule): string[] {
	const value = /transition\s*:([^;]*)/.exec(rule.body)?.[1] ?? "";
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

describe("deck transition CSS contract", () => {
	it("finds transition and axis rules to check", () => {
		expect(motionRules.length).toBeGreaterThanOrEqual(3);
		expect(rules.filter((r) => declares(r, "--_lys-offset")).length).toBeGreaterThanOrEqual(3);
		expect(rules.filter((r) => declares(r, "translate")).length).toBeGreaterThanOrEqual(2);
		expect(rules.filter((r) => declares(r, "clip-path")).length).toBeGreaterThanOrEqual(2);
	});

	it("registers --_lys-offset as a non-inherited percentage at top level", () => {
		const at = cssText.indexOf("@property --_lys-offset");
		expect(at).toBeGreaterThan(-1);
		const before = cssText.slice(0, at);
		const depth = (before.match(/\{/g)?.length ?? 0) - (before.match(/\}/g)?.length ?? 0);
		expect(depth).toBe(0);
		const body = cssText.slice(at, cssText.indexOf("}", at));
		expect(body).toMatch(/syntax:\s*"<percentage>"/);
		expect(body).toMatch(/inherits:\s*false/);
		expect(body).toMatch(/initial-value:\s*0%/);
	});

	it("registers --_lys-alpha as a non-inherited number at top level", () => {
		const at = cssText.indexOf("@property --_lys-alpha");
		expect(at).toBeGreaterThan(-1);
		const before = cssText.slice(0, at);
		const depth = (before.match(/\{/g)?.length ?? 0) - (before.match(/\}/g)?.length ?? 0);
		expect(depth).toBe(0);
		const body = cssText.slice(at, cssText.indexOf("}", at));
		expect(body).toMatch(/syntax:\s*"<number>"/);
		expect(body).toMatch(/inherits:\s*false/);
		expect(body).toMatch(/initial-value:\s*1/);
	});

	it("maps --_lys-alpha to opacity only on screen", () => {
		const at = cssText.indexOf("opacity: var(--_lys-alpha)");
		expect(at).toBeGreaterThan(cssText.indexOf("@media screen"));
		expect(at).toBeLessThan(cssText.indexOf("@media print"));
	});

	it("transitions only --_lys-offset (axis) and --_lys-alpha (fade, axis hand-off)", () => {
		for (const rule of motionRules) {
			const items = transitionItems(rule);
			expect(items.length).toBeGreaterThan(0);
			const axis = /horizontal|vertical/.test(rule.selector);
			for (const item of items) {
				const prop = item.split(/\s+/)[0];
				if (axis) {
					if (prop === "--_lys-alpha") {
						// The outgoing axis frame hides only after the motion ends.
						expect(rule.selector).toContain("[data-lys-leaving]");
						expect(item).toBe("--_lys-alpha 0s var(--_lys-transition-duration)");
					} else {
						expect(prop).toBe("--_lys-offset");
					}
				} else {
					expect(prop).toBe("--_lys-alpha");
				}
			}
			expect(rule.body).not.toMatch(
				/transition\s*:[^;]*\b(opacity|translate|clip-path|transform|all)\b/,
			);
		}
	});

	it("drives translate and clip-path from the offset with clamped insets", () => {
		for (const rule of rules.filter((r) => declares(r, "clip-path"))) {
			const inset = /clip-path:\s*inset\((.*)\);?\s*$/m.exec(rule.body)?.[1] ?? "";
			const args = inset.match(/max\((?:[^()]|\([^()]*\))*\)|\S+/g) ?? [];
			expect(args.length).toBeGreaterThan(0);
			for (const arg of args) expect(arg).toMatch(/^(0|max\(0%, (-1 \* )?var\(--_lys-offset\)\))$/);
			expect(rule.body).toMatch(/translate:[^;]*var\(--_lys-offset\)/);
		}
		const offsets = rules
			.filter((r) => declares(r, "--_lys-offset"))
			.map((r) => /--_lys-offset:\s*([^;]+)/.exec(r.body)?.[1]?.trim());
		expect(offsets.sort()).toEqual(["-100%", "0%", "100%"]);
	});

	it("puts the selected frame on top", () => {
		const activeRule = rules.find(
			(r) => r.selector === "[data-lys][data-lys-current] > article[data-lys-active]",
		);
		expect(activeRule?.body).toMatch(/z-index:\s*1/);
		expect(activeRule?.body).toMatch(/pointer-events:\s*auto/);
	});

	it("declares engine transitions only when motion is allowed, on screen", () => {
		for (const rule of motionRules) {
			expect(rule.context).toContain("@media (prefers-reduced-motion: no-preference)");
			expect(rule.context).toContain("@media screen");
		}
	});

	it("declares engine transitions only after first paint (data-lys-ready)", () => {
		for (const rule of motionRules) {
			for (const sel of selectorList(rule.selector)) expect(sel).toContain("[data-lys-ready]");
		}
	});

	it("applies engine motion only to article frames, never descendants", () => {
		for (const rule of [...motionRules, ...axisRules]) {
			for (const sel of selectorList(rule.selector)) {
				// Ends on a direct-child article frame (optionally a later sibling frame).
				expect(sel).toMatch(/> article(\[[^\]]+\]|:is\([^)]*\))*( ~ article)?$/);
			}
		}
	});

	it("keys stacking and axis rest positions on enhanced state, screen only", () => {
		for (const rule of axisRules) {
			expect(rule.context).toEqual(["@media screen"]);
			for (const sel of selectorList(rule.selector)) expect(sel).toContain("[data-lys-current]");
		}
		const stacking = rules.filter((r) => /grid-area:\s*1\s*\/\s*1/.test(r.body));
		expect(stacking).toHaveLength(1);
		expect(stacking[0]?.selector).toContain("[data-lys-current]");
		expect(stacking[0]?.context).toEqual(["@media screen"]);
	});

	it("never translates or clips frames in print", () => {
		for (const rule of rules.filter((r) => r.context.includes("@media print"))) {
			expect(declares(rule, "translate")).toBe(false);
			expect(declares(rule, "transition")).toBe(false);
		}
	});

	it("resolves styles from the deck with ASCII case-insensitive selectors", () => {
		const styleSelectors = cssText.match(/\[data-transition=[^\]]*\]/g) ?? [];
		expect(styleSelectors.length).toBeGreaterThan(0);
		for (const sel of styleSelectors) {
			expect(sel).toMatch(/^\[data-transition="(fade|horizontal|vertical)" i\]$/);
		}
		expect(cssText).not.toMatch(/article\[data-transition/);
		expect(cssText).not.toMatch(/\[data-transition="none"/);
	});

	it("uses deck-scope timing tokens for every engine transition", () => {
		for (const rule of motionRules) {
			expect(rule.body).toContain("var(--_lys-transition-duration)");
			expect(rule.body).not.toMatch(/--lys-transition-(duration|easing)/);
		}
		const tokenRule = rules.find((r) => r.body.includes("--_lys-transition-duration:"));
		expect(tokenRule?.selector).toBe("[data-lys]");
	});

	it("drops the 1.x stacked mode and scroll-snap paging", () => {
		expect(cssText).not.toContain("data-lys-mode");
		expect(cssText).not.toMatch(/scroll-snap/);
		// Slides share one viewport-high row, so the deck never scrolls between them.
		const deck = rules.find((r) => r.selector === "[data-lys][data-lys-current]");
		expect(deck?.body).toMatch(/grid-template:\s*100dvh \/ minmax\(0, 1fr\)/);
		expect(deck?.body).not.toMatch(/grid-auto-rows/);
	});
});
