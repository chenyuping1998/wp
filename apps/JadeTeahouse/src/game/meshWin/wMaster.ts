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
import { circle, flick, strongLeap, polygon, polyline, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Rig } from './meshRig';

const LEAP = { crouch: 120, rise: 340, fall: 760, land: 940, hop2: 1170, done: 1450 };

const COIN = circle([123, 128], 96);
const HEAD = polygon([[132, 72], [146, 58], [168, 60], [178, 80], [176, 98], [160, 106], [140, 104], [130, 90]]);
const TAIL = polyline([[96, 172], [70, 162], [58, 138], [64, 116], [84, 108], [92, 124]], 7);

export const W: MeshWinSpec = {
	symbol: 'W',
	key: 'gbW',
	sprite: 'gbW',
	art: 'sushiSymbols/w.png',
	feetY: 224,
	durationMs: LEAP.done,
	landMs: LEAP.land,
	hitMs: LEAP.rise,
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

		// the head looks up on the toss and nods on the landing
		const head = b('head');
		head.angle = HEAD_DEG * (track(t, [[0, 0], [LEAP.crouch, 0.3, 'out'], [LEAP.rise, -0.8, 'out'], [LEAP.fall, -0.4], [LEAP.land, 0.6, 'in'], [LEAP.land + 200, 0, 'out']]) + 0.4 * flick(t, LEAP.hop2, 2.6, 4));

		// the tail curls through the toss and flicks on each landing
		b('tail').angle = TAIL_DEG * (0.7 * Math.sin((2 * Math.PI * (t - LEAP.crouch)) / 520) * smoothstep(t / 160) * (1 - smoothstep((t - LEAP.land) / 200)) + flick(t, LEAP.land, 2.4, 3.2));

		// tossed like a coin: two spins at the top, edge-on and back (|cos|, so
		// the face never mirrors)
		const jump = strongLeap(t, LEAP, 40);
		const turn = smoothstep((t - LEAP.rise + 80) / (LEAP.fall - LEAP.rise + 40));
		jump.rigid.sx *= Math.max(0.12, Math.abs(Math.cos(2 * Math.PI * turn)));
		// and lands rocking on its edge
		jump.rigid.rot = 7 * flick(t, LEAP.land, 1.8, 3);
		pose.rigid = turnAbout(jump.rigid, [123, 128], 224);
		pose.air = jump.air;
		return pose;
	},
};

// set from the measured limits
const HEAD_DEG = 6;
const TAIL_DEG = 8;
