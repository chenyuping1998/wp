"""Slice 13 Spine Component Textures for Guy (baseball bat shoulder pose) and 12 for Girl directly from reference images.

Outputs:
- design/source/spine/images/ (13 Guy component PNGs)
- design/source/spine/images_girl/ (12 Girl component PNGs)
- static/assets/spines/cast_guy/ (guy.json, cast_guy.atlas, cast_guy.png)
- static/assets/spines/cast_guy/guy.spine
- static/assets/spines/cast_girl/ (girl.json, cast_girl.atlas, cast_girl.png)
- static/assets/spines/cast_girl/girl.spine
"""

import json
import math
import os
from pathlib import Path
from PIL import Image, ImageDraw

APP_ROOT = Path(__file__).resolve().parent.parent
GUY_BAT_SRC = APP_ROOT / "design/source/spine/guy_reference_bat.png"
GIRL_SRC = APP_ROOT / "static/assets/sprites/hotMiamiCast/girl.png"

GUY_IMG_DIR = APP_ROOT / "design/source/spine/images"
GIRL_IMG_DIR = APP_ROOT / "design/source/spine/images_girl"

SPINE_GUY_OUT = APP_ROOT / "static/assets/spines/cast_guy"
SPINE_GIRL_OUT = APP_ROOT / "static/assets/spines/cast_girl"
PROJECT_OUT_DIR = APP_ROOT / "design/source/spine"

GUY_IMG_DIR.mkdir(parents=True, exist_ok=True)
GIRL_IMG_DIR.mkdir(parents=True, exist_ok=True)
SPINE_GUY_OUT.mkdir(parents=True, exist_ok=True)
SPINE_GIRL_OUT.mkdir(parents=True, exist_ok=True)
PROJECT_OUT_DIR.mkdir(parents=True, exist_ok=True)

CHROMA_GREEN = (0, 255, 0, 255)


# ─── 1. SLICE GUY (13 PARTS) ───────────────────────────────────────────
def slice_guy_bat():
    guy = Image.open(GUY_BAT_SRC).convert("RGBA")
    w, h = guy.size # 512x512

    # 1. LEGS (512x512) - Waistband down to loafers + 15px overlap
    legs_crop = guy.crop((180, 235, 345, 512))
    legs_crop = legs_crop.resize((260, 435), Image.BICUBIC)
    im_legs = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    im_legs.paste(legs_crop, (126, 55), legs_crop)

    # 2. TORSO (512x512) - Hawaiian shirt over white t-shirt + 15px overlap
    torso_crop = guy.crop((165, 90, 340, 270))
    torso_crop = torso_crop.resize((270, 280), Image.BICUBIC)
    im_torso = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    im_torso.paste(torso_crop, (121, 110), torso_crop)

    # 3. ARM_UPPER_L (256x256) - Left upper arm (hanging down)
    arm_ul_crop = guy.crop((160, 105, 230, 230))
    arm_ul_crop = arm_ul_crop.resize((120, 180), Image.BICUBIC)
    im_arm_ul = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ul.paste(arm_ul_crop, (68, 38), arm_ul_crop)

    # 4. ARM_LOWER_L (256x256) - Left forearm (hanging down to pocket)
    arm_ll_crop = guy.crop((165, 200, 235, 300))
    arm_ll_crop = arm_ll_crop.resize((100, 160), Image.BICUBIC)
    im_arm_ll = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ll.paste(arm_ll_crop, (78, 48), arm_ll_crop)

    # 5. HAND_L (128x128) - Left hand tucked into pocket
    hand_l_crop = guy.crop((185, 260, 235, 320))
    hand_l_crop = hand_l_crop.resize((70, 85), Image.BICUBIC)
    im_hand_l = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hand_l.paste(hand_l_crop, (29, 21), hand_l_crop)

    # 6. ARM_UPPER_R (256x256) - Right upper arm (RAISED shoulder stance)
    arm_ur_crop = guy.crop((280, 100, 360, 210))
    arm_ur_crop = arm_ur_crop.resize((130, 170), Image.BICUBIC)
    im_arm_ur = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ur.paste(arm_ur_crop, (63, 43), arm_ur_crop)

    # 7. ARM_LOWER_R (256x256) - Right forearm (RAISED elbow to bat handle)
    arm_lr_crop = guy.crop((300, 100, 375, 190))
    arm_lr_crop = arm_lr_crop.resize((120, 150), Image.BICUBIC)
    im_arm_lr = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_lr.paste(arm_lr_crop, (68, 53), arm_lr_crop)

    # 8. HAND_R (128x128) - Right hand fist gripping bat handle
    hand_r_crop = guy.crop((325, 110, 380, 160))
    hand_r_crop = hand_r_crop.resize((75, 80), Image.BICUBIC)
    im_hand_r = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hand_r.paste(hand_r_crop, (26, 24), hand_r_crop)

    # 9. BAT (384x384) - Wooden baseball bat isolated across shoulder
    bat_crop = guy.crop((170, 30, 380, 150))
    bat_crop = bat_crop.resize((320, 180), Image.BICUBIC)
    im_bat = Image.new("RGBA", (384, 384), CHROMA_GREEN)
    im_bat.paste(bat_crop, (32, 102), bat_crop)

    # 10. HEAD (256x256) - Face & neck, sunglasses on hair
    head_crop = guy.crop((190, 15, 310, 140))
    head_crop = head_crop.resize((160, 175), Image.BICUBIC)
    im_head = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_head.paste(head_crop, (48, 40), head_crop)

    # 11. HAIR (256x256) - Dark brown wavy hair mass
    hair_crop = guy.crop((185, 10, 315, 115))
    hair_crop = hair_crop.resize((170, 140), Image.BICUBIC)
    im_hair = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_hair.paste(hair_crop, (43, 38), hair_crop)

    # 12. HAIR_TIP (128x128) - Single loose front strand over forehead
    tip_crop = guy.crop((200, 20, 240, 70))
    tip_crop = tip_crop.resize((65, 80), Image.BICUBIC)
    im_hair_tip = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hair_tip.paste(tip_crop, (31, 24), tip_crop)

    # 13. CHAIN (256x256) - Gold chain necklace
    chain_crop = guy.crop((220, 100, 290, 150))
    chain_crop = chain_crop.resize((120, 95), Image.BICUBIC)
    im_chain = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_chain.paste(chain_crop, (68, 80), chain_crop)

    guy_dict = {
        "legs.png": im_legs,
        "torso.png": im_torso,
        "arm_upper_l.png": im_arm_ul,
        "arm_lower_l.png": im_arm_ll,
        "hand_l.png": im_hand_l,
        "arm_upper_r.png": im_arm_ur,
        "arm_lower_r.png": im_arm_lr,
        "hand_r.png": im_hand_r,
        "bat.png": im_bat,
        "head.png": im_head,
        "hair.png": im_hair,
        "hair_tip.png": im_hair_tip,
        "chain.png": im_chain,
    }

    for name, img in guy_dict.items():
        out_file = GUY_IMG_DIR / name
        img.save(out_file)
        print(f"Sliced Guy Bat Component {name} -> {out_file}")


