// Board fit guard.
//
// The board is drawn at a fixed cell size in board space and fitted to the
// screen by boardLayout(). That fit is the only thing keeping the 5x5 feature
// board on the canvas, and it is driven by a handful of numbers in constants.ts
// that look harmless to edit. Getting them wrong does not fail the build, does
// not throw, and is invisible until someone opens the game on a phone.
//
// This reproduces boardLayout()'s arithmetic for every layout preset and checks
// that both boards fit, that the bags above the basegame board fit, and that
// neither board is so small it reads as a postage stamp.
//
// It is stricter than the first version in three ways, each of which corresponds
// to something certification actually found:
//
//   1. The reserved bottom is per layout. The old check used a flat 15% of the
//      preset height, which is roughly right for the compact bar and about a
//      quarter of what the portrait console really takes - so it happily passed
//      a portrait layout whose reels were drawn under the spin button.
//   2. The width test measures the HOUSING, not the reels. BoardFrame draws
//      ~1.32x wider than the cells, so a board that "fits" by cell width can
//      still have its frame hanging off both edges - which the portrait feature
//      board did.
//   3. The bags above the basegame board need clearance too. They are drawn at
//      negative y inside BoardContainer, which is not masked, so when they run
//      out of room they do not clip - they draw off the top of the canvas.
//
// Usage: node design/check_board_fit.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wpRoot = path.resolve(appRoot, '../..');
const constants = fs.readFileSync(path.join(appRoot, 'src/game/constants.ts'), 'utf8');
const layoutSource = fs.readFileSync(path.join(appRoot, 'src/game/stateLayout.ts'), 'utf8');
const themeSource = fs.readFileSync(
	path.join(wpRoot, 'packages/components-ui-pixi/src/theme.svelte.ts'),
	'utf8',
);
const uiThemeSource = fs.readFileSync(path.join(appRoot, 'src/game/uiTheme.ts'), 'utf8');
const createLayoutSource = fs.readFileSync(
	path.join(wpRoot, 'packages/utils-layout/src/createLayout.svelte.ts'),
	'utf8',
);

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
const HOUSING = num(constants, 'BOARD_HOUSING_CLEARANCE');
const BAG_CELL_RATIO = num(constants, 'FEATURE_BAG_CELL_RATIO');
const BAG_GAP = num(constants, 'FEATURE_BAG_GAP_ABOVE_BOARD');
const PORTRAIT_UI_RESERVE = num(constants, 'PORTRAIT_UI_RESERVE');

// The compact strip's height, read from the shared theme rather than copied, and
// the game's own choice of bar - the two together are what boardLayout branches
// on.
// object property (`barHeight: 140,`), not a `const … =` binding
const BAR_HEIGHT = Number(themeSource.match(/\bbarHeight:\s*([0-9.]+)/)?.[1]);
if (!Number.isFinite(BAR_HEIGHT)) throw new Error('could not read uiTheme.barHeight');
const betBarLayout = uiThemeSource.match(/betBarLayout:\s*'(\w+)'/)?.[1] ?? 'sideRail';

/** parse a `{ basegame: { height: h, width: w }, feature: {…} }` literal */
const readFit = (name) => {
	const block = constants.match(new RegExp(`${name}\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`));
	if (!block) throw new Error(`could not read ${name}`);
	const one = (mode) => {
		const m = block[1].match(
			new RegExp(`${mode}:\\s*\\{\\s*height:\\s*([0-9.]+),\\s*width:\\s*([0-9.]+)`),
		);
		if (!m) throw new Error(`could not read ${name}.${mode}`);
		return { height: Number(m[1]), width: Number(m[2]) };
	};
	return { basegame: one('basegame'), feature: one('feature') };
};

// Which fit each layout type uses, taken from BOARD_FIT_MAP itself so a new
// entry there is picked up here without editing this file.
const fitMapBlock = constants.match(/BOARD_FIT_MAP\s*=\s*\{([\s\S]*?)\n\};/);
if (!fitMapBlock) throw new Error('could not read BOARD_FIT_MAP');
const FIT_BY_LAYOUT = Object.fromEntries(
	[...fitMapBlock[1].matchAll(/(\w+):\s*(BOARD_FIT_\w+)/g)].map(([, layout, constName]) => [
		layout,
		readFit(constName),
	]),
);

/** `name: { width: w, height: h }` pairs out of a sizes map */
const readSizes = (source, marker) => {
	const start = source.indexOf(marker);
	if (start < 0) throw new Error(`could not read ${marker}`);
	const block = source.slice(start, source.indexOf('};', start));
	return Object.fromEntries(
		[...block.matchAll(/(\w+):\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+)\s*\}/g)].map((m) => [
			m[1],
			{ width: Number(m[2]), height: Number(m[3]) },
		]),
	);
};

const presets = readSizes(layoutSource, 'mainSizesMap');
const standard = readSizes(createLayoutSource, 'STANDARD_MAIN_SIZES_MAP');

// "Big enough" cannot be a height fraction: a 5-wide, 3-tall board on a portrait
// canvas is width-limited, and 30% of the height is the largest it can possibly
// be there. What matters is that it fills the axis that constrains it.
const MIN_FILL_OF_CONSTRAINING_AXIS = 0.4;
// The housing may come this close to the edges of the box and no closer.
const MAX_HOUSING_FILL = 0.96;

