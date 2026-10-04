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

	// Affordability last, so a player short of the minimum is held to what they
	// actually have rather than to a stake they cannot place.
	//
	// Snapped DOWN to a level the server offers, never to the balance itself.
	// `Math.min(corrected, affordable)` returned the raw balance whenever the
	// balance was the smaller number, so a player holding 1,120 GC who pressed
	// Max Bet got a stake of exactly 1,120 GC — a level `betLevels` never
	// contained. Certification reported it as a bet level not provided by the RGS.
	//
	// Every selectable stake has to be one of the server's, so affordability may
	// only ever pick a lower rung of the server's own ladder. If the player cannot
	// afford even the lowest rung, the lowest rung is still what is shown: the
	// insufficient-balance path then refuses the spin, which is the correct
	// outcome, whereas inventing a stake they can afford is not ours to do.
	const affordable = stateBet.balanceAmount / costMultiplier;
	const ceiling = Math.min(corrected, affordable);

	const levels = stateConfig.betAmountOptions;
	if (!levels.length) {
		// No discrete ladder — the game steps by stepBet, and there is no rung to
		// snap to. Clamping to the ceiling is all that can be done here.
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
const betCostMultiplier = () => stateBetDerived.activeBetMode()?.costMultiplier ?? 1;
const betCost = () => stateBet.betAmount * betCostMultiplier();
const isBetCostAvailable = () =>
	Number.isFinite(betCost()) && betCost() > 0 && betCost() <= stateBet.balanceAmount;
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
