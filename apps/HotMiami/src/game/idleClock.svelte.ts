import { IDLE_WRAP_MS } from './idleSway';

/**
 * One clock for every idling symbol on the board.
 *
 * Twenty cells each running their own requestAnimationFrame is twenty callbacks
 * a frame to produce a 1% wobble, and — worse — twenty clocks that drift apart,
 * which would quietly destroy the phase offsets the breath depends on. So there
 * is a single loop, reference-counted: it starts when the first symbol idles and
 * stops when the last one stops, so a spinning board pays nothing for it.
 */
export const idleClock = $state({ t: 0 });

let subscribers = 0;
let raf = 0;

const tick = (now: number) => {
	// Wrapped so the number stays small however long a session runs; sin() is
	// periodic, so the pose is identical either way.
	//
	// The wrap is a common multiple of EVERY loop on this clock — the 2.6s
	// ambient breath and the two characters' 5s and 8s sway loops — not the
	// breath's own period, which is what it used to be. A wrap that is not a
	// whole number of a loop makes that loop jump at every wrap; at 2600 the two
	// characters would have snapped to a new pose every 2.6 seconds.
	// design/check_idle_sway.mjs asserts the divisibility.
	idleClock.t = now % IDLE_WRAP_MS;
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
