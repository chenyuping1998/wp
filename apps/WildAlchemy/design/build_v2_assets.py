#!/usr/bin/env python3
"""Build and process all Hot Miami Art Spec v2 assets.

Processes 80s Miami Vice pop-art style assets with airbrush gradients,
halftone print textures, bold black ink outlines, and crime pulp aesthetics.
"""

from __future__ import annotations

import math
import os
import shutil
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

AI_V2 = {
    "main_poster": GEN_DIR / "hot_miami_v2_main_1786375246201.png",
    "tile_background": GEN_DIR / "tile_bg_v2_1786375269556.png",
    "tile_foreground": GEN_DIR / "tile_fg_v2_1786375290061.png",
    "logo": GEN_DIR / "logo_v2_1786375312959.png",
    "bg_base": GEN_DIR / "bg_base_v2_1786375331344.png",
    "bg_feature": GEN_DIR / "bg_feature_v2_1786375349932.png",
    "bg_epic": GEN_DIR / "bg_epic_v2_1786375370095.png",
    "h1": GEN_DIR / "h1_male_hero_1786375392046.png",
    "h2": GEN_DIR / "h2_female_hero_1786375414204.png",
    "h3": GEN_DIR / "h3_flamingo_v2_1786375436191.png",
    "h4": GEN_DIR / "h4_boombox_v2_1786375456940.png",
    "h5": GEN_DIR / "h5_car_v2_1786375503469.png",
    "w": GEN_DIR / "w_wild_v2_1786375532120.png",
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

    # Soft alpha ramp for fine details
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

    # Despill
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


def darken_center_third(im: Image.Image, strength: float = 0.50) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    shade = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(shade)
    draw.ellipse([w * 0.18, -h * 0.15, w * 0.82, h * 1.15], fill=int(255 * strength))
    shade = shade.filter(ImageFilter.GaussianBlur(w * 0.07))
    dark_layer = Image.new("RGBA", (w, h), (18, 6, 32, 0))
    dark_layer.putalpha(shade)
    return Image.alpha_composite(im, dark_layer)


# ---------------------------------------------------------------------------
# Pop-art Specials & Royals
# ---------------------------------------------------------------------------

def build_popart_scatter(size: int = 512) -> Image.Image:
    """Pop-art comic starburst SCATTER badge in mint/emerald #40FF92."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, sh // 2

    # Starburst points
    spokes = 12
    outer_r = int(sw * 0.46)
    inner_r = int(sw * 0.28)
    pts = []
    for i in range(spokes * 2):
        angle = math.radians(i * (360.0 / (spokes * 2)) - 90)
        r = outer_r if i % 2 == 0 else inner_r
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))

    # Outer black ink outline
    draw.polygon(pts, fill=(10, 40, 24, 255), outline=(0, 0, 0, 255))
    draw.line(pts + [pts[0]], fill=(0, 0, 0, 255), width=int(16 * ss), joint="curve")

    # Vibrant mint & cyan fill with halftone simulation
    draw.polygon(pts, fill=(64, 255, 146, 255), outline=(220, 255, 235, 255))

    # Inner circular plaque
    cr = int(sw * 0.28)
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(12, 60, 36, 255), outline=(0, 0, 0, 255), width=int(10 * ss))
    draw.ellipse([cx - cr + int(8*ss), cy - cr + int(8*ss), cx + cr - int(8*ss), cy + cr - int(8*ss)], outline=(255, 255, 255, 200), width=int(3 * ss))

    # Typography: 'SCATTER'
    font = get_font(int(54 * ss), orbitron=True, weight=900)
    bbox = draw.textbbox((0, 0), "SCATTER", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = cy - th // 2 - int(4 * ss)

    # Black stroke
    draw.text((tx, ty), "SCATTER", font=font, fill=(0, 0, 0, 255), stroke_width=int(14 * ss), stroke_fill=(0, 0, 0, 255))
    # Glowing white/yellow fill
    draw.text((tx, ty), "SCATTER", font=font, fill=(255, 255, 255, 255), stroke_width=int(2 * ss), stroke_fill=(64, 255, 146, 255))

    return layer.resize((size, size), Image.LANCZOS)


def build_popart_collector(size: int = 512) -> Image.Image:
    """Pop-art comic COLLECT badge in orchid/magenta #E858FA with faceted gem."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, sh // 2

    # Hexagonal geometry
    rx = sw * 0.44
    ry = sh * 0.40
    pts = [
        (cx, cy - ry),
        (cx + rx, cy - ry * 0.45),
        (cx + rx, cy + ry * 0.45),
        (cx, cy + ry),
        (cx - rx, cy + ry * 0.45),
        (cx - rx, cy - ry * 0.45),
    ]

    # Thick black ink shadow & outline
    draw.polygon(pts, fill=(45, 10, 50, 255))
    draw.line(pts + [pts[0]], fill=(0, 0, 0, 255), width=int(18 * ss), joint="curve")

    # Magenta / Orchid fill with facets
    draw.polygon(pts, fill=(232, 88, 250, 255))
    for i in range(len(pts)):
        p1 = pts[i]
        p2 = pts[(i + 1) % len(pts)]
        draw.line([p1, (cx, cy)], fill=(0, 0, 0, 200), width=int(6 * ss))

    # Inner plaque
    pw, ph = int(sw * 0.86), int(sh * 0.38)
    px0, py0 = (sw - pw) // 2, cy - ph // 2
    px1, py1 = px0 + pw, py0 + ph
    draw.rounded_rectangle([px0, py0, px1, py1], radius=int(16 * ss), fill=(24, 4, 30, 255), outline=(0, 0, 0, 255), width=int(10 * ss))
    draw.rounded_rectangle([px0 + int(6*ss), py0 + int(6*ss), px1 - int(6*ss), py1 - int(6*ss)], radius=int(12 * ss), outline=(255, 230, 255, 220), width=int(3 * ss))

    # Typography: 'COLLECT'
    font = get_font(int(54 * ss), orbitron=True, weight=900)
    bbox = draw.textbbox((0, 0), "COLLECT", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = cy - th // 2 - int(4 * ss)

    draw.text((tx, ty), "COLLECT", font=font, fill=(0, 0, 0, 255), stroke_width=int(14 * ss), stroke_fill=(0, 0, 0, 255))
    draw.text((tx, ty), "COLLECT", font=font, fill=(255, 255, 255, 255), stroke_width=int(2 * ss), stroke_fill=(232, 88, 250, 255))

    return layer.resize((size, size), Image.LANCZOS)


def build_popart_frame(size: int = 256) -> Image.Image:
    """Hollow pop-art multiplier frame with bold black outline and gold/orange glow."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    margin = int(18 * ss)
    box = [margin, margin, sw - margin, sh - margin]
    radius = int(24 * ss)

    # Black border base
    draw.rounded_rectangle(box, radius=radius, outline=(0, 0, 0, 255), width=int(18 * ss))
    # Golden neon fill
    draw.rounded_rectangle(box, radius=radius, outline=(255, 200, 40, 255), width=int(10 * ss))
    draw.rounded_rectangle(box, radius=radius, outline=(255, 255, 220, 255), width=int(3 * ss))

    # Corner rivet stars
    for cx in (margin + int(6 * ss), sw - margin - int(6 * ss)):
        for cy in (margin + int(6 * ss), sh - margin - int(6 * ss)):
            draw.ellipse([cx - 8 * ss, cy - 8 * ss, cx + 8 * ss, cy + 8 * ss], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=int(3 * ss))

    return layer.resize((size, size), Image.LANCZOS)


def build_popart_royals(letter: str, size: int = 256) -> Image.Image:
    """80s comic pop-art card royals with bold black ink contour and airbrush chrome/silver."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    font = get_font(int(148 * ss), orbitron=True, weight=900)
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2
    ty = (sh - th) // 2 - int(8 * ss)

    # Heavy black drop shadow & outline
    draw.text((tx + int(8*ss), ty + int(10*ss)), letter, font=font, fill=(0, 0, 0, 255), stroke_width=int(18 * ss), stroke_fill=(0, 0, 0, 255))
    draw.text((tx, ty), letter, font=font, fill=(0, 0, 0, 255), stroke_width=int(16 * ss), stroke_fill=(0, 0, 0, 255))

    # Chrome gradient
    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).text((tx, ty), letter, font=font, fill=255, stroke_width=int(8 * ss), stroke_fill=255)

    grad = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(sh):
        t = y / sh
        if t < 0.45:
            k = t / 0.45
            r = int(230 + 25 * k)
            g = int(235 + 20 * k)
            b = int(245 + 10 * k)
        elif t < 0.52:
            r, g, b = 40, 10, 50
        else:
            k = (t - 0.52) / 0.48
            r = int(180 + 70 * k)
            g = int(60 + 120 * k)
            b = int(140 + 110 * k)
        gdraw.line([(0, y), (sw, y)], fill=(r, g, b, 255))

    grad.putalpha(mask)
    layer = Image.alpha_composite(layer, grad)

    # Inner highlight line
    ldraw = ImageDraw.Draw(layer)
    ldraw.text((tx, ty), letter, font=font, fill=(0, 0, 0, 0), stroke_width=int(2 * ss), stroke_fill=(255, 255, 255, 240))

    return layer.resize((size, size), Image.LANCZOS)


def build_popart_win_banners():
    """Build 80s pop art win plaques (BIG WIN -> MAX WIN)."""
    tiers = [
        ("big", "BIG WIN", (255, 180, 50), (235, 60, 140), 0),
        ("superwin", "SUPER WIN", (255, 210, 60), (240, 50, 160), 1),
        ("mega", "MEGA WIN", (255, 230, 80), (245, 40, 180), 2),
        ("epic", "EPIC WIN", (255, 245, 120), (250, 30, 200), 3),
        ("max", "MAX WIN", (255, 255, 200), (80, 240, 255), 4),
    ]
    width, height = 1000, 560
    ss = 2
    sw, sh = width * ss, height * ss

    for b_name, b_title, gold_col, neon_col, t_idx in tiers:
        layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)

        pad_x = int(sw * (0.06 - t_idx * 0.006))
        pad_y = int(sh * (0.08 - t_idx * 0.008))
        box = [pad_x, pad_y, sw - pad_x, sh - pad_y]
        radius = int(sh * 0.12)

        # Comic sunburst rays
        rays = 16 + t_idx * 6
        reach = sw * 0.88
        for r in range(rays):
            a0 = math.radians(r * (360.0 / rays))
            a1 = a0 + math.radians((360.0 / rays) * 0.45)
            pts = [
                (sw / 2, sh / 2),
                (sw / 2 + math.cos(a0) * reach, sh / 2 + math.sin(a0) * reach),
                (sw / 2 + math.cos(a1) * reach, sh / 2 + math.sin(a1) * reach),
            ]
            draw.polygon(pts, fill=neon_col + (40 + t_idx * 12,))

        # Plaque black shadow & body
        draw.rounded_rectangle(box, radius=radius, fill=(28, 6, 36, 250), outline=(0, 0, 0, 255), width=int(18 * ss))
        draw.rounded_rectangle(box, radius=radius, outline=gold_col + (255,), width=int(10 * ss))

        inner_box = [box[0] + int(16 * ss), box[1] + int(16 * ss), box[2] - int(16 * ss), box[3] - int(16 * ss)]
        draw.rounded_rectangle(inner_box, radius=int(radius * 0.8), outline=neon_col + (220,), width=int(4 * ss))

        # Value amount clear well
        well_box = [int(sw * 0.12), int(sh * 0.50), int(sw * 0.88), int(sh * 0.82)]
        draw.rounded_rectangle(well_box, radius=int(sh * 0.05), fill=(16, 4, 22, 230), outline=(0, 0, 0, 255), width=int(8 * ss))
        draw.rounded_rectangle(well_box, radius=int(sh * 0.05), outline=gold_col + (200,), width=int(3 * ss))

        # Title text
        font = get_font(int(58 * ss), orbitron=True, weight=900)
        bbox = draw.textbbox((0, 0), b_title, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        tx = (sw - tw) // 2
        ty = int(sh * 0.28) - th // 2

        draw.text((tx, ty), b_title, font=font, fill=(0, 0, 0, 255), stroke_width=int(16 * ss), stroke_fill=(0, 0, 0, 255))
        draw.text((tx, ty), b_title, font=font, fill=(255, 255, 255, 255), stroke_width=int(3 * ss), stroke_fill=gold_col + (255,))

        out = SPRITES / "hotMiamiWinBanners" / f"{b_name}.png"
        layer.resize((width, height), Image.LANCZOS).save(out)
        print(f"[OK] Win banner {b_name}.png -> {out}")


def build_v2_all():
    print("=== Processing Hot Miami Art Spec v2 Assets ===")

    # 1. Store Tile Background
    if AI_V2["tile_background"].exists():
        im = Image.open(AI_V2["tile_background"]).convert("RGB")
        im = im.resize((1024, 1024), Image.LANCZOS)
        out_bg = SPRITES / "hotMiamiBrand" / "tile_background.png"
        im.save(out_bg)
        print(f"[OK] tile_background.png -> {out_bg}")

    # 2. Store Tile Foreground (Hero Characters)
    if AI_V2["tile_foreground"].exists():
        im = Image.open(AI_V2["tile_foreground"])
        keyed = key_chroma(im, tol=65, despill_edge=True)
        box = keyed.getbbox()
        if box:
            cropped = keyed.crop(box)
            hero = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
            inner = int(1024 * 0.92)
            cropped.thumbnail((inner, inner), Image.LANCZOS)
            hero.paste(cropped, ((1024 - cropped.width) // 2, (1024 - cropped.height) // 2), cropped)
            out_fg = SPRITES / "hotMiamiBrand" / "tile_foreground.png"
            hero.save(out_fg)
            hero.save(SOURCE / "tile_foreground.png")
            print(f"[OK] tile_foreground.png -> {out_fg}")

    # 3. Logo & Store Thumbnail Preview
    if AI_V2["logo"].exists():
        im = Image.open(AI_V2["logo"])
        keyed = key_chroma(im, tol=65, despill_edge=True)
        box = keyed.getbbox()
        if box:
            cropped = keyed.crop(box)
            logo = Image.new("RGBA", (1200, 520), (0, 0, 0, 0))
            inner_w = int(1200 * 0.94)
            inner_h = int(520 * 0.90)
            cropped.thumbnail((inner_w, inner_h), Image.LANCZOS)
            logo.paste(cropped, ((1200 - cropped.width) // 2, (520 - cropped.height) // 2), cropped)
            out_logo = SPRITES / "hotMiamiBrand" / "logo.png"
            logo.save(out_logo)
            print(f"[OK] logo.png -> {out_logo}")

            # Store Thumbnail
            if AI_V2["main_poster"].exists():
                thumb = Image.open(AI_V2["main_poster"]).convert("RGB")
                thumb = thumb.resize((1024, 1024), Image.LANCZOS)
                out_thumb = SPRITES / "hotMiamiBrand" / "thumbnail.png"
                thumb.save(out_thumb)
                print(f"[OK] thumbnail.png -> {out_thumb}")

    # 4. Backgrounds (bg_base, bg_feature, bg_epic)
    for bg_key in ("bg_base", "bg_feature", "bg_epic"):
        if AI_V2[bg_key].exists():
            im = Image.open(AI_V2[bg_key]).convert("RGB")
            im = im.resize((1920, 1080), Image.LANCZOS)
            darkened = darken_center_third(im, strength=0.50)
            out = SPRITES / "hotMiamiBackground" / f"{bg_key}.png"
            darkened.convert("RGB").save(out)
            print(f"[OK] {bg_key}.png -> {out}")

    # 5. Premium Symbols (h1 - h5)
    for sym_key in ("h1", "h2", "h3", "h4", "h5"):
        if AI_V2[sym_key].exists():
            im = Image.open(AI_V2[sym_key])
            despill = sym_key != "h5"
            keyed = key_chroma(im, tol=62, despill_edge=despill)
            sym = square_and_fit(keyed, size=512, margin=0.04)
            out = SPRITES / "hotMiamiSymbols" / f"{sym_key}.png"
            sym.save(out)
            sym.save(SOURCE / f"{sym_key}.png")
            print(f"[OK] {sym_key}.png -> {out}")

    # 6. Wild Symbol (w)
    if AI_V2["w"].exists():
        im = Image.open(AI_V2["w"])
        keyed = key_chroma(im, tol=62, despill_edge=True)
        sym = square_and_fit(keyed, size=512, margin=0.04)
        out = SPRITES / "hotMiamiSymbols" / "w.png"
        sym.save(out)
        sym.save(SOURCE / "w.png")
        print(f"[OK] w.png -> {out}")

    # 7. Scatter (s / fs)
    s_sym = build_popart_scatter(size=512)
    s_sym.save(SPRITES / "hotMiamiSymbols" / "s.png")
    s_sym.save(SPRITES / "hotMiamiSymbols" / "fs.png")
    s_sym.save(SOURCE / "s.png")
    print(f"[OK] s.png & fs.png -> {SPRITES / 'hotMiamiSymbols' / 's.png'}")

    # 8. Collector (c)
    c_sym = build_popart_collector(size=512)
    c_sym.save(SPRITES / "hotMiamiSymbols" / "c.png")
    c_sym.save(SOURCE / "c.png")
    print(f"[OK] c.png -> {SPRITES / 'hotMiamiSymbols' / 'c.png'}")

    # 9. Frame
    frame_sym = build_popart_frame(size=256)
    frame_sym.save(SPRITES / "hotMiamiSymbols" / "frame.png")
    print(f"[OK] frame.png -> {SPRITES / 'hotMiamiSymbols' / 'frame.png'}")

    # 10. Card Royals (l1 - l4)
    royal_map = {"l1": "A", "l2": "K", "l3": "Q", "l4": "J"}
    for k, letter in royal_map.items():
        r_sym = build_popart_royals(letter, size=256)
        r_sym.save(SPRITES / "hotMiamiSymbols" / f"{k}.png")
        print(f"[OK] {k}.png ({letter}) -> {SPRITES / 'hotMiamiSymbols' / f'{k}.png'}")

    # 11. Win Banners
    build_popart_win_banners()

    print("\n=== All Art Spec v2 Assets Successfully Processed & Installed ===")


if __name__ == "__main__":
    build_v2_all()
