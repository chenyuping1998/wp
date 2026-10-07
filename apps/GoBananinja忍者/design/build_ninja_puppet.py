"""Pack the chosen ninja design's connected body and cut parts into Spine.

Inputs are the transparent body and arm/prop extractions.  Both generated
images use the one approved standing character; the slash pose painting is
never used.  Run this after updating either cutout.
"""
from __future__ import annotations

import json
import runpy
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/source/ninja_delivery/mascot/ninja_parts_cutout_v1.png'
BODY = ROOT / 'design/source/ninja_delivery/mascot/ninja_body_upperarms_cutout_v1.png'
DEST = ROOT / 'static/assets/spines/goBananinjaMascot'
DEST.mkdir(parents=True, exist_ok=True)

source = Image.open(SOURCE).convert('RGBA')
body_source = Image.open(BODY).convert('RGBA')

# The body is continuous from head to feet, including shoulders and upper
# arms.  Only the lower forearms move, so the shoulder/waist seams cannot open.
regions = {
    'body': (82, 12, 959, 1508),
    'armL_fore': (22, 595, 272, 912),
    'armR_fore': (755, 585, 1003, 909),
    'katana': (781, 895, 878, 1517),
    'sheath': (909, 971, 996, 1467),
}
parts: dict[str, Image.Image] = {}
for name, box in regions.items():
    part = (body_source if name == 'body' else source).crop(box)
    alpha = np.array(part.getchannel('A'))
    # RemBG leaves a very low-opacity colored halo.  Remove that haze before
    # packing while keeping the antialiased character silhouette.
    alpha[alpha < 32] = 0
    if name == 'armL_fore':
        alpha[:6] = 0
    if name == 'armR_fore':
        alpha[:6] = 0
    part.putalpha(Image.fromarray(alpha))
    parts[name] = part

# Shelf pack into one texture page.  The atlas keeps original width and height
# in each region so attachment positions can be derived from the source sheet.
atlas_width = 1024
cursor_x = 2
cursor_y = 2
row_height = 0
positions = {}
for name, part in parts.items():
    if cursor_x + part.width + 2 > atlas_width:
        cursor_x = 2
        cursor_y += row_height + 4
        row_height = 0
    positions[name] = (cursor_x, cursor_y)
    cursor_x += part.width + 4
    row_height = max(row_height, part.height)
atlas_height = cursor_y + row_height + 2
atlas_image = Image.new('RGBA', (atlas_width, atlas_height))
for name, part in parts.items():
    atlas_image.alpha_composite(part, positions[name])
atlas_image.save(DEST / 'ninja.png')

atlas = [
    'ninja.png', f'size:{atlas_width},{atlas_height}', 'format:RGBA8888',
    'filter:Linear,Linear', 'repeat:none',
]
for name, part in parts.items():
    x, y = positions[name]
    atlas += [name, f'bounds:{x},{y},{part.width},{part.height}',
              f'offsets:0,0,{part.width},{part.height}', 'index:-1']
# Two views of the SAME sword pixels.  Atlas aliases reveal the hilt and then
# half the blade without baking new raster art or stretching the grip.
sword_x, sword_y = positions['katana']
for alias, visible_height in [('katana_grip', 170), ('katana_half', 365)]:
    atlas += [alias, f'bounds:{sword_x},{sword_y},97,{visible_height}',
              f'offsets:0,0,97,{visible_height}', 'index:-1']
(DEST / 'ninja.atlas').write_text('\n'.join(atlas).rstrip() + '\n', encoding='utf-8')

