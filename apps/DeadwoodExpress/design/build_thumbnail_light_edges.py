"""Thumbnail with no dark mass on its border.

Stake review, 2026-10-04: "please ensure that the thumbnail does not contain
dark elements around its borders, so it remains clearly visible and visually
separated from the site background." The station roof filled the top-left
corner and the conductor's black coat ran off the bottom and left edges.

The BG gets a mist veil along every edge (the scene is a fog-bound platform,
so mist is the natural thing to be there), heaviest over the roof corner. The
FG conductor dissolves into that mist toward the bottom and left edges — a
ghost fading out at his feet rather than a crop line.

Input:  design/_thumb/original/DeadwoodExpress-{BG,FG}.png  (the 09-22 tiles)
Output: design/_thumb/DeadwoodExpress-{BG,FG}.png, plus a composite preview.
Run:    python3 design/build_thumbnail_light_edges.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
SRC = HERE / "_thumb" / "original"
OUT = HERE / "_thumb"

MIST = np.array([226, 220, 208], dtype=np.float32)  # the sky's own haze, sampled by eye


def smooth(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)


def edge_mask(h, w, widths):
    """1 at the border, 0 inside; widths = (top, right, bottom, left) in px."""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    top, right, bottom, left = widths
    parts = [
        1 - smooth(y / top),
        1 - smooth((w - 1 - x) / right),
        1 - smooth((h - 1 - y) / bottom),
        1 - smooth(x / left),
    ]
    m = np.zeros((h, w), np.float32)
    for p in parts:
        m = 1 - (1 - m) * (1 - p)
    return m


def corner_blob(h, w, cx, cy, rx, ry):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    return 1 - smooth(d)


def main():
    bg = np.asarray(Image.open(SRC / "DeadwoodExpress-BG.png").convert("RGB"), np.float32)
    fg = np.asarray(Image.open(SRC / "DeadwoodExpress-FG.png").convert("RGBA"), np.float32)
    h, w = bg.shape[:2]
    s = w / 1024

    # BG: veil along all edges + the roof corner.
    veil = edge_mask(h, w, (150 * s, 150 * s, 170 * s, 190 * s))
    veil = 1 - (1 - veil) * (1 - 0.95 * corner_blob(h, w, 0, 0, 470 * s, 380 * s))
    veil = 1 - (1 - veil) * (1 - 0.6 * corner_blob(h, w, 0, h, 330 * s, 300 * s))
    veil = np.clip(veil * 0.9, 0, 1)[..., None]
    bg_out = bg * (1 - veil) + MIST * veil

    # FG: the conductor fades out toward bottom and left, and a touch on the
    # right where the scarf trails off.
    fade = edge_mask(h, w, (1, 70 * s, 260 * s, 150 * s))
    fade = np.clip(fade * 1.05, 0, 1)
    fg_out = fg.copy()
    fg_out[..., 3] = fg[..., 3] * (1 - fade)

    OUT.mkdir(exist_ok=True)
    Image.fromarray(bg_out.round().astype(np.uint8)).save(OUT / "DeadwoodExpress-BG.png", optimize=True)
    Image.fromarray(fg_out.round().astype(np.uint8)).save(OUT / "DeadwoodExpress-FG.png", optimize=True)

    comp = Image.fromarray(bg_out.round().astype(np.uint8)).convert("RGBA")
    comp.alpha_composite(Image.fromarray(fg_out.round().astype(np.uint8)))
    comp.convert("RGB").save(OUT / "_preview.jpg", quality=88)

    # Border report: mean luminance of a 32px ring, before and after.
    def ring_lum(img):
        a = np.asarray(img.convert("L"), np.float32)
        b = int(32 * s)
        ring = np.concatenate([a[:b].ravel(), a[-b:].ravel(), a[:, :b].ravel(), a[:, -b:].ravel()])
        return ring.mean(), np.percentile(ring, 5)

    before = Image.fromarray(bg.astype(np.uint8)).convert("RGBA")
    before.alpha_composite(Image.fromarray(fg.astype(np.uint8)))
    print("border ring luminance mean/p5  before %.0f/%.0f  after %.0f/%.0f" % (*ring_lum(before), *ring_lum(comp)))
    for f in ("DeadwoodExpress-BG.png", "DeadwoodExpress-FG.png"):
        print(f, (OUT / f).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
