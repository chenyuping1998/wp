#!/usr/bin/env python3
"""Two versions of the Art Deco style test for a side-by-side on the real board:

  deco  jade + gold (the generated style test, as build_style_test.py makes it)
  noir  the same Deco shapes, re-inked black / two greys / paper, with the one red
        (#C1272D) moved onto the vault multiplier frames

Symbols and background are re-inked ink by ink: each pixel is quantised to the
Deco palette at 1024 and the ink index is mapped to its noir value, so shapes and
edges are identical between the two versions and only the palette differs. The
board plate and the vault frames are still the old rendered art; they are remapped
by luminance onto each version's ramp, an approximation that only exists so the
old brown leather does not decide the comparison.

Output: design/_style_test/{deco,noir}/<sprite path>, mirroring static/assets/sprites.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from build_style_test import PALETTE, SRC, hexes, key, lab

DESIGN = Path(__file__).resolve().parent
SPRITES = DESIGN.parent / "static" / "assets" / "sprites"
OUT = DESIGN / "_style_test"

NOIR = {
    "black": "#121212",
    "dark": "#333333",
    "grey": "#8C8C8C",
    "paper": "#ECE8DF",
}
# Deco ink -> noir value. Gold carries the lit face of the top symbol, so it goes
# to paper, not grey; each Deco hue pair (jade, gold) keeps its own dark/mid step.
DECO_TO_NOIR = {
    "ink": "black",
    "jade_deep": "dark",
    "gold_deep": "dark",
    "jade": "grey",
    "gold_dark": "grey",
    "gold": "paper",
    "gold_light": "paper",
    "ivory": "paper",
}
RED = "#C1272D"

SYMBOLS = {"h1": "capoSymbols/h1.png", "w": "capoSymbols/w.png", "fs": "capoSymbols/fs.png"}

# Luminance ramps for the old rendered plates, dark to light.
RAMPS = {
    "deco": {
        "board": ["#0B0A09", "#14110F", "#16403C", "#2E7A70"],
        "edge": ["#14110F", "#574311", "#8A6D1F", "#C9A227", "#E6C65A"],
        "frame": ["#14110F", "#574311", "#8A6D1F", "#C9A227", "#E6C65A"],
    },
    "noir": {
        "board": ["#080808", "#121212", "#262626", "#3A3A3A"],
        "edge": ["#121212", "#333333", "#8C8C8C", "#ECE8DF"],
        "frame": ["#121212", "#5A0F12", RED, "#F2D6D0"],
    },
}
PLATES = {
    "capoBoardFrame/frame_bg_capo_v1.png": "board",
    "capoBoardFrame/frame_edge_capo_v1.png": "edge",
    "capoFrames/frame_1x1.png": "frame",
    "capoFrames/frame_2x2.png": "frame",
    "capoFrames/frame_3x3.png": "frame",
    "capoFrames/frame_edge_1x1.png": "frame",
    "capoFrames/frame_edge_2x2.png": "frame",
    "capoFrames/frame_edge_3x3.png": "frame",
}


def ink_index(rgb: np.ndarray, smooth: bool) -> np.ndarray:
    """Nearest Deco ink, then a 5px mode filter. The generator's gold has a speckled
    seam where gold and dark gold meet; in Deco those two inks are close and it does
    not show, in noir they become paper and grey and it turns into noise."""
    inks = hexes(PALETTE)
    d = ((lab(rgb)[..., None, :] - lab(inks)[None, None]) ** 2).sum(-1)
    if not smooth:
        return d.argmin(-1)
    idx = Image.fromarray(d.argmin(-1).astype(np.uint8)).filter(ImageFilter.ModeFilter(5))
    return np.asarray(idx)


def reink(rgba: np.ndarray, version: str) -> np.ndarray:
    idx = ink_index(rgba[..., :3], smooth=version == "noir")
    if version == "deco":
        table = hexes(PALETTE)
    else:
        noir = {k: v for k, v in NOIR.items()}
        table = hexes({name: noir[DECO_TO_NOIR[name]] for name in PALETTE})
    return np.dstack([table[idx], rgba[..., 3]])


def ramp(rgba: np.ndarray, stops: list[str]) -> np.ndarray:
    rgb = rgba[..., :3]
    lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]) / 255.0
    lo, hi = np.percentile(lum[rgba[..., 3] > 8], [2, 98]) if (rgba[..., 3] > 8).any() else (0, 1)
    t = np.clip((lum - lo) / max(hi - lo, 1e-3), 0, 1) * (len(stops) - 1)
    cols = hexes(dict(enumerate(stops)))
    i = np.minimum(t.astype(int), len(stops) - 2)
    f = (t - i)[..., None]
    return np.dstack([cols[i] * (1 - f) + cols[i + 1] * f, rgba[..., 3]])


def save(arr: np.ndarray, path: Path, size: tuple[int, int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    mode = "RGBA" if arr.shape[-1] == 4 else "RGB"
    Image.fromarray(np.clip(arr, 0, 255).round().astype(np.uint8), mode).resize(size, Image.LANCZOS).save(path)


def main() -> None:
    for version in ("deco", "noir"):
        root = OUT / version
        for name, rel in SYMBOLS.items():
            rgb = np.asarray(Image.open(SRC / f"{name}.png").convert("RGB").resize((1024, 1024), Image.LANCZOS), float)
            save(reink(key(rgb), version), root / rel, (512, 512))
        # L1: the darker, smaller chip from round 1, re-inked the same way.
        l1 = np.asarray(Image.open(OUT / "l1_alt.png").convert("RGBA").resize((1024, 1024), Image.NEAREST), float)
        save(reink(l1, version), root / "capoSymbols/l1_v4.png", (512, 512))

        bg = np.asarray(Image.open(SRC / "bg_base.png").convert("RGB"), float)
        bg_rgba = np.dstack([bg, np.full(bg.shape[:2], 255.0)])
        save(reink(bg_rgba, version)[..., :3], root / "capoBackground/bg_base_v1.png", (1672, 941))
        save(np.zeros((1080, 1920, 4)), root / "capoBackground/bg_base_near.png", (1920, 1080))

        for rel, kind in PLATES.items():
            im = Image.open(SPRITES / rel).convert("RGBA")
            save(ramp(np.asarray(im, float), RAMPS[version][kind]), root / rel, im.size)
        print(f"{version}: {sum(1 for _ in root.rglob('*.png'))} files")


if __name__ == "__main__":
    main()
