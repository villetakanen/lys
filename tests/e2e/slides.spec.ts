import { readFileSync } from "node:fs";
import { expect, type FrameLocator, type Page, test } from "@playwright/test";

const fixture = readFileSync(new URL("../fixtures/surface.html", import.meta.url), "utf8");
const origin = "http://localhost:4173";
const deck = "[data-lys]";
const active = `${deck} > article[data-lys-active]`;
/** Deck transition styles; surface geometry must hold under each. */
const STYLES = ["none", "fade", "horizontal", "vertical"] as const;

async function open(page: Page, embedded = false, style = "none") {
	await page.route(`${origin}/surface.html`, (route) =>
		route.fulfill({
			contentType: "text/html",
			body: fixture.replace("<main data-lys", `<main data-lys data-transition="${style}"`),
		}),
	);
	if (embedded) {
		await page.route(`${origin}/host.html`, (route) =>
			route.fulfill({
				contentType: "text/html",
				body: '<iframe src="/surface.html" style="border:0;width:640px;height:360px"></iframe>',
			}),
		);
	}
	await page.goto(`${origin}/${embedded ? "host" : "surface"}.html`);
	const view = embedded ? page.frameLocator("iframe") : page;
	await expect(view.locator(deck)).toHaveAttribute("data-lys-ready", "");
	return view;
}

async function expectFit(view: Page | FrameLocator, ratio: number) {
	await expect
		.poll(() =>
			view.locator(active).evaluate((slide, r) => {
				const { x, y, width, height } = slide.getBoundingClientRect();
				const w = Math.min(innerWidth, innerHeight * r);
				const h = Math.min(innerHeight, innerWidth / r);
				return Math.max(
					Math.abs(width - w),
					Math.abs(height - h),
					Math.abs(x - (innerWidth - w) / 2),
					Math.abs(y - (innerHeight - h) / 2),
				);
			}, ratio),
		)
		.toBeLessThan(1);
}

for (const style of STYLES)
	for (const embedded of [false, true]) {
		test(`viewport fit and container units (${embedded ? "iframe" : "top level"}, ${style})`, async ({
			page,
		}) => {
			const view = await open(page, embedded, style);
			for (const [css, ratio] of [
				["16 / 9", 16 / 9],
				["24 / 10", 24 / 10],
				["9 / 19.5", 9 / 19.5],
				["1", 1],
			] as const) {
				await view
					.locator(deck)
					.evaluate((el, value) => el.style.setProperty("--lys-aspect-ratio", value), css);
				for (const size of [
					{ width: 750, height: 300 },
					{ width: 220, height: 620 },
				]) {
					if (embedded) {
						await page.locator("iframe").evaluate((el, { width, height }) => {
							el.style.width = `${width}px`;
							el.style.height = `${height}px`;
						}, size);
					} else await page.setViewportSize(size);
					await expectFit(view, ratio);
					await expect(view.locator(active)).toHaveAttribute("id", "first");
					const fits = await view.locator(".units").evaluate((units) => {
						const frame = units.closest("article")?.getBoundingClientRect();
						const box = units.getBoundingClientRect();
						return (
							frame &&
							Math.abs(box.width - frame.width / 2) < 1 &&
							Math.abs(box.height - frame.height / 2) < 1 &&
							Math.abs(box.x - frame.x - frame.width / 4) < 1 &&
							Math.abs(box.y - frame.y - frame.height / 4) < 1
						);
					});
					expect(fits).toBe(true);
				}
			}
		});
	}

for (const style of STYLES)
	test(`deck ratio cascade, invalid fallback, and selection (${style})`, async ({ page }) => {
		await page.setViewportSize({ width: 800, height: 500 });
		await open(page, false, style);
		await expectFit(page, 16 / 9);
		await page.addStyleTag({
			content:
				":root { --lys-aspect-ratio: calc(8 / 2) / 3; } article { --lys-aspect-ratio: 9/16; }",
		});
		await expectFit(page, 4 / 3);
		await page.keyboard.press("ArrowRight");
		await expect(page.locator(active)).toHaveAttribute("id", "second");
		await expectFit(page, 4 / 3);
		await page.setViewportSize({ width: 500, height: 800 });
		await expectFit(page, 4 / 3);
		for (const invalid of [
			"auto",
			"1 + 2",
			"0",
			"1/0",
			"-1/-2",
			"calc(infinity)",
			"1e999",
			"calc(-1)",
		]) {
			await page
				.locator(deck)
				.evaluate((el, value) => el.style.setProperty("--lys-aspect-ratio", value), invalid);
			await expectFit(page, 16 / 9);
		}
		await page.locator(deck).evaluate((el) => el.style.removeProperty("--lys-aspect-ratio"));
		await expectFit(page, 4 / 3);
	});

