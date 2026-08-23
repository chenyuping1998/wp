import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import { base } from '$app/paths';

import config from './config';

// Soul Seal ships FIVE math modes: base play, two active modes and two buys.
//
// The shared library ships a template default (ANTE / SUPER ANTE / ...) with no
// backing math here, so the shared meta is overridden with exactly what the math
// supports - and it is BUILT FROM the math config rather than listed by hand, so
// a mode the maths does not ship cannot appear on the bar, and a mode it does
// ship cannot be forgotten.
//
// That last guarantee is only as good as the copy table it draws from, and this
// file spent a while proving it. It arrived from the scaffold describing three
// buys named EXPIRY SESSION, DOUBLE EXPIRY and TRIPLE EXPIRY, which sold "one,
// two or all three modifiers" - a mechanic Soul Seal does not have. Two of those
// three keys did not exist in this game's config, so the filter below quietly
// dropped them and the bar showed a single 100x card; the two ACTIVE modes and
// the 300x buy had no entry at all and were simply missing from the game. The
// filter did its job. The table was the thing that was wrong.
//
// Social play cannot use betting terminology anywhere the player can read it -
// that includes the feature cards, their confirmation dialog and the ticker.
// `pick` chooses at access time rather than at module load: social() reads the
// page URL, which is not available while this module is being evaluated. The
// text fields below are getters for the same reason; they are still plain string
// properties as far as BetModeData is concerned.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

// Every figure comes from the math config. The RTP and the buy costs both moved
// while this copy already existed; a price or a percentage typed into prose is
// exactly the thing that keeps the old value.
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

// Per-mode copy.
//
// `what` is the sentence describing what the entry actually changes, and it is
// the only part that differs between the four. Each one is written against the
// maths, not against the theme:
//
//   ACTIVE5/10  math-sdk game_config, active_condition_5/10 - these swap the
//               base-game strips for AR5 / AR10, which carry 28-32 and 38-44
//               carriers per reel against BR0's 18-21. Same rules, denser board.
//   BONUS       freegame_condition - ordinary free spins, so the talisman rail
//               is live: 5, 9 and 12 talismans each add free spins and step the
//               collect multiplier.
//   BONUS300    richfeature_condition, feature "swarm" - gamestate.py draws a
//               board that GUARANTEES a wild beside a carrier every spin, and
//               game_override floors every carrier at 5x. It has no rail; the
//               guarantee is what it sells instead, and the two are deliberate
//               alternatives rather than an oversight.
//
// `short` is the one line on the card, so it has to be worth its place. The
// first pass said "DENSER REELS, MORE SPIRITS TO SEAL" and "THE DENSEST REELS IN
// THE GAME" - both true, neither of any use: a player comparing two cards was
// told one is dense and the other is densest, with nothing to weigh. The figures
// are in make_reels.py DENSITY and they are worth quoting - measured per reel,
// base is 19.0 carriers, AR5 is 29.6 and AR10 is 40.4, so 1.56x and 2.13x.
// Rounded to 60% and twice, which is honest at the precision a card can carry.
//
// `art` picks the generated card art. See design/generate_mode_icons.mjs.
type ModeCopy = {
	name: string;
	short: string;
	what: string;
	art: string;
	activate?: boolean;
};

const MODE_COPY: Record<string, ModeCopy> = {
	active5: {
		name: 'SPIRIT TIDE',
		art: 'tide',
		activate: true,
		short: '60% MORE SPIRITS ON THE REELS',
		what: 'The reels run thick with spirits, so far more carriers reach the board and far more lines have something to collect.',
	},
	active10: {
		name: 'SPIRIT FLOOD',
		art: 'flood',
		activate: true,
		short: 'TWICE THE SPIRITS ON THE REELS',
		what: 'The heaviest reels this game holds - more than twice the carriers of ordinary play, on every spin.',
	},
	bonus: {
		name: 'SEALING RITE',
		art: 'rite',
		short: 'FREE SPINS. THE RAIL ADDS MORE',
		what: 'Direct entry into free spins, where a wild collects every spirit on the board and the rail adds spins and multiplies each collect at 5, 9 and 12 talismans.',
	},
	bonus300: {
		name: 'GRAND SEALING',
		art: 'grand',
		short: 'EVERY FREE SPIN COLLECTS',
		what: 'Free spins that guarantee a wild beside a spirit on every single spin, with no carrier worth less than 5x.',
	},
};

