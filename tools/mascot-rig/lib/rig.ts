// Layers + joints → a Spine 4.3 skeleton: bones from the template, soft IK on arms and legs, half-angle helpers at
// elbows and knees, every layer a weighted grid mesh cropped to what it covers.
import type { BoneSpec, Joints, Template, Weighting, XY } from './template.ts';
import { boneSpecs, ikSpecs, weightings } from './template.ts';

export interface Layer { name: string; alpha: Uint8Array; width: number; height: number }
export interface Crop { x: number; y: number; w: number; h: number }
export interface Mesh {
  name: string;
  /** Vertex positions on the canvas (px, y down). */
  verts: XY[];
  weights: [string, number][][];
  tris: number[];
  /** Triangles that cover art not hidden under a higher layer (drawn pose): the only ones whose folds can show. */
  visible: boolean[];
  setupArea: number[];
  crop: Crop;
}
export interface Measure {
  H: number;
  ground: XY;
  side: Record<'L' | 'R', { shoulder: XY; elbow: XY; wrist: XY; reach: number; target: XY; upper: number; fore: number; foreLocal: number }>;
  hip: XY; belly: XY; chest: XY; neckBase: XY; headTop: XY;
  shoulderHalf: number;
  tail: string[];
  ears: boolean;
}
export interface RigResult {
  json: any;
  meshes: Map<string, Mesh>;
  bones: BoneSpec[];
  measure: Measure;
  warnings: string[];
  /** Canvas px → Spine units. */
  toSpine: (p: XY) => { x: number; y: number };
}

