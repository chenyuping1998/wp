/** Swing's W, S and P: each painting has weighted moving regions (the instruments are in instrumentWins.ts). */
import { blob, bump, circle, leap, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Point, type Rig } from './meshRig';

type Accent = { name: string; at: Point; size: Point; pivot: Point; axis?: Point };
type Design = { symbol: string; feet: number; body: Point; accents: Accent[]; height: number };
const T = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160, done: 1440 };
const designs: Design[] = [
	{ symbol: 'W', feet: 244, body: [128, 129], height: 21, accents: [
		{ name: 'hat', at: [111, 55], size: [79, 35], pivot: [128, 83] },
		{ name: 'bow', at: [132, 208], size: [48, 26], pivot: [128, 186] },
	] },
	{ symbol: 'S', feet: 243, body: [128, 135], height: 17, accents: [
		{ name: 'microphone', at: [128, 86], size: [62, 76], pivot: [128, 150] },
		{ name: 'noteL', at: [49, 65], size: [25, 39], pivot: [93, 124] },
		{ name: 'noteR', at: [210, 91], size: [27, 39], pivot: [168, 129] },
	] },
	// Bonus vinyl: the centre label rocks separately as it settles on the reel.
	{ symbol: 'P', feet: 229, body: [128, 128], height: 11, accents: [
		{ name: 'label', at: [128, 128], size: [40, 40], pivot: [128, 128] },
		{ name: 'rim', at: [128, 128], size: [97, 97], pivot: [128, 128] },
	] },
];

const bone = (rig: Rig, name: string) => rig.bones.findIndex((b) => b.name === name);
const make = (d: Design): MeshWinSpec => ({
	symbol: d.symbol, key: `gb${d.symbol}`, sprite: `gb${d.symbol}`,
	art: `sushiSymbols/${d.symbol.toLowerCase()}.png`, feetY: d.feet,
	durationMs: T.done, landMs: T.land, hitMs: T.rise,
	rig: { grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 }, soft: 7,
		parts: [
			{ name: 'root', pivot: [128, d.feet], dist: () => 15 },
			{ name: 'body', parent: 'root', pivot: [128, d.feet], dist: circle(d.body, 111), priority: 1 },
			...d.accents.map((a) => ({ name: a.name, parent: 'body', pivot: a.pivot, axis: a.axis ?? [0, -1] as Point,
				priority: 4, dist: blob(a.at, ...a.size),
				keep: (p: Point) => smoothstep((Math.hypot(p[0] - a.pivot[0], p[1] - a.pivot[1]) - 5) / 20) })),
		] },
	limits: { body: { pos: 0, neg: 0 }, ...Object.fromEntries(d.accents.map((a) => [a.name, { pos: 5, neg: 5 }])) },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const { rigid, air } = leap(t, T, d.height);
		pose.rigid = rigid; pose.air = air;
		const live = bump(t, T.crouch, T.land + 180);
		const beat = track(t, [[0, 0], [T.rise, 1, 'out'], [T.fall, -0.5], [T.land, 0.65], [T.hop2, 0]]);
		pose.bones[bone(rig, 'body')].dy = -2.3 * live;
		for (let i = 0; i < d.accents.length; i++) {
			const a = d.accents[i]; const part = pose.bones[bone(rig, a.name)];
			const stagger = bump(t, T.rise + i * 65 - 90, T.land + i * 65);
			part.angle = (i % 2 ? -1 : 1) * (2.2 * beat + 1.1 * stagger);
			part.dy = -2.4 * stagger;
		}
		switch (d.symbol) {
			case 'W': pose.rigid.rot = 4 * beat; break;
			case 'S': pose.rigid.dy -= 3 * live; break;
		}
		pose.rigid = turnAbout(pose.rigid, [128, 128], d.feet);
		return pose;
	},
});

// H1-H4 play their instruments in instrumentWins.ts
export const [W, S, P] = designs.map(make);
export const P_LAND: MeshWinSpec = {
	...P, symbol: 'P:land', durationMs: 520, landMs: 99999, hitMs: 100,
	pose: (rig, t) => {
		const pose = restPose(rig);
		const settle = bump(t, 10, 400);
		pose.rigid = turnAbout({ ...pose.rigid, rot: 360 * smoothstep(t / 450), sx: 1 + 0.04 * settle, sy: 1 - 0.04 * settle }, [128, 128], P.feetY);
		pose.bones[bone(rig, 'label')].angle = 2 * track(t, [[0, 0], [130, 1], [260, -0.5], [450, 0]]);
		pose.bones[bone(rig, 'body')].dy = -3 * settle;
		pose.bones[bone(rig, 'label')].dx = 3 * settle;
		pose.bones[bone(rig, 'rim')].dy = -3.5 * settle;
		return pose;
	},
};
