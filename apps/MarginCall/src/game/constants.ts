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

// Sized so the tall (5-row) board still clears the bet bar. The basegame board
// is the same cell size and simply occupies less height.
export const SYMBOL_SIZE = 104;

export const REEL_PADDING = 0.53;

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
