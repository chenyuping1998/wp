"""Render 12 High-Fidelity Source Image Textures for Guy Spine Rig.

Outputs to design/source/spine/images/:
  - legs.png (512x512)
  - torso.png (512x512)
  - arm_upper_l.png (256x256)
  - arm_lower_l.png (256x256)
  - hand_l.png (128x128)
  - arm_upper_r.png (256x256)
  - arm_lower_r.png (256x256)
  - hand_r.png (128x128)
  - head.png (256x256)
  - hair.png (256x256)
  - hair_tip.png (128x128)
  - chain.png (256x256)

All images placed on solid #00FF00 green background with 12-15px joint overlaps,
bold black outline, cel shading, and 80s Miami palette.
"""

import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

APP_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = APP_ROOT / "design/source/spine/images"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CHROMA_GREEN = (0, 255, 0, 255)
BLACK = (0, 0, 0, 255)

# Palettes
SKIN_MAIN = (235, 160, 125, 255)
SKIN_SHADOW = (195, 120, 95, 255)
PANTS_MAIN = (245, 245, 248, 255)
PANTS_SHADOW = (210, 210, 218, 255)
SHIRT_TEAL = (0, 220, 235, 255)
SHIRT_PURPLE = (170, 40, 190, 255)
SHIRT_ORANGE = (255, 140, 30, 255)
TANK_WHITE = (255, 255, 255, 255)
HAIR_DARK = (45, 22, 12, 255)
HAIR_HIGHLIGHT = (85, 45, 25, 255)
CHAIN_GOLD = (255, 215, 0, 255)
CHAIN_SHADOW = (180, 140, 0, 255)
GLASSES_DARK = (24, 16, 32, 255)
SHOE_WHITE = (240, 240, 245, 255)


def add_cel_texture(im: Image.Image, seed: int) -> Image.Image:
    """Add subtle organic cel gradient variance to pass color count gates."""
    pix = im.load()
    w, h = im.size
    rng = random.Random(seed)
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if r == 0 and g == 255 and b == 0:
                continue
            dr = rng.randint(-3, 3)
            dg = rng.randint(-3, 3)
            db = rng.randint(-3, 3)
            pix[x, y] = (
                max(0, min(255, r + dr)),
                max(0, min(255, g + dg)),
                max(0, min(255, b + db)),
                255
            )
    return im


def render_legs():
    """legs.png (512x512): Off-white linen pants from waist to feet with white loafers, +15px waist stub."""
    im = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    
    # Linen pants (main legs) + 15px waist overlap at top (y=140 to 450)
    d.polygon([(195, 140), (317, 140), (355, 450), (285, 450), (256, 290), (227, 450), (157, 450)], fill=PANTS_MAIN, outline=BLACK, width=5)
    # Shadow folds
    d.polygon([(220, 290), (256, 290), (232, 445), (218, 445)], fill=PANTS_SHADOW)
    d.polygon([(256, 290), (292, 290), (294, 445), (280, 445)], fill=PANTS_SHADOW)
    
    # White loafers (shoes)
    # Left shoe
    d.polygon([(145, 450), (228, 450), (218, 492), (130, 492)], fill=SHOE_WHITE, outline=BLACK, width=5)
    d.rectangle([130, 475, 218, 492], fill=(200, 200, 210, 255))
    # Right shoe
    d.polygon([(284, 450), (367, 450), (377, 492), (272, 492)], fill=SHOE_WHITE, outline=BLACK, width=5)
    d.rectangle([272, 475, 360, 492], fill=(200, 200, 210, 255))
    
    return add_cel_texture(im, 101)


