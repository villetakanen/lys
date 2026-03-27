import { expect, type Page, test } from "@playwright/test";

/** Navigate to the navigation fixture and wait for Lys to initialize. */
async function setupNavDeck(page: Page) {
	await page.goto("/tests/fixtures/navigation.html");
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("role") === "group";
	});
}

/** Press ArrowRight N times to advance to a specific slide. */
async function goToSlide(page: Page, n: number) {
	for (let i = 0; i < n; i++) {
		await page.keyboard.press("ArrowRight");
	}
}

test.describe("keyboard navigation", () => {
	test.beforeEach(async ({ page }) => {
		await setupNavDeck(page);
	});

	test("ArrowRight advances to next slide", async ({ page }) => {
		await page.keyboard.press("ArrowRight");
		const second = page.locator("[data-lys] > article").nth(1);
		await expect(second).toHaveAttribute("data-lys-active", "");
	});

	test("ArrowLeft goes to previous slide", async ({ page }) => {
		await goToSlide(page, 2);
		await page.keyboard.press("ArrowLeft");
		const second = page.locator("[data-lys] > article").nth(1);
		await expect(second).toHaveAttribute("data-lys-active", "");
	});

	test("Home jumps to first slide", async ({ page }) => {
		await goToSlide(page, 3);
		await page.keyboard.press("Home");
		const first = page.locator("[data-lys] > article").nth(0);
		await expect(first).toHaveAttribute("data-lys-active", "");
	});

	test("End jumps to last slide", async ({ page }) => {
		await page.keyboard.press("End");
		const last = page.locator("[data-lys] > article").nth(4);
		await expect(last).toHaveAttribute("data-lys-active", "");
	});

	test("Space advances to next slide", async ({ page }) => {
		await page.keyboard.press("Space");
		const second = page.locator("[data-lys] > article").nth(1);
		await expect(second).toHaveAttribute("data-lys-active", "");
	});

	test("Shift+Space goes to previous slide", async ({ page }) => {
		await goToSlide(page, 2);
		await page.keyboard.press("Shift+Space");
		const second = page.locator("[data-lys] > article").nth(1);
		await expect(second).toHaveAttribute("data-lys-active", "");
	});

	test("Space does not navigate when input is focused", async ({ page }) => {
		await goToSlide(page, 3);
		await page.locator("[data-lys] > article").nth(3).locator("input").click();
		await page.keyboard.press("Space");
		const container = page.locator("[data-lys]");
		await expect(container).toHaveAttribute("data-lys-current", "3");
	});

	test("Arrow keys still navigate when input is focused", async ({ page }) => {
		await goToSlide(page, 3);
		await page.locator("[data-lys] > article").nth(3).locator("input").click();
		await page.keyboard.press("ArrowRight");
		const fifth = page.locator("[data-lys] > article").nth(4);
		await expect(fifth).toHaveAttribute("data-lys-active", "");
	});
});

test.describe("hash routing", () => {
	test("hash deep link on page load (numeric)", async ({ page }) => {
		await page.goto("/tests/fixtures/navigation.html#slide=3");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});
		const third = page.locator("[data-lys] > article").nth(2);
		await expect(third).toHaveAttribute("data-lys-active", "");
	});

	test("hash deep link on page load (id)", async ({ page }) => {
		await page.goto("/tests/fixtures/navigation.html#slide=overview");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});
		const second = page.locator("[data-lys] > article").nth(1);
		await expect(second).toHaveAttribute("data-lys-active", "");
	});

	test("hash updates on navigation", async ({ page }) => {
		await setupNavDeck(page);
		// ArrowRight goes to slide 1 which has id="overview", so hash uses the id.
		// Navigate past it to slide 2 (index 2, no id) to test numeric hash.
		await page.keyboard.press("ArrowRight"); // → slide 1 (overview)
		await page.keyboard.press("ArrowRight"); // → slide 2 (no id)
		expect(page.url()).toContain("slide=3"); // 1-based: index 2 → slide=3
	});

	test("hash updates use article id when available", async ({ page }) => {
		await setupNavDeck(page);
		await page.keyboard.press("ArrowRight"); // → slide 1 with id="overview"
		expect(page.url()).toContain("slide=overview");
	});

	test("external hashchange triggers navigation", async ({ page }) => {
		await setupNavDeck(page);
		await page.evaluate(() => {
			location.hash = "#slide=4";
		});
		const fourth = page.locator("[data-lys] > article").nth(3);
		await expect(fourth).toHaveAttribute("data-lys-active", "");
	});

	test("invalid hash is ignored", async ({ page }) => {
		await page.goto("/tests/fixtures/navigation.html#something-else");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});
		const first = page.locator("[data-lys] > article").nth(0);
		await expect(first).toHaveAttribute("data-lys-active", "");
	});

	test("hash with out-of-range number is clamped", async ({ page }) => {
		await page.goto("/tests/fixtures/navigation.html#slide=99");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("role") === "group";
		});
		const last = page.locator("[data-lys] > article").nth(4);
		await expect(last).toHaveAttribute("data-lys-active", "");
	});
});

test.describe("multiple decks", () => {
	test("two decks navigate independently", async ({ page }) => {
		await page.goto("/tests/fixtures/multi-deck.html");
		await page.waitForFunction(() => {
			const deckA = document.querySelector("#deck-a");
			const deckB = document.querySelector("#deck-b");
			return deckA?.getAttribute("role") === "group" && deckB?.getAttribute("role") === "group";
		});

		await page.locator("#deck-a").click();
		await page.keyboard.press("ArrowRight");

		const deckASecond = page.locator("#deck-a > article").nth(1);
		await expect(deckASecond).toHaveAttribute("data-lys-active", "");

		const deckBFirst = page.locator("#deck-b > article").nth(0);
		await expect(deckBFirst).toHaveAttribute("data-lys-active", "");
	});

	test("hash routing targets the correct deck", async ({ page }) => {
		await page.goto("/tests/fixtures/multi-deck.html");
		await page.waitForFunction(() => {
			const deckA = document.querySelector("#deck-a");
			const deckB = document.querySelector("#deck-b");
			return deckA?.getAttribute("role") === "group" && deckB?.getAttribute("role") === "group";
		});

		await page.evaluate(() => {
			location.hash = "#slide=target";
		});

		const deckBSecond = page.locator("#deck-b > article").nth(1);
		await expect(deckBSecond).toHaveAttribute("data-lys-active", "");

		const deckAFirst = page.locator("#deck-a > article").nth(0);
		await expect(deckAFirst).toHaveAttribute("data-lys-active", "");
	});
});
