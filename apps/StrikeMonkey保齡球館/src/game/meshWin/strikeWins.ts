/**
 * Strike's trophy, shoes, score card, soda, bowler, ball and pin, weighted to
 * the painted parts (measured on 2x grids of the 256 canvas).
 *
 * Every symbol hops off its card the family's way, and while it is up the
 * thing it is acts ONCE — then it lands and is still:
 *
 *   H1 trophy      hoisted: it shimmies side to side, the ball on top rocks after
 *   H2 shoes       a strut: they rock heel-toe, the front toe taps, laces flap
 *   H3 score card  the pencil marks an X, the card tips toward the player
 *   H4 soda        a toast: the glass tips, the cream (cherry on it) and straw bounce after
 *   W  bowler      a cocky lean at the top, the quiff flicks, the collar pops
 *   S  golden ball rolls a whole turn across the hop
 *   P  pin         knocked: it teeters, the head wobbles, it rights itself
 *
 * 2026-10-18 (user: livelier): ported Putt's strongLeap — the extra punch is in
 * the whole-subject move (which tears nothing), and each act is bigger, inside
 * the joints' measured limits (check_mesh_wins --limits). Still one act per
 * win, landing and still.
 */
import { blob, bump, circle, flick, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rig } from './meshRig';

const T = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160, done: 1440 };

/**
 * The family's leap, pushed: a deeper crouch, a real stretch on the way up, a
 * swell toward the player at the top, a hard squash on landing and a small rock
 * as it settles. Still one hop, then still. (Same as Putt's.)
 */
const strongLeap = (t: number, height: number) => {
	const up = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'out'], [T.fall, 1], [T.land, 0, 'in']]);
	const hop2 = bump(t, T.land + 40, T.hop2);
	const air = Math.max(0, Math.min(1, up + 0.34 * hop2));
	const squash =
		0.2 * bump(t, 10, T.crouch + 80) +
		0.26 * bump(t, T.land - 40, T.land + 130) +
		0.1 * bump(t, T.hop2 - 30, T.hop2 + 120);
	const stretch = 0.15 * bump(t, T.crouch, T.rise + 40) + 0.08 * bump(t, T.fall, T.land);
	return {
		rigid: {
			sx: 1 + squash * 0.8 - stretch * 0.55,
			sy: 1 - squash + stretch,
			rot: 2.6 * flick(t, T.land, 2.6, 5.5),
			pop: 1 + 0.09 * up + 0.03 * hop2,
			dx: 0,
			// it sinks into the crouch before it goes
			dy: -height * air + 4 * bump(t, 10, T.crouch + 60),
		},
		air,
	};
};

type Part = { name: string; parent?: string; pivot: Point; axis?: Point; dist: (p: Point) => number; hold?: number; lim: number };
type Ctx = { t: number; beat: number; live: number; air: number; B: (name: string) => Pose['bones'][number]; pose: Pose };
type Design = { symbol: string; feet: number; height: number; body: Point; soft?: number; parts: Part[]; act: (c: Ctx) => void };

