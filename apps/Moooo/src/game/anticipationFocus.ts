/**
 * Anticipation: how hard the board leans on the reel that is still spinning.
 *
 * Priority 3 of docs/handoff/moooo_ANIMATION.md ("停輪與聽牌"). The tease
 * already had a lit column, chevrons, a spotlight dim on the stopped reels and
 * a pitch ladder on the drone. What it did not have was the thing every
 * competitor does: the teasing reel is BROUGHT FORWARD — a beam behind it, its
 * symbols larger and brighter than the ones on the dead reels — so the eye is
 * pulled to it rather than merely informed that something is happening there.
 *
 * ── Why this is a table and not numbers inside the component ─────────────────
 *
 * The component's comments made three claims about escalation: that the full
 * tier is brighter than the low tier, that later reels pulse FASTER (an earlier
 * version had them getting slower, i.e. tension draining as the payoff
 * approached), and that the low tier is slower still. Those are exactly the
 * kind of claims that quietly stop being true after someone tweaks a constant.
 *
 * As pure functions they are checkable, and `design/check_anticipation.mjs`
 * checks them: it is the same argument as `symbolWinMotion.ts` and
 * `symbolLandMotion.ts` — put the numbers where a script can read them, and the
 * property the comment asserts becomes a gate instead of a hope.
 *
 * No imports, for the same reason as the two motion tables: a plain node script
 * has to be able to load this.
 */

/**
 * Anticipation tiers. `magnitude` comes from `stateGame.anticipation[reel]`:
 *
 *   1   two scatters are down — this reel COULD still trigger
 *   2+  three or more are already down — the trigger is banked and this reel is
 *       spinning for a bigger tier
 *
 * Two tiers, not a ramp, so a player can tell them apart at a glance.
 */
export const isFullTier = (magnitude: number | undefined) => (magnitude ?? 2) >= 2;

/** Overall strength of the floodlit column, 0..1. */
export const tierIntensity = (magnitude: number | undefined) => (isFullTier(magnitude) ? 1 : 0.45);

/**
 * Sine period of the column pulse in ms — SMALLER IS FASTER.
 *
 * Drops with reel index so the tease gets more urgent as it walks right, and the
 * low tier runs slower than the full tier at every reel. Both of those are
 * asserted by the gate; an earlier version of this had the period RISING with
 * reel index, so tension fell away exactly as the payoff approached, and nothing
 * caught it.
 */
export const pulseRateMs = (reelIndex: number, magnitude: number | undefined) =>
	(165 - reelIndex * 16) * (isFullTier(magnitude) ? 1 : 1.35);

/**
 * How much the symbols on the teasing reel are lifted out of the board:
 * `scale` multiplies their size, `bloom` is the alpha of an additive copy of
 * their own art.
 *
 * Deliberately small. This runs on symbols that are BLURRED AND SCROLLING, and
 * the reel is already framed by a lit column — the job is to make the reel feel
 * closer to the player, not to make individual symbols legible mid-spin. Above
 * about 1.1 they start clipping into the neighbouring column, which reads as a
 * bug rather than as emphasis.
 */
export const symbolFocus = (magnitude: number | undefined) =>
	isFullTier(magnitude) ? { scale: 1.075, bloom: 0.18 } : { scale: 1.035, bloom: 0.08 };

/**
 * The beam behind the teasing column: a shaft of light that travels DOWN the
 * reel and repeats, so the column reads as being lit from somewhere rather than
 * as a static wash. `t` is ms since the tease started.
 *
 * Returns the beam's centre as a fraction of board height (0 = top rail, 1 =
 * bottom rail) and its alpha. The travel period shortens with the tier, which
 * is the same escalation the pulse carries and the gate checks it too.
 */
export const beamAt = (t: number, magnitude: number | undefined) => {
	const period = isFullTier(magnitude) ? 900 : 1400;
	const u = (t % period) / period;
	return {
		/** 0..1 down the board */
		y: u,
		/** brightest in the middle of the travel, gone at the ends */
		alpha: Math.sin(Math.PI * u) * (isFullTier(magnitude) ? 0.5 : 0.22),
		/** the shaft narrows as it accelerates away */
		height: 0.42 - 0.14 * u,
	};
};
