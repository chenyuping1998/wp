// Full-bleed card art for the three feature buys.
//
// BonusCard (packages/components-ui-html) draws `assets.dialogImage` behind the
// card's own text when a game supplies one, and leaves the flat translucent
// black when it does not. Every other game here supplies nothing, so this is
// opt-in by construction — nothing else changes.
//
// The reason to bother: the buy modal was three identical dark rectangles told
// apart only by their words. A player deciding between a 200x, a 500x and a 50x
// had nothing to LOOK at, and the modal read as a form rather than as part of
// the game.
//
// BUILT FROM THE GAME'S OWN SYMBOL ART, not drawn beside it.
//
// The alternative — drawing each motif as vectors — was tried in Soul Seal and
// abandoned there for a reason worth repeating: flat vector shapes held up
// against painted symbols read as placeholder art nobody removed, and the menu
// looks like a different product from the game behind it. Compositing the actual
// sprites means nothing can drift out of style, because it IS the style, and the
// cards follow automatically the next time the symbols are regenerated.
//
// The three motifs are designed to read AGAINST each other, since the only
// question the modal has to answer is how the options differ:
//
//   bonus100    ONE reel cut by a Machete, its cells shown as two halves.
//   bonus200    TWO cut reels.
//   bonus300    THREE cut reels.
//               The three buy tiers differ by exactly one thing — how many
//               Machetes the feature starts with — so that is the only thing the
//               art varies. Nothing else changes between them, because anything
//               that did would imply a difference that is not there.
//   holdandspin a board of blank cells with Coins stuck to it. Deliberately
//               shares nothing with the other three, because it is not free
//               spins: it pays coins, not ways.
//
// The cut cells are drawn the way the BOARD draws them — each symbol twice, at
// half width (see Symbol.svelte, scale {x: 0.5, y: 1}). So the card is not an
// illustration of the mechanic, it is the mechanic, and a player who has seen
// the card recognises the board the first time a reel splits.
//
// The Machete itself is drawn WHOLE. It is not split on the board either.
//
// No text is drawn. The card's title, description and price are DOM text drawn
// over this by BonusCard, and a second set baked into the art would collide with
// them at some locale or layout. It also keeps the art clear of the social-play
// restricted word list by construction.
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

import { surfaceDefs, finishRect, CANVAS_FINISH, BRASS_FINISH } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYMBOLS = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi');
fs.mkdirSync(OUT, { recursive: true });

// Inlined as data URIs: resvg has no working directory for hrefs, and inlining
// also means the rendered PNG cannot end up pointing at a file that later moves.
const sprite = (name) => {
	const file = path.join(SYMBOLS, `${name}.png`);
	if (!fs.existsSync(file)) {
		console.error(`missing symbol art: ${path.relative(appRoot, file)}`);
		console.error('run design/generate_symbols_gen2.mjs first');
		process.exit(1);
	}
	return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
};

// ── card geometry ───────────────────────────────────────────────────────────
//
// 360x520 is the card's own proportion: BonusCard is 155-180px wide in a column
// whose height is set by a title, a description, a price and a button. Rendered
// at 2x so it stays sharp on a retina display.
const W = 360;
const H = 520;
const SCALE = 2;

// The motif sits at the card's VERTICAL CENTRE, and is kept short enough to
// survive a centre crop.
//
// It used to sit high, on the reasoning that the lower half is under the
// description and the price. That reasoning was right about the text and wrong
// about the geometry: this art is 360x520 (tall) and the rendered card is about
// 345x250 (WIDE), so `object-fit: cover` matches the width and throws away the
// top and bottom — roughly y 124..374 of 520 is all that is ever seen. A motif
// at y=172 came out cut in half at the top, and both scrims below were cropped
// away entirely, which is why every word ended up on bare gold.
//
// Centred and compact, the same band shows the whole motif, and it works for a
// tall crop too (portrait), where the motif is then simply centred.
const MOTIF = { cx: W / 2, cy: 246 };
// What a wide card actually shows, in this art's coordinates. Keep the motif
// inside it.
const CROP = { top: 124, bottom: 374 };

