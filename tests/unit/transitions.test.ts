import { afterEach, describe, expect, it, vi } from "vitest";
import { Lys } from "../../src/lys.js";

const instances: Lys[] = [];

function createDeck(
	articleCount: number,
	extras?: {
		fadeSlides?: number[];
		directSlides?: number[];
		slideAttrs?: Record<number, Record<string, string>>;
	},
): { container: HTMLElement; articles: HTMLElement[] } {
	const container = document.createElement("div");
	container.setAttribute("data-lys", "");

	for (let i = 0; i < articleCount; i++) {
		const article = document.createElement("article");
		article.innerHTML = `<h2>Slide ${i + 1}</h2>`;

		if (extras?.fadeSlides?.includes(i)) {
			article.setAttribute("data-transition", "fade");
		}

		if (extras?.directSlides?.includes(i)) {
			article.setAttribute("data-transition", "direct");
		}

		const attrs = extras?.slideAttrs?.[i];
		if (attrs) {
			for (const [k, v] of Object.entries(attrs)) {
				article.setAttribute(k, v);
			}
		}
		container.appendChild(article);
	}

	document.body.appendChild(container);
	const instance = new Lys(container);
	instances.push(instance);

	const articles = Array.from(container.querySelectorAll<HTMLElement>(":scope > article"));
	return { container, articles };
}

function popInstance(): Lys {
	const instance = instances.pop();
	if (!instance) throw new Error("No instance to pop");
	return instance;
}

function cleanup(): void {
	for (const instance of instances) {
		instance.destroy();
	}
	instances.length = 0;
	document.body.innerHTML = "";
	history.replaceState(null, "", location.pathname);
}

afterEach(cleanup);

// === Mode detection ===

describe("mode detection", () => {
	it("default deck does not have data-lys-mode", () => {
		const { container } = createDeck(3);
		expect(container.hasAttribute("data-lys-mode")).toBe(false);
	});

	it("deck with data-transition='fade' gets data-lys-mode='fade'", () => {
		const { container } = createDeck(3, { fadeSlides: [1] });
		expect(container.getAttribute("data-lys-mode")).toBe("fade");
	});

	it("any slide with fade activates fade for the whole deck", () => {
		const { container } = createDeck(5, { fadeSlides: [2] });
		expect(container.getAttribute("data-lys-mode")).toBe("fade");
	});

	it("unknown data-transition value is ignored", () => {
		const { container } = createDeck(3, {
			slideAttrs: { 0: { "data-transition": "zoom" } },
		});
		expect(container.hasAttribute("data-lys-mode")).toBe(false);
	});
});

// === Fade layout via data-lys-active ===

describe("fade layout", () => {
	it("active slide has data-lys-active, inactive slides do not", () => {
		const { articles } = createDeck(3, { fadeSlides: [0] });
		expect(articles[0].hasAttribute("data-lys-active")).toBe(true);
		expect(articles[1].hasAttribute("data-lys-active")).toBe(false);
		expect(articles[2].hasAttribute("data-lys-active")).toBe(false);
	});

	it("navigation updates data-lys-active", () => {
		const { articles } = createDeck(3, { fadeSlides: [0] });
		const instance = instances[instances.length - 1];
		instance.goTo(1);

		expect(articles[0].hasAttribute("data-lys-active")).toBe(false);
		expect(articles[1].hasAttribute("data-lys-active")).toBe(true);
	});
});

// === Scroll-snap mode unchanged ===

describe("scroll-snap mode unchanged", () => {
	it("default deck calls scrollIntoView on navigation", () => {
		const { articles } = createDeck(3);
		const spy = vi.spyOn(articles[1], "scrollIntoView");
		const instance = instances[instances.length - 1];
		instance.goTo(1);

		expect(spy).toHaveBeenCalledOnce();
	});

	it("default deck does not set data-lys-mode", () => {
		const { container } = createDeck(3);
		const instance = instances[instances.length - 1];
		instance.goTo(1);
		expect(container.hasAttribute("data-lys-mode")).toBe(false);
	});
});

// === Navigation in fade mode ===

