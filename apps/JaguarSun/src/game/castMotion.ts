

export type MotionSpec = [
  amplitude: number,
  lagMs: number,
  periodMs: number,
  oddScale: number,
];


export type ReactionSpec = Record<string, [amplitudeDeg: number, lagMs: number]>;


export type ReactionTier = {
  bones: ReactionSpec;
  durationMs: number;
  snap: number;
  hold: number;
  rise: number;
  stretch: number;
  lean: number;
  
  push?: { bone: string; x: number; y: number };
  
  tremor?: { deg: number; periodMs: number; bones: string[] };
  
  glow?: number;
  
  scale?: { k: number; shape: Record<string, [along: number, across: number]> };
  
  flutter?: { depth: number; periodMs: number };
};

export const DEG = Math.PI / 180;
export const LOOP_MS = 8000;

// Idle envelope shape, and the default for the reaction tiers that do not
// override it.
export const SNAP = 0.18;
export const HOLD = 0.63;


export const IDLE: Record<string, MotionSpec> = {
  root: [0.0, 0, 2000, 0.0],
  hips: [0.06, 0, 2450, 0.0],
  waist: [0.12, 360, 2800, 0.2],
  chest: [0.24, 180, 2150, 0.3],
  neck: [0.38, 120, 2650, 0.5],
  head: [0.55, 60, 1750, 0.8],
  arm_l: [1.6, 0, 2050, 0.4],
  fore_l: [1.2, 300, 1800, 0.3],
  arm_r: [1.5, 180, 1500, 0.4],
  fore_r: [1.1, 360, 1550, 0.3],
};




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


export const TRIGGER_REACTION: ReactionTier = fromReference(
  1,
  { durationMs: 1000, snap: 0.18, hold: 0.63 },
  0.34,
);


export const WIN_BIG_REACTION: ReactionTier = fromReference(0.75, {
  durationMs: 880,
  snap: 0.15,
  hold: 0.6,
});


export const WIN_REACTION: ReactionTier = fromReference(0.5, {
  durationMs: 720,
  snap: 0.18,
  hold: 0.42,
});


export const MOTION_SCALE: Record<"guy", number> = {
  guy: 1,
};

export type CastReactionKind = "win" | "winBig" | "trigger";

export const TIERS: Record<CastReactionKind, ReactionTier> = {
  win: WIN_REACTION,
  winBig: WIN_BIG_REACTION,
  trigger: TRIGGER_REACTION,
};

export function wave(value: number) {
  const u = value - Math.floor(value);
  const v = u < 0.38 ? u / 0.38 : 1 - (u - 0.38) / 0.62;
  return v * v * (3 - 2 * v) * 2 - 1;
}

export function oddBeat(value: number) {
  return value < 0.5 || value > 0.74
    ? 0
    : -Math.sin((Math.PI * (value - 0.5)) / 0.24);
}

export function idleAngle(spec: MotionSpec, timeMs: number) {
  const [amplitude, lagMs, periodMs, oddScale] = spec;
  if (!amplitude) return 0;
  const phase = timeMs - lagMs;
  let angle = amplitude * wave(phase / periodMs);
  angle += amplitude * 0.25 * Math.sin((Math.PI * 2 * phase) / LOOP_MS);
  if (oddScale) {
    const loopPosition = (((phase % LOOP_MS) + LOOP_MS) % LOOP_MS) / LOOP_MS;
    angle += amplitude * oddScale * oddBeat(loopPosition);
  }
  return angle;
}

export function reactionEnvelope(value: number, snap = SNAP, hold = HOLD) {
  if (value <= 0 || value >= 1) return 0;
  if (value < snap) {
    const t = value / snap;
    return t * t * (3 - 2 * t);
  }
  if (value < hold) return 1;
  const t = 1 - (value - hold) / (1 - hold);
  return t * t * (3 - 2 * t);
}



export type Bone = {
  name: string;
  x: number;
  y: number;
  parent: number;
  
  axis?: [number, number];
};

export type MeshRig = {
  size: [number, number];
  figure_box: [number, number, number, number];
  verts: [number, number][];
  tris: [number, number, number][];
  weights: number[][];
  bones: Bone[];
};

export type PoseState = {
  
  timeMs: number;
  tier: ReactionTier;
  
  reactionAge: number | null;
  
  durationMs: number;
  speed: number;
  motionScale: number;
};


