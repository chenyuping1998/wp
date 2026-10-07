// Bet-bar plate art: the balance/win/bet tickers and the Buy Bonus button.
//
// TWO SETS, because this game ships two skins (see src/game/uiTheme.ts):
//
//   ticker_plate / buybonus_plate      olive drill canvas + brass trim + rivets,
//                                      matched to the old reel housing. Used by
//                                      the 'bananubis' skin.
//   buybonus_stone / buybonus_stone_lit
//                                      the platform skin's Buy Bonus: the same
//                                      dark basalt plate every SYMBOL stands on,
//                                      empty, with the sealed tablet's eye carved
//                                      into it — and a second, additive copy of
//                                      that eye lit, for the hover state.
//
// The stone plate's colours are SAMPLED off the shipped symbol art rather than
// invented, so the button and the board are the same rock: h1.png gives the outer
// edge #3d4043, the face #3d4144 falling to #383b3d, and the corner studs
// #624c39 with a #7e6751 highlight.
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

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi');
// the shipped symbol art, which this reads the plate's colours and the eye's
// shape out of rather than restating either
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

// ── the platform skin's Buy Bonus ──────────────────────────────────────────
//
// The LOW symbols' plate, empty, with h2's Eye of Horus cut into it.
//
// Both halves of that are taken from the shipped symbol art rather than styled
// to match it. The plate's colours are sampled off l1.png — dark basalt frame
// #353d3d over a light granite inner panel #808e95 falling to #7a8386, with the
// steel corner studs the low tier uses and NO gilt bevel, which is the cue that
// separates the low plates from the high ones. The eye is h2's own wedjat,
// lifted as a silhouette; drawing one by hand would be a second, slightly
// different eye in a game that already has one.
//
// WHY A SILHOUETTE AND NOT THE SYMBOL ITSELF: h2 is a lapis amulet painted on a
// dark plate. Dropped onto a light granite face it would be a blue sticker. What
// is wanted is the same SHAPE cut into this stone, so only the outline travels.
const eyeSilhouette = () => {
	const src = PNG.sync.read(fs.readFileSync(path.join(SYMBOLS, 'h2.png')));
	const { width: W, height: H, data } = src;
	// blue dominance: the amulet is lapis on neutral basalt, so one channel
	// difference separates them with nothing to tune. Measured on h2.png, the
	// eye covers 9.9% of the tile at this threshold and nothing else passes.
	const mask = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		const r = data[i * 4];
		const b = data[i * 4 + 2];
		if (b - r > 45) mask[i] = 1;
	}
	// The PUPIL IS LEFT OUT on purpose. It is dark, not blue, so it fails the
	// test and stays a hole in the mask — which is exactly right for a relief,
	// where the pupil is a deeper cut rather than part of the same face.
	let x0 = W, y0 = H, x1 = 0, y1 = 0;
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++)
			if (mask[y * W + x]) {
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
	const w = x1 - x0 + 1;
	const h = y1 - y0 + 1;
	const out = new PNG({ width: w, height: h });
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const i = ((y + y0) * W + (x + x0)) * 4;
			const o = (y * w + x) * 4;
			out.data[o] = out.data[o + 1] = out.data[o + 2] = 255;
			out.data[o + 3] = mask[(y + y0) * W + (x + x0)] ? 255 : 0;
		}
	return {
		href: `data:image/png;base64,${PNG.sync.write(out).toString('base64')}`,
		aspect: h / w,
	};
};

const EYE = eyeSilhouette();
const EYE_W = 190;
const EYE_H = Math.round(EYE_W * EYE.aspect);
const EYE_X = BS / 2 - EYE_W / 2;
// Top third, finishing above where the label's block begins. The shared button
// centres its caption and cannot move it, so the only way the two share a 120px
// plate is for the eye to end before the words start: at buyBonusLabelSizeRatio
// 0.46 those two lines run 224 to 416 in this 640 canvas.
const EYE_Y = 66;

const eyeImage = (filter, dy = 0) =>
	`<image href="${EYE.href}" x="${EYE_X}" y="${EYE_Y + dy}" width="${EYE_W}" height="${EYE_H}" filter="url(#${filter})"/>`;

