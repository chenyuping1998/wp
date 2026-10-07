// Filmstrip of the v2 'freeze' takeover, rendered offline.
//
//   node design/preview_freeze.mjs <dir with node_modules/@resvg/resvg-js>
//
// Writes freeze_strip.png into design/. The reel's symbols are grey stand-ins —
// the point is the frost, not the art — and the geometry is redrawn here in SVG
// from the SAME pure functions ExpandingWilds.svelte draws with, so the shapes
// and the timing are the component's. What it cannot show is anything Pixi does
// that SVG does not: blend modes, the board behind, and the WILD panel coming up
// underneath the ice.
//
// It exists because "make the frost look refined" is a judgement that cannot be
// made from a build log, and this is the only way to make it before upload.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/preview_freeze.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const DESIGN = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(DESIGN, '..');
const M = await import(pathToFileURL(path.join(APP, 'src/game/frostTakeover.ts')).href);
const {
	FROST_TIMING,
	cellFrost,
	crystalGrowth,
	crystalSeed,
	CRYSTALS_PER_CELL,
	rimeAt,
	slabAt,
	clarifyAt,
} = M;

const CELL = 78; // scaled-down SYMBOL_SIZE, so a 5-cell reel fits the strip
const ROWS = 5;
const LANDED = 3; // the Wild lands on row 3, so the frost spreads both ways
const H = CELL * ROWS;
const W = CELL;
const span = Math.max(...[1, 2, 3, 4, 5].map((r) => Math.abs(r - LANDED)), 1);
const rowCenterY = (row) => (row - 0.5) * CELL;

const crystal = (cx, cy, r, rot, growth, width, color, alpha) => {
	if (growth.arm <= 0.01) return '';
	const armLen = r * growth.arm;
	let d = '';
	for (let i = 0; i < 6; i++) {
		const a = rot + (Math.PI / 3) * i;
		const dx = Math.cos(a);
		const dy = Math.sin(a);
		d += `M ${cx} ${cy} L ${(cx + dx * armLen).toFixed(1)} ${(cy + dy * armLen).toFixed(1)} `;
		if (growth.barb <= 0.01) continue;
		for (const [at, len] of [
			[0.5, 0.34],
			[0.78, 0.22],
		]) {
			const bx = cx + dx * armLen * at;
			const by = cy + dy * armLen * at;
			for (const sweep of [-1, 1]) {
				const ba = a + sweep * (Math.PI / 4);
				d += `M ${bx.toFixed(1)} ${by.toFixed(1)} L ${(bx + Math.cos(ba) * armLen * len * growth.barb).toFixed(1)} ${(by + Math.sin(ba) * armLen * len * growth.barb).toFixed(1)} `;
			}
		}
	}
	return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${(alpha * growth.alpha).toFixed(3)}"/>`;
};

const cellFrostSvg = (row, f, fade = 1) => {
	if (f <= 0.005 || fade <= 0.005) return '';
	const cy = rowCenterY(row);
	const top = cy - CELL / 2;
	let out = `<rect x="2" y="${top + 2}" width="${CELL - 4}" height="${CELL - 4}" rx="7" fill="#dff1ff" opacity="${(0.34 * f * fade).toFixed(3)}"/>`;
	const rime = rimeAt(f);
	if (rime.depth > 0.002) {
		const d0 = rime.depth * CELL;
		const N = 22;
		let d = '';
		for (let i = 0; i < N; i++) {
			const j = Math.abs(Math.sin((i * 12.9898 + row * 7.13) * 1.0) * 43758.5453) % 1;
			const j2 = Math.abs(Math.sin((i * 4.53 + row * 19.7) * 1.0) * 24634.6345) % 1;
			if (j2 < 0.34) continue;
			const u = (i + 0.15 + j * 0.7) / N;
			const spike = d0 * (0.25 + 0.75 * j);
			const px = u * CELL;
			const py = top + u * CELL;
			const lean = (j - 0.5) * spike * 0.5;
			d += `M ${px.toFixed(1)} ${top} L ${(px + lean).toFixed(1)} ${(top + spike).toFixed(1)} `;
			d += `M ${px.toFixed(1)} ${top + CELL} L ${(px + lean).toFixed(1)} ${(top + CELL - spike).toFixed(1)} `;
			d += `M 0 ${py.toFixed(1)} L ${spike.toFixed(1)} ${(py + lean).toFixed(1)} `;
			d += `M ${CELL} ${py.toFixed(1)} L ${(CELL - spike).toFixed(1)} ${(py + lean).toFixed(1)} `;
		}
		out += `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="1" opacity="${(rime.alpha * 0.45 * fade).toFixed(3)}"/>`;
	}
	for (let i = 0; i < CRYSTALS_PER_CELL; i++) {
		const seed = crystalSeed(row, i);
		const local = (f - seed.delay) / Math.max(0.05, 1 - seed.delay);
		const g = crystalGrowth(local);
		const cx = CELL / 2 + seed.dx * CELL;
		const ccy = cy + seed.dy * CELL;
		const r = seed.radius * CELL;
		out += crystal(cx, ccy, r, seed.rotation, g, 2.4, '#9fdcff', 0.3 * f * fade);
		out += crystal(cx, ccy, r, seed.rotation, g, 0.8, '#ffffff', 0.85 * f * fade);
	}
	return out;
};

