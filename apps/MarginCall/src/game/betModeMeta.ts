import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Margin Call ships two math modes: base play and the 200x feature entry. The
// shared library ships a template default (ANTE / SUPER ANTE / ...) with no
// backing math here, so the shared meta is overridden with exactly what the math
// supports.
//
// Social play cannot use betting terminology anywhere the player can read it -
// that includes the feature cards, their confirmation dialog and the ticker.
// `pick` chooses at access time rather than at module load: social() reads the
// page URL, which is not available while this module is being evaluated. The
// text fields below are getters for the same reason; they are still plain string
// properties as far as BetModeData is concerned.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

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
					'Buy direct entry into the LIQUIDATION RUN for 200× your bet, at the same 96% RTP as base play. The board opens two extra rows — 5×5, 3,125 ways — and every LEVERAGE symbol that lands adds to a running multiplier that applies to every win and never resets for the rest of the round. Maximum win: 12,000× your bet.',
					'Enter the LIQUIDATION RUN directly for 200× your amount, at the same 96% RTP as normal play. The board opens two extra rows — 5×5, 3,125 ways — and every LEVERAGE symbol that lands adds to a running multiplier that applies to every result and never resets for the rest of the round. Maximum win: 12,000× your amount.',
				);
			},
			get description() {
				return pick(
					'200× BET → 3,125 WAYS with a leverage multiplier that only climbs',
					'200× AMOUNT → 3,125 WAYS with a leverage multiplier that only climbs',
				);
			},
			get button() {
				return pick('BUY 200×', 'PLAY 200×');
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
