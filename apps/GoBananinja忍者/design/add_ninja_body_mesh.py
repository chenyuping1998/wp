"""Skin the continuous ninja body to the existing Spine bones.

Run after build_ninja_puppet.py and add_ninja_slash_to_spine.py. The forearms,
grip, sheath and katana remain their own attachments. Mesh vertices blend across
head/shoulder/waist/knee instead of moving the connected body as a rigid card.
"""
from __future__ import annotations

import json
from pathlib import Path

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
    return {
        'head': head,
        'armL': left_arm,
        'armR': right_arm,
        'legL': left_leg,
        'legR': right_leg,
        'hip': hip,
        'torso': torso,
    }


# The body atlas rectangle is the full untrimmed 877x1496 image at x82,y12.
# The attachment's original region starts at this exact rectangle, so a rest
# mesh with these coordinates renders pixel-identically to the old region.
x0, y0, width, height = 82, 12, 877, 1496
cols, rows = 18, 30
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
        bx, by = world_bone(name)
        vertices.extend((bone_index[name], round(wx - bx, 4), round(wy - by, 4), round(value / total, 6)))

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
