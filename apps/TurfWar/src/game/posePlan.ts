/**
 * WHICH DRAWING is on screen at each moment of a win.
 *
 * Everything the animation work has produced so far transforms ONE drawing:
 * scale it, rotate it, slide it, swap a head for another head. Two rounds of
 * that scored the same `poor animation` tag, the second time after the motion
 * had been measured up to 1.47x scale and 26.8 degrees of swing — visible, and
 * still a still image being pushed around.
 *
 * This is the other half: three more DRAWINGS of the same symbol (wind, peak,
 * settle — see docs/art-prompts-hot-miami-parts.md §11), played as a timeline
 * inside the win hold. Limited animation, which is what a 2D game ships when it
 * is not shipping a skeleton: a few real poses, with transforms doing the
 * in-betweens and the impact.
 *
 * ── Why a table of times rather than a component ─────────────────────────────
 *
 * Same argument as symbolWinMotion.ts: as a pure function this is loadable by a
 * bare node script, so `design/check_poses.mjs` can prove that every pose is
 * actually reached and held long enough to be seen. A pose that is on screen for
 * 30ms is a pose the player never saw — which is exactly the class of bug this
 * whole workstream keeps producing.
 *
 * No imports, deliberately. (HOLD_MS is passed in rather than imported for the
 * same reason; symbolWinMotion.ts owns it.)
 */

export type PoseName = 'rest' | 'wind' | 'peak' | 'settle';

/**
 * The beat, as fractions of the win hold.
 *
 * Shaped like a real animation beat rather than an even split:
 *
 *   wind    short. Anticipation reads as fast — a wind-up that lingers looks
 *           like a separate action instead of the load before one.
 *   peak    the longest by far. It is the drawing the player is meant to
 *           remember, and it is the one carrying the expression.
 *   settle  medium. Long enough that the return is a movement rather than a cut.
 *
 * The remainder after settle is spent back at rest, so the cell is already
 * showing its resting drawing when Board.svelte flips it to postWinStatic —
 * otherwise the last frame of the win and the first frame of the static board
 * are different pictures, which reads as a glitch.
 */
export const POSE_PLAN: { pose: PoseName; from: number; to: number }[] = [
	{ pose: 'wind', from: 0.0, to: 0.14 },
	{ pose: 'peak', from: 0.14, to: 0.62 },
	{ pose: 'settle', from: 0.62, to: 0.86 },
	{ pose: 'rest', from: 0.86, to: 1.0 },
];

/** Which drawing is up at `t` ms into a win of `holdMs`. */
export const poseAt = (t: number, holdMs: number): PoseName => {
	const u = t / holdMs;
	if (u < 0) return 'rest';
	for (const step of POSE_PLAN) if (u >= step.from && u < step.to) return step.pose;
	return 'rest';
};

/**
 * Horizontal smear on the frame a pose changes, 0..1.
 *
 * A cut between two drawings is a cut; a cut with one stretched frame either
 * side of it is a movement. This is the cheapest piece of animation craft there
 * is and it is the difference between "the sprite changed" and "the character
 * moved". Decays fast — a smear that outlives the change is just a wobble.
 *
 * `SMEAR_MS` is deliberately shorter than one 60fps frame pair: it exists to be
 * caught in motion, not to be looked at.
 */
export const SMEAR_MS = 70;

export const smearAt = (t: number, holdMs: number): number => {
	let nearest = Infinity;
	for (const step of POSE_PLAN) {
		const boundary = step.from * holdMs;
		if (t >= boundary) nearest = Math.min(nearest, t - boundary);
	}
	if (!(nearest < SMEAR_MS)) return 0;
	return 1 - nearest / SMEAR_MS;
};

/** How long each pose is actually on screen, ms — what check_poses.mjs asserts. */
export const poseDurations = (holdMs: number): Record<PoseName, number> => {
	const out = { rest: 0, wind: 0, peak: 0, settle: 0 } as Record<PoseName, number>;
	for (const step of POSE_PLAN) out[step.pose] += (step.to - step.from) * holdMs;
	return out;
};

/**
 * Which symbols actually have pose sheets, and the asset key for each drawing.
 *
 * Only two. The other four symbols' sheets were delivered as geometry pasted
 * onto the base art — a black rectangle for a mouth, a pink triangle for a wing
 * — and refused; see design/check_source_art.py for why no gate catches that.
 * A symbol absent from this table keeps the transform-only win motion it already
 * had, which is what every symbol had before this file existed.
 */
// Turf symbols use whole-object transform motion; inherited human poses are invalid.
export const POSE_SHEETS: Record<string, Record<Exclude<PoseName, 'rest'>, string>> = {};

export const poseKeyAt = (symbolName: string, t: number, holdMs: number): string | null => {
	const sheet = POSE_SHEETS[symbolName.toLowerCase()];
	if (!sheet) return null;
	const pose = poseAt(t, holdMs);
	return pose === 'rest' ? null : sheet[pose];
};
