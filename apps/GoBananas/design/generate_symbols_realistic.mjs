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
// lightBg: key off a pale border (the painted royals sit on cream, not dark
// green); sharpen: unsharp-mask amount applied after scaling — the royals are
// ~110px sources so the 2.3x upscale needs a crispness pass to sit next to
// the large keyed paintings.
// stepGate: max neighbour colour step the border flood may cross (raise it for
// checkerboard grounds whose cell boundaries are hard edges); clearEnclosed:
// also blank enclosed bg-coloured pockets (disable when the art itself has
// bright near-bg highlights, e.g. the h4 compass glints); srcDir: read the
// source png from another folder (curated_symbols).
const chromaKey = (
	srcName,
	{
		lightBg = false,
		sharpen = 0,
		stepGate = 12,
		clearEnclosed = true,
		srcDir = SRC_DIR,
		// checkerboard grounds mix white + light-grey cells: classify bg by
		// "bright and unsaturated" instead of distance to the border average
		checkerBg = false,
	} = {},
) => {
	const png = PNG.sync.read(fs.readFileSync(path.join(srcDir, `${srcName}.png`)));
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
		if (checkerBg) {
			const sat = Math.max(data[o], data[o + 1], data[o + 2]) - Math.min(data[o], data[o + 1], data[o + 2]);
			return sat < 24 && lum > 150;
		}
		return bgDist(o) < 50 && (lightBg ? lum > 150 : lum < 140);
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
			if (step <= stepGate && isBgColored(qo)) {
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
	if (clearEnclosed) {
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

	// unsharp mask (RGB only, opaque-ish pixels only so edges don't halo)
	if (sharpen > 0) {
		const src = Buffer.from(out.data);
		const at = (x, y, c) => src[(y * CANVAS + x) * 4 + c];
		for (let y = 1; y < CANVAS - 1; y++) {
			for (let x = 1; x < CANVAS - 1; x++) {
				const o = (y * CANVAS + x) * 4;
				if (src[o + 3] < 60) continue;
				for (let c = 0; c < 3; c++) {
					const blur =
						(at(x - 1, y, c) + at(x + 1, y, c) + at(x, y - 1, c) + at(x, y + 1, c) + at(x, y, c) * 4) / 8;
					const v = at(x, y, c) + sharpen * (at(x, y, c) - blur);
					out.data[o + c] = Math.max(0, Math.min(255, Math.round(v)));
				}
			}
		}
	}
	return out;
};

for (const name of ['w', 'h3']) {
	const out = chromaKey(name);
	fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), PNG.sync.write(out));
	console.log(`keyed ${name}.png`);
}

// h4's AI source has a BAKED checkerboard ground (fake transparency): the
// border flood must hop the hard checker-cell edges (big step gate), and the
// enclosed-pocket pass must stay off so the compass's white glints survive
{
	// white↔#ccc checker cell edges step by |Δ|≈153 summed — the gate must clear it
	const out = chromaKey('h4', { checkerBg: true, stepGate: 220, clearEnclosed: false });
	fs.writeFileSync(path.join(OUT_DIR, 'h4.png'), PNG.sync.write(out));
	console.log('keyed h4.png (checkerboard ground)');
}

// h1/h2/s: hand-curated art in design/source/curated_symbols. The paintings
// themselves are untouched, but their files carry a flat opaque WHITE ground
// (alpha 255 everywhere) — key ONLY that uniform white off the borders, then
// alpha-bbox crop + bilinear scale onto the 256 canvas.
const BACKUP_DIR = path.join(appRoot, 'design/source/curated_symbols');
for (const name of ['h1', 'h2', 's']) {
	const out = chromaKey(name, { lightBg: true, srcDir: BACKUP_DIR });
	fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), PNG.sync.write(out));
	console.log(`keyed ${name}.png (curated art, white ground removed)`);
}

// ── part B: royals — painted sources for l1-l4, matching painted-look 10 ────
const render = (svg, w) =>
	new Resvg(svg, { fitTo: { mode: 'width', value: w }, font: { loadSystemFonts: true } }).render().asPng();

// l1-l4 (A 岩漿 / K 冰晶 / Q 紫晶 / J 翠玉) are AI-painted at ~110px on a pale
// ground — key them like the big paintings and let the sharpen pass recover
// the upscale
for (const name of ['l1', 'l2', 'l3', 'l4']) {
	const out = chromaKey(name, { lightBg: true, sharpen: 0.75 });
	fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), PNG.sync.write(out));
	console.log(`keyed ${name}.png (painted royal)`);
}

