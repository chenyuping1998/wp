"""Kingpin cast: turn the speckled magenta rim light into a smooth blood red.

build_cast_parts.py makes the Kingpin variant by adding +95 red to pixels whose
BLUE rim light passes a hard threshold, and keeps 82% of their blue — so the
rim came out magenta (off ART_BRIEF §0, which has no purple) and, because the
mask is boolean, speckled pixel by pixel along the right-hand edge of the
hoodie and trousers. Measured: 31% of arm_l's edge pixels and 15% of body's
were magenta.

This pulls the blue out of those pixels with a SOFT, slightly blurred weight,
so the rim reads as one red light instead of noise. Alpha is untouched (the
three variants must keep identical alpha — check_layered_art / the layered cast
gate rely on it). Always reads the untouched backup, so it re-runs safely.

    python design/kingpin_rim_fix.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design/_legacy_assets/kingpin_layers_before_rimfix_20261001"
DST = ROOT / "static/assets/castLayers/turf/kingpin"

BASE = ROOT / "static/assets/castLayers/turf/base"


def soft_kingpin(rgba: np.ndarray) -> np.ndarray:
    """build_cast_parts.transform('kingpin') with the mask made soft.

    The generator's mask is `b > r*1.15 & b > g*1.08` — a step function, so
    neighbouring rim pixels flip between +95 red and nothing. Here the same
    test becomes a ramp, is blurred a little, and the blue is pulled down in
    proportion, so the rim is red rather than magenta.
    """
    a = rgba.astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    margin = np.minimum(b - r * 1.15, b - g * 1.08)
    w = np.clip((margin + 6) / 22, 0, 1)
    w = np.asarray(
        Image.fromarray((w * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))
    ).astype(np.float32) / 255
    out = a.copy()
    out[..., 0] = np.clip(r * 1.07 + w * 95, 0, 255)
    out[..., 1] = np.clip(g * 0.89 * (1 - 0.25 * w), 0, 255)
    out[..., 2] = np.clip(b * 0.82 * (1 - 0.7 * w), 0, 255)
    return out


for src in sorted(SRC.glob("*.png")):
    base = np.asarray(Image.open(BASE / src.name).convert("RGBA"))
    old = np.asarray(Image.open(src).convert("RGBA"))
    assert (base[..., 3] == old[..., 3]).all(), f"{src.name}: base and kingpin alpha differ"
    out = soft_kingpin(base)
    out[..., 3] = base[..., 3]
    out[base[..., 3] == 0, :3] = 0
    Image.fromarray(out.round().astype(np.uint8), "RGBA").save(DST / src.name, optimize=True)
    al = base[..., 3]
    mag = lambda x: ((np.minimum(x[..., 0], x[..., 2]).astype(int) - x[..., 1] > 30) & (al > 8)).sum()
    print(f"{src.name:18s} magenta px {mag(old):6d} -> {mag(out.round().astype(np.uint8)):6d}")
