/**
 * Every timing beat of the Neon Frame mechanic, in one place, in milliseconds.
 *
 * These were scattered through Searchlights.svelte as bare `scaled(260)` calls,
 * which meant tuning the feel required reading the whole component first. The
 * mechanic is a clone of Hacksaw's The Luxe (Golden Frames + Clover Crystal),
 * so the intended rhythm is observable by playing that game — but it can only
 * be matched by someone who can actually watch both, since the dev preview pane
 * throttles rAF and makes on-screen timing unmeasurable from here.
 *
 * So: play the reference, change a number, rebuild, look. Nothing else in the
 * codebase needs to be understood to do that.
 *
 * All values are divided by `stateBetDerived.timeScale()` at use time, so turbo
 * halves them automatically. Do not pre-divide.
 */

export const FRAME_TIMING = {
	/** Frame pops in when it lands. Higher = heavier, more deliberate arrival. */
	entryMs: 260,

	/** Neon Nights re-rolls a sticky Frame's value: the pulse out, then back. */
	rerollOutMs: 160,
	rerollInMs: 160,

	/** Sunset Hits doubles a Frame's value: a bigger punch than a re-roll. */
	doubleOutMs: 200,
	doubleInMs: 200,

	/** The Collector badge scaling up as the sweep begins. */
	sweepOpenMs: 220,

	/** Frames charge (glow up) together before any of them flies. */
	sweepChargeMs: 260,

	/**
	 * Gap between consecutive Frames launching, so the counter climbs instead of
	 * jumping to the answer. Clamped between min and max; the target total is
	 * divided across however many Frames were swept.
	 */
	sweepStaggerTotalMs: 700,
	sweepStaggerMinMs: 60,
	sweepStaggerMaxMs: 150,

	/** One Frame's flight into the Collector. */
	sweepFlyMs: 420,

	/** The Collector's kick as each value lands on it. */
	sweepTickOutMs: 120,
	sweepTickInMs: 120,
	/** The swept Frame shrinking away as its value is absorbed. */
	sweepAbsorbMs: 180,

	/** Final punch on the authoritative total, then settle. */
	sweepTotalPunchMs: 220,
	sweepTotalSettleMs: 220,

	/** How long the finished total sits on screen before it clears. */
	sweepHoldMs: 560,

	/** The Collector badge scaling away at the end. */
	sweepCloseMs: 200,
} as const;

/**
 * When the Frames for a spin become visible.
 *
 * - `during-spin` — all of the spin's Frames appear before the reels are even
 *   awaited, floating over still-spinning columns. The player sees where the
 *   Frames will land while the reels are still running, and then watches the
 *   symbols arrive into them. **This is what the game uses.**
 * - `per-reel` — each reel's Frames appear as that reel comes to rest, so the
 *   Frame lands with its symbol and the board fills left to right. This is what
 *   the reference game does: a screenshot of The Luxe's demo caught mid-spin
 *   (2026-08-09) showed Golden Frames already drawn on reels 1, 3 and 4 while
 *   reel 5 was still visibly in motion.
 * - `on-stop` — the original behaviour: nothing appears until every reel has
 *   stopped, one beat after the landing.
 *
 * Why `during-spin` and not the reference's `per-reel`: matching The Luxe was
 * the goal while the mechanic was being built, but it is not the goal now. Under
 * `per-reel` a Frame cannot appear before its own reel has stopped, so on the
 * last reel it arrives at the very end of the spin and there is nothing left to
 * anticipate. Revealing the whole set up front turns the spin itself into the
 * suspense — the Frames are on the board and the question is what lands in them,
 * which is the mechanic's actual question.
 *
 * The two modes are one constant apart and both are live code paths, so this is
 * cheap to put back.
 */
export const FRAME_REVEAL: 'per-reel' | 'during-spin' | 'on-stop' = 'during-spin';

/**
 * When a spin's Frames are cleared.
 *
 * - `end-of-spin` — cleared on `updateFreeSpin`, the last event of every free
 *   spin, so the board is already empty before the next spin's reels move.
 * - `next-spin` — the original behaviour: nothing cleared them, so sticky Frames
 *   sat on the grid continuously and only appeared to change when the following
 *   spin re-stated them.
 */
export const FRAME_CLEAR: 'end-of-spin' | 'next-spin' = 'end-of-spin';
