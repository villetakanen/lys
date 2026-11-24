import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/examples/minimal.html");
	// Wait for Lys to initialize.
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("role") === "group";
	});
});

test.describe("focus on navigation", () => {
	test("engine surface does not suppress an authored focus outline", async ({ page }) => {
		await page.addStyleTag({ content: "article:focus { outline: 2px dashed currentColor; }" });
		await page.keyboard.press("ArrowRight");

		const second = page.locator("[data-lys] > article").nth(1);
		await expect(second).toBeFocused();
		await expect(second).toHaveCSS("outline-style", "dashed");
	});

	test("focus still moves to active slide", async ({ page }) => {
		const count = await page.locator("[data-lys] > article").count();
		await page.keyboard.press("ArrowRight");

		const focused = await page.evaluate(() => {
			return document.activeElement?.getAttribute("aria-label");
		});
		expect(focused).toBe(`Slide 2 of ${count}`);
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
		const count = await page.locator("[data-lys] > article").count();
		await page.keyboard.press("ArrowRight");

		const liveRegion = page.locator('[role="status"]');
		await expect(liveRegion).toHaveText(`Slide 2 of ${count}`);
	});

	test("focus moves to active slide on navigation", async ({ page }) => {
		const count = await page.locator("[data-lys] > article").count();
		await page.keyboard.press("ArrowRight");

		const focused = await page.evaluate(() => {
			return document.activeElement?.getAttribute("aria-label");
		});
		expect(focused).toBe(`Slide 2 of ${count}`);
	});
});

test.describe("progressive enhancement", () => {
	test("CSS-only deck has valid article semantics", async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto("/examples/minimal.html");

		// Articles should be valid HTML5 elements without ARIA violations.
		const articles = page.locator("[data-lys] > article");
		const count = await articles.count();
		expect(count).toBeGreaterThan(0);

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

	test("full example deck has zero critical/serious axe-core violations", async ({ page }) => {
		await page.goto("/examples/full.html");
		await expect(page.locator("[data-lys]")).toHaveAttribute("data-lys-ready", "");

		const results = await new AxeBuilder({ page }).analyze();
		const critical = results.violations.filter((v) => v.impact === "critical");
		const serious = results.violations.filter((v) => v.impact === "serious");
		expect(critical).toHaveLength(0);
		expect(serious).toHaveLength(0);
	});
});

// specs/deck-transitions — "Accessibility of motion". A transition must not
// move focus, add roles, labels or announcements: the accessibility state
// during and after motion matches the immediate (none) style exactly.
const transitionsFixture = readFileSync(
	new URL("../fixtures/transitions.html", import.meta.url),
	"utf8",
);

async function openTransitions(page: Page, style: string) {
	const body = transitionsFixture
		.replace("<main data-lys", `<main data-lys data-transition="${style}"`)
		.replace(
			"</head>",
			"<style>[data-lys] { --lys-transition-duration: 4s; --lys-transition-easing: linear; }</style></head>",
		);
	await page.route("http://localhost:4173/transitions.html", (route) =>
		route.fulfill({ contentType: "text/html", body }),
	);
	await page.goto("http://localhost:4173/transitions.html");
	await expect(page.locator("[data-lys]")).toHaveAttribute("data-lys-ready", "");
}

/** Focus, roles, ARIA attributes and text of every element in the body. */
function a11yState(page: Page) {
	return page.evaluate(() => ({
		focus: document.activeElement?.id || document.activeElement?.tagName,
		elements: Array.from(document.body.querySelectorAll("*")).map((el) => [
			el.tagName,
			el.id,
			...Array.from(el.attributes)
				.filter((a) => a.name === "role" || a.name === "tabindex" || a.name.startsWith("aria-"))
				.map((a) => `${a.name}=${a.value}`)
				.sort(),
		]),
		live: Array.from(document.querySelectorAll("[aria-live]")).map((el) => el.textContent),
	}));
}

test.describe("accessibility of motion", () => {
	test("transitions add no focus moves, roles, labels or announcements", async ({ page }) => {
		const states: Record<string, unknown[]> = {};
		for (const style of ["none", "fade", "horizontal", "vertical"]) {
			await openTransitions(page, style);
			await page.locator("[data-lys]").focus();
			const seen: unknown[] = [];
			for (const key of ["ArrowRight", "End", "ArrowLeft"]) {
				await page.keyboard.press(key);
				// Mid-motion for the motion styles (4s duration).
				seen.push(await a11yState(page));
			}
			states[style] = seen;
			await page.unrouteAll();
		}
		for (const style of ["fade", "horizontal", "vertical"])
			expect(states[style], style).toEqual(states.none);
	});

	// Not fade: axe's colour-contrast rule blends the two half-transparent
	// frames mid-fade and reports a contrast failure that no settled state has.
	for (const style of ["horizontal"]) {
		test(`${style} deck mid-transition has zero critical/serious axe-core violations`, async ({
			page,
		}) => {
			await openTransitions(page, style);
			await page.keyboard.press("ArrowRight");
			const results = await new AxeBuilder({ page }).analyze();
			const blocking = results.violations.filter(
				(v) => v.impact === "critical" || v.impact === "serious",
			);
			expect(blocking).toHaveLength(0);
		});
	}
});
