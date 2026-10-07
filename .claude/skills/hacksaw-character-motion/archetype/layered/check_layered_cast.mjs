/**
 * Motion gate for a layered cast figure: poses every layer with the GAME's
 * own castMotion code and measures the real meshes.
 *
 *   node archetype/layered/check_layered_cast.mjs \
 *     --manifest <dir>/layers.manifest.json \
 *     --motion   <app>/src/game/castMotion.ts \
 *     --tiers    <app>/src/game/castMotion.ts#TIERS      (module#export, {win,winBig,trigger})
 *     [--state '{"pose":"base"}']                        (extra PoseState fields your game needs)
 *     [--report out.json]
 *
 * The motion module must export buildWeightIndex, composeBoneMatrices(rig,
 * state, out, chain?) and skinVertices -- the same functions the renderer
 * calls, so this gate measures what ships, not a copy of it.
 *
 * Fails on: a layer that does not share the skeleton; weights that do not
 * sum to 1; a layer weighted to a bone its role must not touch (the body to
 * an arm, an arm to the torso...); any inked triangle flipping, shrinking
 * under 50% or growing over 1.6x across the idle and every tier at 1x/2x/4x
 * and 8 idle phases; inked vertices coming within 40 px of the canvas edge.
 * Reports each arm layer's non-rigid bend (affine residual, px) -- the
 * number that reads as 「像沒骨頭」 when it grows.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3)
  ?? (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const manifestPath = path.resolve(arg('manifest'));
const motion = await import(path.resolve(arg('motion')));
const [tierFile, tierExport = 'TIERS'] = (arg('tiers') ?? arg('motion')).split('#');
const TIERS = (await import(path.resolve(tierFile)))[tierExport];
const extraState = JSON.parse(arg('state', '{}'));
const manifest = JSON.parse(fs.readFileSync(manifestPath));
const dir = path.dirname(manifestPath);
const [W, H] = manifest.size;

// minimal PNG alpha reader (8-bit RGBA, non-interlaced) -- no dependencies
function readAlpha(buf) {
  let p = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; assert.equal(data[8], 8, 'PNG must be 8-bit'); }
    if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  assert.equal(ct, 6, 'PNG must be RGBA');
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, stride = w * bpp, out = Buffer.alloc(stride * h), alpha = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0, b = y ? out[row - stride + x] : 0, c = x >= bpp && y ? out[row - stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[row + x] = v & 255;
    }
    for (let x = 0; x < w; x++) alpha[y * w + x] = out[row + x * 4 + 3];
  }
  return { width: w, height: h, alpha };
}

const ALLOWED = (name, bones) => {
  if (name === 'body') return ['root', 'hips', 'waist', 'chest'];
  if (name === 'head') return ['chest', 'neck', 'head'];
  if (name.startsWith('arm_')) return [name, 'fore_' + name.at(-1)];
  if (name.startsWith('fingers_')) return ['fore_' + name.at(-1)];
  if (name.startsWith('prop_')) return [name];
  if (name.startsWith('dangle_')) { const b = bones.find((x) => x.name === name); return [name, bones[b.parent].name]; }
  throw new Error(`unknown layer role ${name}`);
};

const common = manifest.layers[0].rig;
const matrices = common.bones.map(() => new Float32Array(6));
const chain = common.bones.map(() => new Float32Array(6));
const parts = manifest.layers.map((l) => {
  const rig = l.rig;
  assert.deepEqual(rig.bones, common.bones, `${l.name}: does not share the skeleton`);
  const tex = readAlpha(fs.readFileSync(path.join(dir, l.texture)));
  assert.deepEqual([tex.width, tex.height], [W, H], `${l.name}.png is not ${W}x${H}`);
  const allowed = ALLOWED(l.name, rig.bones);
  rig.weights.forEach((w, i) => {
    assert.ok(Math.abs(w.reduce((a, b) => a + b, 0) - 1) < 1e-5, `${l.name}: vertex ${i} weights do not sum to 1`);
    w.forEach((v, b) => { if (v > 0) assert.ok(allowed.includes(rig.bones[b].name), `${l.name} is weighted to ${rig.bones[b].name}; a ${l.name.split('_')[0]} layer may only use ${allowed.join('/')}`); });
  });
  const aAt = (x, y) => tex.alpha[Math.min(H - 1, Math.max(0, Math.round(y))) * W + Math.min(W - 1, Math.max(0, Math.round(x)))];
  const ink = rig.tris.map((t) => { const v = t.map((i) => rig.verts[i]); const c = [(v[0][0] + v[1][0] + v[2][0]) / 3, (v[0][1] + v[1][1] + v[2][1]) / 3]; return [...v, c].some((p) => aAt(...p) > 16); });
  const inkV = rig.verts.map((p) => aAt(...p) > 16);
  const rest = new Float32Array(rig.verts.flat());
  return { name: l.name, rig, rest, out: new Float32Array(rest), index: motion.buildWeightIndex(rig), ink, inkV };
});

const area = (v, a, b, c) => (v[b * 2] - v[a * 2]) * (v[c * 2 + 1] - v[a * 2 + 1]) - (v[b * 2 + 1] - v[a * 2 + 1]) * (v[c * 2] - v[a * 2]);
function affineResid(p) { // max distance of inked arm vertices from their best affine fit (bend, not turn/scale)
  const ids = p.inkV.flatMap((k, i) => (k ? [i] : []));
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], TX = [0, 0, 0], TY = [0, 0, 0];
  for (const i of ids) { const r = [p.rest[i * 2], p.rest[i * 2 + 1], 1]; for (let a = 0; a < 3; a++) { for (let b = 0; b < 3; b++) S[a][b] += r[a] * r[b]; TX[a] += r[a] * p.out[i * 2]; TY[a] += r[a] * p.out[i * 2 + 1]; } }
  const solve = (M, v) => { const A = M.map((row, i) => [...row, v[i]]); for (let c = 0; c < 3; c++) { let q = c; for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[q][c])) q = r; [A[c], A[q]] = [A[q], A[c]]; for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k]; } } return A.map((row, i) => row[3] / row[i]); };
  const X = solve(S, TX), Y = solve(S, TY); let mx = 0;
  for (const i of ids) { const x = p.rest[i * 2], y = p.rest[i * 2 + 1]; mx = Math.max(mx, Math.hypot(X[0] * x + X[1] * y + X[2] - p.out[i * 2], Y[0] * x + Y[1] * y + Y[2] - p.out[i * 2 + 1])); }
  return mx;
}

let flips = 0, lo = Infinity, hi = 0, margin = Infinity, poses = 0; const worst = {}; const bend = {};
function pose(state) {
  motion.composeBoneMatrices(common, { ...extraState, ...state }, matrices, chain);
  for (const p of parts) {
    motion.skinVertices(p.rest, p.index, matrices, p.out);
    for (let t = 0; t < p.rig.tris.length; t++) {
      if (!p.ink[t]) continue;
      const r = area(p.out, ...p.rig.tris[t]) / area(p.rest, ...p.rig.tris[t]);
      if (r <= 0) flips++;
      if (r < lo) { lo = r; worst.shrink = `${p.name} tri ${t}`; }
      if (r > hi) { hi = r; worst.grow = `${p.name} tri ${t}`; }
    }
    for (let i = 0; i < p.inkV.length; i++) if (p.inkV[i]) { const x = p.out[i * 2], y = p.out[i * 2 + 1]; margin = Math.min(margin, x, W - x, y, H - y); }
    if (p.name.startsWith('arm_')) bend[p.name] = Math.max(bend[p.name] ?? 0, affineResid(p));
  }
  poses++;
}
for (let t = 0; t < 32000; t += 80) pose({ timeMs: t, tier: TIERS.win, reactionAge: null, durationMs: TIERS.win.durationMs, speed: 1, motionScale: 1 });
for (const [name, tier] of Object.entries(TIERS)) for (const speed of [1, 2, 4]) for (let ph = 0; ph < 8; ph++) {
  const tail = Math.max(0, ...Object.values(tier.bones).map(([, lag]) => lag));
  for (let age = 0; age <= tier.durationMs + tail + 50; age += 25) pose({ timeMs: ph * 1000 + age / speed, tier, reactionAge: age / speed, durationMs: tier.durationMs / speed, speed, motionScale: 1 });
}
const report = { poses, flips, minAreaRatio: +lo.toFixed(4), maxAreaRatio: +hi.toFixed(4), worst, minInkMarginPx: +margin.toFixed(2),
  armBendPx: Object.fromEntries(Object.entries(bend).map(([k, v]) => [k, +v.toFixed(2)])), layers: manifest.order };
console.log(JSON.stringify(report, null, 2));
if (arg('report')) fs.writeFileSync(arg('report'), JSON.stringify(report, null, 2));
const problems = [];
if (flips) problems.push(`${flips} inked triangle(s) flipped — the mesh creases over itself`);
if (lo < 0.5) problems.push(`a triangle shrinks to ${(lo * 100).toFixed(0)}% (floor 50%) at ${worst.shrink}`);
if (hi > 1.6) problems.push(`a triangle grows to ${hi.toFixed(2)}x (cap 1.6x) at ${worst.grow} — the pixels smear`);
if (margin < 40) problems.push(`ink comes within ${margin.toFixed(1)} px of the canvas edge (need 40) — the motion throws it off canvas`);
if (problems.length) { console.error('\ncheck_layered_cast FAILED'); for (const p of problems) console.error('  !! ' + p); process.exit(1); }
console.log('check_layered_cast ok');
