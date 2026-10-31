/**
 * Putt Monkey's high pays, wild, scatter and prize as meshes (2026-10-17,
 * measured on Codex's final symbol art on 2x grids of the 256 canvas).
 *
 * Each subject anticipates, performs its own act and settles onto its card:
 *
 *   H1 windmill    winds back, spins twice and brakes (H1_WIN below)
 *   H2 dinosaur    lunges into a chomp, then sneaks in a smaller second bite
 *   H3 golf bag    two weighted swings; clubs lead, towel follows
 *   H4 lemonade    the lemon wheel rocks on the rim, the straw jiggles
 *   W  golfer      tips his cap at the top of the hop, the pompom bounces
 *   S  golden flag snaps in a breeze, the wave running out to its point
 *   P  golf ball   rolls a whole turn across the hop
 *
 * 2026-10-17 (user: livelier, still restrained): each act is bigger and most
 * get a whole-symbol lean that sells it — still ONE act per win, inside the
 * joints' measured tear limits (check_mesh_wins --limits), landing and still.
 */
import { blob, bump, circle, flick, hump, impact, polygon, polyline, restPose, smoothstep, track, turnAbout, withFollow, type Follow, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rig } from './meshRig';

const T = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160, done: 1440 };

/** Continuous rise and fall, restrained squash and a small landing recoil.
 * Joint amplitudes remain within the measured mesh limits. */
const strongLeap = (t: number, height: number, symbol: string) => {
	// One continuous arc rather than a 430ms freeze at the apex. Heavy props
	// stay grounded; the golfer gets a springier celebration.
	const apex = symbol === 'H2' ? 400 : symbol === 'H4' ? 510 : 460;
	const up = track(t, [[0, 0], [T.crouch, 0], [apex, 1], [T.land, 0, 'in']]);
	// 2026-10-23 (spine-generator's smoothness check): every move starts and
	// stops at rest (hump) except the two landings, which hit (impact) — a
	// hard squash the moment it touches, sprung back at the measured 4Hz
	const hop2 = hump(t, T.land + 20, T.hop2 + 20);
	const air = Math.max(0, Math.min(1, up + 0.14 * hop2));
	const squash =
		0.1 * hump(t, 0, T.crouch + 100) +
		0.13 * impact(t, T.land) +
		0.035 * impact(t, T.hop2);
	const stretch = 0.075 * hump(t, T.crouch - 20, T.rise + 60) + 0.035 * hump(t, T.fall - 20, T.land);
	return {
		rigid: {
			sx: 1 + squash * 0.8 - stretch * 0.55,
			sy: 1 - squash + stretch,
			rot: 2.6 * flick(t, T.land, 2.6, 5.5),
			pop: 1 + 0.12 * up + 0.015 * hop2,
			dx: 0,
			// it sinks into the crouch before it goes
			dy: -height * air + 4 * hump(t, 0, T.crouch + 80),
		},
		air,
	};
};

/** `follow`: the part's follow-through on top of its act (meshRig.withFollow),
 *  as the share of its limit the swing peaks at; `len` how far out its weight
 *  hangs. Landings and idles (acts.ts) rescale the share for their own beat. */
type Part = { name: string; parent?: string; pivot: Point; axis?: Point; dist: (p: Point) => number; hold?: number; lim: number; follow?: number; len?: number; give?: boolean };
type Ctx = { t: number; beat: number; live: number; air: number; B: (name: string) => Pose['bones'][number]; pose: Pose };
type Design = { symbol: string; feet: number; height: number; body: Point; soft?: number; parts: Part[]; act: (c: Ctx) => void; events?: number[] };

