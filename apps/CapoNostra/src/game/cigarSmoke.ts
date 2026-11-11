import { Container, Mesh, MeshGeometry, Texture } from 'pixi.js';
import type { MeshRig } from './castMotion';

type Point = { x: number; y: number; refs: [number, number][] };

/** Clip only the baked smoke's empty corner of this specific Don drawing.
 * New boundary points interpolate the already-posed original mesh, so the
 * hand, cigar and the rig's deformation remain exactly the same. */
export function withoutBakedSmoke(rig: MeshRig) {
  const points: Point[] = [], indices: number[] = [], ids = new Map<string, number>();
  const clip = (poly: Point[], axis: 'x' | 'y', edge: number, above: boolean) => {
    const out: Point[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const inside = (p: Point) => above ? p[axis] >= edge : p[axis] <= edge;
      if (inside(a)) out.push(a);
      if (inside(a) !== inside(b)) {
        const t = (edge - a[axis]) / (b[axis] - a[axis]);
        const refs = new Map<number, number>();
        for (const [id, w] of a.refs) refs.set(id, (refs.get(id) ?? 0) + w * (1 - t));
        for (const [id, w] of b.refs) refs.set(id, (refs.get(id) ?? 0) + w * t);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, refs: [...refs] });
      }
    }
    return out;
  };
  const add = (poly: Point[]) => {
    const vertexIds = poly.map(p => {
      const key = `${p.x.toFixed(5)},${p.y.toFixed(5)}`;
      let id = ids.get(key);
      if (id === undefined) { id = points.length; points.push(p); ids.set(key, id); }
      return id;
    });
    for (let i = 1; i + 1 < vertexIds.length; i++) indices.push(vertexIds[0], vertexIds[i], vertexIds[i + 1]);
  };
  for (const tri of rig.tris) {
    const poly = tri.map(id => ({ x: rig.verts[id][0], y: rig.verts[id][1], refs: [[id, 1]] as [number, number][] }));
    add(clip(poly, 'y', 725, true));
    add(clip(clip(poly, 'y', 725, false), 'x', 225, true));
  }
  const positions = new Float32Array(points.length * 2);
  const update = (posed: Float32Array) => points.forEach((p, i) => {
    positions[2 * i] = p.refs.reduce((sum, [id, w]) => sum + posed[2 * id] * w, 0);
    positions[2 * i + 1] = p.refs.reduce((sum, [id, w]) => sum + posed[2 * id + 1] * w, 0);
  });
  update(new Float32Array(rig.verts.flat()));
  return { positions, indices: new Uint32Array(indices), points, update };
}

/** A quiet, continuous ribbon: rising, drifting, thinning and dissolving.
 * Uses real elapsed time rather than spin/turbo time. No flashing or loop reset. */
export class CigarSmoke {
  readonly view = new Container({ label: 'don-cigar-smoke' });
  private readonly ribbons: Mesh[] = [];
  private readonly anchor: [number, number][];

  constructor(rig: MeshRig) {
    for (let i = 0; i < 72; i++) {
      const mesh = new Mesh({ geometry: new MeshGeometry({ positions: new Float32Array(8), uvs: new Float32Array([0,0,1,0,1,1,0,1]), indices: new Uint32Array([0,2,1,0,3,2]) }), texture: Texture.WHITE });
      mesh.tint = 0xece8df;
      this.ribbons.push(mesh);
      this.view.addChild(mesh);
    }
    const x = 183, y = 733;
    this.anchor = [];
    for (const [ia, ib, ic] of rig.tris) {
      const a = rig.verts[ia], b = rig.verts[ib], c = rig.verts[ic];
      const det = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const u = ((x - a[0]) * (c[1] - a[1]) - (y - a[1]) * (c[0] - a[0])) / det;
      const v = ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) / det;
      if (u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6) {
        this.anchor = [[ia, 1 - u - v], [ib, u], [ic, v]];
        break;
      }
    }
    if (!this.anchor.length) throw new Error('Cigar smoke anchor is outside the Don mesh');
  }

  update(timeMs: number, posed: Float32Array) {
    const x = this.anchor.reduce((s, [id, w]) => s + posed[2 * id] * w, 0);
    const y = this.anchor.reduce((s, [id, w]) => s + posed[2 * id + 1] * w, 0);
    const time = timeMs / 1000;
    for (let strand = 0; strand < 3; strand++) {
      const path = (u: number) => {
        const age = u * 4.4;
        const wind = Math.sin((time - age) * 0.72 + strand * 0.7) * 16
          + Math.sin((time - age) * 1.31 + strand) * 7;
        return [x + wind * Math.pow(u, 0.75) + u * u * 12, y - u * 155];
      };
      for (let i = 0; i < 24; i++) {
        const u = i / 24, next = (i + 1) / 24;
        const a = path(u), b = path(next);
        const alpha = (0.5 - strand * 0.13) * Math.pow(1 - u, 1.25)
          * (0.8 + 0.2 * Math.sin((time - u * 4.4) * 0.9 + strand));
        const width = (8 + u * 12 + strand * 2) / 2;
        const mesh = this.ribbons[strand * 24 + i];
        const buffer = mesh.geometry.getBuffer('aPosition');
        (buffer.data as Float32Array).set([a[0] - width, a[1], a[0] + width, a[1], b[0] + width, b[1], b[0] - width, b[1]]);
        buffer.update();
        mesh.alpha = alpha;
      }
    }
  }
}
