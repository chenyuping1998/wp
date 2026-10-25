// Spine 4.3 → 4.2 (what the games load), optional uniform scale, and a check that the 4.2 file plays exactly like the
// 4.3 one on the game's own runtime.
//
// What 4.3 spells differently: one `constraints` list ordered by position (4.2: separate `ik` / `transform` /
// `physics` lists with an `order` each); the transform constraint's `source` / `localSource` / `localTarget` /
// `additive` / `properties` map (4.2: `target`, `local`, `relative`, plain mixes). The half-angle helper is the one
// transform this rig uses: 4.3 `properties.rotate.to.rotate {scale 0.5, offset R/2}` with mixRotate 1 is 4.2's
// absolute local constraint with mixRotate 0.5 (the helper's setup rotation R equals its source's, and nothing keys it).
// Bones, meshes, bone / IK timelines and events read the same in both.

export function to42(j43: any, version = '4.2.74'): any {
  const j = structuredClone(j43);
  j.skeleton.spine = version;
  const ik: any[] = [], transform: any[] = [], physics: any[] = [];
  (j.constraints ?? []).forEach((c: any, order: number) => {
    const { type, ...rest } = c;
    if (type === 'ik') ik.push({ ...rest, order });
    else if (type === 'physics') physics.push({ ...rest, order });
    else if (type === 'transform') {
      const half = c.localSource && c.localTarget && !c.additive && c.properties?.rotate?.to?.rotate && Object.keys(c.properties).length === 1;
      if (!half) throw new Error(`transform ${c.name}：只會轉換半角輔助骨的形式`);
      const k = c.properties.rotate.to.rotate;
      transform.push({
        name: c.name, order, bones: c.bones, target: c.source, local: true, relative: false,
        rotation: 0, x: 0, y: 0, scaleX: 0, scaleY: 0, shearY: 0,
        mixRotate: k.scale * (c.mixRotate ?? 1), mixX: 0, mixY: 0, mixScaleX: 0, mixScaleY: 0, mixShearY: 0,
      });
    } else throw new Error(`不支援的約束 ${type}`);
  });
  delete j.constraints;
  if (ik.length) j.ik = ik;
  if (transform.length) j.transform = transform;
  if (physics.length) j.physics = physics;
  return j;
}

/** Uniform scale of everything with a length: bones, meshes, IK softness, translate keys (and their curve values). */
export function scaleJson(j: any, s: number): any {
  if (s === 1) return j;
  const k = (v: number | undefined) => (v === undefined ? v : Math.round(v * s * 1000) / 1000);
  for (const f of ['x', 'y', 'width', 'height']) if (j.skeleton[f] !== undefined) j.skeleton[f] = k(j.skeleton[f]);
  for (const b of j.bones) for (const f of ['x', 'y', 'length']) if (b[f] !== undefined) b[f] = k(b[f]);
  for (const c of [...(j.ik ?? []), ...(j.constraints ?? []).filter((c: any) => c.type === 'ik')]) if (c.softness) c.softness = k(c.softness);
  for (const skin of j.skins) for (const slot of Object.values<any>(skin.attachments)) for (const a of Object.values<any>(slot)) {
    if (a.type !== 'mesh') continue;
    const v = a.vertices, n = a.uvs.length / 2;
    if (v.length === n * 2) { a.vertices = v.map((x: number) => k(x)); }
    else for (let i = 0, vi = 0; vi < n; vi++) { const bones = v[i++]; for (let b = 0; b < bones; b++, i += 4) { v[i + 1] = k(v[i + 1]); v[i + 2] = k(v[i + 2]); } }
    a.width = k(a.width); a.height = k(a.height);
  }
  for (const anim of Object.values<any>(j.animations ?? {})) {
    for (const tl of Object.values<any>(anim.bones ?? {})) {
      for (const name of ['translate', 'translatex', 'translatey']) {
        for (const key of tl[name] ?? []) {
          for (const f of ['x', 'y', 'value']) if (key[f] !== undefined) key[f] = k(key[f]);
          if (Array.isArray(key.curve)) key.curve = key.curve.map((c: number, i: number) => (i % 2 ? k(c) : c));
        }
      }
    }
    for (const keys of Object.values<any>(anim.ik ?? {})) for (const key of keys) {
      if (key.softness !== undefined) key.softness = k(key.softness);
      if (Array.isArray(key.curve)) key.curve = key.curve.map((c: number, i: number) => (i >= 4 && i % 2 ? k(c) : c));
    }
  }
  return j;
}

