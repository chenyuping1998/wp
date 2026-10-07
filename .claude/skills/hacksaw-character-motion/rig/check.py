# -*- coding: utf-8 -*-
"""
The gate. Measures the rig instead of trusting it.

    python rig/check.py character.rig.json

The checks that matter are FOLD and STRETCH.

A continuous mesh cannot tear -- there is no boundary to open, which is the
whole reason for using one. So looking for holes is looking for the wrong thing.
I tried it first: scan every frame for a hole that opens inside the silhouette.
It fired 101 px on the first character, and the pixels were the narrow channel
between his arm and his shirt pinching shut at the mouth and becoming an
enclosed pocket. That is the drawing behaving correctly. Two rounds of narrowing
the test still could not tell it apart from a real fault, because there is no
real fault of that kind to find.

What a skinned mesh CAN do wrong is fold. Push a bone far enough and triangles
collapse to zero area and then invert, and the art creases over itself -- a hard
kink that looks exactly like a broken joint. That is exact and cheap to test:
watch every triangle's signed area across the loop. It must keep its sign and
must not collapse. Alongside it, a triangle stretched too far smears the pixels
inside it, so the growth is capped too, and the opaque area is checked to be
conserved as a backstop against the renderer dropping something.

The other checks are the ones this project learned the hard way:

* **feet planted** -- a standing figure whose feet drift is the thing people
  notice without being able to name.
* **rate** -- the reference idle runs a 2 s cycle. On a 6 s cycle it reads as
  drifting, not breathing. That was the actual cause of "it looks unnatural".
* **not in unison** -- parts on one shared period measure r = 0.94-0.99 against
  each other, which looks exactly like the rigid whole-body sway you were trying
  to escape. Separate periods take it under 0.25.
* **amplitude sane** -- the chain ACCUMULATES, so the head's world angle is the
  sum of every bone below it. Six bones at 2 deg each is 12 deg at the top and
  the figure looks like it is falling over.
"""
from __future__ import print_function
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import skin
import motion

SEAM_MAX = 0            # px of new hole allowed anywhere in the loop
FOOT_MAX_PCT = 0.15     # % of figure height
HEAD_TRAVEL = (0.4, 4.0)     # % of figure height
HEAD_ANGLE_MAX = 4.0    # degrees, accumulated
PERIOD_BAND = (1500, 3000)   # ms
CORR_MAX = 0.60


class Gate(object):
    def __init__(self):
        self.fails = []

    def __call__(self, ok, msg):
        print(('  PASS  ' if ok else '  FAIL  ') + msg)
        if not ok:
            self.fails.append(msg)


def enclosed(mask):
    """Empty pixels that cannot be reached from the border -- true holes.

    This has to be a real 2D flood, not a per-row test. A per-row test calls the
    gap between the legs "interior" because it lies between the leftmost and
    rightmost pixel of the row, so every legitimate sway of the legs registers
    as a tear. Flooding from the border gets it right: the leg gap is open to
    the outside world, a tear is not.
    """
    from scipy import ndimage
    empty = ~mask
    lab, n = ndimage.label(empty)
    if n == 0:
        return np.zeros_like(mask)
    border = set(lab[0].tolist()) | set(lab[-1].tolist())         | set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    border.discard(0)
    out = empty.copy()
    for i in border:
        out &= lab != i
    return out


def interior_holes(rest_mask, now_mask):
    """A tear: pixels that were SOLID FIGURE at rest, are empty now, and are
    now enclosed by the figure.

    All three conditions are needed. Without `rest_mask` the test also fires on
    a narrow gap in the art -- the channel between an arm and the body, say --
    pinching shut at its mouth and becoming an enclosed pocket. That is the
    drawing behaving correctly, not the rig failing, and it cost 88 px of false
    alarm on the first character tried. A real tear consumes pixels that used to
    be part of the figure.
    """
    opened = enclosed(now_mask) & ~enclosed(rest_mask) & rest_mask
    return int(opened.sum()), opened


