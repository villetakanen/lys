import type { LysSlideChangeDetail } from "./types.js";

/** Handle returned by setupNav for cleanup. */
export interface NavHandle {
	destroy(): void;
}

/**
 * Wire an opt-in author nav region (`[data-lys-nav]`) to the deck's active slide.
 *
 * Lys does not generate the nav or its links — the author owns the region, its
 * contents, and all styling (lys.css only lifts it out of the scroll-snap flow).
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

	// Scroll-driven active state — default (scroll-snap) mode only. In stacked
	// mode all slides overlap, so the observer can't disambiguate; the
	// slidechange listener keeps the active link correct there.
	let observer: IntersectionObserver | null = null;
	const stacked = container.hasAttribute("data-lys-mode");
	if (!stacked && typeof IntersectionObserver !== "undefined") {
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const id = (entry.target as HTMLElement).id;
					if (entry.isIntersecting && id) setActive(id);
				}
			},
			// The article straddling the viewport middle is "current".
			{ root: container, rootMargin: "-45% 0px -50% 0px" },
		);
		for (const slide of slides) {
			if (slide.id) observer.observe(slide);
		}
	}

	// Initial active link reflects the starting slide.
	setActive(slides[currentIndex]?.id || null);

	return {
		destroy() {
			container.removeEventListener("lys:slidechange", onSlideChange);
			observer?.disconnect();
			activeLink?.removeAttribute("aria-current");
			activeLink?.removeAttribute("data-lys-nav-active");
			activeLink = null;
		},
	};
}
