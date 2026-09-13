/**
 * Anticipation: how hard the board leans on the reel that is still spinning.
 *
 * Ported from Hot Miami (apps/HotMiami/src/game/anticipationFocus.ts) alongside
 * the stop-rhythm values in constants.ts — the two are one feature. The spin
 * options decide that the teasing reel SLOWS DOWN; this decides how obviously
 * the board says so.
 *
 * ── Why this is a table and not numbers inside the component ─────────────────
 *
 * The component's comments made claims about escalation that nothing checked.
 * Hot Miami found a version of exactly this where the pulse period ROSE with
 * reel index, i.e. tension drained away as the payoff approached, with a comment
 * next to it asserting the opposite. As pure functions the claims are
 * measurable, and `design/check_anticipation.mjs` measures them.
 *
 * No imports, deliberately: a plain node script has to be able to load this.
 */

/**
 * Anticipation tiers. `magnitude` comes from `stateGame.anticipation[reel]`,
 * which is (scatters landed before this reel) - 1, AFTER the gate in
 * bookEventHandlerMap has zeroed anything below 2:
 *
 *   2   three scatters are down — one more triggers
 *   3+  four are already down — the trigger is banked and this reel is spinning
 *       for the five-scatter tier
 *
 * The boundary is 3, not Hot Miami's 2, because the effective trigger differs:
 * Miami opens free spins on three scatters and this game on four (every
 * distribution forces scatter_triggers of {4,5} — see the note on
 * ANTICIPATION_MIN_SCATTERS). Copying Miami's boundary across would have put
 * every gated tease in the "banked" tier and the low tier would never occur.
 *
 * Two tiers, not a ramp, so a player can tell them apart at a glance.
 */
export const isFullTier = (magnitude: number | undefined) => (magnitude ?? 3) >= 3;

/** Overall strength of the lit column, 0..1. */
export const tierIntensity = (magnitude: number | undefined) => (isFullTier(magnitude) ? 1 : 0.45);

/**
 * Sine period of the column pulse in ms — SMALLER IS FASTER.
 *
 * Drops with reel index so the tease gets more urgent as it walks right, and the
 * low tier runs slower than the full tier at every reel. Both are asserted by
 * the gate.
 *
 * The inherited component had `145 + reelIndex * 11`, which rises — the pulse
 * got SLOWER on every reel further right, so the tease relaxed exactly as it
 * approached the reel that decides the round. That is the same fault Hot Miami
 * found in its own version and it is why this is checked rather than commented.
 */
export const pulseRateMs = (reelIndex: number, magnitude: number | undefined) =>
	(165 - reelIndex * 16) * (isFullTier(magnitude) ? 1 : 1.35);

/**
 * The beam behind the teasing column: a shaft of light that travels DOWN the
 * reel and repeats, so the column reads as being lit from somewhere rather than
 * as a static wash. `t` is ms since the tease started.
 *
 * Returns the beam's centre as a fraction of board height (0 = top rail, 1 =
 * bottom rail) and its alpha. The travel period shortens with the tier, which is
 * the same escalation the pulse carries, and the gate checks it too.
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
