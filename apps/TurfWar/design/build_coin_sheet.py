#!/usr/bin/env python3
"""Coin spritesheet for the big-win shower — drawn, replacing SD2_Coin.

    /Applications/anaconda3/envs/math-sdk/bin/python design/build_coin_sheet.py

`assets/sprites/coin/SD2_Coin.png` + `.json` was a TexturePacker sheet inherited
from a template: 1889x1152, 2.5MB, twelve 684px frames of a coin spinning, and a
filename that says out loud it belongs to a different game. It is drawn by
`WinCoins.svelte` on every big win and every free-spin outro, so it is not dead
weight that can simply be deleted — it needs replacing.

This draws the same twelve-frame spin from scratch, in the game's own palette
(the frame gold #ffd166 through #ffe9a3, magenta rim), and packs it into the
same JSON layout the runtime already reads:

  * frames named `1.png` .. `12.png`, which is what `animations.coin` lists
  * no rotation and no trimming, so `spriteSourceSize` == `frame` and
    `sourceSize` == the cell — the loader handles trimmed/rotated sheets, but
    not writing them is one less thing to get subtly wrong
  * `meta.image` points at our own PNG

Frames are a foreshortened ellipse: the coin is modelled as a disc turning about
its vertical axis, so frame k has width cos(theta) of the full diameter, with the
edge thickness showing as a darker band when it is near side-on. The 3 and 9
o'clock frames are the thin ones.

Output is 128px cells rather than 684px: at the size coins are drawn (a particle
a few dozen pixels across) the original was carrying about 25x more pixels than
it could ever show. 2.5MB -> ~60KB.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

DESIGN = Path(__file__).resolve().parent
OUT_DIR = DESIGN.parent / "static" / "assets" / "sprites" / "coin"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FRAMES = 12
CELL = 128
SS = 4  # supersample

GOLD_LIGHT = (255, 233, 163)
GOLD = (255, 209, 102)
GOLD_DEEP = (198, 138, 34)
EDGE = (150, 96, 18)
RIM = (255, 46, 136)
INK = (60, 30, 8)


def draw_frame(index: int) -> Image.Image:
    s = CELL * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    theta = (index / FRAMES) * 2 * math.pi
    # Half-width of the ellipse. Never fully zero: a coin exactly side-on would
    # vanish for a frame and the shower would flicker.
    half_w = max(0.08, abs(math.cos(theta)))
    facing = math.cos(theta) >= 0

    r = s * 0.42
    cx = cy = s / 2
    rx = r * half_w
    box = [cx - rx, cy - r, cx + rx, cy + r]

    # Edge thickness: widest when the coin is side-on, so the rim reads as a
    # solid cylinder wall rather than an outline.
    thick = s * 0.035 * (1 - half_w) + s * 0.012

    # back of the rim
    d.ellipse([box[0] - thick, box[1], box[2] + thick, box[3]], fill=EDGE + (255,))
    # face
    d.ellipse(box, fill=(GOLD if facing else GOLD_DEEP) + (255,))
    # inner relief ring
    inset_x, inset_y = rx * 0.26, r * 0.26
    d.ellipse([box[0] + inset_x, box[1] + inset_y, box[2] - inset_x, box[3] - inset_y],
              outline=(GOLD_DEEP if facing else EDGE) + (255,), width=max(2, int(s * 0.012)))
    # specular sweep across the upper-left of the face
    if half_w > 0.25:
        gx, gy = rx * 0.52, r * 0.52
        d.ellipse([cx - gx, cy - r * 0.62, cx - gx * 0.1, cy - r * 0.08],
                  fill=GOLD_LIGHT + (150,))
    # keyline, and a magenta kiss on the rim so it belongs to this game
    d.ellipse(box, outline=INK + (255,), width=max(2, int(s * 0.014)))
    d.arc([box[0] - thick, box[1], box[2] + thick, box[3]], start=200, end=340,
          fill=RIM + (190,), width=max(2, int(s * 0.016)))

    return img.resize((CELL, CELL), Image.LANCZOS)


def main():
    cols = 4
    rows = math.ceil(FRAMES / cols)
    sheet = Image.new("RGBA", (cols * CELL, rows * CELL), (0, 0, 0, 0))
    frames = {}
    for i in range(FRAMES):
        cx, cy = (i % cols) * CELL, (i // cols) * CELL
        sheet.paste(draw_frame(i), (cx, cy))
        frames[f"{i + 1}.png"] = {
            "frame": {"x": cx, "y": cy, "w": CELL, "h": CELL},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": CELL, "h": CELL},
            "sourceSize": {"w": CELL, "h": CELL},
        }

    png = OUT_DIR / "coin.png"
    sheet.save(png)
    data = {
        "frames": frames,
        "animations": {"coin": [f"{i + 1}.png" for i in range(FRAMES)]},
        "meta": {
            "app": "design/build_coin_sheet.py",
            "version": "1.0",
            "image": "coin.png",
            "format": "RGBA8888",
            "size": {"w": cols * CELL, "h": rows * CELL},
            "scale": "1",
        },
    }
    (OUT_DIR / "coin.json").write_text(json.dumps(data, indent="\t"), encoding="utf8")
    print(f"[OK] coin.png {sheet.size}  {png.stat().st_size / 1024:.0f}KB, {FRAMES} frames")


if __name__ == "__main__":
    main()
