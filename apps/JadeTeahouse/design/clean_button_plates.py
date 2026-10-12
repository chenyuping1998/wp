"""Removes the decorative highlight arcs inside the round UI button plates
(sushiUi/button_print, button_print_on, button_plate, spin_plate) — user,
2026-10-10: 「按鈕上面黃色的線條移除」. Each plate's inner disc is filled flat
with its own centre colour, up to the inner ring. Originals in
design/source/ui_plates_orig/ (always re-run from them).

    python design/clean_button_plates.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
UI = APP / "static/assets/sprites/sushiUi"
ORIG = APP / "design/source/ui_plates_orig"
NAMES = ("button_print", "button_print_on", "button_plate", "spin_plate")

ORIG.mkdir(parents=True, exist_ok=True)
for name in NAMES:
    src = UI / f"{name}.png"
    if not src.exists():
        continue
    keep = ORIG / f"{name}.png"
    if not keep.exists():
        keep.write_bytes(src.read_bytes())
    im = np.array(Image.open(keep).convert("RGBA")).astype(float)
    h, w = im.shape[:2]
    cy, cx = (h - 1) / 2, (w - 1) / 2
    centre = np.median(im[int(cy) - 6:int(cy) + 7, int(cx) - 6:int(cx) + 7].reshape(-1, 4), axis=0)
    # where the disc ends along each direction: the first pixel that differs
    # from the centre colour; the ring is where most directions end (the arcs
    # only cover some of them), so take a high percentile
    ends = []
    for a in np.linspace(0, 2 * np.pi, 360, endpoint=False):
        for r in range(4, int(min(w, h) / 2)):
            x, y = int(round(cx + r * np.cos(a))), int(round(cy + r * np.sin(a)))
            if np.abs(im[y, x, :3] - centre[:3]).sum() > 60 or im[y, x, 3] < 200:
                ends.append(r)
                break
    R = float(np.percentile(ends, 90)) - 1.5
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - cx, yy - cy)
    # flat inside, a 1.5px feather into the ring so its inner edge stays smooth
    k = np.clip((R - d) / 1.5, 0, 1)[..., None]
    out = im * (1 - k) + centre * k
    # the rings too: every radius out to the rim takes that radius's median
    # colour, so an arc drawn ON a ring (Diner's spin highlight) goes as well.
    # Rings are rotationally uniform, so for every other plate this changes
    # nothing visible.
    ring = (d >= R) & (d < min(w, h) / 2)
    rb = np.round(d).astype(int)
    for r in np.unique(rb[ring]):
        m = ring & (rb == r)
        out[m] = np.median(im[m], axis=0)
    Image.fromarray(out.round().astype(np.uint8), "RGBA").save(src)
    print(APP.name, name, "inner radius", round(R, 1), "of", w // 2)