# ─── 2. SLICE GIRL (12 PARTS) ───────────────────────────────────────────
def slice_girl():
    girl = Image.open(GIRL_SRC).convert("RGBA")
    w, h = girl.size # 229x775

    # 1. LEGS (512x512)
    legs_crop = girl.crop((0, int(h * 0.38), w, int(h * 0.96)))
    legs_crop = legs_crop.resize((245, 455), Image.BICUBIC)
    im_legs = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    im_legs.paste(legs_crop, (133, 35), legs_crop)

    # 2. TORSO (512x512)
    torso_crop = girl.crop((10, int(h * 0.16), w - 10, int(h * 0.44)))
    torso_crop = torso_crop.resize((240, 280), Image.BICUBIC)
    im_torso = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    im_torso.paste(torso_crop, (136, 116), torso_crop)

    # 3. ARM_UPPER_L (256x256)
    arm_ul_crop = girl.crop((0, int(h * 0.18), int(w * 0.45), int(h * 0.35)))
    arm_ul_crop = arm_ul_crop.resize((100, 160), Image.BICUBIC)
    im_arm_ul = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ul.paste(arm_ul_crop, (78, 48), arm_ul_crop)

    # 4. ARM_LOWER_L (256x256)
    arm_ll_crop = girl.crop((0, int(h * 0.32), int(w * 0.42), int(h * 0.48)))
    arm_ll_crop = arm_ll_crop.resize((90, 150), Image.BICUBIC)
    im_arm_ll = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ll.paste(arm_ll_crop, (83, 53), arm_ll_crop)

    # 5. HAND_L (128x128)
    hand_l_crop = girl.crop((0, int(h * 0.45), int(w * 0.35), int(h * 0.55)))
    hand_l_crop = hand_l_crop.resize((65, 80), Image.BICUBIC)
    im_hand_l = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hand_l.paste(hand_l_crop, (31, 24), hand_l_crop)

    # 6. ARM_UPPER_R (256x256)
    arm_ur_crop = girl.crop((int(w * 0.55), int(h * 0.18), w, int(h * 0.35)))
    arm_ur_crop = arm_ur_crop.resize((100, 160), Image.BICUBIC)
    im_arm_ur = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ur.paste(arm_ur_crop, (78, 48), arm_ur_crop)

    # 7. ARM_LOWER_R (256x256)
    arm_lr_crop = girl.crop((int(w * 0.58), int(h * 0.32), w, int(h * 0.48)))
    arm_lr_crop = arm_lr_crop.resize((110, 150), Image.BICUBIC)
    im_arm_lr = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_lr.paste(arm_lr_crop, (73, 53), arm_lr_crop)

    # 8. HAND_R (128x128)
    hand_r_crop = girl.crop((int(w * 0.60), int(h * 0.45), w, int(h * 0.55)))
    hand_r_crop = hand_r_crop.resize((85, 80), Image.BICUBIC)
    im_hand_r = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hand_r.paste(hand_r_crop, (21, 24), hand_r_crop)

    # 9. HEAD (256x256)
    head_crop = girl.crop((int(w * 0.22), int(h * 0.04), int(w * 0.78), int(h * 0.20)))
    head_crop = head_crop.resize((150, 175), Image.BICUBIC)
    im_head = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_head.paste(head_crop, (53, 40), head_crop)

    # 10. HAIR (256x256)
    hair_crop = girl.crop((0, 0, w, int(h * 0.22)))
    hair_crop = hair_crop.resize((190, 170), Image.BICUBIC)
    im_hair = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_hair.paste(hair_crop, (33, 25), hair_crop)

    # 11. HAIR_TIP (128x128)
    tip_crop = girl.crop((0, int(h * 0.08), int(w * 0.35), int(h * 0.22)))
    tip_crop = tip_crop.resize((65, 85), Image.BICUBIC)
    im_hair_tip = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hair_tip.paste(tip_crop, (31, 21), tip_crop)

    # 12. EARRING (256x256)
    earring_crop = girl.crop((int(w * 0.65), int(h * 0.10), int(w * 0.85), int(h * 0.18)))
    earring_crop = earring_crop.resize((60, 90), Image.BICUBIC)
    im_earring = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_earring.paste(earring_crop, (98, 83), earring_crop)

    girl_dict = {
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

    for name, img in girl_dict.items():
        out_file = GIRL_IMG_DIR / name
        img.save(out_file)
        print(f"Sliced Girl Component {name} -> {out_file}")


# ─── 3. BUILD SPINE DELIVERABLES FOR GUY (13 PARTS) ──────────────────────
def build_guy_spine_deliverables():
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

    # Spine 4.1 JSON Structure for Guy with Bat
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
        {"name": "chain", "parent": "chest", "y": -40},
        {"name": "arm_upper_l", "parent": "chest", "x": -150, "y": 140},
        {"name": "arm_lower_l", "parent": "arm_upper_l", "x": -50, "y": -120},
        {"name": "hand_l", "parent": "arm_lower_l", "x": 40, "y": -110},
        {"name": "arm_upper_r", "parent": "chest", "x": 150, "y": 140, "rotation": 65.0},
        {"name": "arm_lower_r", "parent": "arm_upper_r", "x": 80, "y": 60, "rotation": -40.0},
        {"name": "hand_r", "parent": "arm_lower_r", "x": 60, "y": 80},
        {"name": "bat", "parent": "hand_r", "x": -40, "y": 120, "rotation": -25.0},
    ]

    slots = [
        {"name": "legs", "bone": "hips", "attachment": "legs"},
        {"name": "torso", "bone": "chest", "attachment": "torso"},
        {"name": "chain", "bone": "chain", "attachment": "chain"},
        {"name": "arm_upper_l", "bone": "arm_upper_l", "attachment": "arm_upper_l"},
        {"name": "arm_lower_l", "bone": "arm_lower_l", "attachment": "arm_lower_l"},
        {"name": "hand_l", "bone": "hand_l", "attachment": "hand_l"},
        {"name": "arm_upper_r", "bone": "arm_upper_r", "attachment": "arm_upper_r"},
        {"name": "arm_lower_r", "bone": "arm_lower_r", "attachment": "arm_lower_r"},
        {"name": "hand_r", "bone": "hand_r", "attachment": "hand_r"},
        {"name": "bat", "bone": "bat", "attachment": "bat"},
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
                "chain": {"chain": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "arm_upper_l": {"arm_upper_l": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "arm_lower_l": {"arm_lower_l": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "hand_l": {"hand_l": {"x": 0, "y": 0, "width": 128, "height": 128}},
                "arm_upper_r": {"arm_upper_r": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "arm_lower_r": {"arm_lower_r": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "hand_r": {"hand_r": {"x": 0, "y": 0, "width": 128, "height": 128}},
                "bat": {"bat": {"x": 0, "y": 0, "width": 384, "height": 384}},
                "head": {"head": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "hair": {"hair": {"x": 0, "y": 0, "width": 256, "height": 256}},
                "hair_tip": {"hair_tip": {"x": 0, "y": 0, "width": 128, "height": 128}},
            }
        }
    ]

    BEZIER = [0.35, 0, 0.25, 1]

    def make_rot_keys(amp: float, phase_sec: float, base_angle: float = 0.0):
        keys = []
        steps = 16
        for step in range(steps + 1):
            t = (step / steps) * 6.5
            angle = base_angle + amp * math.sin(2 * math.pi * ((t - phase_sec) / 6.5))
            k = {"time": round(t, 4), "value": round(angle, 2)}
            if step < steps:
                k["curve"] = BEZIER
            keys.append(k)
        return keys

    idle_bones = {
        "persp": {
            "scale": [
                {"time": 0.0, "x": 1.0, "y": 1.0, "curve": BEZIER},
                {"time": 1.625, "x": 1.0, "y": 1.03, "curve": BEZIER},
                {"time": 3.25, "x": 1.0, "y": 1.0, "curve": BEZIER},
                {"time": 4.875, "x": 1.0, "y": 1.03, "curve": BEZIER},
                {"time": 6.5, "x": 1.0, "y": 1.0}
            ]
        },
        "hips": {"rotate": make_rot_keys(1.5, 0.000)},
        "spine": {"rotate": make_rot_keys(2.0, 0.100)},
        "chest": {"rotate": make_rot_keys(2.8, 0.200)},
        "neck": {"rotate": make_rot_keys(3.2, 0.280)},
        "head": {"rotate": make_rot_keys(4.0, 0.360)},
        "hair": {"rotate": make_rot_keys(8.0, 0.440)},
        "hair_tip": {"rotate": make_rot_keys(18.0, 0.600)},
        "chain": {"rotate": make_rot_keys(6.0, 0.300)},
        "arm_upper_l": {"rotate": make_rot_keys(3.0, 0.200)},
        "arm_lower_l": {"rotate": make_rot_keys(6.0, 0.400)},
        "hand_l": {"rotate": make_rot_keys(12.0, 0.600)},
        "arm_upper_r": {"rotate": make_rot_keys(4.0, 0.250, base_angle=65.0)},
        "arm_lower_r": {"rotate": make_rot_keys(7.0, 0.450, base_angle=-40.0)},
        "hand_r": {"rotate": make_rot_keys(12.0, 0.650)},
        "bat": {"rotate": make_rot_keys(15.0, 0.750, base_angle=-25.0)},
    }

    reaction_bones = {
        "hips": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": 5.0, "curve": BEZIER},
                {"time": 0.7, "value": 1.5, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        },
        "chest": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": -6.0, "curve": BEZIER},
                {"time": 0.7, "value": -2.0, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        },
        "bat": {
            "rotate": [
                {"time": 0.0, "value": -25.0, "curve": BEZIER},
                {"time": 0.3, "value": -45.0, "curve": BEZIER},
                {"time": 0.7, "value": -15.0, "curve": BEZIER},
                {"time": 1.0, "value": -25.0}
            ]
        }
    }

    spine_data = {
        "skeleton": {
            "hash": "guy-bat-rig-v1",
            "spine": "4.1.20",
            "x": -256,
            "y": 0,
            "width": 512,
            "height": 2048,
            "images": "./images/"
        },
        "bones": bones,
        "slots": slots,
        "skins": skins,
        "animations": {
            "idle": {"bones": idle_bones},
            "reaction": {"bones": reaction_bones}
        }
    }

    json_path = SPINE_GUY_OUT / "guy.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(spine_data, f, indent=2)

    project_path = PROJECT_OUT_DIR / "guy.spine"
    with open(project_path, "w", encoding="utf-8") as f:
        json.dump(spine_data, f, indent=2)

    print(f"Generated Guy Bat Spine JSON -> {json_path}")
    print(f"Generated Guy Bat Spine Atlas -> {atlas_png_path}")
    print(f"Generated Guy Bat Spine Project -> {project_path}")


# ─── 4. BUILD SPINE DELIVERABLES FOR GIRL (12 PARTS) ─────────────────────
def build_girl_spine_deliverables():
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
            "idle": {"bones": idle_bones}
        }
    }

    json_path = SPINE_GIRL_OUT / "girl.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(spine_data, f, indent=2)

    project_path = PROJECT_OUT_DIR / "girl.spine"
    with open(project_path, "w", encoding="utf-8") as f:
        json.dump(spine_data, f, indent=2)

    print(f"Generated Girl Spine JSON -> {json_path}")
    print(f"Generated Girl Spine Atlas -> {atlas_png_path}")
    print(f"Generated Girl Spine Project -> {project_path}")


def main():
    print("=== Building Spine 4.1 Assets for Guy (Bat Pose) and Girl ===")
    slice_guy_bat()
    slice_girl()
    build_guy_spine_deliverables()
    build_girl_spine_deliverables()
    print("All Spine deliverables generated successfully!")


if __name__ == "__main__":
    main()
