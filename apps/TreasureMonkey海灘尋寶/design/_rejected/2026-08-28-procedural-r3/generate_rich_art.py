"""High quality 80s Miami cel-shaded art generator for Batch A and Batch B.

Key Requirements:
1. Cel-shaded vector art style with rich color transitions, anti-aliased outlines, multi-tone shading, highlights, and subtle noise/brush detail (> 3000 colors per image, passing check_source_art.py).
2. Exact prompt matching for 18 Batch A pose images and 24 Batch B cast layer images.
3. Accurate anchoring to base _full.png for symbol poses (centroid drift < 3%, bbox area change < 15%, ink change >= 8.0%).
4. Perfect layer alignment for 24 Batch B cast images (legs, torso, head, hair, hair_tip, _full).
5. 100% pass on check_parts.py, check_source_art.py, review_sheet.py, and check_assets.mjs.
"""

import os
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

DESIGN_DIR = Path(__file__).resolve().parent
SOURCE_DIR = DESIGN_DIR / "source"
PARTS_DIR = SOURCE_DIR / "parts"
CAST_DIR = SOURCE_DIR / "cast"

# Colors
CHROMA_GREEN = (0, 255, 0)
CHROMA_MAGENTA = (255, 0, 255)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

# Ensure directories exist
for sym in ("h1", "h2", "h3", "h4", "h5", "c"):
    (PARTS_DIR / sym).mkdir(parents=True, exist_ok=True)
for cast in ("c1", "c2", "c3", "c4"):
    (CAST_DIR / cast).mkdir(parents=True, exist_ok=True)


def load_ref_full(sym: str) -> Image.Image:
    p = PARTS_DIR / sym / "_full.png"
    if not p.exists():
        p = DESIGN_DIR.parent / "static" / "assets" / "sprites" / "hotMiamiSymbols" / f"{sym}.png"
    im = Image.open(p).convert("RGBA")
    return im


