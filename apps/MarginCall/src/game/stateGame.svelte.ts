import _ from 'lodash';
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import { uiTheme } from 'components-ui-pixi';

import type { GameType, RawSymbol, LeverageHit, Position } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import {
	SYMBOL_SIZE,
	NUM_REELS,
	BASE_ROWS,
	MAX_ROWS,
	INITIAL_BOARD,
	BOARD_FIT,
	BOARD_BOTTOM_MARGIN,
	BOARD_EXPAND_MS,
	boardSizes,
	paddedReelLength,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	SPIN_OPTIONS_FAST_FREEGAME,
	INITIAL_SYMBOL_STATE,
	SCATTER_LAND_SOUND_MAP,
} from './constants';

const onSymbolLand = ({ rawSymbol }: { rawSymbol: RawSymbol; reelIndex?: number }) => {
	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}

	if (rawSymbol.name === 'W') {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
	}
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
		onReelStopping: () => {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: REEL_STOP_SOUNDS[reelIndex] ?? 'sfx_reel_stop_1',
				forcePlay: !stateBet.isTurbo,
			});
			if (!stateBet.isTurbo) {
				eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.12 });
			}
		},
		onSymbolLand: ({ rawSymbol }) => onSymbolLand({ rawSymbol, reelIndex }),
	});

	reel.reelState.spinOptions = () => {
		if (reel.reelState.spinType !== 'fast') return SPIN_OPTIONS_DEFAULT;
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
	// Visible rows on the current board: 3 in the basegame, 5 once the feature
	// game's boardExpand event lands. Everything that sizes or positions the
	// board reads this rather than a constant.
	rows: BASE_ROWS,
	scatterCounter: 0,
	// The feature game's running leverage meter, and the hits that last built it.
	// leverage is 1 outside the feature.
	leverage: 1,
	leverageHits: [] as LeverageHit[],
	// Positions taking part in the win currently being presented, in board
	// coordinates including the padding offset. Everything NOT in here is dimmed
	// while it plays - a ring around the winners is not enough on a busy board,
	// the win has to be the only bright thing on screen.
	winPositions: [] as Position[],
	// Scatters to flag while the trigger presentation runs.
	scatterPositions: [] as Position[],
});

// Rows as the LAYOUT sees them. stateGame.rows flips the instant the math says
// the board expanded; this follows it over BOARD_EXPAND_MS so the growth is an
// event the player watches rather than a frame in which everything moved.
// Fractional values are meaningful here - the board is mid-growth at 3.7 rows.
export const displayRows = new Tween(BASE_ROWS, {
	duration: BOARD_EXPAND_MS,
	easing: cubicOut,
});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Fit the board to the screen instead of drawing it at a fixed scale.
 *
 * The cell size is fixed in board space, so the only thing that changes is this
 * scale - which means neither the reels nor utils-slots ever learn that the
 * screen size exists. A basegame board sized to fill the frame at a fixed cell
 * size would put the feature board off the canvas (three rows at 64% of an 800px
 * box is a 171px cell, and five of those is 855px), so the fit target moves with
 * the row count and the boards end up different sizes on screen. That difference
 * is deliberate: the pull-back as the board opens is part of the moment.
 *
 * Both boards stand on the same line just above the bet bar, so the feature
 * board grows upward.
 */
const boardLayout = () => {
	const layout = stateLayoutDerived.mainLayout();
	const usesBar = uiTheme.betBarLayout === 'compactBottom';
	// uiTheme.barHeight is expressed against the standard box, so it has to be
	// converted before it can be subtracted from this one.
	const barHeight = usesBar
		? uiTheme.barHeight * (layout.height / stateLayoutDerived.mainLayoutStandard().height)
		: 0;

	const rows = displayRows.current;
	const growth = (rows - BASE_ROWS) / (MAX_ROWS - BASE_ROWS);
	const targetHeight =
		layout.height * lerp(BOARD_FIT.basegame.height, BOARD_FIT.feature.height, growth);
	const targetWidth =
		layout.width * lerp(BOARD_FIT.basegame.width, BOARD_FIT.feature.width, growth);

	const sizes = boardSizes(rows);
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

// The footprint the frame and the canvas have to accommodate - the feature
// board, whatever is on screen right now.
const maxBoardSizes = () => boardSizes(MAX_ROWS);

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
	maxBoardSizes,
	boardRaw,
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
