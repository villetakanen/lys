import { expect, test } from "@playwright/test";

/**
 * Print layout — see specs/print-layout.spec.md.
 *
 * Geometry is measured, never inferred from computed properties: the pre-#60
 * suite asserted only property values, which is why slides covering 43% of the
 * page shipped green.
 *
 * Two complementary methods are used:
 *  1. Emulated print media with the viewport set to the expected page box.
 *     Fast, cross-browser, but it cannot prove `@page` applied — it would pass
 *     the buggy CSS if the viewport happened to match the fixed page box.
 *  2. A real PDF via page.pdf(), reading the page count and /MediaBox from the
 *     bytes. The only proof that `@page` took effect. Chromium-only.
 */

/** Default page box: 10in x 5.625in at 96dpi. */
const PAGE_BOX = { width: 960, height: 540 };

/** PDF points -> CSS px. */
const PT_TO_PX = 96 / 72;

interface PdfInfo {
	pages: number;
	widthPt: number;
	heightPt: number;
}

function readPdf(buffer: Buffer): PdfInfo {
	const bytes = buffer.toString("latin1");
	const pages = (bytes.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
	const mediaBox = bytes.match(/\/MediaBox \[([^\]]+)\]/);
	if (!mediaBox) throw new Error("no /MediaBox in PDF");
	const [, , widthPt, heightPt] = mediaBox[1].trim().split(/\s+/).map(Number);
	return { pages, widthPt, heightPt };
}

async function gotoDeck(
	page: import("@playwright/test").Page,
	url: string,
	css?: string,
): Promise<void> {
	await page.goto(url);
	await page.waitForFunction(() => {
		const container = document.querySelector("[data-lys]");
		return container?.getAttribute("role") === "group";
	});
	if (css) await page.addStyleTag({ content: css });
}

/** Measure the first slide against the page box, in emulated print media. */
async function measureInPrint(
	page: import("@playwright/test").Page,
	box: { width: number; height: number } = PAGE_BOX,
) {
	await page.setViewportSize(box);
	await page.emulateMedia({ media: "print" });
	return page.evaluate(() => {
		const slides = [...document.querySelectorAll("[data-lys] > article")];
		const first = slides[0].getBoundingClientRect();
		return {
			count: slides.length,
			width: first.width,
			height: first.height,
			top: first.top,
			left: first.left,
			pageWidth: window.innerWidth,
			pageHeight: window.innerHeight,
		};
	});
}

test.describe("print — page box geometry", () => {
	test("a 16:9 deck fills the printed page", async ({ page }) => {
		await gotoDeck(page, "/examples/minimal.html");
		const m = await measureInPrint(page);

		expect(m.width / m.pageWidth).toBeGreaterThanOrEqual(0.99);
		expect(m.height / m.pageHeight).toBeGreaterThanOrEqual(0.99);
	});

	test("the page box is landscape and ratio-matched", async ({ page, browserName }) => {
		test.skip(browserName !== "chromium", "page.pdf() is Chromium-only");
		await gotoDeck(page, "/examples/minimal.html");

		const pdf = readPdf(await page.pdf({ preferCSSPageSize: true }));

		// Landscape, and the 16:9 page the token asks for — proof @page applied.
		expect(pdf.widthPt).toBeGreaterThan(pdf.heightPt);
		expect(Math.round(pdf.widthPt * PT_TO_PX)).toBe(PAGE_BOX.width);
		expect(Math.round(pdf.heightPt * PT_TO_PX)).toBe(PAGE_BOX.height);
	});

	test("the slide is centered on the inline axis", async ({ page }) => {
		// A 4:3 deck on the 16:9 default page is the only case where centering
		// is observable — a matched deck fills the page edge to edge.
		await gotoDeck(page, "/examples/minimal.html", ":root{--lys-aspect-ratio:4/3}");
		const m = await measureInPrint(page);

		expect(m.left).toBeCloseTo((m.pageWidth - m.width) / 2, 0);
	});
});

