"""Rebuild the cast_girl Spine skeleton for the "novelty raygun" pose.

Same treatment as build_spine_guy_bat_pose.py: the player supplied a new
reference illustration (design/source/spine/girl_reference_gun.png) — right
arm extended out to the side holding a stylised, non-realistic novelty pistol
prop, left hand still resting on her hip. Torso, legs, head, hair, hair_tip
and earring are unchanged from the shipped calm-pose rig; only the right arm
chain changes direction, plus one new "gun" bone/slot is added.

IMPORTANT — do not "fix" visible seams by fusing limb segments into one
image. A 2026-08-30 edit did exactly that to the guy rig (collapsed the whole
arm into one texture, and dropped arm_lower_l/r, hand_l/r, hair_tip, earring
from SLOTS entirely) — the seam disappeared, but so did every elbow/wrist
joint, and the guy's left hand silently stopped rendering because its slot
was gone. Keep this rig's SLOTS list at all thirteen independently-posable
parts. The correct fix for a visible seam is a soft alpha-fade at each part's
cut edge (see docs/art-prompts-hot-miami-parts.md §16-18 and the
spine_prompts.html artifact's rule #6) — never fuse multiple bones' worth of
art into one texture.

Bone math, same convention as the guy rig: every bone has rest rotation 0, so
a bone's x/y offset is literally "where does the next joint sit" in the
parent's local space. Shoulder->elbow and elbow->wrist were measured off
girl_reference_gun.png (shoulder ~(455,385)px, elbow ~(590,430)px, grip
~(735,460)px, muzzle spark ~(880,310)px in that image) and re-expressed as
direction * the SAME segment lengths the shipped rig already uses (130 and
117 units) so the arm keeps proportions already proven to fit this torso.
The gun is a new bone at half its own length (104 of ~209 units) past the
hand, in the same direction, so its 320x320 canvas is centred on the prop.

ATTACH_OFFSET values were then measured a second time off the actual
delivered art (design/source/spine/images_girl/*.png) — see the "target-
chaining" method logged in docs/handoff/hot_miami.md's 2026-08-29/30 "Spine
女生第二次交件" section; verified to produce a fully connected
shoulder->elbow->wrist->gun chain on the right arm (right arm needed no
correction at all) and shoulder->elbow->wrist chain on the left
(docs/handoff calls this composite "girl_gun_assembled_v3").

This script does NOT touch the atlas (cast_girl.png/.atlas) or install any
art — there is no real per-part art for this pose yet. It only:
  1. rewrites static/assets/spines/cast_girl/girl.json (skeleton + animations)
  2. rewrites design/source/spine/girl.spine (project file, same content)
  3. regenerates design/source/spine/images_placeholder_girl/ (13 files,
     position/scale reference only — flat shapes, not art)
"""

import json
import math
from pathlib import Path
from PIL import Image, ImageDraw

APP_ROOT = Path(__file__).resolve().parent.parent
SPINE_OUT_DIR = APP_ROOT / "static/assets/spines/cast_girl"
PROJECT_OUT_DIR = APP_ROOT / "design/source/spine"
PLACEHOLDER_DIR = PROJECT_OUT_DIR / "images_placeholder_girl"
PLACEHOLDER_DIR.mkdir(parents=True, exist_ok=True)

BEZIER = [0.35, 0, 0.25, 1]

# (name, parent, x, y) — unchanged bones keep the shipped rig's exact values.
BONES = [
    ("root", None, 0, 0),
    ("persp", "root", 0, 0),
    ("hips", "persp", 0, 950),
    ("spine", "hips", 0, 0),
    ("chest", "spine", 0, 146),
    ("neck", "chest", 0, 0),
    ("head", "neck", 0, 140),
    ("hair", "head", 0, 0),
    ("hair_tip", "hair", 12, 76),
    ("earring", "head", 25, -4),
    ("arm_upper_l", "chest", -55, 60),
    ("arm_lower_l", "arm_upper_l", -100, -120),
    ("hand_l", "arm_lower_l", 119, -64),
    ("arm_upper_r", "chest", 55, 60),
    ("arm_lower_r", "arm_upper_r", 98, -120),
    ("hand_r", "arm_lower_r", 118, -62),
    ("gun", "hand_r", 38, 19),
]

