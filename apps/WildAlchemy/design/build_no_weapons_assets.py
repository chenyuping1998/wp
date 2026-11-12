#!/usr/bin/env python3
"""Process and install assets generated from docs/art-prompts-no-weapons.md.

Assets:
  1. h1.png: Top-paying symbol (400x) - confident 1980s Miami man bust, no weapons, no alcohol, no cigarette
  2. h2.png: 2nd-paying symbol (200x) - glamorous 1980s Miami woman bust, no drinks, no bikini, fully clothed
  3. tile_foreground.png: Store tile foreground - two characters full body, no weapons, fully clothed, margins >= 10%
  4. tile_background.png: Store tile background - empty Miami beachfront sunset, full bleed, absolutely NO text
  5. thumbnail.png: Store preview composition
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
STATIC = APP / "static"
SPRITES = STATIC / "assets" / "sprites"
SOURCE = DESIGN / "source"
GEN_DIR = Path("/Users/stone/.gemini/antigravity-ide/brain/b70ab809-0eff-46e5-a52a-d15b26d622d5")

SPRITES.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

AI_ASSETS = {
    "h1": GEN_DIR / "h1_no_weapons_1786545488934.png",
    "h2": GEN_DIR / "h2_no_weapons_1786545589958.png",
    "tile_fg": GEN_DIR / "tile_fg_no_weapons_1786545525439.png",
    "tile_bg": GEN_DIR / "tile_bg_no_weapons_1786545562244.png",
}


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


def main():
    print("=== Processing Hot Miami No-Weapons Assets ===")

    # 1. Process h1.png (Top-paying symbol, 512x512)
    if AI_ASSETS["h1"].exists():
        raw_h1 = Image.open(AI_ASSETS["h1"])
        keyed_h1 = key_chroma(raw_h1, tol=62, despill_edge=True)
        h1 = square_and_fit(keyed_h1, size=512, margin=0.04)
        out_h1 = SPRITES / "hotMiamiSymbols" / "h1.png"
        h1.save(out_h1)
        h1.save(SOURCE / "h1.png")
        print(f"[OK] h1.png (No weapons) -> {out_h1}")

    # 2. Process h2.png (2nd symbol, 512x512)
    if AI_ASSETS["h2"].exists():
        raw_h2 = Image.open(AI_ASSETS["h2"])
        keyed_h2 = key_chroma(raw_h2, tol=62, despill_edge=True)
        h2 = square_and_fit(keyed_h2, size=512, margin=0.04)
        out_h2 = SPRITES / "hotMiamiSymbols" / "h2.png"
        h2.save(out_h2)
        h2.save(SOURCE / "h2.png")
        print(f"[OK] h2.png (No drinks/bikini) -> {out_h2}")

    # 3. Process tile_foreground.png (1024x1024, margin >= 10%)
    if AI_ASSETS["tile_fg"].exists():
        raw_fg = Image.open(AI_ASSETS["tile_fg"])
        keyed_fg = key_chroma(raw_fg, tol=65, despill_edge=True)
        box = keyed_fg.getbbox()
        if box:
            cropped = keyed_fg.crop(box)
            hero = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
            # inner 80% leaves 10% margins on top, bottom, left, and right
            inner_h = int(1024 * 0.80)
            inner_w = int(1024 * 0.80)
            cropped.thumbnail((inner_w, inner_h), Image.LANCZOS)
            hero.paste(cropped, ((1024 - cropped.width) // 2, (1024 - cropped.height) // 2), cropped)
            out_fg = SPRITES / "hotMiamiBrand" / "tile_foreground.png"
            hero.save(out_fg)
            hero.save(SOURCE / "tile_foreground.png")
            print(f"[OK] tile_foreground.png (No weapons/bikinis, 10% margin) -> {out_fg}")

    # 4. Process tile_background.png (1024x1024, full bleed, zero text)
    if AI_ASSETS["tile_bg"].exists():
        raw_bg = Image.open(AI_ASSETS["tile_bg"]).convert("RGB")
        tile_bg = raw_bg.resize((1024, 1024), Image.LANCZOS)
        out_bg = SPRITES / "hotMiamiBrand" / "tile_background.png"
        tile_bg.save(out_bg)
        print(f"[OK] tile_background.png (Full bleed, no text) -> {out_bg}")

    # 5. Compose Store Thumbnail Preview
    bg_path = SPRITES / "hotMiamiBrand" / "tile_background.png"
    fg_path = SPRITES / "hotMiamiBrand" / "tile_foreground.png"
    logo_path = SPRITES / "hotMiamiBrand" / "logo.png"

    if bg_path.exists() and fg_path.exists() and logo_path.exists():
        thumb = Image.open(bg_path).convert("RGBA")
        fg = Image.open(fg_path).convert("RGBA")
        logo = Image.open(logo_path).convert("RGBA")

        # Composite characters on background
        thumb.alpha_composite(fg, (0, 0))

        # Composite logo in top-center / upper region
        logo_w, logo_h = int(1024 * 0.65), int(520 * (1024 * 0.65) / 1200)
        logo_small = logo.resize((logo_w, logo_h), Image.LANCZOS)
        thumb.alpha_composite(logo_small, ((1024 - logo_w) // 2, int(1024 * 0.04)))

        out_thumb = SPRITES / "hotMiamiBrand" / "thumbnail.png"
        thumb.convert("RGB").save(out_thumb)
        print(f"[OK] thumbnail.png (Composed preview) -> {out_thumb}")

    # 6. Check and remove any legacy thumbnail if found in upload directory
    upload_thumb = APP.parent.parent / "upload" / "HotMiami" / "HotMiami_thumbnail_1024.png"
    if upload_thumb.exists():
        upload_thumb.unlink()
        print(f"[REMOVED] Legacy {upload_thumb}")

    print("\n=== All No-Weapons Assets Successfully Built and Installed ===")


if __name__ == "__main__":
    main()
