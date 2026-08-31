"""Rebuild the cast_guy Spine skeleton for the "bat over shoulder" pose.

2026-08-30: the player supplied a real layered source file,
design/source/spine/psd/spine-pieces-project-1.psd (224x512, one layer per
body part, positions already mutually consistent since it's one drawing).
Extracted torso, legs, head, the loose hair-tip curl, and the whole right
arm chain (upper arm / forearm / hand / bat) from it — see
design/extract_psd_parts.py. Left arm remains on old placeholder-derived
values: the PSD has no left upper-arm layer at all, and its left forearm/
hand layers are flat-color placeholders, not finished art. Chain is baked
into the torso art now instead of being a separate layer; hair is baked into
the head/face layer (only the small loose curl came out as its own piece,
used for hair_tip) — both chain.png and hair.png stay unpopulated until
someone draws them as independent pieces.

Bone math, same convention as always: every bone has rest rotation 0, so a
bone's x/y offset is "where does the next joint sit," and — for the eight
PSD-derived parts specifically — the bone position was set to exactly that
part's own content centroid (extract_psd_parts.py scales+crops so the
content is centred in its canvas), which makes every one of THEIR
ATTACH_OFFSETs (0, 0): the texture is already centred on its bone by
construction, because the whole PSD shares one consistent coordinate system
and the parts were already drawn to connect to each other. Only the "legs"
slot needs a nonzero offset, because its content centroid isn't the hips
joint itself (hips sit at the top edge of the leg content, not its middle).

IMPORTANT — do not "fix" visible seams by fusing limb segments into one
image. A 2026-08-30 edit collapsed arm_upper_r into a single picture covering
shoulder-to-bat and dropped arm_lower_l/arm_lower_r/hand_l/hand_r/bat from
SLOTS entirely — the seam did disappear, but so did every elbow/wrist/bat
joint, and the guy's LEFT HAND silently stopped rendering because its slot
was gone. That trade is never worth it — the whole reason this rig exists
instead of a flat cutout is per-bone articulation. `design/
check_spine_slots_complete.py` fails the build if any of these 13 slots goes
missing again; do not work around that check, fix the seam in the art
instead (soft alpha-fade at the cut edge, see docs/art-prompts-hot-miami-
parts.md §16-18 and the spine_prompts.html artifact's rule #6).

This script does NOT touch the atlas (cast_guy.png / cast_guy.atlas) — text
packing happens once every slot has real art. It only:
  1. rewrites static/assets/spines/cast_guy/guy.json (skeleton + animations)
  2. rewrites design/source/spine/guy.spine (project file, same content)
  3. regenerates design/source/spine/images_placeholder/ (13 files, position/
     scale reference only — flat shapes, not art) for whichever slots still
     need real art from someone
"""

import json
import math
from pathlib import Path
from PIL import Image, ImageDraw

APP_ROOT = Path(__file__).resolve().parent.parent
SPINE_OUT_DIR = APP_ROOT / "static/assets/spines/cast_guy"
PROJECT_OUT_DIR = APP_ROOT / "design/source/spine"
PLACEHOLDER_DIR = PROJECT_OUT_DIR / "images_placeholder"
PLACEHOLDER_DIR.mkdir(parents=True, exist_ok=True)

BEZIER = [0.35, 0, 0.25, 1]

# ── bones ────────────────────────────────────────────────────────────────
# (name, parent, x, y). hips is the one fixed anchor (unchanged since the
# very first version of this rig); everything from chest down to the bat was
# recomputed 2026-08-30 from the PSD's own layer positions (see docstring).
# arm_lower_l/hand_l keep their pre-PSD relative offsets — no new art for
# that side yet, only the shoulder anchor moved to match the new chest.
BONES = [
    ("root", None, 0, 0),
    ("persp", "root", 0, 0),
    ("hips", "persp", 0, 950),
    ("spine", "hips", 0, 0),
    ("chest", "spine", 0, 80),
    ("neck", "chest", 0, 0),
    ("head", "neck", 6, 186),
    ("hair", "head", 0, 0),
    ("hair_tip", "hair", 28, 26),
    ("chain", "chest", 0, 40),
    ("arm_upper_l", "chest", -60, 160),
    ("arm_lower_l", "arm_upper_l", -60, -120),
    ("hand_l", "arm_lower_l", 50, -110),
    ("arm_upper_r", "chest", 93, 27),
    ("arm_lower_r", "arm_upper_r", 38, -19),
    ("hand_r", "arm_lower_r", 20, 68),
    ("bat", "hand_r", -109, 60),
]

