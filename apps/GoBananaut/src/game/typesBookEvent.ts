import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

// book events shared with scatter game
type BookEventReveal = {
	index: number;
	type: 'reveal';
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

type BookEventUpdateGlobalMult = {
	index: number;
	type: 'updateGlobalMult';
	globalMult: number;
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

type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		kind: number;
		win: number;
		positions: Position[];
		// Ways, not lines. src/calculations/ways.py emits exactly these four:
		// there is no lineIndex here because there is no line — `ways` is the
		// product of the per-reel counts, and it is the number the player is
		// shown ("240 WAYS"), not a payline id.
		meta: {
			ways: number;
			globalMult: number;
			winWithoutMult: number;
			symbolMult: number;
		};
	}[];
};

// The grow markers flew off, revealing the ordinary symbols underneath.
//
// Emitted AFTER the reveal, which carries the board the reels stopped on with
// the markers still on it. That order is what lets the client animate one board
// into the other — and it means the reveal alone is not the board the round was
// scored on, so anything restoring a round from its book has to replay this and
// growReels (see boardAfterLastGrowth).
//
// `symbol` is the ordinary symbol the cell reverts to, told rather than derived:
// stripping a "G" off a symbol id on the client is exactly the kind of
// convention that survives until someone renames a symbol.
//
// Not emitted once the counter is full — a full board has no markers to fly off
// because none landed.
type BookEventGrowMarkers = {
	index: number;
	type: 'growMarkers';
	markers: { reel: number; row: number; symbol: SymbolName }[];
};

// The stretch itself. Reels grew taller, left to right and depth first.
//
// THIS IS HOW PER-SPIN HEIGHT REACHES THE CLIENT AT ALL. The generated config's
// `numRows` is written once at the end of the maths run and always reads
// [4,4,4,4,4]; every deviation from that baseline travels here.
//
// `rows` and `reelMultipliers` are FULL STATE, never a delta, for the reason
// the previous generation's blast event was: a resumed round rebuilds from the
// last event of each reserved type, so an event that only says what CHANGED
// cannot reconstruct a board on its own. `newCells` is the delta — material that
// was not on screen a moment ago — and the client needs both, one to size the
// reel and one to fill the part that just appeared.
type BookEventGrowReels = {
	index: number;
	type: 'growReels';
	/** Every reel's height after the stretch, 4..6. Always the full array. */
	rows: number[];
	/** Cells that appeared, ascending by row, in padded-board indices. */
	newCells: { reel: number; row: number; symbol: SymbolName }[];
	/**
	 * Per-reel scoring multiplier, 1 or 2. A stretched reel counts double, and
	 * only in the free game. Derivable from `rows` plus the game type, and sent
	 * anyway: this is what the ways figure on screen is built from.
	 */
	reelMultipliers: number[];
	/** Steps spent, 0..maxSteps. Presentation only — the silhouette is the meter. */
	steps: number;
	maxSteps: number;
	/** True in the free game, where the board keeps its height between spins. */
	sticky: boolean;
};

// GoBananas hold and spin: new prize symbols stick to the board (prize in cents)
type BookEventNewStickySymbols = {
	index: number;
	type: 'newStickySymbols';
	newPrizes: { reel: number; row: number; prize: number }[];
};

// GoBananas hold and spin: final evaluation of all sticky prizes (amounts in cents)
type BookEventPrizeWinInfo = {
	index: number;
	type: 'prizeWinInfo';
	totalWin: number;
	wins: { reel: number; row: number; prize: number }[];
};

type BookEventWincap = {
	index: number;
	type: 'wincap';
	amount: number;
};

// customised
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
	| BookEventUpdateGlobalMult
	| BookEventWincap
	| BookEventCreateBonusSnapshot
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	// customised
	| BookEventGrowMarkers
	| BookEventGrowReels
	// Both of these were DECLARED above and left out of this union, which meant
	// the two handlers that drive the whole hold-and-spin round narrowed to
	// `never` — newPrizes, wins and totalWin were all unchecked. The maths emits
	// newStickySymbols 2,244 times and prizeWinInfo 353 times in a 400-book
	// hold and spin sample, so this was not a dead branch. It was the live one, with
	// the type checker switched off over it, and nothing said so because
	// `vite build` does not type-check.
	//
	// BookEventCreateBonusSnapshot used to appear here twice, which is the same
	// mistake in the other direction and is what hid the two missing ones.
	| BookEventNewStickySymbols
	| BookEventPrizeWinInfo;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
