// GoBananas realistic symbol set — replaces the comic art with the AI-painted
// military-jungle-monkey set in static/extracted_symbols plus procedural
// pieces, written to static/assets/sprites/goBananasSymbolsV2 (new folder =
// CDN cache-bust, WildParty HANDOFF §4.27 lesson).
//
//  · w/s/h1-h4: chroma-keyed off their solid dark-green AI background via
//    border region-growing (gradient tolerant), then "keep largest island"
//    which also deletes the stray fragments of neighbouring images baked
//    into h2/h4. Cropped + centered on a 256 canvas.
//  · l1-l5: procedural 3D letters (A/K/Q/J/10), one colour family each.
//  · p: gold coin with banana emboss; x: dark dead tile (procedural).
//  · cudgel: golden banana (the expanding wild twirls this instead of the
//    Chinese-theme cudgel — same spine animation, new prop).
//  · wx: 256x1280 full-reel WILD panel (embedded processed monkey + stacked
//    3D WILD letters on a jungle-gold plate).
//
// Usage: node design/generate_symbols_realistic.mjs <dir with node_modules for @resvg/resvg-js + pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node generate_symbols_realistic.mjs <toolsDir>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(appRoot, 'design/source/realistic_symbols');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV2');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CANVAS = 256;
const PAD = 10;

