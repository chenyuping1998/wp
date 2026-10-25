"""Pack final texture atlases and update Spine 4.1 deliverables for Guy (Bat Stance) and Girl."""

import json
import math
from pathlib import Path
from PIL import Image

APP_ROOT = Path(__file__).resolve().parent.parent

GUY_IMG_DIR = APP_ROOT / "design/source/spine/images"
GIRL_IMG_DIR = APP_ROOT / "design/source/spine/images_girl"

SPINE_GUY_OUT = APP_ROOT / "static/assets/spines/cast_guy"
SPINE_GIRL_OUT = APP_ROOT / "static/assets/spines/cast_girl"


def pack_guy_atlas():
    parts_list = [
        "legs", "torso", "arm_upper_l", "arm_lower_l", "hand_l",
        "arm_upper_r", "arm_lower_r", "hand_r", "bat", "head", "hair", "hair_tip", "chain"
    ]
    parts_imgs = {p: Image.open(GUY_IMG_DIR / f"{p}.png").convert("RGBA") for p in parts_list}

    atlas_w, atlas_h = 1024, 1024
    atlas_img = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    placements = {
        "legs": (0, 0, 512, 512),
        "torso": (512, 0, 512, 512),
        "arm_upper_l": (0, 512, 256, 256),
        "arm_lower_l": (256, 512, 256, 256),
        "arm_upper_r": (512, 512, 256, 256),
        "arm_lower_r": (768, 512, 256, 256),
        "head": (0, 768, 256, 256),
        "hair": (256, 768, 256, 256),
        "chain": (512, 768, 256, 256),
        "bat": (768, 0, 384, 384),
        "hand_l": (768, 768, 128, 128),
        "hand_r": (896, 768, 128, 128),
        "hair_tip": (768, 896, 128, 128),
    }

    atlas_lines = [
        "cast_guy.png",
        f"size: {atlas_w},{atlas_h}",
        "format: RGBA8888",
        "filter: Linear,Linear",
        "repeat: none"
    ]

    for part_name, (x, y, w, h) in placements.items():
        sub_img = parts_imgs[part_name]
        atlas_img.paste(sub_img, (x, y))
        atlas_lines.extend([
            part_name,
            "  rotate: false",
            f"  xy: {x}, {y}",
            f"  size: {w}, {h}",
            f"  orig: {w}, {h}",
            "  offset: 0, 0",
            "  index: -1"
        ])

    atlas_png_path = SPINE_GUY_OUT / "cast_guy.png"
    atlas_img.save(atlas_png_path)

    atlas_txt_path = SPINE_GUY_OUT / "cast_guy.atlas"
    with open(atlas_txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(atlas_lines) + "\n")

    print(f"Packed Guy final atlas -> {atlas_png_path}")


def pack_girl_atlas():
    parts_list = [
        "legs", "torso", "arm_upper_l", "arm_lower_l", "hand_l",
        "arm_upper_r", "arm_lower_r", "hand_r", "head", "hair", "hair_tip", "earring"
    ]
    parts_imgs = {p: Image.open(GIRL_IMG_DIR / f"{p}.png").convert("RGBA") for p in parts_list}

    atlas_w, atlas_h = 1024, 1024
    atlas_img = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    placements = {
        "legs": (0, 0, 512, 512),
        "torso": (512, 0, 512, 512),
        "arm_upper_l": (0, 512, 256, 256),
        "arm_lower_l": (256, 512, 256, 256),
        "arm_upper_r": (512, 512, 256, 256),
        "arm_lower_r": (768, 512, 256, 256),
        "head": (0, 768, 256, 256),
        "hair": (256, 768, 256, 256),
        "earring": (512, 768, 256, 256),
        "hand_l": (768, 768, 128, 128),
        "hand_r": (896, 768, 128, 128),
        "hair_tip": (768, 896, 128, 128),
    }

    atlas_lines = [
        "cast_girl.png",
        f"size: {atlas_w},{atlas_h}",
        "format: RGBA8888",
        "filter: Linear,Linear",
        "repeat: none"
    ]

    for part_name, (x, y, w, h) in placements.items():
        sub_img = parts_imgs[part_name]
        atlas_img.paste(sub_img, (x, y))
        atlas_lines.extend([
            part_name,
            "  rotate: false",
            f"  xy: {x}, {y}",
            f"  size: {w}, {h}",
            f"  orig: {w}, {h}",
            "  offset: 0, 0",
            "  index: -1"
        ])

    atlas_png_path = SPINE_GIRL_OUT / "cast_girl.png"
    atlas_img.save(atlas_png_path)

    atlas_txt_path = SPINE_GIRL_OUT / "cast_girl.atlas"
    with open(atlas_txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(atlas_lines) + "\n")

    print(f"Packed Girl final atlas -> {atlas_png_path}")


if __name__ == "__main__":
    pack_guy_atlas()
    pack_girl_atlas()