const buyBonusStone = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#454b4f"/>
		<stop offset="1" stop-color="#2a3033"/>
	</linearGradient>
	<linearGradient id="granite" x1="0" y1="0" x2="0.2" y2="1">
		<stop offset="0" stop-color="#8d9aa1"/>
		<stop offset="0.5" stop-color="#808e95"/>
		<stop offset="1" stop-color="#6f7a7e"/>
	</linearGradient>
	<linearGradient id="steel" x1="0" y1="0" x2="0.4" y2="1">
		<stop offset="0" stop-color="#8b9396"/>
		<stop offset="0.55" stop-color="#5c6467"/>
		<stop offset="1" stop-color="#343b3e"/>
	</linearGradient>
	<!-- solid black at a fraction of the silhouette's alpha: the cut -->
	<filter id="cut" x="-20%" y="-20%" width="140%" height="140%">
		<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.34 0"/>
	</filter>
	<!-- the same shape in pale stone, dropped a few pixels: the lit lower edge.
	     A shadow on its own is a stain; a shadow with a lit edge under it is a
	     groove, and that is the whole difference between carved and printed. -->
	<filter id="lip" x="-20%" y="-20%" width="140%" height="140%">
		<feColorMatrix type="matrix" values="0 0 0 0 0.76  0 0 0 0 0.81  0 0 0 0 0.84  0 0 0 0.55 0"/>
	</filter>
</defs>
<rect x="8" y="8" width="${BS - 16}" height="${BS - 16}" rx="26" fill="url(#frame)" stroke="#1b1e21" stroke-width="9"/>
${finishRect(8, 8, BS - 16, BS - 16, 26, 'sf', CANVAS_FINISH)}
<!-- the recessed granite panel. No gilt bevel: that is the LOW tier's plate, and
     the absence of gold is the cue that tells the two tiers apart on the board. -->
<rect x="46" y="46" width="${BS - 92}" height="${BS - 92}" rx="16" fill="url(#granite)" stroke="#232a2d" stroke-width="6"/>
${finishRect(46, 46, BS - 92, BS - 92, 16, 'sf', CANVAS_FINISH)}
<rect x="55" y="55" width="${BS - 110}" height="${BS - 110}" rx="12" fill="none" stroke="#000000" stroke-width="2" opacity="0.22"/>

${eyeImage('lip', 7)}
${eyeImage('cut')}

${[[46, 46], [BS - 46, 46], [46, BS - 46], [BS - 46, BS - 46]]
	.map(([x, y]) => `<rect x="${x - 21}" y="${y - 21}" width="42" height="42" rx="5" fill="url(#steel)" stroke="#1e2426" stroke-width="4"/>
	<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="3" fill="#a3abae" opacity="0.5"/>`)
	.join('')}
</svg>`;

// ── the same eye, LIT — drawn for ADDITIVE blending ────────────────────────
//
// Transparent everywhere else, so it lays over the plate with blendMode 'add'
// and reads as the stone catching light rather than as a sticker. The bloom is
// baked in rather than filtered at run time: an additive child inside a filtered
// or masked container is composited into an isolated target that starts empty,
// so it would be adding to nothing and arrive as a faint film.
const buyBonusStoneLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<radialGradient id="bloom" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffd75e" stop-opacity="0.42"/>
		<stop offset="0.4" stop-color="#ffb62c" stop-opacity="0.18"/>
		<stop offset="1" stop-color="#ff9a10" stop-opacity="0"/>
	</radialGradient>
	<filter id="litSoft" x="-70%" y="-70%" width="240%" height="240%">
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.72  0 0 0 0 0.12  0 0 0 1 0"/>
		<feGaussianBlur stdDeviation="11"/>
	</filter>
	<filter id="litCore" x="-30%" y="-30%" width="160%" height="160%">
		<!-- amber, not near-white: this sits on PALE granite, and anything close
		     to white there reads as a hole in the stone rather than as light -->
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.82  0 0 0 0 0.26  0 0 0 0.85 0"/>
		<feGaussianBlur stdDeviation="2"/>
	</filter>
</defs>
<ellipse cx="${BS / 2}" cy="${EYE_Y + EYE_H / 2}" rx="${BS * 0.42}" ry="${BS * 0.26}" fill="url(#bloom)"/>
${eyeImage('litSoft')}
${eyeImage('litCore')}
</svg>`;

