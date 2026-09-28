"""Remove the transparency checkerboard baked into h2.png's comet tail.

The generated art came with the editor's transparency grid painted INTO the
soft teal glow between the tail's streaks: two teal tones alternating in ~18px
square cells (a 36px period, measured off the pixels). In a still it reads as a
texture; once the win mesh moves the tail it reads as what it is.

A box average exactly one period wide covers one light and one dark cell in
each direction, so it cancels the pattern to the even teal the glow was meant
to be. It is applied only where the grid is: teal pixels (green over red — the
rock is brown) inside the tail's outline, and only to the glow tones, fading
out above luma 130 so the bright streaks keep their edges.

Reads design/source/h2_original.png (the untouched delivery), writes
static/assets/sprites/goBananasSymbolsV3/h2.png. Re-run the mesh layers after:
    node design/make_symbol_layers.mjs E:/stake/tools/gen
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'design/source/h2_original.png'
OUT = APP / 'static/assets/sprites/goBananasSymbolsV3/h2.png'

PERIOD = 36
# the tail's outline in the 1024 art: meshWin/h2Comet.ts's tail polygon (x4),
# widened on the left for the upper streak that runs over the rock's shoulder
TAIL = [(240, 330), (632, 160), (928, 64), (952, 280), (792, 632), (600, 856), (512, 600), (360, 420), (240, 420)]

im = Image.open(SRC).convert('RGBA')
a = np.asarray(im, float)
rgb, alpha = a[..., :3], a[..., 3:4] / 255

# alpha-weighted box average, one period across
def box(arr):
    # separable running-sum average over PERIOD px, edges clamped
    def along(x, axis):
        pad = [(0, 0)] * x.ndim
        pad[axis] = (PERIOD // 2, PERIOD - PERIOD // 2)
        c = np.cumsum(np.pad(x, pad, mode='edge'), axis=axis)
        c = np.insert(c, 0, 0, axis=axis)
        n = x.shape[axis]
        hi = np.take(c, np.arange(PERIOD, PERIOD + n), axis=axis)
        lo = np.take(c, np.arange(0, n), axis=axis)
        return (hi - lo) / PERIOD
    return along(along(arr, 0), 1)

wsum = box(alpha)[..., 0:1]
avg = box(rgb * alpha) / np.maximum(wsum, 1e-6)

mask = Image.new('L', im.size, 0)
ImageDraw.Draw(mask).polygon(TAIL, fill=255)
inside = np.asarray(mask.filter(ImageFilter.GaussianBlur(6)), float)[..., None] / 255

luma = (0.3 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2])[..., None]
teal = np.clip(((rgb[..., 1] - rgb[..., 0])[..., None] - 8) / 20, 0, 1)
glow = np.clip((150 - luma) / 20, 0, 1)
w = inside * teal * glow * (alpha > 0.05)

# THE EDGES TOO. The glow's alpha was cut along the same grid, so its
# outline steps in 18px blocks even with the colour evened out. The same
# one-period average turns those steps into soft ramps — spread one period out
# from the glow, so the ramp reaches into the transparent side as well, and
# never onto a bright streak (they keep their own alpha).
spread = np.clip(box(w) * 3, 0, 1) * inside * (1 - np.clip((luma - 150) / 20, 0, 1))
a_new = alpha * (1 - spread) + box(alpha) * spread
# pixels that gain alpha had no colour of their own: give them the glow's
out = rgb * (1 - w) + avg * w
out = np.where((alpha < 0.05) & (spread > 0), avg, out)
res = np.concatenate([out, a_new * 255], -1).clip(0, 255).astype(np.uint8)
Image.fromarray(res, 'RGBA').save(OUT)
print(f'h2.png: checker smoothed on {int((w[..., 0] > 0.5).sum())} px')
