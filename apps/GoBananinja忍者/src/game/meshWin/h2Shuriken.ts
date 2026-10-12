/**
 * H2 — THE SHURIKEN. A four-bladed throwing star, green-enamelled blades in
 * steel edges round a jade hub.
 *
 * A shuriken's move is the SPIN, and a spin is the rigid move — it turns every
 * vertex alike, so it costs the mesh nothing at any angle. leaps.ts throws it
 * up spinning two full turns. What the mesh adds is what makes a spin read as
 * fast rather than as a rotated picture: each blade BENDS BACK against the turn
 * (leaps.ts `drag`, the blades lagging the hub) and lengthens a touch with the
 * speed, and the jade in the hub swells and flares on the release and again
 * when it bites into the slate on the landing.
 *
 * The blades are siblings on the hub and do not touch each other — each is
 * separated from the next by a notch of slate — so each can bend on its own.
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
const HUB: Point = [128, 129];
const R0 = 30; // the hub's own radius: blades are welded inside it

// tip, and the two shoulders where the blade meets the hub ring
const blade = (tip: Point, a: Point, b: Point) => polygon([tip, a, [HUB[0] + (a[0] - HUB[0]) * 0.55, HUB[1] + (a[1] - HUB[1]) * 0.55], [HUB[0] + (b[0] - HUB[0]) * 0.55, HUB[1] + (b[1] - HUB[1]) * 0.55], b]);
const BLADES: { name: string; tip: Point; dist: (p: Point) => number }[] = [
	{ name: 'blade_tl', tip: [14, 14], dist: blade([10, 10], [104, 70], [70, 104]) },
	{ name: 'blade_tr', tip: [242, 14], dist: blade([246, 10], [186, 104], [152, 70]) },
	{ name: 'blade_br', tip: [244, 234], dist: blade([248, 238], [152, 188], [186, 154]) },
	{ name: 'blade_bl', tip: [12, 234], dist: blade([8, 238], [70, 154], [104, 188]) },
];

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	feetY: 236,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.launch,
	flashTint: 0x7dff8a,
	smear: { ghosts: 3, stepMs: 18, alpha: 0.3, fullAtPx: 12, trail: 1.3 },
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 248, cols: 52, rows: 50 },
		soft: 4,
		parts: [
			{ name: 'hub', pivot: HUB, axis: [0, -1], dist: circle(HUB, 40) },
			...BLADES.map((bl) => ({
				name: bl.name,
				parent: 'hub',
				pivot: HUB,
				axis: [bl.tip[0] - HUB[0], bl.tip[1] - HUB[1]] as Point,
				dist: bl.dist,
				keep: (p: Point) => smoothstep((Math.hypot(p[0] - HUB[0], p[1] - HUB[1]) - R0) / 26),
			})),
			{ name: 'gem', parent: 'hub', pivot: HUB, axis: [0, -1], priority: 3, dist: circle(HUB, 20), keep: (p) => smoothstep((24 - Math.hypot(p[0] - HUB[0], p[1] - HUB[1])) / 6) },
		],
	},
	// Geometric (--limits, 2026-10-04): tl +7 -5.5, tr +11 -10, br +10 -8,
	// bl +5 -6 — the two left blades are closer to each other across their notch
	limits: {
		blade_tl: { pos: 4.5, neg: 4.5 },
		blade_tr: { pos: 4.5, neg: 4.5 },
		blade_br: { pos: 4.5, neg: 4.5 },
		blade_bl: { pos: 4.5, neg: 4.5 },
		gem: { pos: 0.5, neg: 0.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// in the air the blades stretch with the speed; on the landing they
		// quiver where the star bit into the slate
		const fly = bump(t, T.launch, T.land);
		for (const bl of BLADES) {
			const blade_ = b(bl.name);
			blade_.along = 1 + 0.045 * fly;
			blade_.across = 1 - 0.02 * fly;
			blade_.angle = 1.4 * flick(t, T.land, 6, 7);
		}
		// the jade: swells on the release, pulses as it spins, flares on the bite
		const gem = b('gem');
		const swell = 0.14 * bump(t, T.crouch, T.top) + 0.05 * fly * Math.sin(t / 45) + 0.12 * bump(t, T.land, T.land + 260);
		gem.along = 1 + swell;
		gem.across = 1 + swell;
		pose.flash = 0.6 * bump(t, T.crouch, 480) + 0.45 * bump(t, T.land - 20, T.land + 260);
		pose.sheen = t >= 300 && t <= 900 ? (t - 300) / 600 : -1;
		return pose;
	},
};
