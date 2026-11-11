/**
 * Quiet board direction (2026-10-31): one cell gets a short accent every 5.2s.
 * The other nineteen hold their source pose. Each cell waits 104s between acts;
 * phase order is spatially scattered so this never reads as a reel sweep.
 * Winning symbols keep their separate, full celebration choreography.
 */

export type IdleFrame = {
  dx: number; // fraction of SYMBOL_SIZE
  dy: number;
  rotation: number; // radians
  scaleX: number;
  scaleY: number;
  alpha: number;
  /** 0..1 envelope of the act (0 = between acts) */
  act: number;
  /** 0..1 progress through the act, -1 between acts */
  actU: number;
  /** ambient loop position 0..1, for overlays that run continuously */
  loopU: number;
};

type IdleSpec = {
  /** ambient loop period, ms */
  loopMs: number;
  /** act repeats every cycleMs and lasts actMs */
  cycleMs: number;
  actMs: number;
  /** u: act progress 0..1 (or -1), l: loop position 0..1 */
  frame: (u: number, l: number) => Partial<IdleFrame>;
  /** the act is mainly drawn by SymbolArt (light, rings), not by transform */
  overlay?: boolean;
};

const TAU = Math.PI * 2;
const sin = (x: number) => Math.sin(x);
// smooth 0→1→0 bell over u ∈ [0,1]
const bell = (u: number) => (u < 0 || u > 1 ? 0 : Math.sin(Math.PI * u) ** 2);
// damped oscillation, n half-swings over u
const ring = (u: number, n: number) =>
  u < 0 ? 0 : Math.sin(Math.PI * n * u) * (1 - u);
// rotation about a pivot above the centre: compensating offset
const pivot = (rot: number, py: number) => ({
  rotation: rot,
  dx: py * Math.sin(rot),
  dy: py * (1 - Math.cos(rot)),
});

