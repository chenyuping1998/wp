"""Skin the volcanic explorer portrait to Boom's existing 25-bone Spine rig.

The high-resolution generated painting remains in design/source.  This script
also writes an editable PSD with separated reference parts and a display master.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/source/banalava_mascot_v2_boom.png'
OUT = ROOT / 'static/assets/spines/goBananasMonkey'
IMAGE = OUT / 'lava_body.png'
ATLAS = OUT / 'monkey.atlas'
SKELETON = OUT / 'monkey.json'
W, H = 560, 884

portrait = Image.open(SOURCE).convert('RGBA')
body = portrait.resize((W, H), Image.Resampling.LANCZOS)
body.save(IMAGE)

# Reuse Boom's reserved prop atlas rectangle so the throw slot displays a
# lava probe while keeping all existing attachment timing intact.
prop_source = ROOT / 'static/assets/sprites/goBanalavaSymbols/b.png'
if prop_source.exists():
    prop = Image.open(prop_source).convert('RGBA')
    prop.thumbnail((672, 618), Image.Resampling.LANCZOS)
    prop_region = Image.new('RGBA', (672, 618))
    prop_region.alpha_composite(prop, ((672 - prop.width) // 2, (618 - prop.height) // 2))
    atlas_page = Image.open(OUT / 'monkey.png').convert('RGBA')
    atlas_page.paste(prop_region, (2, 2))
    atlas_page.save(OUT / 'monkey.png')

# Keep an exact composite plus independently editable part references.  The
# source painting is seamless; showing all cuts at once would double pixels at
# overlapping shoulder and waist regions, so part layers start hidden.
psd = PSDImage.new('RGBA', (W, H), color=(0, 0, 0, 0))
parts = {
    'head': (0, 0, W, 284),
    'left arm': (0, 170, 245, 680),
    'right arm': (315, 170, W, 680),
    'torso and coat': (95, 215, 465, 670),
    'left leg': (58, 505, 295, H),
    'right leg': (275, 505, 535, H),
}
for name, box in parts.items():
    cut = Image.new('RGBA', (W, H))
    cut.paste(body.crop(box), box)
    layer = PixelLayer.frompil(cut, psd, name=name)
    layer.visible = False
    psd.append(layer)
psd.append(PixelLayer.frompil(body, psd, name='Boom gorilla volcanic reskin - finished master'))
psd.save(ROOT / 'design/source/GoBanalava_explorer.psd')

atlas = ATLAS.read_text(encoding='utf-8')
atlas = re.sub(r'\nalchemy_body\.png\n.*?index:-1\n', '\n', atlas, flags=re.S)
if '\nlava_body.png\n' not in atlas:
    atlas += f'\nlava_body.png\nsize:{W},{H}\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\nlava_body\nbounds:0,0,{W},{H}\noffsets:0,0,{W},{H}\nindex:-1\n'
ATLAS.write_text(atlas, encoding='utf-8')

rig = json.loads(SKELETON.read_text(encoding='utf-8'))
bones = rig['bones']
bone_idx = {bone['name']: i for i, bone in enumerate(bones)}

def world_bone(name: str) -> tuple[float, float]:
    bone = bones[bone_idx[name]]
    if 'parent' not in bone:
        return bone.get('x', 0), bone.get('y', 0)
    px, py = world_bone(bone['parent'])
    return px + bone.get('x', 0), py + bone.get('y', 0)

def smooth(value: float) -> float:
    t = min(1.0, max(0.0, value))
    return t * t * (3 - 2 * t)

def weights(x: float, y: float) -> dict[str, float]:
    head = 0.78 * (1 - smooth((y - 210) / 150))
    arms_y = smooth((y - 155) / 100) * (1 - smooth((y - 560) / 140))
    left = 0.35 * arms_y * smooth((215 - x) / 120)
    right = 0.35 * arms_y * smooth((x - 345) / 120)
    legs_y = smooth((y - 490) / 170)
    leg_left = 0.77 * legs_y * smooth((280 - x) / 110)
    leg_right = 0.77 * legs_y * smooth((x - 280) / 110)
    used = head + left + right + leg_left + leg_right
    remaining = max(0.0, 1 - used)
    hip = remaining * smooth((y - 400) / 165)
    return {'head': head, 'armL': left, 'armR': right,
            'legL': leg_left, 'legR': leg_right,
            'hip': hip, 'torso': remaining - hip}

cols, rows = 14, 24
ring = ([(c, 0) for c in range(cols)] +
        [(cols, r) for r in range(rows)] +
        [(c, rows) for c in range(cols, 0, -1)] +
        [(0, r) for r in range(rows, 0, -1)])
inside = [(c, r) for r in range(1, rows) for c in range(1, cols)]
order = ring + inside
index = {point: i for i, point in enumerate(order)}
uvs, vertices, triangles = [], [], []
for col, row in order:
    x, y = W * col / cols, H * row / rows
    # Existing Boom skeleton's root is y=884 on a 560x912 source canvas.
    wx, wy = x - W / 2, H - y
    uvs.extend((round(col / cols, 6), round(row / rows, 6)))
    parts = [(name, value) for name, value in weights(x, y).items() if value > .0001]
    total = sum(value for _, value in parts)
    vertices.append(len(parts))
    for name, value in parts:
        bx, by = world_bone(name)
        vertices.extend((bone_idx[name], round(wx - bx, 4), round(wy - by, 4), round(value / total, 6)))
for row in range(rows):
    for col in range(cols):
        a, b = index[col, row], index[col + 1, row]
        d, e = index[col, row + 1], index[col + 1, row + 1]
        triangles.extend((a, b, e, a, e, d))

for slot in rig['slots']:
    if slot['name'] != 'dynamite':
        slot.pop('attachment', None)
rig['slots'] = [slot for slot in rig['slots'] if slot['name'] not in {'alchemy_body', 'lava_body'}]
rig['skins'][0]['attachments'].pop('alchemy_body', None)
prop_slot = next((i for i, slot in enumerate(rig['slots']) if slot['name'] == 'dynamite'), len(rig['slots']))
rig['slots'].insert(prop_slot, {'name': 'lava_body', 'bone': 'root', 'attachment': 'lava_body'})
rig['skins'][0]['attachments']['lava_body'] = {
    'lava_body': {'type': 'mesh', 'uvs': uvs, 'triangles': triangles,
                     'vertices': vertices, 'hull': len(ring), 'width': W, 'height': H}
}
SKELETON.write_text(json.dumps(rig, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'Built volcanic explorer PSD and weighted Spine mesh: {len(order)} vertices, {len(triangles)//3} triangles.')
