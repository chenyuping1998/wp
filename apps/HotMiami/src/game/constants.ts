import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';

// 90 (not 100): with 4 rows the framed board must clear the bottom UI bar
// Board scale. Everything inside BoardContainer (frame, wilds, win lines,
// sticky coins, anticipation) derives from this, so raising it enlarges the
// whole board coherently. The bet bar's layout lives in components-ui-pixi and
// is shared with other games, so the board grows into the empty space above it
// rather than the bar being shrunk.
export const SYMBOL_SIZE = 118;

export const REEL_PADDING = 0.53;

// initial board — 4 visible rows padded top and bottom (6 symbols per reel)
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L3' }, { name: 'H1' }, { name: 'L2' }],
	[{ name: 'H1' }, { name: 'H3' }, { name: 'H4' }, { name: 'L2' }, { name: 'L1' }, { name: 'H2' }],
	[{ name: 'H3' }, { name: 'H5' }, { name: 'L4' }, { name: 'L1' }, { name: 'H4' }, { name: 'L3' }],
	[{ name: 'L4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L3' }, { name: 'L1' }, { name: 'H3' }],
	[{ name: 'L3' }, { name: 'H5' }, { name: 'L1' }, { name: 'H4' }, { name: 'L2' }, { name: 'H1' }],
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

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'H5'];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

// Size tiers, widened so rank is legible at a glance. They used to sit at
// 0.95 / 0.85 / 1.05 — a 10% step between neighbouring tiers, which on a 118px
// cell is about 12px and reads as "slightly different art" rather than as a
// hierarchy. The gap that matters most is high-pay against the card royals,
// which make up the bulk of any board, so that one is roughly doubled.
//
// SPECIAL (Wild, Scatter, superspin Coin) deliberately overflows its cell — at
// 1.08 that is ~9px proud, up from ~6px — because those three are what the
// player is hunting and they should sit visually on top of the grid.
const HIGH_SYMBOL_SIZE = 0.97;
// 2026-08-13: 0.8 -> 0.92, on a report that the gaps between symbols were too
// wide. Measured rather than guessed, at the 132px on-screen cell pitch: a royal
// drew 89px of ink and left 43px of empty cell, against 118px and 14px for the
// top symbols. The royals are the most common symbols on the grid, so that gap
// is most of what makes the board read as sparse.
//
// They stay a little under the premiums, but the pay hierarchy is not carried by
// size here — it is carried by contrast, where the royals sit at 30-38% bright
// pixels against 55-80% for the premiums. Size only has to not fight it.
//
// Note this does NOT close the gap around the flamingo (h3) and the boombox
// (h4). Those two measure 61px and 59px of ink across, but that is the subject's
// own shape: both are 471px tall in a 512 square and fill their cell vertically,
// they are simply narrow. Widening them means redrawing the art, not changing
// this number.
const LOW_SYMBOL_SIZE = 0.92;
const SPECIAL_SYMBOL_SIZE = 1.08;

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


// Superspin coin grading. Prizes are in book units where 100 = 1x total bet and
// the strip pays 1/2/3/5/10/25/50/100/500/1000/10000x, so 10x up is the point
// where a hit is worth calling out. Shared by both places a coin value is drawn
// — Symbol.svelte on the reel and StickyPrizes.svelte once held — so a coin
// cannot change colour at the moment it sticks.
export const BIG_PRIZE_FROM = 10 * 100;
export const isBigPrize = (prize: number) => prize >= BIG_PRIZE_FROM;
export const BIG_PRIZE_FILL = [0xfff0c0, 0xffa93a, 0xd44a12];
export const BIG_PRIZE_STROKE = 0x5a1f06;

// (BOARD_CELL_COLOR removed: it was 0x1e290e, dark olive, documented as "sampled
// from frame_bg.png (#1c270d at centre)" — that is GoBananas' frame. Hot Miami's
// frame_bg.png centre pixel is (41,10,67). The constant had zero references
// anywhere in src/, so it was dead code carrying a wrong measurement.)

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

// Hot Miami symbols use PNG for static/spin/land/postWinStatic and generated
// Spine assets for win state so winning symbols always animate via Spine.
const HIGH_RATIOS = { width: HIGH_SYMBOL_SIZE, height: HIGH_SYMBOL_SIZE };
const LOW_RATIOS = { width: LOW_SYMBOL_SIZE, height: LOW_SYMBOL_SIZE };
const SPECIAL_RATIOS = { width: SPECIAL_SYMBOL_SIZE, height: SPECIAL_SYMBOL_SIZE };

const symbolSprite = (assetKey: string, ratios: { width: number; height: number }) => ({
	type: 'sprite' as const,
	assetKey,
	sizeRatios: ratios,
});

// Hot Miami ships static PNG art only - there are no Spine skeletons, so every
// symbol state renders from the same sprite. Win emphasis is done in the
// component layer (scale/tint pulse) rather than by swapping to a Spine track.
const spriteSymbol = (assetKey: string, ratios: { width: number; height: number }) => ({
	explosion,
	static: symbolSprite(assetKey, ratios),
	spin: symbolSprite(assetKey, ratios),
	land: symbolSprite(assetKey, ratios),
	postWinStatic: symbolSprite(assetKey, ratios),
	win: symbolSprite(assetKey, ratios),
});

export const SYMBOL_INFO_MAP = {
	H1: spriteSymbol('hmH1', HIGH_RATIOS),
	H2: spriteSymbol('hmH2', HIGH_RATIOS),
	H3: spriteSymbol('hmH3', HIGH_RATIOS),
	H4: spriteSymbol('hmH4', HIGH_RATIOS),
	H5: spriteSymbol('hmH5', HIGH_RATIOS),
	L1: spriteSymbol('hmL1', LOW_RATIOS),
	L2: spriteSymbol('hmL2', LOW_RATIOS),
	L3: spriteSymbol('hmL3', LOW_RATIOS),
	L4: spriteSymbol('hmL4', LOW_RATIOS),
	W: spriteSymbol('hmW', SPECIAL_RATIOS),
	S: spriteSymbol('hmS', SPECIAL_RATIOS),
	C: spriteSymbol('hmC', SPECIAL_RATIOS),
} as const;

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
