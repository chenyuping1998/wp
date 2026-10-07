import { makeGrid, poseBackground, poseSymbol } from '../src/game/gridMotion.ts';

const check = (kind, name, width, height, cols, rows, times) => {
	const grid = makeGrid(width, height, cols, rows);
	const posed = new Float32Array(grid.rest);
	let minimum = Infinity, maximum = 0, moved = 0;
	for (const t of times) {
		if (kind === 'symbol') poseSymbol(grid, posed, name, t);
		else poseBackground(grid, posed, t, name);
		for (let v = 0; v < posed.length / 2; v++) {
			const u = grid.uvs[v * 2], q = grid.uvs[v * 2 + 1];
			const d = Math.hypot(posed[v * 2] - grid.rest[v * 2], posed[v * 2 + 1] - grid.rest[v * 2 + 1]);
			maximum = Math.max(maximum, d);
			if (u > 0.15 && u < 0.85 && q > 0.15 && q < 0.85) moved = Math.max(moved, d);
			if ((u === 0 || u === 1 || q === 0 || q === 1) && d > 0.001) throw new Error(`${kind} border moves ${d}px`);
		}
		for (let i = 0; i < grid.indices.length; i += 3) {
			const [a, b, c] = [grid.indices[i], grid.indices[i + 1], grid.indices[i + 2]];
			const area = (p) => (p[b * 2] - p[a * 2]) * (p[c * 2 + 1] - p[a * 2 + 1]) - (p[b * 2 + 1] - p[a * 2 + 1]) * (p[c * 2] - p[a * 2]);
			minimum = Math.min(minimum, area(posed) / area(grid.rest));
		}
	}
	if (minimum < 0.7) throw new Error(`${kind} ${name}: triangle area ${minimum}`);
	if (moved < (kind === 'symbol' ? width * 0.003 : width * 0.0004)) throw new Error(`${kind} ${name}: motion too small (${moved}px)`);
	console.log(`OK ${kind} ${name}: min area ${minimum.toFixed(2)}, max move ${maximum.toFixed(1)}px`);
};

const symbolTimes = Array.from({ length: 61 }, (_, i) => i / 60);
for (const name of ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'W', 'S', 'M'])
	check('symbol', name, 512, 512, 12, 12, symbolTimes);
const backgroundTimes = Array.from({ length: 80 }, (_, i) => i * 0.25);
for (const name of ['base', 'feature', 'superspin'])
	check('background', name, 1920, 1080, 40, 24, backgroundTimes);
