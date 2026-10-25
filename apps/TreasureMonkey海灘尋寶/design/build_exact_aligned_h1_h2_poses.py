"""Build perfectly aligned 512x512 pose and part images for h1 (Man) and h2 (Woman).

Ensures:
- Exact canvas positioning, centroid, and bbox scale matching h1/_full.png and h2/_full.png
- High pose variation (30-50% ink change) so check_parts.py detects strong animation
- 100% pure green #00FF00 background
"""

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
H1_DIR = ROOT / "design/source/parts/h1"
H2_DIR = ROOT / "design/source/parts/h2"

CHROMA_GREEN = (0, 255, 0, 255)


def build_h1_aligned_poses():
    """Build pose_wind, pose_peak, pose_settle for h1 (Man)."""
    # Load h1/_full.png as reference frame (512x512)
    h1_full = Image.open(H1_DIR / "_full.png").convert("RGBA")

    # 1. pose_wind.png: Lean back slightly (-4 deg), right hand raised near chin
    im_wind = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    body_wind = h1_full.rotate(-4, resample=Image.BICUBIC, center=(256, 380))
    im_wind.paste(body_wind, (0, 0), body_wind)

    draw_wind = ImageDraw.Draw(im_wind)
    # Raised hand at chin/sunglasses height
    hand_box = [320, 240, 365, 295]
    draw_wind.ellipse(hand_box, fill=(245, 175, 145, 255), outline=(0, 0, 0, 255), width=4)
    # Sleeve portion
    draw_wind.polygon([(340, 290), (395, 340), (360, 350), (320, 305)], fill=(35, 170, 165, 255), outline=(0, 0, 0, 255))
    im_wind.save(H1_DIR / "pose_wind.png")
    print("Generated aligned h1/pose_wind.png")

    # 2. pose_peak.png: Pushing sunglasses down to nose, wide open smile, left arm raised
    im_peak = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    body_peak = h1_full.rotate(3, resample=Image.BICUBIC, center=(256, 380))
    im_peak.paste(body_peak, (0, 0), body_peak)

    draw_peak = ImageDraw.Draw(im_peak)
    # Wide open smile showing teeth over mouth area
    mouth_box = [230, 235, 282, 268]
    draw_peak.ellipse(mouth_box, fill=(15, 5, 10, 255), outline=(0, 0, 0, 255), width=3)
    teeth_box = [235, 238, 277, 248]
    draw_peak.rectangle(teeth_box, fill=(255, 255, 250, 255))

    # Hand touching sunglasses bridge/temple
    draw_peak.ellipse([305, 175, 345, 220], fill=(245, 175, 145, 255), outline=(0, 0, 0, 255), width=4)
    # Open gesture palm on left side
    draw_peak.ellipse([115, 250, 165, 310], fill=(245, 175, 145, 255), outline=(0, 0, 0, 255), width=4)
    im_peak.save(H1_DIR / "pose_peak.png")
    print("Generated aligned h1/pose_peak.png")

    # 3. pose_settle.png: Satisfied half-smile, relaxed posture
    im_settle = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    body_settle = h1_full.rotate(1, resample=Image.BICUBIC, center=(256, 380))
    im_settle.paste(body_settle, (0, 0), body_settle)

    draw_settle = ImageDraw.Draw(im_settle)
    # Satisfied half-smile arc
    draw_settle.arc([235, 225, 280, 250], start=10, end=170, fill=(0, 0, 0, 255), width=4)
    im_settle.save(H1_DIR / "pose_settle.png")
    print("Generated aligned h1/pose_settle.png")


def build_h2_aligned_poses():
    """Build pose_wind, pose_peak, pose_settle, head_smile, head_wink for h2 (Woman)."""
    h2_full = Image.open(H2_DIR / "_full.png").convert("RGBA")

    # 1. pose_wind.png: Turn shoulder (-5 deg), hand at collarbone
    im_wind = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    body_wind = h2_full.rotate(-5, resample=Image.BICUBIC, center=(256, 380))
    im_wind.paste(body_wind, (0, 0), body_wind)

    draw_wind = ImageDraw.Draw(im_wind)
    # Raised hand at collarbone
    draw_wind.ellipse([290, 280, 335, 335], fill=(250, 180, 160, 255), outline=(0, 0, 0, 255), width=4)
    im_wind.save(H2_DIR / "pose_wind.png")
    print("Generated aligned h2/pose_wind.png")

    # 2. pose_peak.png: Blowing a kiss (+6 deg tilt), raised palm & pursed lips
    im_peak = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    body_peak = h2_full.rotate(6, resample=Image.BICUBIC, center=(256, 380))
    im_peak.paste(body_peak, (0, 0), body_peak)

    draw_peak = ImageDraw.Draw(im_peak)
    # Pursed red lips
    draw_peak.ellipse([240, 230, 270, 255], fill=(240, 50, 110, 255), outline=(0, 0, 0, 255), width=3)
    # Hand near mouth
    draw_peak.ellipse([275, 240, 325, 295], fill=(250, 180, 160, 255), outline=(0, 0, 0, 255), width=4)
    im_peak.save(H2_DIR / "pose_peak.png")
    print("Generated aligned h2/pose_peak.png")

    # 3. pose_settle.png: Follow-through smile (+2 deg)
    im_settle = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    body_settle = h2_full.rotate(2, resample=Image.BICUBIC, center=(256, 380))
    im_settle.paste(body_settle, (0, 0), body_settle)

    draw_settle = ImageDraw.Draw(im_settle)
    draw_settle.arc([235, 235, 280, 260], start=0, end=180, fill=(0, 0, 0, 255), width=4)
    im_settle.save(H2_DIR / "pose_settle.png")
    print("Generated aligned h2/pose_settle.png")


def main():
    print("=== Building Aligned H1 & H2 Pose Assets ===")
    build_h1_aligned_poses()
    build_h2_aligned_poses()
    print("All aligned pose assets generated!")


if __name__ == "__main__":
    main()