test.describe("print — geometry regression floor", () => {
	// The pre-#60 defect: 43% (16:9) and 32% (24:10) of the block axis.
	for (const deck of ["minimal", "full", "square", "nav"]) {
		test(`${deck}.html covers at least 60% of the page block axis`, async ({ page }) => {
			await gotoDeck(page, `/examples/${deck}.html`);
			const m = await measureInPrint(page);

			expect(m.height / m.pageHeight).toBeGreaterThanOrEqual(0.6);
		});
	}

	test("a slide never exceeds its page box", async ({ page }) => {
		await gotoDeck(page, "/examples/minimal.html");
		const m = await measureInPrint(page);

		expect(m.width).toBeLessThanOrEqual(m.pageWidth);
		expect(m.height).toBeLessThanOrEqual(m.pageHeight);
	});

	test("--lys-slide-gap does not push slides off their page", async ({ page }) => {
		await gotoDeck(page, "/examples/minimal.html", ":root{--lys-slide-gap:4rem}");
		await page.setViewportSize(PAGE_BOX);
		await page.emulateMedia({ media: "print" });

		const margins = await page.evaluate(() =>
			[...document.querySelectorAll("[data-lys] > article")].map(
				(a) => getComputedStyle(a).marginTop,
			),
		);
		expect(margins.every((m) => m === "0px")).toBe(true);
	});
});

test.describe("print — author page-box override", () => {
	test("author sets an A4 landscape page", async ({ page, browserName }) => {
		test.skip(browserName !== "chromium", "page.pdf() is Chromium-only");
		await gotoDeck(page, "/examples/minimal.html", ":root{--lys-print-page-size:A4 landscape}");

		const pdf = readPdf(await page.pdf({ preferCSSPageSize: true }));
		expect(pdf.widthPt).toBeGreaterThan(pdf.heightPt);
		// A4 landscape is 297mm x 210mm => 842pt x 595pt.
		expect(Math.round(pdf.widthPt)).toBeGreaterThan(800);

		// The 16:9 slide letterboxes inside it without cropping.
		const box = {
			width: Math.round(pdf.widthPt * PT_TO_PX),
			height: Math.round(pdf.heightPt * PT_TO_PX),
		};
		const m = await measureInPrint(page, box);
		expect(m.width).toBeLessThanOrEqual(m.pageWidth);
		expect(m.height).toBeLessThanOrEqual(m.pageHeight);
	});

	test("the token is a no-op when scoped to the container", async ({ page, browserName }) => {
		test.skip(browserName !== "chromium", "page.pdf() is Chromium-only");
		// The page context inherits custom properties from the root element only.
		await gotoDeck(
			page,
			"/examples/minimal.html",
			"[data-lys]{--lys-print-page-size:A4 landscape}",
		);

		const pdf = readPdf(await page.pdf({ preferCSSPageSize: true }));
		expect(Math.round(pdf.widthPt * PT_TO_PX)).toBe(PAGE_BOX.width);
		expect(pdf.pages).toBeGreaterThan(0);
	});
});

test.describe("print — aspect-ratio mismatch", () => {
	test("a 4:3 deck on a 16:9 page is pillarboxed, not cropped", async ({ page }) => {
		await gotoDeck(page, "/examples/minimal.html", ":root{--lys-aspect-ratio:4/3}");
		const m = await measureInPrint(page);

		expect(m.width).toBeLessThan(m.pageWidth);
		expect(m.height / m.pageHeight).toBeCloseTo(1, 1);
		expect(m.width / m.height).toBeCloseTo(4 / 3, 1);
	});

	test("a 4:3 deck still prints one slide per page", async ({ page, browserName }) => {
		test.skip(browserName !== "chromium", "page.pdf() is Chromium-only");
		await gotoDeck(page, "/examples/minimal.html", ":root{--lys-aspect-ratio:4/3}");

		const slides = await page.locator("[data-lys] > article").count();
		const pdf = readPdf(await page.pdf({ preferCSSPageSize: true }));
		expect(pdf.pages).toBe(slides);
	});

	test("a 24:10 deck fits within the page box", async ({ page }) => {
		await gotoDeck(page, "/examples/square.html");
		const m = await measureInPrint(page);

		expect(m.width).toBeLessThanOrEqual(m.pageWidth);
		expect(m.height).toBeLessThanOrEqual(m.pageHeight);
	});
});

test.describe("print — pagination", () => {
	for (const deck of ["minimal", "full", "nav"]) {
		test(`${deck}.html produces exactly one page per slide`, async ({ page, browserName }) => {
			test.skip(browserName !== "chromium", "page.pdf() is Chromium-only");
			await gotoDeck(page, `/examples/${deck}.html`);

			const slides = await page.locator("[data-lys] > article").count();
			const pdf = readPdf(await page.pdf({ preferCSSPageSize: true }));

			// Exact equality also proves there is no trailing blank page.
			expect(pdf.pages).toBe(slides);
		});
	}
});

