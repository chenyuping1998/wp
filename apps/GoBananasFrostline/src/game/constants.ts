import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';
import { ICE_PLATE } from './palette';

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

// All one size in gen-2, and it has to stay that way.
//
// Gen-1 sized the tiers apart (0.97 high / 0.8 low / 1.08 special) to make rank
// legible: the symbols were transparent cut-outs floating on a board that drew
// its own grid, so a smaller royal just sat in a bigger gap and the Wild could
// overflow its cell to sit proud of everything.
//
// Gen-2 art is opaque riveted plates and BoardFrame no longer draws separators,
// so the symbols ARE the grid. Anything below 1 opens a visible hole in the wall
// — at 0.8 that is a 24px gap around every royal, and royals are most of the
// board — and anything above 1 overlaps the neighbouring plate's bezel.
//
// Rank is carried by the art instead: high-pay, Wild and Scatter plates have a
// brass bevel, the royals are plain steel. See design/GEN2_ART_SPEC.md §2.4.
const HIGH_SYMBOL_SIZE = 1;
const LOW_SYMBOL_SIZE = 1;
const SPECIAL_SYMBOL_SIZE = 1;

// ── stop rhythm ─────────────────────────────────────────────────────────────
//
// Ported from Hot Miami (apps/HotMiami/src/game/constants.ts), which tuned these
// against the Hacksaw spec the user supplied. The values that changed and why:
//
//   reelSpinDelay 145 -> 200
//     The START offset between reels. Their reference is 200ms start / 300ms
//     stop, a 1:1.5 ratio; our stop stagger already measures ~280ms because it
//     falls out of the accumulating padding, so the start was the only end that
//     was off.
//
//   anticipation: padding 10 -> 5, plus reelSpinSpeedAnticipated 1.5
//     Same wall-clock tease, half the speed. The spec is explicit that
//     anticipation is a SLOWDOWN and not a wait, and distance alone was all this
//     had: ten times the distance at full speed is a reel that blurs past for a
//     long time, five times at half speed is a reel the player can read. 1.5 is
//     half of reelSpinSpeed (3), matching their attentionSpeed/speed ratio.
//
//   landOnImpact
//     The squash happens when the reel hits, not a quarter of a second later.
//     On Hot Miami the late squash measured 265-269ms on every reel and was
//     reported as the LAST reel feeling a beat behind — that is simply where it
//     is naked, since on reels 1-4 the next reel arrives ~282ms later and hides
//     it.
//
// All three are optional fields of the shared SpinOptions type and default to
// the old behaviour, so nothing in packages/ changed and no sibling app moved.
const SPIN_OPTIONS_SHARED = {
	reelBounceBackSpeed: 0.15,
	reelSpinSpeedBeforeBounce: 4,
	reelPaddingMultiplierNormal: 1.2,
	reelPaddingMultiplierAnticipated: 5,
	reelSpinDelay: 200,
	reelSpinSpeedAnticipated: 1.5,
	landOnImpact: true,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 2,
	reelSpinSpeed: 3,
	reelBounceSizeMulti: 0.3,
};

// Base-game turbo. Still turbo — the reels are fast and the bounce is almost
// gone — but the board no longer lands as one block.
//
// Dropping all five reels together was the inherited behaviour and the Hacksaw
// spec says it is the wrong call: their turbo keeps a 150ms stop stagger
// (reelStopDelay 0.15 against 0.3 at normal speed) and only superTurbo collapses
// it to nothing. A board that lands at once reads as a screenshot appearing
// rather than as reels stopping, and it costs about 600ms to fix.
export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 5,
	reelSpinSpeed: 5,
	reelBounceSizeMulti: 0.05,
	reelSpinDelay: 150,
	reelStaggerInTurbo: true,
};

// Turbo inside the free game. Quicker than the base pace, but still a spin.
//
// This used to be SPIN_OPTIONS_FAST_FREEGAME, reached only when spinType was
// 'fast' — and 'fast' is the problem, not the speed. A fast spin is given zero
// padding, so the reels have no strip to travel through, and the slide is then
// skipped outright: every reel jumped to its final symbols on the same frame.
// No sweep, no reel-by-reel stops, nothing to watch. A losing free spin was over
// before the eye could find the board, which is most of an 18-spin feature.
//
// The free game now spins NORMALLY under turbo (reveal passes isTurboOverride)
// and takes these timings instead. Roughly a third quicker than the base game
// rather than instant: reelSpinDelay 90 against the base game's 200 keeps the
// reels landing one after another, which is the part that reads as a spin at
// all. (It was 90-against-145 before the stop rhythm was ported; the gap it
// opens up is now wider than when this number was chosen, and it is worth
// looking at once the new pace can be seen running.) The stop button
// still cuts it short for anyone who does want it gone.
export const SPIN_OPTIONS_TURBO_FREEGAME = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 3.2,
	reelSpinSpeed: 4.6,
	reelSpinSpeedBeforeBounce: 5.5,
	reelBounceBackSpeed: 0.2,
	reelSpinDelay: 90,
	reelBounceSizeMulti: 0.18,
};

// Superspin (the 50x hold-and-spin) gets its own profile, and it is the only
// mode that never takes a fast one — see stateGame.spinOptions.
//
// The round is three respins long and every one of them is the whole event: the
// player is watching individual cells to see whether a Coin lands. On the shared
// timings that lasted well under a second, and in turbo it was over before the
// eye had picked out which cells were new. Speeds come down and, more
// importantly, reelSpinDelay goes up — that value is multiplied by the reel
// index, so it is the gap between one reel stopping and the next, i.e. the
// rhythm itself. At the base game's 200 the last reel lands 800ms after the
// first; at 300 it lands 1.2s after, which is the pace the reveal actually
// needs. (The 580ms in the original note was measured against the old 145.)
export const SPIN_OPTIONS_SUPERSPIN = {
	...SPIN_OPTIONS_SHARED,
	reelSpinDelay: 300,
	reelBounceBackSpeed: 0.11,
	reelSpinSpeedBeforeBounce: 3,
	reelPreSpinSpeed: 1.6,
	reelSpinSpeed: 2.2,
	// a heavier settle: the coins should look like they dropped into place
	reelBounceSizeMulti: 0.36,
};

export const MOTION_BLUR_VELOCITY = 31;

// NOTE: there used to be a SUPERSPIN_CELL_SPIN switch here, offering a second
// superspin presentation where each cell spun in place instead of the column
// sweeping. It was hardcoded false, so the whole alternative path — a 158-line
// component, a branch in the reveal handler and a guard in StickyPrizes — was
// unreachable. The sweep is the shipped presentation; the alternative is in git
// history if it is ever wanted back.

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
// The board's ground, and the single most load-bearing colour in the game: see
// palette.ts rule 1 for why an arctic theme must NOT make this light.
export const BOARD_CELL_COLOR = ICE_PLATE;



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
