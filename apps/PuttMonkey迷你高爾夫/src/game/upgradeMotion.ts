/**
 * The upgrade's moving parts (BanditMeter.svelte), as pure functions of the
 * rung's own clock `phase` (ms) so design/check_collection_motion.mjs can hold
 * them to the same rules as the cast (2026-10-23, spine-generator's strike /
 * impact): every move eases in and out except at a hit, and each hit
 * overshoots and settles on a spring.
 *
 *   CUT - 240   the ball leaves: the caddie's flag comes down on it (his
 *               Spine 'signal' clip, started at signalAt)
 *   CUT         the ball hits the low flag's card: the card is smeared flat
 *               for a beat (HIT_STOP) before it flies
 *   CUT + 500   the prize ball lands (impact) — it used to snap to its full
 *               squash on one frame
 *   CUT + 552   the rung's golden flag lights (impact)
 */
import { clamp01, EASE, impact } from './motionKit';

/** how long the struck card holds its smear before it flies */
export const HIT_STOP = 50;
/** the ball is on the lawn this long before it reaches the card */
export const ROLL_MS = 240;

/** the caddie is the FG cast's own Spine now (2026-10-23): its 'signal' clip
 * (design/swing/build_caddie_flag.mjs) brings the flag down SIGNAL_HIT_MS
 * after it starts, so BanditMeter starts it that long before the ball leaves */
export const SIGNAL_HIT_MS = 420;
export const signalAt = (CUT: number) => CUT - ROLL_MS - SIGNAL_HIT_MS;

/** the putted ball, 0..1 of the way to the card at `k` of its roll: struck,
 *  so it leaves fast and is still going when it hits */
export const ballRoll = (k: number) => {
	const u = clamp01(k);
	return u * 1.35 - 0.35 * u * u;
};

/** the struck card: squashed against the hit, held for HIT_STOP, then
 *  thrown; `fly` is 0..1 of its flight */
export const cardHit = (phase: number, CUT: number) => {
	const t = phase - CUT;
	if (t < 0) return { smear: 0, fly: 0 };
	const smear = t < HIT_STOP ? EASE.cubicOut(t / 25 > 1 ? 1 : t / 25) : Math.max(0, 1 - (t - HIT_STOP) / 90);
	return { smear, fly: clamp01((t - HIT_STOP) / 640) };
};

/** the prize ball's landing squash (+ squashed, - stretched), `land` ms after it touches */
export const prizeSquash = (land: number) => (land < 0 ? 0 : impact(land, 0, 4, 0.45));

/** the rung that lights: a pop on the hit, settling on the spring */
export const RUNG_LIGHT = 552;
export const rungPopAt = (phase: number, CUT: number) => 1 + 0.35 * Math.max(-0.4, impact(phase, CUT + RUNG_LIGHT, 4, 0.45));
