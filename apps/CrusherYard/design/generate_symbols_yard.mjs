// Procedurally drawn Crusher Yard symbols.
//
//   node design/generate_symbols_yard.mjs <dir with node_modules/@resvg/resvg-js>
//   DUMP_SVG=1 also writes the raw SVG next to each PNG.
//
// This is the alternative to AI-generated artwork (see AI_ART_PROMPTS.md). It
// will never reach rendered-3D realism, and it does not try to — what it can do
// is read as a solid object rather than a flat icon, which is the difference
// that actually matters at 98px.
//
// THREE THINGS SELL VOLUME, AND ONLY ONE OF THEM IS A FILTER
//
//  1. SEPARATE FACES. A box drawn as one rounded rect with a vertical gradient
//     is a flat tile no matter how much noise goes over it. Drawn as a top face,
//     a front face and a side face — each with its own base tone, lit from a
//     single agreed direction — it reads as a box immediately. This is most of
//     the work.
//  2. GRADIENTS ACROSS THE FORM AXIS. A cylinder is dark at both edges and
//     bright a third of the way in from the light. That one gradient does more
//     than any amount of texture.
//  3. TEXTURE LAST, AND CLIPPED. The surface passes from surface.mjs (grain,
//     mottle, specular sweep, edge light) go on top, clipped to the silhouette.
//     They stop it looking mathematically clean. They cannot rescue a flat form.
//
// Light is from the UPPER LEFT for every symbol, without exception. A set lit
// from different directions reads as clip art even when each piece is fine.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { surfaceDefs } from './surface.mjs';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_symbols_yard.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/crusherYardSymbols');
fs.mkdirSync(OUT, { recursive: true });

const SIZE = 256;

// ── shared material definitions ─────────────────────────────────────────────
//
// Every symbol gets the same light. `face` builds a three-tone ramp for one
// plane of an object: `lit` is the plane turned toward the light, `mid` the
// plane facing the viewer, `dark` the plane turned away.
const face = (id, lit, mid, dark, x2 = 0.35) => `
	<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="1">
		<stop offset="0" stop-color="${lit}"/>
		<stop offset="0.45" stop-color="${mid}"/>
		<stop offset="1" stop-color="${dark}"/>
	</linearGradient>`;

// A cylinder seen side-on: dark at both edges, a bright band a third in from
// the light, a weak bounce light on the far edge. This single gradient is what
// makes a tube read as round.
const cylinder = (id, edge, mid, hot) => `
	<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="${edge}"/>
		<stop offset="0.18" stop-color="${mid}"/>
		<stop offset="0.34" stop-color="${hot}"/>
		<stop offset="0.62" stop-color="${mid}"/>
		<stop offset="0.88" stop-color="${edge}"/>
		<stop offset="1" stop-color="${mid}"/>
	</linearGradient>`;

const DEFS = `
	${surfaceDefs('sf')}

	${face('steelTop', '#e3eaef', '#aab5bd', '#7c8892')}
	${face('steelFront', '#9aa6ae', '#6d7883', '#3f474d')}
	${face('steelSide', '#6d7883', '#454f58', '#272e34')}

	${face('paintTop', '#ffd97a', '#e0a81f', '#a97a0c')}
	${face('paintFront', '#e8b12a', '#b8850f', '#6f4f06')}
	${face('paintSide', '#a97a0c', '#7a5606', '#432f03')}

	${cylinder('tankBody', '#2d5f74', '#5fa8c4', '#d6f2ff')}
	${cylinder('tankCollar', '#3f474d', '#8d99a3', '#dfe7ec')}
	${cylinder('boreWall', '#0b0f12', '#2a3138', '#4a545c')}

	<radialGradient id="boreFloor" cx="0.42" cy="0.36" r="0.75">
		<stop offset="0" stop-color="#2b3238"/>
		<stop offset="1" stop-color="#07090b"/>
	</radialGradient>

	<!-- Rim light along the upper-left silhouette. Drawn as a blurred copy of
	     the shape offset toward the light and clipped back to it, which is the
	     cheapest thing that separates an object from a dark background. -->
	<filter id="rim" x="-30%" y="-30%" width="160%" height="160%">
		<feDropShadow dx="-3" dy="-3" stdDeviation="2" flood-color="#eaf3f8" flood-opacity="0.9"/>
	</filter>

	<filter id="drop" x="-35%" y="-35%" width="170%" height="170%">
		<feDropShadow dx="3" dy="7" stdDeviation="6" flood-color="#000000" flood-opacity="0.62"/>
	</filter>

	<!-- Grime that settles in recesses. Multiplied over the whole piece and then
	     masked to the shape, so it darkens crevices without tinting the highlights. -->
	<filter id="grime" x="-10%" y="-10%" width="120%" height="120%">
		<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="11"/>
		<feColorMatrix type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.09  0 0 0 0 0.07  0.9 0 0 0 -0.34"/>
	</filter>`;

