/**
 * THE NEON SYMBOLS' WINS — each one acts out what it is, on one deforming grid.
 *
 * All the art is a full panel (subject painted onto the dark plate, frame
 * band round it), so every symbol runs in PANEL mode: the frame is nailed
 * down and the inside bends. The whole-tile moves (the highs' jump and trick,
 * the others' pop and hop) are SymbolMeshWin's, on top of this.
 *
 *   H1 boombox   BASS: both speaker cones pump on the beat, the body squashes
 *                under each thump and the handle rattles
 *   H2 helmet    the visor flips up on its hinge and snaps shut, the shell
 *                nods with it
 *   H3 spray can SHAKE then SPRAY: the can rattles along its length, then the
 *                lime mist billows out of the nozzle in pulses
 *   H4 sneaker   the toe flexes up for the kickflip and slaps down on the
 *                landing, the laces and the heel tab flick after it
 *   W  gorilla   ROCK ON: the horns hand pumps to the beat and the head bobs
 *   S  bananas   the bunch jiggles like jelly, the stem flicks
 *   L1..L5       the letter jumps and wobbles while its neon tube flickers on
 *
 * The beats line up with highJump.ts: the hit at 260ms is mid-air, 600 is the
 * landing, 880/1120 the second bounce — so the H1 speakers thump as it lands.
 *
 * Coordinates are the 256 canvas of the art, y down. Imports only meshRig.
 */
import {
	blob,
	bump,
	circle,
	flick,
	panelParts,
	polygon,
	polyline,
	ramp,
	restPose,
	track,
	union,
	type MeshWinSpec,
	type Point,
	type Pose,
	type Rig,
} from './meshRig';

const INNER: [number, number, number, number] = [18, 18, 238, 238];

type Dist = (p: Point) => number;
const inside = (...fns: Dist[]) => {
	const u = union(...fns);
	return (p: Point) => u(p) === 0;
};
/** the glow lights the bright paint, not the dark plate between it */
// (the plate itself is violet-blue: blue well above green and red)
const lit = (r: number, g: number, b: number) => Math.max(r, g, b) > 120 && !(b > r && b > 1.4 * g);

const boneOf = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** a bass thump at `at`: in over 40ms, out over ~110ms — 0 before, smooth */
const thump = (t: number, at: number, decay = 110) =>
	t < at - 40 ? 0 : ramp(t, at - 40, at) * Math.exp(-Math.max(0, t - at) / decay);

/** fades a part's weight out toward the frame band, so it never tugs on it */
const awayFromFrame = (p: Point) => {
	const d = Math.min(p[0] - INNER[0], INNER[2] - p[0], p[1] - INNER[1], INNER[3] - p[1]);
	return Math.max(0, Math.min(1, (d - 2) / 22));
};

const HIT = 260;
const LAND = 600;
const HOP2 = 1120;

type Base = Omit<MeshWinSpec, 'pose' | 'rig' | 'limits'>;
const base = (symbol: string, tint: number, extra: Partial<Base> = {}): Base => ({
	symbol,
	key: `gb${symbol}`,
	sprite: `gb${symbol}`,
	mode: 'panel',
	feetY: 224,
	durationMs: 1450,
	landMs: LAND,
	hitMs: HIT,
	flashTint: tint,
	inkColor: lit,
	...extra,
});

/** the neon hit: a tube catching — two stutters, then full, then a glow */
const neonFlash = (t: number, peak = 0.42) =>
	peak * track(t, [[0, 0], [50, 0.85, 'linear'], [80, 0.1, 'linear'], [130, 0.7, 'linear'], [160, 0.15, 'linear'], [HIT, 1, 'out'], [700, 0.25], [1150, 0]]);

// ---------------------------------------------------------------------------
// H1 boombox

const H1_BODY = blob([126, 128], 120, 96, 4);
const H1_SPK_L = circle([61, 163], 48);
const H1_SPK_R = circle([187, 163], 48);
const H1_HANDLE = polyline([[66, 34], [186, 34]], 9).dist;
const H1_BEATS = [HIT, LAND, 860, HOP2];

