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
//   bonus100    ONE reel blasted: every cell of it the same symbol.
//   bonus200    TWO blasted reels.
//   bonus300    THREE blasted reels.
//               The three buy tiers differ by exactly one thing — how many
//               Machetes the feature starts with — so that is the only thing the
//               art varies. Nothing else changes between them, because anything
//               that did would imply a difference that is not there.
//   holdandspin a board of blank cells with Coins stuck to it. Deliberately
//               shares nothing with the other three, because it is not free
//               spins: it pays coins, not ways.
//
// A blasted reel is drawn the way the BOARD will draw it — every cell the same
// symbol — so the card is not an illustration of the mechanic, it is the
// mechanic, and a player who has seen the card recognises the board the first
// time a reel goes up.
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
 * The board mid-detonation: `lit` reels filled with one symbol, the rest dim.
 *
 * This is the mechanic drawn literally. A blast rewrites whole reels to a single
 * symbol, so a filled column IS what the player will see, and the number of
 * filled columns is exactly what a dearer tier buys.
 */
const blastBoard = (lit) => {
	// Five columns of three, sized to the crop band. A wide card only ever shows
	// y 124..374 (250px) and only 360px across, so five columns of 58 with a 4px
	// gap is the largest that fits both without clipping — see CROP.
	const cell = 58;
	const gap = 4;
	const rows = 3;
	const x0 = MOTIF.cx - ((5 - 1) * (cell + gap)) / 2;
	const y0 = MOTIF.cy - ((rows - 1) * (cell + gap)) / 2;
	// The fill symbol is the crystal: it is the one cool-coloured tile in the set,
	// so a filled column reads as filled at card size without needing a label.
	const FILL = 'h2';
	// Dim filler for the reels the blast did not reach, so "lit" means something.
	const REST = ['l1', 'l3', 'l2', 'l4', 'l5'];

	let out =
		`<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="${110 + lit * 26}" ry="104" ` +
		`fill="#ff8c1a" opacity="0.12" filter="url(#soft)"/>`;

	for (let reel = 0; reel < 5; reel++) {
		const cx = x0 + reel * (cell + gap);
		const blasted = reel < lit;
		for (let row = 0; row < rows; row++) {
			const cy = y0 + row * (cell + gap);
			// The dynamite sits on the top cell of the first blasted reel — the
			// charge that did this, still in the picture so the card explains
			// itself rather than just showing a result.
			const name = blasted ? (reel === 0 && row === 0 ? 'b' : FILL) : REST[(reel + row) % REST.length];
			out += sym(name, cx, cy, cell, blasted ? 1 : 0.4);
		}
		if (blasted) {
			// A warm edge down the filled column. Without it the crystal tiles read
			// as ordinary symbols that happen to match.
			const top = y0 - cell / 2;
			const h = rows * cell + (rows - 1) * gap;
			out +=
				`<rect x="${cx - cell / 2 - 2}" y="${top - 2}" width="${cell + 4}" height="${h + 4}" ` +
				`rx="6" fill="none" stroke="#ffb020" stroke-width="3" opacity="0.75"/>`;
		}
	}
	return out;
};

const MOTIFS = {
	// 0 / 2 / 4 banked dynamite puts the tier's FIRST blast at 1 / 2 / 3 reels
	// (see blast_ladder in game_config.py). That is the only difference between
	// the tiers, so it is the only thing the art varies.
	bonus100: blastBoard(1),
	bonus200: blastBoard(2),
	bonus300: blastBoard(3),

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
