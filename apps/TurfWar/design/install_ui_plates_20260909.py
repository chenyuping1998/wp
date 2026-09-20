#!/usr/bin/env python3
"""Normalize generated Turf War §8.7 art to exact runtime sizes."""

from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "design/source/turfUi/2026-09-09"
OUT = ROOT / "static/assets/sprites/turfUi"


def rgba(name: str) -> Image.Image:
    return Image.open(SRC / f"{name}_source.png").convert("RGBA")


def trim(im: Image.Image) -> Image.Image:
    bbox = im.getchannel("A").getbbox()
    return im.crop(bbox) if bbox else im


def save_trimmed(name: str, size: tuple[int, int]) -> None:
    trim(rgba(name)).resize(size, Image.Resampling.LANCZOS).save(
        OUT / f"{name}.png", optimize=True
    )


# Image generation returned a preview checker for this edit. Use its RGB but a
# deterministic rounded-square alpha silhouette so no checker ships.
buy = rgba("buybonus_plate").resize((512, 512), Image.Resampling.LANCZOS)
# Remove the baked grey/white preview checker by flood-filling only neutral,
# bright pixels connected to the canvas boundary. This preserves bright metal
# inside the plate while making its irregular outside genuinely transparent.
px = buy.load()
outside = set()
queue = deque([(x, y) for x in range(512) for y in (0, 511)] + [(x, y) for y in range(512) for x in (0, 511)])
while queue:
    x, y = queue.popleft()
    if (x, y) in outside:
        continue
    r, g, b, _ = px[x, y]
    if max(r, g, b) - min(r, g, b) > 16 or min(r, g, b) < 135:
        continue
    outside.add((x, y))
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if 0 <= nx < 512 and 0 <= ny < 512:
            queue.append((nx, ny))
mask = Image.new("L", (512, 512), 255)
mp = mask.load()
for x, y in outside:
    mp[x, y] = 0
buy.putalpha(mask)
buy.save(OUT / "buybonus_plate.png", optimize=True)

for name, size in (
    ("spin_plate", (336, 336)),
    ("button_plate", (300, 300)),
    ("button_plate_active", (300, 300)),
    ("drawer_plate", (300, 300)),
    ("panel_edge", (192, 192)),
    ("modal_frame", (192, 192)),
):
    save_trimmed(name, size)

# 9-slice frame centers must never cover DOM content, regardless of imperfect
# transparency in generated previews.
for name in ("panel_edge", "modal_frame"):
    path = OUT / f"{name}.png"
    frame = Image.open(path).convert("RGBA")
    alpha = frame.getchannel("A")
    ImageDraw.Draw(alpha).rectangle((62, 62, 130, 130), fill=0)
    frame.putalpha(alpha)
    frame.save(path, optimize=True)

# Drawer artwork sits over the reels; retain its bright rim but darken the icon
# well so the separate bone-white glyph clears the required contrast target.
drawer_path = OUT / "drawer_plate.png"
drawer = Image.open(drawer_path).convert("RGBA")
shade = Image.new("RGBA", drawer.size, (0, 0, 0, 0))
ImageDraw.Draw(shade).ellipse((58, 58, 242, 242), fill=(10, 12, 14, 178))
drawer = Image.alpha_composite(drawer, shade)
drawer.save(drawer_path, optimize=True)

# Guarantee the 9-slice middle is an equal cross-section: preserve generated
# end caps and repeat one neutral centre column across the stretchable region.
bar = trim(rgba("bar_strip")).resize((3744, 240), Image.Resampling.LANCZOS)
middle = bar.crop((1871, 0, 1872, 240)).resize((3488, 240))
out = Image.new("RGBA", (3744, 240))
out.alpha_composite(bar.crop((0, 0, 128, 240)), (0, 0))
out.alpha_composite(middle, (128, 0))
out.alpha_composite(bar.crop((3616, 0, 3744, 240)), (3616, 0))
out.save(OUT / "bar_strip.png", optimize=True)
