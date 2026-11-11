"""Soft light shaft for the big-win sunburst (fx_ray.png, white, tinted at runtime).

Points right from the left-centre. Alpha falls off across the shaft as a
gaussian whose width grows with distance, and along it toward the tip, so the
rays read as light rather than as the flat-filled wedges they replace.
"""
import math
from pathlib import Path
from PIL import Image

W, H = 512, 128
out = Image.new("RGBA", (W, H), (255, 255, 255, 0))
px = out.load()
for x in range(W):
    t = x / (W - 1)
    along = (1 - t) ** 1.35 * min(1.0, t / 0.04)  # soft root, fading tip
    half = 3 + (H * 0.46 - 3) * t  # shaft widens outward
    for y in range(H):
        d = (y - (H - 1) / 2) / half
        across = math.exp(-2.2 * d * d)
        a = along * across
        px[x, y] = (255, 255, 255, round(255 * a))
dest = Path(__file__).resolve().parent.parent / "static/assets/deadwood/fx_ray.png"
out.save(dest, optimize=True)
print("wrote", dest)