// ── royals post-pass: distinct colours + a painted-style "10" ───────────────
// palette after this pass: A molten red-orange / K ICE BLUE / Q amethyst /
// J jade green / 10 diamond silver — five clearly distinct hues.

const readOut = (name) => PNG.sync.read(fs.readFileSync(path.join(OUT_DIR, `${name}.png`)));
const writeOut = (name, png) => fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), PNG.sync.write(png));

// standard hue-rotation matrix (alpha untouched)
const hueRotate = (png, deg) => {
	const rad = (deg * Math.PI) / 180;
	const c = Math.cos(rad), s = Math.sin(rad);
	const m = [
		0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
		0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
		0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
	];
	const d = png.data;
	for (let i = 0; i < d.length; i += 4) {
		if (d[i + 3] === 0) continue;
		const r = d[i], g = d[i + 1], b = d[i + 2];
		d[i] = Math.max(0, Math.min(255, Math.round(m[0] * r + m[1] * g + m[2] * b)));
		d[i + 1] = Math.max(0, Math.min(255, Math.round(m[3] * r + m[4] * g + m[5] * b)));
		d[i + 2] = Math.max(0, Math.min(255, Math.round(m[6] * r + m[7] * g + m[8] * b)));
	}
	return png;
};

const alphaBbox = (png) => {
	const { width: W, height: H, data } = png;
	let minX = W, minY = H, maxX = -1, maxY = -1;
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (data[(y * W + x) * 4 + 3] > 10) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}
	return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
};

// keep only a rectangular window of the glyph (in bbox-relative fractions)
const keepWindow = (png, fx0, fx1, fy0, fy1) => {
	const { width: W, height: H, data } = png;
	const b = alphaBbox(png);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const rx = (x - b.minX) / b.w, ry = (y - b.minY) / b.h;
			if (rx < fx0 || rx > fx1 || ry < fy0 || ry > fy1) data[(y * W + x) * 4 + 3] = 0;
		}
	}
	return png;
};

// keep only an elliptical window of the glyph — cuts the Q tail off while
// preserving the painted bowl ("0")
const keepEllipse = (png, cx, cy, rx, ry) => {
	const { width: W, height: H, data } = png;
	const b = alphaBbox(png);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const nx = ((x - b.minX) / b.w - cx) / rx;
			const ny = ((y - b.minY) / b.h - cy) / ry;
			if (nx * nx + ny * ny > 1) data[(y * W + x) * 4 + 3] = 0;
		}
	}
	return png;
};

// clear an inner elliptical region (the Q tail slashes INTO the bowl hole —
// wipe the hole so the "0" counter reads clean)
const eraseEllipse = (png, cx, cy, rx, ry) => {
	const { width: W, height: H, data } = png;
	const b = alphaBbox(png);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const nx = ((x - b.minX) / b.w - cx) / rx;
			const ny = ((y - b.minY) / b.h - cy) / ry;
			if (nx * nx + ny * ny <= 1) data[(y * W + x) * 4 + 3] = 0;
		}
	}
	return png;
};

// silver-diamond conversion: desaturate, cool tint, extra contrast
const silverize = (png) => {
	const d = png.data;
	for (let i = 0; i < d.length; i += 4) {
		if (d[i + 3] === 0) continue;
		let lum = 0.3 * d[i] + 0.55 * d[i + 1] + 0.15 * d[i + 2];
		lum = 150 + (lum - 105) * 1.3;
		d[i] = Math.max(0, Math.min(255, Math.round(lum * 0.97)));
		d[i + 1] = Math.max(0, Math.min(255, Math.round(lum * 1.0)));
		d[i + 2] = Math.max(0, Math.min(255, Math.round(lum * 1.09)));
	}
	return png;
};