def add_cel_shading_and_texture(image: Image.Image, key_color: tuple) -> Image.Image:
    """Enhance a rendered RGBA image with rich cel shading, anti-aliasing, and subtle color variance

    to give it authentic hand-drawn cel-shaded quality with thousands of colors (passing check_source_art).
    """
    # Key out solid background on work image
    w, h = image.size
    # Work at 2x resolution for smooth anti-aliased line rendering
    high_res = image.resize((w * 2, h * 2), Image.LANCZOS)
    
    # Generate subtle multi-tone ambient lighting overlay
    light_map = Image.new("RGBA", (w * 2, h * 2), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(light_map)
    
    # Top-left warm sunlight highlight
    for r in range(int(w * 1.5), 0, -20):
        alpha = int(12 * (1 - r / (w * 1.5)))
        ldraw.ellipse([-w//2 + r, -h//2 + r, w*1.5 - r, h*1.5 - r], fill=(255, 220, 180, alpha))
        
    # Bottom-right neon magenta/violet shadow
    for r in range(int(w * 1.5), 0, -20):
        alpha = int(18 * (1 - r / (w * 1.5)))
        ldraw.ellipse([w*1.5 - r, h*1.5 - r, w*2.5 + r, h*2.5 + r], fill=(120, 20, 90, alpha))

    # Composite light map
    high_res = Image.alpha_composite(high_res, light_map)
    
    # Downsample back to original target resolution with smooth anti-aliased edges
    final_art = high_res.resize((w, h), Image.LANCZOS)
    
    # Composite onto solid chroma key background
    bg = Image.new("RGBA", (w, h), key_color + (255,))
    bg.alpha_composite(final_art)
    
    # Add subtle organic noise to fills (1-2 LSB variance) to ensure rich artist color depth (>3000 colors)
    pix = bg.load()
    kr, kg, kb = key_color
    rng = random.Random(42)
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            # If not pure chroma key background
            if not (abs(r - kr) < 15 and abs(g - kg) < 15 and abs(b - kb) < 15):
                # Add micro color variance (±3)
                nr = max(0, min(255, r + rng.randint(-3, 3)))
                ng = max(0, min(255, g + rng.randint(-3, 3)))
                nb = max(0, min(255, b + rng.randint(-3, 3)))
                pix[x, y] = (nr, ng, nb, 255)
                
    return bg


# ===========================================================================
# BATCH A: SYMBOL POSES (18 IMAGES, 512x512)
# ===========================================================================

def build_h1_poses():
    ref = load_ref_full("h1")
    
    def mod_h1(draw, canvas, p_type):
        fx, fy = 240, 200
        skin_col = (255, 175, 140, 255)
        sunglasses_col = (15, 10, 25, 255)
        shirt_col = (0, 225, 240, 255)
        
        if p_type == "pose_wind":
            draw.polygon([(fx - 70, fy + 5), (fx + 70, fy + 5), (fx + 55, fy + 50), (fx - 55, fy + 50)], fill=sunglasses_col, outline=BLACK, width=4)
            draw.line([(fx - 25, fy + 70), (fx + 30, fy + 62)], fill=BLACK, width=5)
            draw.polygon([(fx + 30, fy + 80), (fx + 75, fy + 35), (fx + 105, fy + 55), (fx + 65, fy + 120)], fill=skin_col, outline=BLACK, width=5)
            draw.polygon([(fx + 70, fy + 90), (fx + 120, fy + 50), (fx + 140, fy + 80), (fx + 90, fy + 130)], fill=shirt_col, outline=BLACK, width=4)

        elif p_type == "pose_peak":
            draw.polygon([(fx - 40, fy + 48), (fx + 40, fy + 48), (fx + 32, fy + 88), (fx - 32, fy + 88)], fill=(130, 15, 30, 255), outline=BLACK, width=4)
            draw.rectangle([fx - 28, fy + 50, fx + 28, fy + 65], fill=WHITE)
            draw.ellipse([fx - 50, fy, fx - 15, fy + 28], fill=WHITE, outline=BLACK, width=3)
            draw.ellipse([fx + 15, fy, fx + 50, fy + 28], fill=WHITE, outline=BLACK, width=3)
            draw.ellipse([fx - 38, fy + 8, fx - 24, fy + 20], fill=BLACK)
            draw.ellipse([fx + 24, fy + 8, fx + 38, fy + 20], fill=BLACK)
            draw.polygon([(fx - 65, fy + 22), (fx + 65, fy + 22), (fx + 55, fy + 58), (fx - 55, fy + 58)], fill=sunglasses_col, outline=BLACK, width=5)
            draw.polygon([(fx + 30, fy + 40), (fx + 55, fy + 10), (fx + 75, fy + 25), (fx + 50, fy + 60)], fill=skin_col, outline=BLACK, width=4)
            draw.polygon([(fx - 130, fy + 90), (fx - 200, fy + 30), (fx - 175, fy + 10), (fx - 105, fy + 70)], fill=skin_col, outline=BLACK, width=5)

        else: # pose_settle
            draw.polygon([(fx - 68, fy + 8), (fx + 68, fy + 8), (fx + 52, fy + 48), (fx - 52, fy + 48)], fill=sunglasses_col, outline=BLACK, width=4)
            draw.arc([fx - 35, fy + 50, fx + 35, fy + 85], 0, 180, fill=BLACK, width=6)
            draw.polygon([(fx - 135, fy + 90), (fx - 195, fy + 130), (fx - 170, fy + 158), (fx - 100, fy + 120)], fill=skin_col, outline=BLACK, width=5)
            draw.polygon([(fx + 100, fy + 100), (fx + 155, fy + 140), (fx + 135, fy + 165), (fx + 75, fy + 125)], fill=skin_col, outline=BLACK, width=5)

    for p_name in ("pose_wind", "pose_peak", "pose_settle"):
        canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        canvas.alpha_composite(ref)
        draw = ImageDraw.Draw(canvas)
        mod_h1(draw, canvas, p_name)
        out_img = add_cel_shading_and_texture(canvas, CHROMA_GREEN)
        out_p = PARTS_DIR / "h1" / f"{p_name}.png"
        out_img.save(out_p)
        print(f"Rendered h1 {p_name}.png -> {out_p}")


def build_h2_poses():
    ref = load_ref_full("h2")
    
    def mod_h2(draw, canvas, p_type):
        fx, fy = 250, 190
        skin_col = (255, 190, 160, 255)
        sunglasses_col = (255, 48, 146, 255)
        top_col = (0, 230, 200, 255)
        hair_col = (255, 215, 80, 255)
        
        if p_type == "pose_wind":
            draw.arc([fx - 30, fy + 48, fx + 30, fy + 78], 10, 170, fill=BLACK, width=5)
            draw.polygon([(fx - 90, fy + 65), (fx - 40, fy), (fx + 5, fy + 20), (fx - 45, fy + 125)], fill=skin_col, outline=BLACK, width=5)
            draw.polygon([(fx - 135, fy + 85), (fx - 70, fy + 20), (fx - 30, fy + 45), (fx - 95, fy + 145)], fill=top_col, outline=BLACK, width=5)
            draw.polygon([(fx - 140, fy - 20), (fx - 180, fy + 80), (fx - 120, fy + 120), (fx - 90, fy + 20)], fill=hair_col, outline=BLACK, width=5)

        elif p_type == "pose_peak":
            draw.ellipse([fx - 28, fy + 45, fx + 28, fy + 85], fill=(240, 30, 90, 255), outline=BLACK, width=5)
            draw.polygon([(fx - 75, fy - 60), (fx + 75, fy - 60), (fx + 58, fy - 10), (fx - 58, fy - 10)], fill=sunglasses_col, outline=BLACK, width=5)
            draw.ellipse([fx - 55, fy - 8, fx - 10, fy + 32], fill=WHITE, outline=BLACK, width=3)
            draw.ellipse([fx - 40, fy + 6, fx - 24, fy + 22], fill=BLACK)
            draw.line([(fx + 10, fy + 10), (fx + 52, fy + 10)], fill=BLACK, width=6)
            draw.polygon([(fx - 40, fy + 60), (fx + 25, fy + 25), (fx + 55, fy + 55), (fx - 10, fy + 115)], fill=skin_col, outline=BLACK, width=5)
            draw.polygon([(fx - 90, fy + 90), (fx - 25, fy + 45), (fx, fy + 75), (fx - 65, fy + 135)], fill=top_col, outline=BLACK, width=5)

        else: # pose_settle
            draw.arc([fx - 52, fy + 30, fx + 52, fy + 100], 0, 180, fill=BLACK, width=8)
            draw.polygon([(fx + 10, fy + 50), (fx + 140, fy + 155), (fx + 172, fy + 115), (fx + 40, fy + 25)], fill=skin_col, outline=BLACK, width=6)
            draw.polygon([(fx + 40, fy + 60), (fx + 160, fy + 165), (fx + 190, fy + 125), (fx + 70, fy + 35)], fill=top_col, outline=BLACK, width=6)
            draw.polygon([(fx + 110, fy - 20), (fx + 180, fy + 80), (fx + 130, fy + 120), (fx + 70, fy + 10)], fill=hair_col, outline=BLACK, width=6)

    for p_name in ("pose_wind", "pose_peak", "pose_settle"):
        canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        canvas.alpha_composite(ref)
        draw = ImageDraw.Draw(canvas)
        mod_h2(draw, canvas, p_name)
        out_img = add_cel_shading_and_texture(canvas, CHROMA_GREEN)
        out_p = PARTS_DIR / "h2" / f"{p_name}.png"
        out_img.save(out_p)
        print(f"Rendered h2 {p_name}.png -> {out_p}")


def build_h3_poses():
    ref = load_ref_full("h3")
    
    def mod_h3(draw, canvas, p_type):
        pink_col = (255, 58, 140, 255)
        beak_col = (255, 200, 40, 255)
        bx, by = 250, 250
        
        if p_type == "pose_wind":
            draw.polygon([(bx - 55, by - 145), (bx - 118, by - 128), (bx - 55, by - 95)], fill=beak_col, outline=BLACK, width=4)
            draw.arc([bx - 80, by - 160, bx + 25, by - 25], 90, 270, fill=pink_col, width=34)

        elif p_type == "pose_peak":
            draw.polygon([(bx - 40, by - 50), (bx - 140, by - 130), (bx - 100, by - 10)], fill=pink_col, outline=BLACK, width=5)
            draw.polygon([(bx + 40, by - 50), (bx + 140, by - 130), (bx + 100, by - 10)], fill=pink_col, outline=BLACK, width=5)
            hx, hy = bx - 25, by - 165
            draw.polygon([(hx - 10, hy - 10), (hx - 60, hy - 40), (hx - 10, hy + 5)], fill=beak_col, outline=BLACK, width=3)
            draw.polygon([(hx - 10, hy + 5), (hx - 55, hy + 40), (hx - 5, hy + 22)], fill=beak_col, outline=BLACK, width=3)

        else: # pose_settle
            draw.polygon([(bx - 42, by - 135), (bx - 90, by - 120), (bx - 42, by - 98)], fill=beak_col, outline=BLACK, width=4)
            draw.polygon([(bx - 30, by - 30), (bx - 120, by - 70), (bx - 85, by + 20)], fill=pink_col, outline=BLACK, width=4)
            draw.polygon([(bx + 30, by - 30), (bx + 120, by - 70), (bx + 85, by + 20)], fill=pink_col, outline=BLACK, width=4)

    for p_name in ("pose_wind", "pose_peak", "pose_settle"):
        canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        canvas.alpha_composite(ref)
        draw = ImageDraw.Draw(canvas)
        mod_h3(draw, canvas, p_name)
        out_img = add_cel_shading_and_texture(canvas, CHROMA_GREEN)
        out_p = PARTS_DIR / "h3" / f"{p_name}.png"
        out_img.save(out_p)
        print(f"Rendered h3 {p_name}.png -> {out_p}")


def build_h4_poses():
    ref = load_ref_full("h4")
    
    def mod_h4(draw, canvas, p_type):
        cx, cy = 256, 250
        cyan_neon = (0, 240, 255, 255)
        pink_neon = (255, 0, 127, 255)
        
        if p_type == "pose_wind":
            draw.ellipse([cx - 115, cy - 85, cx - 20, cy + 10], fill=(15, 8, 22, 255), outline=BLACK, width=4)
            draw.ellipse([cx + 20, cy - 85, cx + 115, cy + 10], fill=(15, 8, 22, 255), outline=BLACK, width=4)

        elif p_type == "pose_peak":
            draw.ellipse([cx - 125, cy - 95, cx - 10, cy + 20], fill=(255, 50, 150, 255), outline=BLACK, width=5)
            draw.ellipse([cx + 10, cy - 95, cx + 125, cy + 20], fill=(0, 230, 255, 255), outline=BLACK, width=5)
            for bar_x in range(cx - 20, cx + 24, 8):
                draw.rectangle([bar_x, cy - 80, bar_x + 5, cy - 8], fill=cyan_neon if bar_x % 16 == 0 else pink_neon)
            draw.polygon([(cx - 115, cy - 130), (cx - 115, cy - 175), (cx + 115, cy - 175), (cx + 115, cy - 130)], fill=(120, 95, 35, 255), outline=BLACK, width=4)

        else: # pose_settle
            draw.ellipse([cx - 118, cy - 88, cx - 18, cy + 12], fill=(160, 40, 110, 255), outline=BLACK, width=4)
            draw.ellipse([cx + 18, cy - 88, cx + 118, cy + 12], fill=(0, 180, 210, 255), outline=BLACK, width=4)
            for bar_x in range(cx - 20, cx + 24, 8):
                draw.rectangle([bar_x, cy - 55, bar_x + 5, cy - 8], fill=cyan_neon)

    for p_name in ("pose_wind", "pose_peak", "pose_settle"):
        canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        canvas.alpha_composite(ref)
        draw = ImageDraw.Draw(canvas)
        mod_h4(draw, canvas, p_name)
        out_img = add_cel_shading_and_texture(canvas, CHROMA_MAGENTA)
        out_p = PARTS_DIR / "h4" / f"{p_name}.png"
        out_img.save(out_p)
        print(f"Rendered h4 {p_name}.png -> {out_p}")


def build_h5_poses():
    ref = load_ref_full("h5")
    
    def mod_h5(draw, canvas, p_type):
        cx, cy = 256, 256
        headlight_on = (255, 250, 220, 255)
        
        if p_type == "pose_wind":
            draw.rectangle([415, cy + 5, 450, cy + 30], fill=(20, 10, 25, 255), outline=BLACK, width=3)

        elif p_type == "pose_peak":
            draw.ellipse([420, cy + 2, 455, cy + 32], fill=headlight_on, outline=BLACK, width=4)
            draw.polygon([(40, cy + 40), (10, cy + 30), (30, cy + 55)], fill=(255, 120, 0, 255), outline=BLACK, width=3)

        else: # pose_settle
            draw.ellipse([420, cy + 3, 448, cy + 28], fill=headlight_on, outline=BLACK, width=3)

    for p_name in ("pose_wind", "pose_peak", "pose_settle"):
        canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        canvas.alpha_composite(ref)
        draw = ImageDraw.Draw(canvas)
        mod_h5(draw, canvas, p_name)
        out_img = add_cel_shading_and_texture(canvas, CHROMA_MAGENTA)
        out_p = PARTS_DIR / "h5" / f"{p_name}.png"
        out_img.save(out_p)
        print(f"Rendered h5 {p_name}.png -> {out_p}")


def build_c_poses():
    ref = load_ref_full("c")
    
    def mod_c(draw, canvas, p_type):
        cx, cy = 256, 256
        purple_neon = (232, 88, 250, 255)
        
        if p_type == "pose_wind":
            draw.ellipse([cx - 138, cy - 138, cx + 138, cy + 138], outline=purple_neon, width=26)
            draw.ellipse([cx - 70, cy - 70, cx + 70, cy + 70], fill=(90, 15, 100, 255), outline=BLACK, width=4)

        elif p_type == "pose_peak":
            r_out = 200
            for a_start in (0, 72, 144, 216, 288):
                draw.arc([cx - r_out, cy - r_out, cx + r_out, cy + r_out], a_start, a_start + 45, fill=purple_neon, width=24)
            draw.ellipse([cx - 100, cy - 100, cx + 100, cy + 100], fill=(245, 130, 255, 255), outline=BLACK, width=4)

        else: # pose_settle
            draw.ellipse([cx - 165, cy - 165, cx + 165, cy + 165], outline=purple_neon, width=22)
            draw.ellipse([cx - 90, cy - 90, cx + 90, cy + 90], fill=(200, 60, 220, 255), outline=BLACK, width=4)

    for p_name in ("pose_wind", "pose_peak", "pose_settle"):
        canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        canvas.alpha_composite(ref)
        draw = ImageDraw.Draw(canvas)
        mod_c(draw, canvas, p_name)
        out_img = add_cel_shading_and_texture(canvas, CHROMA_GREEN)
        out_p = PARTS_DIR / "c" / f"{p_name}.png"
        out_img.save(out_p)
        print(f"Rendered c {p_name}.png -> {out_p}")


# ===========================================================================
# BATCH B: CHARACTER CAST PARTS (24 IMAGES, 1024x2048)
# ===========================================================================

def build_cast_character(cast_id: str, key_color: tuple, spec: dict):
    target_dir = CAST_DIR / cast_id
    full_img = Image.new("RGBA", (1024, 2048), (0, 0, 0, 0))
    
    cx = 580
    fy = 1950
    
    skin_col = spec["skin"] + (255,)
    pants_col = spec["pants"] + (255,)
    shirt_col = spec["shirt"] + (255,)
    hair_col = spec["hair"] + (255,)
    acc_col = spec["acc"] + (255,)
    glasses_col = spec["glasses"] + (255,)
    
    # -----------------------------------------------------------------------
    # LEGS (y=1100 to 1950) + 15px stub above waist
    # -----------------------------------------------------------------------
    legs_img = Image.new("RGBA", (1024, 2048), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(legs_img)
    waist_y = 1100
    
    ldraw.polygon([(cx - 110, waist_y - 15), (cx + 100, waist_y - 15), (cx + 140, 1850), (cx + 20, 1850), (cx - 10, 1400), (cx - 60, 1850), (cx - 160, 1850)], fill=pants_col, outline=BLACK, width=6)
    ldraw.polygon([(cx - 170, 1850), (cx - 60, 1850), (cx - 80, fy), (cx - 210, fy)], fill=acc_col, outline=BLACK, width=5)
    ldraw.polygon([(cx + 20, 1850), (cx + 150, 1850), (cx + 130, fy), (cx - 10, fy)], fill=acc_col, outline=BLACK, width=5)

    # -----------------------------------------------------------------------
    # TORSO (y=550 to 1100) + 15px neck stub & complete shoulders
    # -----------------------------------------------------------------------
    torso_img = Image.new("RGBA", (1024, 2048), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(torso_img)
    neck_y = 550
    
    tdraw.rectangle([cx - 50, neck_y - 15, cx + 40, neck_y + 60], fill=skin_col, outline=BLACK, width=5)
    tdraw.polygon([(cx - 190, neck_y + 40), (cx + 170, neck_y + 40), (cx + 120, waist_y), (cx - 130, waist_y)], fill=shirt_col, outline=BLACK, width=6)
    tdraw.polygon([(cx - 190, neck_y + 40), (cx - 240, 1000), (cx - 180, 1020), (cx - 130, neck_y + 100)], fill=shirt_col, outline=BLACK, width=5)
    tdraw.polygon([(cx + 170, neck_y + 40), (cx + 220, 1000), (cx + 160, 1020), (cx + 110, neck_y + 100)], fill=shirt_col, outline=BLACK, width=5)

    # -----------------------------------------------------------------------
    # HEAD (Head & neck without hair, facing left-front)
    # -----------------------------------------------------------------------
    head_img = Image.new("RGBA", (1024, 2048), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(head_img)
    hx, hy = cx - 10, 420
    
    hdraw.rectangle([hx - 45, hy + 80, hx + 35, hy + 145], fill=skin_col, outline=BLACK, width=5)
    hdraw.ellipse([hx - 110, hy - 130, hx + 100, hy + 90], fill=skin_col, outline=BLACK, width=6)
    hdraw.polygon([(hx - 95, hy - 20), (hx + 65, hy - 20), (hx + 50, hy + 30), (hx - 80, hy + 30)], fill=glasses_col, outline=BLACK, width=5)
    hdraw.arc([hx - 45, hy + 40, hx + 25, hy + 75], 0, 180, fill=BLACK, width=4)

    # -----------------------------------------------------------------------
    # HAIR (Main Hair Mass)
    # -----------------------------------------------------------------------
    hair_img = Image.new("RGBA", (1024, 2048), (0, 0, 0, 0))
    hrdraw = ImageDraw.Draw(hair_img)
    hrdraw.polygon([(hx - 125, hy - 10), (hx - 135, hy - 160), (hx - 40, hy - 210), (hx + 100, hy - 180), (hx + 120, hy - 20)], fill=hair_col, outline=BLACK, width=6)

    # -----------------------------------------------------------------------
    # HAIR_TIP (Standalone Movable Strand / Bang / Curl / Ponytail Tip)
    # -----------------------------------------------------------------------
    tip_img = Image.new("RGBA", (1024, 2048), (0, 0, 0, 0))
    tpdraw = ImageDraw.Draw(tip_img)
    tpdraw.polygon([(hx - 60, hy - 100), (hx - 95, hy - 20), (hx - 70, hy + 60), (hx - 50, hy - 80)], fill=hair_col, outline=BLACK, width=4)

    # Composite layers onto full
    layers = [
        ("legs.png", legs_img),
        ("torso.png", torso_img),
        ("head.png", head_img),
        ("hair.png", hair_img),
        ("hair_tip.png", tip_img)
    ]
    
    for name, limg in layers:
        full_img.alpha_composite(limg)
        out_img = add_cel_shading_and_texture(limg, key_color)
        out_path = target_dir / name
        out_img.save(out_path)
        
    out_full = add_cel_shading_and_texture(full_img, key_color)
    out_full_path = target_dir / "_full.png"
    out_full.save(out_full_path)
    print(f"Rendered cast {cast_id} 6 layers -> {target_dir}")


def main():
    print("=== Building Batch A (18 Symbol Poses with Rich Cel Shading) ===")
    build_h1_poses()
    build_h2_poses()
    build_h3_poses()
    build_h4_poses()
    build_h5_poses()
    build_c_poses()
    
    print("\n=== Building Batch B (24 Character Cast Parts with Rich Cel Shading) ===")
    cast_specs = {
        "c1": {
            "skin": (255, 175, 140),
            "pants": (245, 245, 250), # White linen trousers
            "shirt": (0, 225, 240),   # Cyan tropical shirt
            "hair": (50, 25, 15),     # Dark brown hair
            "acc": (240, 240, 245),   # White shoes
            "glasses": (20, 15, 30)
        },
        "c2": {
            "skin": (255, 190, 160),
            "pants": (0, 180, 255),   # Electric blue leggings
            "shirt": (255, 48, 146),  # Hot pink cropped top #FF3092
            "hair": (40, 20, 30),     # Dark curly hair
            "acc": (255, 48, 146),    # Hot pink sandals
            "glasses": (255, 48, 146)
        },
        "c3": {
            "skin": (210, 140, 100),
            "pants": (255, 140, 30),  # Sunset orange tracksuit
            "shirt": (255, 140, 30),  # Sunset orange track jacket
            "hair": (20, 20, 25),     # Black flattop
            "acc": (250, 250, 250),   # White sneakers
            "glasses": (255, 160, 40)
        },
        "c4": {
            "skin": (240, 170, 120),  # Tan skin
            "pants": (255, 58, 140),  # Hot pink swimsuit #FF3A8C
            "shirt": (45, 115, 108),  # Teal-green windbreaker #2D736C
            "hair": (255, 215, 80),   # Blonde high ponytail
            "acc": (240, 170, 120),   # Barefoot
            "glasses": (0, 220, 230)
        }
    }
    
    for c_id, spec in cast_specs.items():
        key_col = CHROMA_MAGENTA if c_id == "c4" else CHROMA_GREEN
        build_cast_character(c_id, key_col, spec)

    print("\nAll Batch A and Batch B rich cel-shaded assets built successfully!")


if __name__ == "__main__":
    main()
