import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

/**
 * One wide reel of the reveal. A group of `size` adjacent reels, starting at
 * `reel`, spun as one strip of `size` x `size` symbols; the first symbol's top
 * `offset` rows are cut off by the board's top edge. `size` 1 is an ordinary
 * reel (six symbols, offset 0). The client draws big symbols from this; the
 * 36-cell `board` is what positions and lines index into.
 */
export type RevealBar = {
	reel: number;
	size: number;
	offset: number;
	symbols: RawSymbol[];
};

type BookEventReveal = {
	index: number;
	type: 'reveal';
	/** board[reel][row], 6 x 6, no padding rows; a block repeats its symbol in every cell */
	board: RawSymbol[][];
	bars: RevealBar[];
	paddingPositions: number[];
	/** always zeros: this game has no anticipation */
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
	/** every castle cell on the board (a 2x2 castle is four entries) */
	positions: Position[];
};

type BookEventUpdateFreeSpin = {
	index: number;
	type: 'updateFreeSpin';
	/** 1-based spin number (the reference books count from 1) */
	amount: number;
	total: number;
};

/** +3 spins from a ladder step. Not scatter-driven: `positions` is always empty. */
type BookEventFreeSpinRetrigger = {
	index: number;
	type: 'freeSpinRetrigger';
	totalFs: number;
	positions: Position[];
};

/** The ladder: 1 at feature entry, then 2 / 3 / 5 / 8 / 12 as points reach each 12. */
type BookEventUpdateGlobalMult = {
	index: number;
	type: 'updateGlobalMult';
	globalMult: number;
};

type BookEventSetWin = {
	index: number;
	type: 'setWin';
	amount: number;
	/** 1 regular, 2 BIG, 3 SUPER, 4 MEGA, 5 EPIC (bet multiples 25 / 50 / 100 / 200) */
	winLevel: number;
};

type BookEventFreeSpinEnd = {
	index: number;
	type: 'freeSpinEnd';
	amount: number;
	/** same five levels as setWin, on the feature's total */
	winLevel: number;
};

type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		/** the paying symbol; 'W' only when all six are WILD */
		symbol: SymbolName;
		kind: number;
		/** book units, already multiplied by the ladder */
		win: number;
		positions: Position[];
		meta: {
			lineIndex: number;
			/** the ladder multiplier applied to this line (1 in the base game) */
			multiplier: number;
			winWithoutMult: number;
			globalMult: number;
			lineMultiplier: number;
		};
	}[];
};

/**
 * One person block the character tried to convert. `row` is the block's top
 * row and is negative when the block is cut by the top edge. `success` blocks
 * are already WILD in the reveal's `board` and `bars`.
 */
export type WildTransferPosition = {
	reel: number;
	row: number;
	size: number;
	symbol: SymbolName;
	success: boolean;
};

/**
 * The conversion. Follows the reveal directly, so the client knows at spin
 * start that this spin converts: the cast raises its hand 0.4 s in, the
 * swarm covers every person cell after the reels stop, and each cell is
 * revealed as a WILD card or a failure mark. Base game: only sent when at
 * least one block succeeded. Free game: every spin with a person on the board.
 */
type BookEventWildTransfer = {
	index: number;
	type: 'wildTransfer';
	positions: WildTransferPosition[];
};

/**
 * Free game: every WILD cell on the final board becomes a point. `points` is
 * the running total (the vial shows points mod 12); `positions` are the WILD
 * cells, reel-major, for the orbs that fly to the vial.
 */
type BookEventBloodPoints = {
	index: number;
	type: 'bloodPoints';
	added: number;
	points: number;
	positions: Position[];
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
	| BookEventWildTransfer
	| BookEventBloodPoints
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	// customised
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
