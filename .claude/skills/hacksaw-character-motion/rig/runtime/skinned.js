/**
 * Runtime for a rig built by rig/build.py. Pixi v8.
 *
 *   import { SkinnedFigure } from './skinned.js';
 *   const fig = await SkinnedFigure.load('guy.rig.json', 'guy.png', {
 *     props: { bat: 'guy_prop_bat.png' },
 *   });
 *   stage.addChild(fig.view);
 *   app.ticker.add(() => fig.update(app.ticker.lastTime));
 *   // on a feature trigger:
 *   fig.react();
 *
 * The mesh is uploaded once and only its vertex buffer is rewritten each frame,
 * so the per-frame cost is one typed-array write plus the draw -- the same shape
 * of work a sprite already does. Nothing is re-uploaded and nothing is resampled
 * on the CPU.
 *
 * The numbers come from ./motion.generated.js, which is written by
 * rig/export_motion.py out of rig/motion.py. The gate measures the Python model
 * and this runs the JavaScript one; generating one from the other is what stops
 * them drifting into disagreement.
 */
import {
  IDLE, REACTION, REACTION_LIFT, REACTION_PROP,
  REACTION_SCALE, SCALE_K, FLUTTER, SCALE_INHERIT,
  LOOP_MS, REACTION_MS, SNAP, HOLD,
} from './motion.generated.js';

const DEG = Math.PI / 180;

/** rise over 38% of the cycle, fall over 62%, smoothed, in [-1,1] */
function wave(u) {
  u -= Math.floor(u);
  const v = u < 0.38 ? u / 0.38 : 1 - (u - 0.38) / 0.62;
  return v * v * (3 - 2 * v) * 2 - 1;
}

/** the once-per-loop excursion the other way, at 50-74% of the loop */
function oddBeat(q) {
  return q < 0.5 || q > 0.74 ? 0 : -Math.sin((Math.PI * (q - 0.5)) / 0.24);
}

function idleAngle(spec, t) {
  const [amp, lag, period, odd] = spec;
  if (!amp) return 0;
  const ph = t - lag;
  let a = amp * wave(ph / period);
  a += amp * 0.25 * Math.sin((Math.PI * 2 * ph) / LOOP_MS);
  if (odd) a += amp * odd * oddBeat((((ph % LOOP_MS) + LOOP_MS) % LOOP_MS) / LOOP_MS);
  return a;
}

/** snap in, hold, ease out -- the shape of a one-shot accent */
function reactEnvelope(u) {
  if (u <= 0 || u >= 1) return 0;
  if (u < SNAP) { const t = u / SNAP; return t * t * (3 - 2 * t); }
  if (u < HOLD) return 1;
  const t = 1 - (u - HOLD) / (1 - HOLD);
  return t * t * (3 - 2 * t);
}

/** the single-frame flick partway through the hold */
function reactKick(u, at = 0.5, width = 0.1) {
  if (u < at || u > at + width) return 0;
  return Math.sin((Math.PI * (u - at)) / width);
}

export class SkinnedFigure {
  constructor(rig, texture, propTextures = {}, motion = IDLE) {
    const PIXI = globalThis.PIXI;
    this.rig = rig;
    this.motion = motion;
    this.reactStart = null;
    const [W, H] = rig.size;
    const [bx0, by0, bx1, by1] = rig.figure_box || [0, 0, W, H];
    this.figW = bx1 - bx0;
    this.figH = by1 - by0;

    const n = rig.verts.length;
    this.rest = new Float32Array(n * 2);
    this.uvs = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const [x, y] = rig.verts[i];
      this.rest[i * 2] = x;
      this.rest[i * 2 + 1] = y;
      this.uvs[i * 2] = x / W;
      this.uvs[i * 2 + 1] = y / H;
    }
    this.positions = new Float32Array(this.rest);

    const idx = new Uint32Array(rig.tris.length * 3);
    rig.tris.forEach((t, i) => {
      idx[i * 3] = t[0]; idx[i * 3 + 1] = t[1]; idx[i * 3 + 2] = t[2];
    });

    // flatten the weights once into parallel arrays
    this.wBone = []; this.wVal = [];
    for (let i = 0; i < n; i++) {
      const row = rig.weights[i], b = [], v = [];
      for (let j = 0; j < row.length; j++) if (row[j] > 0.002) { b.push(j); v.push(row[j]); }
      this.wBone.push(b); this.wVal.push(v);
    }

