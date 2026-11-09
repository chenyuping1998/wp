import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

// ---------------------------------------------------------------------------
// Every shape here was checked against the real books
// (math-sdk/games/MedusaGaze梅杜莎凝視/library/publish_files), not the math source.
//
// Things worth knowing before wiring any of it up:
//
//  1. Row indices are padded everywhere: reveal boards, winInfo positions,
//     tumbleBoard.explodingSymbols, scatterWin and freeSpinTrigger positions all
//     carry the padded row (1..6 inside an 8-row column).
//
//  2. winInfo has no clusterSize. This is pay-anywhere: the paying count IS
//     positions.length, and the positions are scattered over the whole board.
//
//  3. meta.globalMult and meta.clusterMult are always 1. Medusa's multiplier is
//     not applied per win; it arrives once per spin in hypnoThrow, after the
//     tumbling has finished.
//
//  4. A spin's tumble sequence closes with hypnoThrow (if she threw),
//     scatterWin (if 4+ Aegis are on the board), setWin (if the spin paid) and
//     setTotalWin. All of them fire per spin, not per round.
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
 * One evaluation pass over the board. Every symbol that reached a paying count
 * is listed. `meta.overlay` is a central cell among the winning positions,
 * intended as the anchor for the amount readout.
 */
type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		win: number;
		positions: Position[];
		meta: {
			/** Always 1 in this game — see note 3 above. */
			globalMult: number;
			/** Always 1 in this game — see note 3 above. */
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
 *
 * newSymbols[reel][0] is the reel's NEW PADDING row, not a visible symbol — the
 * old padding symbol falls into the top visible cell. See design/check_tumble_rule.mjs.
 */
type BookEventTumbleBoard = {
	index: number;
	type: 'tumbleBoard';
	explodingSymbols: Position[];
	newSymbols: RawSymbol[][];
};

/**
 * Pearl settlement (reference game). Only on a spin with a tumble win and pearls on the board.
 * multInfo.positions: reveal order (reel left->right, row top->bottom; padded rows).
 * winInfo.boardMult: base game = eyeSum; free game = TOTAL after eyeSum joined it.
 * totalWin = tumbleWin x boardMult.
 */
type BookEventBoardMultiplierInfo = {
	index: number;
	type: 'boardMultiplierInfo';
	multInfo: { positions: (Position & { multiplier: number })[] };
	eyeSum: number;
	winInfo: { tumbleWin: number; boardMult: number; totalWin: number };
};

/** TOTAL MULTIPLIER of the free game (starts at 0, only pearls add). */
type BookEventUpdateGlobalMult = {
	index: number;
	type: 'updateGlobalMult';
	globalMult: number;
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
	| BookEventBoardMultiplierInfo
	| BookEventUpdateGlobalMult
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
