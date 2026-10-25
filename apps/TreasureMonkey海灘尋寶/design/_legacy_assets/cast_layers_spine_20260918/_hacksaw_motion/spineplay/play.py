# -*- coding: utf-8 -*-
"""play.py — 把一段 Spine 動畫算成 GIF 或接觸表。

    python play.py raccoon.json idle --gif
    python play.py raccoon.json lost_mustache --sheet 8
    python play.py raccoon.json --list
"""
from __future__ import print_function
import argparse, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spine import Skeleton


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('skeleton')
    ap.add_argument('anim', nargs='?')
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--gif', action='store_true')
    ap.add_argument('--sheet', type=int, default=0, help='接觸表，指定要幾格')
    ap.add_argument('--fps', type=int, default=25)
    ap.add_argument('--scale', type=float, default=0.32)
    ap.add_argument('--bg', default='1e1e28')
    ap.add_argument('-o', '--out')
    a = ap.parse_args()

    sk = Skeleton(a.skeleton, quiet=True)
    if a.list or not a.anim:
        for n in sk.animations:
            print('  %-32s %5.2fs' % (n, sk.duration(n)))
        return 0

    dur = sk.duration(a.anim)
    bg = tuple(int(a.bg[i:i+2], 16) for i in (0, 2, 4)) + (255,)
    stem = a.out or a.anim.replace('/', '_')

    if a.sheet:
        n = a.sheet
        ims = [sk.pose(a.anim, dur * i / max(1, n - 1)).render(scale=a.scale, bg=bg)
               for i in range(n)]
        w, h = ims[0].size
        sheet = Image.new('RGBA', (w * n, h), bg)
        for i, im in enumerate(ims):
            sheet.paste(im, (i * w, 0))
        out = stem + '_sheet.png'
        sheet.convert('RGB').save(out)
        print('wrote %s  %dx%d（%d 格，%.2fs）' % (out, sheet.width, sheet.height, n, dur))
        return 0

    n = max(2, int(dur * a.fps))
    frames = [sk.pose(a.anim, dur * i / n).render(scale=a.scale, bg=bg).convert('RGB')
              for i in range(n)]
    out = stem + '.gif'
    frames[0].save(out, save_all=True, append_images=frames[1:],
                   duration=int(1000.0 / a.fps), loop=0, optimize=True)
    print('wrote %s  %dx%d, %d 格, %.2fs, %d KB'
          % (out, frames[0].width, frames[0].height, n, dur,
             os.path.getsize(out) // 1024))
    return 0


if __name__ == '__main__':
    sys.exit(main())
