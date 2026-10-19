/**
 * THE THINGS THAT HANG IN THE BACKGROUNDS.
 *
 * Base game: the two lanterns hanging on chains beside the archway sway; the
 * quake on a feature trigger (game/caveQuake) kicks them into a real swing on
 * each chest-beat strike. (Re-traced on Go Banalchemy's laboratory 2026-10-04;
 * the mine's lantern, rope coil, ropes and plank are gone with its art.)
 *
 * Each is a mesh over ONE small rectangle of its background (not the whole
 * 1920px plate), drawn exactly on top of the unchanged sprite by
 * BgProps.svelte. The rectangle's border belongs to `frame` and never moves, so
 * there is no seam where the mesh meets the sprite; the props hand their
 * weight back to it within a few units of the border.
 *
 * Rig units are a 256 x 144 canvas over the 1920 x 1080 plate (7.5px each).
 * Coordinates measured on bg_base.png / bg_feature.png, 2026-09-25.
 */
import {
	bump,
	flick,
	track,
	polygon,
	polyline,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Pose,
	type Rect,
	type Rig,
} from './meshRig';

// The quake's strikes, COPIED from game/caveQuake.svelte.ts (which mirrors
// Mascot.svelte and design/generate_monkey_spine.mjs). Not imported: these
// modules must load under bare node for design/check_mesh_wins.mjs, and that
// file is a .svelte.ts with runes in it. Change all of them together.
const QUAKE_BEATS = 6;
const strikeAt = (i: number) => 480 + i * 300;

export const BG_CANVAS: [number, number] = [256, 144];

/** what drives the props this frame */
export type BgEnv = {
	/** ms since the scene appeared (the idle sway) */
	t: number;
	/** blast ladder rung, 1..5 */
	level: number;
	/** ms since the cave quake started, or < 0 */
	quakeT: number;
	/** ms since the last detonation, or < 0 */
	blastT: number;
	/** ms since hold-and-spin coins last landed, or < 0 */
	coinT?: number;
};

export type BgPropSpec = MeshWinSpec & {
	/** the rectangle this mesh covers, rig units */
	rect: Rect;
	drive: (rig: Rig, env: BgEnv) => Pose;
};

const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));

/** `frame` owns the rectangle's border and everything not near a prop */
const frame = (halo = 5): PartSpec => ({ name: 'frame', pivot: [0, 0], dist: () => halo });

/** How far round a lantern its swing reaches into the wall, rig units. The
 *  lanterns are painted IN FRONT of stone pillars: at the old 5 (~50px) the
 *  pillars' straight edges bent with every swing (user, 2026-10-16: 柱子不要動).
 *  Now only a thin rim of the lantern's own outline and glow goes with it. */
const LANTERN_HALO = 1.4;
const LANTERN_SOFT = 0.45;

/** a prop hanging from `pivot`: its own shape, handed back to the frame near
 *  the rectangle's border so the border never moves */
const prop = (rect: Rect, name: string, pivot: Point, dist: (p: Point) => number, keepExtra?: (p: Point) => number): PartSpec => ({
	name,
	parent: 'frame',
	pivot,
	axis: [0, 1],
	dist,
	keep: (p) => smoothstep((depthIn(rect, p) - 1) / 4) * (keepExtra ? keepExtra(p) : 1),
});

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** a kick that swings and dies away, from each strike of the quake */
const quakeKick = (quakeT: number, hz: number, decay: number) => {
	if (quakeT < 0) return 0;
	let v = 0;
	for (let i = 0; i < QUAKE_BEATS; i++) v += flick(quakeT, strikeAt(i), hz, decay) * (0.5 + 0.1 * i);
	return v;
};

const wave = (t: number, period: number) => Math.sin((2 * Math.PI * t) / period);

