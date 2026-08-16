// The TRIPLE WITCHING wordmark.
//
// Titan One is the wrong face for this title and always was. It is a heavy
// rounded cartoon display face - exactly right for a fruit slot, and the reason
// it was chosen was that it is self-hosted, OFL, and passes certification's
// "no standard fonts" check. But the game it is sitting on top of is a trading
// terminal in green phosphor, and a bubbly rounded logo fights every other thing
// on screen.
//
// The fix is NOT another webfont. A logo is one string, drawn once, at one size:
// making it an asset rather than live text means no new font ships, nothing new
// can 404, and the font-coverage problem (see src/game/fontCoverage.ts) does not
// apply to it at all. It also allows treatment a Text style cannot express - the
// candle standing in for the I, the ticker rule, the bracket ticks.
//
// Set in DejaVu Sans Mono Bold, which is used at DESIGN time only to produce
// this PNG; the font itself is never shipped. Monospace is the point: it is the
// typographic signature of a terminal, and the even rhythm suits a wordmark that
// has to read at both 52px on the loading screen and small in the corner.
//
// Usage: node design/generate_wordmark.mjs <dir with node_modules/@resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/generate_wordmark.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/tripleWitchingUi');
fs.mkdirSync(OUT_DIR, { recursive: true });

// DejaVu Sans Mono Bold. Shipped inside matplotlib, which is already a
// dependency of the maths side of this project, so it needs no new download.
const FONT_DIRS = [
	path.resolve(appRoot, '../../../math-sdk/env/Lib/site-packages/matplotlib/mpl-data/fonts/ttf'),
];
const MONO = 'DejaVu Sans Mono';

const BULL = '#4bd67f';
const BEAR = '#ff5566';
const PALE = '#eafff2';

// 4x the drawn size, downsampled by the renderer, so the wordmark stays crisp on
// a high-DPI canvas and when the loading screen scales it up on a wide monitor.
const W = 1040;
const H = 250;
const SCALE = 2;

const TOP = 'TRIPLE';
const BOTTOM = 'WITCHING';

// Two lines, not one: "TRIPLE WITCHING" set on a single line at this weight is very
// wide and very short, which reads as a strapline rather than as a logo. Stacked
// and left-aligned against a rule, it reads as a terminal readout.
const body = `
	<!-- ticker rule the type stands on -->
	<rect x="76" y="196" width="892" height="5" fill="${BULL}" opacity="0.85"/>
	<rect x="76" y="196" width="300" height="5" fill="${PALE}" opacity="0.9"/>

	<!-- bracket ticks, the terminal's own furniture -->
	<g stroke="${BULL}" stroke-width="5" fill="none" opacity="0.75" stroke-linecap="square">
		<path d="M 76 44 L 40 44 L 40 118"/>
		<path d="M 968 44 L 1004 44 L 1004 118"/>
		<path d="M 40 176 L 40 216 L 76 216"/>
		<path d="M 1004 176 L 1004 216 L 968 216"/>
	</g>

	<!--
		Solid, with a hard green offset behind it rather than a vertical gradient.
		The gradient version faded the lower half of every glyph into the
		background and the mark read as washed out at the size it actually gets
		used; an offset shadow keeps the counters at full contrast and still puts
		phosphor green into the letterforms.
	-->
	<text x="82" y="116" font-family="${MONO}" font-weight="bold" font-size="112"
	      letter-spacing="10" fill="${BULL}" opacity="0.55">${TOP}</text>
	<text x="76" y="112" font-family="${MONO}" font-weight="bold" font-size="112"
	      letter-spacing="10" fill="${PALE}">${TOP}</text>

	<text x="76" y="188" font-family="${MONO}" font-weight="bold" font-size="72"
	      letter-spacing="10" fill="${BULL}" opacity="0.95">${BOTTOM}</text>

	<!--
		The quote that gives the mark its meaning: a red tick and a figure falling
		through the rule. Sits in the space "CALL" leaves to the right, so it reads
		as part of the lockup rather than as an ornament stuck on the end.
	-->
	<g opacity="0.95">
		<path d="M 548 140 L 616 102 L 668 142 L 748 66" fill="none" stroke="${BULL}"
		      stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
		<path d="M 748 66 L 802 124 L 862 98 L 936 190" fill="none" stroke="${BEAR}"
		      stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
		<circle cx="936" cy="190" r="11" fill="${BEAR}"/>
		<circle cx="936" cy="190" r="4" fill="${PALE}"/>
	</g>
`;

const defs = '';

const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
	`<defs>${defs}</defs>${body}</svg>`;

const resvg = new Resvg(svg, {
	fitTo: { mode: 'width', value: W * SCALE },
	font: { fontDirs: FONT_DIRS, loadSystemFonts: true, defaultFontFamily: MONO },
});
const out = path.join(OUT_DIR, 'wordmark.png');
fs.writeFileSync(out, resvg.render().asPng());
console.log(
	`wrote ${path.relative(appRoot, out)}  ${(fs.statSync(out).size / 1024).toFixed(1)} KB  ` +
		`(${W * SCALE}x${H * SCALE})`,
);
