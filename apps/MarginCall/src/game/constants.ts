import type { RawSymbol, SymbolState } from './types';

// Board geometry. Margin Call is the only game in this repo whose board changes
// size mid-round: the basegame is 5x3 (243 ways) and the feature game grows two
// rows on every reel (5x5, 3125 ways). Everything downstream reads the row count
// from stateGame.rows rather than from a constant, and the math announces the
// change with its own `boardExpand` event.
export const BASE_ROWS = 3;
export const FEATURE_ROWS = 5;
// Layout headroom. The board is sized for its current height, but the frame and
// the canvas have to be able to hold the tallest one it will ever reach.
export const MAX_ROWS = FEATURE_ROWS;

export const NUM_REELS = 5;

// Cell size in BOARD space, not screen space. The board is drawn at this size
// and then fitted to the screen by boardLayout(), which is what lets the two
// board heights both fill the frame without the reels (or utils-slots) ever
// knowing the screen size changed.
export const SYMBOL_SIZE = 104;

export const REEL_PADDING = 0.53;

// How much of the available box each board should occupy, as a fraction of the
// shorter fitting axis. The basegame board is short and wide, so it can be
// pushed close to the edges; the feature board is square and its height is what
// runs out first, so it settles for less.
//
// This is the answer to "the basegame board is too small". Making the cell
// bigger instead would work for 5x3 and overflow the canvas at 5x5 - three rows
// at 65% of an 800px box is a 173px cell, and five of those is 867px on an 800px
// canvas. Fitting per row count keeps the basegame large and the feature board
// on screen, and the change of scale between them is itself part of the moment.
// Two limits per board, and whichever runs out first wins. On desktop and
// landscape the height binds, which is what puts the basegame board at ~64% of
// the canvas. On tablet and portrait the board is 5 reels wide and only 3 rows
// tall, so the WIDTH binds instead - and a low width fraction there is what
// makes the basegame board look tiny even though its height fraction is
// technically "correct" for the shape. Hence the generous width allowances:
// they cost nothing on wide screens, where the height limit is reached first.
export const BOARD_FIT = {
	basegame: { height: 0.64, width: 0.9 },
	feature: { height: 0.78, width: 0.92 },
};

// Both boards stand on the same line, just above the bet bar, so the feature
// board grows upward out of the basegame one instead of the whole thing
// re-centring as it expands.
export const BOARD_BOTTOM_MARGIN = 16;

// How long a winning symbol stays lit before the round moves on. Board awaits
// this, so it is also the pace of the win presentation.
export const WIN_HOLD_MS = 1100;
export const WIN_HOLD_TURBO_MS = 420;

// Symbols that took no part in the win drop to this alpha while it plays. The
// ring alone is not enough on a full board - the win has to be the only bright
// thing on screen for it to read at a glance.
export const LOSING_SYMBOL_ALPHA = 0.32;

// The feature board opening two extra rows. Slow enough to be an event rather
// than a layout jump, and it grows upward - the bottom edge stays put.
export const BOARD_EXPAND_MS = 1250;

// A reel holds its visible rows plus one padding symbol above and below.
export const paddedReelLength = (rows: number) => rows + 2;

export const boardDimensions = (rows: number) => ({ x: NUM_REELS, y: rows });

export const boardSizes = (rows: number) => ({
	width: SYMBOL_SIZE * NUM_REELS,
	height: SYMBOL_SIZE * rows,
});

// The idle board shown before the first spin: 3 visible rows, padded.
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L3' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'H4' }],
	[{ name: 'H1' }, { name: 'L2' }, { name: 'H3' }, { name: 'L1' }, { name: 'L3' }],
	[{ name: 'L4' }, { name: 'H5' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }],
	[{ name: 'L1' }, { name: 'L3' }, { name: 'H4' }, { name: 'L2' }, { name: 'H3' }],
	[{ name: 'H3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H5' }, { name: 'L2' }],
];

export const BACKGROUND_RATIO = 2039 / 1000;
export const PORTRAIT_BACKGROUND_RATIO = 1242 / 2208;
const PORTRAIT_RATIO = 800 / 1422;
const LANDSCAPE_RATIO = 1600 / 900;
const DESKTOP_RATIO = 1422 / 800;

const DESKTOP_HEIGHT = 800;
const LANDSCAPE_HEIGHT = 900;
const PORTRAIT_HEIGHT = 1422;
export const DESKTOP_MAIN_SIZES = { width: DESKTOP_HEIGHT * DESKTOP_RATIO, height: DESKTOP_HEIGHT };
export const LANDSCAPE_MAIN_SIZES = {
	width: LANDSCAPE_HEIGHT * LANDSCAPE_RATIO,
	height: LANDSCAPE_HEIGHT,
};
export const PORTRAIT_MAIN_SIZES = {
	width: PORTRAIT_HEIGHT * PORTRAIT_RATIO,
	height: PORTRAIT_HEIGHT,
};

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'H5'];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

// Size tiers. LEVERAGE and MARGIN CALL deliberately overflow their cell - they
// are what the player is hunting and should sit on top of the grid.
const HIGH_SYMBOL_SIZE = 0.97;
const LOW_SYMBOL_SIZE = 0.82;
const SPECIAL_SYMBOL_SIZE = 1.06;

