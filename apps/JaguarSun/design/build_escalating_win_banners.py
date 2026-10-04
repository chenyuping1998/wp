#!/usr/bin/env python3
"""Generate the 5 escalating win celebration plaques for Hot Miami slot game.

Tiers:
  1. big.png (BIG WIN) - Slim chrome-and-magenta frame, clean straight edges, minimal decoration, cool/restrained
  2. superwin.png (SUPER WIN) - Thicker brushed-gold frame with art-deco corner fins, double outline, soft warm glow
  3. mega.png (MEGA WIN) - Heavy polished gold frame with stepped crown, palm-leaf flourishes at lower corners, radiating light
  4. epic.png (EPIC WIN) - Ornate gold and hot magenta with tall crown, wing-like sweeping fins, faceted gem accents, strong rays
  5. max.png (MAX WIN) - White-gold and cyan frame breaking outline, giant starburst, lightning filaments, extreme energy

Dimensions: 1000x560 PNG with genuine alpha channel.
Clear center and lower half: dark backing plate with NO numbers or placeholders.
"""

from __future__ import annotations

import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
STATIC = APP / "static"
SPRITES = STATIC / "assets" / "sprites" / "hotMiamiWinBanners"
SOURCE = DESIGN / "source"

SPRITES.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

FONT_ORBITRON = STATIC / "fonts" / "Orbitron.ttf"
FONT_TITAN = STATIC / "fonts" / "TitanOne.ttf"


def get_font(size: int, orbitron: bool = True) -> ImageFont.FreeTypeFont:
    path = FONT_ORBITRON if orbitron and FONT_ORBITRON.exists() else FONT_TITAN
    if not path.exists():
        return ImageFont.load_default()
    font = ImageFont.truetype(str(path), max(8, int(size)))
    try:
        font.set_variation_by_axes([900])
    except Exception:
        pass
    return font


# ===========================================================================
# 1. BIG WIN (Cool & Slim Chrome & Magenta)
# ===========================================================================
def build_big_win(width: int = 1000, height: int = 560) -> Image.Image:
    ss = 2
    sw, sh = width * ss, height * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # 1. Minimal cool glow
    glow = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    pad_x, pad_y = int(sw * 0.12), int(sh * 0.14)
    gdraw.rounded_rectangle([pad_x, pad_y, sw - pad_x, sh - pad_y], radius=int(24 * ss), fill=(235, 30, 140, 100))
    glow = glow.filter(ImageFilter.GaussianBlur(18 * ss))
    layer = Image.alpha_composite(layer, glow)

    # 2. Main Plaque Body (Clean straight edges with 45-deg chamfered corners)
    draw = ImageDraw.Draw(layer)
    bx0, by0, bx1, by1 = int(sw * 0.10), int(sh * 0.10), int(sw * 0.90), int(sh * 0.90)
    ch = int(22 * ss)  # chamfer size
    frame_pts = [
        (bx0 + ch, by0), (bx1 - ch, by0),
        (bx1, by0 + ch), (bx1, by1 - ch),
        (bx1 - ch, by1), (bx0 + ch, by1),
        (bx0, by1 - ch), (bx0, by0 + ch),
    ]

    # Solid black drop shadow & keyline
    draw.polygon([(x + int(8 * ss), y + int(10 * ss)) for x, y in frame_pts], fill=(0, 0, 0, 255))
    draw.polygon(frame_pts, fill=(18, 6, 28, 250), outline=(0, 0, 0, 255))
    draw.line(frame_pts + [frame_pts[0]], fill=(0, 0, 0, 255), width=int(14 * ss), joint="curve")

    # Chrome / Brushed silver border
    draw.line(frame_pts + [frame_pts[0]], fill=(210, 220, 235, 255), width=int(8 * ss), joint="curve")
    draw.line(frame_pts + [frame_pts[0]], fill=(255, 255, 255, 240), width=int(2 * ss), joint="curve")

    # Thin electric magenta neon tube inner outline
    in_pts = [
        (bx0 + ch + int(12 * ss), by0 + int(12 * ss)), (bx1 - ch - int(12 * ss), by0 + int(12 * ss)),
        (bx1 - int(12 * ss), by0 + ch + int(12 * ss)), (bx1 - int(12 * ss), by1 - ch - int(12 * ss)),
        (bx1 - ch - int(12 * ss), by1 - int(12 * ss)), (bx0 + ch + int(12 * ss), by1 - int(12 * ss)),
        (bx0 + int(12 * ss), by1 - ch - int(12 * ss)), (bx0 + int(12 * ss), by0 + ch + int(12 * ss)),
    ]
    draw.line(in_pts + [in_pts[0]], fill=(255, 40, 150, 240), width=int(4 * ss), joint="curve")

    # 3. Clear Lower Half Inner Panel (for win amount)
    wx0, wy0, wx1, wy1 = int(sw * 0.16), int(sh * 0.44), int(sw * 0.84), int(sh * 0.84)
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(14 * ss), fill=(14, 4, 22, 240), outline=(0, 0, 0, 255), width=int(8 * ss))
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(14 * ss), outline=(235, 40, 140, 180), width=int(3 * ss))

    # 4. Typography: "BIG WIN" (Upper Third)
    font = get_font(int(62 * ss), orbitron=True)
    text = "BIG WIN"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = int(sh * 0.25) - th // 2

    # Black stroke
    draw.text((tx, ty), text, font=font, fill=(0, 0, 0, 255), stroke_width=int(16 * ss), stroke_fill=(0, 0, 0, 255))
    # Chrome fill + magenta neon stroke
    draw.text((tx, ty), text, font=font, fill=(245, 250, 255, 255), stroke_width=int(3 * ss), stroke_fill=(255, 40, 150, 255))

    return layer.resize((width, height), Image.LANCZOS)