// ---- the platform skin's Buy Bonus, second answer: THE SUN DISC ------------
//
// Go Bananas Boat's button is a ship's wheel that turns under the pointer: a
// round object with a real reason to rotate, a gold rim, a dark face for the
// caption. This is the same idea said in a palace rather than on a deck.
//
//   · THE FACE IS A PALACE CEILING. Lapis blue scattered with five-pointed gold
//     stars is what the ceilings of Egyptian halls and tombs were actually
//     painted with — the most recognisable Egyptian surface there is after gold
//     itself, and a dark enough blue that the white caption reads on it.
//   · THE RIM IS INLAY, NOT A BAND. Gold cloisons holding lapis, carnelian and
//     turquoise, the way the pectorals and broad collars were made. That is what
//     turns "a gold ring" into "a royal object".
//   · THE RAYS ARE THE HANDSPIKES. The sun's rays radiate out of the rim the way
//     the wheel's spikes did, which is what reads in silhouette at 150px — and
//     what makes turning it look like the sun turning rather than a disc slipping.
//
// Twelve long rays with twelve short between them, so the mark repeats every 30
// degrees: see buyBonusHoverSpin in uiTheme.ts, which is 30 for that reason.
//
// THE CLEAR ZONE. The caption is drawn at buyBonusLabelSizeRatio 0.52: two lines
// of 45 * 0.56 units in a 150-unit button, i.e. +-107px of this canvas, and at
// most +-150 wide. The face's inner edge is at 204, which at the height of a line
// leaves sqrt(204^2 - 107^2) = 174px — so no gold is drawn under the words.
// The star rows skip the band within 100px of the centre line for the same reason.
const SUN_C = BS / 2;
const FACE_R = 204;
const INLAY_IN = 206;
const INLAY_OUT = 232;
const RIM_OUT = 242;
const RAY_N = 12;

const polar = (r, a) => [SUN_C + Math.sin(a) * r, SUN_C - Math.cos(a) * r];
const pt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

const rays = (fill) =>
	Array.from({ length: RAY_N * 2 }, (_, i) => {
		const a = (i / (RAY_N * 2)) * Math.PI * 2;
		const long = i % 2 === 0;
		const reach = long ? 306 : 272;
		const half = long ? 0.085 : 0.06;
		const tip = polar(reach, a);
		return `<path d="M ${pt(polar(RIM_OUT - 8, a - half))} L ${pt(tip)} L ${pt(polar(RIM_OUT - 8, a + half))} Z" fill="${fill}"/>` +
			(long ? `<circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="9" fill="${fill}"/>` : '');
	}).join('');

// The inlay: 24 cells, lapis / carnelian / turquoise in turn, gold between.
const INLAY_COLOURS = ['#2c55b0', '#b8452a', '#2aa396'];
const INLAY_N = 24;
const inlay = Array.from({ length: INLAY_N }, (_, i) => {
	const gap = 0.022;
	const a0 = (i / INLAY_N) * Math.PI * 2 + gap;
	const a1 = ((i + 1) / INLAY_N) * Math.PI * 2 - gap;
	const r0 = INLAY_IN + 5;
	const r1 = INLAY_OUT - 5;
	return `<path d="M ${pt(polar(r0, a0))} L ${pt(polar(r1, a0))} A ${r1} ${r1} 0 0 1 ${pt(polar(r1, a1))} L ${pt(polar(r0, a1))} A ${r0} ${r0} 0 0 0 ${pt(polar(r0, a0))} Z" fill="${INLAY_COLOURS[i % 3]}"/>`;
}).join('');

// Five-pointed stars, as painted on the ceilings: a thin-armed star rather than
// a fat one, in OFFSET ROWS, which is how the ceilings lay them out. A ring of
// stars round the edge was tried first and read at once as the EU flag.
const star = (x, y, r) => {
	const p = Array.from({ length: 10 }, (_, k) => {
		const a = (k / 10) * Math.PI * 2;
		const rr = k % 2 === 0 ? r : r * 0.34;
		return `${(x + Math.sin(a) * rr).toFixed(1)},${(y - Math.cos(a) * rr).toFixed(1)}`;
	});
	return `<polygon points="${p.join(' ')}"/>`;
};
const STAR_STEP = 46;
const stars = (() => {
	const out = [];
	for (let row = -5; row <= 5; row++) {
		const dy = row * STAR_STEP * 0.87;
		// the caption's band stays clear of stars
		if (Math.abs(dy) < 100) continue;
		for (let col = -5; col <= 5; col++) {
			const dx = col * STAR_STEP + (row % 2 ? STAR_STEP / 2 : 0);
			if (Math.hypot(dx, dy) > FACE_R - 22) continue;
			out.push(star(SUN_C + dx, SUN_C + dy, 9));
		}
	}
	return out.join('');
})();

const buyBonusSun = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<linearGradient id="sunGold" x1="0.15" y1="0" x2="0.7" y2="1">
		<stop offset="0" stop-color="#fff0b0"/>
		<stop offset="0.3" stop-color="#f0c24e"/>
		<stop offset="0.65" stop-color="#c48d22"/>
		<stop offset="1" stop-color="#7a520e"/>
	</linearGradient>
	<radialGradient id="lapis" cx="0.42" cy="0.36" r="0.75">
		<stop offset="0" stop-color="#2d4f9e"/>
		<stop offset="0.55" stop-color="#1a3272"/>
		<stop offset="1" stop-color="#0b163a"/>
	</radialGradient>
	<radialGradient id="inlayShade" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0.86" stop-color="#000000" stop-opacity="0"/>
		<stop offset="0.93" stop-color="#ffffff" stop-opacity="0.18"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.35"/>
	</radialGradient>
	<filter id="sunGrain" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/>
	</filter>
	<clipPath id="faceClip"><circle cx="${SUN_C}" cy="${SUN_C}" r="${FACE_R}"/></clipPath>
