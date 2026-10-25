#!/usr/bin/env python3
"""Generate the 5 fixed Hot Miami symbols (h3 complete flamingo + l1..l4 pale silver-grey royals).

Target:
  - h3.png: Complete flamingo standing with wings partly open (entire bird visible, no edge clipping)
  - l1.png..l4.png: Chunky solid pale silver-grey letters (A, K, Q, J) on dark board

Output directly to: static/assets/sprites/hotMiamiSymbols/ and design/source/
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

SPRITES.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

FONT_ORBITRON = STATIC / "fonts" / "Orbitron.ttf"
FONT_TITAN = STATIC / "fonts" / "TitanOne.ttf"


# ===========================================================================
# 1. h3.png — Complete Standing Flamingo with Partly Open Wings (50x)
# ===========================================================================
def build_complete_standing_flamingo(size: int = 512) -> Image.Image:
    """A complete flamingo standing with wings partly open, 100% inside the frame."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # Colors
    hot_pink = (255, 70, 150)
    mid_magenta = (215, 30, 115)
    dark_magenta = (145, 15, 75)
    shadow_pink = (95, 8, 48)
    black = (0, 0, 0, 255)
    white = (255, 255, 255, 255)
    bill_yellow = (255, 195, 45)

    # Center origin
    cx = int(sw * 0.50)
    cy = int(sh * 0.50)

    # 1. Broad partly-open wings (left and right)
    # Left wing (broad back wing)
    left_wing = [
        (cx - 30 * ss, cy - 30 * ss),
        (cx - 100 * ss, cy - 100 * ss),
        (cx - 210 * ss, cy - 110 * ss),
        (cx - 320 * ss, cy - 60 * ss),   # top-left primary feather
        (cx - 360 * ss, cy + 10 * ss),   # mid primary feather
        (cx - 320 * ss, cy + 80 * ss),   # lower primary feather
        (cx - 240 * ss, cy + 130 * ss),  # secondary feather
        (cx - 160 * ss, cy + 140 * ss),
        (cx - 70 * ss, cy + 100 * ss),
    ]

    # Right wing (front folded/lifted wing)
    right_wing = [
        (cx + 40 * ss, cy - 40 * ss),
        (cx + 120 * ss, cy - 90 * ss),
        (cx + 240 * ss, cy - 80 * ss),
        (cx + 330 * ss, cy - 30 * ss),   # top-right feather
        (cx + 360 * ss, cy + 40 * ss),   # mid feather
        (cx + 310 * ss, cy + 110 * ss),  # lower feather
        (cx + 220 * ss, cy + 145 * ss),
        (cx + 130 * ss, cy + 135 * ss),
        (cx + 50 * ss, cy + 80 * ss),
    ]

    # Draw Wings Black Outline
    for wing_poly in (left_wing, right_wing):
        draw.polygon(wing_poly, fill=black)
        draw.line(wing_poly + [wing_poly[0]], fill=black, width=int(14 * ss), joint="curve")

    # Wing Fills
    draw.polygon(left_wing, fill=mid_magenta)
    draw.polygon(right_wing, fill=hot_pink)

    # Left Wing Scalloped Feather Detail
    for i in range(1, 5):
        wx = cx - (80 + i * 55) * ss
        wy = cy - (90 - i * 40) * ss
        draw.line([(wx, wy), (cx - (40 + i * 25) * ss, cy + 60 * ss)], fill=black, width=int(6 * ss))
        draw.line([(wx, wy), (cx - (40 + i * 25) * ss, cy + 60 * ss)], fill=dark_magenta, width=int(2 * ss))

    # Right Wing Inner Highlight & Scallops
    right_inner = [
        (cx + 50 * ss, cy - 30 * ss),
        (cx + 130 * ss, cy - 70 * ss),
        (cx + 220 * ss, cy - 60 * ss),
        (cx + 280 * ss, cy - 15 * ss),
        (cx + 240 * ss, cy + 60 * ss),
        (cx + 150 * ss, cy + 90 * ss),
        (cx + 60 * ss, cy + 60 * ss),
    ]
    draw.polygon(right_inner, fill=(255, 120, 185))
    for i in range(1, 5):
        wx = cx + (70 + i * 50) * ss
        wy = cy - (70 - i * 35) * ss
        draw.line([(wx, wy), (cx + (35 + i * 20) * ss, cy + 50 * ss)], fill=black, width=int(6 * ss))

    # 2. Main Plump Body & Tail
    body_pts = [
        (cx - 75 * ss, cy - 40 * ss),
        (cx - 95 * ss, cy + 25 * ss),
        (cx - 70 * ss, cy + 100 * ss),
        (cx - 35 * ss, cy + 140 * ss),
        (cx, cy + 155 * ss),           # tail
        (cx + 45 * ss, cy + 130 * ss),
        (cx + 85 * ss, cy + 60 * ss),
        (cx + 80 * ss, cy - 25 * ss),
        (cx + 45 * ss, cy - 70 * ss),
        (cx - 35 * ss, cy - 70 * ss),
    ]
    draw.polygon(body_pts, fill=black)
    draw.line(body_pts + [body_pts[0]], fill=black, width=int(14 * ss), joint="curve")
    draw.polygon(body_pts, fill=hot_pink)

    # Body Cel Shading
    body_shadow = [
        (cx - 65 * ss, cy + 30 * ss),
        (cx - 20 * ss, cy + 145 * ss),
        (cx + 35 * ss, cy + 120 * ss),
        (cx + 10 * ss, cy + 60 * ss),
    ]
    draw.polygon(body_shadow, fill=dark_magenta)

    # 3. Two Long Legs Standing Firmly (Bottom foot well within bounds at y=460px)
    # Left Leg (Straight Standing Leg)
    l1_hip = (cx - 25 * ss, cy + 135 * ss)
    l1_knee = (cx - 30 * ss, cy + 260 * ss)
    l1_ankle = (cx - 35 * ss, cy + 390 * ss)
    draw.line([l1_hip, l1_knee, l1_ankle], fill=black, width=int(14 * ss), joint="curve")
    draw.line([l1_hip, l1_knee, l1_ankle], fill=mid_magenta, width=int(6 * ss), joint="curve")
    # Left Foot (Standing flat)
    foot1 = [(l1_ankle[0] - 25 * ss, l1_ankle[1] + 25 * ss),
             (l1_ankle[0] + 35 * ss, l1_ankle[1] + 25 * ss),
             (l1_ankle[0], l1_ankle[1])]
    draw.polygon(foot1, fill=black)
    draw.polygon(foot1, fill=dark_magenta)

    # Right Leg (Slightly Bent Front Leg)
    l2_hip = (cx + 25 * ss, cy + 130 * ss)
    l2_knee = (cx + 45 * ss, cy + 245 * ss)
    l2_ankle = (cx + 20 * ss, cy + 375 * ss)
    draw.line([l2_hip, l2_knee, l2_ankle], fill=black, width=int(14 * ss), joint="curve")
    draw.line([l2_hip, l2_knee, l2_ankle], fill=mid_magenta, width=int(6 * ss), joint="curve")
    # Right Foot
    foot2 = [(l2_ankle[0] - 20 * ss, l2_ankle[1] + 25 * ss),
             (l2_ankle[0] + 35 * ss, l2_ankle[1] + 25 * ss),
             (l2_ankle[0], l2_ankle[1])]
    draw.polygon(foot2, fill=black)
    draw.polygon(foot2, fill=dark_magenta)

    # 4. Graceful S-Curved Neck (Rising up, staying within y=65px top margin)
    neck_pts = [
        (cx - 15 * ss, cy - 65 * ss),
        (cx - 45 * ss, cy - 125 * ss),
        (cx - 65 * ss, cy - 195 * ss),
        (cx - 45 * ss, cy - 275 * ss),
        (cx + 5 * ss, cy - 345 * ss),
        (cx + 55 * ss, cy - 395 * ss),   # top crest of neck (y ~ 105px in 512 space)
        (cx + 105 * ss, cy - 390 * ss),  # head top
        (cx + 135 * ss, cy - 355 * ss),
        (cx + 115 * ss, cy - 315 * ss),
        (cx + 65 * ss, cy - 295 * ss),
        (cx + 10 * ss, cy - 250 * ss),
        (cx - 5 * ss, cy - 180 * ss),
        (cx + 10 * ss, cy - 110 * ss),
        (cx + 25 * ss, cy - 60 * ss),
    ]
    draw.polygon(neck_pts, fill=black)
    draw.line(neck_pts + [neck_pts[0]], fill=black, width=int(14 * ss), joint="curve")
    draw.polygon(neck_pts, fill=hot_pink)

    # 5. Head and Hooked Bill
    # Hooked Beak Points
    beak_pts = [
        (cx + 125 * ss, cy - 370 * ss),
        (cx + 185 * ss, cy - 355 * ss),
        (cx + 215 * ss, cy - 305 * ss),  # hooked down-curve tip
        (cx + 185 * ss, cy - 300 * ss),
        (cx + 155 * ss, cy - 325 * ss),
        (cx + 120 * ss, cy - 335 * ss),
    ]
    draw.polygon(beak_pts, fill=black)
    draw.line(beak_pts + [beak_pts[0]], fill=black, width=int(12 * ss), joint="curve")
    draw.polygon(beak_pts, fill=bill_yellow)

    # Beak Black Hooked Tip
    beak_tip = [
        (cx + 175 * ss, cy - 345 * ss),
        (cx + 215 * ss, cy - 305 * ss),
        (cx + 185 * ss, cy - 300 * ss),
        (cx + 160 * ss, cy - 325 * ss),
    ]
    draw.polygon(beak_tip, fill=black)

    # Eye
    eye_x = cx + 90 * ss
    eye_y = cy - 360 * ss
    draw.ellipse([eye_x - 12 * ss, eye_y - 12 * ss, eye_x + 12 * ss, eye_y + 12 * ss], fill=black)
    draw.ellipse([eye_x - 8 * ss, eye_y - 8 * ss, eye_x + 8 * ss, eye_y + 8 * ss], fill=white)
    draw.ellipse([eye_x - 4 * ss, eye_y - 4 * ss, eye_x + 4 * ss, eye_y + 4 * ss], fill=black)

    # Scale & fit inside 512x512 with small even margin
    box = layer.getbbox()
    cropped = layer.crop(box)
    target = int(size * 0.90)  # 90% of square leaves comfortable 5% margin on all sides
    cropped.thumbnail((target, target), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(cropped, ((size - cropped.width) // 2, (size - cropped.height) // 2), cropped)
    return canvas


# ===========================================================================
# 2. l1..l4 — Chunky Solid Pale Silver-Grey Letter Slabs (A, K, Q, J)
# ===========================================================================
def build_pale_silver_royal(letter: str, size: int = 512) -> Image.Image:
    """Solid filled, chunky card royal in solid pale silver-grey (bright solid slab)."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # Solid pale silver-grey: clearly brighter than RGB(40,10,66) board
    silver_face = (220, 224, 235, 255)   # #DCE0EB bright silver-white slab
    black = (0, 0, 0, 255)

    # Load heavy bold block font
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

    # 1. Heavy Black Comic Drop Shadow (offset down-right)
    shadow_offset = int(18 * ss)
    draw.text(
        (tx + shadow_offset, ty + shadow_offset),
        letter,
        font=font,
        fill=black,
        stroke_width=int(32 * ss),
        stroke_fill=black,
    )

    # 2. Heavy Black Ink Outer Stroke (Thick solid black contour)
    draw.text(
        (tx, ty),
        letter,
        font=font,
        fill=black,
        stroke_width=int(28 * ss),
        stroke_fill=black,
    )

    # 3. Solid Bright Pale Silver-Grey Body Fill (Solid slab, no gradient, no texture)
    draw.text(
        (tx, ty),
        letter,
        font=font,
        fill=silver_face,
        stroke_width=int(12 * ss),
        stroke_fill=silver_face,
    )

    # Scale & fit inside 512x512 with small even margin
    box = layer.getbbox()
    cropped = layer.crop(box)
    target = int(size * 0.88)
    cropped.thumbnail((target, target), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(cropped, ((size - cropped.width) // 2, (size - cropped.height) // 2), cropped)
    return canvas


# ===========================================================================
# Main Execution
# ===========================================================================
def main():
    print("=== Generating 5 Fixed Hot Miami Symbols ===")

    # 1. h3.png (Complete standing flamingo with partly open wings)
    h3_img = build_complete_standing_flamingo(size=512)
    h3_img.save(SPRITES / "h3.png")
    h3_img.save(SOURCE / "h3.png")
    print(f"[OK] h3.png -> {SPRITES / 'h3.png'}")

    # 2. l1..l4 (Solid chunky pale silver-grey royals A, K, Q, J)
    royal_map = {"l1": "A", "l2": "K", "l3": "Q", "l4": "J"}
    for file_key, letter in royal_map.items():
        royal_img = build_pale_silver_royal(letter, size=512)
        royal_img.save(SPRITES / f"{file_key}.png")
        print(f"[OK] {file_key}.png ({letter}) -> {SPRITES / f'{file_key}.png'}")

    print("\n=== 5 Symbols Successfully Generated and Installed ===")


if __name__ == "__main__":
    main()
