import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position, BellTier } from './types';

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

// ── Moooo's own events ───────────────────────────────────────────────────────
//
// Emitted by math-sdk/games/moooo/game_events.py. Bell values are plain
// multipliers (2..100), NOT x100-scaled amounts — a bell multiplies a win, it is
// not a money value. Rows are already shifted for the padding row, so they index
// the client board directly.

// Cows that landed this spin, before any mouth has opened. Separate from
// `expandCows` on purpose: the client plays "cow lands" and "mouth opens" as two
// beats, and the gap between them is the anticipation.
type BookEventNewCows = {
	index: number;
	type: 'newCows';
	cows: { reel: number; row: number; tier: BellTier; mult: number }[];
};

// Cows whose reel crossed a win line and so filled their reel.
//
// A cow present in `newCows` but ABSENT here landed and stayed a single symbol —
// that is the reference's conditional-expansion rule, and it is 42% of them, so
// it is a normal outcome and not a failure state. Do not dim or grey those; on a
// dead spin the cow is the only thing happening.
type BookEventExpandCows = {
	index: number;
	type: 'expandCows';
	reels: { reel: number; tier: BellTier; mult: number }[];
	totalMultiplier: number;
};

// Starting state of every reel's Milk Meter as the feature opens.
type BookEventMilkMeterInit = {
	index: number;
	type: 'milkMeterInit';
	levels: number[];
	maxLevel: number;
	superMode: boolean;
	spins: number;
};

// Reels whose meter advanced this spin, plus the full resulting state.
//
// Both halves are load-bearing: `changed` is what to animate, `levels` is what
// to draw. Rendering from the delta alone would make every meter a running total
// the client has to reconstruct, and one dropped event would desync the display
// from the maths for the rest of the round.
type BookEventMilkMeterUpdate = {
	index: number;
	type: 'milkMeterUpdate';
	changed: { reel: number; level: number }[];
	levels: number[];
	maxLevel: number;
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
	| BookEventNewCows
	| BookEventExpandCows
	| BookEventMilkMeterInit
	| BookEventMilkMeterUpdate
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	// customised
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
