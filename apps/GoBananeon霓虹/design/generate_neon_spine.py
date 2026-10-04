"""Build a Spine 4.1 weighted mesh rig from the approved neon DJ illustration."""
from __future__ import annotations

import json
import math
import shutil
from pathlib import Path
from PIL import Image

APP = Path(__file__).resolve().parent.parent
SOURCE = APP / 'design/source/neon_delivery/mascot/mascot_full.png'
OUT = APP / 'static/assets/spines/goBananasMonkey'
OUT.mkdir(parents=True, exist_ok=True)
shutil.copy2(SOURCE, OUT / 'monkey.png')
W, H = Image.open(SOURCE).size

# World positions in image pixels converted to Spine's feet-centred, y-up space.
points = {
    'root': (512, H), 'hip': (512, 1280), 'torso': (512, 875),
    'head': (525, 350), 'armL': (310, 790), 'handL': (170, 455),
    'armR': (720, 780), 'handR': (830, 1050),
    'legL': (400, 1280), 'legR': (620, 1280),
}
parents = {
    'hip': 'root', 'torso': 'hip', 'head': 'torso',
    'armL': 'torso', 'handL': 'armL', 'armR': 'torso', 'handR': 'armR',
    'legL': 'hip', 'legR': 'hip',
}
names = list(points)
bones = [{'name': 'root'}]
for name in names[1:]:
    px, py = points[parents[name]]
    x, y = points[name]
    bones.append({'name': name, 'parent': parents[name], 'x': x-px, 'y': py-y})

# Perimeter-first vertices are required by Spine's convex hull field.
COLS, ROWS = 16, 28
perimeter = [(c, 0) for c in range(COLS+1)]
perimeter += [(COLS, r) for r in range(1, ROWS+1)]
perimeter += [(c, ROWS) for c in range(COLS-1, -1, -1)]
perimeter += [(0, r) for r in range(ROWS-1, 0, -1)]
order = perimeter + [(c, r) for r in range(1, ROWS) for c in range(1, COLS)]
index = {p: i for i, p in enumerate(order)}
uvs, vertices, tris = [], [], []

def influences(x: float, y: float):
    # Soft regional masks keep the jacket, head, hands and legs attached to
    # anatomical controls while the one-piece art remains seam-free.
    regions = [
        ('hip', 512, 1130, 310, 350, 0.5),
        ('torso', 512, 790, 310, 430, 1.0),
        ('head', 525, 335, 250, 255, 1.3),
        ('armL', 300, 790, 205, 385, 0.9),
        ('handL', 150, 445, 155, 260, 0.8),
        ('armR', 725, 790, 205, 390, 0.9),
        ('handR', 845, 990, 170, 280, 0.8),
        ('legL', 390, 1390, 205, 320, 1.1),
        ('legR', 640, 1390, 205, 320, 1.1),
    ]
    scored = []
    for name, cx, cy, rx, ry, strength in regions:
        z = ((x-cx)/rx)**2 + ((y-cy)/ry)**2
        scored.append((strength * math.exp(-1.6*z), name))
    scored.sort(reverse=True)
    top = [(v, n) for v, n in scored if v > 0.0001]
    if not top:
        top = [(1, 'hip')]
    total = sum(v for v, _ in top)
    return [(n, round(v/total, 6)) for v, n in top]

for c, r in order:
    x, y = W*c/COLS, H*r/ROWS
    uvs.extend((round(x/W, 6), round(y/H, 6)))
    inf = influences(x, y)
    vertices.append(len(inf))
    for name, weight in inf:
        bx, by = points[name]
        vertices.extend((names.index(name), round(x-bx, 4), round(by-y, 4), weight))
for r in range(ROWS):
    for c in range(COLS):
        a, b = index[c, r], index[c+1, r]
        d, e = index[c, r+1], index[c+1, r+1]
        tris.extend((a, d, b, b, d, e))

