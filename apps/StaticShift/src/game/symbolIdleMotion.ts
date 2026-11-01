/**
 * What each symbol does on a SETTLED board — its own idle animation.
 *
 * House rule 2026-10-27 (Turf War review 5.3: "feels too static"): every symbol
 * has an AMBIENT loop in its own physics plus a signature ACT every few seconds,
 * staggered by cell so the board shows one or two acts at a time, never a pulse.
 * Ported from Turf War's symbolIdleMotion.ts with radio-studio moves.
 *
 * Every period divides IDLE_WRAP_MS, or the loop would jump when the clock
 * wraps; design/check_symbol_idle.mjs asserts that plus visibility, distinct
 * moves, staying inside the cell and the spread across a 5×4 board.
 *
 * No imports, so the gate can run it in plain node.
 */

export type IdleFrame = {
  dx: number; // fraction of SYMBOL_SIZE
  dy: number;
  rotation: number; // radians
  scaleX: number;
  scaleY: number;
  alpha: number;
  act: number;
  actU: number;
};

type IdleSpec = {
  loopMs: number;
  cycleMs: number;
  actMs: number;
  frame: (u: number, l: number) => Partial<IdleFrame>;
};

export const IDLE_WRAP_MS = 104000;

const TAU = Math.PI * 2;
const sin = Math.sin;
const bell = (u: number) => (u < 0 ? 0 : Math.sin(Math.PI * u) ** 2);
const ring = (u: number, n: number) =>
  u < 0 ? 0 : Math.sin(Math.PI * n * u) * (1 - u);
// rotation about a pivot py (fraction of cell, + = below centre)
const pivot = (rot: number, py: number) => ({
  rotation: rot,
  dx: py * Math.sin(rot),
  dy: py * (1 - Math.cos(rot)),
});

