import { stateBet, stateBetDerived } from 'state-shared';

import { uiTheme } from './theme.svelte';

/**
 * One press of the turbo control (the button and the T key).
 *
 * uiTheme.turboTiers is 1 for every game: on / off, exactly as before. A game
 * that sets 2 gets off -> turbo -> turbo 2 -> off, with the tier in
 * stateBet.turboLevel; isTurbo stays true through both tiers, so everything
 * that only asks "is turbo on" is unchanged.
 */
export const cycleTurbo = () => {
	if (uiTheme.turboTiers < 2) {
		stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
		return;
	}
	if (!stateBet.isTurbo) {
		stateBetDerived.updateIsTurbo(true, { persistent: true });
		stateBet.turboLevel = 1;
	} else if (stateBet.turboLevel === 1) {
		stateBet.turboLevel = 2;
	} else {
		stateBetDerived.updateIsTurbo(false, { persistent: true });
	}
};
