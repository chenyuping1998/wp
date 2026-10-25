/**
 * Saucer Monkey's high pays, wild, scatter and prize as meshes (2026-10-16,
 * measured on Codex's final symbol art on 2x grids of the 256 canvas).
 *
 * Every symbol hops off its card the family's way (leap), and while it is up
 * the thing it is acts once — then it lands and is still:
 *
 *   H1 ray gun     charges (the coils squeeze), fires (they spring out, the
 *                  emitter ball pops) and kicks back in the hand
 *   H2 helmet      the antenna spring boings, its ball a beat behind
 *   H3 foil hat    the crumpled tip and its bead wobble like a receiver
 *   H4 moon soda   shaken fizzy: the bottle rattles, the straw jiggles
 *   W  captain     nods inside his dome, the antenna on top boings
 *   S  saucer      banks one way and the other as it hovers, the dome rides up
 *   P  cow         tilts her head with a slow chew, flicks her ears, the
 *                  collar tag swings
 *
 * 2026-10-17 (user: livelier, still restrained): each act is bigger — a
 * deeper wind-up, a harder hit and its overshoot — inside about half of each
 * joint's measured tear limit (check_mesh_wins --limits). Still ONE act per
 * win, landing and then still: nothing loops.
 */
import { blob, bump, circle, flick, leap, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rig } from './meshRig';

const T = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160, done: 1440 };

type Part = { name: string; parent?: string; pivot: Point; axis?: Point; dist: (p: Point) => number; hold?: number; lim: number };
type Ctx = { t: number; beat: number; live: number; air: number; B: (name: string) => Pose['bones'][number]; pose: Pose };
type Design = { symbol: string; feet: number; height: number; body: Point; parts: Part[]; act: (c: Ctx) => void };

const designs: Design[] = [
	{
		symbol: 'H1', feet: 207, height: 16, body: [128, 120],
		parts: [
			// the coils and the emitter ball at their end (the ball alone is too
			// small to own its own mesh on this grid)
			{ name: 'coil', pivot: [118, 96], axis: [-1, -0.2], dist: blob([66, 86], 54, 38), hold: 14, lim: 12 },
		],
		act: ({ t, B, pose, live }) => {
			const charge = bump(t, T.crouch, T.rise + 60);
			const fire = Math.max(0, flick(t, T.rise + 40, 3.2, 6));
			B('coil').along = 1 - 0.11 * charge + 0.13 * fire;
			B('coil').angle = 2.5 * charge - 8 * flick(t, T.rise + 60, 3, 5);
			// the kick: back and up in the hand, after a small aim forward
			pose.rigid.dx += (-2.5 * charge + 10 * flick(t, T.rise + 40, 2.2, 5)) * live;
			pose.rigid.rot += 2 * charge - 9 * flick(t, T.rise + 40, 2.2, 5);
		},
	},
	{
		symbol: 'H2', feet: 232, height: 16, body: [128, 140],
		parts: [
			{ name: 'antenna', pivot: [208, 78], axis: [0.5, -1], dist: blob([220, 54], 20, 30), hold: 6, lim: 13 },
		],
		act: ({ t, B, pose }) => {
			// the helmet looks round as if someone is in it, then faces front
			pose.rigid.rot += track(t, [[0, 0], [T.rise, -5, 'out'], [T.fall, 4], [T.land + 60, -1], [T.hop2, 0]]);
			// the spring: boing on the way up, again on the landing
			B('antenna').angle = 11 * flick(t, T.rise - 60, 2.6, 3.4) + 6 * flick(t, T.land, 3.4, 5);
			B('antenna').along = 1 + 0.12 * Math.max(0, flick(t, T.land, 4, 7));
		},
	},
	{
		symbol: 'H3', feet: 220, height: 14, body: [128, 160],
		parts: [
			{ name: 'tip', pivot: [132, 98], dist: blob([134, 58], 20, 36), hold: 12, lim: 16 },
		],
		act: ({ t, B, pose }) => {
			// it tunes in: a tilt one way, a snap the other as the signal hits
			pose.rigid.rot += track(t, [[0, 0], [T.rise, -4, 'out'], [T.fall - 120, -4], [T.fall, 5], [T.land + 80, 0]]);
			B('tip').angle = 12 * flick(t, T.rise - 40, 2.2, 3.2) + 7 * flick(t, T.fall, 3, 4.5);
			B('tip').along = 1 + 0.09 * bump(t, T.rise, T.fall) - 0.08 * bump(t, T.land - 40, T.land + 160);
		},
	},
	{
		symbol: 'H4', feet: 232, height: 15, body: [130, 150],
		parts: [{ name: 'straw', pivot: [136, 84], axis: [0.55, -1], dist: blob([148, 52], 15, 32), hold: 8, lim: 14 }],
		act: ({ t, B, pose, live }) => {
			// shaken: three hard rattles while it is up, the straw against them —
			// then the fizz pops the straw up on the landing and it is still
			const shake = Math.sin(t / 38) * bump(t, T.crouch, T.fall);
			pose.rigid.rot += 6 * shake;
			B('straw').angle = -9 * shake + 8 * flick(t, T.land, 3, 5) * live;
			B('straw').along = 1 + 0.12 * Math.max(0, flick(t, T.land - 20, 3.4, 6));
		},
	},
	{
		symbol: 'W', feet: 224, height: 22, body: [135, 128],
		parts: [
			{ name: 'head', pivot: [135, 192], dist: blob([138, 130], 60, 56), hold: 30, lim: 6.5 },
			{ name: 'antenna', pivot: [162, 66], dist: blob([162, 46], 12, 22), hold: 6, lim: 16 },
		],
		act: ({ t, B }) => {
			// a cocky nod: chin down on the way up, thrown back on top
			B('head').angle = track(t, [[0, 0], [T.rise, -4, 'out'], [T.fall, 5], [T.land + 80, -1.8], [T.hop2 + 80, 0]]);
			B('head').dy = -3.5 * bump(t, T.rise, T.land);
			B('antenna').angle = 12 * flick(t, T.rise - 20, 2.6, 3.2) + 5 * flick(t, T.land, 3.2, 5);
		},
	},
	{
		symbol: 'S', feet: 183, height: 20, body: [134, 130],
		parts: [{ name: 'dome', pivot: [130, 118], dist: blob([130, 96], 46, 26), hold: 8, lim: 9 }],
		act: ({ t, B, pose }) => {
			// banks into a turn and back while it hovers
			pose.rigid.rot += track(t, [[0, 0], [T.rise, -12, 'out'], [T.fall, 10], [T.land, -4], [T.hop2, 0]]);
			B('dome').dy = -7 * bump(t, T.rise, T.fall + 80);
			B('dome').angle = 6 * flick(t, T.fall, 2, 4);
		},
	},
	{
		symbol: 'P', feet: 236, height: 14, body: [135, 170],
		parts: [
			{ name: 'head', pivot: [148, 166], dist: blob([135, 100], 95, 66), hold: 26, lim: 5 },
			{ name: 'earL', parent: 'head', pivot: [94, 80], axis: [-1, 0], dist: blob([62, 72], 28, 16), hold: 6, lim: 12 },
			{ name: 'earR', parent: 'head', pivot: [186, 70], axis: [1, 0], dist: blob([208, 62], 26, 16), hold: 6, lim: 12 },
			{ name: 'tag', pivot: [145, 168], axis: [0, 1], dist: circle([135, 200], 34), hold: 8, lim: 10 },
		],
		act: ({ t, B }) => {
			B('head').angle = track(t, [[0, 0], [T.rise, -3.5, 'out'], [T.fall, 3], [T.land + 60, -1], [T.hop2 + 60, 0]]);
			// the chew: the muzzle side of her head squeezes twice
			B('head').across = 1 + 0.025 * bump(t, T.fall, T.fall + 180) + 0.025 * bump(t, T.land + 60, T.land + 240);
			B('earL').angle = -10 * flick(t, T.rise + 60, 3.2, 5);
			B('earR').angle = 10 * flick(t, T.land, 3.2, 5);
			B('tag').angle = 8 * flick(t, T.rise, 1.8, 2.6);
		},
	},
];

