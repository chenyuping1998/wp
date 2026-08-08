import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

// ---------------------------------------------------------------------------
// Every shape here was taken from the real books, not from the math source:
//   scratchpad census over library/publish_files/books_{base,bonus}.jsonl.zst
//
// Four things worth knowing before wiring any of it up:
//
//  1. Row indices are padded EVERYWHERE in this game. reveal boards, winInfo
//     positions, tumbleBoard.explodingSymbols, boardMultiplierInfo positions and
//     freeSpinTrigger.positions all carry the padded row (1..5 inside a 7-row
//     column). Unlike the cluster game this was ported from, there is no
//     unpadded event to reconcile — the +1 shift is applied by the math for all
//     of them.
//
//  2. winInfo has NO clusterSize. This is pay-anywhere: the paying count IS
//     positions.length, and the positions are scattered over the whole board
//     rather than being connected.
//
//  3. meta.clusterMult is dead weight here and is always 1. It is the sum of
//     multiplier attributes sitting on the *winning* positions, and the only
//     symbol carrying one is M, which never pays. The tank multiplier arrives
//     separately, in boardMultiplierInfo, once the whole spin has finished
//     tumbling. Do not present clusterMult.
//
//  4. setTumbleWin does not exist in this game. A tumble sequence closes with
//     setWin (only when it paid) followed by setTotalWin, and both fire once per
//     spin — not once per round. In the bonus that is ~4 setWin events per book.
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
 * is listed — at most three at once, and 96% of the time exactly one.
 *
 * `win` already has the pressure gauge applied; `meta.winWithoutMult` is the
 * bare paytable value and `meta.globalMult` the gauge reading it was multiplied
 * by. `meta.overlay` is a central cell among the winning positions, intended as
 * the anchor for the amount readout.
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
 * The pressure gauge. Free game only.
 *
 * Emitted at the top of every free spin AND after every tumbleBoard, so the
 * stream stays one-to-one with the tumbles even when the value did not change.
 * A repeated value must not animate — compare before reacting.
 *
 * This is not a rare edge case: 68% of updateGlobalMult events carry the same
 * reading as the one before them, because most free spins do not tumble at all
 * and the top-of-spin emit simply repeats. Reacting to the event rather than to
 * a change makes the dial twitch on two thirds of all spins.
 *
 * The gauge does NOT reset between free spins. It carries for the whole feature
 * and only clears when the feature ends.
 */
type BookEventUpdateGlobalMult = {
	index: number;
	type: 'updateGlobalMult';
	globalMult: number;
};

/**
 * End of one free spin's tumbling: the Nitrogen Tanks still on the board.
 *
 * Only emitted when the spin paid AND at least one tank is present, so its
 * absence means "no tank spike", not "tanks worth 1x". `winInfo.boardMult` is
 * the SUM of the tank values (not a product), and `tumbleWin` -> `totalWin` is
 * the amount before and after it is applied.
 */
type BookEventBoardMultiplierInfo = {
	index: number;
	type: 'boardMultiplierInfo';
	multInfo: {
		positions: { reel: number; row: number; multiplier: number }[];
	};
	winInfo: {
		tumbleWin: number;
		boardMult: number;
		totalWin: number;
	};
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
	| BookEventUpdateGlobalMult
	| BookEventBoardMultiplierInfo
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
