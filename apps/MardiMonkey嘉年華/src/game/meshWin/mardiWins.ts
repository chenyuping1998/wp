/** Mardi's king cake, trumpet, umbrella, beignets, marshal, mask and beads, weighted to the painted parts. */
import { blob, bump, circle, leap, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Point, type Rig } from './meshRig';

type Accent = { name: string; at: Point; size: Point; pivot: Point; axis?: Point };
type Design = { symbol: string; feet: number; body: Point; accents: Accent[]; height: number };
const T = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160, done: 1440 };
const designs: Design[] = [
	// King cake: the icing ring jiggles on the bread.
	{ symbol: 'H1', feet: 218, body: [128, 120], height: 16, accents: [
		{ name: 'icing', at: [128, 62], size: [95, 32], pivot: [128, 110] },
	] },
	// Trumpet: the bell flares and the ribbon swings under it.
	{ symbol: 'H2', feet: 169, body: [128, 110], height: 14, accents: [
		{ name: 'bell', at: [220, 105], size: [26, 48], pivot: [175, 115], axis: [1, 0] },
		{ name: 'ribbon', at: [215, 150], size: [26, 38], pivot: [200, 115] },
	] },
	// Umbrella: the canopy twirls about the shaft.
	{ symbol: 'H3', feet: 240, body: [128, 128], height: 18, accents: [
		{ name: 'canopy', at: [128, 85], size: [110, 70], pivot: [128, 125] },
	] },
	// Beignets: the top one jostles and the sugar shakes off.
	{ symbol: 'H4', feet: 202, body: [128, 120], height: 14, accents: [
		{ name: 'top', at: [138, 80], size: [60, 34], pivot: [138, 120] },
	] },
	{ symbol: 'W', feet: 238, body: [128, 128], height: 24, accents: [
		{ name: 'hat', at: [138, 50], size: [85, 40], pivot: [138, 100] },
		{ name: 'jaw', at: [130, 195], size: [36, 24], pivot: [130, 170] },
	] },
	{ symbol: 'S', feet: 218, body: [128, 128], height: 16, accents: [
		{ name: 'feathers', at: [130, 58], size: [70, 40], pivot: [130, 108] },
	] },
	// Beads: the medallion swings from the string.
	{ symbol: 'P', feet: 243, body: [128, 120], height: 12, accents: [
		{ name: 'medallion', at: [134, 200], size: [42, 42], pivot: [134, 152], axis: [0, 1] },
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
			case 'H1': pose.rigid.rot = 3 * beat; break;
			case 'H3': pose.rigid.rot = 4 * Math.sin(t / 60) * live; break;
			case 'W': pose.bones[bone(rig, 'hat')].angle *= 1.4; break;
			case 'P': pose.bones[bone(rig, 'medallion')].angle = 4 * Math.sin(t / 80) * live; break;
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
		pose.bones[bone(rig, 'medallion')].angle = 3 * track(t, [[0, 0], [120, -1], [240, 0.7], [420, 0]]);
		return pose;
	},
};
