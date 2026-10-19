"""The free-standing title (sushiV8/logo_board.png), 2026-10-18.

The user asked for the loading-page title without its board. The letters are
lifted off the old cream plate (kept in design/source/_pre_wordmark/) at the
SAME place on the same 1600x600 canvas, so the letter boxes the title's swing
animation is rigged to (meshWin/signs.ts) still fit, and finished as vintage
show-card lettering that stands on the stage art by itself:

  red letters with their own ink outline (as drawn)
  a cream outer line, then an ink outer line round the whole word
  a solid ink drop block down and right (one flat offset, screen-print style)
  a soft dark shadow under it all, so it separates from the red curtains

Nothing else — no plate, no bulbs, no badges. The loading screen puts a warm
spotlight pool behind it (LoadingScreen.svelte / FeatureIntro.svelte).

Run: python design/build_swing_wordmark.py
"""
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
OUT = APP / "static/assets/sprites/sushiV8/logo_board.png"
SRC = APP / "design/source/_pre_wordmark/logo_board.png"

CREAM = np.array([248, 232, 198], np.float32)
INK = np.array([36, 29, 28], np.float32)
REGION = (180, 222, 1440, 368)  # the lettering, clear of the plate's pins
CREAM_W, INK_W = 9, 7  # the outer lines, px on the 1600 canvas
DROP = (5, 12)  # the ink block's offset


def main():
    if not SRC.exists():
        SRC.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(OUT, SRC)
    src = np.asarray(Image.open(SRC).convert("RGBA")).astype(np.float32)
    h, w = src.shape[:2]
    x0, y0, x1, y1 = REGION

    # the letters: anything in the lettering band that is not the plate's cream
    dist = np.linalg.norm(src[..., :3] - CREAM, axis=-1)
    a = np.clip((dist - 12) / 70, 0, 1)
    band = np.zeros((h, w), bool)
    band[y0:y1, x0:x1] = True
    a[~band] = 0
    # un-mix the cream from the anti-aliased rim so no pale fringe is left:
    # colour = (p - (1-a) cream) / a
    rgb = src[..., :3].copy()
    k = np.maximum(a, 1e-3)[..., None]
    rgb = np.clip((rgb - (1 - k) * CREAM) / k, 0, 255)
    rgb[a < 0.02] = INK

    solid = a > 0.5
    filled = ndimage.binary_fill_holes(solid)  # closed counters stay cream, inside the word
    edt = ndimage.distance_transform_edt(~filled)

    def ring(r):
        """a soft-edged dilation of the word by r px"""
        return np.clip(r + 0.5 - edt, 0, 1)

    cream = ring(CREAM_W)
    outer = ring(CREAM_W + INK_W)
    drop = ndimage.shift(outer, (DROP[1], DROP[0]), order=1)

    def over(dst, colour, alpha):
        d_a = dst[..., 3:4] / 255
        s_a = alpha[..., None]
        o_a = s_a + d_a * (1 - s_a)
        dst[..., :3] = np.where(o_a > 0, (colour * s_a + dst[..., :3] * d_a * (1 - s_a)) / np.maximum(o_a, 1e-6), 0)
        dst[..., 3:4] = o_a * 255

    out = np.zeros((h, w, 4), np.float32)
    shadow = np.asarray(Image.fromarray((np.maximum(outer, drop) * 255).astype(np.uint8))
                        .filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
    shadow = ndimage.shift(shadow, (16, 6), order=1)
    over(out, np.array([10, 4, 4], np.float32), shadow * 0.55)
    over(out, INK, drop)
    over(out, INK, outer)
    over(out, CREAM, cream)
    over(out, rgb, a)
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(OUT, optimize=True)
    ys, xs = np.nonzero(out[..., 3] > 8)
    print("wrote", OUT.relative_to(APP), "ink bbox", xs.min(), ys.min(), xs.max(), ys.max())


if __name__ == "__main__":
    main()
