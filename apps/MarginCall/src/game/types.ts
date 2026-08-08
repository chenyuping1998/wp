import { type SpinningReelSymbolState } from 'utils-slots';
import type config from './config';

export type SymbolName = keyof typeof config.symbols;
export type RawSymbol = {
	name: SymbolName;
	scatter?: boolean;
	wild?: boolean;
	// LEVERAGE symbols carry their value here. The math registers W under
	// special_symbols["multiplier"], so every W has one - it is a neutral 1 in
	// the basegame and +1/+2/+3/+5/+10 in the feature game.
	multiplier?: number;
};
export type BetMode = keyof typeof config.betModes;
export type GameType = keyof typeof config.paddingReels;

export const SYMBOL_STATES = ['static', 'spin', 'land', 'win', 'postWinStatic'] as const;

export type SymbolState = SpinningReelSymbolState | (typeof SYMBOL_STATES)[number];

export type Position = {
	reel: number;
	row: number;
};

// A LEVERAGE symbol that landed this spin, in board coordinates with the
// padding offset already applied by the math (visible rows are 1..rows).
export type LeverageHit = Position & { value: number };
