import { readFileSync } from "node:fs";
import { type Browser, expect, type Page, test } from "@playwright/test";

/**
 * Deck transitions — specs/deck-transitions/spec.md.
 *
 * Runs against the production CSS and IIFE (built site on :4173). Motion is
 * sampled deterministically by pausing the engine's CSS transitions at known
 * points with the Web Animations API, then reading frame geometry, opacity and
 * pixels outside the frame.
 */

const fixture = readFileSync(new URL("../fixtures/transitions.html", import.meta.url), "utf8");
const origin = "http://localhost:4173";
const deck = "[data-lys]";
const active = `${deck} > article[data-lys-active]`;
const STYLES = ["none", "fade", "horizontal", "vertical"] as const;
const MOTION = ["fade", "horizontal", "vertical"] as const;

interface DeckOptions {
	/** Deck `data-transition`; `null` omits the attribute. */
	style?: string | null;
	css?: string;
	hash?: string;
	/** Raw attributes added to article #s2. */
	s2?: string;
}

function page(options: DeckOptions): string {
	let body = fixture;
	if (options.style != null)
		body = body.replace("<main data-lys", `<main data-lys data-transition="${options.style}"`);
	if (options.css) body = body.replace("</head>", `<style>${options.css}</style></head>`);
	if (options.s2) body = body.replace('<article id="s2"', `<article id="s2" ${options.s2}`);
	return body;
}

async function open(p: Page, options: DeckOptions = {}): Promise<void> {
	const body = page(options);
	await p.route(`${origin}/transitions.html`, (route) =>
		route.fulfill({ contentType: "text/html", body }),
	);
	await p.goto(`${origin}/transitions.html${options.hash ?? ""}`);
	await expect(p.locator(deck)).toHaveAttribute("data-lys-ready", "");
}

const duration = (ms: number, easing = "linear") =>
	`[data-lys] { --lys-transition-duration: ${ms}ms; --lys-transition-easing: ${easing}; }`;

interface Motion {
	id: string;
	property: string;
	duration: number;
	delay: number;
	easing: string;
}

