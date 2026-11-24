import type { LysInstance } from "./types.js";

/** Handle returned by setupNavigation for cleanup. */
export interface NavigationHandle {
	destroy(): void;
}

const INTERACTIVE = "input,textarea,select,button,[contenteditable],[role='textbox']";

/** Attach keyboard, touch, and hash navigation to a Lys instance. */
export function setupNavigation(instance: LysInstance, container: HTMLElement): NavigationHandle {
	// Ensure the container is focusable for keyboard events.
	const addedTabindex = !container.hasAttribute("tabindex");
	if (addedTabindex) {
		container.setAttribute("tabindex", "0");
	}

	function onKeydown(e: KeyboardEvent): void {
		// Ignore modified keys (preserve browser shortcuts).
		if (e.ctrlKey || e.altKey || e.metaKey) return;

		switch (e.key) {
			case "ArrowRight":
			case "ArrowDown":
				instance.next();
				e.preventDefault();
				break;
			case "ArrowLeft":
			case "ArrowUp":
				instance.prev();
				e.preventDefault();
				break;
			case " ":
				// Don't capture Space when an interactive element is focused.
				if ((e.target as Element).closest(INTERACTIVE)) return;
				if (e.shiftKey) {
					instance.prev();
				} else {
					instance.next();
				}
				e.preventDefault();
				break;
			case "Home":
				instance.goTo(0);
				e.preventDefault();
				break;
			case "End":
				instance.goTo(instance.total - 1);
				e.preventDefault();
				break;
		}
	}

	container.addEventListener("keydown", onKeydown);

	// Touch / swipe navigation.
	const SWIPE_THRESHOLD = 50;
	let startX = 0;
	let startY = 0;

	function onTouchStart(e: TouchEvent): void {
		const touch = e.touches[0];
		if (touch) {
			startX = touch.clientX;
			startY = touch.clientY;
		}
	}

	function onTouchEnd(e: TouchEvent): void {
		const touch = e.changedTouches[0];
		if (!touch) return;
		const deltaX = touch.clientX - startX;
		const deltaY = touch.clientY - startY;
		if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
			if (deltaX < 0) {
				instance.next();
			} else {
				instance.prev();
			}
		}
	}

	container.addEventListener("touchstart", onTouchStart, { passive: true });
	container.addEventListener("touchend", onTouchEnd, { passive: true });

	// Hash routing.
	function parseSlideHash(hash: string): number | string | null {
		const match = hash.match(/^#slide=(.+)$/);
		if (!match?.[1]) return slideForFragment(hash);
		const val = match[1];
		const num = Number(val);
		return Number.isFinite(num) ? num - 1 : val; // 1-based to 0-based for numbers
	}

	/** A native fragment selects the slide that is or contains its target. */
	function slideForFragment(hash: string): number | null {
		if (hash.length < 2) return null;
		let id: string;
		try {
			id = decodeURIComponent(hash.slice(1));
		} catch {
			return null;
		}
		const target = document.getElementById(id);
		if (!target || !container.contains(target)) return null;
		const slides = Array.from(container.querySelectorAll<HTMLElement>(":scope > article"));
		const index = slides.findIndex((slide) => slide.contains(target));
		return index === -1 ? null : index;
	}

	function onSlideChange(e: Event): void {
		const detail = (e as CustomEvent).detail;
		const slide = detail.slide as HTMLElement;
		const hashVal = slide.id || String(detail.to + 1); // 1-based
		history.replaceState(null, "", `#slide=${hashVal}`);
	}

	function onHashChange(): void {
		const target = parseSlideHash(location.hash);
		if (target !== null) {
			instance.goTo(target);
		}
	}

	container.addEventListener("lys:slidechange", onSlideChange);
	window.addEventListener("hashchange", onHashChange);

	// Navigate to initial hash if present.
	const initialTarget = parseSlideHash(location.hash);
	if (initialTarget !== null) {
		instance.goTo(initialTarget);
	}

	// Auto-focus the container if it's the only deck on the page,
	// so keyboard navigation works immediately without clicking.
	if (document.querySelectorAll("[data-lys]").length === 1) {
		container.focus({ preventScroll: true });
	}

	return {
		destroy() {
			container.removeEventListener("keydown", onKeydown);
			container.removeEventListener("touchstart", onTouchStart);
			container.removeEventListener("touchend", onTouchEnd);
			container.removeEventListener("lys:slidechange", onSlideChange);
			window.removeEventListener("hashchange", onHashChange);
			if (addedTabindex) {
				container.removeAttribute("tabindex");
			}
		},
	};
}
