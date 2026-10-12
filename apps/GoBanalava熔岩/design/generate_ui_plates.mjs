// Bet-bar plate art for GoBananas: the balance/win/bet tickers and the Buy
// Bonus button, matched to the reel housing (olive drill canvas + brass trim +
// rivets) so the whole UI reads as one piece of kit.
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

import { surfaceDefs, finishRect, CANVAS_FINISH, BRASS_FINISH } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi');
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

// ── THE PLATFORM SKIN'S BUY BONUS: a slab of this game's stone ───────────────
//
// The platform skin flattens the whole strip to Hacksaw grey and, left alone,
// gave Buy Bonus the same treatment. That is the one control on the bar that
// should NOT be generic - it is this game's own feature, pressed rarely and
// deliberately, the last thing before a 100x+ spend - so it is made of the pale
// stone the royals are carved into.
//
// At rest it is a clean slab and nothing else. Under the cursor it does exactly
// what a symbol does when the dynamite goes off under it, because that is what
// the button is selling.
//
// Colours, sampled and then lifted. l1.png's stone runs #efe1c5 -> #d0c6b2 ->
// #a59e90; the button is brighter than that on request, and has to be: the
// shared button multiplies a DISABLED plate, and at the royals' own values that
// turned the slab into dark grey rock during every spin.
//
//   slab    #fbf4e4 -> #ebe2cf -> #cfc6b4   l1.png's stone, lifted
//   border  #c8b69e -> #a8937a -> #7e6d58   l1.png's rough outer stone, lifted
//
// A TRANSPARENT MARGIN round both images, so the hover glow has somewhere to go.
// The slab keeps its 640 in the middle; the button draws the whole canvas with
// buyBonusPlateScale = BB_CS / BS, which leaves the slab exactly as large on
// screen while the hover layer gets a ring to glow in. The BOX - what positions
// and hit-tests - is not scaled, so the clickable area is unchanged.
const BB_MARGIN = 80;
const BB_CS = BS + BB_MARGIN * 2;

// The rough outer stone, broken into blocks the way the royals' border is.
const SEAMS = [
	[150, 10, 150, 44], [330, 10, 330, 44], [500, 10, 500, 44],
	[140, 596, 140, 630], [310, 596, 310, 630], [480, 596, 480, 630],
	[10, 170, 44, 170], [10, 360, 44, 360], [10, 500, 44, 500],
	[596, 150, 630, 150], [596, 320, 630, 320], [596, 470, 630, 470],
];

const BB_DEFS = `
	<linearGradient id="stoneFrame" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#c8b69e"/>
		<stop offset="0.5" stop-color="#a8937a"/>
		<stop offset="1" stop-color="#7e6d58"/>
	</linearGradient>
	<linearGradient id="stoneSlab" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#fbf4e4"/>
		<stop offset="0.5" stop-color="#ebe2cf"/>
		<stop offset="1" stop-color="#cfc6b4"/>
	</linearGradient>
	<filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
		<feGaussianBlur stdDeviation="7"/>
	</filter>
	<filter id="halo" x="-20%" y="-20%" width="140%" height="140%">
		<feGaussianBlur stdDeviation="24"/>
	</filter>
	<!-- The grain filters return their result as a SQUARE, not in the shape of
	     the rect they are applied to, so without this the plate sat on faint
	     dark corners (alpha 71 measured outside the rounded edge). -->
	<clipPath id="plateClip">
		<rect x="6" y="6" width="${BS - 12}" height="${BS - 12}" rx="74"/>
	</clipPath>
	<clipPath id="slabClip">
		<rect x="44" y="44" width="${BS - 88}" height="${BS - 88}" rx="44"/>
	</clipPath>`;

