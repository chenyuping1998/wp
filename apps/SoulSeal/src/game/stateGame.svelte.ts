import _ from 'lodash';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import { uiTheme } from 'components-ui-pixi';

import type {
	GameType,
	RawSymbol,
	Position,
	CarrierHit,
	CollectorHit,
	CollectSweep,
	FeatureName,
} from './types';
import { RAIL_TOTAL } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import {
	SYMBOL_SIZE,
	NUM_REELS,
	BASE_ROWS,
	INITIAL_BOARD,
	BOARD_FIT_MAP,
	PORTRAIT_UI_RESERVE,
	BOARD_BOTTOM_MARGIN,
	BOARD_HOUSING_CLEARANCE,
	boardSizes,
	paddedReelLength,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_DEFAULT_FREEGAME,
	SPIN_OPTIONS_FAST,
	SPIN_OPTIONS_FAST_FREEGAME,
	INITIAL_SYMBOL_STATE,
	SCATTER_LAND_SOUND_MAP,
} from './constants';

const onSymbolLand = ({
	rawSymbol,
	symbolIndex,
}: {
	rawSymbol: RawSymbol;
	symbolIndex: number;
	reelIndex?: number;
}) => {
	// A reel lands every symbol it holds, and it holds one padding symbol above
	// the window and one below. A scatter sitting in either of those rang the
	// alarm for a scatter the player could not see - "there was no scatter but I
	// heard the sound". Visible rows are 1..rows.
	if (symbolIndex < 1 || symbolIndex > stateGame.rows) return;

	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}

	// CONTRACT deliberately makes no sound as it lands - the spin is only the five
	// reel stops and the scatter. See SPRITE_TO_SFX in Sound.svelte.
};

// Listed rather than built with a template literal: `sfx_reel_stop_${n}` widens
// to plain string, losing the SoundEffectName check.
const REEL_STOP_SOUNDS = [
	'sfx_reel_stop_1',
	'sfx_reel_stop_2',
	'sfx_reel_stop_3',
	'sfx_reel_stop_4',
	'sfx_reel_stop_5',
] as const;

