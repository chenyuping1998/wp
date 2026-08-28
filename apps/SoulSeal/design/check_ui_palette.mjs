// UI palette guard.
//
// The bar is on screen every second of every session, and it was drawn for a
// different game: this one was scaffolded from a trading terminal, whose palette
// is graphite with phosphor green. The THEME was re-coloured to brass and night
// jade long ago. The generated ART was not, and nothing noticed - the icons and
// the readout plate sat on disk in the old palette for as long as the game has
// existed, because a generator being re-themed does not re-run itself.
//
// Measured, every icon in soulSealUiIcons was rgb(75, 214, 127): one colour,
// exactly the terminal's phosphor, on the menu, the autoplay, the plus and minus,
// and everything inside the menu. On the bar the player saw two green buttons
// among a dozen brass ones.
//
// So this checks the pixels rather than the source that made them. A generator
// can be edited, re-run, or forgotten; what ships is the PNG.
//
// ── the band ──
//
// Art-bible 2.2 gives green to the spirits and to nothing else, and the UI is
// explicitly not allowed to borrow it - a player has to be able to find a spirit
// by colour alone. So no UI asset may carry a saturated green at all.
//
// The band is drawn to catch the terminal phosphor and to clear the game's own
// cool colours, which are teals rather than greens:
//
//     terminal green   hue 142   sat 0.65   <- caught
//     spirit cyan      hue 174   sat 0.62   <- outside, by 19 degrees
//     collect teal     hue 175   sat 0.75   <- outside
//
// Saturation and value floors keep the dark jade in the plates' own gradient
// (#1E3A3C, a desaturated near-black) from registering.
//
// Usage: node design/check_ui_palette.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const toolDir = path.resolve(appRoot, '../../../tools/gen');

if (!fs.existsSync(path.join(toolDir, 'node_modules/pngjs'))) {
	console.log('SKIP: no image tools at tools/gen - cannot read the UI art');
	process.exit(0);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

// Where the bar's own art lives. Symbol art is deliberately NOT scanned: the
// scatter is a green-and-blue bagua disc and the reels are a different argument.
const DIRS = ['static/assets/sprites/soulSealUiIcons', 'static/assets/sprites/soulSealUi'];

const HUE_LO = 95;
const HUE_HI = 155;
const MIN_SAT = 0.45;
const MIN_VAL = 0.55;
// A little slack for antialiasing against a green-adjacent neighbour. The old
// icons were 100% of their opaque pixels in the band, so the margin between pass
// and fail is not fine.
const MAX_SHARE = 0.01;

const hsv = (r, g, b) => {
	r /= 255;
	g /= 255;
	b /= 255;
	const mx = Math.max(r, g, b);
	const mn = Math.min(r, g, b);
	const d = mx - mn;
	let h = 0;
	if (d > 0) {
		if (mx === r) h = 60 * (((g - b) / d) % 6);
		else if (mx === g) h = 60 * ((b - r) / d + 2);
		else h = 60 * ((r - g) / d + 4);
	}
	if (h < 0) h += 360;
	return { h, s: mx > 0 ? d / mx : 0, v: mx };
};

let problems = 0;
let scanned = 0;

for (const dir of DIRS) {
	const full = path.join(appRoot, dir);
	if (!fs.existsSync(full)) continue;
	for (const file of fs.readdirSync(full).sort()) {
		if (!file.endsWith('.png')) continue;
		const png = PNG.sync.read(fs.readFileSync(path.join(full, file)));
		let opaque = 0;
		let inBand = 0;
		for (let i = 0; i < png.data.length; i += 4) {
			if (png.data[i + 3] < 128) continue;
			opaque += 1;
			const { h, s, v } = hsv(png.data[i], png.data[i + 1], png.data[i + 2]);
			if (h >= HUE_LO && h <= HUE_HI && s >= MIN_SAT && v >= MIN_VAL) inBand += 1;
		}
		scanned += 1;
		if (opaque === 0) continue;
		const share = inBand / opaque;
		if (share > MAX_SHARE) {
			console.log(
				`  !! ${dir}/${file}: ${(share * 100).toFixed(1)}% of its opaque pixels are ` +
					`saturated green - the UI has no green in it, and this is what the ` +
					`terminal palette this game was scaffolded from looked like. Re-run the ` +
					`generator that writes it.`,
			);
			problems += 1;
		}
	}
}

if (problems > 0) {
	console.log(`\n${problems} problem(s) found across ${scanned} UI asset(s)`);
	process.exit(1);
}
console.log(`OK: no green in any of the ${scanned} UI assets`);
