// Board fit guard.
//
// The board is drawn at a fixed cell size in board space and fitted to the
// screen by boardLayout(). That fit is the only thing keeping the 5x5 feature
// board on the canvas, and it is driven by a handful of numbers in constants.ts
// that look harmless to edit. Getting them wrong does not fail the build, does
// not throw, and is invisible until someone opens the game on a phone.
//
// This reproduces boardLayout()'s arithmetic for every layout preset and checks
// that the board fits, that the talisman rail above it fits, and that
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
const BOTTOM_MARGIN = num(constants, 'BOARD_BOTTOM_MARGIN');
const HOUSING = num(constants, 'BOARD_HOUSING_CLEARANCE');
const RAIL_CELL_RATIO = num(constants, 'RAIL_CELL_RATIO');
const RAIL_GAP = num(constants, 'RAIL_GAP_ABOVE_BOARD');
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
	`cell ${SYMBOL_SIZE}px  board ${NUM_REELS}x${BASE_ROWS}\n`,
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

	// One board size now - the collect mechanic changes what is on the board,
	// never its shape. The loop is kept so the per-preset reporting below reads
	// unchanged, and so a future second board size is one entry away.
	for (const [mode, rows] of [['basegame', BASE_ROWS]]) {
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

		// The talisman rail sits on the beam above the board and is on screen for
		// the whole feature, so its headroom has to hold on every preset - not
		// just at the moment it appears.
		//
		// The reach includes the CAPTION ROW above the sockets, which this used to
		// leave out. TalismanRail draws "SEALED n / 12" and the multiplier readout
		// at beamY - 0.85 slots, half a line above the sockets it was measuring, so
		// the guard was modelling a shorter rail than the one being drawn and would
		// have passed a layout that clipped both labels. The sockets were never the
		// topmost thing on the rail.
		const slotSize = RAIL_CELL_RATIO * SYMBOL_SIZE;
		// The rail's own backing PLATE is the topmost thing it draws, so the reach
		// is measured to that rather than to any one label. TalismanRail names the
		// value PLATE_TOP_SLOTS and says so beside it; the two have to move
		// together, and this is the only thing that can notice if they do not.
		//
		// It used to be measured to the caption row, and before that to the sockets
		// - each time, to whatever happened to be highest when the guard was
		// written. The plate is a better anchor because it is drawn to CONTAIN
		// everything else on the rail.
		const PLATE_TOP_SLOTS = 1.62;
		const railReach = (RAIL_GAP + slotSize * (0.5 + PLATE_TOP_SLOTS)) * scale;
		if (top - railReach < 0) {
			console.log(
				`  !! ${name}: the talisman rail needs ${Math.round(railReach)}px above the board` +
					` and there are ${Math.round(top)}px - it draws off the top`,
			);
			problems++;
		}
	}

	console.log(
		`  ${name.padEnd(10)} reserve ${Math.round(barHeight)}px   ${line.join('   ')}`,
	);
}

// ── the free-spin counter plaque fits its gutter ─────────────────────────────
//
// In landscape the plaque hangs to the LEFT of the board, in whatever strip the
// board's fit leaves over. That strip is not the same on every preset - the
// tablet preset is square, so the board takes nearly all of its width - and the
// plaque now sizes itself down to fit rather than hanging off the edge.
//
// Sizing down has its own failure: past some point the text inside the well is
// too small to read, and nothing about that fails the build either. So this
// checks the WELL, which is the part the player actually reads, against a floor.
//
// Written after widening the plaque for the supplied art pushed its left edge to
// -105px on tablet, and after finding the placement had been subtracting a
// BOARD-space width from a SCREEN-space centre the whole time - which is why the
// span below carries the scale.
{
	const counterBlock = constants.match(/FS_COUNTER_PANEL\s*=\s*\{([\s\S]*?)\n\} as const;/);
	if (!counterBlock) throw new Error('could not read FS_COUNTER_PANEL');
	const wellW = Number(counterBlock[1].match(/well:\s*\{[^}]*\bw:\s*([0-9.]+)/)?.[1]);
	const wantWellCells = num(constants, 'FS_COUNTER_WELL_WIDTH');
	if (!Number.isFinite(wellW)) throw new Error('could not read FS_COUNTER_PANEL.well.w');

	const counterAspect = Number(counterBlock[1].match(/aspect:\s*([0-9.]+)/)?.[1]);
	if (!Number.isFinite(counterAspect)) throw new Error('could not read FS_COUNTER_PANEL.aspect');

	// The floor is read from constants rather than repeated, because the component
	// branches on the same number: below it the plaque abandons the gutter.
	const MIN_WELL_CELLS = num(constants, 'FS_COUNTER_MIN_WELL_WIDTH');

	for (const [name, preset] of Object.entries(presets)) {
		if (name === 'portrait') continue; // centred above the board, not in a gutter
		const fit = FIT_BY_LAYOUT[name];
		const boardW = SYMBOL_SIZE * NUM_REELS;
		const boardH = SYMBOL_SIZE * BASE_ROWS;
		const scale = Math.min(
			(preset.height * fit.basegame.height) / boardH,
			(preset.width * fit.basegame.width) / boardW,
		);
		const wantPanel = (SYMBOL_SIZE * wantWellCells) / wellW;
		const gutter = preset.width * 0.5 - boardW * scale * 0.5 - SYMBOL_SIZE * 0.35;
		const gutterPanel = Math.max(0, gutter - SYMBOL_SIZE * 0.3);
		const fitsGutter = (gutterPanel * wellW) / SYMBOL_SIZE >= MIN_WELL_CELLS;

		if (fitsGutter) {
			const panelW = Math.min(wantPanel, gutterPanel);
			if (gutter - panelW < 0) {
				console.log(`  !! ${name}: the free-spin counter hangs off the left edge`);
				problems++;
			}
			continue;
		}

		// The corner fallback. Its only hazard is the talisman rail, which is on
		// screen at the same time and reaches up from the board's top edge - so the
		// plaque's bottom has to stay above where the rail's plate begins.
		const usesCompactBar = betBarLayout === 'compactBottom';
		const barHeight =
			(usesCompactBar ? BAR_HEIGHT : 0) * (preset.height / standard[name].height);
		const boardTop = preset.height - barHeight - BOTTOM_MARGIN - boardH * scale;
		const railTop = boardTop - (RAIL_GAP + RAIL_CELL_RATIO * SYMBOL_SIZE * (0.5 + 1.62)) * scale;
		const panelBottom = SYMBOL_SIZE * 0.15 + wantPanel * counterAspect;
		if (panelBottom > railTop) {
			console.log(
				`  !! ${name}: the free-spin counter is in the corner because the gutter is only` +
					` ${Math.round(gutter)}px, and its bottom at ${Math.round(panelBottom)}px runs into` +
					` the talisman rail at ${Math.round(railTop)}px`,
			);
			problems++;
		}
	}
}

if (problems > 0) {
	console.log(`\n${problems} problem(s) found`);
	process.exit(1);
}
console.log('\nOK: the board and its rail fit every layout preset');
