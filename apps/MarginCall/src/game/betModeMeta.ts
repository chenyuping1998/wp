import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Margin Call ships two math modes: base play and the bought feature entry. The
// shared library ships a template default (ANTE / SUPER ANTE / ...) with no
// backing math here, so the shared meta is overridden with exactly what the math
// supports.
//
// EVERY FIGURE BELOW IS READ FROM `config`, never typed. These strings had the
// buy cost and the RTP written into them as literals, and when the maths moved
// to a 180x buy at 93% the card still read "200x BET" and "the same 96% RTP" -
// on the confirmation dialog, directly above the correct price. config.ts is
// generated from the maths build (design/sync_math_config.mjs), so deriving from
// it is the only way these cannot drift again.
//
// Social play cannot use betting terminology anywhere the player can read it -
// that includes the feature cards, their confirmation dialog and the ticker.
// `pick` chooses at access time rather than at module load: social() reads the
// page URL, which is not available while this module is being evaluated. The
// text fields below are getters for the same reason; they are still plain string
// properties as far as BetModeData is concerned.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

const BUY_COST = config.betModes.bonus.cost;
const MAX_WIN = config.betModes.bonus.max_win;
// The maths carries rtp per mode; both are the same number, and the copy claims
// they are, so read the one it is claiming parity WITH.
const RTP_PCT = `${(config.betModes.base.rtp * 100).toFixed(0)}%`;
const WAYS_FEATURE = (5 ** 5).toLocaleString('en-US');

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

export const MARGIN_CALL_BET_MODE_META: Record<string, BetModeData> = {
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
		assets: { ...emptyAssets },
		text: {
			get title() {
				return pick('BUY LIQUIDATION RUN', 'LIQUIDATION RUN');
			},
			get dialog() {
				return pick(
					`Buy direct entry into the LIQUIDATION RUN for ${BUY_COST}× your bet, at the same ${RTP_PCT} RTP as base play. The board opens two extra rows — 5×5, ${WAYS_FEATURE} ways — and every LEVERAGE symbol that lands adds to a running multiplier that applies to every win and never resets for the rest of the round. Maximum win: ${MAX_WIN.toLocaleString('en-US')}× your bet.`,
					`Enter the LIQUIDATION RUN directly for ${BUY_COST}× your amount, at the same ${RTP_PCT} RTP as normal play. The board opens two extra rows — 5×5, ${WAYS_FEATURE} ways — and every LEVERAGE symbol that lands adds to a running multiplier that applies to every result and never resets for the rest of the round. Maximum win: ${MAX_WIN.toLocaleString('en-US')}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${BUY_COST}× BET → ${WAYS_FEATURE} WAYS with a leverage multiplier that only climbs`,
					`${BUY_COST}× AMOUNT → ${WAYS_FEATURE} WAYS with a leverage multiplier that only climbs`,
				);
			},
			get button() {
				return pick(`BUY ${BUY_COST}×`, `PLAY ${BUY_COST}×`);
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			// the ticker is player-facing in both modes, so "BUY" has to go in social
			get tickerSpin() {
				return pick('BONUS BUY ACTIVATED', 'FEATURE ACTIVATED');
			},
			bannerText: '',
		},
	},
};
