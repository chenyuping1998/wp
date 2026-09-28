/**
 * C — THE GRAVITY CANISTER the mascot throws to open the feature
 * (TransitionAnimation.svelte). The same banana capsule as the grow marker
 * (gMarker.ts), full size.
 *
 * It was a flat sprite the transition moved, spun, tinted and faded: a sticker
 * flying across the screen. Now it is soft and under pressure:
 *
 *   FLIGHT  0-340   stretched long by the throw, caps wobbling as it tumbles
 *   LAND    340     squashes on arrival and springs back
 *   ARMED   340-600 swells with each of the two red blinks, the pressure
 *                   building, caps curling in
 *   BOOM    600-    bulges fat, caps flaring outward, as it burns out (the
 *                   transition fades it over the first 112ms)
 *
 * It starts ON the drawing and stretches in its first 60ms, because it takes
 * over from the prop in the mascot's hand on the frame of release.
 *
 * The transition still owns position, spin, tint and fade, and drives this on
 * ITS clock (SymbolMeshWin's `clock`), mapped onto these phase times — so the
 * drop-in fallback (no mascot: a 460ms fall, not a 340ms throw) plays the same
 * acting stretched to fit, and nothing here can drift from the blinks.
 */
import { flick, ramp, restPose, track, bump, type MeshWinSpec, type Point, type Rig } from './meshRig';
import { capsuleParts } from './gMarker';

export const CANISTER = { land: 340, boom: 600 } as const;

// c.png is canister.png (777x770) padded square; in the 256 canvas the tail's
// nozzle sits at (8,211) and the nose at (230,6), the bands 41px either side
const C: Point = [145, 130];
const A: Point = [0.725, -0.688];

export const CANISTER_SPEC: MeshWinSpec = {
	symbol: 'C',
	key: 'gbC',
	sprite: 'gbC',
	flashTint: 0xffb070,
	noLand: true,
	feetY: 250,
	// long past the point it is gone (BOOM + 112ms), so the settle that every
	// spec ends with happens after it has burned out rather than during the boom
	durationMs: 1000,
	landMs: CANISTER.land,
	hitMs: CANISTER.boom,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 40, rows: 40 },
		soft: 4,
		parts: capsuleParts(C, A, 41, -41),
	},
	// geometric (check_mesh_wins.mjs C --limits): nose +6.5 -8   tail +7.5 -6
	limits: {
		nose: { pos: 4.5, neg: 5 },
		tail: { pos: 5, neg: 4.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const { land, boom } = CANISTER;
		// the two red blinks, where TransitionAnimation's tint peaks
		const armed = t >= land && t < boom ? Math.max(0, Math.sin(((t - land) / (boom - land)) * Math.PI * 4)) : 0;
		const burst = track(t, [[boom, 0], [boom + 110, 1, 'out'], [boom + 200, 1]]);

		const body = b('body');
		body.along =
			track(t, [[0, 1], [60, 1.12, 'out'], [land - 60, 1.06], [land + 40, 0.86, 'out'], [land + 130, 1.02, 'out'], [land + 200, 1]]) -
			0.03 * armed +
			0.06 * burst;
		body.across =
			track(t, [[0, 1], [60, 0.92, 'out'], [land - 60, 0.96], [land + 40, 1.12, 'out'], [land + 130, 0.98, 'out'], [land + 200, 1]]) +
			0.08 * armed +
			0.12 * burst;

		// tumbling: the caps wobble against the spin, then curl in under the
		// pressure, then flare as it goes
		const wobble = 3 * Math.sin(t / 45) * ramp(t, 0, 80) * (1 - track(t, [[land - 80, 0], [land, 1]]));
		const curl = 2.5 * armed + 3 * flick(t, land, 3.5, 6);
		b('nose').angle = wobble + curl - 2.5 * burst;
		b('tail').angle = -wobble + curl - 2.5 * burst;

		pose.flash = Math.min(0.85, 0.35 * armed + 0.8 * bump(t, boom - 20, boom + 160));
		pose.sheen = t >= 40 && t <= land ? (t - 40) / (land - 40) : -1;
		return pose;
	},
};
