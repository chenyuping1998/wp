// The front-mascot template: joints and layers (template.json), the bones built from the joints, and how each layer's
// mesh is weighted. All positions here are canvas px, y down; rig.ts converts to Spine units.
import fs from 'node:fs';
import path from 'node:path';
import { HERE } from './kit.ts';

export type XY = [number, number];
export interface Template {
  description: string;
  canvas: XY;
  joints: { id: string; label: string; xy: XY; required: boolean }[];
  tail: { label: string; points: XY[] };
  layers: { name: string; label: string; required: boolean; paint: string }[];
  proportions: Record<string, string>;
}
export type Joints = Record<string, XY> & { tail?: XY[] };

export const readTemplate = (): Template => JSON.parse(fs.readFileSync(path.join(HERE, 'template.json'), 'utf8'));

/** joints.json: { id: [x, y] } or { id: { x, y } }, plus an optional "tail": [[x, y], …]. */
export function readJoints(file: string): Joints {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const xy = (v: any): XY => (Array.isArray(v) ? [v[0], v[1]] : [v.x, v.y]);
  const out: any = {};
  for (const [k, v] of Object.entries(raw)) out[k] = k === 'tail' ? (v as any[]).map(xy) : xy(v);
  return out;
}

export interface BoneSpec {
  name: string;
  parent: string;
  from: XY;
  to?: XY;
  /** Half-angle helper of this lower bone. */
  half?: string;
  inherit?: string;
  target?: boolean;
}
export interface IkSpec { name: string; bones: [string, string]; target: string; mid: XY; soft: number; planted?: boolean }
export interface Weighting {
  chain?: string[];
  points?: XY[];
  /** Ramp half-width at each joint between consecutive chain bones (px). */
  bands?: number[];
  /** Joint index (1 = between chain[0] and chain[1]) → half-angle helper bone. */
  helpers?: Record<string, string>;
  /** Weighted by inverse distance to these bones instead of a chain. */
  blob?: string[];
  power?: number;
}

const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dist = (a: XY, b: XY) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const SIDES = ['L', 'R'] as const;

/** Where the clavicle starts: on the chest, 30 % of the way from the neck base to the shoulder. */
export const clavStart = (j: Joints, s: string): XY => {
  const p = lerp(j.neckBase, j['shoulder' + s], 0.3);
  return [p[0], j.neckBase[1] + 0.6 * (j['shoulder' + s][1] - j.neckBase[1])];
};

export function boneSpecs(j: Joints, have: { ears: boolean; tail: number }): BoneSpec[] {
  const b = (name: string, parent: string, from: XY, to?: XY, more: Partial<BoneSpec> = {}): BoneSpec => ({ name, parent, from, to, ...more });
  const out: BoneSpec[] = [
    b('hip', 'root', j.hip, j.belly), b('belly', 'hip', j.belly, j.chest), b('chest', 'belly', j.chest, j.neckBase),
    b('neck', 'chest', j.neckBase, j.headBase), b('head', 'neck', j.headBase, j.headTop),
  ];
  if (have.ears) for (const s of SIDES) out.push(b('ear' + s, 'head', j[`ear${s}root`], j[`ear${s}tip`]));
  for (const s of SIDES) {
    out.push(
      // the arms don't take the chest's scale: breathing and the jump's squash must not stretch them
      b('clav' + s, 'chest', clavStart(j, s), j['shoulder' + s], { inherit: 'noScale' }),
      b('upperArm' + s, 'clav' + s, j['shoulder' + s], j['elbow' + s]),
      b('foreArm' + s, 'upperArm' + s, j['elbow' + s], j['wrist' + s]),
      b('hand' + s, 'foreArm' + s, j['wrist' + s], j['handTip' + s]),
      // half-angle helper: under the upper arm on the forearm's setup transform, turned by half the forearm's turn
      b('elbowH' + s, 'upperArm' + s, j['elbow' + s], j['wrist' + s], { half: 'foreArm' + s }),
    );
  }
  for (const s of SIDES) {
    out.push(
      b('thigh' + s, 'hip', j['hip' + s], j['knee' + s]),
      b('shin' + s, 'thigh' + s, j['knee' + s], j['ankle' + s]),
      b('kneeH' + s, 'thigh' + s, j['knee' + s], j['ankle' + s], { half: 'shin' + s }),
      // the foot follows the shin's real end (a soft IK stops short of its target) but not its turn: flat on the floor
      b('foot' + s, 'shin' + s, j['ankle' + s], j['toe' + s], { inherit: 'noRotationOrReflection' }),
    );
  }
  const t = j.tail ?? [];
  for (let i = 0; i < have.tail; i++) out.push(b(`tail${i + 1}`, i ? `tail${i}` : 'hip', t[i], t[i + 1]));
  for (const s of SIDES) {
    // hands ride with the body (a lean or a hip sway takes them along); feet stay on the floor under the root
    out.push(b(`ik-hand-${s.toLowerCase()}`, 'hip', j['wrist' + s], undefined, { target: true }));
    out.push(b(`ik-foot-${s.toLowerCase()}`, 'root', j['ankle' + s], undefined, { target: true }));
  }
  return out;
}

/**
 * Softness (fraction of the chain's reach). Arms: generous, a mascot's arms hang nearly straight and breathing lifts
 * the shoulders. Legs are `planted`: the softness is capped below the drawn pose's extension (rig.ts), because a leg
 * whose drawn pose sits in the soft zone never lands exactly on its target and the planted foot slides.
 */