/**
 * The same check for a Spine 4.3 game file (scaled, loaded with its real atlas) against the unscaled rig on the kit's
 * 4.3 runtime: what a game that ships the 4.3 runtime would play.
 */
export function verify43(c43: any, j43: any, jGame: any, atlasText: string, deform43: (sk: any) => Map<string, Float32Array>, parse43: (j: any) => any, s: number): VerifyResult {
  const atlas = new c43.TextureAtlas(atlasText);
  const missingRegions = Object.keys(jGame.skins[0].attachments).filter((n) => !atlas.findRegion(n));
  const dataG = new c43.SkeletonJson(new c43.AtlasAttachmentLoader(atlas)).readSkeletonData(jGame);
  const data = parse43(j43);
  const skG = new c43.Skeleton(dataG), sk = new c43.Skeleton(data), flip = new c43.Skeleton(dataG);
  flip.scaleX = -1;
  const pose = (k: any, a: any, t: number) => { k.setupPose(); a.apply(k, 0, t, false, [], 1, 0, false, false, false); k.updateWorldTransform(c43.Physics.none); };
  const verts = (k: any, slot: any, out: Float32Array) => {
    const att = slot.getAppliedPose().getAttachment();
    if (!att || !att.computeWorldVertices) return 0;
    att.computeWorldVertices(k, slot, 0, att.worldVerticesLength, out, 0, 2);
    return att.worldVerticesLength;
  };
  let boneMax = 0, vertexMax = 0, mirrorMax = 0, frames = 0, at = '';
  const buf = new Float32Array(20000), mir = new Float32Array(20000);
  for (const anim of data.animations) {
    const aG = dataG.findAnimation(anim.name);
    for (let t = 0; t <= anim.duration + 1e-6; t += 1 / 30) {
      pose(sk, anim, t); pose(skG, aG, t); pose(flip, aG, t);
      for (const b of sk.bones) {
        const p = b.getAppliedPose(), q = skG.findBone(b.data.name).getAppliedPose();
        const e = Math.hypot(p.worldX * s - q.worldX, p.worldY * s - q.worldY);
        if (e > boneMax) { boneMax = e; at = `${anim.name}@${t.toFixed(2)} ${b.data.name}`; }
      }
      const expect = deform43(sk);
      skG.slots.forEach((slot: any, i: number) => {
        const n = verts(skG, slot, buf);
        if (!n) return;
        verts(flip, flip.slots[i], mir);
        const e43 = expect.get(slot.data.name)!;
        for (let v = 0; v < n; v++) {
          const e = Math.abs(buf[v] - e43[v] * s);
          if (e > vertexMax) { vertexMax = e; at = `${anim.name}@${t.toFixed(2)} ${slot.data.name}`; }
          mirrorMax = Math.max(mirrorMax, v % 2 ? Math.abs(buf[v] - mir[v]) : Math.abs(buf[v] + mir[v]));
        }
      });
      frames++;
    }
  }
  return { boneMax, vertexMax, mirrorMax, frames, missingRegions, at };
}

export interface VerifyResult { boneMax: number; vertexMax: number; mirrorMax: number; frames: number; missingRegions: string[]; at: string }

