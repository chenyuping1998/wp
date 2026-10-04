/**
 * H3 — THE MOON BOOT. A boot stamps. The heel rocks up on the toe (the toe bends
 * to take it), holds, and STOMPS: a hard squash onto the sole, dust, the ankle
 * wobbling on the landing, then a smaller second tap of the toe. The size is
 * the rigid rock and squash; what bends is the toe cap and the ankle.
 *
 * And the details that sell the weight: the two brass BUCKLES rattle on their
 * straps when it comes down (each a small disc of mesh turning about its own
 * centre, the leather round it taking up the turn), and the TREAD squashes
 * flat under the stomp and springs back — the sole absorbing the hit instead of
 * the whole boot moving as one block.
 */
import { bump, flick, polygon, ramp, restPose, smoothstep, track, type MeshWinSpec, type Point, type Rig, boneOf, landFlick } from './meshRig';

const T = { lift: 120, up: 330, stomp: 520, tap: 760, done: 1000 };
// the buckles' centres (brass frames on the two straps) and the tread's top
const BUCKLE_HI: Point = [85, 100];
const BUCKLE_LO: Point = [115, 125];
const BUCKLE_R = 13;
const TREAD_TOP = 156;
const buckle = (name: string, c: Point) => ({
	name,
	parent: 'ankle',
	pivot: c,
	priority: 4,
	dist: (p: Point) => Math.max(0, Math.hypot(p[0] - c[0], p[1] - c[1]) - BUCKLE_R),
	// the whole frame turns (full weight to ~10px), the strap round it takes up
	// the turn over the next 9
	keep: (p: Point) => smoothstep((BUCKLE_R + 6 - Math.hypot(p[0] - c[0], p[1] - c[1])) / 9),
});

