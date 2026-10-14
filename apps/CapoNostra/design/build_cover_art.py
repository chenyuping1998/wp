#!/usr/bin/env python3
"""Capo Nostra's cover art — the wide banner on the game's Stake Engine page.

    python design/build_cover_art.py

Writes design/cover/CapoNostra-Cover-BG.png (opaque backdrop) and
CapoNostra-Cover-FG.png (cast + props on transparency), both 1920x1080 — the same
BG/FG split as the thumbnail — and _preview_overlays.png with the dashboard's two
overlays drawn on (game-reskin references/packaging.md §6b):

  top-right    the star-rating pill            -> keep 16% x 14% empty
  bottom-left  the square game thumbnail tile  -> keep 24% x 34% empty

Built from the game's own finished Art Deco art (ART_BRIEF §0.3: black, greys, paper,
red only for multipliers): the paper sunburst and stepped skyline of the store tile,
BOTH cast figures (MG Don, FG hostess), the Violin Case, and the logo set in Limelight.
The figures are black silhouettes, so the backdrop is the paper side of the palette
and each figure gets a hard ink offset shadow — not a pale spotlight panel, which
was rejected on Go Banandit as a white slab behind the character.

Re-run after the cast changes (the heavier Don redraw, 2026-10-04).
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

D = Path(__file__).resolve().parent
APP = D.parent
OUT = D / "cover"
SPR = APP / "static/assets/sprites"

W, H = 1920, 1080
INK = (0x12, 0x12, 0x12, 255)
DARK = (0x33, 0x33, 0x33, 255)
GREY = (0x8C, 0x8C, 0x8C, 255)
PAPER = (0xEC, 0xE8, 0xDF, 255)
SS = 2

PILL = (int(W * 0.84), 0, W, int(H * 0.14))
TILE = (0, int(H * 0.66), int(W * 0.24), H)


def backdrop() -> Image.Image:
    im = Image.new("RGBA", (W * SS, H * SS), PAPER)
    d = ImageDraw.Draw(im)
    cx, cy = W * 0.5 * SS, H * 0.92 * SS
    rays, r = 26, 2400 * SS
    for i in range(rays):
        if i % 2:
            continue
        a0 = math.pi + math.pi * i / rays
        a1 = math.pi + math.pi * (i + 1) / rays
        d.polygon([(cx, cy), (cx + r * math.cos(a0), cy + r * math.sin(a0)),
                   (cx + r * math.cos(a1), cy + r * math.sin(a1))], fill=GREY)
    d.ellipse((cx - 150 * SS, cy - 150 * SS, cx + 150 * SS, cy + 150 * SS), fill=PAPER)
    # stepped Deco skyline along the bottom, deterministic
    rnd = random.Random(1930)
    x = 0
    base = H * SS
    while x < W * SS:
        bw = rnd.randint(40, 110) * SS
        bh = rnd.randint(70, 190) * SS
        d.rectangle((x, base - bh, x + bw, base), fill=INK)
        if rnd.random() < 0.5:  # ziggurat setback
            d.rectangle((x + bw * 0.25, base - bh - 30 * SS, x + bw * 0.75, base - bh), fill=INK)
            if rnd.random() < 0.5:
                d.rectangle((x + bw * 0.45, base - bh - 70 * SS, x + bw * 0.55, base - bh - 30 * SS), fill=INK)
        x += bw + rnd.randint(0, 14) * SS
    return im.resize((W, H), Image.LANCZOS)


def cutout(path: Path, height: int) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def place(canvas: Image.Image, fig: Image.Image, x: int, y: int, shadow=(14, 12)) -> tuple[int, int, int, int]:
    a = fig.getchannel("A")
    sil = Image.new("RGBA", fig.size, DARK)
    sil.putalpha(a.point(lambda v: int(v * 0.8)))
    canvas.alpha_composite(sil, (x + shadow[0], y + shadow[1]))
    canvas.alpha_composite(fig, (x, y))
    return (x, y, x + fig.width + shadow[0], y + fig.height + shadow[1])


def overlaps(box, zone) -> bool:
    return not (box[2] <= zone[0] or box[0] >= zone[2] or box[3] <= zone[1] or box[1] >= zone[3])


def main() -> None:
    OUT.mkdir(exist_ok=True)
    bg = backdrop()
    bg.convert("RGB").save(OUT / "CapoNostra-Cover-BG.png")

    fg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    boxes = {}
    logo = cutout(SPR / "capoBrand/logo.png", 300)
    # the logo is paper lettering: give it an ink plate so it reads on paper rays
    plate = Image.new("RGBA", (logo.width + 60, logo.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(plate).rounded_rectangle((0, 0, plate.width - 1, plate.height - 1), radius=26, fill=INK)
    lx = int(W * 0.06)
    boxes["logo"] = place(fg, plate, lx, 60, shadow=(10, 10))
    fg.alpha_composite(logo, (lx + 30, 80))

    hostess = cutout(APP / "design/cast_parts/fg/full.png", 900)
    boxes["hostess"] = place(fg, hostess, int(W * 0.74) - hostess.width // 2, H - 900 - 20)
    don = cutout(APP / "design/cast_parts/mg/full.png", 880)
    boxes["don"] = place(fg, don, int(W * 0.50) - don.width // 2, H - 880 - 20)
    case = cutout(SPR / "capoSymbols/sw.png", 330)
    boxes["case"] = place(fg, case, int(W * 0.345) - case.width // 2, H - 330 - 60, shadow=(10, 9))

    for name, box in boxes.items():
        for zname, zone in (("rating pill", PILL), ("thumbnail tile", TILE)):
            assert not overlaps(box, zone), f"{name} {box} overlaps the {zname} {zone}"
    fg.save(OUT / "CapoNostra-Cover-FG.png")

    prev = Image.alpha_composite(bg, fg)
    d = ImageDraw.Draw(prev)
    d.rounded_rectangle(PILL, radius=30, outline=(193, 39, 45, 255), width=6)
    d.rectangle(TILE, outline=(193, 39, 45, 255), width=6)
    prev.convert("RGB").save(OUT / "_preview_overlays.png")
    print("wrote", ", ".join(p.name for p in sorted(OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
