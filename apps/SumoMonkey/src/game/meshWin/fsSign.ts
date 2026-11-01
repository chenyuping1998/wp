/**
 * THE FREE-GAME SIGN (gbFsSign) — the plank board that drops in over the board
 * for the intro and the outro — as a mesh.
 *
 * FreeSpinAnimation.svelte drops it with a back-out and swings it on its
 * container; as a sprite that was all it could do, a flat card that stopped
 * dead. Here the board LANDS: stretched a little by the fall, squashed on the
 * hit, and its three planks rattle in the frame one after another, top to
 * bottom, the way loose boards do. Afterwards it never quite goes still — the
 * planks breathe in the mine's draught while the player reads it.
 *
 * The brass corners and the frame round the planks belong to `board`, so they
 * only ever squash with it; the planks hand their weight back to it across the
 * last few units of their edges, so no seam opens.
 *
 * The text on the sign (FreeSpinIntro/Outro) is drawn on top, not through the
 * mesh. It sits on the MIDDLE plank; DynamiteMesh-style, SignMesh.svelte reports
 * the middle plank's offset so the text rides with it (`textOffset`).
 *
 * Rig units are a 256 x 200.4 canvas over the 1280 x 1002 art. Measured on
 * fs_sign.png, 2026-09-26.
 */
import {
	flick,
	polygon,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Point,
	type Pose,
	type Rect,
	type Rig,
} from './meshRig';

export const SIGN_CANVAS: [number, number] = [256, 1002 * (256 / 1280)];

export type SignEnv = {
	/** ms since the sign started to drop */
	t: number;
};

export type SignSpec = MeshWinSpec & { drive: (rig: Rig, env: SignEnv) => Pose };

// FreeSpinAnimation drops it over 700ms with svelte's backOut, which first
// reaches the resting line at 37% of the way (1 - s/(s+1), s = 1.70158)
export const SIGN_LAND_MS = 259;

const BOARD: Rect = [26, 33, 230, 190];
// the planks inside the frame; the seams between them are at y 84 and 136
const PLANKS: Record<string, Rect> = {
	plankTop: [34, 41, 222, 84],
	plankMid: [34, 84, 222, 136],
	plankBot: [34, 136, 222, 182],
};
const rect = (r: Rect) => polygon([[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]);
const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));
// how far inside the plank area as a whole (the frame edge is where the
// planks give their weight back; the seams between planks are not)
const INNER: Rect = [34, 41, 222, 182];

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

// each plank: when it is struck (after the board lands), and how it rattles
const RATTLE: Record<string, { delay: number; dy: number; tilt: number }> = {
	plankTop: { delay: 0, dy: 2.2, tilt: 0.9 },
	plankMid: { delay: 45, dy: 2.8, tilt: -1.1 },
	plankBot: { delay: 90, dy: 3.2, tilt: 1.2 },
};

export const SIGN: SignSpec = (() => {
	const spec: SignSpec = {
		symbol: 'fsSign',
		key: 'gbFsSign',
		sprite: 'gbFsSign',
		mode: 'panel',
		feetY: BOARD[3],
		durationMs: 2400,
		landMs: 99999,
		hitMs: 99999,
		inked: (p) => depthIn(BOARD, p) > 0,
		rig: {
			canvas: SIGN_CANVAS,
			grid: { x0: 0, y0: 0, x1: 256, y1: SIGN_CANVAS[1], cols: 64, rows: 50 },
			soft: 2.5,
			parts: [
				{ name: 'frame', pivot: [128, 100], dist: () => 10 },
				{ name: 'board', parent: 'frame', pivot: [128, 33], axis: [0, 1], dist: rect(BOARD) },
				...Object.entries(PLANKS).map(([name, r]) => ({
					name,
					parent: 'board',
					pivot: [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2] as Point,
					axis: [1, 0] as Point,
					priority: 1,
					dist: rect(r),
					keep: (p: Point) => smoothstep(depthIn(INNER, p) / 7),
				})),
			],
		},
		// geometric (check_mesh_wins.mjs fsSign --limits, 2026-09-26)
		limits: {
			board: { pos: 1, neg: 1 },
			plankTop: { pos: 2, neg: 2 },
			plankMid: { pos: 2, neg: 2 },
			plankBot: { pos: 2, neg: 2 },
		},
		drive: (rig, env) => {
			const pose = restPose(rig);
			const t = env.t;
			const land = t - SIGN_LAND_MS;
			// the board hangs from its top edge: stretched by the fall, then the hit
			const b = bone(rig, pose, 'board');
			const fall = smoothstep(t / 120) * (1 - smoothstep(land / 40 + 1));
			const hit = land >= 0 ? flick(land, 0, 3.6, 5.5) : 0;
			b.along = 1 + 0.035 * fall - 0.06 * hit;
			b.across = 1 - 0.015 * fall + 0.035 * hit;
			// the draught, once it has settled
			const calm = smoothstep((land - 700) / 600);
			for (const [name, r] of Object.entries(RATTLE)) {
				const p = bone(rig, pose, name);
				const k = land >= r.delay ? flick(land, r.delay, 7.5, 7) : 0;
				const breathe = Math.sin(t / 900 + r.delay / 30);
				p.dy = r.dy * k + 0.35 * calm * breathe;
				p.angle = r.tilt * k + 0.18 * calm * breathe * Math.sign(r.tilt);
			}
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t }),
	};
	return spec;
})();

/** where the text on the middle plank should be drawn from, in rig units off
 *  its rest place — SignMesh.svelte hands this to the text */
export const signTextOffset = (rig: Rig, pose: Pose): Point => {
	const b = bone(rig, pose, 'board');
	const m = bone(rig, pose, 'plankMid');
	// the board hangs from its top edge (y 33): the middle plank's centre
	// (y 110) moves with its along-scale
	return [m.dx, (110 - 33) * (b.along - 1) + m.dy];
};