    const geometry = new PIXI.MeshGeometry({
      positions: this.positions, uvs: this.uvs, indices: idx,
    });
    this.mesh = new PIXI.Mesh({ geometry, texture });
    this._mats = rig.bones.map(() => new Float32Array(6));   // skins the mesh
    this._chain = rig.bones.map(() => new Float32Array(6));  // children inherit

    // Unit vector along each bone, pivot -> child (or parent -> self at a
    // leaf). Squash and stretch needs a direction; rotation about a pivot does
    // not, which is why the rig file does not store one.
    const firstChild = new Map();
    rig.bones.forEach((b, i) => {
      if (b.parent >= 0 && !firstChild.has(b.parent)) firstChild.set(b.parent, i);
    });
    this._axes = rig.bones.map((b, i) => {
      const j = firstChild.get(i);
      let dx, dy;
      if (j !== undefined) { dx = rig.bones[j].x - b.x; dy = rig.bones[j].y - b.y; }
      else if (b.parent >= 0) { dx = b.x - rig.bones[b.parent].x; dy = b.y - rig.bones[b.parent].y; }
      else { dx = 0; dy = -1; }
      const n2 = Math.hypot(dx, dy);
      return n2 > 1e-9 ? [dx / n2, dy / n2] : [0, -1];
    });

