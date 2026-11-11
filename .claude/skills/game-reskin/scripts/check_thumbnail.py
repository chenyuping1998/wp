#!/usr/bin/env python3
"""Check store-art exposure — the square thumbnail AND the wide cover — at review size.

    check_thumbnail.py BG [FG]              one layer pair (1024x1024 thumbnail or 1920x1080 cover)
    check_thumbnail.py --upload upload/<Game>   every *-BG.png (+ matching FG) under thumbnail/ and cover/

Neither may be dark. On 2026-10-11 the platform answered Turf War's cover
(BG mean luma 18) with "Your background image was too dark, so we automatically
lightened it by 35%" — it rewrote the art instead of rejecting it, so the dark
upload only showed up as a washed-out banner. The cover was never checked: this
script used to accept 1024x1024 only.

Hard gate (FAIL): mean >= 80 and pixels below 32 <= 30%.
Warnings: mean < 100 (house margin), 10th percentile < 35 (fine for deliberate
black shapes — Capo's Deco skyline measures p10 18 at mean 165 — but look at it).
The platform's own threshold is not published; every store image that went
through unchanged so far measured mean 83-224.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

SIZES = {(1024, 1024): "thumbnail", (1920, 1080): "cover"}
MIN_MEAN, MIN_P10, MAX_DARK, WARN_MEAN = 80, 35, 0.30, 100


def metrics(image: Image.Image) -> tuple[float, float, float]:
    w, h = image.size
    small = image.convert("RGB").resize((round(200 * w / h), 200), Image.Resampling.LANCZOS)
    values = sorted(0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in small.getdata())
    return sum(values) / len(values), values[int(len(values) * 0.10)], sum(v < 32 for v in values) / len(values)


def check_pair(bg_path: Path, fg_path: Path | None) -> bool:
    bg = Image.open(bg_path).convert("RGB")
    kind = SIZES.get(bg.size)
    if kind is None:
        print(f"FAIL {bg_path}: BG must be 1024x1024 (thumbnail) or 1920x1080 (cover), got {bg.size[0]}x{bg.size[1]}")
        return False

    mean, p10, dark = metrics(bg)
    passed = mean >= MIN_MEAN and dark <= MAX_DARK
    warns = [w for w, hit in (("mean under the house margin of 100", mean < WARN_MEAN),
                              ("10th percentile under 35 — deliberate black shapes?", p10 < MIN_P10)) if hit]
    verdict = ("FAIL — too dark, the platform will auto-lighten it" if not passed
               else "WARN — " + "; ".join(warns) if warns else "PASS")
    print(f"{kind} BG {bg_path}: mean={mean:.1f} p10={p10:.1f} dark<32={dark:.1%} {verdict}")

    if fg_path is not None:
        fg_source = Image.open(fg_path)
        if "A" not in fg_source.mode:
            print(f"FAIL {fg_path}: FG must contain a genuine alpha channel, got mode {fg_source.mode}")
            return False
        fg = fg_source.convert("RGBA")
        if fg.size != bg.size:
            print(f"FAIL {fg_path}: FG must match BG ({bg.size[0]}x{bg.size[1]}), got {fg.size[0]}x{fg.size[1]}")
            return False
        alpha = list(fg.getchannel("A").getdata())
        transparent = sum(value == 0 for value in alpha) / len(alpha)
        if transparent < 0.20:
            print(f"FAIL {fg_path}: only {transparent:.1%} fully transparent pixels; expected a cutout layer")
            return False
        composite = Image.alpha_composite(bg.convert("RGBA"), fg)
        c_mean, c_p10, c_dark = metrics(composite)
        print(f"{kind} FG transparent={transparent:.1%}; COMPOSITE mean={c_mean:.1f} p10={c_p10:.1f} "
              f"dark<32={c_dark:.1%} (visual inspection still required)")
    return passed


def main() -> int:
    args = sys.argv[1:]
    if len(args) == 2 and args[0] == "--upload":
        root = Path(args[1])
        pairs = []
        for bg in sorted(list(root.glob("thumbnail/*-BG.png")) + list(root.glob("cover/*-BG.png"))):
            fg = bg.with_name(bg.name.replace("-BG.png", "-FG.png"))
            pairs.append((bg, fg if fg.exists() else None))
        if not pairs:
            print(f"FAIL: no thumbnail/*-BG.png or cover/*-BG.png under {root}")
            return 1
        if not any("cover" in str(bg) for bg, _ in pairs):
            print(f"FAIL: {root} has no cover/ — every game ships one (packaging.md §6b)")
            return 1
        results = [check_pair(bg, fg) for bg, fg in pairs]
        return 0 if all(results) else 1
    if len(args) not in (1, 2):
        print(__doc__, file=sys.stderr)
        return 2
    return 0 if check_pair(Path(args[0]), Path(args[1]) if len(args) == 2 else None) else 1


if __name__ == "__main__":
    raise SystemExit(main())
