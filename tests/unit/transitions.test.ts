import { afterEach, describe, expect, it, vi } from "vitest";
import { Lys } from "../../src/lys.js";

/**
 * Deck transitions, unit side (specs/deck-transitions/spec.md).
 *
 * The style is resolved purely by CSS attribute selectors, so happy-dom can
 * only verify engine state: selection timing, the outgoing-frame marker,
 * retargeting, and that authored attributes are never rewritten. Painted
 * motion, direction, timing and reduced motion are covered by e2e.
 */

const instances: Lys[] = [];

function createDeck(
	articleCount: number,
	opts: {
		deckTransition?: string | undefined;
		articleAttrs?: Record<number, Record<string, string>>;
	} = {},
): { container: HTMLElement; articles: HTMLElement[] } {
	const container = document.createElement("div");
	container.setAttribute("data-lys", "");
	if (opts.deckTransition !== undefined) {
		container.setAttribute("data-transition", opts.deckTransition);
	}
	for (let i = 0; i < articleCount; i++) {
		const article = document.createElement("article");
		article.innerHTML = `<h2>Slide ${i + 1}</h2>`;
		for (const [k, v] of Object.entries(opts.articleAttrs?.[i] ?? {})) {
			article.setAttribute(k, v);
		}
		container.appendChild(article);
	}
	document.body.appendChild(container);
	return { container, articles: Array.from(container.querySelectorAll("article")) };
}

function init(container: HTMLElement): Lys {
	const instance = new Lys(container);
	instances.push(instance);
	return instance;
}

/** Initialise and wait for data-lys-ready, after which navigation marks the outgoing frame. */
async function initReady(container: HTMLElement): Promise<Lys> {
	const instance = init(container);
	await nextFrame();
	expect(container.hasAttribute("data-lys-ready")).toBe(true);
	return instance;
}

function leaving(articles: HTMLElement[]): number[] {
	return articles.flatMap((a, i) => (a.hasAttribute("data-lys-leaving") ? [i] : []));
}

function active(articles: HTMLElement[]): number[] {
	return articles.flatMap((a, i) => (a.hasAttribute("data-lys-active") ? [i] : []));
}

function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

