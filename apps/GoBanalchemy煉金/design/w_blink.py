"""The Wild's gorilla blinks too (2026-10-16), like the mascot (alchemist_blink.py).

Two full-size overlays of goBanalchemySymbols/w.png — lids half shut and shut,
transparent everywhere else — written to goBanalchemyMesh/w_lid_half.png and
w_lid_closed.png. Being the same canvas as the art, SymbolMeshWin.svelte draws
them as a second mesh on the Wild's OWN geometry: the lids bend exactly as the
face under them (head bob, chomp, goggles). When it blinks: wGorilla.ts,
W_BLINKS.

Eyes measured on the 512px art (2026-10-16): left (267, 175) r 18 x 10,
right (353, 189) r 13 x 8 — the right one squints.

Usage: python design/w_blink.py   (re-run whenever w.png is repainted)
"""
from pathlib import Path

import numpy as np
from PIL import Image

from alchemist_blink import paint_region

APP = Path(__file__).resolve().parents[1]
ART = APP / 'static/assets/sprites/goBanalchemySymbols/w.png'
OUT = APP / 'static/assets/sprites/goBanalchemyMesh'
EYES = [((267.0, 175.0), 18.0, 10.0), ((353.0, 189.0), 13.0, 8.0)]

body = np.asarray(Image.open(ART).convert('RGBA'), np.float32)
H, W = body.shape[:2]
# paint only round the eyes, then place into a full transparent canvas
X0, Y0, LW, LH = 220, 140, 180, 80
for name, shut in (('w_lid_half.png', 0.5), ('w_lid_closed.png', 1.0)):
    lids = paint_region(body, EYES, X0, Y0, LW, LH, shut)
    full = np.zeros((H, W, 4), np.uint8)
    full[Y0:Y0 + LH, X0:X0 + LW] = lids
    Image.fromarray(full, 'RGBA').save(OUT / name, optimize=True)
    print(name)