const designs: Design[] = [
	{
		symbol: 'H1', feet: 241, height: 28, body: [128, 128],
		parts: [
			// the little bowling ball on top, on its stem
			{ name: 'ball', pivot: [125, 84], dist: blob([125, 50], 34, 32), hold: 5, lim: 10 },
		],
		act: ({ t, B, pose }) => {
			// held up in triumph: two shakes side to side while it is up, the
			// ball rocking a beat behind
			const shake = bump(t, T.crouch, T.fall + 80);
			pose.rigid.rot += 8 * Math.sin((t - T.crouch) / 75) * shake;
			B('ball').angle = -9.5 * Math.sin((t - T.crouch - 60) / 75) * bump(t, T.crouch + 60, T.fall + 140) + 5 * flick(t, T.land, 3, 5);
			B('ball').dy = -3 * bump(t, T.rise, T.fall);
		},
	},
	{
		symbol: 'H2', feet: 205, height: 26, body: [128, 120],
		parts: [
			{ name: 'laces', pivot: [128, 150], dist: blob([128, 125], 30, 24), hold: 5, lim: 12 },
			{ name: 'heel', pivot: [110, 90], dist: blob([105, 66], 24, 16), hold: 5, lim: 12 },
		],
		act: ({ t, B, pose }) => {
			// a strut: rock back on the heels, forward onto the toes, land square
			pose.rigid.rot += track(t, [[0, 0], [T.crouch, 3], [T.rise + 60, -10, 'out'], [T.rise + 260, 7], [T.fall, -3], [T.land, 0, 'inOut']]);
			pose.rigid.dx += track(t, [[0, 0], [T.rise + 60, -5, 'out'], [T.rise + 260, 6], [T.land, 0, 'inOut']]);
			B('laces').angle = 11 * flick(t, T.rise, 2.4, 3.2) + 6 * flick(t, T.land, 3, 5);
			B('heel').angle = track(t, [[0, 0], [T.rise + 60, 0], [T.rise + 260, -10, 'out'], [T.fall, 0, 'inOut']]) - 5 * flick(t, T.land, 3, 5);
		},
	},
	{
		symbol: 'H3', feet: 202, height: 24, body: [128, 118],
		parts: [
			// the pencil turns about its tip on the card
			{ name: 'pencil', pivot: [150, 196], axis: [1, -1.7], dist: blob([198, 110], 26, 70), hold: 6, lim: 6 },
		],
		act: ({ t, B, pose }) => {
			// it marks an X: two quick strokes while the card is up, a tap on landing
			const x = track(t, [[0, 0], [T.crouch, 0], [T.rise - 40, -5.5, 'out'], [T.rise + 70, 5.5], [T.rise + 150, -1.5], [T.rise + 240, 5], [T.fall, 0, 'inOut']]);
			B('pencil').angle = x + 3 * flick(t, T.land, 3, 5);
			B('pencil').dy = -3 * bump(t, T.rise - 40, T.rise + 260);
			// the card tips toward the player to show it
			pose.rigid.rot += track(t, [[0, 0], [T.crouch, 2.5], [T.rise + 100, -8, 'out'], [T.fall, -5], [T.land, 0, 'inOut']]);
		},
	},
	{
		symbol: 'H4', feet: 246, height: 26, body: [128, 140],
		parts: [
			// the cream with the cherry on it: the cherry alone is too small to own
			// enough of the 48-cell grid, so it rides the cream
			{ name: 'topping', pivot: [128, 90], dist: blob([128, 56], 44, 36), hold: 8, lim: 10 },
			{ name: 'straw', parent: 'topping', pivot: [150, 64], axis: [0.3, -1], dist: blob([157, 30], 10, 30), hold: 5, lim: 10 },
		],
		act: ({ t, B, pose }) => {
			// a toast: the glass tips to clink and back, the cherry and straw after
			pose.rigid.rot += track(t, [[0, 0], [T.rise, -11, 'out'], [T.rise + 140, 7], [T.fall, -2], [T.land + 120, 0]]);
			B('topping').angle = -9 * flick(t, T.rise - 20, 2.2, 3.4) + 5 * flick(t, T.land, 3, 5);
			B('topping').dy = -4 * bump(t, T.rise - 20, T.rise + 200);
			B('straw').angle = 9.5 * flick(t, T.rise + 60, 2.4, 3.2) + 6 * flick(t, T.land, 3, 5);
		},
	},
	{
		symbol: 'W', feet: 220, height: 32, body: [128, 128],
		parts: [
			{ name: 'hair', pivot: [140, 95], dist: blob([140, 68], 40, 20), hold: 6, lim: 12 },
			{ name: 'collar', pivot: [125, 185], dist: blob([125, 205], 55, 18), hold: 6, lim: 8 },
		],
		act: ({ t, B, pose }) => {
			// a cocky lean at the top of the hop, held, then square on landing
			pose.rigid.rot += track(t, [[0, 0], [T.crouch, 3], [T.rise + 160, -10, 'out'], [T.fall + 60, -9], [T.land, 0, 'inOut']]);
			B('hair').angle = 11 * flick(t, T.rise + 60, 2.4, 3.2) + 6 * flick(t, T.land, 3, 5);
			B('hair').dy = -3 * bump(t, T.rise, T.fall);
			// the collar pops up with the lean
			B('collar').angle = track(t, [[0, 0], [T.rise, 0], [T.rise + 160, 7.5, 'out'], [T.fall + 60, 7], [T.land, 0, 'inOut']]);
		},
	},
	{
		symbol: 'S', feet: 241, height: 30, body: [128, 128],
		parts: [
			{ name: 'holes', pivot: [128, 128], dist: blob([130, 112], 65, 46), hold: 5, lim: 5 },
		],
		act: ({ t, B, pose }) => {
			// it rolls: a whole turn across the hop, rocking back as it stops
			pose.rigid.rot += 360 * smoothstep((t - T.crouch) / (T.land - T.crouch)) - 7 * flick(t, T.land, 2.2, 4.5);
			B('holes').dy = -2.4 * bump(t, T.rise, T.fall);
		},
	},
	{
		symbol: 'P', feet: 243, height: 24, body: [128, 140],
		parts: [
			// the head wobbles on its neck
			{ name: 'head', pivot: [128, 105], dist: blob([128, 55], 26, 45), hold: 6, lim: 9 },
		],
		act: ({ t, B, pose }) => {
			// knocked: it teeters one way, the other, and rights itself
			pose.rigid.rot += track(t, [[0, 0], [T.crouch, 0], [T.rise, 14, 'out'], [T.rise + 220, -11], [T.fall + 60, 6], [T.land, -3], [T.hop2, 0, 'inOut']]);
			B('head').angle = -8.5 * flick(t, T.rise - 30, 2.2, 3) + 5 * flick(t, T.land, 3, 5);
		},
	},
];