/** A square symbol, placed by centre and size in card pixels. */
const sym = (name, cx, cy, size, opacity = 1, rotate = 0) =>
	`<g transform="translate(${cx} ${cy}) rotate(${rotate})" opacity="${opacity}">` +
	`<image href="${sprite(name)}" x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}"/></g>`;

/**
 * One reel cut by a Machete: the Machete whole at the top, the cells below it
 * shown as two half-width copies with the cut between them.
 *
 * `scale(0.5, 1)` on each half is the same transform Symbol.svelte applies, so
 * a split cell here is proportioned exactly as it will be in the game.
 */
const splitColumn = (cx, cy, cell, below) => {
	const gap = 4;
	const half = cell / 4;
	// The Machete sits in the top cell, then `below` cut cells under it.
	const top = cy - ((below + 1) * (cell + gap) - gap) / 2 + cell / 2;
	const cutTop = top + cell / 2 + gap / 2;
	const cutBottom = top + (below + 0.5) * (cell + gap);
	// Two royals under the blade rather than one repeated symbol: a column of the
	// same tile three times reads as a stacked-symbol win, which is a different
	// feature.
	const under = ['l1', 'h3', 'l2'];
	return (
		sym('m', cx, top, cell) +
		Array.from({ length: below }, (_, i) => {
			const y = top + (i + 1) * (cell + gap);
			const name = under[i % under.length];
			return (
				`<g transform="translate(${cx - half} ${y}) scale(0.5 1)">` +
				`<image href="${sprite(name)}" x="${-cell / 2}" y="${-cell / 2}" width="${cell}" height="${cell}"/></g>` +
				`<g transform="translate(${cx + half} ${y}) scale(0.5 1)">` +
				`<image href="${sprite(name)}" x="${-cell / 2}" y="${-cell / 2}" width="${cell}" height="${cell}"/></g>`
			);
		}).join('') +
		// The cut. Dark core with a bright edge, so it reads as an opening rather
		// than as a drawn line: a single pale stroke on painted art looks like a
		// scratch on the picture, not like two halves with space between them.
		`<rect x="${cx - 3}" y="${cutTop}" width="6" height="${cutBottom - cutTop}" fill="#0b1204" opacity="0.85"/>` +
		`<rect x="${cx - 1}" y="${cutTop}" width="2" height="${cutBottom - cutTop}" fill="#ffe9a8" opacity="0.75"/>`
	);
};

// One entry per tier, differing only in how many columns are cut.
//
// SAME cell size on all three. The first pass scaled the column down as the
// count went up so each card filled the same width; that makes the 100x card's
// single reel the biggest object in the set, which reads as "more" next to the
// 300x card's three smaller ones. The count is the whole difference, so it is
// the only thing allowed to vary.
//
// 70 is set by the crop, not by taste. A wide card shows only y 124..374 — 250px
// — and a column of one Machete over two cut cells is 3 * (cell + gap) - gap
// tall, so anything over 80 has its blade cut off at the top. At 92 it was.
const CARD_CELL = 70;
const splitCard = (columns) => {
	const cell = CARD_CELL;
	const pitch = cell * 1.5;
	const x0 = MOTIF.cx - ((columns - 1) * pitch) / 2;
	return (
		`<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="${120 + columns * 22}" ry="106" fill="#ff8c1a" opacity="0.11" filter="url(#soft)"/>` +
		Array.from({ length: columns }, (_, i) => splitColumn(x0 + i * pitch, MOTIF.cy, cell, 2)).join('')
	);
};

