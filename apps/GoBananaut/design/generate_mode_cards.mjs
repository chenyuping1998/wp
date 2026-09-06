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
//   bonus100    the housing with all five reels at the baseline.
//   bonus200    the same housing, reel 1 one row taller.
//   bonus300    the same housing, reel 1 at full height.
//               The three tiers differ by exactly one thing — the number of
//               steps already spent when the round opens (buy_start_steps in
//               game_config.py: 0 / 1 / 2) — so that is the only thing the art
//               varies. Nothing else changes between them, because anything
//               that did would imply a difference that is not there.
//   holdandspin a board of blank cells with Coins stuck to it. Deliberately
//               shares nothing with the other three, because it is not free
//               spins: it pays coins, not ways.
//
// THE HOUSING IS ALWAYS DRAWN AT FULL HEIGHT, six slots on every reel, with the
// slots a reel has not reached yet left as empty frames. That is the whole point
// of the picture: a card showing only the reels a tier opens with would be three
// boards of different sizes, and the thing being sold is not the size — it is
// how far up the housing the tier starts and how much room is left above it.
//
// The previous version of these cards drew the previous generation's Dynamite:
// one, two and three reels overwritten with a single symbol. This game has no
// such mechanic. It also had card_bonus200 and card_bonus300 rendering as the
// same image.
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
// The x2 plate carries a label, so this renderer needs a face. Same directory
// and same family the win banners and the gen-2 symbol sheet load.
const FONT_DIR = path.join(appRoot, 'static/fonts');
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

// ── the stretch board ───────────────────────────────────────────────────────
//
// Board shape, from the maths. Mirrored from game_config.py's ladder rather than
// typed as three literal arrays, so the cards cannot disagree with the rounds
// they sell if the ladder ever moves.
const REELS = 5;
const BASE_ROWS = 4;
const MAX_ROWS = 6;
const START_STEPS = { bonus100: 0, bonus200: 1, bonus300: 2 };

/** Steps spent left to right, depth first: reel 1 fills to six before reel 2. */
const rowsForSteps = (steps) => {
	const rows = Array(REELS).fill(BASE_ROWS);
	let remaining = steps;
	for (let reel = 0; reel < REELS && remaining > 0; reel += 1) {
		const take = Math.min(remaining, MAX_ROWS - BASE_ROWS);
		rows[reel] += take;
		remaining -= take;
	}
	return rows;
};

// SIZED BY THE HEIGHT, and the height is the binding constraint. A wide card
// only ever shows y 124..374 — 250px — and the housing has to fit SIX rows in
// it, where the old three-row motif had to fit three.
//
// 35, and the working is worth keeping because 37 was tried and the bottom row
// came off the card: six cells and five gaps is 6c + 15, the housing adds 7 of
// padding at each end, and that has to come in under 250. At 37 it is 251 — one
// pixel over, which is enough to clip the bottom rail on every card. At 35 it is
// 239 and there is 5px of air at each end.
//
// It leaves horizontal room unused (187 of 360), which is fine. A board is a
// board; stretching the columns to fill the width would draw a shape the game
// never makes.
const CELL = 35;
const GAP = 3;
const BOARD_W = REELS * CELL + (REELS - 1) * GAP;
const BOARD_H = MAX_ROWS * CELL + (MAX_ROWS - 1) * GAP;

// The ice cyan ReelGrow washes a doubling column in. Same value, because the
// card is a promise about a specific thing the player is about to see.
const DOUBLE_TINT = '#8fe4ff';

/**
 * The x2 plate.
 *
 * ReelGrow straddles the reel's top edge with it, half in and half out. This
 * one sits just INSIDE instead, and that is a crop problem rather than a
 * stylistic one: a full-height reel's top edge is the top of the housing, which
 * on a wide card is within a few pixels of where the crop begins — the first
 * render had bonus300's plate sliced through the middle.
 */