const slabSvg = (mergeU, bannerU) => {
	if (mergeU <= 0 && bannerU <= 0) return '';
	const slab = slabAt(mergeU * FROST_TIMING.freezeMs);
	const clear = bannerU > 0 ? clarifyAt(bannerU * FROST_TIMING.clarifyMs) : 1;
	if (clear <= 0.005) return '';
	let out = `<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#cfe9ff" opacity="${(slab.haze * clear).toFixed(3)}"/>`;
	if (slab.striation > 0.02) {
		let d = '';
		for (let i = 0; i < 7; i++) {
			const u = (i + 0.5) / 7;
			const lx = u * W;
			const bow = Math.sin(i * 2.3) * W * 0.06;
			d += `M ${lx.toFixed(1)} 3 C ${(lx + bow).toFixed(1)} ${(H * 0.33).toFixed(1)}, ${(lx - bow).toFixed(1)} ${(H * 0.66).toFixed(1)}, ${lx.toFixed(1)} ${H - 3} `;
		}
		out += `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="${(0.16 * slab.striation * clear).toFixed(3)}"/>`;
	}
	out += `<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="7" fill="none" stroke="#ffffff" stroke-width="2" opacity="${(0.5 * slab.rim * clear).toFixed(3)}"/>`;
	out += `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="6" fill="none" stroke="#9fdcff" stroke-width="1" opacity="${(0.45 * slab.rim * clear).toFixed(3)}"/>`;
	if (slab.crack > 0.01) {
		let d = '';
		for (const [a, len] of [
			[-0.4, 0.46],
			[2.5, 0.4],
			[1.2, 0.3],
		]) {
			let px = W / 2;
			let py = H / 2;
			d += `M ${px} ${py} `;
			for (let seg = 1; seg <= 4; seg++) {
				const jitter = Math.sin(seg * 7.7 + a * 3) * 0.22;
				const step = (len * H) / 4;
				px += Math.cos(a + jitter) * step * 0.4;
				py += Math.sin(a + jitter) * step;
				d += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
			}
		}
		out += `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="${(0.9 * slab.crack * clear).toFixed(3)}"/>`;
		out += `<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff" opacity="${(0.5 * slab.crack * clear).toFixed(3)}"/>`;
	}
	return out;
};

// ── the strip ───────────────────────────────────────────────────────────────
const TOTAL = FROST_TIMING.frostMs + FROST_TIMING.freezeMs + FROST_TIMING.clarifyMs;
const FRAMES = 10;
const PAD = 14;
const SW = FRAMES * (W + PAD) + PAD;
const SH = H + PAD * 2 + 22;

let frames = '';
for (let i = 0; i < FRAMES; i++) {
	const t = (i / (FRAMES - 1)) * TOTAL;
	const frostT = Math.min(t, FROST_TIMING.frostMs);
	const mergeU =
		t <= FROST_TIMING.frostMs
			? 0
			: Math.min(1, (t - FROST_TIMING.frostMs) / FROST_TIMING.freezeMs);
	const bannerU =
		t <= FROST_TIMING.frostMs + FROST_TIMING.freezeMs
			? 0
			: Math.min(1, (t - FROST_TIMING.frostMs - FROST_TIMING.freezeMs) / FROST_TIMING.clarifyMs);

	let cells = '';
	for (let row = 1; row <= ROWS; row++) {
		const cy = rowCenterY(row);
		// stand-in symbol
		cells += `<rect x="5" y="${cy - CELL / 2 + 5}" width="${CELL - 10}" height="${CELL - 10}" rx="6" fill="#2a3646"/>`;
		cells += `<circle cx="${W / 2}" cy="${cy}" r="${CELL * 0.2}" fill="#47586b"/>`;
	}
	const clear = bannerU > 0 ? clarifyAt(bannerU * FROST_TIMING.clarifyMs) : 1;
	let frost = '';
	for (let row = 1; row <= ROWS; row++) {
		frost += cellFrostSvg(row, cellFrost(frostT, Math.abs(row - LANDED), span), clear);
	}
	frames += `<g transform="translate(${PAD + i * (W + PAD)} ${PAD})">
		${cells}${frost}${slabSvg(mergeU, bannerU)}
		<text x="${W / 2}" y="${H + 16}" text-anchor="middle" font-family="monospace" font-size="11" fill="#8899aa">${Math.round(t)}ms</text>
	</g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}">
<rect width="${SW}" height="${SH}" fill="#11161d"/>
${frames}
</svg>`;

const png = new Resvg(svg, {
	fitTo: { mode: 'width', value: SW * 1.5 },
	font: { loadSystemFonts: true },
})
	.render()
	.asPng();
fs.writeFileSync(path.join(DESIGN, 'freeze_strip.png'), png);
console.log(`rendered freeze_strip.png — ${FRAMES} frames across ${TOTAL}ms`);
