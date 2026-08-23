// Card art for the four non-base bet modes.
//
// These replace design/generate_buy_icons.mjs, which drew "one bag, two bags,
// three bags" for the scaffold's three buys. It had been dead for a while
// without anyone noticing: its source path was static/assets/sprites/
// soulSealBags/expand.png, a directory this game deleted with the bag mechanic,
// and betModeMeta was still pointing every card at buy_bags_N.png. Nothing threw
// - a DOM <img> with a 404 src is just an empty box - so the cards rendered with
// a hole where the icon goes.
//
// What each one has to say, in one glance, is how its mode DIFFERS. So they are
// built as two pairs that read against each other:
//
//   tide / flood   the two active modes. Same drawing, three wisps against five,
//                  because that is exactly the difference: AR5 carries 28-32
//                  carriers per reel and AR10 carries 38-44.
//   rite / grand   the two buys. A talisman under a seal, and the same talisman
//                  with a wild's mask locked over it - the 300x mode's whole
//                  promise is that the wild is always there.
//
// BUILT FROM THE GAME'S OWN SYMBOL ART, not drawn beside it.
//
// The first version drew every motif as vectors - flat teardrops for the
// spirits, a yellow rectangle with a red cross for the talisman, a brown blob
// with triangles for the mask. Held up against the cards they sit on, which are
// painted, it read as placeholder art that had been left in: the menu looked
// like a different product from the game behind it.
//
// So the motifs are now the actual sprites, composited in. Nothing can drift out
// of style because it IS the style, and when the symbol art is replaced the cards
// follow with the next run.
//
//   tide / flood   three carriers against five. The same symbol at the density
//                  that separates the two modes: AR5 carries 28-32 per reel and
//                  AR10 carries 38-44.
//   rite           the scatter that opens the ordinary feature.
//   grand          the wild beside a carrier - the 300x mode guarantees exactly
//                  that pair on every spin, so the card is a picture of the
//                  promise.
//
// The brass seal ring and the ground behind them are still drawn, because they
// are furniture rather than subject.
//
// Usage: node design/generate_mode_icons.mjs <dir with node_modules for @resvg/resvg-js>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/generate_mode_icons.mjs <dir with node_modules>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/soulSealUi');
const SYMBOLS = path.join(appRoot, 'static/assets/sprites/soulSealSymbols');
fs.mkdirSync(OUT_DIR, { recursive: true });

// The keyed sprites, inlined as data URIs. resvg has no notion of a working
// directory for hrefs, and inlining also means the generated PNG cannot end up
// referencing a file that later moves.
const sprite = (name) => {
	const file = path.join(SYMBOLS, `${name}.png`);
	if (!fs.existsSync(file)) {
		console.error(`missing symbol art: ${path.relative(appRoot, file)}`);
		console.error('run design/import_symbols.mjs first');
		process.exit(1);
	}
	return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
};

/** One symbol placed on the motif canvas, sized as a fraction of it. */
const symbolAt = (name, cx, cy, size, opacity = 1) => {
	const w = S * size;
	return (
		`<image href="${sprite(name)}" x="${cx * S - w / 2}" y="${cy * S - w / 2}" ` +
		`width="${w}" height="${w}" opacity="${opacity}"/>`
	);
};

// The keyed cover art, for the one card that uses a painted figure rather than a
// reel symbol. Same directory design/import_cover.mjs writes to.
const COVERS = path.join(appRoot, 'design/source/cover');
const cover = (name) => {
	const file = path.join(COVERS, `${name}.png`);
	if (!fs.existsSync(file)) {
		console.error(`missing cover art: ${path.relative(appRoot, file)}`);
		console.error('run design/import_cover.mjs first');
		process.exit(1);
	}
	return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
};

/**
 * A non-square image placed by HEIGHT, keeping its own proportions.
 *
 * symbolAt() can assume square because every reel symbol is drawn into a 200x200
 * cell. The cover art is not - character.png is 1043x1008 - and drawing it square
 * would squash it, subtly and only on that one card.
 */
