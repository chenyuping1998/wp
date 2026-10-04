/**
 * TYPE ON A DEFORMING GRID — the FG counter's title and count (TextMesh.svelte).
 *
 * The counter's words and numbers are live text, not art, so they could only
 * ever move as one flat card. TextMesh renders the text to a texture off
 * screen and draws it through a grid; this file says where each grid point
 * goes. So the letters can move ONE AFTER ANOTHER, and squash and stretch:
 *
 *   hop     a spin is used up: a ripple runs left to right, each column of the
 *           text springing up and squashing as it lands — the digits hop in
 *           turn as the new number arrives
 *   boing   a RETRIGGER: the whole word stretches up tall, overshoots into a
 *           squash and wobbles like jelly, the top swaying over the base
 *   wiggle  a new Overdrive rung: a quick shiver
 *   wave    the title's idle: a slow neon wave travelling through the letters
 *
 * Pure numbers over time, imports nothing, so it can be checked under bare
 * node. Every act is exactly at rest at its own t = 0, so a new kick cannot
 * jump; the wave is the one thing that never rests, and it is continuous.
 */

export type TextEnv = {
	/** ms since a spin was used up, or < 0 */
	spinT: number;
	/** ms since a retrigger, or < 0 */
	retrigT: number;
	/** ms since a new rung, or < 0 */
	levelT: number;
	/** a free-running clock, ms (the idle wave) */
	now: number;
};

/** how much of each act this piece of text plays, 0..1 */
export type TextAct = { hop: number; boing: number; wiggle: number; wave: number };

export const TITLE_ACT: TextAct = { hop: 0.55, boing: 0.6, wiggle: 0.6, wave: 1 };
export const COUNT_ACT: TextAct = { hop: 1, boing: 1, wiggle: 1, wave: 0 };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 0 -> 1 -> 0 over [a, b] */
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));
/** a damped spring kicked at t0, starting at 0 going up */
const flick = (t: number, t0: number, hz: number, decay: number) =>
	t < t0 ? 0 : Math.exp((-decay * (t - t0)) / 1000) * Math.sin((2 * Math.PI * hz * (t - t0)) / 1000);

// the hop's ripple: how long it takes to cross the text, and one column's beat
const RIPPLE_MS = 240;
const LIFT_MS = 260;
const LAND_MS = 130;

/**
 * Where the grid point at (u, v) of a w x h text box goes, in the box's own
 * pixels (0..w, 0..h, y down). u runs left to right, v top to bottom; the
 * squashes are about the bottom (v = 1), so the text stays sat on its line.
 */
export const deformText = (u: number, v: number, w: number, h: number, env: TextEnv, act: TextAct): [number, number] => {
	let x = u * w;
	let y = v * h;
	const fromBase = h - y; // distance above the base line

	// HOP: this column's own moment in the ripple
	let lift = 0;
	let sy = 1;
	if (env.spinT >= 0 && act.hop > 0) {
		const t = env.spinT - u * RIPPLE_MS;
		lift = bump(t, 0, LIFT_MS);
		const land = bump(t, LIFT_MS - 30, LIFT_MS - 30 + LAND_MS);
		sy *= 1 + act.hop * (0.12 * lift - 0.16 * land);
	}

	// BOING: the whole word, stretched up and wobbling
	let sx = 1;
	let shear = 0;
	if (env.retrigT >= 0 && act.boing > 0) {
		const b = flick(env.retrigT, 0, 3.2, 3.6);
		sy *= 1 + act.boing * 0.3 * b;
		sx *= 1 - act.boing * 0.16 * b;
		shear += act.boing * 0.14 * flick(env.retrigT, 90, 4.2, 4.2);
	}

	// WIGGLE: a shiver
	if (env.levelT >= 0 && act.wiggle > 0) {
		shear += act.wiggle * 0.07 * flick(env.levelT, 0, 9, 6);
	}

	// squash and stretch about the base, then the column's own lift
	y = h - fromBase * sy - act.hop * 0.24 * h * lift;
	x = w / 2 + (x - w / 2) * sx;
	// the top sways over the base (a shear, so the base line never moves)
	x += shear * h * (1 - v);

	// WAVE: the title's idle swell, travelling left to right
	if (act.wave > 0) {
		y += act.wave * 0.05 * h * Math.sin(env.now / 260 - u * 7) * clamp01(env.now / 600);
	}
	return [x, y];
};
