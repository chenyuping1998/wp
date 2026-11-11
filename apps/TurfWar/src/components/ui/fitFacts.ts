/**
 * Keeps every value in the rules header's fact plates inside its plate.
 *
 * Stake review 2026-11-11 (desktop, popout S, mobile 375×667): the RTP range
 * "96.01%–96.05%" ran past its plate and over the plate's border at a fixed
 * 1rem in the title face. The plates are a quarter of the panel each, so their
 * width follows the window, and a fixed size can only fit one window.
 *
 * This measures each value against its plate's inner width and sets one shared
 * size on the list (`--fact-size`) — the four values stay the same size, the
 * largest that fits the widest of them. When that would drop below READABLE,
 * the list gets `wp-facts--stack` instead, which breaks the RTP range after its
 * dash onto two lines, and the size is measured again. Re-runs on resize and
 * once the title font has loaded (its metrics differ from the fallback's).
 */
const MAX_REM = 1;
const MIN_REM = 0.62;
const READABLE_REM = 0.8;
const SAFETY = 0.92; // keep clear of the plate's drawn rim
// The caption under each value (GRID, PAYLINES, …) is sized the same way on its
// own scale: German "Maximalgewinn" ran over its plate on a 375 px phone.
// Captions wrap between words, so this only bites when ONE word is too wide —
// scrollWidth of a wrapping span is its longest unbreakable run.
const LABEL_MAX_REM = 0.66;
const LABEL_MIN_REM = 0.45;

export const fitFacts = (list: HTMLElement) => {
	const measure = (selector: string) => {
		let scale = 1;
		for (const li of Array.from(list.children) as HTMLElement[]) {
			const value = li.querySelector(selector) as HTMLElement | null;
			if (!value) continue;
			const cs = getComputedStyle(li);
			const room = li.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
			const need = value.scrollWidth;
			if (room > 0 && need > 0) scale = Math.min(scale, (room * SAFETY) / need);
		}
		return scale;
	};

	const run = () => {
		if (list.clientWidth === 0) return;
		list.classList.remove('wp-facts--stack');
		list.style.setProperty('--fact-size', `${MAX_REM}rem`);
		list.style.setProperty('--fact-label-size', `${LABEL_MAX_REM}rem`);
		let size = MAX_REM * measure(':scope > b');
		if (size < READABLE_REM) {
			list.classList.add('wp-facts--stack');
			size = MAX_REM * measure(':scope > b');
		}
		list.style.setProperty('--fact-size', `${Math.max(MIN_REM, Math.min(MAX_REM, size))}rem`);
		const label = LABEL_MAX_REM * measure(':scope > span');
		list.style.setProperty('--fact-label-size', `${Math.max(LABEL_MIN_REM, Math.min(LABEL_MAX_REM, label))}rem`);
	};

	run();
	const observer = new ResizeObserver(() => run());
	observer.observe(list);
	document.fonts?.ready.then(run).catch(() => {});

	return {
		destroy() {
			observer.disconnect();
		},
	};
};
