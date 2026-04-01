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

	test("print layout resets container-type for content-driven sizing", async ({ page }) => {
		await page.goto("/tests/fixtures/minimal.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});

		await page.emulateMedia({ media: "print" });

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const containerType = await slides
				.nth(i)
				.evaluate((el) => getComputedStyle(el).containerType);
			expect(containerType).toBe("normal");
		}
	});

	test("print layout has readable font-size", async ({ page }) => {
		await page.goto("/tests/fixtures/minimal.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});

		await page.emulateMedia({ media: "print" });

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const fontSize = await slides
				.nth(i)
				.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
			// In print, container-type resets to normal. cqi falls back to the viewport,
			// so the clamp ceiling (1.5rem = 24px) applies at standard viewports.
			// Font-size must be readable (>= 12px) regardless.
			expect(fontSize).toBeGreaterThanOrEqual(12);
			expect(fontSize).toBeLessThanOrEqual(24);
		}
	});

	test("print layout padding resolves when container-type is reset", async ({ page }) => {
		await page.goto("/tests/fixtures/minimal.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});

		await page.emulateMedia({ media: "print" });

		const paddingLeft = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft));

		// In print, container-type resets to normal. cqi falls back to the viewport,
		// so padding is viewport-relative (not 0). Verify it's a positive value.
		expect(paddingLeft).toBeGreaterThan(0);
	});

	test("print layout backdrop is transparent", async ({ page }) => {
		await page.goto("/tests/fixtures/minimal.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});

		await page.emulateMedia({ media: "print" });

		const bg = await page
			.locator("[data-lys]")
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		// Transparent resolves to rgba(0, 0, 0, 0) in browsers
		expect(bg).toBe("rgba(0, 0, 0, 0)");
	});

	test("fade-mode print layout shows all slides", async ({ page }) => {
		await page.goto("/tests/fixtures/fade.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("data-lys-mode") === "stacked";
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
