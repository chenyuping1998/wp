"""Remove the fake-transparency checkerboard baked into capoUiPlates/buybonus_plate.png.

The generated plate came with the image model's grey/white "transparent" checker
painted in as OPAQUE pixels in a band under the gold frame (rows ~594-634) and
up the two bottom corners, and semi-transparent round all four rounded corners. It showed as a pale striped strip under Buy Bonus,
brighter still once hover started lighting the plate (2026-09-29).

Only low-saturation light pixels in those regions are cleared: the frame is
saturated gold and its shadow line is near-black, so neither is touched.
Reads the original from design/_legacy_assets/checker_fix_20260929/.
"""
from pathlib import Path
from PIL import Image

APP = Path(__file__).resolve().parent.parent
SRC = APP / "design/_legacy_assets/checker_fix_20260929/buybonus_plate.png"
DST = APP / "static/assets/sprites/capoUiPlates/buybonus_plate.png"

im = Image.open(SRC).convert("RGBA")
W, H = im.size
px = im.load()
cleared = 0
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        in_band = y >= 594
        in_corner = (x < 40 or x > W - 41) and (y > 520 or y < 70)
        # the checker also sits semi-transparent round the rounded corners;
        # no intended pixel of this plate is a pale grey at partial alpha
        faint = a < 200
        if not (in_band or in_corner or faint):
            continue
        if max(r, g, b) - min(r, g, b) < 20 and max(r, g, b) > 110:
            px[x, y] = (r, g, b, 0)
            cleared += 1
im.save(DST, optimize=True)
print(f"cleared {cleared} checker pixels")
