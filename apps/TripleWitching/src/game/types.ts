import { type SpinningReelSymbolState } from 'utils-slots';
import type config from './config';

export type SymbolName = keyof typeof config.symbols;
export type RawSymbol = {
	name: SymbolName;
	scatter?: boolean;
	wild?: boolean;
	// CONTRACT symbols carry their value here. The math registers W under
	// special_symbols["multiplier"], so every W has one - it is a neutral 1
	// everywhere except a feature running the M modifier, where it is x2 to x25.
	multiplier?: number;
};
export type BetMode = keyof typeof config.betModes;
export type GameType = keyof typeof config.paddingReels;

// The three feature modifiers. A feature runs one, two or all three of them,
// drawn once at the trigger and held for the whole run.
//
//   expand  the board grows to 5 rows - 40 paylines under lines, 3125 ways
//   mult    every CONTRACT that lands carries a multiplier, summed per spin
//   ways    wins are evaluated as ways instead of paylines
export const FEATURE_NAMES = ['expand', 'mult', 'ways'] as const;
export type FeatureName = (typeof FEATURE_NAMES)[number];

// Which evaluation the current board is being paid under. The basegame is
// always 'lines'; a feature is 'ways' only while the W modifier is active.
export type EvalType = 'lines' | 'ways';

export const SYMBOL_STATES = ['static', 'spin', 'land', 'win', 'postWinStatic'] as const;

export type SymbolState = SpinningReelSymbolState | (typeof SYMBOL_STATES)[number];

export type Position = {
	reel: number;
	row: number;
};

// A CONTRACT symbol that landed this spin, in board coordinates with the
// padding offset already applied by the math (visible rows are 1..rows).
export type MultiplierWildHit = Position & { value: number };