# Every one of these thirteen bones/parts is its own independently-posable
# slot. DO NOT remove arm_lower_l/arm_lower_r/hand_l/hand_r/bat from here to
# "fix" a seam — see the module docstring and check_spine_slots_complete.py.
SLOTS = [
    ("legs", "hips", "legs"),
    ("torso", "chest", "torso"),
    # "chain" and "hair" are deliberately NOT separate slots in this delivery
    # — the PSD's torso already has the necklace painted on it, and its head
    # already has the hair mass painted on it (see extract_psd_parts.py).
    # Standalone chain.png/hair.png also exist (leftovers from an earlier
    # batch) but installing them here would double-draw a second necklace/
    # hairstyle on top of the ones already baked into torso/head. This is
    # NOT the fused-limb anti-pattern the docstring warns about — no bone's
    # articulation is lost, it's a same-picture duplication avoided. When
    # someone draws an independent chain/hair that ISN'T already in torso/
    # head, add the slots back and see check_spine_slots_complete.py.
    ("arm_upper_l", "arm_upper_l", "arm_upper_l"),
    ("arm_lower_l", "arm_lower_l", "arm_lower_l"),
    ("hand_l", "hand_l", "hand_l"),
    ("arm_upper_r", "arm_upper_r", "arm_upper_r"),
    ("arm_lower_r", "arm_lower_r", "arm_lower_r"),
    ("bat", "bat", "bat"),                       # drawn before hand_r: hand covers the grip
    ("hand_r", "hand_r", "hand_r"),
    ("head", "head", "head"),
    ("hair_tip", "hair_tip", "hair_tip"),
]

SIZES = {
    "legs": 512, "torso": 512,
    "chain": 256, "arm_upper_l": 256, "arm_lower_l": 256, "arm_upper_r": 256, "arm_lower_r": 256,
    "head": 256, "hair": 256,
    "hand_l": 128, "hand_r": 128, "hair_tip": 128,
    "bat": 384,
}
ATTACH_OFFSET = {
    # legs is the only PSD-derived part whose content centroid isn't its own
    # bone (hips sits at the TOP of the leg art, not the middle) — see
    # extract_psd_parts.py for the (14, -226) derivation. torso/head/
    # hair_tip/arm_upper_r/arm_lower_r/hand_r/bat are all (0, 0): their bone
    # IS their content centroid, by construction.
    "legs": (14, -226),
    # Left arm: real art from a separate exploded-sheet delivery (not the
    # PSD), re-registered to the new shoulder position the same way as the
    # right arm — measured by eye off design/source/spine/images/*.png.
    "arm_upper_l": (-32, -73), "arm_lower_l": (23, -53), "hand_l": (-1, -54),
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
            t = (step / steps) * 6.5
            angle = amp * math.sin(2 * math.pi * ((t - total_phase) / 6.5))
            k = {"time": round(t, 4), "value": round(angle, 2)}
            if step < steps:
                k["curve"] = BEZIER
            keys.append(k)
        return keys

    persp_scale, persp_trans = [], []
    for i in range(4):
        t_base = i * 1.625
        persp_scale.append({"time": round(t_base, 4), "x": 1.0, "y": 1.0, "curve": BEZIER})
        persp_scale.append({"time": round(t_base + 0.8125, 4), "x": 1.0, "y": 1.03, "curve": BEZIER})
        persp_trans.append({"time": round(t_base, 4), "x": 0, "y": 0, "curve": BEZIER})
        persp_trans.append({"time": round(t_base + 0.8125, 4), "x": 0, "y": 6, "curve": BEZIER})
    persp_scale.append({"time": 6.5, "x": 1.0, "y": 1.0})
    persp_trans.append({"time": 6.5, "x": 0, "y": 0})

    t_win, w_len = 3.055, 0.83
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
        {"time": 6.5, "value": 0.0},
    ]
    head_trans_keys = [
        {"time": 0.0, "x": 0, "y": 0, "curve": BEZIER},
        {"time": 1.625, "x": -3, "y": 1, "curve": BEZIER},
        {"time": 3.25, "x": 5, "y": -1, "curve": BEZIER},
        {"time": 4.875, "x": -2, "y": 2, "curve": BEZIER},
        {"time": 6.5, "x": 0, "y": 0},
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
        "arm_upper_r": {"rotate": make_rot_keys(0.6, 0.140, extra_offset_sec=3.25)},
        "arm_lower_r": {"rotate": make_rot_keys(1.0, 0.300, extra_offset_sec=3.25)},
        "hand_r": {"rotate": make_rot_keys(1.4, 0.440, extra_offset_sec=3.25)},
        "bat": {"rotate": make_rot_keys(2.2, 0.260, extra_offset_sec=3.25)},
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
                {"time": 1.0, "x": 0, "y": 0},
            ],
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": -3.5, "curve": BEZIER},
                {"time": 0.7, "value": -1.0, "curve": BEZIER},
                {"time": 1.0, "value": 0},
            ],
        },
        "chest": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": 4.5, "curve": BEZIER},
                {"time": 0.7, "value": 1.5, "curve": BEZIER},
                {"time": 1.0, "value": 0},
            ]
        },
        "head": {
            "translate": [
                {"time": 0.0, "x": 0, "y": 0, "curve": BEZIER},
                {"time": 0.35, "x": -12, "y": 4, "curve": BEZIER},
                {"time": 0.75, "x": -5, "y": 1, "curve": BEZIER},
                {"time": 1.0, "x": 0, "y": 0},
            ],
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.35, "value": 6.5, "curve": BEZIER},
                {"time": 0.75, "value": 2.0, "curve": BEZIER},
                {"time": 1.0, "value": 0},
            ],
        },
        "chain": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.35, "value": 16.0, "curve": BEZIER},
                {"time": 0.65, "value": -8.0, "curve": BEZIER},
                {"time": 0.85, "value": 3.0, "curve": BEZIER},
                {"time": 1.0, "value": 0},
            ]
        },
        "bat": {
            "rotate": [
                {"time": 0.0, "value": 0, "curve": BEZIER},
                {"time": 0.3, "value": -6.0, "curve": BEZIER},
                {"time": 0.7, "value": 2.0, "curve": BEZIER},
                {"time": 1.0, "value": 0},
            ]
        },
    }

    spine_data = {
        "skeleton": {
            "hash": "guy-cast-rig-batpose-psd-v1",
            "spine": "4.2.74",
            "x": -256,
            "y": 0,
            "width": 512,
            "height": 2048,
            "images": "./images/",
        },
        "bones": bones,
        "slots": slots,
        "skins": skins,
        "animations": {"idle": {"bones": idle_bones}, "reaction": {"bones": reaction_bones}},
    }

    SPINE_OUT_DIR.mkdir(parents=True, exist_ok=True)
    (SPINE_OUT_DIR / "guy.json").write_text(json.dumps(spine_data, indent=2), encoding="utf-8")
    (PROJECT_OUT_DIR / "guy.spine").write_text(json.dumps(spine_data, indent=2), encoding="utf-8")
    print(f"Wrote {SPINE_OUT_DIR / 'guy.json'}")
    print(f"Wrote {PROJECT_OUT_DIR / 'guy.spine'}")