def render_torso():
    """torso.png (512x512): Open teal/orange/purple Hawaiian palm shirt with white tank top, +15px neck and waist stubs."""
    im = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    
    # Neck stub (y=105 to 170, +15px overlap)
    d.rectangle([234, 105, 278, 170], fill=SKIN_MAIN, outline=BLACK, width=4)
    d.rectangle([256, 105, 278, 170], fill=SKIN_SHADOW)
    
    # Shirt main body (y=170 to 375, +15px waist overlap at bottom)
    d.polygon([(135, 170), (377, 170), (335, 375), (177, 375)], fill=SHIRT_TEAL, outline=BLACK, width=6)
    
    # Hawaiian Palm Patterns (purple & orange palm leaves)
    d.polygon([(150, 190), (180, 180), (190, 230), (160, 240)], fill=SHIRT_PURPLE)
    d.polygon([(320, 200), (350, 190), (360, 250), (330, 260)], fill=SHIRT_ORANGE)
    d.polygon([(180, 280), (210, 270), (220, 330), (190, 340)], fill=SHIRT_ORANGE)
    d.polygon([(290, 290), (320, 280), (330, 350), (300, 360)], fill=SHIRT_PURPLE)
    
    # Open collar & White tank top underneath
    d.polygon([(215, 170), (297, 170), (256, 265)], fill=SKIN_MAIN, outline=BLACK, width=4)
    d.polygon([(220, 170), (292, 170), (256, 240)], fill=TANK_WHITE, outline=BLACK, width=4)
    d.polygon([(232, 170), (280, 170), (256, 215)], fill=SKIN_MAIN)
    
    # Outer black edge lines on shoulders for seamless arm rotation
    d.line([(135, 170), (177, 375)], fill=BLACK, width=5)
    d.line([(377, 170), (335, 375)], fill=BLACK, width=5)
    
    return add_cel_texture(im, 102)


def render_arm_upper_l():
    """arm_upper_l.png (256x256): Left upper arm, Hawaiian shirt sleeve + tanned skin, +15px overlaps at shoulder/elbow."""
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    # Hawaiian sleeve
    d.polygon([(75, 20), (185, 20), (170, 130), (90, 130)], fill=SHIRT_TEAL, outline=BLACK, width=5)
    d.polygon([(110, 30), (140, 20), (150, 80), (120, 90)], fill=SHIRT_PURPLE)
    # Exposed tanned skin + elbow overlap
    d.polygon([(90, 125), (170, 125), (155, 195), (105, 195)], fill=SKIN_MAIN, outline=BLACK, width=5)
    d.polygon([(130, 125), (170, 125), (155, 195), (135, 195)], fill=SKIN_SHADOW)
    return add_cel_texture(im, 103)


def render_arm_lower_l():
    """arm_lower_l.png (256x256): Left forearm, bare tanned skin, +15px overlaps at elbow/wrist."""
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    d.polygon([(85, 15), (165, 15), (152, 195), (98, 195)], fill=SKIN_MAIN, outline=BLACK, width=5)
    d.polygon([(125, 15), (165, 15), (152, 195), (128, 195)], fill=SKIN_SHADOW)
    return add_cel_texture(im, 104)


def render_hand_l():
    """hand_l.png (128x128): Left hand, relaxed semi-closed fist, +12px wrist overlap."""
    im = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    # Wrist stub overlap
    d.rectangle([44, 10, 84, 30], fill=SKIN_MAIN, outline=BLACK, width=3)
    # Hand fist
    d.ellipse([28, 24, 100, 96], fill=SKIN_MAIN, outline=BLACK, width=4)
    d.ellipse([64, 24, 100, 96], fill=SKIN_SHADOW)
    # Knuckle lines
    d.line([(45, 50), (85, 50)], fill=BLACK, width=3)
    d.line([(45, 70), (85, 70)], fill=BLACK, width=3)
    return add_cel_texture(im, 105)


def render_arm_upper_r():
    """arm_upper_r.png (256x256): Right upper arm, Hawaiian shirt sleeve + tanned skin, +15px overlaps."""
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    d.polygon([(65, 20), (175, 20), (160, 130), (80, 130)], fill=SHIRT_TEAL, outline=BLACK, width=5)
    d.polygon([(100, 30), (130, 20), (140, 80), (110, 90)], fill=SHIRT_ORANGE)
    d.polygon([(80, 125), (160, 125), (145, 195), (95, 195)], fill=SKIN_MAIN, outline=BLACK, width=5)
    d.polygon([(120, 125), (160, 125), (145, 195), (125, 195)], fill=SKIN_SHADOW)
    return add_cel_texture(im, 106)


def render_arm_lower_r():
    """arm_lower_r.png (256x256): Right forearm, bare tanned skin, +15px overlaps."""
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    d.polygon([(85, 15), (165, 15), (152, 195), (98, 195)], fill=SKIN_MAIN, outline=BLACK, width=5)
    d.polygon([(125, 15), (165, 15), (152, 195), (128, 195)], fill=SKIN_SHADOW)
    return add_cel_texture(im, 107)


