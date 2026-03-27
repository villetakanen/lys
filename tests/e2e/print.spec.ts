import { expect, test } from "@playwright/test";

test.describe("print layout", () => {
	test("scroll-snap print layout shows all slides", async ({ page }) => {
		await page.goto("/tests/fixtures/minimal.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});

		await page.emulateMedia({ media: "print" });

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();
		expect(count).toBe(3);

		// All slides should be visible and not absolutely positioned.
		for (let i = 0; i < count; i++) {
			const opacity = await slides.nth(i).evaluate((el) => getComputedStyle(el).opacity);
			expect(opacity).toBe("1");

			const position = await slides.nth(i).evaluate((el) => getComputedStyle(el).position);
			expect(["static", "relative"]).toContain(position);
		}

		// Non-last slides should have page breaks.
		for (let i = 0; i < count - 1; i++) {
			const breakAfter = await slides.nth(i).evaluate((el) => getComputedStyle(el).breakAfter);
			expect(["page", "always"]).toContain(breakAfter);
		}
	});

	test("fade-mode print layout shows all slides", async ({ page }) => {
		await page.goto("/tests/fixtures/fade.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("data-lys-mode") === "fade";
		});

		await page.emulateMedia({ media: "print" });

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();
		expect(count).toBe(3);

		// All slides should be visible with opacity 1 (print CSS overrides fade mode).
		for (let i = 0; i < count; i++) {
			await expect(async () => {
				const opacity = await slides.nth(i).evaluate((el) => getComputedStyle(el).opacity);
				expect(opacity).toBe("1");
			}).toPass({ timeout: 2000 });

			const position = await slides.nth(i).evaluate((el) => getComputedStyle(el).position);
			expect(position).toBe("static");
		}

		// Non-last slides should have page breaks.
		for (let i = 0; i < count - 1; i++) {
			const breakAfter = await slides.nth(i).evaluate((el) => getComputedStyle(el).breakAfter);
			expect(["page", "always"]).toContain(breakAfter);
		}
	});
});
