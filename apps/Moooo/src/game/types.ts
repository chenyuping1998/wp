import { type SpinningReelSymbolState } from 'utils-slots';
import type config from './config';

export type SymbolName = keyof typeof config.symbols;
export type RawSymbol = {
	name: SymbolName;
	multiplier?: number;
	scatter?: boolean;
	wild?: boolean;
	churn?: boolean;
};

/**
 * The three bell tiers, in ladder order — the Milk Meter raises a reel's FLOOR
 * by index into this, so the order is load-bearing rather than cosmetic. Kept in
 * step with `TIERS` in math-sdk/games/moooo/game_config.py.
 *
 * Told apart by the colour of the bell around the cow's neck, and those three
 * metals appear nowhere else in the game: see docs/handoff/moooo_SYMBOLS.md.
 */
export const BELL_TIERS = ['pasture', 'prize', 'champion'] as const;
export type BellTier = (typeof BELL_TIERS)[number];
export type BetMode = keyof typeof config.betModes;
export type GameType = keyof typeof config.paddingReels;

export const SYMBOL_STATES = [
	'static',
	'spin',
	'land',
	'win',
	'postWinStatic',
	'explosion',
] as const;

export type SymbolState = SpinningReelSymbolState | (typeof SYMBOL_STATES)[number];

export type Position = {
	reel: number;
	row: number;
};
