"""Add a katana draw/slash prototype to the existing Delta monkey Spine rig.

Uses the old articulated body; only the prop art and timelines are new. Running
again updates the same regions/animation without growing the atlas twice.
"""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SPINE = ROOT / 'static/assets/spines/goBananasMonkey'
JSON = SPINE / 'monkey.json'
ATLAS = SPINE / 'monkey.atlas'
PNG = SPINE / 'monkey.png'
REGION_START = '\nkatana\nbounds:'


def prop_art(kind: str) -> Image.Image:
    w, h = (360, 52) if kind == 'katana' else (300, 52)
    scale = 3
    im = Image.new('RGBA', (w * scale, h * scale))
    draw = ImageDraw.Draw(im)

    def polygon(points, color):
        draw.polygon([(x * scale, y * scale) for x, y in points], fill=color)

    def line(points, color, width):
        draw.line([(x * scale, y * scale) for x, y in points], fill=color,
                  width=width * scale, joint='curve')

    if kind == 'katana':
        # Tip to the left, handle to the right; the hilt sits in the palm bone.
        polygon([(5, 27), (39, 14), (276, 17), (278, 27), (40, 32)], '#aab9cb')
        polygon([(5, 27), (40, 16), (275, 19), (274, 22), (40, 24)], '#f2f6f7')
        line([(38, 30), (266, 27)], '#647f9c', 2)
        polygon([(273, 12), (289, 12), (294, 20), (289, 36), (273, 36), (268, 25)], '#412612')
        polygon([(275, 15), (286, 15), (291, 24), (286, 33), (275, 33), (271, 24)], '#d8aa49')
        polygon([(288, 19), (354, 18), (356, 32), (288, 32)], '#141923')
        for x in range(296, 350, 12):
            line([(x, 19), (x + 10, 31)], '#ac2933', 3)
            line([(x + 10, 19), (x, 31)], '#ac2933', 2)
        polygon([(352, 16), (359, 18), (359, 33), (352, 35)], '#b99044')
    else:
        # Full and empty sheath share a mouth, so the swap does not jump.
        polygon([(4, 25), (23, 16), (233, 17), (241, 24), (232, 33), (22, 34)], '#111720')
        line([(19, 19), (228, 21)], '#33445e', 5)
        line([(19, 31), (229, 30)], '#0b1019', 4)
        polygon([(4, 24), (15, 18), (23, 20), (24, 31), (13, 34)], '#c39b51')
        polygon([(227, 14), (241, 15), (245, 33), (230, 35)], '#caa04d')
        for x in (75, 169):
            line([(x, 18), (x + 3, 32)], '#a42432', 5)
        if kind == 'sheath_full':
            polygon([(243, 19), (291, 18), (294, 31), (243, 31)], '#171923')
            for x in range(248, 286, 11):
                line([(x, 19), (x + 10, 30)], '#ad2935', 3)
            polygon([(291, 16), (299, 18), (299, 33), (291, 35)], '#c49b49')

    return im.resize((w, h), Image.Resampling.LANCZOS)


data = json.loads(JSON.read_text(encoding='utf-8'))
atlas = ATLAS.read_text(encoding='utf-8')
page = Image.open(PNG).convert('RGBA')
old_height = page.height

if REGION_START in atlas:
    atlas = atlas.split(REGION_START)[0].rstrip() + '\n'
    # Remove the old prototype's separator/comment if present.
    atlas = atlas.split('\n# GoBananinja katana regions')[0].rstrip() + '\n'
    # Our appended strip always starts at the original Delta page boundary.
    old_height = 3153
    page = page.crop((0, 0, page.width, old_height))

items = [('katana', prop_art('katana')),
         ('sheath_full', prop_art('sheath_full')),
         ('sheath_empty', prop_art('sheath_empty'))]
positions = {}
y = old_height + 4
for name, art in items:
    positions[name] = (2, y, art.width, art.height)
    y += art.height + 4
