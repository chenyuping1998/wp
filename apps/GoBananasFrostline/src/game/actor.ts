import _ from 'lodash';

import { stateBet } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
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
		}
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