</defs>
<!-- the drop shadow of the whole object on the bar -->
<g transform="translate(0 7)" opacity="0.45">${rays('#000000')}<circle cx="${SUN_C}" cy="${SUN_C}" r="${RIM_OUT}" fill="#000000"/></g>
${rays('url(#sunGold)')}
<!-- a dark keel along each ray, so they read as struck metal and not as paper -->
${Array.from({ length: RAY_N * 2 }, (_, i) => {
	const a = (i / (RAY_N * 2)) * Math.PI * 2;
	return `<line x1="${pt(polar(RIM_OUT, a)).replace(' ', '" y1="')}" x2="${pt(polar(i % 2 ? 262 : 292, a)).replace(' ', '" y2="')}" stroke="#7a520e" stroke-width="2.5" opacity="0.55"/>`;
}).join('')}
<!-- the gold setting the inlay sits in -->
<circle cx="${SUN_C}" cy="${SUN_C}" r="${RIM_OUT}" fill="url(#sunGold)" stroke="#5a3c08" stroke-width="3"/>
<circle cx="${SUN_C}" cy="${SUN_C}" r="${INLAY_OUT}" fill="#6b470c"/>
${inlay}
<circle cx="${SUN_C}" cy="${SUN_C}" r="${INLAY_OUT}" fill="url(#inlayShade)"/>
<!-- the palace ceiling -->
<circle cx="${SUN_C}" cy="${SUN_C}" r="${FACE_R + 2}" fill="url(#sunGold)"/>
<circle cx="${SUN_C}" cy="${SUN_C}" r="${FACE_R}" fill="url(#lapis)"/>
<g clip-path="url(#faceClip)">
	<rect width="${BS}" height="${BS}" filter="url(#sunGrain)"/>
	<g fill="#e8b84a" opacity="0.85">${stars}</g>
	<!-- the recess: the face sits below the rim, so the rim throws a shadow in -->
	<circle cx="${SUN_C}" cy="${SUN_C + 6}" r="${FACE_R + 4}" fill="none" stroke="#000000" stroke-width="18" opacity="0.45"/>
</g>
<!-- the top highlight along the rim, which is what makes gold look turned -->
<circle cx="${SUN_C}" cy="${SUN_C}" r="${RIM_OUT - 4}" fill="none" stroke="#fff3c4" stroke-width="2.5" opacity="0.5" stroke-dasharray="380 1140" transform="rotate(-150 ${SUN_C} ${SUN_C})"/>
</svg>`;

// ---- the same sun, LIT — drawn for ADDITIVE blending -----------------------
// Rays and rim only: the face stays dark under a light wash so the caption,
// which is drawn after this, keeps its ground.
const sunShape = `${rays('#ffffff')}<circle cx="${SUN_C}" cy="${SUN_C}" r="${(INLAY_IN + RIM_OUT) / 2}" fill="none" stroke="#ffffff" stroke-width="${RIM_OUT - INLAY_IN}"/>`;
const buyBonusSunLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<radialGradient id="sunBloom" cx="0.5" cy="0.5" r="0.5">
		<!-- nothing on the face: orange added to lapis turns it grey -->
		<stop offset="0.6" stop-color="#ffb02c" stop-opacity="0"/>
		<stop offset="0.74" stop-color="#ffb02c" stop-opacity="0.2"/>
		<stop offset="1" stop-color="#ff8c1a" stop-opacity="0"/>
	</radialGradient>
	<filter id="sunLitSoft" x="-40%" y="-40%" width="180%" height="180%">
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.7  0 0 0 0 0.16  0 0 0 1 0"/>
		<feGaussianBlur stdDeviation="12"/>
	</filter>
	<filter id="sunLitCore" x="-30%" y="-30%" width="160%" height="160%">
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.8  0 0 0 0 0.3  0 0 0 0.7 0"/>
		<feGaussianBlur stdDeviation="2"/>
	</filter>
</defs>
<circle cx="${SUN_C}" cy="${SUN_C}" r="${BS / 2}" fill="url(#sunBloom)"/>
<g filter="url(#sunLitSoft)" opacity="0.55">${sunShape}</g>
<g filter="url(#sunLitCore)" opacity="0.8">${sunShape}</g>
</svg>`;

