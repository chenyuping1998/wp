#!/usr/bin/env python3
"""Measure how closely delivered art holds the art direction it was briefed with.

"Keep to the palette", "flat fills", "black and white with one accent" are the
rules generated art drifts off first, and the drift is what makes a set read
as image-model output: soft airbrushed gradients everywhere, hundreds of
near-identical colours, a stray hue the brief never named. Each of those is a
number, so measure it instead of eyeballing a contact sheet.

Metrics, over opaque pixels only (alpha >= 128), at a fixed working size:

  colors95   how many 4-bit-per-channel colour bins (of 4096) it takes to
             cover 95% of the pixels. Flat, print and ink styles sit low;
             rendered/airbrushed art sits high.
  soft       share of pixels on a gentle luminance slope (Sobel magnitude
             between --flat and --edge): airbrushed shading. Flat fills are
             ~0 slope, ink lines and cel edges are steep; soft is what's left.
  chroma     mean Lab chroma of non-accent pixels. Black-and-white styles
             need this near zero.
  fit        share of pixels within --tol (Lab distance) of a --palette
             colour. Only reported when a palette is given.
  accent     share of pixels within --tol of an --accent colour, gated by
             that accent's area cap.

Every threshold is optional. Without one the script only reports, and the
usual workflow is: measure the approved style frame, write its numbers into
the brief's section 0, then gate every later asset against them.

--sheet OUT.png also writes a contact sheet with every image at 180 px (a
desktop reel cell), at 70 px (a portrait phone cell) and at 70 px in
greyscale (the pay-ladder value check). Look at the 70 px columns: fine
hatching, halftone and micro-detail that only work at 512 px turn to grey
noise there, and that noise is itself one of the things that reads as
image-model output.

usage:
  check_style.py [--palette HEX,...] [--accent HEX:MAXSHARE ...]
                 [--max-colors N] [--max-soft F] [--max-chroma F]
                 [--min-fit F] [--tol F] [--sheet OUT.png] IMAGE [IMAGE ...]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

WORK = 512


def srgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ np.array(
        [[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]]
    )
    xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack(
        [116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])],
        axis=-1,
    )


def hex_lab(value: str) -> np.ndarray:
    value = value.strip().lstrip("#")
    return srgb_to_lab(np.array([[int(value[i : i + 2], 16) for i in (0, 2, 4)]], dtype=float))[0]


def load(path: Path) -> tuple[np.ndarray, np.ndarray]:
    image = Image.open(path).convert("RGBA")
    image.thumbnail((WORK, WORK), Image.Resampling.LANCZOS)
    data = np.asarray(image, dtype=float)
    return data[..., :3], data[..., 3] >= 128


def slope(rgb: np.ndarray) -> np.ndarray:
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
    p = np.pad(lum, 1, mode="edge")
    gx = (p[:-2, 2:] + 2 * p[1:-1, 2:] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[1:-1, :-2] + p[2:, :-2])
    gy = (p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[:-2, 1:-1] + p[:-2, 2:])
    return np.hypot(gx, gy) / 4


def colors95(pixels: np.ndarray) -> int:
    bins = (pixels.astype(int) >> 4) @ np.array([256, 16, 1])
    counts = np.sort(np.bincount(bins, minlength=4096))[::-1]
    return int(np.searchsorted(np.cumsum(counts), 0.95 * counts.sum()) + 1)


def contact_sheet(paths: list[Path], out: Path) -> None:
    big, small, pad = 180, 70, 10
    width = pad + big + pad + small + pad + small + pad
    sheet = Image.new("RGB", (width, pad + len(paths) * (big + pad)), (24, 24, 28))
    for row, path in enumerate(paths):
        image = Image.open(path).convert("RGBA")
        y = pad + row * (big + pad)
        x = pad
        for size, grey in ((big, False), (small, False), (small, True)):
            tile = image.copy()
            tile.thumbnail((size, size), Image.Resampling.LANCZOS)
            if grey:
                alpha = tile.getchannel("A")
                tile = tile.convert("L").convert("RGBA")
                tile.putalpha(alpha)
            sheet.paste(tile, (x + (size - tile.width) // 2, y + (size - tile.height) // 2), tile)
            x += size + pad
    sheet.save(out)
    print(f"sheet: {out}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("images", nargs="+", type=Path)
    ap.add_argument("--palette", help="comma-separated hex colours from the brief's section 0")
    ap.add_argument("--accent", action="append", default=[], help="HEX:MAXSHARE, e.g. '#B22222:0.08'")
    ap.add_argument("--tol", type=float, default=14.0, help="Lab distance counted as on-palette (default 14)")
    ap.add_argument("--flat", type=float, default=2.0, help="slope at or below this is a flat fill")
    ap.add_argument("--edge", type=float, default=24.0, help="slope at or above this is a line/edge")
    ap.add_argument("--max-colors", type=int)
    ap.add_argument("--max-soft", type=float)
    ap.add_argument("--max-chroma", type=float)
    ap.add_argument("--min-fit", type=float)
    ap.add_argument("--sheet", type=Path, help="also write a 180/70/70-grey px contact sheet here")
    args = ap.parse_args()

    palette = np.array([hex_lab(h) for h in args.palette.split(",")]) if args.palette else None
    accents = []
    for spec in args.accent:
        colour, _, cap = spec.partition(":")
        accents.append((colour, hex_lab(colour), float(cap) if cap else 1.0))

    failed = False
    for path in args.images:
        rgb, opaque = load(path)
        if not opaque.any():
            print(f"{path}: no opaque pixels")
            failed = True
            continue
        pixels = rgb[opaque]
        lab = srgb_to_lab(pixels)
        s = slope(rgb)[opaque]
        soft = float(((s > args.flat) & (s < args.edge)).mean())
        n95 = colors95(pixels)

        is_accent = np.zeros(len(lab), dtype=bool)
        parts = [f"colors95={n95}", f"soft={soft:.1%}"]
        problems = []
        for name, target, cap in accents:
            hit = np.linalg.norm(lab - target, axis=1) <= args.tol
            is_accent |= hit
            share = float(hit.mean())
            parts.append(f"accent{name}={share:.1%}")
            if share > cap:
                problems.append(f"accent {name} {share:.1%} > {cap:.1%}")

        rest = lab[~is_accent]
        chroma = float(np.hypot(rest[:, 1], rest[:, 2]).mean()) if len(rest) else 0.0
        parts.append(f"chroma={chroma:.1f}")

        if palette is not None:
            nearest = np.min(np.linalg.norm(lab[:, None, :] - palette[None, :, :], axis=2), axis=1)
            fit = float(((nearest <= args.tol) | is_accent).mean())
            parts.append(f"fit={fit:.1%}")
            if args.min_fit is not None and fit < args.min_fit:
                problems.append(f"fit {fit:.1%} < {args.min_fit:.1%}")

        if args.max_colors is not None and n95 > args.max_colors:
            problems.append(f"colors95 {n95} > {args.max_colors}")
        if args.max_soft is not None and soft > args.max_soft:
            problems.append(f"soft {soft:.1%} > {args.max_soft:.1%}")
        if args.max_chroma is not None and chroma > args.max_chroma:
            problems.append(f"chroma {chroma:.1f} > {args.max_chroma:.1f}")

        verdict = "FAIL: " + "; ".join(problems) if problems else "PASS"
        print(f"{path}: {' '.join(parts)} {verdict}")
        failed |= bool(problems)

    if args.sheet:
        contact_sheet(args.images, args.sheet)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
