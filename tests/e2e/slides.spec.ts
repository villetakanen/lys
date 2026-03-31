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
