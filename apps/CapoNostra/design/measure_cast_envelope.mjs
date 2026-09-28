/**
 * Swept ink bounds of a layered cast figure, posed with the GAME's own motion
 * code over the same set of poses check_layered_cast.mjs uses (32 s idle,
 * every tier at 1x/2x/4x from 8 idle phases).
 *
 *   node design/measure_cast_envelope.mjs design/cast_parts/mg/layers.manifest.json \
 *        src/game/layeredCastMotion.ts#DON_TIERS
 *
 * Prints the swept x/y range of inked vertices and which layer sets each
 * extreme. The x range (padded) is layeredCastMotion.ts's LAYERED_X_ENVELOPE,
 * which Cast.svelte fits between the board and the screen edge.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const [manifestPath, tierSpec] = process.argv.slice(2);
const motion = await import(path.resolve('src/game/castMotion.ts'));
const [tierFile, tierExport] = tierSpec.split('#');
const TIERS = (await import(path.resolve(tierFile)))[tierExport];
const manifest = JSON.parse(fs.readFileSync(manifestPath));
const dir = path.dirname(manifestPath);

function readAlpha(buf) {
  let p = 8, w = 0, h = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); }
    if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * 4, out = Buffer.alloc(stride * h), alpha = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? out[row + x - 4] : 0, b = y ? out[row - stride + x] : 0, c = x >= 4 && y ? out[row - stride + x - 4] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[row + x] = v & 255;
    }
    for (let x = 0; x < w; x++) alpha[y * w + x] = out[row + x * 4 + 3];
  }
  return { w, h, alpha };
}

// a vertex counts as ink if any pixel within 6 px of it is opaque
const parts = manifest.layers.map((layer) => {
  const { w, h, alpha } = readAlpha(fs.readFileSync(path.join(dir, layer.texture)));
  const rig = layer.rig;
  const ink = rig.verts.map(([vx, vy]) => {
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      const x = Math.round(vx + dx), y = Math.round(vy + dy);
      if (x >= 0 && y >= 0 && x < w && y < h && alpha[y * w + x] > 16) return true;
    }
    return false;
  });
  return { name: layer.name, rig, ink, rest: new Float32Array(rig.verts.flat()), pos: new Float32Array(rig.verts.length * 2), weights: motion.buildWeightIndex(rig) };
});
const common = parts[0].rig;
const mats = common.bones.map(() => new Float32Array(6));
const chain = common.bones.map(() => new Float32Array(6));
const ext = { x0: [Infinity, ''], x1: [-Infinity, ''], y0: [Infinity, ''], y1: [-Infinity, ''] };
let poses = 0;
function pose(state) {
  motion.composeBoneMatrices(common, state, mats, chain);
  poses++;
  for (const part of parts) {
    motion.skinVertices(part.rest, part.weights, mats, part.pos);
    for (let v = 0; v < part.ink.length; v++) {
      if (!part.ink[v]) continue;
      const x = part.pos[v * 2], y = part.pos[v * 2 + 1];
      if (x < ext.x0[0]) ext.x0 = [x, part.name];
      if (x > ext.x1[0]) ext.x1 = [x, part.name];
      if (y < ext.y0[0]) ext.y0 = [y, part.name];
      if (y > ext.y1[0]) ext.y1 = [y, part.name];
    }
  }
}
for (let t = 0; t < 32000; t += 80) pose({ timeMs: t, tier: TIERS.win, reactionAge: null, durationMs: TIERS.win.durationMs, speed: 1, motionScale: 1 });
for (const tier of Object.values(TIERS)) for (const speed of [1, 2, 4]) for (let ph = 0; ph < 8; ph++) {
  const tail = Math.max(0, ...Object.values(tier.bones).map(([, lag]) => lag));
  for (let age = 0; age <= tier.durationMs + tail + 50; age += 25)
    pose({ timeMs: ph * 1000 + age / speed, tier, reactionAge: age / speed, durationMs: tier.durationMs / speed, speed, motionScale: 1 });
}
const r = (v) => Math.round(v[0] * 10) / 10;
console.log(JSON.stringify({ poses, size: manifest.size, rest_box: manifest.figure_box,
  x: [r(ext.x0), r(ext.x1)], y: [r(ext.y0), r(ext.y1)],
  set_by: { left: ext.x0[1], right: ext.x1[1], top: ext.y0[1], bottom: ext.y1[1] } }, null, 1));
