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
WRIST_BAND = 30   # px either side of the lead wrist where forearm hands over to handF
KNEE_ABOVE = 110  # px above the knee (along the thigh) where the shin starts to take over
KNEE_BELOW = 70   # px below the knee where the shin owns the trouser leg
WAIST_PASSES = 12 # neighbour-averaging passes over the body's chest/hip split
SMOOTH_PASSES = 4 # neighbour-averaging passes over the lead arm's weights after the hand-over
WRIST_REACH = 80  # px before the lead wrist over which the upper arm lets go of the wrap and fist
HAND_RADIUS = 95  # px from the wrist->fist line that can belong to the hand
SLEEVE_IN = 30    # px inside the sleeve edge (torso side) where the shoulder lock starts
LOCK_REACH = 12   # px from the arm layer's mesh over which the body still copies its weights
CAP_FOLLOW = {'mg': 1.0, 'fg': 0.6}  # per character; how hard the arm side of the armhole seam lets go of the chest share (11-08)
COVER_BACK = 0.2  # overlap sync ends this far (in upper-arm lengths) above the bulb's t
COVER_PASSES = 4  # grid smoothing passes over the overlap sync's edge
FORE_SYNC = 0.0   # share of the arm's forearm weight the body's overlap copies (1 = exact; folds the bulb rim at full bend)
SLEEVE_OUT = 64   # px outside it where the body-painted sleeve fully rides the arm
LAYERS = [  # slot, image, sigma, bones (a bone may list extra segments below)
  # No hand bones: the kit turns them and the mesh twists at the wrap (「手分離」).
  ('arm_far', 'arm_r', 100, ['chest', 'upperArmF', 'foreArmF', 'handF']),
  ('body', 'body', 34, ['hip', 'chest', 'thighB', 'shinB', 'thighF', 'shinF', 'upperArmF', 'foreArmF', 'footB', 'footF']),
  ('head', 'head', 48, ['chest', 'neck', 'head']),
  ('arm_near', 'arm_l', 100, ['chest', 'upperArmB', 'foreArmB']),
]


def seg_dist(p, a, b):
  a, b = np.asarray(a, float), np.asarray(b, float)
  d = b - a
  t = np.clip(((p - a) @ d) / max(1e-6, d @ d), 0, 1)
  return np.linalg.norm(p - (a + t[:, None] * d), axis=1)


