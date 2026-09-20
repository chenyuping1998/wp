/**
 * Neon Frame beats: how a Frame ARRIVES, how it FLIES into the Collector, and
 * how hard the Collector reacts when it gets there.
 *
 * Priority 4 of docs/handoff/hot_miami_ANIMATION.md, and the same fault as
 * priorities 1-3 one layer up. The Frames are the game's headline mechanic and
 * they carry 2x to 100x, but every Frame entered the board with ONE shared
 * 260ms backOut pop, so a 2x and a 100x — a fifty-fold difference in money —
 * arrived with the identical gesture and differed only by a tint and a number.
 * On a moving grid at 132px, the number is the last thing the eye reads.
 *
 * The tiers already existed for the STATIC look (tint, halo, shine, second
 * casting, in Searchlights.svelte). This gives them a MOTION, which is the part a
 * player actually catches while the reels are still settling.
 *
 * ── Same contract as the other three tables ─────────────────────────────────
 *
 * Pure functions of time, cell fractions for geometry, no imports — so
 * `design/check_frame_beat.mjs` can load it in plain node and measure that the
 * tiers really do escalate and that no motion is left mid-flight when it ends.
 * Three earlier tables in this game asserted their properties in comments; two
 * of those assertions turned out to be false, which is why nothing here is
 * asserted in a comment alone.
 */

export type FrameTier = 'plain' | 'premium' | 'elite';

/**
 * Tier split, at the values a player already thinks in. Mirrors the static
 * styling in Searchlights.svelte — the two must agree or a Frame would move like
 * an elite and be painted like a premium.
 */
export const tierOf = (mult: number): FrameTier =>
	mult >= 25 ? 'elite' : mult >= 10 ? 'premium' : 'plain';

/**
 * How long each tier's arrival takes.
 *
 * Plain is the fastest deliberately: Ocean Drive can put twenty Frames on the
 * grid at once and twenty heavy arrivals would be a mess, not a moment. The
 * elite is the slowest because it is the one worth waiting for — and because a
 * beat only reads as "bigger" if it also takes longer.
 */
export const ENTRY_MS: Record<FrameTier, number> = {
	plain: 220,
	premium: 320,
	elite: 460,
};

export type FrameEntryFrame = {
	/** multiplies the Frame's drawn size */
	scale: number;
	rotation: number;
	/** drives the existing halo/frame brightness, 0..1 */
	glow: number;
	/** additive white flash over the frame casting, 0..1 */
	flash: number;
	/** expanding shock ring: 0 = no ring, otherwise its size in cell fractions */
	ring: number;
	ringAlpha: number;
};

const rest = (over: Partial<FrameEntryFrame> = {}): FrameEntryFrame => ({
	scale: 1,
	rotation: 0,
	glow: 1,
	flash: 0,
	ring: 0,
	ringAlpha: 0,
	...over,
});

/** 0→1 progress, clamped, so any t past the end is exactly at rest. */
const p = (t: number, ms: number) => Math.max(0, Math.min(1, t / ms));
/** back-out overshoot, 0→1 with a single overshoot past 1 */
const backOut = (u: number, amount: number) => {
	const c = amount + 1;
	return 1 + c * (u - 1) ** 3 + amount * (u - 1) ** 2;
};
const fade = (u: number, width: number) => (u >= width ? 0 : 1 - u / width);

/**
 * A Frame arriving on the board. `t` is ms since it appeared.
 *
 * The three are not the same curve at three amplitudes — that is the mistake
 * this whole animation pass exists to undo, and the checker measures shape, so
 * scaling one up would not pass it:
 *
 *   plain    grows into place and stops. No flash, no ring. It is furniture.
 *   premium  overshoots and rocks back once, with a brief flash.
 *   elite    arrives OVERSIZE and slams down through its resting size, throwing
 *            a shock ring outward and ringing off a hard flash. It is the only
 *            one that comes from above its final size rather than below it.
 */
export const frameEntry = (t: number, tier: FrameTier): FrameEntryFrame => {
	const u = p(t, ENTRY_MS[tier]);
	if (tier === 'plain') {
		return rest({
			scale: backOut(u, 1.2),
			glow: 0.55 + 0.45 * u,
		});
	}
	if (tier === 'premium') {
		return rest({
			scale: backOut(u, 2.4),
			rotation: 0.09 * Math.exp(-5 * u) * Math.sin(Math.PI * 2.5 * u),
			glow: 0.5 + 0.5 * u,
			flash: 0.55 * fade(u, 0.45),
			ring: u >= 0.6 ? 0 : 1.1 + 1.3 * (u / 0.6),
			ringAlpha: u >= 0.6 ? 0 : 0.4 * (1 - u / 0.6),
		});
	}
	// elite: falls INTO the board from oversize, lands hard, shivers.
	const drop = 1 - u ** 0.6; // fast at first, decelerating onto the cell
	const shiver = Math.exp(-7 * u) * Math.sin(Math.PI * 6 * u);
	return rest({
		scale: 1 + 0.85 * drop + 0.09 * shiver,
		rotation: 0.06 * shiver,
		glow: 0.35 + 0.65 * Math.min(1, u * 2.2),
		flash: 0.9 * fade(u, 0.35),
		ring: u >= 0.75 ? 0 : 1.2 + 2.2 * (u / 0.75),
		ringAlpha: u >= 0.75 ? 0 : 0.55 * (1 - u / 0.75),
	});
};

/**
 * Shaping for one Frame's flight into the Collector during the sweep.
 *
 * `Searchlights` already lerped each Frame from its cell to the Collector along an
 * arc, with a comment claiming the paths "fan out instead of overlapping into
 * one straight line" — but the arc height was the SAME constant for every
 * Frame, so two Frames on the same reel flew the identical path, one under the
 * other. That is the kind of claim this project has learned to check rather than
 * write down.
 *
 * Arc height and lateral bow now vary with the Frame's index in the sweep, and
 * the checker asserts that neighbouring indices actually differ.
 *
 * Returns cell fractions; `flightScale` multiplies the flight duration, so the
 * richest Frames take the stage a little longer on their way in.
 */
export const sweepFlight = (index: number, count: number, mult: number) => {
	// Three interleaved arc heights rather than a ramp: with a ramp, a sweep of
	// two Frames gets two nearly identical paths, which is the case that matters
	// most because it is the most common.
	const lane = index % 3;
	const arc = [0.42, 0.78, 0.58][lane];
	// Alternating bow, widening slightly as the sweep goes on so late Frames do
	// not retrace the paths of early ones.
	const spread = Math.min(1, count / 6);
	const lateral = (lane === 0 ? 0 : lane === 1 ? 1 : -1) * (0.12 + 0.16 * spread);
	return {
		/** peak height of the arc above the straight line, in cell fractions */
		arc,
		/** sideways bow at the midpoint, in cell fractions */
		lateral,
		/** multiplies FRAME_TIMING.sweepFlyMs */
		flightScale: tierOf(mult) === 'elite' ? 1.25 : tierOf(mult) === 'premium' ? 1.1 : 1,
	};
};

/**
 * How hard the Collector kicks when a Frame's value lands on it.
 *
 * Was one fixed 1.3 punch for every Frame, so absorbing a 2x looked exactly like
 * absorbing a 100x — in the one moment of the game whose entire subject is how
 * much each Frame was worth.
 *
 * Monotone in `mult` by construction and capped, because the Collector sits on
 * the board and a punch past ~1.75 starts covering its neighbours.
 */
export const collectorTick = (mult: number) => 1.18 + 0.5 * Math.min(1, Math.log10(Math.max(1, mult)) / 2);
