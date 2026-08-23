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
// Trimmed 10% from the first pass, which sat the basegame board at 64% of the
// canvas height and read as slightly overbearing next to the bet bar.
export const BOARD_FIT = {
	basegame: { height: 0.576, width: 0.81 },
	feature: { height: 0.702, width: 0.828 },
};

// Both boards stand on the same line, just above the bet bar, so the feature
// board grows upward out of the basegame one instead of the whole thing
// re-centring as it expands.
//
// Raised from 16: the bar height is derived from uiTheme against a differently
// shaped box, and 16px of slack was not enough to absorb the error - the board's
// bottom edge was touching the bar.
export const BOARD_BOTTOM_MARGIN = 64;

// How much wider than the reels the housing plate reads, as a multiplier on the
// board's own width. Anything laying itself out beside the board (the ticker
// backdrop) has to clear the plate rather than the cells, or it draws underneath
// the frame's shoulders.
//
// Measured, not guessed: at the desktop preset the reels are 687px wide on
// canvas and BoardFrame's bounds are 885px, which is 1.288. The value carries a
// little past that for the frame's outer glow.
export const BOARD_HOUSING_CLEARANCE = 1.32;

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

// The feature game's own normal-speed options.
//
// The tease length is `reelLength * reelPaddingMultiplierAnticipated`, and the
// feature reel is 7 symbols to the base game's 5 - so at a shared multiplier the
// feature tease is automatically 40% LONGER than the base one, which is what
// made a single Scatter in free spins feel like it held the board hostage for
// four reels. 10 -> 6 takes that 40% back out; the feature tease is now about
// the same wall-clock length as the base game's.
export const SPIN_OPTIONS_DEFAULT_FREEGAME = {
	...SPIN_OPTIONS_DEFAULT,
	reelPaddingMultiplierAnticipated: 6,
};

export const SPIN_OPTIONS_FAST_FREEGAME = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 4.2,
	reelSpinSpeed: 3.8,
	reelSpinDelay: 185,
	reelBounceSizeMulti: 0.08,
	reelPaddingMultiplierAnticipated: 6,
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
// The frames are generated (design/generate_theme.mjs, BANNER_TIERS), so these
// wells are declared rather than discovered - they are the same numbers the
// generator draws with. design/measure_banner_wells.mjs re-derives them from
// the PNGs and is the check that the two have not drifted.
//
// Everything is sized from the WELL, not from the image: the well is drawn at a
// constant width on screen, so the text is the same size on every tier and the
// frames grow as the tiers climb.
export const WIN_BANNER_WELL_WIDTH = 7.6; // in cells

// `accent` is the same colour the frame is drawn in (BANNER_TIERS in
// generate_theme.mjs). The tier label takes it so the words belong to the plaque
// they sit on; the amount stays pale, because it is the number the player is
// actually reading and legibility beats theming there.
export const WIN_BANNERS = {
	big: {
		key: 'mcWinBannerBig',
		aspect: 0.36,
		accent: 0x4bd67f,
		well: { cx: 0, cy: 0, w: 0.76, h: 0.5 },
	},
	superwin: {
		key: 'mcWinBannerSuperwin',
		aspect: 0.38,
		accent: 0x3fd0d4,
		well: { cx: 0, cy: 0, w: 0.72, h: 0.46 },
	},
	mega: {
		key: 'mcWinBannerMega',
		aspect: 0.42,
		accent: 0xf7a83a,
		well: { cx: 0, cy: 0, w: 0.68, h: 0.42 },
	},
	epic: {
		key: 'mcWinBannerEpic',
		aspect: 0.45,
		accent: 0x9b7bff,
		well: { cx: 0, cy: 0, w: 0.64, h: 0.38 },
	},
	max: {
		key: 'mcWinBannerMax',
		aspect: 0.5,
		accent: 0xff5566,
		well: { cx: 0, cy: 0, w: 0.6, h: 0.34 },
	},
} as const;

export const WIN_BANNER_LABEL = {
	big: 'BIG WIN',
	superwin: 'SUPER WIN',
	mega: 'MEGA WIN',
	epic: 'EPIC WIN',
	max: 'MAX WIN',
} as const;