# Every one of these thirteen bones/parts is its own independently-posable
# slot. DO NOT remove arm_lower_l/arm_lower_r/hand_l/hand_r/hair_tip/earring
# from here to "fix" a seam — see the module docstring.
SLOTS = [
    ("legs", "hips", "legs"),
    ("torso", "chest", "torso"),
    ("earring", "earring", "earring"),
    ("arm_upper_l", "arm_upper_l", "arm_upper_l"),
    ("arm_lower_l", "arm_lower_l", "arm_lower_l"),
    ("hand_l", "hand_l", "hand_l"),
    ("arm_upper_r", "arm_upper_r", "arm_upper_r"),
    ("arm_lower_r", "arm_lower_r", "arm_lower_r"),
    ("gun", "gun", "gun"),                       # drawn before hand_r: hand covers the grip
    ("hand_r", "hand_r", "hand_r"),
    ("head", "head", "head"),
    ("hair", "hair", "hair"),
    ("hair_tip", "hair_tip", "hair_tip"),
]

SIZES = {
    "legs": 512, "torso": 512,
    "earring": 256, "arm_upper_l": 256, "arm_lower_l": 256, "arm_upper_r": 256, "arm_lower_r": 256,
    "head": 256, "hair": 256,
    "hand_l": 128, "hand_r": 128, "hair_tip": 128,
    "gun": 320,
}
ATTACH_OFFSET = {
    "legs": (0, -200),
    # Proximal joint of every independently drawn segment is placed directly
    # on its bone origin; child translations land on the distal joint.
    "arm_upper_l": (-50, -60), "arm_lower_l": (62, -36), "hand_l": (33, 8),
    "arm_upper_r": (48, -60), "arm_lower_r": (61, -37), "hand_r": (33, 16),
    "gun": (15, 22),
}


def world_positions():
    by_name = {name: (parent, x, y) for name, parent, x, y in BONES}
    world = {}

    def resolve(name):
        if name in world:
            return world[name]
        parent, x, y = by_name[name]
        if parent is None:
            world[name] = (x, y)
        else:
            px, py = resolve(parent)
            world[name] = (px + x, py + y)
        return world[name]

    for name in by_name:
        resolve(name)
    return world


