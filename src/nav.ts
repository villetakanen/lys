import type { LysSlideChangeDetail } from "./types.js";

/** Handle returned by setupNav for cleanup. */
export interface NavHandle {
	destroy(): void;
}

/**
 * Wire an opt-in author nav region (`[data-lys-nav]`) to the deck's active slide.
 *
 * Lys does not generate the nav or its links — the author owns the region, its
 * contents, and all styling.
 * This hook marks the link whose `href="#id"` matches the current slide with
 * `aria-current="true"` and `data-lys-nav-active`. Returns null when no region
 * exists, so the no-nav path stays cost-free.
 */
export function setupNav(
	container: HTMLElement,
	slides: readonly HTMLElement[],
	currentIndex: number,
): NavHandle | null {
	const region = container.querySelector<HTMLElement>(":scope [data-lys-nav]");
	if (!region) return null;

	// Pair each in-page anchor with the slide id it targets (parsed from the
	// href fragment directly, so it resolves identically in any environment).
	const links = Array.from(region.querySelectorAll<HTMLAnchorElement>('a[href*="#"]'))
		.map((el) => {
			const href = el.getAttribute("href") ?? "";
			const hash = href.indexOf("#");
			return { el, target: hash >= 0 ? decodeURIComponent(href.slice(hash + 1)) : "" };
		})
		.filter((link) => link.target);
	let activeLink: HTMLAnchorElement | null = null;

	/** Mark the link targeting `id` as active; clear the previous one. */
	function setActive(id: string | null): void {
		const next = id ? (links.find((link) => link.target === id)?.el ?? null) : null;
		if (next === activeLink) return;
		activeLink?.removeAttribute("aria-current");
		activeLink?.removeAttribute("data-lys-nav-active");
		if (next) {
			next.setAttribute("aria-current", "true");
			next.setAttribute("data-lys-nav-active", "");
		}
		activeLink = next;
	}

	function onSlideChange(e: Event): void {
		const { slide } = (e as CustomEvent<LysSlideChangeDetail>).detail;
		setActive(slide?.id || null);
	}
	container.addEventListener("lys:slidechange", onSlideChange);

	// Initial active link reflects the starting slide.
	setActive(slides[currentIndex]?.id || null);

	return {
		destroy() {
			container.removeEventListener("lys:slidechange", onSlideChange);
			activeLink?.removeAttribute("aria-current");
			activeLink?.removeAttribute("data-lys-nav-active");
			activeLink = null;
		},
	};
}