// ---------------------------------------------------------------------------
// base game (Go Banalchemy's laboratory, 2026-10-04): the two lanterns hanging
// on chains from wall brackets either side of the archway. Each is its own
// small mesh, so the swing never drags the wall between them. Measured on
// goBanalchemyBackground/bg_base.png: chains from y 6, lantern bodies 20..46,
// centred x 41.5 (left) and 213.5 (right).

// kept clear of the (still) lantern's right edge at x 48.5, so its swing
// never drags the lamp
const VINE = polygon([[51, 2], [60, 2], [62, 8], [61, 17], [58, 26], [53.5, 28], [52, 18], [51, 8]]);

const lantern = (side: 'L' | 'R', cx: number): BgPropSpec => {
	// room round it for the wall to take the swing: at +-11 it folded by 2deg
	const rect: Rect = [cx - 24, 2, cx + 24, 62];
	const BODY = polygon([[cx - 2, 18], [cx + 2, 18], [cx + 7, 23], [cx + 7, 42], [cx + 1, 47], [cx - 1, 47], [cx - 7, 42], [cx - 7, 23]]);
	const CHAIN = polyline([[cx - 1.5, 6], [cx, 19]], 1.2);
	const shape = (p: Point) => Math.min(BODY(p), CHAIN.dist(p));
	// 2026-10-16: the dark vine hanging from the top edge just right of the
	// left lantern's pillar (x 49..62, y 0..28) shares its mesh — a mesh of its
	// own would overlap this one and cut the lantern's swing
	const vine = side === 'L' ? VINE : null;
		const spec: BgPropSpec = {
		symbol: `bgLantern${side}`,
		key: 'gbBgBase',
		sprite: 'gbBgBase',
		mode: 'panel',
		feetY: 62,
		durationMs: 2600,
		landMs: 99999,
		hitMs: 99999,
		rect,
		inked: (p) => (vine ? vine(p) === 0 : shape(p) === 0),
		rig: {
			canvas: BG_CANVAS,
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: 48, rows: 60 },
			soft: LANTERN_SOFT,
			parts: [
				frame(LANTERN_HALO),
				// THE LANTERN ITSELF STAYS STILL (user, 2026-10-16: 背景的燈不要晃動);
				// only the vine beside it moves, so it is no part of the rig
				// hung from the top edge, it swings more toward its loose ends
				...(vine ? [prop(rect, 'vine', [55.5, 2], vine, (p) => smoothstep((p[1] - 3) / 8))] : []),
			],
		},
		// geometric (check_mesh_wins.mjs bg:base --limits) — see the gate
		limits: { vine: { pos: 6, neg: 6 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			if (vine) {
				const v = bone(rig, pose, 'vine');
				v.angle = 3.6 * wave(env.t, 4300) + 1.1 * wave(env.t, 1900) + 1.5 * quakeKick(env.quakeT, 1.2, 1.1);
				v.across = 1 + 0.03 * wave(env.t, 2700);
			}
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t, level: 1, quakeT: t, blastT: -1 }),
	};
	return spec;
};

export const BG_BASE = lantern('L', 41.5);

