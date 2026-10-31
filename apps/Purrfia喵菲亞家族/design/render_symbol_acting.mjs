// Contact sheet of the symbol wins, posed by the SAME src/game/symbolActing.ts the game runs and rasterised in
// software (no browser): one row per symbol, N frames across the win window, the cell outline drawn faintly (and
// the brief's 10% allowance dimmer) so anything leaving the cell is visible. With --weights, a second sheet shows
// each symbol's object regions (one colour per bone).
//   node design/render_symbol_acting.mjs [out.png] [frames=12] [scale=2] [--weights] [--only=H1,H3]
// Needs pngjs from E:\stake\tools\gen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'file:///E:/stake/tools/gen/node_modules/pngjs/lib/png.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = await import(pathToFileURL(path.join(app, 'src/game/symbolActing.ts')).href);
const SIZE = 84; // constants.ts SYMBOL_SIZE
const RATIO = { H: 0.98, L: 0.84, S: 1.1 }; // utils.ts: HIGH / LOW / SPECIAL_SYMBOL_SIZE
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const OUT = args[0] ?? path.join(app, 'design/review/symbol_acting.png');
const N = +(args[1] ?? 12), K = +(args[2] ?? 2), WEIGHTS = process.argv.includes('--weights');
const art = (name) => PNG.sync.read(fs.readFileSync(path.join(app, 'static/assets/sprites/purrfiaSymbols', `${name.toLowerCase()}.png`)));

const only = process.argv.find((a) => a.startsWith('--only='));
const rows = only ? only.slice(7).split(',') : ['H1', 'H2', 'H3', 'H4', 'S', 'L1'];
const CW = Math.round(SIZE * 1.5 * K), LABEL = 8;
const cols = WEIGHTS ? 1 : N;
const png = new PNG({ width: LABEL + cols * CW, height: rows.length * CW });
for (let i = 0; i < png.data.length; i += 4) { png.data[i] = 22; png.data[i + 1] = 20; png.data[i + 2] = 28; png.data[i + 3] = 255; }
const COLORS = [[255, 90, 90], [90, 200, 255], [255, 210, 60], [120, 255, 120], [220, 120, 255], [255, 150, 60]];

function tri(ox, oy, P, UV, a, b, c, t, alpha, add, shade, tint) {
	const [x0, y0, x1, y1, x2, y2] = [P[a * 2], P[a * 2 + 1], P[b * 2], P[b * 2 + 1], P[c * 2], P[c * 2 + 1]];
	const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxX = Math.min(CW - 1, Math.ceil(Math.max(x0, x1, x2)));
	const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxY = Math.min(CW - 1, Math.ceil(Math.max(y0, y1, y2)));
	const d = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
	if (Math.abs(d) < 1e-9) return;
	for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
		const px = x + 0.5, py = y + 0.5;
		const w1 = ((px - x0) * (y2 - y0) - (x2 - x0) * (py - y0)) / d, w2 = ((x1 - x0) * (py - y0) - (px - x0) * (y1 - y0)) / d, w0 = 1 - w1 - w2;
		if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
		const u = w0 * UV[a * 2] + w1 * UV[b * 2] + w2 * UV[c * 2], v = w0 * UV[a * 2 + 1] + w1 * UV[b * 2 + 1] + w2 * UV[c * 2 + 1];
		const si = (Math.min(t.height - 1, Math.max(0, Math.floor(v * t.height))) * t.width + Math.min(t.width - 1, Math.max(0, Math.floor(u * t.width)))) * 4;
		const sa = (t.data[si + 3] / 255) * alpha;
		if (sa <= 0) continue;
		const di = ((oy + y) * png.width + ox + x) * 4;
		for (let k = 0; k < 3; k++) {
			const src = (tint ? tint[k] * 0.55 + t.data[si + k] * 0.45 : t.data[si + k]) * shade;
			png.data[di + k] = add ? Math.min(255, png.data[di + k] + src * sa) : Math.round(src * sa + png.data[di + k] * (1 - sa));
		}
	}
}

rows.forEach((name, row) => {
	const t = art(name), r = RATIO[name[0]] ?? 1, w = SIZE * r, h = SIZE * r;
	const rig = A.rigWeights(name), B = rig.bones.length, G = A.GRID, V = (G + 1) ** 2;
	const UV = new Float32Array(V * 2);
	for (let gy = 0, i = 0; gy <= G; gy++) for (let gx = 0; gx <= G; gx++, i += 2) { UV[i] = gx / G; UV[i + 1] = gy / G; }
	const glowBone = rig.bones.indexOf(A.GLOW[name]);
	const cx = CW / 2, cy = CW / 2;
	for (let f = 0; f < cols; f++) {
		const u = WEIGHTS ? 0 : f / (N - 1);
		const pose = A.symbolAct(name, u), ox = LABEL + f * CW, oy = row * CW;
		for (const [half, col] of [[SIZE / 2, 70], [SIZE * 0.55, 44]]) for (let i = -half * K; i <= half * K; i++) for (const [x, y] of [[cx + i, cy - half * K], [cx + i, cy + half * K], [cx - half * K, cy + i], [cx + half * K, cy + i]]) {
			const di = ((oy + Math.round(y)) * png.width + ox + Math.round(x)) * 4; png.data[di] = png.data[di + 1] = png.data[di + 2] = col;
		}
		const P = new Float32Array(V * 2);
		A.skinSymbol(pose, rig, w, h, SIZE, P);
		for (let i = 0; i < V * 2; i += 2) { P[i] = P[i] * K + cx; P[i + 1] = P[i + 1] * K + cy; }
		for (const add of [false, true]) {
			if (add && (pose.glow <= 0 || glowBone < 0)) continue;
			for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
				const a = gy * (G + 1) + gx, b = a + 1, c = a + G + 2, d = a + G + 1;
				let tint = null;
				if (WEIGHTS && B) {
					let best = -1, bw = 0.3;
					for (let k = 0; k < B; k++) { const m = (rig.weights[a * B + k] + rig.weights[c * B + k]) / 2; if (m > bw) { bw = m; best = k; } }
					tint = best >= 0 ? COLORS[best % COLORS.length] : null;
				}
				if (add && (rig.weights[a * B + glowBone] + rig.weights[c * B + glowBone]) / 2 < 0.4) continue;
				const alpha = add ? pose.glow : 1;
				tri(ox, oy, P, UV, a, b, c, t, alpha, add, pose.root.shade, tint);
				tri(ox, oy, P, UV, a, c, d, t, alpha, add, pose.root.shade, tint);
			}
		}
		for (const [n, rect] of Object.entries(A.SYMBOL_EXTRAS[name] ?? {})) {
			const e = pose.extras[n];
			if (!e || e.alpha <= 0) continue;
			const Q = new Float32Array(8);
			A.skinExtra(e, rect, w, h, pose.root, SIZE, Q);
			for (let i = 0; i < 8; i += 2) { Q[i] = Q[i] * K + cx; Q[i + 1] = Q[i + 1] * K + cy; }
			const QU = new Float32Array([rect[0], rect[1], rect[2], rect[1], rect[2], rect[3], rect[0], rect[3]]);
			tri(ox, oy, Q, QU, 0, 1, 2, t, e.alpha, false, pose.root.shade, null);
			tri(ox, oy, Q, QU, 0, 2, 3, t, e.alpha, false, pose.root.shade, null);
		}
	}
});
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, PNG.sync.write(png));
console.log(`symbol acting ${WEIGHTS ? 'regions' : 'sheet'}: ${rows.join(' ')} × ${cols} -> ${OUT}`);