const coverAt = (name, cx, cy, height, aspect) => {
	const h = S * height;
	const w = h * aspect;
	return (
		`<image href="${cover(name)}" x="${cx * S - w / 2}" y="${cy * S - h / 2}" ` +
		`width="${w}" height="${h}"/>`
	);
};

const WOOD_DARK = '#3A2418';
const BRASS = '#A8763E';
const BRASS_HI = '#D9A85C';
const CANDLE = '#FFCB6B';
const SPIRIT = '#4FD1C5';
const TALISMAN = '#F2D544';
const CINNABAR = '#C8102E';

const S = 256;
const SCALE = 2;

/** The brass seal ring that says "sealed". */
const sealRing = (cx, cy, r, thick) => `
	<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${WOOD_DARK}" stroke-width="${thick + 6}"/>
	<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#brass)" stroke-width="${thick}"/>`;

/**
 * A row of carriers, tallest in the middle.
 *
 * A fixed arrangement rather than a random one: the two active-mode cards are
 * the same picture at two densities, and that only reads if the shapes line up.
 */
const carrierRow = (count) => {
	const span = 0.82;
	const step = span / count;
	const x0 = (1 - span) / 2;
	return Array.from({ length: count }, (_, i) => {
		const lift = Math.sin((Math.PI * (i + 0.5)) / count);
		// Bigger and more opaque toward the middle, so a crowd has a front row.
		const size = (count > 3 ? 0.34 : 0.42) * (0.78 + 0.22 * lift);
		return symbolAt('m', x0 + step * (i + 0.5), 0.62 - 0.1 * lift, size, 0.72 + 0.28 * lift);
	}).join('');
};

const MOTIFS = {
	// three carriers: the 5x mode
	tide: carrierRow(3),
	// five carriers: the 10x mode, the same picture at the density that separates
	// the two
	flood: carrierRow(5),
	// the scatter that opens the ordinary feature
	rite: `
		${sealRing(S / 2, S / 2, S * 0.36, 12)}
		${symbolAt('s', 0.5, 0.5, 0.52)}`,
	// The wild beside a carrier: what the 300x mode guarantees on every spin.
	//
	// The wild here is the PAINTED priestess from the cover art, not the reel
	// symbol. The reel symbol is her face inside a torii frame, drawn to read at
	// 104px in a grid; on a card six times that size the frame is the loudest thing
	// in it and she is a detail inside it. The cover art is the same character with
	// the talisman in her hand, which is what the card is about.
	//
	// 1043x1008 is the keyed canvas; 1.03 is its aspect. Placed by height so the
	// ratio survives - see coverAt.
	grand: `
		${sealRing(S / 2, S / 2, S * 0.38, 12)}
		${coverAt('character', 0.44, 0.5, 0.92, 1043 / 1008)}
		${symbolAt('m', 0.74, 0.62, 0.34)}`,
};

// ── the full-bleed card ─────────────────────────────────────────────────────
//
// 360x520 is the card's own proportion: BonusCard is 155-180px wide in a column
// whose height is set by a title, a four-line description, a price and a button.
// Opaque, because it goes behind all of that - a transparent card art would let
// the modal's own scrim through and each card would look like a different shade.
const CARD_W = 360;
const CARD_H = 520;
// Where the motif sits on the card. High, not centred: the lower half is under
// the description and the price, and a motif there fights text it cannot win
// against.
const CARD_MOTIF_CY = 0.37;
// 1.15 on the first pass, which left the motif reading as an icon centred on a
// card rather than as the card's subject. The scrim starts at 42% height, so the
// motif can grow until it reaches that without touching the text.
const CARD_MOTIF_SCALE = 1.8;

