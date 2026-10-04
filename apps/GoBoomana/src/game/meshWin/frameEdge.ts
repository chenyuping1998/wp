/**
 * THE BOARD FRAME TAKES THE BLAST (gbFrameEdge), as a mesh.
 *
 * Every detonation used to leave the housing untouched unless something sent a
 * boardFrameImpact, and that shook the whole frame as one card. Now the blast
 * pushes the frame where it happens: over each reel that goes up, the top rail
 * bows UP and the bottom rail bows DOWN, springs back through its rest and
 * settles — one bulge per blasted reel, the neighbours carried a little, the
 * four brass corners never moving.
 *
 * Rig units are the 256 canvas over the 1280 x 1280 art, whose centred 1000 x
 * 1000 is the board (BoardFrame.svelte, FRAME_SCALE): the board is x, y 28..228,
 * the rails are the bands 4..28 and 228..252, and reel i spans
 * 28 + 40i .. 68 + 40i. The art is stretched to the board's aspect in the game;
 * the rig does not care.
 *
 * Panel mode: the rest of the frame is `frame`, nailed down. BoardFrame.svelte
 * draws it through PropMesh and feeds the blast times.
 */
import {
	polygon,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Pose,
	type Rig,
} from './meshRig';

export const REELS = 5;
const BOARD0 = 28;
const REEL_W = 40;
const TOP: [number, number] = [4, 30];
const BOTTOM: [number, number] = [226, 252];

export type FrameEnv = {
	/** ms since each reel's blast went off, or < 0 — index = reel */
	blastT: number[];
	/** how hard, per reel (1 = one ordinary blast; the full board is more) */
	strength: number[];
};

export type FrameSpec = MeshWinSpec & { drive: (rig: Rig, env: FrameEnv) => Pose };

const rect = (x0: number, y0: number, x1: number, y1: number) =>
	polygon([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);

// each rail segment hands its weight back to the fixed frame toward its ends,
// so a bulge is one smooth bow rather than a block pushed out
const segment = (name: string, reel: number, band: [number, number]): PartSpec => {
	const cx = BOARD0 + REEL_W * (reel + 0.5);
	return {
		name,
		parent: 'frame',
		pivot: [cx, (band[0] + band[1]) / 2] as Point,
		axis: [0, -1],
		dist: rect(cx - REEL_W / 2, band[0] - 2, cx + REEL_W / 2, band[1] + 2),
		keep: (p) => smoothstep((REEL_W * 0.62 - Math.abs(p[0] - cx)) / (REEL_W * 0.5)),
	};
};

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** the push of one blast: out, back through rest, settled — 0 before and after */
const bow = (t: number) => {
	if (t < 0 || t > 900) return 0;
	const s = t / 1000;
	// rises fast (in ~50ms) to its full bow — the spring's phase is held back
	// 60ms so the first swing is not already turning home before it peaks —
	// then rings down
	return smoothstep(t / 50) * Math.exp(-5.5 * s) * Math.cos(2 * Math.PI * 3.4 * (s - 0.06));
};

// canvas units of bow at strength 1: about 10 screen px on a 700px board
const BOW = 4;

export const FRAME: FrameSpec = (() => {
	const spec: FrameSpec = {
		symbol: 'frameEdge',
		key: 'gbFrameEdge',
		sprite: 'gbFrameEdge',
		mode: 'panel',
		feetY: 252,
		durationMs: 1400,
		landMs: 99999,
		hitMs: 99999,
		// the rails and the stiles: everything but the board opening
		inked: (p) => p[0] >= 4 && p[0] <= 252 && p[1] >= 4 && p[1] <= 252 && (p[1] < 30 || p[1] > 226 || p[0] < 30 || p[0] > 226),
		rig: {
			grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 64, rows: 64 },
			soft: 3,
			parts: [
				{ name: 'frame', pivot: [128, 128], dist: () => 6 },
				...Array.from({ length: REELS }, (_, i) => segment(`top${i}`, i, TOP)),
				...Array.from({ length: REELS }, (_, i) => segment(`bot${i}`, i, BOTTOM)),
			],
		},
		limits: Object.fromEntries(
			Array.from({ length: REELS }, (_, i) => [
				[`top${i}`, { pos: 0.5, neg: 0.5 }],
				[`bot${i}`, { pos: 0.5, neg: 0.5 }],
			]).flat(),
		),
		drive: (rig, env) => {
			const pose = restPose(rig);
			for (let i = 0; i < REELS; i++) {
				const push = BOW * (env.strength[i] ?? 1) * bow(env.blastT[i] ?? -1);
				bone(rig, pose, `top${i}`).dy = -push;
				bone(rig, pose, `bot${i}`).dy = push;
			}
			return pose;
		},
		// for the gate: reel 1 goes up at 0, reels 2-3 at 400 (a level-2 blast),
		// and the whole board at 800, harder
		pose: (rig, t) =>
			spec.drive(rig, {
				blastT: [t - 800, t, t - 400, t - 400, t - 800],
				strength: [1.6, 1, 1, 1, 1.6],
			}),
	};
	return spec;
})();
