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
//   bonus       one Wild locked over its reel, three Scatters under it.
//               The ordinary way in, and the feature it buys.
//   superbonus  FIVE Scatters and TWO locked reels. Same vocabulary, more of it
//               — which is exactly what 500x buys over 200x.
//   superspin   a board of blank cells with Coins stuck to it. Deliberately
//               shares nothing with the other two, because it is not free spins.
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
 * A reel locked by an expanded Wild: the brass column with the Wild's plate on
 * it. This is the feature both free-spin modes sell, so it is the one shape that
 * has to be unmistakable — and it is the same drawing on both cards, at one
 * column against two, so the difference between them reads without reading.
 */
const lockedReel = (cx, cy, plate, h) => {
	const w = plate * 1.16;
	const top = cy - h / 2;
	const r = w * 0.1;
	// The finish helpers are tuned for small trim pieces. Applied at full strength
	// to a column this size, the specular sweep and the lit edge cover most of the
	// object and the brass came out as pale beige — it read as frosted glass, not
	// as the gold panel the game locks over a reel. Grain and scratches carry the
	// material here; the highlight is drawn deliberately instead, as a band down
	// one side rather than a wash over everything.
	// spec and edge are OFF, not merely reduced. Both paint a light wash across
	// the whole rect, and on an object this size that is most of the object — two
	// passes of near-white over the gold was the entire reason it came out beige.
	// The light on this column is the drawn core of the gradient instead.
	const finish = { grain: 0.3, brushed: 0.2, scratch: 0.22, mottle: 0.25, spec: 0, edge: 0, ao: 0.55 };
	return `
		<g filter="url(#drop)"><rect x="${cx - w / 2}" y="${top}" width="${w}" height="${h}" rx="${r}"
		   fill="url(#reelLock)"/></g>
		${finishRect(cx - w / 2, top, w, h, r, 'sf', finish)}
		<!-- one lit face, so the column has a light direction instead of glowing
		     evenly from nowhere -->
		<rect x="${cx - w / 2 + w * 0.16}" y="${top + h * 0.02}" width="${w * 0.14}" height="${h * 0.96}"
		      rx="${w * 0.06}" fill="#fff6d8" opacity="0.3"/>
		<!-- dark rim, then a bright inner line: the two together are what makes an
		     edge read as machined metal rather than as a coloured rectangle -->
		<rect x="${cx - w / 2}" y="${top}" width="${w}" height="${h}" rx="${r}"
		      fill="none" stroke="#4a3008" stroke-width="5"/>
		<rect x="${cx - w / 2 + 4}" y="${top + 4}" width="${w - 8}" height="${h - 8}" rx="${r * 0.8}"
		      fill="none" stroke="#ffe9a8" stroke-width="2" opacity="0.65"/>
		${sym('w', cx, cy, plate)}`;
};

const MOTIFS = {
	// One locked reel, three Scatters. The ordinary entry and what it buys.
	bonus: `
		<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="150" ry="104" fill="#8fd9ff" opacity="0.11" filter="url(#soft)"/>
		${lockedReel(MOTIF.cx, MOTIF.cy - 34, 92, 164)}
		${[-1, 0, 1].map((i) => sym('s', MOTIF.cx + i * 70, MOTIF.cy + 76, 56, 1, i * 7)).join('')}`,

	// Five Scatters and two locked reels: the same vocabulary, more of it.
	superbonus: `
		<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="176" ry="110" fill="#8fd9ff" opacity="0.13" filter="url(#soft)"/>
		${lockedReel(MOTIF.cx - 74, MOTIF.cy - 38, 74, 148)}
		${lockedReel(MOTIF.cx + 74, MOTIF.cy - 38, 74, 148)}
		${[-2, -1, 0, 1, 2]
			.map((i) =>
				// An arc, not a straight row: the middle one sits highest and largest,
				// so five reads as a group rather than as a strip of icons.
				sym(
					's',
					MOTIF.cx + i * 66,
					MOTIF.cy + 72 - (2 - Math.abs(i)) * 8,
					48 + (2 - Math.abs(i)) * 6,
					1,
					i * 6,
				),
			)
			.join('')}`,

	// A board with Coins stuck to it. Shares nothing with the other two on
	// purpose — it is not free spins and should not look like it.
	superspin: (() => {
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
			`<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="164" ry="112" fill="#8fd9ff" opacity="0.1" filter="url(#soft)"/>` +
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
	<!-- The card's ground, in the board's own slate (src/game/palette.ts). Was
	     olive canvas, matching the jungle reel housing. -->
	<linearGradient id="ground" x1="0" y1="0" x2="0.35" y2="1">
		<stop offset="0" stop-color="#28323f"/>
		<stop offset="0.5" stop-color="#1a2330"/>
		<stop offset="1" stop-color="#111924"/>
	</linearGradient>
	<!-- The locked reel's own gold. Deeper than the UI brass on purpose: the
	     column is a large flat area, and the trim ramp used on small pieces goes
	     pale as soon as it covers one.

	     DELIBERATELY STILL GOLD while everything round it went cold. This column
	     is a picture of the expanded Wild, and ExpandingWilds.svelte still draws
	     that gold in the actual game — so an ice column here would sell the player
	     a feature that does not look like this. The card and the mechanic are one
	     object and they move together: when ExpandingWilds gets its Frostline
	     pass, this gradient, the #fff6d8 lit face, the #4a3008 rim and the #ffe9a8
	     inner line all change with it, and not before. -->
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
		<stop offset="0" stop-color="#0a1420" stop-opacity="0.92"/>
		<stop offset="1" stop-color="#0a1420" stop-opacity="0"/>
	</linearGradient>
	<!--
		Never fully open. The old ramp dropped to 12% across the middle, which is
		fine on a tall card where the middle carries no text — and is the WHOLE
		card once a wide crop throws the ends away. The floor here is what
		guarantees a dark ground under every word regardless of how the card is
		cropped; the variation on top of it is only for depth.
	-->
	<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0a1420" stop-opacity="0.72"/>
		<stop offset="0.3" stop-color="#0a1420" stop-opacity="0.55"/>
		<stop offset="0.68" stop-color="#0a1420" stop-opacity="0.58"/>
		<stop offset="1" stop-color="#0a1420" stop-opacity="0.88"/>
	</linearGradient>`;

const card = (motif) => `
	<rect width="${W}" height="${H}" fill="url(#ground)"/>
	${finishRect(0, 0, W, H, 0, 'sf', CANVAS_FINISH)}
	${motif}
	<rect width="${W}" height="${H}" fill="url(#scrim)"/>
	<rect width="${W}" height="${H * 0.22}" fill="url(#scrimTop)"/>
	<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="12" fill="none"
	      stroke="#5fa8d8" stroke-width="3" opacity="0.6"/>`;

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
