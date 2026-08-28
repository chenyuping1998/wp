import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import { base } from '$app/paths';

import config from './config';

// Triple Witching ships four math modes: base play and three feature entries.
// The shared library ships a template default (ANTE / SUPER ANTE / ...) with no
// backing math here, so the shared meta is overridden with exactly what the math
// supports - and it is BUILT FROM the math config rather than listed by hand, so
// a mode the maths does not ship cannot appear on the bar, and a mode it does
// ship cannot be forgotten.
//
// Social play cannot use betting terminology anywhere the player can read it -
// that includes the feature cards, their confirmation dialog and the ticker.
// `pick` chooses at access time rather than at module load: social() reads the
// page URL, which is not available while this module is being evaluated. The
// text fields below are getters for the same reason; they are still plain string
// properties as far as BetModeData is concerned.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

// Every figure comes from the math config. The RTP moved 0.96 -> 0.94 and the
// bonus cost 200 -> 120 -> 100 while this copy already existed; a price or a
// percentage typed into prose is exactly the thing that keeps the old value.
const rtpPct = `${(config.rtp * 100).toFixed(0)}%`;

type ModeConfig = { cost: number; max_win: number };
const betModes = config.betModes as unknown as Record<string, ModeConfig>;

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

// Per-mode copy. `what` is the sentence describing what the entry guarantees,
// and is the only part that differs between the three buys.
// `bags` is how many bag icons the card shows, and it is the fastest thing on
// the card to read: the three buys differ only in how many modifiers they
// guarantee, and a row of bags says that before the sentence does.
//
// White, not the modifiers' own colours - a card that guarantees "two of the
// three" must not appear to promise WHICH two.
//
// Note the mixed buy shows one bag while its copy says "one, two or all three".
// One is what it guarantees; the other two are upside.
const BUY_COPY: Record<string, { name: string; short: string; what: string; bags: 1 | 2 | 3 }> = {
	bonus: {
		name: 'EXPIRY SESSION',
		bags: 1,
		short: '1 MODIFIER GUARANTEED, SOMETIMES 2 OR 3',
		what: 'Every session runs one, two or all three modifiers, drawn when it opens.',
	},
	bonus2: {
		name: 'DOUBLE EXPIRY',
		bags: 2,
		short: '2 OF THE 3 MODIFIERS, ALWAYS',
		what: 'Every session runs exactly two of the three modifiers, drawn when it opens.',
	},
	bonus3: {
		name: 'TRIPLE EXPIRY',
		bags: 3,
		short: 'ALL 3 MODIFIERS, ALWAYS',
		what: 'Every session runs all three modifiers: the board opens to 5x5, CONTRACT symbols carry multipliers, and wins are counted as ways.',
	},
};

const buyMode = (key: string): BetModeData => {
	const mode = betModes[key];
	const copy = BUY_COPY[key];
	const cost = mode.cost;
	const maxWin = mode.max_win.toLocaleString('en-US');
	return {
		mode: key.toUpperCase(),
		costMultiplier: cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: mode.max_win,
		assets: {
			...emptyAssets,
			// A DOM <img> src, not a pixi asset key - the bonus cards are HTML.
			icon: `${base}/assets/sprites/tripleWitchingUi/buy_bags_${copy.bags}.png`,
		},
		text: {
			get title() {
				return pick(`BUY ${copy.name}`, copy.name);
			},
			get dialog() {
				return pick(
					`Buy direct entry into the ${copy.name} for ${cost}x your bet, at the same ${rtpPct} RTP as base play. ${copy.what} Maximum win: ${maxWin}x your bet.`,
					`Enter the ${copy.name} directly for ${cost}x your amount, at the same ${rtpPct} RTP as normal play. ${copy.what} Maximum win: ${maxWin}x your amount.`,
				);
			},
			// What the entry GUARANTEES, not its name and price - the card already
			// shows both of those, and repeating them wasted the one line that
			// could tell the player how the three differ.
			//
			// No `pick` here: the text carries no betting terminology, so it is
			// the same in both modes.
			description: copy.short,
			get button() {
				return pick(`BUY ${cost}x`, `PLAY ${cost}x`);
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
	};
};

export const TRIPLE_WITCHING_BET_MODE_META: Record<string, BetModeData> = {
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
	// Buys, in the order they should appear on the bar. Only the ones the maths
	// actually ships are included - Object.keys, not a hand-written list.
	...Object.fromEntries(
		Object.keys(BUY_COPY)
			.filter((key) => key in betModes)
			.map((key) => [key.toUpperCase(), buyMode(key)]),
	),
};
