/** Settled-board motion. Rigid props keep their shape; acts use their real pivot.
 * All periods divide the shared 520s clock, including at wrap-around. */
export type IdleFrame = {
  dx: number;
  dy: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  act: number;
  actU: number;
  loopU: number;
};
type Spec = {
  loopMs: number;
  cycleMs: number;
  actMs: number;
  frame: (u: number, l: number) => Partial<IdleFrame>;
  overlay?: boolean;
};
const TAU = Math.PI * 2;
const bell = (u: number) => (u < 0 ? 0 : Math.sin(Math.PI * u) ** 2);
const ring = (u: number, n: number) =>
  u < 0 ? 0 : Math.sin(Math.PI * n * u) * Math.sin(Math.PI * u);
// Rotation about (0, py) measured in cell units, not the artwork's centre.
const pivot = (r: number, py: number) => ({
  rotation: r,
  dx: py * Math.sin(r),
  dy: py * (1 - Math.cos(r)),
});
export const IDLE_SPECS: Record<string, Spec> = {
  H1: {
    loopMs: 3250,
    cycleMs: 6500,
    actMs: 1200,
    frame: (u, l) =>
      pivot(0.024 * Math.sin(TAU * l) + 0.105 * ring(u, 3), -0.31),
  }, // keys hang from their ring
  H2: {
    loopMs: 4000,
    cycleMs: 5200,
    actMs: 850,
    frame: (u, l) => ({
      ...pivot(0.018 * Math.sin(TAU * l) + 0.085 * ring(u, 6), -0.18),
      dx: 0.036 * ring(u, 4),
    }),
  }, // short metal rattle
  H3: {
    loopMs: 5200,
    cycleMs: 8000,
    actMs: 1000,
    frame: (u, l) => ({
      ...pivot(0.04 * ring(u, 3), 0.24),
      dx: 0.041 * bell(u),
      dy: -0.004 * Math.sin(TAU * l) - 0.009 * ring(u, 4),
    }),
  }, // heavy tin tips on its base
  H4: {
    loopMs: 4000,
    cycleMs: 6500,
    actMs: 1400,
    overlay: true,
    frame: (u, l) => ({
      ...pivot(0.022 * ring(u, 3), 0.22),
      dy: -0.003 * Math.sin(TAU * l),
    }),
  }, // hot mug, steam curls
  H5: {
    loopMs: 2600,
    cycleMs: 5200,
    actMs: 1000,
    overlay: true,
    frame: (u, l) => ({
      rotation: 0.008 * Math.sin(TAU * l),
      scaleX: 1 + 0.014 * bell(u),
    }),
  }, // chalk tally catches the light
  W: {
    loopMs: 4000,
    cycleMs: 4000,
    actMs: 900,
    frame: (u, l) => ({
      ...pivot(0.09 * ring(u, 2), 0.18),
      dy: -0.036 * bell(u) + 0.003 * Math.sin(TAU * l),
    }),
  }, // cap lifts at its brim
  S: {
    loopMs: 5200,
    cycleMs: 8000,
    actMs: 1050,
    frame: (u, l) => ({
      dx: 0.037 * ring(u, 8),
      scaleX: 1 + 0.004 * Math.sin(TAU * l),
    }),
  }, // cell gate rattles sideways
  SW: {
    loopMs: 4000,
    cycleMs: 5200,
    actMs: 1400,
    overlay: true,
    frame: (u, l) =>
      pivot(0.018 * Math.sin(TAU * l) + 0.065 * ring(u, 4), 0.26),
  }, // lamp searches from its mount
  L1: {
    loopMs: 4000,
    cycleMs: 6500,
    actMs: 900,
    frame: (u, l) => ({
      rotation: 0.025 * ring(u, 4),
      scaleX: 1 - 0.065 * bell(u) + 0.008 * Math.sin(TAU * l),
      dy: -0.009 * ring(u, 2),
    }),
  },
  L2: {
    loopMs: 2600,
    cycleMs: 5200,
    actMs: 800,
    frame: (u, l) => {
      const beat = bell(u) * (0.6 + 0.4 * Math.cos(TAU * 2 * Math.max(0, u)));
      return {
        scaleX: 1 + 0.055 * beat,
        scaleY: 1 + 0.045 * beat + 0.004 * Math.sin(TAU * l),
      };
    },
  },
  L3: {
    loopMs: 3250,
    cycleMs: 6500,
    actMs: 1100,
    frame: (u, l) => ({
      rotation: 0.11 * ring(u, 2),
      scaleX: 1 - 0.06 * bell(u) + 0.005 * Math.sin(TAU * l),
    }),
  },
  L4: {
    loopMs: 4000,
    cycleMs: 8000,
    actMs: 1000,
    frame: (u, l) => ({
      ...pivot(-0.085 * ring(u, 3), 0.2),
      dy: -0.012 * bell(u),
      scaleY: 1 + 0.006 * Math.sin(TAU * l),
    }),
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
export const symbolIdleFrame = (
  name: string,
  t: number,
  phase: number,
): IdleFrame => {
  const spec = IDLE_SPECS[name];
  if (!spec) return REST;
  const offset = phase / TAU;
  const c =
    (((t + offset * spec.cycleMs) % spec.cycleMs) + spec.cycleMs) %
    spec.cycleMs;
  const u = c < spec.actMs ? c / spec.actMs : -1;
  const l =
    ((((t + offset * spec.loopMs) % spec.loopMs) + spec.loopMs) % spec.loopMs) /
    spec.loopMs;
  return { ...REST, ...spec.frame(u, l), act: bell(u), actU: u, loopU: l };
};
