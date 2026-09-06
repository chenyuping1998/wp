import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import { base } from '$app/paths';

import config from './config';

// Go Bananaut ships five math modes: base play, the 50x hold and spin, and
// three free-spin buys at 100x / 200x / 300x. The keys here are the math mode
// names uppercased — stateBet looks them up with activeBetModeKey.toUpperCase().
// The shared library ships a template default (ANTE / SUPER ANTE / …) with no
// backing math here, so we override the shared meta with exactly what the math
// supports.
//
// WHAT THE THREE BUYS ACTUALLY DIFFER BY
//
// One thing only: the board they OPEN on. EIGHT spins for all three, same reels.
//
//     100x   4-4-4-4-4   1,024 ways
//     200x   5-4-4-4-4   1,280 ways
//     300x   6-4-4-4-4   1,536 ways
//
// Eight, not seven — game_config raised it so a bought round pays exactly what
// the three scatters it forces are worth on the pay table. The spin counts in
// the copy below all read config.betModes[...].spins, so they followed; this
// comment did not, and said seven for a while after the game stopped doing it.
//
// The copy leads with the head start, and it can, because unlike the previous
// generation that really is where the price comes from — measured at 112x /
// 189x / 306x against targets of 96x / 192x / 288x.
//
// The ways figures above understate the gap enormously and the copy must not
// lean on them as the value story. A rung is 1.2x of ways but roughly 1.7x of a
// whole ROUND, because the board is sticky: opening taller means more cells,
// so markers arrive faster, so it grows faster, so every later spin is worth
// more again. Saying "1,536 ways instead of 1,024" is true and sells a third of
// what the tier is actually worth; saying "starts two rows taller and climbs
// from there" is the honest version.
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
// Regenerated for this game by design/generate_mode_cards.mjs. Each buy card
// draws the reel housing at FULL height with the tier's opening board standing
// in it and the slots above it left as empty frames:
//
//     bonus100   4-4-4-4-4
//     bonus200   5-4-4-4-4   reel 1 lit, x2
//     bonus300   6-4-4-4-4   reel 1 lit to the top, x2
//
// so the three differ by exactly what the tiers differ by — buy_start_steps —
// and by nothing else. The generator reads the same ladder rule the maths uses
// rather than carrying three literal board shapes.
//
// They were gen-2 artwork: one, two and three reels overwritten by a Dynamite,
// a mechanic this game does not have, with card_bonus200 and card_bonus300
// rendering as the same image.
const cardArt = (name: string) => `${base}/assets/sprites/goBananasUi/card_${name}.png`;

// Repeated in every dialog; kept in one place so the figure cannot drift between
// cards the way it did in gen-2.
//
// READ FROM CONFIG, not typed. It was typed, as '10,000x', and the maths had
// moved to 15,000x underneath it — so all three cards were quoting a ceiling a
// third below the one the game actually pays. That is exactly the drift the
// "kept in one place" note above was written to prevent, and one place is no
// help when the one place holds a number nobody re-derives.
//
// The three buy tiers all cap at the game's own wincap; holdandspin caps lower
// and states its own figure inline.
const MAX_WIN = `${(config.betModes.bonus100.max_win ?? 15000).toLocaleString()}×`;
// A full board is every cell the same symbol, so every reel contributes all four
// of its rows: 4^5. Derived, because the board size lives in the maths config.
// The BASELINE board's ways. config.numRows is a static [4,4,4,4,4] written once
// at the end of the maths run, so this is 1,024 and always will be.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BASE_WAYS = (config.numRows ?? []).reduce((a: number, b: number) => a * b, 1).toLocaleString();

// A FULL board's ways — 6^5 = 7,776 — which is what the copy talks about when it
// talks about every reel stretched. It cannot come from numRows: that array never
// leaves the baseline no matter what the board does, so reading it here would
// have printed "a full 6x5 board is 1,024 ways" on all three buy cards.
const WAYS = Math.pow(config.growth.maxRows, config.numReels).toLocaleString();
const RTP = '96%';

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
					`Buy direct entry into ${config.betModes.bonus100.spins} FREE SPINS for 100× your bet, at the same ${RTP} RTP as base play. In low gravity the reels stretch: every marker that lands pulls a reel one row taller, from left to right, and the taller reels stay tall for the rest of the round. A stretched reel also DOUBLES. A full 6×5 board is ${WAYS} ways. Maximum win: ${MAX_WIN} your bet.`,
					`Enter ${config.betModes.bonus100.spins} FREE SPINS directly for 100× your amount, at the same ${RTP} RTP as normal play. In low gravity the reels stretch: every marker that lands pulls a reel one row taller, from left to right, and the taller reels stay tall for the rest of the round. A stretched reel also DOUBLES. A full 6×5 board is ${WAYS} ways. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`100× BET → ${config.betModes.bonus100.spins} FREE SPINS, stretched reels stay tall and double`,
					`100× AMOUNT → ${config.betModes.bonus100.spins} FREE SPINS, stretched reels stay tall and double`,
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
					`Buy entry into ${config.betModes.bonus200.spins} FREE SPINS for 200× your bet, at the same ${RTP} RTP as base play. The board OPENS already stretched — reel one starts a row taller and doubling — and climbs from there. Markers keep pulling reels taller left to right, and every stretched reel doubles. Maximum win: ${MAX_WIN} your bet.`,
					`Enter ${config.betModes.bonus200.spins} FREE SPINS for 200× your amount, at the same ${RTP} RTP as normal play. The board OPENS already stretched — reel one starts a row taller and doubling — and climbs from there. Markers keep pulling reels taller left to right, and every stretched reel doubles. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`200× BET → ${config.betModes.bonus200.spins} FREE SPINS, opening a row taller on reel one`,
					`200× AMOUNT → ${config.betModes.bonus200.spins} FREE SPINS, opening a row taller on reel one`,
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

	// The top tier. ALL THREE CAP AT THE SAME 15,000x, so this one is 50x its own
	// cost against BONUS100's 150x — the copy therefore leads on the head start
	// and the spin count and does NOT imply a bigger top end than the cheaper
	// tiers. It has the highest floor of the three, not the highest ceiling.
	//
	// (The old note here said 1,500x, which was never this game's number at all.)
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
					`Buy the strongest entry for 300× your bet, at the same ${RTP} RTP as base play: ${config.betModes.bonus300.spins} FREE SPINS opening with reel one ALREADY AT FULL HEIGHT and doubling. Markers keep pulling the rest taller left to right, every stretched reel doubles, and a full 6×5 board is ${WAYS} ways. Maximum win: ${MAX_WIN} your bet.`,
					`Enter the strongest round for 300× your amount, at the same ${RTP} RTP as normal play: ${config.betModes.bonus300.spins} FREE SPINS opening with reel one ALREADY AT FULL HEIGHT and doubling. Markers keep pulling the rest taller left to right, every stretched reel doubles, and a full 6×5 board is ${WAYS} ways. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`300× BET → ${config.betModes.bonus300.spins} FREE SPINS, reel one opens at full height`,
					`300× AMOUNT → ${config.betModes.bonus300.spins} FREE SPINS, reel one opens at full height`,
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
