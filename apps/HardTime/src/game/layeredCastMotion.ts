/** Motion adapter for the prisoner's anatomically named arm bones.
 * Since 2026-09-27 the arms are folded and live in the body layer, which carries
 * no arm weights, so the arm gestures below move nothing; they are kept so the
 * A-pose rig (design/_legacy_assets/prisoner_apose_layers) still works if restored.
 * Timing, root lift, spine motion and flutter come from the existing table.
 * Only the isolated arms get an outward gesture. No global table edits.
 */
import { TIERS, type CastReactionKind, type ReactionTier } from './castMotion.ts';

// Swept ink bounds are x=276.45..801.58 (crossed arms, 2026-09-27; the A-pose
// figure swept 113.89..978.28). Extra padding covers mesh cells and
// antialiasing; the gate enforces this envelope before a build can ship.
export const LAYERED_X_ENVELOPE = [258, 820] as const;

function isolatedArms(kind: CastReactionKind, fraction: number): ReactionTier {
  const source = TIERS[kind];
  return {
    ...source,
    bones: {
      ...source.bones,
      // Image right = anatomical left. Negative opens that arm outward.
      // Rest pose already provides clearance; avoid swinging back into torso.
      arm_l: [-3 * fraction, 35], fore_l: [-3 * fraction, 70],
      arm_r: [2 * fraction, 20], fore_r: [3 * fraction, 55],
    },
  };
}
export const LAYERED_TIERS: Record<CastReactionKind, ReactionTier> = {
  win: isolatedArms('win', .5),
  winBig: isolatedArms('winBig', .75),
  trigger: isolatedArms('trigger', 1),
};

// Different person, different rig: shoulders lead, the held baton stays rigid.
function wardenTier(kind: CastReactionKind): ReactionTier {
  const source = LAYERED_TIERS[kind];
  return {
    ...source, rise: 0, lean: 0, glow: 0.08, scale: undefined, flutter: undefined,
    bones: { waist: [1.2, 0], chest: [1.8, 25], neck: [1, 55], head: [1.8, 75],
      arm_l: [-2.0, 35], fore_l: [-1.0, 70], arm_r: [1.4, 70], fore_r: [1, 100],
      dangle_chain: [-3.5, 100], dangle_mask: [3, 130] },
  };
}
export const WARDEN_TIERS: Record<CastReactionKind, ReactionTier> = {
  win: wardenTier("win"), winBig: wardenTier("winBig"), trigger: wardenTier("trigger"),
};
