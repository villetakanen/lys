import { afterEach, describe, expect, it, vi } from "vitest";
import { Lys } from "../../src/lys.js";

const instances: Lys[] = [];

function createDeck(articleCount: number): { container: HTMLElement; instance: Lys } {
	const articles = Array.from(
		{ length: articleCount },
		(_, i) => `<article><h2>Slide ${i + 1}</h2></article>`,
	).join("");
	const container = document.createElement("div");
	container.setAttribute("data-lys", "");
	container.innerHTML = articles;
	document.body.appendChild(container);
	const instance = new Lys(container);
	instances.push(instance);
	return { container, instance };
}

function pressKey(target: HTMLElement, key: string, opts: Partial<KeyboardEventInit> = {}): void {
	target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...opts }));
}

function cleanup(): void {
	for (const instance of instances) {
		instance.destroy();
	}
	instances.length = 0;
	document.body.innerHTML = "";
	history.replaceState(null, "", location.pathname);
}

describe("keyboard navigation", () => {
	afterEach(cleanup);

	it("ArrowRight advances to next slide", () => {
		const { container, instance } = createDeck(5);
		pressKey(container, "ArrowRight");
		expect(instance.current).toBe(1);
	});

	it("ArrowDown advances to next slide", () => {
		const { container, instance } = createDeck(5);
		pressKey(container, "ArrowDown");
		expect(instance.current).toBe(1);
	});

	it("ArrowLeft goes to previous slide", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(2);
		pressKey(container, "ArrowLeft");
		expect(instance.current).toBe(1);
	});

	it("ArrowUp goes to previous slide", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(2);
		pressKey(container, "ArrowUp");
		expect(instance.current).toBe(1);
	});

	it("Home jumps to first slide", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(3);
		pressKey(container, "Home");
		expect(instance.current).toBe(0);
	});

	it("End jumps to last slide", () => {
		const { container, instance } = createDeck(5);
		pressKey(container, "End");
		expect(instance.current).toBe(4);
	});

	it("Space advances to next slide", () => {
		const { container, instance } = createDeck(5);
		pressKey(container, " ");
		expect(instance.current).toBe(1);
	});

	it("Shift+Space goes to previous slide", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(2);
		pressKey(container, " ", { shiftKey: true });
		expect(instance.current).toBe(1);
	});

	it("Space does not navigate when an input is focused", () => {
		const { container, instance } = createDeck(5);
		const input = document.createElement("input");
		container.querySelector("article")?.appendChild(input);
		pressKey(input, " ");
		expect(instance.current).toBe(0);
	});

	it("Space does not navigate when a textarea is focused", () => {
		const { container, instance } = createDeck(5);
		const textarea = document.createElement("textarea");
		container.querySelector("article")?.appendChild(textarea);
		pressKey(textarea, " ");
		expect(instance.current).toBe(0);
	});

	it("Arrow keys still navigate when an input is focused", () => {
		const { container, instance } = createDeck(5);
		const input = document.createElement("input");
		container.querySelector("article")?.appendChild(input);
		pressKey(input, "ArrowRight");
		expect(instance.current).toBe(1);
	});

	it("Ctrl+ArrowRight is ignored (browser shortcut preserved)", () => {
		const { container, instance } = createDeck(5);
		pressKey(container, "ArrowRight", { ctrlKey: true });
		expect(instance.current).toBe(0);
	});

	it("Alt+ArrowRight is ignored", () => {
		const { container, instance } = createDeck(5);
		pressKey(container, "ArrowRight", { altKey: true });
		expect(instance.current).toBe(0);
	});

	it("Meta+ArrowRight is ignored", () => {
		const { container, instance } = createDeck(5);
		pressKey(container, "ArrowRight", { metaKey: true });
		expect(instance.current).toBe(0);
	});
});

describe("tabindex management", () => {
	afterEach(cleanup);

	it("adds tabindex=0 if container has no tabindex", () => {
		const { container } = createDeck(3);
		expect(container.getAttribute("tabindex")).toBe("0");
	});

	it("removes tabindex on destroy if navigation added it", () => {
		const { container, instance } = createDeck(3);
		instance.destroy();
		expect(container.hasAttribute("tabindex")).toBe(false);
	});

	it("preserves existing tabindex on destroy", () => {
		const container = document.createElement("div");
		container.setAttribute("data-lys", "");
		container.setAttribute("tabindex", "-1");
		container.innerHTML = "<article>Slide</article>";
		document.body.appendChild(container);
		const instance = new Lys(container);
		instance.destroy();
		expect(container.getAttribute("tabindex")).toBe("-1");
	});
});

