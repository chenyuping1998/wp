import _ from 'lodash';

import { stateBet } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet, stopWinLineReplay, lastRevealBoard } from './utils';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { eventEmitter } from './eventEmitter';
import config from './config';

const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (betToResume) => convertTorResumableBet(betToResume),
	onResumeGameInactive: (betToResume) => {
		const board = lastRevealBoard(betToResume.state);
		if (board) stateGameDerived.enhancedBoard.settle(board);
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
		// The collection overlay is NOT cleared here: the reveal handler clears
		// it at the moment the reels are released, under the motion.
		if (stateBet.isSpaceHold) return;

		const keepsFullPreSpin = stateGame.gameType === 'freegame';
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
