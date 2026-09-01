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
		stateBet.winBookEventAmount = 0;
		// Cancel any win-symbol animation still resolving from the previous round.
		// Those promises run for up to 2.6s and end by writing symbolState, so
		// without this a press mid-presentation stamps a post-win frame onto the
		// board seconds into the NEXT spin.
		// Order matters: kill the idle replay loop BEFORE hiding what it drew.
		// Hiding first only clears the current pass; the loop would wake up mid
		// pre-spin and draw the next one.
		stopWinLineReplay();
		eventEmitter.broadcast({ type: 'boardWinAnimCancel' });
		// superspin sticky coins live for exactly one bought round
		if (stateGame.stickyPrizes.length > 0) {
			stateGame.stickyPrizes = [];
			eventEmitter.broadcast({ type: 'stickyPrizesClear' });
		}
		// NOT cleared here.
		//
		// Clearing at round start meant the player watched a split reel snap back
		// to normal and THEN begin spinning — the cut visibly undone before
		// anything moved. The clear now happens inside the reveal handler, at the
		// moment the reels are released, so a reel that is no longer split loses
		// its cut under the motion instead of in front of it.
		if (stateBet.isSpaceHold) return;

		// Superspin is excluded alongside freegame. Skipping the pre-spin dropped the
		// wind-up entirely, so a turbo autoplay hold-and-spin went from board to
		// result with nothing in between — the opposite of a round whose whole
		// content is watching cells resolve one at a time.
		const keepsFullPreSpin =
			stateGame.gameType === 'freegame' || stateGame.gameType === 'superspin';
		const skipPreSpinInTurboAutoBet =
			stateBet.isTurbo && stateXstateDerived.isAutoBetting() && !keepsFullPreSpin;
		if (skipPreSpinInTurboAutoBet) return;

		const forceNormalPreSpin = stateBet.isTurbo && keepsFullPreSpin;
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
