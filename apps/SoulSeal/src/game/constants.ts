import type { RawSymbol, SymbolState } from './types';

// Board geometry. 5x3 in every mode - the collect mechanic changes what is ON
// the board, never its shape. Everything downstream still reads the row count
// through stateGame.rows rather than this constant, which is cheaper to leave in
// place than to unpick and costs nothing while there is one board size.
export const BASE_ROWS = 3;


export const NUM_REELS = 5;

// Cell size in BOARD space, not screen space. The board is drawn at this size
// and then fitted to the screen by boardLayout(), which is what lets the two
// board heights both fill the frame without the reels (or utils-slots) ever
// knowing the screen size changed.
export const SYMBOL_SIZE = 104;

// The generated wordmark's own proportions, so LoadingScreen sizes it from the
// asset rather than from two numbers typed beside it. It has now changed twice -
// the scaffold's mark was 2080x500, then a 1040x420 stacked lockup, now a
// 1560x300 single line - and the height that was originally hard-coded next to
// the Sprite did not change with it either time.
// design/generate_wordmark.mjs prints this value.
export const WORDMARK_ASPECT = 1560 / 300;

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
// Per layout type, because portrait is not the same problem. On desktop,
// landscape and tablet the board is HEIGHT-limited and the bet bar is the slim
// compact strip. On portrait the board is WIDTH-limited - five reels across an
// 800-wide box - and the bet bar is the full stacked console, which is four
// times taller. The single set of numbers below served the first case and broke
// the second; see PORTRAIT_UI_RESERVE.
//
// The portrait widths are set by the HOUSING, not by the reels: BoardFrame draws
// about BOARD_HOUSING_CLEARANCE (1.32x) wider than the cells, so a width
// fraction of w puts the frame at 1.32*w of the box. 0.70 -> 92%, which is as
// close to the edges as the frame's shoulders can go. The old 0.828 feature
// width put the frame at 109% - the feature board's housing was running off both
// sides of a portrait screen, which is the "cut off" half of the certification
// note.
//
// Both portrait boards land on the same width limit, so the 5x5 board opens
// downward-and-upward in place rather than growing. That is correct here: on a
// portrait screen there is no horizontal room for it to grow into, and pretending
// otherwise is what pushed it off the edges.
const BOARD_FIT_DEFAULT = {
	basegame: { height: 0.461, width: 0.648 },
	feature: { height: 0.702, width: 0.828 },
};

const BOARD_FIT_PORTRAIT = {
	basegame: { height: 0.461, width: 0.7 },
	feature: { height: 0.702, width: 0.7 },
};

export const BOARD_FIT_MAP = {
	desktop: BOARD_FIT_DEFAULT,
	landscape: BOARD_FIT_DEFAULT,
	tablet: BOARD_FIT_DEFAULT,
	portrait: BOARD_FIT_PORTRAIT,
};

// How much of the bottom of the screen the bet bar owns, in STANDARD portrait
// units (1080x1920), for the portrait layout only.
//
// Not a guess. LayoutPortrait's topmost element is the WIN readout, drawn at
// standard `height - 670` inside a container scaled 0.81, and UiLabel's stacked
// plate starts at y=-20 - so its top edge sits at 1920 - 670 - 20*0.81 = 1234,
// i.e. 686 up from the floor. 700 adds a little air.
//
// What it replaces: boardLayout used uiTheme.barHeight (140) on EVERY layout,
// because uiTheme.betBarLayout is 'compactBottom'. But UIDefault ignores that
// choice on portrait and forces the full LayoutPortrait console anyway. The
// board was therefore laid out against a 140-tall bar and drawn under a 686-tall
// one: the spin button, the balance and the win readout all printed on top of
// the reels. That is the "overlapping" half of the certification note.
export const PORTRAIT_UI_RESERVE = 700;

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
//
// Deliberately holds no carrier and no collector. This board is never evaluated,
// so one here would pay nothing while looking exactly like a board that should -
// the first thing a player sees should not be a promise the game will not keep.
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L3' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'H4' }],
	[{ name: 'H1' }, { name: 'L2' }, { name: 'H3' }, { name: 'L1' }, { name: 'L3' }],
	[{ name: 'L4' }, { name: 'L5' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }],
	[{ name: 'L1' }, { name: 'L3' }, { name: 'H4' }, { name: 'L2' }, { name: 'H3' }],
	[{ name: 'H3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L5' }, { name: 'L2' }],
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

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4'];
export const LOW_SYMBOLS = ['L1', 'L2', 'L3', 'L4', 'L5'];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

