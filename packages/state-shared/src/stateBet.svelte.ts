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

	// No affordability clamp. Stake review, 2026-10-04: "The available bet
	// levels should not be restricted or hardcoded based on the player's current
	// balance ... the balance check should only occur when they attempt to place
	// the bet." Every server level stays selectable; the bet button, autoplay and
	// buy-bonus paths refuse a stake the player cannot cover (isBetCostAvailable)
	// and explain why.
	//
	// Still snapped DOWN to a level the server offers — a stake that is not in
	// `betLevels` is one certification reports as not provided by the RGS.
	const ceiling = corrected;

	const levels = stateConfig.betAmountOptions;
	if (!levels.length) {
		// No discrete ladder — the game steps by stepBet, and there is no rung to
		// snap to. Clamping to the server's limits is all that can be done here.
		return ceiling;
	}

	let snapped = -Infinity;
	for (const level of levels) {
		if (level <= ceiling && level > snapped) snapped = level;
	}
	return snapped > -Infinity ? snapped : Math.min(...levels);
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
