"""Slice 12 Spine Component Textures for Girl directly from Master Artwork tile_foreground.png with connected-component cleanup.

Outputs to design/source/spine/images_girl/:
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
  - earring.png (256x256)

Builds Spine 4.1 rig deliverables:
  - static/assets/spines/cast_girl/girl.json
  - static/assets/spines/cast_girl/cast_girl.atlas
  - static/assets/spines/cast_girl/cast_girl.png
  - design/source/spine/girl.spine
"""

import json
import math
import os
from pathlib import Path
from PIL import Image
import numpy as np
import scipy.ndimage

APP_ROOT = Path(__file__).resolve().parent.parent
TILE_SRC = APP_ROOT / "static/assets/sprites/hotMiamiBrand/tile_foreground.png"
OUT_IMG_DIR = APP_ROOT / "design/source/spine/images_girl"
SPINE_OUT_DIR = APP_ROOT / "static/assets/spines/cast_girl"
PROJECT_OUT_DIR = APP_ROOT / "design/source/spine"

OUT_IMG_DIR.mkdir(parents=True, exist_ok=True)
SPINE_OUT_DIR.mkdir(parents=True, exist_ok=True)
PROJECT_OUT_DIR.mkdir(parents=True, exist_ok=True)

CHROMA_GREEN = (0, 255, 0, 255)


def edge_at(y: int) -> int:
    if y < 475:
        return 528
    elif y < 528:
        return 513
    elif y < 835:
        return 515
    else:
        return 558


def clean_main_component(image: Image.Image) -> Image.Image:
    """Zero out any floating stray pixels outside the main figure."""
    arr = np.array(image.convert("RGBA"))
    alpha = arr[:, :, 3] > 10
    structure = np.ones((3, 3), dtype=int)
    labeled, num_features = scipy.ndimage.label(alpha, structure=structure)
    if num_features > 1:
        sizes = scipy.ndimage.sum(alpha, labeled, range(1, num_features + 1))
        main_label = np.argmax(sizes) + 1
        mask = (labeled == main_label)
        arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    return Image.fromarray(arr)


def slice_master_girl():
    """Extract and slice the woman (Girl) from tile_foreground.png into 12 Spine part PNGs."""
    tile = Image.open(TILE_SRC).convert("RGBA")
    w, h = tile.size

    girl_mask = Image.new("L", (w, h), 0)
    gpx = girl_mask.load()
    for y in range(h):
        edge = edge_at(y)
        for x in range(edge, w):
            gpx[x, y] = 255

    girl_raw = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    girl_raw.paste(tile, (0, 0), girl_mask)
    girl_img = clean_main_component(girl_raw)

    # 1. LEGS (512x512)
    legs_crop = girl_img.crop((510, 420, 740, 910))
    legs_crop = legs_crop.resize((250, 455), Image.BICUBIC)
    im_legs = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    im_legs.paste(legs_crop, (131, 35), legs_crop)

    # 2. TORSO (512x512)
    torso_crop = girl_img.crop((528, 260, 720, 470))
    torso_crop = torso_crop.resize((240, 280), Image.BICUBIC)
    im_torso = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    im_torso.paste(torso_crop, (136, 116), torso_crop)

    # 3. ARM_UPPER_L (256x256)
    arm_ul_crop = girl_img.crop((510, 280, 580, 420))
    arm_ul_crop = arm_ul_crop.resize((100, 160), Image.BICUBIC)
    im_arm_ul = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ul.paste(arm_ul_crop, (78, 48), arm_ul_crop)

    # 4. ARM_LOWER_L (256x256)
    arm_ll_crop = girl_img.crop((513, 380, 565, 520))
    arm_ll_crop = arm_ll_crop.resize((90, 150), Image.BICUBIC)
    im_arm_ll = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ll.paste(arm_ll_crop, (83, 53), arm_ll_crop)

    # 5. HAND_L (128x128)
    hand_l_crop = girl_img.crop((513, 490, 550, 560))
    hand_l_crop = hand_l_crop.resize((65, 80), Image.BICUBIC)
    im_hand_l = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hand_l.paste(hand_l_crop, (31, 24), hand_l_crop)

    # 6. ARM_UPPER_R (256x256)
    arm_ur_crop = girl_img.crop((670, 280, 740, 420))
    arm_ur_crop = arm_ur_crop.resize((100, 160), Image.BICUBIC)
    im_arm_ur = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ur.paste(arm_ur_crop, (78, 48), arm_ur_crop)

    # 7. ARM_LOWER_R (256x256)
    arm_lr_crop = girl_img.crop((650, 380, 735, 520))
    arm_lr_crop = arm_lr_crop.resize((110, 150), Image.BICUBIC)
    im_arm_lr = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_lr.paste(arm_lr_crop, (73, 53), arm_lr_crop)

    # 8. HAND_R (128x128)
    hand_r_crop = girl_img.crop((650, 480, 735, 560))
    hand_r_crop = hand_r_crop.resize((85, 80), Image.BICUBIC)
    im_hand_r = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hand_r.paste(hand_r_crop, (21, 24), hand_r_crop)

    # 9. HEAD (256x256)
    head_crop = girl_img.crop((570, 160, 680, 290))
    head_crop = head_crop.resize((150, 175), Image.BICUBIC)
    im_head = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_head.paste(head_crop, (53, 40), head_crop)

    # 10. HAIR (256x256)
    hair_crop = girl_img.crop((550, 130, 710, 280))
    hair_crop = hair_crop.resize((190, 170), Image.BICUBIC)
    im_hair = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_hair.paste(hair_crop, (33, 25), hair_crop)

    # 11. HAIR_TIP (128x128)
    tip_crop = girl_img.crop((550, 190, 595, 270))
    tip_crop = tip_crop.resize((65, 85), Image.BICUBIC)
    im_hair_tip = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hair_tip.paste(tip_crop, (31, 21), tip_crop)

    # 12. EARRING (256x256)
    earring_crop = girl_img.crop((645, 215, 675, 260))
    earring_crop = earring_crop.resize((60, 90), Image.BICUBIC)
    im_earring = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_earring.paste(earring_crop, (98, 83), earring_crop)

    parts_dict = {
        "legs.png": im_legs,
        "torso.png": im_torso,
        "arm_upper_l.png": im_arm_ul,
        "arm_lower_l.png": im_arm_ll,
        "hand_l.png": im_hand_l,
        "arm_upper_r.png": im_arm_ur,
        "arm_lower_r.png": im_arm_lr,
        "hand_r.png": im_hand_r,
        "head.png": im_head,
        "hair.png": im_hair,
        "hair_tip.png": im_hair_tip,
        "earring.png": im_earring,
    }

    for name, img in parts_dict.items():
        out_file = OUT_IMG_DIR / name
        img.save(out_file)
        print(f"Sliced Girl {name} -> {out_file}")

    return parts_dict


