#!/usr/bin/env python3
"""Process one Art Deco delivery batch (ART_BRIEF.md section 11) into sprite-shaped output.

  build_artdeco_batch.py _incoming/<batch>        -> _artdeco/<batch>/<sprite path>
  build_artdeco_batch.py _incoming/<batch> --list  (what each file maps to)

Every file is keyed on magenta by hue, quantised in Lab at 1024 (2x the 512 delivery)
to the section 0.3 inks, then Lanczos-downscaled. Low-pay chips are normalised to the
chip diameter the style test settled on, so all four sit at the same size on the reel.
Nothing here writes into static/; installing is a separate, reviewed step.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from build_style_test import hexes, key, lab, quantise
from build_style_test_b import GREYS, REDS, crop_square, fit_chip

DESIGN = Path(__file__).resolve().parent
OUT = DESIGN / "_artdeco"

# delivered file stem -> (inks, sprite path, delivery size, treatment)
MAP = {
    "h1": (GREYS, "capoSymbols/h1.png", 512, None),
    "h2": (GREYS, "capoSymbols/h2.png", 512, None),
    "h3": (GREYS, "capoSymbols/h3.png", 512, None),
    "h4": (GREYS, "capoSymbols/h4.png", 512, None),
    "h5": (GREYS, "capoSymbols/h5.png", 512, None),
    "l1": (GREYS, "capoSymbols/l1_v4.png", 512, "chip"),
    "l2": (GREYS, "capoSymbols/l2_v4.png", 512, "chip"),
    "l3": (GREYS, "capoSymbols/l3_v4.png", 512, "chip"),
    "l4": (GREYS, "capoSymbols/l4_v4.png", 512, "chip"),
    "w": (GREYS, "capoSymbols/w.png", 512, None),
    "sw": (GREYS, "capoSymbols/sw.png", 512, None),
    "fs": (GREYS, "capoSymbols/fs.png", 512, None),
    "sw_case_open": (GREYS, "capoFx/sw_case_open.png", 1024, None),
    "frame_1x1": (REDS, "capoFrames/frame_1x1.png", 256, "crop"),
    "frame_2x2": (REDS, "capoFrames/frame_2x2.png", 512, "crop"),
    "frame_3x3": (REDS, "capoFrames/frame_3x3.png", 768, "crop"),
}


# Generations that came back with a printed-grain texture (H2 window bands, H3 notes,
# H5 shadows) quantise into specks of the neighbouring ink: noise at reel size and the
# main thing pushing `soft` over the gate. A 3px mode filter on the ink index removes
# specks without moving edges. Not applied to everything: on a source that carries a
# real gradient (FS's ring) it turns the gradient's seam into blotches instead.
DESPECKLE = {"h2", "h3", "h5"}


def despeckled(rgba: np.ndarray, inks: np.ndarray) -> np.ndarray:
    d = ((lab(rgba[..., :3])[..., None, :] - lab(inks)[None, None]) ** 2).sum(-1)
    idx = Image.fromarray(d.argmin(-1).astype(np.uint8)).filter(ImageFilter.ModeFilter(3))
    return np.dstack([inks[np.asarray(idx)], rgba[..., 3]])


def process(src: Path, inks: dict[str, str], size: int, treatment: str | None) -> Image.Image:
    rgb = np.asarray(Image.open(src).convert("RGB").resize((1024, 1024), Image.LANCZOS), float)
    ink_table = hexes(inks)
    rgba = quantise(key(rgb), ink_table)
    if src.stem in DESPECKLE:
        rgba = despeckled(rgba, ink_table)
    im = Image.fromarray(rgba.round().astype(np.uint8), "RGBA")
    if treatment == "chip":
        im = fit_chip(im)
    elif treatment == "crop":
        im = crop_square(im)
    return im.resize((size, size), Image.LANCZOS)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("batch", type=Path)
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    batch = a.batch if a.batch.is_absolute() else DESIGN / a.batch
    out = OUT / batch.name
    for src in sorted(batch.rglob("*.png")):
        if src.stem not in MAP:
            print(f"skip {src.relative_to(batch)}: no mapping")
            continue
        inks, rel, size, treatment = MAP[src.stem]
        if a.list:
            print(f"{src.relative_to(batch)} -> {rel} ({size}px{', ' + treatment if treatment else ''})")
            continue
        dst = out / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        process(src, inks, size, treatment).save(dst)
        print(f"{src.relative_to(batch)} -> {dst.relative_to(DESIGN)}")


if __name__ == "__main__":
    main()