/**
 * Wrap a symbol's shapes: dark underlay for weight, the drawn body, then the
 * clipped surface passes.
 *
 * `body` is the artwork. `silhouette` is a single path/shape used for the
 * outline underlay and to clip the texture — it must cover the whole object or
 * the texture will run off the edges.
 */
const symbol = (id, silhouette, body) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
	<defs>
		${DEFS}
		<clipPath id="clip${id}">${silhouette}</clipPath>
	</defs>
	<g filter="url(#drop)">
		<!-- outline underlay: a fat dark stroke under everything, so the symbol
		     holds its shape against both the dark recess and a lit win marker -->
		<g fill="#0d1114" stroke="#0d1114" stroke-width="14" stroke-linejoin="round">${silhouette}</g>
		${body}
		<g clip-path="url(#clip${id})">
			<rect width="${SIZE}" height="${SIZE}" filter="url(#sfGrain)" opacity="0.5"/>
			<rect width="${SIZE}" height="${SIZE}" filter="url(#sfMottle)" opacity="0.35"/>
			<rect width="${SIZE}" height="${SIZE}" filter="url(#grime)" opacity="0.55"/>
			<rect width="${SIZE}" height="${SIZE}" filter="url(#sfScratch)" opacity="0.28"/>
			<rect width="${SIZE}" height="${SIZE}" fill="url(#sfSpec)" opacity="0.55"/>
			<rect width="${SIZE}" height="${SIZE}" fill="url(#sfEdge)" opacity="0.8"/>
		</g>
	</g>
