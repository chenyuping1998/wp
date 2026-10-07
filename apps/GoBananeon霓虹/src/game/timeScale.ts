/**
 * Turbo, for the part of the game a player is WATCHING rather than getting
 * through (ported from DeadwoodExpress, 2026-09-28).
 *
 * `stateBetDerived.timeScale()` is 1 normally and 2 in turbo, and every win
 * presentation ran on it — including the free game's, where the wins ARE the
 * payoff. At half length a free-game win went by before the eye had settled on
 * it. Deadwood Express was told exactly that ("in turbo the free game and the
 * bonus buy are a bit too fast") and answered it with a gentler scale for the
 * feature: 1.35 rather than 2, so turbo still runs the feature at ~74% of
 * normal, noticeably quicker and still legible.
 *
 * This game already keeps its other feature beats out of turbo — the blast
 * (ReelBlast: no turbo branch) and the free game's reel spin
 * (isTurboOverride: false). What was left on the plain 2x was the WINS inside
 * the feature: the symbol mesh wins and the win-line hold.
 *
 * Read at call time, never baked in, so toggling turbo takes effect on the next
 * beat.
 */
import { stateBetDerived } from 'state-shared';

import { stateGame } from './stateGame.svelte';

export const FEATURE_TURBO_SCALE = 1.35;

/** The feature's own speed-up: 1, or 1.35 in turbo. */
export const featureTimeScale = () => (stateBetDerived.timeScale() > 1 ? FEATURE_TURBO_SCALE : 1);

/**
 * The speed for a WIN presentation right now: the feature's gentler scale in
 * the free game, the plain turbo everywhere else.
 */
export const winTimeScale = () =>
	stateGame.gameType === 'freegame' ? featureTimeScale() : stateBetDerived.timeScale();
