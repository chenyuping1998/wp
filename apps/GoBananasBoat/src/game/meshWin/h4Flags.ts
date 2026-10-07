/**
 * H4 — THE SIGNAL FLAGS. Two flags crossed on their staffs and lashed. The
 * staffs stay put, planted, and the CLOTH does the work: on the hit a gust
 * snaps both flags out, they ripple — the free edge a beat behind the edge on
 * the staff, which is what makes cloth read as cloth rather than a card on a
 * hinge — and fall slack as the gust passes, with the whole piece giving a
 * small hop.
 *
 * Each cloth is two bones: the half on the staff and the free half, the free
 * half hanging from the first. The ripple is the phase between them.
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
	type Rig,
} from './meshRig';

const T = { crouch: 100, rise: 300, fall: 1000, land: 1200, done: 1400 };
// the staffs: A from the top-left to the bottom-right, B the other way
const STAFF_A = polyline([[84, 44], [176, 204]], 8);
const STAFF_B = polyline([[172, 44], [80, 204]], 8);
const ROPE = polyline([[128, 108], [128, 162]], 8);

// a cloth hands its weight back to BOTH staffs, not only its own: the left
// cloth's foot lies against staff B, and blending off staff A alone tore it there
const offStaff = (p: [number, number]) => Math.min(STAFF_A.dist(p), STAFF_B.dist(p), ROPE.dist(p));

const CLOTH_L = polygon([[74, 42], [126, 102], [124, 118], [98, 126], [84, 150], [60, 170], [48, 162], [48, 142], [16, 124], [38, 100], [60, 72]]);
const CLOTH_R = polygon([[182, 42], [214, 84], [240, 116], [226, 138], [210, 170], [196, 166], [172, 146], [150, 124], [130, 116], [134, 100]]);

export const H4: MeshWinSpec = {
	symbol: 'H4',
	key: 'gbH4',
	feetY: 206,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 190,
	rig: {
		grid: { x0: 8, y0: 34, x1: 248, y1: 214, cols: 60, rows: 45 },
		soft: 4,
		parts: [
			{ name: 'staffs', pivot: [128, 206], axis: [0, -1], dist: union(STAFF_A.dist, STAFF_B.dist, ROPE.dist) },
			{
				// the left cloth hangs off staff A, fading in over 14px off it
				name: 'cloth_l',
				parent: 'staffs',
				pivot: [102, 76],
				axis: [-0.87, 0.5],
				dist: CLOTH_L,
				keep: (p) => smoothstep((offStaff(p) - 4) / 14),
			},
			{
				name: 'tip_l',
				parent: 'cloth_l',
				pivot: [66, 112],
				axis: [-0.87, 0.5],
				priority: 2,
				dist: CLOTH_L,
				keep: (p) => smoothstep((STAFF_A.dist(p) - 36) / 18),
			},
			{
				name: 'cloth_r',
				parent: 'staffs',
				pivot: [154, 76],
				axis: [0.87, 0.5],
				dist: CLOTH_R,
				keep: (p) => smoothstep((offStaff(p) - 4) / 14),
			},
			{
				name: 'tip_r',
				parent: 'cloth_r',
				pivot: [190, 112],
				axis: [0.87, 0.5],
				priority: 2,
				dist: CLOTH_R,
				keep: (p) => smoothstep((STAFF_B.dist(p) - 36) / 18),
			},
		],
	},
	// Geometric (check_mesh_wins.mjs --limits, 2026-09-25, on the 512 layers):
	//   cloth_l +3.5 -3   tip_l +11 -9    cloth_r +3 -3.5   tip_r +10.5 -12
	// The half on the staff has little room (it is pinned along one edge); the
	// free half has plenty, which is the right way round for cloth.
	limits: {
		cloth_l: { pos: 2.6, neg: 2.6 },
		tip_l: { pos: 8.5, neg: 8.5 },
		cloth_r: { pos: 2.6, neg: 2.6 },
		tip_r: { pos: 8.5, neg: 8.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
		// the gust: a snap on the hit, then a ripple that dies as it passes
		const gust = ramp(t, 140, 260) * (1 - ramp(t, 950, 1200));
		const snap = Math.max(0, flick(t, 160, 2.2, 3));
		const w = (2 * Math.PI * t) / 300;
		// + lifts the left cloth (clockwise pivots its free edge up), - the right
		const roll = (lag: number, amp: number) => amp * (0.6 * snap + gust * Math.sin(w - lag));
		b('cloth_l').angle = roll(0, 1.6);
		// the free half, sized for the screen
		b('tip_l').angle = roll(1.2, 4.8);
		b('cloth_r').angle = -roll(0.4, 1.6);
		b('tip_r').angle = -roll(1.6, 4.8);
		// the cloth billows: the free half stretches out along the wind
		for (const n of ['tip_l', 'tip_r']) b(n).along = 1 + 0.035 * gust * (0.5 + 0.5 * Math.sin(w - 1.4)) + 0.03 * snap;
		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.04, 'out'], [190, 0.98, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 1.04, 'out'], [T.done, 1, 'out']]),
			sy: track(t, [[0, 1], [T.crouch, 0.93, 'out'], [190, 1.04, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 0.95, 'out'], [T.done, 1, 'out']]),
			rot: 0,
			// BIGGER JUMP (2026-09-27, asked for): the rigid move carries it — it moves
			// every vertex alike, so it costs nothing against the mesh's limits.
			pop: 1 + 0.09 * air,
			dx: 0,
			dy: -12 * air,
		};
		// a faint shadow: two crossed staffs are an OPEN shape, and the blurred
		// silhouette filled the V between them as a grey patch at full strength
		pose.air = 0.4 * Math.max(0, Math.min(1, air));
		pose.flash = 0.5 * track(t, [[T.crouch, 0], [200, 1, 'out'], [600, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 950 ? (t - 380) / 570 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.crouch, 360) + 0.02 * bump(t, T.land, T.land + 140);
		return pose;
	},
};
