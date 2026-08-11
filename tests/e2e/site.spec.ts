import { expect, test } from "@playwright/test";

/**
 * Assertions against the BUILT site (site/), not the dev server.
 *
 * Two things are only true in production:
 *
 *  1. The cascade. `src/lys.ts` imports `./lys.css`, so in dev Vite injects Lys's
 *     stylesheet at module-execution time — after the deck's own <style>. Lys then
 *     wins declarations the author is supposed to win. The built pages use a <link>
 *     ahead of the author styles. Contrast therefore has to be measured here.
 *  2. The rewrites in scripts/build-site.js. Those had shipped `import { Lys } from
 *     "lys.iife.js"` — an unresolvable bare specifier pointing at a build with no
 *     exports — leaving demo.html and full.html with no JS on the live site (#64).
 *     Nothing tested the built output, so nothing caught it.
 */

const BASE = "http://localhost:4173";

const DECKS = ["minimal", "themed", "full", "demo", "nav", "square"];

/** WCAG relative luminance / contrast. Runs in the page, so it must be self-contained. */
function findLowContrastSlides(): Array<{ slide: number; worst: number }> {
	const lum = (c: string): number => {
		const m = c.match(/[\d.]+/g);
		if (!m) return 0;
		const [r, g, b] = m
			.slice(0, 3)
			.map(Number)
			.map((n) => {
				const v = n / 255;
				return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
			});
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};
	const ratio = (a: number, b: number) =>
		+((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
	const opaque = (c: string) => Boolean(c) && c !== "transparent" && !/rgba\(.*,\s*0\)$/.test(c);

	return [...document.querySelectorAll("[data-lys] > article")]
		.map((a, i) => {
			const cs = getComputedStyle(a);
			// Candidate backgrounds: the slide's own color, every stop of a gradient
			// (a slide can be legible against one stop and not another), else the
			// nearest painted ancestor.
			const cands: string[] = [];
			if (opaque(cs.backgroundColor)) cands.push(cs.backgroundColor);
			if (cs.backgroundImage && cs.backgroundImage !== "none")
				cands.push(...(cs.backgroundImage.match(/rgba?\([^)]+\)/g) ?? []));
			if (!cands.length) {
				let el: Element | null = a;
				while (el?.parentElement) {
					el = el.parentElement;
					const c = getComputedStyle(el).backgroundColor;
					if (opaque(c)) {
						cands.push(c);
						break;
					}
				}
			}
			const fg = lum(cs.color);
			return { slide: i, worst: Math.min(...cands.map((c) => ratio(fg, lum(c)))) };
		})
		.filter((x) => x.worst < 4.5);
}

test.describe("built site — decks initialize", () => {
	for (const deck of DECKS) {
		test(`${deck}.html loads Lys`, async ({ page }) => {
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));

			await page.goto(`${BASE}/examples/${deck}.html`);
			await page.waitForFunction(
				() => document.querySelector("[data-lys]")?.getAttribute("role") === "group",
			);

			expect(errors).toEqual([]);
		});
	}

	test("data-class is applied on the built site", async ({ page }) => {
		// The symptom that made #64 visible: without JS, data-class never becomes a
		// class, so every per-slide theme rule silently stops applying.
		await page.goto(`${BASE}/examples/demo.html`);
		await page.waitForFunction(
			() => document.querySelector("[data-lys]")?.getAttribute("role") === "group",
		);

		const className = await page
			.locator("[data-lys] > article[data-class]")
			.first()
			.evaluate((el) => el.className);
		expect(className).not.toBe("");
	});
});

test.describe("built site — slide contrast", () => {
	for (const scheme of ["light", "dark"] as const) {
		for (const deck of DECKS) {
			test(`${deck}.html meets 4.5:1 in ${scheme} scheme`, async ({ page }) => {
				// A deck that pins a background must pin a foreground too: Lys's
				// default color is light-dark(), so an unpinned foreground flips
				// with the viewer's scheme while the author's background does not
				// (#62). Chrome always prints in the light scheme, which is how
				// this reached paper.
				await page.emulateMedia({ colorScheme: scheme });
				await page.goto(`${BASE}/examples/${deck}.html`);
				await page.waitForFunction(
					() => document.querySelector("[data-lys]")?.getAttribute("role") === "group",
				);

				const failing = await page.evaluate(findLowContrastSlides);
				expect(failing).toEqual([]);
			});
		}
	}
});