# ===========================================================================
# 2. SUPER WIN (Brushed Gold & Art-Deco Corner Fins)
# ===========================================================================
def build_super_win(width: int = 1000, height: int = 560) -> Image.Image:
    ss = 2
    sw, sh = width * ss, height * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # 1. Warm amber radial rays
    rays = 12
    cx, cy = sw // 2, sh // 2
    reach = sw * 0.70
    for r in range(rays):
        a0 = math.radians(r * (360.0 / rays))
        a1 = a0 + math.radians((360.0 / rays) * 0.35)
        pts = [
            (cx, cy),
            (cx + math.cos(a0) * reach, cy + math.sin(a0) * reach),
            (cx + math.cos(a1) * reach, cy + math.sin(a1) * reach),
        ]
        draw.polygon(pts, fill=(255, 180, 40, 45))

    # 2. Art-Deco Stepped Corner Fins (Stepped tabs at 4 corners)
    bx0, by0, bx1, by1 = int(sw * 0.08), int(sh * 0.08), int(sw * 0.92), int(sh * 0.92)
    fin_len = int(50 * ss)
    fin_w = int(14 * ss)

    # Draw corner fins
    for fx, fy, dx, dy in [
        (bx0, by0, 1, 1), (bx1, by0, -1, 1),
        (bx0, by1, 1, -1), (bx1, by1, -1, -1),
    ]:
        f_pts = [
            (fx - dx * int(6 * ss), fy - dy * int(6 * ss)),
            (fx + dx * fin_len, fy - dy * int(6 * ss)),
            (fx + dx * fin_len, fy + dy * fin_w),
            (fx + dx * fin_w, fy + dy * fin_w),
            (fx + dx * fin_w, fy + dy * fin_len),
            (fx - dx * int(6 * ss), fy + dy * fin_len),
        ]
        draw.polygon(f_pts, fill=(255, 195, 45, 255), outline=(0, 0, 0, 255))
        draw.line(f_pts + [f_pts[0]], fill=(0, 0, 0, 255), width=int(10 * ss), joint="curve")

    # 3. Main Brushed Gold Frame (Double outline)
    radius = int(26 * ss)
    box = [bx0, by0, bx1, by1]
    draw.rounded_rectangle([(x + int(8 * ss) if i % 2 == 0 else x) for i, x in enumerate(box)], radius=radius, fill=(0, 0, 0, 255))
    draw.rounded_rectangle(box, radius=radius, fill=(24, 8, 34, 250), outline=(0, 0, 0, 255), width=int(16 * ss))

    # Outer Brushed Gold Border
    draw.rounded_rectangle(box, radius=radius, outline=(255, 200, 45, 255), width=int(10 * ss))
    draw.rounded_rectangle(box, radius=radius, outline=(255, 245, 180, 255), width=int(3 * ss))

    # Inner Amber Neon Tube Outline
    in_box = [bx0 + int(16 * ss), by0 + int(16 * ss), bx1 - int(16 * ss), by1 - int(16 * ss)]
    draw.rounded_rectangle(in_box, radius=int(radius * 0.75), outline=(255, 140, 30, 230), width=int(5 * ss))

    # 4. Clear Lower Half Inner Panel
    wx0, wy0, wx1, wy1 = int(sw * 0.14), int(sh * 0.44), int(sw * 0.86), int(sh * 0.84)
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(16 * ss), fill=(16, 4, 22, 240), outline=(0, 0, 0, 255), width=int(8 * ss))
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(16 * ss), outline=(255, 200, 45, 220), width=int(4 * ss))

    # 5. Typography: "SUPER WIN"
    font = get_font(int(64 * ss), orbitron=True)
    text = "SUPER WIN"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = int(sh * 0.25) - th // 2

    draw.text((tx, ty), text, font=font, fill=(0, 0, 0, 255), stroke_width=int(18 * ss), stroke_fill=(0, 0, 0, 255))
    draw.text((tx, ty), text, font=font, fill=(255, 245, 210, 255), stroke_width=int(4 * ss), stroke_fill=(255, 190, 40, 255))

    return layer.resize((width, height), Image.LANCZOS)


