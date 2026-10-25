"""The win spray's particles: black throwing stars instead of bananas
(2026-10-23, user: 「得分時數字後面噴香蕉改成噴手裏劍，類似獎圖的形狀，但顏色
要是黑色，大小跟原本香蕉差不多」).

The shape is the H2 symbol's own star (goBananinjaMesh/h2_subject.png),
blackened: the green lacquer and the jewel go to near-black, the steel edges
keep a gunmetal grey so the silhouette still reads against the dark overlay a
big win draws behind it. Ten frames, as the bananas had: the emitter gives
each particle one random frame, so these are ten views of a star tumbling in
the air (turned, and tipped so it foreshortens), not an animation.

Same sheet format and frame size as design/pack_banana_particles.mjs (256px
cells, 5 x 2), so the particle config's scale gives the same on-screen size;
the star spans ~236px of its cell — a banana spanned ~255 but filled more of it, so the star is drawn longer to carry the same weight.

    E:/stake/math-sdk/env/Scripts/python.exe -I design/pack_shuriken_particles.py
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'static/assets/sprites/goBananinjaMesh/h2_subject.png'
OUT = APP / 'static/assets/sprites/goBananinjaWinShuriken'
CELL = 256
SPAN = 236
# (turn in degrees, tip in degrees): tip foreshortens the star along one axis
VIEWS = [(0, 0), (22, 38), (41, 0), (63, 56), (12, 60), (35, 24), (78, 12), (55, 58), (5, 48), (70, 32)]


def blacken(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32) / 255
    rgb, alpha = a[..., :3], a[..., 3:]
    hi, lo = rgb.max(-1, keepdims=True), rgb.min(-1, keepdims=True)
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    sat = np.where(hi > 1e-4, (hi - lo) / np.maximum(hi, 1e-4), 0)[..., 0]
    # steel = light and unsaturated: the blade edges, the hub ring, the studs
    steel = np.clip((1 - sat * 2.2), 0, 1) * np.clip((lum - 0.25) / 0.5, 0, 1)
    lacquer = 0.03 + 0.16 * lum ** 1.4           # the green, gone to black lacquer
    metal = 0.12 + 0.62 * lum ** 1.2             # gunmetal, keeping its scratches
    v = lacquer * (1 - steel) + metal * steel
    tint = np.array([0.96, 1.0, 1.06], np.float32)  # a cool cast, like blued steel
    out = np.clip(v[..., None] * tint, 0, 1)
    return Image.fromarray((np.concatenate([out, alpha], -1) * 255).astype(np.uint8), 'RGBA')


def view(star, turn, tip):
    s = star.rotate(turn, resample=Image.BICUBIC, expand=True)
    w, h = s.size
    s = s.resize((w, max(1, round(h * math.cos(math.radians(tip))))), Image.LANCZOS)
    box = s.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    s = s.crop(box)
    k = SPAN / max(s.size) if tip < 40 else SPAN * 0.94 / max(s.size)
    s = s.resize((max(1, round(s.width * k)), max(1, round(s.height * k))), Image.LANCZOS)
    cell = Image.new('RGBA', (CELL, CELL))
    cell.alpha_composite(s, ((CELL - s.width) // 2, (CELL - s.height) // 2))
    return cell


def main():
    star = blacken(Image.open(SRC))
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.new('RGBA', (CELL * 5, CELL * 2))
    frames, files = {}, []
    for i, (turn, tip) in enumerate(VIEWS):
        x, y = (i % 5) * CELL, (i // 5) * CELL
        sheet.alpha_composite(view(star, turn, tip), (x, y))
        name = f'shuriken_{i + 1:02d}.png'
        files.append(name)
        frames[name] = {
            'frame': {'x': x, 'y': y, 'w': CELL, 'h': CELL}, 'rotated': False, 'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': CELL, 'h': CELL}, 'sourceSize': {'w': CELL, 'h': CELL},
        }
    sheet.save(OUT / 'shuriken.png', optimize=True)
    meta = {'app': 'design/pack_shuriken_particles.py', 'version': '1.0', 'image': 'shuriken.png', 'format': 'RGBA8888',
            'size': {'w': sheet.width, 'h': sheet.height}, 'scale': '1'}
    (OUT / 'shuriken.json').write_text(json.dumps({'frames': frames, 'animations': {'shuriken': files}, 'meta': meta}, indent='\t'))
    print(f'packed {len(files)} frames -> {OUT.relative_to(APP)} ({sheet.width}x{sheet.height})')


if __name__ == '__main__':
    main()
