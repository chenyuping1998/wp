// Bet-bar plate art: the balance/win/bet tickers and the Buy Bonus button.
//
// TWO SETS, because this game ships two skins (see src/game/uiTheme.ts):
//
//   ticker_plate / buybonus_plate      olive drill canvas + brass trim + rivets,
//                                      matched to the old reel housing. Used by
//                                      the 'boat' skin.
//   buybonus_container / _lit          a shipping-container panel with the naval
//                                      mine stencilled on it. Used by the
//                                      'platform' skin, whose flat grey strip the
//                                      brass plate fights.
// Usage: node design/generate_ui_plates.mjs <dir with node_modules for @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_ui_plates.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

import { surfaceDefs, finishRect, CANVAS_FINISH, BRASS_FINISH } from './surface.mjs';

// The shared UI's type scale, and the button's own box, both fixed in
// components-ui-pixi. Copied rather than imported: this is a node script that
// renders PNGs and has no business pulling in a Svelte package to read two
// numbers. If either ever moves, the placard drifts off the words — which is
// visible immediately in the render, and is why this is written down here.
const UI_BASE_FONT_SIZE = 45;

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi');
const SYMBOLS = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3');
fs.mkdirSync(OUT, { recursive: true });

const render = (svg, name, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } });
	fs.writeFileSync(path.join(OUT, name), resvg.render().asPng());
	console.log('rendered', name);
};

// shared palette — same brass and canvas as the reel frame / free-spin plaques
const DEFS = surfaceDefs('sf') + `
	<linearGradient id="canvas" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#2c3812"/>
		<stop offset="0.55" stop-color="#1c2609"/>
		<stop offset="1" stop-color="#131c06"/>
	</linearGradient>
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe282"/>
		<stop offset="0.45" stop-color="#d8a334"/>
		<stop offset="1" stop-color="#8a5c14"/>
	</linearGradient>
	<radialGradient id="rivet" cx="0.35" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.7" stop-color="#c08a20"/>
		<stop offset="1" stop-color="#6d4a08"/>
	</radialGradient>
	<linearGradient id="inner" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#000000" stop-opacity="0.45"/>
		<stop offset="0.5" stop-color="#000000" stop-opacity="0.12"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.4"/>
	</linearGradient>
	<filter id="grain" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="23" result="t"/>
		<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.06 0.06 0.06 0 0"/>
	</filter>`;