// ---- the platform skin's Buy Bonus, third answer: KHEPRI LIFTING THE SUN ----
//
// Picked over the sun disc (and a winged sun, and a cartouche) because it is the
// most Egyptian object that is still a CIRCLE: the scarab god pushing the sun up
// over the horizon, the way Tutankhamun's pectorals show it — a LAPIS scarab
// outlined in gold, its wings inlaid in lapis, carnelian and turquoise sweeping up
// both sides of the disc. The disc is the sun it lifts, and its face is the
// palace ceiling from the sun disc version (lapis, rows of gold stars), which is
// what the white caption sits on.
//
// It is also the scarab that runs along a winning line on the board, so the
// button and the win language are one creature.
//
// IT DOES NOT TURN. The shared button rotates the whole plate, and a scarab
// orbiting its own sun is nonsense. Hover lights it instead (the _lit copy).
//
// Clear zone. The first cut had the disc 38px above the caption's centre and
// a 196 face, and in the game BONUS ran into the rim: at plate scale 1 the word
// is about 440 units of this canvas wide, not the ~170 guessed from the font.
// Now the disc is centred on the caption (320) and wider (face 214), and
// uiTheme.buyBonusPlateScale draws the art 1.25x the button box while the text
// keeps its size — so in canvas units BONUS is ~350 wide, i.e. +-176, against a
// face +-194 wide at the height of its letters (sqrt(214^2-90^2)).
const K_CX = BS / 2;
const K_CY = 314;
const K_FACE = 214;
const K_INL_IN = 218;
const K_INL_OUT = 242;
const K_RIM = 252;
// brighter than the sun disc's stones: at button size the inlay went muddy
const K_INLAY = ['#3f74de', '#e8643c', '#3fd0bd'];

const kPolar = (r, a) => [K_CX + Math.sin(a) * r, K_CY - Math.cos(a) * r];
const kPt = (r, a) => kPolar(r, a).map((v) => v.toFixed(1)).join(' ');
const deg = (d) => (d * Math.PI) / 180;

// the ceiling's stars, rowed about the caption's centre (320) but kept inside
// THIS face, whose centre is higher
const kStars = (() => {
	const out = [];
	for (let row = -5; row <= 5; row++) {
		const dy = row * STAR_STEP * 0.87;
		if (Math.abs(dy) < 100) continue;
		for (let col = -5; col <= 5; col++) {
			const dx = col * STAR_STEP + (row % 2 ? STAR_STEP / 2 : 0);
			const x = SUN_C + dx;
			const y = SUN_C + dy;
			if (Math.hypot(x - K_CX, y - K_CY) > K_FACE - 24) continue;
			out.push(star(x, y, 9));
		}
	}
	return out.join('');
})();

const kInlay = Array.from({ length: 24 }, (_, i) => {
	const a0 = (i / 24) * Math.PI * 2 + 0.024;
	const a1 = ((i + 1) / 24) * Math.PI * 2 - 0.024;
	const r0 = K_INL_IN + 4;
	const r1 = K_INL_OUT - 4;
	return `<path d="M ${kPt(r0, a0)} L ${kPt(r1, a0)} A ${r1} ${r1} 0 0 1 ${kPt(r1, a1)} L ${kPt(r0, a1)} A ${r0} ${r0} 0 0 0 ${kPt(r0, a0)} Z" fill="${K_INLAY[i % 3]}"/>`;
}).join('');

// ONE WING, as feathers between two angles (clockwise from the top), from the
// scarab's shoulder at the bottom of the disc up round its side. Each feather is
// a radial strip: a gold root against the rim, a cloisonne cell, and a rounded
// gold tip — three rows, which is how the pectoral wings are built. The wing
// narrows as it climbs, so its top blends into the rim instead of ending square.
const WING_FEATHERS = 13;
const wingPath = (side, fill, parts = 'all', pick = () => true) => {
	let out = '';
	for (let i = 0; i < WING_FEATHERS; i++) {
		const t = i / (WING_FEATHERS - 1);
		if (!pick(deg(166 - t * 90) * side)) continue;
		// from 166 degrees (just beside the scarab) up to 76: long primaries low
		// down, where a wing is widest, shortening to nothing as it climbs
		const aMid = deg(166 - t * 90) * side;
		const half = deg(3.9);
		const a0 = aMid - half;
		const a1 = aMid + half;
		const reach = K_RIM + 58 - t * 48;
		const r0 = K_RIM - 6;
		const rCell = K_RIM + (reach - K_RIM) * 0.34;
		const rTip = K_RIM + (reach - K_RIM) * 0.72;
		// outline of the whole feather, with a rounded end
		const outline = `M ${kPt(r0, a0)} L ${kPt(rTip, a0)} Q ${kPt(reach + 4, aMid)} ${kPt(rTip, a1)} L ${kPt(r0, a1)} A ${r0} ${r0} 0 0 0 ${kPt(r0, a0)} Z`;
		if (parts === 'all' || parts === 'shape') {
			out += `<path d="${outline}" fill="${fill}" stroke="#5e4210" stroke-width="3.5" stroke-linejoin="round"/>`;
		}
		if (parts === 'all') {
			const c0 = a0 + 0.012 * side;
			const c1 = a1 - 0.012 * side;
			out += `<path d="M ${kPt(rCell, c0)} L ${kPt(rTip - 3, c0)} L ${kPt(rTip - 3, c1)} L ${kPt(rCell, c1)} Z" fill="${K_INLAY[(i + (side > 0 ? 0 : 1)) % 3]}" stroke="#6b470c" stroke-width="2"/>`;
		}
	}
	return out;
};

