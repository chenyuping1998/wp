#!/usr/bin/env python3
"""Generate updated source parts for HotMiami (Section 10 of prompt).

Outputs 6 files directly to design/source/parts/ on pure green #00FF00 background:
1. h3/head_neck_blink.png
2. h3/head_neck_squawk.png
3. h4/panel_lit.png
4. h5/lights_on.png
5. h2/head_smile.png
6. h2/head_wink.png
"""
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS_DIR = os.path.join(ROOT, "design/source/parts")

GREEN_KEY = (0, 255, 0, 255)

def create_green_canvas(w=512, h=512):
    return Image.new("RGBA", (w, h), GREEN_KEY)

def prepare_base_image(path):
    """Load a base image and place it cleanly over green #00FF00 background."""
    im = Image.open(path).convert("RGBA")
    canvas = create_green_canvas(im.width, im.height)
    canvas.alpha_composite(im)
    return canvas

# ── 1 & 2: h3 Flamingo Head & Neck Updates ───────────────────────────────────
def generate_h3_head_neck_blink():
    base_path = os.path.join(PARTS_DIR, "h3/head_neck.png")
    img = prepare_base_image(base_path)
    d = ImageDraw.Draw(img)

    # Eye center is around x=194, y=52
    ex, ey = 194, 52
    
    # Fill eye socket with flamingo pink body color to cover open eye
    d.ellipse([ex - 12, ey - 10, ex + 12, ey + 10], fill=(255, 58, 140, 255))
    
    # Draw bold curved closed eye arc with eyelashes directly on the head
    d.arc([ex - 12, ey - 8, ex + 12, ey + 8], start=20, end=160, fill=(18, 12, 34, 255), width=4)
    # Eyelashes
    for angle in (-40, -10, 20):
        rad = math.radians(angle)
        lx = ex + math.cos(rad) * 11
        ly = ey + 2 + math.sin(rad) * 8
        d.line([lx, ly, lx + math.cos(rad) * 6, ly + math.sin(rad) * 6], fill=(18, 12, 34, 255), width=3)

    return img

def generate_h3_head_neck_squawk():
    base_path = os.path.join(PARTS_DIR, "h3/head_neck.png")
    img = prepare_base_image(base_path)
    d = ImageDraw.Draw(img)

    # Beak hinge point at x=192, y=66
    # Upper beak stays fixed (y: 42..66, x: 192..239)
    # Lower beak opens down by ~35 degrees (y extends down to ~95)
    
    # Clear old lower beak area
    d.polygon([(186, 66), (239, 78), (232, 92), (180, 85)], fill=GREEN_KEY)
    
    # Draw open dark mouth interior
    d.polygon([(190, 68), (234, 76), (226, 92), (188, 76)], fill=(74, 12, 36, 255))
    # Pink tongue
    d.polygon([(192, 72), (218, 78), (212, 85), (190, 78)], fill=(255, 110, 150, 255))

    # Rotated lower beak (black tip & yellow/pink base)
    lower_beak = [(190, 74), (232, 92), (220, 102), (184, 82)]
    d.polygon(lower_beak, fill=(255, 230, 120, 255), outline=(18, 12, 34, 255), width=4)
    # Black tip on lower beak
    d.polygon([(216, 85), (232, 92), (220, 102), (210, 92)], fill=(18, 12, 34, 255))

    # Re-draw mouth seam and clean join
    d.line([186, 66, 192, 74], fill=(18, 12, 34, 255), width=4)

    return img

# ── 3: h4 Boombox Control Panel Glow (panel_lit) ────────────────────────────
def generate_h4_panel_lit():
    img = create_green_canvas(512, 512)
    d = ImageDraw.Draw(img)

    # Control panel is positioned between the two speakers at y ~ 235..295, x ~ 160..352
    py0, py1 = 238, 292
    px0, px1 = 165, 348

    # Equalizer neon vertical bars (Cyan #00FFFF and Magenta #FF00FF)
    num_bars = 10
    bar_w = 8
    spacing = (px1 - px0 - num_bars * bar_w) / (num_bars + 1)
    
    for i in range(num_bars):
        bx = int(px0 + spacing + i * (bar_w + spacing))
        h_ratio = [0.6, 0.9, 0.4, 0.85, 1.0, 0.7, 0.95, 0.5, 0.8, 0.65][i]
        bh = int((py1 - py0 - 16) * h_ratio)
        by1 = py1 - 8
        by0 = by1 - bh
        color = (0, 255, 255, 255) if i % 2 == 0 else (255, 0, 255, 255)
        d.rounded_rectangle([bx, by0, bx + bar_w, by1], radius=3, fill=color)

    # Neon indicator dials & digital display in cyan/magenta/white
    d.rectangle([px0 + 10, py0 + 6, px0 + 80, py0 + 18], fill=(0, 255, 255, 255))
    d.ellipse([px1 - 40, py0 + 6, px1 - 24, py0 + 22], fill=(255, 0, 255, 255))
    d.ellipse([px1 - 20, py0 + 6, px1 - 4, py0 + 22], fill=(0, 255, 255, 255))

    return img

