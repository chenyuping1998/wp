/**
 * Anticipation: how hard the board leans on the reel that is still spinning
 * (ported from DeadwoodExpress's anticipationFocus, 2026-09-28).
 *
 * The tease already had an amber column, chevrons and the stopped reels dimmed.
 * What it lacked is what every competitor does: the teasing reel is BROUGHT
 * FORWARD — its symbols a little larger and brighter than the ones on the dead
 * reels, a shaft of light travelling down it — so the eye is pulled to it
 * rather than merely told something is happening there.
 *
 * And it had the bug Deadwood's own gate was written to catch: the pulse
 * period was `145 + reel * 11` — it got SLOWER towards the right, so the
 * tension drained exactly as the payoff approached. Here it gets faster.
 *
 * Tiers come from the Scatters already down (stateGame.scatterCounter). A reel
 * only teases once three are down (bookEventHandlerMap, gateAnticipation), so:
 *
 *   tier 1   three down — the feature is on, this reel is for more spins
 *   tier 2   four or more down — the biggest award is one Scatter away
 *
 * Pure numbers, no imports: design/check_idle_land.mjs holds the escalation to
 * what this comment says (faster to the right, faster and brighter at tier 2,
 * the focus kept below the size where a symbol clips its neighbours).
 */

export type Tier = 1 | 2;

export const tierOf = (scattersDown: number): Tier => (scattersDown >= 4 ? 2 : 1);

/** Sine period of the column pulse, ms — SMALLER IS FASTER. */
export const pulseRateMs = (reel: number, tier: Tier) => (160 - reel * 14) * (tier === 2 ? 0.8 : 1);

/** Overall strength of the column, 0..1. */
export const tierIntensity = (tier: Tier) => (tier === 2 ? 1 : 0.7);

/**
 * How much the symbols on the teasing reel are lifted out of the board:
 * `scale` on their size, `bloom` the alpha of an additive copy of their art.
 * Small: they are blurred and scrolling, and past ~1.1 they clip into the next
 * column, which reads as a bug rather than emphasis.
 */
export const symbolFocus = (tier: Tier) => (tier === 2 ? { scale: 1.08, bloom: 0.2 } : { scale: 1.045, bloom: 0.1 });

/**
 * The shaft of light down the teasing column: its centre as a fraction of the
 * board's height, its alpha and height. It repeats, faster at tier 2.
 */
export const beamAt = (t: number, tier: Tier) => {
	const period = tier === 2 ? 850 : 1300;
	const u = (t % period) / period;
	return {
		y: u,
		alpha: Math.sin(Math.PI * u) * (tier === 2 ? 0.5 : 0.28),
		height: 0.42 - 0.14 * u,
	};
};
