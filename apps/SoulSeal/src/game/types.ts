import { type SpinningReelSymbolState } from 'utils-slots';
import type config from './config';

export type SymbolName = keyof typeof config.symbols;
export type RawSymbol = {
	name: SymbolName;
	scatter?: boolean;
	wild?: boolean;
	/**
	 * The carrier's value, as a multiple of the stake. Present on every M and on
	 * nothing else.
	 *
	 * The displayed value is a FLOOR, never a ceiling - the maths may award more
	 * than the talisman shows but never less, so anything that formats it must
	 * round DOWN. See design/game-spec.md 4.1.
	 *
	 * There were TWO fields here: this one, correctly named after what the SDK
	 * writes and annotated "nothing in Soul Seal uses it any more", and a
	 * `cashValue` the client actually read. `cashValue` has never existed on a
	 * board, so the read returned undefined for every carrier on every spin,
	 * `stateGame.carriers` stayed empty, and no talisman ever displayed a number -
	 * the symbol the whole feature is built on rendered as a spirit holding a
	 * blank piece of paper, in every build, from the beginning.
	 *
	 * Nothing could catch it. It is not a type error, because board symbols arrive
	 * as loosely typed JSON; it is not a missing asset; and
	 * check_collect_contract verified the COLLECT events, which were right all
	 * along. That guard now also compares each reveal against the collect that
	 * follows it, which is the check that would have.
	 */
	multiplier?: number;
};
export type BetMode = keyof typeof config.betModes;
export type GameType = keyof typeof config.paddingReels;

export const SYMBOL_STATES = ['static', 'spin', 'land', 'win', 'postWinStatic'] as const;

export type SymbolState = SpinningReelSymbolState | (typeof SYMBOL_STATES)[number];

export type Position = {
	reel: number;
	row: number;
};

// ─── Soul Seal: the collect mechanic ────────────────────────────────────────
//
// Three roles, and the whole game is the relationship between them:
//
//   M  carrier   a spirit wearing a talisman that names a cash value. Pays
//                 nothing on its own, in either game type.
//   W  collector  the wild. Substitutes in line wins, and INSIDE THE FEATURE
//                 also sweeps every carrier on the board.
//   rail          12 talisman slots that fill as sweeps happen, raising a
//                 global multiplier on every collect
//
// Numbers here are all bet multiples, matching the maths. See
// design/game-spec.md §4 for the ladders and the rules they came from.

/**
 * The two collect symbol names.
 *
 * The collector IS the wild. There is no separate collector symbol: W both
 * substitutes in line wins and, inside the feature, sweeps the carriers.
 *
 * Typed as `SymbolName`, which is derived from `config.symbols` — so a typo, or
 * a maths change that renames either symbol, is a compile error rather than a
 * comparison that silently never matches.
 */
export const CARRIER_SYMBOL: SymbolName = 'M';
export const COLLECTOR_SYMBOL: SymbolName = 'W';

/** A carrier on the board, with the value written on its talisman. */
export type CarrierHit = Position & { value: number };

/** A wild on the board. Carries no multiplier of its own - see CollectSweep. */
export type CollectorHit = Position;

/**
 * What caused one sweep. Which path is live depends on the GAME TYPE, and that
 * difference is the feature's whole point:
 *
 *   'line'      BASE GAME. 3+ carriers on one payline sweeps the board once.
 *               A wild breaks the run — it does not substitute for a carrier,
 *               because a wild carries no cash value and a line it completed
 *               would show three spirits paying and hand over the value of two.
 *   'collector' FREE GAME. Every wild sweeps every carrier, once each. At most
 *               one wild lands per reel, so there are 0..5 sweeps in a spin.
 *
 * So the feature does not just pay better — it changes what makes a carrier pay
 * at all. In the base game the spirits have to line up; in the feature a single
 * wild empties the board.
 */
export type CollectSource =
	| { kind: 'line'; lineIndex: number }
	| { kind: 'collector'; position: Position };

/**
 * One sweep, fully resolved by the maths.
 *
 * `carriers` is not a hint for the animation — it is the authoritative list of
 * what this sweep took. Whatever the gourd is shown pulling in must be exactly
 * this set, because a disagreement between presentation and maths reads to a
 * Stake reviewer as a payout bug (see the skill's review-log).
 */
export type CollectSweep = {
	source: CollectSource;
	carriers: CarrierHit[];
	/** sum of `carriers`, before the rail's global multiplier */
	subtotal: number;
	/** what this sweep actually pays: subtotal × the collect multiplier */
	award: number;
};

// The two free-game features. Which one is running is drawn at the trigger and
// held for the whole run, retriggers included.
//
//   sealing  carries the RAIL - 12 talisman slots, milestones at 5/9/12 that
//            pay free spins and raise the global collect multiplier. Reached by
//            a 4-scatter trigger, or bought at 100x.
//   swarm    carries the GUARANTEE - every carrier is worth at least 5x and
//            every spin holds at least one carrier and one collector. Reached
//            by a 5-scatter trigger, or bought at 300x.
//
// The two are alternatives, and deliberately so. An early build gave swarm the
// rail as well; a guaranteed wild every spin combined with a rail that raises
// the collect multiplier compounds without bound, and it measured 26x RTP
// against a 300x cost. One feature, one mechanic.
export const FEATURE_NAMES = ['sealing', 'swarm'] as const;
export type FeatureName = (typeof FEATURE_NAMES)[number];

/**
 * Rail slots, and the milestones that pay free spins and raise the multiplier.
 *
 * The multiplier is GLOBAL — it scales every sweep. It used to be a floor on a
 * collector symbol's own multiplier; there is no collector symbol any more, so
 * the rail multiplies the whole collect instead. Same escalation, one fewer
 * thing on the board.
 */
export const RAIL_TOTAL = 12;
export const RAIL_MILESTONES = [
	{ slot: 5, freeSpins: 8, collectMultiplier: 2 },
	{ slot: 9, freeSpins: 8, collectMultiplier: 4 },
	{ slot: 12, freeSpins: 8, collectMultiplier: 10 },
] as const;
