import { afterEach, describe, expect, it, vi } from "vitest";
import { Lys } from "../../src/lys.js";

const instances: Lys[] = [];

function createDeck(
	articleCount: number,
	extras?: {
		containerAttrs?: Record<string, string>;
		slideAttrs?: Record<string, Record<string, string>>;
		slideContent?: Record<number, string>;
	},
): { container: HTMLElement; articles: HTMLElement[] } {
	const container = document.createElement("div");
	container.setAttribute("data-lys", "");

	if (extras?.containerAttrs) {
		for (const [k, v] of Object.entries(extras.containerAttrs)) {
			container.setAttribute(k, v);
		}
	}

	for (let i = 0; i < articleCount; i++) {
		const article = document.createElement("article");
		const content = extras?.slideContent?.[i] ?? `<h2>Slide ${i + 1}</h2>`;
		article.innerHTML = content;

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

/** Pop the last instance from the array (for destroy-then-assert tests). */
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

// === ARIA roles on initialization ===

describe("container ARIA", () => {
	it("sets role=group and aria-roledescription on container", () => {
		const { container } = createDeck(3);
		expect(container.getAttribute("role")).toBe("group");
		expect(container.getAttribute("aria-roledescription")).toBe("slide deck");
	});

	it("derives aria-label from first heading", () => {
		const { container } = createDeck(3, {
			slideContent: { 0: "<h1>Quarterly Review</h1>" },
		});
		expect(container.getAttribute("aria-label")).toBe("Quarterly Review");
	});

	it("preserves explicit aria-label", () => {
		const { container } = createDeck(3, {
			containerAttrs: { "aria-label": "My Presentation" },
		});
		expect(container.getAttribute("aria-label")).toBe("My Presentation");
	});

	it("preserves aria-labelledby and does not add aria-label", () => {
		const { container } = createDeck(3, {
			containerAttrs: { "aria-labelledby": "deck-title" },
		});
		expect(container.getAttribute("aria-labelledby")).toBe("deck-title");
		// Should not have a module-added aria-label.
		// The container may have aria-labelledby but no aria-label added by us.
		// (The module skips aria-label when aria-labelledby is present.)
		expect(container.hasAttribute("aria-label")).toBe(false);
	});

	it("uses fallback label when no heading exists", () => {
		const { container } = createDeck(3, {
			slideContent: { 0: "<p>No heading here</p>" },
		});
		expect(container.getAttribute("aria-label")).toBe("Slide deck");
	});
});

describe("slide ARIA", () => {
	it("sets role=group and aria-roledescription on each slide", () => {
		const { articles } = createDeck(3);
		for (const article of articles) {
			expect(article.getAttribute("role")).toBe("group");
			expect(article.getAttribute("aria-roledescription")).toBe("slide");
		}
	});

	it("sets positional aria-label on slides", () => {
		const { articles } = createDeck(5);
		expect(articles[0].getAttribute("aria-label")).toBe("Slide 1 of 5");
		expect(articles[2].getAttribute("aria-label")).toBe("Slide 3 of 5");
		expect(articles[4].getAttribute("aria-label")).toBe("Slide 5 of 5");
	});

	it("preserves author-provided aria-label on slides", () => {
		const { articles } = createDeck(3, {
			slideAttrs: { 1: { "aria-label": "Conclusion" } },
		});
		expect(articles[1].getAttribute("aria-label")).toBe("Conclusion");
		expect(articles[0].getAttribute("aria-label")).toBe("Slide 1 of 3");
	});
});

// === aria-hidden management ===

describe("aria-hidden", () => {
	it("hides non-current slides on init", () => {
		const { articles } = createDeck(3);
		expect(articles[0].hasAttribute("aria-hidden")).toBe(false);
		expect(articles[1].getAttribute("aria-hidden")).toBe("true");
		expect(articles[2].getAttribute("aria-hidden")).toBe("true");
	});

	it("updates aria-hidden on slide change", () => {
		const { articles } = createDeck(3);
		const instance = instances[instances.length - 1];
		instance.goTo(2);

		expect(articles[0].getAttribute("aria-hidden")).toBe("true");
		expect(articles[1].getAttribute("aria-hidden")).toBe("true");
		expect(articles[2].hasAttribute("aria-hidden")).toBe(false);
	});

	it("does not hide the only slide in a single-slide deck", () => {
		const { articles } = createDeck(1);
		expect(articles[0].hasAttribute("aria-hidden")).toBe(false);
	});
});

// === Live region ===

describe("live region", () => {
	it("creates a live region on init", () => {
		const { container } = createDeck(3);
		const liveRegion = container.querySelector('[role="status"]') as HTMLElement;
		expect(liveRegion).not.toBeNull();
		expect(liveRegion.getAttribute("aria-live")).toBe("polite");
		expect(liveRegion.getAttribute("aria-atomic")).toBe("true");
		expect(liveRegion.classList.contains("lys-sr-only")).toBe(true);
	});

	it("does not announce on initial load", () => {
		const { container } = createDeck(3);
		const liveRegion = container.querySelector('[role="status"]') as HTMLElement;
		expect(liveRegion.textContent).toBe("");
	});

	it("announces slide change", () => {
		const { container } = createDeck(5);
		const instance = instances[instances.length - 1];

		// Verify the event fires and updates the live region.
		const handler = vi.fn();
		container.addEventListener("lys:slidechange", handler);
		instance.goTo(2);
		expect(handler).toHaveBeenCalledOnce();

		const liveRegion = container.querySelector('[role="status"]') as HTMLElement;
		expect(liveRegion.textContent).toBe("Slide 3 of 5");
	});

	it("includes author label in announcement", () => {
		const { container } = createDeck(5, {
			slideAttrs: { 2: { "aria-label": "Conclusion" } },
		});
		const instance = instances[instances.length - 1];

		const handler = vi.fn();
		container.addEventListener("lys:slidechange", handler);
		instance.goTo(2);
		expect(handler).toHaveBeenCalledOnce();

		const liveRegion = container.querySelector('[role="status"]') as HTMLElement;
		expect(liveRegion.textContent).toBe("Slide 3 of 5: Conclusion");
	});

	it("does not include positional label as suffix", () => {
		// When we set the positional label, it should NOT appear as a suffix.
		const { container } = createDeck(3);
		const instance = instances[instances.length - 1];
		instance.goTo(1);

		const liveRegion = container.querySelector('[role="status"]') as HTMLElement;
		expect(liveRegion.textContent).toBe("Slide 2 of 3");
	});
});

// === Focus management ===

describe("focus management", () => {
	it("sets tabindex=-1 on all slides", () => {
		const { articles } = createDeck(3);
		for (const article of articles) {
			expect(article.getAttribute("tabindex")).toBe("-1");
		}
	});

	it("preserves author-provided tabindex", () => {
		const { articles } = createDeck(3, {
			slideAttrs: { 1: { tabindex: "0" } },
		});
		expect(articles[1].getAttribute("tabindex")).toBe("0");
		expect(articles[0].getAttribute("tabindex")).toBe("-1");
		expect(articles[2].getAttribute("tabindex")).toBe("-1");
	});

	it("moves focus to active slide on navigation", () => {
		const { articles } = createDeck(5);
		const instance = instances[instances.length - 1];
		const focusSpy = vi.spyOn(articles[2], "focus");

		instance.goTo(2);

		expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
	});

	it("does not move focus on initial load", () => {
		const { articles } = createDeck(3);
		// After init, the first slide should not have received focus via the a11y module.
		// (The document.activeElement should not be the first slide.)
		expect(document.activeElement).not.toBe(articles[0]);
	});
});

// === Cleanup on destroy ===

describe("destroy cleanup", () => {
	it("removes container ARIA attributes", () => {
		const { container } = createDeck(3);
		const instance = popInstance();
		instance.destroy();

		expect(container.hasAttribute("role")).toBe(false);
		expect(container.hasAttribute("aria-roledescription")).toBe(false);
		expect(container.hasAttribute("aria-label")).toBe(false);
	});

	it("preserves author-provided container aria-label on destroy", () => {
		const { container } = createDeck(3, {
			containerAttrs: { "aria-label": "My Deck" },
		});
		const instance = popInstance();
		instance.destroy();

		expect(container.getAttribute("aria-label")).toBe("My Deck");
	});

	it("removes slide ARIA attributes", () => {
		const { articles } = createDeck(3);
		const instance = popInstance();
		instance.destroy();

		for (const article of articles) {
			expect(article.hasAttribute("role")).toBe(false);
			expect(article.hasAttribute("aria-roledescription")).toBe(false);
			expect(article.hasAttribute("aria-hidden")).toBe(false);
			expect(article.hasAttribute("aria-label")).toBe(false);
		}
	});

	it("removes the live region element", () => {
		const { container } = createDeck(3);
		const instance = popInstance();
		instance.destroy();

		expect(container.querySelector('[role="status"]')).toBeNull();
	});

	it("removes tabindex added by the module", () => {
		const { articles } = createDeck(3);
		const instance = popInstance();
		instance.destroy();

		for (const article of articles) {
			expect(article.hasAttribute("tabindex")).toBe(false);
		}
	});

	it("preserves author-provided tabindex on destroy", () => {
		const { articles } = createDeck(3, {
			slideAttrs: { 1: { tabindex: "0" } },
		});
		const instance = popInstance();
		instance.destroy();

		expect(articles[1].getAttribute("tabindex")).toBe("0");
	});

	it("stops responding to slidechange after destroy", () => {
		const { container } = createDeck(3);
		const instance = popInstance();
		instance.destroy();

		// Manually dispatch a slidechange — live region should not exist.
		container.dispatchEvent(
			new CustomEvent("lys:slidechange", {
				detail: { from: 0, to: 1, slide: container.querySelector("article") as HTMLElement },
			}),
		);

		expect(container.querySelector('[role="status"]')).toBeNull();
	});
});

// === Empty and edge cases ===

describe("edge cases", () => {
	it("does not throw on empty deck", () => {
		expect(() => createDeck(0)).not.toThrow();
	});

	it("sets correct ARIA on empty deck", () => {
		const { container } = createDeck(0);
		expect(container.getAttribute("role")).toBe("group");
		expect(container.querySelector('[role="status"]')).not.toBeNull();
	});

	it("single-slide deck has correct ARIA", () => {
		const { articles, container } = createDeck(1);
		expect(articles[0].getAttribute("aria-label")).toBe("Slide 1 of 1");
		expect(articles[0].hasAttribute("aria-hidden")).toBe(false);

		const liveRegion = container.querySelector('[role="status"]') as HTMLElement;
		expect(liveRegion.textContent).toBe("");
	});
});
