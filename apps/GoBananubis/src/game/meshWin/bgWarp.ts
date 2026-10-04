/**
 * THE BACKGROUND, MOVING — where the plate has something to move.
 *
 * Most of what shows round the board is stone (the colonnade's columns, the
 * crypt's walls and its heap of pots), which should not move. The light and
 * loose air between them can: the base plate's sunlit dust, the feature
 * sanctum's fire and sand, and the superspin plate's moonlit fog.
 *
 *   heat   the firelit gap between the first two columns wavers like air over
 *          a fire — two travelling waves up the strip, a long slow one and a
 *          short quick one, sideways only
 *   dust   the sand and the hanging dust at the columns' feet drift, slowly,
 *          as if the heat were stirring them
 *
 * A warp is a rectangle of the plate drawn through a grid ON TOP of the plate
 * at exactly its place (components/BackgroundWarp.svelte). Its border is
 * pinned — the displacement fades to nothing over `edge` px inside it — so at
 * its edges it IS the plate and there is no seam. It is a function of time
 * that never jumps, so it runs forever without a loop point.
 *
 * Rigged in the plate's own pixels (1920x1080). IMPORTS ONLY plaque.ts: the
 * gate (design/check_mesh_wins.mjs) poses these with this exact code.
 */
import { buildGrid, type PlaqueGrid } from './plaque';

export const PLATE = { w: 1920, h: 1080 };

export type Warp = {
	id: string;
	/** [x0, y0, x1, y1] in plate px */
	rect: [number, number, number, number];
	cols: number;
	rows: number;
	/** px over which the displacement fades in from the pinned border */
	edge: number;
	/** the displacement at plate point (x, y), `t` seconds */
	at: (x: number, y: number, t: number) => [number, number];
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (v: number) => {
	const t = clamp01(v);
	return t * t * (3 - 2 * t);
};
const TAU = 2 * Math.PI;

const HEAT: Warp = {
	id: 'heat',
	rect: [160, 100, 370, 730],
	cols: 12,
	rows: 36,
	edge: 36,
	at: (x, y, t) => [
		// rising: the waves travel UP the strip (y falls as t grows)
		4 * Math.sin(TAU * (y / 150 + t / 1.3)) + 1.6 * Math.sin(TAU * (y / 55 + t / 0.55) + x / 40),
		0,
	],
};

const DUST: Warp = {
	id: 'dust',
	rect: [110, 670, 560, 900],
	cols: 24,
	rows: 12,
	edge: 40,
	at: (x, y, t) => [
		6 * Math.sin(TAU * (t / 6.5) + y / 70) + 2.5 * Math.sin(TAU * (t / 2.9) + x / 110),
		1.8 * Math.sin(TAU * (t / 3.7) + x / 90),
	],
};

// The pale dust rising out of the sun patch on the base plate. Keep the
// doorway, column edges and hard floor lines outside the moving centre.
const SUN_DUST: Warp = {
	id: 'sunDust',
	rect: [715, 525, 995, 785],
	cols: 16,
	rows: 16,
	edge: 65,
	at: (x, y, t) => [
		4.5 * Math.sin(TAU * (t / 5.8 + y / 180)) + 1.5 * Math.sin(TAU * (t / 2.9 + x / 155)),
		-2.5 * Math.sin(TAU * (t / 6.7 + x / 200)),
	],
};

// Fog under the moon shaft on the superspin plate. It drifts in two broad
// bands while the carved ceiling and the heap of treasure stay planted.
const MOON_FOG: Warp = {
	id: 'moonFog',
	rect: [615, 440, 1125, 740],
	cols: 28,
	rows: 18,
	edge: 75,
	at: (x, y, t) => [
		6 * Math.sin(TAU * (t / 7.2 + y / 225)) + 1.8 * Math.sin(TAU * (t / 3.8 + x / 260)),
		2.2 * Math.sin(TAU * (t / 8.4 + x / 320)),
	],
};

/** by plate asset key */
export const WARPS: Record<string, Warp[]> = {
	gbBgBase: [SUN_DUST],
	gbBgFeature: [HEAT, DUST],
	gbBgSuperspin: [MOON_FOG],
};

export type WarpGrid = PlaqueGrid;

/** the warp's grid: positions in plate px, UVs into the whole plate */
export const buildWarpGrid = (w: Warp): WarpGrid => {
	const [x0, y0, x1, y1] = w.rect;
	const g = buildGrid(x1 - x0, y1 - y0, w.cols, w.rows);
	const n = g.rest.length / 2;
	for (let v = 0; v < n; v++) {
		g.rest[v * 2] += x0;
		g.rest[v * 2 + 1] += y0;
		g.uvs[v * 2] = g.rest[v * 2] / PLATE.w;
		g.uvs[v * 2 + 1] = g.rest[v * 2 + 1] / PLATE.h;
	}
	return g;
};

export const poseWarp = (w: Warp, grid: WarpGrid, t: number, out: Float32Array) => {
	const [x0, y0, x1, y1] = w.rect;
	const n = grid.rest.length / 2;
	for (let v = 0; v < n; v++) {
		const x = grid.rest[v * 2], y = grid.rest[v * 2 + 1];
		const depth = Math.min(x - x0, x1 - x, y - y0, y1 - y);
		const e = smoothstep(depth / w.edge);
		const [dx, dy] = e > 0 ? w.at(x, y, t) : [0, 0];
		out[v * 2] = x + dx * e;
		out[v * 2 + 1] = y + dy * e;
	}
};
