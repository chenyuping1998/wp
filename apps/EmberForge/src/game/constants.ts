import type { RawSymbol, SymbolState } from './types';

// 7x7 board in the same on-screen footprint the 5x5 board used at 118px, so the
// frame, bet bar and layout maths carry over unchanged: 118 * 5 / 7 = 84.3.
// Re-measure against BoardFrame's FRAME_SCALE before raising this — the housing
// is drawn 1.28x the playfield, so the board occupies noticeably more room than
// SYMBOL_SIZE * 7 suggests.
export const SYMBOL_SIZE = 84;

export const REEL_PADDING = 0.53;

// Initial board — 7 visible rows padded top and bottom (9 symbols per reel).
// Only ever seen before the first spin; deliberately holds no cluster of 5.
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L3' }, { name: 'L1' }, { name: 'H2' }, { name: 'L4' }],
	[{ name: 'H1' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }, { name: 'L3' }, { name: 'H2' }, { name: 'L4' }, { name: 'L1' }, { name: 'H3' }],
	[{ name: 'L3' }, { name: 'H1' }, { name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H4' }, { name: 'L3' }, { name: 'L2' }],
	[{ name: 'L4' }, { name: 'L3' }, { name: 'H2' }, { name: 'L4' }, { name: 'S' }, { name: 'H1' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }],
	[{ name: 'H2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'H4' }, { name: 'L4' }, { name: 'H3' }, { name: 'L2' }, { name: 'L3' }],
	[{ name: 'L1' }, { name: 'H4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'H1' }, { name: 'H2' }],
	[{ name: 'L2' }, { name: 'L1' }, { name: 'H3' }, { name: 'L3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'H1' }],
];

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length - 2 };

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

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

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4'];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

// Cells are 84px here rather than the 118px a 5x5 board allowed, so the rank
// tiers sit slightly further apart than a straight port would give — a 10% step
// on 84px is only 8px and stops reading as a hierarchy.
const HIGH_SYMBOL_SIZE = 0.98;
const LOW_SYMBOL_SIZE = 0.8;
// Wild and Scatter deliberately overflow their cell: they are what the player is
// hunting, and on a 49-cell board they need to sit visually on top of the grid.
const SPECIAL_SYMBOL_SIZE = 1.1;

// ---------------------------------------------------------------------------
// Cascading (tumble) motion
//
// This game drops the board in rather than spinning columns, so the shared reel
// is createReelForCascading and these are CascadingReelSpinOptions, not the
// SpinningReelSpinOptions a lines game uses. Speeds are px/ms, intervals ms.
//
// reelFallInDelay is multiplied by (accumulatedPadding / reelLength - 1) inside
// the shared reel, and the padding accumulates left to right, so this value sets
// the *slope* of the left-to-right reveal rather than a fixed per-reel gap.
// ---------------------------------------------------------------------------
const CASCADE_SHARED = {
	reelPaddingMultiplierNormal: 1.2,
	reelPaddingMultiplierAnticipated: 8,
	symbolFallInBounceSizeMulti: 0.18,
};

export const SPIN_OPTIONS_DEFAULT = {
	...CASCADE_SHARED,
	symbolFallInSpeed: 2.2,
	symbolFallInInterval: 26,
	symbolFallInBounceSpeed: 0.35,
	symbolFallOutSpeed: 3,
	symbolFallOutInterval: 20,
	reelFallInDelay: 58,
	reelFallOutDelay: 42,
};

export const SPIN_OPTIONS_FAST = {
	...CASCADE_SHARED,
	symbolFallInSpeed: 4.4,
	symbolFallInInterval: 10,
	symbolFallInBounceSpeed: 0.8,
	symbolFallOutSpeed: 6,
	symbolFallOutInterval: 8,
	reelFallInDelay: 18,
	reelFallOutDelay: 12,
};

export const SPIN_OPTIONS_FAST_FREEGAME = {
	...CASCADE_SHARED,
	symbolFallInSpeed: 3.4,
	symbolFallInInterval: 16,
	symbolFallInBounceSpeed: 0.6,
	symbolFallOutSpeed: 4.6,
	symbolFallOutInterval: 12,
	reelFallInDelay: 30,
	reelFallOutDelay: 22,
};

export const MOTION_BLUR_VELOCITY = 31;

// ---------------------------------------------------------------------------
// Tumble timing
//
// Sized against the real books: a chain runs at most 8 links in the base game
// and 11 in the bonus, and 79% of wins are a single link. Even the worst case
// stays under ~5s at these numbers, so the common case can afford to breathe.
// ---------------------------------------------------------------------------
// Three tiers, mirroring SPIN_OPTIONS_*: the free game gets its own middle speed
// rather than borrowing turbo's. A feature is 10-18 spins and every one of them
// can tumble, so the base-game pace would make it drag — but turbo's pace throws
// away the heat grid filling up, which is the whole point of the feature.
export const TUMBLE_EXPLODE_MS = 260;
export const TUMBLE_DROP_MS = 300;
export const TUMBLE_EXPLODE_MS_FREEGAME = 230;
export const TUMBLE_DROP_MS_FREEGAME = 275;
export const TUMBLE_EXPLODE_MS_FAST = 120;
export const TUMBLE_DROP_MS_FAST = 150;

// Clusters within one winInfo start this far apart so several at once read as a
// volley rather than one flash. Books show up to 14 simultaneous clusters, so the
// stagger is bounded by a total budget rather than applied blindly per cluster.
export const CLUSTER_STAGGER_MS = 70;
export const CLUSTER_STAGGER_MS_FREEGAME = 60;
export const CLUSTER_STAGGER_MS_FAST = 26;
export const CLUSTER_VOLLEY_MAX_MS = 620;

// How long the winning symbols stay LIT before the tumble takes them. This is a
// hold, not the length of the win animation: the generated win effect runs on its
// own and nothing waits for it.
//
// The free game gets the LONGEST hold of the three, which is the opposite of what
// it had. Borrowing turbo's timing made the feature — the part with the heat grid
// building, i.e. the thing worth watching — flash past faster than base play.
// Highlight, hold, then burn: the pause is what lets a player see which cells are
// about to go and what multiplier they were sitting on.
export const CLUSTER_HOLD_MS = 420;
export const CLUSTER_HOLD_MS_FREEGAME = 560;
export const CLUSTER_HOLD_MS_FAST = 240;

// ---------------------------------------------------------------------------
// High-multiplier celebration
//
// Three tiers, and the thresholds come from the clusterMult distribution rather
// than from round numbers. Measured over the bonus books (157,030 clusters):
//
//     clusterMult >= 10   26.8%     >= 30   3.9%     >= 80   0.68%
//     highest ever seen: 265
//
// That 10+ figure is the important one: a quarter of ALL clusters clear a
// combined 10x, so anything staged there is not a celebration, it is the normal
// state of the feature. Only the free tier sits that low.
// ---------------------------------------------------------------------------

/** A: a cell at or above this heats past white and holds a beat before shattering. */
export const CELL_WHITE_HOT_FROM = 10;

/** B: the multipliers fly in and build the amount. 3.9% of clusters. */
export const FLY_IN_FROM = 30;
/** Beyond this many heated cells the tail is merged into one flyer. */
export const FLY_IN_MAX = 6;
export const FLY_IN_MS = 420;
export const FLY_IN_STAGGER_MS = 70;
// Hard ceiling on how long the volley will wait for a fly-in to report back.
//
// The longest legitimate assembly is FLY_IN_MS + FLY_IN_STAGGER_MS * (FLY_IN_MAX
// - 1) + 160 = 930ms, so this is never reached in normal play. It exists because
// the alternative to a deadline is a game that stops forever: that await is the
// only one in a round with no bound on it, and anything that stops the component
// from reporting — an unmount, a render that throws before onMount runs — takes
// the whole round with it. ClusterWins already made this argument once, when it
// stopped awaiting symbol completion callbacks; the fly-in reintroduced the
// pattern that note was written about.
export const FLY_IN_DEADLINE_MS = 1500;

/** C: hit-stop. 0.68% of clusters — rare enough that stopping the game is a reward. */
export const QUENCH_FROM = 80;
export const QUENCH_HOLD_MS = 130;

// ---------------------------------------------------------------------------
// Free-game grid multipliers
//
// Calibrated to what the math actually produces, not to maximum_board_mult (512,
// which never binds): across 20,000 books the highest single cell was 47, and
// only 8.6% of bonus rounds saw any cell reach 10. The ladder therefore spends
// its resolution between 1 and 20, where nearly all play happens.
//
// IMPORTANT: updateGrid.gridMultipliers is indexed by the UNPADDED row (0..6),
// while every position in winInfo / tumbleBoard / freeSpinTrigger is shifted by
// the padding row (+1, so 1..7). gridMultipliers[reel][r] is board row r + 1.
// ---------------------------------------------------------------------------
export const GRID_ROW_OFFSET = 1;

export type GridTier = {
	from: number;
	/** badge fill — the small corner pill that carries the number */
	fill: number;
	/** the number's own colour, chosen for contrast against `fill` */
	text: number;
	/** outline behind the number: dark on a light badge, light on a dark one */
	textStroke: number;
	/** cell edge, badge border, and the tint of the additive bloom under the symbol */
	glow: number;
	/** intensity 0..1: drives edge weight and bloom strength */
	heat: number;
	/** 0 = still; above that the badge breathes, for the rare high values */
	pulse: number;
};

// A heated position must read as LIT, never as shaded, and the ladder is spaced
// by how often a value is actually SEEN rather than by even arithmetic steps.
//
// Measured over the bonus books, counting every non-zero cell at the end of a
// feature:
//     1x 38.1%   2x 25.9%   3x 15.4%   4x 8.8%   5x 4.9%
//     6-9x 5.8%  10-19x 1.0%  20x+ 0.15%   (highest ever seen: 47x)
//
// So 1x and 2x are almost two thirds of everything on screen: they stay the
// quiet dark ember they were, because making the common case shout is what
// turned the whole feature board into a wash in earlier passes. Everything from
// 3x up gets its own colour — per value while values are still common enough to
// be worth telling apart on sight, then banded once they are not.
//
// The hue ramp is the one real metal follows as it heats: dull red, orange,
// amber, gold, yellow-white, white, then blue-white. It reads as an intensity
// scale without having to be learned, and it is the same language the rest of
// the game already speaks.
export const GRID_TIERS: GridTier[] = [
	// 64% of lit cells — deliberately unchanged and understated
	{ from: 1, fill: 0x5c1f0a, text: 0xffd9a0, textStroke: 0x2a0d03, glow: 0xff8a3a, heat: 0.2, pulse: 0 },
	{ from: 3, fill: 0xa8320a, text: 0xfff3d6, textStroke: 0x3a1006, glow: 0xff6a12, heat: 0.34, pulse: 0 },
	{ from: 4, fill: 0xe06a12, text: 0xfff3d6, textStroke: 0x3a1006, glow: 0xff9b32, heat: 0.45, pulse: 0 },
	{ from: 5, fill: 0xf59a1e, text: 0x3a1006, textStroke: 0xffe6a0, glow: 0xffb04a, heat: 0.58, pulse: 0 },
	{ from: 6, fill: 0xffd54a, text: 0x3a1006, textStroke: 0xfff3d6, glow: 0xffe6a0, heat: 0.72, pulse: 0 },
	// rare enough to be worth calling out with movement, not just colour
	{ from: 10, fill: 0xfff0c8, text: 0x5c1f0a, textStroke: 0xfffbe8, glow: 0xfffbe8, heat: 0.88, pulse: 0.6 },
	{ from: 20, fill: 0xbfe4f5, text: 0x123038, textStroke: 0xeaf7ff, glow: 0xdcefff, heat: 1, pulse: 1 },
];

// Nothing is drawn over the middle of a cell any more.
//
// This started as a filled tile, then a fainter tile, then a ring — and each time
// it still sat on the artwork, because ANY covering over the cell lowers the
// symbol's contrast however transparent it is. The heat is carried instead by
// three things that do not cover art: an edge around the cell, an ADDITIVE bloom
// beneath the symbol (additive can only add light, never mask), and a small pill
// in one corner holding the number. The corner is the only place a symbol's
// silhouette reliably has nothing in it.
export const GRID_BADGE_WIDTH = 0.46;
export const GRID_BADGE_HEIGHT = 0.28;

/** Colour band for a grid cell value. Value 0 means the cell is not yet activated. */
export const gridTierFor = (value: number): GridTier | undefined => {
	if (value <= 0) return undefined;
	let tier = GRID_TIERS[0];
	for (const candidate of GRID_TIERS) if (value >= candidate.from) tier = candidate;
	return tier;
};

// The board's own cell colour, used anywhere an opaque occluder is needed.
export const BOARD_CELL_COLOR = 0x1e1a17;

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

const explosion = {
	type: 'spine',
	assetKey: 'explosion',
	animationName: 'explosion',
	sizeRatios: { width: 1, height: 1 },
};

// Every state is the same PNG; the win state is animated programmatically by
// SymbolWinAnim rather than by a per-symbol Spine.
//
// The generated win spines were dropped when the supplied artwork landed. They
// were choreographed for the procedural set (a gem "rocking like a boat", a
// tong "snapping shut") and none of those motions described the new art, so
// every one of them would have had to be re-authored by hand. A single
// silhouette-driven heat-and-burn effect covers all ten, and keeps working for
// whatever art is dropped in next — which for this project has already happened
// twice.
const HIGH_RATIOS = { width: HIGH_SYMBOL_SIZE, height: HIGH_SYMBOL_SIZE };
const LOW_RATIOS = { width: LOW_SYMBOL_SIZE, height: LOW_SYMBOL_SIZE };
const SPECIAL_RATIOS = { width: SPECIAL_SYMBOL_SIZE, height: SPECIAL_SYMBOL_SIZE };

const symbolSprite = (assetKey: string, ratios: { width: number; height: number }) => ({
	type: 'sprite' as const,
	assetKey,
	sizeRatios: ratios,
});

const mixedSymbol = (spriteAssetKey: string, ratios: { width: number; height: number }) => ({
	explosion,
	static: symbolSprite(spriteAssetKey, ratios),
	spin: symbolSprite(spriteAssetKey, ratios),
	land: symbolSprite(spriteAssetKey, ratios),
	postWinStatic: symbolSprite(spriteAssetKey, ratios),
	win: symbolSprite(spriteAssetKey, ratios),
});

export const SYMBOL_INFO_MAP = {
	H1: mixedSymbol('efH1', HIGH_RATIOS),
	H2: mixedSymbol('efH2', HIGH_RATIOS),
	H3: mixedSymbol('efH3', HIGH_RATIOS),
	H4: mixedSymbol('efH4', HIGH_RATIOS),
	L1: mixedSymbol('efL1', LOW_RATIOS),
	L2: mixedSymbol('efL2', LOW_RATIOS),
	L3: mixedSymbol('efL3', LOW_RATIOS),
	L4: mixedSymbol('efL4', LOW_RATIOS),
	W: mixedSymbol('efW', SPECIAL_RATIOS),
	S: mixedSymbol('efS', SPECIAL_RATIOS),
} as const;

// Scatter landing pluck, pitched up per scatter already on the board. The board
// can hold more than five (books show up to seven), so the ladder is clamped at
// its top step rather than reaching for a sound that does not exist.
export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
