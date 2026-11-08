"""Make the wave transition's water body tile horizontally (it scrolls behind
the surf as a TilingSprite). Crossfades the right band into the left edge.
Idempotent: reads design/source/treasure/wave_water_v2_src.png (written by
build_treasure_art.py, which runs this after it) and rewrites
static/assets/treasure/wave_water_v2.png.
"""
import os, shutil
import numpy as np
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(APP, 'design/source/treasure/wave_water_v2_src.png')
OUT = os.path.join(APP, 'static/assets/treasure/wave_water_v2.png')
if not os.path.exists(SRC):
    os.makedirs(os.path.dirname(SRC), exist_ok=True)
    shutil.copyfile(OUT, SRC)
img = np.asarray(Image.open(SRC).convert('RGBA')).astype(np.float32)
W = img.shape[1]
band = W // 5
keep = W - band
out = img[:, :keep].copy()
t = (np.arange(band, dtype=np.float32) / band)[None, :, None]
t = t * t * (3 - 2 * t)
out[:, :band] = img[:, :band] * t + img[:, keep:keep + band] * (1 - t)
Image.fromarray(out.round().astype(np.uint8), 'RGBA').save(OUT)
wrap = np.abs(out[:, 0] - out[:, -1]).mean()
print(f'water tile {out.shape[1]}x{out.shape[0]}, wrap diff {wrap:.2f} -> {OUT}')
