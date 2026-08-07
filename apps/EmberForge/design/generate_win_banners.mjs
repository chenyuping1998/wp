// Win-tier plaques: the supplied frame art with the tier name set into its well.
//
// These used to be drawn from scratch — a brass-framed iron plate with flames
// generated around it. That is all gone; design/source/winBanners/*.png are the
// plaques now, and this script's only job is to letter them.
//
// ── why the layout changed with the art ──
// The generated plate was 1000x560 and carried BOTH the tier name and, below it,
// a sunken well for the amount. The supplied frames are title bars: roughly 680
// wide by 100-160 tall, with one well and no room for a second line. So the well
// takes the tier name — that is what a nameplate is for — and the amount moved
// out from under it to sit below the plaque, where it also gets to be much
// larger than it was when it had to fit inside. See Win.svelte.
//
// Sources are never modified. Each is read, measured, and composited onto a new
// canvas; the originals stay exactly as delivered.
//
// Usage: node design/generate_win_banners.mjs <dir with node_modules>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { keyBlackBackground } from './keyBackground.mjs';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_win_banners.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/winBanners');
const OUT = path.join(appRoot, 'static/assets/sprites/emberForgeWinBanners');
const FONT_DIR = path.join(appRoot, 'static/fonts');
fs.mkdirSync(OUT, { recursive: true });

// The carved face, same as the loading title and the free-game totals.
const BANNER_FONT = 'Ember Inscribed';
// Ember Inscribed advances: every glyph 680/1000em, the word space 360/1000em.
// Knowing this means the type size can be SOLVED for the well rather than picked
// and checked — five frames of different widths all end up optically consistent.
const GLYPH_EM = 0.68;
const SPACE_EM = 0.36;
const textEm = (s) => [...s].reduce((sum, c) => sum + (c === ' ' ? SPACE_EM : GLYPH_EM), 0);

// 2x the source so the plaque stays crisp when the board is scaled up on a large
// display; the art is only ~680px wide natively.
const SCALE = 2;

const TIERS = {
	big: { file: 'BigWin.png', text: 'BIG WIN' },
	superwin: { file: 'SuperWin.png', text: 'SUPER WIN' },
	mega: { file: 'MegaWin.png', text: 'MEGA WIN' },
	epic: { file: 'EpicWin.png', text: 'EPIC WIN' },
	max: { file: 'MaxWin.png', text: 'MAX WIN' },
};

/**
 * The dark span ENCLOSED BY the frame's own metal, per row.
 *
 * Colour alone cannot find the well: it and the background outside the frame are
 * both near-black, and these files have opaque black margins rather than
 * transparency. What separates them is that the well lies BETWEEN the bright
 * metal on its row, so that is what gets measured.
 */
const measureWell = (file) => {
	const png = PNG.sync.read(fs.readFileSync(file));
	const { width: W, height: H, data } = png;
	const lum = new Float32Array(W * H);
	for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
		const a = data[i + 3] / 255;
		lum[p] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) * a;
	}
	const BRIGHT = 90;
	const DARK = 55;
	const lefts = [];
	const rights = [];
	const rows = [];
	for (let y = 0; y < H; y++) {
		let first = -1;
		let last = -1;
		for (let x = 0; x < W; x++) {
			if (lum[y * W + x] > BRIGHT) {
				if (first < 0) first = x;
				last = x;
			}
		}
		if (first < 0 || last - first < W * 0.35) continue;
		let l = first;
		while (l < last && lum[y * W + l] > DARK) l += 1;
		let r = last;
		while (r > l && lum[y * W + r] > DARK) r -= 1;
		if (r - l < W * 0.3) continue;
		rows.push(y);
		lefts.push(l);
		rights.push(r);
	}
	// The qualifying rows are NOT simply rows[0]..rows[last]. On the ornate tiers
	// the black canvas above and below the frame also sits between bright pixels —
	// the outermost flames reach the full width up there — so those rows qualify
	// too and stretch the measured bar from edge to edge. MAX came out with its
	// lettering over the top rail because of it.
	//
	// The bar is the longest CONTIGUOUS run of qualifying rows that contains the
	// middle of the canvas. Stray rows out at the edges are not contiguous with it.
	const median = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
	const mid = H >> 1;
	const runs = [];
	let runStart = rows[0];
	for (let i = 1; i <= rows.length; i += 1) {
		if (i < rows.length && rows[i] === rows[i - 1] + 1) continue;
		runs.push({ top: runStart, bottom: rows[i - 1] });
		if (i < rows.length) runStart = rows[i];
	}
	const best =
		runs.find((run) => run.top <= mid && mid <= run.bottom) ??
		runs.reduce((a, b) => (b.bottom - b.top > a.bottom - a.top ? b : a));

	// horizontal extent measured only over the bar's own rows
	const inBar = [];
	rows.forEach((y, i) => {
		if (y >= best.top && y <= best.bottom) inBar.push(i);
	});
	return {
		width: W,
		height: H,
		left: median(inBar.map((i) => lefts[i])),
		right: median(inBar.map((i) => rights[i])),
		top: best.top,
		bottom: best.bottom,
	};
};