def shoulder_field(P, who, j, t_end=None):
  """0 on the torso side of the drawn sleeve seam, 1 on the arm side, over the
  upper arm's shoulder half only. The SAME field weights both the body's
  painted sleeve and the arm layer's root under it, so the two move as one
  and the arm root hidden behind the torso stays hidden (2026-11-06)."""
  e0, e1 = (np.asarray(p_, float) for p_ in CHARS[who]['sleeve_edge'])
  en = np.array([e1[1] - e0[1], -(e1[0] - e0[0])]); en /= np.linalg.norm(en)
  if en @ (np.asarray(j['elbowF'], float) - e0) < 0: en = -en   # outward = toward the arm
  f = np.clip(((P - e0) @ en + SLEEVE_IN) / (SLEEVE_IN + SLEEVE_OUT), 0, 1); f = f * f * (3 - 2 * f)
  sh = np.asarray(j['shoulderF'], float); el = np.asarray(j['elbowF'], float); d = el - sh
  t = ((P - sh) @ d) / (d @ d)
  bulb = CHARS[who]['sleeve_bulb']
  t_end = bulb['t'] + 0.15 if t_end is None else t_end
  region = np.clip((t_end - t) / 0.2, 0, 1) * np.clip((bulb['r'] + 50 - seg_dist(P, sh, el)) / 30, 0, 1)
  return f, region


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
    # Feet on their own bones (2026-11-05). Riding the shins, each shoe turned
    # about its pinned ankle whenever the knee bent, so toes and heels lifted
    # and sank ±17-27 px through the idle bounce (「腳在滑」). mesh_to_spine.mjs
    # adds footB/footF at the ankles with world-fixed rotation; the ankle
    # blends over the body layer's sigma like every other joint.
    segments['footB'] = [(j['ankleB'], j['toeB'])]
    segments['footF'] = [(j['ankleF'], j['toeF'])]
    # fists ride the forearms rigidly
    segments['foreArmB'] = seg('foreArmB') + [(j['wristB'], j['fistB'])]
    segments['foreArmF'] = seg('foreArmF') + [(j['wristF'], j['fistF'])]
    out = []
    arm_far = arm_lock = None
    for slot, image, sigma, names in LAYERS:
      img = Image.open(D / 'cast' / who / f'{image}.png').convert('RGBA')
      a = np.asarray(img)[:, :, 3] > 0
      x0, y0, x1, y1 = Image.fromarray((a * 255).astype(np.uint8)).getbbox()
      x0, y0 = max(0, x0 - 2), max(0, y0 - 2); x1, y1 = min(1024, x1 + 2), min(1536, y1 + 2)
      crop = img.crop((x0, y0, x1, y1)); dest = D / 'kit' / who / f'{slot}.png'
      # rewrite only on a pixel change, so a rebuild does not churn the upload
      if not dest.exists() or not np.array_equal(np.asarray(Image.open(dest).convert('RGBA')), np.asarray(crop)):
        crop.save(dest, optimize=True)
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
        # foreArmF only through the overlap sync below (2026-11-07): folding the
        # arm's forearm share into upperArmF there made the painted bulb move
        # apart from the sleeve under it (celebrate 「肩膀黑線分離」)
        dist[:, names.index('foreArmF')] = np.inf
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
        if slot == 'arm_far' and CHARS[who].get('sleeve_edge'):
          # Celebrate (2026-11-08 「慶祝的時候手跟肩膀之間還是有分離感」): with the
          # 0.3 chest share running down the whole upper arm, the painted shoulder
          # (which copies these weights) turned ~0.7 while the arm past it turned
          # fully, folding a notch between ball and arm. Keep the chest share on
          # the torso side of the drawn armhole seam only; past it the cap and the
          # upper arm turn as one and the bend sits on the seam.
          fs, _ = shoulder_field(P, who, j)
          keep = keep * (1 - fs) ** CAP_FOLLOW[who]
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
      if slot == 'body' and arm_far is not None and CHARS[who].get('sleeve_edge'):
        # Shoulder lock (2026-11-06 「揮拳那隻手的肩膀處還是有分裂感」). The cap
        # above gave the body-painted sleeve only 0.3-0.5 of the upper arm while
        # the arm layer under it rides at 0.7-1.0, so at full reach the painted
        # shoulder stayed a round ball with its outline across the sleeve. Every
        # body vertex outside the torso's edge, along the upper arm's shoulder
        # half, now takes the arm layer's own weights (nearest arm vertex): the
        # two layers move as one where they overlap, and the hand-over to the
        # torso sits on the seam the art already draws.
        f, region = shoulder_field(P, who, j)
        f = f * region
        # only where the arm layer actually is (11-08): the shoulder top by the
        # hood has no arm under it, and copying the nearest arm vertex 70+ px
        # away squashed it when celebrate raised the arm
        dn = np.sqrt(((P[:, None, :] - arm_lock[0][None]) ** 2).sum(2).min(1))
        f = f * np.clip(1 - (dn - LOCK_REACH) / 40, 0, 1)
        # spread over the grid: a hard edge at the top of the cap sheared the
        # hood's shoulder line when celebrate raised the arm
        nbb = [set() for _ in range(len(P))]
        for t_ in range(0, len(tris), 3):
          a_, b_, c_ = tris[t_:t_ + 3]
          nbb[a_].update((b_, c_)); nbb[b_].update((a_, c_)); nbb[c_].update((a_, b_))
        nbb = [list(n) for n in nbb]
        for _ in range(8):
          f = 0.5 * f + 0.5 * np.array([f[n].mean() for n in nbb])
        aP, aS, aN = arm_lock
        near = np.argmin(((P[:, None, :] - aP[None]) ** 2).sum(2), 1)
        lock = np.zeros_like(score)
        for k, n in enumerate(aN):
          # foreArmF folds into the upper arm here (a fist pump dragged the
          # jacket side up with it); only the overlap sync below keeps it
          lock[:, names.index('upperArmF' if n in ('foreArmF', 'handF') or n not in names else n)] += aS[near, k]
        score = score * (1 - f)[:, None] + lock * f[:, None]
      if slot == 'body':
        # Waist (2026-11-05): chest vs hip split over the body's sigma-34 blend
        # was a narrow step at the waistline, so the jab's chest twist folded
        # the torso's back edge (check_spine_motion_cast punch:21). Spread only
        # that split along the grid; every other bone keeps its weight.
        ci_, hp_ = names.index('chest'), names.index('hip')
        tot = score[:, ci_] + score[:, hp_]
        frac = np.where(tot > 1e-9, score[:, ci_] / np.maximum(tot, 1e-9), 0.5)
        nb = [set() for _ in range(len(P))]
        for t in range(0, len(tris), 3):
          a_, b_, c_ = tris[t:t + 3]
          nb[a_].update((b_, c_)); nb[b_].update((a_, c_)); nb[c_].update((a_, b_))
        nb = [list(n) for n in nb]
        torso = tot > 0.3
        for _ in range(WAIST_PASSES):
          frac = np.where(torso, 0.5 * frac + 0.5 * np.array([frac[n].mean() for n in nb]), frac)
        score[:, ci_] = tot * frac
        score[:, hp_] = tot * (1 - frac)
      if slot == 'body':
        # Knees (2026-11-05): with the feet now planted the knees really bend,
        # and the sigma-34 distance split handed the wide trousers' outer
        # thigh (MG's hanging pocket strap) up to 0.34 shin far above the
        # knee, so the strap sheared and forked on the landing squat. Split
        # thigh/shin along the thigh's own axis instead: shin only from
        # KNEE_ABOVE px above the knee to KNEE_BELOW px below it.
        for side in 'BF':
          ti_, si_ = names.index('thigh' + side), names.index('shin' + side)
          hp = np.asarray(j['hip' + side], float); kn = np.asarray(j['knee' + side], float)
          ut = (kn - hp) / np.linalg.norm(kn - hp)
          w = np.clip(((P - kn) @ ut + KNEE_ABOVE) / (KNEE_ABOVE + KNEE_BELOW), 0, 1)
          w = w * w * (3 - 2 * w)
          tot = score[:, ti_] + score[:, si_]
          score[:, si_] = tot * w
          score[:, ti_] = tot * (1 - w)
      if slot == 'arm_far':
        # Lead wrist and fist (2026-11-05). The sigma-100 distance blend gave the
        # fist and wrap a share of upperArmF, so when the jab straightened the
        # elbow the wrist was averaged between two frames and stretched to 2x
        # (shipped v5, punch@0.9-1.3). The elbow keeps that wide blend (its
        # folded crook flips without it); from the wrist out, the upper arm's
        # share moves to the forearm over WRIST_REACH px. The fist itself is on
        # handF, blended across WRIST_BAND px of the wrist, so the punch can
        # turn the knuckles in line: riding the forearm, the guard drawing's
        # fist (cocked ~20° above the forearm) read as a wrist bent back at full
        # reach (「手腕後折」). The kit never keys handF, so every other move
        # keeps the drawn fist.
        ui_, fi_, hi = names.index('upperArmF'), names.index('foreArmF'), names.index('handF')
        wr = np.asarray(j['wristF'], float); fi = np.asarray(j['fistF'], float)
        u = (fi - wr) / np.linalg.norm(fi - wr)
        s = (P - wr) @ u
        near_hand = np.clip((HAND_RADIUS - seg_dist(P, wr, fi)) / 20, 0, 1)
        el = np.asarray(j['elbowF'], float)
        uf = (wr - el) / np.linalg.norm(wr - el)
        h = np.clip((s + WRIST_BAND) / (2 * WRIST_BAND), 0, 1)
        h = h * h * (3 - 2 * h) * near_hand
        # the hand starts out at the wrist along the forearm, never in the elbow's crook
        g = np.clip(((P - wr) @ uf + 2 * WRIST_BAND) / (2 * WRIST_BAND), 0, 1)
        h *= g * g * (3 - 2 * g)
        m = np.clip(((P - wr) @ uf + WRIST_REACH) / WRIST_REACH, 0, 1)
        m = m * m * (3 - 2 * m) * near_hand
        # the folded guard's crook lies against both bones: leave it to the wide
        # blend; the fist (drawn folded up beside the upper arm) always lets go
        sh = np.asarray(j['shoulderF'], float)
        c = np.clip((seg_dist(P, sh, el) - seg_dist(P, el, wr)) / 60, 0, 1)
        m *= np.maximum(c * c * (3 - 2 * c), h)
        moved = score[:, ui_] * m
        score[:, ui_] -= moved
        score[:, fi_] += moved
        score[:, hi] = score[:, fi_] * h
        score[:, fi_] *= (1 - h)
        # Spread the hand-over across the grid: a steep step inside one cell
        # flipped the cuff's triangles when the windup folded the elbow past the
        # drawing (check_spine_motion_cast, punch:20).
        nb = [set() for _ in range(len(P))]
        for t in range(0, len(tris), 3):
          a_, b_, c_ = tris[t:t + 3]
          nb[a_].update((b_, c_)); nb[b_].update((a_, c_)); nb[c_].update((a_, b_))
        nb = [list(n) for n in nb]
        for _ in range(SMOOTH_PASSES):
          score = 0.5 * score + 0.5 * np.stack([score[n].mean(0) for n in nb])
        score = score / score.sum(1, keepdims=True).clip(min=1e-9)
      if slot == 'arm_far':
        arm_lock = (P.copy(), score.copy(), list(names))  # pre-root weights: the v38 shoulder lock
        if CHARS[who].get('sleeve_edge'):
          # the root behind the torso rides the chest, as the torso over it does
          # root only: the inner upper arm further down is the elbow's crook
          f, region = shoulder_field(P, who, j, t_end=0.32)
          g = 1 - (1 - f) * region
          # spread along the grid: a steep chest step beside the folded crook
          # flipped the armpit's triangles in the windup (punch:20)
          for _ in range(8):
            g = 0.5 * g + 0.5 * np.array([g[n].mean() for n in nb])
          # never on the crook: what the forearm already shares stays free
          g = 1 - (1 - g) * np.clip(1 - score[:, names.index('foreArmF')] * 6, 0, 1)
          score = score * g[:, None]
          score[:, names.index('chest')] += 1 - g
        # final weights (with the root's chest share) for the overlap sync
        arm_far = (P.copy(), score.copy(), list(names))
      if slot == 'body' and arm_far is not None and CHARS[who].get('sleeve_edge'):
        # Same warp over the overlap (2026-11-07 「肩膀這邊還是有黑線分離感」).
        # Wherever the lead arm really lies under the body's painted sleeve at
        # rest, the body takes the arm layer's own final weights at that
        # point; otherwise the sleeve hidden under the bulb turned more than
        # the bulb and slid out past its rim when celebrate raised the arm.
        aP, aS, aN = arm_far
        d2 = ((P[:, None, :] - aP[None]) ** 2).sum(2)
        k4 = np.argsort(d2, 1)[:, :4]
        iw = 1 / (np.sqrt(np.take_along_axis(d2, k4, 1)) + 1)
        iw /= iw.sum(1, keepdims=True)
        armW = np.zeros_like(score)
        for k, n in enumerate(aN):
          wk = (aS[k4, k] * iw).sum(1)
          if n in ('foreArmF', 'handF'):   # part of the forearm share: the elbow's fold
            armW[:, names.index('foreArmF')] += FORE_SYNC * wk; armW[:, names.index('upperArmF')] += (1 - FORE_SYNC) * wk
          else:
            armW[:, names.index(n) if n in names else names.index('upperArmF')] += wk
        arm_a = np.asarray(Image.open(D / 'cast' / who / 'arm_r.png').convert('RGBA'))[:, :, 3] > 200
        xi = np.clip(P[:, 0].astype(int), 0, 1023); yi = np.clip(P[:, 1].astype(int), 0, 1535)
        # shoulder half only (to the bulb's t): lower down is the jacket's side
        # over the elbow crook, where a copied forearm share folds it (idle:3)
        f, region = shoulder_field(P, who, j, t_end=CHARS[who]['sleeve_bulb']['t'] - COVER_BACK)
        cover = (arm_a[yi, xi] & (f > 0.5)).astype(float) * region
        nbc = [set() for _ in range(len(P))]
        for t_ in range(0, len(tris), 3):
          a_, b_, c_ = tris[t_:t_ + 3]
          nbc[a_].update((b_, c_)); nbc[b_].update((a_, c_)); nbc[c_].update((a_, b_))
        nbc = [list(n) for n in nbc]
        for _ in range(COVER_PASSES):
          cover = 0.5 * cover + 0.5 * np.array([cover[n].mean() for n in nbc])
        c = np.clip(cover * 1.6, 0, 1)[:, None]
        score = score / score.sum(1, keepdims=True).clip(min=1e-9)
        score = score * (1 - c) + armW * c
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
