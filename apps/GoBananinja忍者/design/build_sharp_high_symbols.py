"""Prepare high-pay tiles for the reel.

2026-10-16: 256 -> 512. A cell is drawn at ~120-260 PHYSICAL px (phones and
retina screens run devicePixelRatio 2-3), so a 256 tile was being magnified
and went soft. 512 always shrinks, and the mip chain (src/game/crispTextures.ts)
filters the shrink; the sharpening is lighter because the GPU no longer
throws detail away.

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
        compact = source.resize((512, 512), Image.Resampling.LANCZOS)
        rgb = Image.new('RGB', compact.size, (18, 26, 31))
        rgb.paste(compact, mask=compact.getchannel('A'))
        rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=2))
        rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
        rgb.save(DEST / name, optimize=True)
        print(f'{name}: {source.size} -> {rgb.size}')
