#!/usr/bin/env python3
"""Gate: the shipped symbol cards keep the pay ladder readable by VALUE.

Wild Alchemy's symbols are full-bleed square cards (new-games/wild-alchemy/art/
symbols-final), so the ladder is carried by how bright each card is as a whole,
not by ink coverage on a transparent cell as in the Hard Time version of this
check. The thresholds are the style-frame numbers in ART_REQUEST.md §0.1:

    tablets (L1-L4)  mean luminance <= 80, and under every portrait
    portraits (H1-H4) 90-115
    Tower (S)         above every tablet by 15+
    WILD (4 cards)    mean >= 145, median >= 185, and above everything else

It measures the files assets.ts actually references (a newer file on disk that
is not shipped proves nothing), and fails if a card is not a full opaque square.
"""
import os
import re
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
REGISTRY = open(os.path.join(ROOT, "src", "game", "assets.ts"), encoding="utf-8").read()
KEYS = {
    "H1": "hmH1", "H2": "hmH2", "H3": "hmH3", "H4": "hmH4",
    "L1": "hmL1", "L2": "hmL2", "L3": "hmL3", "L4": "hmL4", "S": "hmS",
    "W_H1": "waWH1", "W_H2": "waWH2", "W_H3": "waWH3", "W_H4": "waWH4",
}


def shipped(key: str) -> str:
    m = re.search(key + r":\s*\{[^}]*?assets/sprites/([^']+\.png)'", REGISTRY, re.S)
    if not m:
        raise SystemExit(f"assets.ts has no sprite for {key}")
    return os.path.join(ROOT, "static", "assets", "sprites", m.group(1))


def measure(path: str):
    im = Image.open(path)
    rgba = np.asarray(im.convert("RGBA")).astype(float)
    opaque = (rgba[..., 3] > 250).mean()
    y = 0.2126 * rgba[..., 0] + 0.7152 * rgba[..., 1] + 0.0722 * rgba[..., 2]
    # the Tower badge has its own silhouette (house rule C6): weigh what is painted
    painted = rgba[..., 3] > 128
    y = y[painted] if opaque < 0.999 else y
    return im.size, opaque, float(y.mean()), float(np.median(y))


def main() -> None:
    rows = {name: measure(shipped(key)) + (shipped(key),) for name, key in KEYS.items()}
    fails = []
    for name, (size, opaque, mean, median, path) in rows.items():
        # every card is a full opaque square, except the Tower: the scatter is a badge
        # (star plate + SCATTER ribbon) precisely so it is NOT one more square card
        # (Stone 2026-11-11, house rule C6; design/scatter_badge/build_scatter_badge.py)
        if name == "S":
            if size[0] != size[1] or not 0.4 < opaque < 0.95:
                fails.append(f"S: expected the scatter badge, a square canvas with its own silhouette ({size}, {opaque:.3f} opaque)")
        elif size[0] != size[1] or opaque < 0.999:
            fails.append(f"{name}: not a full opaque square card ({size}, {opaque:.3f} opaque)")
    lows = {n: rows[n][2] for n in ("L1", "L2", "L3", "L4")}
    persons = {n: rows[n][2] for n in ("H1", "H2", "H3", "H4")}
    wilds = {n: rows[n] for n in ("W_H1", "W_H2", "W_H3", "W_H4")}
    for n, v in lows.items():
        if v > 80:
            fails.append(f"{n}: tablet too bright ({v:.1f} > 80)")
        if v >= min(persons.values()):
            fails.append(f"{n}: tablet as bright as a portrait ({v:.1f})")
    for n, v in persons.items():
        if not 90 <= v <= 115:
            fails.append(f"{n}: portrait outside 90-115 ({v:.1f})")
    if rows["S"][2] < max(lows.values()) + 15:
        fails.append(f"S: Tower not clear of the tablets ({rows['S'][2]:.1f})")
    others = max(max(persons.values()), rows["S"][2])
    for n, (size, opaque, mean, median, path) in wilds.items():
        if mean < 145 or median < 185:
            fails.append(f"{n}: WILD not bright enough (mean {mean:.1f}, median {median:.1f})")
        if mean <= others + 25:
            fails.append(f"{n}: WILD not clear of the other cards ({mean:.1f} vs {others:.1f})")
    for name, (size, opaque, mean, median, path) in rows.items():
        print(f"  {name:5s} mean {mean:6.1f}  median {median:6.1f}  {os.path.relpath(path, ROOT)}")
    if fails:
        print("FAIL: symbol value ladder")
        for f in fails:
            print("  - " + f)
        sys.exit(1)
    print("OK: 視覺重量與賠付階級一致 (tablets < portraits < Tower < WILD)")


if __name__ == "__main__":
    main()