const board = _.range(NUM_REELS).map((reelIndex) => {
	const reel = createReelForSpinning({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		// The feature board is two rows taller than the basegame one. Without this
		// the reel would keep padding and pre-spinning a 5-symbol strip into a
		// 7-symbol window - the strip would stop short and the bottom two rows
		// would never be filled by the spin. Every other game in the repo omits
		// the option and keeps the old fixed-length behaviour.
		//
		// This reads stateGame, which is declared BELOW this array - fine, because
		// it is only ever called during a spin, long after the module has finished
		// evaluating. It is not fine if createReelForSpinning ever calls it while
		// building the reel: that touches stateGame inside its temporal dead zone
		// and throws before a single frame renders. It did exactly that once.
		getReelLength: () => paddedReelLength(stateGame.rows),
		// This game opts in to a stoppable tease.
		//
		// The maths anticipates the feature from the first scatter, so a tease runs
		// on about one feature spin in five and the common shape is four chained
		// reels. Every reel from the first anticipated one on is marked `noStop`,
		// and without this the stop button is inert for the whole of it - the round
		// presents as hung, because nothing the player can press does anything.
		// Opting in leaves the tease exactly as long as it is; it just stops
		// swallowing the one control on screen.
		getAnticipationIsStoppable: () => true,
		onReelStopping: () => {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: REEL_STOP_SOUNDS[reelIndex] ?? 'sfx_reel_stop_1',
				forcePlay: !stateBet.isTurbo,
			});
			// NO FRAME IMPACT ON A REEL STOP.
			//
			// It fired at strength 0.12, which BoardFrame turns into an amplitude of
			// 9 * 0.12 = 1.08px wobbling at about 40 radians - and a one-pixel
			// oscillation on a sprite that size is the worst of both: too small to
			// read as the board being struck, large enough to smear its edges into
			// sub-pixel blur. Five reels a spin, every spin, all session.
			//
			// The effect itself stays for things that really do hit the board - the
			// transition slam comes in at 1.4, which is a whole twelve pixels and
			// reads as one.
		},
		onSymbolLand: ({ rawSymbol, symbolIndex }) => onSymbolLand({ rawSymbol, symbolIndex, reelIndex }),
	});

	reel.reelState.spinOptions = () => {
		// The feature needs its own options at BOTH speeds, and the branch order
		// matters: an anticipated reel's spinType is 'anticipated', never 'fast',
		// so a `spinType !== 'fast'` test sent every tease - turbo included - to the
		// base game's options and its 10x anticipation padding. Which is to say the
		// one spin whose length this option exists to control was the one spin that
		// never read it. See SPIN_OPTIONS_DEFAULT_FREEGAME for the arithmetic.
		if (reel.reelState.spinType !== 'fast') {
			// In the feature, 'normal' no longer implies "not turbo". The feature
			// passes isTurboOverride: false so its reels keep their padding and stop
			// one at a time (see bookEventHandlerMap), which means the spin type can
			// no longer be read as the speed setting - the flag has to be.
			//
			// Without this the whole change is inverted: opting out of the fast spin
			// TYPE would also opt out of the fast OPTIONS, and turbo in the feature
			// would run slower than no turbo at all.
			if (stateGame.gameType === 'freegame') {
				return stateBet.isTurbo ? SPIN_OPTIONS_FAST_FREEGAME : SPIN_OPTIONS_DEFAULT_FREEGAME;
			}
			return SPIN_OPTIONS_DEFAULT;
		}
		if (stateGame.gameType === 'freegame') return SPIN_OPTIONS_FAST_FREEGAME;
		return SPIN_OPTIONS_FAST;
	};

	return reel;
});

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	// Visible rows. Fixed at 3 - the collect mechanic changes what is on the
	// board, never its shape. Kept as a field because everything that sizes or
	// positions the board reads it, and a constant read through one name is
	// easier to follow than the same literal in a dozen places.
	rows: BASE_ROWS,
	scatterCounter: 0,
	// True while a win or a scatter trigger is being presented. What gets dimmed
	// is decided from each symbol's own state, NOT from a list of positions -
	// see ReelSymbol. Two separate rules for "which symbols are lit" and "which
	// symbols are dim" can disagree, and when they did, a symbol that Board had
	// correctly lit was being dimmed at the same time and read as not lit.
	highlightActive: false,
	// Scatter positions, kept only so ScatterTrigger knows where to draw its
	// rings. Nothing decides brightness from this.
	scatterPositions: [] as Position[],

	// ─── the collect mechanic ───────────────────────────────────────────────
	//
	// Every field here is written from a book event and never derived on the
	// client. The rail in particular: a count the client maintains itself is the
	// classic way a meter and its maths drift apart across a retrigger.

	// Which free-game feature is running, or null outside a feature. Set once by
	// collectFeatureSet and held for the whole run, retriggers included.
	feature: null as FeatureName | null,
	// Carrier value floor for the running feature - `swarm` guarantees 5x, the
	// others 0. Presentation only; the maths has already applied it.
	minCarrierValue: 0,
	// Whether the running feature guarantees at least one carrier and one
	// collector on every spin.
	guaranteesPair: false,

	// Carriers and wilds currently on the board, rebuilt from each reveal.
	//
	// These are PER SPIN, not accumulated. They exist so the collect animation
	// can find its targets without re-reading the board, and they are cleared
	// before every reveal.
	carriers: [] as CarrierHit[],
	collectors: [] as CollectorHit[],

	// The sweeps the maths resolved for this spin, in the order they must play.
	// Empty on any spin that collected nothing.
	//
	// The presentation must not reorder or re-derive these: a sweep shown taking
	// a carrier it did not take is indistinguishable from a payout bug, which is
	// how a Stake reviewer will read it.
	sweeps: [] as CollectSweep[],
	// True while the collect sequence is playing, so the bet bar and the spin
	// control can stay out of the way until the gourd is closed.
	collectActive: false,

	// Talisman rail. `railFilled` is always the count the last railAdvance event
	// reported, never incremented locally.
	railFilled: 0,
	railTotal: RAIL_TOTAL,
	// The global collect multiplier the rail has unlocked: 1, 2, 4 or 10.
	collectMultiplier: 1,
});

