import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';


import config from './config';

// Fang Frenzy ships six math modes: base play, the 50x hold and spin, a 100x
// free-spin buy, and three activations (type 'activate': on until switched off,
// charged at their multiple on every spin) — Scarab 5x, Scarab 10x, Moon Boost 1.5x. The keys here are the math mode names uppercased —
// stateBet looks them up with activeBetModeKey.toUpperCase(). The shared
// library ships a template default with no backing math here, so we override
// the shared meta with exactly what the math supports.
//
// Social play cannot use betting terminology anywhere the player can read it —
// that includes the feature cards, their confirmation dialog and the ticker.
// `pick` chooses at access time rather than at module load: social() reads the
// page URL, which is not available while this module is being evaluated.
//
// The text fields below are getters for the same reason; they are still plain
// string properties as far as BetModeData is concerned.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

// Repeated in every dialog; kept in one place so the figure cannot drift between
// cards the way it did in gen-2.
const MAX_WIN = '10,000×';
const RTP = `${(config.rtp * 100).toFixed(0)}%`;

// The three activations share one shape: on until switched off, charged at
// their multiple every spin. Costs come from the maths config.
type ActivationKey = 'scarab5' | 'scarab10' | 'sunboost';
const activation = (a: {
	mode: string;
	key: ActivationKey;
	title: string;
	normal: string;
	social: string;
	short: string;
}): BetModeData => {
	const m = (config.betModes as Record<string, { cost: number; max_win: number }>)[a.key];
	return {
		mode: a.mode,
		costMultiplier: m.cost,
		type: 'activate',
		parent: '',
		children: '',
		maxWin: m.max_win,
		assets: { ...emptyAssets },
		text: {
			title: a.title,
			get dialog() {
				return pick(a.normal, a.social);
			},
			get description() {
				return pick(`${m.cost}× BET → ${a.short}`, `${m.cost}× AMOUNT → ${a.short}`);
			},
			button: 'ACTIVATE',
			betAmountLabel: a.title,
			tickerIdle: `${a.title} IS ACTIVE`,
			tickerSpin: 'GOOD LUCK',
			bannerText: '',
		},
	};
};

export const GO_BANANAS_BET_MODE_META: Record<string, BetModeData> = {
	BASE: {
		mode: 'BASE',
		costMultiplier: config.betModes.base.cost,
		type: 'default',
		parent: '',
		children: '',
		maxWin: config.betModes.base.max_win,
		assets: { ...emptyAssets },
		text: {
			title: 'BASE',
			dialog: '',
			button: '',
			betAmountLabel: '',
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			tickerSpin: 'GOOD LUCK',
			bannerText: '',
		},
	},

	// The 50x hold and spin, carried over from GoBoomana. A different board:
	// coins, not lines.
	HOLDANDSPIN: {
		mode: 'HOLDANDSPIN',
		costMultiplier: config.betModes.holdandspin.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.holdandspin.max_win,
		assets: { ...emptyAssets },
		text: {
			title: 'HOLD AND SPIN',
			get dialog() {
				return pick(
					`A hold-and-spin round for 50× your bet. You start with 3 respins — every Coin that lands sticks to the board and resets the respins back to 3. When no respins remain, all stuck Coin values are added up and paid out. Maximum win: 1,000× your bet.`,
					`A hold-and-spin round for 50× your amount. You start with 3 respins — every Coin that lands sticks to the board and resets the respins back to 3. When no respins remain, all stuck Coin values are added up and awarded. Maximum win: 1,000× your amount.`,
				);
			},
			get description() {
				return pick(
					'50× BET → 3 respins, Coins stick and reset the count (max 1,000×)',
					'50× AMOUNT → 3 respins, Coins stick and reset the count (max 1,000×)',
				);
			},
			get button() {
				return pick('BUY 50×', 'PLAY 50×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			tickerSpin: 'HOLD AND SPIN ACTIVATED',
			bannerText: '',
		},
	},

	BONUS: {
		mode: 'BONUS',
		costMultiplier: config.betModes.bonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus.max_win,
		assets: { ...emptyAssets },
		text: {
			get title() {
				return pick('BUY FREE SPINS', 'FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into ${config.betModes.bonus.spins} FREE SPINS for 100× your bet, at the same ${RTP} RTP as base play. Every free spin that lands a line turns the Bat Wheel first: its result replaces the current multiplier, never goes down, applies to every line of that spin and stays until the feature ends. Maximum win: ${MAX_WIN} your bet.`,
					`Enter ${config.betModes.bonus.spins} FREE SPINS directly for 100× your amount, at the same ${RTP} RTP as normal play. Every free spin that lands a line turns the Bat Wheel first: its result replaces the current multiplier, never goes down, applies to every line of that spin and stays until the feature ends. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`100× BET → ${config.betModes.bonus.spins} FREE SPINS with the Bat Wheel`,
					`100× AMOUNT → ${config.betModes.bonus.spins} FREE SPINS with the Bat Wheel`,
				);
			},
			get button() {
				return pick('BUY 100×', 'PLAY 100×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			get tickerSpin() {
				return pick('BONUS BUY ACTIVATED', 'BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},

	SCARAB5: activation({
		mode: 'SCARAB5',
		key: 'scarab5',
		title: 'BAT SPIN',
		normal: `For 5× your bet per spin, the Bat Wheel turns on any base game spin that lands a line win, and its multiplier applies to every line of that spin. Free Spins and the Moon Wheel can still happen as usual. Stays active until switched off. Maximum win: ${MAX_WIN} your bet.`,
		social: `For 5× your amount per spin, the Bat Wheel turns on any base game spin that lands a line win, and its multiplier applies to every line of that spin. Free Spins and the Moon Wheel can still happen as usual. Stays active until switched off. Maximum win: ${MAX_WIN} your amount.`,
		short: 'Bat Wheel on every line win',
	}),
	SCARAB10: activation({
		mode: 'SCARAB10',
		key: 'scarab10',
		title: 'BAT SURE WIN',
		normal: `For 10× your bet per spin, every base game spin lands at least one line win and turns the Bat Wheel, whose multiplier applies to every line of that spin. Free Spins and the Moon Wheel can still happen as usual. Stays active until switched off. Maximum win: ${MAX_WIN} your bet.`,
		social: `For 10× your amount per spin, every base game spin lands at least one line win and turns the Bat Wheel, whose multiplier applies to every line of that spin. Free Spins and the Moon Wheel can still happen as usual. Stays active until switched off. Maximum win: ${MAX_WIN} your amount.`,
		short: 'A line win and the Bat Wheel every spin',
	}),
	SUNBOOST: activation({
		mode: 'SUNBOOST',
		key: 'sunboost',
		title: 'MOON BOOST',
		normal: `For 1.5× your bet per spin, base game rounds end on the Moon Wheel far more often — about once every 38 spins on average instead of about once every 257. Stays active until switched off. Maximum win: ${MAX_WIN} your bet.`,
		social: `For 1.5× your amount per spin, base game rounds end on the Moon Wheel far more often — about once every 38 spins on average instead of about once every 257. Stays active until switched off. Maximum win: ${MAX_WIN} your amount.`,
		short: 'The Moon Wheel far more often',
	}),
};
