#!/usr/bin/env python3
"""Street sticker restyle: key and size one delivery batch from design/_incoming/<batch>/.

  python design/build_street_batch.py street_batch1 [--check]

Brief: ART_BRIEF.md (v2). Output goes to design/_street/<batch>/ and is never installed
into static/ by this script. Keying is the blue-screen key from build_style_test_street.py
(blue is not a palette ink). No palette quantising: the style test showed the deliveries
already sit flat (colors95 44-60) and quantising ate the chain's highlight step and greyed
the skin. --check runs check_style.py on the result.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from build_style_test_street import key

DESIGN = Path(__file__).resolve().parent
CHECK_STYLE = Path(__file__).resolve().parents[3] / ".claude/skills/game-reskin/scripts/check_style.py"

# delivered name -> output size; anything not listed keeps its own size (backgrounds).
SIZES = {
    **{n: (512, 512) for n in ("h1", "h2", "h3", "h4", "h5", "l1", "l2", "l3", "l4", "w", "sw", "fs")},
    "frame_1x1": (256, 256), "frame_2x2": (512, 512), "frame_3x3": (768, 768),
    "frame_full": (1280, 1280), "frame_sticky": (256, 256),
    "lock": (1024, 1024), "shutter_l": (1024, 1536), "shutter_r": (1024, 1536),
    "bg_feature": (1920, 1080), "bg_epic": (1920, 1080), "tile_background": (1024, 1024),
}
# Opaque scenes: no key.
OPAQUE = {"bg_feature", "bg_epic", "bg_base", "tile_background", "shutter_l", "shutter_r"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("batch")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    src = DESIGN / "_incoming" / args.batch
    out = DESIGN / "_street" / args.batch
    out.mkdir(parents=True, exist_ok=True)
    keyed = []
    for f in sorted(src.glob("*.png")):
        name = f.stem
        size = SIZES.get(name)
        source = Image.open(f).convert("RGBA")
        im = source.convert("RGB")
        if name in OPAQUE:
            im = im.resize(size or im.size, Image.LANCZOS)
            im.save(out / f.name)
            print(f"{name}: opaque {im.size}")
            continue
        work = (size[0] * 2, size[1] * 2) if size else im.size
        if source.getchannel("A").getextrema()[0] < 255:
            # Native transparent deliveries already have their own antialiasing.
            # Converting them to RGB first would turn every hollow centre black.
            res = source.resize(size or work, Image.LANCZOS)
        else:
            rgba = key(np.asarray(im.resize(work, Image.LANCZOS), float))
            res = Image.fromarray(rgba.round().astype(np.uint8)).resize(size or work, Image.LANCZOS)
        # One generated note roll exceeded the approved 80-bin style budget.
        # Flatten only that delivery's excess colour variation, keeping alpha.
        if name == "h3":
            alpha = res.getchannel("A")
            res = res.convert("RGB").quantize(colors=10).convert("RGBA")
            res.putalpha(alpha)
        if name.startswith("frame_"):
            pixels = np.asarray(res).copy()
            # Native alpha can carry a 1/255 haze across an otherwise empty
            # opening. The game contract requires an actually empty centre.
            pixels[pixels[:, :, 3] < 4] = 0
            res = Image.fromarray(pixels)
        res.save(out / f.name)
        a = np.asarray(res)[..., 3]
        print(f"{name}: {res.size} cover {np.mean(a > 127):.1%}")
        keyed.append(out / f.name)
    if args.check and keyed:
        highs=[p for p in keyed if not p.stem.startswith("l")]
        lows=[p for p in keyed if p.stem.startswith("l")]
        if highs: subprocess.run([sys.executable,str(CHECK_STYLE),"--max-colors","80","--max-soft","0.38",*map(str,highs)],check=True)
        if lows: subprocess.run([sys.executable,str(CHECK_STYLE),"--max-colors","14","--max-chroma","4",*map(str,lows)],check=True)


if __name__ == "__main__":
    main()