    // Props are RIGID sprites, not part of the mesh. That is deliberate: a prop
    // has nothing behind it so it needs no repair and has no amplitude ceiling,
    // and it is the only way to get z-order -- a bat behind the hand and in
    // front of the body, which one continuous mesh cannot express.
    this.view = new PIXI.Container();
    this.back = new PIXI.Container();
    this.front = new PIXI.Container();
    this.view.addChild(this.back, this.mesh, this.front);
    this.props = [];
    for (const pr of rig.props || []) {
      const tex = propTextures[pr.name];
      if (!tex) continue;
      const sp = new PIXI.Sprite(tex);
      sp.anchor.set(0, 0);
      (pr.z === 'behind' ? this.back : this.front).addChild(sp);
      this.props.push({ def: pr, sprite: sp });
    }
  }

  static async load(rigUrl, imageUrl, opts = {}) {
    const PIXI = globalThis.PIXI;
    const rig = await fetch(rigUrl).then((r) => r.json());
    const tex = await PIXI.Assets.load(imageUrl);
    const propTex = {};
    for (const [name, url] of Object.entries(opts.props || {})) {
      propTex[name] = await PIXI.Assets.load(url);
    }
    return new SkinnedFigure(rig, tex, propTex, opts.motion || IDLE);
  }

  /** fire the one-shot accent (feature trigger, big win, ...) */
  react(atMs = null) {
    this.reactStart = atMs === null ? this._lastT : atMs;
  }

  get reacting() {
    return this.reactStart !== null
      && this._lastT - this.reactStart < REACTION_MS;
  }

  _poseBones(t) {
    const bones = this.rig.bones;
    const u = this.reactStart === null ? -1 : (t - this.reactStart) / REACTION_MS;
    const e = reactEnvelope(u);
    if (u >= 1) this.reactStart = null;

    // the bulge shakes while it holds a load; it does not shake on the way in
    let f = 0;
    if (e > 0 && u >= SNAP && u <= HOLD) {
      f = FLUTTER.depth * Math.sin((2 * Math.PI * (t - this.reactStart)) / FLUTTER.periodMs);
    }

    for (let i = 0; i < bones.length; i++) {
      const b = bones[i];
      let deg = idleAngle(this.motion[b.name] || [0, 0, 2000, 0], t);
      if (e > 0 && REACTION[b.name]) deg += REACTION[b.name] * e;
      const th = deg * DEG;
      const c = Math.cos(th), s = Math.sin(th);
      // a root translation moves every vertex identically, so no triangle
      // changes shape -- the one channel with no amplitude ceiling
      let ox = 0, oy = 0;
      if (i === 0 && e > 0) {
        ox = REACTION_LIFT[0] * this.figW * e;
        oy = REACTION_LIFT[1] * this.figH * e;
      }
      // rotation only -- this is what children inherit
      let a = c, bb = -s, cc = s, d = c;
      // this bone's own squash and stretch, in its own frame, about the same
      // pivot. It does NOT go into the chain: letting scale inherit inverts
      // triangles at the far end of a limb, and the reference stops it the
      // same way (Spine's `noScale` transform mode on the bones under a
      // scaling one).
      let sa = a, sb = bb, sc2 = cc, sd = d;
      const tgt = e > 0 ? REACTION_SCALE[b.name] : undefined;
      if (tgt) {
        const g = e * SCALE_K * (1 + f);
        const kA = 1 + (tgt[0] - 1) * g;
        const kC = 1 + (tgt[1] - 1) * g;
        const [ux, uy] = this._axes[i];
        // A * diag(kA,kC) * A^T with A = [[ux,-uy],[uy,ux]]
        const m00 = kA * ux * ux + kC * uy * uy;
        const m01 = (kA - kC) * ux * uy;
        const m11 = kA * uy * uy + kC * ux * ux;
        sa = a * m00 + bb * m01;
        sb = a * m01 + bb * m11;
        sc2 = cc * m00 + d * m01;
        sd = cc * m01 + d * m11;
      }
      const lc = [a, bb, b.x - a * b.x - bb * b.y + ox,
                  cc, d, b.y - cc * b.x - d * b.y + oy];
      const ls = [sa, sb, b.x - sa * b.x - sb * b.y + ox,
                  sc2, sd, b.y - sc2 * b.x - sd * b.y + oy];
      const m = this._mats[i], ch = this._chain[i];
      const passes = SCALE_INHERIT.has(b.name) ? ls : lc;
      if (b.parent < 0) { m.set(ls); ch.set(passes); } else {
        const p = this._chain[b.parent];
        for (const [dst, l] of [[m, ls], [ch, passes]]) {
          dst[0] = p[0] * l[0] + p[1] * l[3];
          dst[1] = p[0] * l[1] + p[1] * l[4];
          dst[2] = p[0] * l[2] + p[1] * l[5] + p[2];
          dst[3] = p[3] * l[0] + p[4] * l[3];
          dst[4] = p[3] * l[1] + p[4] * l[4];
          dst[5] = p[3] * l[2] + p[4] * l[5] + p[5];
        }
      }
    }
    return { u, e };
  }

  update(timeMs) {
    this._lastT = timeMs;
    const { u, e } = this._poseBones(timeMs);

    const P = this.positions, R = this.rest, n = R.length / 2;
    for (let i = 0; i < n; i++) {
      const x = R[i * 2], y = R[i * 2 + 1];
      const bs = this.wBone[i], vs = this.wVal[i];
      let ax = 0, ay = 0;
      for (let k = 0; k < bs.length; k++) {
        const m = this._mats[bs[k]], w = vs[k];
        ax += (m[0] * x + m[1] * y + m[2]) * w;
        ay += (m[3] * x + m[4] * y + m[5]) * w;
      }
      P[i * 2] = ax; P[i * 2 + 1] = ay;
    }
    // v8: mark the buffer dirty. Do NOT rebuild the geometry -- that
    // reallocates on the GPU every frame.
    this.mesh.geometry.getBuffer('aPosition').update();

    for (const { def, sprite } of this.props) {
      let deg = idleAngle(def.motion, timeMs);
      let stretch = 1;
      if (e > 0) {
        deg += REACTION_PROP.deg * e
             + REACTION_PROP.kickDeg * reactKick(u, REACTION_PROP.kickAt);
        stretch = 1 + (REACTION_PROP.stretch - 1) * Math.max(0, e - Math.abs(u - SNAP) * 3);
      }
      // the CHAIN matrix, not the skinning one: a prop is rigid, and putting
      // a limb's squash and stretch into it would shear the bat. It gets its
      // own stretch from REACTION_PROP instead.
      const m = this._chain[def.parent];
      const th = deg * DEG, c = Math.cos(th), s = Math.sin(th);
      const [px, py] = def.pivot;
      // scale about the pivot, then rotate about it, then the parent's world
      const a = stretch * c, b = stretch * -s, cc = stretch * s, d = stretch * c;
      const tx = px - a * px - b * py, ty = py - cc * px - d * py;
      sprite.setFromMatrix(new (globalThis.PIXI.Matrix)(
        m[0] * a + m[1] * cc, m[3] * a + m[4] * cc,
        m[0] * b + m[1] * d,  m[3] * b + m[4] * d,
        m[0] * tx + m[1] * ty + m[2], m[3] * tx + m[4] * ty + m[5],
      ));
    }
  }
}
