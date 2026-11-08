/**
 * H3 — THE CROSSED PICKAXES. Cut off the plate (design/make_symbol_layers.mjs),
 * so they leap off the stone and land back on it with a drop shadow under them.
 *
 * The two picks are ONE mesh, and their handles overlap at the crossing: the
 * handle running top-left to bottom-right is painted over the other one, and
 * the part it hides was never drawn. So the crossing cannot come apart — the
 * X moves as one rigid thing (the leap, the rock, the squash), and what swings
 * is each pick's HEAD on its mount, far from the crossing.
 *
 * The beat is a strike: crouch, leap, and at the top the heads wind OPEN, then
 * snap SHUT so the two upper blade tips clash at the top centre — the sparks
 * fly from there, not from the middle of the tile — rebound on a spring, and the
 * X lands with a squash and the heads shivering on their mounts.
 *
 * Coordinates are the 256 canvas (measured on h3_subject.png, 2026-09-25):
 *   pick L   head (68,70), handle (80,86) -> (205,210), blades to (122,26) and (16,143)
 *   pick R   head (185,72), handle (175,86) -> (50,210), blades to (134,26) and (238,143)
 *   crossing (124,142)
 */
import {
	bump,
	flick,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const T = { crouch: 110, rise: 320, open: 440, clash: 540, fall: 780, land: 1000, done: 1450 };
// How far a head swings, per direction. SHUT is capped by the upper blade
// tips, 12px apart at rest and ~70px from the mount: 3.2 degrees brings them
// nearly together (4 folded the gap between them to 49%). OPEN has far more
// room, and a 4-degree swing each way barely read on the render — so the
// stroke is asymmetric: wound wide, snapped shut.
const OPEN_DEG = 4.2;
const SHUT_DEG = 3.2;

/** a pick's head: its steel block and both blades, hung on the handle's top */
const head = (name: string, pivot: Point, axis: Point, block: Point[], blade: Point[]) => {
	const line = polyline(blade, 7);
	const len = Math.hypot(axis[0], axis[1]);
	const u: Point = [axis[0] / len, axis[1] / len];
	return {
		name,
		parent: 'core',
		pivot,
		axis,
		dist: union(polygon(block), line.dist),
		// Fades into the handle over 14px below the mount — ON THE HANDLE ONLY.
		// The first version faded by projection onto the handle's axis, and the
		// lower blade runs nearly square to that axis: its tip projected into
		// the fade, came out 62% head / 38% handle, and sheared at 3 degrees.
		// Off the handle's width the head keeps everything.
		keep: (p: Point) => {
			const dx = p[0] - pivot[0], dy = p[1] - pivot[1];
			const down = -(dx * u[0] + dy * u[1]); // + below the mount, along the handle
			const lateral = Math.abs(dx * u[1] - dy * u[0]);
			if (lateral > 18) return 1;
			return smoothstep((4 - down) / 14);
		},
	};
};

export const H3: MeshWinSpec = {
	symbol: 'H3',
	key: 'gbH3',
	feetY: 214,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.clash,
	sparkAt: [128, 30],
	rig: {
		grid: { x0: 8, y0: 16, x1: 248, y1: 226, cols: 48, rows: 42 },
		soft: 4,
		parts: [
			// both handles and the crossing: the rigid X everything hangs from
			{
				name: 'core',
				pivot: [124, 142],
				dist: union(polyline([[80, 86], [205, 210]], 12).dist, polyline([[175, 86], [50, 210]], 12).dist),
			},
			head(
				'head_l',
				[82, 88],
				[-1, -1],
				[[46, 50], [88, 46], [94, 80], [74, 94], [50, 72]],
				[[16, 143], [24, 112], [40, 84], [60, 60], [86, 40], [122, 26]],
			),
			head(
				'head_r',
				[173, 88],
				[1, -1],
				[[166, 46], [210, 50], [206, 72], [182, 94], [162, 80]],
				[[238, 143], [230, 112], [214, 84], [196, 60], [170, 40], [134, 26]],
			),
		],
	},
	// Geometric (check_mesh_wins.mjs H3 --limits, 2026-09-25):
	//   head_l +8 -10   head_r +8.5 -6.5
	// Shutting is + for head_l and - for head_r; both fail where the upper blade
	// tips meet at (128,21), which is where the strike is aimed.
	limits: {
		head_l: { pos: 6, neg: 7 },
		head_r: { pos: 7, neg: 5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall - 60, 1], [T.land, 0, 'in']]);
		const apex = ramp(t, T.rise - 40, T.rise + 60) * (1 - ramp(t, T.fall - 120, T.fall));

		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.07, 'out'], [220, 0.95, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 1.08, 'out'], [1150, 0.985], [1280, 1]]),
			sy: track(t, [[0, 1], [T.crouch, 0.88, 'out'], [220, 1.02, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 0.87, 'out'], [1150, 1.02], [1280, 1]]),
			// the X rocks at the top of the leap, and the clash knocks it back
			rot: 3 * apex * Math.sin((2 * Math.PI * (t - T.rise)) / 520) - 2.5 * flick(t, T.clash, 3.2, 5),
			pop: 1 + 0.025 * air,
			dx: 0,
			// the blades reach within ~10px of the top frame bar: a small lift
			dy: -5 * air + 1.5 * bump(t, T.clash, T.clash + 90),
		};

		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// head_l: + swings its head toward the middle (shut), - away (open);
		// head_r mirrors with the opposite sign — measured on the render
		// wind open, snap shut so the tips meet, rebound on a spring
		const strike =
			track(t, [[0, 0], [T.rise - 60, 0], [T.open, -OPEN_DEG, 'out'], [T.clash - 40, -OPEN_DEG], [T.clash, SHUT_DEG, 'in'], [T.clash + 200, 0, 'out']]) +
			2 * flick(t, T.clash + 60, 3.4, 6);
		const shiver = 2.6 * flick(t, T.land, 5, 7);
		const swing = strike + shiver;
		b('head_l').angle = swing;
		b('head_r').angle = -swing;

		pose.air = Math.max(0, Math.min(1, air));
		// steel: the flash is short and white-gold, on the clash
		pose.flash = 0.34 * track(t, [[T.clash - 40, 0], [T.clash + 20, 1, 'out'], [T.clash + 380, 0, 'in']]) + 0.12 * bump(t, T.crouch, 300);
		pose.sheen = t >= 600 && t <= 1100 ? (t - 600) / 500 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.crouch, 380) + 0.04 * bump(t, T.land, T.land + 170);
		return pose;
	},
};
