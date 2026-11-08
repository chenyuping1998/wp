/**
 * W — THE TEA MASTER'S MEDALLION. Tossed like a coin: it springs off its card,
 * spins twice at the top and lands rocking. The monkey carved on it is alive
 * through all of it — its tail curls and flicks, and its head turns up and
 * nods as the medallion comes down.
 *
 * CUT mode, over its card (Symbol.svelte). The monkey is carved INTO the
 * medallion, so its head and tail bend the green field round them; that field
 * is a plain texture and takes the stretch.
 *
 * Coordinates are the 256 canvas of sushiSymbols/w.png (2026-10-09):
 * medallion (123,128) r~97, head (132..176, 60..104) on the neck (150,108),
 * tail curling from (92,170) round to (90,125).
 */
import { circle, flick, polygon, polyline, restPose, smoothstep, turnAbout, type MeshWinSpec, type Rig } from './meshRig';
import { ACT, stageAct } from './act';
import { lagged, ppTrack, type PPKey } from './ppVocabulary';

const COIN = circle([123, 128], 96);
const HEAD = polygon([[132, 72], [146, 58], [168, 60], [178, 80], [176, 98], [160, 106], [140, 104], [130, 90]]);
const TAIL = polyline([[96, 172], [70, 162], [58, 138], [64, 116], [84, 108], [92, 124]], 7);

export const W: MeshWinSpec = {
	symbol: 'W',
	key: 'gbW',
	sprite: 'gbW',
	art: 'sushiSymbols/w.png',
	feetY: 224,
	durationMs: ACT.done,
	landMs: ACT.back,
	hitMs: ACT.pop1,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'root', pivot: [123, 224], dist: () => 14 },
			{ name: 'coin', parent: 'root', pivot: [123, 224], axis: [0, -1], priority: 1, dist: COIN },
			{
				name: 'head',
				parent: 'coin',
				pivot: [150, 108],
				axis: [0.3, -1],
				priority: 4,
				dist: HEAD,
				keep: (p) => smoothstep((46 - Math.hypot(p[0] - 154, p[1] - 82)) / 16),
			},
			{
				name: 'tail',
				parent: 'coin',
				pivot: [96, 172],
				axis: [-0.5, -1],
				priority: 4,
				dist: TAIL.dist,
				keep: (p) => smoothstep((TAIL.along(p) - 6) / 22),
			},
		],
	},
	limits: {
		coin: { pos: 0, neg: 0 },
		head: { pos: 8, neg: 8 },
		tail: { pos: 10, neg: 10 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the toss: one full flip on the way up, caught face-on at the top; back
		// on the card the medallion rings on its rim; then the monkey on it
		// looks round and flicks its tail (a frame late), and the second beat is
		// a small hop with no flip
		const turn = ppTrack(t, [[0, 0], [ACT.anticipate + 30, 0], [ACT.pop1 + 60, 1, 'settle']]);
		const glance = ppTrack(t, [[0, 0], [ACT.back + 60, 0], [ACT.back + 200, 1], [ACT.hold + 40, 1], [ACT.hold + 180, 0]]);
		b('head').angle = HEAD_DEG * (ppTrack(t, [[0, 0], [ACT.anticipate, 0.3], [ACT.pop1, -0.6], [ACT.back, 0]]) - 0.9 * glance + 0.4 * flick(t, ACT.land2, 2.6, 4));
		const tailKeys: PPKey[] = [[0, 0], [ACT.back + 60, 0], [ACT.back + 200, 1], [890, -0.6], [ACT.hold + 40, 0.5], [ACT.hold + 180, 0]];
		b('tail').angle = TAIL_DEG * (lagged(t, tailKeys, 1, 67, 1) + 0.6 * flick(t, ACT.back, 2.4, 3.2));

		const act = stageAct(t, { height: 26, squash: 0.8 });
		act.rigid.sx *= Math.max(0.1, Math.abs(Math.cos(2 * Math.PI * turn)));
		// ringing on its rim as it lands, settling
		act.rigid.rot = 6 * flick(t, ACT.back, 3.2, 4.5) + 2.5 * flick(t, ACT.land2, 3.2, 6);
		pose.rigid = turnAbout(act.rigid, [123, 128], 224);
		pose.air = act.air;
		pose.flash = act.flash;
		return pose;
	},
};

const HEAD_DEG = 6;
const TAIL_DEG = 8;
