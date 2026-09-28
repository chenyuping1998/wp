// Full-bleed card art for the four buys.
//
// BonusCard (packages/components-ui-html) draws `assets.dialogImage` behind the
// card's own text when a game supplies one, and leaves the flat translucent
// black when it does not.
//
// THE COMPOSITION IS A POSTER, and it is Go Bananaut's: the board on the LEFT,
// one big object on the RIGHT running off the card's edge, and the type running
// down the channel between them (BonusCard centres its title, description and
// price and offers no way to move them, so the picture has to leave that
// channel alone). The first version of these cards put the motif in the middle,
// which is exactly where the price is drawn — it read as clutter however it was
// arranged.
//
// WHAT EACH SIDE SAYS
//
//   LEFT   a miniature of the board the tier OPENS ON, built from the game's
//          own symbol art: real Scatters landed on real reels (three / four /
//          five — the counts each tier's `scatter_triggers` forces, the same
//          numbers betModeMeta.ts prints in the copy), Sealed Tablets, and the
//          Tablets that have already opened to ONE symbol with a multiplier
//          cartouche on each. A player sees what they are buying as the board
//          they will be looking at.
//   RIGHT  the tier's hero, escalating by RARITY rather than by size alone:
//            100x  a lone scarab on warm sand — the ordinary trigger, bought
//            200x  a Tablet splitting with light pouring out — the feature
//            500x  the jackal god behind a halo of gold rings and stars — the top
//            50x   a shower of gold coins — a different game mode, and it shares
//                  only the ground with the other three
//
// The atmosphere climbs with it: amber, then lapis and turquoise, then royal gold
// over deep blue. Each card has its own colour so that the four read as four
// options at a glance, and the ground under all of them is the same neutral
// basalt the bet bar and the modals are built from.
//
// BUILT FROM THE GAME'S OWN SYMBOL ART, not drawn beside it: flat vector shapes
// held up against painted symbols read as placeholder art nobody removed.
//
// No text is drawn except the multiplier cartouches on the miniature's tablets,
// which are part of the board it depicts. The card's title, description and
// price are DOM text drawn over this by BonusCard, and a second set baked into
// the art would collide with them.
//
// Usage: node design/generate_mode_cards.mjs <dir with node_modules for @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/generate_mode_cards.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

import { surfaceDefs, finishRect, CANVAS_FINISH } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYMBOLS = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3');
// the multiplier cartouches carry a label, so this renderer needs a face: the
// same one the win plaques and the bet bar load
const FONT_DIR = path.join(appRoot, 'static/fonts');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi');
fs.mkdirSync(OUT, { recursive: true });

// Inlined as data URIs: resvg has no working directory for hrefs, and inlining
// also means the rendered PNG cannot end up pointing at a file that later moves.
const sprite = (name) => {
	const file = path.join(SYMBOLS, `${name}.png`);
	if (!fs.existsSync(file)) {
		console.error(`missing symbol art: ${path.relative(appRoot, file)}`);
		process.exit(1);
	}
	return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
};

// ── card geometry ───────────────────────────────────────────────────────────
//
// 360x520 is the card's own proportion, rendered at 2x so it stays sharp.
const W = 360;
const H = 520;
const SCALE = 2;

// BonusCard paints this art with `object-fit: cover` into a box about 345x250:
//
//     scale = max(345/360, 250/520) = 0.958      (width binds)
//     shown = 250 / 0.958 = 261 of the art's 520
//     band  = (520 - 261) / 2 = 130 .. 391
//
// so a wide card shows y 130..391 and that band's centre is 260. Everything that
// has to be seen sits inside it.
const MOTIF = { cx: W / 2, cy: 260 };

/** A square symbol or prop, placed by centre and size in card pixels. */
const sym = (name, cx, cy, size, opacity = 1, rotate = 0) =>
	`<g transform="translate(${cx} ${cy}) rotate(${rotate})" opacity="${opacity}">` +
	`<image href="${sprite(name)}" x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}"/></g>`;

// ── the miniature board ─────────────────────────────────────────────────────
const REELS = 5;
const ROWS = 5;
const CELL = 26;
const GAP = 3;
const BOARD_W = REELS * CELL + (REELS - 1) * GAP;
const BOARD_H = ROWS * CELL + (ROWS - 1) * GAP;
const BOARD_CX = W * 0.29;
const BOARD_CY = MOTIF.cy + 6;
const GOLD = '#ffd75e';