const x2Plate = (cx, cy) => {
	const w = 30;
	const h = 15;
	return (
		`<rect x="${cx - w / 2 - 3}" y="${cy - h / 2 - 3}" width="${w + 6}" height="${h + 6}" rx="7" ` +
		`fill="${DOUBLE_TINT}" opacity="0.18"/>` +
		`<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="4" ` +
		`fill="#081620" stroke="${DOUBLE_TINT}" stroke-width="1.6"/>` +
		// No dominant-baseline: resvg's support for it is patchy, and a label that
		// silently sits half a line high is the kind of thing nobody notices until
		// it has shipped. Offset from the baseline by hand instead.
		`<text x="${cx}" y="${cy + 3.6}" font-family="Titan One" font-size="10.5" ` +
		`fill="${DOUBLE_TINT}" text-anchor="middle">x2</text>`
	);
};

/**
 * The housing at full height with the tier's opening board standing in it.
 *
 * Three things the picture has to carry, in this order of importance:
 *
 *   1. THE EMPTY SLOTS. Every reel is drawn six deep and the ones it has not
 *      reached are open frames. This is the only part of the card that says the
 *      board grows at all, and it is what makes the three tiers comparable —
 *      same housing, different fill.
 *   2. WHICH WAY IT GROWS. The board is bottom-anchored and fills upward, the
 *      way the game draws it, so the empty frames are always ABOVE.
 *   3. THE DOUBLING. A reel above the baseline is washed in the ice cyan
 *      ReelGrow uses and carries the same x2 plate. A bought round opens inside
 *      Free Spins, so a taller reel is doubling from its very first spin — the
 *      card would be understating the tier if it left that out.
 */
const stretchBoard = (steps) => {
	const rows = rowsForSteps(steps);
	const x0 = MOTIF.cx - BOARD_W / 2;
	const yBottom = MOTIF.cy + BOARD_H / 2;
	// slot 0 is the BOTTOM one: the board fills upward, so counting from the
	// bottom means a cell's index does not change when the reel grows.
	const slotY = (i) => yBottom - (i + 1) * CELL - i * GAP;
	const reelX = (reel) => x0 + reel * (CELL + GAP);

	// A board of one symbol reads as a blast, which is the wrong mechanic; a
	// board of nine reads as noise at 37px. Five, cycled, looks like a board.
	const FILL = ['h3', 'l1', 'h2', 'l3', 'h1'];
	const grownReels = rows.filter((r) => r > BASE_ROWS).length;

	let out =
		`<ellipse cx="${MOTIF.cx}" cy="${MOTIF.cy}" rx="150" ry="128" ` +
		`fill="${grownReels ? DOUBLE_TINT : '#ffd75e'}" opacity="0.2" filter="url(#soft)"/>`;

	// THE HOUSING ITSELF — the frame the whole thing happens inside, drawn once
	// around all six rows. Without it the empty slots read as missing symbols
	// rather than as room.
	out +=
		`<rect x="${x0 - 7}" y="${slotY(MAX_ROWS - 1) - 7}" width="${BOARD_W + 14}" ` +
		`height="${BOARD_H + 14}" rx="7" fill="#0a0f14" opacity="0.55"/>` +
		`<rect x="${x0 - 7}" y="${slotY(MAX_ROWS - 1) - 7}" width="${BOARD_W + 14}" ` +
		`height="${BOARD_H + 14}" rx="7" fill="none" stroke="url(#reelLock)" stroke-width="3"/>`;

	for (let reel = 0; reel < REELS; reel += 1) {
		const cx = reelX(reel) + CELL / 2;
		const height = rows[reel];
		for (let i = 0; i < MAX_ROWS; i += 1) {
			const y = slotY(i);
			const cy = y + CELL / 2;
			if (i >= height) {
				// AN EMPTY SLOT. Dashed, and faint: it is room, not a cell. A solid
				// outline here reads as a cell that failed to draw its symbol.
				out +=
					`<rect x="${reelX(reel)}" y="${y}" width="${CELL}" height="${CELL}" rx="4" ` +
					`fill="#0d141b" opacity="0.5"/>` +
					`<rect x="${reelX(reel) + 1.5}" y="${y + 1.5}" width="${CELL - 3}" height="${CELL - 3}" ` +
					`rx="3" fill="none" stroke="#8aa0b4" stroke-width="1.4" stroke-dasharray="5 4" ` +
					`opacity="0.42"/>`;
				continue;
			}
			// A FILLED CELL. The new rows above the baseline always carry the top
			// symbol: they are the thing being sold, and a low card up there would
			// undersell what the tier just bought.
			const above = i >= BASE_ROWS;
			const name = above ? 'h1' : FILL[(reel * 2 + i) % FILL.length];
			out +=
				`<rect x="${reelX(reel)}" y="${y}" width="${CELL}" height="${CELL}" rx="4" ` +
				`fill="#25333f" opacity="0.95"/>` +
				sym(name, cx, cy, CELL * 0.94);
		}

		if (height < MAX_ROWS) {
			// WHICH WAY IT FILLS. The dashed slots say there is room; they do not say
			// the room is filled from below, and a player who has never seen the
			// board could reasonably read the empty half as the part that is
			// finished. One chevron per reel, pointing the way the reel grows.
			//
			// A reel already at full height gets none, which is the other half of
			// the same statement: there is nowhere left for it to go.
			const emptyTop = slotY(MAX_ROWS - 1);
			const emptyBottom = slotY(height) + CELL;
			const my = (emptyTop + emptyBottom) / 2;
			const half = 9;
			out +=
				`<path d="M ${cx - half} ${my + half * 0.6} L ${cx} ${my - half * 0.6} ` +
				`L ${cx + half} ${my + half * 0.6}" fill="none" stroke="${DOUBLE_TINT}" ` +
				`stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.42"/>`;
		}

		if (height > BASE_ROWS) {
			// The doubling: a wash over the whole column and an edge around it, the
			// same two marks ReelGrow makes on the board.
			const top = slotY(height - 1);
			const h = height * CELL + (height - 1) * GAP;
			out +=
				`<rect x="${reelX(reel)}" y="${top}" width="${CELL}" height="${h}" rx="4" ` +
				`fill="${DOUBLE_TINT}" opacity="0.16"/>` +
				`<rect x="${reelX(reel) - 2}" y="${top - 2}" width="${CELL + 4}" height="${h + 4}" ` +
				`rx="6" fill="none" stroke="${DOUBLE_TINT}" stroke-width="2.4" opacity="0.9"/>` +
				x2Plate(cx, top + 11);
		}
	}
	return out;
};