// ── ticker plate: 652×146 (the UI draws it at 326:73) ───────────────────────
const TW = 652;
const TH = 146;
const tickerRivets = [
	[26, 26],
	[TW - 26, 26],
	[26, TH - 26],
	[TW - 26, TH - 26],
]
	.map(
		([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="url(#rivet)" stroke="#3a2c08" stroke-width="1.8"/>
	<circle cx="${x - 2}" cy="${y - 2}" r="2.2" fill="#fff3bd" opacity="0.85"/>`,
	)
	.join('');

const ticker = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}">
<defs>${DEFS}</defs>
<rect x="6" y="6" width="${TW - 12}" height="${TH - 12}" rx="30" fill="url(#canvas)" stroke="#0c1206" stroke-width="5"/>
${finishRect(6, 6, TW - 12, TH - 12, 30, 'sf', CANVAS_FINISH)}
<!-- recessed reading well so the digits sit in shadow -->
<rect x="20" y="20" width="${TW - 40}" height="${TH - 40}" rx="22" fill="url(#inner)"/>
<!-- brass frame + hairline highlight -->
<rect x="13" y="13" width="${TW - 26}" height="${TH - 26}" rx="25" fill="none" stroke="url(#brass)" stroke-width="7"/>
<rect x="21" y="21" width="${TW - 42}" height="${TH - 42}" rx="19" fill="none" stroke="#ffe98a" stroke-width="1.6" opacity="0.5"/>
${tickerRivets}
</svg>`;

// ── buy-bonus plate: square, hotter brass so the CTA pops out of the bar ────
const BS = 640;
const buyRivets = [
	[36, 36],
	[BS - 36, 36],
	[36, BS - 36],
	[BS - 36, BS - 36],
]
	.map(
		([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>
	<circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#fff3bd" opacity="0.85"/>`,
	)
	.join('');

const buyBonus = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<linearGradient id="cta" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#4a5c18"/>
		<stop offset="0.5" stop-color="#33420f"/>
		<stop offset="1" stop-color="#222c08"/>
	</linearGradient>
	<radialGradient id="ctaGlow" cx="0.5" cy="0.32" r="0.75">
		<stop offset="0" stop-color="#ffd75e" stop-opacity="0.35"/>
		<stop offset="1" stop-color="#ffd75e" stop-opacity="0"/>
	</radialGradient>
</defs>
<rect x="10" y="10" width="${BS - 20}" height="${BS - 20}" rx="66" fill="url(#cta)" stroke="#0c1206" stroke-width="7"/>
${finishRect(10, 10, BS - 20, BS - 20, 66, 'sf', CANVAS_FINISH)}
<!-- warm top-light so the button reads as raised, not a flat tile -->
<rect x="10" y="10" width="${BS - 20}" height="${BS - 20}" rx="66" fill="url(#ctaGlow)"/>
<rect x="20" y="20" width="${BS - 40}" height="${BS - 40}" rx="56" fill="none" stroke="url(#brass)" stroke-width="11"/>
<rect x="31" y="31" width="${BS - 62}" height="${BS - 62}" rx="47" fill="none" stroke="#ffe98a" stroke-width="2.2" opacity="0.55"/>
${buyRivets}
</svg>`;

// ---- the platform skin's Buy Bonus ----------------------------------------
//
// A container panel, empty, with the naval mine stencilled on it.
//
// Both halves are taken from the shipped art rather than styled to match it.
// The panel's colours are sampled off l1.png - outer frame #4E585E over a
// corrugated face running #5F6D73 to #3D4349 - and the stencil is painted in
// that tile's own worn cream, #D1CDB9, because the low symbols ARE stencils
// sprayed on container doors and this is the same mark on the same door.
//
// WHY THE MINE. It is the thing the captain throws to start the feature, so it
// already means "the feature begins" before a player has read the caption; and
// it needs no colour keying, because mine.png is already cut out (see
// cut_from_plate.py). Drawing one by hand would put a second, slightly
// different mine in a game that already has one.
//
// A FLAT SILHOUETTE IS THE WRONG REDUCTION FOR THIS SUBJECT, and it is worth
// saying why, because Go Bananubis's plate takes exactly that route and is
// right to. An eye IS its outline. A mine is a sphere with its horns pointing
// at the camera, so its outline is a circle with four bumps on it - rendered
// cream on a panel it came out as a blob, and nothing about it said mine.
//
// What carries the shape is the artist's own dark contour: the seam band, the
// collars, the line down each horn. So the stencil is the cut-out MINUS those
// lines - a solid cream shape with its own linework knocked out of it, which is
// what a real spray stencil looks like anyway, bridges and all.
//
// The threshold is measured, not chosen: rendered at 60, 80 and 100 and looked
// at. At 80 the sphere's shaded lower right starts dropping out in patches and
// by 100 the shape has come apart; 60 takes the contour and nothing else.
const STENCIL_INK = 60;

const mineSilhouette = () => {
	const src = PNG.sync.read(fs.readFileSync(path.join(SYMBOLS, 'mine.png')));
	const { width: W, height: H, data } = src;
	const lit = (i) => data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
	const on = (i) => data[i * 4 + 3] > 128 && lit(i) > STENCIL_INK;
	// Bounds off the CUT-OUT, not the stencil: the contour runs right to the
	// silhouette's edge, so cropping to the painted area alone would shave the
	// outermost ring off every horn.
	let x0 = W, y0 = H, x1 = 0, y1 = 0;
	const rowWidth = new Int32Array(H);
	for (let y = 0; y < H; y++) {
		let lo = -1, hi = -1;
		for (let x = 0; x < W; x++)
			if (data[(y * W + x) * 4 + 3] > 128) {
				if (lo < 0) lo = x;
				hi = x;
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
		rowWidth[y] = lo < 0 ? 0 : hi - lo + 1;
	}
	// THE MOORING CHAIN IS CROPPED OFF, and the height budget is why.
	//
	// The cut keeps the chain the mine hangs from, which is right for the prop
	// the captain throws and wrong for a button mark: the stencil is sized by
	// height (see MINE_H), so a chain occupying the top third of the art spends
	// a third of the budget on something that, at the 120px this button is
	// actually drawn at, is three grey pixels. The mine came out a small dense
	// blob.
	//
	// Cropped by a property of the shape rather than a typed-in row: scanning
	// down from the top, the first row at least this wide is where the mine
	// starts. There is a clean step to sit in — measured down the current art,
	// the chain holds between 5% and 25% of the widest row for its whole length
	// and the very next rows jump to 38% as the upper horns come in. 0.45 was
	// the first guess and it landed INSIDE the sphere, cropping its dome off
	// flat.
	const CHAIN_CUT = 0.3;
	const widest = Math.max(...rowWidth);
	for (let y = y0; y <= y1; y++)
		if (rowWidth[y] >= widest * CHAIN_CUT) {
			y0 = y;
			break;
		}
	const w = x1 - x0 + 1;
	const h = y1 - y0 + 1;
	const out = new PNG({ width: w, height: h });
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const o = (y * w + x) * 4;
			out.data[o] = out.data[o + 1] = out.data[o + 2] = 255;
			out.data[o + 3] = on((y + y0) * W + (x + x0)) ? 255 : 0;
		}
	return { href: `data:image/png;base64,${PNG.sync.write(out).toString('base64')}`, aspect: h / w };
};

// WHERE THE CAPTION LANDS, derived rather than typed.
//
// The shared button centres its two lines on the plate and offers no way to move
// them (components-ui-pixi/ButtonBuyBonus). Their block is
// UI_BASE_FONT_SIZE * (ratio + 0.04) per line, two lines, in a 150px button
// drawn into this 640 canvas — so the band is a function of
// buyBonusLabelSizeRatio and nothing else. Keep the two in step: raising the
// ratio in uiTheme.ts without raising it here lets the stencil drift down into
// the words.
//
// THERE IS NO LONGER A PLACARD BEHIND THEM, and the reason is the game's own
// language rather than a compromise.
//
// The shared button draws its caption with no stroke and no shadow, so for a
// while the contrast came from a dark plate screwed to the door under the words.
// It worked and it looked like what it was: a black box stuck on the button.
//
// This game already solves exactly this problem five times on the reels. L1-L5
// are letters STENCILLED in worn cream paint straight onto a container panel,
// and they read at cell size with nothing behind them. So the caption is that:
// the same cream (#D1CDB9, sampled off l1.png) on the same panel value, which
// is a relationship already proven on this board. See buyBonusLabelFill in
// game/uiTheme.ts — the colour lives there because the shared button draws the
// text, and the two have to agree.
const LABEL_RATIO = 0.58;
const LABEL_BLOCK = ((UI_BASE_FONT_SIZE * (LABEL_RATIO + 0.04) * 2) / 150) * BS;
// The top of the line box, which is what the stencil above has to clear.
const LABEL_TOP = Math.round(BS / 2 - LABEL_BLOCK / 2);

// THE STENCIL IS SIZED BY HEIGHT, NOT WIDTH, and the caption is why.
//
// It has to END before the placard starts, which makes the vertical budget the
// fixed quantity and the width whatever the art's aspect gives. That matters
// here because the aspect is not fixed either: the mine came back 776x837 once
// the cut stopped eating its mooring chain, where it had been square, and a
// width-driven layout quietly pushed the stencil down over the first line.
const MINE = mineSilhouette();
const MINE_Y = 26;
const MINE_H = LABEL_TOP - MINE_Y - 14;
const MINE_W = Math.round(MINE_H / MINE.aspect);
const MINE_X = BS / 2 - MINE_W / 2;

const mineImage = (filter, dy = 0) =>
	`<image href="${MINE.href}" x="${MINE_X}" y="${MINE_Y + dy}" width="${MINE_W}" height="${MINE_H}" filter="url(#${filter})"/>`;

const buyBonusContainer = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<!-- THE BOARD'S OWN PANEL, a shade lighter.
	     Sampled off l1.png, whose face means (72,81,87). This sits a little above
	     that so it separates from the background art behind it, and no further:
	     the button is meant to be a container door like every tile on the reels.
	     It was ~25% lighter for a while, to carry white type — see the note on
	     the caption below for why that is no longer the job. -->
	<linearGradient id="cFrame" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#5e6c74"/>
		<stop offset="1" stop-color="#3b464e"/>
	</linearGradient>
	<linearGradient id="cFace" x1="0" y1="0" x2="0.2" y2="1">
		<stop offset="0" stop-color="#6d7e8a"/>
		<stop offset="0.55" stop-color="#5a6b76"/>
		<stop offset="1" stop-color="#434f59"/>
	</linearGradient>
	<linearGradient id="cSteel" x1="0" y1="0" x2="0.4" y2="1">
		<stop offset="0" stop-color="#8b9396"/>
		<stop offset="0.55" stop-color="#5c6467"/>
		<stop offset="1" stop-color="#343b3e"/>
	</linearGradient>
	<!-- the corrugation. The same wide, low-contrast ribs the buy cards use: at
	     button size anything stronger turns into a moire against the bet bar. -->
	<pattern id="cRibs" width="44" height="12" patternUnits="userSpaceOnUse">
		<rect width="4" height="12" fill="#ffffff" fill-opacity="0.055"/>
		<rect x="22" width="2" height="12" fill="#000000" fill-opacity="0.18"/>
	</pattern>
	<linearGradient id="cRust" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#8a4a1e" stop-opacity="0"/>
		<stop offset="0.4" stop-color="#8a4a1e" stop-opacity="0.5"/>
		<stop offset="1" stop-color="#5e2f12" stop-opacity="0"/>
	</linearGradient>
	<!-- THE STENCIL IS PAINT, NOT A CUT.
	     Go Bananubis carves its eye into stone, with a dark cut and a pale lip
	     under it. Wrong verb here: nobody chisels a steel container, they spray
	     through a stencil. So this is flat worn cream with no relief at all, and
	     the wear comes from the ribs and the rust showing through it. -->
	<filter id="cPaint" x="-20%" y="-20%" width="140%" height="140%">
		<feColorMatrix type="matrix" values="0 0 0 0 0.82  0 0 0 0 0.80  0 0 0 0 0.73  0 0 0 0.88 0"/>
	</filter>
	<!-- a dark offset UNDER the paint: spray creeps beneath a stencil edge and the
	     panel behind it is darker than the paint. A few pixels of this is the
	     difference between painted on and pasted on. -->
	<filter id="cPaintShadow" x="-20%" y="-20%" width="140%" height="140%">
		<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0"/>
	</filter>
</defs>
<rect x="8" y="8" width="${BS - 16}" height="${BS - 16}" rx="26" fill="url(#cFrame)" stroke="#1b1e21" stroke-width="9"/>
${finishRect(8, 8, BS - 16, BS - 16, 26, 'sf', CANVAS_FINISH)}
<!-- the container face, recessed inside the frame -->
<rect x="46" y="46" width="${BS - 92}" height="${BS - 92}" rx="16" fill="url(#cFace)" stroke="#232a2d" stroke-width="6"/>
<rect x="46" y="46" width="${BS - 92}" height="${BS - 92}" rx="16" fill="url(#cRibs)"/>
<rect x="${BS * 0.24}" y="46" width="14" height="${BS - 92}" fill="url(#cRust)"/>
<rect x="${BS * 0.72}" y="46" width="10" height="${BS - 92}" fill="url(#cRust)"/>
${finishRect(46, 46, BS - 92, BS - 92, 16, 'sf', CANVAS_FINISH)}
<rect x="55" y="55" width="${BS - 110}" height="${BS - 110}" rx="12" fill="none" stroke="#000000" stroke-width="2" opacity="0.22"/>

${mineImage('cPaintShadow', 5)}
${mineImage('cPaint')}

${[[46, 46], [BS - 46, 46], [46, BS - 46], [BS - 46, BS - 46]]
	.map(([x, y]) => `<rect x="${x - 21}" y="${y - 21}" width="42" height="42" rx="5" fill="url(#cSteel)" stroke="#1e2426" stroke-width="4"/>
	<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="3" fill="#a3abae" opacity="0.5"/>`)
	.join('')}
</svg>`;

// ---- the same stencil, LIT - drawn for ADDITIVE blending -------------------
//
// Transparent everywhere else, so it lays over the plate with blendMode 'add'
// and reads as the paint catching light rather than as a sticker. The bloom is
// baked in rather than filtered at run time: an additive child inside a filtered
// or masked container is composited into an isolated target that starts empty,
// so it would be adding to nothing and arrive as a faint film.
const buyBonusContainerLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<radialGradient id="cBloom" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffb02c" stop-opacity="0.4"/>
		<stop offset="0.4" stop-color="#ff8c1a" stop-opacity="0.17"/>
		<stop offset="1" stop-color="#ff6a10" stop-opacity="0"/>
	</radialGradient>
	<filter id="cLitSoft" x="-70%" y="-70%" width="240%" height="240%">
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.6  0 0 0 0 0.12  0 0 0 1 0"/>
		<feGaussianBlur stdDeviation="12"/>
	</filter>
	<filter id="cLitCore" x="-30%" y="-30%" width="160%" height="160%">
		<!-- amber, not near-white: this sits on a PALE cream stencil, and anything
		     close to white there reads as a hole in the panel rather than as light -->
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.74  0 0 0 0 0.24  0 0 0 0.85 0"/>
		<feGaussianBlur stdDeviation="2"/>
	</filter>
</defs>
<ellipse cx="${BS / 2}" cy="${MINE_Y + MINE_H / 2}" rx="${BS * 0.42}" ry="${BS * 0.3}" fill="url(#cBloom)"/>
${mineImage('cLitSoft')}
${mineImage('cLitCore')}
</svg>`;

render(ticker, 'ticker_plate.png', TW);
render(buyBonus, 'buybonus_plate.png', BS);
render(buyBonusContainer, 'buybonus_container.png', BS);
render(buyBonusContainerLit, 'buybonus_container_lit.png', BS);
console.log('ui plates written to', OUT);