const buyBonusStone = `<svg xmlns="http://www.w3.org/2000/svg" width="${BB_CS}" height="${BB_CS}" viewBox="0 0 ${BB_CS} ${BB_CS}">
<defs>${DEFS}${BB_DEFS}</defs>
<g transform="translate(${BB_MARGIN} ${BB_MARGIN})">
<g clip-path="url(#plateClip)">
<!-- the rough stone border the royals sit in -->
<rect x="10" y="10" width="${BS - 20}" height="${BS - 20}" rx="70" fill="url(#stoneFrame)" stroke="#3a3024" stroke-width="7"/>
${finishRect(10, 10, BS - 20, BS - 20, 70, 'sf', { grain: 0.8, mottle: 0.6, spec: 0.08, edge: 0.9, ao: 0.4 })}
${SEAMS.map(([a, b, c, d]) => `<path d="M ${a} ${b} L ${c} ${d}" stroke="#4a3e30" stroke-width="5" opacity="0.6"/>`).join('')}
<!-- the slab, clean: lit from the upper left like every other object here -->
<rect x="44" y="44" width="${BS - 88}" height="${BS - 88}" rx="44" fill="url(#stoneSlab)"/>
${finishRect(44, 44, BS - 88, BS - 88, 44, 'sf', { grain: 0.45, mottle: 0.35, spec: 0.1, edge: 0.5, ao: 0.25 })}
<!-- bevel: a lit lip on the top-left, a shadowed step on the bottom-right -->
<path d="M 60 ${BS - 110} L 60 88 Q 60 60 88 60 L ${BS - 110} 60" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.85" stroke-linecap="round"/>
<path d="M 90 ${BS - 58} L ${BS - 88} ${BS - 58} Q ${BS - 58} ${BS - 58} ${BS - 58} ${BS - 88} L ${BS - 58} 90" fill="none" stroke="#7a7062" stroke-width="6" opacity="0.6" stroke-linecap="round"/>
</g>
</g>
</svg>`;

// THE HOVER LAYER: THE SAME THING THE DYNAMITE DOES TO A SYMBOL.
//
// Copied from ReelBlast.svelte's CHARGE beat rather than invented, because the
// button is advertising that exact moment. Two things happen there, and the
// first is what makes the second work:
//
//   the cell DARKENS      0x140d05 at up to 0.5 alpha - "pressure building in
//                         the rock", and the reason bright cracks read at all
//   cracks CRAZE OUTWARD  from the cell's centre along the seams the shards
//                         will break along: seven of them, each two segments
//                         with a kink, #ffd8a2, 2.2px on a 140px cell
//
// An earlier pass here drew dark fractures spreading inward from two corner
// impacts. It was a decent picture of cracked stone and it was not this game's
// crack: wrong origin, wrong direction, wrong colour, and dark where the game's
// are lit. Scaled to the 640 slab, the game's 2.2px line is 10px and its 0.46
// reach is 294px from the centre.
//
// This layer is composited NORMALLY (buyBonusHoverSpriteBlend), not additively,
// which is what lets it carry the darkening. Additive could only brighten, and
// on this pale stone a bright line alone is close to invisible - which is
// exactly why the game darkens the cell first.
const SHARDS_PER_CELL = 7;
const SLAB_C = BS / 2;
const CRACK_REACH = BS * 0.46;
let bbSeed = 91733;
const bbRand = () => {
	bbSeed = (bbSeed * 16807) % 2147483647;
	return bbSeed / 2147483647;
};
// Each seam is walked outward in short steps that wander a little, narrowing as
// they go, and throws one or two branches on the way. The first pass drew them
// as single straight strokes of even width, which at button size read as a
// STARBURST OF BEAMS rather than as broken rock - the kink the game applies is
// invisible once there is only one of it, and a crack that does not taper or
// branch is a light ray.
const walk = (x0, y0, ang, len, steps) => {
	const pts = [[x0, y0]];
	let x = x0;
	let y = y0;
	let a = ang;
	for (let k = 0; k < steps; k++) {
		a += (bbRand() - 0.5) * 0.34;
		const d = len / steps;
		x += Math.cos(a) * d;
		y += Math.sin(a) * d;
		pts.push([x, y]);
	}
	return { pts, ang: a };
};
const strokes = [];
Array.from({ length: SHARDS_PER_CELL }).forEach((_, i) => {
	const a0 = (i / SHARDS_PER_CELL) * Math.PI * 2;
	// shardsOf's spin is (rand - 0.5) * 3.4 and the kink is spin * 0.06
	const kink = (bbRand() - 0.5) * 3.4 * 0.06;
	const reach = CRACK_REACH * (0.8 + 0.2 * bbRand());
	const main = walk(SLAB_C, SLAB_C, a0 + kink, reach, 5);
	strokes.push({ pts: main.pts, w0: 11, w1: 2.5 });
	// branches, thinner and shorter, leaving part way along
	const n = 1 + Math.round(bbRand());
	for (let b = 0; b < n; b++) {
		const at = 1 + Math.floor(bbRand() * (main.pts.length - 2));
		const [bx, by] = main.pts[at];
		const side = bbRand() > 0.5 ? 1 : -1;
		const br = walk(bx, by, a0 + kink + side * (0.5 + bbRand() * 0.5), reach * (0.22 + 0.2 * bbRand()), 3);
		strokes.push({ pts: br.pts, w0: 5, w1: 1.2 });
	}
});

