#!/usr/bin/env python3
"""Build and process all Hot Miami game art assets.

Processes raw AI generated images and generates luxury stylized game assets
matching art-spec-hot-miami.md and art-prompts-hot-miami.md.
"""

from __future__ import annotations

import math
import os
import shutil
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
STATIC = APP / "static"
SPRITES = STATIC / "assets" / "sprites"
SOURCE = DESIGN / "source"
STAGE = DESIGN / "_painted"

SOURCE.mkdir(parents=True, exist_ok=True)
STAGE.mkdir(parents=True, exist_ok=True)

GEN_DIR = Path("/Users/stone/.gemini/antigravity-ide/brain/b70ab809-0eff-46e5-a52a-d15b26d622d5")

AI_MAP = {
    "tile_background": GEN_DIR / "tile_background_1786196431743.png",
    "tile_foreground": GEN_DIR / "tile_foreground_1786196459122.png",
    "logo": GEN_DIR / "hot_miami_logo_1786196485931.png",
    "bg_base": GEN_DIR / "bg_base_1786196509232.png",
    "bg_feature": GEN_DIR / "bg_feature_1786196537487.png",
    "bg_epic": GEN_DIR / "bg_epic_1786196561170.png",
    "h1": GEN_DIR / "symbol_diamond_1786196584071.png",
    "h2": GEN_DIR / "symbol_skyline_1786196608715.png",
    "h3": GEN_DIR / "symbol_flamingo_1786196635308.png",
    "h4": GEN_DIR / "symbol_boombox_1786196662774.png",
    "h5": GEN_DIR / "symbol_convertible_1786196689814.png",
    "w": GEN_DIR / "symbol_wild_1786196720890.png",
    "s": GEN_DIR / "symbol_scatter_1786196752190.png",
}

FONT_TITAN = STATIC / "fonts" / "TitanOne.ttf"
FONT_ORBITRON = STATIC / "fonts" / "Orbitron.ttf"


def get_font(size: int, orbitron: bool = True, weight: int = 900) -> ImageFont.FreeTypeFont:
    path = FONT_ORBITRON if orbitron and FONT_ORBITRON.exists() else FONT_TITAN
    if not path.exists():
        return ImageFont.load_default()
    font = ImageFont.truetype(str(path), max(8, int(size)))
    try:
        font.set_variation_by_axes([weight])
    except Exception:
        pass
    return font


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

    # Soft alpha ramp for neon rim glow
    band = tol * 2.8
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            d = max(abs(r - kr), abs(g - kg), abs(b - kb))
            if d < band:
                new_a = int(a * ((d / band) ** 2))
                px[x, y] = (r, g, b, new_a)

    # Despill: reduce green fringe if requested
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


