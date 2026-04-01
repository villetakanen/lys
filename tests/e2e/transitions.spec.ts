import { expect, test } from "@playwright/test";

/** Wait for all CSS opacity transitions to settle on fade-mode slides. */
async function waitForTransitions(page: import("@playwright/test").Page) {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				const slides = document.querySelectorAll("[data-lys] > article");
				const pending = new Set<Element>();
				for (const s of slides) {
					const dur = getComputedStyle(s).transitionDuration;
					if (dur && dur !== "0s") pending.add(s);
				}
				if (pending.size === 0) {
					resolve();
					return;
				}
				const onEnd = (e: Event) => {
					pending.delete(e.target as Element);
					if (pending.size === 0) resolve();
				};
				for (const s of pending) s.addEventListener("transitionend", onEnd, { once: true });
				setTimeout(resolve, 500);
			}),
	);
}

/** Navigate to the fade fixture and wait for Lys to initialize. */
async function setupFadeDeck(page: import("@playwright/test").Page) {
	await page.goto("/tests/fixtures/fade.html");
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("data-lys-mode") === "stacked";
	});
	await waitForTransitions(page);
}

/** Navigate to the minimal (scroll-snap) fixture and wait for Lys to initialize. */
async function setupScrollSnapDeck(page: import("@playwright/test").Page) {
	await page.goto("/tests/fixtures/minimal.html");
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("role") === "group";
	});
}

test.describe("fade mode layout", () => {
	test.beforeEach(async ({ page }) => {
		await setupFadeDeck(page);
	});

	test("container has data-lys-mode='stacked'", async ({ page }) => {
		const container = page.locator("[data-lys]");
		await expect(container).toHaveAttribute("data-lys-mode", "stacked");
	});

	test("active slide is visible, inactive slides are hidden", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");

		const firstOpacity = await slides.nth(0).evaluate((el) => getComputedStyle(el).opacity);
		expect(firstOpacity).toBe("1");

		const secondOpacity = await slides.nth(1).evaluate((el) => getComputedStyle(el).opacity);
		expect(secondOpacity).toBe("0");

		const secondPointerEvents = await slides
			.nth(1)
			.evaluate((el) => getComputedStyle(el).pointerEvents);
		expect(secondPointerEvents).toBe("none");
	});

	test("slides are stacked (position: absolute)", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const position = await slides.nth(i).evaluate((el) => getComputedStyle(el).position);
			expect(position).toBe("absolute");
		}
	});

	test("transition uses correct duration and easing tokens", async ({ page }) => {
		await page.evaluate(() => {
			document
				.querySelector("[data-lys]")
				?.setAttribute(
					"style",
					"--lys-transition-duration: 500ms; --lys-transition-easing: linear",
				);
		});

		// Check the fade slide (nth(0)) — only fade slides have transitions
		const slide = page.locator("[data-lys] > article").nth(0);
		const duration = await slide.evaluate((el) => getComputedStyle(el).transitionDuration);
		expect(duration).toBe("0.5s");

		const easing = await slide.evaluate((el) => getComputedStyle(el).transitionTimingFunction);
		expect(easing).toBe("linear");
	});

	test("mixed transitions — fade slide has transition, non-fade is instant", async ({ page }) => {
		const fadeSlide = page.locator("[data-lys] > article").nth(0);
		const plainSlide = page.locator("[data-lys] > article").nth(1);

		const fadeProp = await fadeSlide.evaluate((el) => getComputedStyle(el).transitionProperty);
		expect(fadeProp).toContain("opacity");

		const plainDuration = await plainSlide.evaluate(
			(el) => getComputedStyle(el).transitionDuration,
		);
		expect(plainDuration).toBe("0s");
	});

	test("navigation changes opacity", async ({ page }) => {
		// Disable transitions so the opacity change is instant.
		await page.evaluate(() => {
			document.querySelector("[data-lys]")?.setAttribute("style", "--lys-transition-duration: 0ms");
		});

		await page.keyboard.press("ArrowRight");

		const first = page.locator("[data-lys] > article").nth(0);
		const second = page.locator("[data-lys] > article").nth(1);

		await expect(second).toHaveAttribute("data-lys-active", "");

		const firstOpacity = await first.evaluate((el) => getComputedStyle(el).opacity);
		expect(firstOpacity).toBe("0");

		const secondOpacity = await second.evaluate((el) => getComputedStyle(el).opacity);
		expect(secondOpacity).toBe("1");
	});
});

test.describe("scroll-snap mode unchanged", () => {
	test.beforeEach(async ({ page }) => {
		await setupScrollSnapDeck(page);
	});

	test("default deck does not have stacked layout", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const position = await slides.nth(i).evaluate((el) => getComputedStyle(el).position);
			expect(position).not.toBe("absolute");

			const snapAlign = await slides.nth(i).evaluate((el) => getComputedStyle(el).scrollSnapAlign);
			expect(snapAlign).toBe("start");
		}
	});

	test("default deck does not have data-lys-mode", async ({ page }) => {
		const container = page.locator("[data-lys]");
		const mode = await container.getAttribute("data-lys-mode");
		expect(mode).toBeNull();
	});
});

test.describe("fade mode reduced motion", () => {
	test("fade transitions are instant with reduced motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/tests/fixtures/fade.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("data-lys-mode") === "stacked";
		});

		const slide = page.locator("[data-lys] > article").nth(1);
		const duration = await slide.evaluate((el) => getComputedStyle(el).transitionDuration);
		expect(duration).toBe("0s");
	});
});

// === Direct mode ===

