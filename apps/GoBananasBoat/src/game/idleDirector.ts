/**
 * THE IDLE DIRECTOR: who on a settled board does a little something, and when
 * (the acts are game/meshWin/idles.ts).
 *
 * Every cell that is standing still and has an idle act REGISTERS itself here
 * (SymbolSprite) and unregisters the moment it spins, lands or acts. So the
 * register is, by construction, the settled board — nothing has to ask the
 * reels what they are doing.
 *
 * The director waits for the board to have been quiet for QUIET_MS — nothing
 * joining or leaving the register, no win presentation running — then every
 * GAP_MS (randomised) picks one cell, weighted toward the specials, never the
 * same cell twice running; and now and then a second cell straight after, so
 * it reads as one symbol setting off another rather than as a timer.
 */
type Cell = { name: string; play: () => boolean };

const QUIET_MS = 1600;
const GAP_MS: [number, number] = [1900, 4200];
const ECHO_CHANCE = 0.35;
const ECHO_MS: [number, number] = [260, 520];

const cells = new Set<Cell>();
let changedAt = 0;
let presenting = false;
let last: Cell | null = null;

const now = () => performance.now();
const between = ([a, b]: [number, number]) => a + Math.random() * (b - a);

export const idleCells = {
	/** a settled cell that can act; returns its unregister */
	add(cell: Cell) {
		cells.add(cell);
		changedAt = now();
		return () => {
			cells.delete(cell);
			changedAt = now();
		};
	},
	/** a win presentation is on the board: nobody idles under it */
	setPresenting(on: boolean) {
		presenting = on;
		changedAt = now();
	},
};

const pick = (weights: Record<string, number>, not: Cell | null) => {
	const pool = [...cells].filter((c) => c !== not && (weights[c.name] ?? 0) > 0);
	let total = 0;
	for (const c of pool) total += weights[c.name];
	let r = Math.random() * total;
	for (const c of pool) {
		r -= weights[c.name];
		if (r <= 0) return c;
	}
	return pool[pool.length - 1] ?? null;
};

/** runs until the returned stop is called */
export const startIdleDirector = (weights: Record<string, number>) => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let stopped = false;
	const play = (not: Cell | null) => {
		const cell = pick(weights, not);
		if (cell && cell.play()) last = cell;
		return cell;
	};
	const tick = () => {
		if (stopped) return;
		const quiet = !presenting && now() - changedAt > QUIET_MS && cells.size > 0;
		if (quiet) {
			const first = play(last);
			if (first && Math.random() < ECHO_CHANCE) {
				setTimeout(() => {
					if (!stopped && !presenting) play(first);
				}, between(ECHO_MS));
			}
		}
		// re-check soon while the board is not quiet yet, at the gap once it is
		timer = setTimeout(tick, quiet ? between(GAP_MS) : 400);
	};
	timer = setTimeout(tick, between(GAP_MS));
	return () => {
		stopped = true;
		clearTimeout(timer);
	};
};