afterEach(() => {
	for (const instance of instances) instance.destroy();
	instances.length = 0;
	document.body.innerHTML = "";
	history.replaceState(null, "", location.pathname);
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

// === Style resolution: Lys never rewrites the attribute ===

describe("style resolution", () => {
	for (const value of ["fade", "Horizontal", "vertical", "", "spin", "none"]) {
		it(`leaves deck data-transition="${value}" unchanged through init, navigation and destroy`, async () => {
			const { container } = createDeck(3, { deckTransition: value });
			const instance = init(container);
			expect(container.getAttribute("data-transition")).toBe(value);
			await nextFrame();
			instance.next();
			instance.goTo(0);
			expect(container.getAttribute("data-transition")).toBe(value);
			instance.destroy();
			expect(container.getAttribute("data-transition")).toBe(value);
		});
	}

	it("does not add data-transition to a deck without one", () => {
		const { container, articles } = createDeck(3);
		const instance = init(container);
		instance.next();
		expect(container.hasAttribute("data-transition")).toBe(false);
		for (const article of articles) expect(article.hasAttribute("data-transition")).toBe(false);
	});

	it("never sets the 1.x data-lys-mode attribute", () => {
		for (const deckTransition of [undefined, "fade", "horizontal", "vertical"]) {
			const { container } = createDeck(3, {
				deckTransition,
				articleAttrs: { 0: { "data-transition": "fade" }, 1: { "data-transition": "direct" } },
			});
			const instance = init(container);
			instance.next();
			expect(container.hasAttribute("data-lys-mode")).toBe(false);
		}
	});

	it("applies a deck style change made after init without engine involvement", async () => {
		const { container, articles } = createDeck(3, { deckTransition: "fade" });
		const instance = await initReady(container);
		container.setAttribute("data-transition", "vertical");
		instance.next();
		expect(container.getAttribute("data-transition")).toBe("vertical");
		expect(active(articles)).toEqual([1]);
		expect(leaving(articles)).toEqual([0]);
	});
});

// === Article data-transition is ignored ===

describe("article data-transition", () => {
	it("is ignored and never rewritten", () => {
		const { container, articles } = createDeck(3, {
			articleAttrs: { 1: { "data-transition": "fade" }, 2: { "data-transition": "direct" } },
		});
		const instance = init(container);
		instance.goTo(1);
		instance.goTo(2);
		expect(articles[1]?.getAttribute("data-transition")).toBe("fade");
		expect(articles[2]?.getAttribute("data-transition")).toBe("direct");
		expect(container.hasAttribute("data-transition")).toBe(false);
		expect(container.hasAttribute("data-lys-mode")).toBe(false);
		instance.destroy();
		expect(articles[1]?.getAttribute("data-transition")).toBe("fade");
	});

	it("does not trigger scrolling, which the 2.0 deck never uses for selection", () => {
		const { container, articles } = createDeck(3, {
			articleAttrs: { 1: { "data-transition": "fade" } },
		});
		const instance = init(container);
		const spies = articles.map((a) => {
			const spy = vi.fn();
			a.scrollIntoView = spy;
			return spy;
		});
		instance.goTo(1);
		instance.goTo(2);
		for (const spy of spies) expect(spy).not.toHaveBeenCalled();
	});
});

// === Selection timing ===

describe("selection timing", () => {
	for (const deckTransition of [undefined, "fade", "horizontal", "vertical"]) {
		it(`updates selection, current, URL and event synchronously (${deckTransition ?? "none"})`, async () => {
			const { container, articles } = createDeck(4, { deckTransition });
			const instance = init(container);
			await nextFrame();
			const seen: Array<{ current: number; active: number[]; attr: string | null }> = [];
			const handler = vi.fn(() => {
				seen.push({
					current: instance.current,
					active: active(articles),
					attr: container.getAttribute("data-lys-current"),
				});
			});
			container.addEventListener("lys:slidechange", handler);

			instance.goTo(2);

			expect(handler).toHaveBeenCalledOnce();
			expect(seen[0]).toEqual({ current: 2, active: [2], attr: "2" });
			expect((handler.mock.calls[0] as unknown as [CustomEvent])[0].detail).toMatchObject({
				from: 0,
				to: 2,
				slide: articles[2],
			});
			expect(instance.current).toBe(2);
			expect(location.hash).toBe("#slide=3");
		});
	}
});

// === Outgoing frame marker ===

describe("outgoing frame marker", () => {
	it("no slide is leaving after init", () => {
		const { container, articles } = createDeck(3, { deckTransition: "fade" });
		init(container);
		expect(leaving(articles)).toEqual([]);
	});

	it("initial fragment selection marks no slide as leaving", () => {
		history.replaceState(null, "", "#slide=3");
		const { container, articles } = createDeck(4, { deckTransition: "horizontal" });
		const instance = init(container);
		expect(instance.current).toBe(2);
		expect(active(articles)).toEqual([2]);
		expect(leaving(articles)).toEqual([]);
	});

	it("navigation before data-lys-ready selects without marking a leaving slide", async () => {
		const { container, articles } = createDeck(4, { deckTransition: "fade" });
		const instance = init(container);
		expect(container.hasAttribute("data-lys-ready")).toBe(false);
		const handler = vi.fn();
		container.addEventListener("lys:slidechange", handler);
		instance.next();
		instance.goTo(3);
		expect(handler).toHaveBeenCalledTimes(2);
		expect(active(articles)).toEqual([3]);
		expect(leaving(articles)).toEqual([]);
		await nextFrame();
		instance.prev();
		expect(leaving(articles)).toEqual([3]);
	});

	it("marks the previous slide leaving and moves the marker on each navigation", async () => {
		const { container, articles } = createDeck(6, { deckTransition: "horizontal" });
		const instance = await initReady(container);

		instance.next();
		expect(leaving(articles)).toEqual([0]);
		expect(active(articles)).toEqual([1]);

		instance.next();
		expect(leaving(articles)).toEqual([1]);
		expect(active(articles)).toEqual([2]);

		instance.goTo(0);
		expect(leaving(articles)).toEqual([2]);
		expect(active(articles)).toEqual([0]);
	});

	it("a jump marks only the origin leaving; intermediate slides stay untouched", async () => {
		const { container, articles } = createDeck(6, { deckTransition: "vertical" });
		const instance = await initReady(container);
		instance.goTo(5);
		expect(leaving(articles)).toEqual([0]);
		expect(active(articles)).toEqual([5]);
		for (const i of [1, 2, 3, 4]) {
			expect(articles[i]?.hasAttribute("data-lys-leaving")).toBe(false);
			expect(articles[i]?.hasAttribute("data-lys-active")).toBe(false);
		}
	});

	it("rapid input keeps at most one slide leaving and selects the latest target", async () => {
		const { container, articles } = createDeck(6, { deckTransition: "fade" });
		const instance = await initReady(container);
		for (let press = 1; press <= 3; press++) {
			container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
			expect(leaving(articles).length).toBeLessThanOrEqual(1);
			expect(active(articles)).toEqual([press]);
		}
		expect(instance.current).toBe(3);
		expect(leaving(articles)).toEqual([2]);
	});

	it("returning to the leaving slide makes it active and no longer leaving", async () => {
		const { container, articles } = createDeck(3, { deckTransition: "fade" });
		const instance = await initReady(container);
		instance.next();
		instance.prev();
		expect(active(articles)).toEqual([0]);
		expect(leaving(articles)).toEqual([1]);
		expect(articles[0]?.hasAttribute("data-lys-leaving")).toBe(false);
	});

	it("marks leaving the same way for the default style", async () => {
		const { container, articles } = createDeck(3);
		const instance = await initReady(container);
		instance.next();
		expect(leaving(articles)).toEqual([0]);
	});
});

// === Endpoints ===

describe("endpoints", () => {
	it("next on the last slide changes nothing and starts no motion", async () => {
		const { container, articles } = createDeck(3, { deckTransition: "horizontal" });
		const instance = await initReady(container);
		instance.goTo(2);
		const before = { leaving: leaving(articles), active: active(articles), hash: location.hash };
		const handler = vi.fn();
		container.addEventListener("lys:slidechange", handler);

		instance.next();
		container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

		expect(handler).not.toHaveBeenCalled();
		expect(instance.current).toBe(2);
		expect({ leaving: leaving(articles), active: active(articles), hash: location.hash }).toEqual(
			before,
		);
	});

	it("prev on the first slide changes nothing and marks nothing leaving", () => {
		const { container, articles } = createDeck(3, { deckTransition: "vertical" });
		const instance = init(container);
		const handler = vi.fn();
		container.addEventListener("lys:slidechange", handler);
		instance.prev();
		expect(handler).not.toHaveBeenCalled();
		expect(leaving(articles)).toEqual([]);
		expect(active(articles)).toEqual([0]);
	});

	it("goTo the current slide does not move the leaving marker", async () => {
		const { container, articles } = createDeck(3, { deckTransition: "fade" });
		const instance = await initReady(container);
		instance.next();
		instance.goTo(1);
		expect(leaving(articles)).toEqual([0]);
	});
});

// === Retargeting cancels engine frame transitions ===

class FakeCSSTransition {
	cancel = vi.fn();
	constructor(public transitionProperty: string) {}
}

class FakeCSSAnimation {
	cancel = vi.fn();
	animationName = "author";
}

function stubAnimations(el: HTMLElement, animations: unknown[]): ReturnType<typeof vi.fn> {
	const spy = vi.fn(() => animations as Animation[]);
	el.getAnimations = spy;
	return spy;
}

describe("retargeting", () => {
	it("cancels the --_lys-alpha and --_lys-offset transitions on the old leaving frame", async () => {
		vi.stubGlobal("CSSTransition", FakeCSSTransition);
		const { container, articles } = createDeck(4, { deckTransition: "horizontal" });
		const instance = await initReady(container);
		instance.next(); // slide 0 leaving
		const frame = ["--_lys-alpha", "--_lys-offset"].map((p) => new FakeCSSTransition(p));
		const spy = stubAnimations(articles[0] as HTMLElement, frame);

		instance.next();

		expect(spy).toHaveBeenCalledOnce();
		for (const t of frame) expect(t.cancel).toHaveBeenCalledOnce();
		expect(leaving(articles)).toEqual([1]);
	});

	it("does not cancel non-frame transitions or CSS animations on the leaving frame", async () => {
		vi.stubGlobal("CSSTransition", FakeCSSTransition);
		const { container, articles } = createDeck(4, { deckTransition: "fade" });
		const instance = await initReady(container);
		instance.next();
		const others = ["color", "transform", "translate", "clip-path", "--author-offset"].map(
			(p) => new FakeCSSTransition(p),
		);
		const animation = new FakeCSSAnimation();
		stubAnimations(articles[0] as HTMLElement, [...others, animation]);

		instance.next();

		for (const t of others) expect(t.cancel).not.toHaveBeenCalled();
		expect(animation.cancel).not.toHaveBeenCalled();
	});

	it("returning to the leaving frame does not cancel its motion", async () => {
		vi.stubGlobal("CSSTransition", FakeCSSTransition);
		const { container, articles } = createDeck(3, { deckTransition: "horizontal" });
		const instance = await initReady(container);
		instance.next(); // A=0 leaving, B=1 active
		const frame = ["--_lys-alpha", "--_lys-offset"].map((p) => new FakeCSSTransition(p));
		stubAnimations(articles[0] as HTMLElement, frame);

		instance.prev(); // back to A before motion ends

		for (const t of frame) expect(t.cancel).not.toHaveBeenCalled();
		expect(active(articles)).toEqual([0]);
		expect(leaving(articles)).toEqual([1]);
	});

	it("queries only the leaving frame itself, never its subtree or other slides", async () => {
		vi.stubGlobal("CSSTransition", FakeCSSTransition);
		const { container, articles } = createDeck(4, { deckTransition: "vertical" });
		const instance = await initReady(container);
		instance.next(); // 0 leaving, 1 active

		const child = articles[0]?.querySelector("h2") as HTMLElement;
		const childTransition = new FakeCSSTransition("opacity");
		const childSpy = stubAnimations(child, [childTransition]);
		const leavingSpy = stubAnimations(articles[0] as HTMLElement, []);
		const activeSpy = stubAnimations(articles[1] as HTMLElement, []);
		const idleSpy = stubAnimations(articles[3] as HTMLElement, []);

		instance.next();

		expect(leavingSpy).toHaveBeenCalledOnce();
		const args = leavingSpy.mock.calls[0] as unknown[];
		expect(args[0] === undefined || (args[0] as { subtree?: boolean }).subtree !== true).toBe(true);
		expect(childSpy).not.toHaveBeenCalled();
		expect(childTransition.cancel).not.toHaveBeenCalled();
		expect(activeSpy).not.toHaveBeenCalled();
		expect(idleSpy).not.toHaveBeenCalled();
	});

	it("does not query animations when nothing is leaving", async () => {
		vi.stubGlobal("CSSTransition", FakeCSSTransition);
		const { container, articles } = createDeck(3, { deckTransition: "fade" });
		const instance = await initReady(container);
		const spies = articles.map((a) => stubAnimations(a, []));
		instance.next();
		for (const spy of spies) expect(spy).not.toHaveBeenCalled();
	});

	it("tolerates getAnimations being absent", async () => {
		const { container, articles } = createDeck(3, { deckTransition: "fade" });
		const instance = await initReady(container);
		instance.next();
		Object.defineProperty(articles[0], "getAnimations", { value: undefined, configurable: true });
		expect(() => instance.next()).not.toThrow();
		expect(active(articles)).toEqual([2]);
		expect(leaving(articles)).toEqual([1]);
	});

	it("tolerates CSSTransition being undefined and cancels nothing", async () => {
		vi.stubGlobal("CSSTransition", undefined);
		const { container, articles } = createDeck(3, { deckTransition: "fade" });
		const instance = await initReady(container);
		instance.next();
		const t = new FakeCSSTransition("--_lys-alpha");
		stubAnimations(articles[0] as HTMLElement, [t]);
		expect(() => instance.next()).not.toThrow();
		expect(t.cancel).not.toHaveBeenCalled();
		expect(leaving(articles)).toEqual([1]);
	});
});

// === Readiness and teardown ===

describe("readiness and teardown", () => {
	it("sets data-lys-ready only after the first frame", async () => {
		const { container } = createDeck(3, { deckTransition: "fade" });
		init(container);
		expect(container.hasAttribute("data-lys-ready")).toBe(false);
		await nextFrame();
		expect(container.hasAttribute("data-lys-ready")).toBe(true);
	});

	it("destroy before the first frame prevents data-lys-ready", async () => {
		const { container } = createDeck(3, { deckTransition: "fade" });
		const instance = new Lys(container);
		instance.destroy();
		await nextFrame();
		expect(container.hasAttribute("data-lys-ready")).toBe(false);
	});

	it("destroy removes data-lys-leaving, data-lys-active and data-lys-ready", async () => {
		const { container, articles } = createDeck(3, { deckTransition: "horizontal" });
		const instance = new Lys(container);
		await nextFrame();
		instance.next();
		expect(leaving(articles)).toEqual([0]);
		instance.destroy();
		expect(leaving(articles)).toEqual([]);
		expect(active(articles)).toEqual([]);
		expect(container.hasAttribute("data-lys-ready")).toBe(false);
		expect(container.hasAttribute("data-lys-current")).toBe(false);
	});

	it("re-initialisation starts with no leaving slide", async () => {
		const { container, articles } = createDeck(3, { deckTransition: "fade" });
		const first = new Lys(container);
		await nextFrame();
		first.next();
		expect(leaving(articles)).toEqual([0]);
		history.replaceState(null, "", location.pathname); // no fragment re-selection
		const second = init(container); // destroys the first
		expect(leaving(articles)).toEqual([]);
		expect(second.current).toBe(0);
	});
});