const make = (d: Design): MeshWinSpec => {
	const parts: PartSpec[] = [
		{ name: 'root', pivot: [128, d.feet], dist: () => 15 },
		{ name: 'body', parent: 'root', pivot: [128, d.feet], dist: circle(d.body, 104), priority: 1 },
		...d.parts.map((p, i) => ({
			name: p.name,
			parent: p.parent ?? 'body',
			pivot: p.pivot,
			axis: p.axis ?? ([0, -1] as Point),
			priority: 4 + 2 * i,
			dist: p.dist,
			keep: (q: Point) => smoothstep((Math.hypot(q[0] - p.pivot[0], q[1] - p.pivot[1]) - (p.hold ?? 6)) / 20),
		})),
	];
	const spec: MeshWinSpec = {
		symbol: d.symbol, key: `gb${d.symbol}`, sprite: `gb${d.symbol}`,
		art: `sushiSymbols/${d.symbol.toLowerCase()}.png`, feetY: d.feet,
		durationMs: T.done, landMs: T.land, hitMs: T.rise,
		rig: { grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 }, soft: 7, parts },
		limits: { body: { pos: 0, neg: 0 }, ...Object.fromEntries(d.parts.map((p) => [p.name, { pos: p.lim, neg: p.lim }])) },
		pose: (rig: Rig, t: number) => {
			const pose = restPose(rig);
			const { rigid, air } = leap(t, T, d.height);
			pose.rigid = rigid;
			pose.air = air;
			const live = bump(t, T.crouch, T.land + 180);
			const beat = track(t, [[0, 0], [T.rise, 1, 'out'], [T.fall, -0.5], [T.land, 0.65], [T.hop2, 0]]);
			const B = (name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
			B('body').dy = -2 * live;
			d.act({ t, beat, live, air, B, pose });
			pose.rigid = turnAbout(pose.rigid, [128, 128], d.feet);
			return pose;
		},
	};
	return spec;
};

export const [H1, H2, H3, H4, W, S, P] = designs.map(make);

/** the prize landing on the board: a squash, the head and tag react */
export const P_LAND: MeshWinSpec = {
	...P, symbol: 'P:land', durationMs: 520, landMs: 99999, hitMs: 80,
	pose: (rig, t) => {
		const pose = restPose(rig);
		const impact = bump(t, 10, 330);
		pose.rigid = turnAbout({ ...pose.rigid, sx: 1 + 0.07 * impact, sy: 1 - 0.1 * impact }, [128, 128], P.feetY);
		const B = (name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
		B('head').angle = 3 * track(t, [[0, 0], [120, -1], [240, 0.7], [420, 0]]);
		B('tag').angle = 6 * flick(t, 60, 2.4, 6);
		return pose;
	},
};
