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
//   bonus100    TWO reels of cargo crates, tarps coming off.
//   bonus200    THREE.
//   bonus300    FOUR.
//               The three buy tiers differ by exactly one thing — how many
//               crates the free strips carry — so that is the only thing the art
//               varies. Nothing else changes between them, because anything that
//               did would imply a difference that is not there.
//   holdandspin a board of blank cells with Coins stuck to it. Deliberately
//               shares nothing with the other three, because it is not free
//               spins: it pays coins, not ways.
//
// A crate reel is drawn the way the BOARD will draw it — a stack of tarps with
// the ones below already open on the same cargo — so the card is not an
// illustration of the mechanic, it is the mechanic, and a player who has seen
// the card recognises the board the first time a tarp comes off.
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
 * The board mid-reveal: `lit` reels carrying cargo crates, the rest dim.
 *
 * This is the mechanic drawn literally. Crates land in stacks and every one of
 * them opens on the SAME symbol, so the lower half of each lit column is drawn
 * already open on one cargo and the upper half is still under its tarp. The
 * number of lit columns is exactly what a dearer tier buys.
 */
const crateBoard = (lit) => {
	// Five columns of four — this game's board — sized to the crop band. A wide
	// card only ever shows y 124..374 (250px) and only 360px across, so 58 with a
	// 4px gap is the largest that fits both without clipping. See CROP.
	const cell = 58;
	const gap = 4;
	const rows = 4;
	const x0 = MOTIF.cx - ((5 - 1) * (cell + gap)) / 2;
	const y0 = MOTIF.cy - ((rows - 1) * (cell + gap)) / 2;
	// What the crates turn out to be. h1 is the diving helmet — the one gold
	// tile in the set, so an opened column reads as opened at card size without
	// needing a label.
	const CARGO = 'h1';
	// Dim filler for the reels the shipment did not reach, so "lit" means
	// something.
	const REST = ['l1', 'l3', 'l2', 'l4', 'l5'];

	let out =
		`<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="${110 + lit * 22}" ry="112" ` +
		`fill="#ffb020" opacity="0.3" filter="url(#soft)"/>`;

	for (let reel = 0; reel < 5; reel++) {
		const cx = x0 + reel * (cell + gap);
		const loaded = reel < lit;
		for (let row = 0; row < rows; row++) {
			const cy = y0 + row * (cell + gap);
			// Tarps on top, opened cargo below: the tarps come off from the bottom
			// of the stack, which is the direction the reveal animates.
			const name = loaded ? (row < 2 ? 'm' : CARGO) : REST[(reel + row) % REST.length];
			// 0.22, not 0.38. The tiers differ by HOW MANY COLUMNS ARE LOADED and
			// nothing else, so that contrast is the only thing the card has to say —
			// at 0.38 the unbought reels were legible enough to compete with the
			// bought ones and all three cards read as the same grey board.
			out += sym(name, cx, cy, cell, loaded ? 1 : 0.22);
		}
		if (loaded) {
			// A warm edge down the loaded column. Without it the cargo tiles read as
			// ordinary symbols that happen to match.
			//
			// USING `reelLock` AND `drop`, both of which were defined in this file
			// and never referenced — a flat #ffb020 hairline was drawn instead. Two
			// dead defs is a reliable sign that a piece of art was left half done,
			// and this one was: the gradient is what makes the edge read as metal
			// rather than as a highlighter line, and the shadow is what stops the
			// column floating.
			const top = y0 - cell / 2;
			const h = rows * cell + (rows - 1) * gap;
			out +=
				`<g filter="url(#drop)"><rect x="${cx - cell / 2 - 3}" y="${top - 3}" width="${cell + 6}" height="${h + 6}" ` +
				`rx="7" fill="none" stroke="url(#brassEdge)" stroke-width="5"/></g>` +
				// a hot inner line, so the edge has a lit side like every other piece
				// of brass in this game
				`<rect x="${cx - cell / 2 + 1}" y="${top + 1}" width="${cell - 2}" height="${h - 2}" ` +
				`rx="4" fill="none" stroke="#ffe9a8" stroke-width="1.5" opacity="0.3"/>`;
		}
	}
	return out;
};

