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
//   bonus       three Sealed Tablets with the middle one already broken open,
//               FOUR Scatters under them. The tier's own entry count, and the
//               feature it buys.
//   superbonus  FIVE Tablets, two of them open, FIVE Scatters. Same vocabulary,
//               more of it — which is exactly what 500x buys over 200x.
//   superspin   a board of blank cells with Coins stuck to it. Deliberately
//               shares nothing with the other two, because it is not free spins.
//
// The Scatter counts are the real ones. These cards used to show three and five
// against a game that only ever awarded five, and now show four and five because
// that is what each tier's `scatter_triggers` forces — see betModeMeta.ts, which
// prints the same numbers in the copy printed over this art.
//
// They also used to be built around a WILD LOCKED OVER ITS REEL, which was the
// feature the previous game sold. This one has no expanding wilds and no locked
// reels; it has the tablet. A card selling a mechanic the round does not contain
// is worse than a card with no picture.
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
 * Sealed Tablets in a row, one or more already broken open on the symbol they
 * all hold. This is the feature both free-spin modes sell, so it is the one
 * shape that has to be unmistakable — and it is the same drawing on both cards,
 * at three tablets against five, so the difference between them reads without
 * reading.
 *
 * The opened ones show `h1`, and always the same symbol on a given card: every
 * tablet on a board opens to ONE symbol, and a card showing two different faces
 * would teach the opposite of the mechanic on the way in.
 */
const tabletRow = (cx, cy, count, size, open) => {
	const gap = size * 0.12;
	const x0 = cx - ((count - 1) * (size + gap)) / 2;
	return Array.from({ length: count }, (_, i) => {
		const x = x0 + i * (size + gap);
		// The opened ones sit slightly high and large: a broken seal is the event,
		// and an even row of identical tiles has no event in it.
		const isOpen = open.includes(i);
		const y = cy - (isOpen ? size * 0.1 : 0);
		const s = size * (isOpen ? 1.12 : 1);
		return (
			(isOpen
				? `<ellipse cx="${x}" cy="${y}" rx="${s * 0.72}" ry="${s * 0.72}" fill="#ffd75e" opacity="0.22" filter="url(#soft)"/>`
				: '') +
			`<g filter="url(#drop)">${sym(isOpen ? 'h1' : 'm', x, y, s, 1, (i - (count - 1) / 2) * 4)}</g>`
		);
	}).join('');
};

const MOTIFS = {
	// TWO Tablets, one open. THREE Scatters: the entry tier's own board.
	//
	// Deliberately the smallest arrangement of the same three parts the other two
	// cards are built from, because that is exactly what this tier is — the
	// ordinary trigger, bought rather than waited for. A card that borrowed the
	// 200x tier's three Tablets would be selling a board this mode does not open
	// on.
	bonus100: `
		<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="132" ry="98" fill="#ffd75e" opacity="0.09" filter="url(#soft)"/>
		${tabletRow(MOTIF.cx, MOTIF.cy - 38, 2, 96, [0])}
		${[-1, 0, 1]
			.map((i) => sym('s', MOTIF.cx + i * 66, MOTIF.cy + 78, 54, 1, i * 7))
			.join('')}`,

	// Three Tablets, the middle one open. Four Scatters: this tier's own entry.
	bonus: `
		<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="150" ry="104" fill="#ffd75e" opacity="0.1" filter="url(#soft)"/>
		${tabletRow(MOTIF.cx, MOTIF.cy - 40, 3, 92, [1])}
		${[-1.5, -0.5, 0.5, 1.5]
			.map((i) => sym('s', MOTIF.cx + i * 64, MOTIF.cy + 78, 52, 1, i * 7))
			.join('')}`,

	// Five Tablets, two open, five Scatters: the same vocabulary, more of it.
	superbonus: `
		<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="176" ry="110" fill="#ffe282" opacity="0.12" filter="url(#soft)"/>
		${tabletRow(MOTIF.cx, MOTIF.cy - 42, 5, 60, [1, 3])}
		${[-2, -1, 0, 1, 2]
			.map((i) =>
				// An arc, not a straight row: the middle one sits highest and largest,
				// so five reads as a group rather than as a strip of icons.
				sym(
					's',
					MOTIF.cx + i * 66,
					MOTIF.cy + 76 - (2 - Math.abs(i)) * 8,
					46 + (2 - Math.abs(i)) * 6,
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
	<!--
		Dark basalt, not jungle olive. Two reasons, and the second is the load-
		bearing one: the symbols composited onto these cards now sit on basalt
		plates, so a green ground put a green halo around every tile; and the bar
		these cards open from is going monochrome, which a saturated green card
		would fight. Neutral stone is the only ground that works against both the
		art it carries and the chrome it opens from.
	-->
	<linearGradient id="ground" x1="0" y1="0" x2="0.35" y2="1">
		<stop offset="0" stop-color="#31363b"/>
		<stop offset="0.5" stop-color="#1e2226"/>
		<stop offset="1" stop-color="#0e1013"/>
	</linearGradient>
	<!-- The tablets have to sit ON the card, not float in it. -->
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
		<stop offset="0" stop-color="#0b0d10" stop-opacity="0.92"/>
		<stop offset="1" stop-color="#0b0d10" stop-opacity="0"/>
	</linearGradient>
	<!--
		Never fully open. The old ramp dropped to 12% across the middle, which is
		fine on a tall card where the middle carries no text — and is the WHOLE
		card once a wide crop throws the ends away. The floor here is what
		guarantees a dark ground under every word regardless of how the card is
		cropped; the variation on top of it is only for depth.
	-->
	<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0b0d10" stop-opacity="0.72"/>
		<stop offset="0.3" stop-color="#0b0d10" stop-opacity="0.55"/>
		<stop offset="0.68" stop-color="#0b0d10" stop-opacity="0.58"/>
		<stop offset="1" stop-color="#0b0d10" stop-opacity="0.88"/>
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
