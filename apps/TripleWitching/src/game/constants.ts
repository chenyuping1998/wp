import type { RawSymbol, SymbolState } from './types';

// Board geometry. Triple Witching is the only game in this repo whose board changes
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
// Trimmed a further 20% off the basegame board (0.576 -> 0.461, 0.81 -> 0.648).
// The board is bottom-anchored, so shrinking it frees the space at the TOP -
// which is exactly where the feature bags live. Before this they were squeezed
// into a strip too shallow to draw anything at cell size in.
//
// The feature board is deliberately NOT shrunk: the bags are a base-game object
// and are gone by the time it opens, so it has the same room it always had, and
// the jump in scale when the board expands is now larger, which suits it.
export const BOARD_FIT = {
	basegame: { height: 0.461, width: 0.648 },
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

// Size tiers. CONTRACT and TRIPLE WITCHING deliberately overflow their cell - they
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

// Multiplier meter presentation. The math sends +1/+2/+3/+5/+10 per CONTRACT
// symbol; anything from +5 up is worth calling out with the hot treatment.
export const BIG_MULTIPLIER_FROM = 5;
export const isBigMultiplier = (value: number) => value >= BIG_MULTIPLIER_FROM;
export const MULTIPLIER_FILL = [0xd6ffe4, 0x4bd67f, 0x0f7a3c];
export const MULTIPLIER_HOT_FILL = [0xffe6c0, 0xff9a3a, 0xd4340f];
export const MULTIPLIER_STROKE = 0x06210f;

// Scatter landing frame. The scatter has to be picked out of a board of nine
// paying symbols, and the thing that decides whether it can be is LUMINANCE,
// not hue. ScatterTrigger's alarm red (0xff5566) works at ring size on a dim
// board; at cell size a saturated red on near-black terminal green is just
// another dark block, so reaching for a different *colour* does not fix this.
// These are deliberately bright.
//
// The alarm stays red where it is drawn large. Only the per-cell frame is hot,
// because only the per-cell frame has a size problem.
export const SCATTER_FRAME_COLOR = 0xffd166;
export const SCATTER_FRAME_CORE = 0xfff6da;
export const SCATTER_FRAME_WIDTH = 5;
/** the frame flares as the symbol lands, then settles and holds */
export const SCATTER_FRAME_FLARE_MS = 420;
export const SCATTER_FRAME_STEADY_ALPHA = 0.85;
/** how far inside the cell the frame sits, in board units */
export const SCATTER_FRAME_INSET = 5;

// Feature bags. Three sealed pouches sit above the base-game board, one per
// modifier; the ones the session actually drew burst open at the trigger, and
// that burst is where the player learns what they got.
//
// One accent per modifier, and the same three colours are what any later
// feature badge or intro panel should use - the point of the bags is that the
// player learns "teal = the board opens" once and reads it everywhere after.
// Sampled from the supplied bag art itself (the brightest pixel of each, as
// reported by design/dekey_neon_art.mjs), so the programmatic parts of the
// burst - the shockwave, the shards, the label - are the same colour as the
// bag they came out of rather than approximately it.
export const FEATURE_BAG_ACCENT = {
	expand: 0xff6358,
	mult: 0xffe390,
	ways: 0xe1a7ff,
} as const;

// Which sprite is which bag. Red bursts into EXPAND, gold into MULTIPLIER,
// purple into WAYS.
export const FEATURE_BAG_ASSET = {
	expand: 'twBagExpand',
	mult: 'twBagMult',
	ways: 'twBagWays',
} as const;

// width / height of each supplied file. Declared rather than measured at
// runtime: the three are close to square but not equal (240x257, 227x257,
// 240x260), and drawing them all square puts a visible 7% squash on the gold
// one only - which reads as "that bag is drawn differently" rather than as a
// bug, so nobody reports it.
export const FEATURE_BAG_ASPECT = {
	expand: 240 / 257,
	mult: 227 / 257,
	ways: 240 / 260,
} as const;

export const FEATURE_BAG_LABEL = {
	expand: 'EXPAND',
	mult: 'MULTIPLIER',
	ways: 'WAYS',
} as const;

// Bag size, as a multiple of one symbol CELL as drawn on screen.
//
// Not a constant in main-box units, which is what it was first: the board is
// fitted to the screen, so a fixed 66px bag came out visibly smaller than a
// symbol on every layout and read as three specks of UI rather than as three
// objects. Sizing off the cell keeps them the same weight as the board they sit
// above, whatever it has been scaled to.
export const FEATURE_BAG_CELL_RATIO = 1.15;
/** gap between bags, also as a multiple of a cell */
export const FEATURE_BAG_GAP_RATIO = 0.3;
/**
 * Clearance between the top of the board and the bottom of the bags, in BOARD
 * units - the bags are drawn inside BoardContainer, so everything about them is
 * measured in cells and the board's fit scales all of it together.
 */
export const FEATURE_BAG_GAP_ABOVE_BOARD = 30;

// Burst timing. Each bag is a separate beat - three bursting at once reads as
// one event and the player cannot tell which three things they were told.
//
// Lengthened from 420/520/340/700 after seeing it: this is the moment the round
// turns, and it was over before the eye had found it. The shake now has time to
// build, and the hold is long enough to read three labels.
export const BAG_SHAKE_MS = 520;
export const BAG_BURST_MS = 620;
export const BAG_STAGGER_MS = 420;
/** how long the opened bags are held before the transition into the feature */
export const BAG_HOLD_MS = 1000;
// A bag that did not come up this round dims rather than vanishing: the player
// has to be able to see that there were three and they got two.
export const BAG_DORMANT_ALPHA = 0.26;

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
