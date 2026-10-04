"""Prepare high-pay tiles for their ~60-120 px presentation on the reel.

The 1254 px source illustrations stay untouched.  A one-time Lanczos
minification, restrained edge sharpening and slight contrast lift preserve the
helmet, shuriken, purple ornament and fan silhouettes at game size.
"""
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'static/assets/sprites/goBananasSymbolsV3'
DEST = ROOT / 'static/assets/sprites/goBananinjaSharpHigh'
DEST.mkdir(parents=True, exist_ok=True)

for symbol in ('h1', 'h2', 'h3', 'h4'):
    for suffix in ('', '_split'):
        name = f'{symbol}{suffix}.png'
        source = Image.open(SOURCE / name).convert('RGBA')
        compact = source.resize((256, 256), Image.Resampling.LANCZOS)
        rgb = Image.new('RGB', compact.size, (18, 26, 31))
        rgb.paste(compact, mask=compact.getchannel('A'))
        rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.2, percent=185, threshold=2))
        rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
        rgb.save(DEST / name, optimize=True)
        print(f'{name}: {source.size} -> {rgb.size}')