def build_json():
    bones = [{"name": n, **({"parent": p} if p else {})} for n, p, x, y in BONES]
    for i, (n, p, x, y) in enumerate(BONES):
        if x:
            bones[i]["x"] = x
        if y:
            bones[i]["y"] = y

    slots = [{"name": n, "bone": b, "attachment": a} for n, b, a in SLOTS]

    attachments = {}
    for n, _, a in SLOTS:
        size = SIZES[a]
        ox, oy = ATTACH_OFFSET.get(a, (0, 0))
        entry = {"width": size, "height": size}
        if ox:
            entry["x"] = ox
        if oy:
            entry["y"] = oy
        attachments[n] = {a: entry}
    skins = [{"name": "default", "attachments": attachments}]

    def make_rot_keys(amp, phase_sec, extra_offset_sec=0.0):
        total_phase = phase_sec + extra_offset_sec
        keys = []
        steps = 16
        for step in range(steps + 1):
            t = (step / steps) * 5.0
            angle = amp * math.sin(2 * math.pi * ((t - total_phase) / 5.0))
            k = {"time": round(t, 4), "value": round(angle, 2)}
            if step < steps:
                k["curve"] = BEZIER
            keys.append(k)
        return keys

    persp_scale, persp_trans = [], []
    for i in range(4):
        t_base = i * 1.25
        persp_scale.append({"time": round(t_base, 4), "x": 1.0, "y": 1.0, "curve": BEZIER})
        persp_scale.append({"time": round(t_base + 0.625, 4), "x": 1.0, "y": 1.03, "curve": BEZIER})
        persp_trans.append({"time": round(t_base, 4), "x": 0, "y": 0, "curve": BEZIER})
        persp_trans.append({"time": round(t_base + 0.625, 4), "x": 0, "y": 6, "curve": BEZIER})
    persp_scale.append({"time": 5.0, "x": 1.0, "y": 1.0})
    persp_trans.append({"time": 5.0, "x": 0, "y": 0})

    idle_bones = {
        "persp": {"scale": persp_scale, "translate": persp_trans},
        "hips": {"rotate": make_rot_keys(1.0, 0.000)},
        "spine": {"rotate": make_rot_keys(1.4, 0.090)},
        "chest": {"rotate": make_rot_keys(1.8, 0.130)},
        "neck": {"rotate": make_rot_keys(2.2, 0.180)},
        "head": {"rotate": make_rot_keys(2.8, 0.230)},
        "arm_upper_l": {"rotate": make_rot_keys(2.0, 0.140)},
        "arm_lower_l": {"rotate": make_rot_keys(4.0, 0.280)},
        "hand_l": {"rotate": make_rot_keys(8.0, 0.400)},
        # An extended arm bracing a held prop — much smaller amplitude than a
        # loose hanging arm, same reasoning as the guy's raised bat arm.
        "arm_upper_r": {"rotate": make_rot_keys(0.5, 0.140, extra_offset_sec=2.5)},
        "arm_lower_r": {"rotate": make_rot_keys(0.8, 0.280, extra_offset_sec=2.5)},
        "hand_r": {"rotate": make_rot_keys(1.1, 0.400, extra_offset_sec=2.5)},
        "gun": {"rotate": make_rot_keys(1.8, 0.220, extra_offset_sec=2.5)},
        "earring": {"rotate": make_rot_keys(6.5, 0.220)},
        "hair": {"rotate": make_rot_keys(6.5, 0.240)},
        "hair_tip": {"rotate": make_rot_keys(14.0, 0.380)},
    }

    reaction_bones = {
        "hips": {
            "translate": [
                {"time": 0.0, "x": 0, "y": 0, "curve": BEZIER},
                {"time": 0.3, "x": -12, "y": -4, "curve": BEZIER},
                {"time": 0.7, "x": -6, "y": -2, "curve": BEZIER},
                {"time": 1.0, "x": 0, "y": 0},
            ]
        },
        "chest": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": 4.0, "curve": BEZIER},
                {"time": 0.7, "value": 1.2, "curve": BEZIER},
                {"time": 1.0, "value": 0},
            ]
        },
        "earring": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.35, "value": 14.0, "curve": BEZIER},
                {"time": 0.65, "value": -7.0, "curve": BEZIER},
                {"time": 0.85, "value": 2.5, "curve": BEZIER},
                {"time": 1.0, "value": 0},
            ]
        },
        # A small recoil kick — bracing, not a realistic gun's actual recoil.
        "gun": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.15, "value": -8.0, "curve": BEZIER},
                {"time": 0.5, "value": 2.0, "curve": BEZIER},
                {"time": 1.0, "value": 0},
            ]
        },
    }

    spine_data = {
        "skeleton": {
            "hash": "girl-cast-rig-gunpose-v1",
            "spine": "4.2.74",
            "x": -256,
            "y": 0,
            "width": 512,
            "height": 2048,
            "images": "./images_girl/",
        },
        "bones": bones,
        "slots": slots,
        "skins": skins,
        "animations": {"idle": {"bones": idle_bones}, "reaction": {"bones": reaction_bones}},
    }

    SPINE_OUT_DIR.mkdir(parents=True, exist_ok=True)
    (SPINE_OUT_DIR / "girl.json").write_text(json.dumps(spine_data, indent=2), encoding="utf-8")
    (PROJECT_OUT_DIR / "girl.spine").write_text(json.dumps(spine_data, indent=2), encoding="utf-8")
    print(f"Wrote {SPINE_OUT_DIR / 'girl.json'}")
    print(f"Wrote {PROJECT_OUT_DIR / 'girl.spine'}")


# ── position/scale-only placeholders ────────────────────────────────────
MASTER_W, MASTER_H = 1400, 2400
ORIGIN_X, ORIGIN_Y = MASTER_W // 2, MASTER_H - 120

