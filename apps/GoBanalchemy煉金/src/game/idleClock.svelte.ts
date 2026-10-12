import { IDLE_PERIOD_MS } from './idleBreathe';

/**
 * One clock for every idling symbol on the board (ported from DeadwoodExpress).
 *
 * Twenty cells each running their own requestAnimationFrame is twenty callbacks
 * a frame for a 1% wobble, and twenty clocks that drift apart — which would
 * quietly destroy the phase offsets the breath depends on. So there is a single
 * loop, reference-counted: it starts when the first symbol idles and stops when
 * the last one stops, so a spinning board pays nothing for it.
 */
export const idleClock = $state({ t: 0 });

// wrapped so the number stays small however long a session runs; a whole
// number of breaths, so the wrap is invisible
const WRAP_MS = IDLE_PERIOD_MS * 1000;

let subscribers = 0;
let raf = 0;

const tick = (now: number) => {
	idleClock.t = now % WRAP_MS;
	raf = requestAnimationFrame(tick);
};

/** Call from an $effect; the returned function unsubscribes. */
export const useIdleClock = () => {
	subscribers += 1;
	if (subscribers === 1) raf = requestAnimationFrame(tick);
	return () => {
		subscribers -= 1;
		if (subscribers === 0) {
			cancelAnimationFrame(raf);
			raf = 0;
		}
	};
};