// The green cloth draped over the left table's edge (2026-10-16): it hangs from
// the table top at y 100 down the left side to y 140, its loose right hem from
// (19, 101) to (3, 140). Rooted on the table, it stirs like cloth in a draught
// — stronger toward the hem — and swings on the quake. The plate's left edge
// pins the far side, as the table's corner would.
export const BG_CLOTH: BgPropSpec = (() => {
	const rect: Rect = [0, 94, 30, 144];
	const DRAPE = polygon([[0, 99], [19, 99], [18, 105], [15, 113], [11, 121], [7, 130], [4, 140], [0, 140]]);
	const spec: BgPropSpec = {
		symbol: 'bgCloth',
		key: 'gbBgBase',
		sprite: 'gbBgBase',
		mode: 'panel',
		feetY: 144,
		durationMs: 2600,
		landMs: 99999,
		hitMs: 99999,
		rect,
		inked: (p) => DRAPE(p) === 0,
		rig: {
			canvas: BG_CANVAS,
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: 36, rows: 60 },
			soft: 1.5,
			parts: [
				frame(),
				// hangs from the table top: the fold over the edge stays put
				// …and the strip against the plate's pinned left edge gives the
				// swing room over 9 units instead of folding at the corner
				prop(rect, 'cloth', [9, 100], DRAPE, (p) => smoothstep((p[1] - 100) / 16) * smoothstep((p[0] - 1) / 9)),
			],
		},
		limits: { cloth: { pos: 6, neg: 6 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			const c = bone(rig, pose, 'cloth');
			// lopsided: a positive turn carries the hem LEFT, into the pinned
			// plate edge, where it folds — so it swings out into the room more
			const sway = 3.4 * wave(env.t, 3900) + 0.9 * wave(env.t, 1700) + 1.2 * quakeKick(env.quakeT, 1.1, 1.2);
			c.angle = sway > 0 ? 0.7 * sway : 1.9 * sway;
			c.across = 1 + 0.02 * wave(env.t, 2900);
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t, level: 1, quakeT: t, blastT: -1 }),
	};
	return spec;
})();

// (hold and spin: the vault's two caged lanterns used to sway; taken out with
// the laboratory's, 2026-10-16 — the lamps hang still.)

// ---------------------------------------------------------------------------
// free game (the crystal vault, 2026-10-16): crystals that stand clear of the
// brass — two spikes on the floor left of the board, two in the bottom-left
// corner, the tall column left of the great ring (only above the brass band
// that crosses it) and a small spike before it. They GROW: a slow swell along
// each crystal from its base, each on its own period, with a slight lean. No
// light is added; their painted glow comes with them. Measured on bg_feature.

type Crystal = { name: string; base: Point; outline: Point[]; period: number; grow: number; lean: number };

const crystalBed = (symbol: string, rect: Rect, crystals: Crystal[]): BgPropSpec => {
	const shapes = crystals.map((c) => polygon(c.outline));
	const spec: BgPropSpec = {
		symbol,
		key: 'gbBgFeature',
		sprite: 'gbBgFeature',
		mode: 'panel',
		feetY: rect[3],
		durationMs: 2600,
		landMs: 99999,
		hitMs: 99999,
		rect,
		inked: (p) => shapes.some((f) => f(p) === 0),
		rig: {
			canvas: BG_CANVAS,
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: 48, rows: 56 },
			// the dark cave round them takes the swell: a wider halo than the
			// lanterns', which hang in front of straight-edged stone
			soft: 0.8,
			parts: [
				frame(2.6),
				...crystals.map((c, i) => ({
					...prop(rect, c.name, c.base, shapes[i], (p: Point) => smoothstep((c.base[1] - p[1]) / 3)),
					axis: [0, -1] as Point,
				})),
			],
		},
		limits: Object.fromEntries(crystals.map((c) => [c.name, { pos: 6, neg: 6 }])),
		drive: (rig, env) => {
			const pose = restPose(rig);
			for (const c of crystals) {
				// 0 -> 1 -> 0 on its own period, starting at rest
				const swell = 0.5 - 0.5 * Math.cos((2 * Math.PI * env.t) / c.period);
				const b = bone(rig, pose, c.name);
				b.along = 1 + c.grow * swell;
				b.across = 1 + 0.35 * c.grow * swell;
				b.angle = c.lean * wave(env.t, c.period * 1.37);
			}
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t, level: 1, quakeT: -1, blastT: -1 }),
	};
	return spec;
};

