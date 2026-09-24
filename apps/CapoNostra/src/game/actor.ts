import _ from 'lodash';

import { stateBet } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet, stopWinLineReplay } from './utils';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { eventEmitter } from './eventEmitter';
import config from './config';

const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (betToResume) => convertTorResumableBet(betToResume),
	onResumeGameInactive: (betToResume) => {
		const lastRevealEvent = _.findLast(
			betToResume.state,
			(bookEvent) => bookEvent?.type === 'reveal',
		);

		if (lastRevealEvent) stateGameDerived.enhancedBoard.settle(lastRevealEvent.board);
	},
	onNewGameStart: async () => {
		// FIRST, before anything else and before the early returns below: the idle
		// win-line replay is showing last round's lines on a loop, and the reels
		// are about to move. playBet stops it too, but playBet does not run until
		// the RGS answers — so a pass landing inside the press-to-reply window drew
		// win lines, and lit symbols, over a board that was already spinning.
		// Reported as "lines appearing from nowhere before the reels stop".
		stopWinLineReplay();
		// Same argument as the line replay above, one layer down: `winningCells`
		// dims every cell that is NOT paying, and it is cleared by the volley that
		// set it. A volley that never completes — the board torn down by a feature
		// ending underneath it, a round interrupted — therefore leaves the board
		// permanently half-dark, which is exactly what was reported after a free
		// game ended. Belt and braces with the watchdog in Board.svelte: this
		// guarantees a fresh round starts with every symbol lit whatever happened
		// in the last one.
		stateGame.winningCells = [];
		stateBet.winBookEventAmount = 0;
		// superspin sticky coins live for exactly one bought round
		if (stateGame.stickyPrizes.length > 0) {
			stateGame.stickyPrizes = [];
			eventEmitter.broadcast({ type: 'stickyPrizesClear' });
		}
		// sticky expanded wilds stay on screen through the free-game outro and
		// the idle board (they must keep hiding the W stacks underneath) — the
		// next spin is what sweeps them away
		if (stateGame.gameType === 'basegame') {
			eventEmitter.broadcast({ type: 'expandingWildsClear' });

			// Neon Frames belong to the round that landed them, and the moment the
			// player asks for another round they are last round's furniture.
			//
			// They were already cleared, but in the `reveal` handler — which does
			// not run until the book has come back from the RGS. Between pressing
			// spin and that reply there is the pre-spin recoil plus a network
			// round-trip, and for all of it the previous round's gold sat on a
			// board that had visibly started moving. Turbo made it worse rather
			// than better: the recoil shortens, the network does not, so the frames
			// hung over a larger share of the spin.
			//
			// This is the press itself — before the `isSpaceHold` and turbo-autobet
			// early returns below, so it happens on every spin including the ones
			// that skip the pre-spin entirely. `reveal` still clears them, which is
			// now a no-op on the base game and still does the real work when a
			// round is resumed mid-flight.
			//
			// Free-game frames are sticky by design and are not touched here; the
			// guard above is the same one expandingWildsClear uses, and gameType is
			// back to 'basegame' by this point in a round that ended in free spins
			// (freeSpinEnd sets it, and clears the frames itself).
			if (stateGame.frames.length > 0) {
				stateGame.frames = [];
				eventEmitter.broadcast({ type: 'framesClear' });
			}
		}
		if (stateBet.isSpaceHold) return;

		const skipPreSpinInTurboAutoBet =
			stateBet.isTurbo && stateXstateDerived.isAutoBetting() && stateGame.gameType !== 'freegame';
		if (skipPreSpinInTurboAutoBet) return;

		const forceNormalPreSpin = stateBet.isTurbo && stateGame.gameType === 'freegame';
		await stateGameDerived.enhancedBoard.preSpin({
			paddingBoard: config.paddingReels[stateGame.gameType],
			isTurboBeforeAllOverride: forceNormalPreSpin ? false : undefined,
		});
	},
	onNewGameError: () => stateGameDerived.enhancedBoard.settle(),
	onPlayGame: async (bet) => {
		await playBet(bet);
	},
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
