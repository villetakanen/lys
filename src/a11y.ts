import type { LysSlideChangeDetail } from "./types.js";

/** Handle returned by setupA11y for cleanup. */
export interface A11yHandle {
	destroy(): void;
}

/** Attach ARIA roles, live region, and focus management to a Lys deck. */
export function setupA11y(
	container: HTMLElement,
	slides: readonly HTMLElement[],
	currentIndex: number,
): A11yHandle {
	// Track what we add so destroy() only removes module-added attributes.
	const addedContainerAttrs: string[] = [];
	const addedSlideAttrs = new Map<HTMLElement, string[]>();
	const addedTabindex = new Set<HTMLElement>();

	// --- Container ARIA ---
	container.setAttribute("role", "group");
	addedContainerAttrs.push("role");
	container.setAttribute("aria-roledescription", "slide deck");
	addedContainerAttrs.push("aria-roledescription");

	// aria-label resolution: preserve author-provided, derive from heading, or fallback.
	if (!container.hasAttribute("aria-label") && !container.hasAttribute("aria-labelledby")) {
		const firstHeading = slides[0]?.querySelector("h1, h2, h3, h4, h5, h6");
		const label = firstHeading?.textContent?.trim() || "Slide deck";
		container.setAttribute("aria-label", label);
		addedContainerAttrs.push("aria-label");
	}

	// --- Slide ARIA ---
	const total = slides.length;
	for (let i = 0; i < total; i++) {
		const slide = slides[i];
		if (!slide) continue;
		const attrs: string[] = [];

		slide.setAttribute("role", "group");
		attrs.push("role");
		slide.setAttribute("aria-roledescription", "slide");
		attrs.push("aria-roledescription");

		// Positional label — only if author didn't provide one.
		if (!slide.hasAttribute("aria-label")) {
			slide.setAttribute("aria-label", `Slide ${i + 1} of ${total}`);
			attrs.push("aria-label");
		}

		// aria-hidden for non-current slides.
		if (i !== currentIndex) {
			slide.setAttribute("aria-hidden", "true");
			attrs.push("aria-hidden");
		}

		// tabindex for programmatic focus.
		if (!slide.hasAttribute("tabindex")) {
			slide.setAttribute("tabindex", "-1");
			addedTabindex.add(slide);
		}

		addedSlideAttrs.set(slide, attrs);
	}

	// --- Live region ---
	const liveRegion = document.createElement("div");
	liveRegion.setAttribute("role", "status");
	liveRegion.setAttribute("aria-live", "polite");
	liveRegion.setAttribute("aria-atomic", "true");
	liveRegion.className = "lys-sr-only";
	// Empty on init — no announcement on load.
	container.appendChild(liveRegion);

	// --- slidechange listener ---
	function onSlideChange(e: Event): void {
		const detail = (e as CustomEvent<LysSlideChangeDetail>).detail;
		const { from, to, slide } = detail;

		// Update aria-hidden.
		const prevSlide = slides[from];
		if (prevSlide) {
			prevSlide.setAttribute("aria-hidden", "true");
			// Ensure aria-hidden is tracked for cleanup.
			const prevAttrs = addedSlideAttrs.get(prevSlide);
			if (prevAttrs && !prevAttrs.includes("aria-hidden")) {
				prevAttrs.push("aria-hidden");
			}
		}
		const nextSlide = slides[to];
		if (nextSlide) {
			nextSlide.removeAttribute("aria-hidden");
		}

		// Update live region.
		const authorLabel = nextSlide?.getAttribute("aria-label");
		// Check if this is an author-provided label (not our positional one).
		const positionalPattern = /^Slide \d+ of \d+$/;
		const suffix = authorLabel && !positionalPattern.test(authorLabel) ? `: ${authorLabel}` : "";
		liveRegion.textContent = `Slide ${to + 1} of ${slides.length}${suffix}`;

		// Move focus to active slide.
		slide.focus({ preventScroll: true });
	}

	container.addEventListener("lys:slidechange", onSlideChange);

	return {
		destroy() {
			container.removeEventListener("lys:slidechange", onSlideChange);

			// Remove container attributes added by this module.
			for (const attr of addedContainerAttrs) {
				container.removeAttribute(attr);
			}

			// Remove slide attributes added by this module.
			for (const [slide, attrs] of addedSlideAttrs) {
				for (const attr of attrs) {
					slide.removeAttribute(attr);
				}
			}
			addedSlideAttrs.clear();

			// Remove tabindex added by this module.
			for (const slide of addedTabindex) {
				slide.removeAttribute("tabindex");
			}
			addedTabindex.clear();

			// Remove live region.
			liveRegion.remove();
		},
	};
}
