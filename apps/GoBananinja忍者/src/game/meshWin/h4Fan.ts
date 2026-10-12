/**
 * H4 — THE WAR FAN. A folding fan painted with breaking waves, its black ribs
 * gathered at a steel rivet, two guard sticks on the outside and a pair of
 * blue tassels on cords under the rivet.
 *
 * A fan's move is to SNAP OPEN. Each half turns outward about the rivet and the
 * paper between them spreads — not as two cards hinged at a seam, but with the
 * turn handed over ACROSS ANGLE (each half keeps more of its turn the further
 * round it lies from the top rib), so every rib turns a little more than its
 * neighbour, the way a real fan opens. Then it flutters (a quick fan-flick,
 * twice) and the tassels, hanging free under the rivet, swing behind it.
 */
import {
	bump,
	circle,
	flick,
	polygon,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const T = { crouch: 150, launch: 230, top: 480, land: 900, done: 1450 };
const PIVOT: Point = [127, 183];
/** degrees round the rivet, 0 right, -90 straight up */
const angleOf = (p: Point) => (Math.atan2(p[1] - PIVOT[1], p[0] - PIVOT[0]) * 180) / Math.PI;
const radius = (p: Point) => Math.hypot(p[0] - PIVOT[0], p[1] - PIVOT[1]);
const FAN = polygon([[2, 108], [16, 76], [40, 50], [80, 28], [128, 16], [176, 28], [216, 50], [242, 78], [254, 118], [254, 146], [190, 176], [140, 194], [114, 194], [60, 160], [2, 132]]);

export const H4: MeshWinSpec = {
	symbol: 'H4',
	key: 'gbH4',
	feetY: 200,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.launch,
	flashTint: 0x6fd8ff,
	rig: {
		grid: { x0: 0, y0: 8, x1: 256, y1: 256, cols: 52, rows: 50 },
		soft: 4,
		parts: [
			{ name: 'rivet', pivot: PIVOT, axis: [0, -1], dist: circle(PIVOT, 22) },
			{
				name: 'fan_l',
				parent: 'rivet',
				pivot: PIVOT,
				axis: [-1, -0.4],
				dist: (p) => (p[0] < PIVOT[0] && p[1] < PIVOT[1] + 8 ? FAN(p) : 40),
				// the turn is handed over across angle: nothing at the top rib, all of it by 40° round
				keep: (p) => smoothstep((-100 - angleOf(p)) / 40) * smoothstep((radius(p) - 16) / 14),
			},
			{
				name: 'fan_r',
				parent: 'rivet',
				pivot: PIVOT,
				axis: [1, -0.4],
				dist: (p) => (p[0] >= PIVOT[0] && p[1] < PIVOT[1] + 8 ? FAN(p) : 40),
				keep: (p) => smoothstep((angleOf(p) + 80) / 40) * smoothstep((radius(p) - 16) / 14),
			},
			{
				name: 'tassel_l',
				parent: 'rivet',
				pivot: [122, 192],
				axis: [-0.8, 1],
				priority: 2,
				dist: polygon([[118, 190], [112, 206], [104, 246], [48, 246], [50, 212], [84, 198]]),
				keep: (p) => smoothstep((radius(p) - 14) / 16),
			},
			{
				name: 'tassel_r',
				parent: 'rivet',
				pivot: [132, 192],
				axis: [0.8, 1],
				priority: 2,
				dist: polygon([[136, 190], [150, 196], [174, 202], [206, 216], [204, 246], [150, 246], [142, 210]]),
				keep: (p) => smoothstep((radius(p) - 14) / 16),
			},
		],
	},
	// Geometric (--limits, 2026-10-04): fan_l +13 -15.5, fan_r +15 -12.5,
	// tassel_l +10.5 -14, tassel_r +22.5 -25.5. The angular hand-over lets the
	// paper take a real opening.
	limits: {
		fan_l: { pos: 10, neg: 10 },
		fan_r: { pos: 10, neg: 10 },
		tassel_l: { pos: 9, neg: 9 },
		tassel_r: { pos: 14, neg: 14 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// open: the left half turns counter-clockwise (-), the right clockwise (+)
		const snap = bump(t, T.crouch, T.top + 120) + 0.5 * flick(t, T.top, 5.5, 5) + 0.55 * flick(t, T.land, 4.5, 4.5);
		// the fan-flick: two quick waves of the whole spread
		const flutter = 0.6 * flick(t, 560, 6, 5);
		b('fan_l').angle = -5.6 * snap - 1.8 * flutter;
		b('fan_r').angle = 5.6 * snap - 1.8 * flutter;
		// the paper is pulled taut as it opens
		b('fan_l').along = 1 + 0.03 * Math.max(0, snap);
		b('fan_r').along = 1 + 0.03 * Math.max(0, snap);
		// the tassels: left behind on the launch, swinging, again on the landing
		b('tassel_l').angle = 7 * flick(t, T.launch, 1.8, 2) - 5 * flick(t, T.land, 2.2, 2.6);
		b('tassel_r').angle = 6 * flick(t, T.launch + 60, 1.7, 2) - 5 * flick(t, T.land + 40, 2.1, 2.6);
		b('tassel_l').along = 1 + 0.05 * bump(t, T.land, T.land + 200);
		b('tassel_r').along = 1 + 0.05 * bump(t, T.land, T.land + 200);
		pose.flash = 0.5 * bump(t, T.crouch, 520) + 0.2 * bump(t, T.land, T.land + 200);
		pose.sheen = t >= 380 && t <= 980 ? (t - 380) / 600 : -1;
		return pose;
	},
};