mesh = {'type': 'mesh', 'uvs': uvs, 'triangles': tris, 'vertices': vertices,
        'hull': len(perimeter), 'width': W, 'height': H}

def rotate(*pairs):
    # A single painted mesh needs restrained joint angles to keep its triangles
    # facing forward across shoulder and elbow blends.
    return [{'time': t, 'value': round(angle * .38, 4)} for t, angle in pairs]

def translate(*pairs):
    return [{'time': t, 'x': x, 'y': y} for t, x, y in pairs]

def animation(channels):
    return {'bones': channels}

idle = animation({
    'torso': {'rotate': rotate((0, -1.2), (1.35, 1.2), (2.7, -1.2))},
    'head': {'rotate': rotate((0, 1.4), (1.35, -1.4), (2.7, 1.4))},
    'hip': {'translate': translate((0, 0, 0), (1.35, 0, 5), (2.7, 0, 0))},
})
animations = {'idle': idle}
animations['cheer'] = animation({
    'hip': {'translate': translate((0, 0, 0), (.22, 0, -20), (.50, 0, 52), (.78, 0, 0), (1.2, 0, 0))},
    'armL': {'rotate': rotate((0, 0), (.36, 9), (.72, -4), (1.2, 0))},
    'armR': {'rotate': rotate((0, 0), (.36, -9), (.72, 4), (1.2, 0))},
    'head': {'rotate': rotate((0, 0), (.43, -8), (.85, 3), (1.2, 0))},
})
chest = [(.0, 0), (.35, -4)]
for i in range(6):
    t = .48 + i*.30
    chest.extend(((round(t, 3), 4 if i % 2 == 0 else -4), (round(t+.13, 3), 0)))
chest.append((2.3, 0))
animations['chestbeat'] = animation({
    'torso': {'rotate': rotate(*chest)},
    'armL': {'rotate': rotate((0, 0), (.30, -6), (.48, 8), (.80, -3), (1.1, 8), (1.4, -3), (1.7, 8), (2.3, 0))},
    'armR': {'rotate': rotate((0, 0), (.30, 6), (.48, -8), (.80, 3), (1.1, -8), (1.4, 3), (1.7, -8), (2.3, 0))},
})
animations['throwit'] = animation({
    'torso': {'rotate': rotate((0, 0), (.24, -8), (.52, 7), (.86, 0), (1.18, 0))},
    'armL': {'rotate': rotate((0, 0), (.26, -13), (.58, 16), (.9, 0), (1.18, 0))},
    'handL': {'rotate': rotate((0, 0), (.32, -7), (.58, 18), (.9, 0), (1.18, 0))},
})
for name, amt in [('nod', -8), ('flinch', 9), ('alert', -6), ('glance', 7)]:
    animations[name] = animation({'head': {'rotate': rotate((0, 0), (.2, amt), (.44, amt*.7), (.7, 0))}})
animations['flutter'] = animation({'handR': {'rotate': rotate((0, -.6), (.4, .6), (.8, -.6))}})

spine = {
    'skeleton': {'hash': 'gb-neon-dj', 'spine': '4.1.20', 'x': -W/2, 'y': 0, 'width': W, 'height': H, 'images': './'},
    'bones': bones,
    'slots': [{'name': 'mascot', 'bone': 'root', 'attachment': 'mascot'}],
    'skins': [{'name': 'default', 'attachments': {'mascot': {'mascot': mesh}}}],
    'animations': animations,
}
(OUT / 'monkey.json').write_text(json.dumps(spine, separators=(',', ':')), encoding='utf-8')
(OUT / 'monkey.atlas').write_text(
    f'monkey.png\nsize:{W},{H}\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\nmascot\nbounds:0,0,{W},{H}\noffsets:0,0,{W},{H}\nindex:-1\n',
    encoding='utf-8')
print(f'Neon DJ Spine rig: {W}x{H}, {len(bones)} bones, {len(order)} vertices, {len(animations)} animations')
