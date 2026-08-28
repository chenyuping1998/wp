// Preview the win banners exactly as Win.svelte will draw them.
//
// The label and the amount are positioned from numbers measured out of the art
// (WIN_BANNERS in constants.ts). Those numbers are impossible to check by
// reading them, and the game cannot be run without an RGS session, so this
// composes the same layout offline and writes a contact sheet.
//
// It reads the offsets from constants.ts rather than repeating them, so the
// preview cannot drift away from what the game does.
//
// Usage: node design/preview_win_banners.mjs <dir containing node_modules with @resvg/resvg-js and pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node preview_win_banners.mjs <dir with node_modules>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BANNER_DIR = path.join(appRoot, 'static/assets/sprites/marginCallWinBanners');
const FONT_DIR = path.join(appRoot, 'static/fonts');
const OUT = path.join(appRoot, 'design/preview_win_banners.png');

const constants = fs.readFileSync(path.join(appRoot, 'src/game/constants.ts'), 'utf8');
const num = (name) => {
	const m = constants.match(new RegExp(`${name}\\s*=\\s*([0-9.]+)`));
	if (!m) throw new Error(`could not read ${name}`);
	return Number(m[1]);
};
const SYMBOL_SIZE = num('SYMBOL_SIZE');
const WELL_WIDTH_CELLS = num('WIN_BANNER_WELL_WIDTH');

// Tolerant of extra fields between `aspect` and `well`. The strict version of
// this regex required them to be adjacent, so adding `accent` to the specs broke
// the parser silently — the script threw "expected 5 banner specs, read 0" and
// simply stopped being run, which is how the banners went unchecked.
const specs = [...constants.matchAll(
	/(\w+):\s*\{\s*key:\s*'(\w+)',\s*aspect:\s*([0-9.]+),[\s\S]*?well:\s*\{\s*cx:\s*(-?[0-9.]+),\s*cy:\s*(-?[0-9.]+),\s*w:\s*([0-9.]+),\s*h:\s*([0-9.]+)\s*\}/g,
)].map((m) => ({
	alias: m[1],
	aspect: Number(m[3]),
	well: { cx: Number(m[4]), cy: Number(m[5]), w: Number(m[6]), h: Number(m[7]) },
}));
if (specs.length !== 5) throw new Error(`expected 5 banner specs, read ${specs.length}`);

const labels = {};
for (const m of constants.matchAll(/(\w+):\s*'([A-Z ]+WIN)'/g)) labels[m[1]] = m[2];

const TIER_FILE = { big: 'tier1', superwin: 'tier2', mega: 'tier3', epic: 'tier4', max: 'tier5' };
const SAMPLE = { big: '$52.40', superwin: '$180.00', mega: '$640.00', epic: '$2,100.00', max: '$12,000.00' };

const rendered = specs.map((spec) => {
	const wellWidth = SYMBOL_SIZE * WELL_WIDTH_CELLS;
	const width = Math.round(wellWidth / spec.well.w);
	const height = Math.round(width * spec.aspect);
	const wellX = spec.well.cx * width;
	const wellY = spec.well.cy * height;
	const wellH = spec.well.h * height;

	// Same offsets as Win.svelte.
	const labelY = wellY - wellH * 0.26;
	const labelSize = wellH * 0.3;
	const amountY = wellY + wellH * 0.22;
	const amountSize = wellH * 0.42;

	const frame = PNG.sync.read(fs.readFileSync(path.join(BANNER_DIR, `${TIER_FILE[spec.alias]}.png`)));

	// Text layer only; the frame itself is composited underneath as pixels, which
	// avoids depending on resvg resolving external images.
	const text = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${-width / 2} ${-height / 2} ${width} ${height}">
		<text x="${wellX}" y="${labelY}" font-family="Titan One" font-size="${labelSize}"
			text-anchor="middle" dominant-baseline="central" letter-spacing="2"
			fill="#ffe9a8" stroke="#3a2408" stroke-width="${labelSize * 0.12}" paint-order="stroke">${labels[spec.alias]}</text>
		<text x="${wellX}" y="${amountY}" font-family="Titan One" font-size="${amountSize}"
			text-anchor="middle" dominant-baseline="central"
			fill="#fff7d6" stroke="#3a2408" stroke-width="${amountSize * 0.12}" paint-order="stroke">${SAMPLE[spec.alias]}</text>
		<rect x="${wellX - (spec.well.w * width) / 2}" y="${wellY - wellH / 2}"
			width="${spec.well.w * width}" height="${wellH}"
			fill="none" stroke="#00ff88" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.85"/>
	</svg>`;

	const layer = PNG.sync.read(
		new Resvg(text, {
			fitTo: { mode: 'width', value: width },
			font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Titan One' },
		})
			.render()
			.asPng(),
	);

	return { alias: spec.alias, frame, layer, width, height };
});

// Contact sheet: one banner per row, scaled to a common width, on dark grey.
const SHEET_W = Math.max(...rendered.map((r) => r.width)) + 40;
const GAP = 18;
const SHEET_H = rendered.reduce((sum, r) => sum + r.height + GAP, GAP);
const sheet = new PNG({ width: SHEET_W, height: SHEET_H });
for (let i = 0; i < sheet.data.length; i += 4) {
	sheet.data[i] = 18;
	sheet.data[i + 1] = 20;
	sheet.data[i + 2] = 22;
	sheet.data[i + 3] = 255;
}

const blend = (src, dstX, dstY, srcW, srcH, srcData, srcWidth) => {
	for (let y = 0; y < srcH; y++) {
		for (let x = 0; x < srcW; x++) {
			const si = (y * srcWidth + x) * 4;
			const a = srcData[si + 3] / 255;
			if (a === 0) continue;
			const dx = dstX + x;
			const dy = dstY + y;
			if (dx < 0 || dy < 0 || dx >= sheet.width || dy >= sheet.height) continue;
			const di = (dy * sheet.width + dx) * 4;
			for (let c = 0; c < 3; c++) {
				sheet.data[di + c] = Math.round(srcData[si + c] * a + sheet.data[di + c] * (1 - a));
			}
		}
	}
};

let y = GAP;
for (const r of rendered) {
	const x = Math.round((SHEET_W - r.width) / 2);
	// frame art, scaled by nearest neighbour into the drawn size
	for (let ty = 0; ty < r.height; ty++) {
		for (let tx = 0; tx < r.width; tx++) {
			const sx = Math.floor((tx / r.width) * r.frame.width);
			const sy = Math.floor((ty / r.height) * r.frame.height);
			const si = (sy * r.frame.width + sx) * 4;
			const a = r.frame.data[si + 3] / 255;
			if (a === 0) continue;
			const di = ((y + ty) * sheet.width + (x + tx)) * 4;
			for (let c = 0; c < 3; c++) {
				sheet.data[di + c] = Math.round(r.frame.data[si + c] * a + sheet.data[di + c] * (1 - a));
			}
		}
	}
	blend(null, x, y, r.width, r.height, r.layer.data, r.layer.width);
	console.log(`  ${r.alias.padEnd(9)} ${r.width}x${r.height}`);
	y += r.height + GAP;
}

fs.writeFileSync(OUT, PNG.sync.write(sheet));
console.log(`\nwrote ${path.relative(appRoot, OUT)} (${SHEET_W}x${SHEET_H})`);
console.log('dashed green = the measured well; label and amount are placed from it');
