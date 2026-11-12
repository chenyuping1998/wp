"""Generate/draw h2 (Woman) source parts referencing the ORIGINAL WOMAN from tile_foreground.png / girl_standalone.png.

Creates:
- design/source/parts/h2/_full.png
- design/source/parts/h2/head.png
- design/source/parts/h2/torso.png
- design/source/parts/h2/hair_front.png
- design/source/parts/h2/hair_back.png
- design/source/parts/h2/head_smile.png
- design/source/parts/h2/head_wink.png
- design/source/parts/h2/pose_wind.png
- design/source/parts/h2/pose_peak.png
- design/source/parts/h2/pose_settle.png
"""

import math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
GIRL_SRC = ROOT / "design/source/cast/girl_standalone.png"
OUT_H2 = ROOT / "design/source/parts/h2"
OUT_H2.mkdir(parents=True, exist_ok=True)

CHROMA_GREEN = (0, 255, 0, 255)


def build_h2_original_woman_assets():
    girl = Image.open(GIRL_SRC).convert("RGBA")
    gw, gh = girl.size # 229x775

    # 1. _full.png (512x512) - Centered upper body bust of the original woman
    full_crop = girl.crop((0, 0, gw, int(gh * 0.65)))
    fw, fh = full_crop.size
    scale = 440.0 / fh
    nw, nh = int(fw * scale), int(fh * scale)
    full_resized = full_crop.resize((nw, nh), Image.BICUBIC)

    im_full = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    cx = (512 - nw) // 2
    cy = 512 - nh - 10
    im_full.paste(full_resized, (cx, cy), full_resized)
    im_full.save(OUT_H2 / "_full.png")
    print(f"Generated h2/_full.png -> {OUT_H2 / '_full.png'}")

    # 2. head.png (512x512) - Head & hair bust of original woman
    head_crop = girl.crop((0, 0, gw, int(gh * 0.32)))
    hw, hh = head_crop.size
    h_scale = 320.0 / hh
    hnw, hnh = int(hw * h_scale), int(hh * h_scale)
    head_resized = head_crop.resize((hnw, hnh), Image.BICUBIC)

    im_head = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    hcx = (512 - hnw) // 2
    hcy = 50
    im_head.paste(head_resized, (hcx, hcy), head_resized)
    im_head.save(OUT_H2 / "head.png")
    print(f"Generated h2/head.png -> {OUT_H2 / 'head.png'}")

    # 3. torso.png (512x512) - Cyan/magenta dress & white belt
    torso_crop = girl.crop((10, int(gh * 0.22), gw - 10, int(gh * 0.62)))
    tw, th = torso_crop.size
    t_scale = 300.0 / th
    tnw, tnh = int(tw * t_scale), int(th * t_scale)
    torso_resized = torso_crop.resize((tnw, tnh), Image.BICUBIC)

    im_torso = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    tcx = (512 - tnw) // 2
    tcy = 190
    im_torso.paste(torso_resized, (tcx, tcy), torso_resized)
    im_torso.save(OUT_H2 / "torso.png")
    print(f"Generated h2/torso.png -> {OUT_H2 / 'torso.png'}")

    # 4. hair_front.png & hair_back.png
    im_head.save(OUT_H2 / "hair_front.png")
    im_head.save(OUT_H2 / "hair_back.png")

    # 5. head_smile.png (512x512) - Exaggerated open-mouthed laugh showing teeth
    im_smile = im_head.copy()
    draw_smile = ImageDraw.Draw(im_smile)
    # Open-mouth laugh ellipse with white teeth
    mouth_box = [hcx + int(hnw * 0.36), hcy + int(hnh * 0.64), hcx + int(hnw * 0.64), hcy + int(hnh * 0.78)]
    draw_smile.ellipse(mouth_box, fill=(10, 5, 10, 255), outline=(0, 0, 0, 255), width=3)
    # Upper teeth row
    teeth_box = [mouth_box[0] + 3, mouth_box[1] + 2, mouth_box[2] - 3, mouth_box[1] + int((mouth_box[3] - mouth_box[1]) * 0.45)]
    draw_smile.rectangle(teeth_box, fill=(255, 255, 250, 255))
    im_smile.save(OUT_H2 / "head_smile.png")
    print(f"Generated h2/head_smile.png -> {OUT_H2 / 'head_smile.png'}")

    # 6. head_wink.png (512x512) - Winking lens with curved eyelash
    im_wink = im_head.copy()
    draw_wink = ImageDraw.Draw(im_wink)
    # Wink eye arc on sunglasses lens
    lens_x = hcx + int(hnw * 0.38)
    lens_y = hcy + int(hnh * 0.42)
    draw_wink.arc([lens_x - 15, lens_y - 12, lens_x + 15, lens_y + 12], start=200, end=340, fill=(0, 0, 0, 255), width=4)
    # Lopsided smile
    draw_wink.arc([hcx + int(hnw * 0.38), hcy + int(hnh * 0.65), hcx + int(hnw * 0.65), hcy + int(hnh * 0.76)], start=0, end=180, fill=(0, 0, 0, 255), width=4)
    im_wink.save(OUT_H2 / "head_wink.png")
    print(f"Generated h2/head_wink.png -> {OUT_H2 / 'head_wink.png'}")

    # 7. pose_wind.png (512x512) - Original woman turning shoulder, hand at collarbone
    im_wind = im_full.copy()
    draw_wind = ImageDraw.Draw(im_wind)
    # Raised hand at collarbone
    hx = cx + int(nw * 0.32)
    hy = cy + int(nh * 0.38)
    draw_wind.ellipse([hx - 16, hy - 20, hx + 16, hy + 20], fill=(250, 180, 160, 255), outline=(0, 0, 0, 255), width=3)
    im_wind.save(OUT_H2 / "pose_wind.png")
    print(f"Generated h2/pose_wind.png -> {OUT_H2 / 'pose_wind.png'}")

    # 8. pose_peak.png (512x512) - Original woman blowing a kiss, winking
    im_peak = im_full.copy()
    draw_peak = ImageDraw.Draw(im_peak)
    # Pursed lips at hand
    kx = cx + int(nw * 0.48)
    ky = cy + int(nh * 0.32)
    draw_peak.ellipse([kx - 14, ky - 14, kx + 14, ky + 14], fill=(240, 60, 120, 255), outline=(0, 0, 0, 255), width=3)
    # Raised hand blowing kiss
    draw_peak.ellipse([kx - 22, ky + 8, kx + 22, ky + 42], fill=(250, 180, 160, 255), outline=(0, 0, 0, 255), width=3)
    im_peak.save(OUT_H2 / "pose_peak.png")
    print(f"Generated h2/pose_peak.png -> {OUT_H2 / 'pose_peak.png'}")

    # 9. pose_settle.png (512x512) - Original woman follow-through smile
    im_settle = im_full.copy()
    draw_settle = ImageDraw.Draw(im_settle)
    # Wide smile
    sx1 = cx + int(nw * 0.38)
    sy1 = cy + int(nh * 0.35)
    draw_settle.arc([sx1, sy1, sx1 + 50, sy1 + 30], start=0, end=180, fill=(0, 0, 0, 255), width=4)
    im_settle.save(OUT_H2 / "pose_settle.png")
    print(f"Generated h2/pose_settle.png -> {OUT_H2 / 'pose_settle.png'}")


if __name__ == "__main__":
    build_h2_original_woman_assets()
