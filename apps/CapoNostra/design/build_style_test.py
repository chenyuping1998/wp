#!/usr/bin/env python3
"""Art Deco style test: key, quantise and downscale the pieces in _incoming/style_test/.

Brief: design/STYLE_TEST_ARTDECO.md. Output goes to design/_style_test/ and is never
installed into static/ by this script.

  key       magenta #FF00FF is not a palette ink, so it is removed everywhere (ring
            holes included), not only by a flood from the border. Edge pixels that
            are part magenta get their alpha from the distance and lose the spill.
  quantise  at 1024 (2x the 512 delivery), to the palette, then Lanczos to 512, so
            interiors stay flat and the anti-aliased edge comes back.
  --raw     skip quantising, to see how far the generation already sits on palette.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

DESIGN = Path(__file__).resolve().parent
SRC = DESIGN / "_incoming" / "style_test"
OUT = DESIGN / "_style_test"

PALETTE = {
    "ink": "#14110F",
    "jade_deep": "#16403C",
    "jade": "#2E7A70",
    "gold_deep": "#574311",
    "gold_dark": "#8A6D1F",
    "gold": "#C9A227",
    "gold_light": "#E6C65A",
    "ivory": "#EDE3CC",
}
# Wine is the hearts/diamonds ink only; in the quantiser it would also catch gold's
# shadow face, so it is offered only to the symbols that use it.
WINE = {"wine": "#5C2126"}
WINE_SYMBOLS = {"l2", "l3"}
# Skin is not a symbol ink; only the cast uses it.
SKIN = {"skin_light": "#E2B48C", "skin": "#B9805C", "skin_shadow": "#7A4B36", "grey_hair": "#9C9A92"}

SYMBOLS = ["h1", "l1", "w", "fs"]
MAGENTA = np.array([255.0, 0.0, 255.0])


def hexes(d: dict[str, str]) -> np.ndarray:
    return np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in d.values()], float)


def key(rgb: np.ndarray) -> np.ndarray:
    """RGBA with magenta removed. Keyed on hue, not brightness: the generator shades
    the backdrop seen through a ring's hole down to ~#900090, which a brightness
    key keeps and the quantiser then turns into wine. ratio = (min(r,b) - g) / max(r,b)
    is ~1 on any magenta, <= 0.3 on every ink (wine is r-heavy, so min(r,b) is low)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    ratio = (np.minimum(r, b) - g) / np.maximum(np.maximum(r, b), 1.0)
    alpha = np.clip((0.85 - ratio) / (0.85 - 0.40), 0, 1)
    alpha[np.maximum(r, b) < 40] = 1.0  # near-black ink, ratio is noise there
    # Despill: pull the part-magenta edge back toward its own non-magenta colour.
    a = alpha[..., None]
    fg = np.where(a > 0.02, (rgb - (1 - a) * MAGENTA) / np.maximum(a, 0.02), 0)
    return np.dstack([np.clip(fg, 0, 255), alpha * 255])


def lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ np.array([[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]])
    xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def quantise(rgba: np.ndarray, inks: np.ndarray) -> np.ndarray:
    """Nearest ink in Lab. In RGB a dark olive gold (87,66,18) is closer to wine than
    to dark gold, because RGB weighs the channels equally and the eye does not."""
    rgb = rgba[..., :3]
    d = ((lab(rgb)[..., None, :] - lab(inks)[None, None]) ** 2).sum(-1)
    q = inks[d.argmin(-1)]
    return np.dstack([q, rgba[..., 3]])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", action="store_true")
    args = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    sym_inks = hexes(PALETTE)
    cast_inks = np.vstack([sym_inks, hexes(SKIN)])
    for name in SYMBOLS + ["don_head"]:
        src = SRC / f"{name}.png"
        if not src.exists():
            print(f"skip {name}: missing")
            continue
        rgb = np.asarray(Image.open(src).convert("RGB").resize((1024, 1024), Image.LANCZOS), float)
        rgba = key(rgb)
        if not args.raw:
            inks = cast_inks if name == "don_head" else sym_inks
            if name in WINE_SYMBOLS:
                inks = np.vstack([inks, hexes(WINE)])
            rgba = quantise(rgba, inks)
        im = Image.fromarray(rgba.round().astype(np.uint8), "RGBA").resize((512, 512), Image.LANCZOS)
        suffix = "_raw" if args.raw else ""
        im.save(OUT / f"{name}{suffix}.png")
        print(f"{name}{suffix}: alpha>0 {np.mean(np.asarray(im)[..., 3] > 127):.1%}")
    bg = SRC / "bg_base.png"
    if bg.exists():
        Image.open(bg).convert("RGB").save(OUT / "bg_base.png")


if __name__ == "__main__":
    main()
