import { stateBet, stateBetDerived } from 'state-shared';

/**
 * Turbo in this game is the reference game's turbo (its own TurboSpeed
 * settings, 抄錄 extracted GameSpeed/TurboSpeed vs NormalSpeed), which differs
 * from normal speed in exactly four values:
 *
 *   reel stop interval   0.2   -> 0     (every reel lands at once)
 *   reel show board      0.383 -> 0.2
 *   round delay, win     0.4   -> 0.28
 *   round delay, no win  0.4   -> 0
 *
 * Everything the player watches — the merge, the cast, the WILD conversion,
 * the line pays, the ladder, the panels — runs at the same pace as normal.
 *
 * It used to halve every beat (`stateBetDerived.timeScale()` is 2 in turbo) and
 * run the feature at 1/1.35. Stone 2026-11-11, watching turbo autoplay: 「開turbo
 * 自動轉時節奏可以慢一點像星城那樣」. So presentation no longer scales at all;
 * turbo's speed comes only from the four values above (refTiming.ts).
 *
 * Kept as functions so every caller still reads one place.
 */
export const FEATURE_TURBO_SCALE = 1;

export const featureTimeScale = () => 1;

/** A presentation duration in milliseconds: turbo does not shorten it. */
export const featureScaled = (ms: number) => ms / featureTimeScale();

/** The reference's turbo flag, for the four values that do change. */
export const isTurbo = () => stateBet.isTurbo;

/** Kept for code that still asks the shared scale (amount count-ups etc.). */
export const sharedTimeScale = () => stateBetDerived.timeScale();
