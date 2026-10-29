/**
 * Board shake for the heavy multiplier landings (a ×100+ watch). The board,
 * its frame and everything drawn on it move together through BoardContainer;
 * the background and the UI stay still, so the shake reads as an impact on the
 * board, not a camera wobble. Offsets are in board units.
 */
export const boardShake = $state({ x: 0, y: 0, scale: 1, zoom: 1, focusX: 0, focusY: 0 });

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

let zoomRun = 0;

/**
 * Push in on a board point (ATG 戰神賽特 x100 study): a fast zoom toward the
 * impact, a short hold, then an ease back. BoardContainer keeps the focus point
 * near where it was, so the camera seems to lunge at it. Board units.
 */
export const zoomBoard = (focus: { x: number; y: number }, amount = 0.14, ms = 1000) => {
	if (reduced()) return;
	const id = ++zoomRun;
	const start = performance.now();
	boardShake.focusX = focus.x;
	boardShake.focusY = focus.y;
	const step = (now: number) => {
		if (id !== zoomRun) return;
		const t = (now - start) / ms;
		if (t >= 1) {
			boardShake.zoom = 1;
			return;
		}
		// in over the first 12%, hold to 45%, ease out
		const k = t < 0.12 ? 1 - (1 - t / 0.12) ** 3 : t < 0.45 ? 1 : (1 - (t - 0.45) / 0.55) ** 2;
		boardShake.zoom = 1 + amount * k;
		requestAnimationFrame(step);
	};
	requestAnimationFrame(step);
};
