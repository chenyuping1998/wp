"""The bet bar's round-button icons, centred and legible (user, 2026-10-10:
「把圖案設置在圓圈中間」):

  - every icon the 'print' skin uses is shifted so its ink's bounding box sits
    on the canvas centre (the speaker and autospin arrows sat ~10px of 256 off)
  - bold drawn − / + (print_increase / print_decrease) in the set's own icon
    colour: the template draws them as text glyphs, which sit low and thin

Originals in design/source/icons_orig/ (re-run starts from them).

    python design/centre_bar_icons.py
"""
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parents[1]
ORIG = APP / "design/source/icons_orig"
ICONS = APP / "static/assets/sprites/sushiIcons"


def used_icons():
    th = (APP / "src/game/uiTheme.ts").read_text(encoding="utf8")
    seg = th[th.index("if (skin === 'print')"):]
    keys = re.findall(r"(\w+):\s*'(\w+)'", re.search(r"icons:\s*\{(.*?)\}", seg, re.S).group(1))
    assets = (APP / "src/game/assets.ts").read_text(encoding="utf8")
    out = {}
    for slot, key in keys:
        m = re.search(key + r"\s*:\s*\{[^}]*?sprites/([^'\"]+\.png)", assets, re.S)
        if m:
            out[slot] = APP / "static/assets/sprites" / m.group(1)
    return out


ORIG.mkdir(parents=True, exist_ok=True)
icons = used_icons()
colour = None
for slot, p in icons.items():
    keep = ORIG / p.name
    if not keep.exists():
        keep.write_bytes(p.read_bytes())
    im = Image.open(keep).convert("RGBA")
    a = np.array(im)
    if slot == "menu":
        solid = a[a[..., 3] > 200][:, :3]
        colour = tuple(int(v) for v in np.median(solid, axis=0)) + (255,)
    ys, xs = np.nonzero(a[..., 3] > 40)
    dx = round((im.width - 1) / 2 - (xs.min() + xs.max()) / 2)
    dy = round((im.height - 1) / 2 - (ys.min() + ys.max()) / 2)
    if dx or dy:
        out = Image.new("RGBA", im.size, (0, 0, 0, 0))
        out.alpha_composite(im, (dx, dy))
        out.save(p, optimize=True)
        print(APP.name, slot, "moved", dx, dy)

K = 4
# Diner draws its own ink stepper (design/make_step_icons.py)
for name, vertical in ():
    c = Image.new("RGBA", (256 * K, 256 * K), colour[:3] + (0,))
    d = ImageDraw.Draw(c)
    m, a_, b_ = 128 * K, 70 * K, 19 * K
    d.rounded_rectangle([m - a_, m - b_, m + a_, m + b_], radius=b_, fill=colour)
    if vertical:
        d.rounded_rectangle([m - b_, m - a_, m + b_, m + a_], radius=b_, fill=colour)
    c.resize((256, 256), Image.LANCZOS).save(ICONS / f"{name}.png", optimize=True)

