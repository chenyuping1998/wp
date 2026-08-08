import type { RawSymbol, SymbolState } from './types';

// 6x5 board. The width is held at the 588px the 7x7 board used (588 / 6 = 98) so
// the frame, bet bar and layout maths carry over; the board is simply shorter,
// which is what frees the strip above it for the pressure gauge.
export const SYMBOL_SIZE = 98;

export const REEL_PADDING = 0.53;

// Initial board — 5 visible rows padded top and bottom (7 symbols per reel).
// Only ever seen before the first spin, so it deliberately holds no symbol eight
// times over: a pay-anywhere board that pays on load would play its win
// animation against a round that never happened.
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L3' }, { name: 'H2' }],
	[{ name: 'H1' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }, { name: 'L3' }, { name: 'H2' }, { name: 'L4' }],
	[{ name: 'L3' }, { name: 'H1' }, { name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H4' }],
	[{ name: 'L4' }, { name: 'L3' }, { name: 'H2' }, { name: 'L4' }, { name: 'S' }, { name: 'H1' }, { name: 'L2' }],
	[{ name: 'H2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'H4' }, { name: 'L4' }, { name: 'H3' }],
	[{ name: 'L1' }, { name: 'H4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }, { name: 'L3' }, { name: 'H1' }],
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

// Cells are 98px, between the 118px a 5x5 board allowed and the 84px of the 7x7,
// so the rank tiers sit at roughly the proportions the forge board used.
const HIGH_SYMBOL_SIZE = 0.98;
const LOW_SYMBOL_SIZE = 0.82;
// Scatter and Nitrogen Tank deliberately overflow their cell: they are what the
// player is hunting, and they need to sit visually on top of the grid.
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
	symbolFallInSpeed: 1.65,
	symbolFallInInterval: 34,
	symbolFallInBounceSpeed: 0.27,
	symbolFallOutSpeed: 2.25,
	symbolFallOutInterval: 27,
	reelFallInDelay: 76,
	reelFallOutDelay: 55,
};

// A teasing reel drops slower than a normal one, and slower than the reels that
// have already stopped around it.
//
// The tease is the only moment in the base game where the outcome is still open
// and the player knows it — two Scatters are down and the third opens the
// feature. It used to fall at exactly the normal pace, so the anticipation frame
// lit up and the answer arrived before it had finished lighting. The extra
// padding (reelPaddingMultiplierAnticipated, 8x) already made the strip longer;
// this makes it travel slower too, which is what turns length into suspense
// rather than just more symbols going past at the same speed.
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

export const MOTION_BLUR_VELOCITY = 31;

// ---------------------------------------------------------------------------
// Tumble timing
//
// Sized against the real books (2,000-book census, 15-spin features): a chain
// runs at most 8 links in the base game and 10 in the bonus, and 68% of wins are
// a single link — so the cost of a slower link is paid once on almost every
// winning spin, not eight times.
//
// Three tiers, mirroring SPIN_OPTIONS_*: the free game gets its own middle speed
// rather than borrowing turbo's. A feature is 15-25 spins and every one of them
// can tumble, so the base-game pace would make it drag — but turbo's pace throws
// away the pressure gauge climbing, which is the whole point of the feature.
// ---------------------------------------------------------------------------
export const TUMBLE_EXPLODE_MS = 345;
export const TUMBLE_DROP_MS = 395;
export const TUMBLE_EXPLODE_MS_FREEGAME = 305;
export const TUMBLE_DROP_MS_FREEGAME = 360;
export const TUMBLE_EXPLODE_MS_FAST = 180;
export const TUMBLE_DROP_MS_FAST = 220;
// Turbo INSIDE the feature is its own tier, because turbo used to win outright
// and the free game inherited the fastest timings in the game. That is backwards:
// the feature is the part with the gauge climbing, and a player who turned turbo
// on wants the base game to stop dawdling, not to lose the thing they bought.
export const TUMBLE_EXPLODE_MS_FAST_FREEGAME = 265;
export const TUMBLE_DROP_MS_FAST_FREEGAME = 315;

// A pay-anywhere evaluation returns at most three paying symbols at once — the
// books show 1 in 96% of cases, 2 in 4%, 3 twice in 13,185 events. So unlike the
// cluster game this replaces there is no volley to budget: the stagger exists
// only so a rare double does not land as one flash.
export const WIN_STAGGER_MS = 110;
export const WIN_STAGGER_MS_FREEGAME = 95;
export const WIN_STAGGER_MS_FAST = 45;
export const WIN_STAGGER_MS_FAST_FREEGAME = 70;
export const WIN_VOLLEY_MAX_MS = 420;

// How long the winning symbols stay LIT before the crusher takes them. This is a
// hold, not the length of the win animation: the win effect runs on its own and
// nothing waits for it.
//
// The free game gets the LONGEST hold of the three. Borrowing turbo's timing
// would make the feature — the part with the gauge building, i.e. the thing worth
// watching — flash past faster than base play. Highlight, hold, then crush: the
// pause is what lets a player see which cells are about to go and at what
// pressure.
export const WIN_HOLD_MS = 570;
export const WIN_HOLD_MS_FREEGAME = 720;
export const WIN_HOLD_MS_FAST = 355;
export const WIN_HOLD_MS_FAST_FREEGAME = 560;

// Beat between a chain ending and the board being spinnable again.
//
// A tumble round ends on a NON-event: the last refill simply fails to make a
// paying count, so without a pause the board's final state is on screen for one
// frame of thought before the next spin tears it down. This is the moment a
// player reads what they finished with, and it is the only quiet in the round.
//
// Turbo keeps a shorter one rather than none — a player in turbo still needs to
// see that the chain is over, they just do not need as long to see it.
export const ROUND_END_HOLD_MS = 620;
export const ROUND_END_HOLD_MS_FAST = 300;

// ---------------------------------------------------------------------------
// The pressure gauge
//
// The feature mechanic: a single global multiplier that gains +1 on every tumble
// and — unlike every tumble game this codebase has shipped before — does NOT
// reset between free spins. It resets only when the feature ends.
//
// Calibrated to what the math actually produces, not to the config ceiling.
// `global_multiplier_cap` is 50; across a 2,000-book census the gauge finished a
// feature at:
//
//     median 7    p99 17    highest ever seen 22
//
// So the dial spends its resolution between 1 and 20. Anything above the last
// tier is drawn at the last tier rather than being given colours nobody will
// see — and the cap exists to bound a pathological retrigger chain, not to be
// approached in ordinary play.
// ---------------------------------------------------------------------------

export type GaugeTier = {
	from: number;
	/** needle and numeral colour */
	color: number;
	/** arc fill behind the numeral */
	arc: number;
	/** additive bloom tint around the housing */
	glow: number;
	/** 0..1 — drives bloom strength and needle weight */
	intensity: number;
	/** 0 = still; above that the housing shakes, for the values worth alarming about */
	shake: number;
};

// The ramp is a pressure dial, not a heat ramp: it starts at instrument green,
// crosses into amber, and only goes red past the redline. That is a different
// language from the win colours (brass and white-hot), which is deliberate —
// the gauge has to be readable at a glance while the board is flashing.
export const GAUGE_TIERS: GaugeTier[] = [
	// ~30% of a feature is spent here — deliberately quiet
	{ from: 1, color: 0x8fe3b0, arc: 0x1d3a2a, glow: 0x4fd08a, intensity: 0.18, shake: 0 },
	{ from: 3, color: 0xd6e88a, arc: 0x33401c, glow: 0x9fd44a, intensity: 0.3, shake: 0 },
	{ from: 5, color: 0xffd54a, arc: 0x4a3a10, glow: 0xffc233, intensity: 0.45, shake: 0 },
	{ from: 8, color: 0xffa32c, arc: 0x552a08, glow: 0xff8a1a, intensity: 0.6, shake: 0 },
	// redline: p90-ish. From here the housing starts to move.
	{ from: 12, color: 0xff6a2a, arc: 0x5c1d06, glow: 0xff4d12, intensity: 0.78, shake: 0.35 },
	{ from: 16, color: 0xff3d2a, arc: 0x611004, glow: 0xff2a12, intensity: 0.9, shake: 0.7 },
	// p99.9+. Seen a handful of times per thousand features.
	{ from: 25, color: 0xfff1e0, arc: 0x6b0f0f, glow: 0xffffff, intensity: 1, shake: 1 },
];

/** Colour band for a gauge reading. */
export const gaugeTierFor = (value: number): GaugeTier => {
	let tier = GAUGE_TIERS[0];
	for (const candidate of GAUGE_TIERS) if (value >= candidate.from) tier = candidate;
	return tier;
};

/** The reading the dial is drawn against, so the needle sweep has a full scale. */
export const GAUGE_DIAL_MAX = 20;

/** Above this the whole board tints and the tumble carries the alarm sound. */
export const GAUGE_REDLINE = 12;

// ---------------------------------------------------------------------------
// Nitrogen tanks (the M symbol)
//
// A tank does NOT feed the gauge. It sits on the board doing nothing until the
// spin's tumbling has finished, and then the sum of every tank still on the
// board multiplies that whole spin's win. That makes it the game's only
// multiplicative spike and the only thing that resolves *after* the board has
// gone quiet — so it gets its own beat rather than sharing the tumble's.
//
// Measured over 6,000 books per mode (10,176 boardMultiplierInfo events):
//
//     tanks on board   1: 79%   2: 18%   3: 2.3%   4: 0.3%   5: 0.07%   6: 0.05%
//     summed value     median 4   p99 50 (bonus) / 250 (base)   highest 550
// ---------------------------------------------------------------------------

/** Tanks fly into the win meter one at a time and build the amount. */
export const TANK_FLY_IN_MS = 420;
export const TANK_FLY_IN_STAGGER_MS = 90;
// Books top out at SIX tanks on one board — five was the figure a smaller census
// gave, and capping there dropped the sixth tank from the assembly while the
// payout still applied it, so the number the player watched being built did not
// match the number they were paid. Headroom over the observed maximum, and the
// final readout falls back to the event's own boardMult regardless.
export const TANK_FLY_IN_MAX = 8;
// Hard ceiling on how long the sequence will wait for a flyer to report back.
//
// The longest legitimate assembly is TANK_FLY_IN_MS + TANK_FLY_IN_STAGGER_MS *
// (TANK_FLY_IN_MAX - 1) + 160 = 940ms, so this is never reached in normal play.
// It exists because the alternative to a deadline is a game that stops forever:
// that await is the only one in a round with no bound on it, and anything that
// stops the component from reporting — an unmount, a render that throws before
// onMount runs — takes the whole round with it.
export const TANK_FLY_IN_DEADLINE_MS = 1500;

/** A single tank at or above this reads as the big one and is drawn white-hot. */
export const TANK_HEADLINE_FROM = 25;

/** Summed board multiplier at or above this gets a hit-stop. ~1% of tank spins. */
export const QUENCH_FROM = 50;
export const QUENCH_HOLD_MS = 130;

// The board's own cell colour, used anywhere an opaque occluder is needed.
export const BOARD_CELL_COLOR = 0x1b1b1d;

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
// SymbolWinAnim rather than by a per-symbol Spine. A single silhouette-driven
// effect covers all ten symbols and keeps working for whatever art is dropped
// into design/source/symbols next.
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

// No W. In a pay-anywhere game a wild joins every symbol group at once, so the
// math ships zero of them on the strips — see games/CrusherYard/readme.txt.
export const SYMBOL_INFO_MAP = {
	H1: mixedSymbol('cyH1', HIGH_RATIOS),
	H2: mixedSymbol('cyH2', HIGH_RATIOS),
	H3: mixedSymbol('cyH3', HIGH_RATIOS),
	H4: mixedSymbol('cyH4', HIGH_RATIOS),
	L1: mixedSymbol('cyL1', LOW_RATIOS),
	L2: mixedSymbol('cyL2', LOW_RATIOS),
	L3: mixedSymbol('cyL3', LOW_RATIOS),
	L4: mixedSymbol('cyL4', LOW_RATIOS),
	S: mixedSymbol('cyS', SPECIAL_RATIOS),
	M: mixedSymbol('cyM', SPECIAL_RATIOS),
} as const;

// Scatter landing clunk, pitched up per scatter already on the board. The board
// can hold more than five, so the ladder is clamped at its top step rather than
// reaching for a sound that does not exist.
export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
