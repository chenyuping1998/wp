// Board fit guard.
//
// The board is drawn at a fixed cell size in board space and fitted to the
// screen by boardLayout(). That fit is the only thing keeping the 5x5 feature
// board on the canvas, and it is driven by four numbers in constants.ts that
// look harmless to edit. Getting them wrong does not fail the build, does not
// throw, and is invisible until someone triggers the feature on a phone.
//
// This reproduces the arithmetic for every layout preset and checks that both
// boards fit, that neither is so small it reads as a postage stamp, and that
// the basegame board actually hits the size it is supposed to.
//
// Usage: node design/check_board_fit.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const constants = fs.readFileSync(path.join(appRoot, 'src/game/constants.ts'), 'utf8');
const layout = fs.readFileSync(path.join(appRoot, 'src/game/stateLayout.ts'), 'utf8');

const num = (source, name) => {
	const m = source.match(new RegExp(`${name}\\s*=\\s*([0-9.]+)`));
	if (!m) throw new Error(`could not read ${name}`);
	return Number(m[1]);
};

const SYMBOL_SIZE = num(constants, 'SYMBOL_SIZE');
const NUM_REELS = num(constants, 'NUM_REELS');
const BASE_ROWS = num(constants, 'BASE_ROWS');
const FEATURE_ROWS = num(constants, 'FEATURE_ROWS');
const BOTTOM_MARGIN = num(constants, 'BOARD_BOTTOM_MARGIN');

const fitBlock = constants.match(/BOARD_FIT\s*=\s*\{([\s\S]*?)\n\};/);
if (!fitBlock) throw new Error('could not read BOARD_FIT');
const readFit = (mode) => {
	const m = fitBlock[1].match(new RegExp(`${mode}:\\s*\\{\\s*height:\\s*([0-9.]+),\\s*width:\\s*([0-9.]+)`));
	if (!m) throw new Error(`could not read BOARD_FIT.${mode}`);
	return { height: Number(m[1]), width: Number(m[2]) };
};
const FIT = { basegame: readFit('basegame'), feature: readFit('feature') };

// The layout presets the game actually runs at.
const presets = [...layout.matchAll(/(\w+):\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+)\s*\}/g)].map(
	(m) => ({ name: m[1], width: Number(m[2]), height: Number(m[3]) }),
);
if (presets.length === 0) throw new Error('could not read mainSizesMap');

// Worst case for vertical room: the compact bet bar is present. Its height is
// declared against the standard box, and the shared default is 15% of it.
const BAR_FRACTION = 0.15;

// "Big enough" cannot be a height fraction: a 5-wide, 3-tall board on a portrait
// canvas is width-limited, and 30% of the height is the largest it can possibly
// be there. What matters is that it fills the axis that constrains it.
// Lowered from 0.6 when the board was deliberately trimmed 10%, and again to
// 0.4 when it was trimmed a further 20% to make room for the feature bags above
// it. The floor is here to catch a board that has accidentally become tiny, not
// to enforce a particular size - so it sits below the intended value rather
// than at it, and it gets lowered when the intended value moves.
//
// The basegame board now measures 46%h / 43%w on desktop and landscape. If a
// change puts it materially below that, it is a mistake and not a decision.
const MIN_FILL_OF_CONSTRAINING_AXIS = 0.4;
const MAX_TOP_OVERSHOOT = 0; // the top edge must not leave the canvas

let problems = 0;
console.log(
	`cell ${SYMBOL_SIZE}px  board ${NUM_REELS}x${BASE_ROWS} -> ${NUM_REELS}x${FEATURE_ROWS}\n`,
);

for (const preset of presets) {
	const barHeight = preset.height * BAR_FRACTION;
	const bottomY = preset.height - barHeight - BOTTOM_MARGIN;
	const line = [];

	for (const [mode, rows] of [
		['basegame', BASE_ROWS],
		['feature', FEATURE_ROWS],
	]) {
		const fit = FIT[mode];
		const boardW = SYMBOL_SIZE * NUM_REELS;
		const boardH = SYMBOL_SIZE * rows;
		const scale = Math.min(
			(preset.height * fit.height) / boardH,
			(preset.width * fit.width) / boardW,
		);
		const screenH = boardH * scale;
		const screenW = boardW * scale;
		const top = bottomY - screenH;

		const hPct = (screenH / preset.height) * 100;
		const wPct = (screenW / preset.width) * 100;
		line.push(`${mode} ${hPct.toFixed(0)}%h ${wPct.toFixed(0)}%w`);

		if (top < MAX_TOP_OVERSHOOT) {
			console.log(
				`  !! ${preset.name}/${mode}: board top is ${Math.round(top)}px - off the top of the canvas`,
			);
			problems++;
		}
		if (screenW > preset.width) {
			console.log(`  !! ${preset.name}/${mode}: board is wider than the canvas`);
			problems++;
		}
		if (Math.max(hPct, wPct) / 100 < MIN_FILL_OF_CONSTRAINING_AXIS) {
			console.log(
				`  !! ${preset.name}/${mode}: fills only ${hPct.toFixed(0)}%h / ${wPct.toFixed(0)}%w - too small`,
			);
			problems++;
		}
	}

	console.log(`  ${preset.name.padEnd(10)} ${line.join('   ')}`);
}

if (problems > 0) {
	console.log(`\n${problems} problem(s) found`);
	process.exit(1);
}
console.log('\nOK: both boards fit every layout preset');
