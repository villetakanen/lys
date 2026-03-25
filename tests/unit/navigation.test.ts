import { afterEach, describe, expect, it } from "vitest";
import { Lys } from "../../src/lys.js";

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
		container.querySelector("article")!.appendChild(input);
		pressKey(input, " ");
		expect(instance.current).toBe(0);
	});

	it("Space does not navigate when a textarea is focused", () => {
		const { container, instance } = createDeck(5);
		const textarea = document.createElement("textarea");
		container.querySelector("article")!.appendChild(textarea);
		pressKey(textarea, " ");
		expect(instance.current).toBe(0);
	});

	it("Arrow keys still navigate when an input is focused", () => {
		const { container, instance } = createDeck(5);
		const input = document.createElement("input");
		container.querySelector("article")!.appendChild(input);
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

describe("keyboard destroy lifecycle", () => {
	afterEach(cleanup);

	it("destroy removes keyboard listener", () => {
		const { container, instance } = createDeck(5);
		instance.destroy();
		pressKey(container, "ArrowRight");
		// Instance is destroyed, current is -1, and no listener fires.
		expect(instance.current).toBe(-1);
	});
});
