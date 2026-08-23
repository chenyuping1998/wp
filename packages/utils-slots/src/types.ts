import type { FirstArgOf } from 'utils-shared/types';

import type { createReelForSpinning } from './createReelForSpinning.svelte';
import type { createReelForCascading } from './createReelForCascading.svelte';

export type SpinType = 'normal' | 'fast' | 'anticipated';

export type SpinningReelSpinOptions = {
	// speed (pixel / ms)
	reelPreSpinSpeed: number;
	reelBounceBackSpeed: number;
	reelSpinSpeed: number;
	reelSpinSpeedBeforeBounce: number;
	// size
	reelBounceSizeMulti: number;
	// extra padding
	reelPaddingMultiplierNormal: number;
	reelPaddingMultiplierAnticipated: number;
	reelSpinDelay: number;
};

export type CascadingReelSpinOptions = {
	// speed (pixel / ms) and intervals(ms) between reels/symbols
	symbolFallInSpeed: number;
	symbolFallInInterval: number;
	symbolFallInBounceSpeed: number;
	symbolFallInBounceSizeMulti: number;
	symbolFallOutSpeed: number;
	symbolFallOutInterval: number;
	// reel
	reelFallInDelay: number;
	// extra padding
	reelPaddingMultiplierNormal: number;
	reelPaddingMultiplierAnticipated: number;
	reelFallOutDelay: number;
};

type ReelCreateOptions<TRawSymbol extends object, TSymbolState extends string> = {
	initialSymbols: TRawSymbol[];
	initialSymbolState: TSymbolState;
	reelIndex: number;
	symbolHeight: number;
	onReelStopping: () => void;
	/**
	 * Fired for every symbol on the reel as it lands - which includes the padding
	 * symbols above and below the visible window. `symbolIndex` is that symbol's
	 * position in the reel array (0 is the top padding), so a caller that only
	 * cares about what the player can actually see is able to say so.
	 */
	onSymbolLand: (args: { rawSymbol: TRawSymbol; symbolIndex: number }) => void;
	/**
	 * Symbols per reel, when that can change between spins (Margin Call grows the
	 * board from 3 rows to 5 for its feature game). Omit it and the reel behaves
	 * exactly as before: fixed at initialSymbols.length, resolved once.
	 *
	 * The value is padding-inclusive - it is the number of symbols the reel holds,
	 * not the number of visible rows.
	 */
	getReelLength?: () => number;
	/**
	 * Whether the stop button is allowed to cut short an anticipation tease on
	 * this reel. Omit it and the reel behaves exactly as before: a reel marked
	 * `noStop` - which is every reel from the first anticipated one onward - runs
	 * its slide to the end and ignores `stop()` entirely.
	 *
	 * A tease is deliberately slow, and on a tall board with several anticipated
	 * reels it can run for many seconds. A player with no way to shorten it reads
	 * that as a hung round rather than as suspense, so a game whose maths teases
	 * often can opt into letting the stop button through.
	 */
	getAnticipationIsStoppable?: () => boolean;
};

export type SpinningReelCreateOptions<
	TRawSymbol extends object,
	TSymbolState extends string,
> = ReelCreateOptions<TRawSymbol, TSymbolState>;

export type CascadingReelCreateOptions<
	TRawSymbol extends object,
	TSymbolState extends string,
> = ReelCreateOptions<TRawSymbol, TSymbolState>;

export type SpinningReel<TRawSymbol extends object, TSymbolState extends string> = ReturnType<
	typeof createReelForSpinning<TRawSymbol, TSymbolState>
>;
export type CascadingReel<TRawSymbol extends object, TSymbolState extends string> = ReturnType<
	typeof createReelForCascading<TRawSymbol, TSymbolState>
>;

export type Reel<TRawSymbol extends object, TSymbolState extends string> =
	| SpinningReel<TRawSymbol, TSymbolState>
	| CascadingReel<TRawSymbol, TSymbolState>;

export type FallOptionsTurbo = {
	fallInSpeedTurbo: number;
	fallInIntervalTurbo: number;
	fallInBounceTurbo: number;
	fallInBounceDistanceTurbo: number;

	fallOutSpeedTurbo: number;
	fallOutIntervalTurbo: number;
};

export type GetRawSymbolFromReel<TReel extends Reel<any, any>> = NonNullable<
	FirstArgOf<TReel['setSymbolsWithRawSymbols']>
>[number];
