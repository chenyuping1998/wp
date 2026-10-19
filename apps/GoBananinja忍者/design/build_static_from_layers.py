"""The reel's static tiles, built from the SAME layers the landing/idle/win
acts draw (2026-10-17, user: 「獎圖轉停跟停完好像會有換圖的差異感，這個要統一
才不會看起來圖片在換」).

A cell shows its static sprite while the reel spins, swaps to SymbolMeshWin's
plate + subject meshes for the landing act, and swaps back when it ends. The
static high pays came from build_sharp_high_symbols.py — sharpened, contrast
+8%, flattened onto a dark colour — while the act draws the plain cut layers,
so every landing visibly changed the picture twice. Now each static tile IS the
act's first frame: plate + subject, composited exactly as the meshes lie at
rest, so the swap cannot be seen.

Every cut-mode symbol and its split twin (H1-H4, S, L1-L5). The Wild is a
panel — its act draws the static sprite itself — so it needs nothing.

    E:/stake/math-sdk/env/Scripts/python.exe design/build_static_from_layers.py
"""
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parents[1]
MESH = APP / 'static/assets/sprites/goBananinjaMesh'
OUT = APP / 'static/assets/sprites/goBananinjaStatic'
OUT.mkdir(parents=True, exist_ok=True)

for base in ('h1', 'h2', 'h3', 'h4', 's', 'l1', 'l2', 'l3', 'l4', 'l5'):
    for layer, name in ((base, base), (base + 's', base + '_split')):
        plate = MESH / f'{layer}_plate.png'
        if not plate.exists():
            continue
        tile = Image.open(plate).convert('RGBA')
        tile.alpha_composite(Image.open(MESH / f'{layer}_subject.png').convert('RGBA'))
        tile.save(OUT / f'{name}.png', optimize=True)
        print(name, tile.size)
