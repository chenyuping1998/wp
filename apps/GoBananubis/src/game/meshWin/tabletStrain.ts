/** The two cut tablet images bend under the seal's last beat of pressure.
 * Both their fracture edges and outside edges stay put: the two drawings still
 * cover the sealed cell, and at the break they return exactly to the original
 * pixels before MysteryReveal lets the rigid shards fall.
 */
import { buildGrid } from './plaque';

export const TABLET_ART = 256;
export const buildTabletGrid = () => buildGrid(TABLET_ART, TABLET_ART, 24, 24);
export type TabletGrid = ReturnType<typeof buildTabletGrid>;

const seam = (y: number) => {
	// The fracture cut in m_shard_l/r.png, read from top to bottom.
	const points: [number, number][] = [[0, 128], [44, 145], [88, 126], [128, 122], [170, 128], [211, 141], [256, 128]];
	for (let i = 1; i < points.length; i++) {
		if (y <= points[i][0]) {
			const t = (y - points[i - 1][0]) / (points[i][0] - points[i - 1][0]);
			return points[i - 1][1] + (points[i][1] - points[i - 1][1]) * t;
		}
	}
	return 128;
};

/** `progress` is 0..1 within the strain, `side` is the shard being drawn. */
export const poseTabletStrain = (grid: TabletGrid, progress: number, side: -1 | 1, out: Float32Array) => {
	const p = Math.max(0, Math.min(1, progress));
	// One gathered breath, spent before the shards start to fall. Exact rest at
	// both ends matters because the sprites take over at progress 1.
	const pressure = Math.sin(Math.PI * p) ** 2;
	for (let v = 0; v < grid.rest.length / 2; v++) {
		const x = grid.rest[v * 2], y = grid.rest[v * 2 + 1];
		const cut = seam(y);
		const reach = side < 0 ? Math.max(0, (cut - x) / cut) : Math.max(0, (x - cut) / (TABLET_ART - cut));
		// Zero at the shared fracture and the outside edge; the painted face
		// between them flexes outward. A softer vertical wrinkle follows the
		// jagged cut instead of shifting the whole stone like a sprite.
		const bend = Math.sin(Math.PI * Math.min(1, reach));
		const vertical = Math.sin((y / TABLET_ART) * Math.PI * 2);
		out[v * 2] = x + side * 7 * pressure * bend;
		out[v * 2 + 1] = y + 3 * pressure * bend * vertical;
	}
};
