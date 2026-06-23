import { expect, test } from "@playwright/test";

/** Navigate to the nav fixture and wait for Lys to initialize. */
async function setupNavDeck(page: import("@playwright/test").Page) {
	await page.goto("/tests/fixtures/nav.html");
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("role") === "group";
	});
}

test.describe("chapter nav — author region", () => {
	test.beforeEach(async ({ page }) => {
		await setupNavDeck(page);
	});

	test("region is taken out of the scroll-snap flow", async ({ page }) => {
		// position: fixed → not a grid item → does not consume a viewport snap row.
		const position = await page
			.locator("[data-lys-nav]")
			.evaluate((el) => getComputedStyle(el).position);
		expect(position).toBe("fixed");

		// First reachable snap page is the first article, not a blank nav row:
		// the container scrollHeight is ~one viewport per article (4), not 5.
		const { scrollHeight, vh } = await page.locator("[data-lys]").evaluate((el) => ({
			scrollHeight: el.scrollHeight,
			vh: window.innerHeight,
		}));
		expect(scrollHeight).toBeLessThan(vh * 4.5);
	});

	test("Lys does not add or remove author links", async ({ page }) => {
		const count = await page.locator("[data-lys-nav] a").count();
		expect(count).toBe(4);
	});

	test("marks the starting slide's link active on load", async ({ page }) => {
		const active = page.locator("[data-lys-nav] [data-lys-nav-active]");
		await expect(active).toHaveCount(1);
		await expect(active).toHaveAttribute("href", "#intro");
		await expect(active).toHaveAttribute("aria-current", "true");
	});

	test("active link follows scroll position", async ({ page }) => {
		// Scroll the container so a later slide reaches the viewport middle.
		await page.locator("[data-lys]").evaluate((el) => {
			el.scrollTo({ top: el.clientHeight * 2, behavior: "instant" });
		});
		const active = page.locator("[data-lys-nav] [data-lys-nav-active]");
		await expect(active).toHaveAttribute("href", "#results");
		await expect(page.locator("[data-lys-nav] [data-lys-nav-active]")).toHaveCount(1);
	});

	test("active link follows programmatic / keyboard navigation", async ({ page }) => {
		await page.locator("[data-lys]").focus();
		await page.keyboard.press("End"); // jump to last slide
		const active = page.locator("[data-lys-nav] [data-lys-nav-active]");
		await expect(active).toHaveAttribute("href", "#summary");
	});

	test("clicking a link navigates to its slide", async ({ page }) => {
		await page.locator('[data-lys-nav] a[href="#results"]').click();
		const active = page.locator("[data-lys-nav] [data-lys-nav-active]");
		await expect(active).toHaveAttribute("href", "#results");
		// the target article is scrolled into view
		await expect(page.locator("#results")).toBeInViewport();
	});
});

test.describe("chapter nav — progressive enhancement", () => {
	test("links scroll to slides without JS", async ({ page }) => {
		await page.route("**/lys.js", (route) => route.abort());
		await page.goto("/tests/fixtures/nav.html");
		// No JS → no active-state attribute is ever applied.
		await expect(page.locator("[data-lys-nav] [data-lys-nav-active]")).toHaveCount(0);
		// But the anchor link still scrolls the target into view.
		await page.locator('[data-lys-nav] a[href="#summary"]').click();
		await expect(page.locator("#summary")).toBeInViewport();
	});
});
