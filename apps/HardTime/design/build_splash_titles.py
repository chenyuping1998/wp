"""Generate the 3 Hot Miami feature mode splash title assets strictly according to prompt specs:

1. wp/apps/HotMiami/design/source/splash/title_neon_nights.png
   - Text: "NEON NIGHTS"
   - Neon Color: Pink/Magenta #FF2E88

2. wp/apps/HotMiami/design/source/splash/title_sunset_hits.png
   - Text: "SUNSET HITS"
   - Neon Color: Sunset Orange #FFA14A

3. wp/apps/HotMiami/design/source/splash/title_ocean_drive.png
   - Text: "OCEAN DRIVE"
   - Neon Color: Electric Cyan #00E5FF

Shared Specs:
- 1024x360, transparent PNG-32 (RGBA, soft glow fading to transparent, no chroma key).
- 1980s Miami neon sign text in 1 line.
- Font: Heavy sans-serif retro display font with squarish angles & closed counters (Orbitron).
- 4 Letter Layers:
  1. Outermost black #000000 stroke
  2. Bright neon inner rim stroke (#FF2E88 / #FFA14A / #00E5FF)
  3. Letter face in flat deep charcoal purple #241B33
  4. Diagonal white acrylic surface scratches/sheen on letter face
- Soft neon outer glow surrounding text, fading to 100% transparent.
- No drop shadow, no backing board, no bounding box, no extra decorations.
- ~40px transparent margin padding on all sides.
"""

import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Target dimensions
WIDTH = 1024
HEIGHT = 360

# 4x Supersampling for ultra-crisp vector rendering
SCALE = 4
SW = WIDTH * SCALE
SH = HEIGHT * SCALE

DESIGN_DIR = Path(__file__).resolve().parent
STATIC_DIR = DESIGN_DIR.parent / "static"
SPLASH_DIR = DESIGN_DIR / "source" / "splash"
FONT_PATH = STATIC_DIR / "fonts" / "Orbitron.ttf"

# Ensure output directory exists
SPLASH_DIR.mkdir(parents=True, exist_ok=True)

# Color tokens
FACE_COLOR = (36, 27, 51, 255) # #241B33 charcoal purple
BLACK_OUTLINE = (0, 0, 0, 255)

TITLES_SPEC = [
    {
        "filename": "title_neon_nights.png",
        "text": "NEON NIGHTS",
        "neon_rgb": (255, 46, 136), # Pink #FF2E88
    },
    {
        "filename": "title_sunset_hits.png",
        "text": "SUNSET HITS",
        "neon_rgb": (255, 161, 74), # Sunset Orange #FFA14A
    },
    {
        "filename": "title_ocean_drive.png",
        "text": "OCEAN DRIVE",
        "neon_rgb": (0, 229, 255), # Electric Cyan #00E5FF
    },
]


def load_title_font(target_w: int, target_h: int, text: str) -> ImageFont.FreeTypeFont:
    """Find the exact Orbitron font size that fits inside target_w x target_h at SCALE resolution."""
    if not FONT_PATH.exists():
        return ImageFont.load_default()
    
    probe_size = 200 * SCALE
    font = ImageFont.truetype(str(FONT_PATH), probe_size)
    try:
        font.set_variation_by_axes([900])
    except Exception:
        pass

    dummy = Image.new("L", (8, 8))
    bbox = ImageDraw.Draw(dummy).textbbox((0, 0), text, font=font)
    tw = max(1, bbox[2] - bbox[0])
    th = max(1, bbox[3] - bbox[1])

    scale_factor = min(target_w / tw, target_h / th)
    fit_size = int(probe_size * scale_factor)

    fit_font = ImageFont.truetype(str(FONT_PATH), fit_size)
    try:
        fit_font.set_variation_by_axes([900])
    except Exception:
        pass
    return fit_font


