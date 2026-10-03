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
	SPIN_OPTIONS_TURBO_FREEGAME,
	SPIN_OPTIONS_SUPERSPIN,
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

// A timbre sequence rather than a pitch ladder: each reel has its own detent,
// and all five use the same fixed low body. The event fires on the reel's actual
// stopping callback, so the audio onset is the visible stop.
const REEL_STOP_SOUNDS = [
	'sfx_reel_stop_1', 'sfx_reel_stop_2', 'sfx_reel_stop_3', 'sfx_reel_stop_4', 'sfx_reel_stop_5',
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

			eventEmitter.broadcast({
				type: 'soundOnce',
				name: REEL_STOP_SOUNDS[reelIndex],
				// Superspin forces the click through in turbo as well: its stops are
				// the event, and a dropped reel-stop there is a missing beat rather
				// than one less click in a rapid sequence.
				// The free game joins superspin here: its reels now land one at a
				// time under turbo, and a stop you can see but not hear is worse
				// than either.
				forcePlay:
					!stateBet.isTurbo ||
					stateGame.gameType === 'superspin' ||
					stateGame.gameType === 'freegame',
			});
			// The housing takes the hit too — a much lighter version of the win
			// recoil, so a symbol landing reads as weight arriving in the frame
			// rather than a sprite appearing. Skipped in turbo, where five recoils
			// inside half a second would just be noise.
			// Same reasoning as the reel-stop click above — superspin keeps the weight
			// in its stops no matter what turbo is set to.
			if (
				!stateBet.isTurbo ||
				stateGame.gameType === 'superspin' ||
				stateGame.gameType === 'freegame'
			) {
				eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.12 });
			}
		},
		onSymbolLand: ({ rawSymbol }) => onSymbolLand({ rawSymbol, reelIndex }),
	});

	reel.reelState.spinOptions = () => {
		// Checked BEFORE spinType, which is the whole point: turbo sets spinType to
		// 'fast' and every other mode obeys it. The hold-and-spin round does not —
		// it is a reveal the player is meant to read cell by cell, and at turbo
		// speed the three respins were over before that was possible.
		if (stateGame.gameType === 'superspin') return SPIN_OPTIONS_SUPERSPIN;
		// Also before spinType, and for the same reason. The free game asks for a
		// NORMAL spin even in turbo (see the reveal handler), so keying its profile
		// off spinType would have handed it the base-game timings — turbo would
		// have had no effect in the feature at all rather than too much.
		if (stateGame.gameType === 'freegame' && stateBet.isTurbo) return SPIN_OPTIONS_TURBO_FREEGAME;
		if (reel.reelState.spinType !== 'fast') return SPIN_OPTIONS_DEFAULT;
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
	// Per-reel anticipation magnitude for the spin now on the reels, after the
	// gate in bookEventHandlerMap.
	//
	// The reel itself only carries a boolean (reelState.anticipating) because
	// utils-slots only ever tests `> 0` (createEnhanceBoardSpin.ts), so the
	// 1-vs-2 distinction — two scatters on the board vs three, i.e. "could still
	// trigger" vs "one symbol away" — is discarded before it reaches a component.
	// Stashing it here is what lets Anticipation tier the tease without touching
	// the shared package.
	anticipation: [] as number[],
	// reels currently locked by sticky expanded wilds (free game only)
	stickyWildReels: [] as number[],
	// superspin: coins stuck to the board, evaluated at the end of the round
	// (row includes the padding offset, prize is in book cents)
	stickyPrizes: [] as { reel: number; row: number; prize: number }[],
	// Where the mascot's hand is at the moment he lets go of a grenade, in
	// MAIN-LAYOUT coordinates — or null when he is not on screen at all, which is
	// every layout too narrow to stand him beside the board (see Mascot.svelte).
	//
	// Published by Mascot and read by TransitionAnimation. It goes through state
	// rather than an event because the transition needs it at the instant it
	// starts, not whenever the mascot last happened to broadcast.
	mascotThrowOrigin: null as { x: number; y: number } | null,
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
