import { waitForTimeout } from 'utils-shared/wait';

export const wheelState = $state({ held: 1, previous: 1, selected: 1, values: [] as number[], visible: false, landed: false, rotation: 0 });

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
 return lows.flatMap((low, i) => (i < highs.length ? [low, highs[i]] : [low]));
}

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
 const turns = 4 + Math.floor(Math.random() * 2);
 wheelState.rotation = turns * 360 - (index + stopOffset(wheelState.values, index)) * step;
 await waitForTimeout(turbo ? 2100 : 4300);
 wheelState.held = event.value;
 wheelState.landed = true;
 await waitForTimeout(turbo ? 700 : 1200);
 wheelState.visible = false;
}
