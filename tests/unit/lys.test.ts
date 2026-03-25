import { afterEach, describe, expect, it, vi } from "vitest";
import { Lys } from "../../src/lys.js";

function createDeck(articleCount: number, extras?: string): HTMLElement {
	const articles = Array.from(
		{ length: articleCount },
		(_, i) => `<article><h2>Slide ${i + 1}</h2></article>`,
	).join("");
	const container = document.createElement("div");
	container.setAttribute("data-lys", "");
	container.innerHTML = articles + (extras ?? "");
	document.body.appendChild(container);
	return container;
}

function cleanup(): void {
	document.body.innerHTML = "";
}

describe("Lys initialization", () => {
	afterEach(cleanup);

	it("Lys.init() discovers all [data-lys] containers", () => {
		createDeck(2);
		createDeck(3);
		// Re-init to pick up manually created containers.
		const instances = Lys.init();
		// Instances include the two we just created (may be idempotent from constructor).
		expect(instances).toHaveLength(2);
	});

	it("new Lys(container) initializes a single container", () => {
		const container = createDeck(3);
		const instance = new Lys(container);
		expect(instance).toBeInstanceOf(Lys);
		expect(instance.total).toBe(3);
	});

	it("Lys.from() returns the same instance (idempotent)", () => {
		const container = createDeck(2);
		const first = Lys.from(container);
		const second = Lys.from(container);
		expect(second).toBe(first);
	});

	it("new Lys() on initialized container destroys previous instance", () => {
		const container = createDeck(3);
		const first = new Lys(container);
		const second = new Lys(container);
		expect(second).not.toBe(first);
		expect(second.total).toBe(3);
		// Previous instance was destroyed.
		expect(first.total).toBe(0);
		expect(first.current).toBe(-1);
	});

	it("new Lys() on initialized container fires lys:ready for new instance", () => {
		const container = createDeck(2);
		new Lys(container);

		const handler = vi.fn();
		container.addEventListener("lys:ready", handler);
		const second = new Lys(container);
		expect(handler).toHaveBeenCalledOnce();
		expect(handler.mock.calls[0][0].detail.instance).toBe(second);
	});

	it("Lys.from() does not fire lys:ready again", () => {
		const container = document.createElement("div");
		container.setAttribute("data-lys", "");
		container.innerHTML = "<article>Slide</article>";
		document.body.appendChild(container);

		const instance = Lys.from(container);
		const handler = vi.fn();
		container.addEventListener("lys:ready", handler);
		const second = Lys.from(container);
		expect(second).toBe(instance);
		expect(handler).not.toHaveBeenCalled();
	});

	it("dispatches lys:ready on initialization", () => {
		const container = document.createElement("div");
		container.setAttribute("data-lys", "");
		container.innerHTML = "<article>Slide</article>";
		document.body.appendChild(container);

		const handler = vi.fn();
		container.addEventListener("lys:ready", handler);
		const instance = new Lys(container);
		expect(handler).toHaveBeenCalledOnce();
		expect(handler.mock.calls[0][0].detail.instance).toBe(instance);
	});
});

describe("Lys instance state", () => {
	afterEach(cleanup);

	it("exposes correct state for a multi-slide deck", () => {
		const container = createDeck(5);
		const instance = new Lys(container);
		expect(instance.current).toBe(0);
		expect(instance.total).toBe(5);
		expect(instance.slide).toBe(container.querySelector("article"));
	});

	it("handles single-slide deck", () => {
		const container = createDeck(1);
		const instance = new Lys(container);
		expect(instance.current).toBe(0);
		expect(instance.total).toBe(1);
		expect(instance.slide).toBe(container.querySelector("article"));
	});

	it("handles empty container without error", () => {
		const container = createDeck(0);
		const instance = new Lys(container);
		expect(instance.total).toBe(0);
		expect(instance.current).toBe(-1);
		expect(instance.slide).toBeNull();
	});

	it("ignores non-article children", () => {
		const container = createDeck(2, "<div>Not a slide</div><nav>Also not</nav>");
		const instance = new Lys(container);
		expect(instance.total).toBe(2);
	});
});

describe("data-class handling", () => {
	afterEach(cleanup);

	it("applies data-class classes on init", () => {
		const container = document.createElement("div");
		container.setAttribute("data-lys", "");
		container.innerHTML = '<article data-class="title-slide dark">Slide</article>';
		document.body.appendChild(container);

		new Lys(container);
		const article = container.querySelector("article") as HTMLElement;
		expect(article.classList.contains("title-slide")).toBe(true);
		expect(article.classList.contains("dark")).toBe(true);
	});

	it("removes data-class classes on destroy", () => {
		const container = document.createElement("div");
		container.setAttribute("data-lys", "");
		container.innerHTML = '<article data-class="title-slide">Slide</article>';
		document.body.appendChild(container);

		const instance = new Lys(container);
		const article = container.querySelector("article") as HTMLElement;
		expect(article.classList.contains("title-slide")).toBe(true);

		instance.destroy();
		expect(article.classList.contains("title-slide")).toBe(false);
	});
});

describe("data-background handling", () => {
	afterEach(cleanup);

	it("applies data-background as inline style on init", () => {
		const container = document.createElement("div");
		container.setAttribute("data-lys", "");
		container.innerHTML = '<article data-background="#1a1a2e">Slide</article>';
		document.body.appendChild(container);

		new Lys(container);
		const article = container.querySelector("article") as HTMLElement;
		expect(article.style.background).toContain("#1a1a2e");
	});

	it("applies data-background with gradient value", () => {
		const container = document.createElement("div");
		container.setAttribute("data-lys", "");
		container.innerHTML =
			'<article data-background="linear-gradient(to right, red, blue)">Slide</article>';
		document.body.appendChild(container);

		new Lys(container);
		const article = container.querySelector("article") as HTMLElement;
		expect(article.style.background).toContain("linear-gradient");
	});

	it("reverts data-background on destroy", () => {
		const container = document.createElement("div");
		container.setAttribute("data-lys", "");
		container.innerHTML = '<article data-background="#1a1a2e">Slide</article>';
		document.body.appendChild(container);

		const instance = new Lys(container);
		instance.destroy();
		const article = container.querySelector("article") as HTMLElement;
		expect(article.style.background).toBe("");
	});
});

describe("Lys destroy lifecycle", () => {
	afterEach(cleanup);

	it("destroy resets instance state", () => {
		const container = createDeck(3);
		const instance = new Lys(container);
		instance.destroy();
		expect(instance.total).toBe(0);
		expect(instance.current).toBe(-1);
		expect(instance.slide).toBeNull();
	});

	it("allows re-initialization after destroy", () => {
		const container = createDeck(3);
		const first = new Lys(container);
		first.destroy();
		const second = new Lys(container);
		expect(second).not.toBe(first);
		expect(second.total).toBe(3);
	});
});
