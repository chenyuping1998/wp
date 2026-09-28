import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import { base } from '$app/paths';

import config from './config';

// Go Bananubis ships five math modes: base play, the 100x / 200x / 500x
// free-spins buys and the 50x superspin (hold'em) buy. The three free-spin buys
// are one ladder, and each rung is named by the Scatter count it forces — 3, 4,
// 5 — with the spins following from freespin_triggers, the same table the base
// game pays by. So a player can read what a buy is worth off the board it opens
// on, without knowing anything about bet modes. The keys here
// are the math mode names uppercased — stateBet looks them up with
// activeBetModeKey.toUpperCase(). The shared library ships a template default
// (ANTE / SUPER ANTE / …) with no backing math here, so we override the shared
// meta with exactly what the math supports.
// Social play cannot use betting terminology anywhere the player can read it —
// that includes the feature-buy cards, their confirmation dialog and the ticker.
// `pick` chooses at access time rather than at module load: social() reads the
// page URL, which is not available while this module is being evaluated.
//
// The text fields below are getters for the same reason; they are still plain
// string properties as far as BetModeData is concerned.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

// EVERY NUMBER IN THE CARDS BELOW COMES FROM THE MATHS.
//
// These cards are the last thing a player reads before spending 200x or 500x, and
// until this pass they described Go Bananas 100: expanding sticky Wilds whose
// multipliers climbed to 100x, a 25,000x cap, and "18 spins instead of 8 to 15".
// None of the three mechanics existed here, the cap had moved, and the spin
// counts were a mode's award plus three invisible extra spins.
//
// So the counts are derived. `config.scatterSpins` is game_config.py's
// freespin_triggers and each mode's `scatterTriggers` is the Scatter count its
// entry forces — both scraped by design/sync_math_config.mjs, which refuses to
// build if a mode forces a count the trigger table does not pay spins for.
const spinsFor = (config.scatterSpins ?? {}) as Record<string, number>;
const entryOf = (key: 'bonus100' | 'bonus' | 'superbonus') => {
	const triggers = (config.betModes[key] as { scatterTriggers?: Record<string, number> })
		?.scatterTriggers;
	const count = Number(Object.keys(triggers ?? {})[0]);
	return { scatters: count, spins: spinsFor[count] };
};
const ENTRY_100 = entryOf('bonus100');
const BONUS_ENTRY = entryOf('bonus');
const SUPER_ENTRY = entryOf('superbonus');
const capX = (mode: 'base' | 'bonus100' | 'bonus' | 'superbonus' | 'superspin') =>
	(config.betModes[mode].max_win ?? 0).toLocaleString();

/** What the feature-buy menu's cards print (components/ui/ModalBuyBonus.svelte),
 *  from the same maths as the copy below — never retyped there. */
export const BUY_FACTS = {
	BONUS100: ENTRY_100,
	BONUS: BONUS_ENTRY,
	SUPERBONUS: SUPER_ENTRY,
	lineCap: capX('bonus'),
	superspinCap: capX('superspin'),
	rtpPercent: Math.round(config.betModes.bonus.rtp * 100),
};

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

