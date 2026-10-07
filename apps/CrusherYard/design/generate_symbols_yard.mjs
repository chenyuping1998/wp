// Crusher Yard symbols, drawn as ink illustration.
//
//   node design/generate_symbols_yard.mjs <dir with node_modules/@resvg/resvg-js>
//   DUMP_SVG=1 also writes the raw SVG beside each PNG.
//
// SUBJECT CHOICE
//
// Things that are FUN TO CRUSH, and no two from the same category. An earlier
// set was an engine block, a television and a washing machine — three boxy
// appliances, which meant three variations on one silhouette before a single
// line was drawn. A scrapyard press is funny, and a piano, a jukebox, a
// gumball machine and a toilet are funny going into one; an appliance is not.
//
// RANK BEFORE IDENTITY
//
// The high four are warm and carry a gold rim inside the contour; the low four
// are cool and carry none. That reads as "worth more" at a glance, before any
// individual shape has been recognised — which is the order a player actually
// needs. Hue then separates symbols WITHIN each family. See comic.mjs.
//
// SILHOUETTE IS THE WHOLE JOB
//
// Read at 98px, colour tells rank and the outline tells identity; interior
// detail is mush. So the ten are ten different outlines: long-and-low, wing,
// arch, sphere-on-stem, ribbed cylinder, slanted basket, pedestal curve,
// triangle, split bar, capsule. If two blur together on the contact sheet, the
// fix is the SHAPE.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { INK, INK_LINE, RIM, HUE, WEIGHT, inked, line, halftoneDefs, halftone, printDefs } from './comic.mjs';

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

/** Warm rim inside the contour — the high-symbol rank marker. */
const rim = (shape) => line(shape, 4, RIM, 0.75);

// ── H1 Muscle car ───────────────────────────────────────────────────────────
// Long and low. The only wide horizontal outline, and the most valuable thing
// in the yard, so it takes the top slot.
const h1 = () => {
	const c = HUE.crimson;
	const body = `<path d="M18 168 L26 132 L74 128 L102 92 L176 92 L200 130 L240 138 L242 168 Z"/>`;
	const sil = body + `<circle cx="72" cy="170" r="30"/><circle cx="192" cy="170" r="30"/>`;
	return {
		sil,
		art:
			inked(sil, c.base) +
			`<g fill="${c.light}"><path d="M18 168 L26 132 L74 128 L102 92 L176 92 L186 104 L96 108 L70 140 L22 146 Z"/></g>` +
			`<g fill="${c.shade}"><path d="M40 152 L240 150 L242 168 L18 168 Z"/></g>` +
			// glasshouse: one dark shape, one hard glare bar
			`<g stroke="${INK_LINE}" stroke-width="7" fill="${INK}"><path d="M108 100 L172 100 L190 128 L84 130 Z"/></g>` +
			`<path d="M116 102 L134 102 L106 128 L90 128 Z" fill="#ffffff" opacity="0.22"/>` +
			// wheels: tyre, then a bright rim
			`<g stroke="${INK_LINE}" stroke-width="8" fill="${INK}"><circle cx="72" cy="170" r="30"/><circle cx="192" cy="170" r="30"/></g>` +
			`<g stroke="${INK_LINE}" stroke-width="5" fill="${HUE.porcelain.base}"><circle cx="72" cy="170" r="14"/><circle cx="192" cy="170" r="14"/></g>` +
			// scoop and side crease
			line(`<path d="M112 118 h48"/>`, WEIGHT.detail, INK_LINE, 0.7) +
			line(`<path d="M26 148 L240 146"/>`, WEIGHT.detail, INK_LINE, 0.55) +
			rim(body),
	};
};