export const IDLE_SPECS: Record<string, IdleSpec> = {
  // Boombox: bass thump — two pumps, speaker rings drawn by SymbolArt.
  S: {
    overlay: true,
    loopMs: 2000,
    cycleMs: 4000,
    actMs: 640,
    frame: (u, l) => {
      const pump = u < 0 ? 0 : Math.max(0, sin(TAU * 2 * u)) * (1 - u * 0.4);
      return { rotation: 0.055 * ring(u, 2), dy: 0.008 * pump };
    },
  },
  // Brass knuckles: a jab — pull back, punch forward, settle; sparkle on the knuckle.
  W: {
    loopMs: 4000,
    cycleMs: 5200,
    actMs: 720,
    frame: (u, l) => {
      const jab =
        u < 0
          ? 0
          : u < 0.25
            ? -0.5 * bell(u / 0.25)
            : ring((u - 0.25) / 0.75, 2.2);
      return {
        scaleX: 1 + 0.07 * jab,
        scaleY: 1 + 0.07 * jab,
        rotation: 0.026 * sin(TAU * l) - 0.07 * jab,
      };
    },
  },
  // Bruiser: shoulder roll and a nod — she is alive, not a sticker.
  SW: {
    loopMs: 3250,
    cycleMs: 6500,
    actMs: 1000,
    frame: (u, l) => {
      const roll = bell(u);
      const nod = u < 0 ? 0 : Math.max(0, sin(TAU * 2 * u)) * (u > 0.5 ? 1 : 0);
      return {
        ...pivot(-0.09 * roll * sin(Math.PI * u * 2), 0.45),
        scaleY: 1 + 0.015 * sin(TAU * l) + 0.025 * roll,
        dy: -0.03 * roll + 0.03 * nod,
      };
    },
  },
  // Gold chain: hangs from its top and swings; act = a bigger swing.
  H1: {
    loopMs: 3250,
    cycleMs: 5000,
    actMs: 1200,
    frame: (u, l) => pivot(0.05 * sin(TAU * l) + 0.11 * ring(u, 3), -0.42),
  },
  // Safehouse: lights go on in the windows (warm additive glow), slight settle.
  H2: {
    loopMs: 4000,
    cycleMs: 8000,
    actMs: 1600,
    overlay: true,
    frame: () => ({}),
  },
  // Cash rolls: hop and land with a squash.
  H3: {
    loopMs: 2600,
    cycleMs: 4000,
    actMs: 640,
    frame: (u, l) => {
      const air = u < 0 ? 0 : u < 0.55 ? sin((Math.PI * u) / 0.55) : 0;
      const squash = u < 0.55 ? 0 : ring((u - 0.55) / 0.45, 2);
      return {
        dy: -0.09 * air,
        scaleX: 1 + 0.08 * squash - 0.03 * air,
        scaleY: 1 - 0.08 * squash + 0.04 * air + 0.006 * sin(TAU * l),
      };
    },
  },
  // Soda bottle: fizz rises all the time; act = a shake that wobbles it.
  H4: {
    loopMs: 1600,
    cycleMs: 5200,
    actMs: 800,
    frame: (u) => pivot(0.12 * ring(u, 5), 0.4),
  },
  // Lowrider: engine idle shake; act = hydraulic front hop, two settle bounces.
  H5: {
    loopMs: 4000,
    cycleMs: 4000,
    actMs: 900,
    frame: (u, l) => {
      const hop =
        u < 0
          ? 0
          : u < 0.35
            ? sin((Math.PI * u) / 0.35)
            : 0.35 * ring((u - 0.35) / 0.65, 3);
      return {
        ...pivot(-0.09 * hop, 0.15),
        dy: -0.05 * Math.max(0, hop) + 0.002 * sin(TAU * l),
      };
    },
  },
  // Crown: tips and rights itself like a hat being tapped.
  L1: {
    loopMs: 4000,
    cycleMs: 4000,
    actMs: 1000,
    frame: (u, l) => ({
      ...pivot(0.17 * ring(u, 3), 0.3),
      dy: -0.05 * bell(u * 1.5),
      scaleY: 1 + 0.025 * sin(TAU * l),
    }),
  },
  // Skull: jaw chatter — three quick vertical snaps with a head tilt.
  L2: {
    loopMs: 3250,
    cycleMs: 3250,
    actMs: 720,
    frame: (u, l) => {
      const chatter =
        u < 0 ? 0 : Math.abs(sin(Math.PI * 3 * u)) * (1 - u * 0.5);
      return {
        dy: 0.035 * chatter,
        rotation: 0.08 * bell(u) + 0.035 * sin(TAU * l),
      };
    },
  },
  // Star: a painted trace and a small recoil; returns to its source orientation.
  L3: {
    loopMs: 2600,
    cycleMs: 4160,
    actMs: 900,
    frame: (u, l) => {
      const e = u < 0 ? 0 : u < 1 ? 1 - (1 - u) ** 3 : 1;
      return {
        rotation: 0.15 * ring(u, 2),
        scaleX: 1 + 0.12 * bell(u) + 0.02 * sin(TAU * l),
        scaleY: 1 + 0.12 * bell(u) + 0.02 * sin(TAU * l),
      };
    },
  },
  // Lightning: crackles — flicker and a sideways jolt.
  L4: {
    loopMs: 2000,
    cycleMs: 3250,
    actMs: 640,
    frame: (u, l) => {
      const on =
        u < 0 ? 1 : [1, 0.35, 1, 0.5, 1, 1][Math.min(5, Math.floor(u * 6))];
      return {
        alpha: on,
        dx: u < 0 ? 0 : 0.05 * sin(Math.PI * 7 * u) * (1 - u),
        scaleY: 1 + 0.08 * bell(u) + 0.02 * sin(TAU * l),
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
  loopU: 0,
};

/**
 * `t` = shared idle clock (ms), `phase` = the cell's idle phase (0..2π) from
 * idleBreathe.idlePhase, so the acts are spread across the board.
 */
export const symbolIdleFrame = (
  name: string,
  t: number,
  phase: number,
): IdleFrame => {
  const spec = IDLE_SPECS[name];
  if (!spec) return REST;
  const slotMs = 5200;
  const cycleMs = slotMs * 20; // divides the shared 520,000ms clock wrap
  const slot = Math.round((phase / TAU) * 20) % 20;
  const c = ((t % cycleMs) + cycleMs) % cycleMs;
  // Leave a quiet lead-in in every slot, including the first one.
  const elapsed = c - slot * slotMs - 2200;
  const u = elapsed >= 0 && elapsed < spec.actMs ? elapsed / spec.actMs : -1;
  if (u < 0) return REST;
  // No perpetual object wobble under the accent; preserve its authored act.
  return { ...REST, ...spec.frame(u, 0), act: bell(u), actU: u, loopU: 0 };
};
