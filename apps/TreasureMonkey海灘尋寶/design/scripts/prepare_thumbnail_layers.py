#!/usr/bin/env python3
"""Convert ImageGen's neutral preview backdrop into alpha and build a QA composite."""

from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


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

    # ImageGen rendered a white/light-gray neutral checkerboard. Remove only the
    # light neutral region connected to the canvas edge; enclosed white artwork
    # such as shirts, eyes, and shoes must remain opaque.
    candidate = np.uint8((low > 210.0) & (chroma < 30.0)) * 255
    connected = Image.fromarray(candidate, mode="L")
    ImageDraw.floodfill(connected, (0, 0), 128, thresh=0)
    connected_array = np.asarray(connected)
    alpha = np.where(connected_array == 128, 0, 255).astype(np.uint8)
    alpha_image = Image.fromarray(alpha, mode="L")
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
