/**
 * G — THE GROW MARKER, the banana gravity charge riding a cell's top-left
 * corner. Not a winning symbol: ReelGrow plays this when the markers let go
 * (the growMarkers event), just before the reels stretch.
 *
 * It used to stay painted on the cell while a burst of light rose from the
 * cell's centre — the thing that was supposed to be leaving never left. Now
 * the charge ITSELF acts: it COILS (squashes down its own length and swells, the
 * two end caps curling in, trembling, lighting up ice-blue), then RELEASES —
 * snapping long and thin as ReelGrow carries it up and away with the burst and
 * the trail. The coil is the cause the player sees; the stretch is the effect.
 *
 * The art is growMarker.png (236x256) padded square into g.png so the 256
 * canvas maps onto it. The capsule lies on a diagonal, tail bottom-left and
 * nose top-right, so the squash and stretch run along THAT axis through a bone
 * rather than through the rigid move, whose scale is screen-aligned.
 */
import { bump, flick, ramp, restPose, smoothstep, track, type MeshWinSpec, type Point, type Rig } from './meshRig';

/** when it lets go, ms: ReelGrow starts the flight here */
export const MARKER_CHARGE_MS = 300;
/** the whole beat; ReelGrow's flight ends with it */
export const MARKER_LIFT_MS = 720;

/**
 * The banana capsule's rig — shared by the grow marker and the canister the
 * mascot throws (cCanister.ts), which are the same drawing at two sizes. A body
 * along the capsule's own diagonal axis, and the two end caps past the silver
 * bands hanging off it, so it can squash, swell and curl like the fruit it is.
 */
export const capsuleParts = (
	C: Point,
	A: Point,
	noseAt: number,
	tailAt: number,
	halfWidth = 70,
): MeshWinSpec['rig']['parts'] => {
	const along = (p: Point) => (p[0] - C[0]) * A[0] + (p[1] - C[1]) * A[1];
	const across = (p: Point) => Math.abs((p[0] - C[0]) * -A[1] + (p[1] - C[1]) * A[0]);
	const off = (p: Point) => Math.max(0, across(p) - halfWidth);
	return [
		{ name: 'body', pivot: C, axis: A, dist: (p) => Math.min(14, off(p)) },
		{
			name: 'nose',
			parent: 'body',
			pivot: [C[0] + A[0] * noseAt, C[1] + A[1] * noseAt],
			axis: A,
			priority: 2,
			dist: (p) => (along(p) > noseAt ? off(p) : 14),
			keep: (p) => smoothstep((along(p) - noseAt + 6) / 20),
		},
		{
			name: 'tail',
			parent: 'body',
			pivot: [C[0] + A[0] * tailAt, C[1] + A[1] * tailAt],
			axis: [-A[0], -A[1]],
			priority: 2,
			dist: (p) => (along(p) < tailAt ? off(p) : 14),
			keep: (p) => smoothstep((tailAt - along(p) + 6) / 20),
		},
	];
};

// the marker's capsule: centre, axis (tail -> nose), where the bands cross it
const C: Point = [128, 120];
const A: Point = [0.65, -0.76];

export const G: MeshWinSpec = {
	symbol: 'G',
	key: 'gbG',
	sprite: 'gbG',
	flashTint: 0x8fe4ff,
	noLand: true,
	feetY: 250,
	durationMs: MARKER_LIFT_MS,
	landMs: MARKER_CHARGE_MS,
	hitMs: MARKER_CHARGE_MS,
	rig: {
		grid: { x0: 4, y0: 0, x1: 252, y1: 256, cols: 40, rows: 42 },
		soft: 4,
		parts: capsuleParts(C, A, 42, -48),
	},
	// geometric (check_mesh_wins.mjs G --limits): nose +6 -7   tail +10 -8
	limits: {
		nose: { pos: 4.5, neg: 5 },
		tail: { pos: 6, neg: 6 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const coil = ramp(t, 0, MARKER_CHARGE_MS - 20) * (1 - ramp(t, MARKER_CHARGE_MS - 20, MARKER_CHARGE_MS + 40));

		// the body: short and fat as it coils, long and thin as it lets go
		const body = b('body');
		body.along =
			track(t, [[0, 1], [MARKER_CHARGE_MS - 20, 0.84, 'out'], [MARKER_CHARGE_MS + 70, 1.2, 'back'], [MARKER_CHARGE_MS + 260, 1.06], [MARKER_LIFT_MS - 40, 1]]) +
			0.03 * flick(t, MARKER_CHARGE_MS + 70, 5, 8);
		body.across = track(t, [[0, 1], [MARKER_CHARGE_MS - 20, 1.12, 'out'], [MARKER_CHARGE_MS + 70, 0.88, 'back'], [MARKER_CHARGE_MS + 260, 0.97], [MARKER_LIFT_MS - 40, 1]]);

		// the caps curl in as it coils (a banana bending tighter) and whip on release
		const curl = 4 * coil - 3.5 * Math.max(0, flick(t, MARKER_CHARGE_MS, 3.2, 5));
		b('nose').angle = curl;
		b('tail').angle = curl;

		// trembling under the charge, faster as it builds
		const shake = coil * coil * 2.2;
		pose.rigid = {
			sx: 1,
			sy: 1,
			rot: 0,
			pop: 1 + 0.06 * bump(t, MARKER_CHARGE_MS - 80, MARKER_CHARGE_MS + 160),
			dx: shake * Math.sin(t / 11),
			dy: shake * Math.cos(t / 13),
		};

		pose.air = 0;
		pose.flash = 0.75 * track(t, [[0, 0], [MARKER_CHARGE_MS - 10, 1, 'in'], [MARKER_CHARGE_MS + 200, 0.3, 'out'], [MARKER_LIFT_MS - 60, 0]]);
		pose.sheen = t >= 40 && t <= MARKER_CHARGE_MS ? (t - 40) / (MARKER_CHARGE_MS - 40) : -1;
		pose.plateHit = 1;
		return pose;
	},
};
