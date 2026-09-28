/**
 * H2 — THE COMET. A rock with a tail: the rock lunges forward along its own
 * path (down and to the left, where the drawing is heading), and the tail does
 * what tails do — it DRAGS, stretching long behind the lunge, then whips back
 * past rest and settles in two links, the tip later and wider than the root.
 * That lag is the whole read: something heavy in front, something light
 * behind it.
 *
 * THE TAIL IS THREE STREAKS, not one: the drawing has an upper thin streak
 * over the rock's shoulder, the big middle one, and the lower curved ones, set
 * apart ACROSS the tail's axis. Each hangs off the tail on a bone of its own and
 * sways on its own phase, so the tail flows like a flame instead of flapping as
 * one piece. And the craters — the white-hot pits in the rock — glow and pulse
 * (spec.feature), cold, while it burns through.
 */
import { blob, bump, flick, polygon, ramp, restPose, smoothstep, track, type MeshWinSpec, type Point, type Rig, boneOf, landFlick } from './meshRig';

const T = { wind: 120, lunge: 280, back: 620, done: 1000 };
const PIVOT: Point = [118, 118];
const AXIS: Point = [0.72, -0.69];
// px along the tail from its root, for the joint ramps
const along = (p: Point) => (p[0] - PIVOT[0]) * AXIS[0] + (p[1] - PIVOT[1]) * AXIS[1];
// across the tail, perpendicular to AXIS (down-right is +): the upper streak
// runs at about -40, the middle at 0, the lower ones at +50..80
const N: Point = [0.69, 0.72];
const across = (p: Point) => (p[0] - PIVOT[0]) * N[0] + (p[1] - PIVOT[1]) * N[1];
const TAIL_POLY = polygon([[96, 96], [158, 40], [232, 16], [238, 70], [198, 158], [150, 214], [128, 150]]);
// the three bands, [low, high] across the axis
const STREAKS: [string, number, number][] = [
	['streak_up', -200, -18],
	['streak_mid', -18, 30],
	['streak_low', 30, 200],
];
const STREAK_FROM = 24;
const streakPart = ([name, lo, hi]: [string, number, number]) => {
	const mid = Math.max(-40, Math.min(60, (lo + hi) / 2));
	return {
		name,
		parent: 'tail',
		pivot: [PIVOT[0] + AXIS[0] * (STREAK_FROM + 6) + N[0] * mid, PIVOT[1] + AXIS[1] * (STREAK_FROM + 6) + N[1] * mid] as Point,
		axis: AXIS,
		priority: 1,
		dist: (p: Point) => {
			if (along(p) < STREAK_FROM) return 14;
			const q = across(p);
			return Math.max(TAIL_POLY(p), q < lo ? lo - q : q > hi ? q - hi : 0);
		},
		keep: (p: Point) => smoothstep((along(p) - STREAK_FROM) / 24),
	};
};

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	sprite: 'gbH2',
	feetY: 200,
	durationMs: T.done,
	landMs: T.back,
	hitMs: 260,
	rig: {
		grid: { x0: 22, y0: 20, x1: 236, y1: 234, cols: 46, rows: 46 },
		soft: 4,
		parts: [
			{ name: 'core', pivot: [82, 152], dist: (p) => Math.min(14, blob([82, 152], 56, 48, 2.4)(p)) },
			{
				name: 'tail',
				parent: 'core',
				pivot: PIVOT,
				axis: AXIS,
				dist: polygon([[96, 96], [158, 40], [232, 16], [238, 70], [198, 158], [150, 214], [128, 150]]),
				keep: (p) => smoothstep((along(p) - 2) / 22),
			},
			...STREAKS.map(streakPart),
		],
	},
	// the craters: white-hot (blue at least as strong as red — the rock is tan)
	// and bright, inside the rock
	feature: {
		test: (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b > 170 && b >= r,
		inside: (p) => blob([82, 156], 62, 54, 2.4)(p) === 0 && p[1] > 112,
		tint: 0xbff6ff,
	},
	// geometric (check_mesh_wins.mjs H2 --limits): tail +5.5 -6.5,
	//   streak_up +15.5 -19.5   streak_mid +13 -11.5   streak_low +12 -9.5
	limits: {
		tail: { pos: 4.5, neg: 5 },
		streak_up: { pos: 9, neg: 9 },
		streak_mid: { pos: 8, neg: 8 },
		streak_low: { pos: 7, neg: 7 },
	},
	// landing: the tail whips, the streaks after it one by one
	land: (rig, t, k, pose) => {
		boneOf(rig, pose, 'tail').angle = 2.5 * k * landFlick(t, 30);
		STREAKS.forEach(([name], i) => (boneOf(rig, pose, name).angle = 2.5 * k * landFlick(t, 55 + i * 20)));
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// 1 at the far end of the lunge
		const lunge = track(t, [[0, 0], [T.wind, -0.3, 'out'], [T.lunge, 1, 'back'], [T.back, 1], [900, 0, 'inOut']]);

		pose.rigid = {
			sx: 1 + 0.03 * bump(t, T.wind - 40, T.lunge + 60),
			sy: 1 - 0.03 * bump(t, T.wind - 40, T.lunge + 60),
			// the rock tumbles a little as it goes
			rot: -5 * lunge + 1.5 * flick(t, T.back, 2, 4),
			pop: 1 + 0.03 * Math.max(0, lunge),
			dx: -6 * lunge,
			dy: 5 * lunge,
		};

		// the tail: long behind the lunge, then a whip past rest
		const tail = b('tail');
		tail.along = 1 + 0.14 * Math.max(0, lunge) * (1 - ramp(t, T.back - 80, T.back + 100)) - 0.05 * bump(t, 60, 180);
		tail.across = 1 - 0.04 * Math.max(0, lunge);
		const whip = flick(t, T.back - 60, 1.9, 3);
		tail.angle = 3 * whip + 1.2 * Math.sin((2 * Math.PI * t) / 340) * ramp(t, 200, 320) * (1 - ramp(t, 520, 640));
		// the streaks: each whips a beat after the one before and sways on its own
		// phase while the rock hangs — a flame, not a flag
		const hang = ramp(t, 230, 350) * (1 - ramp(t, 540, 680));
		STREAKS.forEach(([name], i) => {
			const st = b(name);
			const amp = [6, 6.5, 5][i];
			st.angle = amp * flick(t, T.back + i * 45, 1.9, 2.6) + 3 * Math.sin((2 * Math.PI * (t - 90 - i * 70)) / 300) * hang;
			st.along = 1 + (0.05 + 0.02 * i) * Math.max(0, lunge) * (1 - ramp(t, T.back - 60, T.back + 120)) + 0.03 * hang * Math.sin((2 * Math.PI * (t - i * 90)) / 260);
		});

		// the craters glow as it burns in, pulse while it hangs, and cool
		pose.feature = Math.min(0.9, 0.55 * ramp(t, 140, 300) * (1 - ramp(t, 700, 900)) * (0.75 + 0.25 * Math.sin((2 * Math.PI * t) / 180)) + 0.35 * bump(t, T.lunge - 40, T.lunge + 160));

		pose.air = 0.6 * Math.max(0, lunge);
		pose.flash = 0.3 * track(t, [[T.wind, 0], [T.lunge, 1, 'out'], [620, 0, 'in']]);
		pose.sheen = t >= 320 && t <= 800 ? (t - 320) / 480 : -1;
		pose.plateHit = 1 + 0.03 * bump(t, T.wind, 420);
		return pose;
	},
};
