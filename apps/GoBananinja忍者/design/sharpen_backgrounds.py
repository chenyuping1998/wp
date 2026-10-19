"""The three backgrounds, rebuilt CRISP (2026-10-16, review: low quality asset).

GoBanalchemy's fix, ported. The paintings exist only at 1672 x 941 (kept in
design/source/backgrounds_1672/). The game stretches the plate to cover the
canvas plus the 8% overscan the ken-burns drift needs (Background.svelte), so
on a 1920 screen it was enlarged ~1.24x and on a retina screen ~2.5x, bilinear
— every edge went soft.

Now the one enlargement happens HERE, once, at 2560 x 1440 (Lanczos), with a
two-band sharpen: a wide gentle unsharp for local contrast and a fine one for
the edges (roof lines, lanterns, bamboo). The GPU then mostly shrinks the
plate, and crispTextures.ts gives it a mip chain for that.

JPEG q94: the plates are opaque; as PNG at this size they are ~7 MB each.

Usage: E:/stake/math-sdk/env/Scripts/python.exe design/sharpen_backgrounds.py
"""
from pathlib import Path

from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'design/source/backgrounds_1672'
OUT = APP / 'static/assets/sprites/goBananasBackground'
SIZE = (2560, 1440)

for name in ('bg_base', 'bg_feature', 'bg_superspin'):
    im = Image.open(SRC / f'{name}.png').convert('RGB').resize(SIZE, Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=24, percent=18, threshold=0))  # local contrast
    im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=85, threshold=2))  # edges
    im.save(OUT / f'{name}.jpg', quality=94, subsampling=0, optimize=True)
    print(name, (OUT / f'{name}.jpg').stat().st_size // 1024, 'KB')
