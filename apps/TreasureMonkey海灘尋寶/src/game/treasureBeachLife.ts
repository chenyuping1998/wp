/** Life over the beach plate that does not bend: a few gulls crossing the sky
 * now and then, and the lighthouse lamp warming on a slow beat. Drawn in
 * bg_base.jpg px into one Graphics above the wind props. Long rests between
 * events (motion-restraint): the sky is empty most of the time.
 *
 * The flock crosses the middle of the plate too, because a portrait phone
 * only sees x ~650-1270 of it.
 */
import type { Graphics } from 'pixi.js';

const smooth = (u: number) => {
	u = Math.max(0, Math.min(1, u));
	return u * u * (3 - 2 * u);
};

export const GULL_EVERY = 15000;
const GULL_FIRST = 2600;
const GULL_CROSS = 10500;
// [delay ms, height offset px, size, flap phase]: a loose V that does not stay
// in formation
const FLOCK = [
	[0, 0, 1, 0],
	[420, 26, 0.82, 1.7],
	[780, -18, 0.9, 3.1],
] as const;

/** wing lift -1..1: three beats, then a glide with the wings held up */
const wingAt = (t: number, phase: number) => {
	const cycle = (t + phase * 300) % 2300;
	if (cycle < 1500) return Math.sin((cycle / 500) * Math.PI * 2);
	return 0.55 * (1 - smooth((cycle - 1500) / 800)) + 0.3;
};

const gull = (g: Graphics, x: number, y: number, size: number, wing: number) => {
	const span = 17 * size,
		tip = -wing * 9 * size,
		elbow = -wing * 4 * size - 5 * size;
	g.moveTo(x - span, y + tip)
		.quadraticCurveTo(x - span * 0.45, y + elbow, x, y)
		.quadraticCurveTo(x + span * 0.45, y + elbow, x + span, y + tip)
		.stroke({ color: 0x324552, width: 3.2 * size, alpha: 0.8, cap: 'round', join: 'round' });
};

const LAMP = { x: 275, y: 147 };
const BEACON_EVERY = 6200;

export function drawBeachLife(g: Graphics, time: number, calm = false) {
	g.clear();
	if (calm) return;
	// the beacon: warms up, holds, fades — light on the painted lamp
	const b = ((time % BEACON_EVERY) + BEACON_EVERY) % BEACON_EVERY;
	const beam = b < 1600 ? Math.sin((b / 1600) * Math.PI) ** 2 : 0;
	if (beam > 0.01)
		for (let i = 0; i < 6; i++) g.circle(LAMP.x, LAMP.y, 7 + i * 6).fill({ color: 0xfff1c0, alpha: 0.07 * beam * (1 - i / 7) });
	// the gulls
	const local = time - GULL_FIRST;
	if (local < 0) return;
	const k = local % GULL_EVERY;
	for (const [delay, dy, size, phase] of FLOCK) {
		const u = (k - delay) / GULL_CROSS;
		if (u <= 0 || u >= 1) continue;
		const x = 2000 - 2150 * u;
		const y = 92 + dy + 22 * Math.sin(u * Math.PI * 2.3 + phase) + 30 * u;
		gull(g, x, y, size, wingAt(k - delay, phase));
	}
}