def check(rig_path, table=None, steps=48, verbose=True):
    g = Gate()
    rig = skin.load_rig(rig_path)
    img_path = os.path.join(os.path.dirname(os.path.abspath(rig_path)),
                            rig.get('image')
                            or os.path.basename(rig_path).split('.rig')[0] + '.png')
    if not os.path.exists(img_path):
        print('cannot find the image next to the rig: %s' % img_path)
        return 1
    img = Image.open(img_path).convert('RGBA')
    bones = rig['bones']
    table = table or motion.DEFAULTS
    x0, y0, x1, y1 = rig['figure_box']
    FH = y1 - y0

    print('rig gate: %s  (%d bones, %d verts, %d tris)'
          % (os.path.basename(rig_path), len(bones), len(rig['verts']), len(rig['tris'])))

    # ------------------------------------------------------------ weights
    W = np.asarray(rig['weights'])
    g(abs(W.sum(1) - 1).max() < 1e-6, 'every vertex is fully weighted')
    spread = (W > 0.02).sum(1)
    g(spread.mean() >= 2.0,
      'vertices are shared between bones (mean %.2f bones each) -- this is what '
      'stops it tearing' % spread.mean())

    # ------------------------------------------------------- fold / stretch
    v0 = np.asarray(rig['verts'])
    tris = np.asarray(rig['tris'])

    def areas(v):
        p, q, r_ = v[tris[:, 0]], v[tris[:, 1]], v[tris[:, 2]]
        return 0.5 * ((q[:, 0] - p[:, 0]) * (r_[:, 1] - p[:, 1])
                      - (r_[:, 0] - p[:, 0]) * (q[:, 1] - p[:, 1]))

    a0 = areas(v0)
    sign0 = np.sign(a0)
    worst_shrink, worst_grow, flipped = 1.0, 1.0, 0
    for i in range(steps):
        t = i * (motion.LOOP_MS / float(steps))
        a1 = areas(skin.pose(rig, motion.angles(bones, t, table)))
        flipped += int((np.sign(a1) != sign0).sum())
        ratio = np.abs(a1) / np.maximum(np.abs(a0), 1e-9)
        worst_shrink = min(worst_shrink, ratio.min())
        worst_grow = max(worst_grow, ratio.max())
    g(flipped == 0,
      'FOLD: no triangle inverts anywhere in the %.0f s loop (%d flips)'
      % (motion.LOOP_MS / 1000.0, flipped))
    g(worst_shrink >= 0.5,
      'FOLD: no triangle collapses (smallest stays at %.0f%% of its rest area, '
      'floor 50%%)' % (100 * worst_shrink))
    g(worst_grow <= 1.6,
      'STRETCH: worst triangle grows to %.2fx its rest area (cap 1.60x) -- '
      'beyond that the pixels inside it visibly smear' % worst_grow)

    # ------------------------------------------- the reaction, including
    # squash and stretch. The idle loop above is the steady state; this is the
    # one-shot on top of it, and it is where the shape-changing channel fires.
    # It is measured at 8 trigger phases because the reaction lands on whatever
    # the idle happens to be doing, and the worst case is a phase thing.
    rsh, rgr, rfl = 1.0, 1.0, 0
    rot_only = 1.0
    for st in range(0, motion.LOOP_MS, motion.LOOP_MS // 8):
        for i in range(24):
            t = st + i * (motion.REACTION_MS / 24.0)
            ang, off, _ = motion.reaction_state(bones, t, st, rig['figure_box'], table)
            sc = motion.reaction_scales(bones, t, st)
            a1 = areas(skin.pose(rig, ang, off, sc))
            rfl += int((np.sign(a1) != sign0).sum())
            ratio = np.abs(a1) / np.maximum(np.abs(a0), 1e-9)
            rsh = min(rsh, ratio.min())
            rgr = max(rgr, ratio.max())
            a2 = areas(skin.pose(rig, ang, off))
            rot_only = max(rot_only, (np.abs(a2) / np.maximum(np.abs(a0), 1e-9)).max())
    g(rfl == 0,
      'REACTION FOLD: no triangle inverts at any of 8 trigger phases (%d flips)'
      % rfl)
    g(rsh >= 0.5,
      'REACTION FOLD: smallest triangle stays at %.0f%% of its rest area '
      '(floor 50%%)' % (100 * rsh))
    g(rgr <= 1.6,
      'REACTION STRETCH: worst triangle grows to %.2fx (cap 1.60x); rotation '
      'alone would be %.2fx, so squash and stretch is spending %.2f of the '
      'budget' % (rgr, rot_only, rgr - rot_only))

    rest_px = int((np.asarray(skin.render(rig, img, [0.0] * len(bones)))[..., 3] > 8).sum())
    lo = hi = rest_px
    for i in range(8):
        t = i * (motion.LOOP_MS / 8.0)
        n = int((np.asarray(skin.render(rig, img, motion.angles(bones, t, table)))[..., 3] > 8).sum())
        lo, hi = min(lo, n), max(hi, n)
    drift = max(abs(lo - rest_px), abs(hi - rest_px)) / float(rest_px)
    g(drift <= 0.01,
      'AREA: opaque pixels stay within %.2f%% of rest across the loop (cap 1%%) '
      '-- catches the renderer dropping or duplicating coverage' % (100 * drift))

    # ------------------------------------------------------------- motion
    foot = v0[:, 1] > y1 - 0.04 * FH
    top = v0[:, 1] < y0 + 0.10 * FH
    fmax = hmax = 0.0
    amax = 0.0
    series = {}
    for i in range(steps * 4):
        t = i * (motion.LOOP_MS / float(steps * 4))
        a = motion.angles(bones, t, table)
        # world angle of a bone is the sum along its PARENT PATH, not the sum
        # of every bone in the file. Once the arms hang off the chest, summing
        # everything counts the spine once per limb and reports an angle no
        # bone actually reaches.
        for bi in range(len(bones)):
            tot, j = 0.0, bi
            while j >= 0:
                tot += a[j]
                j = bones[j]['parent']
            amax = max(amax, abs(tot))
        for b, v in zip(bones, a):
            series.setdefault(b['name'], []).append(v)
        d = skin.pose(rig, a) - v0
        fmax = max(fmax, np.abs(d[foot, 0]).max())
        hmax = max(hmax, np.abs(d[top, 0]).max())

    g(100.0 * fmax / FH <= FOOT_MAX_PCT,
      'feet stay planted (%.2f px, %.3f%% of height, limit %.2f%%)'
      % (fmax, 100.0 * fmax / FH, FOOT_MAX_PCT))
    hp = 100.0 * hmax / FH
    g(HEAD_TRAVEL[0] <= hp <= HEAD_TRAVEL[1],
      'head travels %.1f px = %.2f%% of height (%.1f..%.1f%%)'
      % (hmax, hp, HEAD_TRAVEL[0], HEAD_TRAVEL[1]))
    g(amax <= HEAD_ANGLE_MAX,
      'worst world angle on any bone peaks at %.2f deg (max %.1f)'
      % (amax, HEAD_ANGLE_MAX))

    # props carry their own motion and must not be left out of the rate and
    # unison checks -- a bat on the same period as the arm holding it reads as
    # one welded object
    ptab = dict(table)
    # a prop and the bone it hangs from are ALLOWED to correlate: a bat held in
    # a hand is a pendulum on a moving pivot, and it swinging with the arm is
    # physics, not the "everything moves the same" failure this check exists to
    # catch. Every other pair still has to be independent.
    exempt = set()
    for pr in rig.get('props', []):
        exempt.add(frozenset((pr['name'], bones[pr['parent']]['name'])))
    for pr in rig.get('props', []):
        ptab[pr['name']] = tuple(pr['motion'])
        for i in range(steps * 4):
            t = i * (motion.LOOP_MS / float(steps * 4))
            series.setdefault(pr['name'], []).append(
                motion.angle(tuple(pr['motion']), t))
    table = ptab
    moving = [b['name'] for b in bones if table.get(b['name'], (0,))[0]]
    moving += [pr['name'] for pr in rig.get('props', [])]
    for nm in moving:
        p = table[nm][2]
        g(PERIOD_BAND[0] <= p <= PERIOD_BAND[1],
          '%-6s cycles every %d ms, reads as breathing (%d..%d)'
          % (nm, p, PERIOD_BAND[0], PERIOD_BAND[1]))
    per = [table[n][2] for n in moving]
    g(len(set(per)) == len(per),
      'every moving bone has its own cycle (%s ms)' % ', '.join(map(str, per)))
    for i in range(len(moving)):
        for j in range(i + 1, len(moving)):
            A, B = np.array(series[moving[i]]), np.array(series[moving[j]])
            rr = float(np.corrcoef(A, B)[0, 1])
            if frozenset((moving[i], moving[j])) in exempt:
                print('  ----  %-6s vs %-6s r = %+.3f  (prop on its own bone, '
                      'allowed to follow it)' % (moving[i], moving[j], rr))
                continue
            g(abs(rr) <= CORR_MAX,
              '%-6s vs %-6s not in unison (r = %+.3f)' % (moving[i], moving[j], rr))

    print()
    if g.fails:
        print('%d check(s) failed' % len(g.fails))
        return 1
    print('all checks passed')
    return 0


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    sys.exit(check(sys.argv[1]))
