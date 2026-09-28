/**
 * Reaction tables for the two layered cast figures (2026-09-28):
 *   don      MG, archetype #1 — both arms hang free, cigar in mouth
 *   hostess  FG, archetype #3 — right hand (screen right) holds a mic stand
 *
 * Every game now stands one figure in MG and a different one in FG. Each
 * figure is its own drawing on its own rig, so each gets its own table here;
 * castMotion.ts keeps only the shared idle and the posing / skinning code.
 *
 * Sign convention on these rigs (y down, + turns clockwise on screen, sides
 * anatomical): `arm_l` is on screen RIGHT and opens outward with a NEGATIVE
 * angle, `arm_r` is on screen LEFT and opens with a POSITIVE one. That is the
 * reverse of the old Don rig (whose note says arm_l + / arm_r − opens), so the
 * old tables' arm signs are not reused.
 *
 * Size: the body chain is Hot Miami's hand-written ladder at the 0.36 its own
 * man shipped with. The arms are separate layers now, rigid from shoulder to
 * fingertip, so they take more than the body (0.6 of the ladder) — the old
 * Don's 0.18 was a property of his drawing (arms against the body, one lattice
 * column per arm) and does not apply. The hostess's mic arm stays small: the
 * stand clears her head by 70 px at rest and must not swing toward it.
 *
 * `bones` values are final degrees; LayeredFigure passes motionScale 1.
 * Verified with hacksaw-character-motion's check_layered_cast.mjs against
 * design/cast_parts/{mg,fg}/layers.manifest.json.
 */
import { HOLD, SNAP, type CastReactionKind, type ReactionTier } from "./castMotion.ts";

export type CastFigureId = "don" | "hostess";

const BODY = 0.36;
const ARM = 0.6;

// Hot Miami's ladder, unscaled: [trigger, winBig, win]
const LADDER = {
  hips: [1.6, 1.3, 0.6],
  waist: [2.5, 2.0, 0.9],
  chest: [3.5, 2.8, 1.3],
  neck: [4.7, 3.8, 1.8],
  head: [6.4, 5.1, 2.4],
  arm: [7.5, 6.0, 3.0],
  fore: [12.5, 10.0, 5.0],
} as const;
const RUNG: Record<CastReactionKind, 0 | 1 | 2> = { trigger: 0, winBig: 1, win: 2 };
const TIMING: Record<CastReactionKind, { durationMs: number; rise: number; stretch: number; glow?: number; k: number }> = {
  trigger: { durationMs: 1250, rise: 0.045, stretch: 0.025, glow: 0.34, k: 0.42 },
  winBig: { durationMs: 1100, rise: 0.035, stretch: 0.02, k: 0.42 * 0.8 },
  win: { durationMs: 950, rise: 0.015, stretch: 0.01, k: 0.42 * 0.4 },
};
// dangles lag the head and overshoot it; [trigger peak deg, lag ms]
const DANGLE: Record<string, [number, number]> = {
  dangle_smoke: [5, 220],
  dangle_ponytail: [7, 210],
  dangle_earring_l: [5, 170],
  dangle_earring_r: [-5, 190],
};
const FLUTTER = { depth: 0.13, periodMs: 66.7 };

function tier(kind: CastReactionKind, figure: CastFigureId): ReactionTier {
  const r = RUNG[kind];
  const t = TIMING[kind];
  const ladderFraction = LADDER.arm[r] / LADDER.arm[0];
  const body = (key: keyof typeof LADDER, lag: number): [number, number] => [LADDER[key][r] * BODY, lag];
  const arm = (key: "arm" | "fore", sign: number, share: number, lag: number): [number, number] =>
    [sign * LADDER[key][r] * ARM * share, lag];
  const dangles = Object.fromEntries(
    Object.entries(DANGLE).map(([name, [deg, lag]]) => [name, [deg * ladderFraction, lag] as [number, number]]),
  );
  const bones: Record<string, [number, number]> =
    figure === "don"
      ? {
          // The boss squares up: elbows go OUT, forearms swing back IN, so the
          // hands stay near the hips while the silhouette widens at the elbow.
          // Throwing the hands out is not available on this drawing — each hand
          // hangs only ~65 px from the canvas edge and check_layered_cast wants
          // 40 px of it kept (an outward throw measured 16.5 px).
          arm_l: arm("arm", -1, 1, 110),
          fore_l: arm("fore", 1, 0.5, 190),
          arm_r: arm("arm", 1, 0.8, 120),
          fore_r: arm("fore", -1, 0.4, 200),
        }
      : {
          // the free hanging arm (screen left) drives; the mic arm only lifts a little
          arm_r: arm("arm", 1, 1, 110),
          fore_r: arm("fore", 1, 1, 190),
          arm_l: arm("arm", -1, 0.25, 140),
          fore_l: arm("fore", -1, 0.2, 220),
        };
  return {
    durationMs: t.durationMs,
    snap: SNAP,
    hold: HOLD,
    rise: t.rise,
    stretch: t.stretch,
    ...(t.glow ? { glow: t.glow } : {}),
    // the bulge rides the driving arm only; never the mic arm, whose fingers
    // layer sits over the stand and would slide off a widened forearm
    scale: {
      k: t.k,
      shape: figure === "don" ? { arm_l: [1.0, 1.23] as [number, number], fore_r: [1.06, 0.8] as [number, number] } : { arm_r: [1.0, 1.23] as [number, number] },
    },
    flutter: FLUTTER,
    bones: {
      hips: body("hips", 0),
      waist: body("waist", 40),
      chest: body("chest", 80),
      neck: body("neck", 130),
      head: body("head", 180),
      ...bones,
      ...dangles,
    },
  };
}

const tiersFor = (figure: CastFigureId): Record<CastReactionKind, ReactionTier> => ({
  win: tier("win", figure),
  winBig: tier("winBig", figure),
  trigger: tier("trigger", figure),
});

export const DON_TIERS = tiersFor("don");
export const HOSTESS_TIERS = tiersFor("hostess");
export const LAYERED_TIERS: Record<CastFigureId, Record<CastReactionKind, ReactionTier>> = {
  don: DON_TIERS,
  hostess: HOSTESS_TIERS,
};

/** Swept ink x-range in rig pixels (1024-wide canvas) across the idle and every
 *  tier at 1x/2x/4x, plus padding for mesh cells and antialiasing. Cast.svelte
 *  fits THIS between the board and the screen edge, so a reaction peak never
 *  reaches the housing. Measured by design/measure_cast_envelope.mjs. */
export const LAYERED_X_ENVELOPE: Record<CastFigureId, readonly [number, number]> = {
  // measured 48.7..996.3 (2026-09-28), padded 18
  don: [30, 1015],
  // measured 111.0..957.0 (2026-09-28; right end is the mic stand), padded 18
  hostess: [93, 975],
};