export const ARM_SOFT = 0.12, LEG_SOFT = 0.06;
export function ikSpecs(j: Joints): IkSpec[] {
  return SIDES.flatMap((s) => [
    { name: `arm-${s.toLowerCase()}`, bones: [`upperArm${s}`, `foreArm${s}`] as [string, string], target: `ik-hand-${s.toLowerCase()}`, mid: j['elbow' + s], soft: ARM_SOFT },
    { name: `leg-${s.toLowerCase()}`, bones: [`thigh${s}`, `shin${s}`] as [string, string], target: `ik-foot-${s.toLowerCase()}`, mid: j['knee' + s], soft: LEG_SOFT, planted: true },
  ]);
}

/**
 * How each layer is weighted. `hw(layer, joint)` is the art's half-width at that joint (measured on the layer). Band
 * sizes come from the trials: elbow ±3.6 half-widths through the helper (narrower folds the crook past ~115°), knee ±2,
 * ankle ±1.8,
 * the shoulder is a ball (the arm's round top turns about its own centre, so the whole arm rides the upper arm).
 */
export function weightings(j: Joints, hw: (layer: string, joint: string) => number, tailBones: string[]): Record<string, Weighting> {
  const w: Record<string, Weighting> = {};
  if (tailBones.length) {
    const pts = (j.tail ?? []).slice(0, tailBones.length + 1);
    const seg = pts.slice(1).reduce((s, p, i) => s + dist(pts[i], p), 0) / tailBones.length;
    w.tail = { chain: tailBones, points: pts, bands: tailBones.slice(1).map(() => 0.48 * seg) };
  }
  for (const s of SIDES) {
    const l = s.toLowerCase();
    if (j[`ear${s}root`]) w[`ear_${l}`] = { chain: ['head', 'ear' + s], points: [j.headBase, j[`ear${s}root`], j[`ear${s}tip`]], bands: [0.25 * dist(j[`ear${s}root`], j[`ear${s}tip`])] };
    const thigh = dist(j['hip' + s], j['knee' + s]), shin = dist(j['knee' + s], j['ankle' + s]);
    w[`leg_${l}`] = {
      chain: ['thigh' + s, 'shin' + s, 'foot' + s], points: [j['hip' + s], j['knee' + s], j['ankle' + s], j['toe' + s]],
      // the ankle ramp is wide: the foot stays flat while a crouch tips the shin forward 40°
      bands: [Math.min(2 * hw(`leg_${l}`, 'knee' + s), 0.75 * Math.min(thigh, shin)), 1.8 * hw(`leg_${l}`, 'ankle' + s)], helpers: { 1: 'kneeH' + s },
    };
    const upper = dist(j['shoulder' + s], j['elbow' + s]), fore = dist(j['elbow' + s], j['wrist' + s]);
    w[`arm_${l}`] = {
      chain: ['upperArm' + s, 'foreArm' + s, 'hand' + s], points: [j['shoulder' + s], j['elbow' + s], j['wrist' + s], j['handTip' + s]],
      bands: [Math.min(3.6 * hw(`arm_${l}`, 'elbow' + s), 0.75 * Math.min(upper, fore)), 0.8 * hw(`arm_${l}`, 'wrist' + s)], helpers: { 1: 'elbowH' + s },
    };
  }
  const nl = dist(j.neckBase, j.headBase);
  const down = (p: XY, k: number): XY => [p[0], p[1] + k * nl];
  w.neck = { chain: ['chest', 'neck', 'head'], points: [down(j.neckBase, 1.7), j.neckBase, j.headBase, down(j.headBase, -1.3)], bands: [0.45 * nl, 0.37 * nl] };
  w.pelvis = { blob: ['hip', 'thighL', 'thighR'], power: 4 };
  w.torso = { blob: ['hip', 'belly', 'chest', 'clavL', 'clavR'], power: 4 };
  w.head = { chain: ['head'], points: [j.headBase, j.headTop], bands: [] };
  return w;
}

/** Proportion and pose checks on the joints (the art brief's rules), as warnings. */
export function jointWarnings(j: Joints): string[] {
  const out: string[] = [];
  for (const s of SIDES) {
    const reach = dist(j['shoulder' + s], j['elbow' + s]) + dist(j['elbow' + s], j['wrist' + s]);
    const over = j['shoulder' + s][1] - j.headTop[1];
    if (reach < over) out.push(`${s === 'L' ? '畫面左' : '畫面右'}手臂長 ${Math.round(reach)}px，比肩到頭頂 ${Math.round(over)}px 短（${(reach / over).toFixed(2)}）：舉手會蓋在頭上，歡呼、揮手的手會低於頭頂`);
    const bend = (p: XY, m: XY, q: XY) => {
      const a = Math.atan2(m[1] - p[1], m[0] - p[0]), b = Math.atan2(q[1] - m[1], q[0] - m[0]);
      return Math.abs(((((b - a) * 180) / Math.PI + 540) % 360) - 180);
    };
    const e = bend(j['shoulder' + s], j['elbow' + s], j['wrist' + s]);
    if (e < 8) out.push(`${s === 'L' ? '畫面左' : '畫面右'}手肘只彎 ${e.toFixed(0)}°：畫成微彎 10–20° 比較好動（太直時 IK 已柔化，但手勢幅度會小一點）`);
    const k = bend(j['hip' + s], j['knee' + s], j['ankle' + s]);
    if (k < 2) out.push(`${s === 'L' ? '畫面左' : '畫面右'}膝蓋幾乎打直（${k.toFixed(1)}°）：蹲下時膝蓋往外彎的方向可能不穩`);
  }
  if (j.neckBase[1] <= j.headBase[1]) out.push('脖子底在下巴後方上面，脖子會反折：檢查 neckBase／headBase');
  return out;
}
