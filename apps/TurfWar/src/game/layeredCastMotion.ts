/** Original crossed-arm shoulder beat: quick recoil, no held pose or arm stretch.
 * Feet stay planted; props follow the chest/head in the delivered skeleton. */
import type { CastReactionKind, ReactionTier } from "./castMotion.ts";
const FRACTION: Record<CastReactionKind, number> = { win: 0.5, winBig: 0.75, trigger: 1 };
function crossed(kind: CastReactionKind, boss = false): ReactionTier {
  const f = FRACTION[kind] * (boss ? 0.85 : 1);
  return {
    durationMs: 700, snap: 0.2, hold: 0.24,
    rise: 0, stretch: 0, lean: 0, glow: 0,
    bones: {
      waist: [0.8 * f, 0], chest: [-1.8 * f, 0],
      neck: [1.1 * f, 20], head: [3.2 * f, 40],
      arm_l: [0, 0], fore_l: [0, 0],
      arm_r: [0, 0], fore_r: [0, 0],
      dangle_chain: [4 * f, 75], dangle_mask: [5 * f, 85],
      dangle_smoke: [5 * f, 80],
    },
  };
}
export const LAYERED_TIERS: Record<CastReactionKind, ReactionTier> = {
  win: crossed("win"), winBig: crossed("winBig"), trigger: crossed("trigger"),
};
export const KINGPIN_TIERS: Record<CastReactionKind, ReactionTier> = {
  win: crossed("win", true), winBig: crossed("winBig", true), trigger: crossed("trigger", true),
};