def build_girl_spine_assets():
    parts_list = [
        "legs", "torso", "arm_upper_l", "arm_lower_l", "hand_l",
        "arm_upper_r", "arm_lower_r", "hand_r", "head", "hair", "hair_tip", "earring"
    ]

    parts_imgs = {}
    for part in parts_list:
        p_path = OUT_IMG_DIR / f"{part}.png"
        parts_imgs[part] = Image.open(p_path).convert("RGBA")

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

    atlas_png_path = SPINE_OUT_DIR / "cast_girl.png"
    atlas_img.save(atlas_png_path)

    atlas_txt_path = SPINE_OUT_DIR / "cast_girl.atlas"
    with open(atlas_txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(atlas_lines) + "\n")

    bones = [
        {"name": "root"},
        {"name": "persp", "parent": "root"},
        {"name": "hips", "parent": "persp", "y": 950},
        {"name": "spine", "parent": "hips", "y": 150},
        {"name": "chest", "parent": "spine", "y": 220},
        {"name": "neck", "parent": "chest", "y": 220},
        {"name": "head", "parent": "neck", "x": 10, "y": 120},
        {"name": "hair", "parent": "head", "y": 120},
        {"name": "hair_tip", "parent": "hair", "x": 20, "y": 80},
        {"name": "earring", "parent": "head", "x": 30, "y": 40},
        {"name": "arm_upper_l", "parent": "chest", "x": -150, "y": 140},
        {"name": "arm_lower_l", "parent": "arm_upper_l", "x": -50, "y": -120},
        {"name": "hand_l", "parent": "arm_lower_l", "x": 40, "y": -110},
        {"name": "arm_upper_r", "parent": "chest", "x": 150, "y": 140},
        {"name": "arm_lower_r", "parent": "arm_upper_r", "x": 50, "y": -120},
        {"name": "hand_r", "parent": "arm_lower_r", "x": -40, "y": -110},
    ]

    slots = [
        {"name": "legs", "bone": "hips", "attachment": "legs"},
        {"name": "torso", "bone": "chest", "attachment": "torso"},
        {"name": "earring", "bone": "earring", "attachment": "earring"},
        {"name": "arm_upper_l", "bone": "arm_upper_l", "attachment": "arm_upper_l"},
        {"name": "arm_lower_l", "bone": "arm_lower_l", "attachment": "arm_lower_l"},
        {"name": "hand_l", "bone": "hand_l", "attachment": "hand_l"},
        {"name": "arm_upper_r", "bone": "arm_upper_r", "attachment": "arm_upper_r"},
        {"name": "arm_lower_r", "bone": "arm_lower_r", "attachment": "arm_lower_r"},
        {"name": "hand_r", "bone": "hand_r", "attachment": "hand_r"},
        {"name": "head", "bone": "head", "attachment": "head"},
        {"name": "hair", "bone": "hair", "attachment": "hair"},
        {"name": "hair_tip", "bone": "hair_tip", "attachment": "hair_tip"},
    ]

    skins = [
        {
            "name": "default",
            "attachments": {
                "legs": {"legs": {"x": 0, "y": -200, "width": 512, "height": 512}},
                "torso": {"torso": {"x": 0, "y": 0, "width": 512, "height": 512}},
                "earring": {"earring": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "arm_upper_l": {"arm_upper_l": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "arm_lower_l": {"arm_lower_l": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "hand_l": {"hand_l": {"x": 0, "y": 0, "width": 128, "height": 128}},
                "arm_upper_r": {"arm_upper_r": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "arm_lower_r": {"arm_lower_r": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "hand_r": {"hand_r": {"x": 0, "y": 0, "width": 128, "height": 128}},
                "head": {"head": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "hair": {"hair": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "hair_tip": {"hair_tip": {"x": 0, "y": 0, "width": 128, "height": 128}},
            }
        }
    ]

    BEZIER = [0.35, 0, 0.25, 1]

    def make_rot_keys(amp: float, phase_sec: float):
        keys = []
        steps = 16
        for step in range(steps + 1):
            t = (step / steps) * 5.0
            angle = amp * math.sin(2 * math.pi * ((t - phase_sec) / 5.0))
            k = {"time": round(t, 4), "value": round(angle, 2)}
            if step < steps:
                k["curve"] = BEZIER
            keys.append(k)
        return keys

    idle_bones = {
        "persp": {
            "scale": [
                {"time": 0.0, "x": 1.0, "y": 1.0, "curve": BEZIER},
                {"time": 1.25, "x": 1.0, "y": 1.03, "curve": BEZIER},
                {"time": 2.5, "x": 1.0, "y": 1.0, "curve": BEZIER},
                {"time": 3.75, "x": 1.0, "y": 1.03, "curve": BEZIER},
                {"time": 5.0, "x": 1.0, "y": 1.0}
            ]
        },
        "hips": {"rotate": make_rot_keys(1.2, 0.000)},
        "spine": {"rotate": make_rot_keys(1.5, 0.080)},
        "chest": {"rotate": make_rot_keys(2.2, 0.140)},
        "neck": {"rotate": make_rot_keys(2.8, 0.200)},
        "head": {"rotate": make_rot_keys(3.5, 0.280)},
        "hair": {"rotate": make_rot_keys(7.5, 0.320)},
        "hair_tip": {"rotate": make_rot_keys(16.0, 0.480)},
        "earring": {"rotate": make_rot_keys(12.0, 0.400)},
        "arm_upper_l": {"rotate": make_rot_keys(2.5, 0.160)},
        "arm_lower_l": {"rotate": make_rot_keys(5.0, 0.320)},
        "hand_l": {"rotate": make_rot_keys(10.0, 0.480)},
        "arm_upper_r": {"rotate": make_rot_keys(2.5, 2.660)},
        "arm_lower_r": {"rotate": make_rot_keys(5.0, 2.820)},
        "hand_r": {"rotate": make_rot_keys(10.0, 2.980)},
    }

    reaction_bones = {
        "hips": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": 4.0, "curve": BEZIER},
                {"time": 0.7, "value": 1.2, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        },
        "chest": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": -5.0, "curve": BEZIER},
                {"time": 0.7, "value": -1.5, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        },
        "head": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.35, "value": -8.0, "curve": BEZIER},
                {"time": 0.75, "value": -2.5, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        },
        "earring": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.35, "value": -18.0, "curve": BEZIER},
                {"time": 0.65, "value": 10.0, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        }
    }

    spine_data = {
        "skeleton": {
            "hash": "girl-cast-rig-v1",
            "spine": "4.1.20",
            "x": -256,
            "y": 0,
            "width": 512,
            "height": 2048,
            "images": "./images_girl/"
        },
        "bones": bones,
        "slots": slots,
        "skins": skins,
        "animations": {
            "idle": {"bones": idle_bones},
            "reaction": {"bones": reaction_bones}
        }
    }

    json_path = SPINE_OUT_DIR / "girl.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(spine_data, f, indent=2)

    project_path = PROJECT_OUT_DIR / "girl.spine"
    with open(project_path, "w", encoding="utf-8") as f:
        json.dump(spine_data, f, indent=2)

    print(f"Generated Girl Spine JSON -> {json_path}")
    print(f"Generated Girl Spine Atlas -> {atlas_png_path}")
    print(f"Generated Girl Spine Project -> {project_path}")


def main():
    print("=== Slicing & Rigging Girl Spine Asset ===")
    slice_master_girl()
    build_girl_spine_assets()
    print("All deliverables for Girl Spine Rig successfully generated!")


if __name__ == "__main__":
    main()
