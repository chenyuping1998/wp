/**
 * One clock, shared by everything that only needs to know "roughly what time is
 * it" — currently the idle breathing on the forty-nine board symbols.
 *
 * The obvious implementation is a `requestAnimationFrame` loop inside each
 * component. At one symbol that is fine; at a 7x7 board it is forty-nine loops,
 * forty-nine closures and forty-nine independent `$state` writes per frame, all
 * to produce the same number. This hands out that number once.
 *
 * Reference counted, so the loop exists only while something is reading it and a
 * game sitting on a modal is not animating a board nobody can see.
 */
let time = $state(0);

let readers = 0;
let raf = 0;

const tick = (now: number) => {
	// Seconds since the loop started, not since the page loaded: consumers phase
	// off this, and an epoch that starts wherever the tab happened to be would
	// make the board's opening pose different every session.
	time = now / 1000;
	raf = requestAnimationFrame(tick);
};

export const idleClock = {
	get time() {
		return time;
	},

	/**
	 * Call from `onMount` and return the result — Svelte will run it on destroy.
	 *
	 * ```ts
	 * onMount(() => idleClock.acquire());
	 * ```
	 */
	acquire() {
		readers += 1;
		if (readers === 1) raf = requestAnimationFrame(tick);
		return () => {
			readers -= 1;
			if (readers === 0) cancelAnimationFrame(raf);
		};
	},
};