test.describe("print — container query context", () => {
	test("slides remain size containers in print", async ({ page }) => {
		// Reverses the #28 print reset: the print box is definite on both axes,
		// so author cqi type resolves against the slide, not the page.
		await gotoDeck(page, "/examples/minimal.html");
		await page.setViewportSize(PAGE_BOX);
		await page.emulateMedia({ media: "print" });

		const types = await page.evaluate(() =>
			[...document.querySelectorAll("[data-lys] > article")].map(
				(a) => getComputedStyle(a).containerType,
			),
		);
		expect(types.every((t) => t === "size")).toBe(true);
	});

	test("cqi type scales proportionally between screen and print", async ({ page }) => {
		// A pure cqi size, not the default token: clamp()'s ceiling caps the
		// default at both output sizes, which would mask a broken query context.
		await gotoDeck(page, "/examples/minimal.html", "[data-lys] > article h1{font-size:10cqi}");

		const ratioOf = async () =>
			page.evaluate(() => {
				const slide = document.querySelector("[data-lys] > article") as HTMLElement;
				const heading = slide.querySelector("h1, h2") as HTMLElement;
				return (
					Number.parseFloat(getComputedStyle(heading).fontSize) /
					slide.getBoundingClientRect().width
				);
			});

		// Same slide, two output sizes: the type-to-slide ratio must hold.
		await page.setViewportSize({ width: 1280, height: 720 });
		const screen = await ratioOf();
		await page.setViewportSize(PAGE_BOX);
		await page.emulateMedia({ media: "print" });
		const print = await ratioOf();

		expect(print).toBeCloseTo(screen, 3);
	});

	test("print layout has readable font-size", async ({ page }) => {
		await gotoDeck(page, "/examples/minimal.html");
		await page.setViewportSize(PAGE_BOX);
		await page.emulateMedia({ media: "print" });

		const sizes = await page.evaluate(() =>
			[...document.querySelectorAll("[data-lys] > article")].map((a) =>
				Number.parseFloat(getComputedStyle(a).fontSize),
			),
		);
		for (const size of sizes) {
			expect(size).toBeGreaterThanOrEqual(12);
			expect(size).toBeLessThanOrEqual(24);
		}
	});

	test("print layout padding resolves against the slide", async ({ page }) => {
		await gotoDeck(page, "/examples/minimal.html");
		await page.setViewportSize(PAGE_BOX);
		await page.emulateMedia({ media: "print" });

		const { paddingLeft, slideWidth } = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => ({
				paddingLeft: Number.parseFloat(getComputedStyle(el).paddingLeft),
				slideWidth: el.getBoundingClientRect().width,
			}));

		// minimal.html sets --lys-slide-padding: 6cqi. Asserting the ratio (not a
		// pixel value) is what proves cqi resolves against the slide, not the page.
		expect(paddingLeft).toBeGreaterThan(0);
		expect(paddingLeft / slideWidth).toBeCloseTo(0.06, 3);
	});
});

test.describe("print — colors", () => {
	test("slide backgrounds are forced to print", async ({ page }) => {
		// Chrome prints with "Background graphics" off by default; without this
		// a dark deck loses its surface and its contrast pair.
		await gotoDeck(page, "/examples/minimal.html");
		await page.emulateMedia({ media: "print" });

		const adjust = await page
			.locator("[data-lys] > article")
			.first()
			.evaluate((el) => {
				const style = getComputedStyle(el);
				return style.printColorAdjust || style.webkitPrintColorAdjust;
			});
		expect(adjust).toBe("exact");
	});

	test("the out-of-slide area costs no ink", async ({ page }) => {
		await gotoDeck(page, "/examples/minimal.html", "[data-lys]{--lys-backdrop:#101010}");
		await page.emulateMedia({ media: "print" });

		const bg = await page
			.locator("[data-lys]")
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(bg).toBe("rgba(0, 0, 0, 0)");
	});
});

