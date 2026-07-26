import _ from 'lodash';
import type { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import { uiTheme } from 'components-ui-pixi';

import type { GameType, RawSymbol, SymbolState } from './types';
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

const onSymbolLand = ({ rawSymbol, reelIndex }: { rawSymbol: RawSymbol; reelIndex?: number }) => {
	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}

	if (rawSymbol.name === 'W') {
		// Sticky expanded-wild reels are full of W symbols on every reveal —
		// suppress their landing plucks so only fresh Wilds are heard.
		if (reelIndex !== undefined && stateGame.stickyWildReels.includes(reelIndex)) return;
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: 'sfx_multiplier_landing',
		});
	}
};

// Listed rather than built with a template literal: `sfx_reel_stop_${n}` widens
// to plain string, losing the SoundEffectName check, and would silently produce
// a name that does not exist if the reel count ever changed. The index fallback
// below covers that case too.
const REEL_STOP_SOUNDS = [
	'sfx_reel_stop_1',
	'sfx_reel_stop_2',
	'sfx_reel_stop_3',
	'sfx_reel_stop_4',
	'sfx_reel_stop_5',
] as const;

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createReelForSpinning({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			// A reel locked by a sticky expanded wild is a solid wall of Wild that
			// does not really "land" — it was already there. Firing the stop click
			// and the housing knock on it made the lock sound like a fresh drop every
			// spin, which reads wrong. Stay silent on those reels, same as the W
			// landing pluck already does (onSymbolLand). A reel that is only NOW being
			// taken over is not yet in stickyWildReels, so its genuine landing still
			// sounds — the takeover's own impact follows.
			if (stateGame.stickyWildReels.includes(reelIndex)) return;

			// Each reel plays its own stop, pitched a step higher than the last
			// (see SPRITE_TO_CN in Sound.svelte). This used to be hardcoded to _1,
			// so all five reels landed on one identical click and _2.._5 were dead.
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: REEL_STOP_SOUNDS[reelIndex] ?? 'sfx_reel_stop_1',
				forcePlay: !stateBet.isTurbo,
			});
			// The housing takes the hit too — a much lighter version of the win
			// recoil, so a symbol landing reads as weight arriving in the frame
			// rather than a sprite appearing. Skipped in turbo, where five recoils
			// inside half a second would just be noise.
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

export type MultiplierSymbol = {
	initX: number;
	initY: number;
	symbolX: Tween<number>;
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
};

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	multiplierBoard: [] as (MultiplierSymbol | undefined)[][],
	scatterCounter: 0,
	// reels currently locked by sticky expanded wilds (free game only)
	stickyWildReels: [] as number[],
	// superspin: coins stuck to the board, evaluated at the end of the round
	// (row includes the padding offset, prize is in book cents)
	stickyPrizes: [] as { reel: number; row: number; prize: number }[],
});

// The reel housing fills 94% of the box height (BOARD_SIZES is 590 tall and
// BoardFrame draws it at FRAME_SCALE 1.28 → 755 of 800), so a strip along the
// bottom cannot simply be laid over it. Nor can the board just be pushed up: the
// game box maps exactly onto the canvas, so anything past the top edge is
// clipped rather than spilling into the background. It is scaled down instead,
// and lifted by half of what the strip took so it stays centred in what is left.
//
// Measured rather than guessed: at 0.96 the housing landed within 2px of both
// the canvas top and the strip — visually fine but no margin at all, and a
// different viewport aspect would have pushed it under. Now that the strip is a
// framed panel rather than a flat band it is taller, and the board gives up a
// little more again. Raising this is what to try first if the board ever needs
// to be bigger; the housing bottom against uiTheme.barHeight is the limit.
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
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
