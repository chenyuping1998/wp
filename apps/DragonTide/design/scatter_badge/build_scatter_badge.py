#!/usr/bin/env python3
"""Dragon Gate (scatter) reads as THE special symbol (Stone 11-11: 「sc 辨識度不足，認不出來是特殊圖騰」).

The gate alone is one more jade-and-gold object among jade-and-gold tiles. This wraps the same
painted gate (src/s.png, src/s_open.png = the gen-order-1109 art as shipped up to front v5) in
the two things a scatter carries in this genre: a radiant gold burst plate behind it and a red
SCATTER ribbon under it (Rye, the game's title face). Colours are sampled from the gate itself
(door red, roof gold, ink). Shut and open keep one shared box, so the swap does not jump.

Writes static/assets/sprites/dragonSymbols/s.png, s_open.png and the S hull in
design/dragon-symbols-manifest.json (check_symbol_idle reads it).
Usage: /Applications/anaconda3/bin/python3 design/scatter_badge/build_scatter_badge.py
"""
import json, math
from pathlib import Path
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
APP = HERE.parents[1]
SYM = APP / 'static/assets/sprites/dragonSymbols'
K = 4                      # supersample
N = 512
INK = (58, 49, 38, 255)
GOLD, GOLD_LIGHT, GOLD_DEEP = (232, 184, 84, 255), (247, 224, 150, 255), (196, 140, 52, 255)
RED, RED_DEEP = (184, 54, 44, 255), (140, 36, 32, 255)
CREAM = (250, 240, 214, 255)


def burst() -> Image.Image:
    im = Image.new('RGBA', (N * K, N * K), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    cx, cy = 256 * K, 236 * K
    # 16-point star plate: ink outline, alternating light / gold rays, a pale disc in the middle
    def star(r_out, r_in, fill, n=16, rot=0.0):
        pts = []
        for i in range(n * 2):
            r = r_out if i % 2 == 0 else r_in
            a = rot + math.pi * i / n - math.pi / 2
            pts.append((cx + r * K * math.cos(a), cy + r * K * math.sin(a)))
        d.polygon(pts, fill=fill)
    star(206, 170, INK)
    star(199, 166, GOLD)
    star(199 * 0.80, 166 * 0.86, GOLD_LIGHT, rot=math.pi / 16)
    d.ellipse([cx - 150 * K, cy - 150 * K, cx + 150 * K, cy + 150 * K], fill=INK)
    d.ellipse([cx - 144 * K, cy - 144 * K, cx + 144 * K, cy + 144 * K], fill=CREAM)
    d.ellipse([cx - 132 * K, cy - 132 * K, cx + 132 * K, cy + 132 * K], outline=GOLD, width=3 * K)
    return im


def ribbon() -> Image.Image:
    im = Image.new('RGBA', (N * K, N * K), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    x0, x1, y0, y1 = 62 * K, 450 * K, 382 * K, 452 * K
    tail = 30 * K
    # folded tails behind, then the band
    for sx, edge in ((x0, -1), (x1, 1)):
        pts = [(sx, y0 + 14 * K), (sx + edge * tail, y0 + 14 * K), (sx + edge * (tail - 14 * K), (y0 + y1) / 2 + 14 * K), (sx + edge * tail, y1 + 14 * K), (sx, y1 + 14 * K)]
        d.polygon(pts, fill=INK)
        inner = [(sx, y0 + 19 * K), (sx + edge * (tail - 9 * K), y0 + 19 * K), (sx + edge * (tail - 21 * K), (y0 + y1) / 2 + 14 * K), (sx + edge * (tail - 9 * K), y1 + 9 * K), (sx, y1 + 9 * K)]
        d.polygon(inner, fill=RED_DEEP)
    d.rounded_rectangle([x0 - 6 * K, y0, x1 + 6 * K, y1], radius=10 * K, fill=INK)
    d.rounded_rectangle([x0 - 1 * K, y0 + 5 * K, x1 + 1 * K, y1 - 5 * K], radius=7 * K, fill=RED)
    d.rounded_rectangle([x0 + 5 * K, y0 + 10 * K, x1 - 5 * K, y1 - 10 * K], radius=4 * K, outline=GOLD, width=2 * K)
    font = ImageFont.truetype(str(APP / 'static/fonts/Rye.ttf'), 46 * K)
    text = 'SCATTER'
    # fit between the gold keylines
    while d.textlength(text, font=font) > (x1 - x0) - 34 * K:
        font = ImageFont.truetype(str(APP / 'static/fonts/Rye.ttf'), font.size - K)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 - 1 * K
    d.text((cx, cy), text, font=font, anchor='mm', fill=GOLD_LIGHT, stroke_width=3 * K, stroke_fill=INK)
    d.text((cx, cy), text, font=font, anchor='mm', fill=GOLD_LIGHT)
    return im


def down(im: Image.Image) -> Image.Image:
    return im.convert('RGBa').resize((N, N), Image.LANCZOS).convert('RGBA')


def main():
    plate, band = down(burst()), down(ribbon())
    hull = None
    for name in ('s.png', 's_open.png'):
        gate = Image.open(HERE / 'src' / name).convert('RGBA')
        # the gate stands on the plate, a little smaller and higher so the ribbon clears the doors' rings
        g = gate.convert('RGBa').resize((int(N * 0.80), int(N * 0.80)), Image.LANCZOS).convert('RGBA')
        out = Image.new('RGBA', (N, N), (0, 0, 0, 0))
        out.alpha_composite(plate)
        out.alpha_composite(g, ((N - g.width) // 2, 18))
        out.alpha_composite(band)
        # the gate sways and swells in its idle act at 1.05 of the cell: 0.96 keeps every painted
        # point inside the cell at the widest frame (check_symbol_idle)
        small = out.convert('RGBa').resize((int(N * 0.96), int(N * 0.96)), Image.LANCZOS).convert('RGBA')
        out = Image.new('RGBA', (N, N), (0, 0, 0, 0)); out.alpha_composite(small, ((N - small.width) // 2, (N - small.height) // 2 + 4))
        out.save(SYM / name)
        if name == 's.png':
            a = np.array(out.getchannel('A')) > 16
            pts = cv2.convexHull(np.argwhere(a)[:, ::-1].astype(np.int32)).reshape(-1, 2)
            hull = [[round(float(x), 1), round(float(y), 1)] for x, y in pts]
        print(name, out.getbbox())
    mf = APP / 'design/dragon-symbols-manifest.json'
    m = json.loads(mf.read_text()); m['S'] = {'hull': hull, 'source': 'dragonSymbols/s.png'}
    mf.write_text(json.dumps(m, indent=1) + '\n')


if __name__ == '__main__':
    main()