/**
 * Plays every animation at 30 fps on both runtimes (4.3: the kit's, 4.2: the game's) and compares every bone's world
 * position and every mesh vertex; the 4.2 side loads the real atlas, so a missing or misnamed region fails here too.
 * `deform43` gives the expected mesh vertices from the 4.3 pose (the rig's own skinning), `s` the export scale.
 */
export function verify42(c43: any, c42: any, j43: any, j42: any, atlasText: string, deform43: (sk: any) => Map<string, Float32Array>, parse43: (j: any) => any, s: number): VerifyResult {
  const atlas = new c42.TextureAtlas(atlasText);
  const missingRegions = Object.keys(j42.skins[0].attachments).filter((n) => !atlas.findRegion(n));
  const data42 = new c42.SkeletonJson(new c42.AtlasAttachmentLoader(atlas)).readSkeletonData(j42);
  const data43 = parse43(j43);
  const sk42 = new c42.Skeleton(data42), sk43 = new c43.Skeleton(data43);
  let boneMax = 0, vertexMax = 0, frames = 0, at = '';
  const buf = new Float32Array(20000);
  for (const anim of data43.animations) {
    const a42 = data42.findAnimation(anim.name);
    for (let t = 0; t <= anim.duration + 1e-6; t += 1 / 30) {
      sk43.setupPose(); anim.apply(sk43, 0, t, false, [], 1, 0, false, false, false); sk43.updateWorldTransform(c43.Physics.none);
      sk42.setToSetupPose(); a42.apply(sk42, 0, t, false, [], 1, c42.MixBlend.setup, c42.MixDirection.mixIn); sk42.updateWorldTransform(c42.Physics.none);
      for (const b of sk43.bones) {
        const p = b.getAppliedPose(), q = sk42.findBone(b.data.name);
        const e = Math.hypot(p.worldX * s - q.worldX, p.worldY * s - q.worldY);
        if (e > boneMax) { boneMax = e; at = `${anim.name}@${t.toFixed(2)} ${b.data.name}`; }
      }
      const expect = deform43(sk43);
      for (const slot of sk42.slots) {
        const att = slot.getAttachment();
        if (!att || !att.computeWorldVertices) continue;
        const n = att.worldVerticesLength;
        att.computeWorldVertices(slot, 0, n, buf, 0, 2);
        const e43 = expect.get(slot.data.name)!;
        for (let i = 0; i < n; i++) {
          const e = Math.abs(buf[i] - e43[i] * s);
          if (e > vertexMax) { vertexMax = e; at = `${anim.name}@${t.toFixed(2)} ${slot.data.name}`; }
        }
      }
      frames++;
    }
  }
  // a game may flip the mascot with skeleton.scaleX = -1: every vertex must land exactly mirrored (bones that don't
  // inherit rotation, like the feet, are the ones that could get this wrong)
  let mirrorMax = 0;
  const flip = new c42.Skeleton(data42), mirrored = new Float32Array(20000);
  flip.scaleX = -1;
  for (const anim of data42.animations) for (const t of [0, anim.duration / 3, (2 * anim.duration) / 3]) {
    for (const k of [sk42, flip]) { k.setToSetupPose(); anim.apply(k, 0, t, false, [], 1, c42.MixBlend.setup, c42.MixDirection.mixIn); k.updateWorldTransform(c42.Physics.none); }
    for (let i = 0; i < sk42.slots.length; i++) {
      const att = sk42.slots[i].getAttachment();
      if (!att || !att.computeWorldVertices) continue;
      const n = att.worldVerticesLength;
      att.computeWorldVertices(sk42.slots[i], 0, n, buf, 0, 2);
      flip.slots[i].getAttachment().computeWorldVertices(flip.slots[i], 0, n, mirrored, 0, 2);
      for (let v = 0; v < n; v += 2) mirrorMax = Math.max(mirrorMax, Math.abs(buf[v] + mirrored[v]), Math.abs(buf[v + 1] - mirrored[v + 1]));
    }
  }
  return { boneMax, vertexMax, mirrorMax, frames, missingRegions, at };
}
