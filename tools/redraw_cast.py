"""Measuring aids for the 2026-10-16 cast redraws (Pocha / Swing / Strike / Mardi).

The redrawn full-body paintings arrive at their own sizes (1199x1312,
1024x1536 ...). The rig canvas is 560x912, and the first cut squeezed each
painting into it per axis, which narrowed the stall boss by a third. This puts
every painting on the canvas at ONE scale instead:

    python redraw_cast.py norm <app> <cast>      -> design/redraw/v1/<cast>_norm.png
    python redraw_cast.py grid <app> <cast> [x0 y0 x1 y1 zoom] -> scratch grid image

`map_squeezed(app, cast, pts)` converts a point measured on the squeezed canvas
(the first cut's polygons, the face-cel boxes) onto the normalised one.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

CANVAS = (560, 912)
FIT_W, FIT_H, FOOT_Y, CX = 548, 896, 908, 280
APPS = Path(__file__).resolve().parents[1] / 'apps'
SCRATCH = Path('C:/Users/cheny/AppData/Local/Temp/claude/E--stake/c4422431-6873-4128-8f72-b26c42b2efeb/scratchpad')


def app_dir(name):
    return next(APPS.glob(f'{name}*'))


def transform(app, cast):
    im = Image.open(app / 'design/redraw/v1' / f'{cast}_full.png').convert('RGBA')
    a = np.array(im)[..., 3] > 24
    ys, xs = np.nonzero(a)
    bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    s = min(FIT_W / (bx1 - bx0), FIT_H / (by1 - by0))
    ox = CX - (bx1 - bx0) * s / 2
    oy = FOOT_Y - (by1 - by0) * s
    return im, dict(bx0=int(bx0), by0=int(by0), bx1=int(bx1), by1=int(by1), s=float(s), ox=float(ox), oy=float(oy), W=im.width, H=im.height)


def map_squeezed(t, pts):
    out = []
    for x, y in pts:
        rx, ry = x * t['W'] / CANVAS[0], y * t['H'] / CANVAS[1]
        out.append((round((rx - t['bx0']) * t['s'] + t['ox']), round((ry - t['by0']) * t['s'] + t['oy'])))
    return out


def norm(app, cast):
    im, t = transform(app, cast)
    crop = im.crop((t['bx0'], t['by0'], t['bx1'], t['by1']))
    w, h = round(crop.width * t['s']), round(crop.height * t['s'])
    canvas = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(crop.resize((w, h), Image.LANCZOS), (round(t['ox']), round(t['oy'])))
    out = app / 'design/redraw/v1' / f'{cast}_norm.png'
    canvas.save(out)
    json.dump(t, open(app / 'design/redraw/v1' / f'{cast}_norm.json', 'w'), indent=1)
    print(app.name, cast, 'scale', round(t['s'], 4), 'box', (round(t['ox']), round(t['oy']), w, h))


def grid(app, cast, x0=0, y0=0, x1=560, y1=912, zoom=2, polys=None):
    im = Image.open(app / 'design/redraw/v1' / f'{cast}_norm.png').convert('RGBA')
    bg = Image.new('RGBA', CANVAS, (205, 205, 205, 255))
    bg.alpha_composite(im)
    sub = bg.crop((x0, y0, x1, y1)).resize(((x1 - x0) * zoom, (y1 - y0) * zoom), Image.NEAREST)
    d = ImageDraw.Draw(sub)
    font = ImageFont.load_default()
    step = 10
    for gx in range((x0 // step) * step, x1 + 1, step):
        X = (gx - x0) * zoom
        major = gx % 50 == 0
        d.line([(X, 0), (X, sub.height)], fill=(255, 0, 0, 200) if major else (0, 120, 255, 70), width=1)
        if major:
            d.text((X + 2, 2), str(gx), fill=(200, 0, 0), font=font)
    for gy in range((y0 // step) * step, y1 + 1, step):
        Y = (gy - y0) * zoom
        major = gy % 50 == 0
        d.line([(0, Y), (sub.width, Y)], fill=(255, 0, 0, 200) if major else (0, 120, 255, 70), width=1)
        if major:
            d.text((2, Y + 2), str(gy), fill=(200, 0, 0), font=font)
    for poly, col in polys or []:
        d.line([((x - x0) * zoom, (y - y0) * zoom) for x, y in poly + poly[:1]], fill=col, width=2)
    out = SCRATCH / f'{app.name[:6]}_{cast}_grid_{x0}_{y0}.png'
    sub.save(out)
    print(out)


if __name__ == '__main__':
    cmd, app, cast = sys.argv[1], app_dir(sys.argv[2]), sys.argv[3]
    if cmd == 'norm':
        norm(app, cast)
    elif cmd == 'grid':
        grid(app, cast, *map(int, sys.argv[4:9]))
