import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

// ---------------------------------------------------------------------------
// Every shape here was taken from the real books, not from the math source:
//   scratchpad census over library/publish_files/books_{base,bonus}.jsonl.zst
//
// Two things worth knowing before wiring any of it up:
//
//  1. Row indices are NOT consistent between events. reveal boards, winInfo
//     positions, tumbleBoard.explodingSymbols and freeSpinTrigger.positions all
//     carry the padded row (1..7 inside a 9-row column). updateGrid's
//     gridMultipliers is the raw 7x7 grid with NO padding (0..6). See
//     GRID_ROW_OFFSET in constants.ts.
//
//  2. setTumbleWin does not exist in this game. A tumble sequence closes with
//     setWin (only when it paid) followed by setTotalWin, and both fire once per
//     spin — not once per round. In the bonus that is ~6 setWin events per book.
// ---------------------------------------------------------------------------

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

/**
 * One evaluation pass over the board. Every cluster that pays is listed; books
 * show up to 14 in a single event, of sizes 5 to 25.
 *
 * meta.clusterMult is the sum of the grid multipliers under the cluster (1 when
 * no position is activated, up to 265 observed). meta.overlay is the cluster's
 * central cell, intended as the anchor for the win amount readout.
 */
type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		clusterSize: number;
		win: number;
		positions: Position[];
		meta: {
			globalMult: number;
			clusterMult: number;
			winWithoutMult: number;
			overlay: Position;
		};
	}[];
};

/** Running total of the current tumble sequence, emitted after each winInfo. */
type BookEventUpdateTumbleWin = {
	index: number;
	type: 'updateTumbleWin';
	amount: number;
};

/**
 * Clear the winning cells and refill. explodingSymbols are the cells leaving
 * (padded rows); newSymbols is per reel, top-first, and is empty for reels that
 * lost nothing.
 */
type BookEventTumbleBoard = {
	index: number;
	type: 'tumbleBoard';
	explodingSymbols: Position[];
	newSymbols: RawSymbol[][];
};

/**
 * Free game only. The full 7x7 position-multiplier grid after the latest update.
 * gridMultipliers[reel][row] uses UNPADDED rows: add GRID_ROW_OFFSET to reach the
 * matching board row. 0 means the position has never won and is still cold.
 */
type BookEventUpdateGrid = {
	index: number;
	type: 'updateGrid';
	gridMultipliers: number[][];
};

type BookEventWincap = {
	index: number;
	type: 'wincap';
	amount: number;
};

// customised — synthesised by the client on reconnect, never sent by the math
type BookEventCreateBonusSnapshot = {
	index: number;
	type: 'createBonusSnapshot';
	bookEvents: BookEvent[];
};

export type BookEvent =
	| BookEventReveal
	| BookEventWinInfo
	| BookEventUpdateTumbleWin
	| BookEventTumbleBoard
	| BookEventUpdateGrid
	| BookEventSetTotalWin
	| BookEventFreeSpinTrigger
	| BookEventFreeSpinRetrigger
	| BookEventUpdateFreeSpin
	| BookEventWincap
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
