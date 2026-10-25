import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

// ---------------------------------------------------------------------------
// Every shape here was checked against the real books
// (math-sdk/games/Purrfia梅杜莎凝視/library/publish_files), not the math source.
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
//     tumbling has finished.
//
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


type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		win: number;
		positions: Position[];
		meta: {
			
			stampMult?: number;
			cellMult?: number;
			globalMult: number;
			
			clusterMult: number;
			winWithoutMult: number;
			overlay: Position;
		};
	}[];
};


type BookEventUpdateTumbleWin = {
	index: number;
	type: 'updateTumbleWin';
	amount: number;
};


type BookEventTumbleBoard = {
	index: number;
	type: 'tumbleBoard';
	explodingSymbols: Position[];
	newSymbols: RawSymbol[][];
};


type BookEventBoxOpen = { index:number; type:'boxOpen';symbol:SymbolName;boxes:(Position & {multiplier?:number})[] };
type BookEventCellMults = {index:number;type:'cellMults';cells:(Position & {mult:number})[]};


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
	| BookEventBoxOpen
	| BookEventCellMults
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
