import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';
import config from './config';

// IS THIS BET MODE A BOUGHT ONE?
//
// Case-insensitively, and that is the entire reason this is a function. The
// config's bet modes are keyed as the math names them — lowercase `bonus100` —
// and `stateBet.activeBetModeKey` is uppercase: it initialises to 'BASE', and
// HOLD_AND_SPIN_MODE_KEY below is 'HOLDANDSPIN'. Indexing the config with it
// directly returns undefined for every mode, silently, which is how the mascot's
// buy reaction first shipped doing nothing at all.
//
// state-shared has the same problem and solves it the same way, because the
// value can arrive from the RGS on a resume where its casing is not ours to
// decide.
//
// It lives HERE rather than beside its first caller so that stateGame can use it
// too. bookEventHandlerMap already imports stateGame, so defining it there and
// importing it back would close a cycle — and a cycle in this file set is how
// the board's types collapsed to `any` once before.
export const isBoughtMode = (key: string) => {
	const modes = config.betModes as Record<string, { buyBonus?: boolean } | undefined>;
	return Boolean((modes[key.toLowerCase()] ?? modes[key.toUpperCase()])?.buyBonus);
};

// Board geometry. This game's reels change height DURING a round: the baseline
// is 4 rows on every reel and a reel can be stretched to 5 and then 6, left to
// right, so the board is routinely ragged — [6,4,4,4,4] is step 2 of 10.
//
// THE BOX IS ALWAYS MAX_ROWS TALL. Everything downstream sizes itself to
// MAX_ROWS and the reels fill what they need of it, so the board NEVER rescales
// mid-round. Margin Call solves the same problem the other way, fitting the box
// to the current row count and treating the change of scale as part of the
// moment — right for a one-off, uniform 3->5 expansion on feature entry, wrong
// here, where a reel grows on its own several times inside one feature and a
// rescale on each would be constant churn.
export const BASE_ROWS = 4;
export const MAX_ROWS = 6;
export const NUM_REELS = 5;

// Reels stand on a shared BOTTOM edge and stretch UPWARD, so a short reel sits
// at the foot of the box with empty cells above it. Two reasons, and the first
// is the load-bearing one:
//
//   · A shared baseline is what makes the board's SILHOUETTE readable. Growth is
//     left to right and depth first, so the skyline steps down from reel 1 — and
//     that staircase IS the progress meter this game deliberately has no counter
//     UI for. Centring each reel instead gives a shape ragged at both ends with
//     no line to read it against.
//   · It suits the fiction: in low gravity things drift up.
export const BOARD_BOTTOM_ANCHORED = true;

// Cell size in BOARD space. boardLayout() fits the box to the screen from here.
//
// 112, down from 140, and the 20% is what reserving two extra rows costs.
// Measured against the desktop box: 800px tall less a 140px bet bar leaves 660px
// for the housing, and the housing is boardHeight x BOARD_SHRINK x the frame's
// own overhead. At six rows that is 6 x 112 x 0.89 x 1.06 = 634px, so 26px of
// margin — about what the 4-row board had at 140.
//
// The frame overhead is where most of the difference was bought back. The old
// frame was 1.28 on BOTH axes, which at six rows forces the cell down to 96; the
// board is only 560 wide against 1422 of canvas, so the height was paying for
// decoration the width had room for. See FRAME_SCALE.
export const SYMBOL_SIZE = 112;

export const REEL_PADDING = 0.53;

// A reel holds its visible rows plus one padding symbol above and below.
export const paddedReelLength = (rows: number) => rows + 2;

// The baseline height every reel starts and resets to.
export const BOARD_ROWS_BASE: number[] = Array(NUM_REELS).fill(BASE_ROWS);

// How far down a reel of `rows` sits inside the MAX_ROWS box. Zero for a reel at
// full height; two cells' worth for one at the baseline.
export const reelYOffset = (rows: number) => (MAX_ROWS - rows) * SYMBOL_SIZE;