// THE SCARAB, head up, at the foot of the disc, front legs on the rim.
// Body lapis, everything outlined and detailed in gold.
const SX = K_CX;
const SY = 580;
const scarab = (body, line, detail = true) => `<g transform="translate(${SX} ${SY - 56}) scale(0.92) translate(${-SX} ${56 - SY})">
<g stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="${line}">
	<!-- legs first, so the body sits over their roots -->
	<path d="M ${SX - 30} ${SY - 42} L ${SX - 62} ${SY - 64} L ${SX - 70} ${SY - 90}" stroke-width="11"/>
	<path d="M ${SX + 30} ${SY - 42} L ${SX + 62} ${SY - 64} L ${SX + 70} ${SY - 90}" stroke-width="11"/>
	<path d="M ${SX - 44} ${SY - 4} L ${SX - 84} ${SY - 6} L ${SX - 98} ${SY + 22}" stroke-width="9"/>
	<path d="M ${SX + 44} ${SY - 4} L ${SX + 84} ${SY - 6} L ${SX + 98} ${SY + 22}" stroke-width="9"/>
	<path d="M ${SX - 38} ${SY + 30} L ${SX - 66} ${SY + 40} L ${SX - 74} ${SY + 50}" stroke-width="9"/>
	<path d="M ${SX + 38} ${SY + 30} L ${SX + 66} ${SY + 40} L ${SX + 74} ${SY + 50}" stroke-width="9"/>
</g>
<!-- wing cases -->
<ellipse cx="${SX}" cy="${SY + 12}" rx="52" ry="50" fill="${body}" stroke="${line}" stroke-width="6"/>
<!-- thorax -->
<path d="M ${SX - 48} ${SY - 30} Q ${SX} ${SY - 64} ${SX + 48} ${SY - 30} Q ${SX + 44} ${SY - 12} ${SX} ${SY - 10} Q ${SX - 44} ${SY - 12} ${SX - 48} ${SY - 30} Z" fill="${body}" stroke="${line}" stroke-width="6"/>
<!-- head, the toothed clypeus that pushes -->
<path d="M ${SX - 28} ${SY - 50} L ${SX - 24} ${SY - 66} L ${SX - 14} ${SY - 60} L ${SX - 6} ${SY - 72} L ${SX} ${SY - 64} L ${SX + 6} ${SY - 72} L ${SX + 14} ${SY - 60} L ${SX + 24} ${SY - 66} L ${SX + 28} ${SY - 50} Z" fill="${body}" stroke="${line}" stroke-width="5"/>
${detail ? `<line x1="${SX}" y1="${SY - 10}" x2="${SX}" y2="${SY + 60}" stroke="${line}" stroke-width="4"/>
<path d="M ${SX - 36} ${SY + 2} Q ${SX - 30} ${SY + 36} ${SX - 12} ${SY + 52}" fill="none" stroke="${line}" stroke-width="2.5" opacity="0.7"/>
<path d="M ${SX + 36} ${SY + 2} Q ${SX + 30} ${SY + 36} ${SX + 12} ${SY + 52}" fill="none" stroke="${line}" stroke-width="2.5" opacity="0.7"/>
<ellipse cx="${SX - 20}" cy="${SY - 2}" rx="14" ry="7" fill="#ffffff" opacity="0.3"/>` : ''}</g>`;

