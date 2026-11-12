"""Build Spine 4.1 Rigged Asset for Hot Miami Side Character (Guy).

Generates:
  - static/assets/spines/cast_guy/guy.json
  - static/assets/spines/cast_guy/cast_guy.atlas
  - static/assets/spines/cast_guy/cast_guy.png
  - design/source/spine/guy.spine

Packs 12 parts from design/source/spine/images/:
  legs.png (512x512)
  torso.png (512x512)
  arm_upper_l.png (256x256)
  arm_lower_l.png (256x256)
  hand_l.png (128x128)
  arm_upper_r.png (256x256)
  arm_lower_r.png (256x256)
  hand_r.png (128x128)
  head.png (256x256)
  hair.png (256x256)
  hair_tip.png (128x128)
  chain.png (256x256)

Builds 6.5s idle animation (1.625s persp, exact phase delays, 47% micro-jitter, Bezier curves)
and 1.0s reaction animation (weight shift, shoulder bump, head turn, chain swing).
"""

import json
import math
import os
from pathlib import Path
from PIL import Image, ImageDraw

APP_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = APP_ROOT / "design/source/spine/images"
SPINE_OUT_DIR = APP_ROOT / "static/assets/spines/cast_guy"
PROJECT_OUT_DIR = APP_ROOT / "design/source/spine"

SPINE_OUT_DIR.mkdir(parents=True, exist_ok=True)
PROJECT_OUT_DIR.mkdir(parents=True, exist_ok=True)


def build_atlas_and_parts():
    """Pack 12 source component images from design/source/spine/images/ onto cast_guy.png and build cast_guy.atlas."""
    parts_list = [
        "legs", "torso", "arm_upper_l", "arm_lower_l", "hand_l",
        "arm_upper_r", "arm_lower_r", "hand_r", "head", "hair", "hair_tip", "chain"
    ]

    parts_imgs = {}
    for part in parts_list:
        p_path = IMAGES_DIR / f"{part}.png"
        assert p_path.exists(), f"Missing part image: {p_path}"
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
        "chain": (512, 768, 256, 256),
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

    atlas_png_path = SPINE_OUT_DIR / "cast_guy.png"
    atlas_img.save(atlas_png_path)

    atlas_txt_path = SPINE_OUT_DIR / "cast_guy.atlas"
    with open(atlas_txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(atlas_lines) + "\n")

    print(f"Packed 12 parts into {atlas_png_path} ({atlas_w}x{atlas_h}) and {atlas_txt_path}")
    return placements


