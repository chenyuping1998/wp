#!/usr/bin/env python3
"""Art Deco UI art drawn in code: plates, plaques, titles, win banners, logo, board frame.

ART_BRIEF.md §5, §7 and §8 list these as plain geometry plus lettering, so they are
drawn here rather than generated: the shapes are Deco geometry (stepped concentric
bands, ziggurat crests, half sunbursts, flat rivets) in the §0.3 inks, and every
word is set in a real font (Limelight), never drawn by an image model.

Each piece keeps the footprint of the art it replaces — canvas size, outer radius,
the dark well a number or icon sits in — because the layout code was tuned to those
(measured 2026-10-04 from the interim greyscale versions):

  spin_plate     512   ring outer r 0.883, dark well r 0.633
  button_plate   256   ring outer r 0.938, dark well r 0.656
  ticker_plate   1206x165, card/buybonus 640, fs_sign 1280x1002, fs_counter 1280x966
  frame_edge / frame_bg 1280: the board's border (open centre) and its backing

Everything is drawn at 2x and downscaled with Lanczos so edges come back
anti-aliased (art-direction.md: never quantise or draw at delivery size).

  build_artdeco_ui.py            -> design/_artdeco/ui/<sprite path>   (review)
  build_artdeco_ui.py --install  -> also copy into static/assets/sprites/
"""

from __future__ import annotations

import argparse
import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

APP = Path(__file__).resolve().parent.parent
OUT = APP / "design/_artdeco/ui"
SPRITES = APP / "static/assets/sprites"
FONT = APP / "static/fonts/Limelight.ttf"

INK = (0x12, 0x12, 0x12, 255)
PANEL = (0x1C, 0x1C, 0x1C, 255)
DARK = (0x33, 0x33, 0x33, 255)
GREY = (0x8C, 0x8C, 0x8C, 255)
PAPER = (0xEC, 0xE8, 0xDF, 255)
CLEAR = (0, 0, 0, 0)
SS = 2  # supersample


# ---------------------------------------------------------------- primitives


class Canvas:
    def __init__(self, w: int, h: int):
        self.w, self.h = w, h
        self.im = Image.new("RGBA", (w * SS, h * SS), CLEAR)
        self.d = ImageDraw.Draw(self.im)

    def s(self, *v: float) -> list[float]:
        return [x * SS for x in v]

    def rrect(self, box, r, fill):
        self.d.rounded_rectangle(self.s(*box), radius=r * SS, fill=fill)

    def disc(self, cx, cy, r, fill):
        self.d.ellipse(self.s(cx - r, cy - r, cx + r, cy + r), fill=fill)

    def rect(self, box, fill):
        self.d.rectangle(self.s(*box), fill=fill)

    def poly(self, pts, fill):
        self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=fill)

    def fan(self, cx, cy, r, rays, a0, a1, colours, inner=0.0):
        """Half/full sunburst: alternating wedges between angles a0..a1 (degrees)."""
        step = (a1 - a0) / rays
        for i in range(rays):
            t0, t1 = math.radians(a0 + i * step), math.radians(a0 + (i + 0.62) * step)
            pts = [
                (cx + inner * r * math.cos(t0), cy + inner * r * math.sin(t0)),
                (cx + r * math.cos(t0), cy + r * math.sin(t0)),
                (cx + r * math.cos(t1), cy + r * math.sin(t1)),
                (cx + inner * r * math.cos(t1), cy + inner * r * math.sin(t1)),
            ]
            self.poly(pts, colours[i % len(colours)])

    def text(self, xy, s, size, fill, shadow=DARK, step=0.06, anchor="mm", spacing=0):
        font = ImageFont.truetype(str(FONT), int(size * SS))
        x, y = xy
        off = max(2, size * step)
        # Deco stepped shadow: a solid offset copy, not a blur.
        self.d.text((x * SS + off * SS * 0.5, y * SS + off * SS), s, font=font, fill=shadow, anchor=anchor)
        self.d.text((x * SS, y * SS), s, font=font, fill=fill, anchor=anchor)

    def fit_text_size(self, s, max_w, max_h):
        size = max_h
        while size > 8:
            font = ImageFont.truetype(str(FONT), int(size * SS))
            l, t, r, b = font.getbbox(s)
            if (r - l) / SS <= max_w and (b - t) / SS <= max_h:
                return size
            size -= 2
        return size

    def save(self, rel: str):
        out = self.im.resize((self.w, self.h), Image.LANCZOS)
        dst = OUT / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        out.save(dst)
        return dst


