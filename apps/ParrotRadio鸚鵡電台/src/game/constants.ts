import type { RawSymbol, SymbolState } from './types';

// 6x6 board. 588px wide (98px cells) and square, so the frame and the layout
// maths scale the same way in both axes.
export const SYMBOL_SIZE = 98;

export const REEL_PADDING = 0.53;

// Initial board — 6 visible rows padded top and bottom (8 symbols per reel).
// Only ever seen before the first spin, so no symbol appears eight times among
// the visible 36: a pay-anywhere board that pays on load would play its win
// animation against a round that never happened.
const SYMBOL_CYCLE: RawSymbol['name'][] = ['H1','H2','H3','H4','L1','L2','L3','L4'];
export const INITIAL_BOARD: RawSymbol[][] = Array.from({length:6},(_,reel)=>Array.from({length:7},(_,row)=>({name:SYMBOL_CYCLE[(reel*3+row)%8]})));

export const BOARD_DIMENSIONS = {
	x: INITIAL_BOARD.length,
	y: INITIAL_BOARD[0].length - 2,
};

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

const PORTRAIT_RATIO = 800 / 1422;
const LANDSCAPE_RATIO = 1600 / 900;
const DESKTOP_RATIO = 1422 / 800;

const DESKTOP_HEIGHT = 800;
const LANDSCAPE_HEIGHT = 900;
const PORTRAIT_HEIGHT = 1422;
export const DESKTOP_MAIN_SIZES = {
	width: DESKTOP_HEIGHT * DESKTOP_RATIO,
	height: DESKTOP_HEIGHT,
};
export const LANDSCAPE_MAIN_SIZES = {
	width: LANDSCAPE_HEIGHT * LANDSCAPE_RATIO,
	height: LANDSCAPE_HEIGHT,
};
export const PORTRAIT_MAIN_SIZES = {
	width: PORTRAIT_HEIGHT * PORTRAIT_RATIO,
	height: PORTRAIT_HEIGHT,
};

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

// deliberately overflows its cell: it is what the player is hunting.
const HIGH_SYMBOL_SIZE = 0.98;
const LOW_SYMBOL_SIZE = 0.84;
const SPECIAL_SYMBOL_SIZE = 1.1;

// ---------------------------------------------------------------------------
// Cascading (tumble) motion
//
// The board drops in rather than spinning columns, so the shared reel is
// createReelForCascading and these are CascadingReelSpinOptions. Speeds are
// px/ms, intervals ms.
//
// reelFallInDelay is multiplied by (accumulatedPadding / reelLength - 1) inside
// the shared reel, and the padding accumulates left to right, so this value sets
// the slope of the left-to-right reveal rather than a fixed per-reel gap.
// ---------------------------------------------------------------------------
const CASCADE_SHARED = {
	reelPaddingMultiplierNormal: 1.2,
	reelPaddingMultiplierAnticipated: 8,
	symbolFallInBounceSizeMulti: 0.08,
};

export const SPIN_OPTIONS_DEFAULT = {
	...CASCADE_SHARED,
	symbolFallInSpeed: 1.65,
	symbolFallInInterval: 34,
	symbolFallInBounceSpeed: 0.27,
	symbolFallOutSpeed: 2.25,
	symbolFallOutInterval: 27,
	reelFallInDelay: 76,
	reelFallOutDelay: 55,
};

// A teasing reel drops slower than a normal one, so the extra padding reads as
// suspense rather than just more symbols going past at the same speed.
export const SPIN_OPTIONS_ANTICIPATED = {
	...CASCADE_SHARED,
	symbolFallInSpeed: 0.95,
	symbolFallInInterval: 44,
	symbolFallInBounceSpeed: 0.2,
	symbolFallOutSpeed: 2.25,
	symbolFallOutInterval: 27,
	reelFallInDelay: 110,
	reelFallOutDelay: 55,
};

export const SPIN_OPTIONS_FAST = {
	...CASCADE_SHARED,
	symbolFallInSpeed: 3.1,
	symbolFallInInterval: 15,
	symbolFallInBounceSpeed: 0.58,
	symbolFallOutSpeed: 4.2,
	symbolFallOutInterval: 13,
	reelFallInDelay: 30,
	reelFallOutDelay: 21,
};

export const SPIN_OPTIONS_FAST_FREEGAME = {
	...CASCADE_SHARED,
	symbolFallInSpeed: 2.5,
	symbolFallInInterval: 22,
	symbolFallInBounceSpeed: 0.45,
	symbolFallOutSpeed: 3.4,
	symbolFallOutInterval: 17,
	reelFallInDelay: 42,
	reelFallOutDelay: 31,
};

// Turbo 2 (uiTheme.turboTiers = 2): the board drops another quarter faster and
const TURBO2_SPEED = 1.25;
export const turbo2Options = <T extends Record<string, number>>(options: T): T => ({
	...options,
	symbolFallInSpeed: options.symbolFallInSpeed * TURBO2_SPEED,
	symbolFallOutSpeed: options.symbolFallOutSpeed * TURBO2_SPEED,
	symbolFallInBounceSpeed: options.symbolFallInBounceSpeed * TURBO2_SPEED,
	symbolFallInInterval: options.symbolFallInInterval / TURBO2_SPEED,
	symbolFallOutInterval: options.symbolFallOutInterval / TURBO2_SPEED,
	reelFallInDelay: options.reelFallInDelay / TURBO2_SPEED,
	reelFallOutDelay: options.reelFallOutDelay / TURBO2_SPEED,
});

// App animation durations live in animationTimeline.ts (one clock for all cells).

// Beat between a chain ending and the board being spinnable again. A tumble
// round ends on a non-event (the last refill simply does not pay), so without a
// pause the final board is gone before the player has read it.
export const ROUND_END_HOLD_MS = 620;
export const ROUND_END_HOLD_MS_FAST = 300;

// The board's own cell colour, used anywhere an opaque occluder is needed.
// Deep teal rather than white: a pale board reads badly under 36 symbols.
export const BOARD_CELL_COLOR = 0x16334a;

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

const explosion = {
	type: 'sprite' as const,
	assetKey: 'mgL1',
	sizeRatios: { width: 1, height: 1 },
};

// Every state is the same PNG; the win state is animated programmatically by
// SymbolWinAnim rather than by a per-symbol Spine, so it keeps working for
// whatever art is dropped in next.
const HIGH_RATIOS = { width: HIGH_SYMBOL_SIZE, height: HIGH_SYMBOL_SIZE };
const LOW_RATIOS = { width: LOW_SYMBOL_SIZE, height: LOW_SYMBOL_SIZE };
const SPECIAL_RATIOS = {
	width: SPECIAL_SYMBOL_SIZE,
	height: SPECIAL_SYMBOL_SIZE,
};

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
	H1: mixedSymbol('mgH1', HIGH_RATIOS),
	H2: mixedSymbol('mgH2', HIGH_RATIOS),
	H3: mixedSymbol('mgH3', HIGH_RATIOS),
	H4: mixedSymbol('mgH4', HIGH_RATIOS),
	L1: mixedSymbol('mgL1', LOW_RATIOS),
	L2: mixedSymbol('mgL2', LOW_RATIOS),
	L3: mixedSymbol('mgL3', LOW_RATIOS),
	L4: mixedSymbol('mgL4', LOW_RATIOS),
	S: mixedSymbol('mgS', SPECIAL_RATIOS),
} as const;

// hold more than five, so the ladder is clamped at its top step.
export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
