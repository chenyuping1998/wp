/**
 * THE SIGNS: the intro's title board and the Buy Bonus plate, drawn through a
 * mesh (2026-10-16). Shared by the four sister games; each game's own parts
 * and acting are in signs.ts.
 *
 * Acted the way a hand animator would, not as a loop: everything is still,
 * then one short performance (anticipation, the move, follow-through, a
 * settle) and a long hold before the next. Constant wobble is what makes
 * generated motion look generated. Only the subject acts — the title's
 * letters, the plate's one picture — never the border trim.
 *
 * Rig units are the art's own pixels. The root part is `frame`: it owns the
 * board and never moves, so check_mesh_wins can hold it down (panel mode).
 */
import { restPose, smoothstep, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rig } from './meshRig';

export type SignEnv = {
	/** ms since the sign appeared */
	t: number;
	/** ms since the last push (a new round), or < 0 */
	pushT: number;
};
export type SignSpec = MeshWinSpec & { drive: (rig: Rig, env: SignEnv) => Pose };
export type BonePose = Pose['bones'][number];

export const rect = (x0: number, y0: number, x1: number, y1: number) => (p: Point) =>
	Math.hypot(Math.max(x0 - p[0], 0, p[0] - x1), Math.max(y0 - p[1], 0, p[1] - y1));
export const disc = (cx: number, cy: number, r: number) => (p: Point) => Math.max(0, Math.hypot(p[0] - cx, p[1] - cy) - r);

/** 0 -> 1 -> 0 over `len` ms from `at`, eased both ways */
export const hump = (t: number, at: number, len: number) => {
	const u = (t - at) / len;
	return u <= 0 || u >= 1 ? 0 : smoothstep(u < 0.5 ? u * 2 : (1 - u) * 2);
};

export const signSpec = (o: {
	symbol: string;
	sprite: string;
	canvas: [number, number];
	cols: number;
	rows: number;
	soft: number;
	/** the parts that act; each hangs from `frame` unless it names a parent */
	parts: PartSpec[];
	/** where the drawing matters, for the gate */
	inked: (p: Point) => boolean;
	limits: Record<string, { pos: number; neg: number }>;
	/** px: how close to a part the board is handed to it */
	reach?: number;
	act: (name: string, bone: BonePose, env: SignEnv) => void;
}): SignSpec => {
	const [w, h] = o.canvas;
	const reach = o.reach ?? 10;
	const spec: SignSpec = {
		symbol: o.symbol,
		key: o.sprite,
		sprite: o.sprite,
		mode: 'panel',
		feetY: h,
		durationMs: 5000,
		landMs: 99999,
		hitMs: 99999,
		inked: o.inked,
		rig: {
			canvas: o.canvas,
			grid: { x0: 0, y0: 0, x1: w, y1: h, cols: o.cols, rows: o.rows },
			soft: o.soft,
			parts: [{ name: 'frame', pivot: [w / 2, h / 2], dist: () => reach }, ...o.parts.map((p) => ({ parent: 'frame', ...p }))],
		},
		limits: { frame: { pos: 0, neg: 0 }, ...o.limits },
		drive: (rig, env) => {
			const pose = restPose(rig);
			rig.bones.forEach((b, i) => {
				if (i > 0) o.act(b.name, pose.bones[i], env);
			});
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t, pushT: t - 400 }),
	};
	return spec;
};

/** letters standing on their baseline: one part each, pivot at the foot */
export const letterParts = (boxes: [number, number][], top: number, foot: number): PartSpec[] =>
	boxes.map(([x0, x1], i) => ({
		name: `l${i}`,
		pivot: [(x0 + x1) / 2, foot] as Point,
		axis: [0, -1] as Point,
		dist: rect(x0, top, x1, foot),
	}));

export const inBoxes = (boxes: [number, number][], top: number, foot: number, pad = 4) => (p: Point) =>
	p[1] > top - pad && p[1] < foot + pad && boxes.some(([x0, x1]) => p[0] > x0 - pad && p[0] < x1 + pad);

/** index of `l7` */
export const nth = (name: string) => Number(name.slice(1));
