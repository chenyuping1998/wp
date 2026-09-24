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
// Note this does NOT close the gap around the milk bottle (h3) and the hay bale
// (h4). Those two measure 61px and 59px of ink across, but that is the subject's
// own shape: both are 471px tall in a 512 square and fill their cell vertically,
// they are simply narrow. Widening them means redrawing the art, not changing
// this number.
const LOW_SYMBOL_SIZE = 0.92;
const SPECIAL_SYMBOL_SIZE = 1.08;

// ── Reel rhythm, after the Densho teardown (2026-08-26) ─────────────────────
//
// Densho's personality in one line: it does not tease, it lets the whole board
// settle together and slowly. Five reels start at the SAME instant
// (`reelDelay: 0`), the strip scrolls 25% slower than its sibling The Luxe
// (speed 15 vs 20), the stop is long (0.8s), and the tension is spent AFTER the
// board lands rather than before it.
//
// That trade is the right one for Moooo for a reason Densho itself shows: both
// games' payoff is an expanding wild that resolves once the board is down. There
// is nothing to build towards during the spin, because the thing worth watching
// has not happened yet. Spending suspense on the scroll and then having none
// left for the mouth opening is backwards.
//
// So: the start stagger goes (145 -> 0) and the scroll and settle both slow.
// What DOES stay staggered is the STOP, which in this engine comes from the
// accumulating `reelPaddingMultiplierNormal` padding, not from this delay -
// reel n travels 7.2 symbols further than reel n-1, which at the new speed is
// ~327ms per reel against Densho's `reelStopDelay: 0.25`. Left-to-right arrival
// survives; the ragged left-to-right DEPARTURE does not.
//
// Anticipation is deliberately kept, and this is the one place Moooo does not
// follow Densho. Densho has no anticipation at all (verified in its bundle:
// zero uses of AttentionRemainingFilter, no reel_attention spine, no fake strip
// density, no music ducking). It can afford that because nothing on its board
// needs finding - the expand is announced by the symbol that already landed.
// Moooo's scatters are a separate hunt with their own three-of-five trigger, and
// killing the tease would leave that hunt with no presentation at all.
const SPIN_OPTIONS_SHARED = {
	// 0.15 -> 0.12: the settle is Densho's "long stop" read into this engine's
	// idiom. The bounce-back is a fixed 35.4px on a 118px cell, so this is a
	// 236ms -> 295ms change, not a new motion.
	reelBounceBackSpeed: 0.12,
	reelSpinSpeedBeforeBounce: 4,
	reelPaddingMultiplierNormal: 1.2,
	reelPaddingMultiplierAnticipated: 10,
	// Densho's `reelDelay: 0` - five reels start as one block.
	reelSpinDelay: 0,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 2,
	// 3 -> 2.6 px/ms, Densho's 25%-slower scroll, softened to 13% because Moooo's
	// base game is a grind and Densho's is not.
	reelSpinSpeed: 2.6,
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


// (Superspin coin grading removed 2026-08-27: BIG_PRIZE_FROM / isBigPrize /
// BIG_PRIZE_FILL / BIG_PRIZE_STROKE graded a coin's cash value gold-vs-amber
// above 10x. They were read only by the `{#if props.rawSymbol.prize}` block in
// Symbol.svelte, and `prize` is not a field on RawSymbol nor present on any
// board in any published book — Hot Miami's hold'n'spin, dead on arrival.)

// (BOARD_CELL_COLOR removed: it was 0x1e290e, dark olive, documented as "sampled
// from frame_bg.png (#1c270d at centre)" — that is GoBananas' frame. Moooo's
// frame_bg.png centre pixel is (41,10,67). The constant had zero references
// anywhere in src/, so it was dead code carrying a wrong measurement.)

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

// Moooo symbols use PNG for static/spin/land/postWinStatic and generated
// Spine assets for win state so winning symbols always animate via Spine.
const HIGH_RATIOS = { width: HIGH_SYMBOL_SIZE, height: HIGH_SYMBOL_SIZE };
const LOW_RATIOS = { width: LOW_SYMBOL_SIZE, height: LOW_SYMBOL_SIZE };
const SPECIAL_RATIOS = { width: SPECIAL_SYMBOL_SIZE, height: SPECIAL_SYMBOL_SIZE };

const symbolSprite = (assetKey: string, ratios: { width: number; height: number }) => ({
	type: 'sprite' as const,
	assetKey,
	sizeRatios: ratios,
});

// Moooo ships static PNG art only - there are no Spine skeletons, so every
// symbol state renders from the same sprite. Win emphasis is done in the
// component layer (scale/tint pulse) rather than by swapping to a Spine track.
const spriteSymbol = (assetKey: string, ratios: { width: number; height: number }) => ({
	static: symbolSprite(assetKey, ratios),
	spin: symbolSprite(assetKey, ratios),
	land: symbolSprite(assetKey, ratios),
	postWinStatic: symbolSprite(assetKey, ratios),
	win: symbolSprite(assetKey, ratios),
});

export const SYMBOL_INFO_MAP = {
	H1: spriteSymbol('mooooH1', HIGH_RATIOS),
	H2: spriteSymbol('mooooH2', HIGH_RATIOS),
	H3: spriteSymbol('mooooH3', HIGH_RATIOS),
	H4: spriteSymbol('mooooH4', HIGH_RATIOS),
	H5: spriteSymbol('mooooH5', HIGH_RATIOS),
	L1: spriteSymbol('mooooL1', LOW_RATIOS),
	L2: spriteSymbol('mooooL2', LOW_RATIOS),
	L3: spriteSymbol('mooooL3', LOW_RATIOS),
	L4: spriteSymbol('mooooL4', LOW_RATIOS),
	W: spriteSymbol('mooooW', SPECIAL_RATIOS),
	S: spriteSymbol('mooooS', SPECIAL_RATIOS),
	M: spriteSymbol('mooooM', SPECIAL_RATIOS),
} as const;

// ── Bell tiers ───────────────────────────────────────────────────────────────
//
// Brass, silver and gold. THESE THREE COLOURS APPEAR NOWHERE ELSE IN THE GAME at
// full metallic saturation — everything else on the reel is cloth, enamel,
// paper, wood or matte steel. That is the one rule the whole art direction hangs
// off, and it is a correction: Hot Miami's Neon Frames all looked identical and
// only the number inside them differed, so the tier was invisible and the player
// had to read a digit to learn what had happened. The bell is Moooo's
// equivalent, so nothing else is allowed to glint like it.
//
// Three HUES, not three brightnesses of one hue. See
// docs/handoff/moooo_SYMBOLS.md.
export const BELL_COLORS = {
	pasture: 0xc98a3c, // brass — warm orange-brown
	prize: 0xdfe9f0, // silver — cool near-white
	champion: 0xffc43d, // gold — saturated yellow
} as const;

// ── Milk Meter ───────────────────────────────────────────────────────────────
//
// Three levels, no level 0 — the reference's buy cards show three pips and plain
// Free Spins already starts on the first. A reel's level is the LOWEST bell tier
// that reel can still roll, so the meter is coloured by the tier it GUARANTEES
// rather than by how full it is. It does not measure progress, it promises a
// floor, and that is the only way the player learns what it is for without
// reading the rules panel.
//
// Kept in step with `meter_levels` in math-sdk/games/moooo/game_config.py; the
// book's `milkMeterInit`/`milkMeterUpdate` events carry `maxLevel` so the client
// never has to assume this number is right.
export const METER_MAX_LEVEL = 3;
export const METER_PIP_SIZE = 14;
export const METER_HEIGHT = 34;

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
