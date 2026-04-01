import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/tests/fixtures/minimal.html");
	// Wait for Lys to initialize.
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("role") === "group";
	});
});

test.describe("focus outline suppressed (#23)", () => {
	test("no outline on arrow key navigation", async ({ page }) => {
		await page.keyboard.press("ArrowRight");

		const second = page.locator("[data-lys] > article").nth(1);
		await expect(second).toHaveAttribute("data-lys-active", "");

		const outline = await second.evaluate((el) => getComputedStyle(el).outlineStyle);
		expect(outline).toBe("none");
	});

	test("no outline on mouse click", async ({ page }) => {
		const slide = page.locator("[data-lys] > article").first();
		await slide.click();

		const outline = await slide.evaluate((el) => getComputedStyle(el).outlineStyle);
		expect(outline).toBe("none");
	});

	test("focus still moves to active slide", async ({ page }) => {
		await page.keyboard.press("ArrowRight");

		const focused = await page.evaluate(() => {
			return document.activeElement?.getAttribute("aria-label");
		});
		expect(focused).toBe("Slide 2 of 3");
	});
});

test.describe("ARIA attributes in browser", () => {
	test("container has correct ARIA roles", async ({ page }) => {
		const container = page.locator("[data-lys]");
		await expect(container).toHaveAttribute("role", "group");
		await expect(container).toHaveAttribute("aria-roledescription", "slide deck");
	});

	test("slides have correct ARIA roles", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();
		for (let i = 0; i < count; i++) {
			await expect(slides.nth(i)).toHaveAttribute("role", "group");
			await expect(slides.nth(i)).toHaveAttribute("aria-roledescription", "slide");
		}
	});

	test("live region updates on navigation", async ({ page }) => {
		await page.keyboard.press("ArrowRight");

		const liveRegion = page.locator('[role="status"]');
		await expect(liveRegion).toHaveText("Slide 2 of 3");
	});

	test("focus moves to active slide on navigation", async ({ page }) => {
		await page.keyboard.press("ArrowRight");

		const focused = await page.evaluate(() => {
			return document.activeElement?.getAttribute("aria-label");
		});
		expect(focused).toBe("Slide 2 of 3");
	});
});

test.describe("progressive enhancement", () => {
	test("CSS-only deck has valid article semantics", async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto("/tests/fixtures/minimal.html");

		// Articles should be valid HTML5 elements without ARIA violations.
		const articles = page.locator("[data-lys] > article");
		const count = await articles.count();
		expect(count).toBe(3);

		// Without JS, articles should NOT have role="group" (added by a11y module).
		const role = await articles.first().getAttribute("role");
		expect(role).toBeNull();

		await context.close();
	});
});

test.describe("axe-core accessibility scan", () => {
	test("initialized deck has zero critical/serious axe-core violations", async ({ page }) => {
		const results = await new AxeBuilder({ page }).analyze();
		const critical = results.violations.filter((v) => v.impact === "critical");
		const serious = results.violations.filter((v) => v.impact === "serious");
		expect(critical).toHaveLength(0);
		expect(serious).toHaveLength(0);
	});

	test("fade-mode deck has zero critical/serious axe-core violations", async ({ page }) => {
		await page.goto("/tests/fixtures/fade.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("data-lys-mode") === "stacked";
		});

		const results = await new AxeBuilder({ page }).analyze();
		const critical = results.violations.filter((v) => v.impact === "critical");
		const serious = results.violations.filter((v) => v.impact === "serious");
		expect(critical).toHaveLength(0);
		expect(serious).toHaveLength(0);
	});
});
