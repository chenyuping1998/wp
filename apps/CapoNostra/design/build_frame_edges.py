#!/usr/bin/env python3
"""The vault frames' edge layers (frame_edge_{1x1,2x2,3x3}.png), made from the frame art.

NeonFrames.svelte draws the edge layer additively over its frame for the arrival
flash, the premium/elite edge glow and the elite second casting, tinted from code.
It therefore has to follow THIS frame's silhouette exactly: the old edge layers were
cut from the colour-era castings and outline the wrong shapes on the Art Deco frames.

Each edge layer is white (so the tint decides its colour) with alpha = the frame's
own alpha, slightly dilated and softened: a halo hugging the border, never the hole.
ART_BRIEF §3: "frame_edge_* ... 由程式從框的 alpha 產生".

  build_frame_edges.py   (reads static/assets/sprites/capoFrames/frame_*.png)
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parent.parent
FRAMES = APP / "static/assets/sprites/capoFrames"


def edge(src: Path) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    a = im.getchannel("A")
    r = max(2, im.width // 128)  # ~2px on the 256 frame, 6px on the 768
    grown = a.filter(ImageFilter.MaxFilter(2 * r + 1)).filter(ImageFilter.GaussianBlur(r))
    alpha = np.maximum(np.asarray(grown, float) * 0.85, np.asarray(a, float))
    white = Image.new("L", im.size, 255)
    return Image.merge("RGBA", (white, white, white, Image.fromarray(alpha.round().astype(np.uint8))))


def main() -> None:
    for size in ("1x1", "2x2", "3x3"):
        out = FRAMES / f"frame_edge_{size}.png"
        edge(FRAMES / f"frame_{size}.png").save(out)
        print(f"wrote {out.relative_to(APP)}")


if __name__ == "__main__":
    main()
