import _ from 'lodash';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import { uiTheme } from 'components-ui-pixi';

import type { GameType, RawSymbol, LeverageHit } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import {
	SYMBOL_SIZE,
	NUM_REELS,
	BASE_ROWS,
	MAX_ROWS,
	INITIAL_BOARD,
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
});

// The reel housing fills most of the box height, so the board is scaled down to
// leave room for the bet bar and lifted by half of what the bar took so it stays
// centred in what is left. Sized against the TALLEST board rather than the
// current one: if it were sized against the 3-row board the whole game would
// jump scale the moment the feature expanded.
const BOARD_SHRINK = 0.89;

const boardLayout = () => {
	const layout = stateLayoutDerived.mainLayout();
	const usesBar = uiTheme.betBarLayout === 'compactBottom';
	const barFraction = usesBar
		? uiTheme.barHeight / stateLayoutDerived.mainLayoutStandard().height
		: 0;
	const sizes = boardSizes(stateGame.rows);
	return {
		x: layout.width * 0.5,
		y: layout.height * (0.5 - barFraction * 0.5),
		scale: usesBar ? BOARD_SHRINK : 1,
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