</svg>`;

// ── L1: hex nut ─────────────────────────────────────────────────────────────
//
// An extruded hexagon: top face, then the two side faces that stay visible at
// this angle. Drawn as three explicit planes rather than one hexagon with a
// gradient — a gradient across a flat hexagon reads as a sticker.
const NUT = (() => {
	const cx = 128;
	const cy = 112;
	const r = 78;
	const depth = 34;
	const pt = (i) => {
		const a = (Math.PI / 180) * (60 * i - 90);
		return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
	};
	const p = [0, 1, 2, 3, 4, 5].map(pt);
	const top = `M${p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z`;
	// The three lower edges get an extruded wall each.
	const wall = (a, b, fill) =>
		`<path d="M${p[a][0].toFixed(1)} ${p[a][1].toFixed(1)} L${p[b][0].toFixed(1)} ${p[b][1].toFixed(1)} L${p[b][0].toFixed(1)} ${(p[b][1] + depth).toFixed(1)} L${p[a][0].toFixed(1)} ${(p[a][1] + depth).toFixed(1)} Z" fill="${fill}"/>`;
	const silhouette = `<path d="M${p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} L${p[5][0].toFixed(1)} ${(p[5][1] + depth).toFixed(1)} L${p[4][0].toFixed(1)} ${(p[4][1] + depth).toFixed(1)} L${p[3][0].toFixed(1)} ${(p[3][1] + depth).toFixed(1)} L${p[2][0].toFixed(1)} ${(p[2][1] + depth).toFixed(1)} Z"/>`;
	const body = `
		${wall(2, 3, 'url(#steelSide)')}
		${wall(3, 4, 'url(#steelFront)')}
		${wall(4, 5, 'url(#steelFront)')}
		<path d="${top}" fill="url(#steelTop)"/>
		<path d="${top}" fill="none" stroke="#dfe7ec" stroke-width="2.5" opacity="0.5"/>
		<!-- chamfer: a smaller hexagon inset, which is what a real nut has -->
		<path d="${top}" transform="translate(${cx} ${cy}) scale(0.82) translate(${-cx} ${-cy})" fill="none" stroke="#5b656d" stroke-width="3" opacity="0.6"/>
		<!-- bore: wall then floor, so the hole has depth instead of being a black disc -->
		<ellipse cx="${cx}" cy="${cy}" rx="38" ry="36" fill="url(#boreWall)"/>
		<ellipse cx="${cx}" cy="${cy + 5}" rx="32" ry="30" fill="url(#boreFloor)"/>
		<!-- thread ridges catching light on the far wall -->
		${[0, 1, 2, 3]
			.map(
				(i) =>
					`<path d="M${cx - 30} ${cy - 14 + i * 11} q30 ${8 + i} 60 0" fill="none" stroke="#7c8892" stroke-width="2" opacity="${0.34 - i * 0.05}"/>`,
			)
			.join('')}`;
	return { silhouette, body };
})();

// ── H1: engine block ────────────────────────────────────────────────────────
//
// A box in three planes with four open bores on the top face. The bores are
// what identify it, so they are large and clearly recessed.
const ENGINE = (() => {
	const L = 40;
	const R = 216;
	const TOP = 78;
	const BOT = 196;
	const SKEW = 26; // how far the top face runs back
	const silhouette = `<path d="M${L} ${TOP} L${L + SKEW} ${TOP - SKEW} L${R} ${TOP - SKEW} L${R} ${BOT - SKEW} L${R - SKEW} ${BOT} L${L} ${BOT} Z"/>`;
	const body = `
		<!-- front plane -->
		<path d="M${L} ${TOP} L${R - SKEW} ${TOP} L${R - SKEW} ${BOT} L${L} ${BOT} Z" fill="url(#paintFront)"/>
		<!-- right plane, turned away from the light -->
		<path d="M${R - SKEW} ${TOP} L${R} ${TOP - SKEW} L${R} ${BOT - SKEW} L${R - SKEW} ${BOT} Z" fill="url(#paintSide)"/>
		<!-- top plane, turned toward it -->
		<path d="M${L} ${TOP} L${L + SKEW} ${TOP - SKEW} L${R} ${TOP - SKEW} L${R - SKEW} ${TOP} Z" fill="url(#paintTop)"/>
		<!-- cylinder bores, sunk into the top plane -->
		${[0, 1, 2, 3]
			.map((i) => {
				const bx = L + 34 + i * 42;
				const by = TOP - 13;
				return `<ellipse cx="${bx}" cy="${by}" rx="17" ry="9" fill="url(#boreWall)"/>
				<ellipse cx="${bx}" cy="${by + 2}" rx="13" ry="6" fill="url(#boreFloor)"/>
				<ellipse cx="${bx}" cy="${by - 1}" rx="17" ry="9" fill="none" stroke="#ffe9a8" stroke-width="1.6" opacity="0.4"/>`;
			})
			.join('')}
		<!-- cooling ribs: vertical, so they do not fight the horizontal bore row -->
		${[0, 1, 2, 3, 4]
			.map((i) => {
				const rx = L + 22 + i * 30;
				return `<rect x="${rx}" y="${TOP + 22}" width="7" height="${BOT - TOP - 46}" fill="#000000" opacity="0.2"/>
				<rect x="${rx + 7}" y="${TOP + 22}" width="3" height="${BOT - TOP - 46}" fill="#ffe9a8" opacity="0.12"/>`;
			})
			.join('')}
		<!-- sump flange along the bottom -->
		<rect x="${L}" y="${BOT - 22}" width="${R - SKEW - L}" height="12" fill="#3f2c05" opacity="0.55"/>
		<!-- bolt bosses -->
		${[L + 16, R - SKEW - 24].map((bx) => `<circle cx="${bx}" cy="${BOT - 16}" r="6" fill="url(#steelTop)" stroke="#2a1d04" stroke-width="2"/>`).join('')}`;
	return { silhouette, body };
})();

// ── M: nitrogen tank ────────────────────────────────────────────────────────
//
// The only cylinder in the set and the only cyan object in the game. Its
// roundness comes entirely from the cylinder gradient; the collar and valve
// give it a silhouette nothing else shares.
const TANK = (() => {
	const cx = 128;
	const top = 62;
	const bot = 216;
	const rx = 46;
	const silhouette = `<path d="M${cx - rx} ${top + 26} a${rx} 30 0 0 1 ${rx * 2} 0 L${cx + rx} ${bot - 26} a${rx} 30 0 0 1 ${-rx * 2} 0 Z"/>
		<rect x="${cx - 17}" y="26" width="34" height="46" rx="6"/>
		<rect x="${cx - 30}" y="14" width="60" height="20" rx="9"/>`;
	const body = `
		<!-- collar and valve, above the body so the body's cap overlaps them -->
		<rect x="${cx - 30}" y="14" width="60" height="20" rx="9" fill="url(#tankCollar)"/>
		<rect x="${cx - 17}" y="26" width="34" height="46" rx="6" fill="url(#tankCollar)"/>
		<!-- body -->
		<path d="M${cx - rx} ${top + 26} a${rx} 30 0 0 1 ${rx * 2} 0 L${cx + rx} ${bot - 26} a${rx} 30 0 0 1 ${-rx * 2} 0 Z" fill="url(#tankBody)"/>
		<!-- the two painted bands. Drawn as ellipse-capped strips so they wrap the
		     cylinder instead of sitting on it as flat bars. -->
		${[0.36, 0.62]
			.map((f) => {
				const y = top + 26 + (bot - 26 - top - 26) * f;
				return `<path d="M${cx - rx} ${y} a${rx} 13 0 0 0 ${rx * 2} 0 l0 16 a${rx} 13 0 0 1 ${-rx * 2} 0 Z" fill="#0e3b4d" opacity="0.75"/>`;
			})
			.join('')}
		<!-- frost on the lower half: cool haze, not white paint -->
		<path d="M${cx - rx} ${top + 110} L${cx + rx} ${top + 110} L${cx + rx} ${bot - 26} a${rx} 30 0 0 1 ${-rx * 2} 0 Z" fill="#dff4ff" opacity="0.16"/>
		<!-- specular strip, offset left with the light -->
		<path d="M${cx - 26} ${top + 34} q6 60 0 116" fill="none" stroke="#f2fdff" stroke-width="9" opacity="0.4" stroke-linecap="round"/>
		<!-- base ring -->
		<path d="M${cx - rx} ${bot - 40} a${rx} 30 0 0 0 ${rx * 2} 0" fill="none" stroke="#0b2b38" stroke-width="4" opacity="0.6"/>`;
	return { silhouette, body };
})();

const SYMBOLS = { l1: NUT, h1: ENGINE, m: TANK };

for (const [name, { silhouette, body }] of Object.entries(SYMBOLS)) {
	const svg = symbol(name, silhouette, body);
	if (process.env.DUMP_SVG) fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } }).render().asPng();
	fs.writeFileSync(path.join(OUT, `${name}.png`), png);
	console.log(`  ${name}.png`);
}

console.log(`\nwrote ${Object.keys(SYMBOLS).length} symbols to ${OUT}`);