// bilinear-draw png's glyph (alpha bbox) into dst at a target box
const drawGlyphInto = (dst, srcPng, cx, targetH, canvasH = CANVAS) => {
	const b = alphaBbox(srcPng);
	const scale = targetH / b.h;
	const ow = Math.round(b.w * scale), oh = Math.round(b.h * scale);
	const ox = Math.round(cx - ow / 2), oy = Math.round((canvasH - oh) / 2);
	const sidx = (x, y) => ((y + b.minY) * srcPng.width + (x + b.minX)) * 4;
	for (let y = 0; y < oh; y++) {
		for (let x = 0; x < ow; x++) {
			const fx = x / scale, fy = y / scale;
			const x0 = Math.max(0, Math.min(b.w - 1, Math.floor(fx)));
			const y0 = Math.max(0, Math.min(b.h - 1, Math.floor(fy)));
			const x1 = Math.min(b.w - 1, x0 + 1), y1 = Math.min(b.h - 1, y0 + 1);
			const tx = fx - x0, ty = fy - y0;
			const o = ((oy + y) * dst.width + (ox + x)) * 4;
			for (let c = 0; c < 4; c++) {
				const v =
					srcPng.data[sidx(x0, y0) + c] * (1 - tx) * (1 - ty) +
					srcPng.data[sidx(x1, y0) + c] * tx * (1 - ty) +
					srcPng.data[sidx(x0, y1) + c] * (1 - tx) * ty +
					srcPng.data[sidx(x1, y1) + c] * tx * ty;
				// src-over composite so the two digits can slightly overlap
				if (c === 3) {
					dst.data[o + 3] = Math.max(dst.data[o + 3], Math.round(v));
				} else if (srcPng.data[sidx(x0, y0) + 3] > 10 || srcPng.data[sidx(x1, y1) + 3] > 10) {
					dst.data[o + c] = Math.round(v);
				}
			}
		}
	}
};

// K piece is taken BEFORE the hue shift; both pieces end up silver anyway
const kForPieces = readOut('l2');
const qForPieces = readOut('l3');

// K: icy cyan-green reads too close to the jade J — rotate to clear ice blue
writeOut('l2', hueRotate(readOut('l2'), 42));
console.log('recoloured l2.png (K → ice blue)');

// "1": the K stem (left third of the glyph); "0": the Q bowl minus its tail
const one = keepWindow(kForPieces, 0.02, 0.27, 0, 1);
const zero = keepEllipse(qForPieces, 0.42, 0.43, 0.46, 0.5);
eraseEllipse(zero, 0.42, 0.43, 0.15, 0.16);
silverize(one);
silverize(zero);
const l5png = new PNG({ width: CANVAS, height: CANVAS });
drawGlyphInto(l5png, one, 56, 182);
drawGlyphInto(l5png, zero, 168, 190);
writeOut('l5', l5png);
console.log('composed l5.png (silver 10 from painted parts)');

// ── part C: props — banana cudgel, coin (p), dead crate (x), eat card ───────
// golden banana the monkey pulls to his mouth — painterly: ridge planes,
// speckle, warm core glow, browned tips (silhouette kept diagonal so the
// spine attachment rotation still reads)
const bananaSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs>
	<linearGradient id="peel" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#fff7c4"/>
		<stop offset="0.35" stop-color="#ffdf6e"/>
		<stop offset="0.7" stop-color="#f2b32e"/>
		<stop offset="1" stop-color="#c1841a"/>
	</linearGradient>
	<linearGradient id="peelShade" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#c98a12" stop-opacity="0"/>
		<stop offset="0.72" stop-color="#a86c0e" stop-opacity="0.2"/>
		<stop offset="1" stop-color="#7a5208" stop-opacity="0.55"/>
	</linearGradient>
	<filter id="soft"><feGaussianBlur stdDeviation="5"/></filter>
	<filter id="speck" x="-10%" y="-10%" width="120%" height="120%">
		<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="5" result="t"/>
		<feColorMatrix in="t" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.22  0 0 0 0 0.02  0.5 0.5 0.5 0 -0.42" result="sp"/>
		<feComposite in="sp" in2="SourceAlpha" operator="in"/>
	</filter>
</defs>
<ellipse cx="130" cy="140" rx="98" ry="88" fill="#f7b93a" opacity="0.3" filter="url(#soft)"/>
<path d="M 52 214 Q 90 200 140 150 Q 190 100 204 52 Q 224 64 216 96 Q 200 160 150 204 Q 110 236 60 232 Q 44 228 52 214 Z"
	fill="url(#peel)" stroke="#6d4408" stroke-width="5" stroke-linejoin="round"/>
<path d="M 52 214 Q 90 200 140 150 Q 190 100 204 52 Q 224 64 216 96 Q 200 160 150 204 Q 110 236 60 232 Q 44 228 52 214 Z"
	fill="url(#peelShade)"/>
