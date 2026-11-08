"""Placeholder art for the Petrify Gaze stone (symbol ST).

Codex replaces static/assets/sprites/medusaSymbols/st.png with the final art
(brief: proposals/MedusaGaze梅杜莎凝視/MEDUSA_新機制_Codex需求單.md). Until then
this draws a carved granite block on the same 512x512 canvas as the other
symbols, so the board reads correctly.

Usage:  E:\\stake\\math-sdk\\env\\Scripts\\python.exe design\\generate_stone_placeholder.py
"""

import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "static", "assets", "sprites", "medusaSymbols", "st.png")
SIZE = 512


def main():
    rng = random.Random(20261106)
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    # soft drop shadow
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((58, 74, 466, 482), 70, fill=(10, 20, 24, 150))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)))

    # block body with a vertical light-to-dark gradient
    body = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    grad = Image.new("RGBA", (SIZE, SIZE))
    gd = ImageDraw.Draw(grad)
    for y in range(SIZE):
        t = y / SIZE
        c = int(196 - 80 * t)
        gd.line([(0, y), (SIZE, y)], fill=(c, c + 4, c + 2, 255))
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle((50, 56, 462, 468), 66, fill=255)
    body.paste(grad, (0, 0), mask)

    # granite speckle
    d = ImageDraw.Draw(body)
    for _ in range(2600):
        x, y = rng.randint(56, 456), rng.randint(62, 462)
        if mask.getpixel((x, y)):
            v = rng.randint(70, 230)
            r = rng.choice((1, 1, 2))
            d.ellipse((x - r, y - r, x + r, y + r), fill=(v, v, v - 4, 120))

    # carved coiled snake relief (dark groove + light lip)
    cx, cy = 256, 262
    pts = []
    for i in range(260):
        a = i / 260 * math.pi * 3.4
        rad = 150 - i * 0.48
        pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad))
    d.line(pts, fill=(70, 76, 74, 255), width=30, joint="curve")
    d.line([(x - 4, y - 5) for x, y in pts], fill=(222, 226, 220, 150), width=8, joint="curve")
    hx, hy = pts[-1]
    d.ellipse((hx - 30, hy - 24, hx + 30, hy + 24), fill=(70, 76, 74, 255))
    d.ellipse((hx - 10, hy - 8, hx - 2, hy), fill=(30, 34, 34, 255))

    # cracks
    for _ in range(4):
        x, y = rng.randint(90, 420), rng.choice((62, 462))
        seg = [(x, y)]
        for _ in range(6):
            x += rng.randint(-28, 28)
            y += rng.randint(18, 40) * (1 if y < 256 else -1)
            seg.append((x, y))
        d.line(seg, fill=(46, 50, 50, 230), width=4)

    # rim highlight
    d.rounded_rectangle((50, 56, 462, 468), 66, outline=(236, 240, 232, 200), width=6)
    d.rounded_rectangle((60, 66, 452, 458), 58, outline=(60, 64, 62, 140), width=3)

    # keep cracks and speckle inside the block
    clipped = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    clipped.paste(body, (0, 0), mask)
    img.alpha_composite(clipped)
    img.save(OUT)
    print("wrote", os.path.normpath(OUT))


if __name__ == "__main__":
    main()
