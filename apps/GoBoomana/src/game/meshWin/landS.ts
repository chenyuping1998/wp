/**
 * S — THE BANANA SCATTER, LANDING. It used to stop on the reel like any tile;
 * now the bunch THUDS onto its rock pile — squashed flat, rebounding, the long
 * top banana flapping a beat behind the rest — and settles.
 *
 * And each one lands HARDER than the last. The second Scatter of a spin hits
 * with a third more force than the first, the third and any after it with
 * nearly double, a brighter flash and a bigger knock on the plate: by the time
 * the feature is one Scatter away, the reel itself says so. The count is
 * stateGame.scatterCounter, which the landing hook raises before the symbol
 * mounts this (Symbol.svelte picks the tier).
 *
 * Same drawing and the same rig as the Scatter's win (sBananas.ts): the bunch,
 * and the top banana hinged at the stem. PANEL mode — the rocks stay put.
 * Named `S:land` so it does not pick up the win's own particles (winFx).
 */
import {
	bump,
	flick,
	restPose,
	track,
	type MeshWinSpec,
	type Rig,
} from './meshRig';
import { S } from './sBananas';

const T = { hit: 60, done: 820 };

/** the landing for the n-th Scatter of the spin (1, 2, 3+) */
const landS = (tier: 1 | 2 | 3): MeshWinSpec => {
	const k = tier === 1 ? 1 : tier === 2 ? 1.35 : 1.7;
	return {
		...S,
		symbol: `S:land${tier}`,
		durationMs: T.done,
		landMs: 30,
		hitMs: T.hit,
		sparkAt: [118, 150],
		pose: (rig: Rig, t: number) => {
			const pose = restPose(rig);
			const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

			// the thud: flat on the hit, up on the rebound, settle
			const bunch = b('bunch');
			bunch.along = track(t, [[0, 1], [T.hit, 1 - 0.05 * k, 'out'], [170, 1 + 0.02 * k, 'out'], [290, 1 - 0.006 * k], [420, 1]]);
			bunch.across = track(t, [[0, 1], [T.hit, 1 + 0.04 * k, 'out'], [170, 1 - 0.015 * k, 'out'], [290, 1.004], [420, 1]]);
			// the rebound lifts it a touch off the pile, then it sits back down
			bunch.dy = -1.6 * k * bump(t, T.hit + 40, 330);
			bunch.angle = TILT_DEG * Math.min(1, k * 0.8) * flick(t, T.hit, 2.2, 5);

			// the top banana is late: it keeps flapping after the bunch has landed
			b('upper').angle = FAN_DEG * Math.min(1, 0.6 * k) * flick(t, T.hit + 30, 3, 4.5);

			pose.air = 0;
			pose.flash = (0.22 + 0.14 * (k - 1)) * track(t, [[0, 0], [T.hit + 20, 1, 'out'], [420, 0, 'in']]);
			pose.sheen = -1;
			pose.plateHit = 1 + 0.03 * k * bump(t, 0, 200);
			return pose;
		},
	};
};

// within the measured limits of the shared rig (sBananas.ts: bunch 3, upper 3.2/-2.5)
const TILT_DEG = 2.2;
const FAN_DEG = 2.4;

export const S_LANDS: Record<1 | 2 | 3, MeshWinSpec> = { 1: landS(1), 2: landS(2), 3: landS(3) };
