// Adapted from our approved DeadwoodExpress conductor motion.
// Bone roles match: l bent cigar hand, r straight hanging hand.
import type {ReactionTier, ReactionSpec, CastReactionKind} from "./castMotion";
const REFERENCE_ROTATION: Record<string, number> = {
 chest:1.68, neck:2.70, head:4.02, arm_l:.36, fore_l:1.08, arm_r:-.48, fore_r:-1.56,
};


const REFERENCE_SCALE: Record<string, [number,number]> = {
 arm_r:[1.23,1.1], fore_r:[1.15,1.05], chest:[1.06,1.02], neck:[1.04,1], arm_l:[.97,1.02], fore_l:[.96,1.02]
};

const REFERENCE_SCALE_K = 0.42;


const REFERENCE_LIFT = { lean: 0.018, rise: 0.045 };


const REFERENCE_FLUTTER = { depth: 0.13, periodMs: 66.7 };


function fromReference(
  fraction: number,
  timing: { durationMs: number; snap: number; hold: number },
  glow = 0,
): ReactionTier {
  const bones: ReactionSpec = {};
  for (const [bone, degrees] of Object.entries(REFERENCE_ROTATION))
    bones[bone] = [degrees * fraction, 0];
  return {
    ...timing,
    bones,
    rise: REFERENCE_LIFT.rise * fraction,
    lean: REFERENCE_LIFT.lean * fraction,
    stretch: 0,
    scale: { k: REFERENCE_SCALE_K * fraction, shape: REFERENCE_SCALE },
    flutter: REFERENCE_FLUTTER,
    glow,
  };
}


const TRIGGER_REACTION: ReactionTier = fromReference(
  1,
  { durationMs: 1000, snap: 0.18, hold: 0.63 },
  0.34,
);


const WIN_BIG_REACTION: ReactionTier = fromReference(0.75, {
  durationMs: 880,
  snap: 0.15,
  hold: 0.6,
});


const WIN_REACTION: ReactionTier = fromReference(0.5, {
  durationMs: 720,
  snap: 0.18,
  hold: 0.42,
});



export const DON_DEADWOOD_TIERS: Record<CastReactionKind, ReactionTier> = {win:WIN_REACTION,winBig:WIN_BIG_REACTION,trigger:TRIGGER_REACTION};
