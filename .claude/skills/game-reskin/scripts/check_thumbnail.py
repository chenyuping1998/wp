#!/usr/bin/env python3
"""Check store-thumbnail exposure at the platform review size."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def metrics(image: Image.Image) -> tuple[float, float, float]:
    pixels = image.convert("RGB").resize((200, 200), Image.Resampling.LANCZOS).getdata()
    values = sorted(0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in pixels)
    return sum(values) / len(values), values[int(len(values) * 0.10)], sum(v < 32 for v in values) / len(values)


def main() -> int:
    if len(sys.argv) not in (2, 3):
        print("usage: check_thumbnail.py BG [FG]", file=sys.stderr)
        return 2

    bg_path = Path(sys.argv[1])
    bg = Image.open(bg_path).convert("RGB")
    if bg.size != (1024, 1024):
        print(f"FAIL: BG must be 1024x1024, got {bg.size[0]}x{bg.size[1]}")
        return 1

    mean, p10, dark = metrics(bg)
    passed = mean >= 80 and p10 >= 35 and dark <= 0.30
    print(f"BG mean={mean:.1f} p10={p10:.1f} dark<32={dark:.1%} {'PASS' if passed else 'FAIL'}")

    if len(sys.argv) == 3:
        fg_source = Image.open(sys.argv[2])
        if "A" not in fg_source.mode:
            print(f"FAIL: FG must contain a genuine alpha channel, got mode {fg_source.mode}")
            return 1
        fg = fg_source.convert("RGBA")
        if fg.size != (1024, 1024):
            print(f"FAIL: FG must be 1024x1024, got {fg.size[0]}x{fg.size[1]}")
            return 1
        alpha = list(fg.getchannel("A").getdata())
        transparent = sum(value == 0 for value in alpha) / len(alpha)
        if transparent < 0.20:
            print(f"FAIL: FG has only {transparent:.1%} fully transparent pixels; expected a cutout layer")
            return 1
        print(f"FG mode=RGBA transparent={transparent:.1%} PASS (manually confirm hero-only/no text)")
        composite = Image.alpha_composite(bg.convert("RGBA"), fg)
        c_mean, c_p10, c_dark = metrics(composite)
        print(f"COMPOSITE mean={c_mean:.1f} p10={c_p10:.1f} dark<32={c_dark:.1%} (visual inspection still required)")

    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
