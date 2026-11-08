import { base } from '$app/paths';
const cardArt = (name: string) => `${base}/assets/sprites/medusaUi/card_${name}.png`;
import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Medusa Gaze ships five math modes (SPEC 3-7):
//   BASE     1×     base play
//   ANTE     1.25×  Gaze Boost — an 'activate' mode: stays on until switched off;
//                   free spins about twice as often
//   PETRIFY  8×     Petrify Spin — one spin with a guaranteed big Petrify Gaze
//   BONUS    100×   free spins from Serpent Ladder level 1
//   SUPER    300×   super free spins from level 2, Medusa throws more often
// The keys are the math mode names uppercased (stateBet looks them up with
// activeBetModeKey.toUpperCase()). The shared library's template default
// (ANTE / SUPER ANTE / …) has no backing math here, so it is replaced outright.
//
// Social play cannot use betting terminology anywhere the player can read it —
// that includes the feature-buy cards, their confirmation dialog and the ticker.
// `pick` chooses at access time rather than at module load: social() reads the
// page URL, which is not available while this module is being evaluated.
//
// The text fields below are getters for the same reason; they are still plain
// string properties as far as BetModeData is concerned. Every figure is read
// from `config` (synced from the maths), never typed in: the dialog is the last
// thing a player reads before spending.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

const modes = config.betModes;
const rtp = `${(config.rtp * 100).toFixed(2)}%`;
const maxWin = modes.base.max_win.toLocaleString();
const fsSpins = config.freeSpins.spins;
const ladder = config.ladder;
const petrify = config.petrify;
const superFloor = (ladder.floors as Record<string, number>)[String(ladder.superStartLevel)];
const x = (n: number) => `${n}×`;

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

const idle = () => pick('PLACE YOUR BET', 'READY TO PLAY');

