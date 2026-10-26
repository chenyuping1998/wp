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
//     not applied per win; it arrives once per spin in medusaThrow, after the
//     tumbling has finished.
//
//  4. A spin's tumble sequence closes with medusaThrow (if she threw),
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
 * Medusa threw after the tumbling finished (SPEC 3).
 *
 * `multipliers` is everything she threw this spin: always one in the base game,
 * one to three in the free game. `applied` is true only when the spin had a
 * tumble win; otherwise every orb is wasted and nothing changes.
 *
 * `mult` is what the spin win was scaled by. Base game: the thrown value when
 * applied, 1 when not. Free game: the running total AFTER this throw joined it
 * when applied, the unchanged previous total when not. `baseWin` -> `totalWin`
 * is the spin's tumble win before and after (equal when not applied).
 */
type BookEventMedusaThrow = {
	index: number;
	type: 'medusaThrow';
	multipliers: number[];
	applied: boolean;
	mult: number;
	baseWin: number;
	totalWin: number;
};

/** 4+ Aegis on the board when the chain ended: their own pay, never multiplied. */
type BookEventScatterWin = {
	index: number;
	type: 'scatterWin';
	count: number;
	amount: number;
	positions: Position[];
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
	| BookEventMedusaThrow
	| BookEventScatterWin
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
