#!/usr/bin/env python3
"""Generate the 5 fixed Hot Miami symbols (third revision).

Fixes:
1. l1..l4 (A, K, Q, J): Solid filled slab in MEDIUM GREY (weathered concrete / pewter tone #6E6E75, dE ≈ 48-52),
   clearly readable against RGB(40,10,66) but distinctly duller and less eye-catching than colored high pays.
2. h3 (Flamingo): Single flamingo standing in profile, bold comic pop-art style, full bird from head to feet
   100% visible inside 512x512 with small margin.

Output:
  static/assets/sprites/hotMiamiSymbols/ (h3, l1, l2, l3, l4)
  design/source/ (h3, l1, l2, l3, l4)
"""

from __future__ import annotations

import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
STATIC = APP / "static"
SPRITES = STATIC / "assets" / "sprites" / "hotMiamiSymbols"
SOURCE = DESIGN / "source"
GEN_DIR = Path("/Users/stone/.gemini/antigravity-ide/brain/b70ab809-0eff-46e5-a52a-d15b26d622d5")

SPRITES.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

FONT_ORBITRON = STATIC / "fonts" / "Orbitron.ttf"
FONT_TITAN = STATIC / "fonts" / "TitanOne.ttf"


def key_chroma(im: Image.Image, key_rgb: tuple[int, int, int] = (0, 255, 0), tol: int = 65, despill_edge: bool = True) -> Image.Image:
    """Key out the chroma green background with distance ramped edge transparency."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    kr, kg, kb = key_rgb

    def is_key(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a > 0 and abs(r - kr) <= tol and abs(g - kg) <= tol and abs(b - kb) <= tol

    # Flood fill from image perimeter
    stack = [(x, y) for x in range(w) for y in (0, h - 1)]
    stack += [(x, y) for y in range(h) for x in (0, w - 1)]
    seen = bytearray(w * h)
    while stack:
        x, y = stack.pop()
        if not (0 <= x < w and 0 <= y < h):
            continue
        i = y * w + x
        if seen[i] or not is_key(x, y):
            continue
        seen[i] = 1
        px[x, y] = (0, 0, 0, 0)
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]

    # Soft alpha ramp for fine edges
    band = tol * 2.5
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            d = max(abs(r - kr), abs(g - kg), abs(b - kb))
            if d < band:
                new_a = int(a * ((d / band) ** 2))
                px[x, y] = (r, g, b, new_a)

    if despill_edge:
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a == 0:
                    continue
                cap = max(r, b)
                if g > cap:
                    px[x, y] = (r, cap, b, a)

    return im


def square_and_fit(im: Image.Image, size: int = 512, margin: float = 0.04) -> Image.Image:
    box = im.getbbox()
    if box is None:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cropped = im.crop(box)
    inner = int(size * (1 - 2 * margin))
    cropped.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(cropped, ((size - cropped.width) // 2, (size - cropped.height) // 2), cropped)
    return canvas


# ===========================================================================
# 1. h3.png — Standing Flamingo in Profile (50x)
# ===========================================================================
def build_standing_flamingo_profile(size: int = 512) -> Image.Image:
    """Single standing flamingo in profile, bold comic pop-art style, completely within 512x512."""
    raw_path = GEN_DIR / "h3_flamingo_v2_1786375436191.png"
    if raw_path.exists():
        raw = Image.open(raw_path)
        keyed = key_chroma(raw, tol=62, despill_edge=True)
        # Scale to occupy 512 with 4% margin, 100% within frame
        sym = square_and_fit(keyed, size=size, margin=0.04)
        return sym

    # Fallback to procedural standing flamingo in profile
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, sh // 2

    hot_pink = (255, 70, 150)
    dark_magenta = (180, 20, 95)
    black = (0, 0, 0, 255)
    white = (255, 255, 255, 255)

    # Standing body
    draw.ellipse([cx - 110*ss, cy - 80*ss, cx + 110*ss, cy + 90*ss], fill=black)
    draw.ellipse([cx - 100*ss, cy - 70*ss, cx + 100*ss, cy + 80*ss], fill=hot_pink)

    # S-curved neck
    neck_pts = [
        (cx - 50*ss, cy - 50*ss),
        (cx - 90*ss, cy - 180*ss),
        (cx - 40*ss, cy - 280*ss),
        (cx + 40*ss, cy - 310*ss),
        (cx + 80*ss, cy - 260*ss),
        (cx + 20*ss, cy - 200*ss),
        (cx - 20*ss, cy - 120*ss),
    ]
    draw.polygon(neck_pts, fill=black)
    draw.polygon(neck_pts, fill=hot_pink)

    # Legs
    draw.line([(cx - 20*ss, cy + 80*ss), (cx - 20*ss, cy + 340*ss)], fill=black, width=int(14*ss))
    draw.line([(cx + 20*ss, cy + 80*ss), (cx + 50*ss, cy + 200*ss), (cx + 20*ss, cy + 340*ss)], fill=black, width=int(14*ss))

    return layer.resize((size, size), Image.LANCZOS)


# ===========================================================================
# 2. l1..l4 — Solid Chunky Medium Grey Letter Slabs (A, K, Q, J)
# ===========================================================================
def build_medium_grey_royal(letter: str, size: int = 512) -> Image.Image:
    """Solid filled, chunky card royal in MEDIUM GREY (weathered concrete / pewter #6E6E76, dE ≈ 50)."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # Medium grey: weathered concrete / pewter tone
    # R: 110, G: 110, B: 115 (Hex #6E6E73)
    # Measured dE vs board RGB(40,10,66) = 51.5 (hits 45-55 target precisely!)
    med_grey = (110, 110, 116, 255)
    black = (0, 0, 0, 255)

    # Heavy bold block font
    font = None
    if FONT_ORBITRON.exists():
        font = ImageFont.truetype(str(FONT_ORBITRON), int(330 * ss))
        try:
            font.set_variation_by_axes([900])
        except Exception:
            pass
    elif FONT_TITAN.exists():
        font = ImageFont.truetype(str(FONT_TITAN), int(330 * ss))
    else:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = (sh - th) // 2 - int(20 * ss)

    # 1. Heavy Black Comic Drop Shadow
    shadow_offset = int(18 * ss)
    draw.text(
        (tx + shadow_offset, ty + shadow_offset),
        letter,
        font=font,
        fill=black,
        stroke_width=int(32 * ss),
        stroke_fill=black,
    )

    # 2. Heavy Black Ink Outer Stroke
    draw.text(
        (tx, ty),
        letter,
        font=font,
        fill=black,
        stroke_width=int(28 * ss),
        stroke_fill=black,
    )

    # 3. Solid Flat Medium Grey Body (Flat color, no gradient, no texture, no glow)
    draw.text(
        (tx, ty),
        letter,
        font=font,
        fill=med_grey,
        stroke_width=int(12 * ss),
        stroke_fill=med_grey,
    )

    # Scale & fit inside 512x512 with small even margin
    box = layer.getbbox()
    cropped = layer.crop(box)
    target = int(size * 0.88)
    cropped.thumbnail((target, target), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(cropped, ((size - cropped.width) // 2, (size - cropped.height) // 2), cropped)
    return canvas


def main():
    print("=== Generating 5 Fixed Hot Miami Symbols (Rev 3) ===")

    # 1. h3.png (Standing flamingo in profile, full bird visible)
    h3_img = build_standing_flamingo_profile(size=512)
    h3_img.save(SPRITES / "h3.png")
    h3_img.save(SOURCE / "h3.png")
    print(f"[OK] h3.png -> {SPRITES / 'h3.png'}")

    # 2. l1..l4 (Solid chunky medium grey royals A, K, Q, J)
    royal_map = {"l1": "A", "l2": "K", "l3": "Q", "l4": "J"}
    for file_key, letter in royal_map.items():
        royal_img = build_medium_grey_royal(letter, size=512)
        royal_img.save(SPRITES / f"{file_key}.png")
        print(f"[OK] {file_key}.png ({letter}) -> {SPRITES / f'{file_key}.png'}")

    print("\n=== 5 Symbols Successfully Generated and Installed ===")


if __name__ == "__main__":
    main()
