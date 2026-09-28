/**
 * L1-L5 — THE STENCILLED LETTERS, A K Q J 10.
 *
 * On GoBananubis the letters are carved INTO the stone and run in panel mode.
 * Here they are cream SPRAY PAINT on corrugated steel, so they are CUT off the
 * panel like the high pays (design/make_symbol_layers.mjs says why: a panel
 * mesh would bend the steel's ribs) and they hop OFF it, with a drop shadow on
 * the steel under them.
 *
 * Low pays win on most spins, so they get a lighter, shorter beat than the
 * high pays — a small hop — and each letter one gesture of its own, taken from
 * its shape: the A's legs splay like a jumping jack, the K kicks, the Q flicks
 * its tail, the J's hook swings, the 1 and the 0 hop in turn. The acting is
 * Bubis's letters', moved from the panel bone onto the rigid move, which a
 * cut subject is free to use.
 */
import {
	bump,
	flick,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Pose,
	type Rig,
} from './meshRig';

const T = { crouch: 100, rise: 300, fall: 900, land: 1060, done: 1200 };
const FEET = 208;

/**
 * EACH LETTER HOPS IN ITS OWN CHARACTER. They all used to share one beat —
 * same crouch, same 9.3px, same frame — and a row of letters winning together
 * went up and down like one stamp. Now each has a personality, from its shape:
 *
 *   rise    ms from the end of the crouch to the top: how snappy
 *   lift    how high, against the shared 6px (the tallest letters stay low —
 *           above ~6.5px a top came within a rib of the tile's edge)
 *   squash  how hard it compresses on the crouch and the landing
 *   lean    degrees it leans in the air, about its feet
 *   bob     the period of its float while it hangs
 */
type Character = { rise: number; lift: number; squash: number; lean: number; bob: number };
const CHARACTER: Record<string, Character> = {
	L1: { rise: 200, lift: 1.0, squash: 1.0, lean: 0, bob: 460 }, // A: bouncy, even
	L2: { rise: 150, lift: 0.9, squash: 0.8, lean: -2.2, bob: 380 }, // K: snappy, leans into the kick
	L3: { rise: 270, lift: 0.75, squash: 1.45, lean: 0, bob: 560 }, // Q: round and heavy
	L4: { rise: 210, lift: 1.1, squash: 0.9, lean: 1.8, bob: 420 }, // J: light, tips toward its hook
	L5: { rise: 200, lift: 0.55, squash: 1.0, lean: 0, bob: 500 }, // 10: the digits hop for themselves
};