// The buy modal's card art. A DOM <img> src, not a pixi asset key — the bonus
// cards are HTML, not canvas.
//
// Supplying this is what opts the game into BonusCard's full-bleed cover: the
// component draws one only when the field is non-empty, and every other game in
// the workspace leaves it as ''. Without it the three cards are identical dark
// rectangles told apart only by their words, which is what they were.
//
// `icon` is deliberately left empty. It stamps a small glyph above the
// description, and it was the right answer while the cards had no art — a 44px
// mark was the only thing separating them. Now that each card carries its own
// picture edge to edge, an icon would put the same motif on the card twice, once
// full size behind and once as a thumbnail in the middle of the text.
//
// See design/generate_mode_cards.mjs — the art is composited from this game's
// own symbol sprites, so it follows the symbols whenever they are regenerated.
const cardArt = (name: string) => `${base}/assets/sprites/goBananasUi/card_${name}.png`;

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
	// The 100x buy — the entry rung.
	//
	// It opens on THREE Scatters, which is the board the base game itself lands
	// 98.6% of the time it triggers. That is the whole proposition: not a richer
	// feature, the ordinary one, bought instead of waited for. Its Tablet weights
	// are the base game's `standard` table for the same reason — the three buys
	// run one table each (standard / rich / premium), so no tier shares its mix
	// with the one above it.
	//
	// The cap is the same 15,000x as the other line modes and it IS reachable in
	// eight spins — measured 1 in 4,000 runs on the wincap strip — but it is four
	// times rarer here than in the twelve-spin tier. The copy therefore leads on
	// the entry, not on the top end.
	BONUS100: {
		mode: 'BONUS100',
		costMultiplier: config.betModes.bonus100.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus100.max_win,
		// Two Tablets, one open, three Scatters — the smallest arrangement of the
		// same parts the other two cards are built from.
		assets: { ...emptyAssets, dialogImage: cardArt('bonus100') },
		text: {
			get title() {
				return pick('BUY FREE SPINS', 'FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into FREE SPINS for ${config.betModes.bonus100.cost}× your bet, at the same 95% RTP as base play. The round opens on a real ${ENTRY_100.scatters}-Scatter board — the board the base game triggers on — and plays the ${ENTRY_100.spins} spins that board is worth. Every Sealed Tablet on a spin opens to the same symbol, opened Tablets stay on the board for the rest of the round, and each carries a 2×–50× multiplier redrawn every spin. Multipliers on the same line add together. Maximum win: ${capX('bonus100')}× your bet.`,
					`Enter FREE SPINS directly for ${config.betModes.bonus100.cost}× your amount, at the same 95% RTP as normal play. The round opens on a real ${ENTRY_100.scatters}-Scatter board — the board normal play triggers on — and plays the ${ENTRY_100.spins} spins that board is worth. Every Sealed Tablet on a spin opens to the same symbol, opened Tablets stay on the board for the rest of the round, and each carries a 2×–50× multiplier redrawn every spin. Multipliers on the same line add together. Maximum win: ${capX('bonus100')}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${config.betModes.bonus100.cost}× BET → ${ENTRY_100.scatters} Scatters, ${ENTRY_100.spins} FREE SPINS with Tablets that stay open`,
					`${config.betModes.bonus100.cost}× AMOUNT → ${ENTRY_100.scatters} Scatters, ${ENTRY_100.spins} FREE SPINS with Tablets that stay open`,
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
	BONUS: {
		mode: 'BONUS',
		costMultiplier: config.betModes.bonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus.max_win,
		// Three Sealed Tablets with the middle one broken open, over this tier's
		// own four Scatters. Composited from the game's live symbol art by
		// design/generate_mode_cards.mjs, so it follows the symbols whenever they
		// are regenerated.
		assets: { ...emptyAssets, dialogImage: cardArt('bonus') },
		text: {
			get title() {
				return pick('BUY MORE FREE SPINS', 'MORE FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into FREE SPINS for ${config.betModes.bonus.cost}× your bet, at the same 95% RTP as base play. The round opens on a real ${BONUS_ENTRY.scatters}-Scatter board and plays the ${BONUS_ENTRY.spins} spins that board is worth. Every Sealed Tablet on a spin opens to the same symbol, opened Tablets stay on the board for the rest of the round, and each carries a 2×–50× multiplier redrawn every spin. Multipliers on the same line add together. Maximum win: ${capX('bonus')}× your bet.`,
					`Enter FREE SPINS directly for ${config.betModes.bonus.cost}× your amount, at the same 95% RTP as normal play. The round opens on a real ${BONUS_ENTRY.scatters}-Scatter board and plays the ${BONUS_ENTRY.spins} spins that board is worth. Every Sealed Tablet on a spin opens to the same symbol, opened Tablets stay on the board for the rest of the round, and each carries a 2×–50× multiplier redrawn every spin. Multipliers on the same line add together. Maximum win: ${capX('bonus')}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${config.betModes.bonus.cost}× BET → ${BONUS_ENTRY.scatters} Scatters, ${BONUS_ENTRY.spins} FREE SPINS with Tablets that stay open`,
					`${config.betModes.bonus.cost}× AMOUNT → ${BONUS_ENTRY.scatters} Scatters, ${BONUS_ENTRY.spins} FREE SPINS with Tablets that stay open`,
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
				return pick('BONUS BUY ACTIVATED', 'BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},
	// The 500x buy. It shares BONUS's max win, so the copy leads on the entry it
	// guarantees rather than implying a bigger top end than BONUS has: one more
	// Scatter, the three more spins that Scatter is worth, and a hotter Tablet
	// weight table underneath.
	//
	// It no longer gets spins BONUS's board could not explain. This tier used to
	// run eighteen — its five-Scatter award of fifteen plus three from
	// freespin_bonus_spins — so the card had to say "18 spins" about a board that
	// accounted for fifteen. That mechanism is gone from the maths.
	//
	// Measured against the published books, weighted by the lookup table (which is
	// the served distribution — raw book order is not). Both in base-bet multiples:
	//
	//                 median     p90      p99    p99.9   under cost   cap
	//   200x buy       64.2x    552x   1,139x   2,001x     74.7%    1 in 15,000
	//   500x buy      126.3x  1,361x   2,400x   3,811x     69.3%    1 in  2,500
	//
	// So the super buy is genuinely the stronger entry now, and the copy may say
	// so: it beats the cheaper tier in every absolute band and is six times likelier
	// to cap. What it does NOT do is return more per unit staked — the median is
	// 0.21x its own cost against 0.35x — so do not write copy implying better value,
	// only a bigger outcome. Both modes run at 0.95 RTP; the difference is shape.
	SUPERBONUS: {
		mode: 'SUPERBONUS',
		costMultiplier: config.betModes.superbonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.superbonus.max_win,
		// The same picture with five Tablets, two of them open, and five Scatters:
		// what 500x buys over 200x is more of exactly this.
		assets: { ...emptyAssets, dialogImage: cardArt('superbonus') },
		text: {
			get title() {
				return pick('BUY SUPER FREE SPINS', 'SUPER FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy the strongest entry into FREE SPINS for ${config.betModes.superbonus.cost}× your bet, at the same 95% RTP as base play. Guarantees a full ${SUPER_ENTRY.scatters}-Scatter board — ${SUPER_ENTRY.spins} spins, the most the game awards — and Sealed Tablets open on the high symbols far more often. Maximum win: ${capX('superbonus')}× your bet.`,
					`Enter SUPER FREE SPINS for ${config.betModes.superbonus.cost}× your amount, at the same 95% RTP as normal play. Guarantees a full ${SUPER_ENTRY.scatters}-Scatter board — ${SUPER_ENTRY.spins} spins, the most the game awards — and Sealed Tablets open on the high symbols far more often. Maximum win: ${capX('superbonus')}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${config.betModes.superbonus.cost}× BET → ${SUPER_ENTRY.scatters} Scatters, ${SUPER_ENTRY.spins} FREE SPINS and richer Tablets`,
					`${config.betModes.superbonus.cost}× AMOUNT → ${SUPER_ENTRY.scatters} Scatters, ${SUPER_ENTRY.spins} FREE SPINS and richer Tablets`,
				);
			},
			get button() {
				return pick('BUY 500×', 'PLAY 500×');
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
	SUPERSPIN: {
		mode: 'SUPERSPIN',
		costMultiplier: config.betModes.superspin.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.superspin.max_win,
		// a part-filled board of held Coins — deliberately shares no vocabulary
		// with the two free-spin cards, because it is not free spins
		assets: { ...emptyAssets, dialogImage: cardArt('superspin') },
		text: {
			title: 'SUPER SPIN',
			get dialog() {
				return pick(
					`A hold-and-spin round for ${config.betModes.superspin.cost}× your bet. You start with 3 respins — every Coin that lands sticks to the board and resets the respins back to 3. When no respins remain, all stuck Coin values are added up and paid out. Maximum win: ${capX('superspin')}× your bet.`,
					`A hold-and-spin round for ${config.betModes.superspin.cost}× your amount. You start with 3 respins — every Coin that lands sticks to the board and resets the respins back to 3. When no respins remain, all stuck Coin values are added up and awarded. Maximum win: ${capX('superspin')}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${config.betModes.superspin.cost}× BET → 3 respins, Coins stick and reset the count (max ${capX('superspin')}×)`,
					`${config.betModes.superspin.cost}× AMOUNT → 3 respins, Coins stick and reset the count (max ${capX('superspin')}×)`,
				);
			},
			get button() {
				return pick('BUY 50×', 'PLAY 50×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			tickerSpin: 'SUPER SPIN ACTIVATED',
			bannerText: '',
		},
	},
};