def ring_plate(size: int, outer: float, well: float, ticks: str) -> Canvas:
    """Round plate: stepped concentric bands from `outer` down to the dark `well`."""
    c = Canvas(size, size)
    cx = cy = size / 2
    R, W = outer * size / 2, well * size / 2
    band = R - W
    for frac, col in ((0.0, DARK), (0.16, GREY), (0.52, PAPER), (0.62, GREY), (0.80, DARK)):
        c.disc(cx, cy, R - band * frac, col)
    c.disc(cx, cy, W, INK)
    c.disc(cx, cy, W * 0.92, PANEL)
    c.disc(cx, cy, W * 0.88, INK)
    if ticks == "sides":  # three bars across the ring at 9 and 3 o'clock
        bar_h, gap = size * 0.018, size * 0.03
        for k in (-1, 0, 1):
            y = cy + k * gap
            for x0, x1 in ((cx - R - size * 0.02, cx - W + size * 0.01), (cx + W - size * 0.01, cx + R + size * 0.02)):
                c.rect((x0, y - bar_h / 2, x1, y + bar_h / 2), PAPER if k == 0 else GREY)
    else:  # three short ticks at 12, 3, 6 and 9
        for ang in (0, 90, 180, 270):
            for k in (-1, 0, 1):
                t = math.radians(ang)
                px, py = -math.sin(t), math.cos(t)
                mx, my = cx + math.cos(t) * (W + band / 2), cy + math.sin(t) * (W + band / 2)
                off = k * size * 0.022
                hl = band * 0.55
                x0, y0 = mx + px * off - math.cos(t) * hl / 2, my + py * off - math.sin(t) * hl / 2
                x1, y1 = mx + px * off + math.cos(t) * hl / 2, my + py * off + math.sin(t) * hl / 2
                c.d.line([(x0 * SS, y0 * SS), (x1 * SS, y1 * SS)], fill=INK, width=int(size * 0.012 * SS))
    return c


def deco_panel(c: Canvas, box, r, rivets=True, inner_line=True, bands=1):
    """Rounded plate: dark rim, `bands` paper/grey lines, flat ink well, flat rivets."""
    x0, y0, x1, y1 = box
    rim = min(x1 - x0, y1 - y0) * 0.035
    c.rrect(box, r, DARK)
    c.rrect((x0 + rim * 0.35, y0 + rim * 0.35, x1 - rim * 0.35, y1 - rim * 0.35), r * 0.95, GREY)
    c.rrect((x0 + rim * 0.55, y0 + rim * 0.55, x1 - rim * 0.55, y1 - rim * 0.55), r * 0.92, DARK)
    c.rrect((x0 + rim, y0 + rim, x1 - rim, y1 - rim), r * 0.85, INK)
    if inner_line:
        lw = max(2.0, rim * 0.12)
        for i in range(bands):
            inset = rim * (1.45 + i * 0.55)
            col = PAPER if i % 2 == 0 else GREY
            c.rrect((x0 + inset, y0 + inset, x1 - inset, y1 - inset), r * 0.7, col)
            c.rrect((x0 + inset + lw, y0 + inset + lw, x1 - inset - lw, y1 - inset - lw), r * 0.68, INK)
    if rivets:
        rr = rim * 0.32
        for (px, py) in ((x0 + rim * 0.55, y0 + rim * 0.55), (x1 - rim * 0.55, y0 + rim * 0.55),
                         (x0 + rim * 0.55, y1 - rim * 0.55), (x1 - rim * 0.55, y1 - rim * 0.55)):
            c.disc(px, py, rr, PAPER)
            c.disc(px + rr * 0.25, py + rr * 0.25, rr * 0.55, GREY)


# ---------------------------------------------------------------- pieces


def ui_plates():
    yield ring_plate(512, 0.883, 0.633, "sides").save("capoUiPlates/spin_plate.png")
    yield ring_plate(256, 0.938, 0.656, "ticks").save("capoUiPlates/button_plate.png")

    c = Canvas(1206, 165)
    c.rrect((60, 22, 1146, 143), 40, DARK)
    c.rrect((66, 28, 1140, 137), 36, GREY)
    c.rrect((70, 32, 1136, 133), 33, INK)
    c.rrect((80, 42, 1126, 123), 26, PAPER)
    c.rrect((83, 45, 1123, 120), 24, INK)
    for cx, a0 in ((44, 90), (1162, -90)):
        c.fan(cx, 82.5, 44, 7, a0, a0 + 180, [GREY, PAPER])
        c.disc(cx, 82.5, 12, DARK)
    yield c.save("capoUiPlates/ticker_plate.png")

    for name in ("card_plate", "buybonus_plate"):
        c = Canvas(640, 640)
        deco_panel(c, (7, 7, 633, 619), 40)
        if name == "buybonus_plate":
            c.fan(320, 600, 46, 9, 180, 360, [GREY, PAPER], inner=0.25)
        yield c.save(f"capoUiPlates/{name}.png")


def fs_panels():
    # Free-spin sign: a plaque with a ziggurat crest carrying a half sunburst.
    c = Canvas(1280, 1002)
    crest = [(470, 190), (510, 140), (560, 140), (590, 96), (690, 96), (720, 140), (770, 140), (810, 190)]
    c.poly(crest, DARK)
    c.fan(640, 190, 120, 11, 180, 360, [GREY, PAPER], inner=0.18)
    deco_panel(c, (26, 180, 1255, 948), 70, bands=2)
    for x in (110, 1170):  # stepped side notches
        for i, w in enumerate((70, 50, 30)):
            c.rect((x - w / 2, 230 + i * 26, x + w / 2, 244 + i * 26), GREY)
    yield c.save("capoBoardFrame/fs_sign_capo_v2.png")

    c = Canvas(1280, 966)
    deco_panel(c, (11, 118, 1269, 809), 60, bands=2)
    c.fan(640, 118, 70, 9, 180, 360, [GREY, PAPER], inner=0.2)
    yield c.save("capoBoardFrame/fs_counter_panel_capo_v1.png")


