// Win-tier plaques for Go Bananaut: gunmetal-framed panels holding a piece of sky,
// with the tier name baked in, one per win level. The amount is drawn by the
// frontend inside the plate's dark centre (see Win.svelte), so these stay
// language-neutral apart from the tier name, which is the standard English slot
// vocabulary.
// Usage: node design/generate_win_banners.mjs <dir with node_modules for @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_win_banners.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

import { surfaceDefs, finishRect } from './surface.mjs';
import {
	PLATE_DEFS,
	hexStuds,
	satellite,
	starfield,
	galaxyBand,
	nebula,
	planetLimb,
	shootingStar,
} from './plate_parts.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasWinBanners');

// The game's display face, self-hosted alongside the runtime copy the bet bar
// uses (game/fonts.ts). Baked headline art and live Text have to be the same
// typeface or the banner reads as a different game to the amount inside it.
const FONT_DIR = path.join(appRoot, 'static/fonts');
const BANNER_FONT = 'Titan One';
// Measured rather than assumed: the widest tier name (SUPER WIN) inks 727px at
// this size, and the clear space inside the frame is 840px.
const TIER_SIZE = 128;
fs.mkdirSync(OUT, { recursive: true });

const W = 1000;
const H = 560;

// A FINISH WITHOUT THE BRUSH. STEEL_FINISH is right for a frame and wrong for a
// sky: its brushed pass lays straight parallel streaks across the plate, and
// across a nebula they read as scan lines. Grain and mottle give the face a
// surface without it.
const PLATE_FINISH = { grain: 0.45, mottle: 0.5, spec: 0.35, edge: 0.6, ao: 0.3 };

// THE PLAQUES ARE PIECES OF SKY IN A GUNMETAL FRAME.
//
// They were olive drill canvas with a brass frame and a ring of rivets — Go
// Bananas 100's army look — and then, for one pass, a control panel: the same
// frame with a band of status lights round the edge in ice, white and signal
// yellow. That was rejected, correctly. The frame is what holds the picture, and
// a ring of saturated colour round it competes with the picture.
//
// So the frame carries NO colour: dark steel, a lit edge, hex bolts and a
// satellite over the top edge. All the space is on the face — a starfield in
// three depths, a galaxy band behind it, a nebula tinted to the tier and, on the
// tiers that earn it, something happening in the sky.
//
// The five tiers climb the sky in heat and rarity, the way Go Bananubis' climb
// through the stones an Egyptian jeweller worked:
//
//   big        deep space     ultramarine, a planet's edge below, a pale galaxy
//   superwin   teal nebula    a cold cloud, lit from within
//   mega       violet nebula  a warmer cloud, and a shooting star
//   epic       black hole     obsidian with a ring of amber falling in
//   max        supernova      the one plate made of gold, rayed, lettered in navy
//
// LAYOUT IS UNCHANGED, because Win.svelte draws the amount into it: tier name
// baseline at 230, the dark well at y 286..456. The bright stars stay out of
// both; the faint ones do not, because a sky with a hole cut out for the type is
// what a placard looks like.
const TIERS = {
	big: { text: 'BIG WIN', a: '#1d3f7a', b: '#050b1c', ink: '#0a1634', sky: 'deep' },
	superwin: { text: 'SUPER WIN', a: '#157f8c', b: '#03242c', ink: '#052e36', sky: 'teal' },
	mega: { text: 'MEGA WIN', a: '#5a34b8', b: '#120a38', ink: '#150a38', sky: 'violet' },
	epic: { text: 'EPIC WIN', a: '#2a2a34', b: '#040406', ink: '#0a0a0e', sky: 'hole' },
	max: { text: 'MAX WIN', a: '#ffe08a', b: '#a8761a', ink: '#5e4210', sky: 'nova', gold: true },
};

// where the frontend draws the tier name and the amount
const KEEP_OUT = [
	{ x: 130, y: 104, w: 740, h: 150 },
	{ x: 120, y: 284, w: 760, h: 174 },
];
const FIELD = { x0: 38, y0: 38, x1: W - 38, y1: H - 38 };

