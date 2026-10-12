/**
 * H3 — THE BAMBOO STEAMER. The lid, propped open on the rim, flaps on the
 * spring like a mouth; the steamer leaps; the two buns inside bounce up in
 * turn, squashing as they come down — the left one first, the right one a
 * beat after — and they bounce once more each on the landing.
 *
 * CUT mode, over its card (Symbol.svelte).
 *
 * Coordinates are the 256 canvas of sushiSymbols/h3.png (2026-10-09):
 * lid (102..236, 36..148), resting on the right rim at ~(205,145); left bun
 * (80,117) 28x24, right bun (137,133) 34x23; basket foot y 222.
 */
import { blob, flick, leap, polygon, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Rig } from './meshRig';

const LEAP = { crouch: 120, rise: 330, fall: 740, land: 920, hop2: 1150, done: 1450 };

const BODY = polygon([[24, 120], [40, 92], [100, 72], [104, 56], [128, 38], [168, 38], [210, 56], [236, 100], [236, 130], [220, 148], [206, 160], [204, 196], [160, 222], [80, 222], [32, 200], [24, 170]]);
const LID = polygon([[104, 60], [126, 40], [162, 36], [202, 54], [228, 90], [238, 114], [228, 142], [206, 148], [178, 136], [140, 110], [112, 88]]);
const BUN_L = blob([80, 117], 28, 24, 2.2);
const BUN_R = blob([137, 133], 34, 23, 2.2);
const inBlob = (c: [number, number], rx: number, ry: number) => (p: [number, number]) =>
	smoothstep((1.35 - Math.hypot((p[0] - c[0]) / rx, (p[1] - c[1]) / ry)) / 0.6);

export const H3: MeshWinSpec = {
	symbol: 'H3',
	key: 'gbH3',
	sprite: 'gbH3',
	art: 'sushiSymbols/h3.png',
	feetY: 222,
	durationMs: LEAP.done,
	landMs: LEAP.land,
	hitMs: LEAP.rise,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'root', pivot: [128, 222], dist: () => 14 },
			{ name: 'body', parent: 'root', pivot: [120, 222], axis: [0, -1], priority: 1, dist: BODY },
			{
				name: 'lid',
				parent: 'body',
				// it rests on the right rim and swings about there
				pivot: [205, 146],
				axis: [-0.6, -1],
				priority: 3,
				dist: LID,
				keep: (p) => smoothstep((Math.hypot(p[0] - 205, p[1] - 146) - 8) / 22),
			},
			// the two buns touch, so they hop TOGETHER on a group bone and each
			// only adds its own squash on top (a separate hop folded the seam)
			{
				name: 'buns',
				parent: 'body',
				pivot: [110, 156],
				axis: [0, -1],
				priority: 3,
				dist: (p) => Math.min(BUN_L(p), BUN_R(p)),
				keep: (p) => Math.max(inBlob([80, 117], 28, 24)(p), inBlob([137, 133], 34, 23)(p)),
			},
			{ name: 'bunL', parent: 'buns', pivot: [80, 140], axis: [0, -1], priority: 4, dist: BUN_L, keep: inBlob([80, 117], 28, 24) },
			{ name: 'bunR', parent: 'buns', pivot: [137, 156], axis: [0, -1], priority: 4, dist: BUN_R, keep: inBlob([137, 133], 34, 23) },
		],
	},
	limits: {
		body: { pos: 0, neg: 0 },
		lid: { pos: 6, neg: 6 },
		buns: { pos: 0, neg: 0 },
		bunL: { pos: 5, neg: 5 },
		bunR: { pos: 5, neg: 5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the lid flaps open on the spring and claps on the landing
		b('lid').angle =
			LID_DEG * (track(t, [[0, 0], [LEAP.crouch, -0.3, 'out'], [LEAP.rise, 1, 'out'], [LEAP.fall - 100, 0.6], [LEAP.land, -0.4, 'in'], [LEAP.land + 120, 0, 'out']]) +
				0.5 * flick(t, LEAP.land + 100, 3, 5));

		// the buns bounce together, the left a touch ahead of the right, and
		// squash as they come down
		const hop = (at: number) =>
			track(t, [[0, 0], [at, 0], [at + 150, 1, 'out'], [at + 300, 0, 'in']]) +
			0.5 * track(t, [[0, 0], [LEAP.land + 40, 0], [LEAP.land + 140, 1, 'out'], [LEAP.land + 250, 0, 'in']]);
		b('buns').dy = -BUN_UP * hop(LEAP.rise - 20);
		const squashOf = (name: string, at: number, sign: number) => {
			const bun = b(name);
			const lead = hop(at) - hop(LEAP.rise - 20);
			const squash = Math.max(0, flick(t, at + 300, 4, 7)) + 0.6 * Math.max(0, flick(t, LEAP.land + 250, 4, 7));
			bun.dy = -1.5 * lead;
			bun.along = 1 + 0.05 * hop(at) - 0.08 * squash;
			bun.across = 1 - 0.03 * hop(at) + 0.08 * squash;
			bun.angle = sign * 3 * flick(t, at + 300, 2.5, 4);
		};
		squashOf('bunL', LEAP.rise - 70, -1);
		squashOf('bunR', LEAP.rise + 30, 1);

		const { rigid, air } = leap(t, LEAP, 22);
		pose.rigid = turnAbout(rigid, [128, 140], 222);
		pose.air = air;
		return pose;
	},
};

// set from the measured limits
const LID_DEG = 4;
const BUN_UP = 4;