export function bodyEnvelope(state: PoseState) {
  if (state.reactionAge === null) return 0;
  return reactionEnvelope(
    state.reactionAge / state.durationMs,
    state.tier.snap,
    state.tier.hold,
  );
}


const axesCache = new WeakMap<MeshRig, Float64Array>();
export function boneAxes(rig: MeshRig) {
  const cached = axesCache.get(rig);
  if (cached) return cached;
  const firstChild = new Map<number, number>();
  rig.bones.forEach((bone, index) => {
    if (bone.parent >= 0 && !firstChild.has(bone.parent))
      firstChild.set(bone.parent, index);
  });
  const axes = new Float64Array(rig.bones.length * 2);
  rig.bones.forEach((bone, index) => {
    let dx = 0;
    let dy = -1;
    const child = firstChild.get(index);
    if (bone.axis) {
      [dx, dy] = bone.axis;
    } else if (child !== undefined) {
      dx = rig.bones[child].x - bone.x;
      dy = rig.bones[child].y - bone.y;
    } else if (bone.parent >= 0) {
      dx = bone.x - rig.bones[bone.parent].x;
      dy = bone.y - rig.bones[bone.parent].y;
    }
    const length = Math.hypot(dx, dy);
    axes[index * 2] = length > 1e-9 ? dx / length : 0;
    axes[index * 2 + 1] = length > 1e-9 ? dy / length : -1;
  });
  axesCache.set(rig, axes);
  return axes;
}


export function composeBoneMatrices(
  rig: MeshRig,
  state: PoseState,
  out: Float32Array[],
  chain: Float32Array[],
) {
  const { tier, reactionAge, durationMs, speed, motionScale, timeMs } = state;
  const bodyReaction = bodyEnvelope(state);
  const [boxX0, boxY0, boxX1, boxY1] = rig.figure_box;
  const figureWidth = boxX1 - boxX0;
  const figureHeight = boxY1 - boxY0;
  const shape = tier.scale?.shape;
  const axes = shape ? boneAxes(rig) : null;

  for (let index = 0; index < rig.bones.length; index += 1) {
    const bone = rig.bones[index];
    const idle = idleAngle(IDLE[bone.name] ?? [0, 0, 2000, 0], timeMs);
    // Each bone rides the same envelope, started `lag` ms later, so the pose
    // travels out along the chain instead of arriving all at once.
    let reaction = 0;
    const spec = tier.bones[bone.name];
    if (spec && reactionAge !== null) {
      const [amplitude, lagMs] = spec;
      const envelope = reactionEnvelope(
        (reactionAge - lagMs / speed) / durationMs,
        tier.snap,
        tier.hold,
      );
      reaction = amplitude * motionScale * envelope;
      const tremor = tier.tremor;
      if (tremor && envelope > 0 && tremor.bones.includes(bone.name)) {
        const period = tremor.periodMs / speed;
        reaction +=
          tremor.deg *
          motionScale *
          envelope *
          Math.sin((reactionAge / period) * Math.PI * 2);
      }
    }
    const angle = (idle + reaction) * DEG;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    let offsetX = 0;
    let offsetY = 0;
    // Rise, lean and stretch ride the root, so they move the ENTIRE figure
    // rigidly — no joint bends, so no mesh distortion at any amplitude.
    let scaleY = 1;
    if (index === 0 && bodyReaction > 0) {
      offsetX = figureWidth * tier.lean * motionScale * bodyReaction;
      offsetY = figureHeight * -tier.rise * motionScale * bodyReaction;
      scaleY = 1 + tier.stretch * motionScale * bodyReaction;
    }
    const a = cosine;
    const b = -sine * scaleY;
    const d = sine;
    const e = cosine * scaleY;
    const local = [
      a,
      b,
      bone.x - a * bone.x - b * bone.y + offsetX,
      d,
      e,
      bone.y - d * bone.x - e * bone.y + offsetY,
    ];

    // This bone's own squash and stretch, if the tier gives it one and the
    // reaction is live. Uses the SAME lagged envelope as this bone's rotation,
    // so the bulge arrives with the swing rather than ahead of it — the
    // reference drives both from one envelope, and keeping them in step is what
    // that preserves.
    let skin = local;
    const bulge = shape?.[bone.name];
    if (bulge && axes && reactionAge !== null) {
      const lagMs = spec ? spec[1] : 0;
      const u = (reactionAge - lagMs / speed) / durationMs;
      const envelope = reactionEnvelope(u, tier.snap, tier.hold);
      if (envelope > 0) {
        const k = (tier.scale?.k ?? 0) * motionScale;
        let wobble = 0;
        const flutter = tier.flutter;
        if (flutter && u >= tier.snap && u <= tier.hold) {
          wobble =
            flutter.depth *
            Math.sin((reactionAge / (flutter.periodMs / speed)) * Math.PI * 2);
        }
        const along = 1 + (bulge[0] - 1) * envelope * k * (1 + wobble);
        const across = 1 + (bulge[1] - 1) * envelope * k * (1 + wobble);
        if (along !== 1 || across !== 1) {
          const ux = axes[index * 2];
          const uy = axes[index * 2 + 1];
          // A · diag(along, across) · Aᵀ, A the bone's frame
          const s00 = ux * ux * along + uy * uy * across;
          const s01 = ux * uy * (along - across);
          const s11 = uy * uy * along + ux * ux * across;
          const m00 = a * s00 + b * s01;
          const m01 = a * s01 + b * s11;
          const m10 = d * s00 + e * s01;
          const m11 = d * s01 + e * s11;
          skin = [
            m00,
            m01,
            bone.x - m00 * bone.x - m01 * bone.y + offsetX,
            m10,
            m11,
            bone.y - m10 * bone.x - m11 * bone.y + offsetY,
          ];
        }
      }
    }

    const matrix = out[index];
    const link = chain[index];
    if (bone.parent < 0) {
      matrix.set(skin);
      link.set(local);
    } else {
      const parent = chain[bone.parent];
      matrix[0] = parent[0] * skin[0] + parent[1] * skin[3];
      matrix[1] = parent[0] * skin[1] + parent[1] * skin[4];
      matrix[2] = parent[0] * skin[2] + parent[1] * skin[5] + parent[2];
      matrix[3] = parent[3] * skin[0] + parent[4] * skin[3];
      matrix[4] = parent[3] * skin[1] + parent[4] * skin[4];
      matrix[5] = parent[3] * skin[2] + parent[4] * skin[5] + parent[5];
      if (skin === local) {
        link.set(matrix);
      } else {
        link[0] = parent[0] * local[0] + parent[1] * local[3];
        link[1] = parent[0] * local[1] + parent[1] * local[4];
        link[2] = parent[0] * local[2] + parent[1] * local[5] + parent[2];
        link[3] = parent[3] * local[0] + parent[4] * local[3];
        link[4] = parent[3] * local[1] + parent[4] * local[4];
        link[5] = parent[3] * local[2] + parent[4] * local[5] + parent[5];
      }
    }
  }

  // The perspective push, applied AFTER the whole hierarchy is composed and
  // written straight into one bone's final SKIN matrix, so it reaches only the
  // vertices weighted to that bone and nothing inherits it.
  const push = tier.push;
  if (push && bodyReaction > 0) {
    const pushIndex = rig.bones.findIndex((bone) => bone.name === push.bone);
    if (pushIndex >= 0) {
      const matrix = out[pushIndex];
      matrix[2] += figureWidth * push.x * motionScale * bodyReaction;
      matrix[5] += figureHeight * push.y * motionScale * bodyReaction;
    }
  }

  return bodyReaction;
}