describe("navigation in fade mode", () => {
	it("scrollIntoView is NOT called in fade mode", () => {
		const { articles } = createDeck(3, { fadeSlides: [0] });
		const spy = vi.spyOn(articles[1], "scrollIntoView");
		const instance = instances[instances.length - 1];
		instance.goTo(1);

		expect(spy).not.toHaveBeenCalled();
	});

	it("keyboard navigation works in fade mode", () => {
		const { container, articles } = createDeck(3, { fadeSlides: [0] });
		container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

		expect(articles[1].hasAttribute("data-lys-active")).toBe(true);
	});

	it("touch navigation works in fade mode", () => {
		const { container, articles } = createDeck(3, { fadeSlides: [0] });
		const startX = 200;
		const startY = 200;
		container.dispatchEvent(
			new TouchEvent("touchstart", {
				touches: [
					new Touch({ identifier: 0, target: container, clientX: startX, clientY: startY }),
				],
				bubbles: true,
			}),
		);
		container.dispatchEvent(
			new TouchEvent("touchend", {
				changedTouches: [
					new Touch({ identifier: 0, target: container, clientX: startX - 60, clientY: startY }),
				],
				bubbles: true,
			}),
		);

		expect(articles[1].hasAttribute("data-lys-active")).toBe(true);
	});

	it("API navigation works in fade mode", () => {
		createDeck(5, { fadeSlides: [0] });
		const instance = instances[instances.length - 1];
		instance.goTo(2);

		expect(instance.current).toBe(2);
	});

	it("lys:slidechange fires with correct detail in fade mode", () => {
		const { container } = createDeck(3, { fadeSlides: [0] });
		const instance = instances[instances.length - 1];
		const handler = vi.fn();
		container.addEventListener("lys:slidechange", handler);

		instance.goTo(2);

		expect(handler).toHaveBeenCalledOnce();
		const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
		expect(detail.from).toBe(0);
		expect(detail.to).toBe(2);
	});

	it("hash routing works in fade mode", () => {
		// Set hash before creating deck.
		history.replaceState(null, "", "#slide=2");
		const { articles } = createDeck(3, { fadeSlides: [0] });
		const instance = instances[instances.length - 1];

		expect(instance.current).toBe(1); // 0-indexed, #slide=2 → index 1
		expect(articles[1].hasAttribute("data-lys-active")).toBe(true);
	});
});

// === A11y in fade mode ===

describe("a11y in fade mode", () => {
	it("ARIA attributes are set in fade mode", () => {
		const { container, articles } = createDeck(3, { fadeSlides: [0] });

		expect(container.getAttribute("role")).toBe("group");
		expect(container.getAttribute("aria-roledescription")).toBe("slide deck");

		for (const article of articles) {
			expect(article.getAttribute("role")).toBe("group");
			expect(article.getAttribute("aria-roledescription")).toBe("slide");
		}
	});

	it("aria-hidden is managed in fade mode", () => {
		const { articles } = createDeck(3, { fadeSlides: [0] });

		expect(articles[0].hasAttribute("aria-hidden")).toBe(false);
		expect(articles[1].getAttribute("aria-hidden")).toBe("true");
		expect(articles[2].getAttribute("aria-hidden")).toBe("true");
	});

	it("live region announces in fade mode", () => {
		const { container } = createDeck(3, { fadeSlides: [0] });
		const instance = instances[instances.length - 1];
		instance.goTo(1);

		const liveRegion = container.querySelector('[role="status"]') as HTMLElement;
		expect(liveRegion.textContent).toBe("Slide 2 of 3");
	});

	it("focus moves to active slide in fade mode", () => {
		const { articles } = createDeck(3, { fadeSlides: [0] });
		const instance = instances[instances.length - 1];
		const focusSpy = vi.spyOn(articles[1], "focus");
		instance.goTo(1);

		expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
	});
});

// === Cleanup ===

describe("destroy cleanup", () => {
	it("destroy removes data-lys-mode", () => {
		const { container } = createDeck(3, { fadeSlides: [0] });
		const instance = popInstance();
		instance.destroy();

		expect(container.hasAttribute("data-lys-mode")).toBe(false);
	});

	it("destroy removes data-lys-active from slides", () => {
		const { articles } = createDeck(3, { fadeSlides: [0] });
		const instance = popInstance();
		instance.destroy();

		for (const article of articles) {
			expect(article.hasAttribute("data-lys-active")).toBe(false);
		}
	});

	it("re-initialization after destroy preserves mode", () => {
		const { container } = createDeck(3, { fadeSlides: [0] });
		const instance = popInstance();
		instance.destroy();

		expect(container.hasAttribute("data-lys-mode")).toBe(false);

		// Re-init: data-transition is still on the article.
		const newInstance = new Lys(container);
		instances.push(newInstance);
		expect(container.getAttribute("data-lys-mode")).toBe("fade");
	});
});

// === Edge cases ===