# ── position/scale-only placeholders (for slots still missing real art) ──
MASTER_W, MASTER_H = 1400, 2400
ORIGIN_X, ORIGIN_Y = MASTER_W // 2, MASTER_H - 120

COLORS = {
    "legs": (240, 210, 150, 255), "torso": (120, 200, 220, 255),
    "arm_upper_l": (120, 200, 220, 255), "arm_lower_l": (235, 170, 130, 255), "hand_l": (235, 170, 130, 255),
    "arm_upper_r": (120, 200, 220, 255), "arm_lower_r": (235, 170, 130, 255), "hand_r": (235, 170, 130, 255),
    "head": (235, 170, 130, 255), "hair": (90, 60, 60, 255), "hair_tip": (90, 60, 60, 255),
    "chain": (230, 190, 60, 255), "bat": (200, 160, 100, 255),
}
SEGMENT_CHILD = {
    "arm_upper_l": "arm_lower_l", "arm_lower_l": "hand_l",
    "arm_upper_r": "arm_lower_r", "arm_lower_r": "hand_r",
    "hair": "hair_tip",
}
THICKNESS = {
    "arm_upper_l": 46, "arm_lower_l": 38, "arm_upper_r": 46, "arm_lower_r": 38,
    "hand_r": 30, "hair": 60, "bat": 34,
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
    draw.rectangle([hips[0] - 140, chest[1] - 30, hips[0] + 140, hips[1] + 210], fill=COLORS["legs"], outline=(0, 0, 0, 255))
    draw.rectangle([hips[0] - 150, neck[1], hips[0] + 150, hips[1] + 40], fill=COLORS["torso"], outline=(0, 0, 0, 255))

    head = to_master(*world["head"])
    draw.ellipse([head[0] - 100, head[1] - 110, head[0] + 100, head[1] + 110], fill=COLORS["head"], outline=(0, 0, 0, 255))

    chain = to_master(*world["chain"])
    draw.ellipse([chain[0] - 60, chain[1] - 60, chain[0] + 60, chain[1] + 60], fill=COLORS["chain"], outline=(0, 0, 0, 255))

    for name, child in SEGMENT_CHILD.items():
        p0 = to_master(*world[name])
        p1 = to_master(*world[child])
        draw_capsule(draw, p0, p1, THICKNESS.get(name, 40), COLORS.get(name, (200, 200, 200, 255)))

    hr = to_master(*world["hand_r"])
    bx, by_ = world["bat"]
    hrx, hry = world["hand_r"]
    tip = to_master(hrx + 2 * (bx - hrx), hry + 2 * (by_ - hry))
    draw_capsule(draw, hr, tip, THICKNESS["bat"], COLORS["bat"])

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

    master.save(PROJECT_OUT_DIR / "guy_bat_pose_master_debug.png")


if __name__ == "__main__":
    build_json()
    build_placeholders()
