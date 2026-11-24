import { type A11yHandle, setupA11y } from "./a11y.js";
import "./lys.css";
import { type NavHandle, setupNav } from "./nav.js";
import { type NavigationHandle, setupNavigation } from "./navigation.js";
import { watchAspectRatio } from "./surface.js";
import type { LysInstance, LysReadyDetail, LysSlideChangeDetail } from "./types.js";

const FRAME_MOTION = new Set(["--_lys-alpha", "--_lys-offset"]);

/** Browsers may keep a transition running after its property leaves
 * `transition`; end the engine's frame transitions on this article only. */
function stopFrameMotion(slide: HTMLElement): void {
	if (typeof CSSTransition === "undefined") return;
	for (const animation of slide.getAnimations?.() ?? []) {
		if (animation instanceof CSSTransition && FRAME_MOTION.has(animation.transitionProperty)) {
			animation.cancel();
		}
	}
}

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
	#readyFrame = 0;
	#stopWatchingRatio: (() => void) | undefined;
	#navigation: NavigationHandle | null = null;
	#a11y: A11yHandle | null = null;
	#nav: NavHandle | null = null;

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

		// Set initial state attributes.
		if (this.#current >= 0) {
			this.#slides[this.#current]?.setAttribute("data-lys-active", "");
			container.setAttribute("data-lys-current", String(this.#current));
			this.#stopWatchingRatio = watchAspectRatio(container);
		}

		registry.set(container, this);
		this.#navigation = setupNavigation(this, container);
		this.#a11y = setupA11y(container, this.#slides, this.#current);
		this.#nav = setupNav(container, this.#slides, this.#current);

		// Dispatch lys:ready.
		container.dispatchEvent(
			new CustomEvent<LysReadyDetail>("lys:ready", {
				detail: { instance: this },
				bubbles: true,
			}),
		);

		// Enable transitions after first paint — prevents FOUC (#22).
		this.#readyFrame = requestAnimationFrame(() => {
			container.setAttribute("data-lys-ready", "");
			this.#readyFrame = 0;
		});
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

	next(): void {
		this.goTo(this.#current + 1);
	}

	prev(): void {
		this.goTo(this.#current - 1);
	}

	goTo(target: number | string): void {
		if (this.#slides.length === 0) return;

		let index: number;
		if (typeof target === "string") {
			index = this.#slides.findIndex((s) => s.id === target);
			if (index === -1) return;
		} else {
			index = Math.max(0, Math.min(target, this.#slides.length - 1));
		}

		if (index === this.#current) return;

		const from = this.#current;
		const prevSlide = this.#slides[this.#current];
		const nextSlide = this.#slides[index];
		if (!nextSlide) return;

		// Update selection. Only the outgoing and selected frames animate (CSS);
		// any earlier outgoing frame stops at once, so a new request retargets.
		for (const slide of this.#slides) {
			if (slide.hasAttribute("data-lys-leaving")) {
				slide.removeAttribute("data-lys-leaving");
				// Returning to the outgoing frame reverses its motion smoothly.
				if (slide !== nextSlide) stopFrameMotion(slide);
			}
		}
		prevSlide?.removeAttribute("data-lys-active");
		// Initial selection (e.g. a fragment load) happens before ready: no motion.
		if (this.#container.hasAttribute("data-lys-ready")) {
			prevSlide?.setAttribute("data-lys-leaving", "");
		}
		this.#current = index;
		nextSlide.setAttribute("data-lys-active", "");
		this.#container.setAttribute("data-lys-current", String(this.#current));

		// Dispatch slidechange event.
		this.#container.dispatchEvent(
			new CustomEvent<LysSlideChangeDetail>("lys:slidechange", {
				detail: { from, to: this.#current, slide: nextSlide },
				bubbles: true,
			}),
		);
	}

	destroy(): void {
		// Cancel pending ready frame if destroy() is called before first paint.
		if (this.#readyFrame) {
			cancelAnimationFrame(this.#readyFrame);
			this.#readyFrame = 0;
		}

		// Tear down a11y and navigation listeners.
		this.#a11y?.destroy();
		this.#a11y = null;
		this.#navigation?.destroy();
		this.#navigation = null;
		this.#nav?.destroy();
		this.#nav = null;

		this.#stopWatchingRatio?.();
		this.#stopWatchingRatio = undefined;

		// Remove state attributes.
		for (const slide of this.#slides) {
			slide.removeAttribute("data-lys-active");
			slide.removeAttribute("data-lys-leaving");
		}
		this.#container.removeAttribute("data-lys-current");
		this.#container.removeAttribute("data-lys-ready");

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