/** The engine's running CSS transitions on article frames. */
function frameMotion(p: Page): Promise<Motion[]> {
	return p.evaluate(() =>
		Array.from(document.querySelectorAll<HTMLElement>("[data-lys] > article")).flatMap((slide) =>
			slide
				.getAnimations()
				.filter((a): a is CSSTransition => a instanceof CSSTransition)
				.map((a) => {
					const timing = a.effect?.getTiming() ?? {};
					const keyframes = (a.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
					const easing =
						timing.easing && timing.easing !== "linear"
							? timing.easing
							: (keyframes[0]?.easing ?? "linear");
					return {
						id: slide.id,
						property: a.transitionProperty,
						duration: Number(timing.duration),
						delay: Number(timing.delay ?? 0),
						easing,
					};
				}),
		),
	);
}

/** Pause every frame transition at `ms` after it started. */
function pauseAt(p: Page, ms: number): Promise<void> {
	return p.evaluate((t) => {
		for (const slide of document.querySelectorAll<HTMLElement>("[data-lys] > article"))
			for (const a of slide.getAnimations()) {
				if (!(a instanceof CSSTransition)) continue;
				a.pause();
				a.currentTime = t;
			}
	}, ms);
}

interface Frame {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	opacity: number;
}

function frames(p: Page): Promise<Frame[]> {
	return p.locator(`${deck} > article`).evaluateAll((slides) =>
		slides.map((slide) => {
			const { x, y, width, height } = slide.getBoundingClientRect();
			return {
				id: slide.id,
				x,
				y,
				width,
				height,
				opacity: Number(getComputedStyle(slide).opacity),
			};
		}),
	);
}

const byId = (list: Frame[], id: string) => list.find((f) => f.id === id) as Frame;

/** Ids of frames with nonzero opacity. */
async function painted(p: Page): Promise<string[]> {
	return (await frames(p)).filter((f) => f.opacity > 0).map((f) => f.id);
}

/** Records, every animation frame, which articles have nonzero opacity. */
function startSampler(p: Page): Promise<void> {
	return p.evaluate(() => {
		const w = window as unknown as { __lysSamples: string[][]; __lysStop: boolean };
		w.__lysSamples = [];
		w.__lysStop = false;
		const tick = () => {
			w.__lysSamples.push(
				Array.from(document.querySelectorAll<HTMLElement>("[data-lys] > article"))
					.filter((s) => getComputedStyle(s).opacity !== "0")
					.map((s) => s.id),
			);
			if (!w.__lysStop) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
}

function stopSampler(p: Page): Promise<string[][]> {
	return p.evaluate(() => {
		const w = window as unknown as { __lysSamples: string[][]; __lysStop: boolean };
		w.__lysStop = true;
		return w.__lysSamples;
	});
}

/** Pixels in a screenshot region that differ from the fixture's backdrop. */
async function foreignPixels(
	p: Page,
	clip: { x: number; y: number; width: number; height: number },
): Promise<number> {
	const png = (await p.screenshot({ clip })).toString("base64");
	return p.evaluate(async (src) => {
		const img = new Image();
		img.src = `data:image/png;base64,${src}`;
		await img.decode();
		const canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.drawImage(img, 0, 0);
		const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		let count = 0;
		for (let i = 0; i < d.length; i += 4) if (d[i] > 24 || d[i + 1] > 24 || d[i + 2] < 231) count++;
		return count;
	}, png);
}

async function settled(p: Page): Promise<void> {
	await expect.poll(() => frameMotion(p).then((m) => m.length)).toBe(0);
}

test("default deck changes slides immediately and is not a slide scroller", async ({ page: p }) => {
	await open(p, { css: duration(5000) });
	const before = await frames(p);
	await p.keyboard.press("ArrowRight");
	await expect(p.locator(active)).toHaveAttribute("id", "s2");
	expect(await frameMotion(p)).toEqual([]);
	expect(await painted(p)).toEqual(["s2"]);
	const after = await frames(p);
	// Every frame shares the settled cell; selection never scrolls the deck.
	for (const f of after) {
		expect(Math.abs(f.x - before[0].x)).toBeLessThan(1);
		expect(Math.abs(f.y - before[0].y)).toBeLessThan(1);
	}
	const scroll = await p.locator(deck).evaluate((el) => ({
		top: el.scrollTop,
		extra: el.scrollHeight - el.clientHeight,
	}));
	expect(scroll.top).toBe(0);
	expect(scroll.extra).toBeLessThanOrEqual(1);
});

for (const [value, style] of [
	["fade", "fade"],
	["Horizontal", "horizontal"],
	["vertical", "vertical"],
	["", "none"],
	["spin", "none"],
] as const) {
	test(`data-transition "${value}" resolves to ${style}`, async ({ page: p }) => {
		await open(p, { style: value, css: duration(2000) });
		const start = byId(await frames(p), "s1");
		await p.keyboard.press("ArrowRight");
		await expect(p.locator(active)).toHaveAttribute("id", "s2");
		const motion = await frameMotion(p);
		const animated = motion.filter((m) => m.duration > 0).map((m) => m.property);
		if (style === "none") expect(animated).toEqual([]);
		else if (style === "fade") expect(animated.sort()).toEqual(["--_lys-alpha", "--_lys-alpha"]);
		else expect(animated).toEqual(["--_lys-offset", "--_lys-offset"]);
		if (style === "horizontal" || style === "vertical") {
			await pauseAt(p, 1000);
			const s2 = byId(await frames(p), "s2");
			const dx = Math.abs(s2.x - start.x);
			const dy = Math.abs(s2.y - start.y);
			expect(style === "horizontal" ? dx : dy).toBeGreaterThan(start.width / 4);
			expect(style === "horizontal" ? dy : dx).toBeLessThan(1);
		}
		await expect(p.locator(deck)).toHaveAttribute("data-transition", value);
	});
}

test("article data-transition is ignored", async ({ page: p }) => {
	await open(p, { s2: 'data-transition="fade"', css: duration(2000) });
	await p.keyboard.press("ArrowRight");
	await expect(p.locator(active)).toHaveAttribute("id", "s2");
	expect(await frameMotion(p)).toEqual([]);
	expect(await painted(p)).toEqual(["s2"]);
	await expect(p.locator("#s2")).toHaveAttribute("data-transition", "fade");
});

test("fade cross-fades with the deck's timing, then paints only the incoming frame", async ({
	page: p,
}) => {
	await open(p, { style: "fade", css: duration(2000) });
	await p.keyboard.press("ArrowRight");
	// Selection and URL update at the request, not when motion ends.
	await expect(p.locator(active)).toHaveAttribute("id", "s2");
	expect(new URL(p.url()).hash).toBe("#slide=s2");
	const motion = await frameMotion(p);
	expect(motion.map((m) => [m.id, m.property, m.duration, m.easing]).sort()).toEqual([
		["s1", "--_lys-alpha", 2000, "linear"],
		["s2", "--_lys-alpha", 2000, "linear"],
	]);
	await pauseAt(p, 1000);
	const mid = await frames(p);
	expect(byId(mid, "s1").opacity).toBeCloseTo(0.5, 1);
	expect(byId(mid, "s2").opacity).toBeCloseTo(0.5, 1);
	await p.evaluate(() => {
		for (const a of document.getAnimations()) if (a instanceof CSSTransition) a.finish();
	});
	await settled(p);
	expect(await painted(p)).toEqual(["s2"]);
});

for (const style of ["horizontal", "vertical"] as const) {
	for (const forward of [true, false]) {
		test(`${style} ${forward ? "forward" : "backward"} motion direction`, async ({ page: p }) => {
			await open(p, { style, css: duration(2000), hash: forward ? "" : "#slide=s2" });
			const frame = byId(await frames(p), forward ? "s1" : "s2");
			await p.keyboard.press(forward ? "ArrowRight" : "ArrowLeft");
			const [incoming, outgoing] = forward ? ["s2", "s1"] : ["s1", "s2"];
			await expect(p.locator(active)).toHaveAttribute("id", incoming);
			await pauseAt(p, 1000);
			const mid = await frames(p);
			const axis = style === "horizontal" ? "x" : "y";
			const half = (style === "horizontal" ? frame.width : frame.height) / 2;
			// Forward: incoming from right/bottom, outgoing to left/top.
			const sign = forward ? 1 : -1;
			expect(byId(mid, incoming)[axis] - frame[axis]).toBeCloseTo(sign * half, 0);
			expect(byId(mid, outgoing)[axis] - frame[axis]).toBeCloseTo(-sign * half, 0);
			expect(byId(mid, incoming).opacity).toBe(1);
			expect(byId(mid, outgoing).opacity).toBe(1);
			const other = axis === "x" ? "y" : "x";
			expect(Math.abs(byId(mid, incoming)[other] - frame[other])).toBeLessThan(1);
		});
	}
}

test("a jump runs one transition and never paints intermediate slides", async ({ page: p }) => {
	await open(p, { style: "horizontal", css: duration(600) });
	const frame = byId(await frames(p), "s1");
	await startSampler(p);
	await p.keyboard.press("End");
	await expect(p.locator(active)).toHaveAttribute("id", "s6");
	const motion = await frameMotion(p);
	expect([...new Set(motion.map((m) => m.id))].sort()).toEqual(["s1", "s6"]);
	// s6 is ahead of s1 in document order: forward, entering from the right.
	const s6 = await p.locator("#s6").evaluate((el) => el.getBoundingClientRect().x);
	expect(s6).toBeGreaterThan(frame.x);
	await settled(p);
	const samples = await stopSampler(p);
	expect(samples.length).toBeGreaterThan(0);
	const seen = new Set(samples.flat());
	for (const id of ["s2", "s3", "s4", "s5"]) expect(seen.has(id)).toBe(false);
	expect(await painted(p)).toEqual(["s6"]);
});

// Letterboxed along the motion axis so the backdrop lies where motion goes.
// Strips stay 4px clear of the viewport edge (the focused deck's focus ring)
// and 12px clear of the frame (the focused slide's UA focus ring, which WebKit
// outsets; it belongs to focus indication, not motion).
const WIDE = {
	viewport: { width: 800, height: 400 },
	strips: [
		{ x: 4, y: 4, width: 184, height: 392 },
		{ x: 612, y: 4, width: 184, height: 392 },
	],
};
const CONFINE = {
	horizontal: WIDE,
	fade: WIDE,
	vertical: {
		viewport: { width: 400, height: 800 },
		strips: [
			{ x: 4, y: 4, width: 392, height: 184 },
			{ x: 4, y: 612, width: 392, height: 184 },
		],
	},
} as const;

for (const style of MOTION) {
	for (const easing of ["linear", "cubic-bezier(0.34, 1.56, 0.64, 1)"]) {
		test(`${style} motion stays inside the frame (${easing})`, async ({ page: p }) => {
			const { viewport, strips } = CONFINE[style];
			await p.setViewportSize(viewport);
			await open(p, { style, css: duration(2000, easing) });
			const outside = async () => {
				let count = 0;
				for (const clip of strips) count += await foreignPixels(p, clip);
				return count;
			};
			const settledFrame = byId(await frames(p), "s1");
			// Controls: the backdrop strips are clean, the frame itself is not.
			expect(await outside()).toBe(0);
			expect(
				await foreignPixels(p, {
					x: settledFrame.x + 10,
					y: settledFrame.y + 10,
					width: 50,
					height: 50,
				}),
			).toBeGreaterThan(0);
			const units = () =>
				p.locator(".units").evaluate((el) => {
					const slide = el.closest("article") as HTMLElement;
					const box = el.getBoundingClientRect();
					return {
						slide: [slide.offsetWidth, slide.offsetHeight],
						units: [box.width, box.height].map((n) => Math.round(n * 100) / 100),
					};
				});
			const settledUnits = await units();
			expect(settledUnits.units[0]).toBeCloseTo(settledFrame.width / 2, 0);
			for (const key of ["ArrowRight", "ArrowLeft"]) {
				await p.keyboard.press(key);
				for (const t of [200, 600, 1000, 1400, 1800]) {
					await pauseAt(p, t);
					expect(await outside()).toBe(0);
					expect(await units()).toEqual(settledUnits);
				}
				await p.evaluate(() => {
					for (const a of document.getAnimations()) if (a instanceof CSSTransition) a.finish();
				});
				await settled(p);
			}
		});
	}
}

for (const style of MOTION) {
	for (const scope of ["deck", ":root"]) {
		test(`${style} uses ${scope} timing tokens, not article-local ones`, async ({ page: p }) => {
			const easing = "cubic-bezier(0.1, 0.2, 0.3, 0.4)";
			await open(p, {
				style,
				css: `${scope === "deck" ? "[data-lys]" : ":root"} { --lys-transition-duration: 1234ms; --lys-transition-easing: ${easing}; }`,
				s2: 'style="--lys-transition-duration: 50ms; --lys-transition-easing: steps(2)"',
			});
			for (const [key, id] of [
				["ArrowRight", "s2"],
				["ArrowLeft", "s1"],
			] as const) {
				await p.keyboard.press(key);
				await expect(p.locator(active)).toHaveAttribute("id", id);
				const motion = (await frameMotion(p)).filter((m) => m.duration > 0);
				expect(motion.map((m) => m.id).sort()).toEqual(["s1", "s2"]);
				for (const m of motion) {
					expect(m.duration).toBe(1234);
					expect(m.easing.replaceAll(" ", "")).toBe(easing.replaceAll(" ", ""));
				}
				// The outgoing axis frame hides only once its motion ends.
				for (const m of (await frameMotion(p)).filter((x) => x.duration === 0))
					expect([m.property, m.delay]).toEqual(["--_lys-alpha", 1234]);
				await p.evaluate(() => {
					for (const a of document.getAnimations()) if (a instanceof CSSTransition) a.finish();
				});
				await settled(p);
			}
		});
	}
}

test("style none ignores timing tokens", async ({ page: p }) => {
	await open(p, { style: "none", css: duration(5000) });
	await p.keyboard.press("ArrowRight");
	await expect(p.locator(active)).toHaveAttribute("id", "s2");
	expect(await frameMotion(p)).toEqual([]);
	expect(await painted(p)).toEqual(["s2"]);
});

for (const style of MOTION) {
	test(`${style}: rapid input retargets with at most two painted frames`, async ({ page: p }) => {
		await open(p, { style, css: duration(1500) });
		await startSampler(p);
		for (let i = 0; i < 3; i++) await p.keyboard.press("ArrowRight");
		await expect(p.locator(active)).toHaveAttribute("id", "s4");
		const now = await frameMotion(p);
		expect(now.every((m) => m.id === "s3" || m.id === "s4")).toBe(true);
		await settled(p);
		// A few more frames after settling: no further motion starts.
		await p.evaluate(
			() =>
				new Promise<void>((resolve) =>
					requestAnimationFrame(() =>
						requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
					),
				),
		);
		const samples = await stopSampler(p);
		expect(Math.max(...samples.map((s) => s.length))).toBeLessThanOrEqual(2);
		expect(samples.at(-1)).toEqual(["s4"]);
		expect(await frameMotion(p)).toEqual([]);
		expect(await painted(p)).toEqual(["s4"]);
	});
}

test("returning to the outgoing slide mid-motion reverses without a jump", async ({ page: p }) => {
	await open(p, { style: "horizontal", css: duration(2000) });
	const frame = byId(await frames(p), "s1");
	await p.keyboard.press("ArrowRight");
	await pauseAt(p, 1000);
	const before = byId(await frames(p), "s1").x;
	await p.evaluate(() => {
		for (const a of document.getAnimations()) if (a instanceof CSSTransition) a.play();
	});
	await p.keyboard.press("ArrowLeft");
	await expect(p.locator(active)).toHaveAttribute("id", "s1");
	const after = byId(await frames(p), "s1");
	// s1 resumes from roughly where it was (left of the frame), not snapped in.
	expect(after.x).toBeLessThan(frame.x - 1);
	expect(Math.abs(after.x - before)).toBeLessThan(frame.width / 4);
	expect(after.opacity).toBe(1);
});

for (const style of MOTION) {
	test(`${style}: endpoints start no motion`, async ({ page: p }) => {
		await open(p, { style, css: duration(2000), hash: "#slide=s6" });
		await expect(p.locator(active)).toHaveAttribute("id", "s6");
		for (const key of ["ArrowRight", "End"]) {
			await p.keyboard.press(key);
			expect(await frameMotion(p)).toEqual([]);
			await expect(p.locator(active)).toHaveAttribute("id", "s6");
		}
		await p.keyboard.press("Home");
		await expect(p.locator(active)).toHaveAttribute("id", "s1");
		await p.evaluate(() => {
			for (const a of document.getAnimations()) if (a instanceof CSSTransition) a.finish();
		});
		await settled(p);
		for (const key of ["ArrowLeft", "Home"]) {
			await p.keyboard.press(key);
			expect(await frameMotion(p)).toEqual([]);
			await expect(p.locator(active)).toHaveAttribute("id", "s1");
		}
	});
}

for (const style of MOTION) {
	for (const hash of ["", "#slide=s3"]) {
		test(`${style}: initial load ${hash || "without fragment"} has no motion`, async ({
			page: p,
		}) => {
			await open(p, { style, css: duration(5000), hash });
			const id = hash ? "s3" : "s1";
			await expect(p.locator(active)).toHaveAttribute("id", id);
			expect(await frameMotion(p)).toEqual([]);
			await expect(p.locator(`${deck} > article[data-lys-leaving]`)).toHaveCount(0);
			const f = byId(await frames(p), id);
			const vp = p.viewportSize() as { width: number; height: number };
			expect(f.opacity).toBe(1);
			expect(Math.abs(f.x - (vp.width - f.width) / 2)).toBeLessThan(1);
			expect(Math.abs(f.y - (vp.height - f.height) / 2)).toBeLessThan(1);
			expect(await painted(p)).toEqual([id]);
		});
	}
}

for (const style of STYLES) {
	test(`${style}: reduced motion is immediate and can be withdrawn without reload`, async ({
		page: p,
	}) => {
		await p.emulateMedia({ reducedMotion: "reduce" });
		await open(p, { style, css: duration(5000) });
		await p.keyboard.press("ArrowRight");
		await expect(p.locator(active)).toHaveAttribute("id", "s2");
		expect(await frameMotion(p)).toEqual([]);
		expect(await painted(p)).toEqual(["s2"]);
		// Authored animation inside the slide still runs.
		const author = await p.locator(".author").evaluate((el) =>
			el.getAnimations().map((a) => ({
				name: (a as CSSAnimation).animationName,
				state: a.playState,
			})),
		);
		expect(author).toEqual([{ name: "author-spin", state: "running" }]);
		await p.emulateMedia({ reducedMotion: "no-preference" });
		await p.keyboard.press("ArrowRight");
		await expect(p.locator(active)).toHaveAttribute("id", "s3");
		const ids = [...new Set((await frameMotion(p)).map((m) => m.id))].sort();
		expect(ids).toEqual(style === "none" ? [] : ["s2", "s3"]);
	});
}

test("author transitions, animations and transforms on descendants are untouched", async ({
	page: p,
}) => {
	const read = () =>
		p.locator(".author").evaluate((el) => {
			const s = getComputedStyle(el);
			return {
				transition: [s.transitionProperty, s.transitionDuration, s.transitionTimingFunction],
				animation: [s.animationName, s.animationDuration],
				transform: s.transform,
			};
		});
	const descendantMotion = () =>
		p.locator(`${deck} > article`).evaluateAll((slides) =>
			slides.flatMap((slide) =>
				slide
					.getAnimations({ subtree: true })
					.filter((a) => (a.effect as KeyframeEffect | null)?.target !== slide)
					.map((a) => (a as CSSAnimation).animationName ?? "transition"),
			),
		);
	for (const style of STYLES) {
		await open(p, { style, css: duration(2000) });
		const settledStyle = await read();
		expect(settledStyle.animation[0]).toBe("author-spin");
		for (const key of ["ArrowRight", "ArrowRight"]) {
			await p.keyboard.press(key);
			await pauseAt(p, 1000);
			expect(await read()).toEqual(settledStyle);
			expect(await descendantMotion()).toEqual(["author-spin"]);
			await p.evaluate(() => {
				for (const a of document.getAnimations()) if (a instanceof CSSTransition) a.finish();
			});
			await settled(p);
		}
		await p.unrouteAll();
	}
});

for (const style of STYLES) {
	test(`${style}: only the selected slide receives pointer input`, async ({ page: p }) => {
		// s6 holds a hidden pointer-events:auto overlay later in document order.
		await open(p, { style });
		const f = byId(await frames(p), "s1");
		await p.evaluate(() => {
			(window as unknown as { __hit: string[] }).__hit = [];
			document.addEventListener("click", (e) =>
				(window as unknown as { __hit: string[] }).__hit.push(
					(e.target as Element).closest("article")?.id ?? "none",
				),
			);
		});
		for (const [fx, fy] of [
			[0.5, 0.5],
			[0.1, 0.1],
			[0.9, 0.9],
		])
			await p.mouse.click(f.x + f.width * fx, f.y + f.height * fy);
		expect(await p.evaluate(() => (window as unknown as { __hit: string[] }).__hit)).toEqual([
			"s1",
			"s1",
			"s1",
		]);
	});
}

async function noScript(browser: Browser, options: DeckOptions) {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const body = page(options);
	await context.route(`${origin}/transitions.html`, (route) =>
		route.fulfill({ contentType: "text/html", body }),
	);
	const p = await context.newPage();
	await p.goto(`${origin}/transitions.html`);
	return { context, p };
}

for (const style of [null, ...STYLES, "Vertical", "spin"]) {
	test(`no JavaScript: ${style ?? "no attribute"} keeps every slide in normal flow`, async ({
		browser,
	}) => {
		const { context, p } = await noScript(browser, { style });
		await expect(p.locator(deck)).not.toHaveAttribute("data-lys-current");
		const slides = await p.locator(`${deck} > article`).evaluateAll((els) =>
			els.map((el) => {
				const s = getComputedStyle(el);
				const box = el.getBoundingClientRect();
				return {
					opacity: s.opacity,
					translate: s.translate,
					clip: s.clipPath,
					visibility: s.visibility,
					top: box.top,
					bottom: box.bottom,
				};
			}),
		);
		expect(slides).toHaveLength(6);
		for (const [i, s] of slides.entries()) {
			expect([s.opacity, s.translate, s.clip, s.visibility]).toEqual([
				"1",
				"none",
				"none",
				"visible",
			]);
			if (i > 0) expect(s.top).toBeGreaterThanOrEqual(slides[i - 1].bottom - 1);
		}
		await context.close();
	});
}
