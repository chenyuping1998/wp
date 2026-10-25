/**
 * Motion primitives for the code-driven acts (the collection, the upgrade),
 * ported from spine-generator (E:/stake/spine-generator src/motions.ts,
 * ease.ts) on 2026-10-23 so these acts move by the same rules as the cast:
 *
 *   - nothing starts or stops at full speed (hump, the eases) ...
 *   - ... except a HIT, where the speed breaks on purpose (impact, strike):
 *     that break is what makes a putt or a landing read
 *   - a hit overshoots and settles on a damped spring, at the numbers the kit
 *     measured on Iron Jaw (4Hz, damping ratio 0.45)
 *
 * Times in ms. Pure functions, no imports: design/check_collection_motion.mjs
 * runs them under bare node.
 */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const EASE = {
	linear: (u: number) => u,
	sineIn: (u: number) => 1 - Math.cos((u * Math.PI) / 2),
	sineOut: (u: number) => Math.sin((u * Math.PI) / 2),
	sineInOut: (u: number) => (1 - Math.cos(Math.PI * u)) / 2,
	cubicOut: (u: number) => 1 - (1 - u) ** 3,
	quartIn: (u: number) => u ** 4,
	quadOut: (u: number) => 1 - (1 - u) ** 2,
} as const;
export type EaseName = keyof typeof EASE;

/** 0 -> 1 -> 0 over [from, to], no speed at either end */
export const hump = (t: number, from: number, to: number) => {
	if (t <= from || t >= to) return 0;
	const s = Math.sin((Math.PI * (t - from)) / (to - from));
	return s * s;
};

/** a damped spring from 1 at t0 (no speed) settling to 0 */
export const springDecay = (t: number, t0 = 0, hz = 4, damping = 0.45) => {
	if (t <= t0) return 1;
	const w = (2 * Math.PI * hz) / 1000;
	const z = Math.min(Math.max(damping, 0.01), 0.99);
	const wd = w * Math.sqrt(1 - z * z);
	const s = t - t0;
	return Math.exp(-z * w * s) * (Math.cos(wd * s) + ((z * w) / wd) * Math.sin(wd * s));
};

/** a hit at t0: 0 before, straight up to a first peak of exactly 1, then a
 *  damped rebound through 0 — the kit's overshoot */
export const impact = (t: number, t0: number, hz = 4, damping = 0.45) => {
	if (t <= t0) return 0;
	const w = (2 * Math.PI * hz) / 1000;
	const z = damping;
	const wd = w * Math.sqrt(1 - z * z);
	const tp = Math.atan2(wd, z * w) / wd;
	const k = 1 / (Math.exp(-z * w * tp) * Math.sin(wd * tp));
	return k * Math.exp(-z * w * (t - t0)) * Math.sin(wd * (t - t0));
};

export type Strike = {
	rest?: number;
	/** the wind-up: where it pulls back to, and how long that takes */
	anticipation: { value: number; time: number; ease?: EaseName };
	/** the hit: where it strikes, and how long the snap takes */
	action: { value: number; time: number; ease?: EaseName };
	/** past the hit and back on a spring */
	overshoot?: { amount: number; hz?: number; damping?: number };
	/** at the hit, while the overshoot plays */
	hold?: number;
	recover?: { time: number; ease?: EaseName };
};

/** wind-up -> snap -> overshoot -> hold -> home. The position is continuous;
 *  the speed breaks at the hit (anticipation + action ms), on purpose. */
export const strike = (p: Strike) => {
	const rest = p.rest ?? 0;
	const tA = p.anticipation.time;
	const tI = tA + p.action.time;
	const hold = p.hold ?? 250;
	const tH = tI + hold;
	const tR = tH + (p.recover?.time ?? 250);
	const eA = EASE[p.anticipation.ease ?? 'sineOut'];
	const eS = EASE[p.action.ease ?? 'quartIn'];
	const eR = EASE[p.recover?.ease ?? 'sineInOut'];
	const dir = Math.sign(p.action.value - p.anticipation.value) || 1;
	const os = p.overshoot;
	const settle = (s: number) => (os ? dir * os.amount * impact(s, 0, os.hz ?? 4, os.damping ?? 0.45) : 0);
	const atHold = p.action.value + settle(hold);
	return {
		/** ms from the start to the hit */
		hitAt: tI,
		duration: tR,
		at: (t: number) => {
			if (t <= 0) return rest;
			if (t <= tA) return rest + (p.anticipation.value - rest) * eA(t / tA);
			if (t <= tI) return p.anticipation.value + (p.action.value - p.anticipation.value) * eS((t - tA) / (tI - tA));
			if (t <= tH) return p.action.value + settle(t - tI);
			if (t <= tR) return atHold + (rest - atHold) * eR((t - tH) / (tR - tH));
			return rest;
		},
	};
};
