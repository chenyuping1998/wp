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
		meta: {
			lineIndex: number;
			multiplier: number;
			winWithoutMult: number;
			globalMult: number;
			lineMultiplier: number;
		};
	}[];
};

// GoBananas free-game: a Wild lands and expands to fill its reel (sticky).
// row includes the padding offset (visible rows are 1..numRows).
type BookEventNewExpandingWilds = {
	index: number;
	type: 'newExpandingWilds';
	newWilds: { reel: number; row: number; mult: number }[];
};

// GoBananas free-game: sticky expanded wilds get a fresh multiplier on each reveal
type BookEventUpdateExpandingWilds = {
	index: number;
	type: 'updateExpandingWilds';
	existingWilds: { reel: number; row: number; mult: number }[];
};

// GoBananas superspin: new prize symbols stick to the board (prize in cents)
type BookEventNewStickySymbols = {
	index: number;
	type: 'newStickySymbols';
	newPrizes: { reel: number; row: number; prize: number }[];
};

// GoBananas superspin: final evaluation of all sticky prizes (amounts in cents)
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
	| BookEventNewExpandingWilds
	| BookEventUpdateExpandingWilds
	// Both of these were DECLARED above and left out of this union, which meant
	// the two handlers that drive the whole hold-and-spin round narrowed to
	// `never` — newPrizes, wins and totalWin were all unchecked. The maths emits
	// newStickySymbols 2,244 times and prizeWinInfo 353 times in a 400-book
	// superspin sample, so this was not a dead branch. It was the live one, with
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
