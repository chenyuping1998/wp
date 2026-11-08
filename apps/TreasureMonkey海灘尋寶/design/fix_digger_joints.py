"""Digger joint art fixes.

1. Repaint the digger torso's neck stump as fur so the head's fur neck continues
into the collar (the stump was a pale mannequin neck with a black top rim,
exposed whenever the head turned).

2. The detector shaft is clipped by its image border; fade its top end so it
disappears behind the handle instead of showing a hard cut corner.

Idempotent: always reads design/source/treasure/digger_body_src.png (the
original export, copied there on first run) and rewrites
static/assets/treasure/digger_body.png.
"""
import os, shutil
import numpy as np
from PIL import Image, ImageFilter

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(APP, 'design/source/treasure/digger_body_src.png')
OUT = os.path.join(APP, 'static/assets/treasure/digger_body.png')
if not os.path.exists(SRC):
    os.makedirs(os.path.dirname(SRC), exist_ok=True)
    shutil.copyfile(OUT, SRC)

im = np.asarray(Image.open(SRC).convert('RGBA')).astype(np.float32)
H, W = im.shape[:2]
rgb = im[..., :3]

# Flood fill the stump from its centre by colour distance.
stump_col = np.array([196, 137, 85], np.float32)
near = (np.linalg.norm(rgb - stump_col, axis=-1) < 48) & (im[..., 3] > 200)
mask = np.zeros((H, W), bool)
stack = [(int(H * .1), int(W * .5))]
while stack:
    y, x = stack.pop()
    if y < 0 or x < 0 or y >= H or x >= W or mask[y, x] or not near[y, x]:
        continue
    mask[y, x] = True
    stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
assert 2000 < mask.sum() < 25000, mask.sum()

# The black rim across the stump's top: dark pixels above the stump in the
# top band, within the stump's columns.
rim = np.zeros_like(mask)
cols = np.where(mask.any(0))[0]
for x in cols:
    top = np.argmax(mask[:, x])
    for y in range(max(0, top - 8), top):
        if rgb[y, x].max() < 90 and im[y, x, 3] > 30:
            rim[y, x] = True
area = mask | rim
lum = rgb @ np.array([.3, .59, .11], np.float32)
ref = lum[mask].mean()
ys = np.arange(H, dtype=np.float32)[:, None].repeat(W, 1)
y0, y1 = ys[mask].min(), ys[mask].max()
g = np.clip((ys - y0) / max(1, y1 - y0), 0, 1)[..., None]
# Matches the head's lower fur at the top; deeper in the collar's shadow.
fur_top = np.array([104, 44, 8], np.float32)
fur_low = np.array([74, 32, 9], np.float32)
base = fur_top * (1 - g) + fur_low * g
shade = np.clip(lum / ref, .7, 1.25)[..., None]
fur = np.clip(base * shade, 0, 255)
fur[rim] = fur_top * .9  # rim becomes fur, not an outline

soft = np.asarray(Image.fromarray((area * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8))).astype(np.float32)[..., None] / 255
soft = np.where(area[..., None], 1, soft * .6)
out = im.copy()
out[..., :3] = rgb * (1 - soft) + fur * soft
out[rim, 3] = np.maximum(im[rim, 3], 250)
Image.fromarray(out.round().astype(np.uint8), 'RGBA').save(OUT)
print('neck stump', int(mask.sum()), 'px, rim', int(rim.sum()), 'px ->', OUT)

TOOL_SRC = os.path.join(APP, 'design/source/treasure/digger_tool_src.png')
TOOL_OUT = os.path.join(APP, 'static/assets/treasure/digger_tool.png')
if not os.path.exists(TOOL_SRC):
    shutil.copyfile(TOOL_OUT, TOOL_SRC)
tool = np.asarray(Image.open(TOOL_SRC).convert('RGBA')).astype(np.float32)
ramp = 22  # px of the 285px export; hidden behind the D handle bar
u = np.clip((np.arange(tool.shape[0], dtype=np.float32) - 4) / ramp, 0, 1)
tool[..., 3] *= (u * u * (3 - 2 * u))[:, None]
Image.fromarray(tool.round().astype(np.uint8), 'RGBA').save(TOOL_OUT)
print('detector shaft top faded over', ramp, 'px ->', TOOL_OUT)