export const H1: MeshWinSpec = {
	...base('H1', 0xff3fd0, { sparkAt: [124, 163] }),
	inked: inside(H1_BODY, H1_HANDLE),
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 7,
		parts: [
			...panelParts(INNER),
			{ name: 'body', parent: 'panel', pivot: [126, 222], axis: [0, -1], dist: H1_BODY, priority: 1, keep: awayFromFrame },
			{ name: 'spkL', parent: 'body', pivot: [61, 163], dist: H1_SPK_L, priority: 4, keep: awayFromFrame },
			{ name: 'spkR', parent: 'body', pivot: [187, 163], dist: H1_SPK_R, priority: 4, keep: awayFromFrame },
			{ name: 'handle', parent: 'body', pivot: [126, 48], axis: [1, 0], dist: H1_HANDLE, priority: 3 },
		],
	},
	limits: { frame: { pos: 0, neg: 0 }, panel: { pos: 0, neg: 0 }, body: { pos: 0, neg: 0 }, spkL: { pos: 0, neg: 0 }, spkR: { pos: 0, neg: 0 }, handle: { pos: 4, neg: 4 } },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const beat = H1_BEATS.reduce((s, at, i) => s + thump(t, at) * (i === 1 ? 1 : 0.8), 0);
		const body = boneOf(rig, pose, 'body');
		body.along = 1 - 0.03 * beat;
		body.across = 1 + 0.018 * beat;
		for (const name of ['spkL', 'spkR']) {
			const s = boneOf(rig, pose, name);
			s.along = s.across = 1 + 0.16 * beat;
		}
		const handle = boneOf(rig, pose, 'handle');
		handle.dy = -3.5 * beat;
		handle.angle = 3.2 * (flick(t, LAND, 7, 6) - 0.6 * flick(t, HOP2, 8, 7));
		pose.flash = neonFlash(t) + 0.18 * beat;
		pose.sheen = t >= 320 && t <= 960 ? (t - 320) / 640 : -1;
		return pose;
	},
};

// ---------------------------------------------------------------------------
// H2 helmet

const H2_SHELL = blob([128, 122], 112, 108, 2.4);
const H2_VISOR = polygon([[20, 56], [166, 46], [186, 116], [130, 134], [30, 104]]);

export const H2: MeshWinSpec = {
	...base('H2', 0x34e6ff, { sparkAt: [100, 88] }),
	inked: inside(H2_SHELL),
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 8,
		parts: [
			...panelParts(INNER),
			{ name: 'shell', parent: 'panel', pivot: [128, 228], axis: [0, -1], dist: H2_SHELL, priority: 1, keep: awayFromFrame },
			// hinged at the round pivot cap on the side of the shell
			{ name: 'visor', parent: 'shell', pivot: [201, 100], axis: [-1, 0], dist: H2_VISOR, priority: 4, keep: awayFromFrame },
		],
	},
	limits: { frame: { pos: 0, neg: 0 }, panel: { pos: 0, neg: 0 }, shell: { pos: 3, neg: 3 }, visor: { pos: 5, neg: 2 } },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const shell = boneOf(rig, pose, 'shell');
		const visor = boneOf(rig, pose, 'visor');
		// up through the flight, snapped shut on the landing, a little bounce
		const open = track(t, [[0, 0], [140, 0], [380, 1, 'out'], [LAND - 40, 0.9], [LAND, 0, 'in']]);
		visor.angle = 4.6 * open - 1.6 * flick(t, LAND, 6, 7);
		visor.dy = -2.5 * open;
		shell.angle = 2.2 * Math.sin(t / 150) * bump(t, 120, 1250);
		shell.along = 1 + 0.02 * thump(t, LAND, 140);
		shell.across = 1 - 0.012 * thump(t, LAND, 140);
		pose.flash = neonFlash(t);
		pose.sheen = t >= 300 && t <= 900 ? (t - 300) / 600 : -1;
		return pose;
	},
};

// ---------------------------------------------------------------------------
// H3 spray can

