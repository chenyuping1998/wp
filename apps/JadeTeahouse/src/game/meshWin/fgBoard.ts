/**
 * THE FREE-SPIN BOARD (sushiV8/fg_intro.png, fg_total.png — one drawing) — its
 * two jade pendants swing.
 *
 * FreeSpinAnimation.svelte drops the board in and swings it as a whole. Here
 * the pendants hanging off its sides answer the drop: thrown outward when the
 * board lands, swinging back and settling, the tassels a beat behind and
 * further; then they keep drifting while the player reads it. They only ever
 * swing OUTWARD of their rest line — inward they would run into the frame.
 *
 * The WHOLE board is the mesh, not a patch over the sprite: the pendants hang
 * over transparent air, and a patch would leave the sprite's own pendant
 * showing through wherever the mesh's moved away.
 *
 * Rig units are board pixels (1600 x 1000), measured 2026-10-09 from the
 * alpha: cord from (50, 205), knot y 280..345, bead 345..390, disc y 395..455,
 * tassel cap 460..480, tassel to y 668, x 14..86; the right one mirrored about
 * x = 1599 / 2.
 */
import { flick, polygon, restPose, smoothstep, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rig } from './meshRig';

export const FG_BOARD_CANVAS: [number, number] = [1600, 1000];

export type BoardEnv = { /** ms since the board started to drop */ t: number };
export type BoardSpec = MeshWinSpec & { drive: (rig: Rig, env: BoardEnv) => Pose };

// FreeSpinAnimation drops it over 700ms with svelte's backOut, which first
// reaches the resting line at 37% of the way
const LAND_MS = 259;

const UPPER: Point[] = [[46, 200], [58, 200], [60, 270], [80, 300], [82, 330], [66, 345], [72, 385], [86, 400], [86, 450], [70, 468], [30, 468], [14, 450], [14, 400], [28, 385], [34, 345], [24, 330], [26, 300], [44, 270]];
const TASSEL: Point[] = [[34, 462], [66, 462], [72, 500], [84, 600], [86, 662], [60, 670], [30, 670], [14, 640], [18, 600], [30, 500]];
const mirror = (pts: Point[]): Point[] => pts.map(([x, y]) => [1599 - x, y]);

const pendant = (side: 'L' | 'R'): PartSpec[] => {
	const m = side === 'L' ? (p: Point[]) => p : mirror;
	const x = side === 'L' ? 52 : 1599 - 52;
	const upper = polygon(m(UPPER));
	const tassel = polygon(m(TASSEL));
	return [
		{
			name: `pend${side}`,
			parent: 'board',
			pivot: [x, 205],
			axis: [0, 1],
			priority: 1,
			dist: upper,
			// the cord comes free of the knob it hangs from over 24px
			keep: (p) => smoothstep((p[1] - 205) / 24),
		},
		{
			name: `tassel${side}`,
			parent: `pend${side}`,
			pivot: [x, 466],
			axis: [0, 1],
			priority: 2,
			dist: tassel,
			keep: (p) => smoothstep((p[1] - 462) / 14),
		},
	];
};

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

export const FG_BOARD = (sprite: string): BoardSpec => {
	const spec: BoardSpec = {
		symbol: `fgBoard:${sprite}`,
		key: sprite,
		sprite,
		mode: 'panel',
		feetY: 1000,
		durationMs: 3000,
		landMs: 99999,
		hitMs: 99999,
		// the pendants' own pixels: the air round them may bend freely
		inked: (p) => [UPPER, TASSEL, mirror(UPPER), mirror(TASSEL)].some((pts) => polygon(pts)(p) === 0),
		rig: {
			canvas: FG_BOARD_CANVAS,
			grid: { x0: 0, y0: 0, x1: 1600, y1: 1000, cols: 100, rows: 62 },
			soft: 6,
			parts: [
				// everything that is not a pendant: still
				{ name: 'board', pivot: [800, 500], dist: () => 12 },
				...pendant('L'),
				...pendant('R'),
			],
		},
		limits: {
			pendL: { pos: 5, neg: 0.5 },
			tasselL: { pos: 9, neg: 0.5 },
			pendR: { pos: 0.5, neg: 5 },
			tasselR: { pos: 0.5, neg: 9 },
		},
		drive: (rig, { t }) => {
			const pose = restPose(rig);
			// thrown out on the landing, then a slow drift; |.| keeps every swing
			// on the outward side
			const kick = (t0: number, hz: number) => Math.abs(flick(t, t0, hz, 1.4));
			const drift = (phase: number) => 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 2600 + phase);
			const ramp = smoothstep(t / 600);
			const swing = (s: number, phase: number) => s * (PEND_DEG * kick(LAND_MS, 0.9) + DRIFT_DEG * drift(phase) * ramp);
			const tassel = (s: number, phase: number) => s * (TASSEL_DEG * kick(LAND_MS + 120, 1.1) + 1.6 * DRIFT_DEG * drift(phase - 0.7) * ramp);
			bone(rig, pose, 'pendL').angle = swing(1, 0);
			bone(rig, pose, 'tasselL').angle = tassel(1, 0);
			bone(rig, pose, 'pendR').angle = swing(-1, 1.7);
			bone(rig, pose, 'tasselR').angle = tassel(-1, 1.7);
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t }),
	};
	return spec;
};

// set from the measured limits
const PEND_DEG = 1.2;
const TASSEL_DEG = 2.4;
const DRIFT_DEG = 0.4;