# ── 4: h5 Car Headlights Glow (lights_on) ───────────────────────────────────
def generate_h5_lights_on():
    img = create_green_canvas(512, 512)
    glow_img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    d_g = ImageDraw.Draw(glow_img)

    for cx, cy, rx, ry in [(100, 305, 32, 22), (168, 296, 26, 18)]:
        for r_step in range(30, 0, -2):
            alpha = int(255 * (1.0 - r_step / 30.0) ** 1.8)
            d_g.ellipse([cx - rx * (r_step / 30.0), cy - ry * (r_step / 30.0),
                         cx + rx * (r_step / 30.0), cy + ry * (r_step / 30.0)],
                        fill=(255, 250, 220, alpha))
        d_g.ellipse([cx - rx * 0.35, cy - ry * 0.35, cx + rx * 0.35, cy + ry * 0.35], fill=(255, 255, 255, 255))

    img.alpha_composite(glow_img)
    return img

# ── 5 & 6: h2 Female Head Smile & Wink Updates ───────────────────────────────
def generate_h2_head_smile():
    base_path = os.path.join(PARTS_DIR, "h2/head.png")
    # Start directly from raw base image (which ALREADY has green background)
    img = Image.open(base_path).convert("RGBA")
    d = ImageDraw.Draw(img)

    # Tightly scoped mouth region only (y: 215..262, x: 220..310)
    d.rectangle([218, 215, 312, 262], fill=GREEN_KEY)
    d.ellipse([215, 212, 315, 265], fill=(255, 177, 139, 255))

    # Exaggerated wide open-mouthed laugh showing white teeth
    mouth_poly = [(222, 218), (308, 218), (296, 258), (234, 258)]
    d.polygon(mouth_poly, fill=(50, 10, 24, 255), outline=(18, 12, 34, 255), width=4)
    d.rectangle([226, 220, 304, 230], fill=(255, 255, 255, 255))
    d.line([226, 230, 304, 230], fill=(18, 12, 34, 255), width=2)
    d.ellipse([238, 236, 292, 254], fill=(255, 96, 144, 255))

    return img

def generate_h2_head_wink():
    base_path = os.path.join(PARTS_DIR, "h2/head.png")
    # Start directly from raw base image (which ALREADY has green background)
    img = Image.open(base_path).convert("RGBA")
    d = ImageDraw.Draw(img)

    # Right sunglass lens (x=182..232, y=134..168)
    d.ellipse([182, 134, 232, 168], fill=(18, 12, 34, 255))
    d.arc([186, 140, 228, 162], start=200, end=340, fill=(255, 48, 146, 255), width=5)
    d.arc([186, 140, 228, 162], start=200, end=340, fill=(255, 255, 255, 255), width=3)
    for lx, ly in [(188, 154), (202, 160), (222, 154)]:
        d.line([lx, ly, lx - 4, ly + 5], fill=(255, 255, 255, 255), width=3)

    # Tightly scoped lopsided open smile (y: 215..262, x: 220..310)
    d.rectangle([218, 215, 312, 262], fill=GREEN_KEY)
    d.ellipse([215, 212, 315, 265], fill=(255, 177, 139, 255))

    mouth_poly = [(222, 220), (308, 215), (294, 256), (230, 260)]
    d.polygon(mouth_poly, fill=(50, 10, 24, 255), outline=(18, 12, 34, 255), width=4)
    d.rectangle([226, 218, 304, 228], fill=(255, 255, 255, 255))
    d.ellipse([240, 234, 290, 252], fill=(255, 96, 144, 255))

    return img

def main():
    print("Generating updated 6 source parts...")
    
    files = {
        "h3/head_neck_blink.png": generate_h3_head_neck_blink(),
        "h3/head_neck_squawk.png": generate_h3_head_neck_squawk(),
        "h4/panel_lit.png": generate_h4_panel_lit(),
        "h5/lights_on.png": generate_h5_lights_on(),
        "h2/head_smile.png": generate_h2_head_smile(),
        "h2/head_wink.png": generate_h2_head_wink(),
    }

    for rel_path, img in files.items():
        full_path = os.path.join(PARTS_DIR, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        img.save(full_path, format="PNG", optimize=True)
        print(f"  Wrote {rel_path} ({img.width}x{img.height})")

    print("Done!")

if __name__ == "__main__":
    main()