const MOTIFS = {
	// 0 / 1 / 2 steps already spent (buy_start_steps in game_config.py) puts the
	// opening board at 4-4-4-4-4 / 5-4-4-4-4 / 6-4-4-4-4. That is the only
	// difference between the tiers, so it is the only thing the art varies.
	bonus100: stretchBoard(START_STEPS.bonus100),
	bonus200: stretchBoard(START_STEPS.bonus200),
	bonus300: stretchBoard(START_STEPS.bonus300),

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
	<!--
		GUNMETAL, not olive. This gradient was the jungle generation's, and it is
		the same swap the board's own frame_bg took: three cards showing a space
		capsule's reel housing were sitting on a khaki ground.
	-->
	<linearGradient id="ground" x1="0" y1="0" x2="0.35" y2="1">
		<stop offset="0" stop-color="#26333f"/>
		<stop offset="0.5" stop-color="#141d26"/>
		<stop offset="1" stop-color="#080d13"/>
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
		<stop offset="0" stop-color="#060b11" stop-opacity="0.92"/>
		<stop offset="1" stop-color="#060b11" stop-opacity="0"/>
	</linearGradient>
	<!--
		Never fully open. The old ramp dropped to 12% across the middle, which is
		fine on a tall card where the middle carries no text — and is the WHOLE
		card once a wide crop throws the ends away. The floor here is what
		guarantees a dark ground under every word regardless of how the card is
		cropped; the variation on top of it is only for depth.
	-->
	<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#060b11" stop-opacity="0.72"/>
		<stop offset="0.3" stop-color="#060b11" stop-opacity="0.55"/>
		<stop offset="0.68" stop-color="#060b11" stop-opacity="0.58"/>
		<stop offset="1" stop-color="#060b11" stop-opacity="0.88"/>
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
