"""Weighted-mesh cast for the kit skeleton (2026-10-23, front v24).

Cut region layers tear when the kit's IK bends an elbow/knee or turns the head
(「脖子分離」「手肘肉跑出來」「腳有殘影」). Instead each delivered drawing
(cast/<who>/{arm_r,body,head,arm_l}.png) becomes ONE grid mesh skinned to the
kit bones, so joints bend smoothly and nothing separates. Weights fall off with
distance to each bone segment; neighbours blend over ~sigma px.

Writes kit/<who>/mesh.json (canvas-space verts/uvs/tris/weights by bone name);
mesh_to_spine.mjs turns it into Spine weighted meshes.
Run: /Applications/anaconda3/bin/python3 design/rebuild_20261023/build_mesh_cast.py
"""
from pathlib import Path
import json, subprocess, sys
import numpy as np
from PIL import Image

D = Path(__file__).resolve().parent
APP = D.parent.parent
sys.path.insert(0, str(D))
from split_kit_layers import CHARS  # joints incl. toes / shoulders

CELL = 16
LAYERS = [  # slot, image, sigma, bones (a bone may list extra segments below)
  # No hand bones: the kit turns them and the mesh twists at the wrap (「手分離」).
  ('arm_far', 'arm_r', 100, ['chest', 'upperArmF', 'foreArmF']),
  ('body', 'body', 34, ['hip', 'chest', 'thighB', 'shinB', 'thighF', 'shinF', 'upperArmF']),
  ('head', 'head', 48, ['chest', 'neck', 'head']),
  ('arm_near', 'arm_l', 100, ['chest', 'upperArmB', 'foreArmB']),
]


def seg_dist(p, a, b):
  a, b = np.asarray(a, float), np.asarray(b, float)
  d = b - a
  t = np.clip(((p - a) @ d) / max(1e-6, d @ d), 0, 1)
  return np.linalg.norm(p - (a + t[:, None] * d), axis=1)