def board():
    # Backing: a flat ink plate with one quiet inner line.
    c = Canvas(1280, 1280)
    c.rrect((23, 23, 1257, 1248), 36, INK)
    c.rrect((40, 40, 1240, 1231), 28, (0x26, 0x26, 0x26, 255))
    c.rrect((43, 43, 1237, 1228), 26, INK)
    yield c.save("capoBoardFrame/frame_bg_capo_v1.png")

    # Border with an open centre: three thin bands, ziggurat corner caps, a crest.
    c = Canvas(1280, 1280)
    for inset, col in ((39, DARK), (47, GREY), (52, DARK), (60, PAPER), (63, DARK)):
        c.rrect((inset, inset - 3, 1280 - inset, 1283 - inset - 41), 30, col)
    c.rrect((70, 67, 1210, 1172), 22, CLEAR)
    c.d.rounded_rectangle(c.s(70, 67, 1210, 1172), radius=22 * SS, fill=CLEAR)
    # punch the centre (draw with alpha 0 by compositing)
    hole = Image.new("L", c.im.size, 255)
    ImageDraw.Draw(hole).rounded_rectangle(c.s(70, 67, 1210, 1172), radius=22 * SS, fill=0)
    c.im.putalpha(Image.fromarray(__import__("numpy").minimum(__import__("numpy").asarray(c.im.getchannel("A")), __import__("numpy").asarray(hole))))
    for (x, y, sx, sy) in ((39, 36, 1, 1), (1241, 36, -1, 1), (39, 1242, 1, -1), (1241, 1242, -1, -1)):
        for i, (w, col) in enumerate(((64, DARK), (46, GREY), (28, PAPER))):
            c.rect((min(x, x + sx * w), min(y, y + sy * w), max(x, x + sx * w), max(y, y + sy * w)), col)
    c.fan(640, 40, 60, 9, 180, 360, [GREY, PAPER], inner=0.2)
    yield c.save("capoBoardFrame/frame_edge_capo_v1.png")


def titles():
    spec = (("title_soldier", "SOLDIER", 1, 0), ("title_capo", "CAPO", 2, 1), ("title_don", "THE DON", 3, 2))
    for name, word, lines, fan in spec:
        c = Canvas(1024, 360)
        if fan:
            c.fan(512, 250, 230 if fan == 1 else 300, 15 if fan == 1 else 21, 180, 360,
                  [(0x33, 0x33, 0x33, 200), (0x8C, 0x8C, 0x8C, 140)], inner=0.22)
        for i in range(lines):
            y = 268 + i * 18
            w = 360 + i * 70
            c.rect((512 - w, y, 512 + w, y + 6), PAPER if i == 0 else GREY)
        size = c.fit_text_size(word, 760, 150)
        c.text((512, 160), word, size, PAPER)
        yield c.save(f"capoSplash/{name}.png")


def banners():
    spec = (("big", "BIG WIN"), ("superwin", "SUPER WIN"), ("mega", "MEGA WIN"), ("epic", "EPIC WIN"), ("max", "MAX WIN"))
    for i, (name, word) in enumerate(spec):
        c = Canvas(1000, 560)
        deco_panel(c, (20, 20, 980, 540), 46, bands=i + 1)
        if i >= 2:  # sunburst crest grows with the tier
            c.fan(500, 20, 60 + 25 * (i - 2), 9 + 4 * (i - 2), 0, 180, [GREY, PAPER], inner=0.2)
        size = c.fit_text_size(word, 760 - i * 10, 118)
        c.text((500, 168), word, size, PAPER, step=0.07)
        yield c.save(f"capoWinBanners/{name}.png")


def logo():
    c = Canvas(1200, 520)
    c.fan(600, 250, 250, 17, 180, 360, [(0x33, 0x33, 0x33, 180), (0x8C, 0x8C, 0x8C, 110)], inner=0.3)
    size = c.fit_text_size("NOSTRA", 900, 170)
    c.text((600, 150), "CAPO", size, PAPER, step=0.05)
    c.text((600, 330), "NOSTRA", size, PAPER, step=0.05)
    for i, w in enumerate((420, 330, 240)):
        c.rect((600 - w, 438 + i * 16, 600 + w, 444 + i * 16), PAPER if i == 0 else GREY)
    yield c.save("capoBrand/logo.png")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--install", action="store_true")
    a = ap.parse_args()
    written = []
    for gen in (ui_plates, fs_panels, board, titles, banners, logo):
        written += list(gen())
    for dst in written:
        rel = dst.relative_to(OUT)
        print(rel)
        if a.install:
            shutil.copyfile(dst, SPRITES / rel)
    print(f"{len(written)} files{' installed' if a.install else ''}")


if __name__ == "__main__":
    main()
