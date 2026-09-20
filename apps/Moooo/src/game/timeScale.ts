import { stateBetDerived } from 'state-shared';

/**
 * Turbo, for the parts of the game a player is watching rather than getting
 * through.
 *
 * `stateBetDerived.timeScale()` is 1 normally and 2 in turbo, and it was applied
 * uniformly: every beat in the game ran at half length. That is right for the
 * grind — the reels, the base-game win volley, the idle — because turbo exists
 * to get to the next spin faster.
 *
 * It is wrong for the feature. The free-spin trigger, the sign drop, the free
 * game's own rhythm and the cow expansion are the payoff, not the
 * wait, and at half length they stopped reading as events at all — they went by
 * before the eye had settled on them. Reported as "in turbo the free game and
 * the bonus buy are a bit too fast", which is exactly what a uniform halving
 * does to the beats that carry the money.
 *
 * So feature beats get their own, gentler scale: 1.35 rather than 2. In turbo
 * they run at about 74% of normal instead of 50% — noticeably quicker, still
 * legible. Everything else keeps using `timeScale()` directly.
 *
 * Read at call time, never baked in, so toggling turbo takes effect on the next
 * beat rather than the next spawn.
 */
export const FEATURE_TURBO_SCALE = 1.35;

export const featureTimeScale = () =>
	stateBetDerived.timeScale() > 1 ? FEATURE_TURBO_SCALE : 1;

/** A feature duration in milliseconds, shortened for turbo but not halved. */
export const featureScaled = (ms: number) => ms / featureTimeScale();