// ── H2 Grand piano ──────────────────────────────────────────────────────────
// The wing outline plus a black-and-white keyboard strip. The keys are the
// identifier and survive being shrunk further than anything else here.
const h2 = () => {
	const c = HUE.gold;
	const lid = `<path d="M30 118 L44 76 Q140 46 226 96 Q234 126 196 140 L60 148 Z"/>`;
	const kb = `<path d="M30 118 L196 106 L200 140 L34 154 Z"/>`;
	const sil = lid + kb + `<path d="M52 152 h14 v46 h-14 Z"/><path d="M176 140 h14 v46 h-14 Z"/>`;
	return {
		sil,
		art:
			inked(sil, c.base) +
			`<g fill="${c.light}"><path d="M44 76 Q140 46 226 96 Q200 78 130 74 Q70 74 44 96 Z"/></g>` +
			`<g fill="${c.shade}"><path d="M60 148 L196 140 Q234 126 226 96 Q214 128 180 132 Z"/></g>` +
			// legs
			`<g fill="${c.shade}"><path d="M52 152 h14 v46 h-14 Z"/><path d="M176 140 h14 v46 h-14 Z"/></g>` +
			// keyboard: ink bed, white keys, black keys
			`<g stroke="${INK_LINE}" stroke-width="7" fill="${INK}">${kb}</g>` +
			`<g fill="#f6f2e6">${Array.from({ length: 13 }, (_, i) => `<path d="M${40 + i * 12} ${118 - i * 0.6} l10 -0.8 l1 30 l-10 0.9 Z"/>`).join('')}</g>` +
			`<g fill="${INK}">${[0, 1, 3, 4, 5, 7, 8, 10, 11].map((i) => `<path d="M${47 + i * 12} ${117 - i * 0.6} l6 -0.5 l0.6 17 l-6 0.5 Z"/>`).join('')}</g>` +
			rim(lid),
	};
};

// H3 Jukebox is assembled further down, next to the other specials-by-hand.

// ── H4 Gumball machine ──────────────────────────────────────────────────────
// A sphere on a stem: the only round-on-a-pedestal outline in the set.
const h4 = () => {
	const c = HUE.orange;
	const sil =
		`<circle cx="128" cy="106" r="66"/>` +
		`<path d="M84 158 h88 l16 34 h-120 Z"/>` +
		`<path d="M62 192 h132 v26 h-132 Z"/>` +
		`<rect x="112" y="34" width="32" height="20" rx="6"/>`;
	return {
		sil,
		art:
			inked(sil, c.base) +
			// glass globe: dark interior so the gumballs read, hard crescent glare
			`<g stroke="${INK_LINE}" stroke-width="8" fill="${HUE.steelblue.deep}"><circle cx="128" cy="106" r="66"/></g>` +
			[[104, 88, HUE.crimson.base], [148, 84, HUE.gold.base], [128, 118, HUE.teal.base], [96, 126, HUE.magenta.base], [160, 122, HUE.cyan.base], [130, 66, HUE.porcelain.base], [166, 100, HUE.crimson.light]]
				.map(([x, y, f]) => `<circle cx="${x}" cy="${y}" r="17" fill="${f}" stroke="${INK_LINE}" stroke-width="4"/>`)
				.join('') +
			`<path d="M84 82 a66 66 0 0 1 34 -28 a66 66 0 0 0 -24 42 Z" fill="#ffffff" opacity="0.42"/>` +
			// base
			`<g fill="${c.light}"><path d="M84 158 h88 l6 12 h-100 Z"/></g>` +
			`<g fill="${c.shade}"><path d="M62 192 h132 v26 h-132 Z"/></g>` +
			`<g stroke="${INK_LINE}" stroke-width="6" fill="${HUE.gold.base}"><circle cx="128" cy="180" r="13"/></g>` +
			`<g fill="${c.light}"><rect x="112" y="34" width="32" height="20" rx="6"/></g>` +
			rim(`<path d="M84 158 h88 l16 34 h-120 Z"/><path d="M62 192 h132 v26 h-132 Z"/>`),
	};
};

// ── L1 Oil drum ─────────────────────────────────────────────────────────────
const l1 = () => {
	const c = HUE.steelblue;
	const sil = `<path d="M72 66 a56 18 0 0 1 112 0 v124 a56 18 0 0 1 -112 0 Z"/>`;
	return {
		sil,
		art:
			inked(sil, c.base) +
			`<path d="M88 70 v122 a56 18 0 0 0 16 14 v-138 a56 18 0 0 1 -16 2 Z" fill="${c.light}"/>` +
			`<path d="M152 68 v138 a56 18 0 0 0 32 -16 v-122 a56 18 0 0 1 -32 0 Z" fill="${c.shade}"/>` +
			// two rolling ribs — the drum's identifier
			[104, 152]
				.map(
					(y) =>
						`<path d="M72 ${y} a56 18 0 0 0 112 0 v14 a56 18 0 0 1 -112 0 Z" fill="${c.deep}" stroke="${INK_LINE}" stroke-width="5"/>`,
				)
				.join('') +
			`<g stroke="${INK_LINE}" stroke-width="7" fill="${c.light}"><ellipse cx="128" cy="66" rx="56" ry="18"/></g>` +
			`<g stroke="${INK_LINE}" stroke-width="5" fill="${c.shade}"><ellipse cx="106" cy="64" rx="13" ry="6"/></g>`,
	};
};