describe("edge cases", () => {
	it("empty deck with no slides does not throw or set fade mode", () => {
		const { container } = createDeck(0);
		expect(container.hasAttribute("data-lys-mode")).toBe(false);
	});

	it("single-slide fade deck has data-lys-active", () => {
		const { container, articles } = createDeck(1, { fadeSlides: [0] });
		expect(container.getAttribute("data-lys-mode")).toBe("fade");
		expect(articles[0].hasAttribute("data-lys-active")).toBe(true);
	});

	it("data-lys-active is set before data-lys-mode", () => {
		// Verify the constructor sets data-lys-active first.
		// The container should have both attributes after init.
		const { container, articles } = createDeck(3, { fadeSlides: [0] });
		expect(articles[0].hasAttribute("data-lys-active")).toBe(true);
		expect(container.getAttribute("data-lys-mode")).toBe("fade");
	});
});

// === Direct mode detection ===

describe("direct mode detection", () => {
	it("deck with data-transition='direct' gets data-lys-mode='direct'", () => {
		const { container } = createDeck(3, { directSlides: [0] });
		expect(container.getAttribute("data-lys-mode")).toBe("direct");
	});

	it("any slide with direct activates direct for the whole deck", () => {
		const { container } = createDeck(5, { directSlides: [2] });
		expect(container.getAttribute("data-lys-mode")).toBe("direct");
	});

	it("fade takes precedence over direct", () => {
		const { container } = createDeck(3, { fadeSlides: [0], directSlides: [1] });
		expect(container.getAttribute("data-lys-mode")).toBe("fade");
	});
});

// === Direct mode layout ===

describe("direct mode layout", () => {
	it("active slide has data-lys-active, inactive slides do not", () => {
		const { articles } = createDeck(3, { directSlides: [0] });
		expect(articles[0].hasAttribute("data-lys-active")).toBe(true);
		expect(articles[1].hasAttribute("data-lys-active")).toBe(false);
		expect(articles[2].hasAttribute("data-lys-active")).toBe(false);
	});

	it("navigation updates data-lys-active", () => {
		const { articles } = createDeck(3, { directSlides: [0] });
		const instance = instances[instances.length - 1];
		instance.goTo(1);

		expect(articles[0].hasAttribute("data-lys-active")).toBe(false);
		expect(articles[1].hasAttribute("data-lys-active")).toBe(true);
	});
});

// === Navigation in direct mode ===

describe("navigation in direct mode", () => {
	it("scrollIntoView is NOT called in direct mode", () => {
		const { articles } = createDeck(3, { directSlides: [0] });
		const spy = vi.spyOn(articles[1], "scrollIntoView");
		const instance = instances[instances.length - 1];
		instance.goTo(1);

		expect(spy).not.toHaveBeenCalled();
	});

	it("keyboard navigation works in direct mode", () => {
		const { container, articles } = createDeck(3, { directSlides: [0] });
		container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

		expect(articles[1].hasAttribute("data-lys-active")).toBe(true);
	});

	it("touch navigation works in direct mode", () => {
		const { container, articles } = createDeck(3, { directSlides: [0] });
		const startX = 200;
		const startY = 200;
		container.dispatchEvent(
			new TouchEvent("touchstart", {
				touches: [
					new Touch({ identifier: 0, target: container, clientX: startX, clientY: startY }),
				],
				bubbles: true,
			}),
		);
		container.dispatchEvent(
			new TouchEvent("touchend", {
				changedTouches: [
					new Touch({ identifier: 0, target: container, clientX: startX - 60, clientY: startY }),
				],
				bubbles: true,
			}),
		);

		expect(articles[1].hasAttribute("data-lys-active")).toBe(true);
	});

	it("API navigation works in direct mode", () => {
		createDeck(5, { directSlides: [0] });
		const instance = instances[instances.length - 1];
		instance.goTo(2);

		expect(instance.current).toBe(2);
	});

	it("lys:slidechange fires with correct detail in direct mode", () => {
		const { container } = createDeck(3, { directSlides: [0] });
		const instance = instances[instances.length - 1];
		const handler = vi.fn();
		container.addEventListener("lys:slidechange", handler);

		instance.goTo(2);

		expect(handler).toHaveBeenCalledOnce();
		const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
		expect(detail.from).toBe(0);
		expect(detail.to).toBe(2);
	});

	it("hash routing works in direct mode", () => {
		history.replaceState(null, "", "#slide=2");
		const { articles } = createDeck(3, { directSlides: [0] });
		const instance = instances[instances.length - 1];

		expect(instance.current).toBe(1);
		expect(articles[1].hasAttribute("data-lys-active")).toBe(true);
	});
});

// === A11y in direct mode ===

