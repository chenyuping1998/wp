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
import { blob, flick, polygon, restPose, smoothstep, turnAbout, type MeshWinSpec, type Rig } from './meshRig';
import { ACT, holdTrack, stageAct } from './act';
import { lagged, ppTrack, type PPKey } from './ppVocabulary';

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
	durationMs: ACT.done,
	landMs: ACT.back,
	hitMs: ACT.pop1,
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

		// the lid is knocked up by the rise and held propped open while the
		// steam escapes; it drops shut on the second landing
		const open = holdTrack(t, ACT.anticipate, 300, ACT.hold + 120, 180);
		b('lid').angle = LID_DEG * (0.85 * open - 0.4 * ppTrack(t, [[0, 0], [60, 0], [ACT.anticipate, 1], [ACT.pop1, 0]]) +
			0.45 * flick(t, ACT.back, 3, 5) + 0.6 * flick(t, ACT.land2, 3.4, 5));

		// the buns: thrown up a frame behind the basket, then they PUFF in the
		// steam one after the other (proving dough), and squash on each landing
		const toss: PPKey[] = [[0, 0], [ACT.anticipate, -0.3], [ACT.pop1 + 33, 1], [ACT.back + 33, 0]];
		b('buns').dy = -BUN_UP * lagged(t, toss, 1, 33, 1);
		const bun = (name: string, i: number, sign: number) => {
			const bone = b(name);
			const at = ACT.back + 60 + 90 * i;
			const up = lagged(t, toss, 1 + i, 33, 1);
			const puff = ppTrack(t, [[0, 0], [at, 0], [at + 160, 1], [ACT.hold + 60, 0.6], [ACT.hold + 200, 0]]);
			const squash = Math.max(0, flick(t, ACT.back + 20 * i, 4, 7)) + 0.6 * Math.max(0, flick(t, ACT.land2 + 20 * i, 4, 7));
			bone.dy = -1.2 * up;
			bone.along = 1 + 0.05 * puff - 0.08 * squash;
			bone.across = 1 + 0.035 * puff + 0.08 * squash;
			bone.angle = sign * 3 * flick(t, ACT.back + 30 * i, 2.5, 4);
		};
		bun('bunL', 0, -1);
		bun('bunR', 1, 1);

		const act = stageAct(t, { height: 20 });
		act.rigid.rot += 3 * ppTrack(t, [[0, 0], [ACT.anticipate, 1], [ACT.pop1, -1], [ACT.back, 0]]);
		pose.rigid = turnAbout(act.rigid, [128, 140], 222);
		pose.air = act.air;
		pose.flash = act.flash;
		return pose;
	},
};

const LID_DEG = 4;
const BUN_UP = 4;
