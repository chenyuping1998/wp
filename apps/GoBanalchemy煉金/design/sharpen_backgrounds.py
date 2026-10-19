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

from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'design/source/backgrounds_1672'
OUT = APP / 'static/assets/sprites/goBanalchemyBackground'
SIZE = (2560, 1440)

for name in ('bg_base', 'bg_feature', 'bg_holdandspin'):
    im = Image.open(SRC / f'{name}.png').convert('RGB').resize(SIZE, Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=24, percent=18, threshold=0))  # local contrast
    im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=85, threshold=2))  # edges
    im.save(OUT / f'{name}.jpg', quality=94, subsampling=0, optimize=True)
    print(name, (OUT / f'{name}.jpg').stat().st_size // 1024, 'KB')
