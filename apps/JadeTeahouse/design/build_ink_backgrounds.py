"""The teahouse backgrounds redrawn in Sushi Monkey's ink style (2026-11-01).

User: the full-colour teahouse sat too close to the board (the same celadon,
the same density everywhere), and the scene should look like Sushi Monkey's:
black ink line work and halftone on cream paper, detail gathered at the
sides, the middle thinning out to blank paper where the board stands, and
colour only as a small accent.

Not regenerated - the same paintings, converted, so every prop sits where the
background mesh rigs (src/game/meshWin/bgProps.ts) were measured:

  1. ink lines: difference-of-Gaussians on luminance, thresholded softly
  2. tone: the luminance as a 45-degree halftone dot screen (cell 7px)
  3. paper: Sushi Monkey's own cream paper colour and grain
  4. the middle fades to paper behind the board (soft-edged), keeping only a
     whisper of the line work so the floor perspective still reads
  5. no colour at all: an earlier pass inked the lanterns vermilion and kept
     the gold ribbons; the user found both stuck on and out of style
  7. the free-game plate is the same room AT NIGHT (user: the two plates must
     differ): a coarse second dot screen darkens it, and the lanterns and wall
     lamps are lit as bare paper glowing out through thinning dots
  6. the free-game plate is converted from the BASE painting: the feature
     painting's floating gold ribbons and mid-air petals do not belong in an
     ink drawing, and are gone with it

Originals: design/source/_pre_ink_bg/ (copied on the first run; the script
always reads from there).

Run: python design/build_ink_backgrounds.py
"""

import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
BG = APP / "static/assets/sprites/sushiBackground"
KEEP = APP / "design/source/_pre_ink_bg"
NAMES = ["bg_base", "bg_feature"]
PAPER = np.array([246, 240, 226], np.float32)
INK = np.array([34, 30, 28], np.float32)
CELL = 7
# the lights that are lit at night, plate px: the four hanging lanterns'
# bodies (as bgProps.ts measures them) and the two wall lamps beside the
# mountain windows - centre x, centre y, radius of the pool of light
LIGHTS = [(478, 64, 150), (586, 136, 120), (1335, 138, 120), (1441, 58, 150), (210, 430, 110), (1706, 430, 110)]


def halftone(tone, cell=CELL, angle=np.pi / 4):
    """tone 0 (paper) .. 1 (solid ink) -> coverage of a rotated dot screen."""
    h, w = tone.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    u = (xx * np.cos(angle) + yy * np.sin(angle)) / cell
    v = (-xx * np.sin(angle) + yy * np.cos(angle)) / cell
    du, dv = u - np.round(u), v - np.round(v)
    d = np.sqrt(du * du + dv * dv)  # 0 at the dot centre .. ~0.7 at the corner
    r = np.sqrt(np.clip(tone, 0, 1) / np.pi)  # dot radius for that coverage
    return np.clip((r - d) * cell * 1.2 + 0.5, 0, 1)


def convert(src, night=False):
    rgb = np.asarray(src.convert("RGB"), np.float32)
    h, w = rgb.shape[:2]
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32) / 255
    # 1. line work
    dog = ndimage.gaussian_filter(lum, 1.0) - ndimage.gaussian_filter(lum, 2.6)
    lines = np.clip((-dog - 0.012) * 22, 0, 1)
    lines = np.maximum(lines, np.clip((0.22 - lum) * 4, 0, 1))  # solid darks stay solid
    # 2. tone as halftone: only the mid and dark values carry dots
    tone = np.clip((0.86 - ndimage.gaussian_filter(lum, 1.2)) * 1.15, 0, 1) ** 1.25
    dots = halftone(tone * 0.75)
    # 4. the middle thins out to paper (where the board stands): an ellipse of
    # calm, soft edged, deepest a little above centre
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ex = (xx - w * 0.5) / (w * 0.3)
    ey = (yy - h * 0.48) / (h * 0.56)
    calm = np.clip(1.35 - np.sqrt(ex * ex + ey * ey), 0, 1)
    calm = ndimage.gaussian_filter(calm, 30) ** 0.8
    line_keep = 1 - 0.9 * calm
    dot_keep = 1 - 0.97 * calm
    ink = np.clip(lines * line_keep + dots * 0.55 * dot_keep, 0, 1)
    if night:
        # 7. NIGHT (the free spins): the same room after dark, still only ink
        # on paper. A second, coarser dot screen lays the dark over everything
        # (heaviest at the edges and up in the eaves), and light is shown the
        # way print shows it - as paper left bare: the four lanterns and the
        # two wall lamps are lit, each a pool of unprinted paper fading out
        # through thinning dots. The middle stays pale for the board.
        lit = np.zeros((h, w), np.float32)
        for cx, cy, r in LIGHTS:
            d = np.hypot(xx - cx, yy - cy) / r
            lit = np.maximum(lit, np.clip(1.25 - d, 0, 1) ** 1.6)
        edge = np.clip(np.hypot((xx - w * 0.5) / (w * 0.5), (yy - h * 0.55) / (h * 0.62)) - 0.35, 0, 1)
        dark = (0.22 + 0.36 * edge + 0.12 * (1 - yy / h)) * (1 - 0.85 * calm) * (1 - lit)
        night_dots = halftone(np.clip(dark, 0, 1), cell=6, angle=np.pi / 12) * 0.8
        # the line work stays on top (only the dots and tone thin in the light)
        ink = np.clip(np.maximum(lines * line_keep, (ink - lines * line_keep) * (1 - 0.8 * lit) + night_dots), 0, 1)
    # 3. paper with a little grain
    grain = ndimage.gaussian_filter(np.random.default_rng(5).standard_normal((h, w)), 0.9) * 4
    paper = PAPER[None, None, :] + grain[..., None]
    out = paper * (1 - ink[..., None]) + INK * ink[..., None]
    # 5. NO colour accents (user, 2026-11-01: the vermilion lanterns and the
    # gold ribbons read as stuck on, out of style). Ink and paper only.
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")


def main():
    KEEP.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        dst = BG / f"{name}.png"
        keep = KEEP / f"{name}.png"
        if not keep.exists():
            shutil.copyfile(dst, keep)
        # bg_feature is drawn from the base painting (see 6), at night (see 7)
        source = KEEP / "bg_base.png" if name == "bg_feature" else keep
        convert(Image.open(source), night=name == "bg_feature").save(dst, optimize=True)
        print("wrote", dst.relative_to(APP))


if __name__ == "__main__":
    main()
