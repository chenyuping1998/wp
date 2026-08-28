// The SOUL SEAL wordmark.
//
// The title is art, not text. A pixi Text node would have to pick one face at one
// weight and would give up the gilding, the cinnabar seal and the banner
// furniture that make this read as a logo rather than as a caption; and it would
// re-render on every layout change. One PNG, generated here, costs 60 KB.
//
// This replaces the scaffold's mark wholesale rather than recolouring it. The
// inherited one was TRIPLE WITCHING: bold monospace in phosphor green, standing
// on a ticker rule, with a rising-then-falling price line drawn through it. Every
// one of those choices carried the other game's meaning, so there was nothing to
// keep - a slot titled in DejaVu Sans Mono reads as a terminal readout, which was
// exactly the intent there and exactly wrong here.
//
// What the mark is built from instead:
//
//   TYPE      Cinzel, the game's display face - the same inscriptional Roman
//             capitals the low symbols are drawn as, so the title is set in the
//             alphabet the board is already showing. See game/fonts.ts.
//   LINE      One line. It was stacked over two at first, on the reasoning that
//             SOUL and SEAL are both four letters and would justify to the same
//             width for free. They did, and it made a block - which was the
//             problem rather than the point: at the size the loading screen draws
//             it, a two-line block is as tall as it is wide and competes with the
//             character underneath it for the middle of the screen. Set on one
//             line it behaves like a masthead and leaves the screen alone.
//   GILDING   A brass ramp with the highlight at the top left, because the game's
//             single light source is the altar candle low and left of centre
//             (art-bible 2.3). The drop underneath is wood-dark rather than
//             black, so the mark sits in the same material world as the frame.
//   WEIGHT    Drawn as three passes, not one, because resvg renders a VARIABLE
//             font at its default instance: asking for font-weight 700 on
//             Cinzel.ttf silently produced the 400 master and the mark came out
//             as fine as body copy. The weight is added geometrically instead -
//             a wood-dark outline pass, then the gilded glyph stroked in its own
//             fill colour, which thickens every stem by the stroke width.
//   RULES     Inscription rules above and below the type, with a cinnabar lozenge
//             centred on each. These replaced two hanging streamers, which at
//             this width were 44px wide and 320 tall and read as nails driven
//             into the canvas rather than as paper.
//
// There is no cinnabar plaque behind the type any more. There was, and it was
// the strongest thing in the mark: a filled red block reads before the letters
// do, so the logo announced a red rectangle and then said the name. It also
// fought the loading screen, which already darkens the background behind it - a
// panel over a panel. The gilding is enough on its own against a dark ground,
// which is the only ground this is ever drawn on.
//
// Usage: node design/generate_wordmark.mjs <dir with node_modules for @resvg/resvg-js>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/generate_wordmark.mjs <dir with node_modules>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/soulSealUi');
const FONT = path.join(appRoot, 'static/fonts/Cinzel.ttf');
fs.mkdirSync(OUT_DIR, { recursive: true });

// art-bible section 2.1.
const WOOD_DARK = '#3A2418';
const BRASS = '#A8763E';
const BRASS_HI = '#D9A85C';
const CANDLE = '#FFCB6B';
const PALE = '#FFF0C4';
const CINNABAR = '#C8102E';
const CINNABAR_HI = '#FF3B4E';

// 2080x840 drawn at 2x. The scaffold's asset was 2080x500, a 4.16:1 letterbox
// shaped by its single line of type plus a chart to the right of it; a stacked
// lockup needs a squarer frame. LoadingScreen reads the ratio from
// WORDMARK_ASPECT in game/constants rather than repeating these numbers.
// 3120x600 drawn at 2x. Wide, because the mark is one line now: the stacked
// version was 1040x420 and the version before that was a 4.16:1 letterbox built
// around one line of type plus a price chart. LoadingScreen reads the ratio from
// WORDMARK_ASPECT in game/constants rather than repeating these numbers, which
// is why changing it here is safe.
const W = 1560;
const H = 300;
const SCALE = 2;

const TITLE = 'SOUL SEAL';