for (const [alias, tier] of Object.entries(TIERS)) {
	const file = path.join(SRC, tier.file);
	const well = measureWell(file);
	const W = well.width;
	const H = well.height;

	// Centre of the well horizontally; vertically the bar's own middle rather than
	// the canvas middle, because the flames bleed unevenly above and below.
	const cx = (well.left + well.right) / 2;
	const cy = (well.top + well.bottom) / 2;
	const wellW = well.right - well.left;
	const wellH = well.bottom - well.top;

	// Tracking, in em. The face's own word space is 360 against a 680 glyph
	// advance — normal for a display face, but with letters this wide and no
	// tracking "BIG WIN" closed up into one word. Opening the whole line is the
	// fix; widening only the space would leave the letters crowded.
	const TRACK = 0.09;
	const glyphs = [...tier.text].length;
	const lineEm = textEm(tier.text) + TRACK * (glyphs - 1);

	// Three limits, smallest wins.
	//
	// The middle one is what makes the set coherent. Sizing to the bar alone gave
	// MAX WIN caps two and a half times the height of BIG WIN's, because the bars
	// grow with the ornament — the tiers stopped looking like one family. Tying
	// caps to a fixed share of the CANVAS instead lets the type grow with the
	// plaque without running away from it.
	const CAP_EM = 0.72; // this face's cap height
	const byWidth = (wellW * 0.76) / lineEm; // clear of the end ornaments
	const byCanvas = (H * 0.28) / CAP_EM; // caps at 28% of the plaque's height
	const byBar = wellH * 0.62; // never crowd the rails
	const size = Math.min(byWidth, byCanvas, byBar);

	const dataUri = `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
	<linearGradient id="tierFace" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#fffbe8"/>
		<stop offset="0.45" stop-color="#ffd75e"/>
		<stop offset="1" stop-color="#c9821a"/>
	</linearGradient>
</defs>
<image x="0" y="0" width="${W}" height="${H}" xlink:href="${dataUri}"/>
<!-- Cast shadow first, then the face. The well is almost black, so without the
     shadow the gold sits on it with no separation and reads as pasted on. -->
<text x="${cx}" y="${cy + size * 0.36 + size * 0.06}" font-family="${BANNER_FONT}" font-size="${size}" letter-spacing="${(TRACK * size).toFixed(2)}" text-anchor="middle" fill="#180a02" opacity="0.7">${tier.text}</text>
<text x="${cx}" y="${cy + size * 0.36}" font-family="${BANNER_FONT}" font-size="${size}" letter-spacing="${(TRACK * size).toFixed(2)}" text-anchor="middle" fill="url(#tierFace)" stroke="#54330a" stroke-width="${Math.max(2, size * 0.055)}" paint-order="stroke">${tier.text}</text>
</svg>`;

	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: W * SCALE },
		// defaultFontFamily matches the requested face: falling back to a DIFFERENT
		// font would silently ship the wrong art.
		font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: BANNER_FONT },
	});
	// The source art is flattened onto black, so the rendered plaque arrives inside
	// a black rectangle. Key it out AFTER lettering — the type is bright and
	// survives the luminance ramp, and it sits on the well, which is protected.
	//
	// The well is inset from the measured bar: that measurement is the median dark
	// span, so it runs a little wide of the true interior, and an oversized opaque
	// shape would square off the frame's rounded ends.
	const INSET = 0.06;
	const { buffer, stats } = keyBlackBackground(resvg.render().asPng(), {
		well: {
			left: Math.round((well.left + wellW * INSET) * SCALE),
			right: Math.round((well.right - wellW * INSET) * SCALE),
			top: Math.round((well.top + wellH * INSET) * SCALE),
			bottom: Math.round((well.bottom - wellH * INSET) * SCALE),
		},
		feather: Math.round(wellH * 0.12 * SCALE),
	});
	fs.writeFileSync(path.join(OUT, `${alias}.png`), buffer);
	console.log(
		`${alias.padEnd(9)} ${W}x${H} -> ${W * SCALE}x${H * SCALE}`.padEnd(34),
		`type ${size.toFixed(1)}px  keyed: ${stats.opaquePct.toFixed(0)}% opaque, ${stats.clearPct.toFixed(0)}% clear`,
	);
}
console.log('win banners written to', path.relative(appRoot, OUT));
