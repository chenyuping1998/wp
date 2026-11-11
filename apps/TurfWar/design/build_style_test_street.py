#!/usr/bin/env python3
"""Street sticker style test: key, quantise and downscale design/_incoming/style_test_street/.

Brief: design/STYLE_TEST_STREET.md. Output goes to design/_style_test_street/ and is
never installed into static/ by this script.

  key       pure blue #0000FF is not a palette ink (the palette has magenta and acid
            green, hence no magenta/green screen), so it is removed everywhere, ring
            holes included. ratio = (b - max(r, g)) / b is ~1 on the screen and <= 0.1
            on every ink (graffiti cyan has g ~= b). Edge pixels lose the blue spill.
  quantise  at 1024 (2x the 512 delivery), to the palette, then Lanczos to 512.
  --raw     skip quantising, to see how far the generation already sits on palette.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

DESIGN = Path(__file__).resolve().parent
SRC = DESIGN / "_incoming" / "style_test_street"
OUT = DESIGN / "_style_test_street"

BASE = {
    "ink": "#121212",
    "sticker_white": "#F7F5F0",
    "wall_light": "#D8D6D1",
    "wall_mid": "#9A9CA0",
    "wall_dark": "#55585D",
}
SODIUM = {"sodium_dark": "#9C5A22", "sodium": "#F5893D", "sodium_light": "#FFC38A",
          "sodium_deep": "#5E3412"}
RED = {"red": "#B22222", "red_deep": "#6E1414"}
SKIN = {"skin_light": "#D9A27A", "skin": "#A86F4C", "skin_shadow": "#6B4230",
        "hood_deep": "#33363A"}
GREY_ONLY = {"wall_mid": "#9A9CA0", "wall_dark": "#55585D", "wall_light": "#D8D6D1"}

INKS = {
    "h1": {**BASE, **SODIUM},
    "w": {**BASE, **SODIUM},
    "sw": {**BASE, **RED, "wall_deep": "#33363A"},
    "l1": GREY_ONLY,
    "cast_head": {**BASE, **SKIN},
}
BLUE = np.array([0.0, 0.0, 255.0])


def hexes(d: dict[str, str]) -> np.ndarray:
    return np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in d.values()], float)


def key(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    ratio = (b - np.maximum(r, g)) / np.maximum(b, 1.0)
    alpha = np.clip((0.80 - ratio) / (0.80 - 0.35), 0, 1)
    alpha[b < 40] = 1.0  # near-black ink, ratio is noise there
    a = alpha[..., None]
    fg = np.where(a > 0.02, (rgb - (1 - a) * BLUE) / np.maximum(a, 0.02), 0)
    return np.dstack([np.clip(fg, 0, 255), alpha * 255])


def lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ np.array([[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]])
    xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def quantise(rgba: np.ndarray, inks: np.ndarray) -> np.ndarray:
    d = ((lab(rgba[..., :3])[..., None, :] - lab(inks)[None, None]) ** 2).sum(-1)
    return np.dstack([inks[d.argmin(-1)], rgba[..., 3]])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", action="store_true")
    args = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    for name, inks in INKS.items():
        src = SRC / f"{name}.png"
        if not src.exists():
            print(f"skip {name}: missing")
            continue
        rgb = np.asarray(Image.open(src).convert("RGB").resize((1024, 1024), Image.LANCZOS), float)
        rgba = key(rgb)
        if not args.raw:
            rgba = quantise(rgba, hexes(inks))
        im = Image.fromarray(rgba.round().astype(np.uint8), "RGBA").resize((512, 512), Image.LANCZOS)
        suffix = "_raw" if args.raw else ""
        im.save(OUT / f"{name}{suffix}.png")
        print(f"{name}{suffix}: alpha>0 {np.mean(np.asarray(im)[..., 3] > 127):.1%}")
    bg = SRC / "bg_crop.png"
    if bg.exists():
        Image.open(bg).convert("RGB").resize((1920, 1080), Image.LANCZOS).save(OUT / "bg_base.png")


if __name__ == "__main__":
    main()