/**
 * Fit the board to the screen instead of drawing it at a fixed scale.
 *
 * The cell size is fixed in board space, so the only thing that changes is this
 * scale - which means neither the reels nor utils-slots ever learn that the
 * screen size exists.
 *
 * The board is 3 rows in both the base game and the feature. The scaffold this
 * was copied from grew to 5 rows in its feature and interpolated the fit target
 * between two sets of figures; the collect mechanic changes what is ON the board,
 * never its shape, so there is one fit target and no growth term.
 */
const boardLayout = () => {
	const layout = stateLayoutDerived.mainLayout();
	const layoutType = stateLayoutDerived.layoutType();

	// What the bet bar ACTUALLY occupies, which is not the same as what the theme
	// asked for. uiTheme.betBarLayout is 'compactBottom', but UIDefault overrides
	// that on portrait and renders the full stacked console instead - so reading
	// the theme alone under-reserves by a factor of five there and the board is
	// drawn underneath the controls. The branch mirrors UIDefault's own.
	const usesCompactBar = layoutType !== 'portrait' && uiTheme.betBarLayout === 'compactBottom';
	const reserveStandard = usesCompactBar
		? uiTheme.barHeight
		: layoutType === 'portrait'
			? PORTRAIT_UI_RESERVE
			: 0;
	// Both figures are expressed against the standard box, so they have to be
	// converted before they can be subtracted from this one.
	const barHeight =
		reserveStandard * (layout.height / stateLayoutDerived.mainLayoutStandard().height);

	const fit = BOARD_FIT_MAP[layoutType] ?? BOARD_FIT_MAP.desktop;
	const targetHeight = layout.height * fit.basegame.height;
	const targetWidth = layout.width * fit.basegame.width;

	const sizes = boardSizes(BASE_ROWS);
	// Whichever axis runs out first wins, so a portrait screen narrows the board
	// rather than letting it run off the sides.
	const scale = Math.min(targetHeight / sizes.height, targetWidth / sizes.width);

	const bottomY = layout.height - barHeight - BOARD_BOTTOM_MARGIN;

	return {
		x: layout.width * 0.5,
		y: bottomY - (sizes.height * scale) / 2,
		scale,
		anchor: { x: 0.5, y: 0.5 },
		pivot: { x: sizes.width / 2, y: sizes.height / 2 },
		...sizes,
	};
};

// The footprint the frame and the canvas have to accommodate. One board size
// now, so this is the same figure boardLayout uses; it is kept as its own
// function because several callers ask for it by this name.
const maxBoardSizes = () => boardSizes(BASE_ROWS);

/**
 * Where the board sits in CANVAS space, for anything drawn outside MainContainer
 * that has to lay itself out around the board rather than inside it.
 *
 * boardLayout is expressed in main-layout space, which is the box MainContainer
 * scales and positions; the backdrop layers are in canvas space. This applies
 * the same transform MainContainer does - a point p maps to
 * `layout.x + (p - anchor.x * layout.width) * layout.scale` - so the two agree
 * by construction instead of by a hand-tuned constant that a layout change
 * would silently invalidate.
 *
 * The board grows when the feature opens, so these bounds move: whatever reads
 * them has to be derived, not captured.
 */
const boardCanvasBounds = () => {
	const layout = stateLayoutDerived.mainLayout();
	const board = boardLayout();
	// `anchor` here is a bare number, not the {x, y} that anchors are elsewhere in
	// this codebase (boardLayout returns one of each, a few lines apart). Reading
	// `.x` off it yields undefined, which propagates as NaN all the way into the
	// geometry - and NaN coordinates draw nothing at all rather than drawing in
	// the wrong place, so the only symptom is a layer that silently disappears.
	const centerX = layout.x + (board.x - layout.anchor * layout.width) * layout.scale;
	// The housing plate is drawn wider than the reels themselves, and the gutters
	// have to clear the plate, not the cells.
	const halfWidth = (board.width * board.scale * layout.scale * BOARD_HOUSING_CLEARANCE) / 2;
	return { centerX, left: centerX - halfWidth, right: centerX + halfWidth };
};

const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

const scatterLandIndex = () => {
	if (stateGame.scatterCounter > 5) return 5;
	if (stateGame.scatterCounter < 1) return 1;
	return stateGame.scatterCounter as 1 | 2 | 3 | 4 | 5;
};

const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	boardLayout,
	boardCanvasBounds,
	maxBoardSizes,
	boardRaw,
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