test("deck fade uses the same frame and reduced motion leaves author animation alone", async ({
	page,
}) => {
	await page.setViewportSize({ width: 900, height: 420 });
	await open(page, false, "fade");
	await page.addStyleTag({
		content: `
		[data-lys] { --lys-aspect-ratio: 9 / 19.5; --lys-transition-duration: 5s; }
		@keyframes author { to { opacity: .9; } }
		.units { animation: author 10s infinite; }
	`,
	});
	await expectFit(page, 9 / 19.5);
	await expect(page.locator(active)).toHaveCSS("transition-duration", "5s");
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.keyboard.press("ArrowRight");
	await expect(page.locator(active)).toHaveAttribute("id", "second");
	await expectFit(page, 9 / 19.5);
	await expect(page.locator(active)).toHaveCSS("opacity", "1");
	await expect(page.locator(active)).toHaveCSS("transition-duration", "0s");
	await expect(page.locator(".units")).toHaveCSS("animation-name", "author");
});

for (const style of STYLES)
	test(`fixed and transformed paint is clipped; nested scrolling is independent (${style})`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 800, height: 400 });
		await open(page, false, style);
		await page.addStyleTag({ content: "[data-lys] { --lys-aspect-ratio: 1; }" });
		await page.keyboard.press("ArrowRight");
		await expectFit(page, 1);
		// Let any deck motion finish so only the selected frame paints.
		await expect
			.poll(() =>
				page.evaluate(
					() => document.getAnimations().filter((a) => a instanceof CSSTransition).length,
				),
			)
			.toBe(0);
		// Stay clear of the frame edge, where focus-ring anti-aliasing varies.
		const backdrop = { x: 0, y: 0, width: 188, height: 400 };
		const before = await page.screenshot({ clip: backdrop });
		await page.locator(".crop").evaluate((el) => {
			el.hidden = false;
		});
		await expect(page.locator(".crop")).toBeVisible();
		expect(await page.screenshot({ clip: backdrop })).toEqual(before);
		await page.locator(".scroll").evaluate((el) => {
			el.scrollTop = 45;
		});
		await expect(page.locator(".scroll")).toHaveJSProperty("scrollTop", 45);
		await expect(page.locator(active)).toHaveJSProperty("scrollTop", 0);
	});

test("scheme-aware paint is overridable without styling authored content", async ({ page }) => {
	await page.emulateMedia({ colorScheme: "light" });
	await open(page);
	await expect(page.locator(deck)).toHaveCSS("background-color", "rgb(243, 246, 249)");
	await expect(page.locator(active)).toHaveCSS("background-color", "rgb(255, 255, 255)");
	await page.emulateMedia({ colorScheme: "dark" });
	await expect(page.locator(deck)).toHaveCSS("background-color", "rgb(17, 24, 32)");
	await expect(page.locator(active)).toHaveCSS("background-color", "rgb(0, 0, 0)");
	await expect(page.locator(active)).toHaveCSS("color", "rgb(20, 40, 60)");
	await expect(page.locator(active)).toHaveCSS("font-size", "19px");
	await expect(page.locator(active)).toHaveCSS("padding", "0px");
	await page.addStyleTag({
		content: "[data-lys] { color-scheme: light; --lys-backdrop: transparent; }",
	});
	await expect(page.locator(deck)).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
	await expect(page.locator(active)).toHaveCSS("background-color", "rgb(255, 255, 255)");
	await page.addStyleTag({ content: "article, [data-lys] { background: transparent; }" });
	await expect(page.locator(active)).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});
