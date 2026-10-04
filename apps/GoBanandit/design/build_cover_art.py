"""Go Banandit's cover art — the wide banner on the game's Stake Engine page.

    python3 design/build_cover_art.py

Writes design/cover/GoBanandit-Cover.png (1920x1080) and a preview with the
dashboard's overlays drawn on (_preview_overlays.png).

Every game needs one (user, 2026-10-04); it used to be whatever was at hand.
The page lays two things over it, so the composition keeps them clear:

  top-right    the star-rating pill            -> keep ~16% x 14% empty
  bottom-left  the square game thumbnail tile  -> keep ~24% x 34% empty

Built from the game's own finished art — the printed backdrop, the two cast
figures, the Banana Sack symbol — and set in the game's display face, so the
page reads as the same poster as the game. Figures get the same separation the
game gives them (paper spotlight + hard ink offset shadow), because on this
backdrop their red and green are the backdrop's own inks.
"""

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(D)
OUT = os.path.join(D, "cover")
os.makedirs(OUT, exist_ok=True)

W, H = 1920, 1080
PAPER = (242, 232, 208, 255)
INK = (30, 27, 26, 255)
RED = (210, 74, 44, 255)
GREEN = (31, 92, 74, 255)
FONT = os.path.join(APP, "static", "fonts", "banandit", "Bungee-Regular.ttf")


def figure(path, height):
    im = Image.open(path).convert("RGBA")
    im = im.crop(im.getbbox())
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def place_figure(canvas, fig, x, y, shadow=(12, 10)):
    """x,y = top-left. Paper spotlight behind, ink silhouette offset."""
    a = fig.split()[3]
    spot = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(spot).polygon(
        [(x + fig.width * 0.08, y - 30), (x + fig.width * 0.92, y - 30), (x + fig.width * 1.06, y + fig.height), (x - fig.width * 0.06, y + fig.height)],
        fill=PAPER[:3] + (110,),
    )
    canvas.alpha_composite(spot)
    sil = Image.new("RGBA", fig.size, INK)
    sil.putalpha(a.point(lambda v: int(v * 0.75)))
    canvas.alpha_composite(sil, (x + shadow[0], y + shadow[1]))
    canvas.alpha_composite(fig, (x, y))


def printed_text(canvas, xy, text, size, fill, shadow=RED, stroke=10, offset=(9, 9), anchor="la"):
    f = ImageFont.truetype(FONT, size)
    d = ImageDraw.Draw(canvas)
    x, y = xy
    d.text((x + offset[0], y + offset[1]), text, font=f, fill=shadow, anchor=anchor, stroke_width=stroke, stroke_fill=shadow)
    d.text((x, y), text, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=INK)


def main():
    bg = Image.open(os.path.join(APP, "static", "assets", "sprites", "bananditBackground", "bg_base.png")).convert("RGBA")
    canvas = bg.resize((W, H), Image.LANCZOS)

    # the Lookout, further back and to the right, keeping watch
    look = figure(os.path.join(D, "cast_delivery", "fg_full_source.png"), 760)
    place_figure(canvas, look, 1360, 300, shadow=(9, 8))
    # the Bandit, the star, centre-right and in front
    band = figure(os.path.join(D, "cast_delivery", "mg_full_source.png"), 940)
    place_figure(canvas, band, 860, 150)

    # the haul at his feet: Banana Sacks (the P symbol art)
    sack = Image.open(os.path.join(APP, "static", "assets", "sprites", "bananditSymbols", "P.png")).convert("RGBA") if os.path.exists(
        os.path.join(APP, "static", "assets", "sprites", "bananditSymbols", "P.png")) else Image.open(os.path.join(D, "style_frame", "P.png")).convert("RGBA")
    sack = sack.crop(sack.getbbox())
    for (sx, sy, sz) in ((700, 820, 230), (1715, 905, 170), (800, 900, 170)):
        s = sack.resize((sz, round(sack.height * sz / sack.width)), Image.LANCZOS)
        sil = Image.new("RGBA", s.size, INK)
        sil.putalpha(s.split()[3].point(lambda v: int(v * 0.7)))
        canvas.alpha_composite(sil, (sx + 8, sy + 7))
        canvas.alpha_composite(s, (sx, sy))

    # the title, top-left — clear of the rating pill and the thumbnail tile
    printed_text(canvas, (90, 110), "GO", 150, PAPER)
    printed_text(canvas, (90, 262), "BANANDIT", 150, (244, 194, 27, 255))
    # the hook, one line, on an ink tag
    f = ImageFont.truetype(FONT, 46)
    tag = "EVERY BANDIT COLLECTS EVERY SACK"
    tw = ImageDraw.Draw(canvas).textlength(tag, font=f)
    d = ImageDraw.Draw(canvas)
    d.rectangle((96 + 8, 488 + 8, 96 + tw + 48 + 8, 488 + 78 + 8), fill=RED)
    d.rectangle((96, 488, 96 + tw + 48, 488 + 78), fill=INK)
    d.text((96 + 24, 488 + 39), tag, font=f, fill=PAPER, anchor="lm")

    out = os.path.join(OUT, "GoBanandit-Cover.png")
    canvas.convert("RGB").save(out, optimize=True)
    print("wrote", os.path.relpath(out, APP), canvas.size, os.path.getsize(out) // 1024, "KB")

    # preview with the page's overlays, to check nothing important is under them
    pv = canvas.copy()
    o = ImageDraw.Draw(pv, "RGBA")
    o.rounded_rectangle((W - 0.16 * W, 0.05 * H, W - 0.03 * W, 0.15 * H), 40, fill=(40, 40, 40, 200))
    o.rounded_rectangle((0.06 * W, H - 0.34 * H, 0.27 * W, H + 40), 30, fill=(242, 232, 208, 230))
    pv.convert("RGB").resize((960, 540)).save(os.path.join(OUT, "_preview_overlays.png"))


if __name__ == "__main__":
    main()