const MOTIFS = {
	// The tiers run at 28% / 31% / 34% crate density with a rising chance of a
	// full shipment (see DENSITY in make_mystery_reels.py). That is the only
	// difference between them, so it is the only thing the art varies.
	bonus100: crateBoard(2),
	bonus200: crateBoard(3),
	bonus300: crateBoard(4),

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
			`<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="164" ry="112" fill="#ffd75e" opacity="0.24" filter="url(#soft)"/>` +
			Array.from({ length: rows }, (_, r) =>
				Array.from({ length: cols }, (_, c) => {
					const cx = x0 + c * (cell + gap);
					const cy = y0 + r * (cell + gap);
					const held = coins.has(`${c},${r}`);
					// 0.34, not 0.72: a hold-and-spin board is mostly empty, and the
					// picture is about WHICH cells are held. At 0.72 the blanks were
					// carrying almost as much weight as the coins.
					return sym(held ? 'p' : 'x', cx, cy, cell, held ? 1 : 0.34);
				}).join(''),
			).join('')
		);
	})(),
};

const defs =
	surfaceDefs('sf') +
	`
	<!--
		THE HULL, not the jungle.
		This gradient was three olive greens, carried over from the game these
		cards were forked from, and it was the loudest thing wrong with the buy
		modal: three green cards behind steel-blue container tiles, inside a flat
		grey platform panel. Nothing in this game is green.
		Steel blue running to near-black, the same range the container plates and
		the reel housing use, so the card reads as a piece of the ship.
	-->
	<linearGradient id="ground" x1="0" y1="0" x2="0.35" y2="1">
		<stop offset="0" stop-color="#33454f"/>
		<stop offset="0.5" stop-color="#1a2830"/>
		<stop offset="1" stop-color="#0b1318"/>
	</linearGradient>
	<!--
		Rust down the seams. The plates are weathered and a perfectly clean card
		behind them looks like a render of a different game; two soft vertical
		streaks are enough to say the same thing the tiles say.
	-->
	<linearGradient id="rust" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#8a4a1e" stop-opacity="0"/>
		<stop offset="0.35" stop-color="#8a4a1e" stop-opacity="0.34"/>
		<stop offset="1" stop-color="#5e2f12" stop-opacity="0"/>
	</linearGradient>
	<!-- The corrugation. Wide, low-contrast ribs; at card size anything stronger
	     turns into a moire against the symbol tiles' own ribbing. -->
	<pattern id="ribs" width="26" height="8" patternUnits="userSpaceOnUse">
		<rect width="26" height="8" fill="#ffffff" fill-opacity="0"/>
		<rect width="2" height="8" fill="#ffffff" fill-opacity="0.05"/>
		<rect x="13" width="1" height="8" fill="#000000" fill-opacity="0.16"/>
	</pattern>
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
	<!--
		THE SAME BRASS, RAMPED DOWN THE LONG AXIS, AND IT MATTERS BECAUSE OF WHERE
		A STROKE ACTUALLY PAINTS.

		reelLock ramps ACROSS its element (x1=0 to x2=1) and puts near-black at
		both ends of that ramp, which is right for a wide filled shape. Used as the
		STROKE of a tall hollow rect it is wrong in a way that is invisible in the
		source and obvious in the render: a hollow rect paints only its border, so
		the two long vertical sides sit at x=0 and x=1 — precisely the two dark ends
		— and the bright middle of the ramp lands on the horizontal top and bottom
		edges, which are 58px of a 244px-tall outline. The locked columns came out
		as thin brown lines.

		This ramps down the element instead and keeps light in both ends, so a tall
		outline is lit along its whole length.
	-->
	<linearGradient id="brassEdge" x1="0.1" y1="0" x2="0.6" y2="1">
		<stop offset="0" stop-color="#ffe9a8"/>
		<stop offset="0.3" stop-color="#e8b545"/>
		<stop offset="0.62" stop-color="#9a6a17"/>
		<stop offset="0.85" stop-color="#d8a334"/>
		<stop offset="1" stop-color="#ffdd7a"/>
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
		<stop offset="0" stop-color="#060d11" stop-opacity="0.92"/>
		<stop offset="1" stop-color="#060d11" stop-opacity="0"/>
	</linearGradient>
	<!--
		THERE ARE TWO SCRIMS AND ONLY ONE OF THEM BELONGS HERE.
		=======================================================

		BonusCard (packages/components-ui-html) draws its own scrim over this art,
		in the CARD's coordinates — 0.94 at the top, 0.38 through the middle, 0.95
		at the bottom. That one cannot be cropped away whatever shape the card ends
		up, which is exactly why it exists there, and it is what guarantees a dark
		ground under every word.

		This file then had a second scrim with a FLOOR of 0.55-0.58 across the whole
		card, added for the same reason before the component had one. Stacked, the
		two multiply: the middle of the motif was sitting at roughly 0.72 combined,
		which is why the cards came back looking muddy and unfinished. The art was
		fine; it was being covered up.

		THE FLOOR IS BACK, AT HALF ITS OLD DEPTH, AND HERE IS THE ARITHMETIC.

		The card as it actually renders is about 355 wide by 250 tall above its
		button, against art drawn 360x520. object-fit: cover matches the width and
		throws away the top and bottom, so the visible band is roughly y 133..386 —
		and the title, the description and the price are spread across ALL of it.
		There is no open middle on this card: the words and the motif occupy the
		same space, and any floor of 0 there puts the description on bare gold.
		That is what happened, and it is what a screenshot showed.

		Multiplying through: this floor f combines with the component's 0.38 to
		1-(1-f)(1-0.38).

		    f = 0.58  ->  0.74   the original. Legible, and the art is mud.
		    f = 0.07  ->  0.42   the last pass. The art is back and the words are not.
		    f = 0.24  ->  0.53   here.

		0.53 alone would still not be enough over the lit columns, which are the
		brightest thing on the card and sit directly behind the copy. The rest of
		the job is done by a tight dark halo on the text itself, in the game's own
		Modals.svelte — that is the part that works at any crop, any locale and any
		card height, which a fixed gradient cannot.
	-->
	<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#060d11" stop-opacity="0.6"/>
		<stop offset="0.24" stop-color="#060d11" stop-opacity="0.24"/>
		<stop offset="0.74" stop-color="#060d11" stop-opacity="0.26"/>
		<stop offset="1" stop-color="#060d11" stop-opacity="0.72"/>
	</linearGradient>
	<!-- A light from above, so the plate is not one flat value from top to bottom.
	     Cheap, and most of what separates a rendered panel from a lit one. -->
	<linearGradient id="keyLight" x1="0.2" y1="0" x2="0.8" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.07"/>
		<stop offset="0.45" stop-color="#ffffff" stop-opacity="0.015"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.22"/>
	</linearGradient>`;

const card = (motif) => `
	<rect width="${W}" height="${H}" fill="url(#ground)"/>
	<rect width="${W}" height="${H}" fill="url(#ribs)"/>
	<rect x="${W * 0.16}" y="0" width="10" height="${H}" fill="url(#rust)"/>
	<rect x="${W * 0.71}" y="0" width="14" height="${H}" fill="url(#rust)"/>
	${finishRect(0, 0, W, H, 0, 'sf', CANVAS_FINISH)}
	<rect width="${W}" height="${H}" fill="url(#keyLight)"/>
	${motif}
	<rect width="${W}" height="${H}" fill="url(#scrim)"/>
	<rect width="${W}" height="${H * 0.18}" fill="url(#scrimTop)"/>
	<!-- The edge, in the same brass as everything else, with its own lit inner
	     line. A single flat stroke at 0.6 was the last thing on the card still
	     reading as a wireframe rather than as a made object. -->
	<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="12" fill="none"
	      stroke="url(#brassEdge)" stroke-width="4"/>
	<rect x="5.5" y="5.5" width="${W - 11}" height="${H - 11}" rx="9" fill="none"
	      stroke="#ffe9a8" stroke-width="1.2" opacity="0.28"/>`;

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
