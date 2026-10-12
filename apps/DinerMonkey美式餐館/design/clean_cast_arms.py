"""Strips the apron / clothes slivers the cut left on the cast's FOREARM pieces
(`*_arm_2_hand`). The right forearm carried a long strip of the apron's edge,
the left a shard of it: at rest they sit where the apron is and nobody can
tell, but the arm swings off in the laugh and throw and took them along —
a cream-and-ink sliver flying beside the body (2026-10-09).

Apron-coloured pixels (light, unsaturated) are removed, and then everything not
connected to the arm's largest piece. The trunk under them is rebuilt by
clean_cast_trunk.py, so the apron edge is still there at rest.
Originals in design/source/<cast>/_orig/.

    python design/clean_cast_arms.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]

for cast in ("mg", "fg"):
    src = APP / "design/source" / cast
    orig = src / "_orig"
    orig.mkdir(exist_ok=True)
    meta = json.loads((src / "layers.json").read_text(encoding="utf-8"))
    for l in meta["layers"]:
        if "_arm_2_hand" not in l["name"]:
            continue
        if not (orig / l["file"]).exists():
            (orig / l["file"]).write_bytes((src / l["file"]).read_bytes())
        im = np.array(Image.open(orig / l["file"]).convert("RGBA")).astype(int)
        r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
        mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
        cream = (a > 40) & (mn > 150) & (mx - mn < 70)
        # the Carhop's dress stripes too
        cream |= (a > 40) & (r > 150) & (g < 120) & (b < 120)
        out = im.copy()
        out[cream] = 0
        solid = out[..., 3] > 40
        # cut the thin ink lines that tie leftovers to the arm, keep the arm's
        # piece, then give it back its own edge
        core = ndimage.binary_opening(solid, iterations=2)
        lab, n = ndimage.label(core)
        if n:
            sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
            arm = lab == 1 + int(np.argmax(sizes))
            # the fur's spikes are thin and the opening shaved them: grow back
            # (but not the cloth's own outline: ink right against the removed
            # cream / red is the apron's or dress's edge, not fur — fur spikes
            # stand in air)
            cloth_edge = ndimage.binary_dilation(cream, iterations=3)
            near = ndimage.binary_dilation(arm, iterations=10) & solid & ~(cloth_edge & ~arm)
            # and anything light enclosed by the arm (a highlight in the fur)
            # was never apron: fill the holes from the original
            inside = ndimage.binary_fill_holes(near) & (im[..., 3] > 0)
            keep = near | inside
            out = np.where(keep[..., None], im, 0)
        # loose ink dashes the strip left behind
        lab, n = ndimage.label(out[..., 3] > 40)
        if n > 1:
            sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
            for i, sz in enumerate(sizes, 1):
                if sz < 200:
                    out[lab == i] = 0
        # give the arm back its own fringe: fur and skin right against what was
        # kept (the opening shaved some of it, and at rest it is on show)
        kept = out[..., 3] > 40
        mx2 = np.maximum(np.maximum(r, g), b)
        own = ((r > 170) & (r - b > 60) & (g < 200)) | ((r >= g) & (g >= b) & (mx2 < 170) & (r - b > 25)) | (mx2 < 60)
        back = (im[..., 3] > 0) & ~kept & own & (ndimage.distance_transform_edt(~kept) <= 4) & ~ndimage.binary_dilation(cream, iterations=3)
        out[back] = im[back]
        # soft fringe left around removed pixels: drop near-transparent dust
        out[out[..., 3] < 30] = 0
        Image.fromarray(out.astype(np.uint8), "RGBA").save(src / l["file"])
        print(cast, l["name"], "removed", int((im[..., 3] > 40).sum() - (out[..., 3] > 40).sum()), "px")
