import type { BetType } from 'rgs-requests';

import type {
	SymbolName,
	RawSymbol,
	GameType,
	Position,
	MultiplierWildHit,
	FeatureName,
	EvalType,
} from './types';

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

// A win, under either evaluation. `positions` covers every symbol that took
// part, and is the only field the presentation needs: under ways the symbols
// themselves are the win, and under lines they are the cells along the paying
// line. `meta` is what differs, and it is a discriminated union rather than one
// wide object so that reading `ways` off a line win is a type error instead of
// an undefined that reaches the screen.
type WaysWinMeta = {
	// number of ways this symbol paid on
	ways: number;
	// the multiplier applied to this win (1 when M is not active)
	globalMult: number;
	winWithoutMult: number;
	symbolMult: number;
};

type LinesWinMeta = {
	// which payline paid, 1-based, indexing config.paylines
	lineIndex: number;
	multiplier: number;
	winWithoutMult: number;
	globalMult: number;
	lineMultiplier: number;
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
		meta: WaysWinMeta | LinesWinMeta;
	}[];
};

export const isWaysWinMeta = (meta: WaysWinMeta | LinesWinMeta): meta is WaysWinMeta =>
	'ways' in meta;

// Triple Witching: which of the three modifiers this feature is running, sent
// once after freeSpinTrigger and before the first feature reveal.
//
// This is the only event that changes the board height or the evaluation type,
// and it never arrives mid-feature - the combination is drawn at the trigger and
// holds for the whole run, retriggers included. So the client switches mode once
// here and nothing downstream has to infer anything.
type BookEventFeatureSet = {
	index: number;
	type: 'featureSet';
	// 'E' expand, 'M' multiplier wilds, 'W' ways - always in that order
	combo: string;
	features: FeatureName[];
	numRows: number[];
	evalType: EvalType;
	// 0 under the evaluation that is not in use
	numLines: number;
	numWays: number;
	gameType: GameType;
};

// Triple Witching: the multiplier wilds that landed this spin, and the
// multiplier they add up to. Sent after the reveal and before the winInfo it
// applies to.
//
// `multiplier` is the total for THIS SPIN ONLY. Nothing accumulates - that is
// the one thing a Margin Call port gets wrong by default, because there the
// equivalent event carried a running meter.
type BookEventMultiplierWilds = {
	index: number;
	type: 'multiplierWilds';
	added: MultiplierWildHit[];
	multiplier: number;
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
	| BookEventFeatureSet
	| BookEventMultiplierWilds
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