new_page = Image.new('RGBA', (page.width, y + 2))
new_page.alpha_composite(page)
for name, art in items:
    new_page.alpha_composite(art, positions[name][:2])
new_page.save(PNG)

lines = atlas.splitlines()
lines[1] = f'size:{new_page.width},{new_page.height}'
atlas = '\n'.join(lines).rstrip() + '\n'
for name, (_, y, w, h) in positions.items():
    atlas += f'{name}\nbounds:2,{y},{w},{h}\noffsets:0,0,{w},{h}\nindex:-1\n'
ATLAS.write_text(atlas, encoding='utf-8')

# The setup drawing stays sheathed for every pre-existing animation.
bones = data['bones']
if not any(b['name'] == 'sheathBone' for b in bones):
    bones.append({'name': 'sheathBone', 'parent': 'hip', 'x': -78, 'y': -27,
                  'rotation': 22})
slots = data['slots']
for name, bone, attachment in (
    ('sheath', 'sheathBone', 'sheath_full'),
    ('katana', 'prop', None),
    ('left_hand_front', 'armL_hand', None),
):
    if not any(s['name'] == name for s in slots):
        slot = {'name': name, 'bone': bone}
        if attachment:
            slot['attachment'] = attachment
        slots.append(slot)
skin = data['skins'][0]['attachments']
skin['sheath'] = {
    'sheath_full': {'x': -150, 'y': 0, 'width': 300, 'height': 52},
    'sheath_empty': {'x': -150, 'y': 0, 'width': 300, 'height': 52},
}
skin['katana'] = {'katana': {'x': -180, 'y': 0, 'width': 360, 'height': 52}}
skin['left_hand_front'] = {'left_hand_front': {
    **skin['left_arm_2_hand']['left_arm_2_hand'], 'path': 'left_arm_2_hand'}}

def rot(points):
    return [{'time': t, 'value': v} for t, v in points]

def trans(points):
    return [{'time': t, 'x': x, 'y': y} for t, x, y in points]

def att(points):
    return [{'time': t, 'name': name} for t, name in points]