def main():
  for who in sys.argv[1:] or ['mg', 'fg']:
    kit = D / 'kit' / who / 'spine' / f'turf_{who}.json'
    bones = {b['name']: b for b in json.loads(subprocess.check_output(
      ['node', str(D / 'dump_kit_bones.mjs'), str(kit)], cwd=APP))}
    j = CHARS[who]['j']
    seg = lambda n: [((bones[n]['x'], bones[n]['y']), (bones[n]['tx'], bones[n]['ty']))]
    segments = {n: seg(n) for n in bones}
    # chest also owns the shoulder line, so sleeve tops blend into the torso
    segments['chest'] = seg('chest') + [((bones['neck']['x'], bones['neck']['y']), j['shoulderB']),
                                        ((bones['neck']['x'], bones['neck']['y']), j['shoulderF'])]
    # shins carry the feet
    segments['shinB'] = seg('shinB') + [(j['ankleB'], j['toeB'])]
    segments['shinF'] = seg('shinF') + [(j['ankleF'], j['toeF'])]
    # fists ride the forearms rigidly
    segments['foreArmB'] = seg('foreArmB') + [(j['wristB'], j['fistB'])]
    segments['foreArmF'] = seg('foreArmF') + [(j['wristF'], j['fistF'])]
    out = []
    for slot, image, sigma, names in LAYERS:
      img = Image.open(D / 'cast' / who / f'{image}.png').convert('RGBA')
      a = np.asarray(img)[:, :, 3] > 0
      x0, y0, x1, y1 = Image.fromarray((a * 255).astype(np.uint8)).getbbox()
      x0, y0 = max(0, x0 - 2), max(0, y0 - 2); x1, y1 = min(1024, x1 + 2), min(1536, y1 + 2)
      img.crop((x0, y0, x1, y1)).save(D / 'kit' / who / f'{slot}.png', optimize=True)
      nx, ny = -(-(x1 - x0) // CELL), -(-(y1 - y0) // CELL)
      gx = np.minimum(x0 + np.arange(nx + 1) * CELL, x1); gy = np.minimum(y0 + np.arange(ny + 1) * CELL, y1)
      index, verts, tris = {}, [], []
      def vid(i, k):
        if (i, k) not in index: index[(i, k)] = len(verts); verts.append((float(gx[i]), float(gy[k])))
        return index[(i, k)]
      for k in range(ny):
        for i in range(nx):
          if a[gy[k]:max(gy[k] + 1, gy[k + 1]), gx[i]:max(gx[i] + 1, gx[i + 1])].any():
            v00, v10, v01, v11 = vid(i, k), vid(i + 1, k), vid(i, k + 1), vid(i + 1, k + 1)
            tris += [v00, v10, v11, v00, v11, v01]
      P = np.asarray(verts)
      dist = np.stack([np.min([seg_dist(P, s0, s1) for s0, s1 in segments[n]], axis=0) for n in names], 1)
      if slot.startswith('arm'):
        dist[:, names.index('chest')] = np.inf
      elif slot == 'body':
        dist[:, names.index('upperArmF')] = np.inf
      score = np.exp(-(((dist - dist.min(1, keepdims=True)) / sigma) ** 2))
      if slot.startswith('arm'):
        # Chest proximity is not anatomy: the guard fist sits over the chest
        # in the drawing, but must stay with the forearm throughout a move.
        score[:, names.index('chest')] = 0
      score[score < 0.00001] = 0
      # Anchor the joint the art hides to the chest, handing over gradually:
      # - arms: the sleeve was cut where the body covered it, so a raised arm
      #   showed a cut-off shoulder (「手臂分離」); keep the shoulder end on the
      #   chest and let the sleeve stretch to the upper arm across the upper 70% of its length.
      # - head: the beard slid over the FG collar (「FG脖子還是分離」); keep the
      #   jaw/beard bottom on the chest, the skull turns.
      ci = names.index('chest')
      if slot.startswith('arm'):
        side = 'F' if slot == 'arm_far' else 'B'
        sh = np.asarray(j['shoulder' + side], float); el = np.asarray(j['elbow' + side], float)
        d = el - sh
        t = np.clip(((P - sh) @ d) / (d @ d), 0, 1)
        # Only the upper arm may blend into its shoulder. A folded fist can
        # be spatially close to the shoulder without belonging to it.
        fore_end = np.asarray(j['fist' + side], float)
        near = seg_dist(P, sh, el) < seg_dist(P, el, fore_end)
        keep = np.where(near, 0.3 * (1 - np.clip(t / 0.7, 0, 1)), 0)  # shared with the body cap below (2026-10-23 「肩膀不會動但手會動」)
      elif slot == 'head':
        top = bones['head']['y'] - 40; bottom = bones['neck']['y'] + 30
        u = np.clip((P[:, 1] - top) / (bottom - top), 0, 1)
        keep = u * u * (3 - 2 * u)
      else:
        # A torso/leg mesh must retain hip/thigh/shin weights. Applying the
        # head-to-neck clamp here had bound every trouser pixel to the chest.
        keep = np.zeros(len(P))
      score = score / score.sum(1, keepdims=True).clip(min=1e-9)
      score = score * (1 - keep)[:, None]
      score[:, ci] += keep
      if slot == 'body':
        # Deltoid: the far shoulder painted on the body follows the lead arm part
        # way, so a jab's raised sleeve doesn't open a gap under the shoulder cap
        # (「出拳那隻手跟身體還是有點分離」 2026-10-23). Only the bulge outside the
        # torso line, falling off over ~0.6 of the upper arm length.
        ui = names.index('upperArmF')
        score[:, ui] = 0  # no distance-based arm weight on the body; only the cap below
        score = score / score.sum(1, keepdims=True).clip(min=1e-9)
        sh = np.asarray(j['shoulderF'], float); el = np.asarray(j['elbowF'], float)
        L = np.linalg.norm(el - sh)
        r = np.linalg.norm(P - sh, axis=1) / (L * 0.8)
        outward = (P[:, 0] - (sh[0] - L * 0.45)) / (L * 0.4)
        # 0.7 at the pivot = the arm root's own share (1 - 0.3): cap and sleeve move as one
        w = np.clip(1 - r, 0, 1) ** 1.2 * np.clip(outward, 0, 1) * 0.7
        # The body art also paints the upper sleeve itself (MG's puffed jacket
        # sleeve, FG's rolled shirt cap) over the real arm. Left behind, it showed
        # as a second sleeve with an outline across the jab (「MG肩膀跟手臂還是有點
        # 分離」). Everything of the body beside the upper-arm bone, outside the
        # torso line, IS the arm: weight it fully, fading over ~110 px.
        bulb = CHARS[who].get('sleeve_bulb')
        if bulb:
          dseg = seg_dist(P, sh, el)
          d = el - sh
          t = ((P - sh) @ d) / (d @ d)
          # only the shoulder half of the upper arm: below it is the jacket's
          # side seam, which smeared outward when pulled along (2026-10-23)
          inside = (np.clip((bulb['r'] - dseg) / 110, 0, 1) * np.clip((P[:, 0] - bulb['x']) / 110, 0, 1)
                    * np.clip((bulb['t'] - t) / 0.4, 0, 1))
          w = np.maximum(w, inside)
        score *= (1 - w)[:, None]
        score[:, ui] += w
      score[score < 0.00001] = 0
      order = np.argsort(-score, 1)[:, :3]
      weights = []
      for v in range(len(P)):
        top = [(names[b], float(score[v, b])) for b in order[v] if score[v, b] > 0]
        s = sum(w for _, w in top)
        weights.append([[n, round(w / s, 4)] for n, w in top])
      ink = np.asarray(img)[:, :, 3] > 16
      ink_box = list(Image.fromarray((ink * 255).astype(np.uint8)).getbbox())
      visible_vertices = [i for i,(x,y) in enumerate(verts) if ink[max(0,int(y)-CELL):min(1536,int(y)+CELL+1),max(0,int(x)-CELL):min(1024,int(x)+CELL+1)].any()]
      out.append({'name': slot, 'inkBox': ink_box, 'visibleVertices': visible_vertices, 'crop': [x0, y0, x1 - x0, y1 - y0], 'verts': [[round(x, 2), round(y, 2)] for x, y in verts],
                  'uvs': [[round((x - x0) / (x1 - x0), 5), round((y - y0) / (y1 - y0), 5)] for x, y in verts],
                  'tris': tris, 'weights': weights})
      print(who, slot, 'verts', len(verts), 'tris', len(tris) // 3)
    (D / 'kit' / who / 'mesh.json').write_text(json.dumps(out))


if __name__ == '__main__':
  main()
