// A pinned triangle grid, shared by symbol wins and the three landscape plates.
// UVs never move: the painted detail stays sharp while selected vertices move.
export type Grid = {
	rest: Float32Array;
	uvs: Float32Array;
	indices: Uint32Array;
	cols: number;
	rows: number;
};

export const makeGrid = (width: number, height: number, cols: number, rows: number): Grid => {
	const rest = new Float32Array((cols + 1) * (rows + 1) * 2);
	const uvs = new Float32Array(rest.length);
	const indices = new Uint32Array(cols * rows * 6);
	for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
		const v = (r * (cols + 1) + c) * 2;
		uvs[v] = c / cols;
		uvs[v + 1] = r / rows;
		rest[v] = uvs[v] * width;
		rest[v + 1] = uvs[v + 1] * height;
	}
	for (let r = 0, k = 0; r < rows; r++) for (let c = 0; c < cols; c++, k += 6) {
		const a = r * (cols + 1) + c;
		const b = a + 1;
		const d = a + cols + 1;
		indices.set([a, b, d + 1, a, d + 1, d], k);
	}
	return { rest, uvs, indices, cols, rows };
};

const smooth = (v: number) => {
	const x = Math.max(0, Math.min(1, v));
	return x * x * (3 - 2 * x);
};
const bell = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
	Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) * 2);

export const poseSymbol = (grid: Grid, out: Float32Array, name: string, seconds: number) => {
	const w = grid.rest[grid.rest.length - 2];
	const h = grid.rest[grid.rest.length - 1];
	const hit = smooth(seconds / 0.2);
	const fade = 1 - smooth((seconds - 0.66) / 0.3);
	const k = hit * fade;
	const variant = name.charCodeAt(0) + (Number(name.slice(1)) || 0);
	for (let v = 0; v < grid.rest.length / 2; v++) {
		const u = grid.uvs[v * 2], q = grid.uvs[v * 2 + 1];
		// The painted frame is fixed; only the inner subject bends. The edge
		// falloff also makes the end pose identical to the static sprite.
		const edge = smooth(Math.min(u, 1 - u, q, 1 - q) / 0.16);
		const subject = bell(u, q, 0.5, 0.49, 0.32, 0.34) * edge;
		const wave = Math.sin(seconds * 14 + q * 7 + variant * 0.3);
		const isHigh = name.startsWith('H');
		const isLow = name.startsWith('L');
		const dx = (isHigh ? 0.014 * wave : isLow ? 0.009 * wave : 0.012 * Math.sin(seconds * 11 + q * 6));
		const dy = (isHigh ? -0.027 : isLow ? -0.014 : -0.02) * Math.sin(Math.PI * smooth(seconds / 0.5)) + 0.006 * wave;
		out[v * 2] = grid.rest[v * 2] + dx * w * subject * k;
		out[v * 2 + 1] = grid.rest[v * 2 + 1] + dy * h * subject * k;
	}
};

export const poseBackground = (grid: Grid, out: Float32Array, seconds: number, scene: string) => {
	const w = grid.rest[grid.rest.length - 2];
	const h = grid.rest[grid.rest.length - 1];
	const shift = scene === 'feature' ? 1.1 : scene === 'superspin' ? 2.3 : 0;
	for (let v = 0; v < grid.rest.length / 2; v++) {
		const u = grid.uvs[v * 2], q = grid.uvs[v * 2 + 1];
		// Lock the outer border so the cover crop cannot expose empty pixels.
		const edge = smooth(Math.min(u, 1 - u, q, 1 - q) / 0.09);
		const foliage = bell(u, q, 0.12, 0.18, 0.15, 0.22) + bell(u, q, 0.86, 0.17, 0.15, 0.26);
		const mist = bell(u, q, 0.52, 0.53, 0.27, 0.18);
		const sway = Math.sin(seconds * 0.72 + shift + u * 5 + q * 3);
		out[v * 2] = grid.rest[v * 2] + w * edge * (0.004 * foliage * sway + 0.002 * mist * Math.sin(seconds * 0.25 + shift));
		out[v * 2 + 1] = grid.rest[v * 2 + 1] + h * edge * (0.003 * foliage * Math.cos(seconds * 0.62 + shift + u * 4) - 0.0017 * mist * Math.sin(seconds * 0.3 + shift));
	}
};
