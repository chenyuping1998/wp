import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';

// Cell size. The board is a hard 6 x 6 window with no padding rows (the math
// emits exactly 36 cells, like the reference books), so everything inside
// BoardContainer derives from this one number. 96 keeps six rows clear of the
// shared bet bar at the desktop height with room for the two side characters;
// the reference draws 108 x 100 cells, and REF_TIMING converts its pixel
// speeds through that, not through this.
export const SYMBOL_SIZE = 96;

// X of a reel's centre line is SYMBOL_SIZE * (reel + REEL_PADDING); rows are
// centred at (row + 0.5) * SYMBOL_SIZE. No padding row offset anywhere.
export const REEL_PADDING = 0.5;

// initial board — six visible rows, no padding (six symbols per reel)
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L3' }, { name: 'H1' }, { name: 'L2' }],
	[{ name: 'H1' }, { name: 'L3' }, { name: 'H4' }, { name: 'L2' }, { name: 'L1' }, { name: 'H2' }],
	[{ name: 'H3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'H4' }, { name: 'L3' }],
	[{ name: 'L4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L3' }, { name: 'L1' }, { name: 'H3' }],
	[{ name: 'L3' }, { name: 'H4' }, { name: 'L1' }, { name: 'H4' }, { name: 'L2' }, { name: 'H1' }],
	[{ name: 'L2' }, { name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'H2' }, { name: 'L3' }],
];

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length };

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
/** the four person symbols the character can convert into WILD */
export const PERSON_SYMBOLS = ['H1', 'H2', 'H3', 'H4'] as const;

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
// ── how big a symbol is DRAWN, measured by its ink rather than its canvas ───
//
// 2026-08-25, on a report that "外框太大圖騰太小" next to the reference build.
// Measured, the premiums were fine and the royals were not:
//
//     premium art   ink fills 92% of its 512 canvas -> 89% of the cell
//     l1 / l2       ink fills 62%                   -> 57% of the cell
//     l3 / l4       ink fills 70%                   -> 65% of the cell
//     reference     its letters fill about 66% of their cell
//
// One number per TIER cannot fix that, because the tier says nothing about how
// much of its canvas a drawing actually uses: A and K were drawn at the same
// ratio as Q and J and came out a fifth smaller. The royals are also the most
// common symbols on the grid, so their ink is most of what the board looks like
// — which is why the whole board read as small.
//
// The ratios below are therefore per symbol, chosen so every royal's ink lands
// near 70% of the cell. design/check_parts.py measures the shipped PNGs and
// fails if any symbol drifts out of its band, so redrawn art cannot silently
// shrink again.
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

// 27 cells/s; 5.4 extra cells per reel produce a 0.2-second stop cadence.
const REEL_SPEED = SYMBOL_SIZE * 27 / 1000;
export const SPIN_OPTIONS_DEFAULT = {
	reelPreSpinSpeed: REEL_SPEED,
	reelSpinSpeed: REEL_SPEED,
	reelSpinSpeedBeforeBounce: REEL_SPEED,
	reelBounceBackSpeed: REEL_SPEED,
	reelPaddingMultiplierNormal: 0.9,
	reelPaddingMultiplierAnticipated: 0.9,
	reelSpinDelay: 0,
	reelBounceSizeMulti: 1,
	landOnImpact: true,
};
export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_DEFAULT,
	reelPaddingMultiplierNormal: 0,
	reelBounceSizeMulti: 0,
	reelStaggerInTurbo: false,
};
export const SPIN_OPTIONS_FAST_FREEGAME = SPIN_OPTIONS_FAST;

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

// Hot Miami symbols use PNG for static/spin/land/postWinStatic and generated
// Spine assets for win state so winning symbols always animate via Spine.
const spriteSymbol = (assetKey: string, ratios: { width: number; height: number }) => ({
	static: symbolSprite(assetKey, ratios),
	spin: symbolSprite(assetKey, ratios),
	land: symbolSprite(assetKey, ratios),
	postWinStatic: symbolSprite(assetKey, ratios),
	win: symbolSprite(assetKey, ratios),
});

// Wild Alchemy symbols are full-bleed square cards (art/symbols-final): every
// card draws its own frame, so one ratio serves persons and tablets alike. The
// Tower fills its cell; the WILD overflows it (1.08) — the only card that does.
const CARD_RATIOS = { width: 0.94, height: 0.94 };
const SCATTER_RATIOS = { width: 1.0, height: 1.0 };
const WILD_RATIOS = { width: SPECIAL_SYMBOL_SIZE, height: SPECIAL_SYMBOL_SIZE };

export const SYMBOL_INFO_MAP = {
	H1: spriteSymbol('hmH1', CARD_RATIOS),
	H2: spriteSymbol('hmH2', CARD_RATIOS),
	H3: spriteSymbol('hmH3', CARD_RATIOS),
	H4: spriteSymbol('hmH4', CARD_RATIOS),
	L1: spriteSymbol('hmL1', CARD_RATIOS),
	L2: spriteSymbol('hmL2', CARD_RATIOS),
	L3: spriteSymbol('hmL3', CARD_RATIOS),
	L4: spriteSymbol('hmL4', CARD_RATIOS),
	W: spriteSymbol('hmW', WILD_RATIOS),
	S: spriteSymbol('hmS', SCATTER_RATIOS),
	// reference-book replays only (see assets.ts waBlank); never dealt by our math
	B: spriteSymbol('waBlank', LOW_RATIOS),
} as const;

/** The WILD card of each person (a WILD cell carries `from`: who was converted). */
export const WILD_INFO_BY_PERSON = {
	H1: spriteSymbol('waWH1', WILD_RATIOS),
	H2: spriteSymbol('waWH2', WILD_RATIOS),
	H3: spriteSymbol('waWH3', WILD_RATIOS),
	H4: spriteSymbol('waWH4', WILD_RATIOS),
} as const;

/** Symbol info for a cell, picking the converted person's own WILD card. */
export const symbolInfoOf = (rawSymbol: { name: string; from?: string }) =>
	rawSymbol.name === 'W' && rawSymbol.from && rawSymbol.from in WILD_INFO_BY_PERSON
		? WILD_INFO_BY_PERSON[rawSymbol.from as keyof typeof WILD_INFO_BY_PERSON]
		: SYMBOL_INFO_MAP[rawSymbol.name as keyof typeof SYMBOL_INFO_MAP];

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;

/**
 * What counts as a BIG win, in multiples of the stake: the BIG WIN banner
 * threshold (math winLevel 2, REF_TIMING.bigWinThresholds[0]). Everything that
 * reacts to "this one is big" reads this number, not its own copy.
 *
 * Book win totals are in hundredths of the bet, hence BIG_WIN_UNITS.
 */
export const BIG_WIN_MULTIPLE = 25;
export const BIG_WIN_UNITS = BIG_WIN_MULTIPLE * 100;