// Size tiers. The specials deliberately overflow their cell - they are what the
// player is hunting and should sit on top of the grid.
const HIGH_SYMBOL_SIZE = 0.97;
const LOW_SYMBOL_SIZE = 0.82;
const SPECIAL_SYMBOL_SIZE = 1.06;
// The carrier gets its own tier, above the other two specials, because it is the
// only symbol whose subject is PORTRAIT. import_symbols fits every symbol into
// the same 176px safe box, so a medallion inside a square frame fills it in both
// directions and a slim standing ghost fills it in one: measured, W and S draw
// 0.93 x 0.92 cells while M draws 0.47 x 0.93 and covers 27% of its canvas
// against their 55-69%. On the board it read as the smallest thing there.
//
// 1.13 is a ceiling, not a preference. BoardMask is exactly the board's height,
// so anything whose ink exceeds one cell is cropped on the top and bottom rows,
// and M's ink is 88% of its canvas: 1.13 x 0.88 = 1.00 cells, the largest value
// that still clears the mask. It buys about 14% more area, so most of the fix is
// the spirit aura baked into the sprite - see design/import_symbols.mjs.
const CARRIER_SYMBOL_SIZE = 1.13;

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

// The feature game's own options, at BOTH speeds.
//
// This is the single number that made a bonus round look frozen, so the
// arithmetic is written out rather than tuned by feel.
//
// An anticipated reel is slowed by making its strip longer: the reel spins
// `reelLength * reelPaddingMultiplierAnticipated` extra symbols, and the padding
// ACCUMULATES along the board, so the last reel of a four-reel tease carries four
// times that. Two things multiply it here that do not in the base game:
//
//   * the feature reel is 7 symbols to the base game's 5, so the same multiplier
//     buys 40% more strip;
//   * the maths anticipates the feature from the FIRST scatter
//     (`anticipation_triggers` is {basegame: 2, freegame: 1}), so the common
//     shape is [0,1,2,3,4] - four anticipated reels, not two.
//
// At the base game's multiplier of 10 that is 8.4 + 4x70 = 288 symbols of padding
// on reel 5, i.e. ~30,000px at 3px/ms: the board spins for TEN SECONDS. And
// because every reel from the first anticipated one on is marked `noStop`, the
// stop button does nothing for the whole of it - which is exactly what "the round
// is stuck and cannot continue" looks like from the player's side. It fires on
// about one feature spin in five, so a 10-spin bonus hits it roughly twice.
//
// 3 puts the worst case at ~3.1s and a single anticipated reel at ~1.1s. Margin
// Call, which this game was ported from, had already been through this and set 6
// - but it also gated the maths' first anticipated reel away on the client, so
// its worst case was three reels, not four. This game deliberately does not gate
// (see bookEventHandlerMap), so it needs the smaller number to land in the same
// place. `design/check_tease_length.mjs` holds the arithmetic to a ceiling.
const FREEGAME_ANTICIPATION_PADDING = 3;

export const SPIN_OPTIONS_DEFAULT_FREEGAME = {
	...SPIN_OPTIONS_DEFAULT,
	reelPaddingMultiplierAnticipated: FREEGAME_ANTICIPATION_PADDING,
};

export const SPIN_OPTIONS_FAST_FREEGAME = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 4.2,
	reelSpinSpeed: 3.8,
	reelSpinDelay: 185,
	reelBounceSizeMulti: 0.08,
	reelPaddingMultiplierAnticipated: FREEGAME_ANTICIPATION_PADDING,
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
	// MEASURED, by design/measure_banner_wells.mjs, off the supplied art - not
	// typed in. The five plaques are five different paintings with five different
	// border thicknesses, and the label and the amount are drawn INSIDE the well;
	// eyeballing the insets is how text ends up half-covered on one tier and
	// nobody notices until it is live. Re-run that script whenever the art changes
	// and paste what it prints.
	big: {
		key: 'mcWinBannerBig',
		aspect: 0.352,
		accent: 0xa8763e,
		well: { cx: 0.0, cy: -0.03, w: 0.845, h: 0.487 },
	},
	superwin: {
		key: 'mcWinBannerSuperwin',
		aspect: 0.381,
		accent: 0xd9a85c,
		well: { cx: 0.0, cy: -0.031, w: 0.781, h: 0.372 },
	},
	mega: {
		key: 'mcWinBannerMega',
		aspect: 0.42,
		accent: 0xffcb6b,
		well: { cx: 0.002, cy: 0.068, w: 0.681, h: 0.326 },
	},
	epic: {
		key: 'mcWinBannerEpic',
		aspect: 0.448,
		accent: 0xf2d544,
		well: { cx: 0.001, cy: 0.02, w: 0.619, h: 0.292 },
	},
	max: {
		key: 'mcWinBannerMax',
		aspect: 0.495,
		accent: 0xc8102e,
		well: { cx: 0.001, cy: 0.003, w: 0.619, h: 0.257 },
	},
} as const;

