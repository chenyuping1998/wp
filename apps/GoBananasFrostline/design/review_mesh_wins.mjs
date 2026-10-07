// A motion REVIEW of the mesh wins — not a gate. check_mesh_wins.mjs decides
// whether the mesh breaks; this reports how the acting reads, per symbol, at
// the size it is played (118px cells, so 1 canvas px = 0.46 board px):
//
//   peakBoardPx      the most any inked vertex moves off the drawing
//   fastest...       the fastest it moves, board px per 60fps frame
//   endSnap...       how far off the drawing the last frame is (the static
//                    sprite takes over there; meshRig.settled keeps it 0)
//   kink...          the largest frame-to-frame change in speed, and when —
//                    expected at the crouch release, suspicious anywhere else
//   dead             runs of 250ms+ where nothing moves visibly (< 0.15 board
//                    px/frame): a hold that reads as a freeze
//
// Usage: node design/review_mesh_wins.mjs   (pngjs from E:/stake/tools/gen)
import { createRequire, register } from 'module';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return n(s+'.ts',c);throw e}}`));
const require = createRequire('E:/stake/tools/gen/noop.js');
const { PNG } = require('pngjs');
const app = fileURLToPath(new URL('..', import.meta.url)).replace(/\\/g, '/');
const core = await import(pathToFileURL(app + 'src/game/meshWin/meshRig.ts').href);
const { MESH_WINS } = await import(pathToFileURL(app + 'src/game/meshWin/index.ts').href);
const SCREEN = 118 / 256;       // canvas px -> board px
const FRAME = 1000 / 60;         // ms per frame
const rows = [];
for (const [name, spec] of Object.entries(MESH_WINS)) {
  const rig = core.buildRig(spec.rig);
  const V = rig.rest.length / 2, B = rig.bones.length;
  let ink;
  if (spec.mode === 'panel') ink = (x, y) => spec.inked([x, y]);
  else { const png = PNG.sync.read(fs.readFileSync(app + `static/assets/sprites/goBananasSymbolsV3/${name.toLowerCase()}_subject.png`)); ink = (x, y) => png.data[(Math.round(y) * 256 + Math.round(x)) * 4 + 3] > 128; }
  const vs = []; for (let v = 0; v < V; v++) if (ink(rig.rest[v*2], rig.rest[v*2+1])) vs.push(v);
  const out = new Float32Array(V * 2), prev = new Float32Array(V * 2);
  const D = spec.durationMs;
  let peak = 0, peakAt = 0, maxSpeed = 0;
  const speed = new Float64Array(D + 1);   // max inked vertex speed, canvas px/ms
  const vel = new Float64Array((D + 1) * 2); // mean velocity of inked verts (x,y)
  for (let t = 0; t <= D; t++) {
    core.skin(rig, spec.pose(rig, t), spec.feetY, out);
    let mx = 0, sx = 0, sy = 0, disp = 0;
    for (const v of vs) {
      const dx = out[v*2] - rig.rest[v*2], dy = out[v*2+1] - rig.rest[v*2+1];
      disp = Math.max(disp, Math.hypot(dx, dy));
      if (t > 0) { const ux = out[v*2]-prev[v*2], uy = out[v*2+1]-prev[v*2+1]; mx = Math.max(mx, Math.hypot(ux, uy)); sx += ux; sy += uy; }
    }
    if (disp > peak) { peak = disp; peakAt = t; }
    speed[t] = mx; vel[t*2] = sx / vs.length; vel[t*2+1] = sy / vs.length;
    maxSpeed = Math.max(maxSpeed, mx);
    prev.set(out);
  }
  // end snap: what the static sprite takes over from
  const end = spec.pose(rig, D); core.skin(rig, end, spec.feetY, out);
  let snap = 0; for (const v of vs) snap = Math.max(snap, Math.hypot(out[v*2]-rig.rest[v*2], out[v*2+1]-rig.rest[v*2+1]));
  // dead stretches: runs where nothing inked moves faster than 0.15 board px/frame
  const still = 0.15 / SCREEN / FRAME; let run = 0, dead = [];
  for (let t = 1; t <= D; t++) { if (speed[t] < still) run++; else { if (run >= 250) dead.push(`${t-run}-${t}`); run = 0; } }
  if (run >= 250) dead.push(`${D-run}-${D}`);
  // kinks: frame-to-frame change in the MAX vertex speed, in board px/frame per frame
  let kink = 0, kinkAt = 0;
  for (let t = FRAME|0; t + (FRAME|0) <= D; t++) {
    const a = speed[t] * FRAME * SCREEN, b = speed[t - (FRAME|0)] * FRAME * SCREEN;
    const j = Math.abs(a - b);
    if (j > kink) { kink = j; kinkAt = t; }
  }
  rows.push({ name, dur: D, peakBoardPx: +(peak*SCREEN).toFixed(1), peakAt, fastestBoardPxPerFrame: +(maxSpeed*FRAME*SCREEN).toFixed(2),
    endSnapBoardPx: +(snap*SCREEN).toFixed(2), endFlash: +end.flash.toFixed(3), endSheen: end.sheen, endHit: +(end.plateHit-1).toFixed(4),
    kinkBoardPx: +kink.toFixed(2), kinkAt, dead: dead.join(' ') || '-' });
}
console.table(rows);