// A board of one symbol reads as a blast, which is the wrong mechanic; the low
// symbols cycled read as a board.
const FILL = ['l3', 'l1', 'h4', 'l5', 'l2', 'l4', 'l1', 'h4'];

// the multiplier cartouche a held Tablet wears, at the size it has on a 26px cell
const badge = (cx, cy, label) =>
	`<rect x="${cx - 11.5}" y="${cy - 5.6}" width="23" height="11.2" rx="5.6" fill="#122a5e" stroke="#e8ae3c" stroke-width="1.4"/>` +
	`<rect x="${cx - 9.5}" y="${cy - 4.4}" width="19" height="4.4" rx="2.2" fill="#3f6cd0" opacity="0.7"/>` +
	`<text x="${cx}" y="${cy + 2.9}" font-family="Titan One" font-size="7.6" fill="#fff3c4" text-anchor="middle">${label}</text>`;

/**
 * spec.scatters   [reel,row] cells holding a Scatter
 * spec.open       [reel,row,label] Tablets already opened, every one to the SAME
 *                 symbol (`h2`) — a card showing two faces would teach the
 *                 opposite of the mechanic
 * spec.sealed     [reel,row] Tablets still sealed
 */
const miniBoard = (spec, glow) => {
	const x0 = BOARD_CX - BOARD_W / 2;
	const y0 = BOARD_CY - BOARD_H / 2;
	const cellX = (c) => x0 + c * (CELL + GAP);
	const cellY = (r) => y0 + r * (CELL + GAP);
	const key = (c, r) => `${c},${r}`;
	const scatters = new Set(spec.scatters.map(([c, r]) => key(c, r)));
	const open = new Map(spec.open.map(([c, r, label]) => [key(c, r), label]));
	const sealed = new Set(spec.sealed.map(([c, r]) => key(c, r)));

	let out =
		`<ellipse cx="${BOARD_CX}" cy="${BOARD_CY}" rx="122" ry="112" fill="${glow}" opacity="0.2" filter="url(#soft)"/>` +
		// the housing: dark well, gold frame, a lit top rail so it is an object
		`<rect x="${x0 - 8}" y="${y0 - 8}" width="${BOARD_W + 16}" height="${BOARD_H + 16}" rx="8" fill="#0a0c0f" opacity="0.85"/>` +
		`<rect x="${x0 - 8}" y="${y0 - 8}" width="${BOARD_W + 16}" height="${BOARD_H + 16}" rx="8" fill="none" stroke="url(#frameGold)" stroke-width="3.4"/>` +
		`<rect x="${x0 - 5}" y="${y0 - 6}" width="${BOARD_W + 10}" height="2.2" rx="1.1" fill="#fff3c4" opacity="0.45"/>`;

	// pass 1: the glow under every Tablet that has opened, so they read as lit
	for (const [k] of open) {
		const [c, r] = k.split(',').map(Number);
		out += `<circle cx="${cellX(c) + CELL / 2}" cy="${cellY(r) + CELL / 2}" r="${CELL * 0.95}" fill="${GOLD}" opacity="0.32" filter="url(#softSmall)"/>`;
	}
	// pass 2: the cells
	for (let c = 0; c < REELS; c += 1) {
		for (let r = 0; r < ROWS; r += 1) {
			const k = key(c, r);
			const cx = cellX(c) + CELL / 2;
			const cy = cellY(r) + CELL / 2;
			const name = scatters.has(k) ? 's' : open.has(k) ? 'h2' : sealed.has(k) ? 'm' : FILL[(c * 2 + r * 3) % FILL.length];
			out += sym(name, cx, cy, CELL);
			if (scatters.has(k)) {
				// a landed Scatter keeps a gold frame, as it does on the real board
				out += `<rect x="${cellX(c) - 1.5}" y="${cellY(r) - 1.5}" width="${CELL + 3}" height="${CELL + 3}" rx="4" fill="none" stroke="${GOLD}" stroke-width="1.8" opacity="0.95"/>`;
			}
			if (open.has(k)) {
				out += `<rect x="${cellX(c) - 1}" y="${cellY(r) - 1}" width="${CELL + 2}" height="${CELL + 2}" rx="3.5" fill="none" stroke="#ffe08a" stroke-width="1.6"/>`;
				out += badge(cx, cy + CELL * 0.3, open.get(k));
			}
		}
	}
	return out;
};

