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

	return {
		destroy() {
			container.removeEventListener("keydown", onKeydown);
			container.removeEventListener("touchstart", onTouchStart);
			container.removeEventListener("touchend", onTouchEnd);
			if (addedTabindex) {
				container.removeAttribute("tabindex");
			}
		},
	};
}