const DEG = 180 / Math.PI;
const norm = (d: number) => ((((d % 360) + 540) % 360) - 180);
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Target distance at which a 2-bone IK with this softness reaches `d` (inverts spine-core's softness curve). */
function softTarget(d: number, reach: number, s: number) {
  const reached = (td: number) => { const sd = td - reach + s; if (sd <= 0) return td; const p = Math.min(1, sd / (2 * s)) - 1; return td - (sd - s * (1 - p * p)); };
  if (reached(d) >= d - 1e-9) return d;
  let lo = d, hi = reach + s;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (reached(m) < d) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

/** Half-width of the art at a joint: opaque run across the limb, perpendicular to its direction. */
function halfWidth(L: Layer | undefined, at: XY, dir: XY, fallback: number) {
  if (!L) return fallback;
  const n = Math.hypot(dir[0], dir[1]) || 1, nx = -dir[1] / n, ny = dir[0] / n;
  const run = (s: number) => {
    let k = 0;
    for (; k < 400; k++) {
      const x = Math.round(at[0] + nx * k * s), y = Math.round(at[1] + ny * k * s);
      if (x < 0 || y < 0 || x >= L.width || y >= L.height || L.alpha[y * L.width + x] < 128) break;
    }
    return k;
  };
  const w = (run(1) + run(-1)) / 2;
  return w > 4 ? w : fallback;
}

function chainWeights(px: number, py: number, L: Weighting): [string, number][] {
  const pts = L.points!;
  let best = Infinity, s = 0, acc = 0;
  const cum = [0];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    const t = ((px - ax) * dx + (py - ay) * dy) / (len * len);
    // the first segment extends backwards and the last forwards: art beyond the end joints belongs to the end bones
    const tc = i === 0 && i === pts.length - 2 ? t : i === 0 ? Math.min(t, 1) : i === pts.length - 2 ? Math.max(t, 0) : Math.max(0, Math.min(1, t));
    const d = Math.hypot(px - (ax + dx * tc), py - (ay + dy * tc));
    if (d < best) { best = d; s = acc + tc * len; }
    acc += len; cum.push(acc);
  }
  // transitions between consecutive bones; a joint with a helper ramps upper → helper → lower, each half half as wide
  const names = [L.chain![0]];
  const T: { pos: number; hw: number }[] = [];
  for (let k = 1; k < L.chain!.length; k++) {
    const w = L.bands![k - 1], h = L.helpers?.[String(k)];
    if (h) { T.push({ pos: cum[k] - w / 2, hw: w / 2 }, { pos: cum[k] + w / 2, hw: w / 2 }); names.push(h); }
    else T.push({ pos: cum[k], hw: w });
    names.push(L.chain![k]);
  }
  return names.map((b, k) => {
    const up = k === 0 ? 1 : smooth((s - (T[k - 1].pos - T[k - 1].hw)) / (2 * T[k - 1].hw));
    const down = k === names.length - 1 ? 0 : smooth((s - (T[k].pos - T[k].hw)) / (2 * T[k].hw));
    return [b, Math.max(0, up - down)] as [string, number];
  });
}

function blobWeights(px: number, py: number, L: Weighting, bones: BoneSpec[]): [string, number][] {
  return L.blob!.map((name) => {
    const b = bones.find((x) => x.name === name)!;
    const [ax, ay] = b.from, [bx, by] = b.to!, dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
    return [name, 1 / Math.pow(d + 12, L.power ?? 4)] as [string, number];
  });
}

export function buildRig(T: Template, j: Joints, layers: Map<string, Layer>, order: string[], rt: { Skeleton: any; Physics: any; parseSkeleton: (j: any) => any }, opts: { grid?: number; name?: string } = {}): RigResult {
  const warnings: string[] = [];
  const [W, H] = [layers.values().next().value!.width, layers.values().next().value!.height];
  const toSpine = (p: XY) => ({ x: p[0] - j.ground[0], y: j.ground[1] - p[1] });
  const ears = layers.has('ear_l') && layers.has('ear_r') && !!j.earLroot && !!j.earRroot;
  const tailPts = j.tail ?? [];
  const tailN = layers.has('tail') ? Math.max(0, Math.min(8, tailPts.length - 1)) : 0;
  if (layers.has('tail') && tailN < 2) warnings.push('有 tail 圖層但 joints.json 的 tail 不到 3 個點，尾巴不會動');
  const specs = boneSpecs(j, { ears, tail: tailN >= 2 ? tailN : 0 });
  const tailBones = specs.filter((b) => b.name.startsWith('tail')).map((b) => b.name);
  const height = j.ground[1] - j.headTop[1];
  const grid = opts.grid ?? Math.max(10, Math.round(height / 70));

  // ---- bones
  const world = new Map<string, { x: number; y: number; rot: number }>([['root', { x: 0, y: 0, rot: 0 }]]);
  const bones: any[] = [{ name: 'root' }];
  for (const b of specs) {
    const a = toSpine(b.from);
    let rot = 0, len = 0;
    if (b.to) { const z = toSpine(b.to); rot = Math.atan2(z.y - a.y, z.x - a.x) * DEG; len = Math.hypot(z.x - a.x, z.y - a.y); }
    const p = world.get(b.parent)!;
    const c = Math.cos(-p.rot / DEG), s = Math.sin(-p.rot / DEG), dx = a.x - p.x, dy = a.y - p.y;
    // a bone that doesn't inherit rotation keeps a world-space rotation (the root never turns)
    const lr = b.inherit === 'noRotationOrReflection' || b.inherit === 'onlyTranslation' ? rot : norm(rot - p.rot);
    const out: any = { name: b.name, parent: b.parent };
    if (Math.abs(c * dx - s * dy) > 1e-3) out.x = r3(c * dx - s * dy);
    if (Math.abs(s * dx + c * dy) > 1e-3) out.y = r3(s * dx + c * dy);
    if (Math.abs(lr) > 1e-3) out.rotation = r3(lr);
    if (len) out.length = r3(len);
    if (b.inherit) out.inherit = b.inherit;
    if (b.target) out.color = 'ff3f00ff';
    else if (b.half) out.color = '7f7f7f80';
    bones.push(out);
    world.set(b.name, { ...a, rot });
  }
  const json: any = {
    skeleton: { hash: opts.name ?? 'mascot', spine: '4.3.13', x: -W / 2, y: -(H - j.ground[1]), width: W, height: H, fps: 30, images: './images/' },
    bones, slots: order.map((n) => ({ name: n, bone: 'root', attachment: n })), constraints: [], skins: [{ name: 'default', attachments: {} }], animations: {},
  };

  // ---- soft IK (target pushed out so the soft solve lands on the drawn joint), bend side matched to the art
  const iks = ikSpecs(j);
  const boneLen = (n: string) => bones.find((b) => b.name === n).length;
  const targetWorld = new Map<string, { x: number; y: number }>();
  for (const k of iks) {
    const u = world.get(k.bones[0])!, t = world.get(k.target)!;
    const reach = boneLen(k.bones[0]) + boneLen(k.bones[1]), d = Math.hypot(t.x - u.x, t.y - u.y);
    // planted legs: softness only up to where the drawn pose starts, so the target sits exactly on the drawn ankle.
    // A target pushed out into the soft zone moves the solved ankle by up to the push whenever the leg bends (a crouch
    // sank the foot 12 px); arms keep the full softness and the push, a hand is never pinned.
    const s = k.planted ? Math.max(0, Math.min(k.soft * reach, 0.9 * (reach - d))) : k.soft * reach;
    const td = softTarget(d, reach, s);
    if (k.planted && s < 0.02 * reach) warnings.push(`${k.name}：腿畫得幾乎打直（${((d / reach) * 100).toFixed(1)}% 腿長），IK 柔化只剩 ${s.toFixed(1)} px；骨盆往上或傾斜時腳會離地`);
    const w = { x: u.x + ((t.x - u.x) * td) / d, y: u.y + ((t.y - u.y) * td) / d };
    targetWorld.set(k.target, w);
    const tb = bones.find((b) => b.name === k.target), p = world.get(tb.parent)!;
    const c = Math.cos(-p.rot / DEG), sn = Math.sin(-p.rot / DEG), dx = w.x - p.x, dy = w.y - p.y;
    tb.x = r3(c * dx - sn * dy); tb.y = r3(sn * dx + c * dy);
    json.constraints.push({ name: k.name, type: 'ik', bones: k.bones, target: k.target, bendPositive: true, softness: r3(s) });
  }
  // ---- half-angle helpers (4.3 form, verified exact in spine-generator's research branch): local rotate only
  for (const b of specs.filter((x) => x.half)) {
    const R = bones.find((x) => x.name === b.name).rotation ?? 0;
    json.constraints.push({
      name: `half-${b.name}`, type: 'transform', bones: [b.name], source: b.half, localSource: true, localTarget: true, additive: false, clamp: false,
      rotation: 0, x: 0, y: 0, scaleX: 0, scaleY: 0, shearY: 0,
      properties: { rotate: { offset: 0, to: { rotate: { offset: r3(0.5 * R), scale: 0.5 } } } },
      mixRotate: 1, mixX: 0, mixY: 0, mixScaleX: 0, mixScaleY: 0, mixShearY: 0,
    });
  }
  for (const [i, k] of iks.entries()) {
    const want = toSpine(k.mid);
    const err = (bend: boolean) => {
      json.constraints[i].bendPositive = bend;
      const sk = new rt.Skeleton(rt.parseSkeleton(json)); sk.setupPose(); sk.updateWorldTransform(rt.Physics.none);
      const p = sk.findBone(k.bones[1]).getAppliedPose();
      return Math.hypot(p.worldX - want.x, p.worldY - want.y);
    };
    const a = err(true), b = err(false);
    json.constraints[i].bendPositive = a <= b;
    if (Math.min(a, b) > 3) warnings.push(`${k.name} 的 IK 解出的關節和畫的差 ${Math.min(a, b).toFixed(1)} px`);
  }

  // ---- meshes
  const setup = new rt.Skeleton(rt.parseSkeleton(json)); setup.setupPose(); setup.updateWorldTransform(rt.Physics.none);
  const boneIndex = new Map<string, number>(json.bones.map((b: any, i: number) => [b.name, i]));
  const toLocal = (bone: string, p: { x: number; y: number }) => {
    const q = setup.findBone(bone).getAppliedPose(), det = q.a * q.d - q.b * q.c, x = p.x - q.worldX, y = p.y - q.worldY;
    return [(x * q.d - y * q.b) / det, (y * q.a - x * q.c) / det];
  };
  const dirOf = (a: string, b: string): XY => [j[b][0] - j[a][0], j[b][1] - j[a][1]];
  const hw = (layer: string, joint: string) => {
    const lower = joint.replace(/[LR]$/, ''), s = joint.slice(-1);
    const along = lower === 'elbow' ? dirOf('shoulder' + s, 'wrist' + s) : lower === 'wrist' ? dirOf('elbow' + s, 'handTip' + s) : lower === 'knee' ? dirOf('hip' + s, 'ankle' + s) : dirOf('knee' + s, 'ankle' + s);
    return halfWidth(layers.get(layer), j[joint], along, layer.startsWith('arm') ? 0.035 * height : 0.037 * height);
  };
  const wts = weightings(j, hw, tailBones);
  const meshes = new Map<string, Mesh>();
  for (const name of order) {
    const L = layers.get(name)!, A = L.alpha, spec = wts[name];
    if (!spec) { warnings.push(`圖層 ${name} 不在模板裡，略過`); continue; }
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (A[y * W + x] > 8) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (x1 < x0) { warnings.push(`圖層 ${name} 是空的`); continue; }
    x0 -= 3; y0 -= 3; x1 += 3; y1 += 3;
    const nx = Math.ceil((x1 - x0) / grid), ny = Math.ceil((y1 - y0) / grid);
    const occ = (cx: number, cy: number) => {
      for (let y = Math.max(0, y0 + cy * grid - 3); y < Math.min(H, y0 + (cy + 1) * grid + 3); y++)
        for (let x = Math.max(0, x0 + cx * grid - 3); x < Math.min(W, x0 + (cx + 1) * grid + 3); x++) if (A[y * W + x] > 4) return true;
      return false;
    };
    const vid = new Map<string, number>(), verts: XY[] = [], tris: number[] = [];
    const v = (gx: number, gy: number) => { const k = gx + ',' + gy; if (!vid.has(k)) { vid.set(k, verts.length); verts.push([x0 + gx * grid, y0 + gy * grid]); } return vid.get(k)!; };
    for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) if (occ(cx, cy)) {
      const a = v(cx, cy), b = v(cx + 1, cy), c = v(cx + 1, cy + 1), d = v(cx, cy + 1);
      tris.push(a, b, c, a, c, d);
    }
    const weights = verts.map(([px, py]) => {
      let ws = (spec.chain ? chainWeights(px, py, spec) : blobWeights(px, py, spec, specs)).sort((p, q) => q[1] - p[1]).slice(0, 3);
      const tot = ws.reduce((s, [, x]) => s + x, 0) || 1;
      ws = ws.map(([b, x]) => [b, x / tot] as [string, number]).filter(([, x]) => x >= 0.01);
      // rounded to what the file stores (1e-4) and summing to exactly 1, so every runtime skins the same vertex
      const t2 = ws.reduce((s, [, x]) => s + x, 0);
      const q = ws.map(([b, x]) => [b, Math.round((x / t2) * 1e4)] as [string, number]);
      q[0][1] += 1e4 - q.reduce((s, [, x]) => s + x, 0);
      return q.map(([b, x]) => [b, x / 1e4] as [string, number]);
    });
    const crop: Crop = { x: Math.min(...verts.map((p) => p[0])), y: Math.min(...verts.map((p) => p[1])), w: 0, h: 0 };
    crop.w = Math.max(...verts.map((p) => p[0])) - crop.x; crop.h = Math.max(...verts.map((p) => p[1])) - crop.y;
    const vertices: number[] = [];
    weights.forEach((ws, i) => {
      const p = toSpine(verts[i]);
      vertices.push(ws.length);
      for (const [b, x] of ws) { const [lx, ly] = toLocal(b, p); vertices.push(boneIndex.get(b)!, r3(lx), r3(ly), x); }
    });
    json.skins[0].attachments[name] = { [name]: {
      type: 'mesh', uvs: verts.flatMap(([x, y]) => [Math.round(((x - crop.x) / crop.w) * 1e6) / 1e6, Math.round(((y - crop.y) / crop.h) * 1e6) / 1e6]),
      triangles: tris, vertices, hull: 0, width: crop.w, height: crop.h,
    } };
    const area = (i: number) => { const [a, b, c] = [tris[i], tris[i + 1], tris[i + 2]].map((k) => toSpine(verts[k])); return ((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2; };
    const above = order.slice(order.indexOf(name) + 1).map((n) => layers.get(n)!.alpha);
    const seen = (x: number, y: number) => {
      const i = Math.min(H - 1, Math.max(0, Math.round(y))) * W + Math.min(W - 1, Math.max(0, Math.round(x)));
      return A[i] > 24 && !above.some((B) => B[i] > 240);
    };
    const visible = Array.from({ length: tris.length / 3 }, (_, i) => {
      const [p, q, r] = [tris[i * 3], tris[i * 3 + 1], tris[i * 3 + 2]].map((k) => verts[k]);
      for (const [u, w2] of [[1, 0], [0, 1], [0, 0], [0.5, 0.5], [0.5, 0], [0, 0.5], [0.33, 0.33]]) if (seen(p[0] + (q[0] - p[0]) * u + (r[0] - p[0]) * w2, p[1] + (q[1] - p[1]) * u + (r[1] - p[1]) * w2)) return true;
      return false;
    });
    meshes.set(name, { name, verts, weights, tris, visible, setupArea: Array.from({ length: tris.length / 3 }, (_, i) => area(i * 3)), crop });
  }
  json.slots = json.slots.filter((s: any) => meshes.has(s.name));

  // ---- measurements the motion library is written against (Spine units, y up)
  const P = (id: string): XY => { const p = toSpine(j[id]); return [p.x, p.y]; };
  const side = (s: 'L' | 'R') => {
    const pose = (n: string) => setup.findBone(n).getAppliedPose();
    const ang = (n: string) => Math.atan2(pose(n).c, pose(n).a) * DEG;
    const tw = targetWorld.get(`ik-hand-${s.toLowerCase()}`)!;
    const upper = ang('upperArm' + s), fore = ang('foreArm' + s);
    return { shoulder: P('shoulder' + s), elbow: P('elbow' + s), wrist: P('wrist' + s), reach: boneLen('upperArm' + s) + boneLen('foreArm' + s), target: [tw.x, tw.y] as XY, upper, fore, foreLocal: norm(fore - upper) };
  };
  const measure: Measure = {
    H: height, ground: j.ground, side: { L: side('L'), R: side('R') }, hip: P('hip'), belly: P('belly'), chest: P('chest'), neckBase: P('neckBase'), headTop: P('headTop'),
    shoulderHalf: (j.shoulderR[0] - j.shoulderL[0]) / 2, tail: tailBones, ears,
  };
  return { json, meshes, bones: specs, measure, warnings, toSpine };
}

/** World vertices (Spine units) of every mesh for the current pose: linear blend skinning on the bones' world matrices. */
export function makeDeformer(r: RigResult, rt: { Skeleton: any; Physics: any; parseSkeleton: (j: any) => any }) {
  const setup = new rt.Skeleton(rt.parseSkeleton(r.json)); setup.setupPose(); setup.updateWorldTransform(rt.Physics.none);
  const local = (bone: string, p: { x: number; y: number }) => {
    const q = setup.findBone(bone).getAppliedPose(), det = q.a * q.d - q.b * q.c, x = p.x - q.worldX, y = p.y - q.worldY;
    return [(x * q.d - y * q.b) / det, (y * q.a - x * q.c) / det];
  };
  const cache = new Map<string, { bone: string; w: number; lx: number; ly: number }[][]>();
  for (const [name, m] of r.meshes) cache.set(name, m.weights.map((ws, i) => ws.map(([bone, w]) => { const [lx, ly] = local(bone, r.toSpine(m.verts[i])); return { bone, w, lx, ly }; })));
  return (sk: any) => {
    const out = new Map<string, Float32Array>();
    for (const [name, m] of r.meshes) {
      const c = cache.get(name)!;
      const o = new Float32Array(m.verts.length * 2);
      c.forEach((inf, i) => {
        let x = 0, y = 0;
        for (const { bone, w, lx, ly } of inf) { const q = sk.findBone(bone).getAppliedPose(); x += (q.a * lx + q.b * ly + q.worldX) * w; y += (q.c * lx + q.d * ly + q.worldY) * w; }
        o[i * 2] = x; o[i * 2 + 1] = y;
      });
      out.set(name, o);
    }
    return out;
  };
}
