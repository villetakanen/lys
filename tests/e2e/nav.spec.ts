import { expect, type Page, test } from "@playwright/test";

/**
 * Chapter-nav behavior, tested against the shipped demo `examples/nav.html`
 * (dog-fooded fixture). Assertions are structure-relative — slide count and the
 * active id are read from the DOM — so the test follows the demo if it grows a
 * slide but fails if the nav behavior breaks.
 */

/** Navigate to the nav demo deck and wait for Lys to initialize. */
async function setupNavDeck(page: Page) {
	await page.goto("/examples/nav.html");
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

		// The container's scrollable height is ~one viewport per article. If the
		// fixed nav region leaked into the snap flow it would add a blank row,
		// pushing scrollHeight past (count + 1) viewports.
		const articleCount = await page.locator("[data-lys] > article").count();
		const { scrollHeight, vh } = await page.locator("[data-lys]").evaluate((el) => ({
			scrollHeight: el.scrollHeight,
			vh: window.innerHeight,
		}));
		expect(scrollHeight).toBeLessThan(vh * (articleCount + 0.5));
		expect(scrollHeight).toBeGreaterThan(vh * (articleCount - 0.5));
	});

	test("Lys does not add or remove author links", async ({ page }) => {
		// Each link targets a slide id; Lys leaves the author's links untouched,
		// so the link count matches the number of id'd slides.
		const navLinks = await page.locator("[data-lys-nav] a").count();
		const idSlides = await page.locator("[data-lys] > article[id]").count();
		expect(navLinks).toBe(idSlides);
	});

	test("marks the starting slide's link active on load", async ({ page }) => {
		const firstId = await page.locator("[data-lys] > article").first().getAttribute("id");
		const active = page.locator("[data-lys-nav] [data-lys-nav-active]");
		await expect(active).toHaveCount(1);
		await expect(active).toHaveAttribute("href", `#${firstId}`);
		await expect(active).toHaveAttribute("aria-current", "true");
	});

	test("active link follows scroll position", async ({ page }) => {
		// Scroll the container so the third slide reaches the viewport middle.
		const targetId = await page.locator("[data-lys] > article").nth(2).getAttribute("id");
		await page.locator("[data-lys]").evaluate((el) => {
			el.scrollTo({ top: el.clientHeight * 2, behavior: "instant" });
		});
		const active = page.locator("[data-lys-nav] [data-lys-nav-active]");
		await expect(active).toHaveAttribute("href", `#${targetId}`);
		await expect(active).toHaveCount(1);
	});

	test("active link follows programmatic / keyboard navigation", async ({ page }) => {
		const lastId = await page.locator("[data-lys] > article").last().getAttribute("id");
		await page.locator("[data-lys]").focus();
		await page.keyboard.press("End"); // jump to last slide
		const active = page.locator("[data-lys-nav] [data-lys-nav-active]");
		await expect(active).toHaveAttribute("href", `#${lastId}`);
	});

	test("clicking a link navigates to its slide", async ({ page }) => {
		// Pick the third id'd slide so the assertion is independent of order.
		const targetId = await page.locator("[data-lys] > article").nth(2).getAttribute("id");
		await page.locator(`[data-lys-nav] a[href="#${targetId}"]`).click();
		const active = page.locator("[data-lys-nav] [data-lys-nav-active]");
		await expect(active).toHaveAttribute("href", `#${targetId}`);
		await expect(page.locator(`#${targetId}`)).toBeInViewport();
	});
});

test.describe("chapter nav — progressive enhancement", () => {
	test("links scroll to slides without JS", async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto("/examples/nav.html");

		// No JS → no active-state attribute is ever applied.
		await expect(page.locator("[data-lys-nav] [data-lys-nav-active]")).toHaveCount(0);

		// But the anchor link still scrolls the target into view.
		const lastId = await page.locator("[data-lys] > article").last().getAttribute("id");
		await page.locator(`[data-lys-nav] a[href="#${lastId}"]`).click();
		await expect(page.locator(`#${lastId}`)).toBeInViewport();

		await context.close();
	});
});
