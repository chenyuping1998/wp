#!/usr/bin/env python3
"""Interim black-and-white pass over every shipped image that has not been redrawn yet.

The user's rule (2026-10-04): the restyle is the WHOLE game — UI, cast, backgrounds,
transitions — not only the reels. Art for the bet bar, plates, titles, banners, logo,
transition doors and both cast figures is still to be generated (ART_BRIEF.md §1,
§4–§8), so until it lands those images are converted here to the same
luminance-preserving grey the source recolour uses (design/desaturate_src_colours.py):
neutral grey below paper brightness, paper-tinted above it. Alpha is untouched, so
cast rigs, nine-slices and hit areas keep working.

Skipped on purpose:
  capoFrames/      the vault multiplier frames are the one red in the game
  capoBrand/tile_* store-tile sources, delivered separately (ART_BRIEF §9)

Originals: design/_legacy_assets/static_assets_pre_artdeco_20261004.tgz. Each file
this replaces is overwritten in place; when its real Art Deco art arrives it simply
replaces the grey version.

  greyscale_interim.py           list what would change
  greyscale_interim.py --write   convert
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parent.parent
ASSETS = APP / "static/assets"
PAPER = np.array([0xEC, 0xE8, 0xDF], float)
PAPER_L = 0.299 * PAPER[0] + 0.587 * PAPER[1] + 0.114 * PAPER[2]
MIN_CHROMA = 6.0  # mean max-min over visible pixels; below this it is already grey


def skip(rel: str) -> bool:
    return rel.startswith("sprites/capoFrames/") or rel.startswith("sprites/capoBrand/tile_")


def to_grey(rgb: np.ndarray) -> np.ndarray:
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    grey = np.repeat(lum[..., None], 3, -1)
    # Blend toward the paper tint over the top of the range so whites match the art's
    # paper instead of going blue-white, the same rule the code recolour applies.
    t = np.clip((lum - 200) / 40, 0, 1)[..., None]
    paper = PAPER[None, None] * np.minimum(lum / PAPER_L, 255 / PAPER.max())[..., None]
    return grey * (1 - t) + paper * t


def chroma(a: np.ndarray) -> float:
    vis = a[..., 3] > 40 if a.shape[-1] == 4 else np.ones(a.shape[:2], bool)
    if not vis.any():
        return 0.0
    rgb = a[..., :3][vis]
    return float((rgb.max(1) - rgb.min(1)).mean())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    n = 0
    for path in sorted(ASSETS.rglob("*")):
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue
        rel = path.relative_to(ASSETS).as_posix()
        if skip(rel):
            continue
        im = Image.open(path)
        mode = im.mode
        a = np.asarray(im.convert("RGBA") if "A" in mode or mode == "P" else im.convert("RGB"), float)
        c = chroma(a)
        if c < MIN_CHROMA:
            continue
        n += 1
        print(f"{c:6.1f}  {rel}")
        if args.write:
            out = a.copy()
            out[..., :3] = to_grey(a[..., :3])
            img = Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8), "RGBA" if out.shape[-1] == 4 else "RGB")
            if path.suffix.lower() in {".jpg", ".jpeg"}:
                img.convert("RGB").save(path, quality=92)
            else:
                img.save(path)
    print(f"{'converted' if args.write else 'would convert'} {n} images")


if __name__ == "__main__":
    main()
