/**
 * L1-L5 — THE STEEL LETTERS, A K Q J 10. (GoBananasBoat's letters, re-traced
 * onto this game's art.)
 *
 * Each is a raised steel letter with a dark bevel, set in a recessed slate
 * panel. They are CUT off the panel with their bevel (design/
 * make_symbol_layers.py) and hop OUT of their engraving, with a drop shadow
 * on the panel under them — what is left behind reads as the empty slot.
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
const FEET = 198;

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
		rot: 2 * ch.lean * air,
		// BIGGER JUMP (2026-09-27, asked for): 6 -> 10px and a bigger pop; the
		// rigid move costs nothing against the mesh. The copy is drawn above its
		// neighbours, so a top rising past the tile's edge now reads as a leap.
		// BIGGER AGAIN (2026-10-16, user: 獎圖網格動態不夠大): 10 -> 26px, pop
		// 0.07 -> 0.14, twice the lean. Still the rigid move only.
		pop: 1 + 0.14 * air,
		dx: 0,
		dy: -26 * ch.lift * air - 1.6 * hover * Math.sin((2 * Math.PI * (t - riseAt)) / ch.bob),
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
	polygon([[104, 52], [152, 52], [208, 202], [160, 202], [152, 170], [104, 170], [96, 202], [48, 202]]),
	{ x0: 38, y0: 42, x1: 218, y1: 212 },
	[stroke('leg_l', [[118, 80], [72, 196]], 16, 22), stroke('leg_r', [[138, 80], [186, 196]], 16, 22)],
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
	polygon([[48, 58], [96, 58], [96, 112], [140, 58], [182, 58], [126, 128], [196, 200], [146, 200], [100, 148], [96, 200], [48, 200]]),
	{ x0: 38, y0: 48, x1: 206, y1: 210 },
	[stroke('arm', [[100, 118], [166, 66]], 15, 18), stroke('leg', [[104, 136], [182, 194]], 15, 18)],
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
const Q_TAIL = polyline([[130, 140], [162, 170], [190, 194]], 13);
export const L3 = letter(
	'L3',
	union(polygon([[54, 52], [196, 52], [196, 170], [200, 200], [168, 200], [54, 196]])),
	{ x0: 44, y0: 42, x1: 210, y1: 210 },
	[
		{
			name: 'tail',
			parent: 'body',
			pivot: [130, 140],
			axis: [60, 54],
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
	polygon([[116, 56], [178, 56], [178, 178], [160, 200], [92, 200], [70, 180], [70, 138], [108, 138], [108, 164], [138, 164], [138, 78], [116, 78]]),
	{ x0: 62, y0: 46, x1: 188, y1: 210 },
	[
		{
			name: 'hook',
			parent: 'body',
			pivot: [158, 146],
			axis: [0, 1],
			priority: 3,
			dist: polygon([[64, 132], [182, 132], [182, 206], [64, 206]]),
			keep: (p) => smoothstep((p[1] - 146) / 18),
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
const ONE = polygon([[50, 82], [80, 56], [112, 56], [112, 200], [56, 200], [58, 104], [50, 104]]);
const ZERO = polygon([[114, 56], [200, 56], [200, 200], [114, 200]]);
const hop = (t: number, t0: number, h: number) => -h * Math.max(0, flick(t, t0, 2.2, 3.2));
export const L5 = letter(
	'L5',
	union(ONE, ZERO),
	{ x0: 40, y0: 46, x1: 210, y1: 210 },
	[
		{ name: 'one', parent: 'body', pivot: [84, 200], axis: [0, -1], priority: 3, dist: ONE },
		{ name: 'zero', parent: 'body', pivot: [158, 200], axis: [0, -1], priority: 3, dist: ZERO },
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
