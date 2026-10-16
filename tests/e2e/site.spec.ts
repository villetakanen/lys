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

// The primary demo is also the portable artifact and a reading-mode example.
test.describe("primary demo — presentation and reading", () => {
	test("keyboard, controls and accessibility state agree", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`${BASE}/examples/demo.html`);
		const deck = page.locator("#deck");
		await expect(deck).toHaveClass("presenting");
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
		test(`reading mode exposes all content at ${viewport.width}×${viewport.height}`, async ({
			page,
		}) => {
			await page.setViewportSize(viewport);
			await page.goto(`${BASE}/examples/demo.html`);
			await expect(page.locator("#deck")).not.toHaveAttribute("data-lys-mode");
			await expect(page.locator("article[aria-hidden]")).toHaveCount(0);
			await expect(page.locator("article")).toHaveCount(8);
			const clipped = await page
				.locator("article")
				.evaluateAll((slides) =>
					slides
						.filter((s) => s.scrollWidth > s.clientWidth + 1 || s.scrollHeight > s.clientHeight + 1)
						.map((s) => s.id),
				);
			expect(clipped).toEqual([]);
			await expect(page.locator(".deck-controls")).toBeHidden();
		});
	}

	test("resize preserves the current slide and reading position", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`${BASE}/examples/demo.html#slide=attributes`);
		await expect(page.locator("#attributes")).toHaveAttribute("data-lys-active", "");
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(page.locator("article[aria-hidden]")).toHaveCount(0);
		await expect(page.locator("#deck")).not.toHaveClass("presenting");
		await expect
			.poll(() =>
				page.locator("#attributes").evaluate((s) => Math.abs(s.getBoundingClientRect().top)),
			)
			.toBeLessThan(2);
		await page.locator("#principles").evaluate((s) => s.scrollIntoView());
		await page.setViewportSize({ width: 1440, height: 900 });
		await expect(page.locator("#principles")).toHaveAttribute("data-lys-active", "");
	});

	for (const viewport of [
		{ width: 1440, height: 900 },
		{ width: 390, height: 844 },
	]) {
		test(`no-JavaScript reading at ${viewport.width}×${viewport.height}`, async ({ browser }) => {
			const context = await browser.newContext({ javaScriptEnabled: false, viewport });
			const page = await context.newPage();
			await page.goto(`${BASE}/examples/demo.html`);
			const layout = await page.locator("article").evaluateAll((slides) =>
				slides.map((s) => {
					const box = s.getBoundingClientRect();
					return {
						top: box.top,
						bottom: box.bottom,
						clipped: s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1,
					};
				}),
			);
			expect(layout).toHaveLength(8);
			for (let i = 0; i < layout.length; i++) {
				expect(layout[i].clipped).toBe(false);
				if (i) expect(layout[i].top).toBeGreaterThanOrEqual(layout[i - 1].bottom - 1);
			}
			await expect(page.locator(".deck-controls")).toBeHidden();
			await context.close();
		});
	}

	test("print exposes every slide and restores the current slide", async ({ page }) => {
		await page.goto(`${BASE}/examples/demo.html#slide=attributes`);
		await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
		await page.emulateMedia({ media: "print" });
		await expect(page.locator("article[aria-hidden]")).toHaveCount(0);
		await expect(page.locator(".deck-controls")).toBeHidden();
		const slides = await page.locator("article").evaluateAll((elements) =>
			elements.map((s) => {
				const style = getComputedStyle(s);
				return { position: style.position, opacity: style.opacity };
			}),
		);
		expect(slides).toEqual(Array(8).fill({ position: "static", opacity: "1" }));
		await page.emulateMedia({ media: "screen" });
		await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
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
	await expect(page.locator("#deck")).toHaveClass("presenting");
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
]) {
	test(`primary demo — every text block fits at ${viewport.width}×${viewport.height}`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport);
		await page.goto(`${BASE}/examples/demo.html`);
		await expect(page.locator("#deck")).toHaveClass("presenting");
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
