"""The Pin's back plate without the circle (2026-10-18, user).

Every non-royal, non-H1/H2/S symbol stood on sushiSymbols/l1.png — the royals'
card, ink ring and teal keyline included. The Pin (P) now gets the same card
with both rings painted out in its own paper cream, so the pin and its value
sit on plain paper. Writes sushiSymbols/p_back.png.

    python design/build_pin_plate.py
"""
import os

import numpy as np
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(APP, 'static/assets/sprites/sushiSymbols/l1.png')
a = np.array(Image.open(src).convert('RGBA'))
h, w = a.shape[:2]
yy, xx = np.mgrid[0:h, 0:w]
# the ink ring's outer edge is r 176 (x 80 on the 512 canvas); the paper runs
# out to the red rule at r 192 — 180 clears the ring's antialiasing
inside = (xx - w / 2 + 0.5) ** 2 + (yy - h / 2 + 0.5) ** 2 < 180 ** 2
a[inside] = (255, 244, 222, 255)
out = os.path.join(APP, 'static/assets/sprites/sushiSymbols/p_back.png')
Image.fromarray(a).save(out)
print(out)