/** Navigate to the direct fixture and wait for Lys to initialize. */
async function setupDirectDeck(page: import("@playwright/test").Page) {
	await page.goto("/tests/fixtures/direct.html");
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("data-lys-mode") === "stacked";
	});
}

test.describe("direct mode layout", () => {
	test.beforeEach(async ({ page }) => {
		await setupDirectDeck(page);
	});

	test("container has data-lys-mode='stacked'", async ({ page }) => {
		const container = page.locator("[data-lys]");
		await expect(container).toHaveAttribute("data-lys-mode", "stacked");
	});

	test("active slide is visible, inactive slides are hidden", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");

		const firstOpacity = await slides.nth(0).evaluate((el) => getComputedStyle(el).opacity);
		expect(firstOpacity).toBe("1");

		const secondOpacity = await slides.nth(1).evaluate((el) => getComputedStyle(el).opacity);
		expect(secondOpacity).toBe("0");

		const secondPointerEvents = await slides
			.nth(1)
			.evaluate((el) => getComputedStyle(el).pointerEvents);
		expect(secondPointerEvents).toBe("none");
	});

	test("slides are stacked (position: absolute)", async ({ page }) => {
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			const position = await slides.nth(i).evaluate((el) => getComputedStyle(el).position);
			expect(position).toBe("absolute");
		}
	});

	test("transition-duration is 0ms (instant switching)", async ({ page }) => {
		const slide = page.locator("[data-lys] > article").nth(1);
		const duration = await slide.evaluate((el) => getComputedStyle(el).transitionDuration);
		expect(duration).toBe("0s");
	});

	test("--lys-transition-duration does not affect direct mode", async ({ page }) => {
		await page.evaluate(() => {
			document
				.querySelector("[data-lys]")
				?.setAttribute("style", "--lys-transition-duration: 2000ms");
		});

		const slide = page.locator("[data-lys] > article").nth(1);
		const duration = await slide.evaluate((el) => getComputedStyle(el).transitionDuration);
		expect(duration).toBe("0s");
	});

	test("navigation changes opacity instantly", async ({ page }) => {
		await page.keyboard.press("ArrowRight");

		const first = page.locator("[data-lys] > article").nth(0);
		const second = page.locator("[data-lys] > article").nth(1);

		await expect(second).toHaveAttribute("data-lys-active", "");

		const firstOpacity = await first.evaluate((el) => getComputedStyle(el).opacity);
		expect(firstOpacity).toBe("0");

		const secondOpacity = await second.evaluate((el) => getComputedStyle(el).opacity);
		expect(secondOpacity).toBe("1");
	});
});

test.describe("stacked mode navigation on full example (#35)", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/examples/full.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("data-lys-mode") === "stacked";
		});
	});

	test("ArrowRight advances slide in stacked mode", async ({ page }) => {
		await page.keyboard.press("ArrowRight");
		const second = page.locator("[data-lys] > article").nth(1);
		await expect(second).toHaveAttribute("data-lys-active", "");
	});

	test("ArrowLeft goes back in stacked mode", async ({ page }) => {
		await page.keyboard.press("ArrowRight");
		await page.keyboard.press("ArrowLeft");
		const first = page.locator("[data-lys] > article").nth(0);
		await expect(first).toHaveAttribute("data-lys-active", "");
	});

	test("multiple arrow presses traverse all slides", async ({ page }) => {
		const total = await page.locator("[data-lys] > article").count();
		for (let i = 0; i < total - 1; i++) {
			await page.keyboard.press("ArrowRight");
		}
		const last = page.locator("[data-lys] > article").nth(total - 1);
		await expect(last).toHaveAttribute("data-lys-active", "");
	});

	test("only active slide is visible", async ({ page }) => {
		// Disable transitions so opacity changes are instant.
		await page.evaluate(() => {
			document.querySelector("[data-lys]")?.setAttribute("style", "--lys-transition-duration: 0ms");
		});
		await page.keyboard.press("ArrowRight");

		const first = page.locator("[data-lys] > article").nth(0);
		const second = page.locator("[data-lys] > article").nth(1);

		const firstOpacity = await first.evaluate((el) => getComputedStyle(el).opacity);
		const secondOpacity = await second.evaluate((el) => getComputedStyle(el).opacity);
		expect(firstOpacity).toBe("0");
		expect(secondOpacity).toBe("1");
	});
});

test.describe("direct mode progressive enhancement", () => {
	test("CSS-only deck with data-transition='direct' falls back to scroll-snap", async ({
		browser,
	}) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto("/tests/fixtures/direct.html");

		const container = page.locator("[data-lys]");
		const mode = await container.getAttribute("data-lys-mode");
		expect(mode).toBeNull();

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();
		expect(count).toBe(3);

		for (let i = 0; i < count; i++) {
			const opacity = await slides.nth(i).evaluate((el) => getComputedStyle(el).opacity);
			expect(opacity).toBe("1");
		}

		await context.close();
	});
});

test.describe("fade mode progressive enhancement", () => {
	test("CSS-only deck with data-transition='fade' falls back to scroll-snap", async ({
		browser,
	}) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto("/tests/fixtures/fade.html");

		const container = page.locator("[data-lys]");

		// Without JS, data-lys-mode should not be set.
		const mode = await container.getAttribute("data-lys-mode");
		expect(mode).toBeNull();

		// All slides should be visible (not hidden via opacity).
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();
		expect(count).toBe(3);

		for (let i = 0; i < count; i++) {
			const opacity = await slides.nth(i).evaluate((el) => getComputedStyle(el).opacity);
			expect(opacity).toBe("1");
		}

		await context.close();
	});
});
