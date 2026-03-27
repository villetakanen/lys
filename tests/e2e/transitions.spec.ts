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
		return container?.getAttribute("data-lys-mode") === "fade";
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

	test("container has data-lys-mode='fade'", async ({ page }) => {
		const container = page.locator("[data-lys]");
		await expect(container).toHaveAttribute("data-lys-mode", "fade");
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

		const slide = page.locator("[data-lys] > article").nth(1);
		const duration = await slide.evaluate((el) => getComputedStyle(el).transitionDuration);
		expect(duration).toBe("0.5s");

		const easing = await slide.evaluate((el) => getComputedStyle(el).transitionTimingFunction);
		expect(easing).toBe("linear");
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
			return container?.getAttribute("data-lys-mode") === "fade";
		});

		const slide = page.locator("[data-lys] > article").nth(1);
		const duration = await slide.evaluate((el) => getComputedStyle(el).transitionDuration);
		expect(duration).toBe("0s");
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

	test("fade mode print layout shows all slides", async ({ page }) => {
		await page.goto("/tests/fixtures/fade.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("data-lys-mode") === "fade";
		});

		await page.emulateMedia({ media: "print" });

		// Wait for all slides to reach opacity: 1 (print CSS overrides fade mode).
		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();

		for (let i = 0; i < count; i++) {
			await expect(async () => {
				const opacity = await slides.nth(i).evaluate((el) => getComputedStyle(el).opacity);
				expect(opacity).toBe("1");
			}).toPass({ timeout: 2000 });

			const position = await slides.nth(i).evaluate((el) => getComputedStyle(el).position);
			expect(position).toBe("static");
		}
	});
});
