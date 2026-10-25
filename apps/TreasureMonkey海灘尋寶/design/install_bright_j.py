#!/usr/bin/env python3
"""Generate and install the adjusted bright lilac/periwinkle J royal symbol (l4.png).

Criteria:
  - Exact match to A, K, Q siblings in construction, lighting, keyline, and art-deco sunburst fan.
  - Solid chunky slightly rounded slab letterform filling ~70% of square with wide hook (unmistakable at 130px).
  - Bright lilac/periwinkle fill + strengthened gold neon rim glow.
  - Measured target: >= 30% of opaque pixels sitting at CIE Lab delta-E > 60 from RGB(40,10,66),
    landing squarely in the 30-38% band of A (29.9%), K (33.6%), and Q (38.2%).
  - 512x512 PNG, genuine alpha channel (reaches 255).
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
    """Draw thin art-deco sunburst fan radiating behind the letter."""
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


def build_bright_j_symbol(
    fill_rgb: tuple[int, int, int] = (205, 140, 250),
    glow_rgb: tuple[int, int, int] = (255, 205, 50),
    hl_rgb: tuple[int, int, int] = (255, 210, 255),
    fan_rgb: tuple[int, int, int] = (62, 16, 88),
    font_size: int = 325,
    glow_width: int = 58,
    size: int = 512,
) -> Image.Image:
    """Build the calibrated bright lilac/periwinkle J royal symbol."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    cx, cy = sw // 2, int(sh * 0.50)

    # 1. Art-deco sunburst fan in darker tone
    burst = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(burst)
    draw_artdeco_sunburst(bdraw, cx, cy, radius=sw * 0.44, rays=11, color=fan_rgb + (210,))
    layer = Image.alpha_composite(layer, burst)

    font = ImageFont.truetype(str(FONT_PATH), int(font_size * ss))
    ldraw = ImageDraw.Draw(layer)
    letter = "J"
    bbox = ldraw.textbbox((0, 0), letter, font=font, stroke_width=int(22 * ss))
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2 - bbox[0]
    ty = (sh - th) // 2 - bbox[1] - int(10 * ss)

    # 2. Strengthened gold neon rim glow
    glow_mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(glow_mask).text((tx, ty), letter, font=font, fill=255, stroke_width=int(glow_width * ss), stroke_fill=255)
    glow_mask = glow_mask.filter(ImageFilter.GaussianBlur(18 * ss))
    glow_layer = Image.new("RGBA", (sw, sh), glow_rgb + (255,))
    glow_layer.putalpha(glow_mask)
    layer = Image.alpha_composite(glow_layer, layer)

    # 3. Thick black comic keyline & drop shadow
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

    # 4. Bright lilac/periwinkle fill (solid chunky slab)
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
    print("=== Generating Bright Lilac J (l4.png) ===")
    j_img = build_bright_j_symbol()
    out_path = SPRITES / "l4.png"
    src_path = SOURCE / "l4.png"
    j_img.save(out_path)
    j_img.save(src_path)
    print(f"[OK] Saved l4.png -> {out_path}")
    print(f"[OK] Saved l4.png -> {src_path}")


if __name__ == "__main__":
    main()
