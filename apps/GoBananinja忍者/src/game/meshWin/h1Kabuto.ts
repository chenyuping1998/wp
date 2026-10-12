/**
 * H1 — THE KABUTO. A red samurai helmet: the bowl with its crest disc, two
 * crescent horns (kuwagata) rising off the crest, the side guards
 * (fukigaeshi and the lamellar neck plates) hanging either side, and the
 * cord tied in a knot under the chin.
 *
 * The bowl is the body and stays whole. What answers the move is what is
 * hung on it: on the launch the horns are flung back and TWANG — two thin
 * crescents vibrating like struck steel, the outer tips a beat behind — the
 * side guards flare out like a war-cry and flap down again, and the cord knot
 * swings under the chin and keeps swinging after the landing. The rigid leap
 * (leaps.ts) does the travel; these are the follow-through.
 *
 * Timed on the leap's clock (leaps.ts L): crouch 150, launch 230, top 480,
 * land 900, rebound land 1160, rest 1300.
 */
import {
	bump,
	flick,
	polygon,
	polyline,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const T = { crouch: 150, launch: 230, top: 480, land: 900, rebound: 1160, done: 1450 };

const BODY = polygon([[60, 30], [196, 30], [206, 100], [200, 160], [232, 176], [226, 204], [170, 206], [86, 206], [30, 204], [24, 176], [56, 160], [50, 100]]);
// the crescents, each traced from its root on the crest out to both tips
const HORN_L_PTS: Point[] = [[8, 22], [42, 16], [72, 22], [102, 4], [114, 26], [110, 64], [120, 84], [100, 96], [74, 86], [50, 60], [26, 40]];
const HORN_L = polygon(HORN_L_PTS);
const HORN_R = polygon(HORN_L_PTS.map(([x, y]) => [256 - x, y] as Point));
const GUARD_L = polygon([[2, 92], [40, 84], [66, 96], [66, 150], [52, 196], [4, 190]]);
const GUARD_R = polygon([[254, 92], [216, 84], [190, 96], [190, 150], [204, 196], [252, 190]]);
const CORD = polyline([[128, 198], [128, 236]], 30);
const HORN_ROOT_L: Point = [112, 86];
const HORN_ROOT_R: Point = [144, 86];

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	feetY: 206,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.launch,
	flashTint: 0xff7a4a,
	smear: { ghosts: 2, stepMs: 22, alpha: 0.32, fullAtPx: 10, trail: 1.25 },
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 250, cols: 52, rows: 50 },
		soft: 4,
		parts: [
			{ name: 'bowl', pivot: [128, 206], axis: [0, -1], dist: BODY },
			{
				name: 'horn_l',
				parent: 'bowl',
				pivot: HORN_ROOT_L,
				axis: [-1, -0.7],
				priority: 2,
				dist: HORN_L,
				// RADIAL about the root on the crest: the horn is welded there, free at the tips
				keep: (p) => smoothstep((Math.hypot(p[0] - HORN_ROOT_L[0], p[1] - HORN_ROOT_L[1]) - 10) / 26),
			},
			{
				name: 'horn_r',
				parent: 'bowl',
				pivot: HORN_ROOT_R,
				axis: [1, -0.7],
				priority: 2,
				dist: HORN_R,
				keep: (p) => smoothstep((Math.hypot(p[0] - HORN_ROOT_R[0], p[1] - HORN_ROOT_R[1]) - 10) / 26),
			},
			{
				name: 'guard_l',
				parent: 'bowl',
				pivot: [64, 104],
				axis: [-0.6, 1],
				priority: 1,
				dist: GUARD_L,
				keep: (p) => smoothstep((70 - p[0]) / 18),
			},
			{
				name: 'guard_r',
				parent: 'bowl',
				pivot: [192, 104],
				axis: [0.6, 1],
				priority: 1,
				dist: GUARD_R,
				keep: (p) => smoothstep((p[0] - 186) / 18),
			},
			{
				name: 'knot',
				parent: 'bowl',
				pivot: [128, 192],
				axis: [0, 1],
				priority: 2,
				dist: CORD.dist,
				keep: (p) => smoothstep((p[1] - 196) / 14),
			},
		],
	},
	// Geometric (check_mesh_wins.mjs --limits, 2026-10-04, on the 512 layers):
	//   horn_l +6.5 -6.5   horn_r +7 -6   guard_l +5.5 -4.5   guard_r +4.5 -5.5
	//   knot +8 -7
	limits: {
		horn_l: { pos: 5.5, neg: 5.5 },
		horn_r: { pos: 5.5, neg: 5.5 },
		guard_l: { pos: 4, neg: 4 },
		guard_r: { pos: 4, neg: 4 },
		knot: { pos: 6.5, neg: 6.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// the horns: flung back on the launch, then the twang — a fast decaying
		// vibration; again on the landing. + turns clockwise: the left horn's tips
		// go UP for -, the right's for +
		const twang = (t0: number) => flick(t, t0, 7.5, 6);
		const hornL = 1.0 * bump(t, T.crouch, T.top) + twang(T.launch) + 0.8 * twang(T.land);
		const hornR = 1.0 * bump(t, T.crouch, T.top) + flick(t, T.launch + 25, 7.5, 6) + 0.8 * flick(t, T.land + 25, 7.5, 6);
		b('horn_l').angle = -2.5 * hornL;
		b('horn_r').angle = 2.5 * hornR;
		// ...and the crescents reach out as they are flung
		b('horn_l').along = 1 + 0.015 * bump(t, T.crouch, T.top);
		b('horn_r').along = 1 + 0.015 * bump(t, T.crouch, T.top);
		// the guards flare on the launch (a war cry), drop as it falls, slap on the landing
		const flare = bump(t, T.crouch, T.land - 120) + 0.55 * flick(t, T.land, 3.2, 4.5);
		b('guard_l').angle = 3.2 * flare;
		b('guard_r').angle = -3.2 * flare;
		b('guard_l').across = 1 + 0.03 * Math.max(0, flare);
		b('guard_r').across = 1 + 0.03 * Math.max(0, flare);
		// the knot under the chin: left behind on the launch, swinging long after
		b('knot').angle = 4.5 * flick(t, T.launch, 1.9, 2.2) - 4 * flick(t, T.land, 2.4, 3);
		b('knot').along = 1 + 0.05 * bump(t, T.land, T.land + 180);
		pose.flash = 0.55 * bump(t, T.crouch, 520) + 0.25 * bump(t, T.land, T.land + 220);
		pose.sheen = t >= 420 && t <= 1000 ? (t - 420) / 580 : -1;
		return pose;
	},
};
