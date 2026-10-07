"""The gold coin the big-win pour throws (components/TreasureFall.svelte).

Cut from the P symbol's own painting (goBananasSymbolsV3/p.png) rather than
drawn: the coin on that plate is the game's gold, already lit and rope-rimmed,
and a vector disc beside it would read as a stand-in. The plate round it is
masked off with a supersampled circle so the rim stays clean at 96px.

    env/Scripts/python.exe design/cut_fx_coin.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parent.parent
SRC = APP / 'static/assets/sprites/goBananasSymbolsV3/p.png'
OUT = APP / 'static/assets/sprites/goBananasFx/fx_coin.png'

# measured off the art: the gold (r > 150, b < 90) spans x 36..219, y 35..219
CX, CY, R = 127.5, 127.0, 92.5
SIZE = 96
SS = 4

im = Image.open(SRC).convert('RGBA')
mask = Image.new('L', (im.width * SS, im.height * SS), 0)
ImageDraw.Draw(mask).ellipse([(CX - R) * SS, (CY - R) * SS, (CX + R) * SS, (CY + R) * SS], fill=255)
im.putalpha(mask.resize(im.size, Image.LANCZOS))
box = (int(CX - R) - 1, int(CY - R) - 1, int(CX + R) + 2, int(CY + R) + 2)
im.crop(box).resize((SIZE, SIZE), Image.LANCZOS).save(OUT, optimize=True)
print(f'wrote {OUT.relative_to(APP)}')
