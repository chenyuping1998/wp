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
		// The heat grid belongs to one feature. It is deliberately NOT cleared at
		// freeSpinEnd — the plates stay glowing under the outro plaque, which is the
		// last look the player gets at what they built — so the next spin is what
		// sweeps them away.
		if (stateGame.gameType === 'basegame' && stateGame.gridMultipliers.length > 0) {
			stateGame.gridMultipliers = [];
			eventEmitter.broadcast({ type: 'gridMultipliersClear' });
		}
		stateGame.tumbleWin = 0;
		stateGame.tumbleChain = 0;
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