def build_guy_spine_json():
    """Build guy.json with Spine 4.1 hierarchy, 6.5s idle animation, and 1.0s reaction animation."""
    bones = [
        {"name": "root"},
        {"name": "persp", "parent": "root"},
        {"name": "hips", "parent": "persp", "y": 950},
        {"name": "spine", "parent": "hips", "y": 150},
        {"name": "chest", "parent": "spine", "y": 220},
        {"name": "neck", "parent": "chest", "y": 220},
        {"name": "head", "parent": "neck", "x": -10, "y": 120},
        {"name": "hair", "parent": "head", "y": 120},
        {"name": "hair_tip", "parent": "hair", "x": -20, "y": 80},
        {"name": "chain", "parent": "chest", "x": 10, "y": 100},
        {"name": "arm_upper_l", "parent": "chest", "x": -160, "y": 140},
        {"name": "arm_lower_l", "parent": "arm_upper_l", "x": -60, "y": -120},
        {"name": "hand_l", "parent": "arm_lower_l", "x": 50, "y": -110},
        {"name": "arm_upper_r", "parent": "chest", "x": 160, "y": 140},
        {"name": "arm_lower_r", "parent": "arm_upper_r", "x": 60, "y": -120},
        {"name": "hand_r", "parent": "arm_lower_r", "x": -50, "y": -110},
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
                "chain": {"chain": {"x": 0, "y": -40, "width": 256, "height": 256}},
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

    # Build 6.5s Idle Animation
    persp_scale = []
    persp_trans = []
    for i in range(4):
        t_base = i * 1.625
        persp_scale.append({"time": round(t_base, 4), "x": 1.0, "y": 1.0, "curve": BEZIER})
        persp_scale.append({"time": round(t_base + 0.8125, 4), "x": 1.0, "y": 1.03, "curve": BEZIER})
        persp_trans.append({"time": round(t_base, 4), "x": 0, "y": 0, "curve": BEZIER})
        persp_trans.append({"time": round(t_base + 0.8125, 4), "x": 0, "y": 6, "curve": BEZIER})
    persp_scale.append({"time": 6.5, "x": 1.0, "y": 1.0})
    persp_trans.append({"time": 6.5, "x": 0, "y": 0})

    def make_rot_keys(amp: float, phase_sec: float, extra_offset_sec: float = 0.0):
        total_phase = phase_sec + extra_offset_sec
        keys = []
        steps = 16
        for step in range(steps + 1):
            t = (step / steps) * 6.5
            angle = amp * math.sin(2 * math.pi * ((t - total_phase) / 6.5))
            k = {"time": round(t, 4), "value": round(angle, 2)}
            if step < steps:
                k["curve"] = BEZIER
            keys.append(k)
        return keys

    t_win = 3.055
    w_len = 0.83
    spine_jitter_keys = [
        {"time": 0.0, "value": 0.0, "curve": BEZIER},
        {"time": 1.625, "value": -1.2, "curve": BEZIER},
        {"time": round(t_win + 0.00 * w_len, 4), "value": 0.0, "curve": BEZIER},
        {"time": round(t_win + 0.24 * w_len, 4), "value": -0.50, "curve": BEZIER},
        {"time": round(t_win + 0.40 * w_len, 4), "value": 0.11, "curve": BEZIER},
        {"time": round(t_win + 0.56 * w_len, 4), "value": -0.35, "curve": BEZIER},
        {"time": round(t_win + 0.72 * w_len, 4), "value": 0.20, "curve": BEZIER},
        {"time": round(t_win + 1.00 * w_len, 4), "value": 0.0, "curve": BEZIER},
        {"time": 4.875, "value": 1.2, "curve": BEZIER},
        {"time": 6.5, "value": 0.0}
    ]

    head_trans_keys = [
        {"time": 0.0, "x": 0, "y": 0, "curve": BEZIER},
        {"time": 1.625, "x": -3, "y": 1, "curve": BEZIER},
        {"time": 3.25, "x": 5, "y": -1, "curve": BEZIER},
        {"time": 4.875, "x": -2, "y": 2, "curve": BEZIER},
        {"time": 6.5, "x": 0, "y": 0}
    ]

    idle_bones = {
        "persp": {"scale": persp_scale, "translate": persp_trans},
        "hips": {"rotate": make_rot_keys(1.0, 0.000)},
        "spine": {"rotate": spine_jitter_keys},
        "chest": {"rotate": make_rot_keys(2.0, 0.110)},
        "neck": {"rotate": make_rot_keys(2.6, 0.170)},
        "head": {"rotate": make_rot_keys(3.3, 0.240), "translate": head_trans_keys},
        "arm_upper_l": {"rotate": make_rot_keys(2.2, 0.140)},
        "arm_lower_l": {"rotate": make_rot_keys(4.5, 0.300)},
        "hand_l": {"rotate": make_rot_keys(9.0, 0.440)},
        "arm_upper_r": {"rotate": make_rot_keys(2.2, 0.140, extra_offset_sec=3.25)},
        "arm_lower_r": {"rotate": make_rot_keys(4.5, 0.300, extra_offset_sec=3.25)},
        "hand_r": {"rotate": make_rot_keys(9.0, 0.440, extra_offset_sec=3.25)},
        "chain": {"rotate": make_rot_keys(7.2, 0.240)},
        "hair": {"rotate": make_rot_keys(7.0, 0.260)},
        "hair_tip": {"rotate": make_rot_keys(15.0, 0.420)},
    }

    reaction_bones = {
        "hips": {
            "translate": [
                {"time": 0.0, "x": 0, "y": 0, "curve": BEZIER},
                {"time": 0.3, "x": -15, "y": -5, "curve": BEZIER},
                {"time": 0.7, "x": -8, "y": -2, "curve": BEZIER},
                {"time": 1.0, "x": 0, "y": 0}
            ],
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": -3.5, "curve": BEZIER},
                {"time": 0.7, "value": -1.0, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        },
        "chest": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": 4.5, "curve": BEZIER},
                {"time": 0.7, "value": 1.5, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        },
        "head": {
            "translate": [
                {"time": 0.0, "x": 0, "y": 0, "curve": BEZIER},
                {"time": 0.35, "x": -12, "y": 4, "curve": BEZIER},
                {"time": 0.75, "x": -5, "y": 1, "curve": BEZIER},
                {"time": 1.0, "x": 0, "y": 0}
            ],
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.35, "value": 6.5, "curve": BEZIER},
                {"time": 0.75, "value": 2.0, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        },
        "chain": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.35, "value": 16.0, "curve": BEZIER},
                {"time": 0.65, "value": -8.0, "curve": BEZIER},
                {"time": 0.85, "value": 3.0, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        },
        "arm_upper_r": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": -12.0, "curve": BEZIER},
                {"time": 0.7, "value": -3.0, "curve": BEZIER},
                {"time": 1.0, "value": 0}
            ]
        }
    }

    spine_data = {
        "skeleton": {
            "hash": "guy-cast-rig-v1",
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

    json_path = SPINE_OUT_DIR / "guy.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(spine_data, f, indent=2)

    project_path = PROJECT_OUT_DIR / "guy.spine"
    with open(project_path, "w", encoding="utf-8") as f:
        json.dump(spine_data, f, indent=2)

    print(f"Generated Spine JSON -> {json_path}")
    print(f"Generated Spine Project File -> {project_path}")


def main():
    print("=== Building Spine 4.1 Rigged Asset for Side Character Guy ===")
    build_atlas_and_parts()
    build_guy_spine_json()
    print("All deliverables for Guy Spine Rig successfully generated!")


if __name__ == "__main__":
    main()
