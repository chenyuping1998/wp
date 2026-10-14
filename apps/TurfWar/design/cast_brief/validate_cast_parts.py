"""Acceptance checks for the three aligned cast deliveries."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops
from psd_tools import PSDImage
from scipy.ndimage import distance_transform_edt, label

ROOT = Path(__file__).resolve().parent.parent / "cast_parts"
VARIANTS = ("base", "feature", "kingpin")
NAMES = ("body", "arm_r", "prop_bat", "arm_l", "head", "dangle_chain", "dangle_mask", "fingers_r")
SIZE = (1024, 2048)


def alpha(folder, name):
    return np.asarray(Image.open(folder / f"{name}.png").getchannel("A"))


def main():
    base_alpha = {}
    for variant in VARIANTS:
        folder = ROOT / variant
        meta = json.loads((folder / "layers.json").read_text())
        assert set(meta["order"]) == set(NAMES)
        full = Image.open(folder / "full.png").convert("RGBA")
        assert full.size == SIZE
        assert full.getbbox()[1] == 176 and full.getbbox()[3] == 1674
        result = Image.new("RGBA", SIZE)
        for name in meta["order"]:
            part = Image.open(folder / f"{name}.png").convert("RGBA")
            assert part.size == SIZE
            result.alpha_composite(part)
            a = alpha(folder, name)
            if variant == "base":
                base_alpha[name] = a
            else:
                assert np.array_equal(base_alpha[name], a), f"variant alpha differs: {variant}/{name}"
        assert ImageChops.difference(result, full).getbbox() is None
        psd = PSDImage.open(folder / "cast.psd")
        assert psd.size == SIZE
        assert [layer.name for layer in psd] == list(meta["order"])
        for layer in psd:
            png = Image.open(folder / f"{layer.name}.png").convert("RGBA")
            assert ImageChops.difference(layer.topil().convert("RGBA"), png).getbbox() is None
        print(f"{variant}: PNG, PSD, and alpha parity OK")

    folder = ROOT / "base"
    body = alpha(folder, "body") > 127
    head = alpha(folder, "head") > 127
    bat = alpha(folder, "prop_bat") > 127
    arm_l = alpha(folder, "arm_l") > 127
    arm_r = alpha(folder, "arm_r") > 127
    bat_gap = float(distance_transform_edt(~head)[bat].min())
    assert bat_gap >= 60, f"bat-head separation {bat_gap:.1f}px"
    gaps = []
    for y in range(850, 1001):
        bx = np.where(body[y] & (np.arange(SIZE[0]) > 600))[0]
        ax = np.where(arm_l[y])[0]
        if len(bx) and len(ax):
            gaps.append(int(ax.min() - bx.max() - 1))
    assert min(gaps) >= 48, f"free forearm gap {min(gaps)}px"
    for side, arm, pivot in (("r", arm_r, (459, 465)), ("l", arm_l, (750, 474))):
        x, y = pivot
        overlap = body[y - 60:y + 80, x - 100:x + 100] & arm[y - 60:y + 80, x - 100:x + 100]
        widths = [int(np.ptp(np.where(row)[0]) + 1) for row in overlap if row.any()]
        assert widths and max(widths) >= 40, f"{side} shoulder overlap under 40px"
    neck_overlap = body & head
    assert np.ptp(np.where(neck_overlap)[0]) + 1 >= 30
    pieces, count = label(bat)
    sizes = np.bincount(pieces.ravel())[1:]
    assert count and sizes.max() / bat.sum() > 0.995, "bat has detached pixels"
    print(f"geometry: bat-head {bat_gap:.1f}px, free-arm gap {min(gaps)}px, shoulders/neck overlap OK")


if __name__ == "__main__":
    main()