const make = (d: Design): MeshWinSpec => {
	const parts: PartSpec[] = [
		{ name: 'root', pivot: [128, d.feet], dist: () => 15 },
		{ name: 'body', parent: 'root', pivot: [128, d.feet], dist: circle(d.body, 111), priority: 1 },
		...d.parts.map((p, i) => ({
			name: p.name,
			parent: p.parent ?? 'body',
			pivot: p.pivot,
			axis: p.axis ?? ([0, -1] as Point),
			priority: 4 + 2 * i,
			dist: p.dist,
			keep: (q: Point) => smoothstep((Math.hypot(q[0] - p.pivot[0], q[1] - p.pivot[1]) - (p.hold ?? 5)) / 20),
		})),
	];
	return {
		symbol: d.symbol, key: `gb${d.symbol}`, sprite: `gb${d.symbol}`,
		art: `sushiSymbols/${d.symbol.toLowerCase()}.png`, feetY: d.feet,
		durationMs: T.done, landMs: T.land, hitMs: T.rise,
		rig: { grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 }, soft: d.soft ?? 7, parts },
		limits: { body: { pos: 0, neg: 0 }, ...Object.fromEntries(d.parts.map((p) => [p.name, { pos: p.lim, neg: p.lim }])) },
		pose: (rig: Rig, t: number) => {
			const pose = restPose(rig);
			const { rigid, air } = strongLeap(t, d.height);
			pose.rigid = rigid;
			pose.air = air;
			const live = bump(t, T.crouch, T.land + 180);
			const beat = track(t, [[0, 0], [T.rise, 1, 'out'], [T.fall, -0.5], [T.land, 0.65], [T.hop2, 0]]);
			const B = (name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
			B('body').dy = -2.3 * live;
			d.act({ t, beat, live, air, B, pose });
			pose.rigid = turnAbout(pose.rigid, [128, 128], d.feet);
			return pose;
		},
	};
};

export const [H1, H2, H3, H4, W, S, P] = designs.map(make);

/** the pin landing on the board: a squash, and the head nods after it */
export const P_LAND: MeshWinSpec = {
	...P, symbol: 'P:land', durationMs: 520, landMs: 99999, hitMs: 80,
	pose: (rig, t) => {
		const pose = restPose(rig);
		const impact = bump(t, 10, 330);
		pose.rigid = turnAbout({ ...pose.rigid, sx: 1 + 0.07 * impact, sy: 1 - 0.1 * impact }, [128, 128], P.feetY);
		pose.bones[rig.bones.findIndex((b) => b.name === 'head')].angle = 3 * track(t, [[0, 0], [120, -1], [240, 0.7], [420, 0]]);
		return pose;
	},
};
