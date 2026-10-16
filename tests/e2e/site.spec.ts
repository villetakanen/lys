import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
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

// The primary demo retains its authored canvas at every viewport size.
test.describe("primary demo — fixed composition", () => {
	test("keyboard, controls and accessibility state agree", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`${BASE}/examples/demo.html`);
		await expect(page.locator("#deck")).toHaveAttribute("data-lys-mode", "stacked");
		await page.keyboard.press("ArrowRight");
		await expect(page.locator("#overview")).toHaveAttribute("data-lys-active", "");
		await expect(page.locator("#overview")).toBeFocused();
		await expect(page.locator("#intro")).toHaveAttribute("aria-hidden", "true");
		await expect(page.locator("#counter")).toHaveText("2 / 8");
		await page.keyboard.press("Tab");
		await expect(page.getByRole("button", { name: "Previous slide" })).toBeFocused();
		await page.keyboard.press("Enter");
		await expect(page.locator("#intro")).toHaveAttribute("data-lys-active", "");
		await page.keyboard.press("End");
		await expect(page.locator("#closing")).toHaveAttribute("data-lys-active", "");
		await page.keyboard.press("Home");
		await expect(page.locator("#intro")).toHaveAttribute("data-lys-active", "");
		await page.getByRole("button", { name: "Next slide" }).click();
		await expect(page.locator("#counter")).toHaveText("2 / 8");
	});

	for (const viewport of [
		{ width: 390, height: 844 },
		{ width: 1440, height: 500 },
	]) {
		test(`same composition and navigation at ${viewport.width}×${viewport.height}`, async ({
			page,
		}) => {
			await page.setViewportSize({ width: 1440, height: 900 });
			await page.goto(`${BASE}/examples/demo.html#slide=attributes`);
			const measure = () =>
				page.locator("article").evaluateAll((slides) =>
					slides.map((slide) => {
						const box = slide.getBoundingClientRect();
						const content = slide.querySelector(".slide-content");
						return {
							ratio: box.width / box.height,
							typeScale: Number.parseFloat(getComputedStyle(content).fontSize) / box.width,
							codeLines: [...slide.querySelectorAll("pre code")].map((code) => {
								const range = document.createRange();
								range.selectNodeContents(code);
								return range.getClientRects().length;
							}),
							fields: [...slide.querySelectorAll(".properties li, .code-layout, table")].map(
								(field) => {
									const rect = field.getBoundingClientRect();
									return [
										(rect.x - box.x) / box.width,
										(rect.y - box.y) / box.height,
										rect.width / box.width,
									];
								},
							),
						};
					}),
				);
			const baseline = await measure();
			await page.setViewportSize(viewport);
			await expect(page.locator("#attributes")).toHaveAttribute("data-lys-active", "");
			await expect(page.locator("article[aria-hidden='true']")).toHaveCount(7);
			await expect(page.locator(".deck-controls")).toBeVisible();
			const scaled = await measure();
			for (let i = 0; i < scaled.length; i++) {
				expect(scaled[i].ratio).toBeCloseTo(16 / 9, 2);
				expect(scaled[i].typeScale).toBeCloseTo(baseline[i].typeScale, 4);
				expect(scaled[i].codeLines).toEqual(baseline[i].codeLines);
				for (let j = 0; j < scaled[i].fields.length; j++) {
					for (let k = 0; k < 3; k++)
						// At a 390px canvas, native line-box and border rounding can
						// shift vertical centering by a few pixels. Columns and widths
						// stay proportional; code keeps exactly the same line count.
						expect(Math.abs(scaled[i].fields[j][k] - baseline[i].fields[j][k])).toBeLessThan(
							k === 1 ? 0.025 : 0.005,
						);
				}
			}
			await page.keyboard.press("ArrowRight");
			await expect(page.locator("#counter")).toHaveText("6 / 8");
			await page.setViewportSize({ width: 1440, height: 900 });
			await expect(page.locator("#tokens")).toHaveAttribute("data-lys-active", "");
		});
	}

	test("phone touch gestures navigate the same slide deck", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`${BASE}/examples/demo.html`);
		await page.locator("#deck").evaluate((surface) => {
			surface.dispatchEvent(
				Object.assign(new Event("touchstart"), { touches: [{ clientX: 300, clientY: 400 }] }),
			);
			surface.dispatchEvent(
				Object.assign(new Event("touchend"), { changedTouches: [{ clientX: 100, clientY: 400 }] }),
			);
		});
		await expect(page.locator("#overview")).toHaveAttribute("data-lys-active", "");
		await expect(page.locator("#counter")).toHaveText("2 / 8");
	});

	for (const viewport of [
		{ width: 1440, height: 900 },
		{ width: 390, height: 844 },
	]) {
		test(`CSS-only fixed slides at ${viewport.width}×${viewport.height}`, async ({ browser }) => {
			const context = await browser.newContext({ javaScriptEnabled: false, viewport });
			const page = await context.newPage();
			await page.goto(`${BASE}/examples/demo.html`);
			const layout = await page.locator("article").evaluateAll((slides) =>
				slides.map((slide) => {
					const box = slide.getBoundingClientRect();
					return {
						ratio: box.width / box.height,
						clipped:
							slide.scrollWidth > slide.clientWidth + 1 ||
							slide.scrollHeight > slide.clientHeight + 1,
					};
				}),
			);
			expect(layout).toHaveLength(8);
			for (const slide of layout) {
				expect(slide.ratio).toBeCloseTo(16 / 9, 2);
				expect(slide.clipped).toBe(false);
			}
			await expect(page.locator("article[aria-hidden]")).toHaveCount(0);
			await page.locator("#closing").scrollIntoViewIfNeeded();
			await expect(page.locator("#closing")).toBeInViewport();
			await expect(page.locator(".deck-controls")).toBeHidden();
			await context.close();
		});
	}

	test("print shows every canvas while preserving presentation state", async ({ page }) => {
		await page.goto(`${BASE}/examples/demo.html#slide=attributes`);
		await page.emulateMedia({ media: "print" });
		await expect(page.locator(".deck-controls")).toBeHidden();
		const slides = await page.locator("article").evaluateAll((elements) =>
			elements.map((slide) => {
				const style = getComputedStyle(slide);
				return { position: style.position, opacity: style.opacity };
			}),
		);
		expect(slides).toEqual(Array(8).fill({ position: "relative", opacity: "1" }));
		const anchors = await page
			.locator(".slide-content")
			.evaluateAll((frames) => frames.map((frame) => frame.offsetParent === frame.parentElement));
		expect(anchors).toEqual(Array(8).fill(true));
		const edges = await page
			.locator("article")
			.evaluateAll((slides) => slides.map((slide) => slide.getBoundingClientRect().left));
		for (const edge of edges) expect(Math.abs(edge)).toBeLessThan(1);
		await page.emulateMedia({ media: "screen" });
		await expect(page.locator("#attributes")).toHaveAttribute("data-lys-active", "");
	});
});

