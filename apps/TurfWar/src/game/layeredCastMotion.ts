/** Motion for the delivered bat carrier. The free anatomical left arm is
 * isolated from the torso, so it can open on a reaction without shearing the
 * hoodie. The raised right arm and bat move together through the forearm. */
import {
  TIERS_BY_POSE,
  type CastReactionKind,
  type ReactionTier,
} from "./castMotion.ts";

const FRACTION: Record<CastReactionKind, number> = {
  win: 0.5,
  winBig: 0.75,
  trigger: 1,
};

function tier(kind: CastReactionKind): ReactionTier {
  const source = TIERS_BY_POSE.layered[kind];
  const f = FRACTION[kind];
  return {
    ...source,
    // The shoes are visible at the bet strip, so a whole-body lift reads as
    // levitation. Bend the waist instead and keep the feet planted.
    rise: 0,
    lean: 0,
    glow: kind === "trigger" ? 0.12 : source.glow,
    bones: {
      ...source.bones,
      waist: [1.2 * f, 0],
      arm_l: [-4 * f, 0],
      fore_l: [-2 * f, 70],
      arm_r: [3 * f, 100],
      fore_r: [2 * f, 160],
      dangle_chain: [-4 * f, 100],
      dangle_mask: [6 * f, 140],
    },
  };
}

export const LAYERED_TIERS: Record<CastReactionKind, ReactionTier> = {
  win: tier("win"),
  winBig: tier("winBig"),
  trigger: tier("trigger"),
};

// The Kingpin keeps his hands low; shoulders and coat carry the reward beat.
function kingpinTier(kind: CastReactionKind): ReactionTier {
  const source = LAYERED_TIERS[kind];
  return {
    ...source, rise: 0, lean: 0, glow: 0.08, scale: undefined, flutter: undefined,
    bones: { waist: [1.8, 0], chest: [2.4, 25], neck: [1.2, 60], head: [2.2, 90],
      arm_l: [-1.2, 35], fore_l: [-0.6, 70], arm_r: [1.2, 45], fore_r: [0.6, 80],
      dangle_smoke: [4, 110] },
  };
}
export const KINGPIN_TIERS: Record<CastReactionKind, ReactionTier> = {
  win: kingpinTier("win"), winBig: kingpinTier("winBig"), trigger: kingpinTier("trigger"),
};