# ===========================================================================
# 3. MEGA WIN (Heavy Polished Gold + Stepped Crown + Palm Flourishes)
# ===========================================================================
def build_mega_win(width: int = 1000, height: int = 560) -> Image.Image:
    ss = 2
    sw, sh = width * ss, height * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, int(sh * 0.52)

    # 1. 18 Radiating Sunburst Rays (Hot Magenta & Gold)
    rays = 18
    reach = sw * 0.85
    for r in range(rays):
        a0 = math.radians(r * (360.0 / rays))
        a1 = a0 + math.radians((360.0 / rays) * 0.40)
        col = (255, 50, 160, 55) if r % 2 == 0 else (255, 210, 50, 55)
        pts = [
            (cx, cy),
            (cx + math.cos(a0) * reach, cy + math.sin(a0) * reach),
            (cx + math.cos(a1) * reach, cy + math.sin(a1) * reach),
        ]
        draw.polygon(pts, fill=col)

    # 2. Stepped Art-Deco Crown at Top
    crown_pts = [
        (cx - int(180 * ss), int(sh * 0.12)),
        (cx - int(120 * ss), int(sh * 0.05)),
        (cx - int(60 * ss), int(sh * 0.05)),
        (cx - int(40 * ss), int(sh * 0.01)),  # top center crest
        (cx + int(40 * ss), int(sh * 0.01)),
        (cx + int(60 * ss), int(sh * 0.05)),
        (cx + int(120 * ss), int(sh * 0.05)),
        (cx + int(180 * ss), int(sh * 0.12)),
    ]
    draw.polygon(crown_pts + [(cx + int(180 * ss), int(sh * 0.18)), (cx - int(180 * ss), int(sh * 0.18))], fill=(255, 215, 55, 255), outline=(0, 0, 0, 255))
    draw.line(crown_pts, fill=(0, 0, 0, 255), width=int(14 * ss), joint="curve")
    draw.line(crown_pts, fill=(255, 255, 220, 255), width=int(4 * ss), joint="curve")

    # 3. Main Polished Gold Plaque Body
    bx0, by0, bx1, by1 = int(sw * 0.07), int(sh * 0.11), int(sw * 0.93), int(sh * 0.89)
    radius = int(28 * ss)
    box = [bx0, by0, bx1, by1]

    draw.rounded_rectangle(box, radius=radius, fill=(26, 6, 36, 250), outline=(0, 0, 0, 255), width=int(18 * ss))
    draw.rounded_rectangle(box, radius=radius, outline=(255, 210, 50, 255), width=int(12 * ss))
    draw.rounded_rectangle(box, radius=radius, outline=(255, 255, 200, 255), width=int(3 * ss))

    # Inner Hot Magenta Neon Frame
    in_box = [bx0 + int(18 * ss), by0 + int(18 * ss), bx1 - int(18 * ss), by1 - int(18 * ss)]
    draw.rounded_rectangle(in_box, radius=int(radius * 0.75), outline=(255, 45, 160, 240), width=int(6 * ss))

    # 4. Stylized Palm-Leaf Flourishes at Lower Corners
    for lx, ly, l_dir in [(bx0 - int(10 * ss), by1 + int(8 * ss), 1), (bx1 + int(10 * ss), by1 + int(8 * ss), -1)]:
        for p in range(4):
            pa0 = math.radians(130 * l_dir + p * 25 * l_dir)
            p_pts = [
                (lx, ly),
                (lx + int(math.cos(pa0) * 80 * ss), ly + int(math.sin(pa0) * 80 * ss)),
                (lx + int(math.cos(pa0 + math.radians(15 * l_dir)) * 60 * ss), ly + int(math.sin(pa0 + math.radians(15 * l_dir)) * 60 * ss)),
            ]
            draw.polygon(p_pts, fill=(255, 210, 50, 255), outline=(0, 0, 0, 255))
            draw.line(p_pts + [p_pts[0]], fill=(0, 0, 0, 255), width=int(8 * ss))

    # 5. Clear Lower Half Inner Panel
    wx0, wy0, wx1, wy1 = int(sw * 0.13), int(sh * 0.44), int(sw * 0.87), int(sh * 0.83)
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(16 * ss), fill=(16, 4, 24, 240), outline=(0, 0, 0, 255), width=int(8 * ss))
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(16 * ss), outline=(255, 210, 50, 220), width=int(4 * ss))

    # 6. Typography: "MEGA WIN"
    font = get_font(int(68 * ss), orbitron=True)
    text = "MEGA WIN"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = int(sh * 0.26) - th // 2

    draw.text((tx, ty), text, font=font, fill=(0, 0, 0, 255), stroke_width=int(20 * ss), stroke_fill=(0, 0, 0, 255))
    draw.text((tx, ty), text, font=font, fill=(255, 255, 225, 255), stroke_width=int(4 * ss), stroke_fill=(255, 205, 45, 255))

    return layer.resize((width, height), Image.LANCZOS)


