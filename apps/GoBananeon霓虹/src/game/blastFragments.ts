export type Fragment = { x: number; y: number; w: number; h: number; mass: number };

export const MAX_SHARDS_PER_CELL = 9;

/** Find visible art before cutting it. Transparent padding must never become
 * an invisible particle, especially on the free-standing letter symbols.
 * Rectangles are normalized to the original image so rest positions still
 * reconstruct the symbol exactly. Uneven rows avoid a uniform checkerboard. */
export const alphaFragments = (rgba: Uint8ClampedArray, width: number, height: number): Fragment[] => {
	const threshold = 20;
	let left = width, top = height, right = -1, bottom = -1;
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		if (rgba[(y * width + x) * 4 + 3] <= threshold) continue;
		left = Math.min(left, x); right = Math.max(right, x);
		top = Math.min(top, y); bottom = Math.max(bottom, y);
	}
	if (right < left || bottom < top) return [];
	const cols = [0, 0.29, 0.64, 1].map((u) => left + Math.round((right - left + 1) * u));
	const rows = [0, 0.24, 0.62, 1].map((u) => top + Math.round((bottom - top + 1) * u));
	const pieces: Fragment[] = [];
	for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
		let x0 = cols[gx + 1], x1 = -1, y0 = rows[gy + 1], y1 = -1, mass = 0;
		for (let y = rows[gy]; y < rows[gy + 1]; y++) for (let x = cols[gx]; x < cols[gx + 1]; x++) {
			const alpha = rgba[(y * width + x) * 4 + 3];
			if (alpha <= threshold) continue;
			x0 = Math.min(x0, x); x1 = Math.max(x1, x);
			y0 = Math.min(y0, y); y1 = Math.max(y1, y);
			mass += alpha / 255;
		}
		// Sub-pixel wisps and isolated antialias pixels have no readable debris.
		if (mass < 1.5 || x1 < x0 || y1 < y0) continue;
		pieces.push({ x: x0 / width, y: y0 / height, w: (x1 - x0 + 1) / width, h: (y1 - y0 + 1) / height, mass: mass / (width * height) });
	}
	return pieces;
};

/** A safe fallback for a browser that cannot read a source image. */
export const fallbackFragments = (): Fragment[] => Array.from({ length: MAX_SHARDS_PER_CELL }, (_, i) => ({
	x: (i % 3) / 3, y: Math.floor(i / 3) / 3, w: 1 / 3, h: 1 / 3, mass: 1 / 9,
}));