// ── part A: chroma-key the AI-painted symbols ───────────────────────────────
const chromaKey = (srcName) => {
	const png = PNG.sync.read(fs.readFileSync(path.join(SRC_DIR, `${srcName}.png`)));
	const { width: W, height: H, data } = png;
	const idx = (x, y) => (y * W + x) * 4;

	// background reference: average of the border pixels. A pixel may only be
	// classified bg if it stays CLOSE to this dark-green reference — bright
	// lime greens (e.g. the pineapple grenade body) are green-dominant too,
	// so hue alone is not enough
	let br = 0, bgc = 0, bb = 0, bn = 0;
	for (let x = 0; x < W; x++) {
		for (const y of [0, H - 1]) {
			const o = (y * W + x) * 4;
			br += data[o]; bgc += data[o + 1]; bb += data[o + 2]; bn++;
		}
	}
	for (let y = 0; y < H; y++) {
		for (const x of [0, W - 1]) {
			const o = (y * W + x) * 4;
			br += data[o]; bgc += data[o + 1]; bb += data[o + 2]; bn++;
		}
	}
	br /= bn; bgc /= bn; bb /= bn;
	const bgDist = (o) => {
		const dr = data[o] - br, dg = data[o + 1] - bgc, db = data[o + 2] - bb;
		return Math.sqrt(dr * dr + dg * dg + db * db);
	};
	const isBgColored = (o) => {
		const lum = 0.3 * data[o] + 0.55 * data[o + 1] + 0.15 * data[o + 2];
		return bgDist(o) < 50 && lum < 140;
	};

	// region-grow from every border pixel: neighbour joins on a small colour
	// step (bg gradient) AND while staying near the bg reference colour
	const bg = new Uint8Array(W * H);
	const stack = [];
	for (let x = 0; x < W; x++) stack.push(x, x + (H - 1) * W);
	for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
	for (const p of [...stack]) {
		if (isBgColored(p * 4)) bg[p] = 1;
	}
	const queue = stack.filter((p) => bg[p]);
	while (queue.length) {
		const p = queue.pop();
		const po = p * 4;
		const x = p % W;
		for (const q of [p - 1, p + 1, p - W, p + W]) {
			if (q < 0 || q >= W * H || bg[q]) continue;
			if ((q === p - 1 && x === 0) || (q === p + 1 && x === W - 1)) continue;
			const qo = q * 4;
			const step =
				Math.abs(data[qo] - data[po]) +
				Math.abs(data[qo + 1] - data[po + 1]) +
				Math.abs(data[qo + 2] - data[po + 2]);
			// the bg gradient is buttery smooth (neighbour steps ≤ ~6); object
			// silhouettes always have a bigger step, so a tight step gate keeps
			// the flood from climbing into dark-green object parts (helmet
			// camo, pineapple shading) that merely SHARE the bg colour
			if (step <= 12 && isBgColored(qo)) {
				bg[q] = 1;
				queue.push(q);
			}
		}
	}

	// peel the anti-alias halo the tight step gate leaves behind: a few rings
	// of near-bg pixels touching the cleared area
	for (let ring = 0; ring < 3; ring++) {
		const peel = [];
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				const p = y * W + x;
				if (bg[p]) continue;
				const o = p * 4;
				if (bgDist(o) >= 80) continue;
				const touching =
					(x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) ||
					(y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
				if (touching) peel.push(p);
			}
		}
		for (const p of peel) bg[p] = 1;
	}

	// keep the largest non-bg island (drops fragments of neighbouring images)
	const label = new Int32Array(W * H).fill(-1);
	const areas = [];
	for (let p = 0; p < W * H; p++) {
		if (bg[p] || label[p] !== -1) continue;
		const id = areas.length;
		let area = 0;
		const q2 = [p];
		label[p] = id;
		while (q2.length) {
			const c = q2.pop();
			area++;
			const cx = c % W;
			for (const n of [c - 1, c + 1, c - W, c + W]) {
				if (n < 0 || n >= W * H || bg[n] || label[n] !== -1) continue;
				if ((n === c - 1 && cx === 0) || (n === c + 1 && cx === W - 1)) continue;
				label[n] = id;
				q2.push(n);
			}
		}
		areas.push(area);
	}
	const keep = areas.indexOf(Math.max(...areas));
	for (let p = 0; p < W * H; p++) if (!bg[p] && label[p] !== keep) bg[p] = 1;

	// enclosed bg-coloured holes (e.g. inside the compass ring loop): clear
	// bg-like components that the border flood couldn't reach
	{
		const seen = new Uint8Array(W * H);
		for (let p = 0; p < W * H; p++) {
			if (bg[p] || seen[p] || !isBgColored(p * 4)) continue;
			const component = [];
			const q3 = [p];
			seen[p] = 1;
			while (q3.length) {
				const c = q3.pop();
				component.push(c);
				const cx = c % W;
				for (const n of [c - 1, c + 1, c - W, c + W]) {
					if (n < 0 || n >= W * H || bg[n] || seen[n]) continue;
					if ((n === c - 1 && cx === 0) || (n === c + 1 && cx === W - 1)) continue;
					if (!isBgColored(n * 4)) continue;
					seen[n] = 1;
					q3.push(n);
				}
			}
			if (component.length > 60) for (const c of component) bg[c] = 1;
		}
	}

	// alpha + 1px feather, then crop
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const p = y * W + x;
			if (bg[p]) {
				data[idx(x, y) + 3] = 0;
				continue;
			}
			const touching =
				(x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) ||
				(y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
			if (touching) data[idx(x, y) + 3] = 130;
		}
	}
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
	const cw = maxX - minX + 1, ch = maxY - minY + 1;

	// scale (bilinear) to fit the padded canvas, centered
	const scale = Math.min((CANVAS - PAD * 2) / cw, (CANVAS - PAD * 2) / ch);
	const ow = Math.round(cw * scale), oh = Math.round(ch * scale);
	const out = new PNG({ width: CANVAS, height: CANVAS });
	const ox = Math.round((CANVAS - ow) / 2), oy = Math.round((CANVAS - oh) / 2);
	const sample = (fx, fy, c) => {
		const x0 = Math.max(0, Math.min(cw - 1, Math.floor(fx)));
		const y0 = Math.max(0, Math.min(ch - 1, Math.floor(fy)));
		const x1 = Math.min(cw - 1, x0 + 1), y1 = Math.min(ch - 1, y0 + 1);
		const tx = fx - x0, ty = fy - y0;
		const at = (x, y) => data[idx(minX + x, minY + y) + c];
		return (
			at(x0, y0) * (1 - tx) * (1 - ty) + at(x1, y0) * tx * (1 - ty) +
			at(x0, y1) * (1 - tx) * ty + at(x1, y1) * tx * ty
		);
	};
	for (let y = 0; y < oh; y++) {
		for (let x = 0; x < ow; x++) {
			const o = ((oy + y) * CANVAS + (ox + x)) * 4;
			for (let c = 0; c < 4; c++) out.data[o + c] = Math.round(sample(x / scale, y / scale, c));
		}
	}
	return out;
};

for (const name of ['w', 's', 'h1', 'h2', 'h3', 'h4']) {
	const out = chromaKey(name);
	fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), PNG.sync.write(out));
	console.log(`keyed ${name}.png`);
}

// ── part B: procedural 3D letters ───────────────────────────────────────────
const render = (svg, w) =>
	new Resvg(svg, { fitTo: { mode: 'width', value: w }, font: { loadSystemFonts: true } }).render().asPng();

