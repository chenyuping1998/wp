"""The prize cow's startled face (2026-10-23, user: when the beam takes her she
must look surprised). Painted over her own symbol (sushiSymbols/p.png, the
deadpan one) in its print style — flat cream, hard ink, no gradients:

  eyes     the drooping lids gone: two wide cream eyes, pin-prick pupils
           rolled up toward the saucer, brows jumped up off them
  mouth    the frown painted out with her muzzle pink, a small round 'O'

Same canvas and registration as p.png, so it drops onto the same mesh
(BanditCollect swaps it in on the double take).

    python design/build_cow_shock.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'static/assets/sprites/sushiSymbols/p.png'
OUT = APP / 'static/assets/sprites/sushiSymbols/p_shock.png'
S = 4  # supersampling
INK = (14, 22, 48, 255)
CREAM = (250, 242, 214, 255)

# on the 512 canvas, read off a 3x grid of p.png
EYES = [  # centre, radii (her right eye is further round her head, so narrower)
    ((262, 170), (27, 31)),
    ((366, 158), (19, 26)),
]
PUPIL_UP = 0.42   # how far up each eye the pupil sits (of its height)
MOUTH = (380, 270)
FROWN = [(332, 254), (414, 250), (416, 279), (336, 286)]  # painted out


def main():
    base = Image.open(SRC).convert('RGBA')
    W, H = base.size
    arr = np.asarray(base, float)
    # her muzzle's pink, from its lit middle (not the halftone shadow)
    patch = arr[228:250, 330:400, :3].reshape(-1, 3)
    patch = patch[(patch[:, 0] > 200) & (patch[:, 1] > 120)]
    pink = tuple(int(v) for v in np.median(patch, 0)) + (255,)

    layer = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
    g = ImageDraw.Draw(layer)
    sc = lambda pts: [(x * S, y * S) for x, y in pts]

    # the frown painted out: a soft-edged patch of muzzle pink
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon(FROWN, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    pinked = Image.new('RGBA', (W, H), pink)
    base = Image.composite(pinked, base, Image.fromarray((np.asarray(mask) * (arr[..., 3] > 200)).astype(np.uint8)))

    # the 'O': ink ring, dark mouth, a lick of tongue at the bottom
    mx, my = MOUTH
    g.ellipse(sc([(mx - 17, my - 15), (mx + 17, my + 15)]), fill=INK)
    g.ellipse(sc([(mx - 12, my - 10), (mx + 12, my + 10)]), fill=(92, 22, 34, 255))
    g.chord(sc([(mx - 10, my - 2), (mx + 10, my + 14)]), 200, 340, fill=(214, 96, 104, 255))

    for (cx, cy), (rx, ry) in EYES:
        # the brow, jumped up: a heavy ink arc well above the eye
        # (cream under the ink, so it still shows on her dark patch)
        box = sc([(cx - rx - 2, cy - ry - 30), (cx + rx + 2, cy - ry + 4)])
        g.arc(box, 210, 330, fill=CREAM, width=12 * S)
        g.arc(box, 210, 330, fill=INK, width=6 * S)
        # the eye: ink ring, cream white, a pin-prick pupil rolled up
        g.ellipse(sc([(cx - rx - 4, cy - ry - 4), (cx + rx + 4, cy + ry + 4)]), fill=INK)
        g.ellipse(sc([(cx - rx, cy - ry), (cx + rx, cy + ry)]), fill=CREAM)
        px, py = cx + rx * 0.12, cy - ry * PUPIL_UP
        g.ellipse(sc([(px - 6, py - 7), (px + 6, py + 7)]), fill=INK)
        g.ellipse(sc([(px - 4.5, py - 5), (px - 1.5, py - 2)]), fill=(255, 255, 255, 255))

    layer = layer.resize((W, H), Image.LANCZOS)
    out = base.copy()
    out.alpha_composite(layer)
    out.save(OUT)
    print('wrote', OUT.relative_to(APP))


if __name__ == '__main__':
    main()
