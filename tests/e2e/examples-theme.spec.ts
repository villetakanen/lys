import { expect, type Page, test } from "@playwright/test";

/**
 * Guards #51: example decks must not adopt the viewer's system color scheme.
 * Each fixed-theme deck pins `--lys-backdrop` so the letterbox area stays on
 * the deck's palette (no white bands in a light OS theme, no black bands in a
 * dark one). `minimal` is the deliberate exception — it opts into adaptation
 * via `light-dark()` and should change with the scheme.
 *
 * Loads the shipped demo decks from `examples/` directly as fixtures.
 */

/** Resolved `[data-lys]` backdrop under a forced `prefers-color-scheme`. */
async function backdropUnderScheme(page: Page, scheme: "light" | "dark") {
	await page.emulateMedia({ colorScheme: scheme });
	return page.locator("[data-lys]").evaluate((el) => getComputedStyle(el).backgroundColor);
}

const FIXED_THEME_DECKS = ["nav", "demo", "themed", "full", "square"];

test.describe("example decks — color-scheme robustness", () => {
	for (const deck of FIXED_THEME_DECKS) {
		test(`${deck} pins its backdrop across light and dark schemes`, async ({ page }) => {
			await page.goto(`/examples/${deck}.html`);
			await page.waitForSelector("[data-lys]");

			const light = await backdropUnderScheme(page, "light");
			const dark = await backdropUnderScheme(page, "dark");

			expect(light).toBe(dark);
		});
	}

	test("minimal adapts its backdrop to the scheme (adaptive exemplar)", async ({ page }) => {
		await page.goto("/examples/minimal.html");
		await page.waitForSelector("[data-lys]");

		const light = await backdropUnderScheme(page, "light");
		const dark = await backdropUnderScheme(page, "dark");

		expect(light).not.toBe(dark);
	});
});
