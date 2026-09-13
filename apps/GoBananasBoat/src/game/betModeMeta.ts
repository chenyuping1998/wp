import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import { base } from '$app/paths';

import config from './config';

// Go Bananas Boat ships five math modes: base play, the 50x hold and spin, and
// three free-spin buys at 100x / 200x / 300x. The keys here are the math mode
// names uppercased — stateBet looks them up with activeBetModeKey.toUpperCase().
// The shared library ships a template default (ANTE / SUPER ANTE / …) with no
// backing math here, so we override the shared meta with exactly what the math
// supports.
//
// WHAT THE THREE BUYS ACTUALLY DIFFER BY
//
// Crate density on the free strips — 28% / 31% / 34% against the scatter-won
// feature's 25% — and the per-spin chance of a Full Shipment, 3.5% / 4% / 4.5%
// (DENSITY in math-sdk/games/GoBananasBoat/make_mystery_reels.py, and
// full_shipment_chance in its game_config). All three play the same eight spins.
//
// The copy says exactly that and nothing more. It previously described banked
// dynamite filling a blast meter, which was true of the game this app was forked
// from and has not been true here since the dynamite was removed: three dialogs
// and their three social variants were selling a mechanic the player would never
// see.
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
//
// Regenerated from this game's own symbols by design/generate_mode_cards.mjs:
// each buy card shows two, three or four reels of cargo crates with the lower
// half already opened on one cargo, which is the tiers' real difference drawn
// literally. Re-run that script whenever the symbol art changes — the cards
// composite the actual tile PNGs, so they follow along.
const cardArt = (name: string) => `${base}/assets/sprites/goBananasUi/card_${name}.png`;

// Repeated in every dialog; DERIVED, so none of these can drift from the maths
// the way they have twice already. MAX_WIN was a hardcoded '10,000×' and RTP was
// a hardcoded '96%' — against a game that has been solved to 95% all along, on
// every card, in both languages.
const pct = (v: number) => `${Math.round(v * 100)}%`;
const times = (v: number) => `${v.toLocaleString()}×`;
const MAX_WIN = times(config.betModes.bonus100.max_win);
// A full board is every cell the same symbol, so every reel contributes all four
// of its rows: 4^5. Derived, because the board size lives in the maths config.
const WAYS = (config.numRows ?? []).reduce((a: number, b: number) => a * b, 1).toLocaleString();
const RTP = pct(config.rtp);

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

	// The 50x hold and spin. Carried over from gen-1 and gen-2, renamed from
	// "hold and spin". It deliberately shares no vocabulary with the three free-spin
	// cards, because it is a different board: coins, not ways.
	HOLDANDSPIN: {
		mode: 'HOLDANDSPIN',
		costMultiplier: config.betModes.holdandspin.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.holdandspin.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('holdandspin') },
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

	BONUS100: {
		mode: 'BONUS100',
		costMultiplier: config.betModes.bonus100.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus100.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('bonus100') },
		text: {
			get title() {
				return pick('BUY FREE SPINS', 'FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into ${config.betModes.bonus100.spins} FREE SPINS for 100× your bet, at the same ${RTP} RTP as base play. The whole round carries one shipment: every cargo crate that lands, on every spin, opens on the same symbol. A Full Shipment turns the entire board into crates — ${WAYS} ways of one symbol in a single spin. Maximum win: ${MAX_WIN} your bet.`,
					`Enter ${config.betModes.bonus100.spins} FREE SPINS directly for 100× your amount, at the same ${RTP} RTP as normal play. The whole round carries one shipment: every cargo crate that lands, on every spin, opens on the same symbol. A Full Shipment turns the entire board into crates — ${WAYS} ways of one symbol in a single spin. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`100× BET → ${config.betModes.bonus100.spins} FREE SPINS with extra crates on the reels`,
					`100× AMOUNT → ${config.betModes.bonus100.spins} FREE SPINS with extra crates on the reels`,
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

	BONUS200: {
		mode: 'BONUS200',
		costMultiplier: config.betModes.bonus200.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus200.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('bonus200') },
		text: {
			get title() {
				return pick('BUY SUPER FREE SPINS', 'SUPER FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy a stronger entry for 200× your bet, at the same ${RTP} RTP as base play: ${config.betModes.bonus200.spins} FREE SPINS with more cargo crates on the reels than the 100× round, and a better chance of a Full Shipment. Every crate in the round opens on the same symbol, and a Full Shipment is ${WAYS} ways of it in one spin. Maximum win: ${MAX_WIN} your bet.`,
					`Enter a stronger round for 200× your amount, at the same ${RTP} RTP as normal play: ${config.betModes.bonus200.spins} FREE SPINS with more cargo crates on the reels than the 100× round, and a better chance of a Full Shipment. Every crate in the round opens on the same symbol, and a Full Shipment is ${WAYS} ways of it in one spin. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`200× BET → ${config.betModes.bonus200.spins} FREE SPINS, more crates and more Full Shipments`,
					`200× AMOUNT → ${config.betModes.bonus200.spins} FREE SPINS, more crates and more Full Shipments`,
				);
			},
			get button() {
				return pick('BUY 200×', 'PLAY 200×');
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

	// The top tier. Its maximum win is 1,500x the base bet — 5x this mode's own
	// cost, against 15x for BONUS100 — so the copy leads on the head start and the
	// spin count and does NOT imply a bigger top end than the cheaper tiers. It
	// has the highest floor of the three, not the highest ceiling.
	BONUS300: {
		mode: 'BONUS300',
		costMultiplier: config.betModes.bonus300.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus300.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('bonus300') },
		text: {
			get title() {
				return pick('BUY MAX FREE SPINS', 'MAX FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy the strongest entry for 300× your bet, at the same ${RTP} RTP as base play: ${config.betModes.bonus300.spins} FREE SPINS with the most cargo crates on the reels and the best chance of a Full Shipment. Every crate in the round opens on the same symbol, and a Full Shipment turns the whole board into that one cargo — ${WAYS} ways in a single spin. Maximum win: ${MAX_WIN} your bet.`,
					`Enter the strongest round for 300× your amount, at the same ${RTP} RTP as normal play: ${config.betModes.bonus300.spins} FREE SPINS with the most cargo crates on the reels and the best chance of a Full Shipment. Every crate in the round opens on the same symbol, and a Full Shipment turns the whole board into that one cargo — ${WAYS} ways in a single spin. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`300× BET → ${config.betModes.bonus300.spins} FREE SPINS, the most crates and the most Full Shipments`,
					`300× AMOUNT → ${config.betModes.bonus300.spins} FREE SPINS, the most crates and the most Full Shipments`,
				);
			},
			get button() {
				return pick('BUY 300×', 'PLAY 300×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			get tickerSpin() {
				return pick('MAX BONUS BUY ACTIVATED', 'MAX BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},
};
