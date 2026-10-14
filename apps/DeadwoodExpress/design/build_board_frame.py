"""Build the reel housing (static/assets/deadwood/board_frame.png) from painted art.

Why: until 2026-09-30 the housing was pixi Graphics — two rounded rectangles
with a 5px and a 2px stroke, 1px grid lines and four dots for rivets. It is the
second-largest thing on screen and sat as flat vector next to painted art; the
third review tagged "Low quality assets" twice.

No image generator is available here, so the housing is made from the game's
own painted brass: the Buy Bonus plate (bonus_button.png), which already frames
the big-win / FG plaques (game/plate.ts).

  band     the plate's band CROSS-SECTION (outer bevel, brass, cyan lip) read
           off a straight stretch of its left side, swept along a rounded-
           rectangle distance field. Copying strips and corner blocks was tried
           first: the plate's band has notches and curves every few hundred px,
           so tiled copies showed a dashed lip and seams at every corner.
  grain    the plate's own brass surface, high-passed and mirror-tiled, laid
           back over the swept band so it is not a smooth gradient
  clasps   the plate's side clasp (left/right) and three-rivet clasp
           (bottom/top), pasted over the band as they are
  well     its dark teal inset, levelled, mirror-tiled behind the reels and
           darkened so the symbols keep their contrast

Geometry matches BoardFrame / CastFigureMesh / MultiplierWheel: the housing
reaches HOUSING_PAD = 24.5 units past the reel area on every side. Built for the
landscape board (scale 1.22, reels 720x576) at 2 px per unit; portrait (1.12)
differs in aspect by 0.2% and simply scales it.

Run: python3 design/build_board_frame.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "static/assets/deadwood/bonus_button.png"
OUT = HERE.parent / "static/assets/deadwood/board_frame.png"

# Plate measurements (source px). Left band: outer edge at x=24, brass to ~96,
# cyan lip to ~122, dark inset from 124: 100 px deep. Rows 795-855 are the
# cleanest stretch: below the side clasp, above the lip's notch (row scan).
BAND = 100
OUTER_X = 24
PROFILE_ROWS = (760, 800)
FEATHER = 6  # px of the outer anti-aliased edge kept outside OUTER_X
GRAIN = (230, 912, 440, 948)  # plain brass mid-band, clear of both bevels
SIDE_CLASP = (24, 585, 24 + BAND + 30, 740)
BOTTOM_CLASP = (462, 876, 786, 996)
WELL = (200, 520, 1040, 820)
CORNER_R = 130  # outer corner radius; the lip's inner radius is 30

PX_PER_UNIT = 2
PAD_UNITS = 24.5
REELS = (590 * 1.22, 472 * 1.22)
K = PAD_UNITS * PX_PER_UNIT / BAND  # source px -> output px


def blur1d(a, axis, radius):
    pad = [(0, 0)] * a.ndim
    pad[axis] = (radius, radius)
    p = np.pad(a, pad, mode="reflect")
    c = np.cumsum(p, axis=axis)
    c = np.concatenate([np.zeros_like(np.take(c, [0], axis=axis)), c], axis=axis)
    n = a.shape[axis]
    hi = np.take(c, np.arange(2 * radius + 1, 2 * radius + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return (hi - lo) / (2 * radius + 1)


def mirror_tile(img, w, h):
    """Fill w×h with img, mirroring alternate copies so edges always meet."""
    tw, th = img.size
    out = Image.new(img.mode, (w, h))
    for j in range(0, h, th):
        for i in range(0, w, tw):
            t = img
            if (i // tw) % 2:
                t = ImageOps.mirror(t)
            if (j // th) % 2:
                t = ImageOps.flip(t)
            out.paste(t, (i, j))
    return out


def rounded_rect_depth(w, h, r):
    """Distance inward from the outer edge of a w×h rounded rectangle."""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32) + 0.5
    qx = np.abs(x - w / 2) - (w / 2 - r)
    qy = np.abs(y - h / 2) - (h / 2 - r)
    outside = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0)
    return r - outside  # 0 on the outer edge, grows inward


def main():
    plate = Image.open(SRC).convert("RGBA")
    P = np.asarray(plate).astype(np.float32)

    inner_w = round(REELS[0] * PX_PER_UNIT / K)
    inner_h = round(REELS[1] * PX_PER_UNIT / K)
    W, H = inner_w + 2 * BAND, inner_h + 2 * BAND

    # cross-section: depth -FEATHER .. BAND, averaged over the straight rows
    x0 = OUTER_X - FEATHER
    profile = P[PROFILE_ROWS[0]:PROFILE_ROWS[1], x0:OUTER_X + BAND + 4].mean(axis=0)  # (n, 4)
    # premultiplied, so the anti-aliased outer edge interpolates cleanly
    prof_rgb = profile[:, :3] * (profile[:, 3:4] / 255)
    prof_a = profile[:, 3]

    depth = rounded_rect_depth(W, H, CORNER_R)
    idx = np.clip(depth + FEATHER, 0, len(profile) - 1.001)
    i0 = np.floor(idx).astype(int)
    f = (idx - i0)[..., None]
    rgb = prof_rgb[i0] * (1 - f) + prof_rgb[i0 + 1] * f
    alpha = prof_a[i0] * (1 - f[..., 0]) + prof_a[i0 + 1] * f[..., 0]
    alpha[depth < -FEATHER] = 0
    # past the lip the well shows through (fade over the last 4 px)
    alpha *= np.clip((BAND + 2 - depth) / 4, 0, 1)

    # grain: the plate's brass surface, high-passed (detail = lum / local mean)
    g = P[GRAIN[1]:GRAIN[3], GRAIN[0]:GRAIN[2], :3].mean(axis=2)
    # fine grain plus the mid-scale mottling of worn brass
    detail = g / np.maximum(blur1d(blur1d(g, 0, 14), 1, 14), 1) - 1
    detail_img = Image.fromarray(((detail * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8))
    tile = mirror_tile(detail_img, W, H)
    # a second, offset and turned copy breaks the tiling beat
    tile2 = mirror_tile(detail_img.rotate(90, expand=True), W, H)
    d = (np.asarray(tile).astype(np.float32) / 255 - 0.5) * 2
    d2 = (np.asarray(tile2).astype(np.float32) / 255 - 0.5) * 2
    grain = 0.6 * d + 0.4 * d2
    band_mask = (depth < BAND - 26).astype(np.float32)  # brass only, not the lip
    rgb = rgb * (1 + 1.1 * grain[..., None] * band_mask[..., None])

    band = np.dstack([rgb / np.maximum(alpha[..., None] / 255, 1e-3), alpha]).clip(0, 255)
    band = Image.fromarray(band.astype(np.uint8))

    # the well: level, mirror-tile, darken
    well = plate.crop(WELL)
    wa = np.asarray(well).astype(np.float32)
    lum = wa[..., :3]
    wa[..., :3] = lum / np.maximum(blur1d(blur1d(lum, 0, 60), 1, 60), 1) * lum.mean(axis=(0, 1))
    well = Image.fromarray(wa.clip(0, 255).astype(np.uint8))
    well = well.resize((well.size[0] * 2, well.size[1] * 2), Image.LANCZOS)
    well = mirror_tile(well, W, H)
    wa = np.asarray(well).astype(np.float32)
    wa[..., :3] *= 0.62
    well = Image.fromarray(wa.clip(0, 255).astype(np.uint8))
    inside = Image.fromarray(((depth > BAND - 30) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(well, (0, 0), inside)
    canvas.alpha_composite(band)

    # clasps, pasted as painted
    side = plate.crop(SIDE_CLASP)
    cy = (H - side.size[1]) // 2
    canvas.alpha_composite(side, (0, cy))
    canvas.alpha_composite(ImageOps.mirror(side), (W - side.size[0], cy))
    clasp = plate.crop(BOTTOM_CLASP)
    cx = (W - clasp.size[0]) // 2
    canvas.alpha_composite(clasp, (cx, H - BAND - 4))
    canvas.alpha_composite(ImageOps.flip(clasp), (cx, BAND + 4 - clasp.size[1]))

    out = canvas.resize((round(W * K), round(H * K)), Image.LANCZOS)
    out.save(OUT, optimize=True)
    print(f"{OUT.name}: {out.size[0]}x{out.size[1]} (pad {BAND * K:.1f}px = {PAD_UNITS} units)")


if __name__ == "__main__":
    main()
