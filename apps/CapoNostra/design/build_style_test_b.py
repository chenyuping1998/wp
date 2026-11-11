#!/usr/bin/env python3
"""Style test round 2, version B (Deco shapes, black and white, red only on the vault
frames): key, quantise and downscale the pieces in _incoming/style_test_b/.

Brief: design/STYLE_TEST_ARTDECO.md section 5. Output: design/_style_test/b/, laid out
like static/assets/sprites so it can be copied over a playtest build as is. H1, W, FS,
the background and the board plates come from build_style_compare.py's noir set.

  frame_1x1  keyed, quantised to the red inks plus black, cropped to its own bounds
             (the generation leaves ~3% margin, which would shrink the hole on the
             board), padded square, 256 px like the art it replaces.
"""

from __future__ import annotations

import shutil
from pathlib import Path

import numpy as np
from PIL import Image

from build_style_test import hexes, key, quantise

DESIGN = Path(__file__).resolve().parent
SRC = DESIGN / "_incoming" / "style_test_b"
NOIR = DESIGN / "_style_test" / "noir"
OUT = DESIGN / "_style_test" / "b"

GREYS = {"black": "#121212", "dark": "#333333", "grey": "#8C8C8C", "paper": "#ECE8DF"}
REDS = {"red_deep": "#5A0F12", "red": "#C1272D", "red_pale": "#F2D6D0", "black": "#121212"}

PIECES = {
    # name: (inks, sprite path, size)
    "l1": (GREYS, "capoSymbols/l1_v4.png", 512),
    "l2": (GREYS, "capoSymbols/l2_v4.png", 512),
    "frame_1x1": (REDS, "capoFrames/frame_1x1.png", 256),
    "don_head": (GREYS, "cast/don_head.png", 512),
}


def crop_square(im: Image.Image) -> Image.Image:
    box = im.getchannel("A").point(lambda a: 255 if a > 127 else 0).getbbox()
    im = im.crop(box)
    side = max(im.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return sq


# Low-pay chips are normalised to one diameter: the generations come back at 87% and
# 79% of the canvas, and a low pay must cover <= 45% of its cell (section 5.1).
CHIP_DIAMETER = 0.76


def fit_chip(im: Image.Image) -> Image.Image:
    sq = crop_square(im)
    side = round(im.width * CHIP_DIAMETER)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(sq.resize((side, side), Image.LANCZOS), ((im.width - side) // 2,) * 2)
    return out


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(NOIR, OUT)
    for name, (inks, rel, size) in PIECES.items():
        rgb = np.asarray(Image.open(SRC / f"{name}.png").convert("RGB").resize((1024, 1024), Image.LANCZOS), float)
        rgba = quantise(key(rgb), hexes(inks))
        im = Image.fromarray(rgba.round().astype(np.uint8), "RGBA")
        if name == "frame_1x1":
            im = crop_square(im)
        elif name in ("l1", "l2"):
            im = fit_chip(im)
        dst = OUT / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.resize((size, size), Image.LANCZOS).save(dst)
        print(f"{name} -> {rel}")


if __name__ == "__main__":
    main()
