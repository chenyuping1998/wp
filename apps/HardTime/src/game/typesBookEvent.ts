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

/**
 * One cell a searchlight beam is shining on.
 *
 * `mult` is a plain multiplier, not a x100-scaled amount — a lit cell multiplies
 * a win, it is not a money value.
 *
 * The value lives PER CELL, not per beam, and that is forced by the rules rather
 * than chosen for convenience: when a second light lands on a reel that is
 * already lit, only the OVERLAPPING cells double, so one beam can hold two
 * different multipliers at once. Capo Nostra's `FrameEntry` carried one `mult`
 * for a whole frame and could not have represented this.
 *
 * Rows arrive padded (the math shifts them by one for the padding symbol);
 * reels do not, because there is no padding column.
 */
export type LitCell = {
	reel: number;
	row: number;
	mult: number;
	/**
	 * True when this cell was ALREADY lit and the arriving beam doubled it;
	 * false when the beam lit it for the first time.
	 *
	 * The board shows the same number either way and they are completely
	 * different events to watch — "this cell just lit at 8x" versus "this cell
	 * was at 8x and a second beam took it to 16x". The presentation has to be
	 * told which happened; it cannot infer it.
	 */
	doubled: boolean;
};

/** One searchlight: where it landed, what it carried, and the beam it cast. */
export type SearchlightBeam = {
	/** The reel the light landed on — the beam runs down this reel. */
	reel: number;
	/** The row the light itself landed on. The beam starts here. */
	row: number;
	/** The multiplier this light carried. Fresh cells take it; doubled cells do not. */
	mult: number;
	/** Every cell the beam covers, top to bottom, with its RESULTING value. */
	cells: LitCell[];
};

/**
 * Searchlights landed this spin and swept their reels.
 *
 * Arrives AFTER `reveal` and before any win event: the reveal shows the board as
 * dealt with the searchlight symbols sitting where they landed, and this is the
 * beat where the beams travel down and the cells turn Wild. Scatters are never
 * overwritten, so a lit reel can come back with a Scatter still standing in it.
 *
 * One entry per light, in landing order, so two lights in one spin play as two
 * beats rather than one simultaneous flash.
 */
type BookEventSearchlight = {
	index: number;
	type: 'searchlight';
	lights: SearchlightBeam[];
	/** Deduplicated set of reels that lit, which is all the column effect needs. */
	reels: number[];
};

/**
 * Sticky beams carried into this spin, with their current multipliers.
 *
 * Feature only — base-game beams clear between spins, so this never appears
 * outside a feature. Emitted BEFORE the reveal so the player sees what survived
 * from last spin before anything doubles it.
 */
type BookEventUpdateLights = {
	index: number;
	type: 'updateLights';
	cells: Omit<LitCell, 'doubled'>[];
};

// Which free-spin tier was entered, and how many searchlights it opens with.
type BookEventBonusTier = {
	index: number;
	type: 'bonusTier';
	tier: BonusTier;
	seedLights: number;
};

export type BonusTier = 'lockdown' | 'riot' | 'breakout';

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
	| BookEventSearchlight
	| BookEventUpdateLights
	| BookEventBonusTier
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	// customised
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
