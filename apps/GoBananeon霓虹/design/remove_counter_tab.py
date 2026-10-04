"""Paint the empty tab out of the FG counter plate (fs_counter_panel.png).

The delivered plate carries a small cyan-rimmed tab at the top centre: the
slot GoBoomana's counter hung its dynamite icon in. Go Bananeon has no icon
there, and an empty ring above FREE SPINS read as a mistake (user, 2026-10-03).

The plate is flat colour bands that run horizontally (rims, the inner line,
the navy face), so each column of the tab is replaced by a clean column of the
plate just left of it. The delivery copy in design/source/neon_delivery/frame/
is left untouched; this writes the shipped asset.

    py design/remove_counter_tab.py
"""
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parent.parent
SRC = APP / 'design/source/neon_delivery/frame/fs_counter_panel.png'
OUT = APP / 'static/assets/sprites/goBananasFrame/fs_counter_panel.png'

# measured on the 1280 x 966 plate: the tab spans x 536..745, y 166..265
TAB_X = (528, 754)
TAB_Y = (150, 280)
CLEAN_X = 510  # a column of plain plate left of the tab

im = Image.open(SRC).convert('RGBA')
column = im.crop((CLEAN_X, TAB_Y[0], CLEAN_X + 1, TAB_Y[1]))
for x in range(*TAB_X):
    im.paste(column, (x, TAB_Y[0]))
im.save(OUT)
print(f'{OUT.name}: tab removed ({TAB_X[0]}..{TAB_X[1]} x {TAB_Y[0]}..{TAB_Y[1]})')
