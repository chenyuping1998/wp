#!/usr/bin/env python3
"""Street-sticker UI drawn in code: plates, board shell, titles, win banners, logo.

ART_BRIEF.md v2 §8: these are slabs and lettering, so they are drawn here rather than
generated. One object language for all of them, the same as the symbol stickers:

  sticker white border  ->  ink outline  ->  flat slab fill (+ a little paper grain)
  sodium-orange duct-tape strips across corners, flat ink offset shadow

Words are set in real fonts (Bungee for titles, Permanent Marker for tags), never drawn
by an image model. Every piece keeps the footprint of the art it replaces (canvas size,
alpha bbox, the open centre of frames), measured 2026-10-15 from the render-era files,
so no layout code moves:

  frame_bg 1280 opaque          frame_edge 1280, hole (44,39)-(1235,1229)
  fs_counter 1280x966 / fs_sign 1280x1002, bbox x 11-1275, y ~60-~920
  bar_plate 3744x270, caps 480  ticker 603x135  buybonus 512 (PlateSlice border 130)
  buy_card_frame 512x440, hole (21,20)-(490,414)  modal_frame / panel_edge 192, slice 64
  button/drawer 300 round, spin 336 round
  logo 1200x520, titles 1024x360, win banners 1000x560 (art in the top 0-370)

Drawn at 2x, downscaled with Lanczos. Old files are backed up once to
design/_legacy_assets/render_ui_20261015/ by --install.

  build_street_ui.py            -> design/_street/ui/<sprite path>   (review)
  build_street_ui.py --install  -> also copy into static/assets/sprites/
"""

from __future__ import annotations

import argparse
import math
import random
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

APP = Path(__file__).resolve().parent.parent
OUT = APP / "design/_street/ui"
SPRITES = APP / "static/assets/sprites"
BACKUP = APP / "design/_legacy_assets/render_ui_20261015"
TITLE_FONT = APP / "static/fonts/Bungee-Regular.ttf"
TAG_FONT = APP / "static/fonts/PermanentMarker-Regular.ttf"

INK = (0x12, 0x12, 0x12, 255)
WHITE = (0xF7, 0xF5, 0xF0, 255)
SLAB = (0x2B, 0x2E, 0x33, 255)
BOARD = (0x3A, 0x3D, 0x42, 255)
GREY_D = (0x55, 0x58, 0x5D, 255)
GREY_M = (0x9A, 0x9C, 0xA0, 255)
GREY_L = (0xD8, 0xD6, 0xD1, 255)
SOD_D = (0x9C, 0x5A, 0x22, 255)
SOD = (0xF5, 0x89, 0x3D, 255)
SOD_L = (0xFF, 0xC3, 0x8A, 255)
MAGENTA = (0xE0, 0x33, 0x8A, 255)
CYAN = (0x2E, 0xC4, 0xC6, 255)
ACID = (0x9B, 0xD4, 0x37, 255)
RED = (0xB2, 0x22, 0x22, 255)
SHADOW = (0x12, 0x12, 0x12, 110)
CLEAR = (0, 0, 0, 0)
SS = 2


class Canvas:
    def __init__(self, w: int, h: int, fill=CLEAR):
        self.w, self.h = w, h
        self.im = Image.new("RGBA", (w * SS, h * SS), fill)
        self.d = ImageDraw.Draw(self.im)

    def s(self, *v: float) -> list[float]:
        return [x * SS for x in v]

    def rrect(self, box, r, fill):
        self.d.rounded_rectangle(self.s(*box), radius=r * SS, fill=fill)

    def ellipse(self, box, fill):
        self.d.ellipse(self.s(*box), fill=fill)

    def poly(self, pts, fill):
        self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=fill)

    def paste(self, layer: Image.Image, xy=(0, 0)):
        self.im.alpha_composite(layer, (xy[0] * SS, xy[1] * SS))

    def done(self) -> Image.Image:
        return self.im.resize((self.w, self.h), Image.LANCZOS)


