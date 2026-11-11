/**
 * Board shake for the heavy multiplier landings (a ×100+ watch). The board,
 * its frame and everything drawn on it move together through BoardContainer;
 * the background and the UI stay still, so the shake reads as an impact on the
 * board, not a camera wobble. Offsets are in board units.
 */
export const boardShake = $state({ x: 0, y: 0, scale: 1, zoom: 1, focusX: 0, focusY: 0, stageX: 0, stageY: 0 });

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
		// the punch stays at its old size (strength 2.3) so a heavier shake does not grow the
		// board over the cast's strip
		boardShake.scale = 1 + 0.035 * Math.min(strength, 2.3) * Math.max(0, 1 - t * 4);
		const s = (now - start) / 1000;
		// sideways the board never travels further than the old strongest shake (2.3), so it stays
		// clear of the cast's strip and the Buy Bonus plate; a heavier hit goes into the vertical
		const side = Math.min(amp, 18 * 2.3 * (1 - t) ** 2);
		boardShake.x = side * Math.sin(s * Math.PI * 2 * 19);
		boardShake.y = amp * 0.9 * Math.sin(s * Math.PI * 2 * 23 + 1.3);
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

let joltRun = 0;

/**
 * The x100 red ball of ATG 戰神賽特 (Stone's clip 11-11, youtu.be/2MAv0nhwCDg at 2:01, measured
 * frame by frame at 24 fps): the WHOLE picture — board, frame, cast and bet bar — is knocked once
 * and is still again 0.17–0.2 s later. No zoom, no long rumble. Offsets as a fraction of the
 * screen height: right, then right-and-down (held), then a rebound up-left, then rest.
 * Game.svelte moves the stage by stageX/stageY; the backdrop counters it so the canvas edge
 * never shows. `height` is the canvas height in px.
 */
const JOLT: [number, number, number][] = [
	[0, 0, 0],
	[0.042, 0.019, 0.003],
	[0.083, 0.024, 0.033],
	[0.125, 0.024, 0.033],
	[0.167, -0.012, -0.028],
	[0.208, 0, 0],
];
export const JOLT_MS = 208;
export const joltScene = (height: number, strength = 1) => {
	if (reduced()) return;
	const id = ++joltRun;
	const start = performance.now();
	const step = (now: number) => {
		if (id !== joltRun) return;
		const t = (now - start) / 1000;
		const last = JOLT[JOLT.length - 1];
		if (t >= last[0]) {
			boardShake.stageX = 0;
			boardShake.stageY = 0;
			return;
		}
		let i = 1;
		while (JOLT[i][0] < t) i++;
		const [fromT, fromX, fromY] = JOLT[i - 1], [toT, toX, toY] = JOLT[i];
		const k = (t - fromT) / (toT - fromT);
		boardShake.stageX = (fromX + (toX - fromX) * k) * height * strength;
		boardShake.stageY = (fromY + (toY - fromY) * k) * height * strength;
		requestAnimationFrame(step);
	};
	requestAnimationFrame(step);
};
