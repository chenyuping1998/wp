/**
 * THE BOARD FRAME TAKES THE HIT (gbFrameEdge), as a mesh. Ported from Go
 * Boomana's frameEdge.ts.
 *
 * Every boardFrameImpact used to shake the whole housing as one card. Now the
 * hit lands where it happens: over the reel it came from, the top rail bows UP
 * and the bottom rail bows DOWN, springs back through its rest and settles —
 * the neighbours carried a little, the corners never moving. A reel stop bows
 * its own column lightly; the ice cracking on a wild's reel bows that column
 * hard; a hit with no reel (the transition slam) bows all five.
 *
 * Rig units are the 256 canvas over the 1280 x 1280 art, whose centred
 * 1000 x 1000 is the board (BoardFrame.svelte, FRAME_SCALE): reel i spans
 * 28 + 40i .. 68 + 40i. Measured down this game's frame_edge.png (2026-10-03):
 * the top rail is solid over units 4..20 and the bottom over 237..252. Between
 * them the art carries a dark wash at ~30% alpha over the whole board; it
 * belongs to `frame` and never moves, which is why the rail bands stop at the
 * rails rather than reaching into the opening as Boomana's do (4..30, 226..252).
 *
 * Panel mode: the rest of the frame is `frame`, nailed down. BoardFrame.svelte
 * draws it through PropMesh and feeds the hit times.
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
const TOP: [number, number] = [4, 21];
const BOTTOM: [number, number] = [236, 252];

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
		// the gate's beat: its last hit lands at 800 and a bow rings for 900ms, so
		// 1400 ended mid-swing (0.1px off the drawing). PropMesh ignores this.
		durationMs: 1750,
		landMs: 99999,
		hitMs: 99999,
		// the rails and the stiles: everything but the board opening
		inked: (p) => p[0] >= 4 && p[0] <= 252 && p[1] >= 4 && p[1] <= 252 && (p[1] < 21 || p[1] > 236 || p[0] < 30 || p[0] > 226),
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
		// for the gate: a reel stop on reel 1 at 0, the ice cracking on reels 2-3
		// at 400, and the transition slam on the whole board at 800, harder
		pose: (rig, t) =>
			spec.drive(rig, {
				blastT: [t - 800, t, t - 400, t - 400, t - 800],
				strength: [1.6, 1, 1, 1, 1.6],
			}),
	};
	return spec;
})();
