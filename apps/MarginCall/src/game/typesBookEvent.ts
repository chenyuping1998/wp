import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position, LeverageHit } from './types';

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

// Ways wins: `positions` covers every symbol that took part, across the winning
// reels, so there is no line to draw - the symbols themselves are the win.
type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		kind: number;
		win: number;
		positions: Position[];
		meta: {
			// number of ways this symbol paid on
			ways: number;
			// the leverage meter applied to this win (1 in the basegame)
			globalMult: number;
			winWithoutMult: number;
			symbolMult: number;
		};
	}[];
};

// Margin Call: the feature board grows two rows on every reel. Sent once, after
// freeSpinTrigger and before the first feature reveal.
type BookEventBoardExpand = {
	index: number;
	type: 'boardExpand';
	numRows: number[];
	gameType: GameType;
};

// Margin Call: LEVERAGE symbols that landed this spin and the resulting running
// meter. Sent after the reveal and before the winInfo it applies to.
type BookEventLeverageUpdate = {
	index: number;
	type: 'leverageUpdate';
	added: LeverageHit[];
	totalAdded: number;
	leverage: number;
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
	| BookEventBoardExpand
	| BookEventLeverageUpdate
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