const SIZE = 168;
const TRACK = 26;
const CX = W / 2;
// Cinzel's cap height is ~0.70em, so a 168px line is ~118px of ink. This
// baseline centres that ink between the two rules.
const BASE = 205;

// How much the gilded pass is stroked in its own colour. Half of it lands
// outside the outline, so a stem gains STROKE px of width overall.
const FATTEN = 9;
// The dark outline under it. Wider than FATTEN so a dark edge survives.
const OUTLINE = 22;

/** One line of gilded type: wood-dark outline, then a fattened gilded body. */
const gilded = (text, baseline) => {
	const face =
		`text-anchor="middle" font-family="Cinzel" font-size="${SIZE}" ` +
		`letter-spacing="${TRACK}" stroke-linejoin="round"`;
	return `
	<text x="${CX}" y="${baseline + 8}" ${face}
	      fill="${WOOD_DARK}" stroke="${WOOD_DARK}" stroke-width="${OUTLINE}"
	      paint-order="stroke" opacity="0.9">${text}</text>
	<text x="${CX}" y="${baseline}" ${face}
	      fill="${WOOD_DARK}" stroke="${WOOD_DARK}" stroke-width="${OUTLINE}"
	      paint-order="stroke">${text}</text>
	<text x="${CX}" y="${baseline}" ${face}
	      fill="url(#gild)" stroke="url(#gild)" stroke-width="${FATTEN}"
	      paint-order="stroke">${text}</text>`;
};

// Sized to ENCLOSE the lockup, not to sit inside it. The first pass made it a
// square 364 wide behind type that measures about 530, so the stamp read as a
// dark panel someone had left behind the middle two letters.


// Half the rule's length. Sized against the type rather than the canvas: the
// rules frame the words, so they must grow with the tracking and not with the
// margin. Nine glyphs at SIZE plus eight tracking gaps, and a little air.
const RULE_HALF = (TITLE.length * SIZE * 0.62 + (TITLE.length - 1) * TRACK) / 2 + 40;

/** An inscription rule with a cinnabar lozenge on it. */
const rule = (y) => `
	<g>
		<rect x="${CX - RULE_HALF}" y="${y}" width="${RULE_HALF * 2}" height="5" rx="2"
		      fill="${BRASS}" opacity="0.85"/>
		<rect x="${CX - RULE_HALF}" y="${y}" width="${RULE_HALF * 0.38}" height="5" rx="2"
		      fill="${CANDLE}" opacity="0.9"/>
		<path d="M ${CX} ${y - 13} L ${CX + 17} ${y + 2} L ${CX} ${y + 17} L ${CX - 17} ${y + 2} Z"
		      fill="${CINNABAR}" stroke="${BRASS_HI}" stroke-width="4"/>
	</g>`;

// Highlight top left, shadow bottom right: the altar candle sits low and left of
// centre, so the lit face of any raised surface is its upper left. Stated once
// here because every other generated brass asset follows the same rule.
const defs = `
	<linearGradient id="gild" x1="0.15" y1="0" x2="0.85" y2="1">
		<stop offset="0" stop-color="${PALE}"/>
		<stop offset="0.34" stop-color="${CANDLE}"/>
		<stop offset="0.62" stop-color="${BRASS_HI}"/>
		<stop offset="1" stop-color="${BRASS}"/>
	</linearGradient>`;

const body = `
	${rule(46)}
	${rule(H - 42)}
	${gilded(TITLE, BASE)}`;

const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
	`<defs>${defs}</defs>${body}</svg>`;

const resvg = new Resvg(svg, {
	fitTo: { mode: 'width', value: W * SCALE },
	font: { fontFiles: [FONT], loadSystemFonts: true, defaultFontFamily: 'Cinzel' },
});
const out = path.join(OUT_DIR, 'wordmark.png');
fs.writeFileSync(out, resvg.render().asPng());
console.log(
	`wrote ${path.relative(appRoot, out)}  ${(fs.statSync(out).size / 1024).toFixed(1)} KB  ` +
		`(${W * SCALE}x${H * SCALE})`,
);
console.log(`  game/constants.ts WORDMARK_ASPECT must be ${W} / ${H} = ${(W / H).toFixed(4)}`);
