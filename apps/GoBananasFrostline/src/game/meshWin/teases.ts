/**
 * THE TEASE — what an already-landed Scatter does while the spin is still
 * undecided: two or more are down and a reel is still turning under the
 * anticipation. Ported from GoBananubis's sScatter `tease`, acted for this
 * Scatter (the banana bunch tied with a bow, panelWins.ts S).
 *
 * The bunch sways slowly on its stem and the bow's two loops trail it, a beat
 * behind, as if a cold wind were coming up off the ice. It starts ON the
 * drawing and eases in; it has no end of its own — while the anticipation
 * runs it loops, and when the last reel stops `teasePose` blends it home
 * over TEASE_HOME_MS and the sprite takes the cell back.
 *
 * `k` is how hard: it climbs with the number of Scatters already down
 * (teaseWeight), so a third Scatter's wait sways harder than a second's.
 * Drawn like a landing — quiet, inside the cell, no light.
 *
 * check_mesh_wins.mjs plays each at every intensity as `S:tease@k`: the loop
 * for TEASE_GATE_MS, then the stop, so it is measured exactly as it runs.
 */
import { blendHome, ramp, restPose, smoothstep, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { S } from './panelWins';

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** how long the sway takes to settle once the reels have stopped */
export const TEASE_HOME_MS = 260;
/** the hardest tease — four or more Scatters down */
export const TEASE_K_MAX = 1.25;
/** the tease's weight for this many Scatters down: 2 -> 0.85, 3 -> 1.05, 4+ -> 1.25 */
export const teaseWeight = (scatters: number) => Math.min(TEASE_K_MAX, 0.45 + 0.2 * scatters);

export type TeaseSpec = MeshWinSpec & {
	/** the loop at `t` ms since it began, at intensity `k` */
	tease: (rig: Rig, t: number, k: number) => Pose;
};

/** the tease at `t`, blended home once it has been told to stop (`stoppedFor` >= 0) */
export const teasePose = (spec: TeaseSpec, rig: Rig, t: number, k: number, stoppedFor = -1): Pose => {
	const pose = spec.tease(rig, t, k);
	return stoppedFor >= 0 ? blendHome(pose, smoothstep(stoppedFor / TEASE_HOME_MS)) : pose;
};

/** the gate's run: loop this long, then stop */
export const TEASE_GATE_MS = 3100;

const tease = (spec: MeshWinSpec, act: (rig: Rig, pose: Pose, t: number, k: number) => void): TeaseSpec => {
	const out: TeaseSpec = {
		...spec,
		landMs: 0,
		hitMs: 0,
		landing: true,
		durationMs: TEASE_GATE_MS + TEASE_HOME_MS + 40,
		tease: (rig, t, k) => {
			const pose = restPose(rig);
			act(rig, pose, t, k);
			return pose;
		},
		// the gate's beat, `amp` standing in for k
		pose: (rig, t, amp = 1) => teasePose(out, rig, t, amp, t >= TEASE_GATE_MS ? t - TEASE_GATE_MS : -1),
	};
	return out;
};

export const TEASES: Record<string, TeaseSpec> = {
	S: tease(S, (rig, pose, t, k) => {
		const on = ramp(t, 0, 400);
		const w = (2 * Math.PI * t) / 1500;
		// the bunch swings from its stem, the loops trail it, the right one later
		// held to 1.4: at 1.7 and the heaviest weight the bunch's corner by the
		// stem (47,29) folded to 48% — the win itself only turns it 1.26
		bone(rig, pose, 'bunch').angle = 1.4 * k * on * Math.sin(w);
		bone(rig, pose, 'bow_l').angle = 4.6 * k * on * Math.sin(w - 0.9);
		bone(rig, pose, 'bow_r').angle = -4 * k * on * Math.sin(w - 1.3);
	}),
};
