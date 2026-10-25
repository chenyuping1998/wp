#!/usr/bin/env python3
"""Generate the 7 adjusted Hot Miami symbols to fix visual hierarchy and contrast.

Symbols:
  h3: Flamingo with wings spread wide (50x, broad substantial shape, hot pink & magenta)
  h4: Boombox in muted bronze & dark amber (30x, subdued, darker values)
  h5: Sports car in muted teal & deep sea-green (10x, subdued, no neon glow)
  l1, l2, l3, l4: Solid chunky card royals A, K, Q, J in desaturated cool grey-violet

All symbols: 512x512 PNG, transparent background, alpha=255, 60-80% coverage.
"""

from __future__ import annotations

import math
import os
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

FONT_ORBITRON = STATIC / "fonts" / "Orbitron.ttf"
FONT_TITAN = STATIC / "fonts" / "TitanOne.ttf"


# ===========================================================================
# 1. h3.png — Flamingo with Wings Spread Wide (50x)
# ===========================================================================
def build_spread_wing_flamingo(size: int = 512) -> Image.Image:
    """Flamingo with wings spread wide in bold comic pop-art style."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx = sw // 2
    cy = int(sh * 0.54)

    # Palette
    hot_pink = (255, 70, 150)
    mid_magenta = (210, 30, 115)
    dark_magenta = (140, 15, 75)
    shadow_pink = (90, 8, 48)
    black = (0, 0, 0, 255)
    white = (255, 255, 255, 255)
    bill_yellow = (255, 190, 40)

    # 1. Spread Wings Geometry (Left and Right Wings spanning wide across cell)
    # Wing feathers geometry
    def make_wing_feathers(side: float):
        # side = 1.0 for right wing, -1.0 for left wing
        feathers = []
        # Main upper wing arch
        feathers.append([
            (cx + side * 40 * ss, cy - 20 * ss),
            (cx + side * 140 * ss, cy - 140 * ss),
            (cx + side * 320 * ss, cy - 160 * ss),
            (cx + side * 420 * ss, cy - 110 * ss),  # wing tip 1
            (cx + side * 360 * ss, cy - 50 * ss),
            (cx + side * 400 * ss, cy - 30 * ss),   # wing tip 2
            (cx + side * 330 * ss, cy + 20 * ss),
            (cx + side * 360 * ss, cy + 50 * ss),   # wing tip 3
            (cx + side * 290 * ss, cy + 80 * ss),
            (cx + side * 310 * ss, cy + 110 * ss),  # wing tip 4
            (cx + side * 240 * ss, cy + 120 * ss),
            (cx + side * 260 * ss, cy + 150 * ss),  # wing tip 5
            (cx + side * 180 * ss, cy + 140 * ss),
            (cx + side * 120 * ss, cy + 110 * ss),
            (cx + side * 40 * ss, cy + 40 * ss),
        ])
        return feathers

    # Left & Right wing polygons
    left_wing = make_wing_feathers(-1.0)[0]
    right_wing = make_wing_feathers(1.0)[0]

    # Heavy black outline pass for wings
    draw.polygon(left_wing, fill=black, outline=black)
    draw.line(left_wing + [left_wing[0]], fill=black, width=int(14 * ss), joint="curve")
    draw.polygon(right_wing, fill=black, outline=black)
    draw.line(right_wing + [right_wing[0]], fill=black, width=int(14 * ss), joint="curve")

    # Wing fills with cel shading
    draw.polygon(left_wing, fill=mid_magenta)
    draw.polygon(right_wing, fill=mid_magenta)

    # Inner wing top highlights
    for side in (-1.0, 1.0):
        inner_pts = [
            (cx + side * 50 * ss, cy - 15 * ss),
            (cx + side * 150 * ss, cy - 120 * ss),
            (cx + side * 300 * ss, cy - 135 * ss),
            (cx + side * 380 * ss, cy - 95 * ss),
            (cx + side * 300 * ss, cy - 40 * ss),
            (cx + side * 180 * ss, cy + 10 * ss),
            (cx + side * 60 * ss, cy + 10 * ss),
        ]
        draw.polygon(inner_pts, fill=hot_pink)

        # Feather detail lines in black
        for i in range(1, 6):
            fx = cx + side * (120 + i * 45) * ss
            fy = cy - (100 - i * 40) * ss
            draw.line([(fx, fy), (cx + side * (70 + i * 20) * ss, cy + 20 * ss)], fill=black, width=int(5 * ss))
            draw.line([(fx, fy), (cx + side * (70 + i * 20) * ss, cy + 20 * ss)], fill=dark_magenta, width=int(2 * ss))

    # 2. Main Body & Tail
    body_pts = [
        (cx - 70 * ss, cy - 20 * ss),
        (cx - 85 * ss, cy + 50 * ss),
        (cx - 60 * ss, cy + 140 * ss),
        (cx - 30 * ss, cy + 180 * ss),
        (cx, cy + 200 * ss),           # tail bottom
        (cx + 30 * ss, cy + 180 * ss),
        (cx + 60 * ss, cy + 140 * ss),
        (cx + 85 * ss, cy + 50 * ss),
        (cx + 70 * ss, cy - 20 * ss),
    ]
    # Body shadow & outline
    draw.polygon(body_pts, fill=black)
    draw.line(body_pts + [body_pts[0]], fill=black, width=int(14 * ss), joint="curve")
    draw.polygon(body_pts, fill=hot_pink)

    # Cel shaded chest shadow
    chest_shadow = [
        (cx - 50 * ss, cy + 60 * ss),
        (cx, cy + 190 * ss),
        (cx + 50 * ss, cy + 60 * ss),
        (cx, cy + 90 * ss),
    ]
    draw.polygon(chest_shadow, fill=dark_magenta)

    # 3. Slender Legs trailing downward
    for lx in (cx - 25 * ss, cx + 25 * ss):
        draw.line([(lx, cy + 180 * ss), (lx + 10 * ss, cy + 290 * ss), (lx - 5 * ss, cy + 390 * ss)], fill=black, width=int(14 * ss))
        draw.line([(lx, cy + 180 * ss), (lx + 10 * ss, cy + 290 * ss), (lx - 5 * ss, cy + 390 * ss)], fill=mid_magenta, width=int(6 * ss))
        # Webbed feet
        foot_pts = [
            (lx - 5 * ss, cy + 390 * ss),
            (lx - 30 * ss, cy + 420 * ss),
            (lx + 20 * ss, cy + 420 * ss),
        ]
        draw.polygon(foot_pts, fill=black)
        draw.polygon(foot_pts, fill=dark_magenta)

    # 4. S-Curved Neck & Elegant Head
    neck_pts = [
        (cx + 15 * ss, cy - 10 * ss),
        (cx + 35 * ss, cy - 70 * ss),
        (cx + 20 * ss, cy - 140 * ss),
        (cx - 20 * ss, cy - 200 * ss),
        (cx - 60 * ss, cy - 260 * ss),
        (cx - 40 * ss, cy - 320 * ss),
        (cx + 10 * ss, cy - 350 * ss),  # head top
        (cx + 50 * ss, cy - 340 * ss),
        (cx + 65 * ss, cy - 300 * ss),
        (cx + 30 * ss, cy - 260 * ss),
        (cx + 5 * ss, cy - 190 * ss),
        (cx + 45 * ss, cy - 130 * ss),
        (cx + 60 * ss, cy - 60 * ss),
        (cx + 40 * ss, cy - 10 * ss),
    ]
    draw.polygon(neck_pts, fill=black)
    draw.line(neck_pts + [neck_pts[0]], fill=black, width=int(14 * ss), joint="curve")
    draw.polygon(neck_pts, fill=hot_pink)

    # Hooked Bill
    bill_pts = [
        (cx + 60 * ss, cy - 335 * ss),
        (cx + 115 * ss, cy - 325 * ss),
        (cx + 140 * ss, cy - 275 * ss),  # hooked tip down
        (cx + 115 * ss, cy - 270 * ss),
        (cx + 90 * ss, cy - 295 * ss),
        (cx + 65 * ss, cy - 305 * ss),
    ]
    draw.polygon(bill_pts, fill=black)
    draw.line(bill_pts + [bill_pts[0]], fill=black, width=int(12 * ss), joint="curve")
    draw.polygon(bill_pts, fill=bill_yellow)
    # Bill black hooked tip
    tip_pts = [
        (cx + 105 * ss, cy - 315 * ss),
        (cx + 140 * ss, cy - 275 * ss),
        (cx + 115 * ss, cy - 270 * ss),
        (cx + 95 * ss, cy - 295 * ss),
    ]
    draw.polygon(tip_pts, fill=black)

    # Eye & eye ring
    eye_x, eye_y = cx + 30 * ss, cy - 330 * ss
    draw.ellipse([eye_x - 12 * ss, eye_y - 12 * ss, eye_x + 12 * ss, eye_y + 12 * ss], fill=black)
    draw.ellipse([eye_x - 8 * ss, eye_y - 8 * ss, eye_x + 8 * ss, eye_y + 8 * ss], fill=white)
    draw.ellipse([eye_x - 4 * ss, eye_y - 4 * ss, eye_x + 4 * ss, eye_y + 4 * ss], fill=black)

    # Resize to 512x512
    out = layer.resize((size, size), Image.LANCZOS)
    return out


# ===========================================================================
# 2. h4.png — Boombox in Muted Bronze & Dark Amber (30x)
# ===========================================================================
def build_muted_bronze_boombox(size: int = 512) -> Image.Image:
    """Upright boombox in muted bronze & dark amber to keep contrast below h1/h2."""
    src_path = DESIGN / "source" / "h4.png"
    if src_path.exists():
        im = Image.open(src_path).convert("RGBA")
        arr = np.asarray(im, dtype=np.float64)
        alpha = arr[..., 3] / 255.0

        r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
        # Identify yellow/gold pixels
        is_gold = (r > 150) & (g > 120) & (b < 100) & (alpha > 0.5)
        is_bright = (r > 200) & (g > 180) & (alpha > 0.5)

        # Remap to muted bronze and dark amber:
        # Bronze base: R: 140, G: 95, B: 40 (deep rich antique brass)
        # Shadow: R: 75, G: 45, B: 18
        arr[..., 0] = np.where(is_gold, r * 0.58 + 20, arr[..., 0])
        arr[..., 1] = np.where(is_gold, g * 0.46 + 10, arr[..., 1])
        arr[..., 2] = np.where(is_gold, b * 0.35 + 8, arr[..., 2])

        arr[..., 0] = np.where(is_bright, 165, arr[..., 0])
        arr[..., 1] = np.where(is_bright, 115, arr[..., 1])
        arr[..., 2] = np.where(is_bright, 50, arr[..., 2])

        out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
        return out

    # If source does not exist, render procedurally
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, sh // 2

    # Draw upright bronze boombox
    bronze_base = (135, 90, 38)
    bronze_shadow = (75, 48, 18)
    bronze_high = (175, 125, 60)
    black = (0, 0, 0, 255)

    bx0, by0, bx1, by1 = cx - 140 * ss, cy - 180 * ss, cx + 140 * ss, cy + 220 * ss
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=int(24 * ss), fill=black, outline=black, width=int(14 * ss))
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=int(24 * ss), fill=bronze_base)

    # Handle on top
    hx0, hy0, hx1, hy1 = cx - 90 * ss, cy - 250 * ss, cx + 90 * ss, cy - 170 * ss
    draw.rounded_rectangle([hx0, hy0, hx1, hy1], radius=int(16 * ss), outline=black, width=int(14 * ss))
    draw.rounded_rectangle([hx0, hy0, hx1, hy1], radius=int(16 * ss), outline=bronze_high, width=int(6 * ss))

    # Stacked speakers
    for sy in (cy - 75 * ss, cy + 115 * ss):
        draw.ellipse([cx - 95 * ss, sy - 95 * ss, cx + 95 * ss, sy + 95 * ss], fill=black)
        draw.ellipse([cx - 90 * ss, sy - 90 * ss, cx + 90 * ss, sy + 90 * ss], fill=bronze_shadow, outline=black, width=int(8 * ss))
        draw.ellipse([cx - 65 * ss, sy - 65 * ss, cx + 65 * ss, sy + 65 * ss], fill=(30, 20, 10), outline=black, width=int(6 * ss))
        draw.ellipse([cx - 25 * ss, sy - 25 * ss, cx + 25 * ss, sy + 25 * ss], fill=bronze_base)

    # Equalizer in center
    eq_y = cy + 20 * ss
    draw.rounded_rectangle([cx - 100 * ss, eq_y - 25 * ss, cx + 100 * ss, eq_y + 25 * ss], radius=int(8 * ss), fill=(20, 14, 8), outline=black, width=int(6 * ss))

    return layer.resize((size, size), Image.LANCZOS)


# ===========================================================================
# 3. h5.png — Sports Car in Muted Teal & Deep Sea-Green (10x)
# ===========================================================================
def build_muted_teal_car(size: int = 512) -> Image.Image:
    """Sports car in muted teal and deep sea-green to make it the most subdued premium."""
    src_path = DESIGN / "source" / "h5.png"
    if src_path.exists():
        im = Image.open(src_path).convert("RGBA")
        arr = np.asarray(im, dtype=np.float64)
        alpha = arr[..., 3] / 255.0

        r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
        # Identify green car paint pixels
        is_green = (g > 120) & (g > r * 1.1) & (alpha > 0.5)
        is_bright_green = (g > 180) & (r < 180) & (alpha > 0.5)

        # Remap to muted dark teal / deep sea-green:
        # Body: R: 28, G: 85, B: 80 (deep ocean teal)
        # Highlight: R: 55, G: 125, B: 118
        arr[..., 0] = np.where(is_green, r * 0.18 + 15, arr[..., 0])
        arr[..., 1] = np.where(is_green, g * 0.42 + 25, arr[..., 1])
        arr[..., 2] = np.where(is_green, b * 0.20 + 75, arr[..., 2])

        arr[..., 0] = np.where(is_bright_green, 45, arr[..., 0])
        arr[..., 1] = np.where(is_bright_green, 115, arr[..., 1])
        arr[..., 2] = np.where(is_bright_green, 108, arr[..., 2])

        out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
        return out

    # Procedural fallback
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, sh // 2

    teal_body = (35, 95, 90)
    teal_shadow = (18, 55, 52)
    teal_high = (65, 135, 128)
    black = (0, 0, 0, 255)

    car_pts = [
        (cx - 200 * ss, cy + 70 * ss),
        (cx - 190 * ss, cy + 20 * ss),
        (cx - 100 * ss, cy - 20 * ss),
        (cx - 10 * ss, cy - 60 * ss),
        (cx + 80 * ss, cy - 60 * ss),
        (cx + 170 * ss, cy + 10 * ss),
        (cx + 210 * ss, cy + 60 * ss),
        (cx + 210 * ss, cy + 110 * ss),
        (cx - 200 * ss, cy + 110 * ss),
    ]
    draw.polygon(car_pts, fill=black)
    draw.line(car_pts + [car_pts[0]], fill=black, width=int(14 * ss), joint="curve")
    draw.polygon(car_pts, fill=teal_body)

    return layer.resize((size, size), Image.LANCZOS)


# ===========================================================================
# 4. l1..l4 — Solid Chunky Card Royals (A, K, Q, J) in Cool Grey-Violet
# ===========================================================================
def build_solid_chunky_royal(letter: str, size: int = 512) -> Image.Image:
    """Solid filled, chunky card royal in desaturated cool grey-violet."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, sh // 2

    # Cool grey-violet palette
    face_col = (136, 132, 158)     # #88849E cool grey-violet
    body_col = (107, 103, 128)     # #6B6780 mid tone
    shadow_col = (75, 71, 93)      # #4B475D shadow
    black = (0, 0, 0, 255)

    # Use heavy block variable font
    font = None
    if FONT_ORBITRON.exists():
        font = ImageFont.truetype(str(FONT_ORBITRON), int(310 * ss))
        try:
            font.set_variation_by_axes([900])
        except Exception:
            pass
    elif FONT_TITAN.exists():
        font = ImageFont.truetype(str(FONT_TITAN), int(310 * ss))
    else:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = (sh - th) // 2 - int(16 * ss)

    # 1. Heavy Black Comic Drop Shadow (bottom-right offset)
    shadow_offset = int(14 * ss)
    draw.text(
        (tx + shadow_offset, ty + shadow_offset),
        letter,
        font=font,
        fill=black,
        stroke_width=int(28 * ss),
        stroke_fill=black,
    )

    # 2. Heavy Black Ink Outer Stroke
    draw.text(
        (tx, ty),
        letter,
        font=font,
        fill=black,
        stroke_width=int(26 * ss),
        stroke_fill=black,
    )

    # 3. Solid Flat Color Body with subtle vertical shading
    body_mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(body_mask).text(
        (tx, ty),
        letter,
        font=font,
        fill=255,
        stroke_width=int(14 * ss),
        stroke_fill=255,
    )

    # Vertical gradient plate for body
    grad = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(sh):
        t = y / sh
        if t < 0.40:
            k = t / 0.40
            r = int(face_col[0] * (1 - k) + body_col[0] * k)
            g = int(face_col[1] * (1 - k) + body_col[1] * k)
            b = int(face_col[2] * (1 - k) + body_col[2] * k)
        else:
            k = (t - 0.40) / 0.60
            r = int(body_col[0] * (1 - k) + shadow_col[0] * k)
            g = int(body_col[1] * (1 - k) + shadow_col[1] * k)
            b = int(body_col[2] * (1 - k) + shadow_col[2] * k)
        gdraw.line([(0, y), (sw, y)], fill=(r, g, b, 255))
    grad.putalpha(body_mask)
    layer = Image.alpha_composite(layer, grad)

    # 4. Inner Comic Bevel Line (white top highlight)
    ldraw = ImageDraw.Draw(layer)
    ldraw.text((tx, ty), letter, font=font, fill=(0, 0, 0, 0), stroke_width=int(3 * ss), stroke_fill=(210, 205, 230, 200))

    # Resize to 512x512
    out = layer.resize((size, size), Image.LANCZOS)
    return out