describe("touch navigation", () => {
	afterEach(cleanup);

	function swipe(target: HTMLElement, deltaX: number, deltaY = 0): void {
		const startX = 200;
		const startY = 200;
		target.dispatchEvent(
			new TouchEvent("touchstart", {
				touches: [new Touch({ identifier: 0, target, clientX: startX, clientY: startY })],
				bubbles: true,
			}),
		);
		target.dispatchEvent(
			new TouchEvent("touchend", {
				changedTouches: [
					new Touch({
						identifier: 0,
						target,
						clientX: startX + deltaX,
						clientY: startY + deltaY,
					}),
				],
				bubbles: true,
			}),
		);
	}

	it("swipe left triggers next()", () => {
		const { container, instance } = createDeck(5);
		swipe(container, -60);
		expect(instance.current).toBe(1);
	});

	it("swipe right triggers prev()", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(2);
		swipe(container, 60);
		expect(instance.current).toBe(1);
	});

	it("short swipe is ignored", () => {
		const { container, instance } = createDeck(5);
		swipe(container, -30);
		expect(instance.current).toBe(0);
	});

	it("vertical-dominant swipe is ignored", () => {
		const { container, instance } = createDeck(5);
		swipe(container, -60, -100);
		expect(instance.current).toBe(0);
	});

	it("swipe left at last slide is a no-op", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(4);
		swipe(container, -60);
		expect(instance.current).toBe(4);
	});
});

describe("hash routing", () => {
	afterEach(cleanup);

	it("hash deep link on init (numeric, 1-based)", () => {
		history.replaceState(null, "", "#slide=3");
		const { instance } = createDeck(5);
		expect(instance.current).toBe(2);
	});

	it("hash deep link on init (by id)", () => {
		history.replaceState(null, "", "#slide=overview");
		const container = document.createElement("div");
		container.setAttribute("data-lys", "");
		container.innerHTML =
			'<article>Slide 1</article><article id="overview">Slide 2</article><article>Slide 3</article>';
		document.body.appendChild(container);
		const instance = new Lys(container);
		instances.push(instance);
		expect(instance.current).toBe(1);
	});

	it("hash updates on navigation (1-based number)", () => {
		const { instance } = createDeck(5);
		instance.next();
		expect(location.hash).toBe("#slide=2");
	});

	it("hash uses article id when available", () => {
		const { container, instance } = createDeck(5);
		container.querySelectorAll("article")[2]?.setAttribute("id", "details");
		instance.goTo(2);
		expect(location.hash).toBe("#slide=details");
	});

	it("external hashchange triggers navigation", () => {
		const { instance } = createDeck(5);
		// Simulate external hash change.
		history.replaceState(null, "", "#slide=4");
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		expect(instance.current).toBe(3);
	});

	it("invalid hash is ignored", () => {
		history.replaceState(null, "", "#something-else");
		const { instance } = createDeck(5);
		expect(instance.current).toBe(0);
	});

	it("out-of-range hash is clamped", () => {
		history.replaceState(null, "", "#slide=99");
		const { instance } = createDeck(5);
		expect(instance.current).toBe(4);
	});

	it("destroy removes hashchange listener", () => {
		const { instance } = createDeck(5);
		instance.destroy();
		history.replaceState(null, "", "#slide=3");
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		expect(instance.current).toBe(-1);
	});
});

describe("destroy lifecycle", () => {
	afterEach(cleanup);

	it("destroy removes keyboard listener", () => {
		const { container, instance } = createDeck(5);
		instance.destroy();
		pressKey(container, "ArrowRight");
		expect(instance.current).toBe(-1);
	});

	it("destroy removes touch listener", () => {
		const { container, instance } = createDeck(5);
		instance.destroy();
		// Swipe after destroy — should not navigate.
		container.dispatchEvent(
			new TouchEvent("touchstart", {
				touches: [new Touch({ identifier: 0, target: container, clientX: 200, clientY: 200 })],
				bubbles: true,
			}),
		);
		container.dispatchEvent(
			new TouchEvent("touchend", {
				changedTouches: [
					new Touch({ identifier: 0, target: container, clientX: 100, clientY: 200 }),
				],
				bubbles: true,
			}),
		);
		expect(instance.current).toBe(-1);
	});
});

describe("reduced motion scroll behavior", () => {
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it("uses smooth scroll when motion is allowed", () => {
		vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList);
		const { container, instance } = createDeck(5);
		const slide = container.querySelectorAll("article")[1] as HTMLElement;
		const spy = vi.fn();
		slide.scrollIntoView = spy;
		instance.next();
		expect(spy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
	});

	it("uses instant scroll when reduced motion is preferred", () => {
		vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
		const { container, instance } = createDeck(5);
		const slide = container.querySelectorAll("article")[1] as HTMLElement;
		const spy = vi.fn();
		slide.scrollIntoView = spy;
		instance.next();
		expect(spy).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
	});
});
