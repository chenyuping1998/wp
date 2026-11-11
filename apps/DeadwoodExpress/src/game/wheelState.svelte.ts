import { waitForTimeout } from 'utils-shared/wait';

/**
 * How long the dial turns. MultiplierWheel uses these for the CSS transition and
 * animateWheel waits on them, so they must stay one number. Slowed from
 * 4.2s / 2s on 2026-09-23 so the decelerating tiles, and a near miss, can be read,
 * then doubled the same day (12.4s), which was too slow — settled at 9s. Turbo is
 * the player asking for speed, so it stays short.
 * 2026-09-26: 9s still felt slow to the user ("快一點點") -> 7.5s.
 * 2026-09-30: the wheel turns on EVERY winning free spin and covers the board,
 * so 7.5s + 1.5s hold + entry was ~10s of waiting before the win itself showed
 * (measured on the recorded Phantom Express book). The full sweep is now kept
 * for the spins that raise the multiplier — the moment worth the suspense — and
 * a spin that holds it turns briefly.
 */
export const WHEEL_SPIN_MS = {
 rise: { normal: 5200, turbo: 2400 },
 hold: { normal: 2400, turbo: 1300 },
};
/** How long the landed result stays up before the wheel leaves. */
const WHEEL_LANDED_MS = {
 rise: { normal: 1200, turbo: 700 },
 hold: { normal: 600, turbo: 400 },
};

export const wheelState = $state({ held: 1, previous: 1, selected: 1, values: [] as number[], visible: false, landed: false, rotation: 0, spinMs: WHEEL_SPIN_MS.rise.normal });

/** Deterministic PRNG so the same eligible set always draws the same dial. */
function seeded(seed: number) {
 let s = seed >>> 0 || 1;
 return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function shuffle<T>(items: T[], rand: () => number) {
 for (let i = items.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [items[i], items[j]] = [items[j], items[i]];
 }
 return items;
}

/**
 * A real wheel is not printed in ascending order. Split the eligible set into
 * its lower and upper halves, scramble each, then alternate them so every big
 * number sits between small ones — that is what makes a near miss possible.
 * Presentation only: the book already decided which value lands.
 */
export function layoutWheel(values: number[]) {
 const sorted = [...values].sort((a, b) => a - b);
 const rand = seeded(sorted.length * 7919 + sorted[0] * 31 + sorted[sorted.length - 1]);
 const lows = shuffle(sorted.slice(0, Math.ceil(sorted.length / 2)), rand);
 const highs = shuffle(sorted.slice(Math.ceil(sorted.length / 2)), rand);
 const ring = lows.flatMap((low, i) => (i < highs.length ? [low, highs[i]] : [low]));
 // Near the top of the ladder the eligible set shrinks to 1–4 values (≈3% of
 // premium wheel spins). Drawn as-is, each tile spanned 90–360° and the dial
 // became a few giant blades (2026-10-03). Repeat the ring until it has at
 // least MIN_TILES — a real wheel prints values more than once — so the dial
 // always reads as a wheel. The book's value still lands; only the print repeats.
 const reps = Math.ceil(MIN_TILES / ring.length);
 return Array.from({ length: reps }, () => ring).flat();
}

const MIN_TILES = 12;

/** How far into its segment the pointer stops, in segment widths (0 = centre, ±0.5 = edge). */
function stopOffset(values: number[], index: number) {
 const n = values.length;
 if (n < 3) return (Math.random() - 0.5) * 0.4;
 const value = values[index];
 const next = values[(index + 1) % n];
 const prev = values[(index - 1 + n) % n];
 const top = Math.max(...values);
 // Near miss: a much bigger neighbour, and only some of the time so it stays a surprise.
 const tease = (v: number) => v >= Math.max(value * 3, top * 0.4);
 if (Math.random() < 0.2) {
  if (tease(next) && (!tease(prev) || next >= prev)) return 0.34;
  if (tease(prev)) return -0.34;
 }
 return (Math.random() - 0.5) * 0.5;
}

/** Presentation only: the authoritative book supplies the outcome and eligible set. */
export async function animateWheel(event: { previous: number; value: number; eligibleValues: number[] }, turbo: boolean) {
 wheelState.previous = event.previous;
 wheelState.held = event.previous;
 wheelState.selected = event.value;
 wheelState.values = layoutWheel(event.eligibleValues);
 wheelState.rotation = 0;
 wheelState.landed = false;
 wheelState.visible = true;
 await waitForTimeout(turbo ? 120 : 380);
 const index = Math.max(0, wheelState.values.indexOf(event.value));
 const step = 360 / Math.max(1, wheelState.values.length);
 const kind = event.value > event.previous ? 'rise' : 'hold';
 const speed = turbo ? 'turbo' : 'normal';
 wheelState.spinMs = WHEEL_SPIN_MS[kind][speed];
 // fewer turns on a short spin, so it still decelerates rather than whips
 const turns = kind === 'rise' ? 4 + Math.floor(Math.random() * 2) : 2;
 wheelState.rotation = turns * 360 - (index + stopOffset(wheelState.values, index)) * step;
 await waitForTimeout(wheelState.spinMs + 100);
 wheelState.held = event.value;
 wheelState.landed = true;
 await waitForTimeout(WHEEL_LANDED_MS[kind][speed]);
 wheelState.visible = false;
}
