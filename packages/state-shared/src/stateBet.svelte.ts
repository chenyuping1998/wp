import type { BaseBet } from 'utils-bet';
import { stateMeta } from './stateMeta.svelte';
import { stateConfig } from './stateConfig.svelte';

export type Currency = string;
export type BetToResume = BaseBet | null;
export type BetModeKey = string;

export const stateBet = $state({
	currency: 'USD' as Currency,
	balanceAmount: 0,
	betAmount: 1,
	wageredBetAmount: 1,
	betToResume: null as BetToResume,
	activeBetModeKey: 'BASE' as BetModeKey,
	winBookEventAmount: 0,
	autoSpinsLoss: 0,
	autoSpinsCounter: 0,
	autoSpinsLossLimitAmount: Infinity,
	autoSpinsSingleWinLimitAmount: Infinity,
	isSpaceHold: false,
	isTurbo: false,
});

const correctBetAmount = (value: number) => {
	if (value <= 0) return 0;
	const costMultiplier = betCostMultiplier();
	if (costMultiplier === 0) return 0;

	// The server's own limits come first: a stake outside minBet/maxBet is one it
	// would reject. Both are 0 until authenticate answers, and there is nothing
	// to clamp against until then.
	let corrected = value;
	if (stateConfig.maxBet > 0) corrected = Math.min(corrected, stateConfig.maxBet);
	if (stateConfig.minBet > 0) corrected = Math.max(corrected, stateConfig.minBet);

	// SNAP to a stake the server offered, rather than accepting whatever came in.
	//
	// betAmountOptions is the ladder from the authenticate response. Anything not
	// on it is a value the server never offered, and the game must not present it
	// as selectable — which is what certification asked for: "the bet level should
	// not be allowed to be set to a value outside of those provided in the
	// authenticate response".
	//
	// Empty until authenticate answers, and there is no correct fallback for
	// somebody else's stake ladder, so an unanswered config passes the value
	// through under the min/max bounds above and nothing else.
	const options = stateConfig.betAmountOptions;
	if (options.length > 0) {
		corrected = options.reduce((best, option) =>
			Math.abs(option - corrected) < Math.abs(best - corrected) ? option : best,
		);
	}

	// NOT clamped to the balance.
	//
	// It used to end `Math.min(corrected, affordable)`, so choosing a stake above
	// the balance silently set it to the balance instead — a value that is almost
	// never on the ladder, and a selection the player did not make. Certification
	// called this out directly.
	//
	// Being unable to afford the stake is a separate thing from the stake being
	// invalid: the player picks a level, and if the balance will not cover it the
	// game says so when they try to play (ButtonBet). Silently rewriting their
	// choice answers a question nobody asked.
	return corrected;
};

const setBetAmount = (value: number) => {
	stateBet.betAmount = correctBetAmount(value);
};

const updateBetAmount = (update: (value: number) => number) => {
	stateBet.betAmount = correctBetAmount(update(stateBet.betAmount));
};

let isTurboLocked = false;

const updateIsTurbo = (value: boolean, options: { persistent: boolean }) => {
	const { persistent } = options;

	if (!persistent && isTurboLocked) return;
	if (persistent) isTurboLocked = value;

	stateBet.isTurbo = value;
};

const activeBetMode = () => stateMeta.betModeMeta?.[stateBet.activeBetModeKey.toUpperCase()]
	?? stateMeta.betModeMeta?.[stateBet.activeBetModeKey.toLowerCase()]
	?? null;
const isContinuousBet = () => stateBet.autoSpinsCounter > 1 || stateBet.isSpaceHold;
const timeScale = () => (stateBet.isTurbo ? 2 : 1);
const betCostMultiplier = () =>
	stateBetDerived.activeBetMode().type === 'activate'
		? stateBetDerived.activeBetMode().costMultiplier
		: 1;
const betCost = () => stateBet.betAmount * betCostMultiplier();
const isBetCostAvailable = () => betCost() > 0 && betCost() <= stateBet.balanceAmount;
const hasAutoBetCounter = () => stateBet.autoSpinsCounter !== 0;

export const stateBetDerived = {
	setBetAmount,
	updateBetAmount,
	updateIsTurbo,
	activeBetMode,
	isContinuousBet,
	timeScale,
	betCost,
	isBetCostAvailable,
	hasAutoBetCounter,
};