const designs: Design[] = [
	{
		symbol: 'H1', feet: 224, height: 26, body: [129, 150], soft: 10,
		parts: [
			// the four sails as one, turning about the hub
			{ name: 'sails', follow: 0.3, len: 60, pivot: [129, 104], // the lower arms end over the house's walls: they stop short (y 168) so
			// the house is not dragged with them
			dist: (q: Point) => Math.min(polyline([[52, 32], [196, 168]], 20).dist(q), polyline([[206, 32], [62, 168]], 20).dist(q)) + Math.max(0, q[1] - 168) * 2, hold: 12, lim: 8 },
		],
		act: ({ t, B, pose }) => {
			// a gust gives the sails a quarter push, and they ease back; the
			// whole mill leans with the gust and rights itself
			B('sails').angle = track(t, [[0, 0], [T.crouch, -3], [T.rise + 120, 7.8, 'out'], [T.fall, 5], [T.land, -3], [T.hop2 + 60, 1.5], [T.done - 60, 0, 'inOut']]);
			pose.rigid.rot += track(t, [[0, 0], [T.crouch, 2.5], [T.rise + 120, -9, 'out'], [T.fall, -6], [T.land, 2], [T.hop2 + 60, 0, 'inOut']]);
		},
	},
	{
		symbol: 'H2', feet: 212, height: 16, body: [128, 140], events: [T.rise + 110], // the bite snaps shut
		parts: [
			{ name: 'snout', follow: 0.3, len: 50, pivot: [150, 112], axis: [1, -0.3], dist: blob([192, 84], 50, 36), hold: 14, lim: 10 },
			{ name: 'jaw', follow: 0.3, len: 40, pivot: [156, 150], axis: [1, 0.3], dist: blob([196, 172], 42, 22), hold: 10, lim: 11 },
		],
		act: ({ t, B, pose }) => {
			// it rears back as it opens and lunges into the bite
			pose.rigid.rot += track(t, [[0, 0], [160, 5], [350, -13], [460, 16, 'in'], [620, -5], [780, 7], [T.land, -3], [1170, 0]]);
			// it lunges at the player as it bites
			pose.rigid.dx += track(t, [[0, 0], [180, -4], [370, -12], [460, 19, 'in'], [640, -4], [780, 8], [T.land, 0]]);
			// a chomp: open wide on the way up, snap shut at the top, a smaller one on landing
			B('jaw').angle = track(t, [[0, 0], [T.rise + 20, 10.5], [T.rise + 110, -3, 'in'], [650, 6], [780, -2, 'in'], [T.land, 5], [T.land + 110, -1], [T.hop2, 0]]);
			B('snout').angle = track(t, [[0, 0], [T.rise + 20, -9], [T.rise + 110, 2, 'in'], [650, -4], [780, 1, 'in'], [T.land, -3], [T.land + 110, 1], [T.hop2, 0]]);
		},
	},
	{
		symbol: 'H3', feet: 226, height: 19, body: [122, 150],
		parts: [
			{ name: 'clubs', follow: 0.3, len: 45, pivot: [128, 86], dist: blob([128, 48], 58, 24), hold: 10, lim: 14 },
			{ name: 'towel', follow: 0.3, len: 50, pivot: [160, 92], axis: [0.2, 1], dist: blob([166, 142], 24, 54), hold: 8, lim: 9 },
		],
		act: ({ t, B, pose }) => {
			// The bag changes direction twice; the loose parts lag each turn.
			pose.rigid.rot += track(t, [[0, 0], [T.crouch, -7], [360, 16], [600, -13], [T.fall, 7], [T.land, -3], [1140, 2], [1310, 0]]);
			pose.rigid.dx += track(t, [[0, 0], [T.crouch, -4], [360, 9], [600, -8], [T.fall, 4], [T.land, 0]]);
			// Two readable swings, then a small delayed rattle. The clubs lead
			// and the hanging towel catches up, instead of vibrating in unison.
			B('clubs').angle = track(t, [[0, 0], [200, -8], [410, 11], [650, -7], [850, 3], [T.land, 0]]) + 5 * flick(t, T.land, 3, 6);
			// the heads jump in the bag as it lands
			B('clubs').along = 1 + 0.12 * Math.max(0, flick(t, T.land - 20, 3.4, 6));
			B('towel').angle = track(t, [[0, 0], [280, 5], [490, -7], [730, 6], [980, -3], [1280, 0]]);
		},
	},
	{
		symbol: 'H4', feet: 218, height: 14, body: [134, 148],
		parts: [
			{ name: 'lemon', follow: 0.3, len: 30, pivot: [112, 78], dist: circle([88, 58], 34), hold: 8, lim: 10 },
			{ name: 'straw', follow: 0.3, len: 45, pivot: [160, 112], axis: [0.5, -1], dist: blob([180, 70], 14, 46), hold: 8, lim: 11 },
		],
		act: ({ t, B, pose }) => {
			// a toast: the glass tips to clink and back, the lemon and straw after
			pose.rigid.rot += track(t, [[0, 0], [160, 5], [T.rise, -17], [510, 13], [710, -6], [T.land, 4], [1120, -2], [1320, 0]]);
			pose.rigid.dx += track(t, [[0, 0], [T.crouch, -3], [T.rise + 140, 9], [T.fall, 3], [T.land, 0]]);
			B('lemon').angle = -10 * flick(t, T.rise - 20, 2, 3) + 4 * flick(t, T.land, 3, 5);
			B('straw').angle = 10.5 * flick(t, T.rise + 60, 2.4, 3.2) + 7 * flick(t, T.land, 3, 5);
		},
	},
	{
		symbol: 'W', feet: 224, height: 40, body: [128, 140],
		parts: [
			// the flat cap tips from its right brim; the pompom bounces on it
			{ name: 'cap', len: 60, pivot: [186, 104], axis: [-1, 0], dist: blob([120, 84], 70, 30), hold: 16, lim: 6 },
			{ name: 'pompom', follow: 0, len: 22, give: false, // its win already works the mesh to 159%
				 parent: 'cap', pivot: [118, 60], dist: circle([118, 40], 22), hold: 6, lim: 17 },
		],
		act: ({ t, B, pose }) => {
			// a cheeky tip of the cap at the top of the hop, head cocked with it
			B('cap').angle = track(t, [[0, 0], [T.crouch, -1], [T.rise + 160, 5.5], [T.fall, 3], [T.land + 60, -0.8], [T.hop2 + 80, 0]]);
			pose.rigid.rot += track(t, [[0, 0], [T.crouch, 8], [360, -14], [550, -10], [760, 9], [T.land, -5], [1140, 3], [1330, 0]]);
			pose.rigid.dx += track(t, [[0, 0], [T.crouch, -3], [420, 8], [760, -5], [T.land, 0]]);
			B('pompom').angle = 16 * flick(t, T.rise + 80, 2.4, 3.2) + 10 * flick(t, T.land, 3, 5);
		},
	},
	{
		symbol: 'S', feet: 220, height: 28, body: [134, 150],
		parts: [
			{ name: 'flag', follow: 0.3, len: 60, pivot: [102, 100], axis: [1, 0], dist: polygon([[104, 54], [214, 108], [104, 148]]), hold: 6, lim: 7 },
			{ name: 'flagTip', follow: 0.3, len: 30, parent: 'flag', pivot: [160, 102], axis: [1, 0], dist: polygon([[160, 80], [214, 108], [160, 128]]), hold: 4, lim: 15 },
		],
		act: ({ t, B, pose }) => {
			// the flag cracks in a gust: a wave travels out to its point, and
			// the pin leans into the wind with it
			const wave = bump(t, T.crouch, T.land + 220);
			pose.rigid.rot += track(t, [[0, 0], [T.crouch, 6], [380, -12], [620, 6], [T.fall, -7], [T.land, 3], [1240, 0]]);
			B('flag').angle = 5.5 * Math.sin(t / 80) * wave;
			B('flag').across = 1 + 0.06 * Math.sin(t / 80 + 1) * wave;
			B('flagTip').angle = 13 * Math.sin(t / 80 - 1.2) * wave;
		},
	},
	{
		symbol: 'P', feet: 225, height: 30, body: [128, 128],
		parts: [],
		act: ({ t, pose }) => {
			// it rolls: a whole turn across the hop
			pose.rigid.rot += 360 * smoothstep((t - T.crouch) / (T.land - T.crouch));
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
		// the take-off, the second landing, and whatever the act snaps on
		events: [T.crouch, T.land, T.hop2, ...(d.events ?? [])],
		rig: { grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 }, soft: d.soft ?? 7, parts },
		limits: { body: { pos: 0, neg: 0 }, ...Object.fromEntries(d.parts.map((p) => [p.name, { pos: p.lim, neg: p.lim }])) },
		pose: (rig: Rig, t: number) => {
			const pose = restPose(rig);
			const { rigid, air } = strongLeap(t, d.height, d.symbol);
			pose.rigid = rigid;
			pose.air = air;
			const live = hump(t, T.crouch - 40, T.land + 220);
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

/** every symbol's follow-through, for the wins here and the landings and
 *  idles in acts.ts */
export const FOLLOW: Record<string, Follow[]> = Object.fromEntries(
	designs.map((d) => [d.symbol, d.parts.filter((p) => p.follow !== undefined).map((p) => ({ part: p.name, gain: 1, share: p.follow!, len: p.len, give: p.give }))]),
);

// a part at follow 0 sits out the win (its act leaves no room) but still
// answers its landings and idles, which rescale the share
export const [H1, H2, H3, H4, W, S, P] = designs.map((d) => withFollow(make(d), FOLLOW[d.symbol].filter((f) => f.share! > 0)));

/**
 * H1's WIN with separate turning sails (2026-10-24, user: 繼續優化).
 * The sails are cut off the painting (design/build_h1_sails.py): the mesh
 * draws the house (h1_house.png, the cap and tower repainted under them) and
 * SymbolMeshWin turns gbH1Sails about the hub, riding the mesh. So this rig has
 * no sails bone at all — the house only leaps and leans into the gust. The
 * landing and idle acts keep the old rig and the whole painting.
 */
const H1_HOUSE: Design = {
	...designs[0],
	parts: [],
	act: ({ t, pose }) => {
		// The mill winds back against its sails, then gets pulled into the gust.
		pose.rigid.rot += track(t, [[0, 0], [T.crouch, 7], [340, -13], [600, 5], [T.fall, -8], [T.land, 4], [1140, -2], [1320, 0]]);
		pose.rigid.dx += track(t, [[0, 0], [T.crouch, -4], [400, 7], [700, -4], [T.land, 0]]);
	},
};
export const H1_WIN: MeshWinSpec = {
	...make(H1_HOUSE),
	sprite: 'gbH1House',
	art: 'sushiSymbols/h1_house.png',
	spinner: {
		key: 'gbH1Sails',
		hub: [128.75, 106],
		// A comic wind-up, two fast turns, then an overshoot and a brake.
		turn: (t) =>
			track(t, [[0, 0], [T.crouch, -28], [T.rise, 110, 'in'], [650, 515, 'linear'], [T.land, 738, 'out'], [1160, 711], [T.done - 40, 720], [T.done, 720]]) % 360,
	},
};

/** the prize landing on the board: a squash, and it settles with a small roll back */
export const P_LAND: MeshWinSpec = {
	...P, symbol: 'P:land', durationMs: 520, landMs: 99999, hitMs: 80,
	pose: (rig, t) => {
		const pose = restPose(rig);
		const impact = bump(t, 10, 330);
		pose.rigid = turnAbout({ ...pose.rigid, sx: 1 + 0.07 * impact, sy: 1 - 0.1 * impact, rot: 6 * track(t, [[0, 0], [120, -1], [260, 0.5], [420, 0]]) }, [128, 128], P.feetY);
		return pose;
	},
};
