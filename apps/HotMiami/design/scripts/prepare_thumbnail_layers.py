#!/usr/bin/env python3
"""Convert ImageGen's neutral preview backdrop into alpha and build a QA composite."""

from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageFilter


def main() -> None:
    if len(sys.argv) != 5:
        raise SystemExit("usage: prepare_thumbnail_layers.py FG_PREVIEW BG OUT_FG OUT_COMPOSITE")

    fg_path, bg_path, out_fg_path, out_composite_path = map(Path, sys.argv[1:])
    fg = Image.open(fg_path).convert("RGB")
    bg = Image.open(bg_path).convert("RGB")
    if fg.size != bg.size:
        raise SystemExit(f"layer dimensions differ: foreground={fg.size}, background={bg.size}")

    rgb = np.asarray(fg, dtype=np.float32)
    low = rgb.min(axis=2)
    chroma = rgb.max(axis=2) - low

    # ImageGen rendered a white/light-gray neutral checkerboard. Character pixels
    # are either substantially darker or strongly saturated, so both signals are
    # combined to retain anti-aliased ink while clearing the neutral backdrop.
    dark_signal = np.clip((230.0 - low) / 28.0, 0.0, 1.0)
    color_signal = np.clip((chroma - 10.0) / 28.0, 0.0, 1.0)
    alpha = np.maximum(dark_signal, color_signal)
    alpha[alpha < 0.10] = 0.0
    alpha_image = Image.fromarray(np.uint8(np.round(alpha * 255)), mode="L")
    alpha_image = alpha_image.filter(ImageFilter.GaussianBlur(radius=0.45))

    # Remove the light matte from partially transparent edge pixels so the
    # cutout does not acquire a white fringe over the dark poster background.
    a = np.asarray(alpha_image, dtype=np.float32) / 255.0
    safe_a = np.maximum(a, 1.0 / 255.0)[..., None]
    matte = np.full_like(rgb, 246.0)
    unpremultiplied = (rgb - (1.0 - a[..., None]) * matte) / safe_a
    unpremultiplied = np.uint8(np.clip(unpremultiplied, 0.0, 255.0))

    rgba = Image.fromarray(unpremultiplied, mode="RGB").convert("RGBA")
    rgba.putalpha(alpha_image)
    rgba.save(out_fg_path)

    composite = bg.convert("RGBA")
    composite.alpha_composite(rgba)
    composite.convert("RGB").save(out_composite_path)


if __name__ == "__main__":
    main()
