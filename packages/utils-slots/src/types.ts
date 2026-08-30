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
	/**
	 * How fast an ANTICIPATED reel travels, if it should differ from
	 * `reelSpinSpeed`.
	 *
	 * A tease built only out of extra distance is a wait; a tease built out of
	 * speed is tension. The reference spec this came from (Hacksaw's The Luxe,
	 * `attentionSpeed` 10 against `speed` 20) halves it, and pairs that with a
	 * five-times-longer stop.
	 *
	 * Optional and unset by default: an app that does not set it spins its
	 * anticipated reels at exactly the speed it did before.
	 */
	reelSpinSpeedAnticipated?: number;
	/**
	 * Start the symbols' landing animation at the moment of IMPACT rather than
	 * after the reel has finished bouncing back.
	 *
	 * The default order is: slide down, flip to 'bouncing', fire onSpinFinishing
	 * (which is where the reel-stop click plays), run the bounce-back, and only
	 * then put the symbols into 'land'. The bounce is
	 * `symbolHeight * reelBounceSizeMulti / reelBounceBackSpeed` — on Hot Miami
	 * 35.4px at 0.15px/ms, or 236ms — so the symbol reacts a quarter of a second
	 * after the reel arrives and after the sound has already played.
	 *
	 * Measured on all five reels before this existed: 265-269ms between the reel
	 * stopping and the squash starting, every time.
	 *
	 * Optional and false by default: an app that does not set it keeps the
	 * original order exactly.
	 */
	landOnImpact?: boolean;
	/**
	 * Keep the reel-by-reel stagger in turbo instead of dropping all five reels
	 * together.
	 *
	 * Turbo normally does three things at once: it skips the per-reel start
	 * delay, it gives every reel the same travel distance (padding + 0 rather
	 * than accumulating), and it skips the slide entirely on a reel that was
	 * already pre-spinning. Together those make the board land as one block,
	 * which is what turbo is for in the base game.
	 *
	 * Inside a bought or triggered feature the same thing reads as the feature
	 * being over before it started - ten free spins land as ten single thuds.
	 * With this set, turbo stays fast (its own speeds still apply) but the reels
	 * still arrive one after another.
	 *
	 * Optional and falsy by default: every app that does not set it spins
	 * exactly as before.
	 */
	reelStaggerInTurbo?: boolean;
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
