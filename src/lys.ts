import "./lys.css";
import type { LysInstance, LysReadyDetail } from "./types.js";

/** Registry of initialized containers to instances (for idempotency). */
const registry = new WeakMap<HTMLElement, Lys>();

/**
 * Lys — structural slide engine.
 *
 * Each instance manages a single `[data-lys]` container.
 * Use `Lys.from(container)` or `Lys.init()` to create instances.
 */
export class Lys implements LysInstance {
	readonly #container: HTMLElement;
	#slides: HTMLElement[] = [];
	#current = -1;
	#classMap = new Map<HTMLElement, string[]>();

	/** Discover and initialize all `[data-lys]` containers in the document. */
	static init(): Lys[] {
		const containers = document.querySelectorAll<HTMLElement>("[data-lys]");
		return Array.from(containers, (el) => Lys.from(el));
	}

	/** Get or create an instance for a container. Idempotent. */
	static from(container: HTMLElement): Lys {
		const existing = registry.get(container);
		if (existing) {
			return existing;
		}
		return new Lys(container);
	}

	constructor(container: HTMLElement) {
		// If this container already has an instance, destroy it first.
		const existing = registry.get(container);
		if (existing) {
			existing.destroy();
		}

		this.#container = container;
		this.#slides = Array.from(container.querySelectorAll<HTMLElement>(":scope > article"));
		this.#current = this.#slides.length > 0 ? 0 : -1;

		// Apply data-class attributes.
		for (const slide of this.#slides) {
			const dataClass = slide.dataset.class;
			if (dataClass) {
				const classes = dataClass.split(/\s+/).filter(Boolean);
				slide.classList.add(...classes);
				this.#classMap.set(slide, classes);
			}
		}

		// Apply data-background via JS (CSS attr() type support is limited).
		for (const slide of this.#slides) {
			const bg = slide.dataset.background;
			if (bg) {
				slide.style.background = bg;
			}
		}

		registry.set(container, this);

		// Dispatch lys:ready.
		container.dispatchEvent(
			new CustomEvent<LysReadyDetail>("lys:ready", {
				detail: { instance: this },
				bubbles: true,
			}),
		);
	}

	get current(): number {
		return this.#current;
	}

	get total(): number {
		return this.#slides.length;
	}

	get slide(): HTMLElement | null {
		return this.#slides[this.#current] ?? null;
	}

	destroy(): void {
		// Revert data-class additions.
		for (const [slide, classes] of this.#classMap) {
			slide.classList.remove(...classes);
		}
		this.#classMap.clear();

		// Revert data-background inline styles.
		for (const slide of this.#slides) {
			if (slide.dataset.background) {
				slide.style.background = "";
			}
		}

		this.#slides = [];
		this.#current = -1;

		registry.delete(this.#container);
	}
}

// IIFE auto-init: run on DOMContentLoaded if the document isn't already loaded.
if (typeof document !== "undefined") {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => Lys.init(), {
			once: true,
		});
	} else {
		// Already loaded (e.g., script at end of body or deferred).
		Lys.init();
	}
}
