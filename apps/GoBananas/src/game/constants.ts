import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';

// 90 (not 100): with 5 rows the framed board must clear the bottom UI bar
// Board scale. Everything inside BoardContainer (frame, wilds, win lines,
// sticky coins, anticipation) derives from this, so raising it enlarges the
// whole board coherently. The bet bar's layout lives in components-ui-pixi and
// is shared with other games, so the board grows into the empty space above it
// rather than the bar being shrunk.
export const SYMBOL_SIZE = 118;

export const REEL_PADDING = 0.53;

// initial board — 5 visible rows padded top and bottom (7 symbols per reel)
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L1' }, { name: 'H3' }, { name: 'L5' }, { name: 'L4' }, { name: 'L3' }, { name: 'H1' }, { name: 'L2' }],
	[{ name: 'H1' }, { name: 'H3' }, { name: 'H4' }, { name: 'L2' }, { name: 'L5' }, { name: 'L1' }, { name: 'H2' }],
	[{ name: 'H3' }, { name: 'H1' }, { name: 'L4' }, { name: 'L1' }, { name: 'H4' }, { name: 'L3' }, { name: 'L5' }],
	[{ name: 'L4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L3' }, { name: 'L1' }, { name: 'H3' }, { name: 'L4' }],
	[{ name: 'L3' }, { name: 'L5' }, { name: 'L1' }, { name: 'H4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L1' }],
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

const HIGH_SYMBOL_SIZE = 0.95;
const LOW_SYMBOL_SIZE = 0.85;
const SPECIAL_SYMBOL_SIZE = 1.05;

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

// Superspin presentation. false (default) keeps the shared reel machinery — the
// column still sweeps, and held cells are covered by an occluder painted in the
// board's own olive so nothing of the sweep shows through and there is no red
// box. true switches to SuperspinCells, where each unheld cell spins in place
// and held cells need no occluder at all because nothing passes behind them.
// Kept as a switch because the two read quite differently and the choice is a
// judgement call, not a correctness one.
export const SUPERSPIN_CELL_SPIN = false;

// Superspin coin grading. Prizes are in book units where 100 = 1x total bet and
// the strip pays 1/2/3/5/10/25/50/100/500/1000/10000x, so 10x up is the point
// where a hit is worth calling out. Shared by both places a coin value is drawn
// — Symbol.svelte on the reel and StickyPrizes.svelte once held — so a coin
// cannot change colour at the moment it sticks.
export const BIG_PRIZE_FROM = 10 * 100;
export const isBigPrize = (prize: number) => prize >= BIG_PRIZE_FROM;
export const BIG_PRIZE_FILL = [0xfff0c0, 0xffa93a, 0xd44a12];
export const BIG_PRIZE_STROKE = 0x5a1f06;

// The board's own cell colour, sampled from frame_bg.png (#1c270d at centre).
// Held superspin cells are filled with this so they read as an ordinary empty
// cell rather than a coloured plate laid over the reel.
export const BOARD_CELL_COLOR = 0x1e290e;



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

// GoBananas symbols use PNG for static/spin/land/postWinStatic and generated
// Spine assets for win state so winning symbols always animate via Spine.
const HIGH_RATIOS = { width: HIGH_SYMBOL_SIZE, height: HIGH_SYMBOL_SIZE };
const LOW_RATIOS = { width: LOW_SYMBOL_SIZE, height: LOW_SYMBOL_SIZE };
const SPECIAL_RATIOS = { width: SPECIAL_SYMBOL_SIZE, height: SPECIAL_SYMBOL_SIZE };

const symbolSprite = (assetKey: string, ratios: { width: number; height: number }) => ({
	type: 'sprite' as const,
	assetKey,
	sizeRatios: ratios,
});

const symbolSpine = (
	assetKey: string,
	animationName: string,
	ratios: { width: number; height: number },
) => ({
	type: 'spine' as const,
	assetKey,
	animationName,
	sizeRatios: ratios,
});

const mixedSymbol = (
	spriteAssetKey: string,
	winSpineAssetKey: string,
	ratios: { width: number; height: number },
) => ({
	explosion,
	static: symbolSprite(spriteAssetKey, ratios),
	spin: symbolSprite(spriteAssetKey, ratios),
	land: symbolSprite(spriteAssetKey, ratios),
	postWinStatic: symbolSprite(spriteAssetKey, ratios),
	win: symbolSpine(winSpineAssetKey, 'win', ratios),
});

export const SYMBOL_INFO_MAP = {
	H1: mixedSymbol('gbH1', 'gbSpH1', HIGH_RATIOS),
	H2: mixedSymbol('gbH2', 'gbSpH2', HIGH_RATIOS),
	H3: mixedSymbol('gbH3', 'gbSpH3', HIGH_RATIOS),
	H4: mixedSymbol('gbH4', 'gbSpH4', HIGH_RATIOS),
	L1: mixedSymbol('gbL1', 'gbSpL1', LOW_RATIOS),
	L2: mixedSymbol('gbL2', 'gbSpL2', LOW_RATIOS),
	L3: mixedSymbol('gbL3', 'gbSpL3', LOW_RATIOS),
	L4: mixedSymbol('gbL4', 'gbSpL4', LOW_RATIOS),
	L5: mixedSymbol('gbL5', 'gbSpL5', LOW_RATIOS),
	W: mixedSymbol('gbW', 'gbSpW', SPECIAL_RATIOS),
	S: mixedSymbol('gbS', 'gbSpS', SPECIAL_RATIOS),
	X: mixedSymbol('gbX', 'gbSpX', LOW_RATIOS),
	P: mixedSymbol('gbP', 'gbSpP', SPECIAL_RATIOS),
} as const;

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
