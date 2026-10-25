"""The three backgrounds, rebuilt CRISP (2026-10-16, user: 「背景是清晰可見的，不要模糊」).

The paintings exist only at 1672 x 941 (design/source/backgrounds_1672/). They
were Lanczos'd to 1920 x 1080, and the game then stretched them again on the
GPU — cover-fit plus the 8% overscan the slow drift needs, bilinear — so on a
1920 screen the plate was enlarged ~1.24x in total and every edge went soft.

Now the one enlargement happens HERE, once, at 2560 x 1440 (Lanczos), followed
by a two-band sharpen: an unsharp mask for the fine edges (brass rims, glass
highlights, shelf lines) and a wide, gentle one for local contrast so the
painted haze does not flatten the props. On a 1920 or 2560 screen the GPU now
only shrinks the plate, which stays sharp.

JPEG q94: the plates are opaque, and as PNG at this size they were ~7 MB each.
Every mesh/bubble coordinate is resolution-free (bgProps.ts uses a 256 x 144
canvas, BG_POTIONS the 1920 x 1080 space scaled by the sprite's width).

Usage: python design/sharpen_backgrounds.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'design/source/backgrounds_1672'
OUT = APP / 'static/assets/sprites/goBanalchemyBackground'
SIZE = (2560, 1440)

# BRIGHTER (2026-10-24, user: 煉金的背景要調亮). The paintings are night scenes
# and were shipping at a median brightness of 12/255 (base) — most of the room
# read as black behind the board. A gamma lift on the VALUE channel only, so a
# copper flask stays copper and the green fog stays green rather than greying
# out; the gain is a small exposure push before it. The feature plate is
# already lit by its crystals and gets the least.
#   name: (gamma, gain)       median after: base 41, feature 49, vault 52
LIFT = {'bg_base': (0.62, 1.15), 'bg_feature': (0.76, 1.08), 'bg_holdandspin': (0.75, 1.10)}


def lift(im, gamma, gain):
    a = np.asarray(im, float) / 255
    v = a.max(-1)
    k = np.where(v > 1e-4, np.clip(gain * v, 0, 1) ** gamma / np.maximum(v, 1e-4), 0)
    out = np.clip(a * k[..., None], 0, 1)
    # a faint floor: true black reads as a hole in the picture, not as shadow
    out = out * 0.97 + 0.03 * np.array([0.06, 0.07, 0.06])
    return Image.fromarray((out * 255).round().astype(np.uint8))


for name in ('bg_base', 'bg_feature', 'bg_holdandspin'):
    im = lift(Image.open(SRC / f'{name}.png').convert('RGB'), *LIFT[name]).resize(SIZE, Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=24, percent=18, threshold=0))  # local contrast
    im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=85, threshold=2))  # edges
    im.save(OUT / f'{name}.jpg', quality=94, subsampling=0, optimize=True)
    print(name, (OUT / f'{name}.jpg').stat().st_size // 1024, 'KB')
