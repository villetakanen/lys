import { afterEach, describe, expect, it } from "vitest";
import { Lys } from "../../src/lys.js";
import { setupNavigation } from "../../src/navigation.js";

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
	return { container, instance };
}

function pressKey(target: HTMLElement, key: string, opts: Partial<KeyboardEventInit> = {}): void {
	target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...opts }));
}

function cleanup(): void {
	document.body.innerHTML = "";
}

describe("keyboard navigation", () => {
	afterEach(cleanup);

	it("ArrowRight advances to next slide", () => {
		const { container, instance } = createDeck(5);
		const nav = setupNavigation(instance, container);
		pressKey(container, "ArrowRight");
		expect(instance.current).toBe(1);
		nav.destroy();
	});

	it("ArrowDown advances to next slide", () => {
		const { container, instance } = createDeck(5);
		const nav = setupNavigation(instance, container);
		pressKey(container, "ArrowDown");
		expect(instance.current).toBe(1);
		nav.destroy();
	});

	it("ArrowLeft goes to previous slide", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(2);
		const nav = setupNavigation(instance, container);
		pressKey(container, "ArrowLeft");
		expect(instance.current).toBe(1);
		nav.destroy();
	});

	it("ArrowUp goes to previous slide", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(2);
		const nav = setupNavigation(instance, container);
		pressKey(container, "ArrowUp");
		expect(instance.current).toBe(1);
		nav.destroy();
	});

	it("Home jumps to first slide", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(3);
		const nav = setupNavigation(instance, container);
		pressKey(container, "Home");
		expect(instance.current).toBe(0);
		nav.destroy();
	});

	it("End jumps to last slide", () => {
		const { container, instance } = createDeck(5);
		const nav = setupNavigation(instance, container);
		pressKey(container, "End");
		expect(instance.current).toBe(4);
		nav.destroy();
	});

	it("Space advances to next slide", () => {
		const { container, instance } = createDeck(5);
		const nav = setupNavigation(instance, container);
		pressKey(container, " ");
		expect(instance.current).toBe(1);
		nav.destroy();
	});

	it("Shift+Space goes to previous slide", () => {
		const { container, instance } = createDeck(5);
		instance.goTo(2);
		const nav = setupNavigation(instance, container);
		pressKey(container, " ", { shiftKey: true });
		expect(instance.current).toBe(1);
		nav.destroy();
	});

	it("Space does not navigate when an input is focused", () => {
		const { container, instance } = createDeck(5);
		const input = document.createElement("input");
		container.querySelector("article")!.appendChild(input);
		const nav = setupNavigation(instance, container);
		pressKey(input, " ");
		expect(instance.current).toBe(0);
		nav.destroy();
	});

	it("Space does not navigate when a textarea is focused", () => {
		const { container, instance } = createDeck(5);
		const textarea = document.createElement("textarea");
		container.querySelector("article")!.appendChild(textarea);
		const nav = setupNavigation(instance, container);
		pressKey(textarea, " ");
		expect(instance.current).toBe(0);
		nav.destroy();
	});

	it("Arrow keys still navigate when an input is focused", () => {
		const { container, instance } = createDeck(5);
		const input = document.createElement("input");
		container.querySelector("article")!.appendChild(input);
		const nav = setupNavigation(instance, container);
		pressKey(input, "ArrowRight");
		expect(instance.current).toBe(1);
		nav.destroy();
	});

	it("Ctrl+ArrowRight is ignored (browser shortcut preserved)", () => {
		const { container, instance } = createDeck(5);
		const nav = setupNavigation(instance, container);
		pressKey(container, "ArrowRight", { ctrlKey: true });
		expect(instance.current).toBe(0);
		nav.destroy();
	});

	it("Alt+ArrowRight is ignored", () => {
		const { container, instance } = createDeck(5);
		const nav = setupNavigation(instance, container);
		pressKey(container, "ArrowRight", { altKey: true });
		expect(instance.current).toBe(0);
		nav.destroy();
	});

	it("Meta+ArrowRight is ignored", () => {
		const { container, instance } = createDeck(5);
		const nav = setupNavigation(instance, container);
		pressKey(container, "ArrowRight", { metaKey: true });
		expect(instance.current).toBe(0);
		nav.destroy();
	});
});

describe("tabindex management", () => {
	afterEach(cleanup);

	it("adds tabindex=0 if container has no tabindex", () => {
		const { container, instance } = createDeck(3);
		const nav = setupNavigation(instance, container);
		expect(container.getAttribute("tabindex")).toBe("0");
		nav.destroy();
	});

	it("removes tabindex on destroy if navigation added it", () => {
		const { container, instance } = createDeck(3);
		const nav = setupNavigation(instance, container);
		nav.destroy();
		expect(container.hasAttribute("tabindex")).toBe(false);
	});

	it("preserves existing tabindex on destroy", () => {
		const { container, instance } = createDeck(3);
		container.setAttribute("tabindex", "-1");
		const nav = setupNavigation(instance, container);
		nav.destroy();
		expect(container.getAttribute("tabindex")).toBe("-1");
	});
});

describe("keyboard destroy lifecycle", () => {
	afterEach(cleanup);

	it("destroy removes keyboard listener", () => {
		const { container, instance } = createDeck(5);
		const nav = setupNavigation(instance, container);
		nav.destroy();
		pressKey(container, "ArrowRight");
		expect(instance.current).toBe(0);
	});
});
