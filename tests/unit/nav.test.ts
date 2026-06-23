import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Lys } from "../../src/lys.js";

const instances: Lys[] = [];

beforeEach(() => {
	// happy-dom's IntersectionObserver does no real layout and fires
	// nondeterministically across tests. The active-on-scroll path is covered by
	// e2e; here we disable the observer so the init + slidechange logic is
	// deterministic (nav.ts skips it when IntersectionObserver is undefined).
	vi.stubGlobal("IntersectionObserver", undefined);
});

/** Build a deck with an opt-in [data-lys-nav] region and id'd articles. */
function createNavDeck(opts: {
	ids: (string | null)[];
	navLinks: string[];
	stacked?: boolean;
	withNav?: boolean;
}): { container: HTMLElement; instance: Lys; region: HTMLElement | null } {
	const container = document.createElement("div");
	container.setAttribute("data-lys", "");

	let region: HTMLElement | null = null;
	if (opts.withNav !== false) {
		region = document.createElement("nav");
		region.setAttribute("data-lys-nav", "");
		region.setAttribute("aria-label", "Slides");
		for (const href of opts.navLinks) {
			const a = document.createElement("a");
			a.setAttribute("href", href);
			a.textContent = href;
			region.appendChild(a);
		}
		container.appendChild(region);
	}

	opts.ids.forEach((id, i) => {
		const article = document.createElement("article");
		if (id) article.id = id;
		article.innerHTML = `<h2>Slide ${i + 1}</h2>`;
		if (opts.stacked) article.setAttribute("data-transition", "fade");
		container.appendChild(article);
	});

	document.body.appendChild(container);
	const instance = new Lys(container);
	instances.push(instance);
	return { container, instance, region };
}

function activeLink(region: HTMLElement): HTMLAnchorElement | null {
	return region.querySelector<HTMLAnchorElement>("[data-lys-nav-active]");
}

afterEach(() => {
	for (const instance of instances) instance.destroy();
	instances.length = 0;
	document.body.innerHTML = "";
	// Reset the hash so a deep-link from one test doesn't deep-link the next.
	history.replaceState(null, "", location.pathname);
	vi.unstubAllGlobals();
});

describe("chapter nav — active-state hook", () => {
	it("does nothing without a nav region", () => {
		const { container } = createNavDeck({ ids: ["a", "b"], navLinks: [], withNav: false });
		expect(container.querySelector("[data-lys-nav-active]")).toBeNull();
		expect(container.querySelector("[aria-current]")).toBeNull();
	});

	it("does not generate or alter the author's link DOM", () => {
		const { region } = createNavDeck({ ids: ["a", "b", "c"], navLinks: ["#a", "#b", "#c"] });
		expect(region?.querySelectorAll("a")).toHaveLength(3);
	});

	it("marks the starting slide's link active on init", () => {
		const { region } = createNavDeck({ ids: ["a", "b", "c"], navLinks: ["#a", "#b", "#c"] });
		if (!region) throw new Error("no region");
		const link = activeLink(region);
		expect(link?.getAttribute("href")).toBe("#a");
		expect(link?.getAttribute("aria-current")).toBe("true");
		// only one active link
		expect(region.querySelectorAll("[data-lys-nav-active]")).toHaveLength(1);
		expect(region.querySelectorAll("[aria-current]")).toHaveLength(1);
	});

	it("moves the active link on slide change", () => {
		const { instance, region } = createNavDeck({
			ids: ["a", "b", "c"],
			navLinks: ["#a", "#b", "#c"],
		});
		if (!region) throw new Error("no region");
		instance.goTo(2);
		const link = activeLink(region);
		expect(link?.getAttribute("href")).toBe("#c");
		expect(region.querySelectorAll("[data-lys-nav-active]")).toHaveLength(1);
		// previous link cleared
		const first = region.querySelector('a[href="#a"]');
		expect(first?.hasAttribute("aria-current")).toBe(false);
	});

	it("tracks active in stacked mode too (no observer)", () => {
		const { instance, region } = createNavDeck({
			ids: ["a", "b"],
			navLinks: ["#a", "#b"],
			stacked: true,
		});
		if (!region) throw new Error("no region");
		instance.goTo(1);
		expect(activeLink(region)?.getAttribute("href")).toBe("#b");
	});

	it("never marks a link that targets a non-existent slide", () => {
		const { instance, region } = createNavDeck({
			ids: ["a", "b"],
			navLinks: ["#a", "#missing", "#b"],
		});
		if (!region) throw new Error("no region");
		const missing = region.querySelector('a[href="#missing"]');
		expect(() => instance.goTo(1)).not.toThrow();
		expect(missing?.hasAttribute("data-lys-nav-active")).toBe(false);
		expect(missing?.hasAttribute("aria-current")).toBe(false);
	});

	it("clears the active link when the current slide has no link", () => {
		// slide 1 (id 'b') has no nav link; navigating to it clears the active state.
		const { instance, region } = createNavDeck({ ids: ["a", "b"], navLinks: ["#a"] });
		if (!region) throw new Error("no region");
		expect(activeLink(region)?.getAttribute("href")).toBe("#a");
		instance.goTo(1);
		expect(activeLink(region)).toBeNull();
	});

	it("cleans up active-state attributes and listeners on destroy", () => {
		const { instance, region } = createNavDeck({ ids: ["a", "b"], navLinks: ["#a", "#b"] });
		if (!region) throw new Error("no region");
		expect(activeLink(region)).not.toBeNull();
		instance.destroy();
		instances.length = 0;
		expect(region.querySelector("[data-lys-nav-active]")).toBeNull();
		expect(region.querySelector("[aria-current]")).toBeNull();
	});

	it("tracks two decks independently", () => {
		const a = createNavDeck({ ids: ["a1", "a2"], navLinks: ["#a1", "#a2"] });
		const b = createNavDeck({ ids: ["b1", "b2"], navLinks: ["#b1", "#b2"] });
		if (!a.region || !b.region) throw new Error("no region");
		a.instance.goTo(1);
		expect(activeLink(a.region)?.getAttribute("href")).toBe("#a2");
		// deck B unchanged
		expect(activeLink(b.region)?.getAttribute("href")).toBe("#b1");
	});
});
