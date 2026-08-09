import { stateI18nDerived, stateUrlDerived } from 'state-shared';

// Social play forbids betting terminology. The pixi side already branched on
// stateUrlDerived.social() for the action button and the bonus label; this file
// did not, so every string it owns — the bet menu, the confirmation flow, the
// insufficient-funds error — still said "BET" in social mode.
const social = () => stateUrlDerived.social();

export const i18nDerived = {
	bet: () => (social() ? 'PLAY' : stateI18nDerived.translate('BET')),
	max: () => stateI18nDerived.translate('MAX'),
	betMenu: () => (social() ? 'PLAY MENU' : stateI18nDerived.translate('BET MENU')),
	selectYourBet: () => (social() ? 'SELECT YOUR AMOUNT' : stateI18nDerived.translate('SELECT YOUR BET')),
	confirm: () => stateI18nDerived.translate('CONFIRM'),
	masterVolume: () => stateI18nDerived.translate('MASTER VOLUME'),
	musicVolume: () => stateI18nDerived.translate('MUSIC VOLUME'),
	soundEffectVolume: () => stateI18nDerived.translate('SOUND EFFECT VOLUME'),
	autoSpins: () => stateI18nDerived.translate('AUTO SPINS'),
	numberOfRounds: () => stateI18nDerived.translate('NUMBER OF ROUNDS'),
	advanced: () => stateI18nDerived.translate('ADVANCED'),
	singleWinLimit: () => stateI18nDerived.translate('SINGLE WIN LIMIT'),
	lossLimit: () => stateI18nDerived.translate('LOSS LIMIT'),
	startAutoplay: () => stateI18nDerived.translate('START AUTOPLAY'),
	notification: () => stateI18nDerived.translate('NOTIFICATION'),
	autoSpinsStopInfo: () => stateI18nDerived.translate('AUTO PLAY HAS STOPPED DUE TO'),
	// "funds" is on Stake's restricted list for social play; their published
	// replacement is "balance".
	insufficientFunds: () =>
		social()
			? 'INSUFFICIENT BALANCE TO PLAY THIS ROUND. PLEASE TOP UP YOUR BALANCE OR LOWER THE AMOUNT.'
			: stateI18nDerived.translate(
					'INSUFFICIENT FUNDS TO PLACE THIS BET. PLEASE ADD FUNDS TO YOUR ACCOUNT OR LOWER THE BET LEVEL.',
				),
	lossLimitReached: () => stateI18nDerived.translate('LOSS LIMIT REACHED'),
	singleWinLimitReached: () => stateI18nDerived.translate('SINGLE WIN LIMIT REACHED'),
	settings: () => stateI18nDerived.translate('SETTINGS'),
};