// ── L2 Shopping trolley ─────────────────────────────────────────────────────
// A slanted mesh basket. The only symbol whose interior is a grid, which makes
// it read even when the wheels vanish at small size.
const l2 = () => {
	const c = HUE.teal;
	const basket = `<path d="M44 82 L216 66 L196 168 L66 168 Z"/>`;
	const sil = basket + `<path d="M20 56 h30 l6 22 h-32 Z"/>`;
	return {
		sil,
		art:
			inked(sil, c.base) +
			`<g fill="${c.light}"><path d="M44 82 L216 66 L212 88 L46 100 Z"/></g>` +
			`<g fill="${c.shade}"><path d="M66 168 L196 168 L202 134 L62 138 Z"/></g>` +
			// mesh
			line(
				Array.from({ length: 6 }, (_, i) => `<path d="M${62 + i * 26} 84 L${76 + i * 22} 166"/>`).join('') +
					Array.from({ length: 3 }, (_, i) => `<path d="M${50 + i * 4} ${104 + i * 26} L${212 - i * 5} ${90 + i * 26}"/>`).join(''),
				WEIGHT.detail,
				INK_LINE,
				0.65,
			) +
			// handle bar
			`<g stroke="${INK_LINE}" stroke-width="10" fill="none"><path d="M22 60 L44 78"/></g>` +
			`<g stroke="${c.light}" stroke-width="5" fill="none"><path d="M24 62 L42 78"/></g>` +
			// wheels
			`<g stroke="${INK_LINE}" stroke-width="6" fill="${INK}"><circle cx="82" cy="188" r="17"/><circle cx="184" cy="188" r="17"/></g>` +
			`<g fill="${c.light}"><circle cx="82" cy="188" r="6"/><circle cx="184" cy="188" r="6"/></g>`,
	};
};

// ── L3 Toilet ───────────────────────────────────────────────────────────────
// Cistern box over a bowl curve. Nothing else in the set has that stepped
// profile, and it is the most satisfying thing on the board to see crushed.
const l3 = () => {
	const c = HUE.porcelain;
	const cistern = `<path d="M62 40 h108 a10 10 0 0 1 10 10 v56 h-128 v-56 a10 10 0 0 1 10 -10 Z"/>`;
	const bowl = `<path d="M60 106 h132 l-12 42 q-6 34 -52 34 q-46 0 -52 -34 Z"/>`;
	const foot = `<path d="M96 182 h64 l10 32 h-84 Z"/>`;
	const sil = cistern + bowl + foot;
	return {
		sil,
		art:
			inked(sil, c.base) +
			`<g fill="${c.light}"><path d="M62 40 h108 a10 10 0 0 1 10 10 v12 h-128 v-12 a10 10 0 0 1 10 -10 Z"/><path d="M60 106 h60 l-6 42 q-3 30 -20 34 q-28 -6 -34 -34 Z"/></g>` +
			`<g fill="${c.shade}"><path d="M150 106 h42 l-12 42 q-6 34 -52 34 q34 -10 40 -36 Z"/><path d="M150 40 h20 a10 10 0 0 1 10 10 v56 h-30 Z"/></g>` +
			// seat ring
			`<g stroke="${INK_LINE}" stroke-width="7" fill="${c.deep}"><ellipse cx="126" cy="118" rx="56" ry="17"/></g>` +
			`<g stroke="${INK_LINE}" stroke-width="5" fill="${INK}"><ellipse cx="126" cy="120" rx="38" ry="10"/></g>` +
			// flush lever
			`<g stroke="${INK_LINE}" stroke-width="5" fill="${HUE.steelblue.base}"><rect x="168" y="56" width="22" height="9" rx="4"/></g>` +
			line(`<path d="M96 182 h64"/>`, WEIGHT.plane),
	};
};

