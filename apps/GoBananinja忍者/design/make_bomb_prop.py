"""The THROWN PROP for the opening and the transition (TransitionAnimation.svelte):
this game's own smoke bomb, in place of the pineapple grenade inherited from
Go Bananas.

It is the H3 symbol's subject — the bomb and its violet smoke, already cut off
the slate by design/make_symbol_layers.py (h3_subject.png, 512px) — but taken
from the 1254px source art at full resolution: the 512 cut's alpha is scaled up
to the source and applied there, then trimmed to the prop's own bounding box.
The prop is drawn ~280px tall on a 1080 screen, more than the 512 layer gives.

Run after make_symbol_layers.py:
    E:/stake/math-sdk/env/Scripts/python.exe design/make_bomb_prop.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
src = Image.open(APP / 'static/assets/sprites/goBananasSymbolsV3/h3.png').convert('RGB')
cut = Image.open(APP / 'static/assets/sprites/goBananinjaMesh/h3_subject.png').getchannel('A')
alpha = cut.resize(src.size, Image.LANCZOS)
rgba = np.dstack([np.asarray(src), np.asarray(alpha)])
rgba[rgba[..., 3] < 8] = 0
ys, xs = np.nonzero(rgba[..., 3] > 8)
pad = 4
box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(src.width, xs.max() + pad + 1), min(src.height, ys.max() + pad + 1))
prop = Image.fromarray(rgba).crop(box)
out = APP / 'static/assets/sprites/goBananinjaMesh/bomb_prop.png'
prop.save(out, optimize=True)
print(f'{out.name}: {prop.width}x{prop.height}')
