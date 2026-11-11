"""Turn L1 (the target) into spray paint like L2-L4.

L1 was rebuilt from a vector (design/source/turf/l1_target.svg, 2026-09-28) and
came out as the only crisp, opaque, flat-grey glyph in a set of spray-paint
stencils: L2-L4 top out at alpha 191 (~75% paint), about 30% of their painted
pixels are faint overspray (alpha < 60), and their paint sits at grey 121-137.
L1 was fully opaque, grey 163, with hard edges — the review-tag checker flags it
as flat-fill art, and on the reels it read as a UI icon among stencils.

Measured targets (from L2-L4):
  paint alpha   191 max              tone        ~130 grey
  edge          soft, ~3 px feather  overspray   halo + speckle dots, ~30% of px
  interior      fine grain + a few dark flecks (L3's spots)

The SHAPE is untouched — same rings, cross and drips — so its silhouette and
the pay-table art stay what was approved. Deterministic (fixed seed).
Reads the original from design/_legacy_assets/l1_before_spray_20260929/.
"""
from __future__ import annotations

import random
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parent.parent
DST = APP / "static/assets/sprites/turfSymbols/l1.png"
BACKUP = APP / "design/_legacy_assets/l1_before_spray_20260929/l1.png"

if not BACKUP.exists():
    BACKUP.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(DST, BACKUP)

src = Image.open(BACKUP).convert("RGBA")
W, H = src.size
shape = src.getchannel("A")
rng = random.Random(1729)

# paint body: feathered edge, capped at the set's 75% opacity
body = shape.filter(ImageFilter.GaussianBlur(2.6)).point(lambda v: int(v * 191 / 255))

# overspray: a wide faint halo...
halo = shape.filter(ImageFilter.GaussianBlur(16)).point(lambda v: int(v * 0.2))
# ...and speckle dots scattered through it, denser near the paint
speck = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(speck)
halo_px = halo.load()
for _ in range(2600):
    x, y = rng.randrange(W), rng.randrange(H)
    near = halo_px[x, y]
    if near < 6 or rng.random() > near / 60:
        continue
    r = rng.choice((1, 1, 1, 2, 2, 3))
    d.ellipse((x - r, y - r, x + r, y + r), fill=rng.randint(60, 150))
alpha = ImageChops.lighter(ImageChops.lighter(body, halo), speck)

# colour: the set's grey, with fine grain and a few dark flecks inside the paint
base = Image.new("RGB", (W, H), (132, 132, 130))
grain = Image.effect_noise((W, H), 22).filter(ImageFilter.GaussianBlur(0.6))
grain_rgb = Image.merge("RGB", [grain] * 3)
colour = ImageChops.soft_light(base, grain_rgb)
flecks = Image.new("L", (W, H), 0)
fd = ImageDraw.Draw(flecks)
shape_px = shape.load()
for _ in range(420):
    x, y = rng.randrange(W), rng.randrange(H)
    if shape_px[x, y] < 200:
        continue
    r = rng.choice((1, 1, 2, 2, 3, 4))
    fd.ellipse((x - r, y - r, x + r, y + r), fill=255)
dark = Image.new("RGB", (W, H), (28, 28, 30))
colour = Image.composite(dark, colour, flecks.filter(ImageFilter.GaussianBlur(0.7)))

out = colour.convert("RGBA")
out.putalpha(alpha)
out.save(DST, optimize=True)
print("wrote", DST.relative_to(APP))