const card = (motif) => `
	<rect width="${CARD_W}" height="${CARD_H}" fill="url(#ground)"/>
	<!--
		Brick, at the wall's own scale. Two tones and no mortar line: at card size a
		drawn mortar grid reads as a checkerboard, and all this has to do is stop
		the ground being a flat gradient.
	-->
	<g opacity="0.14">
		${Array.from({ length: 13 }, (_, row) =>
			Array.from({ length: 7 }, (_, col) => {
				const h = CARD_H / 13;
				const w = CARD_W / 6;
				const x = col * w - (row % 2 ? w / 2 : 0);
				return `<rect x="${x + 2}" y="${row * h + 2}" width="${w - 4}" height="${h - 4}" rx="3" fill="${
					(row + col) % 3 === 0 ? '#2E5654' : '#16283A'
				}"/>`;
			}).join(''),
		).join('')}
	</g>
	<!-- candle pool from the foot, the game's single light source -->
	<ellipse cx="${CARD_W / 2}" cy="${CARD_H * 1.02}" rx="${CARD_W * 0.72}" ry="${CARD_H * 0.42}"
	         fill="${CANDLE}" opacity="0.1" filter="url(#soften)"/>
	<g transform="translate(${CARD_W / 2} ${CARD_H * CARD_MOTIF_CY}) scale(${CARD_MOTIF_SCALE}) translate(${-S / 2} ${-S / 2})">
		${motif}
	</g>
	<!--
		Scrims at BOTH ends, so every word on the card has a dark ground under it.

		The bottom one was always here, for the description and the price. The top
		one was not, and the longest title - "BUY GRAND SEALING" - was being read
		against the brass seal ring behind it. Ramped rather than flat: a hard edge
		across a card reads as a second card.
	-->
	<rect width="${CARD_W}" height="${CARD_H}" fill="url(#scrim)"/>
	<rect width="${CARD_W}" height="${CARD_H * 0.3}" fill="url(#scrimTop)"/>
	<rect x="1.5" y="1.5" width="${CARD_W - 3}" height="${CARD_H - 3}" rx="14" fill="none"
	      stroke="${BRASS}" stroke-width="3" opacity="0.55"/>`;

const defs = `
	<linearGradient id="brass" x1="0.15" y1="0" x2="0.85" y2="1">
		<stop offset="0" stop-color="${CANDLE}"/>
		<stop offset="0.5" stop-color="${BRASS_HI}"/>
		<stop offset="1" stop-color="${BRASS}"/>
	</linearGradient>
	<linearGradient id="ground" x1="0" y1="0" x2="0.3" y2="1">
		<stop offset="0" stop-color="#0B1420"/>
		<stop offset="0.55" stop-color="#16283A"/>
		<stop offset="1" stop-color="#1E3A3C"/>
	</linearGradient>
	<!-- The pool is a lit area, not an object: unblurred, its ellipse edge drew a
	     visible arc across the card. -->
	<filter id="soften" x="-30%" y="-30%" width="160%" height="160%">
		<feGaussianBlur stdDeviation="26"/>
	</filter>
	<linearGradient id="scrimTop" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0B1420" stop-opacity="0.9"/>
		<stop offset="1" stop-color="#0B1420" stop-opacity="0"/>
	</linearGradient>
	<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0B1420" stop-opacity="0"/>
		<stop offset="0.42" stop-color="#0B1420" stop-opacity="0.1"/>
		<stop offset="1" stop-color="#0B1420" stop-opacity="0.82"/>
	</linearGradient>`;

const render = (svgBody, width, height, out) => {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
		`viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${svgBody}</svg>`;
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: width * SCALE } }).render().asPng();
	fs.writeFileSync(out, png);
	console.log(`wrote ${path.relative(appRoot, out)}  ${(png.length / 1024).toFixed(1)} KB`);
};

for (const [name, motif] of Object.entries(MOTIFS)) {
	render(card(motif), CARD_W, CARD_H, path.join(OUT_DIR, `card_${name}.png`));
}
