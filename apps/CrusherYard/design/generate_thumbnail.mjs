// Crusher Yard store thumbnail — composed from the game's own generated art, so
// the cover cannot drift away from what the game actually looks like.
//
// 408x546 portrait, matching the size the platform lists games at. The layout is
// the one thing a thumbnail has to get right at ~120px wide in a grid: one clear
// focal object, the title, and enough of the board to say what kind of game this
// is. Everything else is atmosphere.
//
// For THIS game the "what kind" is the hard part, and it is not the tumbling —
// it is that the matching symbols do not have to touch. The fragment below is
// arranged to say that on its own, before anyone reads the tagline.
//
// Usage: node design/generate_thumbnail.mjs <dir with node_modules for @resvg/resvg-js>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_thumbnail.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sprite = (...parts) => path.join(appRoot, 'static/assets/sprites', ...parts);

const dataUri = (file) => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;

const W = 408;
const H = 546;

// The scene is one painting now — there is no bg_feature to crop from any more.
const bg = dataUri(sprite('crusherYardBackground', 'bg_background.png'));
const sym = (name) => dataUri(sprite('crusherYardSymbols', `${name}.png`));

// A small board fragment rather than the whole 6x5: at thumbnail size a full
// board is 30 illegible specks, whereas a 3x3 corner still reads as "grid of
// symbols" while leaving the individual art recognisable.
const CELL = 78;
const GRID_X = (W - CELL * 3) / 2;
const GRID_Y = 214;
// Deliberately shows the SAME symbol scattered rather than gathered. This is the
// one thing about the game a cover has to communicate, because a player arriving
// from a cluster game will otherwise assume the pieces have to touch: three L1
// nuts at the corners with other symbols between them says "count, not shape".
const layout = [
	['l1', 'h2', 'l1'],
	['h3', 'l1', 'h1'],
	['l1', 'h4', 'l1'],
];
const MARKED = [
	[true, false, true],
	[false, true, false],
	[true, false, true],
];

const cells = layout
	.flatMap((row, r) =>
		row.map((name, c) => {
			const x = GRID_X + c * CELL;
			const y = GRID_Y + r * CELL;
			// The win mark the game actually draws: jaw ticks at the corners, not a
			// filled plate. A filled plate was the heat grid, which this game has not
			// got — showing it on the cover would advertise a mechanic that is gone.
			const t = CELL * 0.24;
			const l = x + 5;
			const tp = y + 5;
			const rr = x + CELL - 5;
			const b = y + CELL - 5;
			const mark = MARKED[r][c]
				? `<rect x="${x + 3}" y="${y + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="7" fill="#ffb03a" opacity="0.14"/>
				   <path d="M${l} ${tp + t} L${l} ${tp} L${l + t} ${tp} M${rr - t} ${tp} L${rr} ${tp} L${rr} ${tp + t} M${rr} ${b - t} L${rr} ${b} L${rr - t} ${b} M${l + t} ${b} L${l} ${b} L${l} ${b - t}"
				      fill="none" stroke="#ffc233" stroke-width="3.5" opacity="0.95"/>`
				: `<rect x="${x + 3}" y="${y + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="7" fill="#12171c" opacity="0.7"/>`;
			return `${mark}<image x="${x + 8}" y="${y + 8}" width="${CELL - 16}" height="${CELL - 16}" href="${sym(name)}"/>`;
		}),
	)
	.join('');

// The pressure gauge, mid-feature, sitting above the fragment exactly as it does
// in game. It is the product's one differentiator, so it belongs on the cover.
const GAUGE_Y = GRID_Y - 46;
const GAUGE_W = CELL * 3;
const gauge = `
	<rect x="${GRID_X}" y="${GAUGE_Y}" width="${GAUGE_W}" height="30" rx="9" fill="#14140f" opacity="0.92"/>
	<rect x="${GRID_X + 6}" y="${GAUGE_Y + 6}" width="${(GAUGE_W - 12) * 0.62}" height="18" rx="4" fill="#552a08"/>
	<rect x="${GRID_X + 6}" y="${GAUGE_Y + 6}" width="${(GAUGE_W - 12) * 0.62}" height="8" rx="4" fill="#ffa32c" opacity="0.5"/>
	<rect x="${GRID_X}" y="${GAUGE_Y}" width="${GAUGE_W}" height="30" rx="9" fill="none" stroke="#6b5a3a" stroke-width="1.6" opacity="0.85"/>
	<text x="${GRID_X + GAUGE_W - 12}" y="${GAUGE_Y + 23}" text-anchor="end" font-family="Georgia, serif"
		font-size="22" font-weight="bold" fill="#ffa32c" stroke="#0d0d08" stroke-width="4" paint-order="stroke">x13</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<defs>
		<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
		<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#000000" stop-opacity="0.55"/>
			<stop offset="0.3" stop-color="#000000" stop-opacity="0.1"/>
			<stop offset="0.62" stop-color="#000000" stop-opacity="0.2"/>
			<stop offset="1" stop-color="#000000" stop-opacity="0.85"/>
		</linearGradient>
		<linearGradient id="title" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#fff6d2"/>
			<stop offset="0.5" stop-color="#ffc233"/>
			<stop offset="1" stop-color="#b06a06"/>
		</linearGradient>
		<radialGradient id="bloom" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="#ffb457" stop-opacity="0.38"/>
			<stop offset="1" stop-color="#c9721d" stop-opacity="0"/>
		</radialGradient>
	</defs>

	<g clip-path="url(#frame)">
		<!-- background cropped to portrait from the centre, where the press is -->
		<image x="-342" y="-30" width="1092" height="614" href="${bg}" preserveAspectRatio="xMidYMid slice"/>
		<ellipse cx="${W / 2}" cy="${GRID_Y + CELL * 1.5}" rx="230" ry="190" fill="url(#bloom)"/>

		${cells}
		${gauge}

		<rect width="${W}" height="${H}" fill="url(#shade)"/>

		<text x="${W / 2}" y="118" text-anchor="middle" font-family="Georgia, serif" font-size="52"
			font-weight="bold" letter-spacing="2"
			fill="url(#title)" stroke="#20160a" stroke-width="8" paint-order="stroke">CRUSHER</text>
		<text x="${W / 2}" y="168" text-anchor="middle" font-family="Georgia, serif" font-size="52"
			font-weight="bold" letter-spacing="6"
			fill="url(#title)" stroke="#20160a" stroke-width="8" paint-order="stroke">YARD</text>

		<text x="${W / 2}" y="${H - 62}" text-anchor="middle" font-family="Georgia, serif" font-size="21"
			letter-spacing="3" fill="#ffd7a0" stroke="#12100a" stroke-width="4" paint-order="stroke">PAY ANYWHERE</text>
		<text x="${W / 2}" y="${H - 30}" text-anchor="middle" font-family="Georgia, serif" font-size="26"
			font-weight="bold" letter-spacing="2" fill="#fff0c8" stroke="#12100a" stroke-width="5" paint-order="stroke">15,000x MAX WIN</text>

		<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="18" fill="none" stroke="#8d99a3" stroke-width="3" opacity="0.75"/>
	</g>
</svg>`;

const out = path.join(appRoot, 'Thumbnail_CrusherYard.png');
fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: true } }).render().asPng());
console.log('wrote', path.relative(appRoot, out));