const SKY = {
	deep: () =>
		planetLimb({ cx: 500, cy: 790, rx: 700, ry: 292, rim: '#8fb4ff', body: '#03060e' }) +
		nebula(140, 170, 130, 80, '#3f7cff', 0.3) +
		nebula(870, 300, 110, 80, '#5a8cff', 0.24) +
		galaxyBand({ cx: 470, cy: 250, rx: 520, ry: 74, angle: -14, colour: '#cfe0ff', seed: 11, strength: 0.13 }) +
		starfield({ ...FIELD, seed: 101, keepOut: KEEP_OUT }),

	teal: () =>
		planetLimb({ cx: 500, cy: 800, rx: 720, ry: 300, rim: '#56f0dc', body: '#02171b' }) +
		nebula(150, 160, 130, 80, '#56f0dc', 0.34) +
		nebula(860, 250, 120, 84, '#2fc4d6', 0.32) +
		nebula(500, 470, 320, 50, '#0a2a30', 0.4) +
		galaxyBand({ cx: 520, cy: 260, rx: 540, ry: 76, angle: 12, colour: '#bffcf3', seed: 12, strength: 0.14 }) +
		starfield({ ...FIELD, seed: 202, keepOut: KEEP_OUT }),

	violet: () =>
		nebula(860, 150, 140, 90, '#b48cff', 0.42) +
		nebula(140, 300, 130, 96, '#8a5cff', 0.38) +
		nebula(520, 500, 300, 60, '#2a1466', 0.5) +
		galaxyBand({ cx: 480, cy: 240, rx: 520, ry: 70, angle: -20, colour: '#e6dcff', seed: 13, strength: 0.14 }) +
		starfield({ ...FIELD, seed: 303, keepOut: KEEP_OUT }) +
		shootingStar(238, 112, 150, 12, '#efe6ff') +
		shootingStar(900, 226, 96, 22, '#efe6ff'),

	hole: () =>
		`<!-- the accretion ring, behind the well: what shows is the two arms either
	     side of it, which is exactly how a lensed ring looks -->
	<ellipse cx="500" cy="358" rx="452" ry="64" fill="none" stroke="#ffd75e" stroke-width="9" opacity="0.42" filter="url(#spSoft)"/>
	<ellipse cx="500" cy="358" rx="452" ry="64" fill="none" stroke="#ffe9a8" stroke-width="3" opacity="0.7"/>
	<ellipse cx="500" cy="358" rx="420" ry="56" fill="none" stroke="#ffb020" stroke-width="2" opacity="0.5"/>` +
		galaxyBand({ cx: 500, cy: 200, rx: 480, ry: 60, angle: -8, colour: '#ffe7b0', seed: 14, strength: 0.08, dust: 70 }) +
		starfield({ ...FIELD, seed: 404, far: 100, mid: 30, near: 6, keepOut: KEEP_OUT }),

	nova: () => {
		// rays from the middle of the plate, alternating wide and thin
		const cx = 500;
		const cy = 300;
		let out = '';
		for (let i = 0; i < 28; i++) {
			const a0 = (i / 28) * Math.PI * 2;
			const a1 = a0 + (Math.PI * 2) / 28 / (i % 2 ? 3 : 1.6);
			const R = 900;
			out += `<polygon points="${cx},${cy} ${(cx + Math.cos(a0) * R).toFixed(1)},${(cy + Math.sin(a0) * R).toFixed(1)} ${(cx + Math.cos(a1) * R).toFixed(1)},${(cy + Math.sin(a1) * R).toFixed(1)}" fill="#fff9dc" opacity="${i % 2 ? 0.18 : 0.3}"/>`;
		}
		// the stars here are WHITE-GOLD sparks on a gold ground; ordinary starlight
		// would vanish on it
		return out + starfield({ ...FIELD, seed: 505, far: 60, mid: 26, near: 8, keepOut: KEEP_OUT }).replace(/#(dfe9ff|cfe3ff|e8f1ff)/g, '#ffffff');
	},
};

const banner = ({ text, a, b, ink, sky, gold }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
${surfaceDefs('sf')}
${PLATE_DEFS}
	<linearGradient id="plate" x1="0" y1="0" x2="0.3" y2="1">
		<stop offset="0" stop-color="${a}"/>
		<stop offset="1" stop-color="${b}"/>
	</linearGradient>
	<clipPath id="plateClip"><rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="30"/></clipPath>
	<linearGradient id="tierFace" x1="0" y1="0" x2="0" y2="1">
		${gold
			? '<stop offset="0" stop-color="#6c98ee"/><stop offset="0.5" stop-color="#2d56b8"/><stop offset="1" stop-color="#132c70"/>'
			: '<stop offset="0" stop-color="#fffbe8"/><stop offset="0.45" stop-color="#ffd75e"/><stop offset="1" stop-color="#c9821a"/>'}
	</linearGradient>
	<radialGradient id="inner" cx="0.5" cy="0.62" r="0.7">
		<stop offset="0" stop-color="#000000" stop-opacity="${gold ? 0.72 : 0.6}"/>
		<stop offset="1" stop-color="#000000" stop-opacity="${gold ? 0.5 : 0.2}"/>
	</radialGradient>
	<radialGradient id="sheen" cx="0.35" cy="0.2" r="0.8">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</radialGradient>
	<!-- the sky darkens toward the edges, so the frame has a ground to sit on -->
	<radialGradient id="edgeFall" cx="0.5" cy="0.5" r="0.75">
		<stop offset="0.6" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="${gold ? 0.3 : 0.5}"/>
	</radialGradient>
</defs>
<!-- the sky -->
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="30" fill="url(#plate)" stroke="#0b1015" stroke-width="8"/>
${finishRect(34, 34, W - 68, H - 68, 30, 'sf', PLATE_FINISH)}
<g clip-path="url(#plateClip)">
${SKY[sky]()}
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="url(#sheen)"/>
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="url(#edgeFall)"/>
</g>
<!-- the frame: a gunmetal setting, a dark groove, a fine inner line. No colour. -->
<rect x="44" y="44" width="${W - 88}" height="${H - 88}" rx="24" fill="none" stroke="url(#spSteel)" stroke-width="10"/>
<rect x="52" y="52" width="${W - 104}" height="${H - 104}" rx="18" fill="none" stroke="#070b0e" stroke-width="7" opacity="0.85"/>
<rect x="66" y="66" width="${W - 132}" height="${H - 132}" rx="12" fill="none" stroke="url(#spSteel)" stroke-width="4"/>
<rect x="72" y="72" width="${W - 144}" height="${H - 144}" rx="10" fill="none" stroke="#000000" stroke-width="2" opacity="0.5"/>
${hexStuds(
	[
		[66, 66],
		[W - 66, 66],
		[66, H - 66],
		[W - 66, H - 66],
	],
	20,
)}
${satellite(W / 2, 46, 1)}
<!-- dark centre well where the amount rolls -->
<rect x="120" y="286" width="${W - 240}" height="170" rx="20" fill="url(#inner)"/>
<rect x="120" y="286" width="${W - 240}" height="170" rx="20" fill="none" stroke="url(#spSteel)" stroke-width="4"/>
<!-- Tier name in the game's display face. Titan One is single-weight, so no
     font-weight is requested — asking for 900 risks resvg failing the match and
     silently substituting a system face. -->
<text x="${W / 2 + 5}" y="235" font-family="${BANNER_FONT}" font-size="${TIER_SIZE}" text-anchor="middle" fill="#000000" opacity="0.55">${text}</text>
<text x="${W / 2}" y="230" font-family="${BANNER_FONT}" font-size="${TIER_SIZE}" text-anchor="middle" fill="url(#tierFace)" stroke="${gold ? '#fff3c4' : ink}" stroke-width="7" paint-order="stroke">${text}</text>
</svg>`;

for (const [alias, tier] of Object.entries(TIERS)) {
	// DUMP_SVG=1 writes each plate's SVG beside its PNG, for bisecting a renderer
	// panic or diffing a change.
	if (process.env.DUMP_SVG) fs.writeFileSync(path.join(OUT, `${alias}.debug.svg`), banner(tier));
	const resvg = new Resvg(banner(tier), {
		fitTo: { mode: 'width', value: W },
		font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Titan One' },
	});
	fs.writeFileSync(path.join(OUT, `${alias}.png`), resvg.render().asPng());
	console.log('rendered', `${alias}.png`);
}
console.log('win banners written to', OUT);