<path d="M 62 218 Q 104 206 148 164 Q 190 124 203 72" fill="none" stroke="#8a5c0c" stroke-width="3" opacity="0.6"/>
<path d="M 70 210 Q 120 196 160 156 Q 196 118 206 78" fill="none" stroke="#fff7d6" stroke-width="8" opacity="0.75" stroke-linecap="round"/>
<path d="M 82 222 Q 126 210 164 174" fill="none" stroke="#ffe98a" stroke-width="4" opacity="0.5" stroke-linecap="round"/>
<path d="M 52 214 Q 90 200 140 150 Q 190 100 204 52 Q 224 64 216 96 Q 200 160 150 204 Q 110 236 60 232 Q 44 228 52 214 Z" filter="url(#speck)" opacity="0.22"/>
<path d="M 48 210 Q 44 222 54 228 Q 64 232 66 224 Q 60 214 48 210 Z" fill="#6d4a08"/>
<path d="M 200 48 Q 212 46 216 58 Q 216 68 206 66 Q 200 58 200 48 Z" fill="#5c3d06"/>
</svg>`;
fs.writeFileSync(path.join(OUT_DIR, 'cudgel.png'), render(bananaSvg, 256));
console.log('propped cudgel.png (golden banana)');

// superspin prize coin — heavy gold, reeded edge, embossed banana, patina
const coinTicks = Array.from({ length: 40 }, (_, i) => {
	const a = (i * 9 * Math.PI) / 180;
	const x1 = 128 + Math.cos(a) * 99, y1 = 130 + Math.sin(a) * 99;
	const x2 = 128 + Math.cos(a) * 108, y2 = 130 + Math.sin(a) * 108;
	return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#7a5208" stroke-width="4" opacity="0.55"/>`;
}).join('');
const coinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs>
	<radialGradient id="coin" cx="0.36" cy="0.3" r="1.05">
		<stop offset="0" stop-color="#fff7d6"/>
		<stop offset="0.35" stop-color="#ffd75e"/>
		<stop offset="0.68" stop-color="#e0a028"/>
		<stop offset="1" stop-color="#8a5c0c"/>
	</radialGradient>
	<radialGradient id="inner" cx="0.4" cy="0.34" r="0.95">
		<stop offset="0" stop-color="#fff0a4"/>
		<stop offset="0.55" stop-color="#f7c33f"/>
		<stop offset="1" stop-color="#c1841a"/>
	</radialGradient>
	<linearGradient id="embossHi" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#fff3bd"/>
		<stop offset="1" stop-color="#ffd75e"/>
	</linearGradient>
	<filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
	<filter id="patina" x="-10%" y="-10%" width="120%" height="120%">
		<feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" seed="9" result="t"/>
		<feColorMatrix in="t" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.28  0 0 0 0 0.04  0.4 0.4 0.4 0 -0.32" result="pa"/>
		<feComposite in="pa" in2="SourceAlpha" operator="in"/>
	</filter>
</defs>
<circle cx="128" cy="130" r="110" fill="url(#coin)" stroke="#5c3d06" stroke-width="6"/>
${coinTicks}
<circle cx="128" cy="130" r="92" fill="none" stroke="#7a5208" stroke-width="3" opacity="0.7"/>
<circle cx="128" cy="130" r="82" fill="url(#inner)" stroke="#8a5c0c" stroke-width="3"/>
<!-- embossed banana: dark recess + lit crest -->
<path d="M 86 162 Q 116 132 160 110 Q 172 118 166 132 Q 142 164 102 174 Q 86 174 86 162 Z" fill="#7a5208" opacity="0.9"/>
<path d="M 90 158 Q 118 130 158 112 Q 168 118 163 129 Q 140 158 104 168 Q 91 168 90 158 Z" fill="url(#embossHi)"/>
<path d="M 96 158 Q 122 136 154 120" fill="none" stroke="#8a5c0c" stroke-width="3" opacity="0.6"/>
<circle cx="128" cy="130" r="82" filter="url(#patina)" opacity="0.22"/>
<ellipse cx="86" cy="72" rx="46" ry="24" fill="#fff7d6" opacity="0.75" filter="url(#soft)" transform="rotate(-32 86 72)"/>
<path d="M 196 96 l 5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5 Z" fill="#fffbe8" opacity="0.9"/>
<path d="M 178 178 A 82 82 0 0 1 128 212" fill="none" stroke="#6d4a08" stroke-width="7" opacity="0.45" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync(path.join(OUT_DIR, 'p.png'), render(coinSvg, 256));
console.log('minted p.png');

