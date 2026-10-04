import { fromPromise } from 'xstate';

import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet, stateBetDerived, stateUrlDerived, stateModal } from 'state-shared';
import { requestBet, requestEndRound } from 'rgs-requests';

import type { BaseBet } from './types';

const requireAffordablePlay = () => {
	if (stateBetDerived.isBetCostAvailable()) return;
	stateBet.isSpaceHold = false;
	stateBet.autoSpinsCounter = 0;
	stateModal.modal = { name: 'message', message: 'insufficientFunds' };
	throw new Error('Insufficient balance for selected play mode');
};

const handleRequestBet = async ({ onError }: { onError: () => void }) => {
	// Recheck after the pre-spin animation too: this is the last synchronous
	// decision before the wallet request is sent.
	requireAffordablePlay();
	try {
		const data = await requestBet({
			rgsUrl: stateUrlDerived.rgsUrl(),
			sessionID: stateUrlDerived.sessionID(),
			currency: stateBet.currency,
			mode: stateBet.activeBetModeKey,
			amount: stateBet.betAmount,
		});

		if (data?.error) {
			throw data;
		}

		if (data?.round?.state && data?.round?.state?.length > 0) {
			stateBet.wageredBetAmount = stateBet.betAmount;

			return data;
		} else {
			throw {
				error: 'Empty state in data.round',
				message: JSON.stringify({ data }),
			};
		}
	} catch (error) {
		onError();
		stateBet.autoSpinsCounter = 0;
		stateModal.modal = { name: 'error', error };
		console.error(error);
		throw error;
	}
};

const handleRequestEndRound = async () => {
	if(stateUrlDerived.replay()) return;

	try {
		const data = await requestEndRound({
			sessionID: stateUrlDerived.sessionID(),
			rgsUrl: stateUrlDerived.rgsUrl(),
		});

		if (data?.error) {
			throw data;
		}

		if (data?.balance?.amount !== undefined) {
			return data;
		} else {
			throw {
				error: 'Empty amount in data.balance',
				message: JSON.stringify({ data }),
			};
		}
	} catch (error) {
		console.error(error);
	}
};

const handleUpdateBalance = ({ balanceAmountFromApi }: { balanceAmountFromApi: number }) => {
	stateBet.balanceAmount = balanceAmountFromApi / API_AMOUNT_MULTIPLIER;
};

type Options<TBet extends BaseBet> = {
	onResumeGameActive: (betToResume: TBet) => TBet;
	onResumeGameInactive: (betToResume: TBet) => void;
	onNewGameStart: () => Promise<void> | undefined;
	onNewGameError: () => any;
	onPlayGame: (bet: TBet) => Promise<void>;
	checkIsBonusGame: (bet: TBet) => boolean;
};

function createPrimaryMachines<TBet extends BaseBet>(options: Options<TBet>) {
	const {
		onResumeGameActive,
		onResumeGameInactive,
		onNewGameStart,
		onNewGameError,
		onPlayGame,
		checkIsBonusGame,
	} = options;

	let balanceAmountFromApiHolder: null | number = null;

	const BET_TYPE_METHODS_MAP = {
		noWin: {
			newGame: async () => undefined,
			endGame: async () => undefined,
		},
		singleRoundWin: {
			newGame: async () => {
				const endRoundData = await handleRequestEndRound();
				if (endRoundData?.balance) {
					balanceAmountFromApiHolder = endRoundData.balance.amount;
				}
			},
			endGame: async () => {
				if (balanceAmountFromApiHolder !== null) {
					handleUpdateBalance({ balanceAmountFromApi: balanceAmountFromApiHolder });
					balanceAmountFromApiHolder = null;
				}
			},
		},
		bonusWin: {
			newGame: async () => undefined,
			endGame: async () => {
				const data = await handleRequestEndRound();
				if (data?.balance) {
					handleUpdateBalance({ balanceAmountFromApi: data.balance.amount });
					balanceAmountFromApiHolder = null;
				}
			},
		},
	} as const;

	const getBetType: (args: { bet: TBet }) => keyof typeof BET_TYPE_METHODS_MAP = ({ bet }) => {
		const isBonusGame = checkIsBonusGame(bet);

		if (bet.active === true) {
			if (isBonusGame) return 'bonusWin';
		}

		if (bet.payoutMultiplier && bet.payoutMultiplier > 0) {
			if (isBonusGame) return 'bonusWin';
			return 'singleRoundWin';
		}

		return 'noWin';
	};

	// newGame
	const newGame = fromPromise(async () => {
		// Every entry path (spin button, held Space, autoplay and feature confirm)
		// converges here. Check immediately before the request, using the selected
		// mode's full multiplier, so an unaffordable round never reaches /wallet/play.
		requireAffordablePlay();
		await onNewGameStart();

		const data = await handleRequestBet({ onError: onNewGameError });

		if (data) {
			if (data.balance) {
				handleUpdateBalance({ balanceAmountFromApi: data.balance.amount });
			}

			const bet = data.round as TBet;
			const betType = getBetType({ bet });
			await BET_TYPE_METHODS_MAP[betType].newGame();

			return { bet };
		}

		return { bet: null };
	});

	// resumeGame
	const resumeGame = fromPromise(async () => {
		const betToResume = stateBet.betToResume as TBet;

		if (betToResume && betToResume.active) {
			// Optional chaining doesn't work here with build-node. 🤷‍♂️
			stateBet.betToResume = null;

			//End Round resumed active bet
			const bet = betToResume as TBet;
			const betType = getBetType({ bet });
			await BET_TYPE_METHODS_MAP[betType].newGame();

			return { bet: onResumeGameActive(betToResume), rawBet: betToResume };
		}

		if (betToResume && betToResume.state && betToResume.state.length > 0) {
			onResumeGameInactive(betToResume);
		}

		throw new Error('inactive Bet');
	});

	// playGame
	const playGame = fromPromise<void, { bet: TBet | null }>(async ({ input }) => {
		if (input.bet) await onPlayGame(input.bet); // context.bet is hydrated from newGame
	});

	// endGame
	const endGame = fromPromise<void, { bet: TBet | null; rawBet: TBet | null }>(
		async ({ input }) => {
			const targetBet = input.rawBet || input.bet;
			if (targetBet) {
				const betType = getBetType({ bet: targetBet });
				await BET_TYPE_METHODS_MAP[betType].endGame();
			}
			// A BOUGHT round is one round. Bought through the feature menu's confirm,
			// the mode was set and `bet` broadcast, and nothing set it back — the spin
			// button and autoplay reset a buy mode, the confirm path never did. So
			// after the round the bar's Bet readout (betAmount x the active mode's
			// cost) kept showing the purchase: 200 where the stake was 2 (Stake
			// review 2026-10-04, Go Bananas Boat). Reset here, at the END of the
			// round, not when the request is sent: games read the active mode during
			// the round they bought (Boat's hold-and-spin scenery). Activate modes
			// stay on — they are meant to. Replays keep theirs: the URL sets it and a
			// replay can be run again.
			if (!stateUrlDerived.replay() && stateBetDerived.activeBetMode()?.type === 'buy') {
				stateBet.activeBetModeKey = 'BASE';
			}
		},
	);

	return {
		newGame,
		playGame,
		endGame,
		resumeGame,
	};
}

export { createPrimaryMachines };