// ── L4 Traffic cone ─────────────────────────────────────────────────────────
// The only triangle. Reflective bands give it two hard horizontal breaks, so
// it never reads as a plain wedge.
const l4 = () => {
	const c = HUE.indigo;
	const cone = `<path d="M128 32 L182 186 L74 186 Z"/>`;
	const base = `<path d="M52 186 h152 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-152 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10 Z"/>`;
	const sil = cone + base;
	return {
		sil,
		art:
			inked(sil, c.base) +
			`<g fill="${c.light}"><path d="M128 32 L152 100 L128 100 L112 186 L74 186 Z"/></g>` +
			`<g fill="${c.shade}"><path d="M152 100 L182 186 L146 186 Z"/></g>` +
			// reflective bands, clipped to the cone so they follow its taper
			`<clipPath id="coneClip">${cone}</clipPath>` +
			`<g clip-path="url(#coneClip)">` +
			`<rect x="40" y="92" width="180" height="26" fill="${HUE.porcelain.light}"/>` +
			`<rect x="40" y="138" width="180" height="22" fill="${HUE.porcelain.light}"/>` +
			`</g>` +
			line(cone, WEIGHT.plane) +
			`<g fill="${c.shade}"><path d="M52 206 h162 a10 10 0 0 1 -10 18 h-152 a10 10 0 0 1 -10 -10 Z"/></g>` +
			line(base, WEIGHT.plane),
	};
};

