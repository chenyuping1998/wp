import config from './config';

/**
 * State and presentation helpers for the two wheels.
 *
 * Both are presentation only: the book already decided every value. The FG
 * wheel's held multiplier lives here (not in the component) so a resumed round
 * can rebuild it from the last multiplierWheel event without spinning.
 *
 * Timings are lifted from the two references and kept here so the components
 * and the event handlers cannot disagree about them:
 *   FG wheel   2026-11-06 recording, 10 fps frame count (see
 *              proposals/輪盤雙機制/輪盤雙機制_整合研究.md §2.2)
 *   roulette   東海龍王 RouletteView / GameTimeAsseter values (§1.3)
 */

export const FG_WHEEL_VALUES = (config as unknown as { fgWheelValues: number[] }).fgWheelValues;
export const ROULETTE_SEGMENTS = (config as unknown as { rouletteSegments: Record<number, (number | 'UP')[]> })
	.rouletteSegments;

export const FG_WHEEL_MS = {
	normal: { dim: 300, rise: 300, buttonTimeout: 5000, burst: 300, spin: 3900, settle: 360, fly: 300, flash: 300, hold: 900, sink: 300 },
	// Turbo shortens the entry, but retains a readable final braking run.
	turbo: { dim: 120, rise: 200, buttonTimeout: 0, burst: 160, spin: 2900, settle: 340, fly: 280, flash: 300, hold: 500, sink: 250 },
};

export const ROULETTE_MS = {
	normal: { intro: 680, count: 5, countStep: 1000, accel: 250, spin: 3900, bounce: 800, winPulse: 1200, levelWait: 500, levelPop: 1170, levelHold: 1000, score: 1200, hold: 1500, out: 300 },
	turbo: { intro: 300, count: 2, countStep: 500, accel: 150, spin: 1800, bounce: 400, winPulse: 600, levelWait: 250, levelPop: 700, levelHold: 400, score: 600, hold: 700, out: 200 },
};

/** Level colours, from the reference art: green, blue, red, purple. */
export const ROULETTE_COLORS: Record<number, { base: number; dark: number; rim: number; text: number }> = {
	1: { base: 0x1f7a4d, dark: 0x0f4a2e, rim: 0x5fe0a0, text: 0xf4ffd8 },
	2: { base: 0x1f5d9e, dark: 0x0f335e, rim: 0x6cc4ff, text: 0xe8f6ff },
	3: { base: 0x9e2a24, dark: 0x5e1410, rim: 0xff8a5c, text: 0xfff0e0 },
	4: { base: 0x6a2c9e, dark: 0x3a145e, rim: 0xd38cff, text: 0xffe9ff },
};

export const wheelState = $state({ held: 1 });

/** Activations that turn the Scarab Wheel on a paying base-game spin. */
export const SCARAB_MODES = ['SCARAB5', 'SCARAB10'];

/** Deterministic PRNG so one result always lays out the same strip. */
export function seeded(seed: number) {
	let s = seed >>> 0 || 1;
	return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/**
 * The FG wheel's strip: a long run of values sliding along the arc. Like the
 * reference it prints values below the held one too (they just never stop
 * under the pointer), scrambled so a big value always sits between small ones,
 * with the result planted at `resultIndex`.
 */
export function buildFgStrip(value: number, previous: number, length = 48) {
	const rand = seeded(value * 977 + previous * 131 + length);
	const sorted = [...FG_WHEEL_VALUES].sort((a, b) => a - b);
	const lows = sorted.slice(0, Math.ceil(sorted.length / 2));
	const highs = sorted.slice(Math.ceil(sorted.length / 2));
	const strip: number[] = [];
	while (strip.length < length) {
		strip.push(lows[Math.floor(rand() * lows.length)]);
		strip.push(highs[Math.floor(rand() * highs.length)]);
	}
	const resultIndex = length - 6;
	strip[resultIndex] = value;
	// never print the same value twice in a row
	for (let i = 1; i < strip.length; i++) {
		if (strip[i] === strip[i - 1] && i !== resultIndex) strip[i] = sorted[(sorted.indexOf(strip[i]) + 1) % sorted.length];
	}
	return { strip, resultIndex };
}

/** Index of a value on a roulette level (LEVEL UP is 'UP'). */
export function rouletteIndex(level: number, value: number | 'UP') {
	const segs = ROULETTE_SEGMENTS[level];
	const i = segs.indexOf(value);
	return i >= 0 ? i : 0;
}

/** Human label for a wheel value. */
export const multLabel = (v: number) => `${v}X`;