# Hit at 0.32 s: ReelSplits changes the symbols after 0.15+0.17 s.
# The arm winds toward the waist, unsheathes, cuts left, then returns to rest.
data['animations']['slash'] = {
    'slots': {
        'sheath': {'attachment': att([(0, 'sheath_full'), (.16, 'sheath_empty'),
                                      (.72, 'sheath_full')])},
        'katana': {'attachment': att([(0, None), (.16, 'katana'), (.72, None)])},
        'left_arm_2_hand': {'attachment': att([(0, 'left_arm_2_hand'),
                                               (.16, None), (.72, 'left_arm_2_hand')])},
        'left_hand_front': {'attachment': att([(0, None), (.16, 'left_hand_front'),
                                               (.72, None)])},
    },
    'bones': {
        'hip': {'translate': trans([(0, 0, 0), (.2, 0, -5), (.32, -8, 0),
                                    (.46, -7, 0), (.8, 0, 0)])},
        'torso': {'rotate': rot([(0, 0), (.13, 7), (.23, 12), (.32, -20),
                                (.46, -15), (.67, 5), (.8, 0)])},
        'head': {'rotate': rot([(0, 0), (.23, -5), (.32, 5), (.8, 0)])},
        'armL': {'rotate': rot([(0, 0), (.13, 15), (.21, 18), (.27, 9),
                               (.32, -47), (.42, -43), (.57, -20),
                               (.7, 16), (.8, 0)])},
        'armL_hand': {'rotate': rot([(0, 0), (.16, 14), (.24, 17),
                                    (.32, -8), (.5, -17), (.7, 14), (.8, 0)])},
        'prop': {
            'scale': [{'time': t, 'x': x, 'y': 1} for t, x in
                      [(0, .04), (.16, .04), (.25, .52), (.31, 1),
                       (.64, 1), (.72, .04), (.8, .04)]],
            'translate': trans([(0, 0, 0), (.16, 45, 5), (.25, 25, 5),
                                (.31, 0, 0), (.65, 0, 0), (.72, 45, 5),
                                (.8, 0, 0)]),
        },
        'armR': {'rotate': rot([(0, 0), (.22, -14), (.36, 20), (.62, 10), (.8, 0)])},
        'armR_fore': {'rotate': rot([(0, 0), (.24, -12), (.38, 12), (.8, 0)])},
        'legL': {'rotate': rot([(0, 0), (.23, 5), (.4, -7), (.8, 0)])},
        'legR': {'rotate': rot([(0, 0), (.23, -4), (.4, 7), (.8, 0)])},
    },
}
# Four-or-more Scatter trigger: a theatrical two-stroke flourish. It uses the
# same bones/prop, but has a longer wind-up and a second reverse cut, rather
# than repeating the ordinary M-cut clip.
data['animations']['scatter_slash'] = {
    'slots': {
        'sheath': {'attachment': att([(0, 'sheath_full'), (.22, 'sheath_empty'),
                                      (1.28, 'sheath_full')])},
        'katana': {'attachment': att([(0, None), (.22, 'katana'), (1.28, None)])},
        'left_arm_2_hand': {'attachment': att([(0, 'left_arm_2_hand'),
                                               (.22, None), (1.28, 'left_arm_2_hand')])},
        'left_hand_front': {'attachment': att([(0, None), (.22, 'left_hand_front'),
                                               (1.28, None)])},
    },
    'bones': {
        'hip': {'translate': trans([(0, 0, 0), (.34, 0, -7), (.56, -12, 1),
                                    (.8, 5, -5), (1.02, -10, 0), (1.5, 0, 0)])},
        'torso': {'rotate': rot([(0, 0), (.34, 18), (.56, -25), (.77, 16),
                                (1.02, -18), (1.25, 7), (1.5, 0)])},
        'head': {'rotate': rot([(0, 0), (.34, -7), (.56, 7), (.77, -4),
                               (1.02, 5), (1.5, 0)])},
        'armL': {'rotate': rot([(0, 0), (.18, 16), (.34, 28), (.46, 11),
                               (.56, -57), (.7, -43), (.83, 21),
                               (1.02, -44), (1.16, -30), (1.28, 16),
                               (1.5, 0)])},
        'armL_hand': {'rotate': rot([(0, 0), (.22, 14), (.34, 34),
                                    (.56, -13), (.79, 35), (1.02, -18),
                                    (1.27, 13), (1.5, 0)])},
        'prop': {
            'scale': [{'time': t, 'x': x, 'y': 1} for t, x in
                      [(0, .04), (.22, .04), (.35, .7), (.44, 1),
                       (1.18, 1), (1.28, .04), (1.5, .04)]],
            'translate': trans([(0, 0, 0), (.22, 45, 5), (.35, 18, 5),
                                (.44, 0, 0), (1.2, 0, 0), (1.28, 45, 5),
                                (1.5, 0, 0)]),
        },
        'armR': {'rotate': rot([(0, 0), (.35, -28), (.56, 28),
                               (.8, -20), (1.02, 24), (1.5, 0)])},
        'armR_fore': {'rotate': rot([(0, 0), (.35, -15), (.56, 18),
                                    (.8, -12), (1.02, 15), (1.5, 0)])},
        'legL': {'rotate': rot([(0, 0), (.34, 7), (.56, -10),
                               (.83, 6), (1.02, -8), (1.5, 0)])},
        'legR': {'rotate': rot([(0, 0), (.34, -6), (.56, 9),
                               (.83, -5), (1.02, 7), (1.5, 0)])},
    },
}
JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Added 0.8s M slash and 1.5s Scatter flourish to', JSON)
