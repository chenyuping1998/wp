# -*- coding: utf-8 -*-
"""
One command: flat character image in, rig + preview + gate out.

    python rig/build.py character.png

Writes next to the image:

    character.rig.json      the mesh, bones and weights
    character_frames.jpg    six frames across the loop, to look at
    character_seam.png      the seam scan's worst frame, holes marked (if any)

and then runs the gate. Options:

    --cols N --rows N       mesh resolution (default 16 x 40)
    --amp K                 scale every amplitude by K (default 1.0)
    --soft K                weight overlap; higher = softer, harder to tear
    --no-plant              let the feet move (they should not)
    --frames N              how many preview frames
"""
from __future__ import print_function
import argparse
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import skin
import motion
import check as gate


def contact_sheet(rig, img, table, n, path, pad=40):
    frames = []
    for i in range(n):
        t = i * (motion.LOOP_MS / float(n))
        frames.append(skin.render(rig, img, motion.angles(rig['bones'], t, table), pad))
    W, H = frames[0].size
    sheet = Image.new('RGB', (W * n, H), (112, 112, 112))
    for i, f in enumerate(frames):
        bg = Image.new('RGBA', f.size, (112, 112, 112, 255))
        sheet.paste(Image.alpha_composite(bg, f).convert('RGB'), (i * W, 0))
    s = min(1.0, 1700.0 / sheet.width)
    sheet.resize((int(sheet.width * s), int(sheet.height * s)), Image.LANCZOS) \
         .save(path, quality=90)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('--cols', type=int, default=16)
    ap.add_argument('--rows', type=int, default=40)
    ap.add_argument('--amp', type=float, default=1.0)
    ap.add_argument('--soft', type=float, default=1.6)
    ap.add_argument('--no-plant', action='store_true')
    ap.add_argument('--no-arms', action='store_true')
    ap.add_argument('--frames', type=int, default=6)
    a = ap.parse_args()

    img = Image.open(a.image).convert('RGBA')
    if (np.asarray(img)[..., 3] > 8).mean() > 0.985:
        raise SystemExit('this image has no transparency -- run rig/inspect_art.py '
                         'on it first, it will tell you what to do')

    rig = skin.build_rig(img, cols=a.cols, rows=a.rows, softness=a.soft,
                         plant=None if a.no_plant else 0.06)
    if not a.no_arms:
        rig, added = skin.add_arm_bones(rig, skin.silhouette(img))
        if added:
            print('arms found and given their own bones: %s' % ', '.join(added))
        else:
            print('no arms clear of the body -- body sway only')
    rig['image'] = os.path.basename(a.image)
    base = os.path.splitext(a.image)[0]
    skin.save_rig(rig, base + '.rig.json')
    print('wrote %s.rig.json   %d bones, %d verts, %d tris'
          % (os.path.basename(base), len(rig['bones']), len(rig['verts']), len(rig['tris'])))
    for b in rig['bones']:
        print('    %-6s (%6.1f, %6.1f)' % (b['name'], b['x'], b['y']))

    table = motion.scale_amplitudes(motion.DEFAULTS, a.amp) if a.amp != 1.0 else motion.DEFAULTS
    p = contact_sheet(rig, img, table, a.frames, base + '_frames.jpg')
    print('wrote %s' % os.path.basename(p))
    print()
    rc = gate.check(base + '.rig.json', table)

    return rc


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    sys.exit(main())