// ── S The Crusher (scatter) ─────────────────────────────────────────────────
// Hazard yellow and black: outside both the warm and the cool family, and the
// brightest thing on the board, because it is the thing being hunted.
const s = () => {
	const c = HUE.hazard;
	const ram = (y, h) =>
		[70, 128, 186].map((x) => `<rect x="${x - 13}" y="${y}" width="26" height="${h}" rx="5"/>`).join('');
	const jawTop = `<path d="M22 46 h212 v40 h-30 v22 h-152 v-22 h-30 Z"/>`;
	const jawBot = `<path d="M22 210 h212 v-40 h-30 v-22 h-152 v22 h-30 Z"/>`;
	const sil = ram(14, 34) + jawTop + jawBot + ram(208, 34);
	const stripes = (y, h) =>
		[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${40 + i * 26} ${y + h} l${h} ${-h}"/>`).join('');
	return {
		sil,
		art:
			`<g opacity="0.5">${halftone(`<circle cx="128" cy="128" r="124"/><circle cx="128" cy="128" r="86" fill="black"/>`, c.light, 'light')}</g>` +
			inked(sil, c.base) +
			`<g fill="#b9c4cf">${ram(14, 34)}${ram(208, 34)}</g>` +
			`<g fill="#e6edf3">${[70, 128, 186].map((x) => `<rect x="${x - 13}" y="14" width="9" height="34" rx="4"/>`).join('')}</g>` +
			`<g fill="${c.light}"><path d="M22 46 h212 v14 h-212 Z"/></g>` +
			`<g fill="${c.shade}"><path d="M22 72 h212 v14 h-30 v22 h-152 v-22 h-30 Z"/><path d="M22 196 h212 v14 h-212 Z"/></g>` +
			`<clipPath id="sJaw">${jawTop}${jawBot}</clipPath>` +
			`<g clip-path="url(#sJaw)"><g stroke="${INK_LINE}" stroke-width="11" fill="none" opacity="0.92">${stripes(60, 26)}${stripes(170, 26)}</g></g>` +
			`<rect x="52" y="108" width="152" height="40" fill="${INK}"/>`,
	};
};

// ── M Nitrogen tank (multiplier) ────────────────────────────────────────────
const m = () => {
	const c = HUE.cyan;
	const body = `<path d="M78 108 a50 46 0 0 1 100 0 v70 a50 46 0 0 1 -100 0 Z"/>`;
	const sil = body + `<rect x="110" y="30" width="36" height="46" rx="8"/><rect x="94" y="16" width="68" height="22" rx="10"/>`;
	return {
		sil,
		art:
			`<g opacity="0.35">${halftone(`<circle cx="128" cy="128" r="112"/>`, c.base, 'light')}</g>` +
			inked(sil, c.base) +
			`<g fill="${HUE.porcelain.base}"><rect x="94" y="16" width="68" height="22" rx="10"/><rect x="110" y="30" width="36" height="46" rx="8"/></g>` +
			`<g fill="${HUE.porcelain.light}"><rect x="94" y="16" width="68" height="9" rx="4"/></g>` +
			`<g fill="${c.base}">${body}</g>` +
			`<path d="M92 96 a50 46 0 0 1 20 -26 v168 a50 46 0 0 1 -20 -20 Z" fill="${c.light}"/>` +
			`<path d="M150 68 v180 a50 46 0 0 0 28 -32 v-118 a50 46 0 0 0 -28 -30 Z" fill="${c.shade}"/>` +
			[0.34, 0.6]
				.map((f) => {
					const y = 96 + 120 * f;
					return `<path d="M78 ${y} a50 14 0 0 0 100 0 v18 a50 14 0 0 1 -100 0 Z" fill="${c.deep}" opacity="0.85"/>`;
				})
				.join('') +
			line(body, WEIGHT.plane) +
			`<g opacity="0.55">${halftone(`<path d="M78 178 a50 46 0 0 0 100 0 v0 a50 46 0 0 1 -100 0 Z"/>`, '#ffffff', 'mid')}</g>`,
	};
};

// H3 needs its shell in scope before art is built, so it is assembled here
// rather than inside the factory above.
const h3full = (() => {
	const c = HUE.magenta;
	const shell = `<path d="M46 224 L46 122 Q46 46 128 46 Q210 46 210 122 L210 224 Z"/>`;
	const arch = `<path d="M70 132 Q70 74 128 74 Q186 74 186 132 L186 148 L70 148 Z"/>`;
	return {
		sil: shell,
		art:
			inked(shell, c.base) +
			`<g fill="${c.light}"><path d="M46 224 L46 122 Q46 46 128 46 Q96 60 78 122 L78 224 Z"/></g>` +
			`<g fill="${c.shade}"><path d="M178 224 L178 122 Q170 62 128 46 Q210 46 210 122 L210 224 Z"/></g>` +
			// the lit arch — a jukebox's one unmistakable feature
			`<g stroke="${INK_LINE}" stroke-width="8" fill="${INK}">${arch}</g>` +
			`<g stroke="${HUE.cyan.light}" stroke-width="7" fill="none" opacity="0.95"><path d="M82 146 Q82 86 128 86 Q174 86 174 146"/></g>` +
			`<g stroke="${HUE.gold.light}" stroke-width="5" fill="none" opacity="0.9"><path d="M94 148 Q94 100 128 100 Q162 100 162 148"/></g>` +
			// speaker grille
			`<g stroke="${INK_LINE}" stroke-width="7" fill="${c.deep}"><rect x="70" y="162" width="116" height="46" rx="10"/></g>` +
			line(
				Array.from({ length: 5 }, (_, i) => `<path d="M80 ${172 + i * 9} h96"/>`).join(''),
				WEIGHT.detail,
				INK_LINE,
				0.7,
			) +
			rim(shell),
	};
})();

const SYMBOLS = { h1: h1(), h2: h2(), h3: h3full, h4: h4(), l1: l1(), l2: l2(), l3: l3(), l4: l4(), s: s(), m: m() };

const DEFS = halftoneDefs('ht') + printDefs('pr');

for (const [name, { sil, art }] of Object.entries(SYMBOLS)) {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">` +
		`<defs>${DEFS}<clipPath id="c">${sil}</clipPath></defs>` +
		`<g filter="url(#prDrop)">${art}</g>` +
		`<g clip-path="url(#c)"><rect width="${SIZE}" height="${SIZE}" filter="url(#prTooth)" opacity="0.5"/></g>` +
		`</svg>`;
	if (process.env.DUMP_SVG) fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
	fs.writeFileSync(
		path.join(OUT, `${name}.png`),
		new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } }).render().asPng(),
	);
	console.log(`  ${name}.png`);
}

console.log(`\nwrote ${Object.keys(SYMBOLS).length} symbols to ${OUT}`);