// superspin dead tile — mudded jungle supply crate, kept dark so prizes pop
const deadSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs>
	<linearGradient id="plankA" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#3f3118"/>
		<stop offset="1" stop-color="#281f0e"/>
	</linearGradient>
	<linearGradient id="plankB" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#362913"/>
		<stop offset="1" stop-color="#211a0b"/>
	</linearGradient>
	<filter id="grain" x="-10%" y="-10%" width="120%" height="120%">
		<feTurbulence type="fractalNoise" baseFrequency="0.012 0.14" numOctaves="3" seed="21" result="t"/>
		<feColorMatrix in="t" type="matrix" values="0 0 0 0 0.06  0 0 0 0 0.045  0 0 0 0 0.02  0.55 0.55 0.55 0 -0.18" result="g"/>
		<feComposite in="g" in2="SourceAlpha" operator="in"/>
	</filter>
	<filter id="stencil" x="-10%" y="-10%" width="120%" height="120%">
		<feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="4"/>
		<feDisplacementMap in="SourceGraphic" scale="5"/>
	</filter>
</defs>
<rect x="28" y="28" width="200" height="200" rx="16" fill="url(#plankA)" stroke="#17120a" stroke-width="7"/>
<rect x="34" y="92" width="188" height="62" fill="url(#plankB)"/>
<line x1="34" y1="92" x2="222" y2="92" stroke="#17120a" stroke-width="3" opacity="0.8"/>
<line x1="34" y1="154" x2="222" y2="154" stroke="#17120a" stroke-width="3" opacity="0.8"/>
<rect x="28" y="28" width="200" height="200" rx="16" filter="url(#grain)" opacity="0.45"/>
<text x="128" y="158" font-family="Arial Black, Arial" font-size="104" font-weight="900" text-anchor="middle" fill="#cfc7a4" opacity="0.42" filter="url(#stencil)">✕</text>
<path d="M 28 60 L 60 28 M 28 44 L 44 28" stroke="#5c5138" stroke-width="5" opacity="0.35"/>
<g fill="#1c1710" stroke="#5c5138" stroke-width="2">
	<path d="M 28 28 h 34 v 12 h -22 v 22 h -12 Z"/><path d="M 228 28 h -34 v 12 h 22 v 22 h 12 Z"/>
	<path d="M 28 228 h 34 v -12 h -22 v -22 h -12 Z"/><path d="M 228 228 h -34 v -12 h 22 v -22 h 12 Z"/>
</g>
<g fill="#6b5f42">
	<circle cx="44" cy="44" r="4"/><circle cx="212" cy="44" r="4"/>
	<circle cx="44" cy="212" r="4"/><circle cx="212" cy="212" r="4"/>
</g>
<rect x="31" y="31" width="194" height="194" rx="13" fill="none" stroke="#000000" stroke-width="8" opacity="0.25"/>
</svg>`;
fs.writeFileSync(path.join(OUT_DIR, 'x.png'), render(deadSvg, 256));
console.log('crated x.png');

// ── part C2: w_fg eat-closeup card (expanding-wild bite keyframe) ────────────
// w_fg.png is the painted close-up of the sergeant mid-bite (607×575, painted
// bg). Keying the sunburst bg is hopeless — instead frame it as a rounded
// panel like wx.png so the chomp phase reads as a deliberate zoom-in card.
{
	const fg = PNG.sync.read(fs.readFileSync(path.join(SRC_DIR, 'w_fg.png')));
	const side = Math.min(fg.width, fg.height);
	const sx = Math.floor((fg.width - side) / 2), sy = 0;
	const crop = new PNG({ width: side, height: side });
	for (let y = 0; y < side; y++) {
		fg.data.copy(crop.data, y * side * 4, ((sy + y) * fg.width + sx) * 4, ((sy + y) * fg.width + sx + side) * 4);
	}
	const cropB64 = PNG.sync.write(crop).toString('base64');
	const cardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs>
	<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.5" stop-color="#e8a33d"/>
		<stop offset="1" stop-color="#b8791a"/>
	</linearGradient>
	<clipPath id="clip"><rect x="8" y="8" width="240" height="240" rx="24"/></clipPath>
</defs>
<rect x="4" y="4" width="248" height="248" rx="27" fill="#0a1508"/>
<image href="data:image/png;base64,${cropB64}" x="8" y="8" width="240" height="240" clip-path="url(#clip)"/>
<rect x="8" y="8" width="240" height="240" rx="24" fill="none" stroke="url(#gold)" stroke-width="7"/>
<rect x="16" y="16" width="224" height="224" rx="18" fill="none" stroke="#ffdf7e" stroke-width="2" opacity="0.4"/>
</svg>`;
	fs.writeFileSync(path.join(OUT_DIR, 'w_fg.png'), render(cardSvg, 256));
	console.log('carded w_fg.png (bite close-up)');
}

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