export const IDLE_SPECS: Record<string, IdleSpec> = {
  // Tape Deck: hits PLAY — the transport clunks down twice and the deck rocks.
  S: {
    loopMs: 2000,
    cycleMs: 4000,
    actMs: 640,
    frame: (u, l) => {
      const pump = u < 0 ? 0 : Math.max(0, sin(TAU * 2 * u)) * (1 - u * 0.4);
      return { ...pivot(0.055 * ring(u, 2), 0.42), dy: -0.012 * pump };
    },
  },
  // Relay mast: transmits — stretches up on its base, then sways back.
  W: {
    loopMs: 4000,
    cycleMs: 5200,
    actMs: 900,
    frame: (u, l) => {
      const up = bell(Math.min(1, u * 1.6));
      return {
        ...pivot(0.03 * sin(TAU * l) + 0.07 * ring(u, 2.5), 0.45),
        dy: -0.035 * up,
      };
    },
  },
  // Signal Pack: shuffles — a quick side-to-side wiggle on its bottom.
  P: {
    loopMs: 2600,
    cycleMs: 6500,
    actMs: 800,
    frame: (u, l) => ({
      ...pivot(0.1 * ring(u, 4), 0.4),
      scaleY: 1 + 0.01 * sin(TAU * l),
    }),
  },
  // The DJ: head-bobs to the beat, three nods.
  H1: {
    loopMs: 2000,
    cycleMs: 5200,
    actMs: 1000,
    frame: (u, l) => {
      const nod = u < 0 ? 0 : Math.abs(sin(Math.PI * 3 * u)) * (1 - 0.3 * u);
      return { dy: 0.045 * nod, rotation: 0.012 * ring(u, 3) };
    },
  },
  // The Selector: cocks the head to listen, holds, comes back.
  H2: {
    loopMs: 3250,
    cycleMs: 6500,
    actMs: 1300,
    frame: (u, l) => ({ ...pivot(-0.1 * bell(u) + 0.012 * sin(TAU * l), 0.4) }),
  },
  // The Caller: leans into the call — pushes toward the glass.
  H3: {
    loopMs: 2600,
    cycleMs: 5200,
    actMs: 900,
    frame: (u, l) => {
      const lean =
        u < 0
          ? 0
          : u < 0.3
            ? bell(u / 0.6)
            : 1 - (u - 0.3) / 0.7 + 0.15 * ring((u - 0.3) / 0.7, 2);
      return { dx: 0.032 * lean, dy: -0.012 * lean };
    },
  },
  // The Matriarch: a slow shrug — shoulders up, settle.
  H4: {
    loopMs: 4000,
    cycleMs: 8000,
    actMs: 1200,
    frame: (u, l) => {
      const up = bell(u);
      return { rotation: -0.025 * up, dy: -0.032 * up };
    },
  },
  // Coffee: steam-fed wobble; act = a hop on the saucer.
  L1: {
    loopMs: 1600,
    cycleMs: 4160,
    actMs: 640,
    frame: (u, l) => {
      const air = u < 0 ? 0 : u < 0.55 ? sin((Math.PI * u) / 0.55) : 0;
      const sq = u < 0.55 ? 0 : ring((u - 0.55) / 0.45, 2);
      return {
        dy: -0.08 * air,
        scaleX: 1 + 0.08 * sq,
        scaleY: 1 - 0.08 * sq + 0.005 * sin(TAU * l),
      };
    },
  },
  // Headphones: bass leaks out — the cups pump wide.
  L2: {
    loopMs: 2600,
    cycleMs: 3250,
    actMs: 720,
    frame: (u, l) => {
      const p = u < 0 ? 0 : Math.abs(sin(Math.PI * 4 * u)) * (1 - u * 0.5);
      return { ...pivot(0.06 * ring(u, 2), 0.2), dy: -0.03 * p };
    },
  },
  // Microphone: "one, two" — tapped, tips and rings back on its stand.
  L3: {
    loopMs: 3250,
    cycleMs: 5200,
    actMs: 1000,
    frame: (u, l) => pivot(0.02 * sin(TAU * l) + 0.15 * ring(u, 3), 0.42),
  },
  // Cassette: rigid shell tilts as the separately drawn tape reels turn.
  L4: {
    loopMs: 2000,
    cycleMs: 4000,
    actMs: 700,
    frame: (u, l) => {
      return { ...pivot(0.065 * bell(u), 0.25), dy: -0.012 * bell(u) };
    },
  },
  // Sneaker: taps its toe — heel planted, toe lifts twice.
  L5: {
    loopMs: 4000,
    cycleMs: 6500,
    actMs: 900,
    frame: (u, l) => {
      const tap = u < 0 ? 0 : Math.max(0, sin(TAU * 2 * u));
      return {
        ...pivot(-0.12 * tap, 0.3),
        dx: -0.02 * tap + 0.004 * sin(TAU * l),
      };
    },
  },
};

const REST: IdleFrame = {
  dx: 0,
  dy: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  alpha: 1,
  act: 0,
  actU: -1,
};

/** Cell phase 0..2π, 20 evenly spaced slots on the 5×4 board, neighbours far apart. */
export const idlePhase = (reel: number, row: number) =>
  ((((((reel * 4 + row) * 7) % 20) + 20) % 20) / 20) * TAU;

export const symbolIdleFrame = (
  name: string,
  t: number,
  phase: number,
): IdleFrame => {
  const spec = IDLE_SPECS[name];
  if (!spec) return REST;
  const off = (phase / TAU) * spec.cycleMs;
  const c = (((t + off) % spec.cycleMs) + spec.cycleMs) % spec.cycleMs;
  const u = c < spec.actMs ? c / spec.actMs : -1;
  const l =
    ((((t + (phase / TAU) * spec.loopMs) % spec.loopMs) + spec.loopMs) %
      spec.loopMs) /
    spec.loopMs;
  return { ...REST, ...spec.frame(u, l), act: bell(u), actU: u };
};