export function buildWeightIndex(rig: MeshRig) {
  const bones: number[][] = [];
  const values: number[][] = [];
  for (const row of rig.weights) {
    const rowBones: number[] = [];
    const rowValues: number[] = [];
    row.forEach((weight, boneIndex) => {
      if (weight > 0) {
        rowBones.push(boneIndex);
        rowValues.push(weight);
      }
    });
    bones.push(rowBones);
    values.push(rowValues);
  }
  return { bones, values };
}


export function skinVertices(
  rest: Float32Array,
  index: { bones: number[][]; values: number[][] },
  matrices: Float32Array[],
  out: Float32Array,
) {
  for (let vertex = 0; vertex < index.bones.length; vertex += 1) {
    const x = rest[vertex * 2];
    const y = rest[vertex * 2 + 1];
    let animatedX = 0;
    let animatedY = 0;
    const bones = index.bones[vertex];
    const values = index.values[vertex];
    for (let i = 0; i < bones.length; i += 1) {
      const matrix = matrices[bones[i]];
      const weight = values[i];
      animatedX += (matrix[0] * x + matrix[1] * y + matrix[2]) * weight;
      animatedY += (matrix[3] * x + matrix[4] * y + matrix[5]) * weight;
    }
    out[vertex * 2] = animatedX;
    out[vertex * 2 + 1] = animatedY;
  }
}
