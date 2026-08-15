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

// Hot Miami free-game: a Wild lands and expands to fill its reel (sticky).
// Neon Frames landing this spin. `mult` is a plain multiplier (2..100), not a
// x100-scaled amount - frames multiply a win, they are not a money value.
type BookEventNewFrames = {
	index: number;
	type: 'newFrames';
	frames: { reel: number; row: number; mult: number }[];
};

// Sticky frames carried into this spin with their current multiplier. In the
// Neon Nights tier these values are re-rolled between spins.
type BookEventUpdateFrames = {
	index: number;
	type: 'updateFrames';
	frames: { reel: number; row: number; mult: number }[];
};

// Sunset Hits / Ocean Drive: frames that took part in a win double afterwards.
type BookEventFrameDoubling = {
	index: number;
	type: 'frameDoubling';
	frames: { reel: number; row: number; mult: number }[];
};

// Collector swept every frame on the board. `amount` is x100-scaled like all
// other book amounts; `totalMultiplier` is the raw sum of the frame values.
type BookEventCollectorWin = {
	index: number;
	type: 'collectorWin';
	position: { reel: number; row: number };
	frames: { reel: number; row: number; mult: number }[];
	totalMultiplier: number;
	amount: number;
};

// Which free-spin tier was entered, and how many frames it seeds.
type BookEventBonusTier = {
	index: number;
	type: 'bonusTier';
	tier: 'neon_nights' | 'sunset_hits' | 'ocean_drive';
	seedFrames: number;
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
	| BookEventNewFrames
	| BookEventUpdateFrames
	| BookEventFrameDoubling
	| BookEventCollectorWin
	| BookEventBonusTier
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	// customised
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
