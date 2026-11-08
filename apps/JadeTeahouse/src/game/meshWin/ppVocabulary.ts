/**
 * Pragmatic Play's motion vocabulary, measured from Sweet Loot, in the shape our per-game meshWin/meshRig.ts uses.
 * Copy into a game's meshWin/ next to meshRig.ts. IMPORTS NOTHING (check_mesh_wins.mjs loads meshWin files bare).
 * Times in ms, canvas px y-down, like meshRig.
 */

// ---------------------------------------------------------------------------
// easing: PP keys 90% of segments with Spine's default bezier [0.25,0,0.75,1] — within 0.026 of smoothstep and far
// softer than meshRig's cubic 'inOut' (at 30% of a segment: PP 0.24, cubic 0.11). Settles use [0.36,0.64,0.7,1].

const bezier = (x1: number, y1: number, x2: number, y2: number) => (x: number) => {
	if (x <= 0) return 0;
	if (x >= 1) return 1;
	let lo = 0, hi = 1, t = x;
	for (let i = 0; i < 24; i++) {
		t = (lo + hi) / 2;
		const bx = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3;
		if (bx < x) lo = t; else hi = t;
	}
	return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3;
};
export const PP_EASE = {
	/** the default: every beat, every chain link */
	soft: bezier(0.25, 0, 0.75, 1),
	/** arriving and settling (fast start, long slow stop) */
	settle: bezier(0.36, 0.64, 0.7, 1),
	/** leaving a hold toward an accent */
	leave: bezier(0.25, 0, 0.63, 0.5),
	linear: (t: number) => t,
	hold: () => 0,
} as const;
export type PPEase = keyof typeof PP_EASE;

/** [ms, value, ease INTO this key] — same contract as meshRig's Key/track, PP curves. */
export type PPKey = [number, number, PPEase?];
export const ppTrack = (t: number, keys: PPKey[]): number => {
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [t1, v1, ease = 'soft'] = keys[i];
		if (t <= t1) {
			const [t0, v0] = keys[i - 1];
			return v0 + (v1 - v0) * PP_EASE[ease]((t - t0) / (t1 - t0 || 1));
		}
	}
	return keys[keys.length - 1][1];
};

// ---------------------------------------------------------------------------
// timing: every high symbol's win is 1500ms in three beats, keys on the 30fps grid.
// 133 anticipation (shrink) · 267 wink · 433 first break-out · 667 back in frame · 1133–1233 second break-out · 1500 rest

export const PP_WIN_BEATS = { anticipate: 133, wink: 267, pop1: 433, back: 667, pop2: 1167, done: 1500 } as const;
export const PP_FRAME = 1000 / 30;
/** snap a time to the 30fps grid, as every PP key is */
export const onGrid = (ms: number) => Math.round(ms / PP_FRAME) * PP_FRAME;

/** The beat everything else rides: scale pulse and lift, ~1.08 / ~6% of the frame height at the peaks. */
export const beatPulse = (t: number, b = PP_WIN_BEATS): number =>
	ppTrack(t, [[0, 0], [b.anticipate, -0.35], [b.pop1, 1], [b.back, 0.15, 'settle'], [b.pop2, 0.85], [b.done, 0, 'settle']]);

// ---------------------------------------------------------------------------
// follow-through: one curve for a whole chain, each link LATER by 2 frames (symbols; 3–4 for a character's beard
// or arm) and LARGER toward the tip (×1.0–1.7). Deterministic — no spring — so every play is identical and it ends
// exactly at rest. Measured links correlate 0.9–1.0 with their parent at that lag.

export const lagged = (t: number, keys: PPKey[], link: number, lagMs = 2 * PP_FRAME, gain = 1.3): number =>
	ppTrack(t - link * lagMs, keys) * gain ** link;

// ---------------------------------------------------------------------------
// fake 3-D turn: a `look` part hangs from the head; it KEEPS a Gaussian share of each vertex (the rest goes to the
// head) — ~0.55 at the front of the face, falling to <0.1 at the silhouette. Moving look.dx/dy then slides the
// features more than the outline, which reads as the head turning. PP: w ≈ peak·exp(−(r/R)²/0.4).
// Put the far ear / back of the hat on a separate part driven with the OPPOSITE move (PP mix −0.4 … −1).

type Point = [number, number];
export const lookKeep = (centre: Point, radius: number, peak = 0.55) => (p: Point) => {
	const r = Math.hypot(p[0] - centre[0], p[1] - centre[1]) / radius;
	return peak * Math.exp(-(r * r) / 0.4);
};
/** distance field for the look part: 0 over the whole head disc so it competes only there */
export const lookDist = (centre: Point, radius: number) => (p: Point) =>
	Math.max(0, Math.hypot(p[0] - centre[0], p[1] - centre[1]) - radius);

/**
 * The whole look part for meshRig's RigSpec.parts. Its priority must beat the head's by ~4×soft: buildRig first
 * splits a vertex between parts by soft-min distance, and inside the head disc head and look are both at 0, so with
 * a small lead look only gets ~half before `keep` — measured 0.28 at the centre instead of PP's 0.54. With the lead
 * it measures 0.51 / 0.42 / 0.28 / 0.16 / 0.07 at 0 / 0.2 / 0.4 / 0.6 / 0.8 R (PP: 0.54 / 0.50 / 0.31 / 0.17 / 0.08).
 */
export const lookPart = (centre: Point, radius: number, o: { parent?: string; headPriority?: number; soft: number; peak?: number }) => ({
	name: 'look', parent: o.parent ?? 'head', pivot: centre, axis: [0, -1] as Point,
	dist: lookDist(centre, radius), keep: lookKeep(centre, radius, o.peak), priority: (o.headPriority ?? 0) + 4 * o.soft,
});

/** A look path that reads as attention, not wobble: glance, hold, glance back. Values in px of look.dx. */
export const lookAround = (t: number, amount: number, b = PP_WIN_BEATS) =>
	ppTrack(t, [[0, 0], [b.wink, amount], [b.back, -0.6 * amount], [b.pop2, 0.7 * amount], [b.done, 0, 'settle']]);

// ---------------------------------------------------------------------------
// light: the additive copy pulses ON the beat, never as a free-running sine. Idle stays near 12%.

export const glowPulse = (t: number, b = PP_WIN_BEATS) =>
	ppTrack(t, [[0, 0], [b.pop1 - 33, 0.22], [b.back, 0], [b.pop2 - 33, 0.15], [b.done, 0]]);
export const idleGlow = (t: number, periodMs = 1500) => 0.12 * Math.sin((Math.PI * (t % periodMs)) / periodMs);

// ---------------------------------------------------------------------------
// squash and stretch keeps the area: sx·sy stays within 1.00–1.04 (median 1.01 over 181 PP keys)

export const squash = (amount: number) => ({ sx: 1 + amount * 0.5, sy: 1 / (1 + amount * 0.5) });
