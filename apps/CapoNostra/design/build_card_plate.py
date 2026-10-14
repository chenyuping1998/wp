"""capoUiPlates/card_plate.png — the Buy Bonus plate without its cash-stack ornament.

The free-spin entry card nine-slices the painted Buy Bonus plate (the same move
Turf War made on 2026-10-01: the card was pixi Graphics — flat fill, alpha bands,
stacked strokes faking a neon tube, i.e. review's "gradient fills"). Nine-sliced,
the plate's bottom-centre ornament (bank-note stack + deco hairlines,
x 130..510 / y 495..570) would be smeared across the card's foot, so this copy
paints it out (normalised-blur fill of the well's vignette + the well's own grain), leaving
the rim and its stepped inner line untouched.

usage: python3 design/build_card_plate.py
"""

from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parent.parent
PLATES = APP / "static/assets/sprites/capoUiPlates"

import numpy as np
from scipy.ndimage import gaussian_filter

src = Image.open(PLATES / "buybonus_plate.png").convert("RGBA")
a = np.asarray(src).astype(np.float32)
rgb = a[..., :3]
# ornament: x 128..512, y 494..574 (stops above the stepped inner rim line)
hole = np.zeros(a.shape[:2], np.float32)
hole[494:575, 128:513] = 1



def blur(img, r):
    return gaussian_filter(img.astype(np.float32), r)


# low frequency: a harmonic (diffusion) fill of the hole from the blurred well
# around it — top/left/right edges are fixed, the bottom edge is free (the
# stepped inner line and brass rim below must not bleed in)
Y0, Y1, X0, X1 = 494, 575, 128, 513
base = np.stack([blur(rgb[..., c], 4) for c in range(3)], -1)
low = base.copy()
reg = low[Y0 - 1:Y1 + 1, X0 - 1:X1 + 1].copy()
for _ in range(6000):
    reg[-1] = reg[-2]  # Neumann at the foot
    inner = (reg[:-2, 1:-1] + reg[2:, 1:-1] + reg[1:-1, :-2] + reg[1:-1, 2:]) / 4
    reg[1:-1, 1:-1] = inner
low[Y0 - 1:Y1 + 1, X0 - 1:X1 + 1] = reg
# high frequency: the well's own grain, taken from the clean band above
grain_src = rgb[400:481, 128:513]
grain = grain_src - np.stack([blur(grain_src[..., c].copy(), 3) for c in range(3)], -1)
fill = low.copy()
fill[494:575, 128:513] += grain
m = blur(hole.astype(np.float32), 3)[..., None]
m = np.clip(m, 0, 1)
out = rgb * (1 - m) + fill * m
res = np.concatenate([np.clip(out, 0, 255), a[..., 3:]], -1).astype(np.uint8)
Image.fromarray(res, "RGBA").save(PLATES / "card_plate.png", optimize=True)
print("wrote", PLATES / "card_plate.png")
