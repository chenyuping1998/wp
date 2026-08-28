// Buy Bonus label fit guard.
//
// The label is drawn over a painted talisman, and nothing in the engine makes it
// stay inside one. Pixi's wordWrapWidth breaks between WORDS; a single word wider
// than the box still overflows, silently, and the only symptom is a screenshot.
//
// This has now been wrong twice, the same way both times: the talisman's width
// was taken from the button's box rather than from the ART. buybonus_plate.png is
// a 640x640 canvas with the paper occupying x 155..460 - 0.478 of it - so a theme
// that assumed 0.70 sized the type against a talisman half again as wide as the
// real one. "DISABLE" came out 109px on a 97px paper and hung off both edges.
//
// So the check measures both halves rather than trusting either:
//
//   * the paper, from the sprite's opaque bounding box
//   * the words, by rendering them in the real font and measuring the ink
//
// and asserts the longest word fits, with the painted border left clear.
//
// It also checks that buyBonusPlateInset matches the sprite, since the hover
// highlight and the idle glow are drawn from it and drift the same way.
//
// Skips, rather than fails, when the rendering tools are not present - the same
// contract design/check_collect_contract.mjs uses for the maths output.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const toolDir = path.resolve(appRoot, '../../../tools/gen');

if (!fs.existsSync(path.join(toolDir, 'node_modules/@resvg/resvg-js'))) {
	console.log('SKIP: no rendering tools at tools/gen - cannot measure the label');
	process.exit(0);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const PLATE = path.join(appRoot, 'static/assets/sprites/soulSealUi/buybonus_plate.png');
const FONT = path.join(appRoot, 'static/fonts/Cinzel.ttf');
const uiThemeSource = fs.readFileSync(path.join(appRoot, 'src/game/uiTheme.ts'), 'utf8');
const sharedSource = fs.readFileSync(
	path.resolve(appRoot, '../../packages/components-ui-pixi/src/constants.ts'),
	'utf8',
);

const num = (source, name) => {
	const m = source.match(new RegExp(`${name}:\\s*([0-9.]+)`)) ?? source.match(new RegExp(`${name}\\s*=\\s*([0-9.]+)`));
	if (!m) throw new Error(`could not read ${name}`);
	return Number(m[1]);
};

const UI_BASE_SIZE = num(sharedSource, 'UI_BASE_SIZE');
// UI_BASE_FONT_SIZE is defined as a fraction of UI_BASE_SIZE, so read the factor
// rather than the product.
const FONT_FACTOR = Number(sharedSource.match(/UI_BASE_FONT_SIZE\s*=\s*UI_BASE_SIZE\s*\*\s*([0-9.]+)/)?.[1]);
if (!Number.isFinite(FONT_FACTOR)) throw new Error('could not read UI_BASE_FONT_SIZE');

const plateScale = num(uiThemeSource, 'buyBonusPlateScale');
const labelRatio = num(uiThemeSource, 'buyBonusLabelSizeRatio');
const wrapWidth = num(uiThemeSource, 'buyBonusLabelWrapWidth');
const insetMatch = uiThemeSource.match(
	/buyBonusPlateInset:\s*\{\s*width:\s*([0-9.]+),\s*height:\s*([0-9.]+)/,
);
if (!insetMatch) throw new Error('could not read buyBonusPlateInset');
const inset = { width: Number(insetMatch[1]), height: Number(insetMatch[2]) };

// ── the paper, from the art ──────────────────────────────────────────────────
const plate = PNG.sync.read(fs.readFileSync(PLATE));
let minX = plate.width;
let maxX = 0;
let minY = plate.height;
let maxY = 0;
for (let y = 0; y < plate.height; y++) {
	for (let x = 0; x < plate.width; x++) {
		if (plate.data[(plate.width * y + x) * 4 + 3] > 16) {
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
	}
}
const measured = {
	width: (maxX - minX + 1) / plate.width,
	height: (maxY - minY + 1) / plate.height,
};

// ── the words, from the font ─────────────────────────────────────────────────
/** Ink width of a string, in em. */
const inkEm = (text) => {
	const SIZE = 100;
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="260">` +
		`<rect width="100%" height="100%" fill="#000"/>` +
		`<text x="20" y="180" font-family="Cinzel" font-weight="700" font-size="${SIZE}" ` +
		`fill="#fff">${text}</text></svg>`;
	const rendered = new Resvg(svg, {
		font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'Cinzel' },
	}).render();
	const img = PNG.sync.read(rendered.asPng());
	let lo = img.width;
	let hi = 0;
	for (let y = 0; y < img.height; y++) {
		for (let x = 0; x < img.width; x++) {
			if (img.data[(img.width * y + x) * 4] > 40) {
				if (x < lo) lo = x;
				if (x > hi) hi = x;
			}
		}
	}
	return hi < lo ? 0 : (hi - lo + 1) / SIZE;
};

// How much of the paper the type may use. The talisman has a painted border and
// a seal device at each end; type running to the paper's edge sits on them.
const USABLE = 0.85;

const paperWidth = UI_BASE_SIZE * plateScale * measured.width;
const fontSize = UI_BASE_SIZE * FONT_FACTOR * labelRatio;
const usable = paperWidth * USABLE;

let problems = 0;

console.log(
	`plate art ${plate.width}x${plate.height}, paper ${(measured.width * 100).toFixed(1)}% x ` +
		`${(measured.height * 100).toFixed(1)}%\n` +
		`drawn paper ${paperWidth.toFixed(0)}px, usable ${usable.toFixed(0)}px, ` +
		`label ${fontSize.toFixed(1)}px\n`,
);

if (Math.abs(inset.width - measured.width) > 0.02 || Math.abs(inset.height - measured.height) > 0.02) {
	console.log(
		`  !! buyBonusPlateInset is { ${inset.width}, ${inset.height} } but the art measures ` +
			`{ ${measured.width.toFixed(3)}, ${measured.height.toFixed(3)} } - the hover ` +
			`highlight and idle glow are sized from this`,
	);
	problems++;
}

// Every word that can appear on its own line. Both labels the button can show,
// plus the pieces "BUY BONUS" breaks into.
for (const word of ['BUY', 'BONUS', 'DISABLE']) {
	const width = inkEm(word) * fontSize;
	const fits = width <= usable;
	console.log(`  ${word.padEnd(8)} ${width.toFixed(0)}px ${fits ? 'ok' : 'OVERFLOWS'}`);
	if (!fits) {
		console.log(
			`  !! "${word}" is ${width.toFixed(0)}px on a ${usable.toFixed(0)}px paper - it hangs ` +
				`off the talisman. Lower buyBonusLabelSizeRatio or raise buyBonusPlateScale.`,
		);
		problems++;
	}
}

// The wrap width has to break "BUY BONUS" but leave "DISABLE" alone, or the
// button shows one word per line on one state and a run-on on the other.
const full = inkEm('BUY BONUS') * fontSize;
const disable = inkEm('DISABLE') * fontSize;
if (full <= wrapWidth) {
	console.log(
		`  !! "BUY BONUS" is ${full.toFixed(0)}px and the wrap width is ${wrapWidth} - it stays ` +
			`on one line and runs off the paper`,
	);
	problems++;
}
if (disable > wrapWidth) {
	console.log(
		`  !! "DISABLE" is ${disable.toFixed(0)}px and the wrap width is ${wrapWidth} - it breaks ` +
			`mid-word`,
	);
	problems++;
}

if (problems > 0) {
	console.log(`\n${problems} problem(s) found`);
	process.exit(1);
}
console.log('\nOK: both buy-bonus labels fit inside the talisman');