let problems = 0;

// ── is PORTRAIT_UI_RESERVE still true? ───────────────────────────────────────
// The reserve is an INPUT to the arithmetic below, so no amount of checking the
// board against it can tell you the number itself is right. It is only right as
// long as it matches the shared portrait bar, which lives in another package and
// is edited by other games' work.
//
// So it is re-derived here. LayoutPortrait positions everything as
// `mainLayoutStandard().height - N`; the largest N is the topmost control, and
// the readout plate it sits in starts UiLabel's 20 units higher, scaled by the
// 0.81 the layout applies. If that ever moves up, this fails rather than the
// board silently sliding back under the controls.
{
	const portraitSource = fs.readFileSync(
		path.join(wpRoot, 'packages/components-ui-pixi/src/components/LayoutPortrait.svelte'),
		'utf8',
	);
	const offsets = [...portraitSource.matchAll(/mainLayoutStandard\(\)\.height\s*-\s*(\d+)/g)].map(
		(m) => Number(m[1]),
	);
	if (offsets.length === 0) throw new Error('could not read LayoutPortrait offsets');
	const PLATE_TOP = 20 * 0.81;
	const needed = Math.max(...offsets) + PLATE_TOP;
	if (PORTRAIT_UI_RESERVE < needed) {
		console.log(
			`  !! PORTRAIT_UI_RESERVE is ${PORTRAIT_UI_RESERVE} but LayoutPortrait reaches` +
				` ${Math.ceil(needed)} up from the floor - the board is laid out under the controls`,
		);
		problems++;
	}
}

console.log(
	`cell ${SYMBOL_SIZE}px  board ${NUM_REELS}x${BASE_ROWS} -> ${NUM_REELS}x${FEATURE_ROWS}\n`,
);

for (const [name, preset] of Object.entries(presets)) {
	const fit = FIT_BY_LAYOUT[name];
	if (!fit) {
		console.log(`  !! ${name}: no BOARD_FIT_MAP entry`);
		problems++;
		continue;
	}

	// boardLayout()'s own branch: portrait always gets the full console, because
	// UIDefault forces LayoutPortrait there whatever the theme asked for.
	const usesCompactBar = name !== 'portrait' && betBarLayout === 'compactBottom';
	const reserveStandard = usesCompactBar
		? BAR_HEIGHT
		: name === 'portrait'
			? PORTRAIT_UI_RESERVE
			: 0;
	const barHeight = reserveStandard * (preset.height / standard[name].height);
	const bottomY = preset.height - barHeight - BOTTOM_MARGIN;
	const line = [];

	for (const [mode, rows] of [
		['basegame', BASE_ROWS],
		['feature', FEATURE_ROWS],
	]) {
		const boardW = SYMBOL_SIZE * NUM_REELS;
		const boardH = SYMBOL_SIZE * rows;
		const scale = Math.min(
			(preset.height * fit[mode].height) / boardH,
			(preset.width * fit[mode].width) / boardW,
		);
		const screenH = boardH * scale;
		const screenW = boardW * scale;
		const housingW = screenW * HOUSING;
		const top = bottomY - screenH;

		const hPct = (screenH / preset.height) * 100;
		const wPct = (screenW / preset.width) * 100;
		line.push(`${mode} ${hPct.toFixed(0)}%h ${wPct.toFixed(0)}%w`);

		if (top < 0) {
			console.log(
				`  !! ${name}/${mode}: board top is ${Math.round(top)}px - off the top of the box`,
			);
			problems++;
		}
		if (housingW > preset.width * MAX_HOUSING_FILL) {
			console.log(
				`  !! ${name}/${mode}: housing is ${Math.round(housingW)}px across a ${preset.width}px box` +
					` (${((housingW / preset.width) * 100).toFixed(0)}%) - the frame runs off the sides`,
			);
			problems++;
		}
		if (Math.max(hPct, wPct) / 100 < MIN_FILL_OF_CONSTRAINING_AXIS) {
			console.log(
				`  !! ${name}/${mode}: fills only ${hPct.toFixed(0)}%h / ${wPct.toFixed(0)}%w - too small`,
			);
			problems++;
		}

		// The bags sit above the BASEGAME board only - they have burst and gone by
		// the time the feature board opens.
		if (mode === 'basegame') {
			// FeatureBags puts a bag's centre at -(gap + half) in board units, so its
			// top edge is (gap + bagSize) above the board.
			const bagReach = (BAG_GAP + BAG_CELL_RATIO * SYMBOL_SIZE) * scale;
			if (top - bagReach < 0) {
				console.log(
					`  !! ${name}: feature bags need ${Math.round(bagReach)}px above the board` +
						` and there are ${Math.round(top)}px - they draw off the top`,
				);
				problems++;
			}
		}
	}

	console.log(
		`  ${name.padEnd(10)} reserve ${Math.round(barHeight)}px   ${line.join('   ')}`,
	);
}

if (problems > 0) {
	console.log(`\n${problems} problem(s) found`);
	process.exit(1);
}
console.log('\nOK: both boards fit every layout preset');
