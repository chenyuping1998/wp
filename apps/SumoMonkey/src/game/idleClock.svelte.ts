import { IDLE_CYCLE_MS } from './symbolIdleMotion';

/**
 * One clock for every idling symbol on the board — one rAF, reference-counted,
 * so a spinning board pays nothing for it and the cells never drift apart.
 * Wrapped on the idle cycle so the number stays small in a long session.
 */
export const idleClock = $state({ t: 0 });

let subscribers = 0;
let raf = 0;

const tick = (now: number) => {
	idleClock.t = now % IDLE_CYCLE_MS;
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
