// Strip the AI-baked checkerboard "transparency" off the party-hostess
// character art (design/source/role*.png) and emit true-alpha, tightly
// cropped sprites — same class of problem as the symbol art (HANDOFF §9:
// process_symbols.py flood-fill 去棋盤格). Checker tones: white 255 / gray ~180.
//
// Optionally reproportions the figure: legs (below hipSplit) stretched
// vertically, whole figure slimmed horizontally — bilinear resample.
//
// Usage: node design/process_role.mjs <dir with node_modules for pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node process_role.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/character');
fs.mkdirSync(OUT_DIR, { recursive: true });

// role3 (full body, shorts+stockings) is the live asset; legs stretched and
// figure slimmed a touch per art direction. hipSplit = fraction of cropped
// height where the legs begin.
const JOBS = [
	{ src: 'role3.png', out: 'party_hostess_v2.png', hipSplit: 0.55, legStretch: 1.18, slimX: 0.94 },
];

const processOne = ({ src, out, hipSplit = 1, legStretch = 1, slimX = 1 }) => {
	const png = PNG.sync.read(fs.readFileSync(path.join(appRoot, 'design/source', src)));
	const { width: W, height: H, data } = png;

	const idx = (x, y) => (y * W + x) * 4;
	const isChecker = (x, y, minLight, maxSpread) => {
		const o = idx(x, y);
		const r = data[o], g = data[o + 1], b = data[o + 2];
		const spread = Math.max(r, g, b) - Math.min(r, g, b);
		return spread <= maxSpread && Math.min(r, g, b) >= minLight;
	};

	// pass 1: flood from all borders across checker tones
	const bg = new Uint8Array(W * H);
	const stack = [];
	for (let x = 0; x < W; x++) stack.push([x, 0], [x, H - 1]);
	for (let y = 0; y < H; y++) stack.push([0, y], [W - 1, y]);
	while (stack.length) {
		const [x, y] = stack.pop();
		if (x < 0 || y < 0 || x >= W || y >= H || bg[y * W + x]) continue;
		if (!isChecker(x, y, 150, 14)) continue;
		bg[y * W + x] = 1;
		stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}

	// pass 2: peel anti-alias halo — two rings of still-light pixels touching bg
	for (let ring = 0; ring < 2; ring++) {
		const peel = [];
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				if (bg[y * W + x] || !isChecker(x, y, 135, 22)) continue;
				const touching =
					(x > 0 && bg[y * W + x - 1]) || (x < W - 1 && bg[y * W + x + 1]) ||
					(y > 0 && bg[(y - 1) * W + x]) || (y < H - 1 && bg[(y + 1) * W + x]);
				if (touching) peel.push(y * W + x);
			}
		}
		for (const p of peel) bg[p] = 1;
	}

	// pass 3: drop orphan specks — label non-bg components, keep the largest
	// (checker-border noise pixels survive the tone test and would otherwise
	// bloat the crop bounds)
	{
		const label = new Int32Array(W * H).fill(-1);
		const areas = [];
		for (let sy = 0; sy < H; sy++) {
			for (let sx = 0; sx < W; sx++) {
				const sp = sy * W + sx;
				if (bg[sp] || label[sp] !== -1) continue;
				const id = areas.length;
				let area = 0;
				const queue = [sp];
				label[sp] = id;
				while (queue.length) {
					const p = queue.pop();
					area++;
					const x = p % W, y = (p / W) | 0;
					for (const q of [p - 1, p + 1, p - W, p + W]) {
						if (q < 0 || q >= W * H || bg[q] || label[q] !== -1) continue;
						if ((q === p - 1 && x === 0) || (q === p + 1 && x === W - 1)) continue;
						label[q] = id;
						queue.push(q);
					}
				}
				areas.push(area);
			}
		}
		const keep = areas.indexOf(Math.max(...areas));
		for (let p = 0; p < W * H; p++) {
			if (!bg[p] && label[p] !== keep) bg[p] = 1;
		}
	}

	// pass 4: clear enclosed checker holes (e.g. the arm-akimbo triangle) —
	// checker-toned components fully inside the figure. Area threshold keeps
	// small light details (pearls, highlights) intact.
	{
		const seen = new Uint8Array(W * H);
		for (let sy = 0; sy < H; sy++) {
			for (let sx = 0; sx < W; sx++) {
				const sp = sy * W + sx;
				if (bg[sp] || seen[sp] || !isChecker(sx, sy, 150, 14)) continue;
				const component = [];
				const queue = [sp];
				seen[sp] = 1;
				while (queue.length) {
					const p = queue.pop();
					component.push(p);
					const x = p % W;
					for (const q of [p - 1, p + 1, p - W, p + W]) {
						if (q < 0 || q >= W * H || bg[q] || seen[q]) continue;
						if ((q === p - 1 && x === 0) || (q === p + 1 && x === W - 1)) continue;
						if (!isChecker(q % W, (q / W) | 0, 150, 14)) continue;
						seen[q] = 1;
						queue.push(q);
					}
				}
				if (component.length > 150) for (const p of component) bg[p] = 1;
			}
		}
	}

	// apply alpha + one-pixel feather on the remaining boundary
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const p = y * W + x;
			if (bg[p]) { data[idx(x, y) + 3] = 0; continue; }
			const touching =
				(x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) ||
				(y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
			if (touching) data[idx(x, y) + 3] = 140;
		}
	}

	// tight crop to opaque bounds + small pad
	let minX = W, minY = H, maxX = 0, maxY = 0;
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (data[idx(x, y) + 3] > 0) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}
	const PAD = 6;
	minX = Math.max(0, minX - PAD); minY = Math.max(0, minY - PAD);
	maxX = Math.min(W - 1, maxX + PAD); maxY = Math.min(H - 1, maxY + PAD);
	const cw = maxX - minX + 1, ch = maxY - minY + 1;

	// reproportion via bilinear resample: identity above the hip line,
	// stretched below; slimmed horizontally throughout
	const splitPx = Math.round(ch * hipSplit);
	const outW = Math.round(cw * slimX);
	const outH = splitPx + Math.round((ch - splitPx) * legStretch);
	const outPng = new PNG({ width: outW, height: outH });

	const sample = (fx, fy, channel) => {
		const x0 = Math.max(0, Math.min(cw - 1, Math.floor(fx)));
		const y0 = Math.max(0, Math.min(ch - 1, Math.floor(fy)));
		const x1 = Math.min(cw - 1, x0 + 1);
		const y1 = Math.min(ch - 1, y0 + 1);
		const tx = fx - x0, ty = fy - y0;
		const at = (x, y) => data[idx(minX + x, minY + y) + channel];
		return (
			at(x0, y0) * (1 - tx) * (1 - ty) +
			at(x1, y0) * tx * (1 - ty) +
			at(x0, y1) * (1 - tx) * ty +
			at(x1, y1) * tx * ty
		);
	};

	for (let y = 0; y < outH; y++) {
		const srcY = y < splitPx ? y : splitPx + (y - splitPx) / legStretch;
		for (let x = 0; x < outW; x++) {
			const srcX = x / slimX;
			const o = (y * outW + x) * 4;
			for (let c = 0; c < 4; c++) outPng.data[o + c] = Math.round(sample(srcX, srcY, c));
		}
	}

	fs.writeFileSync(path.join(OUT_DIR, out), PNG.sync.write(outPng));
	console.log(`wrote ${out} ${outW}x${outH} (cropped ${cw}x${ch} from ${W}x${H}, legs x${legStretch}, slim x${slimX})`);
};

for (const job of JOBS) processOne(job);