# ===========================================================================
# 4. EPIC WIN (Ornate Gold & Magenta with Tall Crown, Wing Fins & Gems)
# ===========================================================================
def build_epic_win(width: int = 1000, height: int = 560) -> Image.Image:
    ss = 2
    sw, sh = width * ss, height * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, int(sh * 0.52)

    # 1. 24 Sunburst Rays + Sparkle Flare
    rays = 24
    reach = sw * 0.92
    for r in range(rays):
        a0 = math.radians(r * (360.0 / rays))
        a1 = a0 + math.radians((360.0 / rays) * 0.45)
        col = (255, 35, 165, 65) if r % 2 == 0 else (255, 220, 60, 65)
        pts = [
            (cx, cy),
            (cx + math.cos(a0) * reach, cy + math.sin(a0) * reach),
            (cx + math.cos(a1) * reach, cy + math.sin(a1) * reach),
        ]
        draw.polygon(pts, fill=col)

    # 2. Sweeping Wing-like Chevron Fins on Left and Right Sides
    for side in (-1, 1):
        wx = cx + side * int(sw * 0.42)
        wy = cy
        wing_pts = [
            (wx, wy - int(120 * ss)),
            (wx + side * int(70 * ss), wy - int(60 * ss)),
            (wx + side * int(95 * ss), wy),
            (wx + side * int(70 * ss), wy + int(60 * ss)),
            (wx, wy + int(120 * ss)),
            (wx + side * int(35 * ss), wy),
        ]
        draw.polygon(wing_pts, fill=(255, 45, 160, 255), outline=(0, 0, 0, 255))
        draw.line(wing_pts + [wing_pts[0]], fill=(0, 0, 0, 255), width=int(14 * ss), joint="curve")
        draw.line(wing_pts + [wing_pts[0]], fill=(255, 215, 60, 255), width=int(6 * ss), joint="curve")

    # 3. Tall Ornate Stepped Crown at Top with Faceted Gem
    crown_pts = [
        (cx - int(210 * ss), int(sh * 0.12)),
        (cx - int(140 * ss), int(sh * 0.05)),
        (cx - int(70 * ss), int(sh * 0.03)),
        (cx, 0),  # highest point
        (cx + int(70 * ss), int(sh * 0.03)),
        (cx + int(140 * ss), int(sh * 0.05)),
        (cx + int(210 * ss), int(sh * 0.12)),
    ]
    draw.polygon(crown_pts + [(cx + int(210 * ss), int(sh * 0.18)), (cx - int(210 * ss), int(sh * 0.18))], fill=(255, 215, 60, 255), outline=(0, 0, 0, 255))
    draw.line(crown_pts, fill=(0, 0, 0, 255), width=int(16 * ss), joint="curve")
    draw.line(crown_pts, fill=(255, 255, 220, 255), width=int(4 * ss), joint="curve")

    # Faceted Magenta Diamond Gem at Crown Tip
    gem_pts = [
        (cx, int(15 * ss)),
        (cx + int(24 * ss), int(42 * ss)),
        (cx, int(70 * ss)),
        (cx - int(24 * ss), int(42 * ss)),
    ]
    draw.polygon(gem_pts, fill=(255, 40, 160, 255), outline=(0, 0, 0, 255))
    draw.line(gem_pts + [gem_pts[0]], fill=(0, 0, 0, 255), width=int(6 * ss))
    draw.line([(cx, int(15 * ss)), (cx, int(70 * ss))], fill=(255, 255, 255, 200), width=int(2 * ss))

    # 4. Main Plaque Body
    bx0, by0, bx1, by1 = int(sw * 0.06), int(sh * 0.10), int(sw * 0.94), int(sh * 0.90)
    radius = int(30 * ss)
    box = [bx0, by0, bx1, by1]

    draw.rounded_rectangle(box, radius=radius, fill=(30, 6, 40, 250), outline=(0, 0, 0, 255), width=int(20 * ss))
    draw.rounded_rectangle(box, radius=radius, outline=(255, 215, 60, 255), width=int(14 * ss))
    draw.rounded_rectangle(box, radius=radius, outline=(255, 50, 165, 255), width=int(5 * ss))

    # 5. Clear Lower Half Inner Panel
    wx0, wy0, wx1, wy1 = int(sw * 0.12), int(sh * 0.44), int(sw * 0.88), int(sh * 0.84)
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(18 * ss), fill=(16, 4, 24, 240), outline=(0, 0, 0, 255), width=int(10 * ss))
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(18 * ss), outline=(255, 215, 60, 230), width=int(4 * ss))

    # 6. Typography: "EPIC WIN"
    font = get_font(int(72 * ss), orbitron=True)
    text = "EPIC WIN"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = int(sh * 0.26) - th // 2

    draw.text((tx, ty), text, font=font, fill=(0, 0, 0, 255), stroke_width=int(22 * ss), stroke_fill=(0, 0, 0, 255))
    draw.text((tx, ty), text, font=font, fill=(255, 255, 240, 255), stroke_width=int(5 * ss), stroke_fill=(255, 45, 160, 255))

    return layer.resize((width, height), Image.LANCZOS)


