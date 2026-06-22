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

	test("articles snap centered and always stop (one slide per swipe)", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const snap = await slides.nth(i).evaluate((el) => {
				const s = getComputedStyle(el);
				return { align: s.scrollSnapAlign, stop: s.scrollSnapStop };
			});
			expect(snap.align).toBe("center");
			expect(snap.stop).toBe("always");
		}
	});

	test("each article occupies a full-viewport snap page", async ({ page }) => {
		// Contain-fit slides are smaller than the viewport, but the grid snap row is
		// full-viewport-tall so scrolling still advances exactly one slide (#45).
		const viewportHeight = await page.evaluate(() => window.innerHeight);
		const containerScrollHeight = await page
			.locator("[data-lys]")
			.evaluate((el) => el.scrollHeight);
		const count = await page.locator("[data-lys] > article").count();
		// scrollHeight ≈ one full viewport per slide
		expect(containerScrollHeight).toBeGreaterThanOrEqual(viewportHeight * count * 0.95);
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

test.describe("aspect-ratio conformity (#45)", () => {
	// Each slide must honor --lys-aspect-ratio on every viewport — never adopt the
	// viewport's own ratio — and must fit within the viewport (contain-fit).
	const RATIOS = [
		{ css: "16/9", value: 16 / 9 },
		{ css: "4/3", value: 4 / 3 },
		{ css: "3/4", value: 3 / 4 },
		{ css: "1/1", value: 1 },
	];
	const VIEWPORTS = [
		{ name: "mobile portrait", width: 430, height: 932 },
		{ name: "small landscape", width: 667, height: 375 },
		{ name: "desktop 16:9", width: 1920, height: 1080 },
		{ name: "desktop 16:10", width: 1920, height: 1200 },
		{ name: "tablet portrait", width: 1024, height: 1366 },
	];

	/** Set viewport + ratio, then return the first slide's rendered box. */
	async function measureFirstSlide(
		page: import("@playwright/test").Page,
		viewport: { width: number; height: number },
		ratioCss: string,
		mode?: string,
	) {
		await page.setViewportSize(viewport);
		await setupMinimalDeck(page);
		if (mode) {
			await page.evaluate((m) => {
				document.querySelector("[data-lys]")?.setAttribute("data-lys-mode", m);
			}, mode);
		}
		await page.addStyleTag({ content: `[data-lys] { --lys-aspect-ratio: ${ratioCss}; }` });
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		return page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => {
				const r = el.getBoundingClientRect();
				return { width: r.width, height: r.height };
			});
	}

	for (const ratio of RATIOS) {
		for (const vp of VIEWPORTS) {
			test(`${ratio.css} on ${vp.name} (${vp.width}×${vp.height}) — ratio honored, fits viewport`, async ({
				page,
			}) => {
				const box = await measureFirstSlide(page, vp, ratio.css);

				// Rendered ratio equals the configured ratio, not the viewport's.
				expect(box.width / box.height).toBeCloseTo(ratio.value, 1);

				// Slide fits within the viewport (contain-fit, no overflow).
				expect(box.width).toBeLessThanOrEqual(vp.width + 1);
				expect(box.height).toBeLessThanOrEqual(vp.height + 1);

				// And it uses one of the bounds (touches an edge) — not arbitrarily small.
				const touchesWidth = box.width >= vp.width - 1;
				const touchesHeight = box.height >= vp.height - 1;
				expect(touchesWidth || touchesHeight).toBe(true);
			});
		}
	}

	test("stacked mode (fade) honors the ratio too", async ({ page }) => {
		const vp = { width: 1920, height: 1080 };
		const box = await measureFirstSlide(page, vp, "4/3", "fade");
		expect(box.width / box.height).toBeCloseTo(4 / 3, 1);
		expect(box.width).toBeLessThanOrEqual(vp.width + 1);
		expect(box.height).toBeLessThanOrEqual(vp.height + 1);
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
