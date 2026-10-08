"""Buy Bonus hover plate: the same sack-paper slab with its green ink band
re-inked in the poster red (0xd24a2c, the bar's hoverPlateLight) and the paper
lifted a touch. The shared ButtonBuyBonus draws this over the plate only while
hovered, so it must differ visibly from buybonus_plate.png (it used to be the
same file, and hover showed nothing).

    /Applications/anaconda3/bin/python3 design/build_buybonus_lit.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
DIR = HERE.parent / 'static/assets/sprites/bananditUi'
RED = np.array([0xD2, 0x4A, 0x2C], dtype=np.float32)

im = np.asarray(Image.open(DIR / 'buybonus_plate.png').convert('RGBA')).astype(np.float32)
rgb, a = im[..., :3], im[..., 3:]
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

# green ink: green clearly above red, not the cream paper (all channels high)
green = (g > r + 18) & (g >= b) & (g < 170)
# keep the ink's own shading: scale red by the pixel's brightness vs the ink's mean
lum = rgb.mean(axis=-1)
ink_mean = lum[green].mean() if green.any() else 1.0
shade = np.clip(lum / ink_mean, 0.55, 1.35)[..., None]
out = rgb.copy()
out[green] = np.clip(RED * shade[green], 0, 255)

# paper: lift toward warm white, leave the black keyline and red shadow alone
paper = (lum > 150) & ~green
out[paper] = np.clip(out[paper] * 1.06 + np.array([6, 3, -4]), 0, 255)

Image.fromarray(np.concatenate([out, a], axis=-1).astype(np.uint8)).save(
    DIR / 'buybonus_plate_lit.png', optimize=True)
print('green px', int(green.sum()), 'paper px', int(paper.sum()))
