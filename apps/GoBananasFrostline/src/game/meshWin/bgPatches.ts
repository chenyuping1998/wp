/** Small moving regions of the three clear 1920x1080 arctic background plates.
 * The patch border stays fixed and reproduces the underlying plate exactly.
 * The pennant, caged lamp, and the feature sky's aurora move. The reel area
 * remains still and legible.
 */
import { polygon, restPose, smoothstep, type MeshWinSpec, type Point, type Rig } from './meshRig';

type Rect = [number, number, number, number];
const depth = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));
const TAU = 2 * Math.PI;

const make = (id: string, key: string, rect: Rect, outline: Point[], pivot: Point, loop: number, angle: number): MeshWinSpec => {
	const shape = polygon(outline);
	return {
		symbol: id,
		key,
		sprite: key,
		mode: 'panel',
		inked: (p) => shape(p) === 0,
		feetY: rect[3],
		durationMs: loop,
		landMs: 0,
		hitMs: 0,
		limits: { moving: { pos: Math.abs(angle) * 1.5, neg: Math.abs(angle) * 1.5 } },
		rig: {
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: Math.round((rect[2] - rect[0]) / 7), rows: Math.round((rect[3] - rect[1]) / 7) },
			uv: [1920, 1080],
			soft: 4,
			parts: [
				{ name: 'frame', pivot: [(rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2], dist: (p) => Math.min(14, depth(rect, p), Math.max(0, 14 - shape(p))) },
				{ name: 'moving', parent: 'frame', pivot, dist: shape, keep: (p) => smoothstep((depth(rect, p) - 3) / 20) },
			],
		},
		pose: (rig: Rig, ms: number) => {
			const p = restPose(rig);
			const bone = p.bones[rig.bones.findIndex((b) => b.name === 'moving')];
			const phase = TAU * ms / loop;
			bone.angle = angle * Math.sin(phase);
			bone.dx = 1.5 * Math.sin(2 * phase);
			return p;
		},
	};
};

// The same shelter is shown in each scene. The blue pennant at the left and
// lantern at the right occupy almost identical coordinates across the plates.
const flag = (name: string, key: string) => make(
	name, key, [120, 218, 375, 455],
	[[174, 264], [202, 277], [254, 317], [325, 356], [314, 391], [246, 355], [185, 335]],
	[175, 273], 6200, 1.4,
);
const lamp = (name: string, key: string) => make(
	name, key, [1680, 0, 1908, 320],
	[[1781, 0], [1798, 0], [1799, 89], [1846, 117], [1848, 240], [1829, 271], [1771, 271], [1748, 240], [1750, 117], [1780, 89]],
	[1790, 0], 7100, 0.65,
);

// A broad, slowly flexing aurora is painted into the feature plate. The sky
// patch covers its original pixels, with a pinned perimeter against the plate.
const aurora = (): MeshWinSpec => {
	const rect: Rect = [555, 16, 1575, 386];
	const boundary = (p: Point) => depth(rect, p);
	return {
		symbol: 'BG_FG_AURORA', key: 'gbBgFeature', sprite: 'gbBgFeature', mode: 'panel',
		inked: ([x, y]) => x > 650 && x < 1510 && y > 42 && y < 345,
		feetY: rect[3], durationMs: 9000, landMs: 0, hitMs: 0,
		limits: { veilL: { pos: 1, neg: 1 }, veilR: { pos: 1, neg: 1 } },
		rig: {
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: 68, rows: 26 },
			uv: [1920, 1080], soft: 30,
			parts: [
				{ name: 'frame', pivot: [1065, 200], dist: (p) => Math.min(35, boundary(p)) },
				{ name: 'veilL', parent: 'frame', pivot: [870, 180], dist: (p) => Math.max(0, Math.hypot((p[0] - 870) / 2.5, p[1] - 180) - 150), keep: (p) => smoothstep((boundary(p) - 12) / 65) },
				{ name: 'veilR', parent: 'frame', pivot: [1260, 155], dist: (p) => Math.max(0, Math.hypot((p[0] - 1260) / 2.5, p[1] - 155) - 150), keep: (p) => smoothstep((boundary(p) - 12) / 65) },
			],
		},
		pose: (rig, ms) => {
			const p = restPose(rig);
			const phase = TAU * ms / 9000;
			p.bones[1].dy = 3.4 * Math.sin(phase);
			p.bones[1].dx = 1.7 * Math.sin(phase + 1.2);
			p.bones[2].dy = 4.1 * Math.sin(phase - 1.0);
			p.bones[2].dx = 2.2 * Math.sin(phase + 0.6);
			return p;
		},
	};
};

export const MESH_BG: Record<string, MeshWinSpec[]> = {
	gbBgBase: [flag('BG_BASE_FLAG', 'gbBgBase'), lamp('BG_BASE_LAMP', 'gbBgBase')],
	gbBgFeature: [flag('BG_FG_FLAG', 'gbBgFeature'), lamp('BG_FG_LAMP', 'gbBgFeature'), aurora()],
	gbBgSuperspin: [flag('BG_SUPER_FLAG', 'gbBgSuperspin'), lamp('BG_SUPER_LAMP', 'gbBgSuperspin')],
};