// tapered: each step is its own stroke, narrowing toward the tip
const crackLayer = (scale, color, opacity, filter) =>
	strokes
		.map(({ pts, w0, w1 }) =>
			pts
				.slice(1)
				.map((p, k) => {
					const t = k / Math.max(1, pts.length - 2);
					const w = (w0 + (w1 - w0) * t) * scale;
					return `<line x1="${pts[k][0].toFixed(1)}" y1="${pts[k][1].toFixed(1)}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="${color}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" opacity="${opacity}"${filter ? ` filter="url(#${filter})"` : ''}/>`;
				})
				.join(''),
		)
		.join('');

const buyBonusStoneLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BB_CS}" height="${BB_CS}" viewBox="0 0 ${BB_CS} ${BB_CS}">
<defs>${BB_DEFS}</defs>
<!-- the glow round the slab, spilling onto whatever is behind the button -->
<rect x="${BB_MARGIN + 10}" y="${BB_MARGIN + 10}" width="${BS - 20}" height="${BS - 20}" rx="70"
      fill="none" stroke="#ff8a2a" stroke-width="54" opacity="0.42" filter="url(#halo)"/>
<rect x="${BB_MARGIN + 10}" y="${BB_MARGIN + 10}" width="${BS - 20}" height="${BS - 20}" rx="70"
      fill="none" stroke="#ffb040" stroke-width="12" opacity="0.5" filter="url(#soft)"/>
<g transform="translate(${BB_MARGIN} ${BB_MARGIN})">
<g clip-path="url(#slabClip)">
<!-- the rock under pressure, the game's own colour and a little under its 0.5 -->
<rect x="44" y="44" width="${BS - 88}" height="${BS - 88}" fill="#140d05" opacity="0.42"/>
<!-- heat gathering at the centre, where the break will start -->
<circle cx="${SLAB_C}" cy="${SLAB_C}" r="170" fill="#ff8a2a" opacity="0.14" filter="url(#halo)"/>
${crackLayer(1.9, '#ff7a10', 0.3, 'soft')}
${crackLayer(1, '#ffd8a2', 0.92)}
${crackLayer(0.34, '#fff6e0', 0.85)}
</g>
</g>
</svg>`;

render(buyBonusStone, 'buybonus_stone.png', BB_CS);
render(buyBonusStoneLit, 'buybonus_stone_lit.png', BB_CS);

render(ticker, 'ticker_plate.png', TW);
render(buyBonus, 'buybonus_plate.png', BS);
console.log('ui plates written to', OUT);