// ── atmosphere ──────────────────────────────────────────────────────────────
const BAND = { top: MOTIF.cy - 96, bottom: MOTIF.cy + 96 };
const motes = (seedStart, count, colour) => {
	let seed = seedStart;
	const rnd = () => {
		seed = (seed * 1103515245 + 12345) % 2147483648;
		return seed / 2147483648;
	};
	return Array.from({ length: count }, () => {
		const x = rnd() * W;
		const y = BAND.top - 24 + rnd() * (BAND.bottom - BAND.top + 48);
		const r = 0.7 + rnd() * 1.7;
		const a = 0.4 + rnd() * 0.5;
		return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${colour}" opacity="${a.toFixed(2)}"/>`;
	}).join('');
};

const sparkle = (x, y, r, colour = '#ffffff', opacity = 0.9) =>
	`<path d="M ${x} ${y - r} Q ${x} ${y} ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} ` +
	`Q ${x} ${y} ${x - r} ${y} Q ${x} ${y} ${x} ${y - r} Z" fill="${colour}" opacity="${opacity}"/>`;

const groundUnderBoard = (tint) =>
	`<ellipse cx="${W * 0.35}" cy="${MOTIF.cy + 126}" rx="${W * 0.46}" ry="30" fill="${tint}" opacity="0.3" filter="url(#soft)"/>` +
	`<ellipse cx="${BOARD_CX}" cy="${MOTIF.cy + 134}" rx="96" ry="18" fill="#060708" opacity="0.62" filter="url(#soft)"/>`;

let coinId = 0;
const floatingCoin = (cx, cy, size, rotate, opacity = 1) => {
	const id = `coin${coinId++}`;
	return (
		`<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${size * 0.365}"/></clipPath>` +
		`<circle cx="${cx}" cy="${cy}" r="${size * 0.6}" fill="${GOLD}" opacity="0.22" filter="url(#soft)"/>` +
		`<g clip-path="url(#${id})" opacity="${opacity}">${sym('p', cx, cy, size, 1, rotate)}</g>`
	);
};

