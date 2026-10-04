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
 *   roll    a win amount COUNTING UP: the digits bob in a quick wave running
 *           left to right for as long as the number rolls
 *   land    the count LANDS: a squash into the line, a jelly overshoot and a
 *           sway of the top over the base
 *   stamp   a word SLAMMED onto the board (FullBoard's OVERDRIVE!): a hard
 *           squash on impact, a shock ripple running out from the middle,
 *           and a jelly settle
 *
 * Pure numbers over time, imports nothing, so it can be checked under bare
 * node. Every act is exactly at rest at its own t = 0, so a new kick cannot
 * jump; the wave is the one thing that never rests, and it is continuous.
 */

export type TextEnv = {
	/** ms since a spin was used up, or < 0 */
	spinT?: number;
	/** ms since a retrigger, or < 0 */
	retrigT?: number;
	/** ms since a new rung, or < 0 */
	levelT?: number;
	/** ms since a count started rolling, or < 0 */
	rollT?: number;
	/** ms since the count landed, or < 0 (also ends the roll) */
	landT?: number;
	/** ms since the slam began, or < 0 */
	stampT?: number;
	/** a free-running clock, ms (the idle wave) */
	now: number;
};

/** how much of each act this piece of text plays, 0..1 */
export type TextAct = {
	/** FROSTLINE: every few seconds a cold shiver runs along the word, left to
	 *  right — each column chatters side to side for a moment (the loading
	 *  wordmark's shiver, FrostTitle, on live text) */
	shiver?: number;
	hop: number;
	boing: number;
	wiggle: number;
	wave: number;
	roll?: number;
	land?: number;
	stamp?: number;
};

/** Frostline: a headline that lands and then shivers every few seconds */
export const FROST_BANNER_ACT: TextAct = { hop: 0, boing: 0, wiggle: 0, wave: 0.35, land: 0.7, shiver: 1 };
/** Frostline: a big-win amount — rolls, lands, and shivers while it holds */
export const FROST_AMOUNT_ACT: TextAct = { hop: 0, boing: 0, wiggle: 0, wave: 0, roll: 1, land: 1, shiver: 0.7 };
/** Frostline: the spins awarded, slammed on and then shivering */
export const FROST_POP_ACT: TextAct = { hop: 0, boing: 0, wiggle: 0, wave: 0, stamp: 0.75, land: 0, shiver: 0.8 };

/** the shiver's rhythm: one wave per SHIVER_EVERY, starting SHIVER_FROM in */
const SHIVER_EVERY = 3200;
const SHIVER_FROM = 1400;
const SHIVER_MS = 380;
const SHIVER_CROSS = 320;

export const TITLE_ACT: TextAct = { hop: 0.55, boing: 0.6, wiggle: 0.6, wave: 1 };
export const COUNT_ACT: TextAct = { hop: 1, boing: 1, wiggle: 1, wave: 0 };
/** a win amount: rolls while it counts, lands with a squash */
export const AMOUNT_ACT: TextAct = { hop: 0, boing: 0, wiggle: 0, wave: 0, roll: 1, land: 1 };
/** a headline over a celebration screen: the slow wave, a landing on show */
export const BANNER_ACT: TextAct = { hop: 0, boing: 0, wiggle: 0, wave: 0.8, land: 0.6 };
/** a big number popped onto a screen (spins awarded) */
export const POP_ACT: TextAct = { hop: 0, boing: 0, wiggle: 0, wave: 0, stamp: 0.7, land: 0 };
/** a label that changes in place (WinWays' "N WAYS"): the hop on each change */
export const LABEL_ACT: TextAct = { hop: 0.8, boing: 0, wiggle: 0, wave: 0 };
/** a title that idles in a neon wave and lands once (the loading screen) */
export const TITLE_IDLE_ACT: TextAct = { hop: 0, boing: 0.5, wiggle: 0, wave: 0.7 };
/** the board-wide slam (FullBoard) */
export const STAMP_ACT: TextAct = { hop: 0, boing: 0, wiggle: 0, wave: 0, stamp: 1 };

/** when a slam hits, ms after stampT = 0: FullBoard's scale reaches its floor here */
export const STAMP_IMPACT_MS = 170;

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
	const spinT = env.spinT ?? -1;
	const retrigT = env.retrigT ?? -1;
	const levelT = env.levelT ?? -1;
	if (spinT >= 0 && act.hop > 0) {
		const t = spinT - u * RIPPLE_MS;
		lift = bump(t, 0, LIFT_MS);
		const land = bump(t, LIFT_MS - 30, LIFT_MS - 30 + LAND_MS);
		sy *= 1 + act.hop * (0.12 * lift - 0.16 * land);
	}

	// BOING: the whole word, stretched up and wobbling
	let sx = 1;
	let shear = 0;
	if (retrigT >= 0 && act.boing > 0) {
		const b = flick(retrigT, 0, 3.2, 3.6);
		sy *= 1 + act.boing * 0.3 * b;
		sx *= 1 - act.boing * 0.16 * b;
		shear += act.boing * 0.14 * flick(retrigT, 90, 4.2, 4.2);
	}

	// WIGGLE: a shiver
	if (levelT >= 0 && act.wiggle > 0) {
		shear += act.wiggle * 0.07 * flick(levelT, 0, 9, 6);
	}

	// LAND: the count stops — squash first (the spring starts DOWN), then a
	// jelly overshoot, the width giving where the height takes
	const landT = env.landT ?? -1;
	const land = act.land ?? 0;
	if (landT >= 0 && land > 0) {
		const b = flick(landT, 0, 3.6, 4.6);
		sy *= 1 - land * 0.22 * b;
		sx *= 1 + land * 0.12 * b;
		shear += land * 0.06 * flick(landT, 110, 4.8, 5);
	}

	// STAMP: the slam lands at STAMP_IMPACT_MS — a hard squash, a ripple
	// running out from the middle to both ends, a jelly settle
	const stampT = env.stampT ?? -1;
	const stamp = act.stamp ?? 0;
	let shock = 0;
	if (stampT >= 0 && stamp > 0) {
		const b = flick(stampT, STAMP_IMPACT_MS, 3.4, 4.2);
		sy *= 1 - stamp * 0.3 * b;
		sx *= 1 + stamp * 0.16 * b;
		const tt = stampT - STAMP_IMPACT_MS - Math.abs(u - 0.5) * 2 * 180;
		shock = stamp * bump(tt, 0, 220);
	}

	// squash and stretch about the base, then the column's own lift
	y = h - fromBase * sy - act.hop * 0.24 * h * lift - 0.16 * h * shock;
	x = w / 2 + (x - w / 2) * sx;
	// the top sways over the base (a shear, so the base line never moves)
	x += shear * h * (1 - v);

	// WAVE: the title's idle swell, travelling left to right
	if (act.wave > 0) {
		y += act.wave * 0.05 * h * Math.sin(env.now / 260 - u * 7) * clamp01(env.now / 600);
	}

	// SHIVER: the cold chatter, a column at a time — the top shakes over the
	// base (a shear, so the line stays put), dying away; at rest outside it
	const shiver = act.shiver ?? 0;
	if (shiver > 0 && env.now > SHIVER_FROM) {
		const cycle = (env.now - SHIVER_FROM) % SHIVER_EVERY;
		const t = cycle - u * SHIVER_CROSS;
		if (t > 0 && t < SHIVER_MS) {
			const a = t / SHIVER_MS;
			const chatter = Math.sin(2 * Math.PI * a * 6) * (1 - a);
			x += shiver * 0.05 * h * chatter * (1 - v * 0.7);
			y -= shiver * 0.03 * h * Math.sin(Math.PI * a) * (1 - v);
		}
	}

	// ROLL: while the count rolls, a quick bob runs through the digits; it
	// eases in from the roll's start and out over the landing, so it is at rest
	// at both ends
	const rollT = env.rollT ?? -1;
	const roll = act.roll ?? 0;
	if (rollT >= 0 && roll > 0) {
		const amp = clamp01(rollT / 200) * (landT >= 0 ? 1 - clamp01(landT / 160) : 1);
		y -= roll * 0.07 * h * amp * Math.max(0, Math.sin(rollT / 85 - u * 9)) * (1 - v * 0.4);
	}
	return [x, y];
};