describe("a11y in direct mode", () => {
	it("ARIA attributes are set in direct mode", () => {
		const { container, articles } = createDeck(3, { directSlides: [0] });

		expect(container.getAttribute("role")).toBe("group");
		expect(container.getAttribute("aria-roledescription")).toBe("slide deck");

		for (const article of articles) {
			expect(article.getAttribute("role")).toBe("group");
			expect(article.getAttribute("aria-roledescription")).toBe("slide");
		}
	});

	it("aria-hidden is managed in direct mode", () => {
		const { articles } = createDeck(3, { directSlides: [0] });

		expect(articles[0].hasAttribute("aria-hidden")).toBe(false);
		expect(articles[1].getAttribute("aria-hidden")).toBe("true");
		expect(articles[2].getAttribute("aria-hidden")).toBe("true");
	});

	it("live region announces in direct mode", () => {
		const { container } = createDeck(3, { directSlides: [0] });
		const instance = instances[instances.length - 1];
		instance.goTo(1);

		const liveRegion = container.querySelector('[role="status"]') as HTMLElement;
		expect(liveRegion.textContent).toBe("Slide 2 of 3");
	});

	it("focus moves to active slide in direct mode", () => {
		const { articles } = createDeck(3, { directSlides: [0] });
		const instance = instances[instances.length - 1];
		const focusSpy = vi.spyOn(articles[1], "focus");
		instance.goTo(1);

		expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
	});
});

// === Direct mode cleanup ===

describe("direct mode cleanup", () => {
	it("destroy removes data-lys-mode='direct'", () => {
		const { container } = createDeck(3, { directSlides: [0] });
		const instance = popInstance();
		instance.destroy();

		expect(container.hasAttribute("data-lys-mode")).toBe(false);
	});

	it("re-initialization after destroy preserves direct mode", () => {
		const { container } = createDeck(3, { directSlides: [0] });
		const instance = popInstance();
		instance.destroy();

		expect(container.hasAttribute("data-lys-mode")).toBe(false);

		const newInstance = new Lys(container);
		instances.push(newInstance);
		expect(container.getAttribute("data-lys-mode")).toBe("direct");
	});
});

// === Direct mode edge cases ===

describe("direct mode edge cases", () => {
	it("single-slide direct deck has data-lys-active", () => {
		const { container, articles } = createDeck(1, { directSlides: [0] });
		expect(container.getAttribute("data-lys-mode")).toBe("direct");
		expect(articles[0].hasAttribute("data-lys-active")).toBe(true);
	});
});

// === FOUC prevention (#22) ===

describe("FOUC prevention — data-lys-ready", () => {
	it("data-lys-ready is NOT set synchronously after construction", () => {
		const { container } = createDeck(3, { fadeSlides: [0] });
		expect(container.hasAttribute("data-lys-ready")).toBe(false);
	});

	it("data-lys-ready is set after requestAnimationFrame", async () => {
		const { container } = createDeck(3, { fadeSlides: [0] });
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(container.hasAttribute("data-lys-ready")).toBe(true);
	});

	it("data-lys-ready is set for direct mode", async () => {
		const { container } = createDeck(3, { directSlides: [0] });
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(container.hasAttribute("data-lys-ready")).toBe(true);
	});

	it("data-lys-ready is set for scroll-snap mode", async () => {
		const { container } = createDeck(3);
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(container.hasAttribute("data-lys-ready")).toBe(true);
	});

	it("destroy() removes data-lys-ready", async () => {
		const { container } = createDeck(3, { fadeSlides: [0] });
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(container.hasAttribute("data-lys-ready")).toBe(true);

		const instance = popInstance();
		instance.destroy();
		expect(container.hasAttribute("data-lys-ready")).toBe(false);
	});

	it("destroy() before rAF prevents data-lys-ready from being set", async () => {
		const { container } = createDeck(3, { fadeSlides: [0] });
		// Destroy immediately, before rAF fires.
		const instance = popInstance();
		instance.destroy();

		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(container.hasAttribute("data-lys-ready")).toBe(false);
	});

	it("re-initialization after destroy sets data-lys-ready again", async () => {
		const { container } = createDeck(3, { fadeSlides: [0] });
		await new Promise((resolve) => requestAnimationFrame(resolve));

		const instance = popInstance();
		instance.destroy();
		expect(container.hasAttribute("data-lys-ready")).toBe(false);

		const newInstance = new Lys(container);
		instances.push(newInstance);
		expect(container.hasAttribute("data-lys-ready")).toBe(false);
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(container.hasAttribute("data-lys-ready")).toBe(true);
	});
});
