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
 * One Vault Frame.
 *
 * `reel`/`row` are the TOP-LEFT anchor and `size` is the side length in cells,
 * so a size-3 frame at reel 1 row 1 covers reels 1-3 and rows 1-3. `mult` is a
 * plain multiplier (2..100), not a x100-scaled amount - frames multiply a win,
 * they are not a money value, and one frame carries ONE value however many
 * cells it covers.
 *
 * Rows arrive padded (the math shifts them by one for the padding symbol);
 * reels do not, because there is no padding column.
 */
export type FrameEntry = { reel: number; row: number; size: number; mult: number };

// Vault Frames landing this spin.
type BookEventNewFrames = {
	index: number;
	type: 'newFrames';
	frames: FrameEntry[];
};

// Sticky frames carried into this spin with their current multiplier. In the
// Soldier tier these values are re-rolled between spins.
type BookEventUpdateFrames = {
	index: number;
	type: 'updateFrames';
	frames: FrameEntry[];
};

// Capo / Don: frames that took part in a win double afterwards. A frame doubles
// once however many of its cells the win crossed.
type BookEventFrameDoubling = {
	index: number;
	type: 'frameDoubling';
	frames: FrameEntry[];
};

/**
 * Tommy Guns landed and filled their reels with Wilds.
 *
 * Arrives AFTER `reveal` and before any win event for the spin: the reveal
 * shows the board as dealt, guns and all, and this is the beat that turns
 * those reels wild. Scatters are never overwritten, so a reel can come back
 * wild with a Scatter still standing in it.
 *
 * `wilds` is one entry per gun - the reel that filled and the row the gun
 * itself landed on, so the muzzle flash starts in the right cell. `reels` is
 * the deduplicated set of filled reels, which is all the column effect needs.
 */
type BookEventWildExpand = {
	index: number;
	type: 'wildExpand';
	wilds: { reel: number; row: number }[];
	reels: number[];
};

// Which free-spin tier was entered, and how many frames it seeds.
type BookEventBonusTier = {
	index: number;
	type: 'bonusTier';
	tier: BonusTier;
	seedFrames: number;
};

export type BonusTier = 'soldier' | 'capo' | 'don';

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
	| BookEventWildExpand
	| BookEventBonusTier
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	// customised
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
