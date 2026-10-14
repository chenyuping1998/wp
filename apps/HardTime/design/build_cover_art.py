#!/usr/bin/env python3
"""Hard Time's cover art — the wide banner on the game's Stake Engine page.

    python3 design/build_cover_art.py

Writes design/cover/HardTime-Cover-BG.png (opaque backdrop) and HardTime-Cover-FG.png
(cast, props and wordmark on transparency), both 1920x1080 — the same BG/FG split as
the thumbnail — and _preview_overlays.png with the dashboard's two overlays drawn on
(game-reskin references/packaging.md §6b):

  top-right    the star-rating pill            -> keep 16% x 14% empty
  bottom-left  the square game thumbnail tile  -> keep 24% x 34% empty

Built from the game's own art: the moonlit breach in the wall (bg_breakout, the top
free-spin tier), the crossed-arms prisoner who stands beside the reels
(design/cast_parts/crossed_arms/full.png), the Searchlight — the game's wild — with
its beam swept up across the sky, the key ring and the handcuffs, and the wordmark.
The backdrop is knocked back with a gradient strongest behind the prisoner (never a
pale panel); cut-outs carry a hard ink offset shadow.

MG prisoner and FG warden are composed from the same source layers used in game.
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
INK = (0x0F, 0x0F, 0x0F, 255)
NIGHT = (0x0B, 0x0E, 0x14)
BEAM = np.array((255, 236, 190))

PILL = (int(W * 0.84), 0, W, int(H * 0.14))
TILE = (0, int(H * 0.66), int(W * 0.24), H)

# the searchlight's placement on the FG layer; its lens is 68% across and 41% down
# the art (measured off the brightest pixels), and it faces front-right, so the beam
# leaves the lens toward the upper right, between the moon and the prisoner's head
LIGHT_H = 350
LIGHT_CX, LIGHT_TOP = int(W * 0.36), int(H * 0.47)
LENS_FRAC = (0.68, 0.41)
BEAM_TO = (int(W * 0.80), -int(H * 0.20))


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


def backdrop(lens: tuple[int, int]) -> Image.Image:
    bg = Image.open(SPR / "hardTimeBackground/bg_breakout.jpg").convert("RGB").resize((W, H), Image.LANCZOS)
    a = np.asarray(bg).astype(float)
    yy, xx = np.mgrid[0:H, 0:W]
    behind = np.exp(-(((xx - W * 0.66) / (W * 0.28)) ** 2 + ((yy - H * 0.55) / (H * 0.65)) ** 2))
    a = lift(a, (176, 190, 208), behind)  # moonlit haze

    # the searchlight's beam: a soft cone from the lens toward the upper left
    lx, ly = lens
    vx, vy = BEAM_TO[0] - lx, BEAM_TO[1] - ly
    length = np.hypot(vx, vy)
    ux, uy = vx / length, vy / length
    px, py = xx - lx, yy - ly
    along = px * ux + py * uy
    across = np.abs(-px * uy + py * ux)
    half = 40 + along * 0.15  # the cone widens with distance
    inside = np.clip(1 - across / np.maximum(half, 1), 0, 1) ** 1.6
    fade = np.clip(along / 120, 0, 1) * np.exp(-np.clip(along, 0, None) / (length * 1.1))
    beam = (inside * fade * (along > 0))[..., None]
    a = a + beam * (BEAM - a) * 0.55
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert("RGBA")


def cutout(path: Path, height: int) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def place(canvas: Image.Image, fig: Image.Image, x: int, y: int, offset=(12, 10)) -> Image.Image:
    a = fig.getchannel("A")
    sil = Image.new("RGBA", fig.size, INK)
    sil.putalpha(a.filter(ImageFilter.MaxFilter(3)).point(lambda v: int(v * 0.85)))
    canvas.alpha_composite(sil, (x + offset[0], y + offset[1]))
    canvas.alpha_composite(fig, (x, y))
    mask = Image.new("L", (W, H), 0)
    mask.paste(a, (x, y))
    mask.paste(a, (x + offset[0], y + offset[1]), a)
    return mask


def hits(mask: Image.Image, zone) -> bool:
    return np.asarray(mask.crop(zone)).max() > 8


def main() -> None:
    OUT.mkdir(exist_ok=True)
    light = cutout(SPR / "hardTimeSymbols/sw.png", LIGHT_H)
    lx, ly = LIGHT_CX - light.width // 2, LIGHT_TOP
    lens = (lx + int(light.width * LENS_FRAC[0]), ly + int(light.height * LENS_FRAC[1]))
    bg = backdrop(lens)
    check_brightness(bg)
    bg.convert("RGB").save(OUT / "HardTime-Cover-BG.png")

    fg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    masks = {}
    cuffs = cutout(SPR / "hardTimeSymbols/h2.png", 300)
    masks["cuffs"] = place(fg, cuffs, int(W * 0.40) - cuffs.width // 2, H - cuffs.height - 40)
    keys = cutout(SPR / "hardTimeSymbols/h1.png", 300)
    masks["keys"] = place(fg, keys, int(W * 0.12), int(H * 0.36))
    masks["searchlight"] = place(fg, light, lx, ly)
    # a soft halo on the lens ties the lamp to the beam drawn behind it on the BG
    r = 120
    yy, xx = np.mgrid[-r:r, -r:r]
    halo = np.clip(1 - np.hypot(xx, yy) / r, 0, 1) ** 2.2
    glow = Image.new("RGBA", (2 * r, 2 * r), (255, 240, 205, 0))
    glow.putalpha(Image.fromarray((halo * 150).astype(np.uint8)))
    fg.alpha_composite(glow, (lens[0] - r, lens[1] - r))
    prisoner = cutout(APP / "design/cast_parts/crossed_arms/full.png", 900)
    masks["prisoner"] = place(fg, prisoner, 1060 - prisoner.width // 2, H - prisoner.height - 6,
                              offset=(14, 12))
    # mirrored, as in game: the art turns his head to image right; flipped he
    # watches the prisoner instead of looking off the edge of the banner
    warden = cutout(APP / "design/_incoming/fg/full.png", 900).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    masks["warden"] = place(fg, warden, 1530 - warden.width // 2, H - warden.height - 6, offset=(14, 12))
    logo = cutout(SPR / "hardTimeBrand/logo.png", 330)
    gx, gy = int(W * 0.06), 60
    shadow = Image.new("RGBA", logo.size, INK)
    shadow.putalpha(logo.getchannel("A").filter(ImageFilter.GaussianBlur(10)))
    fg.alpha_composite(shadow, (gx + 6, gy + 8))
    fg.alpha_composite(logo, (gx, gy))
    m = Image.new("L", (W, H), 0)
    m.paste(logo.getchannel("A"), (gx, gy))
    masks["logo"] = m

    for name, mask in masks.items():
        for zname, zone in (("rating pill", PILL), ("thumbnail tile", TILE)):
            assert not hits(mask, zone), f"{name} reaches into the {zname} {zone}"
    fg.save(OUT / "HardTime-Cover-FG.png")

    prev = Image.alpha_composite(bg, fg)
    d = ImageDraw.Draw(prev)
    d.rounded_rectangle(PILL, radius=30, outline=(255, 255, 255, 255), width=5)
    d.rectangle(TILE, outline=(255, 255, 255, 255), width=5)
    prev.convert("RGB").save(OUT / "_preview_overlays.png")
    print("wrote", ", ".join(p.name for p in sorted(OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
