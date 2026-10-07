# -*- coding: utf-8 -*-
"""
Props: a held or hanging object that is not part of the character's own art.

    python rig/props.py character.png bat.png --pivot 378,552 --length 300 \
        --angle 186 --parent fore_r --z behind

A prop is the one case where a RIGID layer is not only acceptable but better
than putting it in the mesh, and the reason is simple: **nothing in the art
sits behind it**. There is no hole to open, nothing to repair, and no ceiling on
how far it can swing. It is also the only way to get z-order -- a bat behind the
hand, in front of the body -- which one continuous mesh cannot express.

It is parented to a bone, so it inherits everything that bone does and adds its
own swing on top. Parent it to the forearm and it follows the hand exactly.

Two placement rules that are easy to get wrong:

* **The pivot is where the hand holds it**, not the end of the object. Rotation
  moves a point by `distance * sin(angle)`, so the pivot is the one place that
  stays put -- put it under the fingers and the grip never slides.
* **Angle 0 means hanging straight down** from the pivot. 180 puts the object
  above the hand, which is how a bat is actually held upright, with its knob
  just below the fist. A hanging object cannot be rotated to point up: at any
  lean the far end is still below the hand.
"""
from __future__ import print_function
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image


def trim(im):
    a = np.array(im.convert('RGBA'))[..., 3]
    ys, xs = np.where(a > 8)
    if not len(xs):
        raise SystemExit('prop image is empty')
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def bleed(im, r=4):
    """Carry colour past the silhouette so filtering has something to sample."""
    A = np.array(im.convert('RGBA')).astype(int)
    grown = A[..., 3] > 0
    for _ in range(r):
        prev = grown.copy()
        p = np.pad(grown, 1, constant_values=False)
        grown = (p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
        ys, xs = np.where(grown & ~prev)
        for y, x in zip(ys, xs):
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < A.shape[0] and 0 <= nx < A.shape[1] and prev[ny, nx]:
                    A[y, x, :3] = A[ny, nx, :3]
                    break
    A[..., :3] = np.where(grown[..., None], A[..., :3], 0)
    return Image.fromarray(A.astype('uint8'), 'RGBA')


def place(prop_path, canvas, pivot, length, angle=180.0, hold=0.14):
    """Put a prop image on the character's canvas, gripped at `pivot`.

    `hold` is where along the object the hand is, measured from the end that is
    at the top of the source image. The bat art is drawn knob-up, so 0.14 puts
    the hand a little below the knob -- and after the 180 flip that lands the
    knob just under the fist and the barrel rising, which is how one is held.
    """
    src = trim(Image.open(prop_path).convert('RGBA'))
    s = float(length) / src.height
    src = src.resize((max(1, int(round(src.width * s))),
                      max(1, int(round(src.height * s)))), Image.LANCZOS)
    out = Image.new('RGBA', canvas, (0, 0, 0, 0))
    out.alpha_composite(src, (int(pivot[0] - src.width // 2),
                              int(pivot[1] - round(src.height * hold))))
    if angle:
        out = out.rotate(angle, resample=Image.BICUBIC, center=tuple(pivot))
    return out


def attach(rig, name, pivot, parent, z='front', motion=(2.6, 320, 2350, 1.0)):
    bones = [b['name'] for b in rig['bones']]
    if parent not in bones:
        raise SystemExit('no bone called %r -- have %s' % (parent, ', '.join(bones)))
    rig.setdefault('props', []).append({
        'name': name,
        'pivot': [float(pivot[0]), float(pivot[1])],
        'parent': bones.index(parent),
        'z': z,
        'motion': list(motion),
    })
    return rig


def render_prop(prop_img, pivot, M, angle_deg, canvas):
    """Apply the parent bone's world matrix plus the prop's own rotation.

    PIL wants the INVERSE map (destination -> source), so the composed forward
    transform is inverted here rather than built backwards, which is easier to
    get right.
    """
    th = np.radians(angle_deg)
    c, s = np.cos(th), np.sin(th)
    px, py = pivot
    R = np.array([[c, -s, px - c * px + s * py],
                  [s,  c, py - s * px - c * py],
                  [0,  0, 1]])
    F = np.vstack([np.asarray(M), [0, 0, 1]]) @ R
    inv = np.linalg.inv(F)
    return prop_img.transform(canvas, Image.AFFINE,
                              tuple(inv[:2].flatten()), resample=Image.BICUBIC)


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import skin

    ap = argparse.ArgumentParser()
    ap.add_argument('character')
    ap.add_argument('prop')
    ap.add_argument('--name', default=None)
    ap.add_argument('--pivot', required=True, help='x,y on the character canvas')
    ap.add_argument('--length', type=int, required=True)
    ap.add_argument('--angle', type=float, default=180.0)
    ap.add_argument('--hold', type=float, default=0.14)
    ap.add_argument('--parent', required=True)
    ap.add_argument('--z', choices=['front', 'behind'], default='front')
    ap.add_argument('--amp', type=float, default=2.6)
    ap.add_argument('--lag', type=int, default=320)
    ap.add_argument('--period', type=int, default=2350)
    ap.add_argument('--odd', type=float, default=1.0)
    a = ap.parse_args()

    name = a.name or os.path.splitext(os.path.basename(a.prop))[0]
    base = os.path.splitext(a.character)[0]
    rig = skin.load_rig(base + '.rig.json')
    pivot = [float(v) for v in a.pivot.split(',')]
    canvas = tuple(rig['size'])

    img = place(a.prop, canvas, pivot, a.length, a.angle, a.hold)
    p = os.path.join(os.path.dirname(base), '%s_prop_%s.png'
                     % (os.path.basename(base), name))
    bleed(img).save(p)
    attach(rig, name, pivot, a.parent, a.z, (a.amp, a.lag, a.period, a.odd))
    skin.save_rig(rig, base + '.rig.json')
    print('wrote %s' % os.path.basename(p))
    print('attached %r at (%.0f, %.0f), parent %s, drawn %s the figure'
          % (name, pivot[0], pivot[1], a.parent, a.z))