export const H3: MeshWinSpec = {
	symbol: 'H3',
	key: 'gbH3',
	sprite: 'gbH3',
	dust: true,
	feetY: 240,
	durationMs: T.done,
	landMs: T.stomp,
	hitMs: T.stomp,
	rig: {
		// finer than the first pass (50x32): a buckle is ~26px across and needs
		// a few cells of its own to turn in
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 64, rows: 64 },
		soft: 4,
		parts: [
			{ name: 'core', pivot: [128, 186], dist: (p) => Math.min(14, polygon([[26, 128], [232, 128], [232, 190], [26, 190]])(p)) },
			{
				name: 'ankle',
				parent: 'core',
				pivot: [82, 132],
				axis: [0, -1],
				dist: polygon([[34, 66], [132, 66], [132, 128], [34, 128]]),
				keep: (p) => smoothstep((130 - p[1]) / 16),
			},
			{
				name: 'toe',
				parent: 'core',
				pivot: [180, 160],
				axis: [1, 0],
				priority: 1,
				dist: polygon([[182, 104], [234, 104], [234, 192], [182, 192]]),
				keep: (p) => smoothstep((p[0] - 176) / 18),
			},
			buckle('buckle_hi', BUCKLE_HI),
			buckle('buckle_lo', BUCKLE_LO),
			{
				// the tread: squashes toward the ground line under the stomp. Under
				// the toe cap the toe owns it (priority), so the cap and its tread
				// move together.
				name: 'tread',
				parent: 'core',
				pivot: [128, 186],
				axis: [0, -1],
				priority: 0.5,
				dist: (p) => Math.max(0, TREAD_TOP - p[1]),
				keep: (p) => smoothstep((p[1] - (TREAD_TOP - 14)) / 18),
			},
		],
	},
	// geometric (check_mesh_wins.mjs H3 --limits): ankle +5 -5.5   toe +9 -7.5
	// buckles geometric +49.5/-50.5 and +52/-50 (check_mesh_wins.mjs H3 --limits)
	limits: {
		ankle: { pos: 3.5, neg: 3.5 },
		toe: { pos: 6, neg: 5 },
		buckle_hi: { pos: 14, neg: 14 },
		buckle_lo: { pos: 14, neg: 14 },
		tread: { pos: 0.5, neg: 0.5 },
	},
	// landing: the toe cap slaps, the ankle wobbles
	land: (rig, t, k, pose) => {
		const press = Math.max(0, track(t, [[0, 0], [70, 1, 'out'], [155, 0, 'out']]));
		boneOf(rig, pose, 'tread').along = 1 - 0.05 * press * k;
		boneOf(rig, pose, 'toe').along = 1 - 0.045 * press * k;
		boneOf(rig, pose, 'toe').angle = -3 * k * landFlick(t, 30);
		boneOf(rig, pose, 'ankle').angle = 2 * k * landFlick(t, 45);
		boneOf(rig, pose, 'buckle_hi').angle = 3 * k * landFlick(t, 50);
		boneOf(rig, pose, 'buckle_lo').angle = -3 * k * landFlick(t, 65);
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// + rocks the heel up (clockwise about the sole)
		const rock = track(t, [[0, 0], [T.lift, 0], [T.up, 9, 'out'], [T.stomp - 60, 10], [T.stomp, -1.5, 'in'], [T.stomp + 90, 0.5, 'out'], [T.tap - 60, 0], [T.tap, 2.5, 'out'], [T.tap + 80, 0, 'in']]);
		const hang = ramp(t, T.lift, T.up) * (1 - ramp(t, T.stomp - 50, T.stomp));

		pose.rigid = {
			sx: track(t, [[0, 1], [T.lift, 1.05, 'out'], [T.up, 0.98], [T.stomp - 10, 1], [T.stomp + 50, 1.1, 'out'], [T.stomp + 170, 0.985], [T.stomp + 280, 1]]),
			sy: track(t, [[0, 1], [T.lift, 0.9, 'out'], [T.up, 1.03], [T.stomp - 10, 1], [T.stomp + 50, 0.84, 'out'], [T.stomp + 170, 1.02], [T.stomp + 280, 1]]),
			rot: rock,
			pop: 1 + 0.03 * hang,
			dx: 0,
			dy: -9 * hang,
		};

		// the toe bends up to carry the rock (- lifts its tip), then slaps flat
		b('toe').angle = -3.8 * hang + 2.5 * flick(t, T.stomp, 3.2, 5) - 2.5 * bump(t, T.tap - 80, T.tap + 60);
		// the ankle leans back into the lift and wobbles on the stomp
		b('ankle').angle = -1.8 * hang + 2.8 * flick(t, T.stomp, 2.6, 3.6);
		b('ankle').along = 1 + 0.04 * hang - 0.05 * bump(t, T.stomp, T.stomp + 160);
		// the buckles rattle on the stomp and again on the tap, out of step
		b('buckle_hi').angle = 10 * flick(t, T.stomp + 10, 4.2, 5) + 5 * flick(t, T.tap + 10, 4.6, 6);
		b('buckle_lo').angle = -9 * flick(t, T.stomp + 40, 4.6, 5) - 4 * flick(t, T.tap + 30, 5, 6);
		// the tread flattens under the stomp and springs back (axis is UP from
		// the ground line, so `along` is its height)
		const tread = b('tread');
		// 18%: 28 stretched the strip above the heel's end of the tread to 201%
		tread.along = 1 - 0.18 * bump(t, T.stomp - 20, T.stomp + 140) + 0.05 * flick(t, T.stomp + 140, 3.5, 6);
		tread.across = 1 + 0.02 * bump(t, T.stomp - 20, T.stomp + 140);

		pose.air = hang;
		pose.flash = 0.32 * track(t, [[T.stomp - 20, 0], [T.stomp + 40, 1, 'out'], [T.stomp + 360, 0, 'in']]) + 0.12 * bump(t, T.lift, T.up);
		pose.sheen = t >= 200 && t <= 620 ? (t - 200) / 420 : -1;
		pose.plateHit = 1 + 0.045 * bump(t, T.stomp, T.stomp + 180) + 0.015 * bump(t, T.tap, T.tap + 120);
		return pose;
	},
};
