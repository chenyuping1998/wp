import _ from 'lodash';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForCascading } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import { uiTheme } from 'components-ui-pixi';

import type { GameType, RawSymbol } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import {
	SYMBOL_SIZE,
	BOARD_SIZES,
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
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
};

// Listed rather than built with a template literal: `sfx_reel_stop_${n}` widens
// to plain string and loses the SoundEffectName check. There are seven columns
// but only five stop sounds, so the last two reuse the top of the ladder until
// the forge audio set adds its own steps.
const REEL_STOP_SOUNDS = [
	'sfx_reel_stop_1',
	'sfx_reel_stop_2',
	'sfx_reel_stop_3',
	'sfx_reel_stop_4',
	'sfx_reel_stop_5',
	'sfx_reel_stop_5',
	'sfx_reel_stop_5',
] as const;

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	// Cascading, not spinning: a cluster game drops its board in and tumbles it,
	// so a column sweep would be the wrong verb entirely.
	const reel = createReelForCascading({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: REEL_STOP_SOUNDS[reelIndex] ?? 'sfx_reel_stop_1',
				forcePlay: !stateBet.isTurbo,
			});
			// The housing takes the hit too — a much lighter version of the win
			// recoil, so symbols landing read as weight arriving in the frame rather
			// than sprites appearing. Skipped in turbo, where seven recoils inside
			// half a second would just be noise.
			if (!stateBet.isTurbo) {
				eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.1 });
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
	scatterCounter: 0,
	// Free game only. Indexed [reel][row] in BOARD (padded) space so it lines up
	// with every other position the math sends; the raw event is unpadded and is
	// shifted on the way in. Empty outside the feature.
	gridMultipliers: [] as number[][],
	// Running total of the tumble sequence in progress, in book cents.
	tumbleWin: 0,
	// How many links the current tumble chain has resolved (1 = first win).
	tumbleChain: 0,
});

// The reel housing fills 94% of the box height, so a strip along the bottom
// cannot simply be laid over it, and the board cannot just be pushed up either:
// the game box maps exactly onto the canvas, so anything past the top edge is
// clipped rather than spilling into the background. It is scaled down instead and
// lifted by half of what the strip took so it stays centred in what is left.
const BOARD_SHRINK = 0.89;

const boardLayout = () => {
	const layout = stateLayoutDerived.mainLayout();
	const usesBar = uiTheme.betBarLayout === 'compactBottom';
	// Derived from the bar's own height rather than duplicated, so the two cannot
	// drift apart: the game box and the standard box cover the same screen, so the
	// strip occupies the same fraction of each.
	const barFraction = usesBar
		? uiTheme.barHeight / stateLayoutDerived.mainLayoutStandard().height
		: 0;
	return {
		x: layout.width * 0.5,
		// centred in the area above the strip, not in the whole box
		y: layout.height * (0.5 - barFraction * 0.5),
		scale: usesBar ? BOARD_SHRINK : 1,
		anchor: { x: 0.5, y: 0.5 },
		pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
		...BOARD_SIZES,
	};
};

const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

const scatterLandIndex = () => {
	if (stateGame.scatterCounter > 5) return 5;
	if (stateGame.scatterCounter < 1) return 1;
	return stateGame.scatterCounter as 1 | 2 | 3 | 4 | 5;
};

/** Grid multiplier at a board (padded) position, 0 when cold or outside the feature. */
const gridMultiplierAt = ({ reel, row }: { reel: number; row: number }) =>
	stateGame.gridMultipliers[reel]?.[row] ?? 0;

const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	boardLayout,
	boardRaw,
	scatterLandIndex,
	gridMultiplierAt,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