export const BG_CRYSTALS_FLOOR = crystalBed('bgCrystalsFloor', [62, 100, 90, 136], [
	{ name: 'spike1', base: [73.5, 127.5], outline: [[73.3, 107], [76.3, 110], [76.6, 127.5], [70.6, 127.5], [70.3, 110.5]], period: 3600, grow: 0.102, lean: 1.82 },
	{ name: 'spike2', base: [80.6, 129], outline: [[80.6, 118.5], [82, 121], [82, 129], [79.2, 129], [79.3, 121]], period: 2900, grow: 0.174, lean: 2.86 },
]);
export const BG_CRYSTALS_CORNER = crystalBed('bgCrystalsCorner', [0, 114, 30, 144], [
	{ name: 'spikeA', base: [6, 133], outline: [[6.5, 122.5], [9.5, 128], [10, 134], [3, 132.5], [2, 127]], period: 3300, grow: 0.189, lean: 3.12 },
	{ name: 'spikeB', base: [19, 138], outline: [[21.3, 121], [23.5, 128], [24, 138], [13, 138], [16, 130]], period: 4100, grow: 0.116, lean: 2.08 },
]);
export const BG_CRYSTALS_RIGHT = crystalBed('bgCrystalsRight', [166, 76, 210, 136], [
	{ name: 'column', base: [198, 103], outline: [[197.5, 81.5], [201, 86], [203, 95], [202, 102], [195, 102], [193, 92], [194.5, 86]], period: 3900, grow: 0.102, lean: 1.56 },
	{ name: 'spikeS', base: [174.5, 131], outline: [[174.5, 119.5], [176.8, 123], [177, 131], [172.3, 131], [172.5, 123]], period: 3100, grow: 0.189, lean: 3.12 },
]);

// ---------------------------------------------------------------------------
// hold and spin: the gold coin pile on the vault floor (x 45..88, y 104..131)
// shudders whenever new coins land on the board — squashes into itself and
// springs back, its spill toward the right sliding a touch. Driven by
// BgEnv.coinT (BgProps.svelte listens for stickyPrizesNew). The scrolls on
// the chest are left still: lying flat, any visible motion read as wrong.
export const BG_COINS: BgPropSpec = (() => {
	const rect: Rect = [38, 96, 96, 138];
	const HEAP = polygon([[48, 107], [55, 104], [62, 106], [70, 110], [76, 113], [70, 126], [60, 131], [46, 129], [45, 118]]);
	const SPILL = polygon([[70, 112], [80, 114], [88, 118], [88, 124], [78, 128], [68, 127]]);
	const spec: BgPropSpec = {
		symbol: 'bgCoins',
		key: 'gbBgHoldAndSpin',
		sprite: 'gbBgHoldAndSpin',
		mode: 'panel',
		feetY: 131,
		durationMs: 1200,
		landMs: 99999,
		hitMs: 99999,
		rect,
		inked: (p) => HEAP(p) === 0 || SPILL(p) === 0,
		rig: {
			canvas: BG_CANVAS,
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: 58, rows: 42 },
			soft: 0.8,
			parts: [
				frame(2.4),
				{ ...prop(rect, 'heap', [58, 131], HEAP, (p) => smoothstep((131 - p[1]) / 4)), axis: [0, -1] as Point },
				prop(rect, 'spill', [72, 124], SPILL),
			],
		},
		limits: { heap: { pos: 4, neg: 4 }, spill: { pos: 4, neg: 4 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			const c = env.coinT ?? -1;
			if (c < 0 || c > 1000) return pose;
			const heap = bone(rig, pose, 'heap');
			heap.along = track(c, [[0, 1], [60, 0.93, 'out'], [190, 1.045, 'out'], [340, 0.985], [520, 1.008], [700, 1]]);
			heap.across = track(c, [[0, 1], [60, 1.03, 'out'], [190, 0.985, 'out'], [340, 1.005], [700, 1]]);
			const spill = bone(rig, pose, 'spill');
			spill.dx = 2.6 * flick(c, 40, 2.2, 5);
			spill.dy = -0.5 * bump(c, 40, 220);
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t, level: 1, quakeT: -1, blastT: -1, coinT: t }),
	};
	return spec;
})();

// (free game: nothing hangs in the crystal vault — its tubes and crystals
// stand on the floor — so it has no props.)

