# -*- coding: utf-8 -*-
"""
Render the animation to an animated GIF so it can actually be judged.

    python rig/preview.py character.png                 # the idle loop
    python rig/preview.py character.png --react 900     # idle, trigger, idle

Numbers pass the gate; only your eye can say whether it reads right. A contact
sheet is not enough for that -- the whole point of the timing work is how it
moves, not where it is at six moments.

    --react MS   fire the reaction at this time and run 2.6 s total
    --fps N      default 20
    --height N   output height in px, default 460
    --bg RRGGBB  backdrop, default 1a1a24
"""
from __future__ import print_function
import argparse
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import skin, motion


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('--react', type=int, default=None)
    ap.add_argument('--fps', type=int, default=20)
    ap.add_argument('--height', type=int, default=460)
    ap.add_argument('--bg', default='1a1a24')
    ap.add_argument('-o', '--out')
    a = ap.parse_args()

    base = os.path.splitext(a.image)[0]
    img = Image.open(a.image).convert('RGBA')
    rig = skin.load_rig(base + '.rig.json')
    box = rig['figure_box']
    bg = tuple(int(a.bg[i:i + 2], 16) for i in (0, 2, 4)) + (255,)

    prop_imgs = {}
    for pr in rig.get('props', []):
        p = '%s_prop_%s.png' % (base, pr['name'])
        if os.path.exists(p):
            prop_imgs[pr['name']] = Image.open(p).convert('RGBA')

    total = 2600 if a.react is not None else motion.LOOP_MS
    n = max(2, int(total / 1000.0 * a.fps))
    # room for the reaction's lift and the prop's swing
    pad = int(max(box[2] - box[0], box[3] - box[1]) * 0.12) + 20

    frames = []
    for i in range(n):
        t = i * (total / float(n))
        ang, off, u = motion.reaction_state(rig['bones'], t, a.react, box)
        sca = motion.reaction_scales(rig['bones'], t, a.react)
        pa, ps = {}, {}
        for pr in rig.get('props', []):
            deg, sc = motion.prop_reaction(pr['name'], pr['motion'], t, a.react)
            pa[pr['name']] = deg
            ps[pr['name']] = sc
        f = skin.render(rig, img, ang, pad=pad, prop_imgs=prop_imgs,
                        prop_angles=pa, offsets=off, prop_scales=ps, scales=sca)
        back = Image.new('RGBA', f.size, bg)
        c = Image.alpha_composite(back, f).convert('RGB')
        s = float(a.height) / c.height
        frames.append(c.resize((max(1, int(c.width * s)), a.height), Image.LANCZOS))

    # Warn if the clip will not close. Each bone runs its own period and those
    # periods do not divide the loop, which is deliberate -- in a live runtime
    # time never wraps and the figure never visibly repeats. But a GIF does
    # wrap, so it hitches unless the periods happen to line up.
    if a.react is None:
        worst, who = 0.0, ''
        for b in rig['bones']:
            spec = motion.DEFAULTS.get(b['name'])
            if not spec or not spec[0]:
                continue
            d = abs(motion.angle(spec, motion.LOOP_MS) - motion.angle(spec, 0))
            if d > worst:
                worst, who = d, b['name']
        if worst > 0.05:
            print('note: this is a %.1f s window, not a loop -- the motion is '
                  'quasi-periodic by design.' % (motion.LOOP_MS / 1000.0))
            print('      worst wrap discontinuity %.2f deg on %s, so the GIF '
                  'will hitch once per cycle.' % (worst, who))
            print('      Live, time never wraps and this never happens.')

    out = a.out or (base + ('_react.gif' if a.react is not None else '_idle.gif'))
    frames[0].save(out, save_all=True, append_images=frames[1:],
                   duration=int(total / n), loop=0, optimize=True)
    print('wrote %s   %dx%d, %d frames, %.1f s, %d KB'
          % (os.path.basename(out), frames[0].width, frames[0].height, n,
             total / 1000.0, os.path.getsize(out) // 1024))


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    sys.exit(main())