def grain(c: Canvas, seed: int, amount: int = 5) -> None:
    """Paper grain on everything opaque, so slabs are printed stock, not vector fills."""
    a = np.asarray(c.im).astype(np.int16)
    rng = np.random.default_rng(seed)
    n = rng.integers(-amount, amount + 1, size=a.shape[:2])
    n = np.asarray(Image.fromarray((n + 128).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.int16) - 128
    a[..., :3] = np.clip(a[..., :3] + n[..., None], 0, 255)
    c.im = Image.fromarray(a.astype(np.uint8), "RGBA")
    c.d = ImageDraw.Draw(c.im)


def sticker_rrect(c: Canvas, box, r, fill, border=10, outline=6, shadow=8):
    """White-bordered sticker slab: shadow, white, ink, fill. `border`/`outline` in px."""
    x0, y0, x1, y1 = box
    if shadow:
        c.rrect((x0 + shadow, y0 + shadow, x1, y1), r, SHADOW)
        x1 -= shadow
        y1 -= shadow
    c.rrect((x0, y0, x1, y1), r, WHITE)
    b = border
    c.rrect((x0 + b, y0 + b, x1 - b, y1 - b), max(r - b, 2), INK)
    o = b + outline
    c.rrect((x0 + o, y0 + o, x1 - o, y1 - o), max(r - o, 2), fill)
    return (x0 + o, y0 + o, x1 - o, y1 - o)


def sticker_disc(c: Canvas, cx, cy, r, fill, border=10, outline=6, well=None, ring=None):
    c.ellipse((cx - r, cy - r, cx + r, cy + r), WHITE)
    r1 = r - border
    c.ellipse((cx - r1, cy - r1, cx + r1, cy + r1), INK)
    r2 = r1 - outline
    c.ellipse((cx - r2, cy - r2, cx + r2, cy + r2), ring or fill)
    if ring:
        r3 = r2 * 0.80
        c.ellipse((cx - r3, cy - r3, cx + r3, cy + r3), INK)
        r4 = r3 - outline
        c.ellipse((cx - r4, cy - r4, cx + r4, cy + r4), fill)


def tape(c: Canvas, cx, cy, length, width, angle, colour=SOD, seed=0):
    """A strip of duct tape: flat colour, ink outline, torn zig-zag ends."""
    rng = random.Random(seed)
    ca, sa = math.cos(math.radians(angle)), math.sin(math.radians(angle))

    def pt(u, v):
        return (cx + u * ca - v * sa, cy + u * sa + v * ca)

    def outline(grow):
        hl, hw = length / 2 + grow, width / 2 + grow
        teeth = 5
        pts = [pt(-hl, -hw), pt(hl, -hw)]
        for i in range(1, teeth):
            v = -hw + 2 * hw * i / teeth
            pts.append(pt(hl - (rng_end[i] if grow == 0 else rng_end[i] - grow), v))
        pts += [pt(hl, hw), pt(-hl, hw)]
        for i in range(teeth - 1, 0, -1):
            v = -hw + 2 * hw * i / teeth
            pts.append(pt(-hl + (rng_start[i] if grow == 0 else rng_start[i] - grow), v))
        return pts

    rng_end = [rng.uniform(0, width * 0.22) for _ in range(6)]
    rng_start = [rng.uniform(0, width * 0.22) for _ in range(6)]
    c.poly(outline(5), INK)
    c.poly(outline(0), colour)
    # one flat crease line, a shade darker
    dark = tuple(int(v * 0.72) for v in colour[:3]) + (255,)
    a, b = pt(-length / 2 + width * 0.3, width * 0.18), pt(length / 2 - width * 0.3, width * 0.18)
    c.d.line([(a[0] * SS, a[1] * SS), (b[0] * SS, b[1] * SS)], fill=dark, width=int(3 * SS))


def drips(c: Canvas, x0, x1, y, colour, n, seed, maxlen=40, w=10):
    rng = random.Random(seed)
    for _ in range(n):
        x = rng.uniform(x0, x1)
        ln = rng.uniform(maxlen * 0.4, maxlen)
        c.rrect((x - w / 2, y - 4, x + w / 2, y + ln), w / 2, colour)
        c.ellipse((x - w * 0.65, y + ln - w, x + w * 0.65, y + ln + w * 0.3), colour)


def text_layer(text, font_path, size, fill, outline, outline_w, white_w=0, spacing=0):
    """Text with ink outline and (optionally) a sticker-white rim, returned at SS scale."""
    f = ImageFont.truetype(str(font_path), int(size * SS))
    pad = int((outline_w + white_w + 10) * SS)
    tmp = ImageDraw.Draw(Image.new("L", (1, 1)))
    if spacing:
        widths = [tmp.textlength(ch, font=f) for ch in text]
        tw = int(sum(widths) + spacing * SS * (len(text) - 1))
    else:
        tw = int(tmp.textlength(text, font=f))
    asc, desc = f.getmetrics()
    lay = Image.new("RGBA", (tw + 2 * pad, asc + desc + 2 * pad), CLEAR)
    d = ImageDraw.Draw(lay)

    def draw(fill_, stroke, stroke_fill):
        x = pad
        if spacing:
            for ch, wd in zip(text, widths):
                d.text((x, pad), ch, font=f, fill=fill_, stroke_width=stroke, stroke_fill=stroke_fill)
                x += wd + spacing * SS
        else:
            d.text((x, pad), text, font=f, fill=fill_, stroke_width=stroke, stroke_fill=stroke_fill)

    if white_w:
        draw(WHITE, int((outline_w + white_w) * SS), WHITE)
    draw(fill, int(outline_w * SS), INK)
    return lay.crop(lay.getbbox())


def place_text(c: Canvas, lay: Image.Image, cx, cy, max_w=None, max_h=None, angle=0.0):
    if max_w or max_h:
        k = min((max_w * SS / lay.width) if max_w else 9, (max_h * SS / lay.height) if max_h else 9, 1.0)
        if k < 1:
            lay = lay.resize((int(lay.width * k), int(lay.height * k)), Image.LANCZOS)
    if angle:
        lay = lay.rotate(angle, resample=Image.BICUBIC, expand=True)
    c.im.alpha_composite(lay, (int(cx * SS - lay.width / 2), int(cy * SS - lay.height / 2)))


def ink_shadow(lay: Image.Image, dx=8, dy=8) -> Image.Image:
    a = lay.split()[-1]
    sh = Image.new("RGBA", (lay.width + dx * SS, lay.height + dy * SS), CLEAR)
    blk = Image.new("RGBA", lay.size, INK)
    blk.putalpha(a)
    sh.alpha_composite(blk, (dx * SS, dy * SS))
    sh.alpha_composite(lay, (0, 0))
    return sh


# ---------------------------------------------------------------- pieces


def board():
    out = {}
    c = Canvas(1280, 1280)
    c.rrect((0, 0, 1280, 1280), 48, BOARD)
    grain(c, 1, 4)
    out["turfBoardFrame/frame_bg.png"] = c.done()

    # Border band only: the hole is (44,39)-(1235,1229). The square is squashed to 5:4
    # in game, so corners stay plain and the tape runs along straight edges.
    c = Canvas(1280, 1280)
    c.rrect((0, 0, 1280, 1280), 58, WHITE)
    c.rrect((20, 18, 1260, 1262), 44, INK)
    c.rrect((40, 36, 1240, 1244), 30, CLEAR)
    c.d.rounded_rectangle(c.s(40, 36, 1240, 1244), radius=30 * SS, fill=CLEAR)
    # punch the hole for real (ImageDraw composites CLEAR as a no-op)
    a = np.asarray(c.im).copy()
    m = Image.new("L", c.im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle(c.s(44, 39, 1236, 1240), radius=28 * SS, fill=255)
    a[np.asarray(m) > 0] = 0
    c.im = Image.fromarray(a, "RGBA")
    c.d = ImageDraw.Draw(c.im)
    tape(c, 150, 40, 260, 70, -6, SOD, 11)
    tape(c, 1150, 1242, 260, 70, -4, SOD, 12)
    tape(c, 1240, 210, 200, 60, 84, CYAN, 13)
    tape(c, 40, 1080, 200, 60, 95, MAGENTA, 14)
    grain(c, 2, 4)
    out["turfBoardFrame/frame_edge.png"] = c.done()

    for name, h, y0, y1, seed in (("fs_counter_panel", 966, 59, 903, 21), ("fs_sign", 1002, 62, 937, 22)):
        c = Canvas(1280, h)
        sticker_rrect(c, (11, y0, 1275, y1), 60, SLAB, border=18, outline=10, shadow=14)
        tape(c, 120, y0 + 30, 300, 90, -14, SOD, seed)
        tape(c, 1160, y1 - 50, 300, 90, -12, SOD, seed + 1)
        grain(c, seed)
        out[f"turfBoardFrame/{name}.png"] = c.done()
    return out


def ui_plates():
    out = {}
    # bar: one long slab; tape only inside the 480px caps so nothing tiled gets stretched
    c = Canvas(3744, 270)
    sticker_rrect(c, (12, 17, 3738, 251), 60, SLAB, border=14, outline=8, shadow=10)
    tape(c, 170, 40, 260, 66, -8, SOD, 31)
    tape(c, 3580, 228, 260, 66, -6, SOD, 32)
    grain(c, 3)
    out["turfUi/bar_plate.png"] = c.done()

    c = Canvas(3744, 240)
    sticker_rrect(c, (0, 100, 3744, 143), 18, SLAB, border=6, outline=4, shadow=0)
    out["turfUi/bar_strip.png"] = c.done()

    c = Canvas(603, 135)
    sticker_rrect(c, (6, 9, 600, 125), 30, SLAB, border=8, outline=5, shadow=6)
    tape(c, 60, 22, 110, 34, -10, SOD, 33)
    grain(c, 4)
    out["turfUi/ticker_plate.png"] = c.done()

    for name, active in (("button_plate", False), ("button_plate_active", True)):
        c = Canvas(300, 300)
        sticker_disc(c, 150, 150, 140, SOD_D if active else SLAB, border=12, outline=7)
        grain(c, 5)
        out[f"turfUi/{name}.png"] = c.done()

    c = Canvas(300, 300)
    sticker_disc(c, 151, 136, 132, SLAB, border=12, outline=7)
    grain(c, 6)
    out["turfUi/drawer_plate.png"] = c.done()

    # spin: the one control with an orange ring
    c = Canvas(336, 336)
    sticker_disc(c, 168, 170, 158, SLAB, border=12, outline=7, ring=SOD)
    grain(c, 7)
    out["turfUi/spin_plate.png"] = c.done()

    # buy bonus: slab, tape inside the 130px nine-slice corners
    c = Canvas(512, 512)
    sticker_rrect(c, (10, 9, 504, 497), 46, SLAB, border=14, outline=8, shadow=10)
    tape(c, 70, 52, 130, 44, -38, SOD, 41)
    tape(c, 440, 446, 130, 44, -38, SOD, 42)
    grain(c, 8)
    out["turfUi/buybonus_plate.png"] = c.done()

    # open frames
    def open_frame(w, h, bbox, hole, r, seed, tapes=True, white=10, ink=6):
        c = Canvas(w, h)
        c.rrect(bbox, r, WHITE)
        x0, y0, x1, y1 = bbox
        c.rrect((x0 + white, y0 + white, x1 - white, y1 - white), max(r - white, 2), INK)
        a = np.asarray(c.im).copy()
        m = Image.new("L", c.im.size, 0)
        ImageDraw.Draw(m).rounded_rectangle(c.s(*hole), radius=max(r - white - ink, 2) * SS, fill=255)
        a[np.asarray(m) > 0] = 0
        c.im = Image.fromarray(a, "RGBA")
        c.d = ImageDraw.Draw(c.im)
        if tapes:
            t = (x1 - x0) * 0.28
            tape(c, x0 + t * 0.55, y0 + t * 0.35, t, t * 0.30, -35, SOD, seed)
            tape(c, x1 - t * 0.55, y1 - t * 0.35, t, t * 0.30, -35, SOD, seed + 1)
        return c.done()

    out["turfUi/buy_card_frame.png"] = open_frame(512, 440, (7, 6, 505, 432), (21, 20, 491, 415), 26, 51)
    out["turfUi/modal_frame.png"] = open_frame(192, 192, (1, 1, 191, 191), (24, 25, 168, 164), 22, 52, white=12, ink=10)
    out["turfUi/panel_edge.png"] = open_frame(192, 192, (4, 3, 189, 188), (19, 19, 175, 171), 18, 53, tapes=False, white=8, ink=6)
    return out


def burst_sticker(c: Canvas, cx, cy, rx, ry, colour, seed, spikes=16):
    """Comic starburst behind the top banners: jagged ring, white rim, ink line."""
    rng = random.Random(seed)
    radii = [1.0 if i % 2 == 0 else rng.uniform(0.70, 0.80) for i in range(spikes * 2)]

    def pts(grow):
        out = []
        for i, k in enumerate(radii):
            a = math.pi * i / spikes
            out.append((cx + math.cos(a) * (rx * k + grow), cy + math.sin(a) * (ry * k + grow)))
        return out

    c.poly(pts(0), WHITE)
    c.poly(pts(-14), INK)
    c.poly(pts(-22), colour)


TIER_TITLES = {
    # name: (word, slab colour, text colour, decoration level)
    "title_lookout": ("LOOKOUT", SLAB, WHITE, 1),
    "title_muscle": ("MUSCLE", SOD_D, WHITE, 2),
    "title_kingpin": ("KINGPIN", INK, SOD_L, 3),
}


def slab_title(w, h, box, word, slab, fill, level, seed, tag=None, tape_colours=(SOD,), red_rim=False, burst=None):
    """A lettering sticker. Hierarchy comes from decoration density, not from colour:
    level 1 = one slab; 2 = + a second slab behind it + tape + drips; 3 = + crown tag."""
    c = Canvas(w, h)
    x0, y0, x1, y1 = box
    if burst:
        burst_sticker(c, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 0.50, (y1 - y0) * 0.56, burst, seed)
    if level >= 2:
        # a second sticker underneath, rotated: the wall has been pasted over before
        under = Canvas(w, h)
        sticker_rrect(under, (x0 + 20, y0 + 26, x1 - 10, y1 - 4), 34, GREY_D, border=12, outline=6, shadow=0)
        c.im.alpha_composite(under.im.rotate(-3.5, resample=Image.BICUBIC, center=(w * SS / 2, h * SS / 2)))
    inner = sticker_rrect(c, (x0, y0 + 10, x1 - 16, y1 - 22), 34, slab, border=14, outline=8, shadow=12)
    if red_rim:
        ix0, iy0, ix1, iy1 = inner
        c.d.rounded_rectangle(c.s(ix0 + 6, iy0 + 6, ix1 - 6, iy1 - 6), radius=22 * SS, outline=RED, width=6 * SS)
    lay = text_layer(word, TITLE_FONT, (y1 - y0) * 0.52, fill, 7, 0, spacing=4)
    lay = ink_shadow(lay, 6, 6)
    place_text(c, lay, (x0 + x1 - 16) / 2, (y0 + y1 - 12) / 2, max_w=(x1 - x0) * 0.84, max_h=(y1 - y0) * 0.62)
    if level >= 2:
        for i, col in enumerate(tape_colours):
            tape(c, x0 + 60 + i * 30, y0 + 22 + i * 8, 150, 46, -24, col, seed + i)
        tape(c, x1 - 70, y1 - 40, 150, 46, -20, tape_colours[-1], seed + 9)
        drips(c, x0 + 80, x1 - 120, y1 - 30, slab, 4, seed, maxlen=34, w=12)
    if level >= 3 and tag:
        t = text_layer(tag, TAG_FONT, (y1 - y0) * 0.22, SOD, 5, 6).rotate(8, resample=Image.BICUBIC, expand=True)
        tw, th = t.width / SS, t.height / SS
        place_text(c, t, x1 - 24 - tw / 2, y0 + th / 2)
    grain(c, seed)
    return c.done()


def titles():
    out = {}
    out["turfSplash/title_lookout.png"] = slab_title(1024, 360, (16, 12, 1011, 336), "LOOKOUT", SLAB, WHITE, 1, 61)
    out["turfSplash/title_muscle.png"] = slab_title(1024, 360, (16, 12, 1011, 336), "MUSCLE", SOD_D, WHITE, 2, 62)
    # Kingpin = the sticky-Bruiser tier, so the one red allowed here is its rim
    out["turfSplash/title_kingpin.png"] = slab_title(1024, 360, (16, 12, 1011, 336), "KINGPIN", INK, SOD_L, 3, 63,
                                                    tag="the boss", tape_colours=(SOD, SOD_L), red_rim=True)
    return out


BANNERS = [
    # file, word, slab, text, level, tape colours
    ("big", "BIG WIN", SLAB, WHITE, 1, (SOD,)),
    ("superwin", "SUPER WIN", SLAB, CYAN, 2, (CYAN,)),
    ("mega", "MEGA WIN", SLAB, MAGENTA, 2, (MAGENTA, CYAN)),
    ("epic", "EPIC WIN", SOD_D, ACID, 3, (ACID, MAGENTA, CYAN)),
    ("max", "MAX WIN", INK, SOD, 3, (SOD, ACID, MAGENTA, CYAN)),
]


def banners():
    out = {}
    for i, (name, word, slab, fill, level, tapes) in enumerate(BANNERS):
        tag = {"epic": "no way", "max": "all of it"}.get(name)
        burst = None  # tried a starburst: hidden behind the full-width slab, only ragged tips showed
        out[f"turfWinBanners/{name}.png"] = slab_title(1000, 560, (6, 10, 990, 368), word, slab, fill, level,
                                                       71 + i * 3, tag=tag, tape_colours=tapes, burst=burst)
    return out


def logo():
    c = Canvas(1200, 520)
    # orange slab, tilted, with the name on it and a crown tag
    slab = Canvas(1200, 520)
    sticker_rrect(slab, (40, 70, 1160, 450), 40, SOD, border=16, outline=9, shadow=14)
    c.im.alpha_composite(slab.im.rotate(3, resample=Image.BICUBIC, center=(600 * SS, 260 * SS)))
    lay = ink_shadow(text_layer("TURF WAR", TITLE_FONT, 210, WHITE, 9, 0, spacing=6), 9, 9)
    place_text(c, lay, 600, 262, max_w=1000, max_h=300, angle=3)
    tape(c, 110, 90, 190, 56, -30, CYAN, 81)
    tape(c, 1090, 430, 190, 56, -30, MAGENTA, 82)
    drips(c, 260, 900, 430, SOD, 5, 83, maxlen=48, w=14)
    grain(c, 9)
    return {"turfBrand/logo.png": c.done()}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--install", action="store_true")
    a = ap.parse_args()
    pieces = {**board(), **ui_plates(), **titles(), **banners(), **logo()}
    for rel, im in pieces.items():
        p = OUT / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        im.save(p)
        if a.install:
            dst = SPRITES / rel
            bak = BACKUP / rel
            if dst.exists() and not bak.exists():
                bak.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(dst, bak)
            shutil.copy2(p, dst)
    print(f"{len(pieces)} files{' installed' if a.install else ''} -> {OUT}")


if __name__ == "__main__":
    main()
