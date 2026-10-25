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
import type { RawSymbol } from './types';

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
		// Safety net for Medusa's running total. freeSpinEnd already clears and hides
		// it, but an interrupted round — a reconnect, a presentation that threw
		// part-way — could leave the base game showing the last feature's total,
		// claiming a multiplier that does not exist outside the feature.
		if (stateGame.gameType === 'basegame' && stateGame.medusaTotal !== 0) {
			stateGame.medusaTotal = 0;
			eventEmitter.broadcast({ type: 'medusaTotalHide' });
		}
		stateGame.tumbleWin = 0;
		stateGame.tumbleChain = 0;
		if (stateBet.isSpaceHold) return;

		const skipPreSpinInTurboAutoBet =
			stateBet.isTurbo && stateXstateDerived.isAutoBetting() && stateGame.gameType !== 'freegame';
		if (skipPreSpinInTurboAutoBet) return;

		const forceNormalPreSpin = stateBet.isTurbo && stateGame.gameType === 'freegame';
		await stateGameDerived.enhancedBoard.preSpin({
			paddingBoard: config.paddingReels[stateGame.gameType] as RawSymbol[][],
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