const buyBonusScarab = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<linearGradient id="kGold" x1="0.15" y1="0" x2="0.7" y2="1">
		<stop offset="0" stop-color="#fff8d2"/>
		<stop offset="0.3" stop-color="#ffd86a"/>
		<stop offset="0.65" stop-color="#e8ae3c"/>
		<stop offset="1" stop-color="#b07c1c"/>
	</linearGradient>
	<radialGradient id="kLapis" cx="0.42" cy="0.36" r="0.75">
		<stop offset="0" stop-color="#2d4f9e"/>
		<stop offset="0.55" stop-color="#1a3272"/>
		<stop offset="1" stop-color="#0b163a"/>
	</radialGradient>
	<radialGradient id="kBeetle" cx="0.38" cy="0.3" r="0.8">
		<stop offset="0" stop-color="#6c98ee"/>
		<stop offset="0.55" stop-color="#3464c8"/>
		<stop offset="1" stop-color="#1a3a86"/>
	</radialGradient>
	<radialGradient id="kCarnelian" cx="0.35" cy="0.3" r="0.8">
		<stop offset="0" stop-color="#ff9a6a"/>
		<stop offset="0.45" stop-color="#d8452a"/>
		<stop offset="1" stop-color="#7e1c0c"/>
	</radialGradient>
	<radialGradient id="kInlayShade" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0.85" stop-color="#000000" stop-opacity="0"/>
		<stop offset="0.92" stop-color="#ffffff" stop-opacity="0.16"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.3"/>
	</radialGradient>
	<filter id="kGrain" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/>
	</filter>
	<clipPath id="kFaceClip"><circle cx="${K_CX}" cy="${K_CY}" r="${K_FACE}"/></clipPath>
</defs>
<!-- shadow of the whole emblem -->
<g transform="translate(0 8)" opacity="0.45" fill="#000000" stroke="#000000">
	${wingPath(1, '#000000', 'shape')}${wingPath(-1, '#000000', 'shape')}
	<circle cx="${K_CX}" cy="${K_CY}" r="${K_RIM}"/>
	<circle cx="${K_CX}" cy="${K_CY - K_RIM - 4}" r="34"/>
	${scarab('#000000', '#000000', false)}
</g>
${wingPath(1, 'url(#kGold)')}
${wingPath(-1, 'url(#kGold)')}
<!-- the disc -->
<circle cx="${K_CX}" cy="${K_CY}" r="${K_RIM}" fill="url(#kGold)" stroke="#5e4210" stroke-width="4"/>
<circle cx="${K_CX}" cy="${K_CY}" r="${K_INL_OUT}" fill="#6b470c"/>
${kInlay}
<circle cx="${K_CX}" cy="${K_CY}" r="${K_INL_OUT}" fill="url(#kInlayShade)"/>
<circle cx="${K_CX}" cy="${K_CY}" r="${K_FACE + 3}" fill="url(#kGold)"/>
<circle cx="${K_CX}" cy="${K_CY}" r="${K_FACE}" fill="url(#kLapis)"/>
<g clip-path="url(#kFaceClip)">
	<rect width="${BS}" height="${BS}" filter="url(#kGrain)"/>
	<g fill="#e8b84a" opacity="0.8">${kStars}</g>
	<circle cx="${K_CX}" cy="${K_CY + 6}" r="${K_FACE + 4}" fill="none" stroke="#000000" stroke-width="18" opacity="0.45"/>
