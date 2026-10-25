"""Packs each layer's mesh crop into a Spine 4.x atlas page for the game.

The crop is the layer's mesh extent (the rigger writes it, so every mesh UV lands inside its own region), scaled by the
export scale. Regions are packed into shelves with 2 px padding and edge bleed (the border pixels repeated outward into
the padding, so linear filtering at a region's edge never picks up a neighbour).

usage: python pack.py <layers dir> <crops.json> <out dir> <name> [scale]   → <out>/<name>.png (+ _2, _3…) and <name>.atlas
"""
import json
import os
import sys

from PIL import Image

src, crops_file, out, name = sys.argv[1:5]
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
crops = json.load(open(crops_file, encoding="utf-8"))
PAD, MAX = 2, 4096
os.makedirs(out, exist_ok=True)

items = []
for layer, c in crops.items():
    im = Image.open(os.path.join(src, c["file"])).convert("RGBA")
    box = (c["x"], c["y"], c["x"] + c["w"], c["y"] + c["h"])
    part = Image.new("RGBA", (c["w"], c["h"]), (0, 0, 0, 0))
    part.paste(im.crop(box), (0, 0))  # crop() pads with transparency where the mesh runs past the canvas
    w, h = max(1, round(c["w"] * scale)), max(1, round(c["h"] * scale))
    if (w, h) != part.size:
        part = part.resize((w, h), Image.LANCZOS)
    items.append((layer, part))


def pack(items, side):
    """Shelf packing, tallest first; returns placements or None when they don't fit a side x side page."""
    x = y = shelf = 0
    placed = []
    for layer, im in sorted(items, key=lambda t: -t[1].height):
        w, h = im.width + 2 * PAD, im.height + 2 * PAD
        if w > side:
            return None
        if x + w > side:
            x, y, shelf = 0, y + shelf, 0
        if y + h > side:
            return None
        placed.append((layer, im, x + PAD, y + PAD))
        x += w
        shelf = max(shelf, h)
    return placed


pages, todo = [], list(items)
while todo:
    side = 256
    while side <= MAX and pack(todo, side) is None:
        side *= 2
    if side > MAX:  # one page can't hold them all: split off the larger half and retry
        fit = []
        for it in sorted(todo, key=lambda t: -t[1].width * t[1].height):
            if pack(fit + [it], MAX) is not None:
                fit.append(it)
        placed, side = pack(fit, MAX), MAX
    else:
        placed = pack(todo, side)
    used_h = max(py + im.height + PAD for _, im, _, py in placed)
    height = 1 << (used_h - 1).bit_length()
    pages.append((side, max(height, 64), placed))
    done = {l for l, _, _, _ in placed}
    todo = [t for t in todo if t[0] not in done]

lines = []
for i, (w, h, placed) in enumerate(pages):
    file = f"{name}.png" if i == 0 else f"{name}_{i + 1}.png"
    page = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for layer, im, px, py in placed:
        # bleed: stretch the region's border pixels into the padding
        page.paste(im.resize((im.width + 2 * PAD, im.height + 2 * PAD), Image.NEAREST), (px - PAD, py - PAD))
        page.paste(im, (px, py))
    page.save(os.path.join(out, file))
    lines += ["" if i else None, file, f"size:{w},{h}", "format:RGBA8888", "filter:Linear,Linear", "repeat:none", "pma:false"]
    for layer, im, px, py in sorted(placed):
        lines += [layer, f"bounds:{px},{py},{im.width},{im.height}"]
open(os.path.join(out, name + ".atlas"), "w", encoding="utf-8", newline="\n").write("\n".join(l for l in lines if l is not None) + "\n")
print(f"pack: {len(items)} regions on {len(pages)} page(s): " + ", ".join(f"{w}x{h}" for w, h, _ in pages))
