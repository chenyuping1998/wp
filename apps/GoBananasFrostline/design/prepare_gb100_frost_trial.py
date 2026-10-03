"""Prepare the Frostline art trial at the game's actual symbol and background sizes.

The source art is in source/gb100_frost_trial. GB100 is read only for the low-pay
letter shapes; all output stays in this app. The contact sheet shows 118px cells.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance


ROOT = Path(__file__).resolve().parent
TRIAL = ROOT / "source/gb100_frost_trial"
GB100 = ROOT.parent.parent / "GoBananas100/static/assets/sprites/goBananasSymbolsV3"
names = ["h1", "h2", "h3", "h4", "l1", "l2", "l3", "l4", "l5", "w", "s"]


def cool_metal(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB")).astype(np.float32)
    luminance = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    # Preserve GB100's bevels, fractured-metal marks and strong letter contour,
    # while replacing its khaki/bronze low-pay palette with one quiet ice alloy.
    cold = np.stack(
        [luminance * 0.83, luminance * 0.99 + 2, luminance * 1.15 + 7], axis=-1
    )
    return Image.fromarray(np.uint8(np.clip(cold, 0, 255)), "RGB")


for name in names:
    if name.startswith("l"):
        tile = cool_metal(Image.open(GB100 / f"{name}.png"))
    else:
        tile = Image.open(TRIAL / f"{name}.png").convert("RGB")
    tile = ImageEnhance.Contrast(tile.resize((256, 256), Image.Resampling.LANCZOS)).enhance(1.035)
    tile.save(TRIAL / f"{name}_256.png")

for name in ("bg_base", "bg_feature", "bg_superspin"):
    image = Image.open(TRIAL / f"{name}.png").convert("RGB")
    # Generated plates are 16:9 or within a few pixels of it. Crop from centre,
    # never stretch, so the bold Boat-like line work stays undistorted.
    w, h = image.size
    want = 16 / 9
    if w / h > want:
        crop_w = round(h * want)
        image = image.crop(((w - crop_w) // 2, 0, (w + crop_w) // 2, h))
    else:
        crop_h = round(w / want)
        image = image.crop((0, (h - crop_h) // 2, w, (h + crop_h) // 2))
    image.resize((1920, 1080), Image.Resampling.LANCZOS).save(TRIAL / f"{name}_1920.png")

sheet = Image.new("RGB", (4 * 134, 3 * 145), "#172537")
draw = ImageDraw.Draw(sheet)
for index, name in enumerate(names):
    x, y = index % 4 * 134, index // 4 * 145
    cell = Image.open(TRIAL / f"{name}_256.png").resize((118, 118), Image.Resampling.BOX)
    sheet.paste(cell, (x + 8, y + 4))
    draw.text((x + 8, y + 124), name.upper(), fill="white")
sheet.save(ROOT / "preview_gb100_frost_symbols.png")
print("prepared 11 symbols, 3 backgrounds, 118px contact sheet")
