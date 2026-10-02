"""Redraw the last Go Boomana UI art in Go Banandit's screenprint lock.

    python3 design/build_screenprint_ui.py

Writes, at the paths and sizes the game already loads:
  sprites/bananditWinBanners/{big,superwin,mega,epic,max}.png   1000x560
  sprites/bananditUi/ticker_plate.png                            652x146
  sprites/bananditWinBananas/bananas.png (+ json copied)         1280x512

Why code and not the image model: these are flat plates and flat props — the
screenprint style IS flat ink shapes (ART_BRIEF.md §0), and "Things the image
model must never make" puts lettering, UI geometry and the palette itself on
the code side. No words are drawn: the tier names are set at runtime in Bungee
(Win.svelte), because generated or baked letters are the first AI tell and
cannot follow the 16 shipped languages.

Everything is drawn at 2x and downscaled with Lanczos, so the flat fills keep
anti-aliased edges (quantising at delivery size stair-steps them).

The banner layout keeps Go Boomana's plaque geometry on purpose: the plaque is
a mesh (src/game/meshWin/banner.ts) whose title bulge and plate regions were
measured on that canvas — PLATE [8,8,248,136] and TITLE [44,28,212,66] on a
256-wide grid — so the title band and the amount well sit where the rig expects.
"""

import json
import os
import shutil

import numpy as np
from PIL import Image, ImageDraw

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPR = os.path.join(APP, "static", "assets", "sprites")

PAPER = (242, 232, 208)
GREEN = (31, 92, 74)
RED = (210, 74, 44)
INK = (30, 27, 26)
BROWN = (78, 46, 34)
YELLOW = (244, 194, 27)
WELL = (230, 220, 194)

# tier -> title band colour (the title itself is runtime type)
TIERS = {"big": GREEN, "superwin": RED, "mega": BROWN, "epic": INK, "max": YELLOW}


def down(im, size):
    return im.resize(size, Image.LANCZOS)


def banner(colour):
    S = 2
    W, H = 1000 * S, 560 * S
    k = 1000 * S / 256
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    px0, py0, px1, py1 = [round(v * k) for v in (8, 8, 248, 136)]
    off = 14 * S
    # misregistered second pass: the red plate printed a little low and right
    d.rounded_rectangle((px0 + off, py0 + off, px1 + off, py1 + off), radius=38 * S, fill=RED + (255,))
    d.rounded_rectangle((px0, py0, px1, py1), radius=38 * S, fill=PAPER + (255,), outline=INK + (255,), width=10 * S)
    # title band (TITLE rect, grown a touch so the runtime type has margin)
    tx0, ty0, tx1, ty1 = [round(v * k) for v in (36, 24, 220, 70)]
    d.rounded_rectangle((tx0, ty0, tx1, ty1), radius=18 * S, fill=colour + (255,), outline=INK + (255,), width=6 * S)
    # the amount well under it
    wx0, wy0, wx1, wy1 = [round(v * k) for v in (48, 80, 208, 122)]
    d.rounded_rectangle((wx0, wy0, wx1, wy1), radius=14 * S, fill=WELL + (255,), outline=INK + (255,), width=5 * S)
    # rivets: plain ink dots round the rim, one motif repeated
    for i in range(13):
        x = px0 + 40 * S + i * (px1 - px0 - 80 * S) / 12
        for y in (py0 + 24 * S, py1 - 24 * S):
            d.ellipse((x - 7 * S, y - 7 * S, x + 7 * S, y + 7 * S), fill=INK + (255,))
    for i in range(1, 4):
        y = py0 + i * (py1 - py0) / 4
        for x in (px0 + 24 * S, px1 - 24 * S):
            d.ellipse((x - 7 * S, y - 7 * S, x + 7 * S, y + 7 * S), fill=INK + (255,))
    return down(im, (1000, 560))


def ticker():
    S = 2
    W, H = 652 * S, 146 * S
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    off = 8 * S
    d.rounded_rectangle((6 * S + off, 6 * S + off, W - 6 * S, H - 6 * S), radius=26 * S, fill=RED + (255,))
    d.rounded_rectangle((6 * S, 6 * S, W - 6 * S - off, H - 6 * S - off), radius=26 * S, fill=GREEN + (255,), outline=INK + (255,), width=6 * S)
    d.rounded_rectangle((20 * S, 20 * S, W - 20 * S - off, H - 20 * S - off), radius=18 * S, outline=PAPER + (255,), width=3 * S)
    return down(im, (652, 146))


def flat_bananas(src):
    """Lock the painted banana sprites to three inks: yellow, brown, ink."""
    im = Image.open(src).convert("RGBA")
    big = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    a = np.array(big).astype(float)
    rgb, al = a[..., :3], a[..., 3]
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
    out = np.zeros_like(a)
    out[..., 3] = np.where(al > 110, 255, 0)
    # light -> banana yellow, mid -> brown shadow block, dark -> ink
    pal = np.where(lum[..., None] > 120, YELLOW, np.where(lum[..., None] > 60, BROWN, INK))
    out[..., :3] = pal
    return down(Image.fromarray(out.astype(np.uint8)), im.size)


def main():
    os.makedirs(os.path.join(SPR, "bananditWinBanners"), exist_ok=True)
    for name, colour in TIERS.items():
        banner(colour).save(os.path.join(SPR, "bananditWinBanners", f"{name}.png"))
    ticker().save(os.path.join(SPR, "bananditUi", "ticker_plate.png"))
    os.makedirs(os.path.join(SPR, "bananditWinBananas"), exist_ok=True)
    flat_bananas(os.path.join(SPR, "goBananasWinBananas", "bananas.png")).save(
        os.path.join(SPR, "bananditWinBananas", "bananas.png")
    )
    shutil.copy(os.path.join(SPR, "goBananasWinBananas", "bananas.json"), os.path.join(SPR, "bananditWinBananas", "bananas.json"))
    print("wrote banners x5, ticker plate, flat bananas")


if __name__ == "__main__":
    main()
