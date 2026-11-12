#!/usr/bin/env python3
"""Wild Alchemy's own shared FX textures and coin sheet.

    /Applications/anaconda3/bin/python3 design/build_wild_alchemy_fx.py

fx_glow / fx_star / fx_streak / fx_vignette and the coin sheet were carried
over from Hard Time byte for byte (only the folder was renamed). Review has
rejected a game before for re-using another title's assets, so this draws
this game's versions from scratch. Same file names, sizes and frame layout, so
no code changes:

  static/assets/sprites/wildAlchemyFx/fx_glow.png      128x128  soft halo
  static/assets/sprites/wildAlchemyFx/fx_star.png      128x128  eight-point star
  static/assets/sprites/wildAlchemyFx/fx_streak.png    128x128  horizontal spindle
  static/assets/sprites/wildAlchemyFx/fx_vignette.png  256x256  edge shade
  static/assets/sprites/coin/coin.png + coin.json      512x384  12 x 128px spin

Colour rules. glow / star / streak are TINTED at runtime (every particle is
one of them, drawn additively with a tint), so they stay near-white: a warm
parchment-white core shading to pale alchemy gold at the fringe. A strongly
coloured texture would multiply against every tint and shift it. The colour
identity lives in the untinted pieces: the vignette is emerald-black ink at
the sides and walnut in the corners; the coins are warm gold with a verdigris
(emerald) rim and an engraved alchemical sign — Sol (circle with a point) on
the face, the fire triangle on the reverse.

Alpha profiles keep the old textures' reach (the code sizes each sprite to
its texture's visible extent): glow fades out by ~0.95 r, the streak is a
thin band across the middle ~90% of the width, the vignette is clear inside
the middle half and ~0.87 alpha at the edge.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
FX_DIR = APP / "static" / "assets" / "sprites" / "wildAlchemyFx"
COIN_DIR = APP / "static" / "assets" / "sprites" / "coin"

# palette (game/palette.ts family)
PARCHMENT_WHITE = np.array([255, 249, 236], float)
PALE_GOLD = np.array([255, 224, 158], float)
GOLD_LIGHT = (250, 226, 160)
GOLD = (226, 178, 84)
GOLD_DEEP = (176, 124, 46)
EDGE = (118, 78, 30)
INK = (52, 32, 16)
VERDIGRIS = (63, 138, 110)
VERDIGRIS_DARK = (30, 84, 64)
EMERALD_INK = np.array([14, 30, 22], float)
WALNUT_INK = np.array([38, 24, 14], float)


def grid(size: int):
    c = (size - 1) / 2
    y, x = np.mgrid[0:size, 0:size].astype(float)
    return (x - c) / c, (y - c) / c  # -1..1


def to_image(rgb: np.ndarray, alpha: np.ndarray) -> Image.Image:
    a = np.clip(alpha, 0, 1)
    out = np.dstack([np.clip(rgb, 0, 255), a * 255]).round().astype(np.uint8)
    # fully transparent pixels carry no colour (no dark fringe under filtering)
    out[a <= 0.002] = 0
    return Image.fromarray(out)


def warm(t: np.ndarray) -> np.ndarray:
    """0 = parchment-white core, 1 = pale gold fringe."""
    t = np.clip(t, 0, 1)[..., None]
    return PARCHMENT_WHITE * (1 - t) + PALE_GOLD * t


# ── glow: a soft halo with a faint second ring, like light through glass ────
def build_glow(size=128) -> Image.Image:
    x, y = grid(size)
    r = np.hypot(x, y)
    core = np.exp(-(r / 0.36) ** 2)
    body = np.exp(-(r / 0.62) ** 2) * 0.55
    ring = np.exp(-((r - 0.66) / 0.08) ** 2) * 0.12  # the flask-glass halo
    alpha = core * 0.62 + body + ring
    alpha *= np.clip((0.97 - r) / 0.12, 0, 1)  # reach ends inside the cell
    alpha = alpha / alpha.max() * 0.99
    return to_image(warm(r / 0.9), alpha)


# ── star: eight points (four long, four short) round a small sun ────────────
def build_star(size=128) -> Image.Image:
    x, y = grid(size)
    r = np.hypot(x, y) + 1e-6
    th = np.arctan2(y, x)

    def rays(count, phase, length, width):
        # angular distance to the nearest ray, as a ray of tapering width
        k = 2 * math.pi / count
        d = np.abs(((th - phase + k / 2) % k) - k / 2)
        half = width * np.clip(1 - r / length, 0, 1) ** 1.15 / np.maximum(r, 0.05)
        return np.clip(1 - d / np.maximum(half, 1e-4), 0, 1) * (r < length)

    long_rays = rays(4, 0.0, 0.9, 0.2)
    short_rays = rays(4, math.pi / 4, 0.58, 0.14) * 0.9
    core = np.exp(-(r / 0.16) ** 2)
    halo = np.exp(-(r / 0.42) ** 2) * 0.32
    ring = np.exp(-((r - 0.3) / 0.035) ** 2) * 0.35  # the Sol circle
    alpha = np.maximum.reduce([long_rays, short_rays, core, halo + ring])
    img = to_image(warm(r / 0.8), alpha)
    return img.filter(ImageFilter.GaussianBlur(0.6))


# ── streak: a pointed spindle, not an ellipse ───────────────────────────────
def build_streak(size=128) -> Image.Image:
    x, y = grid(size)
    reach = 0.9
    u = np.clip(1 - np.abs(x) / reach, 0, 1)  # 1 at centre, 0 at the tips
    half_h = 0.13 * u ** 1.35 + 1e-3  # spindle: pointed ends, full in the middle
    across = np.exp(-(y / half_h) ** 2 * 2.2)
    along = u ** 0.7
    alpha = across * along * 0.97
    hot = np.exp(-(y / (half_h * 0.35)) ** 2) * along  # bright thread down the axis
    rgb = warm(1 - hot)
    return to_image(rgb, alpha)


# ── vignette: emerald-black at the sides, walnut in the corners ─────────────
def build_vignette(size=256) -> Image.Image:
    x, y = grid(size)
    # superellipse distance: squarer than a circle, so it follows a 16:9 frame
    d = (np.abs(x) ** 4 + np.abs(y) ** 4) ** 0.25
    t = np.clip((d - 0.5) / 0.5, 0, 1)
    alpha = (t ** 1.25) * 0.87
    corner = np.clip((np.abs(x) * np.abs(y) - 0.3) / 0.6, 0, 1)[..., None]
    rgb = EMERALD_INK * (1 - corner) + WALNUT_INK * corner
    return to_image(rgb, alpha)


# ── coins: gold disc, verdigris rim, engraved Sol / fire triangle ───────────
FRAMES, CELL, SS = 12, 128, 4


def draw_coin(index: int) -> Image.Image:
    s = CELL * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    theta = index / FRAMES * 2 * math.pi
    half_w = max(0.08, abs(math.cos(theta)))
    facing = math.cos(theta) >= 0

    r = s * 0.42
    cx = cy = s / 2
    rx = r * half_w
    box = [cx - rx, cy - r, cx + rx, cy + r]
    thick = s * 0.04 * (1 - half_w) + s * 0.014
    lw = max(3, int(s * 0.016))

    # the coin's edge (cylinder wall) in verdigris, then the face
    d.ellipse([box[0] - thick, box[1], box[2] + thick, box[3]], fill=VERDIGRIS_DARK + (255,))
    d.ellipse(box, fill=(GOLD if facing else GOLD_DEEP) + (255,))
    # verdigris rim band just inside the edge
    d.ellipse(box, outline=VERDIGRIS + (255,), width=max(4, int(s * 0.03 * max(half_w, 0.35))))

    if half_w > 0.3:
        engrave = (EDGE if facing else INK) + (235,)
        sx = half_w  # the face is foreshortened horizontally
        if facing:
            # Sol: circle with a point
            rr = r * 0.4
            d.ellipse([cx - rr * sx, cy - rr, cx + rr * sx, cy + rr], outline=engrave, width=lw)
            pr = r * 0.085
            d.ellipse([cx - pr * sx, cy - pr, cx + pr * sx, cy + pr], fill=engrave)
        else:
            # fire: an upward triangle
            tr = r * 0.46
            pts = [(cx, cy - tr), (cx + tr * 0.87 * sx, cy + tr * 0.5), (cx - tr * 0.87 * sx, cy + tr * 0.5)]
            d.line(pts + [pts[0]], fill=engrave, width=lw, joint="curve")
        # a soft highlight on the upper left of the face
        hl = Image.new("L", (s, s), 0)
        ImageDraw.Draw(hl).ellipse(
            [cx - rx * 0.78, cy - r * 0.78, cx - rx * 0.05, cy - r * 0.2], fill=120 if facing else 70
        )
        hl = hl.filter(ImageFilter.GaussianBlur(s * 0.03))
        face_mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(face_mask).ellipse(box, fill=255)
        hl = Image.fromarray((np.asarray(hl, float) * np.asarray(face_mask, float) / 255).astype(np.uint8))
        img.alpha_composite(Image.merge("RGBA", (*[Image.new("L", (s, s), c) for c in GOLD_LIGHT], hl)))

    # keyline in brown ink
    d = ImageDraw.Draw(img)
    d.ellipse([box[0] - thick, box[1], box[2] + thick, box[3]], outline=INK + (255,), width=max(3, int(s * 0.012)))
    return img.resize((CELL, CELL), Image.LANCZOS)


def build_coins():
    cols = 4
    rows = math.ceil(FRAMES / cols)
    sheet = Image.new("RGBA", (cols * CELL, rows * CELL), (0, 0, 0, 0))
    frames = {}
    for i in range(FRAMES):
        x, y = (i % cols) * CELL, (i // cols) * CELL
        sheet.paste(draw_coin(i), (x, y))
        frames[f"{i + 1}.png"] = {
            "frame": {"x": x, "y": y, "w": CELL, "h": CELL},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": CELL, "h": CELL},
            "sourceSize": {"w": CELL, "h": CELL},
        }
    COIN_DIR.mkdir(parents=True, exist_ok=True)
    sheet.save(COIN_DIR / "coin.png", optimize=True)
    data = {
        "frames": frames,
        "animations": {"coin": [f"{i + 1}.png" for i in range(FRAMES)]},
        "meta": {
            "app": "design/build_wild_alchemy_fx.py",
            "version": "2.0",
            "image": "coin.png",
            "format": "RGBA8888",
            "size": {"w": cols * CELL, "h": rows * CELL},
            "scale": "1",
        },
    }
    (COIN_DIR / "coin.json").write_text(json.dumps(data, indent="\t"), encoding="utf8")


def main():
    FX_DIR.mkdir(parents=True, exist_ok=True)
    for name, build in [("fx_glow", build_glow), ("fx_star", build_star), ("fx_streak", build_streak), ("fx_vignette", build_vignette)]:
        img = build()
        img.save(FX_DIR / f"{name}.png", optimize=True)
        print(f"[OK] {name}.png {img.size}")
    build_coins()
    print("[OK] coin.png (512, 384) + coin.json, 12 frames")


if __name__ == "__main__":
    main()
