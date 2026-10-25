// Per-animation checks on the 4.3 rig: the kit's smoothness score, mesh folds (only triangles that cover art), how far
// each joint turns, hands that can't reach their target, planted feet that slide, and idle's first frame vs the art.
import type { Mesh, RigResult } from './rig.ts';

export interface AnimCheck {
  name: string;
  duration: number;
  loop: boolean;
  score: number;
  issues: string[];
  flipped: number;
  squashed: number;
  foldAt: string;
  turns: Record<string, { plus: number; minus: number }>;
  /**
   * How far an IK hand falls short of where the motion puts its target, beyond the gap the soft IK keeps in the drawn
   * pose, as a fraction of the arm's reach (the motion asks for more reach than the arm has).
   */
  handLag: number;
  /** Largest move of an ankle (px) while its foot target stays put: a planted foot that slides or lifts. */
  footSlide: number;
  firstFrame: number;
}

const JOINTS = ['head', 'chest', 'upperArmL', 'foreArmL', 'upperArmR', 'foreArmR', 'thighL', 'shinL', 'thighR', 'shinR'];
const LABEL: Record<string, string> = { head: '頭', chest: '胸', upperArmL: '左肩', foreArmL: '左肘', upperArmR: '右肩', foreArmR: '右肘', thighL: '左髖', shinL: '左膝', thighR: '右髖', shinR: '右膝' };
export const jointLabel = (b: string) => LABEL[b] ?? b;

function folds(meshes: Map<string, Mesh>, v: Map<string, Float32Array>) {
  let flipped = 0, squashed = 0;
  const where = new Map<string, number>();
  for (const [name, m] of meshes) {
    const p = v.get(name)!;
    for (let t = 0; t < m.tris.length; t += 3) {
      if (!m.visible[t / 3]) continue;
      const [a, b, c] = [m.tris[t], m.tris[t + 1], m.tris[t + 2]];
      const area = ((p[b * 2] - p[a * 2]) * (p[c * 2 + 1] - p[a * 2 + 1]) - (p[c * 2] - p[a * 2]) * (p[b * 2 + 1] - p[a * 2 + 1])) / 2;
      const r = area / m.setupArea[t / 3];
      if (r >= 0.25) continue;
      if (r < 0) flipped++; else squashed++;
      const [x, y] = [0, 1].map((k) => (m.verts[a][k] + m.verts[b][k] + m.verts[c][k]) / 3);
      const key = `${name}(${Math.round(x / 40) * 40},${Math.round(y / 40) * 40})`;
      where.set(key, (where.get(key) ?? 0) + 1);
    }
  }
  return { flipped, squashed, where: [...where].sort((p, q) => q[1] - p[1]).slice(0, 4).map(([k, n]) => `${k}×${n}`).join(' ') };
}

export function runChecks(rig: RigResult, out: any, summary: any[], deform: (sk: any) => Map<string, Float32Array>, rt: { Skeleton: any; Physics: any; parseSkeleton: (j: any) => any }, checkSkeleton: (j: any, o: any) => any[]): AnimCheck[] {
  const loops = summary.filter((s) => s.loop).map((s) => s.name);
  const smooth = checkSkeleton(out, { loops });
  const data = rt.parseSkeleton(out);
  const sk = new rt.Skeleton(data);
  sk.setupPose(); sk.updateWorldTransform(rt.Physics.none);
  const rest = new Map(JOINTS.map((b) => [b, sk.findBone(b)?.getAppliedPose().rotation ?? 0]));
  const ik = (out.constraints ?? []).filter((c: any) => c.type === 'ik');
  const gap = (c: any) => {
    const [u, l] = c.bones.map((n: string) => sk.findBone(n));
    const lp = l.getAppliedPose(), tp = sk.findBone(c.target).getAppliedPose();
    return Math.hypot(lp.worldX + lp.a * l.data.length - tp.worldX, lp.worldY + lp.c * l.data.length - tp.worldY) / (u.data.length + l.data.length);
  };
  const restGap = new Map<string, number>(ik.map((c: any) => [c.name, gap(c)]));
  const legs = ik.filter((c: any) => c.name.startsWith('leg'));
  const xy = (n: string) => { const p = sk.findBone(n).getAppliedPose(); return [p.worldX, p.worldY]; };
  const restFoot = new Map<string, number[][]>(legs.map((c: any) => [c.name, [xy(c.target), xy(c.bones[1].replace('shin', 'foot'))]]));
  return summary.map((s) => {
    const anim = data.findAnimation(s.name);
    const fk = new Set(Object.keys(out.animations[s.name].ik ?? {}));
    let worst = { flipped: 0, squashed: 0, where: '', t: 0 };
    let handLag = 0, footSlide = 0, firstFrame = 0;
    const turns: AnimCheck['turns'] = Object.fromEntries(JOINTS.map((b) => [b, { plus: 0, minus: 0 }]));
    for (let t = 0; t <= s.duration + 1e-6; t += 1 / 30) {
      sk.setupPose(); anim.apply(sk, 0, t, s.loop, [], 1, 0, false, false, false); sk.updateWorldTransform(rt.Physics.none);
      const f = folds(rig.meshes, deform(sk));
      if (f.flipped * 4 + f.squashed > worst.flipped * 4 + worst.squashed) worst = { ...f, t };
      for (const b of JOINTS) {
        const d = ((((sk.findBone(b).getAppliedPose().rotation - rest.get(b)!) % 360) + 540) % 360) - 180;
        if (d > turns[b].plus) turns[b].plus = d;
        if (-d > turns[b].minus) turns[b].minus = -d;
        if (t === 0 && s.name === 'idle') firstFrame = Math.max(firstFrame, Math.abs(d));
      }
      for (const c of ik) {
        if (fk.has(c.name) || !c.name.startsWith('arm')) continue;
        handLag = Math.max(handLag, gap(c) - restGap.get(c.name)!);
      }
      for (const c of legs) {
        const [t0, a0] = restFoot.get(c.name)!, tp = xy(c.target), ap = xy(c.bones[1].replace('shin', 'foot'));
        if (Math.hypot(tp[0] - t0[0], tp[1] - t0[1]) < 0.5) footSlide = Math.max(footSlide, Math.hypot(ap[0] - a0[0], ap[1] - a0[1]));
      }
    }
    const c = smooth.find((x: any) => x.name === s.name);
    return {
      name: s.name, duration: s.duration, loop: s.loop, score: c.score, issues: c.issues.filter((i: any) => i.severity !== 'info').map((i: any) => i.message),
      flipped: worst.flipped, squashed: worst.squashed, foldAt: worst.flipped + worst.squashed ? `@${worst.t.toFixed(2)}s ${worst.where}` : '', turns, handLag, footSlide, firstFrame,
    };
  });
}
