import { fromPromise } from 'xstate';

import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet, stateUrlDerived, stateModal } from 'state-shared';
import { requestBalance, requestBet, requestEndRound } from 'rgs-requests';

import type { BaseBet } from './types';

const handleRequestBet = async ({ onError }: { onError: () => void }) => {
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
		stateBet.isSpaceHold = false;
		// A refusal the player can act on gets the player-facing notice, not the
		// raw error box. The client checks the balance before every round, so
		// ERR_IPB only arrives when the balance changed outside this game — refresh
		// it so the bar shows what the server holds.
		const code = rgsErrorCode(error);
		if (code === 'ERR_IPB') {
			await refreshBalance();
			stateModal.modal = { name: 'message', message: 'insufficientFunds' };
		} else if (code === 'ERR_GLE') {
			stateModal.modal = { name: 'message', message: 'lossLimitReached' };
		} else {
			stateModal.modal = { name: 'error', error };
		}
		console.error(error);
		throw error;
	}
};

// Stake answers `{ error: 'ERR_IPB', message }`; tolerate `{ error: { code } }`
// and `{ status: { statusCode } }` too.
const rgsErrorCode = (error: unknown): string | undefined => {
	const e = error as {
		error?: string | { code?: string; statusCode?: string };
		code?: string;
		status?: { statusCode?: string };
	} | null;
	if (!e || typeof e !== 'object') return undefined;
	if (typeof e.error === 'string') return e.error;
	if (e.error && typeof e.error === 'object') return e.error.code ?? e.error.statusCode;
	return e.code ?? e.status?.statusCode;
};

const refreshBalance = async () => {
	try {
		const data = await requestBalance({
			rgsUrl: stateUrlDerived.rgsUrl(),
			sessionID: stateUrlDerived.sessionID(),
		});
		if (data?.balance?.amount !== undefined) {
			stateBet.balanceAmount = data.balance.amount / API_AMOUNT_MULTIPLIER;
		}
	} catch (error) {
		console.error('balance refresh failed', error);
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

	const BET_TYPE_METHODS_MAP = {
		noWin: {
			newGame: async () => undefined,
			endGame: async () => undefined,
		},
		// A winning base round is closed when its presentation ends, the same as
		// a bonus round. It used to be closed the instant the play response
		// arrived, before a single reel moved — so a player who reloaded mid-win
		// came back to no active round, and the stake fell back to
		// defaultBetLevel. Stake review, 2026-10-04 (Deadwood Express): "Active
		// rounds restore the bet amount from the authenticate response ... not an
		// issue while the bonus is active ... but for a base spin it is." Keeping
		// the round open until the win has played out lets /authenticate hand it
		// back, stake and all. Zero-win rounds still send no end-round.
		singleRoundWin: {
			newGame: async () => undefined,
			endGame: async () => {
				const data = await handleRequestEndRound();
				if (data?.balance) {
					handleUpdateBalance({ balanceAmountFromApi: data.balance.amount });
				}
			},
		},
		bonusWin: {
			newGame: async () => undefined,
			endGame: async () => {
				const data = await handleRequestEndRound();
				if (data?.balance) {
					handleUpdateBalance({ balanceAmountFromApi: data.balance.amount });
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

			// The resumed round's stake is the one to show, whatever opened the
			// session — Authenticate sets it too, but a resumed round is already
			// committed money, so it is pinned again here as the round starts.
			const resumedAmount = Number(betToResume.amount) / API_AMOUNT_MULTIPLIER;
			if (resumedAmount > 0) {
				stateBet.betAmount = resumedAmount;
				stateBet.wageredBetAmount = resumedAmount;
			}

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