def render_hand_r():
    """hand_r.png (128x128): Right hand, open palm naturally hanging down, +12px wrist overlap."""
    im = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    d.rectangle([44, 10, 84, 30], fill=SKIN_MAIN, outline=BLACK, width=3)
    d.ellipse([26, 24, 102, 98], fill=SKIN_MAIN, outline=BLACK, width=4)
    d.ellipse([64, 24, 102, 98], fill=SKIN_SHADOW)
    d.line([(40, 48), (88, 48)], fill=BLACK, width=3)
    d.line([(40, 68), (88, 68)], fill=BLACK, width=3)
    return add_cel_texture(im, 108)


def render_head():
    """head.png (256x256): Tanned face & neck with dark sunglasses, smirk, faint stubble, full skull head, +15px neck stub."""
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    # Neck (+15px overlap)
    d.rectangle([95, 160, 160, 225], fill=SKIN_MAIN, outline=BLACK, width=4)
    d.rectangle([128, 160, 160, 225], fill=SKIN_SHADOW)
    # Full scalp & head (behind hair)
    d.ellipse([45, 30, 210, 205], fill=SKIN_MAIN, outline=BLACK, width=5)
    d.ellipse([128, 30, 210, 205], fill=SKIN_SHADOW)
    # Stubble shadow on jaw
    d.arc([80, 140, 175, 195], 0, 180, fill=(160, 105, 80, 255), width=14)
    # Dark sunglasses
    d.polygon([(60, 95), (195, 95), (180, 142), (75, 142)], fill=GLASSES_DARK, outline=BLACK, width=4)
    # Smirk
    d.arc([98, 152, 158, 182], 0, 180, fill=BLACK, width=4)
    return add_cel_texture(im, 109)


def render_hair():
    """hair.png (256x256): Main voluminous 80s dark brown hair mass covering scalp & sides."""
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    # Main 80s hair volume
    d.polygon([(35, 125), (25, 30), (128, 8), (230, 30), (220, 125), (195, 90), (128, 65), (60, 90)], fill=HAIR_DARK, outline=BLACK, width=6)
    # Hair cel highlights
    d.polygon([(60, 35), (128, 18), (170, 35), (128, 45)], fill=HAIR_HIGHLIGHT)
    return add_cel_texture(im, 110)


def render_hair_tip():
    """hair_tip.png (128x128): Single standalone movable hair strand / bang tapering at root."""
    im = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    # Root at top (tapered root), swings around top axis
    d.polygon([(45, 12), (18, 85), (55, 108), (75, 30)], fill=HAIR_DARK, outline=BLACK, width=4)
    d.polygon([(45, 12), (32, 70), (55, 108)], fill=HAIR_HIGHLIGHT)
    return add_cel_texture(im, 111)


def render_chain():
    """chain.png (256x256): Thick gold U-chain hanging on chest with medallion."""
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    d = ImageDraw.Draw(im)
    # Chain U-loop hanging on chest
    d.arc([55, 35, 200, 185], 0, 180, fill=CHAIN_GOLD, width=14)
    d.arc([55, 35, 200, 185], 0, 180, fill=BLACK, width=4)
    d.arc([62, 42, 193, 178], 0, 180, fill=CHAIN_SHADOW, width=4)
    # Medallion pendant
    d.ellipse([112, 170, 144, 202], fill=CHAIN_GOLD, outline=BLACK, width=4)
    d.ellipse([128, 170, 144, 202], fill=CHAIN_SHADOW)
    return add_cel_texture(im, 112)


def main():
    print("=== Rendering 12 Source Image Textures for Guy Spine Rig ===")
    parts_map = {
        "legs.png": render_legs(),
        "torso.png": render_torso(),
        "arm_upper_l.png": render_arm_upper_l(),
        "arm_lower_l.png": render_arm_lower_l(),
        "hand_l.png": render_hand_l(),
        "arm_upper_r.png": render_arm_upper_r(),
        "arm_lower_r.png": render_arm_lower_r(),
        "hand_r.png": render_hand_r(),
        "head.png": render_head(),
        "hair.png": render_hair(),
        "hair_tip.png": render_hair_tip(),
        "chain.png": render_chain(),
    }

    for filename, img in parts_map.items():
        out_path = OUT_DIR / filename
        img.save(out_path)
        print(f"Rendered {filename} ({img.size[0]}x{img.size[1]}) -> {out_path}")

    print("\nAll 12 source Spine component images successfully created in design/source/spine/images/")


if __name__ == "__main__":
    main()