const featureMode = (key: string): BetModeData => {
	const mode = betModes[key];
	const copy = MODE_COPY[key];
	const cost = mode.cost;
	const maxWin = mode.max_win.toLocaleString('en-US');
	// An ACTIVE mode is not bought once - it is the cost of every spin while it
	// is switched on. The bar renders the two types differently, so getting this
	// wrong would offer a 5x-per-spin mode behind a one-off purchase button.
	const activate = copy.activate === true;
	return {
		mode: key.toUpperCase(),
		costMultiplier: cost,
		type: activate ? 'activate' : 'buy',
		parent: '',
		children: '',
		maxWin: mode.max_win,
		assets: {
			...emptyAssets,
			// A DOM <img> src, not a pixi asset key - the bonus cards are HTML.
			//
			// `dialogImage` is the card's full-bleed background, and supplying it is
			// what opts this game into that treatment: BonusCard renders a cover only
			// when the field is non-empty, and the other three games in the workspace
			// all set it to ''.
			//
			// `icon` is deliberately NOT set. It draws a small glyph above the
			// description, and it was the right answer while the cards were four
			// identical dark rectangles - a 28px mark was the only thing telling them
			// apart. Now that each card carries its own art edge to edge, the same
			// motif appeared twice on every card: once at full size behind, once
			// again as a thumbnail stamped in the middle of the text. The small one
			// is the one to lose.
			dialogImage: `${base}/assets/sprites/soulSealUi/card_${copy.art}.png`,
		},
		text: {
			get title() {
				return activate ? copy.name : pick(`BUY ${copy.name}`, copy.name);
			},
			get dialog() {
				if (activate) {
					return pick(
						`Play ${copy.name} at ${cost}x your bet per spin, at the same ${rtpPct} RTP as base play. ${copy.what} Maximum win: ${maxWin}x your bet.`,
						`Play ${copy.name} at ${cost}x your amount per spin, at the same ${rtpPct} RTP as normal play. ${copy.what} Maximum win: ${maxWin}x your amount.`,
					);
				}
				return pick(
					`Buy direct entry into the ${copy.name} for ${cost}x your bet, at the same ${rtpPct} RTP as base play. ${copy.what} Maximum win: ${maxWin}x your bet.`,
					`Enter the ${copy.name} directly for ${cost}x your amount, at the same ${rtpPct} RTP as normal play. ${copy.what} Maximum win: ${maxWin}x your amount.`,
				);
			},
			// What the entry CHANGES, not its name and price - the card already
			// shows both of those, and repeating them wasted the one line that
			// could tell the player how the four differ.
			//
			// No `pick` here: the text carries no betting terminology, so it is the
			// same in both modes.
			description: copy.short,
			get button() {
				return activate ? `${cost}x PER SPIN` : pick(`BUY ${cost}x`, `PLAY ${cost}x`);
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			// the ticker is player-facing in both modes, so "BUY" has to go in social
			get tickerSpin() {
				return activate ? 'THE SPIRITS ARE RESTLESS' : pick('BONUS BUY ACTIVATED', 'FEATURE ACTIVATED');
			},
			bannerText: '',
		},
	};
};

// The human-readable name of each mode, keyed the way the MATH config keys them
// (lower case). Two other panels need this - the rules table and the replay card
// - and both used to keep their own copy of the list. Both copies listed the
// scaffold's bonus2/bonus3 and neither knew about the active modes or the 300x
// buy, so the rules table quoted RTP for two modes while the bar offered four.
// Certification asks for RTP and max win for EVERY mode available, so a list
// that can fall behind is a defect and not a tidiness question.
export const MODE_LABELS: Record<string, string> = {
	base: 'Base Game',
	...Object.fromEntries(
		Object.keys(MODE_COPY)
			.filter((key) => key in betModes)
			.map((key) => [
				key,
				MODE_COPY[key].name.replace(
					/\w\S*/g,
					(word) => word[0] + word.slice(1).toLowerCase(),
				),
			]),
	),
};

/** True for a mode that costs its multiple on EVERY spin rather than once. */
export const isActivateMode = (key: string) => MODE_COPY[key.toLowerCase()]?.activate === true;

export const SOUL_SEAL_BET_MODE_META: Record<string, BetModeData> = {
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
	// In the order they should appear on the bar: the two active modes first,
	// cheapest first, then the two buys. Only the ones the maths actually ships
	// are included - Object.keys over the copy table, not a hand-written list.
	...Object.fromEntries(
		Object.keys(MODE_COPY)
			.filter((key) => key in betModes)
			.map((key) => [key.toUpperCase(), featureMode(key)]),
	),
};

// Every mode in the copy table must exist in the maths, and every non-base mode
// in the maths must have copy. The filter above is deliberately forgiving so a
// half-finished maths change cannot break the bar; this is the counterweight, so
// a half-finished COPY change cannot silently hide a mode the player paid to
// have built. It throws in dev only - a live session should degrade, not die.
if (import.meta.env?.DEV) {
	const missing = Object.keys(betModes).filter((key) => key !== 'base' && !(key in MODE_COPY));
	const orphaned = Object.keys(MODE_COPY).filter((key) => !(key in betModes));
	if (missing.length || orphaned.length) {
		throw new Error(
			`betModeMeta is out of step with the maths — ` +
				`modes with no copy: [${missing}], copy with no mode: [${orphaned}]`,
		);
	}
}