// WHERE A CELL ACTUALLY IS, and every overlay must go through here.
//
// Five separate components were each deriving a row's y from the six-row box —
// `row * SYMBOL_SIZE - SYMBOL_SIZE / 2` and variations of it — which is only
// correct for a reel that has already grown to six. At the baseline every one of
// them was drawing two cells too high: win frames and the dimming scrim over the
// closed shutter instead of over the symbols, scatter bursts and held coins
// floating above the reel they belong to.
//
// `row` is the PADDED index the book uses, 1..rows; row 0 and row rows+1 are the
// padding cells either side and are never drawn by an overlay.
export const cellTopY = (rows: number, row: number) => reelYOffset(rows) + (row - 1) * SYMBOL_SIZE;
export const cellCenterY = (rows: number, row: number) =>
	cellTopY(rows, row) + SYMBOL_SIZE / 2;
// The reel's own window inside the box: what a full-column overlay may cover.
export const reelWindow = (rows: number) => ({
	top: reelYOffset(rows),
	height: rows * SYMBOL_SIZE,
});

// initial board — 4 visible rows padded top and bottom (6 symbols per reel).
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L1' }, { name: 'H3' }, { name: 'L5' }, { name: 'L4' }, { name: 'H1' }, { name: 'L2' }],
	[{ name: 'H1' }, { name: 'H3' }, { name: 'H4' }, { name: 'L2' }, { name: 'L1' }, { name: 'H2' }],
	[{ name: 'H3' }, { name: 'H1' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L5' }],
	[{ name: 'L4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L3' }, { name: 'H3' }, { name: 'L4' }],
	[{ name: 'L3' }, { name: 'L5' }, { name: 'L1' }, { name: 'H4' }, { name: 'H1' }, { name: 'L1' }],
];

// THE BOX, not the current board. Sized to MAX_ROWS so the frame, the mask and
// boardLayout() are all fixed for the whole round — see the note on SYMBOL_SIZE
// for why nothing here follows the live row count.
export const BOARD_DIMENSIONS = { x: NUM_REELS, y: MAX_ROWS };

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

// The housing's border as a multiple of the board, PER AXIS.
//
// It used to be a single 1280/1000 = 1.28 applied to both, which is affordable
// on a board wider than it is tall and not on this one: at six rows a uniform
// 1.28 forces the cell down to 96px. The board is 560 wide inside 1422 of
// canvas, so the horizontal border is free and the vertical border is the
// scarcest space in the game — hence a wide shoulder and a thin sill.
//
// The frame art has to be reauthored for this (9-slice, or a new asset drawn to
// these proportions). The square 1280x1280 sprite was ALREADY being stretched to
// 1.25:1 by the old 700x560 board, so this is a change of degree.
export const FRAME_SCALE = { x: 1.3, y: 1.06 };

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
// Frameless art needs a gap; framed art must not have one.
//
// The royals still carry their riveted plate, and those plates ARE the grid —
// anything under 1 opens a visible hole in the wall between them. The high
// symbols, the Wild and the Scatter have had their frames cropped away, so at 1
// their artwork runs edge to edge and touches the neighbouring tile with nothing
// between them. 0.88 gives them their own air without breaking the royals' wall.
const HIGH_SYMBOL_SIZE = 0.88;
const LOW_SYMBOL_SIZE = 1;
const SPECIAL_SYMBOL_SIZE = 0.88;

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

// The trigger spin of a BOUGHT round. Same speeds, a much shorter tease.
//
// `reelPaddingMultiplierAnticipated` is how many extra strip lengths an
// anticipating reel travels before it stops, and 10 is the base game's number.
// It is right there: the tease is the only thing standing between the player and
// a feature they might not get, so it should be drawn out.
//
// A bought round is not that. The player has already paid, exactly three
// scatters are on the strip and all three WILL land — the reels are teasing an
// outcome that was settled at the moment the button was pressed. Ten strip
// lengths of it, three reels running, turns the thing they bought into a queue.
//
// Three keeps the shape of the tease — the reels still stop one at a time, the
// last one still arrives last — and spends about a third of the time on it.
export const SPIN_OPTIONS_BOUGHT = {
	...SPIN_OPTIONS_SHARED,
	reelPaddingMultiplierAnticipated: 3,
	reelPreSpinSpeed: 2,
	reelSpinSpeed: 3,
	reelBounceSizeMulti: 0.3,
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
// rather than instant: reelSpinDelay 90 against 145 keeps the reels landing one
// after another, which is the part that reads as a spin at all. The stop button
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
// rhythm itself. At 145 the last reel lands 580ms after the first; at 300 it
// lands 1.2s after, which is the pace the reveal actually needs.
// The bet-mode key for the 50x hold and spin, named ONCE.
//
// It was spelled 'SUPERSPIN' inline in five components. Renaming the mode to
// HOLDANDSPIN in betModeMeta silently falsified every one of them: the night
// background stopped showing (all three FadeContainers went false and the scene
// went black), the board frame lost its mode styling, the respin plaque got the
// free-game label, the music stayed on the base bed, and the round-end TOTAL WIN
// plaque never fired. None of that failed loudly — a string comparison that is
// simply never true has no symptom except the feature not happening.
export const HOLD_AND_SPIN_MODE_KEY = 'HOLDANDSPIN';

export const SPIN_OPTIONS_HOLDANDSPIN = {
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
// hold and spin presentation where each cell spun in place instead of the column
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
// Held hold and spin cells are filled with this so they read as an ordinary empty
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

// EVERY STATE IS THE SAME SPRITE, INCLUDING `win`.
//
// It used to be `win: symbolSpine(...)`, and that one line was showing the wrong
// game. The win spines under assets/spines/goBananasSymbolsV3 carry gen-2's
// 256x256 military art baked into their atlases, so the instant a symbol won it
// swapped from the new 1024 rainforest tile to the old picture — plus the
// `payframe` gold outline SymbolSpine draws alongside it. The reported "old win
// effect" was both of those at once.
//
// Routing `win` through a sprite sends it to SymbolWinAnim instead, which
// animates the CURRENT art programmatically and draws no frame of its own (the
// framing is WinWays' job). The spine assets and the gbSp* registry entries are
// dead once nothing points at them.
const mixedSymbol = (spriteAssetKey: string, ratios: { width: number; height: number }) => ({
	explosion,
	static: symbolSprite(spriteAssetKey, ratios),
	spin: symbolSprite(spriteAssetKey, ratios),
	land: symbolSprite(spriteAssetKey, ratios),
	postWinStatic: symbolSprite(spriteAssetKey, ratios),
	win: symbolSprite(spriteAssetKey, ratios),
});

export const SYMBOL_INFO_MAP = {
	H1: mixedSymbol('gbH1', HIGH_RATIOS),
	H2: mixedSymbol('gbH2', HIGH_RATIOS),
	H3: mixedSymbol('gbH3', HIGH_RATIOS),
	H4: mixedSymbol('gbH4', HIGH_RATIOS),
	L1: mixedSymbol('gbL1', LOW_RATIOS),
	L2: mixedSymbol('gbL2', LOW_RATIOS),
	L3: mixedSymbol('gbL3', LOW_RATIOS),
	L4: mixedSymbol('gbL4', LOW_RATIOS),
	L5: mixedSymbol('gbL5', LOW_RATIOS),
	W: mixedSymbol('gbW', SPECIAL_RATIOS),
	S: mixedSymbol('gbS', SPECIAL_RATIOS),
	X: mixedSymbol('gbX', LOW_RATIOS),
	P: mixedSymbol('gbP', SPECIAL_RATIOS),
} as const;

// A grow marker rides on an ordinary symbol rather than being one, so the maths
// sends "H2G" and the art needed is H2's. There is no gbH2G asset and there must
// not be: nine duplicate sprite sets would have to be kept in step with nine
// originals, and the marker is a single overlay drawn on top (see Symbol.svelte).
//
// The suffix is the same convention game_config.py registers the marked names
// under. Named once, here, so the two ends cannot drift.
export const GROW_MARKER_SUFFIX = 'G';

/** The ordinary symbol under a marked name; unmarked names pass through. */
export const unmarkSymbolName = (name: string): keyof typeof SYMBOL_INFO_MAP => {
	if (name.endsWith(GROW_MARKER_SUFFIX)) {
		const base = name.slice(0, -GROW_MARKER_SUFFIX.length);
		if (base in SYMBOL_INFO_MAP) return base as keyof typeof SYMBOL_INFO_MAP;
	}
	return name as keyof typeof SYMBOL_INFO_MAP;
};

export const isMarkedSymbolName = (name: string) =>
	name.endsWith(GROW_MARKER_SUFFIX) && unmarkSymbolName(name) !== name;

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