const H3_CAN = polyline([[84, 36], [170, 222]], 38).dist;
const H3_MIST = polygon([[100, 22], [150, 10], [236, 16], [238, 128], [204, 112], [160, 64], [112, 44]]);
// along the can, nozzle end
const CAN_AXIS: Point = [-86, -186];
const CAN_LEN = Math.hypot(...CAN_AXIS);

export const H3: MeshWinSpec = {
	...base('H3', 0xb4ff2e, { sparkAt: [96, 28] }),
	inked: inside(H3_CAN, H3_MIST),
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 7,
		parts: [
			...panelParts(INNER),
			{ name: 'can', parent: 'panel', pivot: [170, 222], axis: CAN_AXIS, dist: H3_CAN, priority: 1, keep: awayFromFrame },
			{ name: 'mist', parent: 'panel', pivot: [100, 28], axis: [1, 0.35], dist: H3_MIST, priority: 2, keep: awayFromFrame },
		],
	},
	limits: { frame: { pos: 0, neg: 0 }, panel: { pos: 0, neg: 0 }, can: { pos: 3, neg: 3 }, mist: { pos: 4, neg: 4 } },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const can = boneOf(rig, pose, 'can');
		const mist = boneOf(rig, pose, 'mist');
		// SHAKE: rattling along its own length, the ball clacking inside
		const shake = Math.sin(t / 19) * track(t, [[0, 0], [60, 1], [420, 1], [520, 0]]);
		can.dx = (4.2 * shake * CAN_AXIS[0]) / CAN_LEN;
		can.dy = (4.2 * shake * CAN_AXIS[1]) / CAN_LEN;
		// SPRAY: the press recoils the can, the mist billows in pulses
		const press = track(t, [[0, 0], [500, 0], [580, 1, 'out'], [1150, 1], [1300, 0]]);
		can.angle = -1.8 * press + 1.2 * flick(t, 560, 5, 6);
		can.along = 1 - 0.02 * press;
		const puff = press * (0.6 + 0.4 * Math.sin((t - 500) / 70));
		mist.along = 1 + 0.12 * puff;
		mist.across = 1 + 0.08 * puff;
		mist.angle = 2.5 * Math.sin(t / 110) * press;
		pose.flash = neonFlash(t) + 0.2 * thump(t, 580, 200);
		pose.sheen = t >= 300 && t <= 900 ? (t - 300) / 600 : -1;
		return pose;
	},
};

// ---------------------------------------------------------------------------
// H4 sneaker

const H4_SHOE = blob([124, 120], 116, 92, 3);
const H4_TOE = blob([206, 168], 38, 34, 2.4);
const H4_LACES = polygon([[110, 38], [168, 26], [214, 118], [150, 136]]);
const H4_TAB = polyline([[26, 40], [44, 66]], 12).dist;

export const H4: MeshWinSpec = {
	...base('H4', 0x2ef0ff, { sparkAt: [120, 196], feetY: 210 }),
	inked: inside(H4_SHOE),
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 7,
		parts: [
			...panelParts(INNER),
			{ name: 'shoe', parent: 'panel', pivot: [120, 210], axis: [0, -1], dist: H4_SHOE, priority: 1, keep: awayFromFrame },
			// bends at the ball of the foot
			{ name: 'toe', parent: 'shoe', pivot: [168, 196], axis: [1, 0], dist: H4_TOE, priority: 3, keep: awayFromFrame },
			{ name: 'laces', parent: 'shoe', pivot: [150, 130], axis: [0, -1], dist: H4_LACES, priority: 2 },
			{ name: 'tab', parent: 'shoe', pivot: [46, 70], axis: [-0.6, -1], dist: H4_TAB, priority: 3, keep: awayFromFrame },
		],
	},
	limits: { frame: { pos: 0, neg: 0 }, panel: { pos: 0, neg: 0 }, shoe: { pos: 0, neg: 0 }, toe: { pos: 4, neg: 7 }, laces: { pos: 4, neg: 4 }, tab: { pos: 8, neg: 8 } },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const shoe = boneOf(rig, pose, 'shoe');
		const toe = boneOf(rig, pose, 'toe');
		const laces = boneOf(rig, pose, 'laces');
		const tab = boneOf(rig, pose, 'tab');
		// toe up into the pop, slapped down on the landing
		toe.angle = -6 * track(t, [[0, 0], [90, 1, 'out'], [300, 0.4], [LAND - 60, 0.2], [LAND, 0]]) + 3.5 * thump(t, LAND, 90) - 2.5 * flick(t, LAND + 90, 5, 7);
		const slap = thump(t, LAND, 120) + 0.5 * thump(t, HOP2, 110);
		shoe.along = 1 - 0.035 * slap;
		shoe.across = 1 + 0.02 * slap;
		laces.angle = 3.5 * flick(t, 160, 4, 4) + 3 * flick(t, LAND, 6, 6);
		laces.dy = -2 * bump(t, 130, LAND);
		tab.angle = 7 * flick(t, 140, 3.5, 3.5) - 5 * flick(t, LAND, 6, 6);
		pose.flash = neonFlash(t) + 0.22 * slap;
		pose.sheen = t >= 300 && t <= 900 ? (t - 300) / 600 : -1;
		return pose;
	},
};

