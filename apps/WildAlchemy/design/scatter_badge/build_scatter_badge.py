#!/usr/bin/env python3
"""The Tower (scatter) reads as THE special symbol (Stone 2026-11-11: 「SC 辨識度要高一點，像龍潮那樣」;
house rule C6).

Every other symbol here is the same full-bleed square card, so a square Tower card was one more card
among them. Same recipe as Dragon Tide's badge (wp-dragon/apps/DragonTide/design/scatter_badge): the
painted tower (src/s.png, the accepted symbols-final card as shipped up to front v2) is cut into a round
window on a radiant star plate, with a red SCATTER ribbon under it. The silhouette is no longer square.

Gold leaf belongs to the WILD only (ART_REQUEST §0.1), so the plate is ochre and verdigris, and the
badge stays darker than the WILD and brighter than the portraits (design/check_symbol_weight.py).
Ribbon face: Cinzel Black (OFL, src/Cinzel.ttf), the nearest to the serif on the WILD tag.

Writes static/assets/sprites/wildAlchemy/symbols/s.png (RGBA 512).
Usage: /Applications/anaconda3/bin/python3 design/scatter_badge/build_scatter_badge.py
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
APP = HERE.parents[1]
OUT = APP / 'static/assets/sprites/wildAlchemy/symbols/s.png'
K = 4
N = 512
# sampled from the cards (ink, parchment, the seal red); ochre/verdigris from ART_REQUEST's palette
INK = (52, 30, 12, 255)
CREAM = (246, 232, 210, 255)
OCHRE, OCHRE_LIGHT, OCHRE_DEEP = (205, 150, 62, 255), (232, 196, 128, 255), (163, 110, 40, 255)
VERDIGRIS, VERDIGRIS_DEEP = (82, 158, 124, 255), (47, 107, 85, 255)
RED, RED_DEEP = (176, 52, 40, 255), (126, 32, 26, 255)
CX, CY = 256, 236
WINDOW_R = 160


def star(d, r_out, r_in, fill, n=16, rot=0.0):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + math.pi * i / n - math.pi / 2
        pts.append(((CX + r * math.cos(a)) * K, (CY + r * math.sin(a)) * K))
    d.polygon(pts, fill=fill)


def circle(d, r, **kw):
    d.ellipse([(CX - r) * K, (CY - r) * K, (CX + r) * K, (CY + r) * K], **kw)


def plate() -> Image.Image:
    im = Image.new('RGBA', (N * K, N * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    star(d, 234, 194, INK)
    star(d, 227, 189, OCHRE)
    star(d, 227 * 0.82, 189 * 0.9, OCHRE_LIGHT, rot=math.pi / 16)
    circle(d, WINDOW_R + 22, fill=INK)
    circle(d, WINDOW_R + 17, fill=VERDIGRIS)
    circle(d, WINDOW_R + 9, fill=VERDIGRIS_DEEP)
    circle(d, WINDOW_R + 6, fill=INK)
    return im


def window() -> Image.Image:
    card = Image.open(HERE / 'src/s.png').convert('RGBA')
    # the card's own cream frame is ~5% of its width: keep only the painting
    w = card.width
    inner = card.crop((int(w * 0.06), int(w * 0.04), int(w * 0.94), int(w * 0.92)))
    d = WINDOW_R * 2
    pic = inner.resize((d * K, d * K), Image.LANCZOS)
    mask = Image.new('L', (d * K, d * K), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, d * K - 1, d * K - 1], fill=255)
    out = Image.new('RGBA', (N * K, N * K), (0, 0, 0, 0))
    out.paste(pic, ((CX - WINDOW_R) * K, (CY - WINDOW_R) * K), mask)
    return out


def ribbon() -> Image.Image:
    im = Image.new('RGBA', (N * K, N * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0, x1, y0, y1 = 64 * K, 448 * K, 394 * K, 464 * K
    tail = 30 * K
    for sx, edge in ((x0, -1), (x1, 1)):
        pts = [(sx, y0 + 14 * K), (sx + edge * tail, y0 + 14 * K), (sx + edge * (tail - 14 * K), (y0 + y1) / 2 + 14 * K),
               (sx + edge * tail, y1 + 14 * K), (sx, y1 + 14 * K)]
        d.polygon(pts, fill=INK)
        inner = [(sx, y0 + 19 * K), (sx + edge * (tail - 9 * K), y0 + 19 * K), (sx + edge * (tail - 21 * K), (y0 + y1) / 2 + 14 * K),
                 (sx + edge * (tail - 9 * K), y1 + 9 * K), (sx, y1 + 9 * K)]
        d.polygon(inner, fill=RED_DEEP)
    d.rounded_rectangle([x0 - 6 * K, y0, x1 + 6 * K, y1], radius=10 * K, fill=INK)
    d.rounded_rectangle([x0 - 1 * K, y0 + 5 * K, x1 + 1 * K, y1 - 5 * K], radius=7 * K, fill=RED)
    d.rounded_rectangle([x0 + 5 * K, y0 + 10 * K, x1 - 5 * K, y1 - 10 * K], radius=4 * K, outline=OCHRE_LIGHT, width=2 * K)
    font = ImageFont.truetype(str(HERE / 'src/Cinzel.ttf'), 44 * K)
    try:
        font.set_variation_by_axes([900])
    except Exception:
        pass
    text = 'SCATTER'
    while d.textlength(text, font=font) > (x1 - x0) - 40 * K:
        font = font.font_variant(size=font.size - K)
        try:
            font.set_variation_by_axes([900])
        except Exception:
            pass
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + 1 * K
    d.text((cx, cy), text, font=font, anchor='mm', fill=CREAM, stroke_width=3 * K, stroke_fill=INK)
    d.text((cx, cy), text, font=font, anchor='mm', fill=CREAM)
    return im


def main():
    big = plate()
    big.alpha_composite(window())
    big.alpha_composite(ribbon())
    out = big.convert('RGBa').resize((N, N), Image.LANCZOS).convert('RGBA')
    out.save(OUT, optimize=True)
    print(OUT.relative_to(APP), out.size, out.getbbox())


if __name__ == '__main__':
    main()