COLORS = {
    "legs": (240, 190, 210, 255), "torso": (120, 200, 220, 255),
    "arm_upper_l": (120, 200, 220, 255), "arm_lower_l": (235, 170, 130, 255), "hand_l": (235, 170, 130, 255),
    "arm_upper_r": (120, 200, 220, 255), "arm_lower_r": (235, 170, 130, 255), "hand_r": (235, 170, 130, 255),
    "head": (235, 170, 130, 255), "hair": (90, 60, 60, 255), "hair_tip": (90, 60, 60, 255),
    "earring": (230, 190, 60, 255), "gun": (230, 60, 150, 255),
}
SEGMENT_CHILD = {
    "arm_upper_l": "arm_lower_l", "arm_lower_l": "hand_l",
    "arm_upper_r": "arm_lower_r", "arm_lower_r": "hand_r",
    "hair": "hair_tip",
}
THICKNESS = {
    "arm_upper_l": 40, "arm_lower_l": 32, "arm_upper_r": 40, "arm_lower_r": 32,
    "hand_r": 28, "hair": 56, "gun": 30,
}


def to_master(wx, wy):
    return ORIGIN_X + wx, ORIGIN_Y - wy


def draw_capsule(draw, p0, p1, w, color):
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    length = math.hypot(dx, dy) or 1
    nx, ny = -dy / length * w / 2, dx / length * w / 2
    poly = [
        (p0[0] + nx, p0[1] + ny), (p1[0] + nx, p1[1] + ny),
        (p1[0] - nx, p1[1] - ny), (p0[0] - nx, p0[1] - ny),
    ]
    draw.polygon(poly, fill=color, outline=(0, 0, 0, 255))
    draw.ellipse([p0[0] - w / 2, p0[1] - w / 2, p0[0] + w / 2, p0[1] + w / 2], fill=color, outline=(0, 0, 0, 255))
    draw.ellipse([p1[0] - w / 2, p1[1] - w / 2, p1[0] + w / 2, p1[1] + w / 2], fill=color, outline=(0, 0, 0, 255))


def build_placeholders():
    world = world_positions()
    master = Image.new("RGBA", (MASTER_W, MASTER_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(master)

    hips = to_master(*world["hips"])
    chest = to_master(*world["chest"])
    neck = to_master(*world["neck"])
    draw.rectangle([hips[0] - 130, chest[1] - 30, hips[0] + 130, hips[1] + 210], fill=COLORS["legs"], outline=(0, 0, 0, 255))
    draw.rectangle([hips[0] - 140, neck[1], hips[0] + 140, hips[1] + 40], fill=COLORS["torso"], outline=(0, 0, 0, 255))

    head = to_master(*world["head"])
    draw.ellipse([head[0] - 95, head[1] - 105, head[0] + 95, head[1] + 105], fill=COLORS["head"], outline=(0, 0, 0, 255))

    earring = to_master(*world["earring"])
    draw.ellipse([earring[0] - 30, earring[1] - 30, earring[0] + 30, earring[1] + 30], fill=COLORS["earring"], outline=(0, 0, 0, 255))

    for name, child in SEGMENT_CHILD.items():
        p0 = to_master(*world[name])
        p1 = to_master(*world[child])
        draw_capsule(draw, p0, p1, THICKNESS.get(name, 36), COLORS.get(name, (200, 200, 200, 255)))

    hr = to_master(*world["hand_r"])
    gx, gy = world["gun"]
    hrx, hry = world["hand_r"]
    tip = to_master(hrx + 2 * (gx - hrx), hry + 2 * (gy - hry))
    draw_capsule(draw, hr, tip, THICKNESS["gun"], COLORS["gun"])

    for slot_name, bone_name, attach_name in SLOTS:
        size = SIZES[attach_name]
        ox, oy = ATTACH_OFFSET.get(attach_name, (0, 0))
        cx, cy = to_master(*world[bone_name])
        cx += ox
        cy += oy
        box = (int(cx - size / 2), int(cy - size / 2), int(cx + size / 2), int(cy + size / 2))
        crop = master.crop(box)
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(crop, (0, 0), crop)
        out.save(PLACEHOLDER_DIR / f"{attach_name}.png")
        print(f"Wrote {PLACEHOLDER_DIR / (attach_name + '.png')}  ({size}x{size} @ world {world[bone_name]})")

    master.save(PROJECT_OUT_DIR / "girl_gun_pose_master_debug.png")


if __name__ == "__main__":
    build_json()
    build_placeholders()