// ── the four cards ──────────────────────────────────────────────────────────
//
// SCENES is what is BEHIND the board and the hero; BOARDS is the miniature.
const SCENES = {
	// AMBER, CALM. One scarab and a warm sky: the ordinary trigger, bought.
	bonus100: `
	<ellipse cx="${W * 0.8}" cy="${MOTIF.cy - 6}" rx="222" ry="176" fill="#e8a23c" opacity="0.28" filter="url(#soft)"/>
	<ellipse cx="${W * 0.5}" cy="${MOTIF.cy + 70}" rx="200" ry="70" fill="#a8641c" opacity="0.14" filter="url(#soft)"/>
	${motes(20260920, 58, '#f2d59a')}
	${sym('scarab', W * 0.87, MOTIF.cy + 24, 250, 1, -12)}
	${sparkle(W * 0.66, MOTIF.cy - 52, 9, '#fff3c4', 0.7)}
	${groundUnderBoard('#c99a4a')}`,

	// LAPIS AND TURQUOISE, AND SOMETHING IS BREAKING. A Tablet splitting, light
	// pouring through the gap.
	bonus: `
	<ellipse cx="${W * 0.72}" cy="${MOTIF.cy - 30}" rx="236" ry="130" fill="#2aa396" opacity="0.2" filter="url(#soft)"/>
	<ellipse cx="${W * 0.92}" cy="${MOTIF.cy + 64}" rx="150" ry="120" fill="#3f74de" opacity="0.18" filter="url(#soft)"/>
	${motes(20260921, 66, '#bff3ea')}
	<!-- the light between the halves -->
	<ellipse cx="${W * 0.79}" cy="${MOTIF.cy - 2}" rx="30" ry="140" fill="#ffe08a" opacity="0.5" filter="url(#soft)"/>
	<rect x="${W * 0.79 - 4}" y="${MOTIF.cy - 118}" width="8" height="236" fill="#fff6d6" opacity="0.5" filter="url(#softSmall)"/>
	${sym('m_shard_l', W * 0.735, MOTIF.cy - 4, 150, 1, -6)}
	${sym('m_shard_r', W * 0.885, MOTIF.cy + 8, 150, 1, 7)}
	${sparkle(W * 0.79, MOTIF.cy - 92, 18, '#fffbea', 0.95)}
	${sparkle(W * 0.78, MOTIF.cy + 90, 11, '#fff3c4', 0.8)}
	${sparkle(W * 0.6, MOTIF.cy - 34, 8, '#dffbf6', 0.75)}
	${groundUnderBoard('#3aa9b0')}`,

	// ROYAL GOLD OVER DEEP BLUE, THE TOP OF THE LADDER. The jackal god behind a
	// halo of rings, the sky full of light.
	superbonus: `
	<ellipse cx="${W * 0.78}" cy="${MOTIF.cy - 20}" rx="250" ry="152" fill="#ffc24a" opacity="0.24" filter="url(#soft)"/>
	<ellipse cx="${W * 0.5}" cy="${MOTIF.cy + 40}" rx="230" ry="110" fill="#3f4fd8" opacity="0.16" filter="url(#soft)"/>
	${motes(20260922, 78, '#fff4d6')}
	${sym('w', W * 0.97, MOTIF.cy + 56, 318, 1)}
	<circle cx="${W * 0.97}" cy="${MOTIF.cy + 56}" r="162" fill="none" stroke="${GOLD}" stroke-width="3" opacity="0.42"/>
	<circle cx="${W * 0.97}" cy="${MOTIF.cy + 56}" r="180" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.26"/>
	<!-- the flare on the god's lit edge -->
	<circle cx="${W * 0.79}" cy="${MOTIF.cy - 32}" r="46" fill="#fff1c2" opacity="0.5" filter="url(#soft)"/>
	${sparkle(W * 0.79, MOTIF.cy - 32, 30, '#fffbea', 0.95)}
	${sparkle(W * 0.62, MOTIF.cy - 66, 13, '#fff4d6', 0.85)}
	${sparkle(W * 0.9, MOTIF.cy + 16, 11, '#fff4d6', 0.8)}
	${sparkle(W * 0.54, MOTIF.cy + 22, 9, '#fff4d6', 0.7)}
	${sparkle(W * 0.68, MOTIF.cy + 86, 12, '#fff4d6', 0.75)}
	${groundUnderBoard('#b39a5c')}`,

	// WARM, DARK, A SHOWER OF COINS. Shares nothing with the free-spin cards but
	// the ground, because it is not free spins.
	superspin: `
	<ellipse cx="${W * 0.62}" cy="${MOTIF.cy - 4}" rx="240" ry="150" fill="#ffb020" opacity="0.2" filter="url(#soft)"/>
	<ellipse cx="${W * 0.2}" cy="${MOTIF.cy + 60}" rx="150" ry="100" fill="#8a4a10" opacity="0.2" filter="url(#soft)"/>
	${motes(20260923, 40, '#ffe9b8')}
	${floatingCoin(W * 0.86, MOTIF.cy - 52, 92, -14)}
	${floatingCoin(W * 0.7, MOTIF.cy + 30, 64, 18)}
	${floatingCoin(W * 0.93, MOTIF.cy + 62, 74, 8)}
	${floatingCoin(W * 0.62, MOTIF.cy - 78, 44, -22)}
	${floatingCoin(W * 0.78, MOTIF.cy + 96, 46, 24)}
	${sparkle(W * 0.74, MOTIF.cy - 22, 12, '#fff4d6', 0.9)}
	${sparkle(W * 0.96, MOTIF.cy - 8, 9, '#fff4d6', 0.8)}
	${sparkle(W * 0.6, MOTIF.cy + 60, 8, '#fff4d6', 0.7)}
	<ellipse cx="${BOARD_CX}" cy="${MOTIF.cy + 134}" rx="96" ry="18" fill="#060708" opacity="0.62" filter="url(#soft)"/>`,
};