const MOTIFS = {
	bonus100: splitCard(1),
	bonus200: splitCard(2),
	bonus300: splitCard(3),

	// A board with Coins stuck to it. Shares nothing with the other three on
	// purpose — it is not free spins and should not look like it.
	holdandspin: (() => {
		const cell = 68;
		const gap = 5;
		const cols = 3;
		const rows = 3;
		// Which cells hold a Coin. Not a full board and not a lone coin: a
		// part-filled board is what a hold-and-spin round actually looks like.
		// Deliberately lopsided. An X or a cross reads as a noughts-and-crosses
		// board, which is a game, and the wrong one.
		const coins = new Set(['0,0', '1,0', '2,1', '0,2', '1,2']);
		const x0 = MOTIF.cx - ((cols - 1) * (cell + gap)) / 2;
		const y0 = MOTIF.cy - ((rows - 1) * (cell + gap)) / 2;
		return (
			`<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="164" ry="112" fill="#ffd75e" opacity="0.09" filter="url(#soft)"/>` +
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
	<linearGradient id="ground" x1="0" y1="0" x2="0.35" y2="1">
		<stop offset="0" stop-color="#2c3812"/>
		<stop offset="0.5" stop-color="#1c2609"/>
		<stop offset="1" stop-color="#101806"/>
	</linearGradient>
	<!-- The locked reel's own gold. Deeper than the UI brass on purpose: the
	     column is a large flat area, and the trim ramp used on small pieces goes
	     pale as soon as it covers one. -->
	<linearGradient id="reelLock" x1="0" y1="0" x2="1" y2="0.2">
		<stop offset="0" stop-color="#3d2706"/>
		<stop offset="0.13" stop-color="#b8811d"/>
		<stop offset="0.34" stop-color="#ffd75e"/>
		<stop offset="0.56" stop-color="#dda42b"/>
		<stop offset="0.84" stop-color="#8a5c14"/>
		<stop offset="1" stop-color="#332005"/>
	</linearGradient>
	<!-- The column has to sit ON the card, not float in it. -->
	<filter id="drop" x="-30%" y="-20%" width="160%" height="140%">
		<feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#000000" flood-opacity="0.55"/>
	</filter>
	<!-- The pool is a lit area, not an object. Unblurred, its ellipse edge draws
	     a visible arc across the card. -->
	<filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
		<feGaussianBlur stdDeviation="30"/>
	</filter>
	<!--
		Scrims at BOTH ends, so every word the card carries has a dark ground under
		it. Ramped rather than flat: a hard edge across a card reads as a second
		card sitting on the first.
	-->
	<linearGradient id="scrimTop" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0c1305" stop-opacity="0.92"/>
		<stop offset="1" stop-color="#0c1305" stop-opacity="0"/>
	</linearGradient>
	<!--
		Never fully open. The old ramp dropped to 12% across the middle, which is
		fine on a tall card where the middle carries no text — and is the WHOLE
		card once a wide crop throws the ends away. The floor here is what
		guarantees a dark ground under every word regardless of how the card is
		cropped; the variation on top of it is only for depth.
	-->
	<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0c1305" stop-opacity="0.72"/>
		<stop offset="0.3" stop-color="#0c1305" stop-opacity="0.55"/>
		<stop offset="0.68" stop-color="#0c1305" stop-opacity="0.58"/>
		<stop offset="1" stop-color="#0c1305" stop-opacity="0.88"/>
	</linearGradient>`;

const card = (motif) => `
	<rect width="${W}" height="${H}" fill="url(#ground)"/>
	${finishRect(0, 0, W, H, 0, 'sf', CANVAS_FINISH)}
	${motif}
	<rect width="${W}" height="${H}" fill="url(#scrim)"/>
	<rect width="${W}" height="${H * 0.22}" fill="url(#scrimTop)"/>
	<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="12" fill="none"
	      stroke="#d8a334" stroke-width="3" opacity="0.6"/>`;

for (const [name, motif] of Object.entries(MOTIFS)) {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
		`<defs>${defs}</defs>${card(motif)}</svg>`;
	const png = new Resvg(svg, {
		fitTo: { mode: 'width', value: W * SCALE },
		font: { loadSystemFonts: false },
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