test("primary demo — copied standalone file works offline", async ({ browser }, info) => {
	const file = info.outputPath("demo.html");
	await mkdir(info.outputDir, { recursive: true });
	await copyFile(resolve("site/examples/demo.html"), file);
	const context = await browser.newContext({
		offline: browser.browserType().name() !== "webkit",
		viewport: { width: 1440, height: 900 },
	});
	// WebKit's offline emulation rejects file: navigation itself. Blocking every
	// HTTP(S) request still verifies that this copied file needs no network.
	await context.route(/^https?:/, (route) => route.abort());
	const page = await context.newPage();
	const errors: string[] = [];
	const requests: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("request", (request) => {
		if (request.url().startsWith("http")) requests.push(request.url());
	});
	await page.goto(pathToFileURL(file).href);
	await expect(page.locator("#deck")).toHaveAttribute("data-lys-mode", "stacked");
	await page.keyboard.press("End");
	await expect(page.locator("#counter")).toHaveText("8 / 8");
	expect(errors).toEqual([]);
	expect(requests).toEqual([]);
	await expect(page.locator('script[src], link[rel="stylesheet"]')).toHaveCount(0);
	await context.close();
});

for (const viewport of [
	{ width: 1440, height: 900 },
	{ width: 1024, height: 768 },
	{ width: 390, height: 844 },
	{ width: 1440, height: 500 },
]) {
	test(`primary demo — every text block fits at ${viewport.width}×${viewport.height}`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport);
		await page.goto(`${BASE}/examples/demo.html`);
		await expect(page.locator("#deck")).toHaveAttribute("data-lys-mode", "stacked");
		const clipped = await page.locator("article").evaluateAll((slides) =>
			slides.flatMap((slide) => {
				const box = slide.getBoundingClientRect();
				const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
				const failures: string[] = [];
				for (let node = walker.nextNode(); node; node = walker.nextNode()) {
					if (!node.textContent?.trim()) continue;
					const range = document.createRange();
					range.selectNodeContents(node);
					for (const rect of range.getClientRects()) {
						if (
							rect.left < box.left - 1 ||
							rect.right > box.right + 1 ||
							rect.top < box.top - 1 ||
							rect.bottom > box.bottom + 1
						) {
							failures.push(`${slide.id}: ${node.textContent.trim()}`);
							break;
						}
					}
				}
				return failures;
			}),
		);
		expect(clipped).toEqual([]);
	});
}

test("primary demo — native PDF print preserves the active slide", async ({
	page,
	browserName,
}, info) => {
	test.skip(browserName !== "chromium", "Playwright's PDF export is Chromium-only");
	await page.goto(`${BASE}/examples/demo.html#slide=attributes`);
	await expect(page.locator("#attributes")).toHaveAttribute("data-lys-active", "");
	await page.pdf({ path: info.outputPath("demo.pdf"), preferCSSPageSize: true });
	await expect(page.locator("#attributes")).toHaveAttribute("data-lys-active", "");
	await expect(page.locator("#counter")).toHaveText("5 / 8");
});