/**
 * The free-spin counter plaque, and the well its text sits in.
 *
 * MEASURED by design/measure_banner_wells.mjs off the supplied art, exactly like
 * WIN_BANNERS above and for the same reason: the text is drawn INSIDE the dark
 * panel, and the panel is a small part of an image that also contains a roof,
 * two hanging bells and a talisman slip. The old vector plaque had its text
 * placed by three hand-tuned fractions of the IMAGE; on this art those fractions
 * land on the roof.
 *
 * `aspect` is height / width, the same convention the banners use.
 */
export const FS_COUNTER_PANEL = {
	aspect: 0.757,
	well: { cx: 0.0, cy: -0.001, w: 0.386, h: 0.368 },
} as const;

/**
 * How wide the counter's WELL is drawn, in cells.
 *
 * The well is held constant and the plaque is sized from it - the same trade the
 * win banners make. Holding the image constant instead would mean the text
 * shrinking or growing with however much roof and bell the next piece of art
 * happens to carry around its panel.
 */
export const FS_COUNTER_WELL_WIDTH = 1.05;

/**
 * The narrowest well the counter may be squeezed to before it gives up on the
 * gutter beside the board and moves to the corner instead.
 *
 * In landscape the plaque hangs in whatever strip the board's fit leaves at the
 * left, and that strip is not the same on every preset: the tablet preset is
 * square, so the board takes nearly all of its width and leaves 140px - a
 * 0.40-cell well, which is a spin count nobody can read.
 *
 * Shrinking to fit is right up to a point and wrong past it, and this is the
 * point. Below it the plaque is drawn at full size in the top-left corner, above
 * the board's shoulder, where there is room for it.
 */
export const FS_COUNTER_MIN_WELL_WIDTH = 0.62;

/**
 * How much of the screen the free-spin TITLE CARD fills.
 *
 * FreeSpinIntro, FreeSpinOutro and the rail milestone all drop the same plaque
 * the counter uses, drawn large. It is fitted to the screen rather than to the
 * board because most of that picture is roof and bells: sizing it so its well
 * matched the drawn plate it replaced would need 1528px on a 1422px desktop.
 *
 * The card is modal - nothing behind it is being read - so it can take most of
 * the box. Not all of it: the swing tween rotates the plaque a couple of degrees
 * as it settles, and a card at 100% would clip its own corners doing so.
 */
export const FS_SIGN_FILL = 0.86;

export const WIN_BANNER_LABEL = {
	big: 'BIG WIN',
	superwin: 'SUPER WIN',
	mega: 'MEGA WIN',
	epic: 'EPIC WIN',
	max: 'MAX WIN',
} as const;

// The multiplier meter's colours are gone, and so is the meter.
//
// BIG_MULTIPLIER_FROM, isBigMultiplier, MULTIPLIER_FILL, MULTIPLIER_HOT_FILL and
// MULTIPLIER_STROKE described "+1/+2/+3/+5/+10 per CONTRACT symbol" - the
// scaffold's mechanic, on a symbol this game does not have. Nothing has imported
// them since the port; they were simply the last place phosphor green survived
// in this file.
//
// The per-cell scatter frame is gone, and with it SCATTER_FRAME_*. It drew a
// brass bracket around a symbol that is already a brass-ringed disc, and it
// stayed lit for as long as the symbol was on the board. What replaced it is
// ScatterTrigger, which fires once on the trigger.


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
const CARRIER_RATIOS = { width: CARRIER_SYMBOL_SIZE, height: CARRIER_SYMBOL_SIZE };

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
	// Four spirits, five elements. The scaffold had five highs and four lows;
	// Soul Seal is the other way round because the low tier is the five
	// elements - see design/art-bible.md.
	H1: spriteSymbol('mcH1', HIGH_RATIOS),
	H2: spriteSymbol('mcH2', HIGH_RATIOS),
	H3: spriteSymbol('mcH3', HIGH_RATIOS),
	H4: spriteSymbol('mcH4', HIGH_RATIOS),
	L1: spriteSymbol('mcL1', LOW_RATIOS),
	L2: spriteSymbol('mcL2', LOW_RATIOS),
	L3: spriteSymbol('mcL3', LOW_RATIOS),
	L4: spriteSymbol('mcL4', LOW_RATIOS),
	L5: spriteSymbol('mcL5', LOW_RATIOS),
	M: spriteSymbol('mcM', CARRIER_RATIOS),
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

// Talisman rail geometry. The rail sits on the beam ABOVE the board, so the
// layout has to leave room for it on every preset - the same headroom problem
// the scaffold's feature bags had, checked by design/check_board_fit.mjs.
//
// Expressed against one symbol CELL rather than in main-box units: the board is
// fitted to the screen, so a fixed pixel height comes out visibly wrong at both
// ends of the layout range.
export const RAIL_CELL_RATIO = 0.55;
/** clearance between the top of the board and the bottom of the rail, in BOARD units */
export const RAIL_GAP_ABOVE_BOARD = 24;