# ===========================================================================
# Main Execution
# ===========================================================================
def main():
    print("=== Generating 7 Adjusted Hot Miami Symbols ===")

    # 1. h3.png (Flamingo with spread wings)
    h3_img = build_spread_wing_flamingo(size=512)
    h3_img.save(SPRITES / "h3.png")
    h3_img.save(SOURCE / "h3.png")
    print(f"[OK] h3.png -> {SPRITES / 'h3.png'}")

    # 2. h4.png (Boombox in muted bronze & dark amber)
    h4_img = build_muted_bronze_boombox(size=512)
    h4_img.save(SPRITES / "h4.png")
    h4_img.save(SOURCE / "h4.png")
    print(f"[OK] h4.png -> {SPRITES / 'h4.png'}")

    # 3. h5.png (Sports car in muted teal & deep sea-green)
    h5_img = build_muted_teal_car(size=512)
    h5_img.save(SPRITES / "h5.png")
    h5_img.save(SOURCE / "h5.png")
    print(f"[OK] h5.png -> {SPRITES / 'h5.png'}")

    # 4. l1..l4 (Solid chunky card royals A, K, Q, J)
    royal_map = {"l1": "A", "l2": "K", "l3": "Q", "l4": "J"}
    for file_key, letter in royal_map.items():
        royal_img = build_solid_chunky_royal(letter, size=512)
        royal_img.save(SPRITES / f"{file_key}.png")
        print(f"[OK] {file_key}.png ({letter}) -> {SPRITES / f'{file_key}.png'}")

    print("\n=== All 7 Symbols Generated and Installed ===")


if __name__ == "__main__":
    main()
