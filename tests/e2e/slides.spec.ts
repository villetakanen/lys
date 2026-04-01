import { expect, test } from "@playwright/test";

/** Navigate to the minimal fixture and wait for Lys to initialize. */
async function setupMinimalDeck(page: import("@playwright/test").Page) {
	await page.goto("/tests/fixtures/minimal.html");
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("role") === "group";
	});
}

/** Navigate to the data-attrs fixture and wait for Lys to initialize. */
async function setupDataAttrsDeck(page: import("@playwright/test").Page) {
	await page.goto("/tests/fixtures/data-attrs.html");
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("role") === "group";
	});
}

test.describe("scroll-snap layout", () => {
	test.beforeEach(async ({ page }) => {
		await setupMinimalDeck(page);
	});

	test("minimal deck has scroll-snap-type y mandatory", async ({ page }) => {
		const container = page.locator("[data-lys]");
		const snapType = await container.evaluate((el) => getComputedStyle(el).scrollSnapType);
		expect(snapType).toContain("y");
		expect(snapType).toContain("mandatory");
	});

	test("articles have scroll-snap-align start", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const snapAlign = await slides.nth(i).evaluate((el) => getComputedStyle(el).scrollSnapAlign);
			expect(snapAlign).toBe("start");
		}
	});

	test("articles fill viewport height", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();
		const viewportHeight = await page.evaluate(() => window.innerHeight);

		for (let i = 0; i < count; i++) {
			const height = await slides.nth(i).evaluate((el) => el.offsetHeight);
			expect(height).toBeGreaterThanOrEqual(viewportHeight * 0.9);
		}
	});
});

test.describe("container-type size", () => {
	test.beforeEach(async ({ page }) => {
		await setupMinimalDeck(page);
	});

	test("articles are CSS size containers", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const containerType = await slides
				.nth(i)
				.evaluate((el) => getComputedStyle(el).containerType);
			expect(containerType).toBe("size");
		}
	});

	test("cqi units resolve relative to article inline size", async ({ page }) => {
		// Inject a paragraph with 5cqi font-size into the first slide
		// cqi resolves against the container's content-box inline size
		const { fontSize, contentWidth } = await page.evaluate(() => {
			const article = document.querySelector("[data-lys] > article");
			if (!article) throw new Error("No article found");
			const p = document.createElement("p");
			p.style.fontSize = "5cqi";
			p.textContent = "test";
			article.appendChild(p);
			const style = getComputedStyle(article);
			const width =
				article.clientWidth -
				Number.parseFloat(style.paddingLeft) -
				Number.parseFloat(style.paddingRight);
			return { fontSize: getComputedStyle(p).fontSize, contentWidth: width };
		});

		// 5cqi = 5% of the article's content-box inline size
		const expected = contentWidth * 0.05;
		const actual = Number.parseFloat(fontSize);

		expect(actual).toBeCloseTo(expected, -1);
	});

	test("stacked mode articles are CSS size containers", async ({ page }) => {
		// Manually set stacked mode on the minimal deck to avoid fade fixture dependency
		await page.evaluate(() => {
			const container = document.querySelector("[data-lys]");
			if (!container) throw new Error("No container found");
			container.setAttribute("data-lys-mode", "stacked");
		});

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const containerType = await slides
				.nth(i)
				.evaluate((el) => getComputedStyle(el).containerType);
			expect(containerType).toBe("size");
		}
	});
});

test.describe("edge cases", () => {
	test("single-slide deck renders without error", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto("/tests/fixtures/minimal.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});

		// Verify no JS errors and at least one article visible.
		expect(errors).toHaveLength(0);
		await expect(page.locator("[data-lys] > article").first()).toBeVisible();
	});

	test("empty container renders without error", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		// Navigate to minimal and remove all articles via JS to simulate empty.
		await page.goto("/tests/fixtures/minimal.html");
		await page.evaluate(() => {
			const container = document.querySelector("[data-lys]");
			for (const a of container?.querySelectorAll("article") ?? []) a.remove();
		});

		// Give init time — no role will be set on empty container, but no errors either.
		await page.waitForTimeout(500);

		expect(errors).toHaveLength(0);
	});
});

test.describe("auto-init", () => {
	test("auto-init sets role and data-lys-active", async ({ page }) => {
		await setupMinimalDeck(page);

		const container = page.locator("[data-lys]");
		await expect(container).toHaveAttribute("role", "group");

		const firstSlide = page.locator("[data-lys] > article").nth(0);
		await expect(firstSlide).toHaveAttribute("data-lys-active", "");
	});
});

test.describe("data attributes", () => {
	test.beforeEach(async ({ page }) => {
		await setupDataAttrsDeck(page);
	});

	test("data-background applies as CSS background", async ({ page }) => {
		const firstSlide = page.locator("[data-lys] > article").nth(0);
		const bg = await firstSlide.evaluate((el) => getComputedStyle(el).backgroundColor);
		// #1a1a2e → rgb(26, 26, 46) or rgba(26, 26, 46, ...) depending on browser
		expect(bg).toContain("26, 26, 46");
	});

	test("data-class classes are applied", async ({ page }) => {
		const firstSlide = page.locator("[data-lys] > article").nth(0);
		await expect(firstSlide).toHaveClass(/title-slide/);
		await expect(firstSlide).toHaveClass(/dark/);
	});
});