const letterSvg = (
	text,
	{ faceTop, faceMid, faceLow, sideTop, sideLow, glow, rim },
	fontSize,
	canvas = CANVAS,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">
<defs>
	<linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="${faceTop}"/>
		<stop offset="0.45" stop-color="${faceMid}"/>
		<stop offset="1" stop-color="${faceLow}"/>
	</linearGradient>
	<linearGradient id="side" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="${sideTop}"/>
		<stop offset="1" stop-color="${sideLow}"/>
	</linearGradient>
	<filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<text x="${canvas / 2 + 2}" y="${canvas * 0.74}" font-family="Arial Black, Arial" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="${glow}" opacity="0.5" filter="url(#soft)">${text}</text>
${[10, 9, 8, 7, 6, 5, 4]
	.map(
		(o) =>
			`<text x="${canvas / 2 - 2 + o}" y="${canvas * 0.73 - 2 + o}" font-family="Arial Black, Arial" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="url(#side)">${text}</text>`,
	)
	.join('')}
<text x="${canvas / 2 - 2}" y="${canvas * 0.73 - 2}" font-family="Arial Black, Arial" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="url(#face)" stroke="${sideLow}" stroke-width="3">${text}</text>
<text x="${canvas / 2 - 3}" y="${canvas * 0.73 - 3}" font-family="Arial Black, Arial" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="none" stroke="${rim}" stroke-width="1.6" opacity="0.9">${text}</text>
</svg>`;

const PALETTES = {
	l1: { text: 'A', size: 172, faceTop: '#ffd54a', faceMid: '#ff8f2a', faceLow: '#b32c10', sideTop: '#8a2508', sideLow: '#54120a', glow: '#ff7a1a', rim: '#ffe9a0' },
	l2: { text: 'K', size: 172, faceTop: '#e9fdff', faceMid: '#4fc3e8', faceLow: '#0e6f8f', sideTop: '#0a4358', sideLow: '#08303f', glow: '#35c8ff', rim: '#e0f9ff' },
	l3: { text: 'Q', size: 172, faceTop: '#f8d6ff', faceMid: '#b45de0', faceLow: '#6d1d9c', sideTop: '#471166', sideLow: '#310b48', glow: '#b44dff', rim: '#f3d9ff' },
	l4: { text: 'J', size: 172, faceTop: '#e2ffb0', faceMid: '#6fbf3f', faceLow: '#1e7a1e', sideTop: '#14501a', sideLow: '#0d3512', glow: '#52d94f', rim: '#e8ffc8' },
	l5: { text: '10', size: 138, faceTop: '#e8f4ff', faceMid: '#4f92e0', faceLow: '#1450a8', sideTop: '#0d3268', sideLow: '#0a2448', glow: '#3f8cff', rim: '#dbeeff' },
};
for (const [name, p] of Object.entries(PALETTES)) {
	fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), render(letterSvg(p.text, p, p.size), CANVAS));
	console.log(`lettered ${name}.png`);
}

// ── part C: props — banana cudgel, coin (p), dead tile (x) ──────────────────
const bananaSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs>
	<linearGradient id="peel" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.5" stop-color="#f7c53a"/>
		<stop offset="1" stop-color="#c98a12"/>
	</linearGradient>
</defs>
<!-- crescent banana drawn diagonally (tips lower-left / upper-right) -->
<path d="M 52 214 Q 90 200 140 150 Q 190 100 204 52 Q 224 64 216 96 Q 200 160 150 204 Q 110 236 60 232 Q 44 228 52 214 Z"
	fill="url(#peel)" stroke="#7a5208" stroke-width="6" stroke-linejoin="round"/>
<path d="M 70 210 Q 120 196 160 156 Q 196 118 206 78" fill="none" stroke="#fff3bd" stroke-width="7" opacity="0.65" stroke-linecap="round"/>
<circle cx="54" cy="222" r="9" fill="#6d4a08"/>
<circle cx="208" cy="58" r="8" fill="#6d4a08"/>
</svg>`;
fs.writeFileSync(path.join(OUT_DIR, 'cudgel.png'), render(bananaSvg, 256));
console.log('propped cudgel.png (golden banana)');

const coinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs>
	<radialGradient id="coin" cx="0.38" cy="0.32" r="1">
		<stop offset="0" stop-color="#fff3bd"/>
		<stop offset="0.55" stop-color="#f2b93a"/>
		<stop offset="1" stop-color="#a86c0e"/>
	</radialGradient>
	<radialGradient id="inner" cx="0.42" cy="0.38" r="0.9">
		<stop offset="0" stop-color="#ffdf7e"/>
		<stop offset="1" stop-color="#c88f1c"/>
	</radialGradient>
</defs>
<circle cx="128" cy="130" r="106" fill="url(#coin)" stroke="#6d4a08" stroke-width="8"/>
<circle cx="128" cy="130" r="80" fill="url(#inner)" stroke="#8a5c0c" stroke-width="4"/>
<path d="M 92 158 Q 118 130 158 108 Q 168 116 162 128 Q 140 158 106 168 Q 92 168 92 158 Z" fill="#8a5c0c" opacity="0.85"/>
<path d="M 60 76 Q 84 52 116 44" fill="none" stroke="#fff7d6" stroke-width="9" opacity="0.8" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync(path.join(OUT_DIR, 'p.png'), render(coinSvg, 256));
console.log('minted p.png');

const deadSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs>
	<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#3c4148"/>
		<stop offset="1" stop-color="#23262b"/>
	</linearGradient>
</defs>
<rect x="30" y="30" width="196" height="196" rx="22" fill="url(#plate)" stroke="#15171a" stroke-width="8"/>
<path d="M 66 66 L 190 190 M 190 66 L 66 190" stroke="#565c66" stroke-width="18" stroke-linecap="round"/>
<circle cx="48" cy="48" r="7" fill="#565c66"/><circle cx="208" cy="48" r="7" fill="#565c66"/>
<circle cx="48" cy="208" r="7" fill="#565c66"/><circle cx="208" cy="208" r="7" fill="#565c66"/>
</svg>`;
fs.writeFileSync(path.join(OUT_DIR, 'x.png'), render(deadSvg, 256));
console.log('tiled x.png');

// ── part D: wx — full-reel WILD panel (256x1280) ────────────────────────────
// top half: the w_expand full-scene painting (sergeant monkey devouring a
// banana, jungle sunset) framed like a poster; bottom: stacked WILD letters
const sceneB64 = fs
	.readFileSync(path.join(SRC_DIR, 'w_expand.png'))
	.toString('base64');
const wildLetters = ['W', 'I', 'L', 'D']
	.map((ch, i) => {
		const y = 700 + i * 150;
		return `${[7, 6, 5, 4]
			.map((o) => `<text x="${128 + o}" y="${y + o}" font-family="Arial Black, Arial" font-size="150" font-weight="900" text-anchor="middle" fill="#6d4408">${ch}</text>`)
			.join('')}
		<text x="128" y="${y}" font-family="Arial Black, Arial" font-size="150" font-weight="900" text-anchor="middle" fill="url(#wface)" stroke="#54330a" stroke-width="3">${ch}</text>
		<text x="127" y="${y - 1}" font-family="Arial Black, Arial" font-size="150" font-weight="900" text-anchor="middle" fill="none" stroke="#fff3bd" stroke-width="1.5" opacity="0.9">${ch}</text>`;
	})
	.join('');
const wxSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="1280" viewBox="0 0 256 1280">
<defs>
	<linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#1c4a26"/>
		<stop offset="0.35" stop-color="#0f3318"/>
		<stop offset="1" stop-color="#081f0e"/>
	</linearGradient>
	<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.5" stop-color="#e8a33d"/>
		<stop offset="1" stop-color="#b8791a"/>
	</linearGradient>
	<linearGradient id="wface" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.5" stop-color="#f7b93a"/>
		<stop offset="1" stop-color="#c9821a"/>
	</linearGradient>
	<linearGradient id="sceneFade" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0f3318" stop-opacity="0"/>
		<stop offset="1" stop-color="#0f3318" stop-opacity="1"/>
	</linearGradient>
	<clipPath id="artClip"><rect x="14" y="14" width="228" height="560" rx="20"/></clipPath>
</defs>
<rect x="6" y="6" width="244" height="1268" rx="26" fill="url(#panel)" stroke="#0a1508" stroke-width="6"/>
<image href="data:image/png;base64,${sceneB64}" x="14" y="14" width="228" height="560" preserveAspectRatio="xMidYMid slice" clip-path="url(#artClip)"/>
<rect x="14" y="440" width="228" height="140" fill="url(#sceneFade)"/>
<rect x="14" y="14" width="228" height="1252" rx="20" fill="none" stroke="url(#gold)" stroke-width="8"/>
<rect x="26" y="26" width="204" height="1228" rx="14" fill="none" stroke="#ffdf7e" stroke-width="2" opacity="0.4"/>
${wildLetters}
</svg>`;
fs.writeFileSync(path.join(OUT_DIR, 'wx.png'), render(wxSvg, 256));
console.log('panelled wx.png');

console.log('done →', OUT_DIR);