// ---------------------------------------------------------------------------
// W gorilla

const W_HAND = blob([54, 74], 38, 54, 2.2);
const W_HEAD = blob([138, 92], 58, 64, 2.4);
const W_BODY = blob([128, 196], 112, 54, 3);
const W_BEATS = [HIT, 520, 780, 1040];

export const W: MeshWinSpec = {
	...base('W', 0xff42dc, { sparkAt: [132, 54], durationMs: 1400, landMs: 1100 }),
	inked: inside(W_HAND, W_HEAD, W_BODY),
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 8,
		parts: [
			...panelParts(INNER),
			{ name: 'body', parent: 'panel', pivot: [128, 236], axis: [0, -1], dist: W_BODY, priority: 1, keep: awayFromFrame },
			{ name: 'head', parent: 'body', pivot: [142, 158], axis: [0, -1], dist: W_HEAD, priority: 2, keep: awayFromFrame },
			// pivots at the wrist
			{ name: 'hand', parent: 'body', pivot: [68, 124], axis: [-0.3, -1], dist: W_HAND, priority: 3, keep: awayFromFrame },
		],
	},
	// geometric (check_mesh_wins.mjs W --limits, 2026-10-03): head +10.5 -8.5, hand +12.5 -10.5
	limits: { frame: { pos: 0, neg: 0 }, panel: { pos: 0, neg: 0 }, body: { pos: 0, neg: 0 }, head: { pos: 8, neg: 8 }, hand: { pos: 10, neg: 10 } },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const beat = W_BEATS.reduce((s, at) => s + thump(t, at, 120), 0);
		const groove = track(t, [[0, 0], [120, 1], [1150, 1], [1300, 0]]);
		const head = boneOf(rig, pose, 'head');
		const hand = boneOf(rig, pose, 'hand');
		const body = boneOf(rig, pose, 'body');
		// HEADBANG: the head slams down on every beat, tipping AWAY from the hand
		// (toward it, the two squeeze the fur between them flat)
		head.dy = 6 * beat;
		head.along = 1 - 0.05 * beat;
		head.across = 1 + 0.03 * beat;
		head.angle = 5 * beat + 1.2 * Math.sin(t / 83) * groove;
		// ROCK ON: the horns punch AT the camera on each beat, tipping in toward
		// the head (outward, the fingertips jam into the frame corner)
		hand.angle = 5 * beat + 1.5 * Math.sin(t / 83 + 1) * groove;
		// it swells mostly in WIDTH: the fingertips are 100 units from the wrist
		// and right under the frame's top band, so length would jam them into it
		hand.dx = 2 * beat;
		hand.along = 1 + 0.02 * beat;
		hand.across = 1 + 0.09 * beat;
		body.along = 1 + 0.03 * beat;
		body.across = 1 + 0.015 * beat;
		pose.flash = neonFlash(t, 0.36) + 0.16 * beat;
		pose.sheen = t >= 280 && t <= 880 ? (t - 280) / 600 : -1;
		return pose;
	},
};