# ===========================================================================
# 5. MAX WIN (White-Gold & Electric Cyan Breaking Frame + Lightning Starburst)
# ===========================================================================
def build_max_win(width: int = 1000, height: int = 560) -> Image.Image:
    ss = 2
    sw, sh = width * ss, height * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, int(sh * 0.52)

    # 1. Giant Starburst Rays (32 Electric Rays filling canvas)
    rays = 32
    reach = sw * 0.98
    for r in range(rays):
        a0 = math.radians(r * (360.0 / rays))
        a1 = a0 + math.radians((360.0 / rays) * 0.45)
        col = (0, 245, 255, 80) if r % 2 == 0 else (255, 240, 160, 80)
        pts = [
            (cx, cy),
            (cx + math.cos(a0) * reach, cy + math.sin(a0) * reach),
            (cx + math.cos(a1) * reach, cy + math.sin(a1) * reach),
        ]
        draw.polygon(pts, fill=col)

    # 2. Electric Lightning Filaments Arcing Through Frame
    def draw_lightning(pts, color=(0, 255, 255), width_px=4):
        draw.line(pts, fill=(0, 0, 0, 255), width=int((width_px + 4) * ss), joint="curve")
        draw.line(pts, fill=color + (255,), width=int(width_px * ss), joint="curve")
        draw.line(pts, fill=(255, 255, 255, 255), width=int((width_px / 2) * ss), joint="curve")

    # Lightning bolts
    draw_lightning([
        (int(sw * 0.05), int(sh * 0.15)),
        (int(sw * 0.18), int(sh * 0.22)),
        (int(sw * 0.14), int(sh * 0.35)),
        (int(sw * 0.24), int(sh * 0.45)),
    ], width_px=5)
    draw_lightning([
        (int(sw * 0.95), int(sh * 0.15)),
        (int(sw * 0.82), int(sh * 0.22)),
        (int(sw * 0.86), int(sh * 0.35)),
        (int(sw * 0.76), int(sh * 0.45)),
    ], width_px=5)
    draw_lightning([
        (cx, 0),
        (cx - int(20 * ss), int(sh * 0.08)),
        (cx + int(25 * ss), int(sh * 0.15)),
        (cx, int(sh * 0.22)),
    ], width_px=6)

    # 3. Outer Broken Frame Brackets (Sharp White-Gold and Cyan Shards)
    bx0, by0, bx1, by1 = int(sw * 0.05), int(sh * 0.08), int(sw * 0.95), int(sh * 0.92)

    # Corner diamond breaking brackets
    for fx, fy, dx, dy in [
        (bx0, by0, 1, 1), (bx1, by0, -1, 1),
        (bx0, by1, 1, -1), (bx1, by1, -1, -1),
    ]:
        bracket = [
            (fx - dx * int(12 * ss), fy - dy * int(12 * ss)),
            (fx + dx * int(110 * ss), fy - dy * int(12 * ss)),
            (fx + dx * int(60 * ss), fy + dy * int(30 * ss)),
            (fx + dx * int(30 * ss), fy + dy * int(60 * ss)),
            (fx - dx * int(12 * ss), fy + dy * int(110 * ss)),
        ]
        draw.polygon(bracket, fill=(0, 245, 255, 255), outline=(0, 0, 0, 255))
        draw.line(bracket + [bracket[0]], fill=(0, 0, 0, 255), width=int(14 * ss))
        draw.line(bracket + [bracket[0]], fill=(255, 255, 255, 255), width=int(4 * ss))

    # 4. Main White-Gold Plaque Body
    radius = int(32 * ss)
    box = [bx0, by0, bx1, by1]
    draw.rounded_rectangle(box, radius=radius, fill=(12, 4, 22, 250), outline=(0, 0, 0, 255), width=int(22 * ss))
    draw.rounded_rectangle(box, radius=radius, outline=(255, 245, 180, 255), width=int(14 * ss))
    draw.rounded_rectangle(box, radius=radius, outline=(0, 245, 255, 255), width=int(5 * ss))

    # 5. Clear Lower Half Inner Panel (with Electric Cyan Border)
    wx0, wy0, wx1, wy1 = int(sw * 0.11), int(sh * 0.44), int(sw * 0.89), int(sh * 0.85)
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(20 * ss), fill=(10, 2, 18, 245), outline=(0, 0, 0, 255), width=int(12 * ss))
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(20 * ss), outline=(0, 245, 255, 240), width=int(5 * ss))
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=int(20 * ss), outline=(255, 255, 255, 220), width=int(2 * ss))

    # 6. Typography: "MAX WIN" (Blazing White-Gold with Cyan Plasma Flare)
    font = get_font(int(76 * ss), orbitron=True)
    text = "MAX WIN"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = int(sh * 0.25) - th // 2

    # Black stroke
    draw.text((tx, ty), text, font=font, fill=(0, 0, 0, 255), stroke_width=int(26 * ss), stroke_fill=(0, 0, 0, 255))
    # Electric cyan plasma stroke
    draw.text((tx, ty), text, font=font, fill=(0, 245, 255, 255), stroke_width=int(12 * ss), stroke_fill=(0, 245, 255, 255))
    # White-gold blazing core
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 255), stroke_width=int(3 * ss), stroke_fill=(255, 245, 180, 255))

    return layer.resize((width, height), Image.LANCZOS)


# ===========================================================================
# Main Execution
# ===========================================================================
def main():
    print("=== Generating 5 Escalating Win Celebration Plaques ===")

    tiers = [
        ("big.png", build_big_win),
        ("superwin.png", build_super_win),
        ("mega.png", build_mega_win),
        ("epic.png", build_epic_win),
        ("max.png", build_max_win),
    ]

    for filename, builder in tiers:
        img = builder(width=1000, height=560)
        out_path = SPRITES / filename
        src_path = SOURCE / filename
        img.save(out_path)
        img.save(src_path)
        print(f"[OK] Saved {filename} -> {out_path}")

    print("\n=== All 5 Win Celebration Plaques Successfully Built and Saved ===")


if __name__ == "__main__":
    main()