const MOTIFS = {
	// THREE Scatters, one Tablet open: the board the base game itself triggers on
	bonus100: miniBoard(
		{
			scatters: [
				[0, 1],
				[2, 3],
				[4, 0],
			],
			open: [[3, 2, '5X']],
			sealed: [
				[1, 4],
				[2, 0],
			],
		},
		'#e8a23c',
	),
	// FOUR Scatters, two open, more sealed
	bonus: miniBoard(
		{
			scatters: [
				[0, 1],
				[1, 3],
				[3, 0],
				[4, 3],
			],
			open: [
				[2, 2, '10X'],
				[4, 1, '3X'],
			],
			sealed: [
				[1, 0],
				[3, 4],
				[0, 4],
			],
		},
		'#2aa396',
	),
	// FIVE Scatters, the board dressed in opened Tablets
	superbonus: miniBoard(
		{
			scatters: [
				[0, 2],
				[1, 0],
				[2, 4],
				[3, 1],
				[4, 3],
			],
			open: [
				[1, 2, '25X'],
				[2, 1, '8X'],
				[3, 3, '50X'],
				[0, 4, '5X'],
			],
			sealed: [[4, 0]],
		},
		'#ffc24a',
	),

	// A board of blank cells with Coins stuck to it: hold-and-spin, not free spins
	superspin: (() => {
		const cell = 58;
		const gap = 5;
		const cols = 3;
		const rows = 3;
		const coins = new Set(['0,0', '1,0', '2,1', '0,2', '1,2']);
		const x0 = BOARD_CX - ((cols - 1) * (cell + gap)) / 2;
		const y0 = MOTIF.cy + 14 - ((rows - 1) * (cell + gap)) / 2;
		return (
			`<ellipse cx="${BOARD_CX}" cy="${MOTIF.cy + 14}" rx="126" ry="104" fill="${GOLD}" opacity="0.12" filter="url(#soft)"/>` +
			Array.from({ length: rows }, (_, r) =>
				Array.from({ length: cols }, (_, c) => {
					const cx = x0 + c * (cell + gap);
					const cy = y0 + r * (cell + gap);
					const held = coins.has(`${c},${r}`);
					return sym(held ? 'p' : 'x', cx, cy, cell, held ? 1 : 0.72);
				}).join(''),
			).join('')
		);
	})(),
};

const defs =
	surfaceDefs('sf') +
	`
	<!-- THE PLATFORM'S BASALT: the neutral stone the bet bar and the modals are
	     built from, so the art and the panel it sits in are one material. The
	     colour on each card comes from its glows, not from its ground. -->
	<linearGradient id="ground" x1="0" y1="0" x2="0.35" y2="1">
		<stop offset="0" stop-color="#26292d"/>
		<stop offset="0.5" stop-color="#16181b"/>
		<stop offset="1" stop-color="#0b0c0e"/>
	</linearGradient>
	<linearGradient id="frameGold" x1="0" y1="0" x2="1" y2="0.2">
		<stop offset="0" stop-color="#3d2706"/>
		<stop offset="0.13" stop-color="#b8811d"/>
		<stop offset="0.34" stop-color="#ffd75e"/>
		<stop offset="0.56" stop-color="#dda42b"/>
		<stop offset="0.84" stop-color="#8a5c14"/>
		<stop offset="1" stop-color="#332005"/>
	</linearGradient>
	<!-- a pool of light is an area, not an object: unblurred, its edge draws a
	     visible arc across the card -->
	<filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
		<feGaussianBlur stdDeviation="30"/>
	</filter>
	<filter id="softSmall" x="-60%" y="-60%" width="220%" height="220%">
		<feGaussianBlur stdDeviation="6"/>
	</filter>
	<!-- Scrims at both ends, so every word the card carries has a dark ground under
	     it, but LIGHT: BonusCard draws its own over this one (0.94 at the ends,
	     0.38 through the middle) and two scrims multiply, which left the motif
	     nearly invisible when this one carried the old values. -->
	<linearGradient id="scrimTop" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#08090b" stop-opacity="0.92"/>
		<stop offset="1" stop-color="#08090b" stop-opacity="0"/>
	</linearGradient>
	<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#08090b" stop-opacity="0.38"/>
		<stop offset="0.3" stop-color="#08090b" stop-opacity="0.24"/>
		<stop offset="0.68" stop-color="#08090b" stop-opacity="0.26"/>
		<stop offset="1" stop-color="#08090b" stop-opacity="0.5"/>
	</linearGradient>`;

const card = (motif, name) => `
	<rect width="${W}" height="${H}" fill="url(#ground)"/>
	${finishRect(0, 0, W, H, 0, 'sf', CANVAS_FINISH)}
	${SCENES[name]}
	${motif}
	<rect width="${W}" height="${H}" fill="url(#scrim)"/>
	<rect width="${W}" height="${H * 0.22}" fill="url(#scrimTop)"/>`;

for (const [name, motif] of Object.entries(MOTIFS)) {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
		`<defs>${defs}</defs>${card(motif, name)}</svg>`;
	const png = new Resvg(svg, {
		fitTo: { mode: 'width', value: W * SCALE },
		font: { fontDirs: [FONT_DIR], loadSystemFonts: false, defaultFontFamily: 'Titan One' },
	})
		.render()
		.asPng();
	const file = path.join(OUT, `card_${name}.png`);
	fs.writeFileSync(file, png);
	console.log(
		'rendered',
		path.relative(appRoot, file),
		`${W * SCALE}x${H * SCALE}`,
		`${Math.round(png.length / 1024)}KB`,
	);
}