def build_splash_title(spec: dict):
    filename = spec["filename"]
    text = spec["text"]
    n_rgb = spec["neon_rgb"]
    neon_color = n_rgb + (255,)

    # Target usable region (leaving ~40px margin on 1024x360 canvas)
    target_w = (WIDTH - 80) * SCALE
    target_h = (HEIGHT - 80) * SCALE

    font = load_title_font(target_w, target_h, text)
    
    # Calculate exact text bounds and centered positioning
    dummy = Image.new("L", (8, 8))
    bbox = ImageDraw.Draw(dummy).textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    tx = (SW - tw) // 2 - bbox[0]
    ty = (SH - th) // 2 - bbox[1]

    # Canvas layers
    canvas = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))

    # -------------------------------------------------------------------
    # 1. Soft Outer Neon Glow Layer (Fading out to 100% transparent)
    # -------------------------------------------------------------------
    glow_layer = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow_layer)

    # Multi-pass radiant blur for a deep neon atmosphere
    glow_passes = [
        (56 * SCALE // 4, 0.45),
        (32 * SCALE // 4, 0.65),
        (16 * SCALE // 4, 0.85),
    ]

    for blur_radius, opacity in glow_passes:
        pass_img = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
        pdraw = ImageDraw.Draw(pass_img)
        glow_stroke = int(48 * SCALE // 4)
        pdraw.text((tx, ty), text, font=font, fill=n_rgb + (int(255 * opacity),),
                   stroke_width=glow_stroke, stroke_fill=n_rgb + (int(255 * opacity),))
        blurred = pass_img.filter(ImageFilter.GaussianBlur(blur_radius))
        glow_layer = Image.alpha_composite(glow_layer, blurred)

    canvas = Image.alpha_composite(canvas, glow_layer)

    # -------------------------------------------------------------------
    # 2. Outermost Black Outline Layer
    # -------------------------------------------------------------------
    black_layer = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(black_layer)
    black_stroke = int(32 * SCALE // 4)
    bdraw.text((tx, ty), text, font=font, fill=BLACK_OUTLINE,
               stroke_width=black_stroke, stroke_fill=BLACK_OUTLINE)

    canvas = Image.alpha_composite(canvas, black_layer)

    # -------------------------------------------------------------------
    # 3. Inner Neon Tube Rim Layer
    # -------------------------------------------------------------------
    neon_rim_layer = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    ndraw = ImageDraw.Draw(neon_rim_layer)
    rim_stroke = int(18 * SCALE // 4)
    ndraw.text((tx, ty), text, font=font, fill=neon_color,
               stroke_width=rim_stroke, stroke_fill=neon_color)

    canvas = Image.alpha_composite(canvas, neon_rim_layer)

    # -------------------------------------------------------------------
    # 4. Flat Deep Charcoal Purple Face (#241B33)
    # -------------------------------------------------------------------
    face_layer = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(face_layer)
    face_stroke = int(2 * SCALE // 4)
    fdraw.text((tx, ty), text, font=font, fill=FACE_COLOR,
               stroke_width=face_stroke, stroke_fill=FACE_COLOR)

    # -------------------------------------------------------------------
    # 5. Surface Acrylic Scratch / Sheen Lines (Masked to text face)
    # -------------------------------------------------------------------
    # Create mask of text face
    face_mask = Image.new("L", (SW, SH), 0)
    mdraw = ImageDraw.Draw(face_mask)
    mdraw.text((tx, ty), text, font=font, fill=255, stroke_width=0)

    # Diagonal white scratch lines overlay
    scratch_overlay = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(scratch_overlay)

    # Draw subtle diagonal parallel white lines angled across the letters
    line_spacing = int(120 * SCALE // 4)
    line_width = int(4 * SCALE // 4)
    angle_rad = math.radians(-35)

    for x_base in range(-SW, SW * 2, line_spacing):
        x0 = x_base
        y0 = 0
        x1 = x_base + int(SH * math.tan(math.radians(35)))
        y1 = SH
        
        # Subtle white acrylic scratch line
        sdraw.line([(x0, y0), (x1, y1)], fill=(255, 255, 255, 85), width=line_width)
        # Secondary finer scratch line
        sdraw.line([(x0 + 12 * SCALE // 4, y0), (x1 + 12 * SCALE // 4, y1)],
                   fill=(255, 255, 255, 45), width=int(2 * SCALE // 4))

    # Mask scratch lines to letter face only
    scratch_overlay.putalpha(face_mask)
    
    # Merge face and scratches
    face_composite = Image.alpha_composite(face_layer, scratch_overlay)
    canvas = Image.alpha_composite(canvas, face_composite)

    # Downsample from 4096x1440 to 1024x360 with LANCZOS for super anti-aliased finish
    final_img = canvas.resize((WIDTH, HEIGHT), Image.LANCZOS)
    
    output_path = SPLASH_DIR / filename
    final_img.save(output_path, "PNG")
    print(f"Generated {filename} (1024x360 PNG-32) -> {output_path}")


def main():
    print("Building Hot Miami Splash Titles...")
    for spec in TITLES_SPEC:
        build_splash_title(spec)
    print("All splash titles built successfully!")


if __name__ == "__main__":
    main()
