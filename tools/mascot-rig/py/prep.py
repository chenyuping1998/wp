"""Reads a delivery's layer PNGs: checks they share one canvas and dumps each alpha channel raw for the rigger.

usage: python prep.py <layers dir> <out dir>   → <out>/<layer>.alpha (8-bit, width*height), <out>/layers.json
"""
import json
import os
import sys

from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
info, size = {}, None
for f in sorted(os.listdir(src)):
    if not f.lower().endswith(".png"):
        continue
    im = Image.open(os.path.join(src, f)).convert("RGBA")
    if size and im.size != size:
        sys.exit(f"ERROR: {f} is {im.size[0]}x{im.size[1]}, the other layers are {size[0]}x{size[1]} (every layer must be the full canvas)")
    size = im.size
    a = im.getchannel("A")
    name = f[:-4].strip().lower().replace(" ", "_").replace("-", "_")
    open(os.path.join(out, name + ".alpha"), "wb").write(a.tobytes())
    info[name] = {"file": f, "bbox": a.getbbox()}
if not info:
    sys.exit(f"ERROR: no PNG layers in {src}")
json.dump({"width": size[0], "height": size[1], "layers": info}, open(os.path.join(out, "layers.json"), "w"), indent=1)
print(f"prep: {len(info)} layers, canvas {size[0]}x{size[1]}")
