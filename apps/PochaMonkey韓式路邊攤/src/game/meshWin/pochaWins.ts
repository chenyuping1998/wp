/** Pocha's food and stamp, weighted to the painted ingredients rather than a flat card. */
import { blob, bump, circle, leap, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Point, type Rig } from './meshRig';

type Accent = { name: string; at: Point; size: Point; pivot: Point; axis?: Point };
type Design = { symbol: string; feet: number; body: Point; accents: Accent[]; height: number };
const T = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160, done: 1440 };
const designs: Design[] = [
	// Pan: the rice cakes jiggle inside the heavy iron rim.
	{ symbol: 'H1', feet: 223, body: [128, 125], height: 17, accents: [
		{ name: 'food', at: [128, 99], size: [84, 49], pivot: [128, 150] },
		{ name: 'rim', at: [128, 143], size: [91, 20], pivot: [128, 154] },
	] },
	// Three independent fish-cake skewers rock from the cup rim.
	{ symbol: 'H2', feet: 244, body: [128, 155], height: 16, accents: [
		{ name: 'left', at: [79, 97], size: [24, 80], pivot: [91, 181] },
		{ name: 'middle', at: [126, 86], size: [25, 91], pivot: [128, 181] },
		{ name: 'right', at: [173, 98], size: [24, 80], pivot: [164, 181] },
	] },
	// The coating flexes around the wooden stick during its turn.
	{ symbol: 'H3', feet: 238, body: [131, 125], height: 18, accents: [
		{ name: 'crust', at: [150, 107], size: [66, 78], pivot: [91, 187], axis: [1, -1] },
		{ name: 'tip', at: [185, 70], size: [36, 41], pivot: [158, 115], axis: [1, -1] },
	] },
	// Each gimbap slice hops on a different beat; the rice stays food-only.
	{ symbol: 'H4', feet: 169, body: [128, 128], height: 11, accents: [
		{ name: 'slice1', at: [48, 128], size: [31, 39], pivot: [52, 159] },
		{ name: 'slice2', at: [100, 128], size: [31, 39], pivot: [103, 159] },
		{ name: 'slice3', at: [153, 128], size: [31, 39], pivot: [155, 159] },
		{ name: 'slice4', at: [206, 128], size: [31, 39], pivot: [205, 159] },
	] },
	{ symbol: 'W', feet: 240, body: [128, 128], height: 24, accents: [
		{ name: 'headband', at: [128, 50], size: [80, 24], pivot: [128, 76] },
		{ name: 'jaw', at: [129, 163], size: [51, 36], pivot: [128, 133] },
	] },
	{ symbol: 'S', feet: 218, body: [128, 128], height: 16, accents: [
		{ name: 'dial', at: [128, 100], size: [53, 41], pivot: [128, 133] },
		{ name: 'rays', at: [128, 45], size: [91, 37], pivot: [128, 92] },
	] },
	// The bonus basket lands heavy; the chicken and receipt settle afterwards.
	{ symbol: 'P', feet: 242, body: [128, 147], height: 12, accents: [
		{ name: 'chicken', at: [106, 92], size: [74, 50], pivot: [124, 151] },
		{ name: 'receipt', at: [181, 55], size: [36, 55], pivot: [170, 116] },
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
			case 'H1': pose.rigid.rot = 5 * beat; pose.bones[bone(rig, 'food')].dy -= 3 * bump(t, T.rise, T.fall); break;
			case 'H2': pose.bones[bone(rig, 'middle')].angle *= -1; break;
			case 'H3': pose.rigid.rot = 360 * smoothstep((t - T.crouch) / (T.fall - T.crouch)); break;
			case 'H4': pose.rigid.rot = 2 * beat; break;
			case 'W': pose.rigid.sx *= Math.max(0.2, Math.abs(Math.cos(Math.PI * smoothstep((t - T.rise) / (T.fall - T.rise))))); break;
			case 'S': pose.rigid.dx = 3 * Math.sin(t / 24) * live; break;
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
		pose.bones[bone(rig, 'chicken')].dy = -3.5 * bump(t, 90, 420);
		pose.bones[bone(rig, 'receipt')].angle = 3 * track(t, [[0, 0], [120, -1], [240, 0.7], [420, 0]]);
		return pose;
	},
};
