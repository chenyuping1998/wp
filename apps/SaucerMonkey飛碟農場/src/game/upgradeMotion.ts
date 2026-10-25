/**
 * The upgrade's moving parts (BanditMeter.svelte, 2026-10-23: the saucer
 * rams the low card), as pure functions of the rung's own clock `phase` (ms)
 * so design/check_collection_motion.mjs can hold them to the same rules as
 * the cast: every move eases in and out except at a hit, and each hit
 * overshoots and settles on a spring.
 *
 *   CUT - APPROACH_MS  the saucer drops out of the sky at the card, picking
 *                      up speed all the way (it is still going when it hits)
 *   CUT                it rams the card: both hold for HIT_STOP, the saucer
 *                      squashed against it, then the card bursts
 *                      (CardShatter) and the saucer bounces up off it,
 *                      wobbling, to hover over the empty spot
 *   CUT + BEAM_AT      its beam comes on and lowers the cow into the spot
 *   CUT + LAND         the cow lands (impact)
 *   CUT + RUNG_LIGHT   the rung's saucer lights (impact)
 *   LEAVE_AT           (not on the last rung) it shoots off for the next
 */
import { clamp01, EASE, impact, springDecay } from './motionKit';

export const APPROACH_MS = 440;
/** how long the saucer and the card hold flattened together */
export const HIT_STOP = 60;
export const RECOIL_MS = 380;
export const BEAM_AT = 400;
export const BEAM_OFF = 900;
/** the cow is lowered from LOWER_AT to LAND */
export const LOWER_AT = 430;
export const LAND = 760;
export const RUNG_LIGHT = 800;
export const LEAVE_AT = 1820;
export const LEAVE_MS = 320;
/** the saucer leans into the dive (radians, left side down) */
const DIVE_TILT = -0.42;

type P = { x: number; y: number };

/**
 * Where the saucer is. `hit` is where it meets the card, `hover` over the
 * spot, `from` / `away` off the board; `bob` is the hover's float in px.
 * `alpha` lets it fade on and off at the board's edge.
 */
export const saucerPose = (phase: number, CUT: number, pts: { from: P; hit: P; hover: P; away: P }, last: boolean, bob: number) => {
	const t = phase - CUT;
	if (t < 0) {
		// the dive: a swoop, slow out of the sky and fastest at the card
		const k = clamp01((t + APPROACH_MS) / APPROACH_MS);
		const u = k * k;
		const c = { x: pts.hit.x + (pts.from.x - pts.hit.x) * 0.15, y: pts.from.y + (pts.hit.y - pts.from.y) * 0.1 };
		const x = (1 - u) * (1 - u) * pts.from.x + 2 * (1 - u) * u * c.x + u * u * pts.hit.x;
		const y = (1 - u) * (1 - u) * pts.from.y + 2 * (1 - u) * u * c.y + u * u * pts.hit.y;
		return { x, y, rot: DIVE_TILT * EASE.sineInOut(k), sx: 1, sy: 1, alpha: clamp01(k * 5), beam: 0 };
	}
	if (t < HIT_STOP) {
		// flattened against the card
		const s = EASE.cubicOut(clamp01(t / 20));
		return { x: pts.hit.x, y: pts.hit.y, rot: DIVE_TILT, sx: 1 + 0.16 * s, sy: 1 - 0.2 * s, alpha: 1, beam: 0 };
	}
	const r = t - HIT_STOP;
	const k = EASE.cubicOut(clamp01(r / RECOIL_MS));
	// the squash lets go on a spring; the tilt rights itself past level and back
	const squash = springDecay(r, 0, 5, 0.4);
	const wobble = 0.3 * impact(r, 0, 2.6, 0.32);
	let x = pts.hit.x + (pts.hover.x - pts.hit.x) * k;
	let y = pts.hit.y + (pts.hover.y - pts.hit.y) * k + bob * Math.sin(r / 260) * clamp01(r / RECOIL_MS);
	let rot = DIVE_TILT * (1 - k) + wobble;
	let alpha = 1;
	if (!last && phase > LEAVE_AT) {
		const l = clamp01((phase - LEAVE_AT) / LEAVE_MS) ** 2;
		x += (pts.away.x - x) * l;
		y += (pts.away.y - y) * l;
		rot += 0.35 * l;
		alpha = 1 - clamp01((phase - LEAVE_AT - LEAVE_MS * 0.6) / (LEAVE_MS * 0.4));
	}
	const beam = clamp01((t - BEAM_AT) / 90) * (1 - clamp01((t - BEAM_OFF) / 160));
	return { x, y, rot, sx: 1 + 0.16 * squash, sy: 1 - 0.2 * squash, alpha, beam };
};

/** how far the cow has come down the beam, 0..1 (eased in and out) */
export const lowerCow = (phase: number, CUT: number) => EASE.sineInOut(clamp01((phase - CUT - LOWER_AT) / (LAND - LOWER_AT)));

/** the cow's landing squash (+ squashed, - stretched), `land` ms after it touches */
export const prizeSquash = (land: number) => (land < 0 ? 0 : impact(land, 0, 4, 0.45));

/** the rung that lights: a pop on the hit, settling on the spring */
export const rungPopAt = (phase: number, CUT: number) => 1 + 0.35 * Math.max(-0.4, impact(phase, CUT + RUNG_LIGHT, 4, 0.45));