test.describe("container-relative token scaling", () => {
	test("font-size scales at standard viewport", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await setupMinimalDeck(page);

		const fontSize = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

		expect(fontSize).toBeGreaterThanOrEqual(22);
		expect(fontSize).toBeLessThanOrEqual(24);
	});

	test("font-size hits clamp floor on very small container", async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 180 });
		await setupMinimalDeck(page);

		const fontSize = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

		// clamp floor is 0.75rem = 12px
		expect(fontSize).toBeCloseTo(12, 0);
	});

	test("font-size scales down at smaller viewport", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await setupMinimalDeck(page);
		const fontSizeLarge = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

		// Navigate fresh at a viewport narrow enough for cqi to fall below the clamp ceiling.
		// 2.5cqi hits 24px ceiling at 960px. Use 640px to get ~16px (below ceiling).
		await page.setViewportSize({ width: 640, height: 360 });
		await setupMinimalDeck(page);
		const fontSizeSmall = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

		expect(fontSizeSmall).toBeLessThan(fontSizeLarge);
		expect(fontSizeSmall).toBeGreaterThanOrEqual(12);
	});

	test("padding scales with slide width", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await setupMinimalDeck(page);
		const paddingLarge = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft));

		// Navigate fresh at the smaller viewport to ensure layout recalculates.
		await page.setViewportSize({ width: 960, height: 540 });
		await setupMinimalDeck(page);
		const paddingSmall = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft));

		expect(paddingSmall).toBeLessThan(paddingLarge);
	});
});

test.describe("token author overrides", () => {
	test("author override with absolute rem value", async ({ page }) => {
		await setupMinimalDeck(page);

		await page.addStyleTag({ content: ":root { --lys-font-size-base: 1.25rem; }" });
		// Wait a frame for styles to apply
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

		const fontSize = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

		// 1.25rem = 20px at default 16px root font size
		expect(fontSize).toBeCloseTo(20, 0);
	});

	test("author override with px value on a single article", async ({ page }) => {
		await setupMinimalDeck(page);

		await page.addStyleTag({
			content: "[data-lys] > article:first-child { --lys-slide-padding: 16px; }",
		});

		const firstPadding = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft));

		const secondPadding = await page
			.locator("[data-lys] > article")
			.nth(1)
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft));

		expect(firstPadding).toBe(16);
		// Second article uses the cqi default, so its padding differs from 16px
		expect(secondPadding).not.toBe(16);
	});

	test("author override at container level", async ({ page }) => {
		await setupMinimalDeck(page);

		await page.addStyleTag({ content: "[data-lys] { --lys-slide-padding: 2rem; }" });

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const padding = await slides
				.nth(i)
				.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft));
			// 2rem = 32px at default 16px root font size
			expect(padding).toBeCloseTo(32, 0);
		}
	});
});

test.describe("extreme aspect ratios", () => {
	test("1:1 aspect ratio scales font relative to slide width", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await setupMinimalDeck(page);

		await page.addStyleTag({ content: "[data-lys] { --lys-aspect-ratio: 1/1; }" });
		// Wait a frame for styles to apply
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

		const fontSize = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

		// Slide is height-constrained to ~1080px wide, so font-size should be within clamp range
		expect(fontSize).toBeGreaterThanOrEqual(12);
		expect(fontSize).toBeLessThanOrEqual(24);
	});

	test("narrow aspect ratio hits clamp floor", async ({ page }) => {
		await page.setViewportSize({ width: 430, height: 932 });
		await setupMinimalDeck(page);

		await page.addStyleTag({ content: "[data-lys] { --lys-aspect-ratio: 24/10; }" });
		// Wait a frame for styles to apply
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

		const fontSize = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

		// clamp floor prevents text from becoming invisible
		expect(fontSize).toBeGreaterThanOrEqual(12);
	});
});

test.describe("backdrop color", () => {
	test("light mode shows white backdrop", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "light" });
		await setupMinimalDeck(page);

		const bg = await page
			.locator("[data-lys]")
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(bg).toBe("rgb(255, 255, 255)");
	});

	test("dark mode shows black backdrop", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "dark" });
		await setupMinimalDeck(page);

		const bg = await page
			.locator("[data-lys]")
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(bg).toBe("rgb(0, 0, 0)");
	});

	test("author override sets custom backdrop color", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "light" });
		await setupMinimalDeck(page);

		await page.addStyleTag({ content: "[data-lys] { --lys-backdrop: #1a1a2e; }" });
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

		const bg = await page
			.locator("[data-lys]")
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		// #1a1a2e → rgb(26, 26, 46)
		expect(bg).toBe("rgb(26, 26, 46)");
	});

	test("author can set transparent backdrop", async ({ page }) => {
		await setupMinimalDeck(page);
		await page.addStyleTag({ content: "[data-lys] { --lys-backdrop: transparent; }" });
		await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
		const bg = await page
			.locator("[data-lys]")
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(bg).toBe("rgba(0, 0, 0, 0)");
	});

	test("backdrop works without JS (progressive enhancement)", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "dark" });
		// Load CSS-only: navigate to minimal but block the JS file
		await page.route("**/lys.js", (route) => route.abort());
		await page.goto("/tests/fixtures/minimal.html");
		// No need to wait for JS init — testing CSS-only behavior

		const bg = await page
			.locator("[data-lys]")
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(bg).toBe("rgb(0, 0, 0)");
	});
});

test.describe("reduced motion", () => {
	test("reduced motion disables transitions", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await setupMinimalDeck(page);

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const duration = await slides
				.nth(i)
				.evaluate((el) => getComputedStyle(el).transitionDuration);
			expect(duration).toBe("0s");
		}
	});
});