// Per-symbol win presentation.
//
// Every symbol used to win with the identical green ring, which meant the
// Scatter, the Wild and a low card were all presented as the same event. These
// profiles scale the same effect by what the symbol is worth, and colour it by
// what it is: red for MARGIN CALL, bright green for LEVERAGE, green for the
// premiums, cool teal for the lows so a low win reads as quieter rather than as
// a weaker copy of a big one.
//
// Runtime, not baked frames. The effect is a transform, a self-additive relight
// and some vector FX, all of which pixi does directly — baking it would have
// cost ~20 MB of sprite sheets for the eleven symbols and been softer at every
// size that is not the authored one.
export type WinFxProfile = {
	color: number;
	/** peak overshoot of the scale pop */
	pop: number;
	rings: number;
	sparks: number;
	/** how hard the artwork relights itself on the hit, 0..1 */
	flash: number;
	/** peak alpha of the halo behind the tile */
	halo: number;
};

const HIGH = 0x4bd67f;
const LOW = 0x3fd0d4;

export const WIN_FX: Record<string, WinFxProfile> = {
	// MARGIN CALL: the alarm. Loudest thing on the board when it pays.
	S: { color: 0xff5566, pop: 0.4, rings: 3, sparks: 14, flash: 1, halo: 0.2 },
	// LEVERAGE: the feature's engine.
	W: { color: HIGH, pop: 0.36, rings: 3, sparks: 12, flash: 0.95, halo: 0.18 },
	H1: { color: HIGH, pop: 0.3, rings: 2, sparks: 9, flash: 0.85, halo: 0.15 },
	H2: { color: HIGH, pop: 0.28, rings: 2, sparks: 8, flash: 0.8, halo: 0.14 },
	H3: { color: HIGH, pop: 0.26, rings: 2, sparks: 7, flash: 0.75, halo: 0.13 },
	H4: { color: HIGH, pop: 0.24, rings: 2, sparks: 6, flash: 0.7, halo: 0.12 },
	H5: { color: HIGH, pop: 0.24, rings: 2, sparks: 6, flash: 0.7, halo: 0.12 },
	L1: { color: LOW, pop: 0.18, rings: 1, sparks: 4, flash: 0.55, halo: 0.09 },
	L2: { color: LOW, pop: 0.18, rings: 1, sparks: 4, flash: 0.55, halo: 0.09 },
	L3: { color: LOW, pop: 0.16, rings: 1, sparks: 3, flash: 0.5, halo: 0.08 },
	L4: { color: LOW, pop: 0.16, rings: 1, sparks: 3, flash: 0.5, halo: 0.08 },
};

export const winFxFor = (name: string): WinFxProfile => WIN_FX[name] ?? WIN_FX.H5;

// Scatter landing frame, ported from TripleWitching (ScatterLandFrame.svelte).
//
// The scatter has to be picked out of a board of nine paying symbols, and the
// thing that decides whether it can be is LUMINANCE, not hue. ScatterTrigger's
// alarm red (0xff5566) works at ring size on a dimmed board; at CELL size a
// saturated red on near-black terminal green is just another dark block, so
// reaching for a different colour does not fix it. These are deliberately
// bright.
//
// Yes, this is gold, and yes, the rest of this game had its inherited gold
// purged. That was about warm colours standing in for a palette the game does
// not have. This is different: it is a legibility decision with a measured
// reason behind it, and it is the ONE hot accent on the board. The alarm stays
// red where it is drawn large; only the per-cell frame is hot, because only the
// per-cell frame has a size problem.
export const SCATTER_FRAME_COLOR = 0xffd166;
export const SCATTER_FRAME_CORE = 0xfff6da;
export const SCATTER_FRAME_WIDTH = 5;
/** the frame flares as the symbol lands, then settles and holds */
export const SCATTER_FRAME_FLARE_MS = 420;
export const SCATTER_FRAME_STEADY_ALPHA = 0.85;
/** how far inside the cell the frame sits, in board units */
export const SCATTER_FRAME_INSET = 5;

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