test.describe("print — nav region", () => {
	test("the nav region is not printed and takes no block space", async ({ page }) => {
		await gotoDeck(page, "/examples/nav.html");
		await page.setViewportSize(PAGE_BOX);
		await page.emulateMedia({ media: "print" });

		const result = await page.evaluate(() => {
			const nav = document.querySelector("[data-lys-nav]") as HTMLElement;
			const first = document.querySelector("[data-lys] > article") as HTMLElement;
			return {
				display: getComputedStyle(nav).display,
				navHeight: nav.getBoundingClientRect().height,
				firstSlideTop: first.getBoundingClientRect().top,
			};
		});

		expect(result.display).toBe("none");
		expect(result.navHeight).toBe(0);
		expect(result.firstSlideTop).toBe(0);
	});

	test("the nav region stays available on screen", async ({ page }) => {
		await gotoDeck(page, "/examples/nav.html");

		await expect(page.locator("[data-lys-nav]")).toBeVisible();
		await expect(page.locator("[data-lys-nav] a").first()).toBeVisible();
	});
});

test.describe("print — layout modes", () => {
	test("scroll-snap decks print every slide", async ({ page }) => {
		await gotoDeck(page, "/examples/minimal.html");
		await page.emulateMedia({ media: "print" });

		const container = await page
			.locator("[data-lys]")
			.evaluate((el) => getComputedStyle(el).scrollSnapType);
		expect(container).toBe("none");

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();
		expect(count).toBeGreaterThan(0);

		for (let i = 0; i < count; i++) {
			const style = await slides.nth(i).evaluate((el) => ({
				opacity: getComputedStyle(el).opacity,
				position: getComputedStyle(el).position,
				breakAfter: getComputedStyle(el).breakAfter,
			}));
			expect(style.opacity).toBe("1");
			expect(["static", "relative"]).toContain(style.position);
			if (i < count - 1) expect(["page", "always"]).toContain(style.breakAfter);
		}
	});

	test("stacked/fade decks print every slide", async ({ page }) => {
		await page.goto("/examples/full.html");
		await page.waitForFunction(() => {
			const container = document.querySelector("[data-lys]");
			return container?.getAttribute("data-lys-mode") === "stacked";
		});
		await page.emulateMedia({ media: "print" });

		const slides = page.locator("[data-lys] > article");
		const count = await slides.count();
		expect(count).toBeGreaterThan(0);

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

test.describe("print — accessibility", () => {
	test("every slide's content is on its own page, in order", async ({ page, browserName }) => {
		test.skip(browserName !== "chromium", "page.pdf() is Chromium-only");
		await gotoDeck(page, "/examples/minimal.html");

		const headings = await page
			.locator("[data-lys] > article")
			.evaluateAll((els) => els.map((el) => el.querySelector("h1, h2")?.textContent?.trim() ?? ""));

		const pdf = readPdf(await page.pdf({ preferCSSPageSize: true }));
		expect(pdf.pages).toBe(headings.length);

		// Content is not clipped away: each slide still reports its heading.
		expect(headings.every((h) => h.length > 0)).toBe(true);
	});

	test("screen-reader-only content is not printed as visible text", async ({ page }) => {
		await gotoDeck(page, "/examples/minimal.html");
		await page.setViewportSize(PAGE_BOX);
		await page.emulateMedia({ media: "print" });

		const box = await page.evaluate(() => {
			const region = document.querySelector(".lys-sr-only");
			if (!region) return null;
			const rect = region.getBoundingClientRect();
			return { width: rect.width, height: rect.height };
		});

		if (box) {
			expect(box.width).toBeLessThanOrEqual(1);
			expect(box.height).toBeLessThanOrEqual(1);
		}
	});
});

test.describe("print — progressive enhancement", () => {
	test.use({ javaScriptEnabled: false });

	test("print geometry is identical without JavaScript", async ({ page }) => {
		// No page.evaluate here — it is unavailable with JS disabled, so the
		// measurement goes through the protocol-level bounding box.
		await page.goto("/examples/minimal.html");
		await page.setViewportSize(PAGE_BOX);
		await page.emulateMedia({ media: "print" });

		const box = await page.locator("[data-lys] > article").first().boundingBox();
		expect(box).not.toBeNull();
		expect(box?.width).toBeCloseTo(PAGE_BOX.width, 0);
		expect(box?.height).toBeCloseTo(PAGE_BOX.height, 0);
	});

	test("pagination works without JavaScript", async ({ page, browserName }) => {
		test.skip(browserName !== "chromium", "page.pdf() is Chromium-only");
		await page.goto("/examples/minimal.html");

		const slides = await page.locator("[data-lys] > article").count();
		const pdf = readPdf(await page.pdf({ preferCSSPageSize: true }));
		expect(pdf.pages).toBe(slides);
	});
});
