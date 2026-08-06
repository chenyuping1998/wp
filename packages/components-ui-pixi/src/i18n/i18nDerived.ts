import { stateI18nDerived, stateUrlDerived } from 'state-shared';

export const i18nDerived = {
	audio: () => stateI18nDerived.translate('AUDIO'),
	balance: () => stateI18nDerived.translate('BALANCE'),
	win: () => stateI18nDerived.translate('WIN'),
	// The action button. Social play cannot call it a bet.
	bet: () => stateUrlDerived.social() ? 'SPIN' : stateI18nDerived.translate('BET'),
	// The stake readout, which is a different thing from the button and needs its
	// own word: it used to reuse bet(), so in social play the amount panel was
	// labelled "SPIN" — the button's verb sitting over a number. "AMOUNT" says
	// what the figure is without using restricted terminology.
	betAmount: () => stateUrlDerived.social() ? 'AMOUNT' : stateI18nDerived.translate('BET'),
	stop: () => stateI18nDerived.translate('STOP'),
	buyBonus: () => stateUrlDerived.social() ? 'PLAY BONUS' : stateI18nDerived.translate('BUY BONUS'),
	disable: () => stateI18nDerived.translate('DISABLE'),
	freeSpins: () => stateI18nDerived.translate('FREE SPINS'),
	//
	decrease: () => stateI18nDerived.translate('-'),
	increase: () => stateI18nDerived.translate('+'),
	menu: () => stateI18nDerived.translate('MENU'),
	turbo: () => stateI18nDerived.translate('TURBO'),
	autoSpin: () => stateI18nDerived.translate('AUTO SPIN'),
	replay: () => stateI18nDerived.translate('REPLAY'),
	// "pay" is restricted in social play, same as "bet"
	payTable: () => (stateUrlDerived.social() ? 'PLAY TABLE' : stateI18nDerived.translate('PAYTABLE')),
	info: () => stateI18nDerived.translate('INFO'),
	settings: () => stateI18nDerived.translate('SETTINGS'),
	soundOn: () => stateI18nDerived.translate('SOUND ON'),
	soundOff: () => stateI18nDerived.translate('SOUND OFF'),
	menuExit: () => stateI18nDerived.translate('EXIT'),
};
