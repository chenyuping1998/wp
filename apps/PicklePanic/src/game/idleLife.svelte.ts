/**
 * Life on a settled board (review 2026-10-22, 5.7/9, "Poor animations").
 *
 * Between spins the board is what the player looks at most, and it was frozen:
 * only the backdrop panned and the cook breathed. Two things now run off one
 * shared clock:
 *
 *   breath   every resting symbol swells ~1% on a 2.0 s cycle (the same period
 *            as the cast idle and Iron Jaw's measured loop), phase-offset by
 *            cell so the grid never pulses as one block
 *   fidget   every 2.5-4 s ONE premium or special symbol plays a small version
 *            of its own win performance (LayeredSymbol mode="idle"), so the eye
 *            catches something moving without the board ever looking busy
 *
 * Both stop while a win is being presented (winLitCells), so they never compete
 * with the thing that matters.
 */
import { stateGame } from './stateGame.svelte';

export const IDLE_PERIOD = 2.0;
export const FIDGET_NAMES = new Set(['H1', 'H2', 'H3', 'H4', 'W', 'S', 'P']);

export const idleLife = $state({ t: 0, featured: '' as string });

const candidates = new Set<string>();
let nextAt = 2.5;

export const registerIdle = (id: string) => {
	candidates.add(id);
	return () => {
		candidates.delete(id);
		if (idleLife.featured === id) idleLife.featured = '';
	};
};

export const fidgetDone = (id: string) => {
	if (idleLife.featured === id) idleLife.featured = '';
};

if (typeof window !== 'undefined') {
	let last = performance.now();
	const tick = (now: number) => {
		// capped, so a backgrounded tab does not come back with a jump
		const dt = Math.min(now - last, 100) / 1000;
		last = now;
		idleLife.t += dt;
		const presenting = !!stateGame.winLitCells;
		if (presenting) {
			idleLife.featured = '';
			nextAt = idleLife.t + 1.5;
		} else if (!idleLife.featured && idleLife.t >= nextAt && candidates.size) {
			const pool = [...candidates];
			idleLife.featured = pool[Math.floor(Math.random() * pool.length)];
			nextAt = idleLife.t + 2.5 + Math.random() * 1.5;
		}
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
}
