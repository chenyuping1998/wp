"""The win spray's particles: crystal clusters instead of bananas
(2026-10-23, user: 「把煉金得分時噴香蕉也改掉，看噴甚麼比較適合那款的風格」).

An alchemist's win throws out what the lab makes: the H2 symbol's amethyst
cluster, broken off its copper stand — every column is cut along the stand's
rim, found from the run of copper below the crystals, so the cluster keeps its
own broken base rather than a straight crop. Most frames stay amethyst; some
are turned to the lantern's green and the flasks' amber (H1, H4), the game's
other two reagent colours, so the spray reads as transmuted stones rather
than one gem copied.

Ten frames, ten views (turned and tipped), in the banana sheet's format and
256px cells (design/pack_banana_particles.mjs), so the shared fountain config
draws them at the bananas' size.

    E:/stake/math-sdk/env/Scripts/python.exe -I design/pack_crystal_particles.py
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'static/assets/sprites/goBanalchemyMesh/h2_subject.png'
OUT = APP / 'static/assets/sprites/goBanalchemyWinCrystals'
CELL = 256
SPAN = 226
# (turn deg, tip deg, hue): hue is a rotation in degrees from the amethyst
VIEWS = [(0, 0, 0), (-28, 30, 0), (35, 0, 0), (160, 40, 0), (-70, 20, 0),
         (12, 0, -150), (-40, 35, -150), (80, 25, 125), (190, 10, 125), (-15, 50, 0)]


def broken_off(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32) / 255
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    copper = (al > 0.3) & (r > b + 0.08) & (r >= g)
    h, w = copper.shape
    # the rim: per column, the first row (from the top, below the crystals'
    # middle) that starts a run of 6 copper pixels
    rim = np.full(w, h, np.float32)
    for x in range(w):
        col = copper[:, x]
        for y in range(h // 2, h - 6):
            if col[y:y + 6].all():
                rim[x] = y
                break
    cols = np.nonzero(rim < h)[0]
    # the stand's rim is a smooth curve: fill the gaps and smooth it
    rim = np.interp(np.arange(w), cols, rim[cols])
    rim = np.convolve(np.pad(rim, 12, mode='edge'), np.ones(25) / 25, mode='valid')
    yy = np.arange(h)[:, None]
    keep = np.clip((rim[None, :] - 3 - yy) / 4, 0, 1)
    out = np.asarray(im.convert('RGBA')).copy()
    out[..., 3] = (out[..., 3] * keep).astype(np.uint8)
    cut = Image.fromarray(out)
    return cut.crop(cut.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())


def hue_turn(im, deg):
    if not deg:
        return im
    hsv = np.asarray(im.convert('RGB').convert('HSV')).astype(np.int32)
    hsv[..., 0] = (hsv[..., 0] + round(deg / 360 * 256)) % 256
    rgb = Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')
    rgb.putalpha(im.getchannel('A'))
    return rgb


def view(cluster, turn, tip, hue):
    s = hue_turn(cluster, hue).rotate(turn, resample=Image.BICUBIC, expand=True)
    s = s.resize((s.width, max(1, round(s.height * math.cos(math.radians(tip))))), Image.LANCZOS)
    s = s.crop(s.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
    k = SPAN / max(s.size)
    s = s.resize((max(1, round(s.width * k)), max(1, round(s.height * k))), Image.LANCZOS)
    cell = Image.new('RGBA', (CELL, CELL))
    cell.alpha_composite(s, ((CELL - s.width) // 2, (CELL - s.height) // 2))
    return cell


def main():
    cluster = broken_off(Image.open(SRC))
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.new('RGBA', (CELL * 5, CELL * 2))
    frames, files = {}, []
    for i, (turn, tip, hue) in enumerate(VIEWS):
        x, y = (i % 5) * CELL, (i // 5) * CELL
        sheet.alpha_composite(view(cluster, turn, tip, hue), (x, y))
        name = f'crystal_{i + 1:02d}.png'
        files.append(name)
        frames[name] = {
            'frame': {'x': x, 'y': y, 'w': CELL, 'h': CELL}, 'rotated': False, 'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': CELL, 'h': CELL}, 'sourceSize': {'w': CELL, 'h': CELL},
        }
    sheet.save(OUT / 'crystals.png', optimize=True)
    meta = {'app': 'design/pack_crystal_particles.py', 'version': '1.0', 'image': 'crystals.png', 'format': 'RGBA8888',
            'size': {'w': sheet.width, 'h': sheet.height}, 'scale': '1'}
    (OUT / 'crystals.json').write_text(json.dumps({'frames': frames, 'animations': {'crystal': files}, 'meta': meta}, indent='\t'))
    print(f'packed {len(files)} frames -> {OUT.relative_to(APP)} ({sheet.width}x{sheet.height})')


if __name__ == '__main__':
    main()
