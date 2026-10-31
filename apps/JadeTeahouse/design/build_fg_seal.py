"""The free-spin count's cinnabar seal (sushiV8/fg_seal.png), 2026-10-31.

The intro board used to print the count as a thin dark number floating on
empty paper, which read as unfinished (user: "太粗糙"). In a teahouse the
mark that says "granted" is a chop: a cinnabar seal pressed onto the paper.
The count is set in it by the game (FreeSpinIntro.svelte), cream on red.

  a rounded square of cinnabar, its edge broken the way a stone seal prints
  a fine inner border line in the paper's colour
  ink starvation: pale speckles and one dry streak, so it is pressed, not drawn

Run: python design/build_fg_seal.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
OUT = APP / "static/assets/sprites/sushiV8/fg_seal.png"
N = 512
SS = 2
INK = np.array([176, 38, 30], np.float32)
DEEP = np.array([128, 22, 20], np.float32)


def rounded(size, box, r):
    m = Image.new("L", (size, size))
    ImageDraw.Draw(m).rounded_rectangle(box, r, fill=255)
    return np.asarray(m, np.float32) / 255


def main():
    rng = np.random.default_rng(11)
    S = N * SS
    body = rounded(S, (40 * SS, 40 * SS, (N - 40) * SS, (N - 40) * SS), 46 * SS)
    # a broken, stone-printed edge: erode the outline with low-frequency noise
    coarse = ndimage.gaussian_filter(rng.standard_normal((S, S)), 9 * SS)
    fine = ndimage.gaussian_filter(rng.standard_normal((S, S)), 1.5 * SS)
    edge_noise = coarse / np.abs(coarse).max() + 0.5 * fine / np.abs(fine).max()
    soft = ndimage.gaussian_filter(body, 4 * SS)
    body = np.clip((soft - 0.5 + 0.3 * edge_noise) * 10, 0, 1)
    # the inner border: a paper-coloured line just inside the edge
    ring = rounded(S, (66 * SS, 66 * SS, (N - 66) * SS, (N - 66) * SS), 30 * SS) - rounded(
        S, (76 * SS, 76 * SS, (N - 76) * SS, (N - 76) * SS), 24 * SS
    )
    breaks = ndimage.gaussian_filter(rng.standard_normal((S, S)), 5 * SS)
    ring = np.clip(ring, 0, 1) * np.clip(0.4 + 6 * breaks / np.abs(breaks).max(), 0, 1)
    alpha = body * (1 - ring)
    # ink starvation: speckles and one dry diagonal streak
    sp = ndimage.gaussian_filter(rng.standard_normal((S, S)), 1.2 * SS)
    speck = np.clip((sp / sp.std() - 2.1) * 1.5, 0, 1)
    yy, xx = np.mgrid[0:S, 0:S] / S
    streak = np.exp(-(((xx * 0.8 + yy - 1.15) / 0.035) ** 2)) * (ndimage.gaussian_filter(rng.standard_normal((S, S)), 3 * SS) > 0.2)
    alpha = alpha * (1 - 0.85 * speck) * (1 - 0.55 * streak)
    # colour: cinnabar, a touch deeper where the press was heavy
    press = ndimage.gaussian_filter(rng.standard_normal((S, S)), 40 * SS)
    press = (press - press.min()) / (press.max() - press.min())
    rgb = INK * (1 - 0.35 * press[..., None]) + DEEP * 0.35 * press[..., None]
    # the paste's own grain
    grain = ndimage.gaussian_filter(rng.standard_normal((S, S)), 0.8 * SS)
    rgb = rgb * (1 + 0.05 * grain / grain.std())[..., None]
    alpha = alpha * np.clip(0.94 + 0.06 * grain / grain.std(), 0, 1)
    img = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8), "RGBA")
    img = img.resize((N, N), Image.Resampling.LANCZOS).filter(ImageFilter.SMOOTH)
    img.save(OUT)
    print("wrote", OUT.relative_to(APP))


if __name__ == "__main__":
    main()
