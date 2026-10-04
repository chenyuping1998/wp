"""Go Banandit's cover art — the wide banner on the game's Stake Engine page.

    python3 design/build_cover_art.py

Writes design/cover/GoBanandit-Cover-BG.png (opaque backdrop) and
GoBanandit-Cover-FG.png (cast + sacks on transparency), both 1920x1080 — the
same BG/FG split as the thumbnail — and a preview of the two together with
the dashboard's overlays drawn on (_preview_overlays.png).

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
    """x,y = top-left. Ink silhouette offset behind (no paper spotlight: it
    read as a pale panel on the backdrop — user, 2026-10-04)."""
    a = fig.split()[3]
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
    # BG: the backdrop alone (opaque)
    bg = Image.open(os.path.join(APP, "static", "assets", "sprites", "bananditBackground", "bg_base.png")).convert("RGBA")
    bg = bg.resize((W, H), Image.LANCZOS)

    # FG: everything that stands in front, on transparency — the same split
    # as the thumbnail (GoBanandit-BG / -FG), and like the thumbnail's FG it
    # carries no title (the page sets the game's name itself)
    fg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    look = figure(os.path.join(D, "cast_delivery", "fg_full_source.png"), 760)
    place_figure(fg, look, 1360, 300, shadow=(9, 8))
    band = figure(os.path.join(D, "cast_delivery", "mg_full_source.png"), 940)
    place_figure(fg, band, 860, 150)
    sack = Image.open(os.path.join(APP, "static", "assets", "sprites", "bananditSymbols", "p.png")).convert("RGBA")
    sack = sack.crop(sack.getbbox())
    for (sx, sy, sz) in ((700, 820, 230), (1715, 905, 170), (800, 900, 170)):
        sk = sack.resize((sz, round(sack.height * sz / sack.width)), Image.LANCZOS)
        sil = Image.new("RGBA", sk.size, INK)
        sil.putalpha(sk.split()[3].point(lambda v: int(v * 0.7)))
        fg.alpha_composite(sil, (sx + 8, sy + 7))
        fg.alpha_composite(sk, (sx, sy))

    bg.convert("RGB").save(os.path.join(OUT, "GoBanandit-Cover-BG.png"), optimize=True)
    fg.save(os.path.join(OUT, "GoBanandit-Cover-FG.png"), optimize=True)
    comp = bg.copy()
    comp.alpha_composite(fg)
    for n in ("GoBanandit-Cover-BG.png", "GoBanandit-Cover-FG.png"):
        print("wrote", n, os.path.getsize(os.path.join(OUT, n)) // 1024, "KB")

    # preview: the two layers together, with the page's overlays drawn on
    pv = comp.copy()
    o = ImageDraw.Draw(pv, "RGBA")
    o.rounded_rectangle((W - 0.16 * W, 0.05 * H, W - 0.03 * W, 0.15 * H), 40, fill=(40, 40, 40, 200))
    o.rounded_rectangle((0.06 * W, H - 0.34 * H, 0.27 * W, H + 40), 30, fill=(242, 232, 208, 230))
    pv.convert("RGB").resize((960, 540)).save(os.path.join(OUT, "_preview_overlays.png"))


if __name__ == "__main__":
    main()