# Y coordinates below use the standing picture's feet as origin.  Bone names
# and parentage follow the Delta monkey hierarchy so its interaction roles
# remain familiar, while all visible attachments come from this one design.
bones = [
    {'name': 'root'},
    {'name': 'hip', 'parent': 'root', 'y': 595},
    {'name': 'torso', 'parent': 'hip', 'y': 265},
    {'name': 'head', 'parent': 'torso', 'x': 8, 'y': 266},
    {'name': 'armL', 'parent': 'torso', 'x': -267, 'y': 280},
    {'name': 'armL_fore', 'parent': 'armL', 'x': -20, 'y': -218},
    {'name': 'armL_hand', 'parent': 'armL_fore', 'x': -5, 'y': -197},
    {'name': 'prop', 'parent': 'armL_hand'},
    {'name': 'armR', 'parent': 'torso', 'x': 260, 'y': 280},
    {'name': 'armR_fore', 'parent': 'armR', 'x': 36, 'y': -218},
    {'name': 'armR_hand', 'parent': 'armR_fore', 'x': 17, 'y': -202},
    {'name': 'legL', 'parent': 'hip', 'x': -180, 'y': -25},
    {'name': 'legR', 'parent': 'hip', 'x': 180, 'y': -25},
    {'name': 'sheathBone', 'parent': 'hip', 'x': -117, 'y': 235, 'rotation': -30},
]

slot_bones = [
    ('sheath', 'sheathBone', 'sheath'),
    ('body', 'torso', 'body'),
    # The hilt must sit IN FRONT of the waist cloth, while the scabbard passes
    # behind it.  The moving forearm then covers the grip when it takes hold.
    ('grip', 'sheathBone', 'katana_grip'),
    ('armR_fore', 'armR_fore', 'armR_fore'),
    ('armL_fore', 'armL_fore', 'armL_fore'),
    ('katana', 'prop', None),
]
slots = []
for name, bone, attachment in slot_bones:
    slot = {'name': name, 'bone': bone}
    if attachment:
        slot['attachment'] = attachment
    slots.append(slot)

# World location of each bone in setup pose, expressed as sheet pixels.
bone_pixel = {
    'hip': (512, 915), 'torso': (512, 650), 'head': (520, 384),
    'armL': (150, 370), 'armL_fore': (130, 588),
    'armR': (867, 370), 'armR_fore': (903, 588),
}
attachments = {}
for name, bone, _ in slot_bones:
    if name == 'katana':
        # All three views share the same top edge (y=170). At pickup the prop
        # bone is aligned with the scabbard mouth and rotated to the same -30°.
        attachments[name] = {
            'katana_grip': {'x': 0, 'y': 85, 'width': 97, 'height': 170},
            'katana_half': {'x': 0, 'y': -12.5, 'width': 97, 'height': 365},
            'katana': {'x': 0, 'y': -141, 'width': 97, 'height': 622},
        }
    elif name == 'grip':
        # Bottom of the hilt meets the mouth of the sheath at bone origin.
        attachments[name] = {'katana_grip': {'x': 0, 'y': 85, 'width': 97, 'height': 170}}
    elif name == 'sheath':
        # Mouth sits at the waist; -30 degrees points the empty sheath left.
        attachments[name] = {'sheath': {'x': 0, 'y': -248, 'width': 87, 'height': 496}}
    else:
        x0, y0, x1, y1 = regions[name]
        mid_x, mid_y = (x0 + x1) / 2, (y0 + y1) / 2
        pivot_x, pivot_y = bone_pixel[bone]
        attachments[name] = {name: {
            'x': mid_x - pivot_x, 'y': pivot_y - mid_y,
            'width': x1 - x0, 'height': y1 - y0,
        }}

def smooth(frames, fields, loop=False):
    """Cubic tangents through neighbouring poses, with no overshoot at turns.

    Anubis uses the same approach. Easing every segment to a stop made the
    draw look like separate poses instead of one hand action.
    """
    if len(frames) < 2:
        return frames
    t = [f['time'] for f in frames]
    for field in fields:
        values = [f[field] for f in frames]
        slopes = [(values[i+1]-values[i])/(t[i+1]-t[i]) for i in range(len(t)-1)]
        tangent = [slopes[0]] + [(slopes[i-1]+slopes[i])/2 for i in range(1,len(slopes))] + [slopes[-1]]
        if loop and values[0] == values[-1]:
            wrap = (values[0]-values[-2])/(t[-1]-t[-2])
            tangent[0] = tangent[-1] = (wrap+slopes[0])/2
        for i, slope in enumerate(slopes):
            if slope == 0:
                tangent[i] = tangent[i+1] = 0
                continue
            a, b = tangent[i]/slope, tangent[i+1]/slope
            if a < 0: tangent[i] = 0
            if b < 0: tangent[i+1] = 0
            magnitude = (a*a+b*b)**.5
            if magnitude > 3:
                tangent[i] *= 3/magnitude
                tangent[i+1] *= 3/magnitude
        for i in range(len(frames)-1):
            duration = (t[i+1]-t[i])/3
            frames[i].setdefault('curve', []).extend([
                round(t[i]+duration, 4), round(values[i]+tangent[i]*duration, 4),
                round(t[i+1]-duration, 4), round(values[i+1]-tangent[i+1]*duration, 4),
            ])
    return frames

