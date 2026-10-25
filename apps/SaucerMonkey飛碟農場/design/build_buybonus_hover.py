"""Buy Bonus hover plate: the order board lit, not a copy of itself.

2026-10-06. The print skin draws `buyBonusGlyph` over the plate while hovered.
It pointed at buybonus_plate.png itself, so hover laid the same picture over the
same picture and nothing changed. This builds the lit board from the plate:
the paper face warmed toward lantern light and a hard ember-orange rim round
the silhouette (no soft glow; ART_BRIEF §0 forbids bloom).

  /Applications/anaconda3/bin/python3 design/build_buybonus_hover.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / 'static/assets/sprites/sushiUi/buybonus_plate.png'
OUT = HERE.parent / 'static/assets/sprites/sushiUi/buybonus_plate_lit.png'

EMBER = np.array([0xB8, 0x7B, 0x60], float)
WARM = np.array([1.0, 0.95, 0.89])  # lantern light on the paper
RIM_PX = 7

im = Image.open(SRC).convert('RGBA')
a = np.asarray(im).astype(float)
rgb, alpha = a[..., :3], a[..., 3]

# Warm only the light paper; leave the ink lines and the rope as they are.
lum = rgb.mean(-1, keepdims=True) / 255
paper = np.clip((lum - 0.55) / 0.3, 0, 1)
lit = rgb * (1 - paper) + np.minimum(255, rgb * WARM * 1.04) * paper

# Hard rim: the silhouette grown by RIM_PX, filled ember, behind the board.
mask = Image.fromarray((alpha > 128).astype(np.uint8) * 255)
grown = np.asarray(mask.filter(ImageFilter.MaxFilter(RIM_PX * 2 + 1))).astype(float) / 255
rim = np.clip(grown - alpha / 255, 0, 1)

out = np.zeros_like(a)
out[..., :3] = lit * (alpha[..., None] / 255) + EMBER * rim[..., None]
out[..., 3] = np.clip(alpha + rim * 255, 0, 255)
# un-premultiply
nz = out[..., 3] > 0
out[..., :3][nz] = out[..., :3][nz] / (out[..., 3][nz][:, None] / 255)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT)
print('wrote', OUT)