// ---------------------------------------------------------------------------
// S bananas

const S_BUNCH = blob([124, 138], 104, 86, 2.2);
const S_STEM = polyline([[170, 26], [204, 46]], 14).dist;

export const S: MeshWinSpec = {
	...base('S', 0xffd84a, { sparkAt: [124, 130], durationMs: 1400, landMs: 1100 }),
	inked: inside(S_BUNCH, S_STEM),
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 8,
		parts: [
			...panelParts(INNER),
			{ name: 'bunch', parent: 'panel', pivot: [140, 222], axis: [0, -1], dist: S_BUNCH, priority: 1, keep: awayFromFrame },
			{ name: 'stem', parent: 'bunch', pivot: [176, 54], axis: [1, -0.6], dist: S_STEM, priority: 2, keep: awayFromFrame },
		],
	},
	limits: { frame: { pos: 0, neg: 0 }, panel: { pos: 0, neg: 0 }, bunch: { pos: 3, neg: 3 }, stem: { pos: 8, neg: 8 } },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const bunch = boneOf(rig, pose, 'bunch');
		const stem = boneOf(rig, pose, 'stem');
		const jelly = flick(t, 40, 3.2, 3.2);
		const squash = track(t, [[0, 0], [110, -0.6, 'out'], [HIT, 1, 'out'], [520, -0.4], [760, 0.25], [1000, 0]]);
		bunch.along = 1 + 0.04 * squash;
		bunch.across = 1 - 0.025 * squash;
		bunch.angle = 2.4 * jelly;
		stem.angle = 7 * flick(t, 120, 4, 4.5);
		pose.flash = 0.34 * track(t, [[0, 0], [HIT, 1, 'out'], [700, 0.2], [1100, 0]]);
		pose.sheen = t >= 300 && t <= 950 ? (t - 300) / 650 : -1;
		return pose;
	},
};

// ---------------------------------------------------------------------------
// L1..L5 letters: a jelly jump while the neon tube flickers on

const LETTER = blob([128, 130], 66, 68, 2.6);

const letter = (symbol: string, tint: number, phase: number): MeshWinSpec => ({
	...base(symbol, tint, { durationMs: 1120, landMs: 860, hitMs: 220, sparkAt: [128, 130] }),
	inked: inside(LETTER),
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 40, rows: 40 },
		soft: 8,
		parts: [
			...panelParts(INNER),
			{ name: 'letter', parent: 'panel', pivot: [128, 200], axis: [0, -1], dist: LETTER, priority: 1, keep: awayFromFrame },
		],
	},
	limits: { frame: { pos: 0, neg: 0 }, panel: { pos: 0, neg: 0 }, letter: { pos: 6, neg: 6 } },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const l = boneOf(rig, pose, 'letter');
		const s = track(t, [[0, 0], [90, -0.7, 'out'], [220, 1, 'out'], [420, -0.45], [620, 0.22], [820, 0]]);
		l.along = 1 + 0.1 * s;
		l.across = 1 - 0.06 * s;
		l.angle = 5 * flick(t, 220, 2.6 + phase * 0.2, 4) * (phase % 2 ? -1 : 1);
		// the tube: stutters, catches, hums
		pose.flash =
			0.5 * track(t, [[0, 0], [40, 0.9, 'linear'], [70, 0, 'linear'], [110, 0.6, 'linear'], [140, 0.05, 'linear'], [220, 1, 'out'], [600, 0.35], [1000, 0]]) +
			0.06 * Math.sin(t / 23 + phase) * bump(t, 220, 1000);
		pose.sheen = t >= 260 && t <= 820 ? (t - 260) / 560 : -1;
		return pose;
	},
});

export const L1 = letter('L1', 0x28dbff, 0);
export const L2 = letter('L2', 0xff42cf, 1);
export const L3 = letter('L3', 0xffdc3b, 2);
export const L4 = letter('L4', 0x45f5c9, 3);
export const L5 = letter('L5', 0xc274ff, 4);

/** the H1 beat list, for its particles (winFx.ts) */
export const BASS_BEATS = H1_BEATS;
