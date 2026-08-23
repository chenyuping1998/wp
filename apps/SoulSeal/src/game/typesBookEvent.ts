import type { BetType } from 'rgs-requests';

import type {
	SymbolName,
	RawSymbol,
	GameType,
	Position,
	CollectSweep,
	FeatureName,
} from './types';

type BookEventReveal = {
	index: number;
	type: 'reveal';
	// Row count varies by game type: 3 visible rows in the basegame, 5 in the
	// feature, both padded top and bottom. Nothing may assume a fixed length.
	board: RawSymbol[][];
	paddingPositions: number[];
	anticipation: number[];
	gameType: GameType;
};

type BookEventSetTotalWin = {
	index: number;
	type: 'setTotalWin';
	amount: number;
};

type BookEventFinalWin = {
	index: number;
	type: 'finalWin';
	amount: number;
};

type BookEventFreeSpinTrigger = {
	index: number;
	type: 'freeSpinTrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventUpdateFreeSpin = {
	index: number;
	type: 'updateFreeSpin';
	amount: number;
	total: number;
};

type BookEventFreeSpinRetrigger = {
	index: number;
	type: 'freeSpinRetrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventSetWin = {
	index: number;
	type: 'setWin';
	amount: number;
	winLevel: number;
};

type BookEventFreeSpinEnd = {
	index: number;
	type: 'freeSpinEnd';
	amount: number;
	winLevel: number;
};

// A line win. `positions` are the cells along the paying line, and are the only
// field the presentation needs.
//
// The scaffold this was copied from also evaluated as ways in some features and
// carried a discriminated union here. Soul Seal is lines-only in every mode, so
// there is one shape and nothing to narrow.
type LinesWinMeta = {
	// which payline paid, 1-based, indexing config.paylines
	lineIndex: number;
	multiplier: number;
	winWithoutMult: number;
	globalMult: number;
	lineMultiplier: number;
};

type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		kind: number;
		win: number;
		positions: Position[];
		meta: LinesWinMeta;
	}[];
};

// ─── Soul Seal: the collect mechanic ────────────────────────────────────────

/**
 * One spin's collect resolution, fully decided by the maths.
 *
 * Sent after the reveal and after the winInfo it accompanies, because a line of
 * three carriers both pays as a line win AND triggers a sweep — the player sees
 * the line pay first, then the gourd open.
 *
 * `sweeps` is ordered, and the presentation must play it in that order. It must
 * not reorder for effect: the collect animation is the only account the player
 * gets of how the total was reached, and a sweep shown taking a carrier it did
 * not take is indistinguishable from a payout bug.
 *
 * `totalWin` is authoritative. If the sweeps sum to more than the win cap the
 * maths has already truncated, and `cappedAt` says where — the presentation
 * still plays every sweep, then lands on `totalWin` rather than the raw sum.
 */
type BookEventCollect = {
	index: number;
	type: 'collect';
	sweeps: CollectSweep[];
	totalWin: number;
	/**
	 * The rail's global multiplier, ALREADY applied to every sweep's `award`.
	 * Sent so the presentation can show why the number is what it is rather than
	 * having to infer it by division.
	 */
	collectMultiplier: number;
	/** set only when the cap truncated this collect; the raw uncapped sum */
	cappedAt?: number;
};

/**
 * The talisman rail advancing, sent once per sweep that fills a slot.
 *
 * `filled` is the count AFTER this advance, so the presentation never has to
 * accumulate anything of its own — a running count maintained on the client is
 * the classic way a rail and its maths drift apart across a retrigger.
 */
type BookEventRailAdvance = {
	index: number;
	type: 'railAdvance';
	filled: number;
	total: number;
	/** free spins this advance paid, 0 unless a milestone slot was reached */
	awardedFs: number;
	/** the global collect multiplier now in force: 1, 2, 4 or 10 */
	collectMultiplier: number;
};

/**
 * Which free-game feature is running, sent once after freeSpinTrigger and
 * before the first feature reveal.
 *
 * Drawn at the trigger and held for the whole run, retriggers included, so the
 * client switches mode once here and nothing downstream infers anything.
 *
 * Named `collectFeatureSet` rather than `featureSet` because the old
 * expand/mult/ways `featureSet` above is still live until the scaffold's
 * mechanics are removed. Two discriminants, no ambiguity while both exist.
 */
type BookEventFeatureSet = {
	index: number;
	type: 'featureSet';
	feature: FeatureName;
	/** carrier value floor for this run; `swarm` guarantees 5x, others 0 */
	minCarrierValue: number;
	/** whether every spin guarantees at least one carrier AND one collector */
	guaranteesPair: boolean;
	railTotal: number;
	gameType: GameType;
};

type BookEventWincap = {
	index: number;
	type: 'wincap';
	amount: number;
};

type BookEventCreateBonusSnapshot = {
	index: number;
	type: 'createBonusSnapshot';
	bookEvents: BookEvent[];
};

export type BookEvent =
	| BookEventReveal
	| BookEventWinInfo
	| BookEventSetTotalWin
	| BookEventFreeSpinTrigger
	| BookEventFreeSpinRetrigger
	| BookEventUpdateFreeSpin
	| BookEventWincap
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	| BookEventCollect
	| BookEventRailAdvance
	| BookEventFeatureSet
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