</g>
<circle cx="${K_CX}" cy="${K_CY}" r="${K_RIM - 4}" fill="none" stroke="#fff3c4" stroke-width="2.5" opacity="0.5" stroke-dasharray="360 1200" transform="rotate(-150 ${K_CX} ${K_CY})"/>
<!-- the carnelian set at the crown, the sun's own fire -->
<circle cx="${K_CX}" cy="${K_CY - K_RIM - 4}" r="34" fill="url(#kGold)" stroke="#5e4210" stroke-width="4"/>
<circle cx="${K_CX}" cy="${K_CY - K_RIM - 4}" r="24" fill="url(#kCarnelian)" stroke="#6b470c" stroke-width="3"/>
<ellipse cx="${K_CX - 8}" cy="${K_CY - K_RIM - 12}" rx="8" ry="5" fill="#ffffff" opacity="0.45"/>
${scarab('url(#kBeetle)', 'url(#kGold)')}
</svg>`;

const kLitShape = `${wingPath(1, '#ffffff', 'shape')}${wingPath(-1, '#ffffff', 'shape')}
<circle cx="${K_CX}" cy="${K_CY}" r="${(K_INL_IN + K_RIM) / 2}" fill="none" stroke="#ffffff" stroke-width="${K_RIM - K_INL_IN}"/>
<circle cx="${K_CX}" cy="${K_CY - K_RIM - 4}" r="34" fill="#ffffff"/>
${scarab('#ffffff', '#ffffff', false)}`;
// HOVER IS AN ANIMATION: a light running round the rim, 16 frames.
//
// The shared button draws one hover sprite, still. The game cycles
// uiTheme.sprites.buyBonusGlyph through these frames on a timer
// (game/buyBonusGlow.ts), so what the player sees is the base glow with a hot
// arc travelling clockwise round the inlay, lighting the feathers it passes and
// flaring on the scarab and the carnelian as it goes over them.
//
// Rendered at half size: they are blurred light, and 16 full-size frames would
// be most of a megabyte for nothing.
const K_GLOW_FRAMES = 16;
const K_RING = (K_INL_IN + K_RIM) / 2;
const angDist = (a, b) => {
	const d = Math.abs(((a - b) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
	return Math.min(d, Math.PI * 2 - d);
};
const kLitFrame = (f) => {
	const th = (f / K_GLOW_FRAMES) * Math.PI * 2;
	const near = (a, w) => angDist(a, th) < w;
	const arc = (half) => `<path d="M ${kPt(K_RING, th - half)} A ${K_RING} ${K_RING} 0 0 1 ${kPt(K_RING, th + half)}" fill="none" stroke="#ffffff" stroke-width="${K_RIM - K_INL_IN + 6}" stroke-linecap="round"/>`;
	const [hx, hy] = kPolar(K_RING, th);
	const gemLit = near(0, 0.6);
	const beetleLit = near(Math.PI, 0.7);
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<radialGradient id="kBloom" cx="0.5" cy="${K_CY / BS}" r="0.5">
		<stop offset="0.6" stop-color="#ffb02c" stop-opacity="0"/>
		<stop offset="0.76" stop-color="#ffb02c" stop-opacity="0.18"/>
		<stop offset="1" stop-color="#ff8c1a" stop-opacity="0"/>
	</radialGradient>
	<filter id="kLitSoft" x="-40%" y="-40%" width="180%" height="180%">
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.7  0 0 0 0 0.16  0 0 0 1 0"/>
		<feGaussianBlur stdDeviation="12"/>
	</filter>
	<filter id="kHot" x="-40%" y="-40%" width="180%" height="180%">
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.86  0 0 0 0 0.45  0 0 0 1 0"/>
		<feGaussianBlur stdDeviation="7"/>
	</filter>
	<filter id="kHotCore" x="-30%" y="-30%" width="160%" height="160%">
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.75  0 0 0 1 0"/>
		<feGaussianBlur stdDeviation="2.5"/>
	</filter>
</defs>
<circle cx="${K_CX}" cy="${K_CY}" r="${BS / 2}" fill="url(#kBloom)"/>
<!-- the steady glow under everything -->
<g filter="url(#kLitSoft)" opacity="0.2">${kLitShape}</g>
<!-- the running light -->
<g filter="url(#kHot)" opacity="0.9">${arc(0.62)}
	${wingPath(1, '#ffffff', 'shape', (a) => near(a, 0.5))}${wingPath(-1, '#ffffff', 'shape', (a) => near(a, 0.5))}
	${gemLit ? `<circle cx="${K_CX}" cy="${K_CY - K_RIM - 4}" r="34" fill="#ffffff"/>` : ''}
	${beetleLit ? scarab('#ffffff', '#ffffff', false) : ''}</g>
<g filter="url(#kHotCore)" opacity="0.85">${arc(0.3)}</g>
<!-- a glint at the head of the run -->
<g filter="url(#kHotCore)">
	<path d="M ${hx} ${hy - 30} L ${hx + 6} ${hy - 6} L ${hx + 30} ${hy} L ${hx + 6} ${hy + 6} L ${hx} ${hy + 30} L ${hx - 6} ${hy + 6} L ${hx - 30} ${hy} L ${hx - 6} ${hy - 6} Z" fill="#ffffff"/>
</g>
</svg>`;
};

render(ticker, 'ticker_plate.png', TW);
render(buyBonusScarab, 'buybonus_scarab.png', BS);
render(kLitFrame(0), 'buybonus_scarab_lit.png', BS / 2);
for (let f = 0; f < K_GLOW_FRAMES; f++) {
	render(kLitFrame(f), `buybonus_scarab_lit_${String(f).padStart(2, '0')}.png`, BS / 2);
}
render(buyBonusSun, 'buybonus_sun.png', BS);
render(buyBonusSunLit, 'buybonus_sun_lit.png', BS);
render(buyBonusStone, 'buybonus_stone.png', BS);
render(buyBonusStoneLit, 'buybonus_stone_lit.png', BS);
render(buyBonus, 'buybonus_plate.png', BS);
console.log('ui plates written to', OUT);
