import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import { base } from '$app/paths';

import config from './config';

// Putt Monkey ships three math modes: base play and two free-spin buys. The
// keys here are the math mode names uppercased — stateBet looks them up with
// activeBetModeKey.toUpperCase(). The shared library ships a template default
// (ANTE / SUPER ANTE / …) with no backing math here, so we override the shared
// meta with exactly what the math supports.
//
// WHAT THE TWO BUYS DIFFER BY
//
// SUPERBONUS opens with four Golfers already counted. The first symbol
// replacement is active from its first spin. Collections stay at ×1.
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

// The buy modal's card art. A DOM <img> src, not a pixi asset key — the cards
// are HTML, not canvas.
const cardArt = (name: string) => `${base}/assets/sprites/sushiUi/card_${name}.png`;

// One name per buy mode, used by every surface that names it — the menu card,
// its confirmation, the rules table and tiers, and the replay card. Engine
// guideline 225 wants a mode called the same thing everywhere; these used to
// read DINNER RUSH on the menu and Free Spins on the rules and replay. "Rush"
// is also on Stake's restricted-title list, so it is gone from both.
export const MODE_NAMES = {
	BONUS: 'Birdie Round',
	SUPERBONUS: 'Hole in One',
} as const;

const MAX_WIN = '10,000×';
// from the synced math config, never typed: it was a literal '96%' and would
// have gone on saying so after the RTP moved
const RTP = `${(config.rtp * 100).toFixed(2)}%`;
const meter = config.banditMeter;
const firstRung = meter.thresholds[0];
const firstMult = meter.mults[1];

export const PUTT_MONKEY_BET_MODE_META: Record<string, BetModeData> = {
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

	BONUS: {
		mode: 'BONUS',
		costMultiplier: config.betModes.bonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('bonus') },
		text: {
			get title() {
				return MODE_NAMES.BONUS.toUpperCase();
			},
			get dialog() {
				return pick(
					`Buy direct entry into ${config.betModes.bonus.spins} FREE SPINS for ${config.betModes.bonus.cost}× your bet, at the same ${RTP} RTP as base play. Every Golfer that lands takes every Ball on the board, and at ${meter.thresholds.join(', ').replace(/, (\d+)$/, ' and $1')} Golfers ${meter.spinsAdded} spins are added and all 10, then J, then Q symbols become Balls on subsequent spins; collections remain ×1. Maximum win: ${MAX_WIN} your bet.`,
					`Enter ${config.betModes.bonus.spins} FREE SPINS directly for ${config.betModes.bonus.cost}× your amount, at the same ${RTP} RTP as normal play. Every Golfer that lands takes every Ball on the board, and at ${meter.thresholds.join(', ').replace(/, (\d+)$/, ' and $1')} Golfers ${meter.spinsAdded} spins are added and all 10, then J, then Q symbols become Balls on subsequent spins; collections remain ×1. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`${config.betModes.bonus.cost}× BET → ${config.betModes.bonus.spins} FREE SPINS, Golfer meter starts empty`,
					`${config.betModes.bonus.cost}× AMOUNT → ${config.betModes.bonus.spins} FREE SPINS, Golfer meter starts empty`,
				);
			},
			get button() {
				return pick(`BUY ${config.betModes.bonus.cost}×`, `PLAY ${config.betModes.bonus.cost}×`);
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

	SUPERBONUS: {
		mode: 'SUPERBONUS',
		costMultiplier: config.betModes.superbonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.superbonus.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('superbonus') },
		text: {
			get title() {
				return MODE_NAMES.SUPERBONUS.toUpperCase();
			},
			get dialog() {
				return pick(
					`Buy entry into ${config.betModes.superbonus.spins} FREE SPINS for ${config.betModes.superbonus.cost}× your bet, at the same ${RTP} RTP as base play. The Golfer meter opens at ${firstRung}, so all 10 symbols are already Balls from the first spin; collections remain ×1. Maximum win: ${MAX_WIN} your bet.`,
					`Enter ${config.betModes.superbonus.spins} FREE SPINS for ${config.betModes.superbonus.cost}× your amount, at the same ${RTP} RTP as normal play. The Golfer meter opens at ${firstRung}, so all 10 symbols are already Balls from the first spin; collections remain ×1. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`${config.betModes.superbonus.cost}× BET → ${config.betModes.superbonus.spins} FREE SPINS, all 10 symbols start as Balls`,
					`${config.betModes.superbonus.cost}× AMOUNT → ${config.betModes.superbonus.spins} FREE SPINS, all 10 symbols start as Balls`,
				);
			},
			get button() {
				return pick(`BUY ${config.betModes.superbonus.cost}×`, `PLAY ${config.betModes.superbonus.cost}×`);
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			get tickerSpin() {
				return pick('SUPER BONUS BUY ACTIVATED', 'SUPER BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},
};