export const MEDUSA_GAZE_BET_MODE_META: Record<string, BetModeData> = {
	BASE: {
		mode: 'BASE',
		costMultiplier: modes.base.cost,
		type: 'default',
		parent: '',
		children: '',
		maxWin: modes.base.max_win,
		assets: { ...emptyAssets },
		text: {
			title: 'BASE',
			dialog: '',
			button: '',
			betAmountLabel: '',
			get tickerIdle() {
				return idle();
			},
			tickerSpin: 'GOOD LUCK',
			bannerText: '',
		},
	},

	ANTE: {
		mode: 'ANTE',
		costMultiplier: modes.ante.cost,
		type: 'activate',
		parent: '',
		children: '',
		maxWin: modes.ante.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('ante') },
		text: {
			title: 'GAZE BOOST',
			get dialog() {
				return pick(
					`Each spin costs ${x(modes.ante.cost)} your bet, at the same ${rtp} RTP as base play. FREE SPINS trigger about twice as often. Everything else plays exactly like base play. GAZE BOOST stays on until you switch it off. Maximum win: ${maxWin}× your bet.`,
					`Each spin is played at ${x(modes.ante.cost)} your amount, at the same ${rtp} RTP as normal play. FREE SPINS trigger about twice as often. Everything else plays exactly like normal play. GAZE BOOST stays on until you switch it off. Maximum win: ${maxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${x(modes.ante.cost)} BET → FREE SPINS about twice as often`,
					`${x(modes.ante.cost)} AMOUNT → FREE SPINS about twice as often`,
				);
			},
			button: 'ACTIVATE',
			betAmountLabel: 'GAZE BOOST',
			tickerIdle: 'GAZE BOOST IS ACTIVE',
			tickerSpin: 'GOOD LUCK',
			bannerText: '',
		},
	},

	PETRIFY: {
		mode: 'PETRIFY',
		costMultiplier: modes.petrify.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: modes.petrify.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('petrify') },
		text: {
			title: 'PETRIFY SPIN',
			get dialog() {
				return pick(
					`One spin for ${x(modes.petrify.cost)} your bet, at the same ${rtp} RTP as base play. Medusa's gaze is guaranteed: ${petrify.buyMin} to ${petrify.buyMax} symbols turn to stone. Stones never pay and fall with the tumbles; when the tumbling stops, every stone turns into the same symbol and the tumbling starts again. FREE SPINS can still trigger. Maximum win: ${maxWin}× your bet.`,
					`One spin for ${x(modes.petrify.cost)} your amount, at the same ${rtp} RTP as normal play. Medusa's gaze is guaranteed: ${petrify.buyMin} to ${petrify.buyMax} symbols turn to stone. Stones never win and fall with the tumbles; when the tumbling stops, every stone turns into the same symbol and the tumbling starts again. FREE SPINS can still trigger. Maximum win: ${maxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${x(modes.petrify.cost)} BET → 1 spin with ${petrify.buyMin}–${petrify.buyMax} stones`,
					`${x(modes.petrify.cost)} AMOUNT → 1 spin with ${petrify.buyMin}–${petrify.buyMax} stones`,
				);
			},
			get button() {
				return pick(`BUY ${x(modes.petrify.cost)}`, `PLAY ${x(modes.petrify.cost)}`);
			},
			get tickerIdle() {
				return idle();
			},
			tickerSpin: 'PETRIFY SPIN ACTIVATED',
			bannerText: '',
		},
	},

	BONUS: {
		mode: 'BONUS',
		costMultiplier: modes.bonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: modes.bonus.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('bonus') },
		text: {
			get title() {
				return pick('BUY FREE SPINS', 'FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into FREE SPINS for ${x(modes.bonus.cost)} your bet, at the same ${rtp} RTP as base play. ${fsSpins} free spins, starting on Serpent Ladder level 1. Every multiplier Medusa throws on a spin with a win is added to a running total that never resets during the feature, and that total multiplies the spin. Each multiplier that counts grows a snake; at ${ladder.thresholds.join(' / ')} snakes Medusa climbs a level for +${ladder.spins} spins and bigger minimum multipliers. Maximum win: ${maxWin}× your bet.`,
					`Enter FREE SPINS directly for ${x(modes.bonus.cost)} your amount, at the same ${rtp} RTP as normal play. ${fsSpins} free spins, starting on Serpent Ladder level 1. Every multiplier Medusa throws on a spin with a win is added to a running total that never resets during the feature, and that total multiplies the spin. Each multiplier that counts grows a snake; at ${ladder.thresholds.join(' / ')} snakes Medusa climbs a level for +${ladder.spins} spins and bigger minimum multipliers. Maximum win: ${maxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${x(modes.bonus.cost)} BET → ${fsSpins} FREE SPINS from level 1`,
					`${x(modes.bonus.cost)} AMOUNT → ${fsSpins} FREE SPINS from level 1`,
				);
			},
			get button() {
				return pick(`BUY ${x(modes.bonus.cost)}`, `PLAY ${x(modes.bonus.cost)}`);
			},
			get tickerIdle() {
				return idle();
			},
			get tickerSpin() {
				return pick('BONUS BUY ACTIVATED', 'BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},

	SUPER: {
		mode: 'SUPER',
		costMultiplier: modes.super.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: modes.super.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('super') },
		text: {
			get title() {
				return pick('BUY SUPER FREE SPINS', 'SUPER FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into SUPER FREE SPINS for ${x(modes.super.cost)} your bet, at the same ${rtp} RTP as base play. ${fsSpins} free spins, starting on Serpent Ladder level ${ladder.superStartLevel} with ${ladder.superStartSnakes} snakes already grown: Medusa's smallest multiplier is ${x(superFloor)} from the first spin, and she throws more often than in FREE SPINS. Everything else plays like FREE SPINS. Maximum win: ${maxWin}× your bet.`,
					`Enter SUPER FREE SPINS directly for ${x(modes.super.cost)} your amount, at the same ${rtp} RTP as normal play. ${fsSpins} free spins, starting on Serpent Ladder level ${ladder.superStartLevel} with ${ladder.superStartSnakes} snakes already grown: Medusa's smallest multiplier is ${x(superFloor)} from the first spin, and she throws more often than in FREE SPINS. Everything else plays like FREE SPINS. Maximum win: ${maxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${x(modes.super.cost)} BET → ${fsSpins} FREE SPINS from level ${ladder.superStartLevel}`,
					`${x(modes.super.cost)} AMOUNT → ${fsSpins} FREE SPINS from level ${ladder.superStartLevel}`,
				);
			},
			get button() {
				return pick(`BUY ${x(modes.super.cost)}`, `PLAY ${x(modes.super.cost)}`);
			},
			get tickerIdle() {
				return idle();
			},
			get tickerSpin() {
				return pick('SUPER BONUS ACTIVATED', 'SUPER BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},
};