def square_and_fit(im: Image.Image, size: int = 512, margin: float = 0.05) -> Image.Image:
    box = im.getbbox()
    if box is None:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cropped = im.crop(box)
    inner = int(size * (1 - 2 * margin))
    cropped.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(cropped, ((size - cropped.width) // 2, (size - cropped.height) // 2), cropped)
    return canvas


def darken_center_third(im: Image.Image, strength: float = 0.55) -> Image.Image:
    """Darken the center region where the 5x4 slot board sits."""
    im = im.convert("RGBA")
    w, h = im.size
    shade = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(shade)
    # Oval in center third
    draw.ellipse([w * 0.18, -h * 0.15, w * 0.82, h * 1.15], fill=int(255 * strength))
    shade = shade.filter(ImageFilter.GaussianBlur(w * 0.07))
    dark_layer = Image.new("RGBA", (w, h), (18, 6, 32, 0))
    dark_layer.putalpha(shade)
    return Image.alpha_composite(im, dark_layer)


# ---------------------------------------------------------------------------
# Procedural high-end assets for remaining slots
# ---------------------------------------------------------------------------

def build_collector_symbol(size: int = 512) -> Image.Image:
    """High-end Collector special symbol in electric purple/fuchsia #E858FA."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    cx, cy = sw // 2, int(sh * 0.48)
    r = int(sw * 0.40)

    # 1. Radiant neon halo
    glow = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([cx - r * 1.08, cy - r * 1.08, cx + r * 1.08, cy + r * 1.08], outline=(232, 88, 250, 220), width=int(22 * ss))
    glow = glow.filter(ImageFilter.GaussianBlur(18 * ss))
    layer = Image.alpha_composite(layer, glow)

    # 2. Outer octagonal metallic bezel
    pts_outer = []
    for i in range(8):
        angle = math.radians(45 * i + 22.5)
        pts_outer.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(pts_outer, fill=(46, 10, 54, 255), outline=(232, 88, 250, 255))

    # Chrome bevel ring
    inner_r = r * 0.88
    pts_inner = []
    for i in range(8):
        angle = math.radians(45 * i + 22.5)
        pts_inner.append((cx + inner_r * math.cos(angle), cy + inner_r * math.sin(angle)))
    draw.polygon(pts_inner, fill=(28, 6, 36, 255), outline=(255, 220, 255, 240))

    # Inner facets & gem lines
    for i in range(8):
        p0 = pts_outer[i]
        p1 = pts_inner[i]
        draw.line([p0, p1], fill=(232, 88, 250, 200), width=max(2, int(3 * ss)))
        draw.line([p1, (cx, cy)], fill=(180, 50, 210, 160), width=max(1, int(2 * ss)))

    # Central heart / gem facet
    heart_pts = [
        (cx, cy + r * 0.32),
        (cx - r * 0.42, cy - r * 0.08),
        (cx - r * 0.44, cy - r * 0.38),
        (cx - r * 0.20, cy - r * 0.52),
        (cx, cy - r * 0.30),
        (cx + r * 0.20, cy - r * 0.52),
        (cx + r * 0.44, cy - r * 0.38),
        (cx + r * 0.42, cy - r * 0.08),
    ]
    draw.polygon(heart_pts, fill=(160, 28, 180, 240), outline=(255, 230, 255, 255))

    # 3. Bold "COLLECT" banner across center
    bar_h = int(r * 0.48)
    bar_y0 = cy - bar_h // 2
    bar_y1 = cy + bar_h // 2
    bar_w = int(sw * 0.86)
    bar_x0 = (sw - bar_w) // 2
    bar_x1 = bar_x0 + bar_w

    # Plaque shadow
    draw.rounded_rectangle([bar_x0, bar_y0, bar_x1, bar_y1], radius=int(14 * ss), fill=(16, 4, 22, 250), outline=(232, 88, 250, 255), width=int(5 * ss))
    draw.rounded_rectangle([bar_x0 + 6 * ss, bar_y0 + 6 * ss, bar_x1 - 6 * ss, bar_y1 - 6 * ss], radius=int(10 * ss), outline=(255, 240, 255, 200), width=int(2 * ss))

    # Font rendering
    font = get_font(int(46 * ss), orbitron=True, weight=900)
    text = "COLLECT"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = cy - th // 2 - int(4 * ss)

    # Text glow & chrome stroke
    for dr in (8 * ss, 4 * ss):
        draw.text((tx, ty), text, font=font, fill=(232, 88, 250, 180), stroke_width=int(dr), stroke_fill=(232, 88, 250, 180))
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 255), stroke_width=int(2 * ss), stroke_fill=(232, 88, 250, 255))

    canvas = layer.resize((size, size), Image.LANCZOS)
    return canvas


def build_multiplier_frame(size: int = 256) -> Image.Image:
    """Hollow neon multiplier frame in glowing gold #FFC828 with corner accents."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))

    margin = int(18 * ss)
    box = [margin, margin, sw - margin, sh - margin]
    radius = int(24 * ss)

    # 1. Outer gold neon bloom
    bloom = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(bloom)
    bdraw.rounded_rectangle(box, radius=radius, outline=(255, 200, 40, 220), width=int(18 * ss))
    bloom = bloom.filter(ImageFilter.GaussianBlur(10 * ss))
    layer = Image.alpha_composite(layer, bloom)

    # 2. Main neon border
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle(box, radius=radius, outline=(255, 170, 20, 255), width=int(12 * ss))
    draw.rounded_rectangle(box, radius=radius, outline=(255, 250, 200, 255), width=int(4 * ss))

    # Inner hairline border
    in_box = [margin + int(14 * ss), margin + int(14 * ss), sw - margin - int(14 * ss), sh - margin - int(14 * ss)]
    draw.rounded_rectangle(in_box, radius=int(radius * 0.7), outline=(255, 200, 50, 180), width=int(2 * ss))

    # Corner jewels / neon nodes
    for cx in (margin + int(6 * ss), sw - margin - int(6 * ss)):
        for cy in (margin + int(6 * ss), sh - margin - int(6 * ss)):
            draw.ellipse([cx - 8 * ss, cy - 8 * ss, cx + 8 * ss, cy + 8 * ss], fill=(255, 255, 255, 255), outline=(255, 160, 20, 255), width=int(3 * ss))

    return layer.resize((size, size), Image.LANCZOS)


def build_card_royal(letter: str, size: int = 256) -> Image.Image:
    """Chrome synthwave card royal (A, K, Q, J) with metallic bevels and subtle cyan/magenta rim."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    font = get_font(int(148 * ss), orbitron=True, weight=900)
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = (sh - th) // 2 - int(8 * ss)

    # 1. Dark silhouette backing
    draw.text((tx, ty), letter, font=font, fill=(10, 4, 18, 255), stroke_width=int(14 * ss), stroke_fill=(10, 4, 18, 255))

    # 2. Chrome gradient fill on mask
    mask = Image.new("L", (sw, sh), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.text((tx, ty), letter, font=font, fill=255, stroke_width=int(6 * ss), stroke_fill=255)

    grad = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(sh):
        t = y / sh
        # Synthwave chrome reflection band: dark purple -> silver -> bright white -> cyan blue
        if t < 0.42:
            k = t / 0.42
            r = int(220 + 35 * k)
            g = int(225 + 30 * k)
            b = int(240 + 15 * k)
        elif t < 0.50:
            k = (t - 0.42) / 0.08
            r = int(255 - 190 * k)
            g = int(255 - 190 * k)
            b = int(255 - 180 * k)
        else:
            k = (t - 0.50) / 0.50
            r = int(70 + 110 * k)
            g = int(90 + 120 * k)
            b = int(140 + 100 * k)
        gdraw.line([(0, y), (sw, y)], fill=(r, g, b, 255))

    grad.putalpha(mask)
    layer = Image.alpha_composite(layer, grad)

    # 3. Metallic rim highlight & cyan stroke
    ldraw = ImageDraw.Draw(layer)
    ldraw.text((tx, ty), letter, font=font, fill=(0, 0, 0, 0), stroke_width=int(2 * ss), stroke_fill=(255, 255, 255, 230))

    return layer.resize((size, size), Image.LANCZOS)


def build_win_banner(name: str, title: str, tier_idx: int, width: int = 1000, height: int = 560) -> Image.Image:
    """Escalating luxury Art-Deco neon win plaque with radiant marquee lights."""
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ss = 2
    sw, sh = width * ss, height * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))

    # Tier color schemes
    # (rim_color, fill_top, fill_bottom, glow_color, bulbs, rays, deco_corners)
    tiers = [
        # BIG WIN
        ((255, 180, 70), (120, 16, 80), (45, 6, 42), (255, 140, 50), 20, 0, 1),
        # SUPER WIN
        ((255, 210, 80), (145, 20, 88), (55, 8, 50), (255, 180, 60), 26, 12, 2),
        # MEGA WIN
        ((255, 230, 100), (170, 28, 96), (65, 10, 58), (255, 210, 80), 32, 18, 3),
        # EPIC WIN
        ((255, 245, 140), (195, 38, 90), (75, 12, 64), (255, 100, 180), 38, 24, 4),
        # MAX WIN
        ((255, 255, 220), (220, 50, 80), (85, 14, 70), (80, 240, 255), 44, 32, 5),
    ]

    rim, top, bot, glow_col, bulbs, rays, corners = tiers[min(tier_idx, len(tiers) - 1)]

    # 1. Radiant sunburst rays behind plaque (for higher tiers)
    if rays > 0:
        sunburst = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(sunburst)
        reach = sw * 0.9
        for r in range(rays):
            a0 = math.radians(r * (360.0 / rays))
            a1 = a0 + math.radians((360.0 / rays) * 0.45)
            pts = [
                (sw / 2, sh / 2),
                (sw / 2 + math.cos(a0) * reach, sh / 2 + math.sin(a0) * reach),
                (sw / 2 + math.cos(a1) * reach, sh / 2 + math.sin(a1) * reach),
            ]
            sdraw.polygon(pts, fill=glow_col + (40 + tier_idx * 12,))
        sunburst = sunburst.filter(ImageFilter.GaussianBlur(10 * ss))
        layer = Image.alpha_composite(layer, sunburst)

    # 2. Main Plaque Shape
    pad_x = int(sw * (0.07 - tier_idx * 0.008))
    pad_y = int(sh * (0.09 - tier_idx * 0.010))
    box = [pad_x, pad_y, sw - pad_x, sh - pad_y]
    radius = int(sh * 0.12)

    # Outer Neon Halo
    halo = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(halo)
    hdraw.rounded_rectangle(box, radius=radius, outline=glow_col + (220,), width=int(18 * ss))
    halo = halo.filter(ImageFilter.GaussianBlur(14 * ss))
    layer = Image.alpha_composite(layer, halo)

    # Solid Plate with vertical gradient
    plate = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(plate)
    pdraw.rounded_rectangle(box, radius=radius, fill=(255, 255, 255, 255))
    grad = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(box[1], box[3]):
        t = (y - box[1]) / (box[3] - box[1])
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        gdraw.line([(box[0], y), (box[2], y)], fill=(r, g, b, 255))
    grad.putalpha(plate.getchannel("A"))
    layer = Image.alpha_composite(layer, grad)

    # 3. Gold Metallic Bezel & Marquee Bulbs
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle(box, radius=radius, outline=rim + (255,), width=int(8 * ss))

    inner_box = [box[0] + int(16 * ss), box[1] + int(16 * ss), box[2] - int(16 * ss), box[3] - int(16 * ss)]
    draw.rounded_rectangle(inner_box, radius=int(radius * 0.8), outline=rim + (180,), width=int(3 * ss))

    # Perimeter marquee light bulbs
    # Calculate perimeter coordinates
    pw = inner_box[2] - inner_box[0]
    ph = inner_box[3] - inner_box[1]
    perim = 2 * (pw + ph)
    for b in range(bulbs):
        t = b / float(bulbs)
        d = t * perim
        if d < pw:
            bx, by = inner_box[0] + d, inner_box[1]
        elif d < pw + ph:
            bx, by = inner_box[2], inner_box[1] + (d - pw)
        elif d < 2 * pw + ph:
            bx, by = inner_box[2] - (d - pw - ph), inner_box[3]
        else:
            bx, by = inner_box[0], inner_box[3] - (d - 2 * pw - ph)
        br = int((4 + tier_idx * 0.8) * ss)
        draw.ellipse([bx - br, by - br, bx + br, by + br], fill=(255, 255, 240, 255), outline=rim + (255,), width=int(1.5 * ss))

    # 4. Deco corner flourishes
    for c_i in range(corners):
        step = int((14 + c_i * 12) * ss)
        for cx, cy, sx, sy in ((box[0], box[1], 1, 1), (box[2], box[1], -1, 1),
                               (box[0], box[3], 1, -1), (box[2], box[3], -1, -1)):
            draw.line([(cx + sx * step, cy + sy * (step + int(36 * ss))), (cx + sx * (step + int(36 * ss)), cy + sy * step)],
                      fill=rim + (200,), width=int(3 * ss))

    # 5. Middle amount well (leave empty for game text)
    well_box = [int(sw * 0.12), int(sh * 0.50), int(sw * 0.88), int(sh * 0.82)]
    draw.rounded_rectangle(well_box, radius=int(sh * 0.05), fill=(24, 4, 28, 210), outline=rim + (180,), width=int(3 * ss))

    # 6. Title Typography on top of plaque
    font = get_font(int(54 * ss), orbitron=True, weight=900)
    bbox = draw.textbbox((0, 0), title, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = int(sh * 0.28) - th // 2

    # Neon glow & stroke
    for dr in (10 * ss, 5 * ss):
        draw.text((tx, ty), title, font=font, fill=glow_col + (180,), stroke_width=int(dr), stroke_fill=glow_col + (180,))
    draw.text((tx, ty), title, font=font, fill=(255, 255, 255, 255), stroke_width=int(2.5 * ss), stroke_fill=rim + (255,))

    return layer.resize((width, height), Image.LANCZOS)


def build_frame_assets():
    """Build board frames, free spins announcement sign, and counter panel."""
    # 1. frame_bg.png (1280x1280): Board backing panel in dark violet RGB(40,10,66)
    bg = Image.new("RGBA", (1280, 1280), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(bg)
    margin = 40
    box = [margin, margin, 1280 - margin, 1280 - margin]
    bdraw.rounded_rectangle(box, radius=40, fill=(40, 10, 66, 255))
    # Subtle inner synthwave grid / gradient
    for y in range(box[1], box[3], 4):
        t = (y - box[1]) / (box[3] - box[1])
        alpha = int(18 * math.sin(t * math.pi))
        bdraw.line([(box[0], y), (box[2], y)], fill=(80, 20, 110, alpha))
    bg.save(SPRITES / "hotMiamiFrame" / "frame_bg.png")

    # 2. frame_edge.png (1280x1280): Decorative outer neon and gold frame
    edge = Image.new("RGBA", (1280, 1280), (0, 0, 0, 0))
    edraw = ImageDraw.Draw(edge)
    # Outer gold neon tube
    edraw.rounded_rectangle(box, radius=40, outline=(255, 180, 40, 255), width=8)
    edraw.rounded_rectangle(box, radius=40, outline=(255, 240, 160, 255), width=3)
    # Inner magenta accent frame
    in_box = [margin + 16, margin + 16, 1280 - margin - 16, 1280 - margin - 16]
    edraw.rounded_rectangle(in_box, radius=28, outline=(232, 70, 150, 200), width=4)
    # Corner Art-Deco stepped brackets
    for cx, cy, sx, sy in ((box[0], box[1], 1, 1), (box[2], box[1], -1, 1),
                           (box[0], box[3], 1, -1), (box[2], box[3], -1, -1)):
        for step in (24, 48, 72):
            edraw.line([(cx + sx * step, cy), (cx + sx * step, cy + sy * step), (cx, cy + sy * step)],
                       fill=(255, 200, 60, 230), width=3)
    edge.save(SPRITES / "hotMiamiFrame" / "frame_edge.png")

    # 3. fs_sign.png (1280x1002): Free spins announcement drop-in sign
    fs_sign = Image.new("RGBA", (1280, 1002), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(fs_sign)
    sbox = [80, 80, 1200, 922]
    sdraw.rounded_rectangle(sbox, radius=48, fill=(30, 8, 45, 245), outline=(255, 70, 160, 255), width=10)
    sdraw.rounded_rectangle([sbox[0] + 16, sbox[1] + 16, sbox[2] - 16, sbox[3] - 16], radius=36, outline=(255, 200, 60, 200), width=4)

    # Title "FREE SPINS"
    font = get_font(72, orbitron=True, weight=900)
    bbox = sdraw.textbbox((0, 0), "FREE SPINS", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (1280 - tw) // 2
    ty = 160
    for dr in (12, 6):
        sdraw.text((tx, ty), "FREE SPINS", font=font, fill=(255, 70, 160, 180), stroke_width=dr, stroke_fill=(255, 70, 160, 180))
    sdraw.text((tx, ty), "FREE SPINS", font=font, fill=(255, 255, 255, 255), stroke_width=3, stroke_fill=(255, 200, 60, 255))
    fs_sign.save(SPRITES / "hotMiamiFrame" / "fs_sign.png")

    # 4. fs_counter_panel.png (1280x966): Small counter panel
    fs_panel = Image.new("RGBA", (1280, 966), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(fs_panel)
    pbox = [120, 120, 1160, 846]
    pdraw.rounded_rectangle(pbox, radius=40, fill=(24, 6, 36, 240), outline=(80, 240, 255, 255), width=8)
    pdraw.rounded_rectangle([pbox[0] + 12, pbox[1] + 12, pbox[2] - 12, pbox[3] - 12], radius=30, outline=(255, 70, 160, 180), width=3)
    fs_panel.save(SPRITES / "hotMiamiFrame" / "fs_counter_panel.png")


def build_all():
    print("=== Processing Hot Miami Art Assets ===")

    # 1. Process Store Tile Background
    src_bg = AI_MAP["tile_background"]
    if src_bg.exists():
        im = Image.open(src_bg).convert("RGB")
        im = im.resize((1024, 1024), Image.LANCZOS)
        out_bg = SPRITES / "hotMiamiBrand" / "tile_background.png"
        im.save(out_bg)
        print(f"[OK] tile_background.png -> {out_bg}")

    # 2. Process Store Tile Foreground (Flamingo Hero)
    src_fg = AI_MAP["tile_foreground"]
    if src_fg.exists():
        im = Image.open(src_fg)
        keyed = key_chroma(im, tol=65, despill_edge=True)
        box = keyed.getbbox()
        if box:
            cropped = keyed.crop(box)
            hero = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
            inner = int(1024 * 0.90)
            cropped.thumbnail((inner, inner), Image.LANCZOS)
            hero.paste(cropped, ((1024 - cropped.width) // 2, (1024 - cropped.height) // 2), cropped)
            out_fg = SPRITES / "hotMiamiBrand" / "tile_foreground.png"
            hero.save(out_fg)
            hero.save(SOURCE / "tile_foreground.png")
            print(f"[OK] tile_foreground.png -> {out_fg}")

    # 3. Process Logo & Compose Store Thumbnail
    src_logo = AI_MAP["logo"]
    if src_logo.exists():
        im = Image.open(src_logo)
        keyed = key_chroma(im, tol=65, despill_edge=False)
        box = keyed.getbbox()
        if box:
            cropped = keyed.crop(box)
            logo = Image.new("RGBA", (1200, 520), (0, 0, 0, 0))
            inner_w = int(1200 * 0.92)
            inner_h = int(520 * 0.88)
            cropped.thumbnail((inner_w, inner_h), Image.LANCZOS)
            logo.paste(cropped, ((1200 - cropped.width) // 2, (520 - cropped.height) // 2), cropped)
            out_logo = SPRITES / "hotMiamiBrand" / "logo.png"
            logo.save(out_logo)
            print(f"[OK] logo.png -> {out_logo}")

            # Store Thumbnail preview
            bg_path = SPRITES / "hotMiamiBrand" / "tile_background.png"
            fg_path = SPRITES / "hotMiamiBrand" / "tile_foreground.png"
            if bg_path.exists() and fg_path.exists():
                thumb = Image.open(bg_path).convert("RGBA")
                fg = Image.open(fg_path).convert("RGBA")
                # Scale foreground slightly
                fg_scaled = fg.resize((int(1024 * 0.65), int(1024 * 0.65)), Image.LANCZOS)
                thumb.alpha_composite(fg_scaled, (int(1024 * 0.175), int(1024 * 0.08)))
                # Place logo on bottom
                logo_small = logo.resize((int(1024 * 0.76), int(1024 * 0.33)), Image.LANCZOS)
                thumb.alpha_composite(logo_small, (int(1024 * 0.12), int(1024 * 0.64)))
                out_thumb = SPRITES / "hotMiamiBrand" / "thumbnail.png"
                thumb.convert("RGB").save(out_thumb)
                print(f"[OK] thumbnail.png -> {out_thumb}")

    # 4. Process Backgrounds (bg_base, bg_feature, bg_epic)
    for bg_key in ("bg_base", "bg_feature", "bg_epic"):
        src = AI_MAP[bg_key]
        if src.exists():
            im = Image.open(src).convert("RGB")
            im = im.resize((1920, 1080), Image.LANCZOS)
            darkened = darken_center_third(im, strength=0.52)
            out = SPRITES / "hotMiamiBackground" / f"{bg_key}.png"
            darkened.convert("RGB").save(out)
            print(f"[OK] {bg_key}.png -> {out}")

    # 5. Process Premium Symbols (h1 - h5)
    for sym_key in ("h1", "h2", "h3", "h4", "h5"):
        src = AI_MAP[sym_key]
        if src.exists():
            im = Image.open(src)
            # h5 is green car, do not despill green
            despill = sym_key != "h5"
            keyed = key_chroma(im, tol=62, despill_edge=despill)
            sym = square_and_fit(keyed, size=512, margin=0.04)
            out = SPRITES / "hotMiamiSymbols" / f"{sym_key}.png"
            sym.save(out)
            sym.save(SOURCE / f"{sym_key}.png")
            print(f"[OK] {sym_key}.png -> {out}")

    # 6. Process Wild (w) and Scatter (s / fs)
    if AI_MAP["w"].exists():
        im = Image.open(AI_MAP["w"])
        keyed = key_chroma(im, tol=62, despill_edge=True)
        sym = square_and_fit(keyed, size=256, margin=0.04)
        out = SPRITES / "hotMiamiSymbols" / "w.png"
        sym.save(out)
        sym.save(SOURCE / "w.png")
        print(f"[OK] w.png -> {out}")

    if AI_MAP["s"].exists():
        im = Image.open(AI_MAP["s"])
        keyed = key_chroma(im, tol=62, despill_edge=False)
        sym = square_and_fit(keyed, size=256, margin=0.04)
        out_s = SPRITES / "hotMiamiSymbols" / "s.png"
        out_fs = SPRITES / "hotMiamiSymbols" / "fs.png"
        sym.save(out_s)
        sym.save(out_fs)
        sym.save(SOURCE / "s.png")
        print(f"[OK] s.png & fs.png -> {out_s}")

    # 7. Generate Collector (c.png)
    c_sym = build_collector_symbol(size=256)
    out_c = SPRITES / "hotMiamiSymbols" / "c.png"
    c_sym.save(out_c)
    c_sym.save(SOURCE / "c.png")
    print(f"[OK] c.png -> {out_c}")

    # 8. Generate Multiplier Frame (frame.png)
    frame_sym = build_multiplier_frame(size=256)
    out_frame = SPRITES / "hotMiamiSymbols" / "frame.png"
    frame_sym.save(out_frame)
    print(f"[OK] frame.png -> {out_frame}")

    # 9. Generate Card Royals (l1=A, l2=K, l3=Q, l4=J)
    royal_map = {"l1": "A", "l2": "K", "l3": "Q", "l4": "J"}
    for k, letter in royal_map.items():
        royal_sym = build_card_royal(letter, size=256)
        out = SPRITES / "hotMiamiSymbols" / f"{k}.png"
        royal_sym.save(out)
        print(f"[OK] {k}.png ({letter}) -> {out}")

    # 10. Generate Win Banners (big, superwin, mega, epic, max)
    banners = [
        ("big", "BIG WIN", 0),
        ("superwin", "SUPER WIN", 1),
        ("mega", "MEGA WIN", 2),
        ("epic", "EPIC WIN", 3),
        ("max", "MAX WIN", 4),
    ]
    for b_name, b_title, b_idx in banners:
        banner_img = build_win_banner(b_name, b_title, b_idx, width=1000, height=560)
        out = SPRITES / "hotMiamiWinBanners" / f"{b_name}.png"
        banner_img.save(out)
        print(f"[OK] win banner {b_name}.png -> {out}")

    # 11. Generate Board Frame assets
    build_frame_assets()
    print("[OK] Board frame assets generated")

    print("\n=== All Hot Miami Assets Successfully Built ===")


if __name__ == "__main__":
    build_all()
