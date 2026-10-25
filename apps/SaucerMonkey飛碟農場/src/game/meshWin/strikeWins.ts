/** Strike's trophy, shoes, score card, soda, bowler, ball and pin, weighted to the painted parts. */
import { blob, bump, circle, leap, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Point, type Rig } from './meshRig';

type Accent = { name: string; at: Point; size: Point; pivot: Point; axis?: Point };
type Design = { symbol: string; feet: number; body: Point; accents: Accent[]; height: number };
const T = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160, done: 1440 };
const designs: Design[] = [
	// Trophy: the little bowling ball on top rocks on its stem.
	{ symbol: 'H1', feet: 241, body: [128, 128], height: 18, accents: [
		{ name: 'ball', at: [125, 50], size: [34, 32], pivot: [125, 84] },
	] },
	// Shoes: the front laces flap, the back shoe's heel lifts.
	{ symbol: 'H2', feet: 205, body: [128, 120], height: 16, accents: [
		{ name: 'laces', at: [128, 125], size: [30, 24], pivot: [128, 150] },
		{ name: 'heel', at: [105, 66], size: [24, 16], pivot: [110, 90] },
	] },
	// Score card: the pencil scribbles from its tip.
	{ symbol: 'H3', feet: 202, body: [128, 118], height: 14, accents: [
		{ name: 'pencil', at: [198, 110], size: [26, 70], pivot: [150, 196], axis: [1, -1.7] },
	] },
	// Soda: the cream, cherry and straw wobble on the glass.
	{ symbol: 'H4', feet: 246, body: [128, 140], height: 16, accents: [
		{ name: 'topping', at: [128, 50], size: [42, 40], pivot: [128, 90] },
	] },
	{ symbol: 'W', feet: 220, body: [128, 128], height: 24, accents: [
		{ name: 'hair', at: [140, 68], size: [40, 20], pivot: [140, 95] },
		{ name: 'collar', at: [125, 205], size: [55, 18], pivot: [125, 185] },
	] },
	{ symbol: 'S', feet: 241, body: [128, 128], height: 18, accents: [
		{ name: 'holes', at: [130, 112], size: [65, 46], pivot: [128, 128] },
	] },
	// Cow: the head wobbles on its neck.
	{ symbol: 'P', feet: 243, body: [128, 140], height: 12, accents: [
		{ name: 'head', at: [128, 55], size: [26, 45], pivot: [128, 105] },
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
			case 'H1': pose.rigid.rot = 4 * beat; pose.bones[bone(rig, 'ball')].dy -= 3 * bump(t, T.rise, T.fall); break;
			case 'H3': pose.bones[bone(rig, 'pencil')].angle = 4 * Math.sin(t / 45) * live; break;
			case 'S': pose.rigid.rot = 360 * smoothstep((t - T.crouch) / (T.fall - T.crouch)); break;
			case 'P': pose.rigid.rot = 6 * Math.sin(t / 70) * live; break;
		}
		pose.rigid = turnAbout(pose.rigid, [128, 128], d.feet);
		return pose;
	},
});

export const [H1, H2, H3, H4, W, S, P] = designs.map(make);
export const P_LAND: MeshWinSpec = {
	...P, symbol: 'P:land', durationMs: 520, landMs: 99999, hitMs: 80,
	pose: (rig, t) => {
		const pose = restPose(rig);
		const impact = bump(t, 10, 330);
		pose.rigid = turnAbout({ ...pose.rigid, sx: 1 + 0.07 * impact, sy: 1 - 0.1 * impact }, [128, 128], P.feetY);
		pose.bones[bone(rig, 'head')].angle = 3 * track(t, [[0, 0], [120, -1], [240, 0.7], [420, 0]]);
		return pose;
	},
};