def rotation(points, loop=False):
    return smooth([{'time': t, 'value': value} for t, value in points], ['value'], loop)

def move(points, loop=False):
    return smooth([{'time': t, 'x': x, 'y': y} for t, x, y in points], ['x','y'], loop)

def scale(points, loop=False):
    return smooth([{'time': t, 'x': x, 'y': y} for t, x, y in points], ['x','y'], loop)

def attachment(points):
    return [{'time': t, 'name': value} for t, value in points]

# Anubis's breathing rhythm, scaled down for this one-piece body. It cannot
# carry a broad torso sway without dragging its waist and boots with it.
# Two unequal breaths in 5.4s; all tracks close exactly at the loop point.
idle = {'bones': {
    'torso': {'scale': scale([(0,1,1),(1.35,.998,1.007),(2.7,1,1),(4.05,.999,1.005),(5.4,1,1)], True)},
    'hip': {'translate': move([(0,0,0),(1.35,1,-1),(2.7,2,-2),(4.05,1,-1),(5.4,0,0)], True)},
    'armL_fore': {'rotate': rotation([(0,0),(1.55,.6),(2.7,0),(4.2,-.3),(5.4,0)], True)},
    'armR_fore': {'rotate': rotation([(0,0),(1.7,-.5),(2.7,0),(4.3,.35),(5.4,0)], True)},
}}
slash = {
    'slots': {
        # Hand reaches the mouth at .14, grips at .17, and only then withdraws.
        # The return holds the hand at the mouth until the grip is back in place.
        'grip': {'attachment': attachment([(0, 'katana_grip'), (.17, None), (.84, 'katana_grip')])},
        'katana': {'attachment': attachment([(0, None), (.17, 'katana_grip'), (.225, 'katana_half'), (.28, 'katana'), (.68, 'katana_half'), (.77, 'katana_grip'), (.84, None)])},
    },
    'bones': {
        'hip': {'translate': move([(0, 0, 0), (.32, -6, 0), (.55, -2, 0), (1.04, 0, 0)])},
        'torso': {'rotate': rotation([(0, 0), (.28, 1), (.32, -2), (1.04, 0)])},
        'armL_fore': {'rotate': rotation([(0, 0), (.08, 35), (.14, 63), (.18, 63), (.26, 44), (.32, 67), (.55, 55), (.72, 63), (.84, 63), (1.04, 0)])},
        'prop': {
            # With the hand at 63 degrees, -93 puts the blade at the sheath's
            # -30 degrees. Only a 4px local offset is needed for exact contact.
            'rotate': rotation([(0, -15), (.14, -93), (.18, -93), (.26, -74), (.32, -177), (.55, -165), (.72, -93), (.84, -93), (1.04, -15)]),
            'translate': move([(0, 0, 0), (.14, 0, 4), (.84, 0, 4), (1.04, 0, 0)]),
        },
        'armR_fore': {'rotate': rotation([(0, 0), (.25, -5), (.32, 10), (1.04, 0)])},
    },
}
scatter = {
    'slots': {
        'grip': {'attachment': attachment([(0, 'katana_grip'), (.3, None), (1.56, 'katana_grip')])},
        'katana': {'attachment': attachment([(0, None), (.3, 'katana_grip'), (.38, 'katana_half'), (.48, 'katana'), (1.36, 'katana_half'), (1.47, 'katana_grip'), (1.56, None)])},
    },
    'bones': {
        'hip': {'translate': move([(0, 0, 0), (.56, -6, 0), (.78, 3, 0), (1.02, -6, 0), (1.78, 0, 0)])},
        'torso': {'rotate': rotation([(0, 0), (.5, 2), (.56, -3), (.78, 3), (1.02, -3), (1.78, 0)])},
        'armL_fore': {'rotate': rotation([(0, 0), (.14, 32), (.24, 63), (.31, 63), (.48, 44), (.56, 72), (.78, 28), (1.02, 66), (1.24, 46), (1.38, 63), (1.57, 63), (1.78, 0)])},
        'prop': {
            'rotate': rotation([(0, -15), (.24, -93), (.31, -93), (.48, -74), (.56, -178), (.78, 16), (1.02, 68), (1.24, -76), (1.38, -93), (1.57, -93), (1.78, -15)]),
            'translate': move([(0, 0, 0), (.24, 0, 4), (1.57, 0, 4), (1.78, 0, 0)]),
        },
        'armR_fore': {'rotate': rotation([(0, 0), (.4, -7), (.56, 12), (.78, -9), (1.02, 12), (1.78, 0)])},
    },
}
# Anubis's load → leap → landing → small second hop, within this body's
# stricter deformation budget. The victory pose resolves back to neutral.
cheer = {'bones': {
    'hip': {'translate': move([(0,0,0),(.18,0,-10),(.42,0,30),(.66,0,0),(.78,0,-5),(1.03,0,13),(1.28,0,0),(2.05,0,0)])},
    'torso': {
        'scale': scale([(0,1,1),(.18,1.012,.982),(.42,.991,1.018),(.66,1.005,.995),(1.03,.996,1.008),(1.28,1,1),(2.05,1,1)]),
        'rotate': rotation([(0,0),(.18,2),(.42,-3),(.9,2),(1.28,0),(2.05,0)]),
    },
    'armL_fore': {'rotate': rotation([(0,0),(.16,14),(.42,-55),(.66,-48),(1.02,-62),(1.34,-38),(2.05,0)])},
    'armR_fore': {'rotate': rotation([(0,0),(.16,-14),(.42,55),(.66,48),(1.02,62),(1.34,38),(2.05,0)])},
}}
# Low-amplitude celebration under a long big-win count-up; unlike the cheer it
# can loop without carrying a jump pose indefinitely.
dance = {'bones': {
    'hip': {'translate': move([(0,0,0),(.6,0,7),(1.2,0,0),(1.8,0,5),(2.4,0,0)], True)},
    'torso': {'scale': scale([(0,1,1),(.6,.998,1.008),(1.2,1,1),(1.8,.998,1.006),(2.4,1,1)], True)},
    'armL_fore': {'rotate': rotation([(0,0),(.6,-24),(1.2,-6),(1.8,-18),(2.4,0)], True)},
    'armR_fore': {'rotate': rotation([(0,0),(.6,18),(1.2,4),(1.8,26),(2.4,0)], True)},
}}
nod = {'bones': {
    'torso': {'scale': scale([(0,1,1),(.3,1.002,1.007),(.6,1,1),(1,1,1)])},
    'armL_fore': {'rotate': rotation([(0,0),(.3,2),(.6,0),(1,0)])},
}}
throwit = {'bones': {
    'armL_fore': {'rotate': rotation([(0, 0), (.3, 40), (.55, -40), (1.2, 0)])},
    'torso': {'rotate': rotation([(0, 0), (.3, 3), (.55, -4), (1.2, 0)])},
}}

rig = {
    'skeleton': {'hash': 'gb-ninja-puppet-v1', 'spine': '4.1.20', 'x': -512, 'y': 0,
                 'width': 1024, 'height': 1510, 'images': './'},
    'bones': bones,
    'slots': slots,
    'skins': [{'name': 'default', 'attachments': attachments}],
    'animations': {'idle': idle, 'slash': slash, 'scatter_slash': scatter,
                   'cheer': cheer, 'dance': dance, 'nod': nod, 'throwit': throwit},
}
(DEST / 'ninja.json').write_text(json.dumps(rig, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
runpy.run_path(str(ROOT / 'design/add_ninja_body_mesh.py'))
print('Wrote', DEST / 'ninja.json', 'and', DEST / 'ninja.png')
