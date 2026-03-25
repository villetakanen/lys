/** A single initialized slide deck instance. */
export interface LysInstance {
	/** 0-indexed current slide number. -1 if the deck is empty. */
	readonly current: number;
	/** Total number of slides in the deck. */
	readonly total: number;
	/** The currently active slide element, or null if the deck is empty. */
	readonly slide: HTMLElement | null;

	/** Tear down the instance: remove listeners, revert data-class, clear state. */
	destroy(): void;
}

/** Detail payload for the `lys:ready` custom event. */
export interface LysReadyDetail {
	instance: LysInstance;
}

/** Detail payload for the `lys:slidechange` custom event. */
export interface LysSlideChangeDetail {
	from: number;
	to: number;
	slide: HTMLElement;
}

/** Custom event type map for Lys events. */
export interface LysEventMap {
	"lys:ready": CustomEvent<LysReadyDetail>;
	"lys:slidechange": CustomEvent<LysSlideChangeDetail>;
}
