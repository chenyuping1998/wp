/**
 * Board shake for the heavy multiplier landings (a ×100+ watch). The board,
 * its frame and everything drawn on it move together through BoardContainer;
 * the background and the UI stay still, so the shake reads as an impact on the
 * board, not a camera wobble. Offsets are in board units.
 */
export const boardShake = $state({ x: 0, y: 0, scale: 1 });

let run = 0;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** strength 1 ≈ 18 board px at the first frame, decaying over `ms`, with a short scale punch. */
export const shakeBoard = (strength = 1, ms = 640) => {
	if (reduced()) return;
	const id = ++run;
	const start = performance.now();
	const step = (now: number) => {
		if (id !== run) return;
		const t = (now - start) / ms;
		if (t >= 1) {
			boardShake.x = 0;
			boardShake.y = 0;
			boardShake.scale = 1;
			return;
		}
		const amp = 18 * strength * (1 - t) ** 2;
		boardShake.scale = 1 + 0.035 * strength * Math.max(0, 1 - t * 4);
		const s = (now - start) / 1000;
		boardShake.x = amp * Math.sin(s * Math.PI * 2 * 19);
		boardShake.y = amp * 0.75 * Math.sin(s * Math.PI * 2 * 23 + 1.3);
		requestAnimationFrame(step);
	};
	requestAnimationFrame(step);
};