/** the beat every letter shares, in its own character: squat, pop off the steel, hang, land */
const letterBeat = (rig: Rig, t: number, ch: Character): Pose => {
	const pose = restPose(rig);
	const riseAt = T.crouch + ch.rise;
	const air = track(t, [[0, 0], [T.crouch, 0], [riseAt, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
	// while it hangs off the steel it floats — a slow bob, so the hold is not a
	// freeze (Bubis's review measured a letter standing dead still for 330ms)
	const hover = ramp(t, riseAt - 40, riseAt + 80) * (1 - ramp(t, 820, 920));
	const q = ch.squash;
	pose.rigid = {
		sx: track(t, [[0, 1], [T.crouch, 1 + 0.05 * q, 'out'], [T.crouch + ch.rise / 2, 1 - 0.03 * q, 'out'], [riseAt, 1], [T.land - 20, 1], [T.land + 40, 1 + 0.04 * q, 'out'], [T.done, 1, 'out']]),
		sy: track(t, [[0, 1], [T.crouch, 1 - 0.08 * q, 'out'], [T.crouch + ch.rise / 2, 1 + 0.04 * q, 'out'], [riseAt, 1], [T.land - 20, 1], [T.land + 40, 1 - 0.06 * q, 'out'], [T.done, 1, 'out']]),
		rot: ch.lean * air,
		// BIGGER JUMP (2026-09-27, asked for): 6 -> 10px and a bigger pop; the
		// rigid move costs nothing against the mesh. The copy is drawn above its
		// neighbours, so a top rising past the tile's edge now reads as a leap.
		pop: 1 + 0.07 * air,
		dx: 0,
		dy: -10 * ch.lift * air - 1.6 * hover * Math.sin((2 * Math.PI * (t - riseAt)) / ch.bob),
	};
	pose.air = Math.max(0, Math.min(1, air));
	pose.flash = 0.3 * track(t, [[T.crouch, 0], [T.crouch + 90, 1, 'out'], [560, 0, 'in']]);
	pose.sheen = t >= 330 && t <= 860 ? (t - 330) / 530 : -1;
	pose.plateHit = 1 + 0.03 * bump(t, T.crouch, 360) + 0.02 * bump(t, T.land, T.land + 120);
	return pose;
};

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** a limb of a letter: a stroke hanging from a joint, blending in over `rampPx` */
const stroke = (name: string, path: Point[], half: number, rampPx = 16): PartSpec => {
	const line = polyline(path, half);
	const [px, py] = path[0];
	const [tx, ty] = path[path.length - 1];
	return {
		name,
		parent: 'body',
		pivot: path[0],
		axis: [tx - px, ty - py],
		priority: 3,
		dist: line.dist,
		keep: (p) => smoothstep((line.along(p) - 4) / rampPx),
	};
};

const letter = (
	symbol: string,
	outline: (p: Point) => number,
	grid: { x0: number; y0: number; x1: number; y1: number },
	parts: PartSpec[],
	limits: MeshWinSpec['limits'],
	act: (rig: Rig, pose: Pose, t: number) => void,
): MeshWinSpec => ({
	symbol,
	key: `gb${symbol}`,
	feetY: FEET,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 190,
	rig: {
		// ~4px cells over the letter and a margin of steel round it
		grid: { ...grid, cols: Math.round((grid.x1 - grid.x0) / 4), rows: Math.round((grid.y1 - grid.y0) / 4) },
		soft: 4,
		parts: [{ name: 'body', pivot: [128, FEET], axis: [0, -1], dist: outline }, ...parts],
	},
	limits,
	pose: (rig, t) => {
		const pose = letterBeat(rig, t, CHARACTER[symbol]);
		act(rig, pose, t);
		return pose;
	},
});

// ---- A: legs splay from the apex, twice, like a jumping jack ---------------
export const L1 = letter(
	'L1',
	polygon([[100, 44], [152, 44], [208, 210], [164, 210], [156, 170], [106, 170], [96, 210], [46, 210]]),
	{ x0: 36, y0: 34, x1: 220, y1: 222 },
	[stroke('leg_l', [[118, 72], [70, 202]], 18, 22), stroke('leg_r', [[136, 72], [186, 202]], 18, 22)],
	// geometric: leg_l +4.5 -5, leg_r +4.5 -5.5
	{ leg_l: { pos: 3.5, neg: 3.5 }, leg_r: { pos: 3.5, neg: 3.5 } },
	(rig, pose, t) => {
		const air = Math.min(1, pose.air);
		const splay = 1.4 * air + 2.1 * Math.max(0, flick(t, 420, 2.4, 2.6)) + 1.5 * Math.max(0, flick(t, 700, 2.4, 3));
		// + swings the left foot out (clockwise on screen, y down), - the right
		bone(rig, pose, 'leg_l').angle = splay;
		bone(rig, pose, 'leg_r').angle = -splay;
		// ...and the legs LENGTHEN as they splay. The gestures were sized to the
		// art and moved 1.4-2.5px on screen — invisible; turning further tears
		// the letter, but a stroke changing length costs little (mesh-cast-rig §4:
		// "a limb changing length is what reads as force").
		// 2% per degree: at 3% the feet pushed into the line they stand on
		bone(rig, pose, 'leg_l').along = 1 + 0.008 * splay;
		bone(rig, pose, 'leg_r').along = 1 + 0.008 * splay;
		// the crossbar spreads with them
		bone(rig, pose, 'leg_l').across = 1 + 0.015 * splay;
		bone(rig, pose, 'leg_r').across = 1 + 0.015 * splay;
	},
);

// ---- K: the leg kicks out, the arm waves after it ----------------------------
export const L2 = letter(
	'L2',
	polygon([[68, 42], [114, 42], [114, 106], [160, 42], [208, 42], [142, 120], [208, 210], [160, 210], [116, 146], [114, 210], [68, 210]]),
	{ x0: 58, y0: 32, x1: 218, y1: 222 },
	[stroke('arm', [[116, 118], [188, 50]], 16, 18), stroke('leg', [[118, 132], [196, 202]], 16, 18)],
	// geometric: arm +6.5 -5.5, leg +5 -6
	{ arm: { pos: 4.5, neg: 4.5 }, leg: { pos: 4, neg: 4.5 } },
	(rig, pose, t) => {
		const kick = Math.max(0, flick(t, 330, 2, 2.4));
		bone(rig, pose, 'leg').angle = -4 * kick + 1.2 * flick(t, T.land, 3, 5);
		bone(rig, pose, 'leg').along = 1 + 0.12 * kick;
		const wave = flick(t, 410, 2.2, 2.8);
		bone(rig, pose, 'arm').angle = 2.5 * wave;
		bone(rig, pose, 'arm').along = 1 + 0.13 * Math.max(0, wave);
	},
);

// ---- Q: the tail flicks while the body rocks on its base ---------------------
const Q_TAIL = polyline([[146, 158], [176, 186], [204, 208]], 14);
export const L3 = letter(
	'L3',
	union(polygon([[52, 42], [202, 42], [206, 196], [212, 214], [180, 214], [52, 206]])),
	{ x0: 42, y0: 32, x1: 222, y1: 224 },
	[
		{
			name: 'tail',
			parent: 'body',
			pivot: [146, 158],
			axis: [58, 50],
			priority: 3,
			dist: Q_TAIL.dist,
			keep: (p) => smoothstep((Q_TAIL.along(p) - 4) / 18),
		},
	],
	// geometric: tail +8 -10
	{ tail: { pos: 6.5, neg: 6.5 } },
	(rig, pose, t) => {
		const whip = flick(t, 400, 2.6, 2.6);
		bone(rig, pose, 'tail').angle = 6 * whip - 2.5 * flick(t, T.land, 3, 5);
		bone(rig, pose, 'tail').along = 1 + 0.22 * Math.max(0, whip);
		// the body rocks on its base, as the rigid move — nothing deforms for it
		pose.rigid.rot = 2 * Math.sin((2 * Math.PI * (t - T.rise)) / 520) * ramp(t, 250, 380) * (1 - ramp(t, 800, 1000));
	},
);

// ---- J: the hook swings like a pendulum from the stem ------------------------
export const L4 = letter(
	'L4',
	polygon([[148, 38], [190, 38], [190, 178], [162, 210], [100, 210], [68, 186], [68, 134], [114, 134], [114, 166], [148, 170]]),
	{ x0: 58, y0: 30, x1: 200, y1: 220 },
	[
		{
			name: 'hook',
			parent: 'body',
			pivot: [168, 140],
			axis: [0, 1],
			priority: 3,
			dist: polygon([[64, 132], [194, 132], [194, 214], [64, 214]]),
			keep: (p) => smoothstep((p[1] - 142) / 18),
		},
	],
	// geometric: hook +5 -6 — far less than Bubis's J (18), because this J's
	// hook curls back up close under its own stem
	{ hook: { pos: 4, neg: 4 } },
	(rig, pose, t) => {
		const swing = flick(t, 340, 1.7, 2.2);
		bone(rig, pose, 'hook').angle = 3.6 * swing - 1.4 * flick(t, T.land, 2.4, 4);
		// ACROSS, not along: the hook curls sideways under the stem, so the
		// stretch that shows is the curl reaching out, not the stem growing down
		bone(rig, pose, 'hook').across = 1 + 0.13 * Math.abs(swing);
	},
);

// ---- 10: the 1 hops, then the 0 --------------------------------------------
const ONE = polygon([[36, 70], [62, 48], [106, 48], [106, 206], [62, 206], [62, 100], [36, 100]]);
const ZERO = polygon([[116, 46], [224, 46], [224, 206], [116, 206]]);
const hop = (t: number, t0: number, h: number) => -h * Math.max(0, flick(t, t0, 2.2, 3.2));
export const L5 = letter(
	'L5',
	union(ONE, ZERO),
	{ x0: 28, y0: 38, x1: 232, y1: 216 },
	[
		{ name: 'one', parent: 'body', pivot: [84, 206], axis: [0, -1], priority: 3, dist: ONE },
		{ name: 'zero', parent: 'body', pivot: [170, 206], axis: [0, -1], priority: 3, dist: ZERO },
	],
	// never turned: they hop
	{ one: { pos: 0.5, neg: 0.5 }, zero: { pos: 0.5, neg: 0.5 } },
	(rig, pose, t) => {
		const one = bone(rig, pose, 'one');
		one.dy = hop(t, 330, 8);
		one.along = 1 + 0.09 * Math.max(0, flick(t, 330, 2.2, 3.2));
		const zero = bone(rig, pose, 'zero');
		zero.dy = hop(t, 470, 8);
		zero.along = 1 + 0.09 * Math.max(0, flick(t, 470, 2.2, 3.2)) - 0.04 * bump(t, T.land, T.land + 140);
		zero.across = 1 + 0.04 * bump(t, T.land, T.land + 140);
	},
);
