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
		// Ways, not lines. src/calculations/ways.py emits exactly these four:
		// there is no lineIndex here because there is no line — `ways` is the
		// product of the per-reel counts, and it is the number the player is
		// shown ("240 WAYS"), not a payline id.
		meta: {
			ways: number;
			globalMult: number;
			winWithoutMult: number;
			symbolMult: number;
		};
	}[];
};

// A Dynamite landed and detonated. Every cell on the covered reels becomes one
// symbol — the highest-paying one that was already standing on the reel the
// dynamite was on.
//
// Emitted AFTER the reveal, which carries the board the reels stopped on. That
// Go Bananas Boat: every tarped crate on the board is uncovered at once, and
// they all hold the same symbol.
//
// Emitted AFTER the reveal, whose board still carries the crates - so the client
// shows the covered board, plays the tarps coming off, then swaps the listed
// cells. Same ordering the blast this replaced relied on, and for the same
// reason: rewrite before the reveal and there is nothing to animate FROM.
//
// `positions` is every crate that opened on this spin, and there is nothing else
// to send: crates do not persist between spins. An earlier version held them for
// the rest of the run and needed a second list carrying the whole hold, because
// a client given only the delta cannot redraw a cell opened three spins ago on a
// resumed round. With nothing persisting, this spin's list IS the whole story.
//
// `runCargo` is true once the run's shipment is fixed, so the client can stop
// re-announcing the same symbol on every spin of a feature.
// Go Bananas Boat: the whole hold comes up — every free cell on the board is a
// crate. Emitted BEFORE `reveal`, so the client gets the beat before the board
// it explains; see full_shipment_event in the maths. Carries no data on purpose:
// `reveal` already carries the board, and a second copy is a thing that can
// disagree with the first.
type BookEventFullShipment = {
	index: number;
	type: 'fullShipment';
};

// Go Bananas Boat: this Free Spins round's multiplier, x1-x5, drawn once at the
// top of the round and applied to every win in it (each win also carries it as
// meta.globalMult — the amounts in the book are already multiplied). Emitted
// after freeSpinTrigger and before the first spin; see freegame_multiplier_event
// in the maths.
type BookEventFreeGameMultiplier = {
	index: number;
	type: 'freeGameMultiplier';
	multiplier: number;
};

type BookEventMysteryReveal = {
	index: number;
	type: 'mysteryReveal';
	symbol: SymbolName;
	positions: Position[];
	runCargo: boolean;
};

// GoBananas hold and spin: new prize symbols stick to the board (prize in cents)
type BookEventNewStickySymbols = {
	index: number;
	type: 'newStickySymbols';
	newPrizes: { reel: number; row: number; prize: number }[];
};

// GoBananas hold and spin: final evaluation of all sticky prizes (amounts in cents)
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
	| BookEventMysteryReveal
	| BookEventFullShipment
	| BookEventFreeGameMultiplier
	// Both of these were DECLARED above and left out of this union, which meant
	// the two handlers that drive the whole hold-and-spin round narrowed to
	// `never` — newPrizes, wins and totalWin were all unchecked. The maths emits
	// newStickySymbols 2,244 times and prizeWinInfo 353 times in a 400-book
	// hold and spin sample, so this was not a dead branch. It was the live one, with
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