const SPIN_OPTIONS_SHARED = {
	reelBounceBackSpeed: 0.15,
	reelSpinSpeedBeforeBounce: 4,
	reelPaddingMultiplierNormal: 1.2,
	reelPaddingMultiplierAnticipated: 10,
	reelSpinDelay: 145,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 2,
	reelSpinSpeed: 3,
	reelBounceSizeMulti: 0.3,
};

export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 5,
	reelSpinSpeed: 5,
	reelBounceSizeMulti: 0.05,
};

export const SPIN_OPTIONS_FAST_FREEGAME = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 4.2,
	reelSpinSpeed: 3.8,
	reelSpinDelay: 185,
	reelBounceSizeMulti: 0.08,
};

export const MOTION_BLUR_VELOCITY = 31;

// Win banner frames, one per win level, escalating.
//
// These are supplied art with no text baked in, so the tier label and the amount
// are drawn live and have to land inside each frame's dark inner well. The five
// frames have different aspect ratios and very different border weights - the
// top tier's flame wings inflate its image far beyond its well - so centring on
// the image would put text over the decoration on some tiers and not others.
//
// `well` is measured, not eyeballed: design/measure_banner_wells.mjs finds the
// dark opaque region in each PNG and prints these numbers. Re-run it if the art
// is replaced.
//
// Everything is sized from the WELL, not from the image: the well is drawn at a
// constant width on screen, so the text is the same size on every tier and the
// frames grow as the tiers climb.
export const WIN_BANNER_WELL_WIDTH = 3.8; // in cells

export const WIN_BANNERS = {
	big: { key: 'mcWinBannerBig', aspect: 0.352, well: { cx: 0.0, cy: 0.043, w: 0.775, h: 0.5 } },
	superwin: {
		key: 'mcWinBannerSuperwin',
		aspect: 0.336,
		well: { cx: 0.007, cy: 0.02, w: 0.742, h: 0.444 },
	},
	mega: {
		key: 'mcWinBannerMega',
		aspect: 0.388,
		well: { cx: 0.007, cy: 0.042, w: 0.689, h: 0.442 },
	},
	epic: {
		key: 'mcWinBannerEpic',
		aspect: 0.367,
		well: { cx: 0.006, cy: 0.086, w: 0.676, h: 0.383 },
	},
	max: { key: 'mcWinBannerMax', aspect: 0.324, well: { cx: 0.004, cy: 0.037, w: 0.619, h: 0.344 } },
} as const;

export const WIN_BANNER_LABEL = {
	big: 'BIG WIN',
	superwin: 'SUPER WIN',
	mega: 'MEGA WIN',
	epic: 'EPIC WIN',
	max: 'MAX WIN',
} as const;

// Leverage meter presentation. The math sends +1/+2/+3/+5/+10 per LEVERAGE
// symbol; anything from +5 up is worth calling out with the hot treatment.
export const BIG_LEVERAGE_FROM = 5;
export const isBigLeverage = (value: number) => value >= BIG_LEVERAGE_FROM;
export const LEVERAGE_FILL = [0xd6ffe4, 0x4bd67f, 0x0f7a3c];
export const LEVERAGE_HOT_FILL = [0xffe6c0, 0xff9a3a, 0xd4340f];
export const LEVERAGE_STROKE = 0x06210f;

// The board's own cell colour - a near-black terminal green.
export const BOARD_CELL_COLOR = 0x0b1410;

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

// Symbols are sprite-only: the win state is the programmatic scale+glow in
// SymbolWinAnim rather than a Spine track, so the art pipeline is a single PNG
// per symbol and there are no atlases to keep in sync.
const HIGH_RATIOS = { width: HIGH_SYMBOL_SIZE, height: HIGH_SYMBOL_SIZE };
const LOW_RATIOS = { width: LOW_SYMBOL_SIZE, height: LOW_SYMBOL_SIZE };
const SPECIAL_RATIOS = { width: SPECIAL_SYMBOL_SIZE, height: SPECIAL_SYMBOL_SIZE };

const symbolSprite = (assetKey: string, ratios: { width: number; height: number }) => ({
	type: 'sprite' as const,
	assetKey,
	sizeRatios: ratios,
});

const spriteSymbol = (assetKey: string, ratios: { width: number; height: number }) => ({
	static: symbolSprite(assetKey, ratios),
	spin: symbolSprite(assetKey, ratios),
	land: symbolSprite(assetKey, ratios),
	postWinStatic: symbolSprite(assetKey, ratios),
	win: symbolSprite(assetKey, ratios),
});

export const SYMBOL_INFO_MAP = {
	H1: spriteSymbol('mcH1', HIGH_RATIOS),
	H2: spriteSymbol('mcH2', HIGH_RATIOS),
	H3: spriteSymbol('mcH3', HIGH_RATIOS),
	H4: spriteSymbol('mcH4', HIGH_RATIOS),
	H5: spriteSymbol('mcH5', HIGH_RATIOS),
	L1: spriteSymbol('mcL1', LOW_RATIOS),
	L2: spriteSymbol('mcL2', LOW_RATIOS),
	L3: spriteSymbol('mcL3', LOW_RATIOS),
	L4: spriteSymbol('mcL4', LOW_RATIOS),
	W: spriteSymbol('mcW', SPECIAL_RATIOS),
	S: spriteSymbol('mcS', SPECIAL_RATIOS),
} as const;

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
