#!/usr/bin/env python3
"""Turf War's cover art — the wide banner on the game's Stake Engine page.

    python3 design/build_cover_art.py

Writes design/cover/TurfWar-Cover-BG.png (opaque backdrop) and TurfWar-Cover-FG.png
(cast, props and wordmark on transparency), both 1920x1080 — the same BG/FG split as
the thumbnail — and _preview_overlays.png with the dashboard's two overlays drawn on
(game-reskin references/packaging.md §6b):

  top-right    the star-rating pill            -> keep 16% x 14% empty
  bottom-left  the square game thumbnail tile  -> keep 24% x 34% empty

Built from the game's own art: the night alley with the lowrider (bg_epic), the
Bruiser cast as he stands beside the reels (design/cast_parts/base/full.png), the
Bruiser symbol mid-swing, the chain crown and the lowrider, and the spray-paint
wordmark. The figure is a black hoodie on a night street, so the backdrop is knocked
back with a gradient that is strongest behind him (never a pale panel), and every
cut-out carries a hard sodium-orange offset — the sticker edge of the street art —
instead of an ink shadow that would vanish on the dark ground.

Only one Turf character exists yet; add the FG character here once it is drawn.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

D = Path(__file__).resolve().parent
APP = D.parent
OUT = D / "cover"
SPR = APP / "static/assets/sprites"

W, H = 1920, 1080
ORANGE = (0xE8, 0x66, 0x1C, 255)
NIGHT = (0x0E, 0x0D, 0x0C)

PILL = (int(W * 0.84), 0, W, int(H * 0.14))
TILE = (0, int(H * 0.66), int(W * 0.24), H)


def lift(a: np.ndarray, haze, behind: np.ndarray) -> np.ndarray:
    """Lift a night plate into the store's brightness band (2026-10-11).

    The platform auto-lightened Turf War's first cover by 35% (mean luma 18).
    Store art must not be dark: gamma opens the shadows (contrast survives,
    unlike a flat fog), then a light haze leans in, hardest behind the cast —
    the backdrop goes TOWARD light behind a figure, never toward black.
    """
    a = 255 * np.clip(1.15 * (a / 255) ** 0.40, 0, 1)
    k = (0.10 + 0.22 * behind)[..., None]
    return a * (1 - k) + np.array(haze) * k


def check_brightness(im: Image.Image) -> None:
    """Same gate as game-reskin scripts/check_thumbnail.py, plus a house margin."""
    v = np.asarray(im.convert("RGB").resize((356, 200), Image.LANCZOS)).astype(float) @ [0.2126, 0.7152, 0.0722]
    v = np.sort(v.ravel())
    mean, p10, dark = v.mean(), v[int(len(v) * 0.10)], (v < 32).mean()
    print(f"BG mean={mean:.0f} p10={p10:.0f} dark<32={dark:.1%}")
    assert mean >= 100 and p10 >= 35 and dark <= 0.30, "cover backdrop too dark for the store (keep mean >= 100)"


def backdrop() -> Image.Image:
    bg = Image.open(SPR / "turfBackground/bg_epic.png").convert("RGB").resize((W, H), Image.LANCZOS)
    a = np.asarray(bg).astype(float)
    yy, xx = np.mgrid[0:H, 0:W]
    behind = np.exp(-(((xx - W * 0.66) / (W * 0.28)) ** 2 + ((yy - H * 0.55) / (H * 0.65)) ** 2))
    a = lift(a, (232, 178, 128), behind)  # sodium-lit haze
    # a low sodium-lamp glow under him so the hoodie separates from the street
    glow = np.exp(-(((xx - W * 0.76) / (W * 0.16)) ** 2 + ((yy - H * 0.95) / (H * 0.28)) ** 2))[..., None]
    a = a + glow * np.array((120, 52, 14)) * 0.55
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert("RGBA")


def cutout(path: Path, height: int) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def place(canvas: Image.Image, fig: Image.Image, x: int, y: int, offset=(12, 10)) -> Image.Image:
    """Composite with a hard orange sticker offset; return the footprint mask."""
    a = fig.getchannel("A")
    edge = Image.new("RGBA", fig.size, ORANGE)
    edge.putalpha(a.filter(ImageFilter.MaxFilter(5)))
    canvas.alpha_composite(edge, (x + offset[0], y + offset[1]))
    canvas.alpha_composite(fig, (x, y))
    mask = Image.new("L", (W, H), 0)
    mask.paste(a, (x, y))
    mask.paste(a, (x + offset[0], y + offset[1]), a)
    return mask


def hits(mask: Image.Image, zone) -> bool:
    return np.asarray(mask.crop(zone)).max() > 8


def main() -> None:
    OUT.mkdir(exist_ok=True)
    bg = backdrop()
    check_brightness(bg)
    bg.convert("RGB").save(OUT / "TurfWar-Cover-BG.png")

    fg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    masks = {}
    car = cutout(SPR / "turfSymbols/h5.png", 280)
    masks["lowrider"] = place(fg, car, 560, H - car.height - 24)
    crown = cutout(SPR / "turfSymbols/h1.png", 230)
    masks["crown"] = place(fg, crown, 260, 430)
    guy = cutout(APP / "design/cast_parts/base/full.png", 880)
    masks["guy"] = place(fg, guy, 1060 - guy.width // 2, H - guy.height - 10, offset=(14, 12))
    # mirrored, as in game: the art turns his head to image right, away from
    # the Bruiser and the middle of the banner
    kingpin = cutout(APP / "design/_incoming/fg/full.png", 880).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    masks["kingpin"] = place(fg, kingpin, 1530 - kingpin.width // 2, H - kingpin.height - 10, offset=(14, 12))
    logo = cutout(SPR / "turfBrand/logo.png", 330)
    lx, ly = int(W * 0.05), 70
    fg.alpha_composite(logo, (lx, ly))
    m = Image.new("L", (W, H), 0)
    m.paste(logo.getchannel("A"), (lx, ly))
    masks["logo"] = m

    for name, mask in masks.items():
        for zname, zone in (("rating pill", PILL), ("thumbnail tile", TILE)):
            assert not hits(mask, zone), f"{name} reaches into the {zname} {zone}"
    fg.save(OUT / "TurfWar-Cover-FG.png")

    prev = Image.alpha_composite(bg, fg)
    d = ImageDraw.Draw(prev)
    d.rounded_rectangle(PILL, radius=30, outline=(255, 255, 255, 255), width=5)
    d.rectangle(TILE, outline=(255, 255, 255, 255), width=5)
    prev.convert("RGB").save(OUT / "_preview_overlays.png")
    print("wrote", ", ".join(p.name for p in sorted(OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
