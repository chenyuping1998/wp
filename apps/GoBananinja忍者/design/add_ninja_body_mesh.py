"""Skin the continuous ninja body to the existing Spine bones.

Run after build_ninja_puppet.py and add_ninja_slash_to_spine.py. The forearms,
grip, sheath and katana remain their own attachments. Mesh vertices blend across
head/shoulder/waist/knee instead of moving the connected body as a rigid card.
"""
from __future__ import annotations

import json
from pathlib import Path

import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ninja_flow  # noqa: E402

TARGET = Path(__file__).resolve().parents[1] / 'static/assets/spines/goBananinjaMascot/ninja.json'
rig = json.loads(TARGET.read_text(encoding='utf-8'))
bones = rig['bones']
bone_index = {bone['name']: i for i, bone in enumerate(bones)}


def world_bone(name: str) -> tuple[float, float]:
    bone = bones[bone_index[name]]
    if 'parent' not in bone:
        return bone.get('x', 0), bone.get('y', 0)
    px, py = world_bone(bone['parent'])
    return px + bone.get('x', 0), py + bone.get('y', 0)


def smooth(t: float) -> float:
    t = max(0, min(1, t))
    return t * t * (3 - 2 * t)


# THE APRON'S HEM (2026-10-04). The long front panel and the two side flaps
# hang free below the sash; each is weighted to its own bone (ninja_flow.py
# FLOW_BONES), ramping in from the waist so the sash line never moves and the
# hem carries the sway. A soft polygon, sampled per vertex.
def _soft_poly(pts, blur=18):
    im = Image.new('L', (1024, 1536), 0)
    ImageDraw.Draw(im).polygon(pts, fill=255)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(blur)), np.float32) / 255


APRON = {
    'apronF': (_soft_poly([(340, 700), (470, 700), (502, 1000), (492, 1080), (398, 1080), (328, 960)]), 760, 240),
    'apronL': (_soft_poly([(150, 880), (330, 860), (342, 1064), (150, 1072)]), 860, 170),
    'apronR': (_soft_poly([(482, 880), (592, 868), (592, 1004), (492, 1004)]), 868, 120),
}


def apron_weights(x: float, y: float) -> dict[str, float]:
    xi, yi = int(min(1023, max(0, x))), int(min(1535, max(0, y)))
    out = {}
    for name, (mask, top, span) in APRON.items():
        v = float(mask[yi, xi]) * smooth((y - top) / span) * 0.9
        if v > 0.0001:
            out[name] = v
    return out


def weights(x: float, y: float) -> dict[str, float]:
    # Sheet coordinates: x right, y down. Joint bands overlap generously so
    # no shoulder or waist is ever cut along a single row of triangles.
    head = 1 - smooth((y - 295) / 140)
    shoulder_band = smooth((y - 185) / 120) * (1 - smooth((y - 535) / 155))
    left_arm = 0.91 * shoulder_band * smooth((370 - x) / 165) * (1 - head)
    right_arm = 0.91 * shoulder_band * smooth((x - 650) / 165) * (1 - head)
    leg_band = smooth((y - 805) / 205)
    left_leg = leg_band * smooth((525 - x) / 150) * 0.94
    right_leg = leg_band * smooth((x - 499) / 150) * 0.94
    used = head + left_arm + right_arm
    room = 1 - used
    left_leg *= room
    right_leg *= room
    room -= left_leg + right_leg
    hip = room * smooth((y - 590) / 245)
    torso = room - hip
    base = {
        'head': head,
        'armL': left_arm,
        'armR': right_arm,
        'legL': left_leg,
        'legR': right_leg,
        'hip': hip,
        'torso': torso,
    }
    apron = apron_weights(x, y)
    share = min(0.9, sum(apron.values()))
    if share > 0:
        total = sum(apron.values())
        base = {k: v * (1 - share) for k, v in base.items()}
        for k, v in apron.items():
            base[k] = v / total * share
    return base


# The body atlas rectangle is the full untrimmed 877x1496 image at x82,y12.
# The attachment's original region starts at this exact rectangle, so a rest
# mesh with these coordinates renders pixel-identically to the old region.
x0, y0, width, height = 82, 12, 877, 1496
# denser than the first pass (18x30) so the hem bends locally
cols, rows = 27, 45
ring = ([(c, 0) for c in range(cols)] +
        [(cols, r) for r in range(rows)] +
        [(c, rows) for c in range(cols, 0, -1)] +
        [(0, r) for r in range(rows, 0, -1)])
inside = [(c, r) for r in range(1, rows) for c in range(1, cols)]
order = ring + inside
index = {p: i for i, p in enumerate(order)}
uvs: list[float] = []
vertices: list[float] = []
triangles: list[int] = []
for c, r in order:
    x = x0 + width * c / cols
    y = y0 + height * r / rows
    wx, wy = x - 512, 1510 - y
    uvs.extend((round(c / cols, 6), round(r / rows, 6)))
    parts = [(name, value) for name, value in weights(x, y).items() if value > 0.0001]
    total = sum(value for _, value in parts)
    vertices.append(len(parts))
    for name, value in parts:
        # rotated bones (the apron's, ninja_flow.py) need the vertex in their own frame
        lx, ly = ninja_flow.to_local(bones, name, wx, wy)
        vertices.extend((bone_index[name], round(lx, 4), round(ly, 4), round(value / total, 6)))

for r in range(rows):
    for c in range(cols):
        a, b = index[c, r], index[c + 1, r]
        d, e = index[c, r + 1], index[c + 1, r + 1]
        triangles.extend((a, b, e, a, e, d))

body = rig['skins'][0]['attachments']['body']['body']
body.clear()
body.update(type='mesh', uvs=uvs, triangles=triangles, vertices=vertices,
            hull=len(ring), width=width, height=height)
TARGET.write_text(json.dumps(rig, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'ninja body: {len(order)} weighted vertices, {len(triangles) // 3} triangles')
