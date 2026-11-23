/** CSS custom properties cannot be registered with <ratio> syntax. Use the
 * native aspect-ratio parser and resolve CSS math on a non-rendering probe. */
export function watchAspectRatio(deck: HTMLElement): () => void {
	const probe = deck.ownerDocument.createElement("div");
	probe.style.setProperty("display", "none", "important");
	const style = getComputedStyle(deck);
	let frame = 0;
	let previous: string | undefined;
	let simpleValue = "";
	let resolved = "";
	let usesMath = false;

	function update(): void {
		const authored = style.getPropertyValue("--lys-aspect-ratio");
		if (authored !== previous) {
			previous = authored;
			probe.style.aspectRatio = "";
			probe.style.aspectRatio = authored;
			const parsed = probe.style.aspectRatio;
			// Some engines clamp overflowing numeric literals on serialization.
			const literals = authored.match(/(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?/gi) ?? [];
			const finite =
				!/infinity|nan/i.test(parsed) && literals.every((v) => Number.isFinite(Number(v)));
			usesMath = finite && parsed.includes("(");
			if (usesMath) {
				if (!probe.parentNode) deck.append(probe);
			} else {
				probe.remove();
				simpleValue = authored && (!finite || !asPositiveRatio(parsed)) ? "16 / 9" : "";
			}
		}

		const next = usesMath
			? asPositiveRatio(getComputedStyle(probe).aspectRatio) || "16 / 9"
			: simpleValue;
		if (next !== resolved) {
			resolved = next;
			if (next) deck.style.setProperty("--_lys-resolved-ratio", next);
			else deck.style.removeProperty("--_lys-resolved-ratio");
		}
		// The cascade can change without DOM mutation (e.g. media queries or
		// CSSOM). Sample CSS configuration only, never layout or slide content.
		frame = requestAnimationFrame(update);
	}
	update();

	return () => {
		cancelAnimationFrame(frame);
		probe.remove();
		if (resolved) deck.style.removeProperty("--_lys-resolved-ratio");
	};
}

function asPositiveRatio(css: string): string {
	const [width = 0, height = 1] = css.split("/").map(Number);
	const ratio = width / height;
	return width > 0 && height > 0 && ratio > 0 && Number.isFinite(ratio)
		? `${width} / ${height}`
		: "";
}
