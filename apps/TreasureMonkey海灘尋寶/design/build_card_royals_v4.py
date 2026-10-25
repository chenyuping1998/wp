#!/usr/bin/env python3
"""Generate the 4 consistent card royals (A, K, Q, J) for Hot Miami slot game.

Set specifications:
  - Same construction, lighting, palette logic, border treatment
  - 512x512 PNG, fully transparent background (alpha reaching 255)
  - Solid, chunky, slightly rounded slab letterforms filling ~70% of square
  - Bold black-outlined comic style, flat vivid fill, cel-shaded top-left highlight
  - Soft neon rim glow in specified accent color
  - Thin art-deco sunburst fan in a darker tone behind each letter
  - Color logic:
      A (l1.png): Hot magenta letter, cyan rim glow
      K (l2.png): Cyan letter, magenta rim glow
      Q (l3.png): Warm gold letter, magenta rim glow (distinct thick tail breaking bowl)
      J (l4.png): Violet letter, gold rim glow (wide open hook, unmistakable at 130px)
  - Moderate brightness: target dE 45-55 from RGB(40,10,66)
"""

from __future__ import annotations

import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
STATIC = APP / "static"
SPRITES = STATIC / "assets" / "sprites" / "hotMiamiSymbols"
SOURCE = DESIGN / "source"

SPRITES.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

FONT_PATH = STATIC / "fonts" / "TitanOne.ttf"


def draw_artdeco_sunburst(
    draw: ImageDraw.ImageDraw,
    cx: int,
    cy: int,
    radius: float,
    rays: int = 11,
    color: tuple = (62, 16, 88, 210),
):
    """Draw a thin art-deco sunburst fan radiating behind the letter."""
    for i in range(rays):
        angle_deg = -160 + i * (140.0 / (rays - 1))
        a_mid = math.radians(angle_deg)
        a0 = a_mid - math.radians(2.2)
        a1 = a_mid + math.radians(2.2)
        pts = [
            (cx, cy + int(radius * 0.12)),
            (cx + radius * math.cos(a0), cy + radius * math.sin(a0)),
            (cx + radius * math.cos(a1), cy + radius * math.sin(a1)),
        ]
        draw.polygon(pts, fill=color)


def build_royal_symbol(
    letter: str,
    fill_rgb: tuple[int, int, int],
    glow_rgb: tuple[int, int, int],
    hl_rgb: tuple[int, int, int],
    fan_rgb: tuple[int, int, int] = (62, 16, 88),
    font_size: int = 320,
    size: int = 512,
) -> Image.Image:
    """Build a single card royal symbol with consistent art-deco sunburst, neon rim glow, and comic cel shading."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    cx, cy = sw // 2, int(sh * 0.50)

    # 1. Art-deco sunburst fan in darker tone behind letter
    burst = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(burst)
    draw_artdeco_sunburst(bdraw, cx, cy, radius=sw * 0.44, rays=11, color=fan_rgb + (210,))
    layer = Image.alpha_composite(layer, burst)

    font = ImageFont.truetype(str(FONT_PATH), int(font_size * ss))
    ldraw = ImageDraw.Draw(layer)
    bbox = ldraw.textbbox((0, 0), letter, font=font, stroke_width=int(22 * ss))
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2 - bbox[0]
    ty = (sh - th) // 2 - bbox[1] - int(10 * ss)

    # 2. Soft neon rim glow in accent color
    glow_mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(glow_mask).text((tx, ty), letter, font=font, fill=255, stroke_width=int(40 * ss), stroke_fill=255)
    glow_mask = glow_mask.filter(ImageFilter.GaussianBlur(16 * ss))
    glow_layer = Image.new("RGBA", (sw, sh), glow_rgb + (230,))
    glow_layer.putalpha(glow_mask)
    layer = Image.alpha_composite(glow_layer, layer)

    # 3. Thick black comic keyline and solid drop shadow
    draw = ImageDraw.Draw(layer)
    shadow_off = int(14 * ss)
    draw.text(
        (tx + shadow_off, ty + shadow_off),
        letter,
        font=font,
        fill=(0, 0, 0, 255),
        stroke_width=int(38 * ss),
        stroke_fill=(0, 0, 0, 255),
    )
    draw.text(
        (tx, ty),
        letter,
        font=font,
        fill=(0, 0, 0, 255),
        stroke_width=int(34 * ss),
        stroke_fill=(0, 0, 0, 255),
    )

    # 4. Flat vivid fill (thick chunky solid slab)
    draw.text(
        (tx, ty),
        letter,
        font=font,
        fill=fill_rgb + (255,),
        stroke_width=int(18 * ss),
        stroke_fill=fill_rgb + (255,),
    )

    # 5. Cel-shaded top-left highlight line
    draw.text(
        (tx - int(4 * ss), ty - int(4 * ss)),
        letter,
        font=font,
        fill=(0, 0, 0, 0),
        stroke_width=int(4 * ss),
        stroke_fill=hl_rgb + (240,),
    )

    # Resize to 512x512
    out = layer.resize((size, size), Image.LANCZOS)
    return out


def main():
    print("=== Generating 4 Consistent Card Royals (A, K, Q, J) ===")

    # Color configurations:
    # A (l1): Hot magenta letter, cyan rim glow
    # K (l2): Cyan letter, magenta rim glow
    # Q (l3): Warm gold letter, magenta rim glow
    # J (l4): Violet letter, gold rim glow
    configs = [
        ("l1", "A", (225, 40, 135), (0, 215, 240), (255, 155, 210)),
        ("l2", "K", (0, 165, 185), (230, 35, 140), (140, 235, 255)),
        ("l3", "Q", (195, 140, 35), (230, 35, 140), (245, 195, 95)),
        ("l4", "J", (165, 55, 205), (240, 185, 45), (225, 140, 255)),
    ]

    for file_key, letter, fill, glow, hl in configs:
        royal_img = build_royal_symbol(letter, fill, glow, hl, font_size=320, size=512)
        out_path = SPRITES / f"{file_key}.png"
        src_path = SOURCE / f"{file_key}.png"
        royal_img.save(out_path)
        royal_img.save(src_path)
        print(f"[OK] Saved {file_key}.png ({letter}) -> {out_path}")

    print("\n=== All 4 Card Royals Successfully Built and Saved ===")


if __name__ == "__main__":
    main()
